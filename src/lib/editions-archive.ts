import { MagazineProject, Article } from "../types/magazine";
import { INITIAL_MAGAZINE_PROJECT } from "./sample-data";
import { calculateMagazineTotalPages, countWords } from "./magazine-utils";
import { getSupabaseClient } from "../services/ecosystem-auth-service";
import { getCurrentUser } from "./auth-state";

export interface ArchivedEdition {
  id: string;
  editionNumber: string;
  title: string;
  subtitle: string;
  date: string;
  themeId: string;
  coverImage?: string;
  mainHeadline: string;
  totalPages: number;
  totalArticles: number;
  totalWords: number;
  status: "approved" | "published" | "archived";
  notes?: string;
  approvedAt: string;
  projectSnapshot: MagazineProject;
}

const ARCHIVE_STORAGE_KEY = "montanha_magazine_editions_archive";

/**
 * Retorna uma edição modelo inicial para preencher o arquivo caso esteja vazio
 */
function createInitialSampleEdition(): ArchivedEdition {
  const proj = INITIAL_MAGAZINE_PROJECT;
  const totalPages = calculateMagazineTotalPages(proj);
  const totalWords = proj.articles.reduce((acc, a) => acc + countWords(a.content), 0);

  return {
    id: "ed-montanha-01-approved",
    editionNumber: proj.editionNumber || "01",
    title: proj.title || "Revista Montanha",
    subtitle: proj.subtitle || "Força, Biomecânica & Performance Sem Atalhos",
    date: proj.date || "Setembro 2026",
    themeId: proj.themeId,
    coverImage: proj.coverConfig.backgroundImage,
    mainHeadline: proj.coverConfig.mainHeadline,
    totalPages,
    totalArticles: proj.articles.length,
    totalWords,
    status: "approved",
    notes: "Edição de estreia aprovada para diagramação impressa e publicação digital.",
    approvedAt: new Date().toISOString(),
    projectSnapshot: JSON.parse(JSON.stringify(proj)),
  };
}

/**
 * Obtém todas as edições aprovadas e arquivadas
 */
export function getArchivedEditions(): ArchivedEdition[] {
  if (typeof window === "undefined") return [createInitialSampleEdition()];

  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    let list: ArchivedEdition[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
    if (list.length === 0) {
      list = [createInitialSampleEdition()];
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
    }

    // Busca assíncrona no Supabase para manter acervo sincronizado
    const supabase = getSupabaseClient();
    const activeUser = getCurrentUser();
    if (supabase && activeUser?.email) {
      supabase
        .from("ecosystem_archived_editions")
        .select("*")
        .eq("user_email", activeUser.email)
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const fetched = data.map((r: any) => r.edition_data as ArchivedEdition).filter(Boolean);
            if (fetched.length > 0) {
              const mergedMap = new Map<string, ArchivedEdition>();
              list.forEach((e) => mergedMap.set(e.id, e));
              fetched.forEach((e) => mergedMap.set(e.id, e));
              const mergedList = Array.from(mergedMap.values());
              if (mergedList.length !== list.length) {
                localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(mergedList));
                window.dispatchEvent(new CustomEvent("montanha-archive-changed"));
              }
            }
          }
        })
        .catch(() => {});
    }

    return list;
  } catch (err) {
    console.error("Erro ao ler arquivo de edições:", err);
    return [createInitialSampleEdition()];
  }
}

/**
 * Salva a lista de edições arquivadas
 */
function saveArchivedList(list: ArchivedEdition[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("montanha-archive-changed"));
  } catch (err) {
    console.error("Erro ao salvar arquivo de edições:", err);
  }

  const supabase = getSupabaseClient();
  const activeUser = getCurrentUser();
  const userEmail = activeUser?.email || "albertosarly@gmail.com";
  if (supabase) {
    try {
      const records = list.map((item) => ({
        id: item.id,
        user_email: userEmail,
        edition_number: item.editionNumber,
        title: item.title,
        edition_data: item,
        approved_at: item.approvedAt || new Date().toISOString(),
      }));
      supabase.from("ecosystem_archived_editions").upsert(records).then(() => {}).catch(() => {});
    } catch (sbErr) {
      console.warn("Aviso ao sincronizar edições arquivadas com Supabase:", sbErr);
    }
  }
}

