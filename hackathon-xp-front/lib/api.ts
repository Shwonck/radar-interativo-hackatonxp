import { clients } from "@/lib/mock-data";

// Cliente de API server-only. Quando NEXT_PUBLIC_API_URL está definido, conversa com o backend
// .NET (FEAT-001); quando não está, devolve valores derivados dos mocks locais com isMock: true.
// Nenhuma credencial roda no navegador: o login usa variáveis server-only e o token fica em cache
// apenas no processo do servidor.

export interface PortfolioSummary {
  totalPatrimonio: number;
  activeClients: number;
  activeConsents: number;
  totalExternalLiquidity: number;
  totalOutstandingDebt: number;
  isMock: boolean;
}

export interface Loan {
  id: string;
  productName: string | null;
  type: string | null;
  contractAmount: number | null;
  contractOutstandingBalance: number | null;
  dueDate: string | null;
  interestRate: number | null;
  cet: number | null;
  currencyCode: string | null;
}

export interface ClientLoans {
  loans: Loan[];
  totalOutstandingDebt: number;
  isMock: boolean;
}

const REQUEST_TIMEOUT_MS = 8000;

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  return base ? base.replace(/\/$/, "") : null;
}

// --- Fallbacks mock ------------------------------------------------------------------------

const consentStatus = new Set(["Ativo", "Expirando"]);

function mockPortfolioSummary(): PortfolioSummary {
  const totalPatrimonio = clients.reduce((sum, client) => sum + client.assets, 0);
  const activeConsents = clients.filter((client) => consentStatus.has(client.consent)).length;
  // Liquidez e dívida externas não existem no mock de clientes; mantemos estimativas estáveis
  // só para a tela renderizar algo plausível offline.
  const totalExternalLiquidity = Math.round(totalPatrimonio * 0.08);
  const totalOutstandingDebt = Math.round(totalPatrimonio * 0.04);
  return {
    totalPatrimonio,
    activeClients: clients.length,
    activeConsents,
    totalExternalLiquidity,
    totalOutstandingDebt,
    isMock: true,
  };
}

function mockClientLoans(): ClientLoans {
  const loans: Loan[] = [
    {
      id: "mock-loan-1",
      productName: "Crédito com garantia de investimentos",
      type: "SECURED",
      contractAmount: 180000,
      contractOutstandingBalance: 132500,
      dueDate: "2027-04-18",
      interestRate: 0.0129,
      cet: 0.0158,
      currencyCode: "BRL",
    },
    {
      id: "mock-loan-2",
      productName: "Financiamento imobiliário",
      type: "MORTGAGE",
      contractAmount: 540000,
      contractOutstandingBalance: 418900,
      dueDate: "2039-11-05",
      interestRate: 0.0095,
      cet: 0.0117,
      currencyCode: "BRL",
    },
  ];
  const totalOutstandingDebt = loans.reduce(
    (sum, loan) => sum + (loan.contractOutstandingBalance ?? 0),
    0,
  );
  return { loans, totalOutstandingDebt, isMock: true };
}

// --- Autenticação backend ------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getBackendToken(base: string): Promise<string | null> {
  const email = process.env.BACKEND_API_EMAIL;
  const password = process.env.BACKEND_API_PASSWORD;
  if (!email || !password) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Login retornou ${response.status}.`);

  const payload = (await response.json()) as { token?: string; expiresAt?: string };
  if (!payload.token) throw new Error("Resposta de login sem token.");

  const expiresAt = payload.expiresAt ? Date.parse(payload.expiresAt) : now + 30 * 60_000;
  cachedToken = {
    token: payload.token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : now + 30 * 60_000,
  };
  return cachedToken.token;
}

async function authorizedFetch(base: string, path: string): Promise<Response> {
  const token = await getBackendToken(base);
  if (!token) throw new Error("Credenciais do backend não configuradas.");
  return fetch(`${base}${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

// --- Normalização de números ---------------------------------------------------------------

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

// --- API pública ---------------------------------------------------------------------------

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const base = apiBase();
  if (!base) return mockPortfolioSummary();

  try {
    const response = await authorizedFetch(base, "/api/advisors/me/portfolio-summary");
    if (!response.ok) throw new Error(`A API retornou ${response.status}.`);
    const data = (await response.json()) as Record<string, unknown>;
    return {
      totalPatrimonio: num(data.totalPatrimonio),
      activeClients: num(data.activeClients),
      activeConsents: num(data.activeConsents),
      totalExternalLiquidity: num(data.totalExternalLiquidity),
      totalOutstandingDebt: num(data.totalOutstandingDebt),
      isMock: false,
    };
  } catch (error) {
    console.error("Falha ao carregar resumo da carteira; usando mock:", error);
    return mockPortfolioSummary();
  }
}

type BackendLoanPayments = { contractOutstandingBalance?: unknown };
type BackendLoan = {
  id?: unknown;
  productName?: unknown;
  type?: unknown;
  contractAmount?: unknown;
  dueDate?: unknown;
  interestRate?: unknown;
  cet?: unknown;
  currencyCode?: unknown;
  payments?: BackendLoanPayments | null;
};

function mapLoan(raw: BackendLoan, index: number): Loan {
  return {
    id: strOrNull(raw.id) ?? `loan-${index}`,
    productName: strOrNull(raw.productName),
    type: strOrNull(raw.type),
    contractAmount: numOrNull(raw.contractAmount),
    contractOutstandingBalance: numOrNull(raw.payments?.contractOutstandingBalance),
    dueDate: strOrNull(raw.dueDate),
    interestRate: numOrNull(raw.interestRate),
    cet: numOrNull(raw.cet),
    currencyCode: strOrNull(raw.currencyCode),
  };
}

export async function getClientLoans(clientId: string): Promise<ClientLoans> {
  const base = apiBase();
  if (!base) return mockClientLoans();

  try {
    const response = await authorizedFetch(base, `/api/clients/${clientId}/open-finance`);
    if (!response.ok) throw new Error(`A API retornou ${response.status}.`);
    const data = (await response.json()) as { loans?: unknown };
    const rawLoans = Array.isArray(data.loans) ? (data.loans as BackendLoan[]) : [];
    const loans = rawLoans.map(mapLoan);
    const totalOutstandingDebt = loans.reduce(
      (sum, loan) => sum + (loan.contractOutstandingBalance ?? 0),
      0,
    );
    return { loans, totalOutstandingDebt, isMock: false };
  } catch (error) {
    console.error("Falha ao carregar dívidas do cliente; usando mock:", error);
    return mockClientLoans();
  }
}
