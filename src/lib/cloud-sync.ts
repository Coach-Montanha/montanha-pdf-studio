import { MagazineProject } from "../types/magazine";
import { INITIAL_MAGAZINE_PROJECT } from "./sample-data";
import {
  syncProjectToGoogleDrive,
  fetchProjectFromGoogleDrive,
  getValidGoogleAccessToken,
} from "./google-drive-sync";
import { getSupabaseClient } from "../services/ecosystem-auth-service";
import { getCurrentUser } from "./auth-state";

const LOCAL_STORAGE_KEY = "montanha_magazine_project";
const LOCAL_STORAGE_TIMESTAMP_KEY = "montanha_last_saved_at";
const LOCAL_STORAGE_SYNC_CODE_KEY = "montanha_sync_code";

// Fallback direto na nuvem para garantir sincronização caso a rota do app esteja offline
const CLOUD_FALLBACK_ID = "ff808181a067127101a0798e229d2bfb";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_FALLBACK_ID}`;

export interface CloudSyncResult {
  success: boolean;
  syncedAt: string;
  code: string;
  mode: string;
  error?: string;
}

/**
 * Salva o projeto no cache local E envia para a nuvem de sincronização multi-dispositivo.
 */
export async function syncProjectToCloud(
  project: MagazineProject,
  customCode?: string
): Promise<CloudSyncResult> {
  const now = new Date().toISOString();
  const code = (customCode || localStorage.getItem(LOCAL_STORAGE_SYNC_CODE_KEY) || "MONTANHA").trim().toUpperCase();

  const projectWithTimestamp: MagazineProject = {
    ...project,
    updatedAt: now,
  };

  // 0. Sincronização em Nuvem via Supabase (banco de dados real do usuário)
  const supabase = getSupabaseClient();
  const activeUser = getCurrentUser();
  const userEmail = activeUser?.email || "albertosarly@gmail.com";

  if (supabase) {
    try {
      await supabase.from("ecosystem_magazine_projects").upsert(
        {
          user_email: userEmail,
          code,
          title: projectWithTimestamp.title,
          project_data: projectWithTimestamp,
          updated_at: now,
        },
        { onConflict: "user_email,code" }
      );
    } catch (sbErr) {
      console.warn("Aviso ao salvar no Supabase:", sbErr);
    }
  }

  // 1. Salvar no localStorage local (Local-First instantâneo)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectWithTimestamp));
      localStorage.setItem(LOCAL_STORAGE_TIMESTAMP_KEY, now);
      localStorage.setItem(LOCAL_STORAGE_SYNC_CODE_KEY, code);
    } catch (e) {
      console.warn("Aviso ao salvar no cache local:", e);
    }
  }

  // 2. Enviar para a rota do servidor /api/project
  let serverSuccess = false;
  try {
    const res = await fetch("/api/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        project: projectWithTimestamp,
      }),
    });

    if (res.ok) {
      serverSuccess = true;
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar via /api/project:", err);
  }

  // 3. Sincronização em Tempo Real com o Google Drive (se conectado)
  const gdToken = getValidGoogleAccessToken();
  if (gdToken) {
    try {
      const gdRes = await syncProjectToGoogleDrive(projectWithTimestamp);
      if (gdRes.success) {
        return {
          success: true,
          syncedAt: now,
          code,
          mode: "google-drive",
        };
      }
    } catch (gdErr) {
      console.warn("Aviso ao sincronizar com Google Drive:", gdErr);
    }
  }

  // 4. Backup direto na nuvem persistente (redundância para tráfego multi-borda)
  try {
    const cloudRes = await fetch(CLOUD_API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Montanha Magazine [${code}]`,
        data: {
          code,
          syncedAt: now,
          project: projectWithTimestamp,
        },
      }),
    });

    if (cloudRes.ok) {
      return {
        success: true,
        syncedAt: now,
        code,
        mode: serverSuccess ? "server-and-cloud" : "cloud-direct",
      };
    }
  } catch (cloudErr) {
    console.warn("Aviso ao sincronizar com nuvem direta:", cloudErr);
  }

  if (serverSuccess) {
    return {
      success: true,
      syncedAt: now,
      code,
      mode: "server-edge",
    };
  }

  return {
    success: true,
    syncedAt: now,
    code,
    mode: "local-only",
  };
}

