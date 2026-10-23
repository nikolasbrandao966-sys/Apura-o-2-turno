import { NextRequest, NextResponse } from "next/server";
import { eAdmin } from "@/lib/apuracao/admin";
import { buildSimPayload, municipiosSim, simInfo } from "@/lib/apuracao/sim";
import { getMunConfig, getMunicipios } from "@/lib/apuracao/tse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uf = req.nextUrl.searchParams.get("uf")?.toUpperCase() ?? "";
  if (!uf || uf.length !== 2) {
    return NextResponse.json({ error: "UF inválida" }, { status: 400 });
  }

  // modo simulação (apenas admin logado, com simulação ativa)
  if (req.nextUrl.searchParams.get("sim") === "1" && eAdmin(req) && simInfo().ativo) {
    const payload = buildSimPayload();
    const cfg = (await getMunConfig()) as Parameters<typeof municipiosSim>[0];
    const simMun = municipiosSim(cfg, uf, payload.estados);
    if (simMun) {
      return NextResponse.json(simMun, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }
    return NextResponse.json({ error: "UF não encontrada" }, { status: 404 });
  }

  const payload = await getMunicipios(uf);
  if (!payload) {
    return NextResponse.json(
      { error: "Não foi possível carregar os municípios" },
      { status: 404 },
    );
  }
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
