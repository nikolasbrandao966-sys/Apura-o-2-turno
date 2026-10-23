"use client";

import { useMemo, useState } from "react";
import { Globe2 } from "lucide-react";
import type { ApuracaoPayload, CandidatoId, EstadoResultado } from "@/lib/apuracao/types";
import { PRESIDENTES } from "@/lib/apuracao/oficial";
import { formatPct } from "@/lib/apuracao/format";
import { BRASIL_MAPA, MAPA_VIEWBOX } from "@/lib/brazil-map";

const COR: Record<CandidatoId, string> = {
  flavio: PRESIDENTES.flavio.cor,
  lula: PRESIDENTES.lula.cor,
};

const SEM_DADOS = "#E9EEF3";

function temVotos(e: EstadoResultado): boolean {
  return e.flavio.votes + e.lula.votes > 0 && e.progresso > 0;
}

function fillEstado(e: EstadoResultado | undefined): string {
  if (!e || !temVotos(e) || !e.lider) return SEM_DADOS;
  return COR[e.lider];
}

/** Tamanho do rótulo conforme a área do estado. */
function fonteRotulo(w: number, h: number): number {
  return Math.max(7, Math.min(13, Math.sqrt(w * h) / 8));
}

const ROTULO_MINIMO = 58; // abaixo disso (SE, AL, DF, PB, RN) o rótulo fica poluído

