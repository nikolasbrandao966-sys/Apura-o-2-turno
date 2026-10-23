"use client";

import Image from "next/image";
import { TrendingUp, TrendingDown, Minus, Sigma } from "lucide-react";
import type { ApuracaoPayload, CandidatoId } from "@/lib/apuracao/types";
import { PRESIDENTES } from "@/lib/apuracao/oficial";
import { formatInt, formatPct } from "@/lib/apuracao/format";
import { AnimatedNumber } from "./AnimatedNumber";
import { PartidoLogo } from "./Partidos";
import { useContagemRegressiva } from "./Header";

function TendenciaBadge({ deltaPct, temDados }: { deltaPct: number; temDados: boolean }) {
  if (!temDados) return null;
  if (Math.abs(deltaPct) < 0.005) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        <Minus className="h-3 w-3" /> estável
      </span>
    );
  }
  const subiu = deltaPct > 0;
  const pp = Math.abs(deltaPct).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        subiu ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {subiu ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {subiu ? "+" : "−"}
      {pp} pp
    </span>
  );
}

function CartaoCandidato({
  id,
  votes,
  pct,
  deltaPct,
  lider,
  eleito,
  matematicamente,
  temDados,
}: {
  id: CandidatoId;
  votes: number;
  pct: number;
  deltaPct: number;
  lider: boolean;
  eleito: boolean;
  matematicamente: boolean;
  temDados: boolean;
}) {
  const info = PRESIDENTES[id];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 transition-shadow sm:p-6 ${
        eleito || matematicamente ? "ring-2" : lider ? "border-slate-300" : "border-slate-200"
      }`}
      style={
        eleito || matematicamente
          ? { borderColor: "transparent", ["--tw-ring-color" as string]: info.cor }
          : undefined
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-white sm:h-24 sm:w-[4.5rem]"
          style={{ ["--tw-ring-color" as string]: info.cor }}
        >
          <Image
            src={info.foto}
            alt={`Foto oficial de ${info.nomeCompleto}`}
            fill
            sizes="96px"
            className="object-cover object-top"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-slate-900 sm:text-base">
            {info.nomeUrna}
          </p>
          <p className="mt-0.5 flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 pr-2.5 ring-1 ring-slate-100">
            <PartidoLogo sg={info.partido} height={14} cor={info.cor} />
            <span className="text-[11px] font-semibold text-slate-600">
              <span className="font-bold" style={{ color: info.cor }}>
                {info.numero}
              </span>{" "}
              • {info.partido}
            </span>
          </p>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <AnimatedNumber
              value={pct}
              format={(n) => formatPct(n, 2)}
              className="text-4xl font-black tabular-nums tracking-tight text-slate-900 sm:text-[2.6rem]"
            />
            {temDados && (
              <span className="text-[11px] tabular-nums text-slate-400">
                <AnimatedNumber value={votes} format={(n) => formatInt(n)} /> votos
              </span>
            )}
          </div>

          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: info.cor }}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <TendenciaBadge deltaPct={deltaPct} temDados={temDados} />
            {eleito && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white"
                style={{ backgroundColor: info.cor }}
              >
                Eleito
              </span>
            )}
            {!eleito && matematicamente && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                <Sigma className="h-3 w-3" /> Matematicamente eleito
              </span>
            )}
            {!eleito && !matematicamente && lider && temDados && (
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                Lidera
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Placar({ payload }: { payload: ApuracaoPayload }) {
  const { nacional, meta } = payload;
  const F = nacional.flavio;
  const L = nacional.lula;
  const temDados = F.votes + L.votes > 0;
  const aguardando = meta.status === "aguardando";
  const { texto: contagem, ativo: contagemAtivo } = useContagemRegressiva();
  const lider = nacional.lider;

  // Líder sempre na primeira posição (card da esquerda). Se houver virada,
  // quem assume a liderança passa para o primeiro lugar. Sem votos (ou empate
  // exato), mantém a ordem fixa Flávio × Lula.
  const ordem: CandidatoId[] =
    temDados && L.votes > F.votes ? ["lula", "flavio"] : ["flavio", "lula"];

  const cartao = (id: CandidatoId) => (
    <CartaoCandidato
      id={id}
      votes={nacional[id].votes}
      pct={nacional[id].pct}
      deltaPct={nacional[id].deltaPct}
      lider={lider === id}
      eleito={nacional.eleito === id}
      matematicamente={nacional.matematicamente === id}
      temDados={temDados}
    />
  );

  return (
    <section id="presidente" className="scroll-mt-24">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Presidência da República
      </p>
      <h1 className="mt-1 text-center text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        Lula x Flávio Bolsonaro
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        {cartao(ordem[0])}

        {/* Coluna central: apuração */}
        <div className="order-first flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-6 py-5 md:order-none md:w-56">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Apurado
          </p>
          <p className="mt-0.5 text-3xl font-black tabular-nums text-slate-900">
            <AnimatedNumber
              value={nacional.progresso * 100}
              format={(n) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
            />
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${nacional.progresso * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] leading-snug text-slate-500">
            {temDados
              ? `${formatInt(nacional.secoesApuradas)} de ${formatInt(nacional.secoesTotal)} seções`
              : "Aguardando os primeiros boletins de urna"}
          </p>
          {aguardando && contagemAtivo && (
            <p className="mt-1 text-center text-[11px] font-bold tabular-nums text-slate-700">
              Urnas fecham em {contagem}
            </p>
          )}
          {!aguardando && temDados && lider && (
            <p className="mt-2 rounded-xl bg-white px-3 py-2 text-center text-[11px] text-slate-500 ring-1 ring-slate-200">
              {nacional.matematicamente || nacional.eleito ? "Vantagem: " : "Lidera "}
              <span className="font-bold text-slate-800">{formatPct(nacional.vantagemPct, 2)}</span>
              <br />
              <span className="tabular-nums">{formatInt(nacional.vantagemVotos)} votos</span>
            </p>
          )}
        </div>

        {cartao(ordem[1])}
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
        {meta.fonte === "simulacao"
          ? "Modo simulação — números fictícios apenas para pré-visualizar a noite de apuração."
          : aguardando
            ? "O placar começa zerado e será atualizado automaticamente com os boletins oficiais do TSE."
            : "Percentuais calculados sobre os votos válidos apurados até o momento."}
      </p>
    </section>
  );
}
