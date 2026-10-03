import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { registerUser, loginUser, UserProfile } from "../../lib/auth-state";
import { validateEmailMx, checkProjectAccess } from "../../services/ecosystem-auth-service";
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
  AlertCircle,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialTab?: "login" | "register";
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = "login",
  canClose = true,
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "reset">(initialTab);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form State
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const resetForm = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoginEmail("");
    setLoginPassword("");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
  };

  const handleClose = (force: boolean = false) => {
    if (!canClose && !force) return;
    resetForm();
    onClose();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginEmail) {
      setErrorMessage("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    const mx = await validateEmailMx(loginEmail);
    setLoading(false);
    if (!mx.valid) {
      setErrorMessage(mx.reason || "E-mail inválido.");
      return;
    }
    setSuccessMessage(`Instruções de redefinição de senha enviadas para ${loginEmail}!`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPin = loginPassword.trim();

    if (!cleanEmail) {
      setLoading(false);
      setErrorMessage("Informe seu e-mail de acesso.");
      return;
    }

    if (!cleanPin || cleanPin.length < 6) {
      setLoading(false);
      setErrorMessage("Informe seu PIN ou senha (no mínimo 6 caracteres).");
      return;
    }

    const mx = await validateEmailMx(cleanEmail);
    if (!mx.valid) {
      setLoading(false);
      setErrorMessage(mx.reason || "E-mail inválido.");
      return;
    }

    const access = await checkProjectAccess(null, 'construtor-pdf', cleanEmail);
    if (!access.hasAccess) {
      setLoading(false);
      setErrorMessage(access.message);
      return;
    }

    const res = loginUser(cleanEmail, cleanPin);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || "Falha na autenticação.");
      return;
    }

    setSuccessMessage("Login realizado com sucesso!");
    setTimeout(() => {
      if (res.user) onSuccess(res.user);
      handleClose(true);
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (!registerName.trim()) {
      setLoading(false);
      setErrorMessage("O nome completo é obrigatório.");
      return;
    }

    if (!registerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())) {
      setLoading(false);
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setLoading(false);
      setErrorMessage("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    const res = registerUser(registerName.trim(), registerEmail.trim(), registerPassword);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || "Falha no cadastro.");
      return;
    }

    setSuccessMessage("Cadastro realizado com sucesso!");
    setTimeout(() => {
      if (res.user) onSuccess(res.user);
      handleClose(true);
    }, 600);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && canClose) {
          handleClose();
        }
      }}
    >
      <DialogContent
        data-testid="auth-modal"
        onPointerDownOutside={(e) => {
          if (!canClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) e.preventDefault();
        }}
        className={`max-w-[920px] w-[95vw] p-0 font-sans bg-slate-900 text-slate-100 border border-[#eab308]/40 shadow-[0_0_50px_rgba(234,179,8,0.2)] backdrop-blur-2xl rounded-3xl overflow-hidden ${
          !canClose ? "[&>button]:hidden" : ""
        }`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Montanha PDF Studio Autenticação</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row min-h-[540px] w-full">
          {/* A) NAV RAIL */}
          <nav className="w-full md:w-20 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex md:flex-col items-center justify-between z-20 flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#eab308] to-amber-600 p-0.5 shadow-md shadow-[#eab308]/20 flex items-center justify-center">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-[#eab308]" />
                </div>
              </div>
              <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">STUDIO</span>
            </div>

            <div className="flex md:flex-col items-center gap-2">
              <button
                type="button"
                data-testid="tab-login"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage(null);
                }}
                aria-label="Entrar na conta"
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-[11px] font-bold cursor-pointer ${
                  activeTab === "login"
                    ? "bg-[#eab308] text-slate-950 shadow-md shadow-[#eab308]/30 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </button>

              <button
                type="button"
                data-testid="tab-register"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage(null);
                }}
                aria-label="Criar nova conta"
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-[11px] font-bold cursor-pointer ${
                  activeTab === "register"
                    ? "bg-[#eab308] text-slate-950 shadow-md shadow-[#eab308]/30 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Cadastrar</span>
              </button>
            </div>

            <div className="hidden md:flex flex-col items-center text-[9px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#eab308] mb-0.5" />
              <span>SSL 256</span>
            </div>
          </nav>

          {/* B) FLOATING HERO CARD */}
          <div className="w-full md:w-80 relative overflow-hidden bg-slate-950/90 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div aria-hidden className="absolute -top-24 -left-24 w-64 h-64 bg-[#eab308]/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Montanha PDF Studio
                </h2>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Diagramação editorial &amp; inteligência operacional de alta performance para revistas, e-books e publicações com IA.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-[#eab308] flex-shrink-0" />
                <span>Autenticação rápida e segura por PIN</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-[#eab308] flex-shrink-0" />
                <span>Criptografia de ponta a ponta</span>
              </div>
            </div>
          </div>

          {/* C) FORM PANEL */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-slate-900">
            <div className="space-y-5 my-auto">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {activeTab === "login" ? "Acessar Plataforma" : activeTab === "register" ? "Criar sua Conta" : "Recuperar Senha"}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  {activeTab === "login"
                    ? "Informe suas credenciais ou PIN para acessar."
                    : activeTab === "register"
                    ? "Preencha os dados abaixo para cadastrar seu novo acesso."
                    : "Informe seu e-mail para receber as instruções de recuperação."}
                </p>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div
                  data-testid="auth-error-msg"
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Notification */}
              {successMessage && (
                <div
                  data-testid="auth-success-msg"
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              {activeTab === "login" && (
                <form onSubmit={handleLogin} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="login-email-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      E-mail de Acesso
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="login-email-input"
                        type="email"
                        data-testid="input-login-email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-pin-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        PIN ou Senha de Acesso
                      </label>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="login-pin-input"
                        type={showPass ? "text" : "password"}
                        data-testid="input-login-password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-12 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-sm"
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
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setActiveTab("reset");
                      }}
                      className="text-xs font-bold text-[#eab308] hover:underline cursor-pointer"
                    >
                      Esqueci a senha
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="btn-submit-login"
                    aria-label="Entrar no PDF Studio"
                    className="w-full h-12 rounded-xl bg-[#eab308] hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-[#eab308]/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Entrar no PDF Studio</span>
                  </button>
                </form>
              )}

              {/* Register Form */}
              {activeTab === "register" && (
                <form onSubmit={handleRegister} noValidate className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-reg-name" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="modal-reg-name"
                        type="text"
                        data-testid="input-register-name"
                        required
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="Ex: Designer Montanha"
                        className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-reg-email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      E-mail de Acesso
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="modal-reg-email"
                        type="email"
                        data-testid="input-register-email"
                        required
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-reg-pass" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      PIN ou Senha (no mínimo 6 dígitos)
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="modal-reg-pass"
                        type={showPass ? "text" : "password"}
                        data-testid="input-register-password"
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-12 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-sm"
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

                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="btn-submit-register"
                    aria-label="Criar Conta de Acesso"
                    className="w-full h-12 rounded-xl bg-[#eab308] hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-[#eab308]/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Criar Conta de Acesso</span>
                  </button>
                </form>
              )}

              {/* Reset Password Form */}
              {activeTab === "reset" && (
                <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-reset-email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      E-mail para Recuperação
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="modal-reset-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#eab308] text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#eab308] hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Enviar Link de Recuperação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="w-full text-center text-xs text-slate-400 hover:text-white pt-1 block cursor-pointer"
                  >
                    ← Voltar para o login
                  </button>
                </form>
              )}

              {/* Footer Switcher */}
              <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                {activeTab === "login" ? (
                  <span>
                    Ainda não possui uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("register");
                        setErrorMessage(null);
                      }}
                      className="font-bold text-[#eab308] hover:underline ml-1 cursor-pointer"
                    >
                      Cadastre-se aqui
                    </button>
                  </span>
                ) : activeTab === "register" ? (
                  <span>
                    Já possui uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("login");
                        setErrorMessage(null);
                      }}
                      className="font-bold text-[#eab308] hover:underline ml-1 cursor-pointer"
                    >
                      Fazer login
                    </button>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
