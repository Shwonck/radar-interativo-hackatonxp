import type {
  ClientAnalysesResponse,
  CreditAssessment,
  CreditFactorKey,
  FgcAnalysis,
  FgcGroup,
  InvestmentMaturity,
  RiskAlert,
} from "./analysis-contract";
import { getClientById, type Client } from "./mock-data";
import { getMockPositions, SIMULATION_AS_OF, type MockPosition } from "./mock-positions";

const SOURCE = "Carteira fictícia da simulação";
const ORDINARY_LIMIT = 250000;
const eligibleProducts = new Set(["CDB", "LCI", "LCA"]);
const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Usa o calendário de São Paulo; a data da carteira continua sendo a data-base da simulação.
export function todayInSaoPaulo(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export const creditWeights: Record<CreditFactorKey, number> = {
  paymentCapacityScore: 0.25,
  leverageScore: 0.2,
  liquidityScore: 0.15,
  creditHistoryScore: 0.15,
  externalRatingScore: 0.15,
  guaranteesScore: 0.1,
};
const factorKeys = Object.keys(creditWeights) as CreditFactorKey[];
type Factors = Record<CreditFactorKey, number | null>;

const issuers: Record<string, { name: string; factors: Factors; rationale: string }> = {
  "empresa-aurora": {
    name: "Empresa Aurora",
    factors: {
      paymentCapacityScore: 90,
      leverageScore: 85,
      liquidityScore: 90,
      creditHistoryScore: 90,
      externalRatingScore: 80,
      guaranteesScore: 90,
    },
    rationale:
      "Indicadores simulados predominantemente favoráveis; a emissão ainda exige análise própria.",
  },
  "empresa-horizonte": {
    name: "Empresa Horizonte",
    factors: {
      paymentCapacityScore: 85,
      leverageScore: 60,
      liquidityScore: 70,
      creditHistoryScore: 90,
      externalRatingScore: 65,
      guaranteesScore: 60,
    },
    rationale:
      "Capacidade de pagamento e histórico favoráveis; dívida e garantias pedem acompanhamento.",
  },
  "empresa-omega": {
    name: "Empresa Ômega",
    factors: {
      paymentCapacityScore: 35,
      leverageScore: 25,
      liquidityScore: 40,
      creditHistoryScore: 30,
      externalRatingScore: 35,
      guaranteesScore: 25,
    },
    rationale: "Fragilidades simultâneas em caixa, dívida e garantias no cenário simulado.",
  },
};

const reasons: Record<CreditFactorKey, string> = {
  paymentCapacityScore: "Capacidade de gerar caixa para pagar juros e dívidas no cenário simulado.",
  leverageScore: "Nível de dívida comparado à capacidade financeira fictícia.",
  liquidityScore: "Recursos disponíveis para obrigações próximas na simulação.",
  creditHistoryScore: "Eventos de atraso e renegociação apenas nos dados fictícios.",
  externalRatingScore: "Nota externa simulada; não há classificação de agência verificável.",
  guaranteesScore: "Estrutura e prioridade da emissão ainda requerem revisão documental.",
};

export function calculateSimulatedScore(
  factors: Factors,
  weights: Record<CreditFactorKey, number> = creditWeights,
): number | null {
  if (
    factorKeys.some(
      (key) =>
        factors[key] == null ||
        !Number.isFinite(factors[key]) ||
        factors[key]! < 0 ||
        factors[key]! > 100,
    )
  )
    return null;
  if (Math.abs(factorKeys.reduce((sum, key) => sum + weights[key], 0) - 1) > 0.000001) return null;
  return Math.round(factorKeys.reduce((sum, key) => sum + factors[key]! * weights[key], 0));
}

export function getLargestIssuerExposure(positions: MockPosition[]) {
  const totals = new Map<string, { issuerName: string; amount: number }>();
  for (const position of positions) {
    if (!position.issuerId || !position.issuerName) continue;
    const current = totals.get(position.issuerId);
    totals.set(position.issuerId, {
      issuerName: position.issuerName,
      amount: (current?.amount ?? 0) + position.amount,
    });
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount)[0] ?? null;
}

export function getMockMaturities(
  positions: MockPosition[],
  calculatedOn = todayInSaoPaulo(),
): InvestmentMaturity[] {
  const asOf = Date.parse(`${calculatedOn}T00:00:00Z`);
  return positions
    .filter((position) => position.maturityDate)
    .map((position) => ({
      positionId: position.id,
      productName: position.name,
      amount: position.amount,
      maturityDate: position.maturityDate!,
      daysUntil: Math.round((Date.parse(`${position.maturityDate}T00:00:00Z`) - asOf) / 86400000),
    }))
    .filter((maturity) => maturity.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

function calculateFgc(client: Client, positions: MockPosition[]): FgcAnalysis {
  const excludedProducts = [
    ...new Set(
      positions
        .filter((position) => !eligibleProducts.has(position.productType))
        .map((position) => position.productType),
    ),
  ];
  const eligible = positions.filter((position) => eligibleProducts.has(position.productType));
  const missing = eligible.filter(
    (position) =>
      !position.conglomerateId || !position.conglomerateName || position.eligibleBalance == null,
  );
  const common = {
    excludedProducts,
    asOf: SIMULATION_AS_OF,
    sources: [SOURCE],
    globalLimitMessage:
      "Histórico de garantias pagas não disponível; o limite global não foi verificado.",
    pendingChecks: [
      "Confirmar titularidade de cada posição e eventuais cotitulares.",
      "Validar instituição emissora e vínculo com o conglomerado financeiro.",
      "Confirmar elegibilidade de cada produto e saldo coberto, inclusive juros.",
      "Consultar histórico de garantias pagas e limite global aplicável.",
    ],
  };
  if (client.consent === "Pendente" || missing.length) {
    return {
      ...common,
      isComplete: false,
      dataQualityMessage:
        client.consent === "Pendente"
          ? "Consentimento pendente; as posições podem não representar a carteira completa."
          : "Faltam conglomerado ou saldo elegível de uma ou mais posições.",
      warnings: missing.map(
        (position) => `Confirme emissor, conglomerado e saldo de ${position.name}.`,
      ),
    };
  }

  // O agrupamento e a elegibilidade ficam nesta resposta da API local, nunca no painel React.
  const grouped = new Map<
    string,
    {
      name: string;
      institutions: Set<string>;
      exposure: number;
      positions: FgcGroup["positions"];
    }
  >();
  for (const position of eligible) {
    const key = `${client.id}:${position.conglomerateId}`;
    const group = grouped.get(key) ?? {
      name: position.conglomerateName!,
      institutions: new Set<string>(),
      exposure: 0,
      positions: [],
    };
    group.exposure += position.eligibleBalance!;
    group.positions?.push({
      positionId: position.id,
      name: position.name,
      productType: position.productType,
      eligibleBalance: position.eligibleBalance!,
    });
    if (position.institutionName) group.institutions.add(position.institutionName);
    grouped.set(key, group);
  }
  const groups: FgcGroup[] = [...grouped].map(([key, group]) => ({
    conglomerateId: key,
    conglomerateName: group.name,
    institutions: [...group.institutions],
    positions: group.positions,
    eligibleExposure: group.exposure,
    estimatedCoverage: Math.min(group.exposure, ORDINARY_LIMIT),
    estimatedExcess: Math.max(group.exposure - ORDINARY_LIMIT, 0),
    warnings:
      group.exposure > ORDINARY_LIMIT
        ? ["Excesso potencial acima do limite ordinário; não representa perda prevista."]
        : [],
  }));
  return {
    ...common,
    isComplete: groups.length > 0,
    summary: {
      eligibleExposure: groups.reduce((sum, group) => sum + group.eligibleExposure!, 0),
      estimatedCoverage: groups.reduce((sum, group) => sum + group.estimatedCoverage!, 0),
      estimatedExcess: groups.reduce((sum, group) => sum + group.estimatedExcess!, 0),
    },
    groups,
    warnings: [
      "Exposição potencialmente elegível; a cobertura depende das validações pendentes e não é promessa de pagamento.",
    ],
  };
}

function calculateCredit(positions: MockPosition[]): CreditAssessment {
  const privatePosition = positions.find(
    (position) => position.productType === "Debênture" && position.issuerId,
  );
  const issuer = privatePosition?.issuerId ? issuers[privatePosition.issuerId] : undefined;
  if (!privatePosition || !issuer) {
    return {
      totalScore: null,
      dataQualityMessage:
        "Não há emissor de crédito privado com dados suficientes nesta carteira fictícia.",
      missingFactors: ["Dados financeiros e de crédito do emissor"],
      methodologyVersion: "sim-v1",
      asOf: SIMULATION_AS_OF,
      sources: [SOURCE],
    };
  }
  const factorReasons = Object.fromEntries(
    factorKeys.map((key) => {
      const value = issuer.factors[key]!;
      const reading = value >= 80 ? "é favorável" : value >= 60 ? "merece atenção" : "é frágil";
      return [
        key,
        [`Na simulação, o resultado deste indicador ${reading} (${value}/100). ${reasons[key]}`],
      ];
    }),
  ) as Record<CreditFactorKey, string[]>;
  return {
    issuerName: issuer.name,
    totalScore: calculateSimulatedScore(issuer.factors),
    ...issuer.factors,
    factorReasons,
    factorWeights: creditWeights,
    factorSources: Object.fromEntries(
      factorKeys.map((key) => [
        key,
        "Valor manual fictício; sem demonstração financeira, agência de rating ou documento da emissão.",
      ]),
    ) as Record<CreditFactorKey, string>,
    rationale: issuer.rationale,
    linkedInvestmentNames: [privatePosition.name],
    investmentRiskMessage:
      "A estrutura da debênture, prioridade de pagamento, garantias, prazo e liquidez não foram validados por documentos da emissão.",
    portfolioContextMessage: `A posição ${privatePosition.name} representa ${((privatePosition.amount / positions.reduce((sum, position) => sum + position.amount, 0)) * 100).toFixed(1).replace(".", ",")}% da carteira fictícia. A concentração por emissor é monitorada separadamente nos alertas.`,
    suitabilityMessage:
      "A adequação ao perfil do cliente exige análise independente de objetivos, horizonte, liquidez e tolerância a risco; o score do emissor não a determina.",
    methodologyVersion: "sim-v1",
    asOf: SIMULATION_AS_OF,
    sources: ["Fatores manuais fictícios da simulação"],
    warnings: [
      "A nota é do emissor; prazo, liquidez e estrutura do investimento exigem análise separada.",
    ],
  };
}

function alert(
  id: string,
  title: string,
  description: string,
  severity: RiskAlert["severity"],
  relatedTo: string,
  action: string,
  trigger: string,
  asOf = SIMULATION_AS_OF,
): RiskAlert {
  return {
    id,
    title,
    description,
    severity,
    relatedTo,
    action,
    trigger,
    status: "Aberto",
    asOf,
    source: SOURCE,
  };
}

function calculateAlerts(
  client: Client,
  positions: MockPosition[],
  fgc: FgcAnalysis,
  credit: CreditAssessment,
  maturities: InvestmentMaturity[],
  threshold: number,
  calculatedOn: string,
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const largest = getLargestIssuerExposure(positions);
  if (largest && largest.amount / client.assets >= threshold) {
    const share = (largest.amount / client.assets) * 100;
    alerts.push(
      alert(
        `concentration-${client.id}`,
        "Concentração por emissor",
        `${largest.issuerName} representa ${share.toFixed(1).replace(".", ",")}% do patrimônio monitorado (${currency(largest.amount)}).`,
        share >= 25 ? "Alta" : "Média",
        largest.issuerName,
        "Conferir a posição fictícia e avaliar a diversificação por emissor.",
        `Participação de ${share.toFixed(1).replace(".", ",")}% ≥ limite configurado de ${(threshold * 100).toFixed(0)}%.`,
      ),
    );
  }
  if (fgc.isComplete && (fgc.summary?.estimatedExcess ?? 0) > 0) {
    const affectedGroups = fgc.groups?.filter((group) => (group.estimatedExcess ?? 0) > 0) ?? [];
    alerts.push(
      alert(
        `fgc-${client.id}`,
        "Excesso potencial sobre o limite ordinário",
        `${affectedGroups.map((group) => `${group.conglomerateName}: ${currency(group.eligibleExposure!)} de exposição potencialmente elegível e ${currency(group.estimatedExcess!)} de excesso potencial`).join("; ")}. Não é perda prevista nem cobertura confirmada.`,
        "Alta",
        "Proteção FGC",
        "Conferir documentos de titularidade, emissor/conglomerado, elegibilidade, saldo e histórico de garantias antes de estimar cobertura.",
        `Exposição potencial por conglomerado supera o limite ordinário simulado de ${currency(ORDINARY_LIMIT)}.`,
      ),
    );
  }
  if (credit.totalScore != null && credit.totalScore < 80) {
    alerts.push(
      alert(
        `credit-${client.id}`,
        "Acompanhar indicadores de crédito",
        `${credit.issuerName}: score interno simulado ${credit.totalScore}/100. ${credit.rationale ?? ""}`,
        credit.totalScore < 40 ? "Alta" : "Média",
        credit.issuerName ?? "Emissor",
        "Examinar fatores, fontes e estrutura do investimento.",
        `Score fictício do emissor abaixo de 80/100; não mede o risco da carteira do cliente.`,
      ),
    );
  }
  for (const maturity of maturities.filter((item) => item.daysUntil <= 30)) {
    alerts.push(
      alert(
        `maturity-${maturity.positionId}`,
        "Vencimento próximo",
        `${maturity.productName} vence em ${maturity.daysUntil} dias (${maturity.maturityDate}).`,
        "Média",
        maturity.productName,
        "Confirmar data, liquidez e objetivos do cliente.",
        `Vencimento em até 30 dias, calculado em ${calculatedOn}.`,
        calculatedOn,
      ),
    );
  }
  if (client.consent === "Pendente") {
    alerts.push(
      alert(
        `data-${client.id}`,
        "Dados pendentes",
        "Consentimento não ativo; a carteira monitorada pode estar incompleta.",
        "Média",
        client.name,
        "Rever o consentimento simulado e completar as posições fictícias.",
        "Consentimento da simulação está pendente.",
      ),
    );
  }
  const order = { Alta: 0, Média: 1, Baixa: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function getMockClientAnalyses(
  id: number,
  concentrationThreshold = 0.15,
  calculatedOn = todayInSaoPaulo(),
): ClientAnalysesResponse {
  const client = getClientById(id);
  if (!client)
    return {
      isMock: true,
      calculatedOn,
      fgcAnalysis: null,
      creditAssessment: null,
      alerts: [],
      maturities: [],
    };
  const positions = getMockPositions(id);
  if (positions.reduce((sum, position) => sum + position.amount, 0) !== client.assets) {
    return {
      isMock: true,
      calculatedOn,
      fgcAnalysis: {
        isComplete: false,
        dataQualityMessage: "As posições fictícias não somam o patrimônio informado.",
        asOf: SIMULATION_AS_OF,
        sources: [SOURCE],
      },
      creditAssessment: {
        totalScore: null,
        dataQualityMessage: "Carteira fictícia inconsistente.",
        asOf: SIMULATION_AS_OF,
        sources: [SOURCE],
      },
      alerts: [
        alert(
          `quality-${id}`,
          "Dados inconsistentes",
          "A soma das posições difere do patrimônio informado.",
          "Alta",
          client.name,
          "Corrigir as posições fictícias.",
          "Soma das posições difere do patrimônio informado.",
        ),
      ],
      maturities: [],
    };
  }
  const threshold =
    concentrationThreshold > 0 && concentrationThreshold <= 1 ? concentrationThreshold : 0.15;
  const fgcAnalysis = calculateFgc(client, positions);
  const creditAssessment = calculateCredit(positions);
  const maturities = getMockMaturities(positions, calculatedOn);
  return {
    isMock: true,
    calculatedOn,
    fgcAnalysis,
    creditAssessment,
    maturities,
    alerts: calculateAlerts(
      client,
      positions,
      fgcAnalysis,
      creditAssessment,
      maturities,
      threshold,
      calculatedOn,
    ),
  };
}
