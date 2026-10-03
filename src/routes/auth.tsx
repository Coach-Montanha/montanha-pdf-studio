import React, { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { registerUser, loginUser } from "@/lib/auth-state";
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
    tag: "Diagramação & IA",
    slogan: "Diagramação Editorial & Publicações com IA",
    accent: "#eab308",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    isCurrent: true,
  },
  {
    id: "eduflow-finance",
    name: "Montanha Personal Studio",
    tag: "Finanças & Operação",
    slogan: "Gestão Financeira & Inteligência para Studios",
    accent: "#6958e2",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    isCurrent: false,
  },
  {
    id: "sistema-hibrido",
    name: "Montanha Hybrid Training",
    tag: "Performance & Treino",
    slogan: "Alta Performance & Periodização de Treino",
    accent: "#dc2626",
    badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
    isCurrent: false,
  },
  {
    id: "smart-language",
    name: "Montanha Language AI",
    tag: "Idiomas & IA",
    slogan: "Tutor de Idiomas com IA & Treinos Diários",
    accent: "#06b6d4",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    isCurrent: false,
  },
  {
    id: "whatsapp-lovable",
    name: "Montanha WhatsApp Automation",
    tag: "Automação & CRM",
    slogan: "CRM & Disparos Inteligentes via WhatsApp",
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
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [showEcosystem, setShowEcosystem] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanEmail) {
      setLoading(false);
      setAuthError("Informe seu e-mail de acesso.");
      return;
    }

    if (!cleanPin || cleanPin.length < 6) {
      setLoading(false);
      setAuthError("Informe seu PIN ou senha (no mínimo 6 caracteres).");
      return;
    }

    const mx = await validateEmailMx(cleanEmail);
    if (!mx.valid) {
      setLoading(false);
      setAuthError(mx.reason || "E-mail inválido.");
      return;
    }

    const access = await checkProjectAccess(null, "construtor-pdf", cleanEmail);
    if (!access.hasAccess) {
      setLoading(false);
      setAuthError(access.message);
      return;
    }

    const res = loginUser(cleanEmail, cleanPin);
    setLoading(false);
    if (res.success) {
      setAuthSuccess("Autenticado com sucesso!");
      window.location.href = nextTarget;
    } else {
      setAuthError(res.error || res.message || "Credenciais inválidas.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!name.trim()) {
      setLoading(false);
      setAuthError("Informe seu nome completo.");
      return;
    }

    if (!cleanPin || cleanPin.length < 6) {
      setLoading(false);
      setAuthError("Informe seu PIN ou senha (no mínimo 6 caracteres).");
      return;
    }

    const res = registerUser(name.trim(), cleanEmail, cleanPin);
    setLoading(false);
    if (res.success) {
      setAuthSuccess("Conta criada com sucesso!");
      window.location.href = nextTarget;
    } else {
      setAuthError(res.error || res.message || "Erro ao cadastrar.");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setResetError("Informe seu e-mail.");
    setLoading(true);
    setResetError(null);
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
      setAuthSuccess("Link de recuperação enviado!");
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Mesh Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#eab308]/20 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-amber-600/15 blur-[160px]" />
      </div>

      {/* Stage Card */}
      <div className="w-full max-w-[900px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[560px] my-auto">
        
        {/* A) NAV RAIL */}
        <nav className="w-full md:w-24 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex md:flex-col items-center justify-between z-20 flex-shrink-0">
          <div className="flex flex-col items-center gap-1.5">
            <Link to="/" className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#eab308] to-amber-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#eab308]" />
              </div>
            </Link>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">PDF</span>
          </div>

          <div className="flex md:flex-col items-center gap-3">
            <button
              type="button"
              data-testid="tab-login"
              onClick={() => setView("signin")}
              aria-label="Entrar na conta"
              className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold cursor-pointer ${
                view === "signin"
                  ? "bg-[#eab308] text-slate-950 shadow-md shadow-[#eab308]/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="h-5 w-5" />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              data-testid="tab-register"
              onClick={() => setView("signup")}
              aria-label="Criar nova conta"
              className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold cursor-pointer ${
                view === "signup"
                  ? "bg-[#eab308] text-slate-950 shadow-md shadow-[#eab308]/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span>Cadastrar</span>
            </button>
          </div>

          <div className="hidden md:flex flex-col items-center text-[10px] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-[#eab308] mb-0.5" />
            <span>SSL 256</span>
          </div>
        </nav>

        {/* B) FLOATING HERO CARD */}
        <div className="w-full md:w-80 relative overflow-hidden bg-slate-950/90 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div aria-hidden className="absolute -top-24 -left-24 w-64 h-64 bg-[#eab308]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            {view === "signin" ? (
              <div className="space-y-3 animate-in fade-in">
                <h2 className="text-2xl md:text-3xl font-extrabold !text-white text-white tracking-tight leading-tight" style={{ color: "#ffffff" }}>
                  Montanha PDF Studio
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Diagramação editorial &amp; publicações digitais com inteligência artificial de alto nível.
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <h2 className="text-2xl md:text-3xl font-extrabold !text-white text-white tracking-tight leading-tight" style={{ color: "#ffffff" }}>
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
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between bg-slate-900">
          {showReset ? (
            <div className="space-y-6 my-auto">
              <div>
                <h3 className="text-2xl font-bold !text-white text-white tracking-tight" style={{ color: "#ffffff" }}>Recuperar Senha</h3>
                <p className="text-sm text-slate-400 mt-1">Informe seu e-mail cadastrado para receber o link de redefinição.</p>
              </div>

              {resetSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>E-mail de recuperação enviado!</span>
                  </div>
                  <p className="text-xs text-slate-300">Confira sua caixa de entrada e a pasta de spam do e-mail informado.</p>
                  <button
                    type="button"
                    onClick={() => { setShowReset(false); setResetSent(false); }}
                    className="text-xs font-bold text-[#eab308] hover:underline block pt-2"
                  >
                    ← Voltar para o login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="reset-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        style={{ fontSize: "16px", color: "#ffffff" }}
                        className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                      />
                    </div>
                    {resetError && <p className="text-xs text-red-400 font-semibold">{resetError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#eab308] hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Enviar Link de Recuperação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="w-full text-center text-xs text-slate-400 hover:text-white pt-2"
                  >
                    ← Voltar para o login
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-6 my-auto">
              <div>
                <h3 className="text-2xl font-bold !text-white text-white tracking-tight" style={{ color: "#ffffff" }}>
                  {view === "signin" ? "Acessar Plataforma" : "Criar sua Conta"}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {view === "signin"
                    ? "Informe suas credenciais ou PIN para acessar."
                    : "Preencha os dados abaixo para cadastrar seu novo acesso."}
                </p>
              </div>

              {authError && (
                <div data-testid="auth-error-msg" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div data-testid="auth-success-msg" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  {authSuccess}
                </div>
              )}

              {/* Form */}
              <form onSubmit={view === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                {view === "signup" && (
                  <div className="space-y-1.5">
                    <label htmlFor="su-name-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="su-name-input"
                        type="text"
                        data-testid="input-register-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Designer Montanha"
                        style={{ fontSize: "16px", color: "#ffffff" }}
                        className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="si-email-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="si-email-input"
                      type="email"
                      data-testid={view === "signin" ? "input-login-email" : "input-register-email"}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      style={{ fontSize: "16px", color: "#ffffff" }}
                      className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="pin-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      {view === "signup" ? "PIN ou Senha (no mínimo 6 dígitos)" : "PIN ou Senha de Acesso"}
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="pin-input"
                      type={showPass ? "text" : "password"}
                      data-testid={view === "signin" ? "input-login-password" : "input-register-password"}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••••••"
                      style={{ fontSize: "16px", color: "#ffffff" }}
                      className="w-full h-11 pl-10 pr-12 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-base md:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      aria-label="Alternar visibilidade da senha"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {view === "signin" && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-[#eab308] focus:ring-[#eab308]"
                      />
                      <span>Lembrar neste dispositivo</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-xs font-bold text-[#eab308] hover:underline cursor-pointer"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  data-testid={view === "signin" ? "btn-submit-login" : "btn-submit-register"}
                  aria-label={view === "signin" ? "Entrar no PDF Studio" : "Cadastrar conta"}
                  className="w-full h-12 rounded-xl bg-[#eab308] hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{view === "signin" ? "Entrar no PDF Studio" : "Criar Conta de Acesso"}</span>
                </button>
              </form>

              {/* Footer Switcher */}
              <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                {view === "signin" ? (
                  <span>
                    Ainda não possui uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setView("signup")}
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
                      onClick={() => setView("signin")}
                      className="font-bold text-[#eab308] hover:underline ml-1"
                    >
                      Fazer login
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
