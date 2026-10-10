export type FgcGroup = {
  conglomerateId: string;
  conglomerateName: string;
  institutions?: string[];
  eligibleExposure: number | null;
  estimatedCoverage: number | null;
  estimatedExcess: number | null;
  warnings?: string[];
  positions?: { positionId: string; name: string; productType: string; eligibleBalance: number }[];
};

export type FgcAnalysis = {
  isComplete: boolean;
  summary?: {
    eligibleExposure: number | null;
    estimatedCoverage: number | null;
    estimatedExcess: number | null;
  };
  groups?: FgcGroup[];
  excludedProducts?: string[];
  warnings?: string[];
  dataQualityMessage?: string;
  globalLimitMessage?: string;
  pendingChecks?: string[];
  asOf?: string;
  sources?: string[];
};

export type CreditFactorKey =
  | "paymentCapacityScore"
  | "leverageScore"
  | "liquidityScore"
  | "creditHistoryScore"
  | "externalRatingScore"
  | "guaranteesScore";

export type CreditAssessment = {
  issuerName?: string;
  totalScore: number | null;
  paymentCapacityScore?: number | null;
  leverageScore?: number | null;
  liquidityScore?: number | null;
  creditHistoryScore?: number | null;
  externalRatingScore?: number | null;
  guaranteesScore?: number | null;
  factorReasons?: Partial<Record<CreditFactorKey, string[]>>;
  factorWeights?: Partial<Record<CreditFactorKey, number>>;
  factorSources?: Partial<Record<CreditFactorKey, string>>;
  investmentRiskMessage?: string;
  portfolioContextMessage?: string;
  suitabilityMessage?: string;
  rationale?: string;
  warnings?: string[];
  missingFactors?: string[];
  dataQualityMessage?: string;
  asOf?: string;
  sources?: string[];
  methodologyVersion?: string;
  linkedInvestmentNames?: string[];
};

export type RiskAlert = {
  id: string;
  title: string;
  description: string;
  severity: "Baixa" | "Média" | "Alta";
  asOf: string;
  source: string;
  relatedTo: string;
  status: "Aberto";
  action: string;
  trigger?: string;
};

export type InvestmentMaturity = {
  positionId: string;
  productName: string;
  amount: number;
  maturityDate: string;
  daysUntil: number;
};

export type ClientAnalysesResponse = {
  fgcAnalysis: FgcAnalysis | null;
  creditAssessment: CreditAssessment | null;
  alerts?: RiskAlert[];
  maturities?: InvestmentMaturity[];
  isMock: boolean;
  calculatedOn?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAmount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isScore = (value: unknown) =>
  value === null ||
  (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100);

const isOptionalString = (value: unknown) => value === undefined || typeof value === "string";
const isOptionalStringArray = (value: unknown) =>
  value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));

const creditFactorKeys = [
  "paymentCapacityScore",
  "leverageScore",
  "liquidityScore",
  "creditHistoryScore",
  "externalRatingScore",
  "guaranteesScore",
] as const;

