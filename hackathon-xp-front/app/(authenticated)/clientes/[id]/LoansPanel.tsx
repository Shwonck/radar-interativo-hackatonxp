import { Landmark } from "lucide-react";
import type { ClientLoans, Loan } from "@/lib/api";
import { money } from "@/lib/mock-data";

const DASH = "—";

function formatMoney(value: number | null | undefined) {
  return value == null ? DASH : money(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return DASH;
  const date = /^\d{4}-\d{2}-\d{2}/.test(value)
    ? new Date(`${value.slice(0, 10)}T00:00:00Z`)
    : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date)
    : value;
}

function formatRate(value: number | null | undefined) {
  if (value == null) return DASH;
  // Taxas vêm como fração mensal (ex.: 0.0129 = 1,29% a.m.).
  return `${(value * 100).toFixed(2).replace(".", ",")}% a.m.`;
}

export function LoansPanel({ data }: { data: ClientLoans | null | undefined }) {
  const loans = data?.loans ?? [];

  return (
    <section className="panel analysis-panel" aria-labelledby="loans-title">
      <div className="detail-section-heading analysis-heading">
        <div>
          <span className="section-kicker">OPEN FINANCE</span>
          <h2 id="loans-title">
            <Landmark size={19} /> Dívidas e empréstimos
          </h2>
        </div>
        {data?.isMock && <span className="analysis-sample">Dados fictícios</span>}
      </div>

      {loans.length === 0 ? (
        <p className="analysis-empty">Nenhuma dívida identificada para este cliente.</p>
      ) : (
        <>
          <div className="analysis-summary">
            <div>
              <span>Saldo devedor total</span>
              <strong>{formatMoney(data?.totalOutstandingDebt)}</strong>
            </div>
            <div>
              <span>Contratos</span>
              <strong>{loans.length}</strong>
            </div>
          </div>
          <div className="detail-holdings">
            {loans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} />
            ))}
          </div>
          <p className="analysis-next">
            Próximo passo: revise custo efetivo e vencimentos antes de propor renegociação ou
            portabilidade ao cliente.
          </p>
        </>
      )}
    </section>
  );
}

function LoanRow({ loan }: { loan: Loan }) {
  return (
    <div className="detail-holding">
      <div>
        <strong>{loan.productName ?? "Não informado"}</strong>
        <small>
          Vencimento: {formatDate(loan.dueDate)} · Taxa: {formatRate(loan.interestRate)} · CET:{" "}
          {formatRate(loan.cet)}
        </small>
      </div>
      <div>
        <strong>{formatMoney(loan.contractOutstandingBalance)}</strong>
        <small>Contratado: {formatMoney(loan.contractAmount)}</small>
      </div>
    </div>
  );
}
