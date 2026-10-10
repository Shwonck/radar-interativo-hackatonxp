"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Search } from "lucide-react";
import { Client, clients, money } from "@/lib/mock-data";
import { Avatar, Status } from "./ClientVisuals";

export function ClientsTable({
  filtered,
  onOpen,
  onAll,
  compact = false,
}: {
  filtered: Client[];
  onOpen: (client: Client) => void;
  onAll?: () => void;
  compact?: boolean;
}) {
  return (
    <section className="panel clients-panel">
      <div className="panel-heading">
        <div>
          <div className="section-kicker">SUA CARTEIRA</div>
          <h2>{compact ? "Clientes em destaque" : "Lista de clientes"}</h2>
          <p>
            {compact
              ? "Acompanhe os perfis mais recentes"
              : `${filtered.length} clientes encontrados`}
          </p>
        </div>
        {onAll && (
          <button className="text-link" onClick={onAll}>
            Ver todos <ArrowRight size={16} />
          </button>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>CLIENTE</th>
              <th>PERFIL</th>
              <th>PATRIMÔNIO</th>
              <th>VARIAÇÃO</th>
              <th>OPEN FINANCE</th>
              <th aria-label="Abrir" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr
                key={client.id}
                onClick={() => onOpen(client)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onOpen(client);
                }}
              >
                <td>
                  <span className="table-person">
                    <Avatar client={client} />
                    <span>
                      <strong>{client.name}</strong>
                      <small>{client.email}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <span className="profile-pill">{client.profile}</span>
                </td>
                <td className="amount-cell">{money(client.assets)}</td>
                <td>
                  <span className={`change-cell ${client.change >= 0 ? "positive" : "negative"}`}>
                    {client.change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {Math.abs(client.change).toFixed(1).replace(".", ",")}%
                  </span>
                </td>
                <td>
                  <Status status={client.consent} />
                </td>
                <td>
                  <ChevronRight size={18} className="row-chevron" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Search size={23} />
            <strong>Nenhum cliente encontrado</strong>
            <span>Tente outro nome ou ajuste o filtro.</span>
          </div>
        )}
      </div>
      {!compact && (
        <div className="table-footer">
          <span>
            Exibindo {filtered.length} de {clients.length} clientes
          </span>
        </div>
      )}
    </section>
  );
}
