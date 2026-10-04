import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  FolderOpen,
  Palette,
  Feather,
  FolderArchive,
  Settings,
  Sparkles,
  Printer,
  RotateCcw,
  Cloud,
  Wand2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Database,
  Download,
  FileCode,
  Layers,
  LayoutGrid,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { UserProfile } from "../lib/auth-state";

interface StudioSidebarProps {
  workspaceMode: "magazine" | "ebooks";
  onWorkspaceModeChange: (mode: "magazine" | "ebooks") => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  articlesCount: number;
  repositoryCount: number;
  archiveCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAiStudio: () => void;
  onOpenMockupStudio: () => void;
  onOpenPdfRouter: () => void;
  onOpenExportPdf: () => void;
  onOpenCloudSync: () => void;
  onOpenEbookStudio: () => void;
  onRecoverLegacyDb: () => void;
  onResetToSample: () => void;
  saveStatus: string;
  isDriveConnected: boolean;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenSubscriptionModal: () => void;
  onLogout: () => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  workspaceMode,
  onWorkspaceModeChange,
  activeTab,
  onSelectTab,
  articlesCount,
  repositoryCount,
  archiveCount,
  isCollapsed,
  onToggleCollapse,
  onOpenAiStudio,
  onOpenMockupStudio,
  onOpenPdfRouter,
  onOpenExportPdf,
  onOpenCloudSync,
  onOpenEbookStudio,
  onRecoverLegacyDb,
  onResetToSample,
  saveStatus,
  isDriveConnected,
  currentUser,
  onOpenAuthModal,
  onOpenSubscriptionModal,
  onLogout,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(true);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <>
      {/* Botão de Menu Flutuante para Dispositivos Móveis */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-5 right-5 z-50 p-3.5 rounded-full bg-amber-500 text-slate-950 shadow-2xl border-2 border-black flex items-center justify-center"
        aria-label="Abrir Menu Lateral"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay Escuro para Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* PAINEL SIDEBAR GLASSMORPHISM */}
      <aside
        className={`no-print transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? "w-full md:w-20" : "w-full md:w-72"
        } ${
          isMobileOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 flex flex-col"
            : "hidden md:flex flex-col sticky top-16 h-[calc(100vh-80px)] z-20"
        } bg-slate-950/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.6)] p-3 text-slate-100 overflow-hidden selection:bg-amber-500 selection:text-black`}
      >
        {/* Cabeçalho da Sidebar & Toggle Collapse */}
        <div className="flex items-center justify-between p-2 pb-3 border-b border-slate-800/80">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                {workspaceMode === "magazine" ? "PAINEL REVISTA" : "PAINEL E-BOOKS"}
              </span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors border border-slate-800 ml-auto cursor-pointer"
            title={isCollapsed ? "Expandir Menu Lateral" : "Recolher Menu Lateral"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* SELETOR DE ESPAÇO DE TRABALHO (REVISTA vs E-BOOK) */}
        <div className="py-3 px-1 space-y-1.5 border-b border-slate-800/80">
          <button
            onClick={() => {
              onWorkspaceModeChange("magazine");
              if (isMobileOpen) setIsMobileOpen(false);
            }}
            className={`w-full p-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2.5 cursor-pointer border ${
              workspaceMode === "magazine"
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg"
                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-white"
            }`}
            title="Alternar para o Estúdio da Revista"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Estúdio da Revista 📰</span>}
          </button>

          <button
            onClick={() => {
              onWorkspaceModeChange("ebooks");
              if (isMobileOpen) setIsMobileOpen(false);
            }}
            className={`w-full p-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2.5 cursor-pointer border ${
              workspaceMode === "ebooks"
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg"
                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-white"
            }`}
            title="Alternar para o Estúdio de E-books"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            {!isCollapsed && <span className="truncate">Estúdio de E-books 📚</span>}
          </button>
        </div>

        {/* CORPO NAVEGÁVEL COM ROLAGEM SUAVE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-4 px-1">
          {/* MENU CONTEXTUAL 1: ESTÚDIO DA REVISTA */}
          {workspaceMode === "magazine" && (
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest px-2.5 block opacity-80">
                  Navegação da Edição
                </span>
              )}

              {/* Tab 1: Leitor */}
              <button
                data-testid="tab-viewer"
                onClick={() => {
                  onSelectTab("viewer");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2.5 cursor-pointer border ${
                  activeTab === "viewer"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Leitor & Preview Visual"
              >
                <BookOpen className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate">Leitor & Preview</span>}
              </button>

              {/* Tab 2: Matérias */}
              <button
                data-testid="tab-articles"
                onClick={() => {
                  onSelectTab("articles");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer border ${
                  activeTab === "articles"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Matérias & Artigos"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Matérias & Artigos</span>}
                </div>
                {!isCollapsed && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {articlesCount}
                  </span>
                )}
              </button>

              {/* Tab 3: Acervo */}
              <button
                data-testid="tab-repository"
                onClick={() => {
                  onSelectTab("repository");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer border ${
                  activeTab === "repository"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Acervo & Textos"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FolderOpen className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Acervo & Textos</span>}
                </div>
                {!isCollapsed && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {repositoryCount}
                  </span>
                )}
              </button>

              {/* Tab 4: Capa */}
              <button
                data-testid="tab-cover"
                onClick={() => {
                  onSelectTab("cover");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2.5 cursor-pointer border ${
                  activeTab === "cover"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Capa & Contracapa"
              >
                <Palette className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate">Capa & Contracapa</span>}
              </button>

              {/* Tab 5: Editorial */}
              <button
                data-testid="tab-editorial"
                onClick={() => {
                  onSelectTab("editorial");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2.5 cursor-pointer border ${
                  activeTab === "editorial"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Editorial & Páginas"
              >
                <Feather className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate">Editorial & Páginas</span>}
              </button>

              {/* Tab 6: Arquivo */}
              <button
                data-testid="tab-archive"
                onClick={() => {
                  onSelectTab("archive");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer border ${
                  activeTab === "archive"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Arquivo de Edições"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FolderArchive className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Arquivo de Edições</span>}
                </div>
                {!isCollapsed && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {archiveCount}
                  </span>
                )}
              </button>

              {/* Tab 7: Configurações */}
              <button
                data-testid="tab-settings"
                onClick={() => {
                  onSelectTab("settings");
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2.5 cursor-pointer border ${
                  activeTab === "settings"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
                title="Configurações da Revista"
              >
                <Settings className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate">Configurações</span>}
              </button>
            </div>
          )}

          {/* MENU CONTEXTUAL 2: ESTÚDIO DE E-BOOKS */}
          {workspaceMode === "ebooks" && (
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest px-2.5 block opacity-80">
                  Ferramentas E-book
                </span>
              )}

              <button
                onClick={() => {
                  onOpenEbookStudio();
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className="w-full p-2.5 rounded-xl font-bold text-xs bg-amber-500/20 border border-amber-500 text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-2.5 cursor-pointer"
                title="Criar Novo E-book com IA"
              >
                <Wand2 className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate font-black">Criar Novo E-book (IA)</span>}
              </button>

              <button
                onClick={() => {
                  onOpenEbookStudio();
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className="w-full p-2.5 rounded-xl font-bold text-xs bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2.5 cursor-pointer"
                title="Abrir Acervo de E-books"
              >
                <BookOpen className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span className="truncate">Acervo de E-books</span>}
              </button>
            </div>
          )}

          {/* SUB-MENU ACCORDION: FERRAMENTAS COM IA & EXPORTAÇÃO */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            {!isCollapsed ? (
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold text-slate-400 hover:text-amber-400 uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span>Ferramentas & IA</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isToolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(isToolsOpen || isCollapsed) && (
              <div className="space-y-1 pl-1">
                {/* Criador IA */}
                <button
                  onClick={() => {
                    onOpenAiStudio();
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-300 transition flex items-center gap-2.5 cursor-pointer"
                  title="Gerar Matéria com IA"
                >
                  <Wand2 className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Matéria com IA</span>}
                </button>

                {/* Mockups IA */}
                <button
                  onClick={() => {
                    onOpenMockupStudio();
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-300 transition flex items-center gap-2.5 cursor-pointer"
                  title="Criar Mockups de Divulgação"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Mockups com IA</span>}
                </button>

                {/* Importar PDF */}
                <button
                  data-testid="btn-header-pdf-import"
                  onClick={() => {
                    onOpenPdfRouter();
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-amber-300 transition flex items-center gap-2.5 cursor-pointer"
                  title="Importar Arquivos PDF"
                >
                  <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Importar PDF</span>}
                </button>

                {/* Exportar PDF */}
                <button
                  data-testid="btn-export-pdf"
                  onClick={() => {
                    onOpenExportPdf();
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-2.5 cursor-pointer"
                  title="Exportar em Formato PDF"
                >
                  <Printer className="w-4 h-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span className="truncate">Exportar PDF</span>}
                </button>
              </div>
            )}
          </div>

          {/* UTILITÁRIOS E BANCO DE DADOS */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2.5 block opacity-70">
                Sincronização & Backup
              </span>
            )}

            {/* Sincronização em Nuvem */}
            <button
              data-testid="btn-open-cloud-sync"
              onClick={() => {
                onOpenCloudSync();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full p-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-slate-900 transition flex items-center gap-2.5 cursor-pointer"
              title="Central de Nuvem e Backup"
            >
              <Cloud className="w-4 h-4 shrink-0 text-emerald-400" />
              {!isCollapsed && <span className="truncate">{saveStatus || "Sincronizar"}</span>}
            </button>

            {/* Resgatar Banco Legado */}
            <button
              onClick={() => {
                onRecoverLegacyDb();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full p-2 rounded-xl text-xs font-medium text-amber-400 hover:bg-slate-900 transition flex items-center gap-2.5 cursor-pointer"
              title="Resgatar artigos e edições do navegador legado"
            >
              <Database className="w-4 h-4 shrink-0 text-amber-400" />
              {!isCollapsed && <span className="truncate">Resgatar Banco Legado 🔄</span>}
            </button>

            {/* Restaurar Modelo */}
            <button
              onClick={() => {
                onResetToSample();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition flex items-center gap-2.5 cursor-pointer"
              title="Restaurar Modelo Padrão"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">Restaurar Modelo</span>}
            </button>
          </div>

          {/* PAINEL DE AUTENTICAÇÃO E ASSINATURA PRO */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {currentUser ? (
              <div className="space-y-2">
                <div
                  data-testid="user-profile-badge"
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold"
                  title={`Logado como ${currentUser.name} (${currentUser.email})`}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-white font-bold">{currentUser.name}</p>
                      <p className="truncate text-[10px] text-slate-400 font-normal">{currentUser.email}</p>
                    </div>
                  )}
                </div>

                {currentUser.isPro ? (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40">
                    {!isCollapsed && <span className="text-[10px] font-bold text-amber-300">PLANO PRO ATIVO</span>}
                    <span
                      data-testid="badge-pro-status"
                      className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase border border-amber-400"
                    >
                      PRO
                    </span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    data-testid="btn-upgrade-pro"
                    onClick={() => {
                      onOpenSubscriptionModal();
                      if (isMobileOpen) setIsMobileOpen(false);
                    }}
                    className="w-full h-8.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md border border-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Upgrade para o plano PRO"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {!isCollapsed && <span>Assinar PRO</span>}
                  </Button>
                )}

                <button
                  data-testid="btn-logout"
                  onClick={() => {
                    onLogout();
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                  title="Desconectar da conta"
                >
                  <LogOut className="w-4 h-4 shrink-0 text-red-400" />
                  {!isCollapsed && <span>Sair da Conta</span>}
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                data-testid="btn-auth-trigger"
                onClick={() => {
                  onOpenAuthModal();
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md border border-amber-400 flex items-center justify-center gap-2 cursor-pointer"
                title="Fazer Login ou Cadastrar no Montanha PDF Studio"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Entrar / Cadastrar</span>}
              </Button>
            )}
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 text-center">
            Ecossistema Montanha • v2.0
          </div>
        )}
      </aside>
    </>
  );
};