/**
 * Aprova e arquiva o projeto atual
 */
export function archiveCurrentProject(
  project: MagazineProject,
  options?: {
    notes?: string;
    status?: "approved" | "published" | "archived";
    customEditionNumber?: string;
  }
): ArchivedEdition {
  const currentList = getArchivedEditions();
  const totalPages = calculateMagazineTotalPages(project);
  const totalWords = project.articles.reduce((acc, a) => acc + countWords(a.content), 0);

  const editionNumber = options?.customEditionNumber || project.editionNumber || `0${currentList.length + 1}`;
  const now = new Date().toISOString();

  // Verifica se já existe uma edição com este mesmo ID ou número para atualizar ou criar nova
  const existingIdx = currentList.findIndex(
    (e) => e.editionNumber.trim().toLowerCase() === editionNumber.trim().toLowerCase()
  );

  const newEntry: ArchivedEdition = {
    id: existingIdx >= 0 ? currentList[existingIdx]!.id : `edition-${Date.now()}`,
    editionNumber,
    title: project.title,
    subtitle: project.subtitle,
    date: project.date,
    themeId: project.themeId,
    coverImage: project.coverConfig.backgroundImage,
    mainHeadline: project.coverConfig.mainHeadline,
    totalPages,
    totalArticles: project.articles.length,
    totalWords,
    status: options?.status || "approved",
    notes: options?.notes || "Edição aprovada pelo Coach Montanha.",
    approvedAt: now,
    projectSnapshot: JSON.parse(JSON.stringify(project)),
  };

  let updatedList: ArchivedEdition[];
  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = newEntry;
  } else {
    updatedList = [newEntry, ...currentList];
  }

  saveArchivedList(updatedList);
  return newEntry;
}

/**
 * Exclui uma edição do arquivo
 */
export function deleteArchivedEdition(id: string): void {
  const currentList = getArchivedEditions();
  const filtered = currentList.filter((e) => e.id !== id);
  saveArchivedList(filtered);
}

/**
 * Atualiza campos parciais de uma edição arquivada (ex: status, notas)
 */
export function updateArchivedEdition(
  id: string,
  updates: Partial<Pick<ArchivedEdition, "status" | "notes" | "title" | "date">>
): void {
  const currentList = getArchivedEditions();
  const updated = currentList.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveArchivedList(updated);
}

/**
 * Duplica uma edição arquivada ou projeto atual como base para a próxima edição
 */
