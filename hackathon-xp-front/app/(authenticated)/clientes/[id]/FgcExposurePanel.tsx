import { CircleAlert, ShieldCheck } from "lucide-react";
import type { FgcAnalysis } from "@/lib/analysis-contract";

const formatCurrency = (value: number | null | undefined) =>
  value == null
    ? "Não disponível"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function FgcExposurePanel({
  analysis,
  isMock,
}: {
  analysis: FgcAnalysis | null | undefined;
  isMock?: boolean;
}) {
  return (
    <section className="panel analysis-panel" aria-labelledby="fgc-title">
      <div className="detail-section-heading analysis-heading">
        <div>
          <span className="section-kicker">GARANTIA ORDINÁRIA</span>
          <h2 id="fgc-title">
            <ShieldCheck size={19} /> Proteção FGC
          </h2>
        </div>
        {isMock && <span className="analysis-sample">Dados fictícios</span>}
      </div>

      {!analysis ? (
        <p className="analysis-empty">Análise de FGC indisponível.</p>
      ) : !analysis.isComplete ? (
        <>
          <p className="analysis-empty">Dados insuficientes para concluir a análise.</p>
          {analysis.dataQualityMessage && (
            <p className="analysis-muted">{analysis.dataQualityMessage}</p>
          )}
          <WarningList warnings={analysis.warnings} />
          {analysis.pendingChecks?.length ? (
            <div className="analysis-missing">
              <strong>Validações pendentes</strong>
              <WarningList warnings={analysis.pendingChecks} />
            </div>
          ) : null}
          {analysis.excludedProducts?.length ? (
            <p className="analysis-muted">
              Fora da garantia ordinária nesta simulação: {analysis.excludedProducts.join(", ")}.
            </p>
          ) : null}
          <AnalysisOrigin asOf={analysis.asOf} sources={analysis.sources} />
        </>
      ) : (
        <>
          <p className="analysis-muted">
            Classificação e agrupamento calculados pela API local com posições fictícias. A
            elegibilidade e os limites ainda exigem validação documental.
          </p>
          <div className="analysis-summary">
            <div>
              <span>Exposição potencialmente elegível</span>
              <strong>{formatCurrency(analysis.summary?.eligibleExposure)}</strong>
            </div>
            <div>
              <span>Dentro do limite ordinário estimado</span>
              <strong>{formatCurrency(analysis.summary?.estimatedCoverage)}</strong>
            </div>
            <div className="analysis-excess">
              <span>Excesso potencial sobre o limite</span>
              <strong>{formatCurrency(analysis.summary?.estimatedExcess)}</strong>
            </div>
          </div>
          <div className="analysis-group-list">
            {analysis.groups?.map((group) => (
              <article className="analysis-group" key={group.conglomerateId}>
                <div className="analysis-group-title">
                  <h3>{group.conglomerateName}</h3>
                  <strong>{formatCurrency(group.estimatedCoverage)}</strong>
                </div>
                {group.institutions?.length ? (
                  <p>Instituições: {group.institutions.join(", ")}</p>
                ) : null}
                {group.positions?.length ? (
                  <div className="analysis-positions">
                    <strong>Posições potencialmente elegíveis</strong>
                    <ul>
                      {group.positions.map((position) => (
                        <li key={position.positionId}>
                          {position.name} ({position.productType}) ·{" "}
                          {formatCurrency(position.eligibleBalance)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <dl>
                  <div>
                    <dt>Exposição potencialmente elegível</dt>
                    <dd>{formatCurrency(group.eligibleExposure)}</dd>
                  </div>
                  <div>
                    <dt>Parcela sob o limite ordinário (estimativa)</dt>
                    <dd>{formatCurrency(group.estimatedCoverage)}</dd>
                  </div>
                  <div>
                    <dt>Excesso potencial sobre o limite</dt>
                    <dd>{formatCurrency(group.estimatedExcess)}</dd>
                  </div>
                </dl>
                <WarningList warnings={group.warnings} />
              </article>
            ))}
          </div>
          {analysis.globalLimitMessage && (
            <div className="analysis-note">
              <CircleAlert size={16} />
              {analysis.globalLimitMessage}
            </div>
          )}
          <WarningList warnings={analysis.warnings} />
          {analysis.pendingChecks?.length ? (
            <div className="analysis-missing">
              <strong>Validações pendentes</strong>
              <WarningList warnings={analysis.pendingChecks} />
            </div>
          ) : null}
          {analysis.excludedProducts?.length ? (
            <p className="analysis-muted">
              Produtos fora da garantia ordinária: {analysis.excludedProducts.join(", ")}.
            </p>
          ) : null}
          <AnalysisOrigin asOf={analysis.asOf} sources={analysis.sources} />
          <p className="analysis-next">
            Próximo passo: confirme valores, titularidade e conglomerados antes de explicar a
            cobertura ao cliente. Excesso não é previsão de perda.
          </p>
        </>
      )}
    </section>
  );
}

function WarningList({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return null;
  return (
    <ul className="analysis-warnings">
      {warnings.map((warning, index) => (
        <li key={`${warning}-${index}`}>{warning}</li>
      ))}
    </ul>
  );
}

export function AnalysisOrigin({ asOf, sources }: { asOf?: string; sources?: string[] }) {
  if (!asOf && !sources?.length) return null;
  const date = asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? new Date(`${asOf}T00:00:00Z`) : null;
  const formattedDate =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date)
      : asOf;
  return (
    <p className="analysis-origin">
      {asOf && <>Data-base: {formattedDate}</>}
      {asOf && sources?.length ? " · " : ""}
      {sources?.length ? `Fonte: ${sources.join(", ")}` : ""}
    </p>
  );
}
