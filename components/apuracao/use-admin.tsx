"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface SimInfoUI {
  ativo: boolean;
  pausado: boolean;
  velocidade: number;
  cenario: string;
  minutos: number;
  progressoNacional: number;
  horaSim: string;
}

export interface AdminApi {
  admin: boolean | null; // null = carregando
  sim: SimInfoUI | null;
  loginAberto: boolean;
  sheetAberto: boolean;
  abrirLogin: () => void;
  abrirSheet: () => void;
  fecharLogin: () => void;
  fecharSheet: () => void;
  login: (senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  simAcao: (cmd: string, valor?: string) => Promise<void>;
}

const AdminCtx = createContext<AdminApi | null>(null);

export function useAdmin(): AdminApi {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin fora do AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [sim, setSim] = useState<SimInfoUI | null>(null);
  const [loginAberto, setLoginAberto] = useState(false);
  const [sheetAberto, setSheetAberto] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (!res.ok) return;
      const d = (await res.json()) as { admin: boolean; sim: SimInfoUI | null };
      setAdmin(d.admin);
      setSim(d.admin ? d.sim : null);
    } catch {
      // silencioso: próxima tentativa cobre
    } finally {
      busy.current = false;
    }
  }, []);

  const login = useCallback(
    async (senha: string) => {
      try {
        const res = await fetch("/api/admin?acao=login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ senha }),
        });
        if (!res.ok) return false;
        setAdmin(true);
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin?acao=logout", { method: "POST" });
    } finally {
      setAdmin(false);
      setSim(null);
      setSheetAberto(false);
    }
  }, []);

  const simAcao = useCallback(
    async (cmd: string, valor?: string) => {
      try {
        await fetch("/api/admin?acao=sim", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cmd, valor }),
        });
      } catch {
        // ignora
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  // montagem: verifica sessão + deep link ?admin=1
  useEffect(() => {
    void refresh();
    if (typeof window !== "undefined" && window.location.search.includes("admin=1")) {
      setLoginAberto(true);
    }
  }, [refresh]);

  // polling enquanto a simulação roda ou o painel está aberto
  useEffect(() => {
    if (!sim?.ativo && !sheetAberto) return;
    const id = setInterval(() => void refresh(), sim?.pausado ? 5000 : 2500);
    return () => clearInterval(id);
  }, [sim?.ativo, sim?.pausado, sheetAberto, refresh]);

  const api: AdminApi = {
    admin,
    sim,
    loginAberto,
    sheetAberto,
    abrirLogin: () => setLoginAberto(true),
    abrirSheet: () => {
      setSheetAberto(true);
      void refresh();
    },
    fecharLogin: () => setLoginAberto(false),
    fecharSheet: () => setSheetAberto(false),
    login: async (senha) => {
      const ok = await login(senha);
      if (ok) {
        setLoginAberto(false);
        setSheetAberto(true);
        void refresh();
      }
      return ok;
    },
    logout,
    simAcao,
  };

  return <AdminCtx.Provider value={api}>{children}</AdminCtx.Provider>;
}
