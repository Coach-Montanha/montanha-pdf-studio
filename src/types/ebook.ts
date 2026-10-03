export type EbookPresetStyle = "practical-guide" | "technical-manual" | "commercial-lead";

export type EbookSectionType =
  | "text"
  | "callout"
  | "quote"
  | "checklist"
  | "warning"
  | "hero-box"
  | "step-by-step";

export interface EbookSection {
  id: string;
  type: EbookSectionType;
  title?: string;
  content: string;
  calloutTitle?: string;
  checklistItems?: string[];
  quoteAuthor?: string;
  stepNumber?: number;
}

export interface EbookChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  introduction?: string;
  sections: EbookSection[];
  summaryTakeaways?: string[];
}

export interface EbookProject {
  id: string;
  title: string;
  subtitle: string;
  authorName: string;
  authorBio?: string;
  authorAvatarUrl?: string;
  categoryTag: string;
  presetStyle: EbookPresetStyle;
  themeId: string; // Usa o mesmo sistema de paleta de cores/temas do Montanha PDF Studio
  coverImage?: string;
  callToActionUrl?: string;
  callToActionText?: string;
  callToActionButtonLabel?: string;
  chapters: EbookChapter[];
  createdAt: string;
  updatedAt: string;
}

export interface EbookOutlineRequest {
  topic: string;
  targetAudience?: string;
  presetStyle: EbookPresetStyle;
  chapterCount?: number;
  customPrompt?: string;
}

export interface EbookOutlineResult {
  title: string;
  subtitle: string;
  categoryTag: string;
  authorBioSuggestion: string;
  chapters: Array<{
    number: number;
    title: string;
    subtitle: string;
    keyPoints: string[];
  }>;
}
