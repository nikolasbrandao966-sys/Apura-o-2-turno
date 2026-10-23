"use client";

import { Globe2 } from "lucide-react";
import type { ApuracaoPayload, CandidatoId } from "@/lib/apuracao/types";
import { PRESIDENTES } from "@/lib/apuracao/oficial";
import { formatPct } from "@/lib/apuracao/format";

const COR: Record<CandidatoId, string> = {
  flavio: PRESIDENTES.flavio.cor,
  lula: PRESIDENTES.lula.cor,
};

export function EstadosGrid({
  payload,
  onSelectUf,
}: {
  payload: ApuracaoPayload;
  onSelectUf: (uf: string) => void;
}) {
  const estados = payload.estados;
  const comVotos = estados.some((e) => e.flavio.votes + e.lula.votes > 0);

  return (
    <section id="estados" className="scroll-mt-24">
      <div className="mb-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Estados e Exterior</h2>
        <p className="text-xs text-slate-500">
          Toque em uma unidade para ver os municípios onde os boletins já chegaram.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {estados.map((e) => {
          const total = e.flavio.votes + e.lula.votes;
          const lider = e.lider;
          const liderPct = lider === "flavio" ? e.flavio.pct : e.lula.pct;
          const nomeLider = lider === "flavio" ? "Flávio" : "Lula";
          const dec = e.exterior || e.eleito || e.matematicamente;
          return (
            <button
              key={e.uf}
              onClick={() => onSelectUf(e.uf)}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-[13px] font-black tracking-tight text-slate-900">
                  {e.exterior ? (
                    <span className="inline-flex items-center gap-1">
                      <Globe2 className="h-3.5 w-3.5 text-slate-400" /> Exterior
                    </span>
                  ) : (
                    e.uf
                  )}
                </p>
                {e.eleito ? (
                  <span
                    className="rounded-full px-1.5 py-px text-[9px] font-black uppercase text-white"
                    style={{ backgroundColor: COR[e.eleito] }}
                  >
                    Eleito
                  </span>
                ) : e.matematicamente ? (
                  <span
                    className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase text-white"
                    style={{ backgroundColor: COR[e.matematicamente] }}
                  >
                    Mat.
                  </span>
                ) : null}
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${e.progresso * 100}%` }}
                />
              </div>

              <p className="mt-1.5 truncate text-[11px] tabular-nums text-slate-500">
                {comVotos && total > 0 ? (
                  <>
                    <span className="font-bold" style={{ color: COR[lider as CandidatoId] }}>
                      {nomeLider} {formatPct(liderPct, 1)}
                    </span>{" "}
                    · {formatPct(e.progresso * 100, 0).replace(",0", "")} apurado
                  </>
                ) : (
                  <>Aguardando boletins</>
                )}
              </p>
              {dec && (
                <p className="sr-only">
                  {e.nome} — {e.exterior ? "apuração do eleitorado no exterior" : e.nome}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
