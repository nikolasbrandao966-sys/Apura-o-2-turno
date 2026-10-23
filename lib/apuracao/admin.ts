// Autenticação simples da área admin (senha única) via cookie httpOnly.
import type { NextRequest } from "next/server";

export const ADMIN_SENHA = process.env.ADMIN_SENHA ?? "admin2026";
export const ADMIN_COOKIE = "adm26";
export const ADMIN_TOKEN = "adm-2t-2026-sim";

export function eAdmin(req: NextRequest): boolean {
  return req.cookies.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
}