/**
 * Busca ativamente a versão mais recente do projeto na nuvem pelo código
 */
export async function fetchProjectFromCloud(code?: string): Promise<{ project: MagazineProject; syncedAt: string; code: string } | null> {
  const targetCode = (code || (typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_SYNC_CODE_KEY) : null) || "MONTANHA").trim().toUpperCase();

  // 0. Tentar via Supabase Database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const activeUser = getCurrentUser();
      const userEmail = activeUser?.email;

      let query = supabase.from("ecosystem_magazine_projects").select("*").eq("code", targetCode);
      if (userEmail) {
        query = supabase.from("ecosystem_magazine_projects").select("*").eq("user_email", userEmail);
      }

      const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();

      if (!error && data?.project_data && Array.isArray(data.project_data.articles)) {
        const fullProj = normalizeProject(data.project_data);
        saveToLocalCache(fullProj, targetCode);
        return {
          project: fullProj,
          syncedAt: data.updated_at || new Date().toISOString(),
          code: targetCode,
        };
      }
    } catch (sbErr) {
      console.warn("Aviso ao buscar do Supabase:", sbErr);
    }
  }

  // 1. Tentar via servidor /api/project
  try {
    const res = await fetch(`/api/project?code=${encodeURIComponent(targetCode)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.project && Array.isArray(data.project.articles)) {
        const fullProj = normalizeProject(data.project);
        saveToLocalCache(fullProj, targetCode);
        return {
          project: fullProj,
          syncedAt: data.syncedAt || new Date().toISOString(),
          code: targetCode,
        };
      }
    }
  } catch (e) {
    console.warn("Aviso ao buscar de /api/project:", e);
  }

  // 2. Tentar via nuvem persistente direta
  try {
    const cloudRes = await fetch(CLOUD_API_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (cloudRes.ok) {
      const cloudObj = await cloudRes.json();
      const proj = cloudObj?.data?.project;
      if (proj && Array.isArray(proj.articles)) {
        const fullProj = normalizeProject(proj);
        saveToLocalCache(fullProj, targetCode);
        return {
          project: fullProj,
          syncedAt: cloudObj.data?.syncedAt || new Date().toISOString(),
          code: cloudObj.data?.code || targetCode,
        };
      }
    }
  } catch (err) {
    console.warn("Aviso ao buscar da nuvem direta:", err);
  }

  return null;
}

/**
 * Busca a versão mais recente do projeto (URL ?sync_code > URL ?sync_data > Supabase DB > Cache Local > Padrão)
 */
export async function loadLatestProject(): Promise<MagazineProject> {
  if (typeof window === "undefined") {
    return INITIAL_MAGAZINE_PROJECT;
  }

  // 1. Prioridade 1: Código de sincronização na URL (?sync_code=MONTANHA)
  try {
    const params = new URLSearchParams(window.location.search);
    const syncCode = params.get("sync_code");
    if (syncCode) {
      const cloudResult = await fetchProjectFromCloud(syncCode);
      if (cloudResult?.project) {
        // Limpar a URL para ficar elegante sem recarregar a página
        try {
          window.history.replaceState(null, "", window.location.pathname);
        } catch {}
        return cloudResult.project;
      }
    }
  } catch (err) {
    console.warn("Aviso ao carregar sync_code da URL:", err);
  }

  // 2. Prioridade 2: Dados legados embutidos na URL (?sync_data=...)
  const urlProject = loadProjectFromLegacyUrl();
  if (urlProject) {
    saveToLocalCache(urlProject, "MONTANHA");
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {}
    return urlProject;
  }

  // 3. Prioridade 3: Banco de Dados Supabase (sincronização do usuário logado)
  const supabase = getSupabaseClient();
  const activeUser = getCurrentUser();
  if (supabase && activeUser?.email) {
    try {
      const { data, error } = await supabase
        .from("ecosystem_magazine_projects")
        .select("*")
        .eq("user_email", activeUser.email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.project_data && Array.isArray(data.project_data.articles)) {
        const sbProj = normalizeProject(data.project_data);
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localTimestamp = 0;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            localTimestamp = new Date(parsed.updatedAt || 0).getTime();
          } catch {}
        }
        const sbTimestamp = new Date(data.updated_at || sbProj.updatedAt || 0).getTime();

        if (sbTimestamp >= localTimestamp) {
          saveToLocalCache(sbProj, data.code || "MONTANHA");
          return sbProj;
        }
      }
    } catch (sbErr) {
      console.warn("Aviso ao carregar do Supabase no boot:", sbErr);
    }
  }

  // 4. Prioridade 4: Sincronização em Nuvem com Google Drive (se conectado)
  const gdToken = getValidGoogleAccessToken();
  if (gdToken) {
    try {
      const gdRes = await fetchProjectFromGoogleDrive();
      if (gdRes?.project && Array.isArray(gdRes.project.articles)) {
        const gdProj = normalizeProject(gdRes.project);
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localTimestamp = 0;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            localTimestamp = new Date(parsed.updatedAt || 0).getTime();
          } catch {}
        }
        const gdTimestamp = new Date(gdProj.updatedAt || gdRes.syncedAt || 0).getTime();

        if (gdTimestamp >= localTimestamp) {
          saveToLocalCache(gdProj, "MONTANHA");
          return gdProj;
        }
      }
    } catch (gdErr) {
      console.warn("Aviso ao carregar do Google Drive no boot:", gdErr);
    }
  }

  // 4. Prioridade 4: Cache do localStorage deste dispositivo
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.title && Array.isArray(parsed.articles)) {
        return normalizeProject(parsed);
      }
    } catch (e) {
      console.error("Erro ao decodificar projeto do localStorage:", e);
    }
  }

  // 5. Fallback padrão
  return INITIAL_MAGAZINE_PROJECT;
}

/**
 * Exporta um arquivo .json completo de backup da revista para download
 */
export function exportProjectToFile(project: MagazineProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const editionName = project.title.toLowerCase().replace(/\s+/g, "-");
  a.href = url;
  a.download = `backup-${editionName}-edicao-${project.editionNumber || "01"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importa um arquivo .json de backup do computador ou celular
 */
export function importProjectFromFile(file: File): Promise<MagazineProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || !parsed.title || !Array.isArray(parsed.articles)) {
          throw new Error("Arquivo de backup inválido.");
        }
        resolve(normalizeProject(parsed));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsText(file);
  });
}

