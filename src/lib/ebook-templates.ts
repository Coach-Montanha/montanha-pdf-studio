import { EbookProject, EbookPresetStyle } from "../types/ebook";
import { getSupabaseClient } from "../services/ecosystem-auth-service";
import { getCurrentUser } from "./auth-state";

export const EBOOK_PRESETS_INFO: Record<EbookPresetStyle, { name: string; description: string; badge: string; icon: string }> = {
  "practical-guide": {
    name: "Guia / E-book Prático Modular",
    description: "Ideal para protocolos, passos práticos, quadros de aviso e resumos executivos (Key Takeaways).",
    badge: "PRÁTICO & MODULAR",
    icon: "BookOpen",
  },
  "technical-manual": {
    name: "Manual / Livro Técnico Aprofundado",
    description: "Foco em leitura imersiva contínua, tipografia elegante, citações destacadas e bibliografia.",
    badge: "TÉCNICO & DENSE",
    icon: "FileText",
  },
  "commercial-lead": {
    name: "E-book Comercial & Isca Digital",
    description: "Focado em conversão, capturar contatos, destacar benefícios com visual de alto impacto e CTA final.",
    badge: "ALTO IMPACTO & VENDAS",
    icon: "Sparkles",
  },
};

export const INITIAL_EBOOK_PROJECT: EbookProject = {
  id: "ebook-demo-nutricao-01",
  title: "Guia de Nutrição & Performance Esportiva",
  subtitle: "Estratégias Práticas de Periodização Nutricional e Biohacking para Coaches e Atletas",
  authorName: "Coach Rafael Montanha",
  authorBio: "Especialista em Alta Performance Esportiva, Fundador do Ecossistema Montanha e Treinador de Atletas de Elite.",
  authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  categoryTag: "ALTA PERFORMANCE & NUTRIÇÃO",
  presetStyle: "practical-guide",
  themeId: "montanha-titanium",
  coverImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
  callToActionUrl: "https://montanha.com/pro",
  callToActionText: "Gostou deste guia? Conheça os programas avançados de acompanhamento do Ecossistema Montanha.",
  callToActionButtonLabel: "Acessar Plataforma PRO",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: "ch-1",
      chapterNumber: 1,
      title: "Fundamentos da Periodização Nutricional",
      subtitle: "Alinhando a ingestão de substratos energéticos com os ciclos de treino de alta intensidade",
      introduction: "A nutrição de alta performance não se trata apenas de 'comer limpo', mas de ingerir o nutriente certo no momento exato de máxima exigência metabólica.",
      sections: [
        {
          id: "sec-1-1",
          type: "text",
          title: "A Janela Metabólica Real",
          content: "Por anos acreditou-se que a janela de síntese proteica durava apenas 30 minutos pós-treino. Estudos modernos demonstram que a resposta anabólica permanece elevada por até 24 horas, exigindo constância no fracionamento proteico ao longo do dia.",
        },
        {
          id: "sec-1-2",
          type: "callout",
          calloutTitle: "📌 Destaque Prático — Regra dos 2g/kg",
          content: "Para atletas submetidos a treinos concorrentes (força + endurance), mantenha a ingestão proteica entre 2.0g e 2.4g por quilo de peso corporal fracionada em 4 a 5 refeições diárias.",
        },
        {
          id: "sec-1-3",
          type: "step-by-step",
          title: "Passos para Ajustar a Ingestão em Dias de Treino Intenso",
          stepNumber: 1,
          content: "1. Aumente a proporção de carboidratos de média e rápida absorção nas 3 horas que antecedem o treino principal.\n2. Mantenha a hidratação com eletrólitos (sódio e magnésio) durante sessões com mais de 75 minutos.\n3. Priorize proteínas de alto valor biológico com leucina elevada no pós-treino imediato.",
        },
      ],
      summaryTakeaways: [
        "Fracionar a proteína a cada 3-4 horas otimiza a sinalização via mTOR.",
        "O carboidrato é o poupador primário de glicogênio e tecido muscular.",
        "A hidratação com sódio reduz a percepção de esforço em treinos de calor.",
      ],
    },
    {
      id: "ch-2",
      chapterNumber: 2,
      title: "Suplementação Baseada em Evidências",
      subtitle: "Ergogênicos nutricionais com nível A de comprovação científica no esporte",
      introduction: "Entre centenas de suplementos comercializados, apenas uma pequena fração possui respaldo científico robusto para aumento de potência e tolerância à fadiga.",
      sections: [
        {
          id: "sec-2-1",
          type: "checklist",
          title: "Checklist dos 4 Ergogênicos Essenciais",
          content: "Verifique se a sua rotina de suplementação contém os compostos corretos:",
          checklistItems: [
            "Creatina Monohidratada (3 a 5g/dia de forma contínua)",
            "Beta-Alanina (4.8 a 6.4g/dia para tamponamento de H+)",
            "Cafeína Anidra (3 a 6mg/kg cerca de 45 min pré-treino)",
            "Nitrato / Suco de Beterraba (para melhora da eficiência mitocondrial e fluxo sanguíneo)",
          ],
        },
        {
          id: "sec-2-2",
          type: "quote",
          content: "A consistência na suplementação básica supera qualquer protocolo milagroso de curto prazo.",
          quoteAuthor: "Dra. Carol Mendes - Fisiologia do Exercício",
        },
      ],
      summaryTakeaways: [
        "Creatina deve ser consumida diariamente, independentemente dos dias de treino.",
        "Beta-alanina necessita de fase de saturação para eficácia no tamponamento muscular.",
      ],
    },
  ],
};

