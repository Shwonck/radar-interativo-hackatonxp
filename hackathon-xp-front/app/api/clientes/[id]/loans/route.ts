import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getClientLoans } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await cookies()).get("xp-demo-session")?.value;
  if (session !== "active") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const loans = await getClientLoans(id);
  return NextResponse.json(loans, {
    headers: { "Cache-Control": "no-store" },
  });
}
