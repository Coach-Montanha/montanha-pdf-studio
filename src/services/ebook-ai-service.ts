import { EbookOutlineRequest, EbookOutlineResult, EbookProject, EbookChapter } from "../types/ebook";
import { INITIAL_EBOOK_PROJECT } from "../lib/ebook-templates";

/**
 * AI Service for Generating E-books automatically
 */
export async function generateEbookOutline(request: EbookOutlineRequest): Promise<EbookOutlineResult> {
  await new Promise((res) => setTimeout(res, 800));

  const topicClean = request.topic.trim();
  const audience = request.targetAudience?.trim() || "Coaches, Profissionais e Entusiastas de Alta Performance";
  const presetStyle = request.presetStyle;
  const count = Math.min(10, Math.max(1, request.chapterCount || 3));
  const prompt = request.customPrompt?.trim();

  const chapters: Array<{
    number: number;
    title: string;
    subtitle: string;
    keyPoints: string[];
  }> = [];

  for (let i = 1; i <= count; i++) {
    if (i === 1) {
      chapters.push({
        number: 1,
        title: `Fundamentos & Visão Geral de ${topicClean}`,
        subtitle: prompt ? `Alinhado ao direcionamento: ${prompt.slice(0, 60)}...` : "Construindo os alicerces teóricos e práticos de alto nível",
        keyPoints: [
          `Mecanismos centrais de ${topicClean}`,
          prompt ? `Direcionamento: ${prompt.slice(0, 50)}` : "Erros mais comuns e como evitá-los",
          "Princípios de execução contínua",
        ],
      });
    } else if (i === count) {
      chapters.push({
        number: count,
        title: "Resumo Executivo & Plano de Continuidade",
        subtitle: "Key Takeaways e próximos passos no Ecossistema",
        keyPoints: [
          "Checklist final de verificação",
          "Plano de 30 dias de evolução",
          "Acompanhamento e mentoria",
        ],
      });
    } else {
      chapters.push({
        number: i,
        title: `Módulo Prático ${i}: Aplicação em ${topicClean}`,
        subtitle: `Desenvolvimento avançado da etapa ${i}`,
        keyPoints: [
          `Protocolo de ação ${i}.1`,
          `Caixas de destaque e exemplos reais`,
          `Métricas de acompanhamento`,
        ],
      });
    }
  }

  return {
    title: `Guia de ${topicClean}`,
    subtitle: prompt
      ? `Baseado no direcionamento: ${prompt.slice(0, 90)}`
      : `Manuais, Checklist e Protocolos de Execução em ${topicClean} para ${audience}`,
    categoryTag: presetStyle === "technical-manual" ? "MANUAL TÉCNICO" : presetStyle === "commercial-lead" ? "HIGH IMPACT" : "GUIA PRÁTICO MODULAR",
    authorBioSuggestion: `Especialista e autor de elite do Ecossistema Montanha.`,
    chapters,
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