// Dados externos inválidos não devem produzir uma cobertura ou nota aparentemente confiável.
export function parseClientAnalyses(value: unknown): ClientAnalysesResponse | null {
  if (!isRecord(value)) return null;

  const fgc = value.fgcAnalysis;
  const credit = value.creditAssessment;
  if (fgc !== null && !isRecord(fgc)) return null;
  if (credit !== null && !isRecord(credit)) return null;

  if (fgc) {
    if (typeof fgc.isComplete !== "boolean") return null;
    if (
      !isOptionalString(fgc.dataQualityMessage) ||
      !isOptionalString(fgc.globalLimitMessage) ||
      !isOptionalString(fgc.asOf) ||
      !isOptionalStringArray(fgc.sources) ||
      !isOptionalStringArray(fgc.warnings) ||
      !isOptionalStringArray(fgc.excludedProducts) ||
      !isOptionalStringArray(fgc.pendingChecks)
    ) {
      return null;
    }
    if (fgc.isComplete) {
      if (!isRecord(fgc.summary) || !Array.isArray(fgc.groups) || !fgc.groups.length) return null;
      if (typeof fgc.asOf !== "string" || !Array.isArray(fgc.sources) || !fgc.sources.length)
        return null;
      if (
        !isAmount(fgc.summary.eligibleExposure) ||
        !isAmount(fgc.summary.estimatedCoverage) ||
        !isAmount(fgc.summary.estimatedExcess)
      ) {
        return null;
      }
      if (
        !fgc.groups.every(
          (group) =>
            isRecord(group) &&
            typeof group.conglomerateId === "string" &&
            typeof group.conglomerateName === "string" &&
            isOptionalStringArray(group.institutions) &&
            isOptionalStringArray(group.warnings) &&
            (group.positions === undefined ||
              (Array.isArray(group.positions) &&
                group.positions.every(
                  (position) =>
                    isRecord(position) &&
                    typeof position.positionId === "string" &&
                    typeof position.name === "string" &&
                    typeof position.productType === "string" &&
                    isAmount(position.eligibleBalance),
                ))) &&
            isAmount(group.eligibleExposure) &&
            isAmount(group.estimatedCoverage) &&
            isAmount(group.estimatedExcess),
        )
      ) {
        return null;
      }
    }
  }

  if (credit) {
    if (!isScore(credit.totalScore)) return null;
    if (
      !isOptionalString(credit.issuerName) ||
      !isOptionalString(credit.rationale) ||
      !isOptionalString(credit.dataQualityMessage) ||
      !isOptionalString(credit.asOf) ||
      !isOptionalString(credit.methodologyVersion) ||
      !isOptionalString(credit.investmentRiskMessage) ||
      !isOptionalString(credit.portfolioContextMessage) ||
      !isOptionalString(credit.suitabilityMessage) ||
      !isOptionalStringArray(credit.sources) ||
      !isOptionalStringArray(credit.warnings) ||
      !isOptionalStringArray(credit.missingFactors) ||
      !isOptionalStringArray(credit.linkedInvestmentNames)
    ) {
      return null;
    }
    if (!creditFactorKeys.every((key) => credit[key] === undefined || isScore(credit[key]))) {
      return null;
    }
    if (
      typeof credit.totalScore === "number" &&
      (typeof credit.asOf !== "string" ||
        !Array.isArray(credit.sources) ||
        !credit.sources.length ||
        typeof credit.methodologyVersion !== "string" ||
        !creditFactorKeys.every((key) => typeof credit[key] === "number"))
    ) {
      return null;
    }
    const reasons = credit.factorReasons;
    if (
      reasons !== undefined &&
      (!isRecord(reasons) || !creditFactorKeys.every((key) => isOptionalStringArray(reasons[key])))
    ) {
      return null;
    }
    const weights = credit.factorWeights;
    const factorSources = credit.factorSources;
    if (
      factorSources !== undefined &&
      (!isRecord(factorSources) ||
        !creditFactorKeys.every((key) => isOptionalString(factorSources[key])))
    )
      return null;
    if (
      weights !== undefined &&
      (!isRecord(weights) ||
        !creditFactorKeys.every(
          (key) =>
            weights[key] === undefined ||
            (typeof weights[key] === "number" &&
              Number.isFinite(weights[key]) &&
              weights[key] >= 0 &&
              weights[key] <= 1),
        ))
    ) {
      return null;
    }
  }

  if (
    (value.alerts !== undefined &&
      (!Array.isArray(value.alerts) ||
        !value.alerts.every(
          (alert) =>
            isRecord(alert) &&
            typeof alert.id === "string" &&
            typeof alert.title === "string" &&
            typeof alert.description === "string" &&
            ["Baixa", "Média", "Alta"].includes(String(alert.severity)) &&
            typeof alert.asOf === "string" &&
            typeof alert.source === "string" &&
            typeof alert.relatedTo === "string" &&
            alert.status === "Aberto" &&
            typeof alert.action === "string" &&
            isOptionalString(alert.trigger),
        ))) ||
    (value.maturities !== undefined &&
      (!Array.isArray(value.maturities) ||
        !value.maturities.every(
          (maturity) =>
            isRecord(maturity) &&
            typeof maturity.positionId === "string" &&
            typeof maturity.productName === "string" &&
            isAmount(maturity.amount) &&
            typeof maturity.maturityDate === "string" &&
            typeof maturity.daysUntil === "number" &&
            Number.isFinite(maturity.daysUntil),
        )))
  ) {
    return null;
  }

  return {
    fgcAnalysis: (fgc as FgcAnalysis | null) ?? null,
    creditAssessment: (credit as CreditAssessment | null) ?? null,
    alerts: value.alerts as RiskAlert[] | undefined,
    maturities: value.maturities as InvestmentMaturity[] | undefined,
    isMock: value.isMock === true,
    calculatedOn: typeof value.calculatedOn === "string" ? value.calculatedOn : undefined,
  };
}
