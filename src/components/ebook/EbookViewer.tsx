import React, { useState } from "react";
import { EbookProject, EbookChapter } from "../../types/ebook";
import { EBOOK_PRESETS_INFO } from "../../lib/ebook-templates";
import {
  BookOpen,
  CheckCircle2,
  Quote,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  Printer,
  ListOrdered,
  FileText,
  Share2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "../ui/button";

interface EbookViewerProps {
  ebook: EbookProject;
  onEdit?: (ebook: EbookProject) => void;
  onExportPdf?: () => void;
}

export const EbookViewer: React.FC<EbookViewerProps> = ({ ebook, onEdit, onExportPdf }) => {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(ebook.chapters[0]?.id || null);
  const presetInfo = EBOOK_PRESETS_INFO[ebook.presetStyle] || EBOOK_PRESETS_INFO["practical-guide"];

  const handlePrint = () => {
    if (onExportPdf) {
      onExportPdf();
    } else {
      window.print();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-sans selection:bg-amber-500 selection:text-black">
      {/* Header Controls (Estúdio & Visualização) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                {presetInfo.badge}
              </span>
              <span className="text-xs text-slate-400 font-medium">Modo Leitura Mobile/Tablet</span>
            </div>
            <h2 className="text-base font-black text-white truncate max-w-md">{ebook.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 rounded-xl shadow-md border border-amber-400 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar PDF</span>
          </Button>
        </div>
      </div>

      {/* CAPA DO E-BOOK */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.15)] p-8 md:p-12 text-slate-100 min-h-[500px] flex flex-col justify-between">
        {ebook.coverImage && (
          <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${ebook.coverImage})` }} />
        )}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{ebook.categoryTag || "E-BOOK EXCLUSIVO ECOSSISTEMA"}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight uppercase">
            {ebook.title}
          </h1>
          <p className="text-sm md:text-lg font-medium text-slate-300 max-w-2xl">
            {ebook.subtitle}
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {ebook.authorAvatarUrl ? (
              <img src={ebook.authorAvatarUrl} alt={ebook.authorName} className="w-10 h-10 rounded-full object-cover border-2 border-amber-500" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                {ebook.authorName.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Autor(a)</span>
              <span className="text-sm font-bold text-amber-400">{ebook.authorName}</span>
            </div>
          </div>

          <div className="font-mono text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            Ecossistema Montanha • Edição Digital
          </div>
        </div>
      </div>

      {/* SUMÁRIO NAVEGÁVEL */}
      <div className="no-print p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <ListOrdered className="w-4 h-4 text-amber-400" />
          <span>Sumário dos Capítulos</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ebook.chapters.map((ch) => {
            const isActive = activeChapterId === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapterId(ch.id)}
                className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                  isActive
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-white"
                }`}
              >
                <span className="text-[10px] font-bold font-mono text-amber-400 uppercase block mb-0.5">
                  Capítulo {ch.chapterNumber}
                </span>
                <span className="text-xs font-bold line-clamp-2">{ch.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CAPÍTULOS E SEÇÕES */}
      <div className="space-y-8">
        {ebook.chapters
          .filter((ch) => !activeChapterId || activeChapterId === ch.id)
          .map((ch) => (
            <div key={ch.id} className="p-6 md:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              {/* Cabeçalho do Capítulo */}
              <div className="border-b border-slate-800 pb-5 space-y-2">
                <div className="inline-flex items-center gap-2 font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                    CAPÍTULO {ch.chapterNumber}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">{ch.title}</h2>
                {ch.subtitle && <p className="text-sm font-medium text-slate-400">{ch.subtitle}</p>}
              </div>

              {/* Introdução do Capítulo */}
              {ch.introduction && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-sm italic leading-relaxed">
                  "{ch.introduction}"
                </div>
              )}

              {/* Seções de Conteúdo */}
              <div className="space-y-6">
                {ch.sections.map((sec) => (
                  <div key={sec.id} className="space-y-3">
                    {sec.title && <h3 className="text-lg font-bold text-white flex items-center gap-2">{sec.title}</h3>}

                    {/* Renderização condicional conforme tipo de bloco */}
                    {sec.type === "text" && (
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{sec.content}</p>
                    )}

                    {sec.type === "callout" && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-600/10 border-l-4 border-amber-500 text-slate-100 text-sm space-y-1">
                        {sec.calloutTitle && <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">{sec.calloutTitle}</h4>}
                        <p className="text-slate-200 leading-relaxed">{sec.content}</p>
                      </div>
                    )}

                    {sec.type === "quote" && (
                      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 my-4">
                        <Quote className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                        <p className="text-base md:text-lg font-serif italic text-amber-200">"{sec.content}"</p>
                        {sec.quoteAuthor && <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">— {sec.quoteAuthor}</span>}
                      </div>
                    )}

                    {sec.type === "checklist" && (
                      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          <span>{sec.content}</span>
                        </p>
                        {sec.checklistItems && (
                          <div className="space-y-2 pt-1">
                            {sec.checklistItems.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                                <div className="w-4 h-4 rounded border border-amber-500/60 bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                  ✓
                                </div>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {sec.type === "step-by-step" && (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {sec.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quadro final Key Takeaways */}
              {ch.summaryTakeaways && ch.summaryTakeaways.length > 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Resumo Executivo (Key Takeaways)</span>
                  </div>
                  <ul className="space-y-2 pl-2">
                    {ch.summaryTakeaways.map((tk, idx) => (
                      <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{tk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* CONTRACAPA COMERCIALE & BIO DO AUTOR */}
      <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-500/40 shadow-2xl space-y-6 text-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-800">
          {ebook.authorAvatarUrl ? (
            <img src={ebook.authorAvatarUrl} alt={ebook.authorName} className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shrink-0 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-2xl shrink-0">
              {ebook.authorName.charAt(0)}
            </div>
          )}
          <div className="text-center md:text-left space-y-1.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Sobre o Autor(a)</span>
            <h3 className="text-xl font-black text-white">{ebook.authorName}</h3>
            {ebook.authorBio && <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{ebook.authorBio}</p>}
          </div>
        </div>

        {/* CTA do Ecossistema */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center space-y-4">
          <h4 className="text-base font-black text-white uppercase tracking-tight">
            Aprofunde seus Resultados com o Ecossistema Montanha
          </h4>
          {ebook.callToActionText && <p className="text-xs text-slate-300 max-w-md mx-auto">{ebook.callToActionText}</p>}

          {ebook.callToActionUrl && (
            <a
              href={ebook.callToActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{ebook.callToActionButtonLabel || "Acessar Plataforma"}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
