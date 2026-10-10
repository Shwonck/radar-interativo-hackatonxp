"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { clients, compactMoney, type Client } from "@/lib/mock-data";
import { Avatar } from "../components/ClientVisuals";

export default function OportunidadesPage() {
  const router = useRouter();
  const openClient = (client: Client) => router.push(`/clientes/${client.id}`);
  return (
    <>
      <div className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> INTELIGÊNCIA DE CARTEIRA
            </div>
            <h1>Oportunidades</h1>
            <p>Sinais para apoiar conversas relevantes com cada cliente.</p>
          </div>
          <span className="insight-counter">
            <Sparkles size={17} /> 12 insights identificados
          </span>
        </div>
        <div className="insight-intro">
          <Sparkles size={24} />
          <div>
            <strong>Transforme dados em conversas melhores</strong>
            <p>Valide o contexto, o perfil e a adequação antes de recomendar qualquer ação.</p>
          </div>
        </div>
        <div className="insight-grid">
          {clients.map((client, index) => (
            <button className="insight-card" key={client.id} onClick={() => openClient(client)}>
              <div className="insight-top">
                <span className={`insight-type type-${index % 3}`}>
                  {["Diversificação", "Alocação", "Relacionamento"][index % 3]}
                </span>
                <ArrowUpRight size={18} />
              </div>
              <strong>{client.opportunity}</strong>
              <div className="insight-person">
                <Avatar client={client} />
                <span>
                  <b>{client.name}</b>
                  <small>
                    {client.profile} · {compactMoney(client.assets)}
                  </small>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
