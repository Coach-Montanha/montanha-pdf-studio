import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import { MagazineProject, Article, MagazineLayoutMode } from "../types/magazine";
import { INITIAL_MAGAZINE_PROJECT, MAGAZINE_THEMES } from "../lib/sample-data";
import { APP_UI_THEMES, AppUiThemeMode } from "../lib/ui-theme";
import { loadLatestProject, syncProjectToCloud, recoverLegacyLovableDatabase } from "../lib/cloud-sync";
import { MagazineViewer } from "../components/magazine/MagazineViewer";
import { CoverCustomizer } from "../components/editor/CoverCustomizer";
import { ArticleEditorModal } from "../components/editor/ArticleEditorModal";
import { EditorialSettings } from "../components/editor/EditorialSettings";
import { MagazineSettings } from "../components/editor/MagazineSettings";
import { AiStudioDialog } from "../components/editor/AiStudioDialog";
import { PdfExportModal } from "../components/export/PdfExportModal";
import { MockupStudioModal } from "../components/mockup/MockupStudioModal";
import { CloudSyncDialog } from "../components/sync/CloudSyncDialog";
import { getActiveMagazinePages } from "../lib/magazine-pages";
import { PwaInstallPrompt } from "../components/pwa/PwaInstallPrompt";
import { ContentRepositoryView } from "../components/repository/ContentRepositoryView";
import { ImportFromRepositoryModal } from "../components/repository/ImportFromRepositoryModal";
import { AiApprovalModal } from "../components/repository/AiApprovalModal";
import { PdfImportModal } from "../components/repository/PdfImportModal";
import { AuthModal } from "../components/auth/AuthModal";
import { SubscriptionModal } from "../components/subscription/SubscriptionModal";
import { EbookStudioModal } from "../components/ebook/EbookStudioModal";
import { EditionsArchiveView } from "../components/archive/EditionsArchiveView";
import { getArchivedEditions } from "../lib/editions-archive";
import { getCurrentUser, logoutUser, UserProfile } from "../lib/auth-state";
import { analyzeAndDiagramEditorialText, EditorialAnalysisResult } from "../lib/ai-service";
import { formatPageNumber, countWords, getEffectiveArticlePageSpan, calculateRequiredArticlePages } from "../lib/magazine-utils";
import { RepositoryDocument } from "../types/magazine";
import { getGoogleDriveStatus } from "../lib/google-drive-sync";
import {
  Sparkles,
  BookOpen,
  FileText,
  Palette,
  Feather,
  Printer,
  Plus,
  Wand2,
  RotateCcw,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  Clock,
  Settings,
  Cloud,
  FolderOpen,
  FolderArchive,
  Copy,
  Layers,
  Search,
  LogIn,
  LogOut,
  Globe,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [project, setProject] = useState<MagazineProject>(INITIAL_MAGAZINE_PROJECT);
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  // UI Theme state (Defaulting to contrast-white for crisp black on white readability)
  const [uiThemeMode, setUiThemeMode] = useState<AppUiThemeMode>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("montanha_ui_theme") as AppUiThemeMode;
      if (savedTheme && APP_UI_THEMES.some((t) => t.id === savedTheme)) {
        return savedTheme;
      }
    }
    return "contrast-white";
  });

  const [activeTab, setActiveTab] = useState<"viewer" | "articles" | "repository" | "cover" | "editorial" | "archive" | "settings">("viewer");

  // Microkit SpotlightIndicator Refs & Effect
  const spotlightNavRef = useRef<HTMLDivElement>(null);
  const spotlightBarRef = useRef<HTMLSpanElement>(null);
  const spotlightButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const nav = spotlightNavRef.current;
    const bar = spotlightBarRef.current;
    const button = spotlightButtonRefs.current[activeTab];
    if (!nav || !bar || !button) return;
    const navRect = nav.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    bar.style.left = `${buttonRect.left - navRect.left + 4}px`;
    bar.style.width = `${buttonRect.width - 8}px`;
    bar.style.top = `${buttonRect.top - navRect.top + 4}px`;
    bar.style.height = `${buttonRect.height - 8}px`;
  }, [activeTab]);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState<boolean>(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<MagazineLayoutMode>("print");
  const [isMockupStudioOpen, setIsMockupStudioOpen] = useState<boolean>(false);
  const [isEbookStudioOpen, setIsEbookStudioOpen] = useState<boolean>(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);
  const [isPdfRouterOpen, setIsPdfRouterOpen] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>("Sincronizado");
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getGoogleDriveStatus().isConnected;
  });

  useEffect(() => {
    const handleGdriveStatus = () => {
      setIsDriveConnected(getGoogleDriveStatus().isConnected);
    };
    window.addEventListener("montanha-gdrive-status-changed", handleGdriveStatus);
    return () => window.removeEventListener("montanha-gdrive-status-changed", handleGdriveStatus);
  }, []);

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>("");

  // Dual Workspace Mode State (Magazine Studio vs E-books Studio)
  const [workspaceMode, setWorkspaceMode] = useState<"magazine" | "ebooks">("magazine");

  const handleRecoverLovableDb = () => {
    const result = recoverLegacyLovableDatabase();
    alert(`Varredura do Banco de Dados Concluída!\n\n• Chaves analisadas no navegador: ${result.keysScanned}\n• Revistas/Projetos identificados: ${result.projectsRecovered}\n• E-books identificados: ${result.ebooksRecovered}\n• Artigos identificados: ${result.articlesRecovered}`);
  };

  // Editions Archive Count State
  const [archivedEditionsCount, setArchivedEditionsCount] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return getArchivedEditions().length;
  });

  useEffect(() => {
    const handleArchiveSync = () => {
      setArchivedEditionsCount(getArchivedEditions().length);
    };
    window.addEventListener("montanha-archive-changed", handleArchiveSync);
    return () => window.removeEventListener("montanha-archive-changed", handleArchiveSync);
  }, []);

  // User Auth & PRO Subscription State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return getCurrentUser();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !getCurrentUser();
  });
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      setIsAuthModalOpen(true);
    }
    const handleAuthSync = () => {
      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
      if (!updatedUser) {
        setIsAuthModalOpen(true);
      }
    };
    window.addEventListener("montanha-auth-changed", handleAuthSync);
    return () => window.removeEventListener("montanha-auth-changed", handleAuthSync);
  }, []);

  // Repository Import State
  const [isImportFromRepoOpen, setIsImportFromRepoOpen] = useState<boolean>(false);
  const [repoAnalysisResult, setRepoAnalysisResult] = useState<EditorialAnalysisResult | null>(null);
  const [selectedRepoDoc, setSelectedRepoDoc] = useState<RepositoryDocument | null>(null);
  const [isRepoApprovalOpen, setIsRepoApprovalOpen] = useState<boolean>(false);
  const [isRepoAnalyzing, setIsRepoAnalyzing] = useState<boolean>(false);

  // Initial Load from Cloud API / URL / Local Storage
  useEffect(() => {
    loadLatestProject()
      .then((loaded) => {
        if (loaded) {
          setProject(loaded);
        }
      })
      .catch((err) => {
        console.warn("Erro ao carregar projeto inicial:", err);
      })
      .finally(() => {
        setIsInitialLoaded(true);
      });
  }, []);

  // Sync project to Cloud + LocalStorage on every modification
  useEffect(() => {
    if (!isInitialLoaded) return;

    setSaveStatus("Salvando...");
    const timer = setTimeout(() => {
      syncProjectToCloud(project).then((res) => {
        if (res?.mode === "google-drive") {
          setSaveStatus("Drive Sincronizado");
        } else if (res?.success) {
          setSaveStatus("Nuvem Sincronizada");
        } else {
          setSaveStatus("Salvo Localmente");
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [project, isInitialLoaded]);

  // Listen to window focus to re-sync if changed on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      loadLatestProject().then((latest) => {
        if (latest && latest.updatedAt && latest.updatedAt !== project.updatedAt) {
          setProject(latest);
        }
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [project.updatedAt]);

  // Active App Theme Config
  const activeUiTheme =
    APP_UI_THEMES.find((t) => t.id === uiThemeMode) || APP_UI_THEMES[0]!;

  // Sync theme class to document body so portals and dialogs inherit theme variables
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.className = activeUiTheme.className;
    }
  }, [uiThemeMode, activeUiTheme]);

  // Save UI Theme to localStorage
  const handleSelectUiTheme = (mode: AppUiThemeMode) => {
    setUiThemeMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("montanha_ui_theme", mode);
    }
  };

  // Active Publication Theme
  const currentPublicationTheme =
    MAGAZINE_THEMES.find((t) => t.id === project.themeId) || MAGAZINE_THEMES[0]!;

  const handleResetToSample = () => {
    if (window.confirm("Deseja restaurar a revista de exemplo padrão? Suas alterações atuais serão substituídas.")) {
      const reset = {
        ...INITIAL_MAGAZINE_PROJECT,
        updatedAt: new Date().toISOString(),
      };
      setProject(reset);
      syncProjectToCloud(reset);
    }
  };

  const handleSaveArticle = (updatedArticle: Article) => {
    const exists = project.articles.some((a) => a.id === updatedArticle.id);
    let updatedArticles: Article[];
    if (exists) {
      updatedArticles = project.articles.map((a) =>
        a.id === updatedArticle.id ? updatedArticle : a
      );
    } else {
      updatedArticles = [...project.articles, updatedArticle];
    }

    setProject({
      ...project,
      articles: updatedArticles,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteArticle = (id: string) => {
    const art = project.articles.find((a) => a.id === id);
    if (art) {
      setArticleToDelete(art);
    }
  };

  const handleConfirmDeleteArticle = () => {
    if (!articleToDelete) return;
    const targetId = articleToDelete.id;
    const updatedArticles = project.articles.filter((a) => a.id !== targetId);

    // Reverte automaticamente o documento correspondente no repositório de volta para "draft"
    const updatedRepository = project.contentRepository?.map((doc) => {
      const isMatch =
        (articleToDelete.sourceDocId && doc.id === articleToDelete.sourceDocId) ||
        doc.title.toLowerCase().trim() === articleToDelete.title.toLowerCase().trim();
      if (isMatch) {
        return {
          ...doc,
          status: "draft" as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return doc;
    });

    const updatedProj: MagazineProject = {
      ...project,
      articles: updatedArticles,
      contentRepository: updatedRepository,
      updatedAt: new Date().toISOString(),
    };
    setProject(updatedProj);
    syncProjectToCloud(updatedProj);
    setArticleToDelete(null);
  };

  const handleDuplicateArticle = (sourceArticle: Article) => {
    const cloned: Article = {
      ...JSON.parse(JSON.stringify(sourceArticle)),
      id: "art-" + Date.now(),
      title: `${sourceArticle.title} (CÓPIA)`,
    };
    const idx = project.articles.findIndex((a) => a.id === sourceArticle.id);
    const updatedArticles = [...project.articles];
    if (idx >= 0) {
      updatedArticles.splice(idx + 1, 0, cloned);
    } else {
      updatedArticles.push(cloned);
    }
    setProject({
      ...project,
      articles: updatedArticles,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleArticleEnabled = (id: string) => {
    setProject({
      ...project,
      articles: project.articles.map((a) =>
        a.id === id ? { ...a, enabled: a.enabled === false ? true : false } : a
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMoveArticle = (idx: number, direction: "up" | "down") => {
    const newArticles = [...project.articles];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newArticles.length) return;

    const temp = newArticles[idx]!;
    newArticles[idx] = newArticles[targetIdx]!;
    newArticles[targetIdx] = temp;

    setProject({
      ...project,
      articles: newArticles,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleOpenNewArticle = () => {
    setEditingArticle(null);
    setIsArticleModalOpen(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setIsArticleModalOpen(true);
  };

  // Repository Import Handlers
  const handleImportWithAiFromRepo = async (doc: RepositoryDocument) => {
    setIsRepoAnalyzing(true);
    setSelectedRepoDoc(doc);
    try {
      const result = await analyzeAndDiagramEditorialText(doc.rawContent, {
        originalTitle: doc.title,
        ...(doc.category ? { originalCategory: doc.category } : {}),
      });
      setRepoAnalysisResult(result);
      setIsRepoApprovalOpen(true);
    } catch (err: any) {
      alert("Erro na análise por IA: " + err.message);
    } finally {
      setIsRepoAnalyzing(false);
    }
  };

  const handleImportDirectFromRepo = (doc: RepositoryDocument) => {
    const newArt: Article = {
      id: "art-" + Date.now(),
      sourceDocId: doc.id,
      title: doc.title,
      subtitle: `Artigo importado do acervo editorial // ${doc.category || "Alta Performance"}.`,
      category: doc.category || "MONTANHA METHOD",
      author: "Coach Montanha",
      authorBio: "Master Coach & Fundador",
      authorPhoto: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80",
      heroImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      heroImageCaption: "Foto editorial // Montanha Media",
      content: doc.rawContent,
      pullQuotes: [],
      keyTakeaways: [],
      layoutTemplate: doc.wordCount > 650 ? "editorial-lead" : "two-column-quote",
      pageSpan: calculateRequiredArticlePages({
        content: doc.rawContent,
        heroImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      } as any),
      quotePlacement: "end",
      textDensity: "normal",
      tags: [doc.category || "Geral", "Alta Performance"],
      estimatedReadTime: Math.max(1, Math.round(doc.wordCount / 130)),
      featuredOnCover: false,
      enabled: true,
    };

    const updatedArticles = [...project.articles, newArt];
    const updatedDocs = project.contentRepository
      ? project.contentRepository.map((d) => (d.id === doc.id ? { ...d, status: "published" as const, updatedAt: new Date().toISOString() } : d))
      : [];

    const updatedProj: MagazineProject = {
      ...project,
      articles: updatedArticles,
      contentRepository: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    setProject(updatedProj);
    syncProjectToCloud(updatedProj);
    setActiveTab("articles");
  };

  const handleApproveRepoArticle = (approvedArt: Article, sourceDocId?: string) => {
    const finalDocId = sourceDocId || approvedArt.sourceDocId || selectedRepoDoc?.id;
    const artWithSource: Article = {
      ...approvedArt,
      sourceDocId: finalDocId,
    };
    const updatedArticles = [...project.articles, artWithSource];
    const updatedDocs = finalDocId && project.contentRepository
      ? project.contentRepository.map((d) => (d.id === finalDocId ? { ...d, status: "published" as const, updatedAt: new Date().toISOString() } : d))
      : project.contentRepository;

    const updatedProj: MagazineProject = {
      ...project,
      articles: updatedArticles,
      contentRepository: updatedDocs ?? [],
      updatedAt: new Date().toISOString(),
    };

    setProject(updatedProj);
    syncProjectToCloud(updatedProj);
    setActiveTab("articles");
  };

  const activePages = getActiveMagazinePages({
    project,
    theme: currentPublicationTheme,
    layoutMode,
  });

  const totalPages = Math.max(1, activePages.length);

  return (
    <div
      data-hydrated={isInitialLoaded ? "true" : "false"}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 theme-app-shell ${activeUiTheme.className}`}
    >
      {/* Top Application Header / Studio Navbar */}
      <header className="no-print sticky top-0 z-50 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 transition-colors theme-app-header border-b-2 shadow-sm">
        {/* Brand & Issue Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md border-2 border-black">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base tracking-tight uppercase">
                MONTANHA PDF STUDIO
              </h1>
              <span className="bg-amber-400 text-black text-[9px] font-mono font-black px-2 py-0.5 rounded border border-black uppercase hidden sm:inline">
                {project.editionNumber ? `ED. #${project.editionNumber}` : "VIRTUAL"}
              </span>
            </div>
            <p className="text-[11px] opacity-75 font-semibold">
              Diagramação Editorial & Publicações de Alto Nível com IA
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status */}
          <Button
            size="sm"
            data-testid="btn-open-cloud-sync"
            onClick={() => setIsCloudSyncOpen(true)}
            className="h-8 sm:h-9 px-2.5 theme-app-card hover:opacity-90 border-2 border-current font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer relative"
            title={
              isDriveConnected
                ? `Google Drive Conectado em Tempo Real — ${saveStatus}`
                : saveStatus
                ? `Sincronização em Nuvem: ${saveStatus}`
                : "Sincronização em Nuvem & Compartilhamento"
            }
            aria-label="Sincronização em Nuvem"
          >
            <Cloud className="w-4 h-4 text-amber-500" />
            {isDriveConnected ? (
              <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Drive Conectado
              </span>
            ) : (
              <span className="text-[10px] font-mono hidden md:inline opacity-70">
                {saveStatus}
              </span>
            )}
          </Button>

          {/* Gerador Automático de E-books com IA */}
          <Button
            size="sm"
            onClick={() => setIsEbookStudioOpen(true)}
            className="h-8 sm:h-9 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs border-2 border-black flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Construir livros digitais e guias práticos em formato E-book com IA"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Criar E-book</span>
            <span className="sm:hidden">E-book</span>
          </Button>

          {/* Gerador de Mockups de Divulgação com IA */}
          <Button
            size="sm"
            onClick={() => setIsMockupStudioOpen(true)}
            className="h-8 sm:h-9 bg-black text-amber-400 hover:bg-zinc-900 border-2 border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Criar mockups comerciais da revista para Instagram e redes sociais com IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Mockups com IA</span>
            <span className="sm:hidden">Mockup</span>
          </Button>

          {/* Importação Inteligente de PDFs com Router */}
          <Button
            size="sm"
            data-testid="btn-header-pdf-import"
            onClick={() => setIsPdfRouterOpen(true)}
            className="h-8 sm:h-9 bg-zinc-950 text-amber-400 hover:bg-zinc-900 border-2 border-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Importar PDFs (artigos, revistas, protocolos) com o pdf-conversion-router"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Importar PDF</span>
            <span className="md:hidden">PDF</span>
          </Button>

          <Button
            size="sm"
            data-testid="btn-export-pdf"
            onClick={() => setIsExportModalOpen(true)}
            className="h-8 sm:h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md border-2 border-black flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </Button>

          {/* User Auth Profile / Login Trigger */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-current/20">
              <div
                data-testid="user-profile-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-current/15 text-xs font-bold"
                title={`Logado como ${currentUser.name} (${currentUser.email})`}
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[10px]">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.name}</span>
              </div>

              {currentUser.isPro ? (
                <span
                  data-testid="badge-pro-status"
                  className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase border border-amber-600 shadow-xs"
                >
                  PRO
                </span>
              ) : (
                <Button
                  size="sm"
                  data-testid="btn-upgrade-pro"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="h-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-2.5 rounded-lg shadow-sm cursor-pointer"
                  title="Upgrade para o plano PRO"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Assinar PRO</span>
                  <span className="sm:hidden">PRO</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                data-testid="btn-logout"
                onClick={() => {
                  logoutUser();
                  setCurrentUser(null);
                }}
                className="h-8 px-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                title="Desconectar da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline ml-1">Sair</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-current/20">
              <Button
                size="sm"
                data-testid="btn-auth-trigger"
                onClick={() => setIsAuthModalOpen(true)}
                className="h-8 sm:h-9 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/50 font-bold text-xs px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Fazer Login ou Cadastrar no Montanha PDF Studio"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrar</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Subheader Navigation Tabs & Dual Workspace Switcher */}
      <div className="no-print px-4 sm:px-6 flex items-center justify-between overflow-x-auto custom-scrollbar transition-colors theme-app-subnav border-b-2 shadow-xs">
        <div className="flex items-center gap-2 shrink-0">
          {/* DUAL WORKSPACE MODE BUTTONS */}
          <div className="flex items-center gap-1.5 pr-3 my-1 border-r border-current/20 shrink-0">
            <button
              onClick={() => setWorkspaceMode("magazine")}
              className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1.5 cursor-pointer border-2 ${
                workspaceMode === "magazine"
                  ? "bg-amber-400 text-slate-950 border-black shadow-xs"
                  : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
              }`}
              title="Alternar para a Área de Trabalho da Revista"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Estúdio da Revista 📰</span>
            </button>

            <button
              onClick={() => setWorkspaceMode("ebooks")}
              className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1.5 cursor-pointer border-2 ${
                workspaceMode === "ebooks"
                  ? "bg-amber-400 text-slate-950 border-black shadow-xs"
                  : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
              }`}
              title="Alternar para a Área de Trabalho dos E-books"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Estúdio de E-books 📚</span>
            </button>
          </div>

          {/* MAGAZINE WORKSPACE TABS */}
          {workspaceMode === "magazine" && (
            <div ref={spotlightNavRef} className="relative flex items-center gap-1 sm:gap-2 py-1.5">
              <span ref={spotlightBarRef} className="pointer-events-none absolute rounded-md bg-amber-500/30 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,.6)] transition-[left,width,top,height] duration-300 ease-[cubic-bezier(.4,0,.2,1)]" />
              <button
                ref={(el) => { spotlightButtonRefs.current["viewer"] = el; }}
                data-testid="tab-viewer"
                onClick={() => setActiveTab("viewer")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "viewer"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Leitor & Preview Visual</span>
              </button>

              <button
                ref={(el) => { spotlightButtonRefs.current["articles"] = el; }}
                data-testid="tab-articles"
                onClick={() => setActiveTab("articles")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "articles"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Matérias & Artigos ({project.articles.length})</span>
              </button>

              <button
                ref={(el) => { spotlightButtonRefs.current["repository"] = el; }}
                data-testid="tab-repository"
                onClick={() => setActiveTab("repository")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "repository"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Acervo & Textos ({project.contentRepository?.length || 0})</span>
              </button>

              <button
                ref={(el) => { spotlightButtonRefs.current["cover"] = el; }}
                data-testid="tab-cover"
                onClick={() => setActiveTab("cover")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "cover"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Capa & Contracapa</span>
              </button>

              <button
                ref={(el) => { spotlightButtonRefs.current["editorial"] = el; }}
                data-testid="tab-editorial"
                onClick={() => setActiveTab("editorial")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "editorial"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Editorial & Páginas</span>
              </button>

              <button
                ref={(el) => { spotlightButtonRefs.current["archive"] = el; }}
                data-testid="tab-archive"
                onClick={() => setActiveTab("archive")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "archive"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <FolderArchive className="w-3.5 h-3.5 text-amber-500" />
                <span>Arquivo de Edições ({archivedEditionsCount})</span>
              </button>

              <button
                ref={(el) => { spotlightButtonRefs.current["settings"] = el; }}
                data-testid="tab-settings"
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-black rounded-lg transition-all border-2 cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-amber-400 text-slate-950 border-black shadow-sm"
                    : "border-transparent opacity-75 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurações</span>
              </button>
            </div>
          )}
        </div>

        {/* Right utility items */}
        <div className="hidden xl:flex items-center gap-3 text-xs opacity-80 shrink-0 ml-4">
          <Link
            to="/create"
            className="flex items-center gap-1 font-bold text-amber-500 hover:text-amber-400 transition-colors"
            title="Abrir Estúdio Criador com IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Criador IA</span>
          </Link>
          <button
            onClick={handleRecoverLovableDb}
            className="flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Resgatar artigos e revistas do banco de dados/versão anterior do navegador"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Resgatar Banco Legado 🔄</span>
          </button>
          <button
            onClick={() => setIsCloudSyncOpen(true)}
            className="flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            title="Abrir Central de Sincronização em Nuvem"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{saveStatus} ({totalPages} págs)</span>
          </button>
          <button
            onClick={handleResetToSample}
            className="flex items-center gap-1 font-bold hover:text-amber-600 transition-colors cursor-pointer"
            title="Recarregar revista modelo"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Modelo</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="no-print flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {/* WORKSPACE 2: ESTÚDIO DE E-BOOKS */}
        {workspaceMode === "ebooks" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="theme-app-card p-6 rounded-2xl border-2 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-current/20">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 uppercase tracking-wider">
                    ÁREA DE TRABALHO: ESTÚDIO DE E-BOOKS IA
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-amber-500" />
                    <span>Construção Automática de E-books & Livros Digitais</span>
                  </h2>
                  <p className="text-xs opacity-75 mt-1">
                    Defina o tema, escolha o número de capítulos (3, 5, 7 ou 10), adicione prompt de direcionamento e edite o texto e imagem pós-produção.
                  </p>
                </div>

                <Button
                  onClick={() => setIsEbookStudioOpen(true)}
                  className="h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-2 border-black flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Gerar / Abrir Acervo de E-books</span>
                </Button>
              </div>

              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 space-y-4">
                <BookOpen className="w-12 h-12 text-amber-500 mx-auto" />
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-black uppercase text-white">Estúdio Dedicado de E-books</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Crie e-books completos com auxílio de IA, configure a quantidade de capítulos (3 a 10), insira instruções personalizadas (prompts/referências), realize pós-produção visual e exporte em .JSON, .HTML e PDF.
                  </p>
                </div>
                <Button
                  onClick={() => setIsEbookStudioOpen(true)}
                  className="h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider px-6 rounded-xl shadow-lg border-2 border-black cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span>Iniciar Criador de E-books ou Acessar Acervo</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE 1: ESTÚDIO DA REVISTA (TABS DE EDICÃO) */}
        {workspaceMode === "magazine" && (
          <>
            {/* Tab 1: Interactive Magazine Viewer */}
            {activeTab === "viewer" && (
              <div className="h-[calc(100vh-140px)] min-h-[580px]">
                <MagazineViewer
                  project={project}
                  theme={currentPublicationTheme}
                  layoutMode={layoutMode}
                  onLayoutModeChange={setLayoutMode}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  onOpenArticleEditor={(id) => {
                    const art = project.articles.find((a) => a.id === id);
                    if (art) handleEditArticle(art);
                  }}
                />
              </div>
            )}

        {/* Tab 2: Articles Management */}
        {activeTab === "articles" && (
          <div className="space-y-6">
            <div className="theme-app-card p-5 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Matérias & Artigos da Edição
                </h2>
                <p className="text-xs opacity-75 mt-0.5">
                  Organize a sequência das páginas, adicione novos textos ou use a IA para redigir matérias completas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setIsImportFromRepoOpen(true)}
                  className="h-9 bg-black hover:bg-slate-900 text-white font-black text-xs flex items-center gap-1.5 border-2 border-black cursor-pointer shadow-xs"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Importar do Acervo ({project.contentRepository?.length || 0})</span>
                </Button>
                <Button
                  onClick={() => setIsAiStudioOpen(true)}
                  className="h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 border-2 border-black cursor-pointer shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Gerar Matéria com IA</span>
                </Button>
                <Button
                  variant="outline"
                  data-testid="btn-new-article"
                  onClick={handleOpenNewArticle}
                  className="h-9 font-bold text-xs flex items-center gap-1.5 border-2 border-current cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>Adicionar Manualmente</span>
                </Button>
              </div>
            </div>

            {/* Editorial Overview Statistics Bar */}
            {(() => {
              const activeArts = project.articles.filter((a) => a.enabled !== false);
              const totalWordsCount = activeArts.reduce(
                (acc, a) => acc + countWords(a.content),
                0
              );
              const totalReadTime = activeArts.reduce(
                (acc, a) => acc + (a.estimatedReadTime || 4),
                0
              );
              const totalMultiPages = activeArts.filter((a) => getEffectiveArticlePageSpan(a) > 1).length;
              const totalSinglePages = activeArts.filter((a) => getEffectiveArticlePageSpan(a) === 1).length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="theme-app-card-subtle p-3.5 rounded-xl border-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase opacity-75 block">
                      Total de Páginas Ativas
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-base sm:text-lg text-amber-600">
                      <Layers className="w-4 h-4" />
                      <span>{totalPages} Páginas A4</span>
                    </div>
                    <span className="text-[9px] opacity-60 block">
                      {totalSinglePages} simples + {totalMultiPages} estendidas
                    </span>
                  </div>

                  <div className="theme-app-card-subtle p-3.5 rounded-xl border-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase opacity-75 block">
                      Volume Editorial
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-base sm:text-lg text-amber-600">
                      <FileText className="w-4 h-4" />
                      <span>{totalWordsCount.toLocaleString("pt-BR")} palavras</span>
                    </div>
                    <span className="text-[9px] opacity-60 block">
                      Em {activeArts.length} matérias ativas
                    </span>
                  </div>

                  <div className="theme-app-card-subtle p-3.5 rounded-xl border-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase opacity-75 block">
                      Tempo de Leitura
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-base sm:text-lg text-amber-600">
                      <Clock className="w-4 h-4" />
                      <span>~{totalReadTime} min</span>
                    </div>
                    <span className="text-[9px] opacity-60 block">
                      Edição completa compilada
                    </span>
                  </div>

                  <div className="theme-app-card-subtle p-3.5 rounded-xl border-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase opacity-75 block">
                      Acervo de Rascunhos
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-base sm:text-lg text-amber-600">
                      <FolderOpen className="w-4 h-4" />
                      <span>{project.contentRepository?.length || 0} textos</span>
                    </div>
                    <span className="text-[9px] opacity-60 block">
                      Prontos para auto-diagramação
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Article Search Bar & Quick Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-xl border-2 theme-app-card-subtle">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={articleSearchQuery}
                  onChange={(e) => setArticleSearchQuery(e.target.value)}
                  placeholder="Buscar matérias por título, autor, categoria ou tag..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg theme-app-input border border-current/20 focus:outline-none focus:border-amber-500"
                />
              </div>
              {articleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setArticleSearchQuery("")}
                  className="text-[10px] font-mono font-bold text-amber-600 hover:underline shrink-0 cursor-pointer"
                >
                  Limpar busca
                </button>
              )}
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {(() => {
                const query = articleSearchQuery.toLowerCase().trim();
                const filtered = project.articles.filter((a) => {
                  if (!query) return true;
                  return (
                    a.title.toLowerCase().includes(query) ||
                    (a.subtitle && a.subtitle.toLowerCase().includes(query)) ||
                    a.category.toLowerCase().includes(query) ||
                    a.author.toLowerCase().includes(query) ||
                    (a.tags && a.tags.some((t) => t.toLowerCase().includes(query)))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center rounded-xl border-2 border-dashed theme-app-card-subtle opacity-75">
                      <p className="text-xs font-bold">Nenhuma matéria encontrada para "{articleSearchQuery}".</p>
                    </div>
                  );
                }

                return filtered.map((art) => {
                  const idx = project.articles.findIndex((a) => a.id === art.id);
                  const calculatedPageNum = activePages.findIndex((p) => p.id === art.id || p.id === `${art.id}-part1`) + 1;
                  const pageNum = calculatedPageNum > 0 ? calculatedPageNum : idx + 4;
                  const span = getEffectiveArticlePageSpan(art);
                  const isMulti = span > 1;
                  const isEnabled = art.enabled !== false;

                return (
                  <div
                    key={art.id}
                    data-testid="article-card"
                    className={`theme-app-card p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm ${
                      !isEnabled ? "opacity-50 bg-slate-100 border-slate-300" : ""
                    }`}
                  >
                    {/* Thumbnail & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {art.heroImage ? (
                        <img
                          src={art.heroImage}
                          alt={art.title}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-black shrink-0 filter contrast-125 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg theme-app-card-subtle flex items-center justify-center shrink-0 border-2 border-black">
                          <FileText className="w-6 h-6 opacity-60" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-amber-400 text-black text-[9px] font-mono font-black px-2 py-0.5 rounded border border-black uppercase">
                            {art.category}
                          </span>
                          <span className="text-[10px] font-mono font-black text-amber-600">
                            {isMulti
                              ? `PÁG. ${formatPageNumber(pageNum)}-${formatPageNumber(pageNum + span - 1)}`
                              : `PÁG. ${formatPageNumber(pageNum)}`}
                          </span>
                          {isMulti && (
                            <span className="bg-black text-amber-400 font-mono text-[8px] font-black px-1.5 py-0.2 rounded border border-black uppercase">
                              {span === 2 ? "PÁGINA DUPLA" : `${span} PÁGINAS`}
                            </span>
                          )}
                          <span className="text-[10px] opacity-75 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {art.estimatedReadTime} min
                          </span>
                        </div>
                        <h3 data-testid="article-card-title" className="font-black text-sm sm:text-base leading-tight">
                          {art.title}
                        </h3>
                        <p className="text-xs opacity-75 line-clamp-1 font-medium">
                          {art.subtitle || art.content.slice(0, 100)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-300">
                      {/* Move up / down */}
                      <button
                        type="button"
                        onClick={() => handleMoveArticle(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 opacity-70 hover:opacity-100 disabled:opacity-20 hover:bg-black/10 rounded cursor-pointer"
                        title="Mover para cima"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveArticle(idx, "down")}
                        disabled={idx === project.articles.length - 1}
                        className="p-1.5 opacity-70 hover:opacity-100 disabled:opacity-20 hover:bg-black/10 rounded cursor-pointer"
                        title="Mover para baixo"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>

                      {/* Duplicate Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateArticle(art)}
                        className="h-8 px-2.5 font-bold text-xs flex items-center gap-1 border-2 border-current cursor-pointer"
                        title="Duplicar Matéria / Clonar Template"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden lg:inline">Duplicar</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="btn-edit-article"
                        onClick={() => handleEditArticle(art)}
                        className="h-8 px-3 font-bold text-xs flex items-center gap-1 border-2 border-current cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-500" />
                        <span>Editar</span>
                      </Button>

                      <button
                        type="button"
                        data-testid="btn-delete-article"
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                        title="Excluir Matéria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
            </div>
          </div>
        )}

        {/* Tab: Content Repository & AI Ingestion */}
        {activeTab === "repository" && (
          <div className="max-w-6xl mx-auto">
            <ContentRepositoryView
              project={project}
              onUpdateProject={(updated) => {
                setProject(updated);
                syncProjectToCloud(updated);
              }}
              onOpenArticleEditor={(art) => {
                handleEditArticle(art);
                setActiveTab("articles");
              }}
              onNavigateToViewer={() => setActiveTab("viewer")}
              onNavigateToArticles={() => setActiveTab("articles")}
            />
          </div>
        )}

        {/* Tab 3: Cover & Back Cover Customizer */}
        {activeTab === "cover" && (
          <div className="max-w-4xl mx-auto">
            <CoverCustomizer
              coverConfig={project.coverConfig}
              backCoverConfig={project.backCoverConfig}
              articles={project.articles}
              pageVisibility={project.pageVisibility ?? {}}
              onChange={(updatedCover) =>
                setProject({ ...project, coverConfig: updatedCover, updatedAt: new Date().toISOString() })
              }
              onBackCoverChange={(updatedBackCover) =>
                setProject({ ...project, backCoverConfig: updatedBackCover, updatedAt: new Date().toISOString() })
              }
            />
          </div>
        )}

        {/* Tab 4: Editorial & Contributors */}
        {activeTab === "editorial" && (
          <div className="max-w-4xl mx-auto">
            <EditorialSettings
              project={project}
              onChange={(updatedProject) =>
                setProject({ ...updatedProject, updatedAt: new Date().toISOString() })
              }
            />
          </div>
        )}

        {/* Tab 5: Editions Archive */}
        {activeTab === "archive" && (
          <div className="max-w-5xl mx-auto">
            <EditionsArchiveView
              currentProject={project}
              onLoadEditionIntoStudio={(loadedProject) => {
                setProject({
                  ...loadedProject,
                  updatedAt: new Date().toISOString(),
                });
                setActiveTab("viewer");
              }}
            />
          </div>
        )}

        {/* Tab 6: Settings */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto">
            <MagazineSettings
              project={project}
              onChange={(updatedProject) =>
                setProject({ ...updatedProject, updatedAt: new Date().toISOString() })
              }
              currentUiTheme={uiThemeMode}
              onSelectUiTheme={handleSelectUiTheme}
            />
          </div>
        )}
        </>
        )}
      </main>

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthModalOpen}
        canClose={Boolean(currentUser)}
        onClose={() => {
          if (currentUser) {
            setIsAuthModalOpen(false);
          }
        }}
        onSuccess={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
        }}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={() => setCurrentUser(getCurrentUser())}
      />

      <ArticleEditorModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        article={editingArticle}
        onSave={handleSaveArticle}
        project={project}
      />

      <AiStudioDialog
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        onAddArticle={handleSaveArticle}
      />

      <PdfExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        theme={currentPublicationTheme}
        totalPages={totalPages}
        layoutMode={layoutMode}
        onSelectLayoutMode={setLayoutMode}
        onOpenMockupStudio={() => {
          setIsExportModalOpen(false);
          setIsMockupStudioOpen(true);
        }}
      />

      <MockupStudioModal
        isOpen={isMockupStudioOpen}
        onClose={() => setIsMockupStudioOpen(false)}
        project={project}
      />

      <CloudSyncDialog
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        project={project}
        onUpdateProject={(up) => setProject(up)}
      />

      <ImportFromRepositoryModal
        isOpen={isImportFromRepoOpen}
        onClose={() => setIsImportFromRepoOpen(false)}
        project={project}
        onImportWithAi={handleImportWithAiFromRepo}
        onImportDirect={handleImportDirectFromRepo}
        onNavigateToAcervo={() => setActiveTab("repository")}
      />

      <PdfImportModal
        isOpen={isPdfRouterOpen}
        onClose={() => setIsPdfRouterOpen(false)}
        project={project}
        onUpdateProject={(updated) => {
          setProject(updated);
          syncProjectToCloud(updated);
        }}
        onOpenArticleEditor={(art) => {
          setEditingArticle(art);
          setIsArticleModalOpen(true);
        }}
        onNavigateToViewer={() => setActiveTab("viewer")}
        onSuccessMessage={(msg) => setSaveStatus(msg)}
      />

      <AiApprovalModal
        isOpen={isRepoApprovalOpen}
        onClose={() => setIsRepoApprovalOpen(false)}
        analysis={repoAnalysisResult}
        sourceDoc={selectedRepoDoc}
        onApprove={handleApproveRepoArticle}
        onOpenAdvancedEditor={(draftArt) => {
          handleApproveRepoArticle(draftArt, selectedRepoDoc?.id);
          setEditingArticle(draftArt);
          setIsArticleModalOpen(true);
        }}
      />

      {/* Dialog de Confirmação de Exclusão de Matéria */}
      <Dialog open={Boolean(articleToDelete)} onOpenChange={() => setArticleToDelete(null)}>
        <DialogContent className="theme-app-card max-w-md p-5 font-sans border-2 border-black shadow-2xl">
          <DialogHeader className="border-b-2 pb-2.5">
            <DialogTitle className="text-base font-black flex items-center gap-2 text-red-600 uppercase">
              <Trash2 className="w-5 h-5" />
              <span>Excluir Matéria da Edição</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 text-xs space-y-2">
            <p className="opacity-90 leading-relaxed">
              Tem certeza que deseja excluir a matéria <strong>"{articleToDelete?.title}"</strong> da revista?
            </p>
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-700 dark:text-red-300 font-medium">
              Esta ação removerá a matéria e suas páginas diagramadas da edição atual. O texto original no acervo (se houver) permanecerá preservado.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArticleToDelete(null)}
              className="h-8 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDeleteArticle}
              className="h-8 bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-xs"
            >
              Sim, Excluir Matéria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal do Gerador de E-books com IA */}
      <EbookStudioModal
        isOpen={isEbookStudioOpen}
        onClose={() => setIsEbookStudioOpen(false)}
      />

      {/* Print-Only Container (Render ONLY active pages without blank sheets) */}
      <div className={`print-only-container ${layoutMode === "mobile" ? "print-layout-mobile" : "print-layout-print"}`}>
        {activePages.map((page, idx) => (
          <div key={page.id} className="magazine-print-page">
            {page.render(idx + 1, true)}
          </div>
        ))}
      </div>
    </div>
  );
}
