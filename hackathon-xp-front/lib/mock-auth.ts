// Conta e sessão locais para navegação do protótipo; não substituem autenticação real.
export const DEMO_USER = {
  name: "Ana Carvalho",
  email: "assessor@xp-demo.com",
  password: "XPdemo@2026",
};

const SESSION_COOKIE = "xp-demo-session";
const PASSWORD_KEY = "xp-demo-password-hash";
const RESET_KEY = "xp-demo-reset";

type ResetRequest = { token: string; expiresAt: number };

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signIn(email: string, password: string, remember: boolean) {
  if (email.trim().toLowerCase() !== DEMO_USER.email) return false;

  const updatedPasswordHash = window.localStorage.getItem(PASSWORD_KEY);
  const validPassword = updatedPasswordHash
    ? (await hashPassword(password)) === updatedPasswordHash
    : password === DEMO_USER.password;

  if (!validPassword) return false;

  document.cookie = `${SESSION_COOKIE}=active; Path=/; SameSite=Lax${remember ? "; Max-Age=604800" : ""}`;
  return true;
}

export function signOut() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export function createResetRequest(email: string): string | null {
  if (email.trim().toLowerCase() !== DEMO_USER.email) return null;
  // O link é entregue na interface e só funciona neste navegador, sem serviço de e-mail.
  const token = crypto.randomUUID();
  const request: ResetRequest = { token, expiresAt: Date.now() + 15 * 60 * 1000 };
  window.localStorage.setItem(RESET_KEY, JSON.stringify(request));
  return token;
}

function readResetRequest(): ResetRequest | null {
  try {
    const stored = window.localStorage.getItem(RESET_KEY);
    if (!stored) return null;
    const request = JSON.parse(stored) as ResetRequest;
    if (typeof request.token !== "string" || typeof request.expiresAt !== "number") return null;
    return request;
  } catch {
    return null;
  }
}

export function isResetTokenValid(token: string) {
  const request = readResetRequest();
  return Boolean(request && request.token === token && request.expiresAt > Date.now());
}

export async function resetPassword(token: string, password: string) {
  if (!isResetTokenValid(token)) return false;
  window.localStorage.setItem(PASSWORD_KEY, await hashPassword(password));
  window.localStorage.removeItem(RESET_KEY);
  signOut();
  return true;
}
