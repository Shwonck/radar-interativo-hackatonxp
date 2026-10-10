"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Filter, Plus, Search } from "lucide-react";
import { clients, type Client } from "@/lib/mock-data";
import { ClientsTable } from "../components/ClientsTable";
import { InviteModal } from "../components/InviteModal";

export default function ClientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [inviteOpen, setInviteOpen] = useState(false);
  const filtered = useMemo(
    () =>
      clients.filter((client) => {
        const matches = `${client.name} ${client.email} ${client.profile}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matches && (filter === "Todos" || client.consent === filter);
      }),
    [search, filter],
  );
  const openClient = (client: Client) => router.push(`/clientes/${client.id}`);
  const exportCsv = () => {
    const rows = [
      ["Cliente", "Perfil", "Patrimônio (BRL)", "Variação (%)", "Instituições", "Consentimento"],
      ...filtered.map((client) => [
        client.name,
        client.profile,
        String(client.assets),
        String(client.change),
        String(client.institutions),
        client.consent,
      ]),
    ];
    // BOM UTF-8, ponto e vírgula e aspas escapadas facilitam a abertura no Excel em pt-BR.
    const csv =
      "\uFEFF" +
      rows
        .map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(";"))
        .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "xp-clientes-ficticios.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> RELACIONAMENTO
            </div>
            <h1>Seus clientes</h1>
            <p>Consulte perfis e patrimônio em uma única visão.</p>
            <p className="analysis-origin">
              Clientes, valores e conexões fictícios; sem dados reais da Pluggy ou Open Finance.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setInviteOpen(true);
            }}
          >
            <Plus size={18} /> Convidar cliente
          </button>
        </div>
        <div className="list-tools">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar cliente"
              placeholder="Buscar por nome, e-mail ou perfil"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="filter-field">
            <Filter size={17} />
            <select
              aria-label="Filtrar consentimento"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option>Todos</option>
              <option>Ativo</option>
              <option>Pendente</option>
              <option>Expirando</option>
            </select>
          </div>
          <button className="secondary-button" onClick={exportCsv}>
            <Download size={17} /> Exportar CSV
          </button>
        </div>
        <ClientsTable filtered={filtered} onOpen={openClient} />
      </div>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
