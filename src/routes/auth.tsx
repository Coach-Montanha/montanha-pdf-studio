import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Globe,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  KeyRound,
  UserCheck,
  Smartphone,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { registerUser, loginUser, getCurrentUser, UserProfile } from "@/lib/auth-state";
import { validateEmailMx, checkProjectAccess } from "@/services/ecosystem-auth-service";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string; tab?: "login" | "cadastro" } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
    tab: s.tab === "cadastro" || s.tab === "login" ? s.tab : undefined,
  }),
  component: AuthPage,
});

const ECOSYSTEM_APPS = [
  {
    id: "construtor-pdf",
    name: "Montanha PDF Studio",
    tag: "App Atual",
    slogan: "Diagramação Editorial & Publicações de Alto Nível com IA",
    accent: "#eab308",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    isCurrent: true,
  },
  {
    id: "eduflow-finance",
    name: "Montanha Personal Studio",
    tag: "Finanças & Studio",
    slogan: "Gestão Financeira & Inteligência de Negócio para Studios",
    accent: "#6958e2",
    badgeBg: "bg-[#6958e2]/20 text-[#6958e2] border-[#6958e2]/40",
    isCurrent: false,
  },
  {
    id: "sistema-hibrido",
    name: "Montanha Hybrid Training",
    tag: "Treino Híbrido",
    slogan: "Alta Performance & Periodização de Treino",
    accent: "#dc2626",
    badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
    isCurrent: false,
  },
  {
    id: "smart-language",
    name: "Montanha Language AI",
    tag: "Idiomas com IA",
    slogan: "Tutor de Idiomas com IA & Microtreinos de 5 Minutos",
    accent: "#06b6d4",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    isCurrent: false,
  },
  {
    id: "whatsapp-lovable",
    name: "Montanha WhatsApp Automation",
    tag: "SaaS CRM",
    slogan: "Automação Multi-Tenant & Disparos de PDFs via WhatsApp",
    accent: "#10b981",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    isCurrent: false,
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const nextTarget = search.next || "/";

  const [view, setView] = useState<"signin" | "signup">(search.tab === "cadastro" ? "signup" : "signin");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEcosystem, setShowEcosystem] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [registerName, setRegisterName] = useState("");

  // Brand Accent: #eab308 (Editorial Gold)

  useEffect(() => {
    const handleAuthSync = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("montanha-auth-changed", handleAuthSync);
    return () => window.removeEventListener("montanha-auth-changed", handleAuthSync);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPin = pin.trim();

      if (!cleanEmail) {
        setErrorMessage("Informe o seu e-mail profissional.");
        setIsLoading(false);
        return;
      }

      if (!/^\d{6,}$/.test(cleanPin)) {
        setErrorMessage("O PIN de acesso deve conter no mínimo 6 dígitos numéricos.");
        setIsLoading(false);
        return;
      }

      const mx = await validateEmailMx(cleanEmail);
      if (!mx.valid) {
        setErrorMessage(mx.reason || "E-mail inválido.");
        setIsLoading(false);
        return;
      }

      const access = await checkProjectAccess(null, "construtor-pdf", cleanEmail);
      if (!access.hasAccess) {
        setErrorMessage(access.message || "Acesso não liberado para este projeto.");
        setIsLoading(false);
        return;
      }

      const res = loginUser(cleanEmail, cleanPin);
      if (!res.success) {
        setErrorMessage(res.error || "Credenciais inválidas. Verifique seu e-mail e PIN.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Autenticação validada com sucesso! Redirecionando...");
      setTimeout(() => {
        navigate({ to: nextTarget });
      }, 600);
    } catch (err) {
      setErrorMessage("Erro inesperado ao validar credenciais. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPin = pin.trim();

      if (!/^\d{10}$/.test(cleanPin)) {
        setErrorMessage("O PIN deve conter exatamente 10 dígitos numéricos.");
        setIsLoading(false);
        return;
      }

      const mx = await validateEmailMx(cleanEmail);
      if (!mx.valid) {
        setErrorMessage(mx.reason || "E-mail inválido.");
        setIsLoading(false);
        return;
      }

      const res = registerUser(registerName, cleanEmail, cleanPin);
      if (!res.success) {
        setErrorMessage(res.error || "Não foi possível concluir o cadastro.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => {
        navigate({ to: nextTarget });
      }, 600);
    } catch (err) {
      setErrorMessage("Falha ao registrar usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (emailStr: string, pinStr: string) => {
    setEmail(emailStr);
    setPin(pinStr);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Mesh Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#eab308]/20 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-amber-600/15 blur-[160px]" />
      </div>

      {/* Header back link */}
      <div className="w-full max-w-[920px] flex items-center justify-between mb-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#eab308] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Estúdio Principal</span>
        </Link>
        <span className="font-mono text-[10px] uppercase font-bold text-[#eab308] border border-[#eab308]/30 bg-[#eab308]/10 px-3 py-1 rounded-full">
          v2.5 Security Gate
        </span>
      </div>

      {/* Floating Hero Stage Card */}
      <div className="w-full max-w-[920px] bg-slate-900/90 border border-[#eab308]/30 rounded-3xl shadow-[0_0_60px_rgba(234,179,8,0.2)] backdrop-blur-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px] my-auto">
        
        {/* A) NAV RAIL */}
        <nav className="w-full md:w-24 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex md:flex-col items-center justify-between z-20 flex-shrink-0">
          <div className="flex flex-col items-center gap-2">
            <Link to="/" className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#eab308] to-amber-600 p-0.5 shadow-lg shadow-[#eab308]/30 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#eab308]" />
              </div>
            </Link>
            <span className="text-[10px] font-black tracking-widest text-[#eab308] uppercase">Editorial</span>
          </div>

          <div className="flex md:flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => { setView("signin"); setErrorMessage(null); }}
              aria-label="Entrar na conta"
              className={`min-h-[44px] min-w-[44px] px-4 py-2 md:py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${
                view === "signin"
                  ? "bg-[#eab308] text-slate-950 shadow-lg shadow-[#eab308]/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <User className="h-5 w-5" />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => { setView("signup"); setErrorMessage(null); }}
              aria-label="Criar nova conta"
              className={`min-h-[44px] min-w-[44px] px-4 py-2 md:py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${
                view === "signup"
                  ? "bg-[#eab308] text-slate-950 shadow-lg shadow-[#eab308]/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span>Cadastrar</span>
            </button>
          </div>

          <div className="hidden md:flex flex-col items-center text-[10px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#eab308] mb-1" />
            <span>SSL 256</span>
          </div>
        </nav>

        {/* B) FLOATING HERO CARD */}
        <div className="w-full md:w-80 relative overflow-hidden bg-slate-950/90 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div aria-hidden className="absolute -top-24 -left-24 w-64 h-64 bg-[#eab308]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            {view === "signin" ? (
              <div className="space-y-3 animate-in fade-in">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Montanha PDF Studio
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Diagramação editorial &amp; publicações digitais com inteligência artificial de alto nível.
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Crie E-books &amp; Revistas em Minutos
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Padrão editorial profissional, exportação em alta resolução e IA assistente.
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-[#eab308] flex-shrink-0" />
              <span>Autenticação rápida e segura por PIN</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-[#eab308] flex-shrink-0" />
              <span>Exportação PDF/A editorial em alta resolução</span>
            </div>
          </div>
        </div>

        {/* C) FORM PANEL */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between bg-slate-950/60">
          <div className="space-y-6 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {view === "signin" ? "Acessar Plataforma" : "Criar sua Conta"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {view === "signin"
                    ? "Informe suas credenciais para continuar."
                    : "Preencha seus dados para cadastro no estúdio."}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#eab308] bg-[#eab308]/15 px-2.5 py-1 rounded-lg border border-[#eab308]/30">
                PIN 10 Dígitos
              </span>
            </div>

            {/* Current logged user alert */}
            {currentUser && (
              <div className="p-3.5 rounded-2xl bg-[#eab308]/10 border border-[#eab308]/30 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#eab308]" />
                  <div>
                    <p className="font-bold text-white">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                  </div>
                </div>
                <Link
                  to={nextTarget}
                  className="text-xs font-black text-[#eab308] hover:underline"
                >
                  Continuar →
                </Link>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={view === "signin" ? handleLogin : handleRegister} className="space-y-4">
              {view === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="su-name-pdf" className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="su-name-pdf"
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Ex: Designer Rafael Montanha"
                      style={{ fontSize: "16px" }}
                      className="w-full h-11 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="si-email-pdf" className="text-xs font-bold text-slate-300 uppercase tracking-wider">E-mail Profissional</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="si-email-pdf"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    style={{ fontSize: "16px" }}
                    className="w-full h-11 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="pin-input-pdf" className="text-xs font-bold text-slate-300 uppercase tracking-wider">PIN de Acesso</label>
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="pin-input-pdf"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="••••••••"
                    style={{ fontSize: "16px" }}
                    className="w-full h-11 pl-10 pr-12 bg-slate-900 border border-slate-800 rounded-xl text-white tracking-widest font-mono placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label="Alternar visibilidade do PIN"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-label={view === "signin" ? "Entrar no PDF Studio" : "Criar conta no estúdio"}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#eab308] to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#eab308]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{view === "signin" ? "Entrar no PDF Studio" : "Criar Conta de Acesso"}</span>
              </button>
            </form>

            {/* Demo quick options */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center">
                Acesso Rápido de Testes (Ecossistema)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill("demo@montanha.com", "1234567890")}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-[#eab308]/40 text-left transition cursor-pointer min-h-[44px]"
                >
                  <span className="font-bold text-[#eab308] block">Coach Demo</span>
                  <span className="text-slate-400">demo@montanha.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("pro@montanha.com", "1234567890")}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-[#eab308]/40 text-left transition cursor-pointer min-h-[44px]"
                >
                  <span className="font-bold text-emerald-400 block">Assinante PRO</span>
                  <span className="text-slate-400">pro@montanha.com</span>
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              {view === "signin" ? (
                <span>
                  Ainda não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => { setView("signup"); setErrorMessage(null); }}
                    className="font-bold text-[#eab308] hover:underline ml-1"
                  >
                    Cadastre-se aqui
                  </button>
                </span>
              ) : (
                <span>
                  Já é cadastrado?{" "}
                  <button
                    type="button"
                    onClick={() => { setView("signin"); setErrorMessage(null); }}
                    className="font-bold text-[#eab308] hover:underline ml-1"
                  >
                    Fazer login
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Drawer Toggle */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setShowEcosystem(!showEcosystem)}
          className="text-xs text-[#eab308] hover:text-amber-300 font-bold inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/30 transition-all cursor-pointer shadow-md min-h-[44px]"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>🌐 Ecossistema Montanha (5 Apps Integrados)</span>
          {showEcosystem ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showEcosystem && (
        <div className="mt-3 w-full max-w-[920px] p-4 rounded-2xl bg-slate-900/95 border border-[#eab308]/40 shadow-2xl space-y-2 animate-in fade-in">
          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
            <span>Plataformas do Ecossistema Montanha</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ECOSYSTEM_APPS.map((app) => (
              <div
                key={app.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  app.isCurrent
                    ? "bg-[#eab308]/15 border-[#eab308]/50 text-white"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: app.accent }} />
                    {app.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{app.slogan}</span>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${app.badgeBg}`}>
                  {app.isCurrent ? "ATUAL" : app.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
