"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { ApuracaoPayload } from "@/lib/apuracao/types";
import { useAdmin } from "./use-admin";

const ENCERRAMENTO = new Date("2026-10-25T17:00:00-03:00").getTime();

export function useContagemRegressiva() {
  const [restante, setRestante] = useState(() => ENCERRAMENTO - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRestante(ENCERRAMENTO - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (restante <= 0) return { texto: "", ativo: false };
  const dias = Math.floor(restante / 86_400_000);
  const horas = Math.floor((restante % 86_400_000) / 3_600_000);
  const min = Math.floor((restante % 3_600_000) / 60_000);
  const seg = Math.floor((restante % 60_000) / 1000);
  const texto =
    dias > 0
      ? `${dias}d ${String(horas).padStart(2, "0")}h ${String(min).padStart(2, "0")}m ${String(seg).padStart(2, "0")}s`
      : `${String(horas).padStart(2, "0")}h ${String(min).padStart(2, "0")}m ${String(seg).padStart(2, "0")}s`;
  return { texto, ativo: true };
}

export function Header({
  payload,
  onAtualizar,
  carregando,
}: {
  payload: ApuracaoPayload | null;
  onAtualizar: () => void;
  carregando: boolean;
}) {
  const { sim } = useAdmin();
  const status = payload?.meta.status ?? "aguardando";
  const { texto: contagem, ativo: contagemAtivo } = useContagemRegressiva();

  const statusPill = sim?.ativo
    ? { texto: "Simulação", cls: "bg-amber-100 text-amber-800 border-amber-200" }
    : status === "apurando"
      ? { texto: "Ao vivo", cls: "bg-amber-100 text-amber-800 border-amber-200" }
      : status === "encerrado"
        ? { texto: "Concluído", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" }
        : { texto: "Aguardando boletins", cls: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
            Apuração do 2º Turno
          </p>
          <p className="text-[11px] text-slate-500">Eleições 2026 • 25 de outubro</p>
        </div>

        <div className="ms-auto flex items-center gap-2">
          {status === "apurando" && (
            <span className="me-1 flex h-2 w-2">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-amber-500/60" />
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPill.cls}`}
          >
            {statusPill.texto}
          </span>

          {payload && (
            <span className="hidden text-[11px] tabular-nums text-slate-400 sm:inline">
              {payload.meta.atualizadoEm
                ? `Atualizado ${new Date(payload.meta.atualizadoEm).toLocaleTimeString("pt-BR")}`
                : ""}
            </span>
          )}

          <button
            onClick={onAtualizar}
            disabled={carregando}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            aria-label="Atualizar agora"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {contagemAtivo && status === "aguardando" && !sim?.ativo && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-[11px] tabular-nums text-slate-500">
            As urnas fecham em <span className="font-bold text-slate-700">{contagem}</span> — os
            primeiros boletins chegam logo depois das 17h (horário de Brasília)
          </p>
        </div>
      )}
    </header>
  );
}