export function MapaBrasil({
  payload,
  onSelectUf,
}: {
  payload: ApuracaoPayload;
  onSelectUf: (uf: string) => void;
}) {
  const [ufHover, setUfHover] = useState<string | null>(null);

  const mapaEstados = useMemo(() => {
    const m = new Map<string, EstadoResultado>();
    for (const e of payload.estados) m.set(e.uf, e);
    return m;
  }, [payload]);

  const exterior = mapaEstados.get("ZZ");
  const detalhe = ufHover ? mapaEstados.get(ufHover) : null;

  // no cartão de detalhe, quem lidera aparece primeiro (inclusive após viradas)
  const detalheIds: CandidatoId[] =
    detalhe && temVotos(detalhe)
      ? [...(["flavio", "lula"] as CandidatoId[])].sort(
          (a, b) => detalhe[b].votes - detalhe[a].votes,
        )
      : (["flavio", "lula"] as CandidatoId[]);

  let nLula = 0;
  let nFlavio = 0;
  let nSem = 0;
  for (const e of payload.estados) {
    if (e.exterior) continue;
    if (!temVotos(e) || !e.lider) nSem++;
    else if (e.lider === "lula") nLula++;
    else nFlavio++;
  }
  const comBoletins = nLula + nFlavio > 0;

  return (
    <section id="mapa" className="scroll-mt-24">
      <div className="mb-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Mapa da disputa</h2>
        <p className="text-xs text-slate-500">
          Cada estado é pintado com a cor de quem lidera. Toque em um estado para ver os municípios.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_290px] lg:items-start">
        {/* ─── Mapa ─── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
          <svg
            viewBox={MAPA_VIEWBOX}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Mapa do Brasil colorido pelo líder da apuração em cada estado"
          >
            {BRASIL_MAPA.map((m) => {
              const e = mapaEstados.get(m.uf);
              const fill = fillEstado(e);
              const ativo = ufHover === m.uf;
              return (
                <g
                  key={m.uf}
                  role="button"
                  tabIndex={0}
                  aria-label={`${m.nome}${e && temVotos(e) && e.lider ? ` — lidera ${e.lider === "lula" ? "Lula" : "Flávio"}` : ""}`}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => onSelectUf(m.uf)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onSelectUf(m.uf);
                    }
                  }}
                  onMouseEnter={() => setUfHover(m.uf)}
                  onMouseLeave={() => setUfHover((cur) => (cur === m.uf ? null : cur))}
                >
                  <path
                    d={m.d}
                    fill={fill}
                    stroke={ativo ? "#0F172A" : "#FFFFFF"}
                    strokeWidth={ativo ? 1.6 : 1.1}
                    className="transition-colors duration-500"
                  />
                </g>
              );
            })}
            {/* rótulos (separados para não receber cliques) */}
            {BRASIL_MAPA.map((m) => {
              const e = mapaEstados.get(m.uf);
              const colorido = e && temVotos(e) && e.lider;
              if (Math.sqrt(m.w * m.h) < ROTULO_MINIMO) return null;
              return (
                <text
                  key={`t-${m.uf}`}
                  x={m.lx}
                  y={m.ly + fonteRotulo(m.w, m.h) * 0.35}
                  textAnchor="middle"
                  fontSize={fonteRotulo(m.w, m.h)}
                  fontWeight={800}
                  letterSpacing={0.6}
                  className="pointer-events-none"
                  fill={colorido ? "#FFFFFF" : "#64748B"}
                  stroke={colorido ? "rgba(15,23,42,0.35)" : "rgba(255,255,255,0.7)"}
                  strokeWidth={0.9}
                  style={{ paintOrder: "stroke" }}
                >
                  {m.uf}
                </text>
              );
            })}
          </svg>
        </div>

        {/* ─── Painel lateral ─── */}
        <div className="flex flex-col gap-3">
          {/* Exterior */}
          {exterior && (
            <button
              onClick={() => onSelectUf("ZZ")}
              className="group rounded-2xl border bg-white p-4 text-left transition hover:shadow-sm"
              style={{ borderColor: `${fillEstado(exterior) === SEM_DADOS ? "#E2E8F0" : fillEstado(exterior)}${fillEstado(exterior) === SEM_DADOS ? "" : "40"}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${fillEstado(exterior) === SEM_DADOS ? "#F1F5F9" : fillEstado(exterior)}${fillEstado(exterior) === SEM_DADOS ? "" : "1F"}` }}
                >
                  <Globe2
                    className="h-4.5 w-4.5"
                    style={{ color: fillEstado(exterior) === SEM_DADOS ? "#94A3B8" : fillEstado(exterior) }}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black tracking-tight text-slate-900">Exterior</p>
                  <p className="text-[11px] text-slate-500">
                    {temVotos(exterior) && exterior.lider
                      ? `Lidera ${exterior.lider === "lula" ? "Lula" : "Flávio"} com ${formatPct(exterior.lider === "lula" ? exterior.lula.pct : exterior.flavio.pct, 1)}`
                      : "Aguardando boletins"}
                  </p>
                </div>
                {temVotos(exterior) && (
                  <p className="text-[11px] font-bold tabular-nums text-slate-400">
                    {formatPct(exterior.progresso * 100, 0).replace(",0", "")}
                  </p>
                )}
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${exterior.progresso * 100}%` }}
                />
              </div>
            </button>
          )}

          {/* Detalhe do estado em hover / resumo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {detalhe && !detalhe.exterior ? (
              <>
                <p className="text-sm font-black tracking-tight text-slate-900">{detalhe.nome}</p>
                <p className="text-[11px] tabular-nums text-slate-500">
                  {formatPct(detalhe.progresso * 100, 0).replace(",0", "")} apurado
                </p>
                <div className="mt-3 space-y-1.5">
                  {detalheIds.map((id) => (
                    <div key={id} className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COR[id] }} />
                      <span className="flex-1 truncate text-[12px] font-semibold text-slate-700">
                        {id === "flavio" ? "Flávio Bolsonaro" : "Lula"}
                      </span>
                      <span className="text-[12px] font-black tabular-nums text-slate-900">
                        {temVotos(detalhe) ? formatPct(detalhe[id].pct, 1) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-black tracking-tight text-slate-900">Onde cada um lidera</p>
                {comBoletins ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    Lula lidera em{" "}
                    <span className="font-bold" style={{ color: COR.lula }}>
                      {nLula}
                    </span>{" "}
                    estados · Flávio em{" "}
                    <span className="font-bold" style={{ color: COR.flavio }}>
                      {nFlavio}
                    </span>
                    {nSem > 0 && (
                      <>
                        {" "}
                        · {nSem} sem resultado
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    O mapa será colorido automaticamente conforme os boletins de urna chegarem ao
                    TSE, a partir das 17h de domingo.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR.lula }} />
                    Lula
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR.flavio }} />
                    Flávio
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    <span className="h-2 w-2 rounded-full border border-slate-300 bg-white" />
                    Sem boletins
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
