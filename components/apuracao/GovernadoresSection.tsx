"use client";

import Image from "next/image";
import { Sigma } from "lucide-react";
import type { ApuracaoPayload } from "@/lib/apuracao/types";
import { GOVERNADORES_ELEITOS_1T, GOVERNADORES_RUNOFF } from "@/lib/apuracao/oficial";
import { formatInt, formatPct } from "@/lib/apuracao/format";
import { PartidoLogo, corPartido } from "./Partidos";

// % do 1º turno por candidato do 2º turno (dados oficiais)
const mapa1T = new Map<string, string>();
for (const r of GOVERNADORES_RUNOFF) {
  for (const c of r.candidatos) mapa1T.set(`${r.uf}|${c.id}`, c.pct1T);
}
function pct1T(uf: string, id: string): string {
  return `${mapa1T.get(`${uf}|${id}`) ?? "—"}%`;
}

function PainelCandidato({
  nomeUrna,
  partido,
  foto,
  cor,
  pct,
  votes,
  eleito,
  matematicamente,
  lider,
  temDados,
}: {
  nomeUrna: string;
  partido: string;
  foto: string;
  cor: string;
  pct: number;
  votes: number;
  eleito: boolean;
  matematicamente: boolean;
  lider: boolean;
  temDados: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-3"
      style={{ borderColor: `${cor}30`, backgroundColor: `${cor}08` }}
    >
      {/* logo do partido como marca d'água de fundo */}
      <div className="pointer-events-none absolute -end-2 -top-2 opacity-[0.09]">
        <PartidoLogo sg={partido} width={104} cor={cor} />
      </div>

      <div className="relative flex items-center gap-2.5">
        <div
          className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg border-2"
          style={{ borderColor: cor }}
        >
          <Image
            src={foto}
            alt={`Foto oficial de ${nomeUrna}`}
            fill
            sizes="56px"
            className="object-cover object-top"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[12px] font-bold leading-tight text-slate-900">
            {nomeUrna}
          </p>
          <p className="text-[10px] font-medium text-slate-500">{partido}</p>
        </div>
        <div className="text-end">
          <p className="text-xl font-black tabular-nums leading-none text-slate-900">
            {temDados ? formatPct(pct, 2) : "—"}
          </p>
          {temDados && (
            <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
              {formatInt(votes)} votos
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>

      <div className="relative mt-1.5 flex items-center justify-between">
        {eleito ? (
          <span
            className="rounded-full px-1.5 py-px text-[9px] font-black uppercase tracking-wide text-white"
            style={{ backgroundColor: cor }}
          >
            Eleito
          </span>
        ) : matematicamente ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-900 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
            <Sigma className="h-2.5 w-2.5" /> Mat. eleito
          </span>
        ) : (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {temDados ? (lider ? "Lidera" : "Atrás") : "2º turno hoje"}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold tabular-nums text-slate-400">
          <PartidoLogo sg={partido} height={12} cor={cor} />
          {partido}
        </span>
      </div>
    </div>
  );
}

export function GovernadoresSection({ payload }: { payload: ApuracaoPayload }) {
  const runoffs = payload.governadores;

  return (
    <section id="governadores" className="scroll-mt-24">
      <div className="mb-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          Governador — 2º turno
        </h2>
        <p className="text-xs text-slate-500">
          Seis estados decidem hoje: Acre, Amazonas, Distrito Federal, Espírito Santo, Rio
          Grande do Norte e Tocantins.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {runoffs.map((g) => {
          const total = g.candidatos.reduce((s, c) => s + c.votes, 0);
          // líder (quem tiver mais votos) sempre na primeira posição do card —
          // se houver virada, quem vira passa à frente; sem votos, ordem do 1º turno
          const cands =
            total > 0
              ? [...g.candidatos].sort((a, b) => b.votes - a.votes)
              : g.candidatos;
          return (
            <div key={g.uf} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-black tracking-tight text-slate-900">{g.nome}</p>
                <p className="text-[11px] tabular-nums text-slate-400">
                  {formatPct(g.progresso * 100, 0).replace(",0", "")} apurado
                </p>
              </div>
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${g.progresso * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {cands.map((c) => (
                  <PainelCandidato
                    key={c.id}
                    nomeUrna={c.nomeUrna}
                    partido={c.partido}
                    foto={c.foto}
                    cor={c.cor}
                    pct={c.pct}
                    votes={c.votes}
                    eleito={c.eleito}
                    matematicamente={c.matematicamente}
                    lider={c.id === g.liderId}
                    temDados={total > 0}
                  />
                ))}
              </div>

              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                Resultado do 1º turno:{" "}
                {g.candidatos.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && " x "}
                    <span className="font-semibold text-slate-500">
                      {c.nomeUrna.split(" ")[0]} {pct1T(g.uf, c.id)}
                    </span>
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>

      {/* Eleitos no 1º turno */}
      <div className="mt-8">
        <h3 className="text-sm font-black tracking-tight text-slate-900">
          Governadores eleitos no 1º turno
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          21 unidades já têm governador definido — resultado oficial do 1º turno (4 de outubro).
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {GOVERNADORES_ELEITOS_1T.map((g) => {
            const cor = corPartido(g.partido);
            return (
              <div
                key={g.uf}
                className="relative overflow-hidden rounded-xl border bg-white p-3"
                style={{ borderColor: `${cor}30` }}
              >
                <div className="pointer-events-none absolute -end-1 -top-1 opacity-[0.07]">
                  <PartidoLogo sg={g.partido} width={88} cor={cor} />
                </div>
                <div className="relative flex items-center gap-2.5">
                  <div
                    className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border-2"
                    style={{ borderColor: cor }}
                  >
                    <Image
                      src={g.foto}
                      alt={`Foto oficial de ${g.nomeUrna}`}
                      fill
                      sizes="48px"
                      className="object-cover object-top"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12px] font-bold leading-tight text-slate-900">
                      {g.nomeUrna}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                      <span>{g.uf} •</span>
                      <PartidoLogo sg={g.partido} height={12} cor={cor} />
                      <span>{g.partido}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] font-black tabular-nums" style={{ color: cor }}>
                      {g.pct.replace(",", ",")}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

