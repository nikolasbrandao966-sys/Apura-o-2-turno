import { BotaoAdmin } from "./AdminGate";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-[11px] text-slate-400 sm:flex-row sm:text-start">
        <p>
          <span className="font-semibold text-slate-500">Apuração 2º turno • Eleições 2026</span>{" "}
          — dados e fotos oficiais do TSE (resultados.tse.jus.br).
        </p>
        <div className="flex items-center gap-4">
          <p className="tabular-nums">499.248 seções eleitorais</p>
          <BotaoAdmin />
        </div>
      </div>
    </footer>
  );
}
