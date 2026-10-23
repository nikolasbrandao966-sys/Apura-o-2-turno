"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Square, Lock, LogOut, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdmin } from "./use-admin";
import { formatPct } from "@/lib/apuracao/format";

/** Banner âmbar mostrado quando a simulação está rodando (só admin a vê). */
export function BannerSimulacao() {
  const { sim, simAcao } = useAdmin();
  if (!sim?.ativo) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-bold text-amber-800">
          <FlaskConical className="h-3.5 w-3.5" />
          Modo simulação ativo
        </span>
        <span className="tabular-nums text-amber-700">
          horário fictício {sim.horaSim} · {formatPct(sim.progressoNacional * 100, 1)} apurado ·{" "}
          {sim.velocidade}x
        </span>
        <span className="hidden text-amber-600 sm:inline">
          — dados fictícios de teste, visíveis apenas para você (admin).
        </span>
        <button
          onClick={() => void simAcao("stop")}
          className="ms-auto font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900"
        >
          Encerrar simulação
        </button>
      </div>
    </div>
  );
}

/** Diálogo de senha + painel de controle (Sheet). */
export function AdminGate() {
  const {
    admin,
    loginAberto,
    sheetAberto,
    fecharLogin,
    fecharSheet,
    abrirSheet,
    login,
    logout,
    sim,
    simAcao,
  } = useAdmin();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const ok = await login(senha);
    if (!ok) setErro("Senha incorreta. Tente novamente.");
    else setSenha("");
    setEnviando(false);
  }

  return (
    <>
      {/* Login */}
      <Dialog open={loginAberto} onOpenChange={(o) => !o && fecharLogin()}>
        <DialogContent className="max-w-xs rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
              <Lock className="h-4 w-4 text-slate-400" />
              Área de administração
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Acesso restrito — simulação de teste e ferramentas do painel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={entrar} className="space-y-2">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              autoFocus
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            {erro && <p className="text-[11px] font-medium text-rose-500">{erro}</p>}
            <Button
              type="submit"
              disabled={enviando || !senha}
              className="h-10 w-full rounded-lg bg-slate-900 font-bold text-white hover:bg-slate-700"
            >
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Painel admin */}
      <Sheet open={sheetAberto} onOpenChange={(o) => !o && fecharSheet()}>
        <SheetContent
          side="right"
          className="w-[19rem] overflow-y-auto border-slate-200 bg-white sm:w-[21rem]"
        >
          <SheetHeader>
            <SheetTitle className="text-base font-black tracking-tight text-slate-900">
              Painel de simulação
            </SheetTitle>
            <SheetDescription className="text-[11px] leading-relaxed text-slate-500">
              Pré-visualize o site como na noite de apuração. A simulação é visível
              <b> apenas para você</b> — os demais visitantes veem os dados oficiais do TSE.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5 px-4 pb-8">
            {/* Status */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              {sim?.ativo ? (
                <>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="relative flex h-2 w-2">
                      {!sim.pausado && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      )}
                      <span
                        className={`relative h-2 w-2 rounded-full ${sim.pausado ? "bg-slate-400" : "bg-amber-500"}`}
                      />
                    </span>
                    {sim.pausado ? "Simulação pausada" : "Simulando apuração"}
                  </p>
                  <p className="mt-1.5 text-[11px] tabular-nums text-slate-500">
                    Horário fictício <b className="text-slate-700">{sim.horaSim}</b> ·{" "}
                    {formatPct(sim.progressoNacional * 100, 1)} das seções apuradas ·{" "}
                    {sim.velocidade}x
                  </p>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-slate-500">
                  A simulação está parada. O site exibe os{" "}
                  <b>dados oficiais do TSE</b> (zerados até o 1º boletim, domingo após as 17h).
                </p>
              )}
            </div>

            {/* Cenário */}
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cenário do resultado
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "apertado", label: "Apertado" },
                  { id: "lula", label: "Lula na frente" },
                  { id: "flavio", label: "Flávio na frente" },
                ].map((c) => (
                  <button
                    key={c.id}
                    disabled={sim?.ativo}
                    onClick={() => void simAcao("cenario", c.id)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition disabled:opacity-40 ${
                      sim?.cenario === c.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Velocidade */}
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Velocidade do relógio
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 30, 60].map((v) => (
                  <button
                    key={v}
                    onClick={() => void simAcao("velocidade", String(v))}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                      sim?.velocidade === v
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {v}x
                  </button>
                ))}
              </div>
            </div>

            {/* Controles */}
            <div className="space-y-2">
              {sim?.ativo ? (
                <>
                  <Button
                    onClick={() => void simAcao(sim.pausado ? "resume" : "pause")}
                    className="h-10 w-full rounded-lg bg-amber-500 font-bold text-amber-950 hover:bg-amber-400"
                  >
                    {sim.pausado ? (
                      <>
                        <Play className="me-1.5 h-4 w-4" /> Retomar
                      </>
                    ) : (
                      <>
                        <Pause className="me-1.5 h-4 w-4" /> Pausar
                      </>
                    )}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => void simAcao("restart")}
                      variant="outline"
                      className="h-9 rounded-lg border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <RotateCcw className="me-1 h-3.5 w-3.5" /> Reiniciar
                    </Button>
                    <Button
                      onClick={() => void simAcao("stop")}
                      variant="outline"
                      className="h-9 rounded-lg border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <Square className="me-1 h-3.5 w-3.5" /> Encerrar
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => void simAcao("start")}
                  className="h-10 w-full rounded-lg bg-amber-500 font-bold text-amber-950 hover:bg-amber-400"
                >
                  <Play className="me-1.5 h-4 w-4" /> Iniciar simulação
                </Button>
              )}
            </div>

            <p className="text-[10px] leading-relaxed text-slate-400">
              A simulação percorre cerca de 2 horas de apuração com curvas realistas por estado —
              inclui a virada de liderança no fim, os municípios recebendo boletins e as disputas
              de governador. Aumente a velocidade para ver tudo em minutos.
            </p>

            <div className="border-t border-slate-100 pt-3">
              <Button
                onClick={() => void logout()}
                variant="ghost"
                className="h-8 w-full rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <LogOut className="me-1 h-3.5 w-3.5" /> Sair da área admin
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Botão discreto de entrada (usado no rodapé). */
export function BotaoAdmin() {
  const { admin, abrirLogin, abrirSheet } = useAdmin();
  return (
    <button
      onClick={() => (admin ? abrirSheet() : abrirLogin())}
      className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-slate-500"
      title={admin ? "Abrir painel admin" : "Área de administração"}
      aria-label="Área de administração"
    >
      <Lock className={`h-3 w-3 ${admin ? "text-amber-500" : ""}`} />
      <span className="text-[10px] font-semibold">Admin</span>
    </button>
  );
}
