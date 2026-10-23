import { NextRequest, NextResponse } from "next/server";
import { eAdmin } from "@/lib/apuracao/admin";
import { buildSimPayload, simInfo } from "@/lib/apuracao/sim";
import { getApuracao } from "@/lib/apuracao/tse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sim = req.nextUrl.searchParams.get("sim") === "1" && eAdmin(req) && simInfo().ativo;

  if (sim) {
    const payload = buildSimPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  const payload = await getApuracao();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