/**
 * Gera uma URL curta e limpa com código de sincronização (?sync_code=MONTANHA)
 * Essa URL tem apenas ~50 caracteres, garantindo que o QR Code nunca quebre
 * e possa ser lido instantaneamente por qualquer celular ou compartilhado via WhatsApp.
 */
export function generateShareUrl(code = "MONTANHA"): string {
  if (typeof window === "undefined") return "";
  try {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("sync_code", code.trim().toUpperCase());
    return url.toString();
  } catch (e) {
    return window.location.origin + "/?sync_code=" + encodeURIComponent(code);
  }
}

function normalizeProject(parsed: any): MagazineProject {
  return {
    ...INITIAL_MAGAZINE_PROJECT,
    ...parsed,
    pageVisibility: {
      ...INITIAL_MAGAZINE_PROJECT.pageVisibility,
      ...(parsed.pageVisibility || {}),
    },
  };
}

function saveToLocalCache(project: MagazineProject, code: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    localStorage.setItem(LOCAL_STORAGE_TIMESTAMP_KEY, new Date().toISOString());
    localStorage.setItem(LOCAL_STORAGE_SYNC_CODE_KEY, code);
  } catch {}
}

function loadProjectFromLegacyUrl(): MagazineProject | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const syncData = params.get("sync_data");
    if (!syncData || syncData.length > 500000) return null;

    const jsonStr = decodeURIComponent(atob(syncData));
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === "object" && typeof parsed.title === "string" && Array.isArray(parsed.articles)) {
      return normalizeProject(parsed);
    }
  } catch (e) {
    console.warn("Aviso ao carregar sync_data legado da URL:", e);
  }
  return null;
}
