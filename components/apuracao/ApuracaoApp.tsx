"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Placar } from "./Placar";
import { MapaBrasil } from "./MapaBrasil";
import { Tendencias } from "./Tendencias";
import { EstadosGrid } from "./EstadosGrid";
import { MunicipiosDialog } from "./MunicipiosDialog";
import { GovernadoresSection } from "./GovernadoresSection";
import { Footer } from "./Footer";
import { useApuracao } from "./use-apuracao";
import { AdminProvider, useAdmin } from "./use-admin";
import { AdminGate, BannerSimulacao } from "./AdminGate";

function Skeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900">
        <span className="animate-pulse text-lg font-black text-white">26</span>
      </div>
      <p className="text-sm font-bold text-slate-800">
        Conectando aos boletins de urna do TSE...
      </p>
      <div className="mt-2 w-full max-w-md space-y-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded-full bg-slate-100"
            style={{ width: `${100 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ApuracaoInner() {
  const { sim } = useAdmin();
  const { data, erro, carregando, atualizar } = useApuracao(sim?.ativo ?? false);
  const [ufSelecionada, setUfSelecionada] = useState<string | null>(null);

  if (!data) {
    return erro ? (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-4 text-center">
        <p className="text-sm font-bold text-slate-800">Não foi possível carregar a apuração</p>
        <p className="text-xs text-slate-400">{erro}</p>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
          onClick={() => void atualizar()}
        >
          Tentar novamente
        </button>
      </div>
    ) : (
      <Skeleton />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 text-slate-900">
      <Header payload={data} onAtualizar={() => void atualizar()} carregando={carregando} />
      <BannerSimulacao />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-8 sm:py-10">
        <Placar payload={data} />
        <MapaBrasil payload={data} onSelectUf={setUfSelecionada} />
        <Tendencias payload={data} />
        <EstadosGrid payload={data} onSelectUf={setUfSelecionada} />
        <GovernadoresSection payload={data} />
      </main>

      <Footer />

      <MunicipiosDialog
        uf={ufSelecionada}
        payload={data}
        onClose={() => setUfSelecionada(null)}
      />
      <AdminGate />
    </div>
  );
}

export function ApuracaoApp() {
  return (
    <AdminProvider>
      <ApuracaoInner />
    </AdminProvider>
  );
}
