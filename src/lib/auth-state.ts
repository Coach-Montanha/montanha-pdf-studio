export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  proSince?: string;
  createdAt: string;
}

export interface StoredAuthData {
  currentUser: UserProfile | null;
  users: Array<UserProfile & { passwordHash: string }>;
}

const AUTH_STORAGE_KEY = "montanha_magazine_auth_state";

const DEFAULT_AUTH_DATA: StoredAuthData = {
  currentUser: null,
  users: [
    {
      id: "demo-user-1",
      name: "Coach Montanha Demo",
      email: "demo@montanha.com",
      passwordHash: "senha123",
      isPro: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-pro-user",
      name: "Assinante PRO",
      email: "pro@montanha.com",
      passwordHash: "senha123",
      isPro: true,
      proSince: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
};

export function getStoredAuthData(): StoredAuthData {
  if (typeof window === "undefined") return DEFAULT_AUTH_DATA;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_AUTH_DATA));
      return DEFAULT_AUTH_DATA;
    }
    const parsed = JSON.parse(raw) as StoredAuthData;

    if (!parsed.currentUser && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isTrial = params.get("trial") === "1";
      const email = params.get("email") || params.get("impersonate");
      const name = params.get("name") || email?.split("@")[0] || "Cliente";
      const pass = params.get("pass") || "1234567890";

      if ((isTrial || params.has("impersonate")) && email) {
        const cleanEmail = email.trim().toLowerCase();
        let user = parsed.users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (!user) {
          user = {
            id: "user-" + Date.now(),
            name: decodeURIComponent(name),
            email: cleanEmail,
            passwordHash: pass,
            isPro: false,
            createdAt: new Date().toISOString()
          };
          parsed.users.push(user);
        }
        parsed.currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          isPro: user.isPro,
          ...(user.proSince ? { proSince: user.proSince } : {}),
          createdAt: user.createdAt
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
      }
    }

    return parsed;
  } catch {
    return DEFAULT_AUTH_DATA;
  }
}

export function saveStoredAuthData(data: StoredAuthData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("montanha-auth-changed"));
  } catch (e) {
    console.error("Falha ao salvar dados de autenticação:", e);
  }
}

export function getCurrentUser(): UserProfile | null {
  return getStoredAuthData().currentUser;
}

export function registerUser(name: string, email: string, password: string): { success: boolean; error?: string; user?: UserProfile } {
  const data = getStoredAuthData();
  const normalizedEmail = email.trim().toLowerCase();

  if (!name.trim()) return { success: false, error: "O nome completo é obrigatório." };
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "Informe um e-mail válido." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "A senha deve conter no mínimo 6 caracteres." };
  }

  const existing = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return { success: false, error: "Este e-mail já está cadastrado. Faça login." };
  }

  const newUser: UserProfile & { passwordHash: string } = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: password,
    isPro: false,
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  data.currentUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    isPro: newUser.isPro,
    createdAt: newUser.createdAt,
  };

  saveStoredAuthData(data);
  return { success: true, user: data.currentUser };
}

export function loginUser(email: string, password: string): { success: boolean; error?: string; user?: UserProfile } {
  const data = getStoredAuthData();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) return { success: false, error: "Informe o seu e-mail." };
  if (!password || password.length < 6) {
    return { success: false, error: "Senha incorreta. Verifique suas credenciais." };
  }

  const matched = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!matched) {
    return { success: false, error: "Nenhuma conta cadastrada com este e-mail." };
  }

  if (matched.passwordHash !== password) {
    return { success: false, error: "Senha incorreta. Verifique suas credenciais." };
  }

  const currentUser: UserProfile = {
    id: matched.id,
    name: matched.name,
    email: matched.email,
    isPro: matched.isPro,
    ...(matched.proSince ? { proSince: matched.proSince } : {}),
    createdAt: matched.createdAt,
  };
  data.currentUser = currentUser;

  saveStoredAuthData(data);
  return { success: true, user: currentUser };
}

export function logoutUser(): void {
  const data = getStoredAuthData();
  data.currentUser = null;
  saveStoredAuthData(data);
}

export function upgradeUserToPro(cardNumber: string, holder: string, expiry: string, cvv: string): { success: boolean; error?: string } {
  const cleanCard = cardNumber.replace(/\s+/g, "");
  if (!cleanCard || cleanCard.length < 16 || !/^\d+$/.test(cleanCard)) {
    return { success: false, error: "Número de cartão de crédito inválido. Insira 16 dígitos." };
  }
  if (!holder.trim()) {
    return { success: false, error: "Informe o nome impresso no cartão." };
  }
  if (!expiry.trim() || !/^\d{2}\/\d{2,4}$/.test(expiry.trim())) {
    return { success: false, error: "Data de validade inválida. Formato: MM/AA." };
  }
  if (!cvv.trim() || cvv.trim().length < 3) {
    return { success: false, error: "Código de segurança (CVV) inválido." };
  }

  if (cleanCard.endsWith("0000")) {
    return { success: false, error: "Pagamento recusado pela operadora. Verifique o limite ou use outro cartão." };
  }

  const data = getStoredAuthData();
  const now = new Date().toISOString();

  if (data.currentUser) {
    data.currentUser.isPro = true;
    data.currentUser.proSince = now;

    const userInList = data.users.find((u) => u.id === data.currentUser?.id);
    if (userInList) {
      userInList.isPro = true;
      userInList.proSince = now;
    }
  }

  saveStoredAuthData(data);
  return { success: true };
}
