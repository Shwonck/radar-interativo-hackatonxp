import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPortfolioSummary } from "@/lib/api";

export async function GET() {
  const session = (await cookies()).get("xp-demo-session")?.value;
  if (session !== "active") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const summary = await getPortfolioSummary();
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