export function duplicateEditionForNextRelease(
  source: ArchivedEdition | MagazineProject,
  options?: {
    customNextNumber?: string;
    customDate?: string;
    mode?: "keep-articles" | "clean-articles";
  }
): MagazineProject {
  const isArchived = "projectSnapshot" in source;
  const snapshot: MagazineProject = JSON.parse(
    JSON.stringify(isArchived ? source.projectSnapshot : source)
  );

  const currentEdNum = isArchived ? source.editionNumber : source.editionNumber || "01";
  
  // Calcular próximo número
  let nextNum = options?.customNextNumber;
  if (!nextNum) {
    const numInt = parseInt(currentEdNum.replace(/\D/g, ""), 10);
    nextNum = isNaN(numInt) ? "02" : numInt + 1 < 10 ? `0${numInt + 1}` : `${numInt + 1}`;
  }

  const currentYear = new Date().getFullYear();
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const nextMonthIdx = (new Date().getMonth() + 1) % 12;
  const defaultNextDate = `${months[nextMonthIdx]} ${currentYear}`;
  const nextDate = options?.customDate || defaultNextDate;

  // Se o usuário escolheu modo 'clean-articles', mantém 1 artigo de exemplo para preenchimento
  let nextArticles = snapshot.articles;
  if (options?.mode === "clean-articles") {
    nextArticles = [
      {
        id: `article-ed${nextNum}-01`,
        title: "NOVA MATÉRIA PRINCIPAL",
        subtitle: "Subtítulo da matéria de capa para esta nova edição",
        category: "FITNESS",
        content: "Insira o conteúdo do seu novo artigo aqui. Você também pode importar do seu acervo ou usar a IA para redigir matérias completas.",
        author: snapshot.articles[0]?.author || "Coach Montanha",
        estimatedReadTime: 3,
        pageSpan: 1,
        enabled: true,
        heroImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
        pullQuotes: [],
        layoutTemplate: "editorial-lead",
        tags: ["FORÇA"],
        featuredOnCover: true,
      },
    ];
  }

  const duplicatedProject: MagazineProject = {
    ...snapshot,
    id: `proj-edition-${nextNum}-${Date.now()}`,
    editionNumber: nextNum,
    date: nextDate,
    articles: nextArticles,
    coverConfig: {
      ...snapshot.coverConfig,
      issueBadge: `EDIÇÃO #${nextNum}`,
      issueDate: nextDate.toUpperCase(),
      editionNumber: nextNum,
      hexBadgeText: snapshot.volume ? `${snapshot.volume} // ISSUE ${nextNum}` : `VOL. 01 // ISSUE ${nextNum}`,
      mainHeadline:
        options?.mode === "clean-articles"
          ? "MANCHETE PRINCIPAL DA NOVA EDIÇÃO"
          : snapshot.coverConfig.mainHeadline,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return duplicatedProject;
}

/**
 * Exporta todo o acervo de edições em arquivo JSON
 */
export function exportAllEditionsArchive(): void {
  const list = getArchivedEditions();
  const jsonStr = JSON.stringify(list, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `arquivo-edicoes-montanha-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface DocumentPublicationRecord {
  editionNumber: string;
  editionTitle: string;
  date?: string;
  publishedAt?: string;
  isManual?: boolean;
}

export interface DocumentUsageTracker {
  isInCurrentMagazine: boolean;
  currentArticle?: Article;
  currentPageNumber?: number;
  previousEditions: DocumentPublicationRecord[];
  isUnusedDraft: boolean;
  status: "current" | "previous" | "both" | "unused";
  statusLabel: string;
}

/**
 * Avalia o status editorial completo de um documento do acervo:
 * - Se está na revista atual
 * - Se já foi publicado em edições anteriores arquivadas
 * - Ou se é um rascunho 100% inédito
 */
export function getDocumentUsageTracker(
  doc: RepositoryDocument,
  currentProject: MagazineProject,
  archivedEditions?: ArchivedEdition[]
): DocumentUsageTracker {
  // 1. Verificar na edição atual ativa
  const currentArticles = currentProject.articles || [];
  const currentArticleIndex = currentArticles.findIndex(
    (a) =>
      (a.sourceDocId && a.sourceDocId === doc.id) ||
      (doc.id && a.id === doc.id) ||
      a.title.trim().toLowerCase() === doc.title.trim().toLowerCase()
  );
  const currentArticle = currentArticleIndex >= 0 ? currentArticles[currentArticleIndex] : undefined;
  const isInCurrentMagazine = !!currentArticle;
  const currentPageNumber = currentArticleIndex >= 0 ? currentArticleIndex + 4 : undefined;

  // 2. Verificar edições anteriores
  const previousEditionsMap = new Map<string, DocumentPublicationRecord>();

  // a) Edições registradas diretamente no documento
  if (doc.publishedEditions && Array.isArray(doc.publishedEditions)) {
    for (const record of doc.publishedEditions) {
      if (record.editionNumber) {
        const key = record.editionNumber.trim().toLowerCase();
        previousEditionsMap.set(key, {
          editionNumber: record.editionNumber,
          editionTitle: record.editionTitle || `Edição #${record.editionNumber}`,
          date: record.date,
          publishedAt: record.publishedAt,
          isManual: record.isManual,
        });
      }
    }
  }

  // b) Edições arquivadas no sistema
  const archiveList = archivedEditions || getArchivedEditions();
  const currentEdNumber = (currentProject.editionNumber || "").trim().toLowerCase();

  for (const archive of archiveList) {
    const archiveEdNumber = (archive.editionNumber || "").trim().toLowerCase();
    const isSameEditionNumber = archiveEdNumber === currentEdNumber;

    // Verificar se o documento estava presente nos artigos do snapshot arquivado
    const foundInArchive = archive.projectSnapshot?.articles?.some(
      (a) =>
        (a.sourceDocId && a.sourceDocId === doc.id) ||
        (doc.id && a.id === doc.id) ||
        a.title.trim().toLowerCase() === doc.title.trim().toLowerCase()
    );

    if (foundInArchive) {
      if (!isSameEditionNumber || !isInCurrentMagazine) {
        const key = archiveEdNumber;
        if (!previousEditionsMap.has(key)) {
          previousEditionsMap.set(key, {
            editionNumber: archive.editionNumber,
            editionTitle: archive.title || `Edição #${archive.editionNumber}`,
            date: archive.date,
            publishedAt: archive.approvedAt,
            isManual: false,
          });
        }
      }
    }
  }

  const previousEditions = Array.from(previousEditionsMap.values());
  const hasPrevious = previousEditions.length > 0;

  let status: "current" | "previous" | "both" | "unused" = "unused";
  let statusLabel = "Rascunho Inédito";

  if (isInCurrentMagazine && hasPrevious) {
    status = "both";
    statusLabel = `Na Revista Atual (e anterior: Ed. ${previousEditions[0]?.editionNumber})`;
  } else if (isInCurrentMagazine) {
    status = "current";
    statusLabel = "Na Revista Atual";
  } else if (hasPrevious) {
    status = "previous";
    statusLabel = `Publicado na Ed. #${previousEditions[0]?.editionNumber}`;
  } else {
    status = "unused";
    statusLabel = "Rascunho Inédito (Disponível)";
  }

  return {
    isInCurrentMagazine,
    currentArticle,
    currentPageNumber,
    previousEditions,
    isUnusedDraft: status === "unused",
    status,
    statusLabel,
  };
}

