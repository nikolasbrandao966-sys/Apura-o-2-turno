"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, MapPin, RefreshCw } from "lucide-react";
import type { ApuracaoPayload, CandidatoId, MunicipiosPayload } from "@/lib/apuracao/types";
import { PRESIDENTES } from "@/lib/apuracao/oficial";
import { formatInt, formatPct } from "@/lib/apuracao/format";
import { useAdmin } from "./use-admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COR: Record<CandidatoId, string> = {
  flavio: PRESIDENTES.flavio.cor,
  lula: PRESIDENTES.lula.cor,
};

/** Nome do município em title case pt-BR, preservando "da/do/de/das/dos". */
const SMALL = new Set(["da", "do", "das", "dos", "de", "e"]);
function titleCase(s: string): string {
  return s
    .toLocaleLowerCase("pt-BR")
    .split(/(\s+)/)
    .map((w) =>
      SMALL.has(w) || !/\p{L}/u.test(w)
        ? w
        : w.replace(/^[\p{L}'’]/u, (c) => c.toLocaleUpperCase("pt-BR")),
    )
    .join("");
}

export function MunicipiosDialog({
  uf,
  payload,
  onClose,
}: {
  uf: string | null;
  payload: ApuracaoPayload;
  onClose: () => void;
}) {
  const [dados, setDados] = useState<MunicipiosPayload | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const { sim } = useAdmin();
  const simAtivo = sim?.ativo ?? false;

  const estado = payload.estados.find((e) => e.uf === uf) ?? null;

  const carregar = useCallback(
    async (ufAtual: string) => {
      setCarregando(true);
      setErro(null);
      try {
        const url = simAtivo
          ? `/api/municipios?uf=${ufAtual}&sim=1`
          : `/api/municipios?uf=${ufAtual}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao buscar municípios");
        setDados((await res.json()) as MunicipiosPayload);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro inesperado");
      } finally {
        setCarregando(false);
      }
    },
    [simAtivo],
  );

  useEffect(() => {
    if (!uf) {
      setDados(null);
      setBusca("");
      return;
    }
    void carregar(uf);
    const id = setInterval(() => void carregar(uf), simAtivo ? 8000 : 60_000);
    return () => clearInterval(id);
  }, [uf, carregar, simAtivo]);

  const filtrados = (dados?.municipios ?? []).filter((m) =>
    m.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  return (
    <Dialog open={!!uf} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl border-slate-200 sm:max-w-xl">
        <DialogHeader className="px-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
            <MapPin className="h-4 w-4 text-slate-400" />
            {estado?.exterior ? "Exterior" : estado?.nome ?? ""}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Municípios{" "}
            {estado?.exterior
              ? "e cidades do mundo onde brasileiros votam"
              : "onde os boletins de urna já chegaram"}{" "}
            — atualiza a cada minuto.
          </DialogDescription>
        </DialogHeader>

        {/* resumo do estado */}
        {estado && (
          <div className="mx-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Total {estado.exterior ? "no exterior" : "no estado"}</span>
              <span className="tabular-nums">{formatPct(estado.progresso * 100, 1)} apurado</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${estado.progresso * 100}%` }}
              />
            </div>
            {estado.flavio.votes + estado.lula.votes > 0 && (
              <div className="mt-2 flex items-center gap-4 text-[11px] tabular-nums">
                {/* líder do estado sempre à esquerda (inclusive após viradas) */}
                {(estado.lula.votes > estado.flavio.votes
                  ? (["lula", "flavio"] as CandidatoId[])
                  : (["flavio", "lula"] as CandidatoId[])
                ).map((id) => (
                  <span key={id} className="font-bold" style={{ color: COR[id] }}>
                    {id === "flavio" ? "Flávio" : "Lula"} {formatPct(estado[id].pct, 2)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {dados && (
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[11px] text-slate-500">
              <span className="font-bold tabular-nums text-slate-700">
                {dados.boletinsRecebidos}
              </span>{" "}
              de <span className="tabular-nums">{dados.totalMunicipios}</span>{" "}
              {estado?.exterior ? "cidades" : "municípios"} com boletim
            </p>
            <button
              onClick={() => uf && void carregar(uf)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:text-slate-700"
              aria-label="Atualizar municípios"
            >
              <RefreshCw className={`h-3 w-3 ${carregando ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}

        {/* busca */}
        {(dados?.totalMunicipios ?? 0) > 12 && (
          <div className="relative px-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar município..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
        )}

        {/* lista */}
        <div className="max-h-[46vh] overflow-y-auto px-1 pb-1">
          {erro && (
            <p className="py-8 text-center text-xs text-rose-500">
              {erro} — tente novamente em instantes.
            </p>
          )}
          {!erro && carregando && !dados && (
            <div className="space-y-2 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
              ))}
              <p className="pt-1 text-center text-[11px] text-slate-400">
                Buscando todos os municípios no TSE — em estados grandes pode levar alguns
                segundos (depois fica em cache)...
              </p>
            </div>
          )}
          {!erro && dados &&
            filtrados.map((m) => {
              const tem = m.secoesApuradas > 0;
              return (
                <div
                  key={m.nome}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${
                    tem ? "bg-white" : "bg-slate-50/80 opacity-70"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-700">
                      {titleCase(m.nome)}
                    </p>
                    <div className="mt-1 h-0.5 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${m.progresso * 100}%` }}
                      />
                    </div>
                  </div>
                  {tem ? (
                    <div className="text-end">
                      <p
                        className="text-xs font-bold tabular-nums"
                        style={{ color: m.lider ? COR[m.lider] : "#475569" }}
                      >
                        {m.lider === "flavio" ? "Flávio" : "Lula"} {formatPct(Math.max(m.flavioPct, m.lulaPct), 1)}
                      </p>
                      <p className="text-[10px] tabular-nums text-slate-400">
                        {formatPct(m.progresso * 100, 0).replace(",0", "")} ·{" "}
                        {formatInt(m.validos)} votos
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">sem boletim</span>
                  )}
                </div>
              );
            })}
          {!erro && dados && filtrados.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-400">
              Nenhum município encontrado para “{busca}”.
            </p>
          )}
          {!erro && dados && dados.boletinsRecebidos === 0 && (
            <p className="py-8 text-center text-xs leading-relaxed text-slate-400">
              Nenhum boletim chegou ainda.
              <br />
              Assim que as urnas fecharem, os municípios aparecem aqui automaticamente.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
