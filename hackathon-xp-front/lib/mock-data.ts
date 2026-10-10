export type Consent = "Ativo" | "Pendente" | "Expirando";
export type Client = {
  id: number;
  name: string;
  initials: string;
  email: string;
  profile: string;
  assets: number;
  change: number;
  institutions: number;
  consent: Consent;
  color: string;
  opportunity: string;
  allocation: { label: string; value: number; color: string }[];
};

// Fonte local temporária até a integração com as APIs de clientes e Open Finance.
export const clients: Client[] = [
  {
    id: 1,
    name: "Mariana Costa",
    initials: "MC",
    email: "mariana.costa@exemplo.com",
    profile: "Moderado",
    assets: 2840000,
    change: 8.4,
    institutions: 3,
    consent: "Ativo",
    color: "#d8c5b3",
    opportunity: "Concentração elevada em renda fixa. Vale revisar a diversificação.",
    allocation: [
      { label: "Renda fixa", value: 58, color: "#f6c945" },
      { label: "Fundos", value: 24, color: "#181818" },
      { label: "Ações", value: 18, color: "#9c9c9c" },
    ],
  },
  {
    id: 2,
    name: "Ricardo Almeida",
    initials: "RA",
    email: "ricardo.almeida@exemplo.com",
    profile: "Arrojado",
    assets: 1950000,
    change: 12.2,
    institutions: 4,
    consent: "Ativo",
    color: "#b7c6c0",
    opportunity: "Saldo disponível fora da XP pode apoiar novos objetivos.",
    allocation: [
      { label: "Ações", value: 45, color: "#f6c945" },
      { label: "Fundos", value: 30, color: "#181818" },
      { label: "Renda fixa", value: 25, color: "#9c9c9c" },
    ],
  },
  {
    id: 3,
    name: "Fernanda Oliveira",
    initials: "FO",
    email: "fernanda.oliveira@exemplo.com",
    profile: "Conservador",
    assets: 1420000,
    change: 5.1,
    institutions: 2,
    consent: "Expirando",
    color: "#e2c6b9",
    opportunity: "Consentimento vence em 5 dias. Solicite a renovação.",
    allocation: [
      { label: "Renda fixa", value: 76, color: "#f6c945" },
      { label: "Previdência", value: 16, color: "#181818" },
      { label: "Fundos", value: 8, color: "#9c9c9c" },
    ],
  },
  {
    id: 4,
    name: "Carlos Mendes",
    initials: "CM",
    email: "carlos.mendes@exemplo.com",
    profile: "Moderado",
    assets: 980000,
    change: -1.8,
    institutions: 2,
    consent: "Ativo",
    color: "#c4c8db",
    opportunity: "Movimentação recente sugere necessidade de revisar liquidez.",
    allocation: [
      { label: "Renda fixa", value: 48, color: "#f6c945" },
      { label: "Fundos", value: 32, color: "#181818" },
      { label: "Ações", value: 20, color: "#9c9c9c" },
    ],
  },
  {
    id: 5,
    name: "Juliana Ferreira",
    initials: "JF",
    email: "juliana.ferreira@exemplo.com",
    profile: "Arrojado",
    assets: 760000,
    change: 14.6,
    institutions: 1,
    consent: "Pendente",
    color: "#d9c9ab",
    opportunity: "Autorização pendente para análise consolidada.",
    allocation: [
      { label: "Ações", value: 52, color: "#f6c945" },
      { label: "Fundos", value: 28, color: "#181818" },
      { label: "Renda fixa", value: 20, color: "#9c9c9c" },
    ],
  },
  {
    id: 6,
    name: "Pedro Santos",
    initials: "PS",
    email: "pedro.santos@exemplo.com",
    profile: "Moderado",
    assets: 610000,
    change: 3.7,
    institutions: 3,
    consent: "Ativo",
    color: "#b9d0d0",
    opportunity: "Reserva de emergência abaixo da meta informada.",
    allocation: [
      { label: "Renda fixa", value: 42, color: "#f6c945" },
      { label: "Fundos", value: 38, color: "#181818" },
      { label: "Ações", value: 20, color: "#9c9c9c" },
    ],
  },
];

// Séries fixas usadas apenas para compor o gráfico do painel.
export const chart: Record<string, number[]> = {
  "30 dias": [32, 38, 34, 45, 41, 49, 47, 56, 52, 60, 57, 66, 63, 72, 69, 78],
  "90 dias": [25, 30, 28, 35, 40, 37, 46, 43, 51, 57, 54, 62, 64, 68, 72, 78],
  "12 meses": [18, 25, 23, 31, 29, 39, 36, 43, 48, 46, 58, 62, 60, 69, 72, 78],
};
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
export const compactMoney = (value: number) =>
  value >= 1000000
    ? `R$ ${(value / 1000000).toFixed(2).replace(".", ",")} mi`
    : `R$ ${(value / 1000).toFixed(0)} mil`;

export const getClientById = (id: string | number) =>
  clients.find((client) => client.id === Number(id));

// Campos de perfil sintéticos e documentos mascarados para a página de detalhes.
export const clientProfiles: Record<
  number,
  {
    document: string;
    birthDate: string;
    occupation: string;
    phone: string;
    address: string;
    since: string;
    lastUpdate: string;
  }
> = {
  1: {
    document: "***.***.***-42",
    birthDate: "14 de jul. de 1987",
    occupation: "Profissional liberal",
    phone: "Não informado",
    address: "São Paulo, SP",
    since: "mar/2025",
    lastUpdate: "hoje, 09:42",
  },
  2: {
    document: "***.***.***-18",
    birthDate: "2 de fev. de 1982",
    occupation: "Empresário",
    phone: "Não informado",
    address: "Campinas, SP",
    since: "jan/2024",
    lastUpdate: "hoje, 10:15",
  },
  3: {
    document: "***.***.***-73",
    birthDate: "23 de set. de 1990",
    occupation: "Administradora",
    phone: "Não informado",
    address: "Curitiba, PR",
    since: "jun/2024",
    lastUpdate: "ontem, 16:32",
  },
  4: {
    document: "***.***.***-56",
    birthDate: "11 de abr. de 1979",
    occupation: "Engenheiro",
    phone: "Não informado",
    address: "Belo Horizonte, MG",
    since: "fev/2025",
    lastUpdate: "hoje, 08:40",
  },
  5: {
    document: "***.***.***-09",
    birthDate: "5 de dez. de 1993",
    occupation: "Empreendedora",
    phone: "Não informado",
    address: "Rio de Janeiro, RJ",
    since: "ago/2025",
    lastUpdate: "aguardando autorização",
  },
  6: {
    document: "***.***.***-31",
    birthDate: "17 de mar. de 1985",
    occupation: "Professor",
    phone: "Não informado",
    address: "Porto Alegre, RS",
    since: "mai/2025",
    lastUpdate: "hoje, 11:06",
  },
};