export function getEbookStorageKey(): string {
  return "montanha_ebook_projects_list";
}

export function getStoredEbooks(): EbookProject[] {
  if (typeof window === "undefined") return [INITIAL_EBOOK_PROJECT];
  try {
    const raw = localStorage.getItem(getEbookStorageKey());
    let list: EbookProject[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

    if (list.length === 0) {
      list = [INITIAL_EBOOK_PROJECT];
      localStorage.setItem(getEbookStorageKey(), JSON.stringify(list));
    }

    // Busca no Supabase
    const supabase = getSupabaseClient();
    const activeUser = getCurrentUser();
    if (supabase && activeUser?.email) {
      supabase
        .from("ecosystem_ebook_projects")
        .select("*")
        .eq("user_email", activeUser.email)
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const fetched = data.map((r: any) => r.ebook_data as EbookProject).filter(Boolean);
            if (fetched.length > 0) {
              const mergedMap = new Map<string, EbookProject>();
              list.forEach((e) => mergedMap.set(e.id, e));
              fetched.forEach((e) => mergedMap.set(e.id, e));
              const mergedList = Array.from(mergedMap.values());
              if (mergedList.length !== list.length) {
                localStorage.setItem(getEbookStorageKey(), JSON.stringify(mergedList));
                window.dispatchEvent(new Event("montanha-ebooks-changed"));
              }
            }
          }
        })
        .catch(() => {});
    }

    return list;
  } catch {
    return [INITIAL_EBOOK_PROJECT];
  }
}

export function saveEbookProject(project: EbookProject): void {
  if (typeof window === "undefined") return;
  const updatedProject = { ...project, updatedAt: new Date().toISOString() };
  try {
    const existing = getStoredEbooks();
    const index = existing.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      existing[index] = updatedProject;
    } else {
      existing.unshift(updatedProject);
    }
    localStorage.setItem(getEbookStorageKey(), JSON.stringify(existing));
    window.dispatchEvent(new Event("montanha-ebooks-changed"));
  } catch (err) {
    console.warn("Falha ao salvar E-book no localStorage:", err);
  }

  // Sincronização em nuvem via Supabase
  const supabase = getSupabaseClient();
  const activeUser = getCurrentUser();
  const userEmail = activeUser?.email || "albertosarly@gmail.com";
  if (supabase) {
    try {
      supabase
        .from("ecosystem_ebook_projects")
        .upsert({
          id: updatedProject.id,
          user_email: userEmail,
          title: updatedProject.title,
          ebook_data: updatedProject,
          updated_at: updatedProject.updatedAt,
        })
        .then(() => {})
        .catch(() => {});
    } catch (sbErr) {
      console.warn("Aviso ao salvar e-book no Supabase:", sbErr);
    }
  }
}
