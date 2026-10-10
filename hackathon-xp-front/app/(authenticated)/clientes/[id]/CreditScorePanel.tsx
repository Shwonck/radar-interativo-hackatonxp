import { Activity, CircleAlert } from "lucide-react";
import type { CreditAssessment, CreditFactorKey } from "@/lib/analysis-contract";
import { AnalysisOrigin } from "./FgcExposurePanel";

const factorLabels: { key: CreditFactorKey; label: string }[] = [
  { key: "paymentCapacityScore", label: "Capacidade de pagamento" },
  { key: "leverageScore", label: "Endividamento" },
  { key: "liquidityScore", label: "Liquidez" },
  { key: "creditHistoryScore", label: "Histórico de crédito" },
  { key: "externalRatingScore", label: "Rating externo" },
  { key: "guaranteesScore", label: "Garantias e estrutura" },
];

function scoreBand(score: number) {
  if (score >= 80) return "Indicadores favoráveis";
  if (score >= 60) return "Atenção";
  if (score >= 40) return "Risco elevado";
  return "Crítico";
}

export function CreditScorePanel({
  assessment,
  isMock,
  clientName,
}: {
  assessment: CreditAssessment | null | undefined;
  isMock?: boolean;
  clientName: string;
}) {
  const score = assessment?.totalScore;

  return (
    <section className="panel analysis-panel" aria-labelledby="credit-title">
      <div className="detail-section-heading analysis-heading">
        <div>
          <span className="section-kicker">ANÁLISE DO EMISSOR</span>
          <h2 id="credit-title">
            <Activity size={19} /> Risco de crédito privado
          </h2>
        </div>
        {isMock && <span className="analysis-sample">Dados fictícios</span>}
      </div>

      {score == null ? (
        <>
          <p className="analysis-empty">Score indisponível.</p>
          <p className="analysis-muted">
            {assessment?.dataQualityMessage ??
              "Não há dados suficientes para concluir a avaliação."}
          </p>
          {assessment?.missingFactors?.length ? (
            <div className="analysis-missing">
              <strong>Informações pendentes</strong>
              <ul>
                {assessment.missingFactors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {assessment?.warnings?.map((warning, index) => (
            <p className="analysis-muted" key={`${warning}-${index}`}>
              {warning}
            </p>
          ))}
          <AnalysisOrigin asOf={assessment?.asOf} sources={assessment?.sources} />
          {assessment?.methodologyVersion && (
            <p className="analysis-origin">Metodologia: {assessment.methodologyVersion}</p>
          )}
        </>
      ) : (
        <>
          <div className="credit-score-overview">
            <div className="credit-score-number">
              <strong>{score}</strong>
              <span>/ 100</span>
            </div>
            <div>
              <span className="analysis-muted">{assessment?.issuerName ?? "Emissor avaliado"}</span>
              <h3>{scoreBand(score)}</h3>
              <p>{assessment?.rationale ?? "Consulte os fatores avaliados abaixo."}</p>
              {assessment?.linkedInvestmentNames?.length ? (
                <p>Investimento relacionado: {assessment.linkedInvestmentNames.join(", ")}</p>
              ) : null}
            </div>
          </div>
          <p className="analysis-note">
            <CircleAlert size={16} />
            Score fictício do emissor {assessment?.issuerName}; não é nota de {clientName}, rating
            oficial nem probabilidade de inadimplência.
          </p>
          <div className="credit-risk-context">
            <div>
              <strong>Capacidade de pagamento do emissor</strong>
              <p>{assessment?.rationale}</p>
            </div>
            <div>
              <strong>Estrutura da emissão</strong>
              <p>{assessment?.investmentRiskMessage}</p>
            </div>
            <div>
              <strong>Concentração da carteira</strong>
              <p>{assessment?.portfolioContextMessage}</p>
            </div>
            <div>
              <strong>Adequação ao perfil</strong>
              <p>{assessment?.suitabilityMessage}</p>
            </div>
          </div>
          <div className="credit-factors">
            <h3>Fatores da nota</h3>
            {factorLabels.map(({ key, label }) => {
              const value = assessment?.[key];
              const weight = assessment?.factorWeights?.[key];
              return (
                <div className="credit-factor" key={key}>
                  <div className="credit-factor-label">
                    <strong>{label}</strong>
                    <span>
                      {weight == null ? "Peso não informado" : `Peso ${(weight * 100).toFixed(0)}%`}{" "}
                      · {value == null ? "Não disponível" : `${value}/100`}
                    </span>
                  </div>
                  <div className="credit-factor-track">
                    <span style={{ width: `${value ?? 0}%` }} />
                  </div>
                  {assessment?.factorReasons?.[key]?.map((reason, index) => (
                    <p key={`${key}-${index}`}>{reason}</p>
                  ))}
                  <small>Fonte: {assessment?.factorSources?.[key] ?? "Não informada"}</small>
                </div>
              );
            })}
          </div>
          {assessment?.warnings?.map((warning, index) => (
            <p className="analysis-muted" key={`${warning}-${index}`}>
              {warning}
            </p>
          ))}
          <AnalysisOrigin asOf={assessment?.asOf} sources={assessment?.sources} />
          {assessment?.methodologyVersion && (
            <p className="analysis-origin">Metodologia: {assessment.methodologyVersion}</p>
          )}
          <p className="analysis-next">
            Próximo passo: examine as fragilidades do emissor, as garantias e a adequação do ativo
            ao perfil do cliente.
          </p>
        </>
      )}
    </section>
  );
}
