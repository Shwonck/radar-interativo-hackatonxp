"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, Link2, Plus, ShieldCheck } from "lucide-react";
import { clients, type Client } from "@/lib/mock-data";
import type { PortfolioSummary } from "@/lib/api";
import { Avatar, Status } from "../components/ClientVisuals";
import { InviteModal } from "../components/InviteModal";

export default function ConexoesPage() {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const openClient = (client: Client) => router.push(`/clientes/${client.id}`);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/portfolio-summary", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        setSummary((await response.json()) as PortfolioSummary);
      } catch {
        // Mantém os números fictícios atuais quando a API não responde.
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const live = summary && !summary.isMock ? summary : null;
  return (
    <>
      <div className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> OPEN FINANCE
            </div>
            <h1>Conexões</h1>
            <p>Acompanhe autorizações e instituições compartilhadas pelos clientes.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setInviteOpen(true);
            }}
          >
            <Plus size={18} /> Novo convite
          </button>
        </div>
        <div className="connection-summary">
          <div>
            <span className="summary-icon">
              <Link2 size={23} />
            </span>
            <strong>{live ? live.activeConsents : "86"}</strong>
            <small>Consentimentos ativos</small>
          </div>
          <div>
            <span className="summary-icon">
              <Clock3 size={23} />
            </span>
            <strong>07</strong>
            <small>Próximos do vencimento</small>
          </div>
          <div>
            <span className="summary-icon">
              <ShieldCheck size={23} />
            </span>
            <strong>04</strong>
            <small>Instituições representadas</small>
          </div>
        </div>
        <section className="panel connections-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">ACOMPANHAMENTO</div>
              <h2>Consentimentos dos clientes</h2>
            </div>
          </div>
          <div className="connection-list">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  openClient(client);
                }}
              >
                <Avatar client={client} />
                <span className="connection-person">
                  <strong>{client.name}</strong>
                  <small>
                    {client.institutions}{" "}
                    {client.institutions === 1 ? "instituição" : "instituições"} compartilhadas
                  </small>
                </span>
                <Status status={client.consent} />
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
