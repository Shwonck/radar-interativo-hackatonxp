import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseClientAnalyses } from "@/lib/analysis-contract";
import { getClientById } from "@/lib/mock-data";
import { getMockClientAnalyses } from "@/lib/mock-analyses";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await cookies()).get("xp-demo-session")?.value;
  if (session !== "active") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const client = getClientById(id);
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const apiBase = process.env.ANALYSIS_API_BASE_URL;
  if (!apiBase) {
    const threshold = Number(process.env.SIMULATION_CONCENTRATION_THRESHOLD ?? 0.15);
    return NextResponse.json(getMockClientAnalyses(client.id, threshold), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const endpoint = new URL(`clientes/${client.id}/analises`, `${apiBase.replace(/\/$/, "")}/`);
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`A API retornou ${response.status}.`);

    const analysis = parseClientAnalyses(await response.json());
    if (!analysis) throw new Error("Resposta de análise inválida.");

    return NextResponse.json(
      { ...analysis, isMock: false },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Falha ao carregar análises do cliente:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as análises." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
