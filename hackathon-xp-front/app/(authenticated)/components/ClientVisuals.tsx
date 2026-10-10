import type { Client, Consent } from "@/lib/mock-data";

export function Avatar({ client, large = false }: { client: Client; large?: boolean }) {
  return (
    <span className={`client-avatar ${large ? "large" : ""}`} style={{ background: client.color }}>
      {client.initials}
    </span>
  );
}

export function Status({ status }: { status: Consent }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
