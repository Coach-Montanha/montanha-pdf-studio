import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { EbookPresetStyle, EbookProject, EbookOutlineResult } from "../../types/ebook";
import { EBOOK_PRESETS_INFO, saveEbookProject, getStoredEbooks, deleteEbookProject, exportEbookToFile, exportEbookToHtml } from "../../lib/ebook-templates";
import { generateEbookOutline, generateFullEbookProject } from "../../services/ebook-ai-service";
import { EbookViewer } from "./EbookViewer";
import { BookOpen, Sparkles, Wand2, ArrowLeft, Check, Layers, User, Library, Trash2, Download, FileCode, Printer, Plus } from "lucide-react";

interface EbookStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEbook?: (ebook: EbookProject) => void;
}

export const EbookStudioModal: React.FC<EbookStudioModalProps> = ({ isOpen, onClose, onSelectEbook }) => {
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const [step, setStep] = useState<"configure" | "outline" | "view">("configure");
  const [topic, setTopic] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("Coach Montanha");
  const [chapterCount, setChapterCount] = useState<number>(5);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [presetStyle, setPresetStyle] = useState<EbookPresetStyle>("practical-guide");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [outline, setOutline] = useState<EbookOutlineResult | null>(null);
  const [generatedEbook, setGeneratedEbook] = useState<EbookProject | null>(null);
  const [storedEbooks, setStoredEbooks] = useState<EbookProject[]>([]);

  const refreshLibrary = () => {
    setStoredEbooks(getStoredEbooks());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleChanged = () => refreshLibrary();
    window.addEventListener("montanha-ebooks-changed", handleChanged);
    return () => window.removeEventListener("montanha-ebooks-changed", handleChanged);
  }, []);

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await generateEbookOutline({
        topic,
        presetStyle,
        chapterCount,
        customPrompt,
      });
      setOutline(res);
      setStep("outline");
    } catch (err) {
      console.error("Erro ao gerar outline de E-book:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFullEbook = async () => {
    if (!outline) return;
    setIsGenerating(true);
    try {
      const ebook = await generateFullEbookProject(outline, authorName, presetStyle);
      saveEbookProject(ebook);
      setGeneratedEbook(ebook);
      setStep("view");
      refreshLibrary();
      if (onSelectEbook) onSelectEbook(ebook);
    } catch (err) {
      console.error("Erro ao gerar E-book completo:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este e-book?")) {
      deleteEbookProject(id);
      refreshLibrary();
    }
  };

  const handleOpenFromLibrary = (ebook: EbookProject) => {
    setGeneratedEbook(ebook);
    setStep("view");
    setActiveTab("create");
    if (onSelectEbook) onSelectEbook(ebook);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-6 font-sans bg-slate-950/95 text-slate-100 border border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] backdrop-blur-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ESTÚDIO CRIADOR DE E-BOOKS IA</span>
            </span>

            {/* TABS NAVEGAÇÃO INTERNA */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "create"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Criar Novo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "library"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Acervo ({storedEbooks.length})</span>
              </button>
            </div>
          </div>

          <DialogTitle className="text-xl md:text-2xl font-black text-white flex items-center gap-2 mt-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Gerador Automático de E-books</span>
          </DialogTitle>
        </DialogHeader>

        {/* TAB ACERVO DE E-BOOKS */}
        {activeTab === "library" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                E-books Salvos no Banco de Dados
              </h3>
              <Button
                size="sm"
                onClick={() => {
                  setStep("configure");
                  setActiveTab("create");
                }}
                className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo E-book</span>
              </Button>
            </div>

            {storedEbooks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Nenhum e-book salvo ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storedEbooks.map((eb) => (
                  <div
                    key={eb.id}
                    onClick={() => handleOpenFromLibrary(eb)}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          {eb.categoryTag || "E-BOOK"}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 line-clamp-2">{eb.title}</h4>
                      </div>
                      <button
                        onClick={(e) => handleDelete(eb.id, e)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition opacity-80 group-hover:opacity-100"
                        title="Excluir E-book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{eb.subtitle}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{eb.chapters?.length || 0} Capítulos</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportEbookToFile(eb);
                          }}
                          className="h-7 px-2 text-[10px] text-slate-300 hover:text-amber-400"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          .JSON
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportEbookToHtml(eb);
                          }}
                          className="h-7 px-2 text-[10px] text-slate-300 hover:text-blue-400"
                        >
                          <FileCode className="w-3 h-3 mr-1" />
                          .HTML
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CRIAR / VISUALIZAR E-BOOK */}
        {activeTab === "create" && (
          <>
            {/* PASSO 1: CONFIGURAÇÃO */}
            {step === "configure" && (
              <form onSubmit={handleGenerateOutline} className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span>Qual o tema ou assunto do seu E-book?</span>
                  </Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Guia de Nutrição & Alta Performance para Atletas de CrossFit"
                    required
                    className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl focus:border-amber-500 h-12"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Nome do Autor(a) / Marca</span>
                    </Label>
                    <Input
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ex: Coach Rafael Montanha"
                      className="bg-slate-900 border-slate-800 text-slate-100 text-sm rounded-xl focus:border-amber-500 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Número de Capítulos</span>
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 5, 7, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setChapterCount(num)}
                          className={`h-11 rounded-xl font-bold text-xs transition border cursor-pointer ${
                            chapterCount === num
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/40"
                          }`}
                        >
                          {num} Cap.
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ESPAÇO DE PROMPT E REFERÊNCIAS */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Instruções da IA, Referências & Direcionamento de Conteúdo (Prompt)</span>
                  </Label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    placeholder="Adicione referências, tom de voz desejado, pontos obrigatórios ou fontes que a IA deve utilizar na geração..."
                    className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500"
                  />
                </div>

                {/* SELEÇÃO DE PRESET EDITORIAL */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Selecione o Estilo Editorial do E-book</span>
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.keys(EBOOK_PRESETS_INFO) as EbookPresetStyle[]).map((key) => {
                      const info = EBOOK_PRESETS_INFO[key];
                      const isSelected = presetStyle === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setPresetStyle(key)}
                          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg"
                              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-amber-500/40"
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 uppercase block w-fit">
                            {info.badge}
                          </span>
                          <h4 className="text-sm font-bold text-white">{info.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{info.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{isGenerating ? "Estruturando Sumário com IA..." : "Gerar Sumário & Capítulos"}</span>
                </Button>
              </form>
            )}

            {/* PASSO 2: REVISÃO DO SUMÁRIO */}
            {step === "outline" && outline && (
              <div className="space-y-6 pt-2">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">Sugestão Editorial de IA</span>
                  <h3 className="text-lg font-black text-white">{outline.title}</h3>
                  <p className="text-xs text-slate-300">{outline.subtitle}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Capítulos Planejados ({outline.chapters.length})</h4>
                  <div className="space-y-2">
                    {outline.chapters.map((ch) => (
                      <div key={ch.number} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="font-mono text-[10px] font-bold text-amber-400 block uppercase">
                          Capítulo {ch.number}
                        </span>
                        <h5 className="text-sm font-bold text-white">{ch.title}</h5>
                        <p className="text-xs text-slate-400">{ch.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <Button
                    variant="ghost"
                    onClick={() => setStep("configure")}
                    className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar e Ajustar</span>
                  </Button>

                  <Button
                    onClick={handleGenerateFullEbook}
                    disabled={isGenerating}
                    className="h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGenerating ? "Escrevendo E-book Completo..." : "Construir E-book Completo"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* PASSO 3: VISUALIZAÇÃO DO E-BOOK PRONTO */}
            {step === "view" && generatedEbook && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>E-book gerado e salvo com sucesso! Baixe em .JSON, .HTML ou Imprima em PDF.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStep("configure")}
                    className="h-7 text-xs text-amber-400 hover:text-amber-300"
                  >
                    + Novo E-book
                  </Button>
                </div>

                <EbookViewer ebook={generatedEbook} />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
