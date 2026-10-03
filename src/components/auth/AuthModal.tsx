import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { registerUser, loginUser, UserProfile } from "../../lib/auth-state";
import { checkAndLockGuestDemo, validateEmailMx, checkProjectAccess } from "../../services/ecosystem-auth-service";
import { Link } from "@tanstack/react-router";
import { LogIn, UserPlus, AlertCircle, CheckCircle2, Lock, Mail, User, Zap, Globe, Sparkles, ChevronDown, ChevronUp, ShieldCheck, ExternalLink } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialTab?: "login" | "register";
  canClose?: boolean;
}

const ECOSYSTEM_APPS = [
  {
    id: "pdf",
    name: "Montanha PDF Studio",
    tag: "Diagramação & IA",
    slogan: "Diagramação Editorial & Publicações com IA",
    accent: "#f59e0b",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    isCurrent: true,
  },
  {
    id: "personal",
    name: "Montanha Personal Studio",
    tag: "Finanças & Operação",
    slogan: "Gestão Financeira & Inteligência para Studios",
    accent: "#10b981",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    isCurrent: false,
  },
  {
    id: "hybrid",
    name: "Montanha Hybrid Training",
    tag: "Performance & Treino",
    slogan: "Alta Performance & Periodização de Treino",
    accent: "#06b6d4",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    isCurrent: false,
  },
  {
    id: "language",
    name: "Montanha Language AI",
    tag: "Idiomas & IA",
    slogan: "Tutor de Idiomas com IA & Treinos Diários",
    accent: "#6366f1",
    badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    isCurrent: false,
  },
  {
    id: "whatsapp",
    name: "Montanha WhatsApp Automation",
    tag: "SaaS & CRM",
    slogan: "Automação Multi-Tenant & Disparos WhatsApp",
    accent: "#a855f7",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    isCurrent: false,
  },
];

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
  const [showEcosystem, setShowEcosystem] = useState(false);

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
    const mx = await validateEmailMx(loginEmail);
    if (!mx.valid) {
      setErrorMessage(mx.reason || "E-mail inválido.");
      return;
    }
    setSuccessMessage(`Instruções de redefinição de senha enviadas para ${loginEmail}!`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const mx = await validateEmailMx(loginEmail);
    if (!mx.valid) {
      setErrorMessage(mx.reason || "E-mail inválido.");
      return;
    }

    const access = await checkProjectAccess(null, 'construtor-pdf', loginEmail);
    if (!access.hasAccess) {
      setErrorMessage(access.message);
      return;
    }

    const res = loginUser(loginEmail, loginPassword);
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
    const res = registerUser(registerName, registerEmail, registerPassword);
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        data-testid="auth-modal"
        className={`max-w-md p-6 font-sans bg-slate-950/95 text-slate-100 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] backdrop-blur-2xl rounded-2xl ${
          !canClose ? "[&>button]:hidden" : ""
        }`}
      >
        <DialogHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ECOSSISTEMA MONTANHA</span>
            </span>
            <Link
              to="/auth"
              onClick={() => handleClose()}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 transition cursor-pointer"
            >
              <span>Tela de Login Completa</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <span>{activeTab === "login" ? "Montanha PDF Studio" : "Criar Nova Conta"}</span>
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1">
            Diagramação Editorial &amp; Publicações de Alto Nível com IA
          </p>
        </DialogHeader>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 my-2">
          <button
            type="button"
            data-testid="tab-login"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "login"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            data-testid="tab-register"
            onClick={() => {
              setActiveTab("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "register"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar</span>
          </button>
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

        {/* Login Tab Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} noValidate className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>E-mail</span>
              </Label>
              <Input
                type="email"
                data-testid="input-login-email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Senha</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">10 números</span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setActiveTab("reset");
                    }}
                    className="text-xs text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    Esqueci a senha
                  </button>
                </div>
              </div>
              <Input
                type="password"
                data-testid="input-login-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <Button
              type="submit"
              data-testid="btn-submit-login"
              className="w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Acessar Conta</span>
            </Button>
          </form>
        )}

        {/* Reset Password Form */}
        {activeTab === "reset" && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>E-mail para Recuperação</span>
              </Label>
              <Input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar Instruções de Reset</span>
            </Button>
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              ← Voltar para o login
            </button>
          </form>
        )}

        {/* Register Tab Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} noValidate className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Nome Completo</span>
              </Label>
              <Input
                type="text"
                data-testid="input-register-name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Ex: Coach Silva"
                className="bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>E-mail Profissional</span>
              </Label>
              <Input
                type="email"
                data-testid="input-register-email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Senha (Mínimo 6 caracteres)</span>
              </Label>
              <Input
                type="password"
                data-testid="input-register-password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <Button
              type="submit"
              data-testid="btn-submit-register"
              className="w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Concluir Cadastro &amp; Entrar</span>
            </Button>
          </form>
        )}

        {/* Footer Ecosystem Button */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowEcosystem(!showEcosystem)}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 transition-all cursor-pointer shadow-md"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 Ecossistema (5 Apps Integrados)</span>
            {showEcosystem ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Ecosystem Apps Drawer */}
        {showEcosystem && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2 animate-in fade-in">
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Plataformas Integradas do Ecossistema</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {ECOSYSTEM_APPS.map((app) => (
                <div
                  key={app.id}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                    app.isCurrent
                      ? "bg-amber-500/10 border-amber-500/50 text-white"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app.accent }} />
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
      </DialogContent>
    </Dialog>
  );
};
