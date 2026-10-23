import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SENHA, ADMIN_TOKEN, eAdmin } from "@/lib/apuracao/admin";
import { simAcao, simInfo } from "@/lib/apuracao/sim";

export const dynamic = "force-dynamic";

function respostaEstado(req: NextRequest, extra: Record<string, unknown> = {}) {
  const admin = eAdmin(req);
  return NextResponse.json(
    { admin, sim: admin ? simInfo() : null, ...extra },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function GET(req: NextRequest) {
  return respostaEstado(req);
}

export async function POST(req: NextRequest) {
  const acao = req.nextUrl.searchParams.get("acao");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (acao === "login") {
    const senha = typeof body.senha === "string" ? body.senha : "";
    if (senha !== ADMIN_SENHA) {
      return NextResponse.json(
        { ok: false, erro: "Senha incorreta" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, ADMIN_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });
    return res;
  }

  if (acao === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  }

  if (acao === "sim") {
    if (!eAdmin(req)) {
      return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });
    }
    const cmd = typeof body.cmd === "string" ? body.cmd : "";
    const valor = typeof body.valor === "string" ? body.valor : undefined;
    if (cmd) simAcao(cmd, valor);
    return respostaEstado(req, { ok: true });
  }

  return NextResponse.json({ ok: false, erro: "Ação inválida" }, { status: 400 });
}
