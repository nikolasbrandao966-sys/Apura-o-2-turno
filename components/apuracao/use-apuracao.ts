"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApuracaoPayload } from "@/lib/apuracao/types";

export interface UseApuracaoResult {
  data: ApuracaoPayload | null;
  erro: string | null;
  carregando: boolean;
  atualizar: () => Promise<void>;
}

export function useApuracao(sim: boolean): UseApuracaoResult {
  const [data, setData] = useState<ApuracaoPayload | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const busy = useRef(false);

  const atualizar = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const url = sim ? "/api/apuracao?sim=1" : "/api/apuracao";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as ApuracaoPayload;
      setData(payload);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao atualizar dados");
    } finally {
      setCarregando(false);
      busy.current = false;
    }
  }, [sim]);

  useEffect(() => {
    void atualizar();
    const id = setInterval(() => void atualizar(), sim ? 4000 : 20_000);
    const onFocus = () => void atualizar();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [atualizar, sim]);

  return { data, erro, carregando, atualizar };
}