/**
 * Adiciona ou remove marcação manual de edição publicada em um documento do acervo
 */
export function toggleDocPublishedEdition(
  docId: string,
  project: MagazineProject,
  editionData: { editionNumber: string; editionTitle?: string; date?: string }
): MagazineProject {
  const targetDoc = project.contentRepository?.find((d) => d.id === docId);
  if (!targetDoc) return project;

  const currentEditions = targetDoc.publishedEditions || [];
  const exists = currentEditions.some(
    (e) => e.editionNumber.trim().toLowerCase() === editionData.editionNumber.trim().toLowerCase()
  );

  let updatedList: typeof currentEditions;
  if (exists) {
    updatedList = currentEditions.filter(
      (e) => e.editionNumber.trim().toLowerCase() !== editionData.editionNumber.trim().toLowerCase()
    );
  } else {
    updatedList = [
      ...currentEditions,
      {
        editionNumber: editionData.editionNumber.trim(),
        editionTitle: editionData.editionTitle || `Edição #${editionData.editionNumber.trim()}`,
        date: editionData.date,
        publishedAt: new Date().toISOString(),
        isManual: true,
      },
    ];
  }

  const updatedRepository = (project.contentRepository || []).map((d) =>
    d.id === docId
      ? {
          ...d,
          publishedEditions: updatedList,
          updatedAt: new Date().toISOString(),
        }
      : d
  );

  return {
    ...project,
    contentRepository: updatedRepository,
    updatedAt: new Date().toISOString(),
  };
}

