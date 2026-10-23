"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ApuracaoPayload } from "@/lib/apuracao/types";
import { PRESIDENTES } from "@/lib/apuracao/oficial";
import { formatPct } from "@/lib/apuracao/format";

function hora(t: number): string {
  return new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function ChipVariacao({
  nome,
  cor,
  deltaPct,
}: {
  nome: string;
  cor: string;
  deltaPct: number;
}) {
  const subiu = deltaPct > 0.005;
  const desceu = deltaPct < -0.005;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} />
      <span className="text-xs font-bold text-slate-800">{nome}</span>
      {subiu || desceu ? (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums ${
            subiu ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {subiu ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {subiu ? "subiu" : "desceu"}{" "}
          {Math.abs(deltaPct).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          pp
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <Minus className="h-3 w-3" /> estável
        </span>
      )}
    </div>
  );
}

export function Tendencias({ payload }: { payload: ApuracaoPayload }) {
  const { timeline, nacional } = payload;
  const temHist = timeline.length >= 2;
  const dF = nacional.flavio.deltaPct;
  const dL = nacional.lula.deltaPct;

  const dados = timeline.map((p) => ({
    hora: hora(p.t),
    Flávio: Number(p.flavioPct.toFixed(2)),
    Lula: Number(p.lulaPct.toFixed(2)),
    apurado: Number((p.apurado * 100).toFixed(1)),
  }));

  // chips ordenados: quem lidera aparece primeiro
  const chips = [
    { nome: "Flávio", cor: PRESIDENTES.flavio.cor, deltaPct: dF, pct: nacional.flavio.pct },
    { nome: "Lula", cor: PRESIDENTES.lula.cor, deltaPct: dL, pct: nacional.lula.pct },
  ].sort((a, b) => b.pct - a.pct);

  const domMin = temHist ? Math.min(...dados.map((d) => Math.min(d.Flávio, d.Lula))) - 1.5 : 0;
  const domMax = temHist ? Math.max(...dados.map((d) => Math.max(d.Flávio, d.Lula))) + 1.5 : 100;

  return (
    <section id="tendencias" className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            Tendência minuto a minuto
          </h2>
          <p className="text-xs text-slate-500">
            Quem subiu e quem desceu a cada novo boletim de urna.
          </p>
        </div>
        {temHist && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <ChipVariacao key={c.nome} nome={c.nome} cor={c.cor} deltaPct={c.deltaPct} />
            ))}
          </div>
        )}
      </div>

      {temHist ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  stroke="#e2e8f0"
                  interval="preserveStartEnd"
                  minTickGap={42}
                />
                <YAxis
                  domain={[Math.max(0, domMin), Math.min(100, domMax)]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  stroke="#e2e8f0"
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                  labelFormatter={(l) => `Boletim das ${l}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Flávio"
                  stroke={PRESIDENTES.flavio.cor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Lula"
                  stroke={PRESIDENTES.lula.cor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-[11px] text-slate-400">
            Cada ponto é um boletim de urna totalizado pelo TSE — {dados.length}{" "}
            {dados.length === 1 ? "atualização" : "atualizações"} registradas.
          </p>
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center">
          <p className="text-sm font-semibold text-slate-600">
            O gráfico de evolução aparecerá aqui
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Assim que os primeiros boletins de urna forem totalizados, este painel mostra a
            variação de cada candidato a cada minuto — quem subiu e quem desceu.
          </p>
        </div>
      )}
    </section>
  );
}
