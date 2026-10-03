import { EbookOutlineRequest, EbookOutlineResult, EbookProject, EbookChapter } from "../types/ebook";
import { INITIAL_EBOOK_PROJECT } from "../lib/ebook-templates";

/**
 * AI Service for Generating E-books automatically
 */
export async function generateEbookOutline(request: EbookOutlineRequest): Promise<EbookOutlineResult> {
  // Simula latência de chamada de IA
  await new Promise((res) => setTimeout(res, 800));

  const topicClean = request.topic.trim();
  const audience = request.targetAudience?.trim() || "Coaches, Profissionais e Entusiastas de Alta Performance";
  const presetStyle = request.presetStyle;

  if (presetStyle === "commercial-lead") {
    return {
      title: `E-book de Alta Conversão: ${topicClean}`,
      subtitle: `O Passo a Passo Prático para Dominar ${topicClean} e Escalar seus Resultados no Ecossistema`,
      categoryTag: "ISCA DIGITAL & HIGH IMPACT",
      authorBioSuggestion: `Especialista de destaque do Ecossistema Montanha na área de ${topicClean}.`,
      chapters: [
        {
          number: 1,
          title: `O Grande Desafio de ${topicClean}`,
          subtitle: "Por que métodos tradicionais falham e como a abordagem moderna muda o jogo",
          keyPoints: ["Análise do cenário atual", "Erros mais comuns cometidos por iniciantes", "O pilar fundamental de transformação"],
        },
        {
          number: 2,
          title: "O Método de 3 Passos para o Sucesso",
          subtitle: "Estratégia prática e replicável de execução diária",
          keyPoints: ["Passo 1: Diagnóstico e alinhamento", "Passo 2: Implementação com ferramentas certas", "Passo 3: Métrica e otimização"],
        },
        {
          number: 3,
          title: "Plano de Ação & Próximos Passos",
          subtitle: "Como dar o próximo passo rumo ao acompanhamento avançado",
          keyPoints: ["Checklist de execução rápida", "Acesso aos programas de mentoria e ecossistema"],
        },
      ],
    };
  }

  if (presetStyle === "technical-manual") {
    return {
      title: `Manual Técnico: ${topicClean}`,
      subtitle: `Fundamentos Teóricos, Evidências Científicas e Protocolos de ${topicClean}`,
      categoryTag: "LIVRO TÉCNICO & PESQUISA",
      authorBioSuggestion: `Autoridade técnica e pesquisador no Ecossistema Montanha.`,
      chapters: [
        {
          number: 1,
          title: `Fisiologia e Mecanismos da ${topicClean}`,
          subtitle: "Revisão aprofundada dos princípios biológicos e metabólicos envolvidos",
          keyPoints: ["Mecanismos celulares primários", "Vias de sinalização", "Revisão da literatura recente"],
        },
        {
          number: 2,
          title: "Protocolos de Intervenção Avançada",
          subtitle: "Diretrizes práticas de aplicação técnica em atletas e alunos",
          keyPoints: ["Critérios de dosagem e volume", "Considerações de segurança e adaptação", "Análise de estudos de caso"],
        },
        {
          number: 3,
          title: "Diretrizes de Monitoramento e Resultados",
          subtitle: "Avaliando adaptações de longo prazo com precisão",
          keyPoints: ["Biomarcadores relevantes", "Ajustes periódicos de carga e dieta", "Conclusões editoriais"],
        },
      ],
    };
  }

  // Default: practical-guide
  return {
    title: `Guia Prático de ${topicClean}`,
    subtitle: `Manuais, Checklist e Protocolos de Execução em ${topicClean} para ${audience}`,
    categoryTag: "GUIA PRÁTICO MODULAR",
    authorBioSuggestion: `Treinador e especialista de elite no Ecossistema Montanha.`,
    chapters: [
      {
        number: 1,
        title: `Introdução & Pilares de ${topicClean}`,
        subtitle: "Construindo os alicerces para resultados consistentes",
        keyPoints: ["O que é essencial entender", "Preparação inicial do ambiente e rotina", "Checklist de largada"],
      },
      {
        number: 2,
        title: "Protocolo de Execução Semanal",
        subtitle: "A rotina passo a passo detalhada",
        keyPoints: ["Cronograma prático", "Ajustes e caixas de destaque", "Pontos de atenção e erros a evitar"],
      },
      {
        number: 3,
        title: "Resumo Executivo & Garantia de Resultados",
        subtitle: "Key takeaways e acompanhamento",
        keyPoints: ["Resumo dos aprendizados", "Plano de continuidade"],
      },
    ],
  };
}

/**
 * Generates a full EbookProject based on an outline
 */
export async function generateFullEbookProject(
  outline: EbookOutlineResult,
  authorName: string,
  presetStyle: EbookProject["presetStyle"]
): Promise<EbookProject> {
  await new Promise((res) => setTimeout(res, 1200));

  const chapters: EbookChapter[] = outline.chapters.map((ch) => ({
    id: `ch-ai-${ch.number}-${Date.now()}`,
    chapterNumber: ch.number,
    title: ch.title,
    subtitle: ch.subtitle,
    introduction: `Neste capítulo, abordaremos de forma clara os principais conceitos de ${ch.title.toLowerCase()}, trazendo estratégias diretamente aplicáveis.`,
    sections: [
      {
        id: `sec-ai-${ch.number}-1`,
        type: "text",
        title: "Panorama Geral",
        content: `Para obter o máximo desempenho ao aplicar este conhecimento, é fundamental alinhar cada etapa ao objetivo final. ${ch.keyPoints[0]}.`,
      },
      {
        id: `sec-ai-${ch.number}-2`,
        type: presetStyle === "practical-guide" ? "callout" : "quote",
        calloutTitle: `💡 Destaque do Capítulo ${ch.number}`,
        content: `Aplicação prática: ${ch.keyPoints[1] || "Mantenha a constância na execução diária."}`,
        quoteAuthor: authorName,
      },
      {
        id: `sec-ai-${ch.number}-3`,
        type: "checklist",
        title: `Checklist de Execução — Capítulo ${ch.number}`,
        content: "Garanta que todos os critérios a seguir foram preenchidos:",
        checklistItems: ch.keyPoints,
      },
    ],
    summaryTakeaways: [
      `A chave para o capítulo ${ch.number} é a aplicação imediata do protocolo.`,
      `Documente seu progresso e ajuste conforme a resposta individual.`,
    ],
  }));

  return {
    id: `ebook-ai-${Date.now()}`,
    title: outline.title,
    subtitle: outline.subtitle,
    authorName: authorName.trim() || "Coach Montanha",
    authorBio: outline.authorBioSuggestion,
    authorAvatarUrl: INITIAL_EBOOK_PROJECT.authorAvatarUrl,
    categoryTag: outline.categoryTag,
    presetStyle,
    themeId: "montanha-titanium",
    coverImage: INITIAL_EBOOK_PROJECT.coverImage,
    callToActionUrl: "https://montanha.com/pro",
    callToActionText: "Eleve seus resultados ao próximo nível com a mentoria e as ferramentas exclusivas do Ecossistema Montanha.",
    callToActionButtonLabel: "Conhecer o Ecossistema",
    chapters,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
