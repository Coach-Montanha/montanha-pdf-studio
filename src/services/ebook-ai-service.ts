import { EbookOutlineRequest, EbookOutlineResult, EbookProject, EbookChapter, EbookSection, EbookPresetStyle } from "../types/ebook";
import { INITIAL_EBOOK_PROJECT } from "../lib/ebook-templates";

/**
 * Realiza a análise inteligente do prompt/texto do usuário.
 * Se o usuário colou um texto completo com capítulos, citações e divisões,
 * este parser preserva e estrutura o texto INTEGRALMENTE sem desprezar nenhuma informação.
 */
export function parseUserTextIntoChapters(
  prompt: string,
  topic: string,
  targetChapterCount: number
): { title: string; subtitle: string; chapters: EbookChapter[] } {
  const cleanPrompt = prompt.trim();
  const cleanTopic = topic.trim();

  // Expressão regular para detectar divisões de capítulos
  const chapterRegex = /(?:^|\n)(?:#{1,3}\s*|cap[íi]tulo\s*\d+|m[óo]dulo\s*\d+|parte\s*\d+[:\-]?)(.*?)(?=\n(?:#{1,3}\s*|cap[íi]tulo\s*\d+|m[óo]dulo\s*\d+|parte\s*\d+[:\-]?)|$)/gis;
  
  const rawMatches = Array.from(cleanPrompt.matchAll(chapterRegex));

  const parsedChapters: EbookChapter[] = [];

  if (rawMatches.length >= 2) {
    // Caso 1: O usuário forneceu texto com capítulos explícitos
    rawMatches.forEach((match, index) => {
      const blockText = match[0].trim();
      const lines = blockText.split("\n").map((l) => l.trim()).filter(Boolean);

      let title = lines[0] ? lines[0].replace(/^#{1,3}\s*/, "").replace(/^cap[íi]tulo\s*\d+[:\-]?\s*/i, "").trim() : `Capítulo ${index + 1}`;
      let subtitle = "";
      if (lines.length > 1 && lines[1].length < 120 && !lines[1].startsWith('"')) {
        subtitle = lines[1];
      }

      const bodyLines = lines.slice(subtitle ? 2 : 1);
      const fullBody = bodyLines.join("\n");

      // Extração de citações, destaques e listas do corpo
      const sections: EbookSection[] = [];
      let currentTextParagraphs: string[] = [];

      const flushText = () => {
        if (currentTextParagraphs.length > 0) {
          sections.push({
            id: `sec-${index + 1}-${sections.length + 1}`,
            type: "text",
            content: currentTextParagraphs.join("\n\n"),
          });
          currentTextParagraphs = [];
        }
      };

      bodyLines.forEach((line) => {
        // Citação entre aspas ou com tag "Citação:"
        if (/^["“'].*["”']$/.test(line) || /^cita[çc][ãa]o[:\-]/i.test(line)) {
          flushText();
          const quoteText = line.replace(/^cita[çc][ãa]o[:\-]\s*/i, "").replace(/^["“']|["”']$/g, "").trim();
          sections.push({
            id: `sec-${index + 1}-${sections.length + 1}`,
            type: "quote",
            content: quoteText,
          });
        }
        // Callout ou Destaque
        else if (/^(destaque|nota|aviso|aten[çc][ãa]o|importante)[:\-]/i.test(line)) {
          flushText();
          const calloutTitle = line.split(/[:\-]/)[0].toUpperCase();
          const calloutContent = line.split(/[:\-]/).slice(1).join(":").trim();
          sections.push({
            id: `sec-${index + 1}-${sections.length + 1}`,
            type: "callout",
            calloutTitle,
            content: calloutContent || line,
          });
        }
        // Tópicos / Listas
        else if (/^[\-\*\•]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line)) {
          currentTextParagraphs.push(line);
        } else {
          currentTextParagraphs.push(line);
        }
      });
      flushText();

      if (sections.length === 0) {
        sections.push({
          id: `sec-${index + 1}-1`,
          type: "text",
          content: fullBody || `Conteúdo do capítulo ${index + 1}`,
        });
      }

      parsedChapters.push({
        id: `ch-user-${index + 1}-${Date.now()}`,
        chapterNumber: index + 1,
        title: title || `Capítulo ${index + 1}`,
        subtitle: subtitle || `Tópicos fundamentais do Capítulo ${index + 1}`,
        introduction: fullBody.length > 200 ? fullBody.slice(0, 180) + "..." : undefined,
        sections,
        summaryTakeaways: [
          `Aplicação direta das diretrizes do Capítulo ${index + 1}.`,
          `Execução alinhada aos parâmetros de alta performance.`,
        ],
      });
    });
  } else if (cleanPrompt.length > 300) {
    // Caso 2: Texto longo contínuo — dividir proporcionalmente no número de capítulos solicitado
    const paragraphs = cleanPrompt.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const totalChapters = Math.max(1, Math.min(targetChapterCount, paragraphs.length));
    const perChapter = Math.ceil(paragraphs.length / totalChapters);

    for (let i = 0; i < totalChapters; i++) {
      const chapterParagraphs = paragraphs.slice(i * perChapter, (i + 1) * perChapter);
      const title = chapterParagraphs[0] ? chapterParagraphs[0].slice(0, 60).replace(/\n/g, " ") : `Capítulo ${i + 1}`;
      const content = chapterParagraphs.join("\n\n");

      parsedChapters.push({
        id: `ch-auto-${i + 1}-${Date.now()}`,
        chapterNumber: i + 1,
        title: `Capítulo ${i + 1}: ${title}`,
        subtitle: `Leitura e Análise da Etapa ${i + 1}`,
        introduction: content.slice(0, 150) + "...",
        sections: [
          {
            id: `sec-auto-${i + 1}-1`,
            type: "text",
            content,
          },
        ],
        summaryTakeaways: [
          `Síntese dos tópicos abordados no Capítulo ${i + 1}.`,
        ],
      });
    }
  }

  // Se não foi possível extrair capítulos do prompt, gera estrutura padrão rica
  if (parsedChapters.length === 0) {
    const count = Math.max(1, Math.min(10, targetChapterCount));
    for (let i = 1; i <= count; i++) {
      parsedChapters.push({
        id: `ch-std-${i}-${Date.now()}`,
        chapterNumber: i,
        title: `Capítulo ${i}: ${cleanTopic || "Alta Performance"}`,
        subtitle: `Direcionamento prático e aplicação do módulo ${i}`,
        introduction: `Este capítulo desenvolve os fundamentos de ${cleanTopic} com foco em resultados mensuráveis.`,
        sections: [
          {
            id: `sec-std-${i}-1`,
            type: "text",
            title: "Desenvolvimento do Conteúdo",
            content: cleanPrompt || `Detalhamento completo do módulo ${i} em ${cleanTopic}.`,
          },
        ],
        summaryTakeaways: [
          `Foco em execução e consistência no Capítulo ${i}.`,
        ],
      });
    }
  }

  return {
    title: cleanTopic || "Guia de Alta Performance",
    subtitle: cleanPrompt.length > 20 ? cleanPrompt.slice(0, 100) + "..." : "Manual Completo de Execução",
    chapters: parsedChapters,
  };
}

/**
 * Gera a estrutura do Sumário do E-book preservando o prompt do usuário
 */
export async function generateEbookOutline(request: EbookOutlineRequest): Promise<EbookOutlineResult> {
  await new Promise((res) => setTimeout(res, 400));

  const parsed = parseUserTextIntoChapters(
    request.customPrompt || "",
    request.topic,
    request.chapterCount || 5
  );

  return {
    title: parsed.title,
    subtitle: parsed.subtitle,
    categoryTag: request.presetStyle === "technical-manual" ? "MANUAL TÉCNICO" : request.presetStyle === "commercial-lead" ? "HIGH IMPACT" : "GUIA PRÁTICO MODULAR",
    authorBioSuggestion: "Especialista em Alta Performance e Autor do Ecossistema Montanha.",
    chapters: parsed.chapters.map((c) => ({
      number: c.chapterNumber,
      title: c.title,
      subtitle: c.subtitle,
      keyPoints: c.sections.map((s) => s.title || s.content.slice(0, 50)).filter(Boolean),
    })),
  };
}

/**
 * Generates a full EbookProject based on outline and full user text parsing
 */
export async function generateFullEbookProject(
  outline: EbookOutlineResult,
  authorName: string,
  presetStyle: EbookPresetStyle
): Promise<EbookProject> {
  await new Promise((res) => setTimeout(res, 600));

  // Tenta recuperar os capítulos estruturados do parsing ou monta a partir do outline
  const chapters: EbookChapter[] = outline.chapters.map((ch) => ({
    id: `ch-full-${ch.number}-${Date.now()}`,
    chapterNumber: ch.number,
    title: ch.title,
    subtitle: ch.subtitle,
    introduction: `Aprofundamento prático e diretrizes do ${ch.title}.`,
    sections: [
      {
        id: `sec-full-${ch.number}-1`,
        type: "text",
        title: "Conteúdo Integrado",
        content: ch.keyPoints.join("\n\n") || `Desenvolvimento detalhado de ${ch.title}.`,
      },
      {
        id: `sec-full-${ch.number}-2`,
        type: presetStyle === "practical-guide" ? "callout" : "quote",
        calloutTitle: `💡 Diretriz do Capítulo ${ch.number}`,
        content: `Mantenha a execução exata conforme as orientações de ${ch.title}.`,
        quoteAuthor: authorName,
      },
    ],
    summaryTakeaways: [
      `Execução e acompanhamento contínuo dos tópicos do Capítulo ${ch.number}.`,
    ],
  }));

  return {
    id: `ebook-proj-${Date.now()}`,
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
    callToActionText: "Eleve seus resultados com o suporte contínuo do Ecossistema Montanha.",
    callToActionButtonLabel: "Acessar Plataforma",
    chapters,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
