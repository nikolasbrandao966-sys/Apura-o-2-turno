// Motor de SIMULAÇÃO da apuração do 2º turno — uso exclusivo do painel admin.
// Dados 100% fictícios (calibrados com base nos resultados reais do 1º turno)
// para pré-visualizar o site durante a noite eleitoral.
// Determinístico: o estado de um minuto simulado não depende de aleatoriedade
// persistente — o mesmo (min, cenário) sempre gera os mesmos números.

import type {
  ApuracaoPayload,
  ApuracaoStatus,
  CandidatoId,
  EstadoResultado,
  GovCandidatoResultado,
  GovRunoffResultado,
  MunicipioResultado,
  MunicipiosPayload,
  NacionalResultado,
  TimelinePonto,
} from "./types";
import { GOVERNADORES_RUNOFF, PRESIDENTES, UFS } from "./oficial";

const BASE_MIN = 95; // duração base da apuração, em minutos simulados
const MIN_MAX = 150; // tudo encerrado aos 150 min simulados
const SQ_FLAVIO = PRESIDENTES.flavio.sqcand;
const SQ_LULA = PRESIDENTES.lula.sqcand;

// [fim01, atraso01, earlyBias, lula2R, turno2R, bn2R]
// fim01/atraso01 são frações de BASE_MIN; earlyBias é o viés pró-Flávio no
// início da contagem (gera a virada dramática no fim); lula2R = share final.
const TAB: Record<string, [number, number, number, number, number, number]> = {
  AC: [0.92, 0.01, 0.0, 0.3422, 0.7697, 0.0473],
  AL: [0.95, 0.045, 0.035, 0.5796, 0.7834, 0.0352],
  AP: [0.99, 0.045, 0.035, 0.5228, 0.7687, 0.0469],
  AM: [1.0, 0.007, 0.03, 0.5285, 0.7613, 0.0457],
  BA: [0.99, 0.049, 0.055, 0.7111, 0.7595, 0.0502],
  CE: [0.97, 0.003, 0.045, 0.6619, 0.7583, 0.0448],
  DF: [0.72, 0.025, 0.0, 0.4478, 0.7695, 0.0503],
  ES: [0.72, 0.023, 0.0, 0.4348, 0.7667, 0.0406],
  GO: [0.8, 0.033, 0.0, 0.4131, 0.7638, 0.0419],
  MA: [1.0, 0.006, 0.065, 0.6733, 0.7657, 0.0446],
  MT: [0.82, 0.004, 0.0, 0.3308, 0.7842, 0.0459],
  MS: [0.8, 0.028, 0.0, 0.3858, 0.7737, 0.0387],
  MG: [0.76, 0.026, 0.0, 0.4932, 0.7858, 0.0394],
  PA: [1.0, 0.026, 0.03, 0.5378, 0.7588, 0.043],
  PB: [0.96, 0.034, 0.045, 0.6592, 0.7637, 0.0452],
  PR: [0.7, 0.0, 0.0, 0.3804, 0.7761, 0.0452],
  PE: [0.98, 0.03, 0.055, 0.6807, 0.7622, 0.034],
  PI: [0.97, 0.018, 0.055, 0.7412, 0.77, 0.0411],
  RJ: [0.68, 0.039, 0.0, 0.449, 0.7606, 0.0402],
  RN: [0.96, 0.012, 0.035, 0.6432, 0.7848, 0.0452],
  RS: [0.78, 0.01, 0.0, 0.4199, 0.7827, 0.0404],
  RO: [0.84, 0.049, 0.0, 0.3084, 0.7632, 0.0374],
  RR: [0.86, 0.024, 0.0, 0.2832, 0.7767, 0.0368],
  SC: [0.7, 0.022, 0.0, 0.3058, 0.7702, 0.0381],
  SP: [0.62, 0.027, 0.0, 0.4486, 0.7856, 0.0497],
  SE: [0.95, 0.025, 0.045, 0.6854, 0.7629, 0.0344],
  TO: [0.9, 0.043, 0.01, 0.4749, 0.7613, 0.0463],
  ZZ: [0.55, 0.02, 0.01, 0.53, 0.55, 0.06],
};

// shares finais das 6 disputas de governador, por sqcand
const GOV_SHARE: Record<string, Record<string, number>> = {
  AC: { "10002544107": 0.518, "10002532492": 0.482 },
  AM: { "40002532272": 0.555, "40002541626": 0.445 },
  DF: { "70002552496": 0.512, "70002553055": 0.488 },
  ES: { "80002552682": 0.578, "80002552172": 0.422 },
  RN: { "200002535255": 0.524, "200002534001": 0.476 },
  TO: { "270002544544": 0.505, "270002544599": 0.495 },
};
const GOV_FIM: Record<string, number> = { AC: 105, AM: 110, DF: 100, ES: 95, RN: 108, TO: 112 };

// ────────────────────────────── estado global

interface SimEstado {
  ativo: boolean;
  pausado: boolean;
  velocidade: number;
  cenario: "apertado" | "lula" | "flavio";
  min: number;
  ultimo: number;
}
declare global {
  var __sim: SimEstado | undefined;
}

const S = () =>
  (globalThis.__sim ??= {
    ativo: false,
    pausado: false,
    velocidade: 10,
    cenario: "apertado",
    min: 0,
    ultimo: Date.now(),
  });

function tick() {
  const s = S();
  const now = Date.now();
  if (s.ativo && !s.pausado) {
    const dmin = ((now - s.ultimo) / 60000) * s.velocidade;
    s.min = Math.min(MIN_MAX, s.min + dmin);
  }
  s.ultimo = now;
}

export interface SimInfo {
  ativo: boolean;
  pausado: boolean;
  velocidade: number;
  cenario: string;
  minutos: number;
  progressoNacional: number;
  horaSim: string;
}

export function simInfo(): SimInfo {
  tick();
  const s = S();
  const n = nacionalNoMinuto(s.min, s.cenario);
  return {
    ativo: s.ativo,
    pausado: s.pausado,
    velocidade: s.velocidade,
    cenario: s.cenario,
    minutos: Math.round(s.min),
    progressoNacional: n.progresso,
    horaSim: horaSim(s.min),
  };
}

export function simAcao(cmd: string, valor?: string) {
  const s = S();
  tick();
  switch (cmd) {
    case "start":
      s.ativo = true;
      s.pausado = false;
      s.min = 0;
      s.ultimo = Date.now();
      break;
    case "pause":
      s.pausado = true;
      s.ultimo = Date.now();
      break;
    case "resume":
      s.pausado = false;
      s.ultimo = Date.now();
      break;
    case "restart":
      s.min = 0;
      s.pausado = false;
      s.ultimo = Date.now();
      break;
    case "stop":
      s.ativo = false;
      s.pausado = false;
      s.min = 0;
      break;
    case "velocidade": {
      const v = Number(valor);
      if (Number.isFinite(v)) s.velocidade = Math.max(1, Math.min(120, v));
      break;
    }
    case "cenario":
      if (valor === "apertado" || valor === "lula" || valor === "flavio") {
        if (!s.ativo) s.cenario = valor;
      }
      break;
  }
}

// ────────────────────────────── matemática da simulação

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function biasCenario(cenario: string): number {
  return cenario === "lula" ? 0.02 : cenario === "flavio" ? -0.02 : 0;
}

/** progresso de uma UF no minuto m (curva rápida no início, cauda lenta). */
function progressoUF(uf: string, min: number): number {
  const [fim01, atraso01] = TAB[uf];
  const fim = fim01 * BASE_MIN;
  const atraso = atraso01 * BASE_MIN;
  if (min <= atraso) return 0;
  const x = clamp01((min - atraso) / fim);
  return Math.pow(x, 0.55);
}

/** share da Lula no ponto p, aplicando o viés pró-Flávio do início. */
function shareLulaUF(uf: string, p: number, cenario: string): number {
  const [, , earlyBias, lula2R] = TAB[uf];
  return clamp01(lula2R + biasCenario(cenario) - earlyBias * Math.max(0, 1 - p / 0.65));
}

interface UFSim {
  uf: string;
  p: number;
  shareLula: number;
  validosFinal: number;
  validos: number;
  flavioV: number;
  lulaV: number;
  sa: number;
  prog: number;
  comparecimento: number;
  abstencao: number;
  brancos: number;
  nulos: number;
}

function simUFs(min: number, cenario: string): Map<string, UFSim> {
  const map = new Map<string, UFSim>();
  for (const info of UFS) {
    const [fim01, , , , turno, bn] = TAB[info.uf];
    void fim01;
    const p = progressoUF(info.uf, min);
    const shareLula = shareLulaUF(info.uf, p, cenario);
    const validosFinal = info.aptos * turno * (1 - bn);
    const validos = validosFinal * p;
    const lulaV = validos * shareLula;
    const flavioV = validos - lulaV;
    const sa = Math.round(info.secoes * p);
    const comparecimento = info.aptos * turno * p;
    const brancos = comparecimento * bn * 0.5;
    map.set(info.uf, {
      uf: info.uf,
      p,
      shareLula,
      validosFinal,
      validos,
      flavioV,
      lulaV,
      sa,
      prog: info.secoes > 0 ? sa / info.secoes : 0,
      comparecimento,
      abstencao: info.aptos * (1 - turno) * p,
      brancos,
      nulos: comparecimento * bn * 0.5,
    });
  }
  return map;
}

function estadosSim(min: number, cenario: string): EstadoResultado[] {
  const ufsSim = simUFs(min, cenario);
  return UFS.map((info) => {
    const u = ufsSim.get(info.uf)!;
    const pctF = u.validos > 0 ? (u.flavioV / u.validos) * 100 : 0;
    const pctL = u.validos > 0 ? (u.lulaV / u.validos) * 100 : 0;
    const lider: CandidatoId | null = u.validos > 0 ? (u.flavioV > u.lulaV ? "flavio" : "lula") : null;
    const enc = u.prog >= 1;
    const eleito = enc && lider ? lider : null;
    const mat = !enc && lider && matematicamenteSim(Math.max(u.flavioV, u.lulaV), Math.min(u.flavioV, u.lulaV), info.aptos, info.ratioValidos1T, u.prog) ? lider : null;
    return {
      ...info,
      flavio: { votes: Math.round(u.flavioV), pct: pctF, deltaPct: 0 },
      lula: { votes: Math.round(u.lulaV), pct: pctL, deltaPct: 0 },
      secoesApuradas: u.sa,
      progresso: u.prog,
      validos: Math.round(u.validos),
      brancos: Math.round(u.brancos),
      nulos: Math.round(u.nulos),
      comparecimento: Math.round(u.comparecimento),
      abstencao: Math.round(u.abstencao),
      lider,
      vantagemPct: Math.abs(pctF - pctL),
      eleito,
      matematicamente: mat,
    };
  });
}

function matematicamenteSim(
  liderV: number,
  segundoV: number,
  aptos: number,
  ratio: number,
  prog: number,
): boolean {
  if (prog <= 0 || prog >= 1) return false;
  const restantes = aptos * ratio * 0.99 * (1 - prog);
  return liderV - segundoV > restantes * 1.02;
}

function nacionalNoMinuto(min: number, cenario: string) {
  const ufsSim = simUFs(min, cenario);
  let fV = 0;
  let lV = 0;
  let sa = 0;
  let ts = 0;
  let validos = 0;
  let comparecimento = 0;
  let brancos = 0;
  let nulos = 0;
  let abstencao = 0;
  for (const info of UFS) {
    const u = ufsSim.get(info.uf)!;
    fV += u.flavioV;
    lV += u.lulaV;
    sa += u.sa;
    ts += info.secoes;
    validos += u.validos;
    comparecimento += u.comparecimento;
    brancos += u.brancos;
    nulos += u.nulos;
    abstencao += u.abstencao;
  }
  const pctF = validos > 0 ? (fV / validos) * 100 : 0;
  const pctL = validos > 0 ? (lV / validos) * 100 : 0;
  return {
    flavioV: fV,
    lulaV: lV,
    sa,
    ts,
    progresso: ts > 0 ? sa / ts : 0,
    validos,
    comparecimento,
    brancos,
    nulos,
    abstencao,
    pctF,
    pctL,
  };
}

function governadoresSim(min: number, cenario: string): GovRunoffResultado[] {
  const ufsSim = simUFs(min, cenario);
  const govNomes = new Map(UFS.map((u) => [u.uf, u.nome]));
  const bias = biasCenario(cenario);
  return GOVERNADORES_RUNOFF.map((g) => {
    const u = ufsSim.get(g.uf)!;
    const fim = GOV_FIM[g.uf] ?? BASE_MIN;
    const p = clamp01(Math.pow(clamp01(min / fim), 0.55));
    const validosFinal = u.validosFinal;
    const validos = validosFinal * p;
    const candidatos: GovCandidatoResultado[] = g.candidatos.map((c) => {
      let share = GOV_SHARE[g.uf]?.[c.sqcand] ?? 0.5;
      if (cenario === "lula") {
        if (c.partido === "PT") share += 0.03;
        else if (["PL", "PP", "REPUBLICANOS"].includes(c.partido)) share -= 0.03;
      } else if (cenario === "flavio") {
        if (c.partido === "PT") share -= 0.03;
        else if (["PL", "PP", "REPUBLICANOS"].includes(c.partido)) share += 0.03;
      }
      void bias;
      return {
        id: c.id,
        nomeUrna: c.nomeUrna,
        partido: c.partido,
        foto: c.foto,
        cor: c.cor,
        votes: Math.round(validos * clamp01(share)),
        pct: 0,
        deltaPct: 0,
        eleito: false,
        matematicamente: false,
      };
    });
    const total = candidatos.reduce((s, c) => s + c.votes, 0);
    for (const c of candidatos) c.pct = total > 0 ? (c.votes / total) * 100 : 0;
    const votos = candidatos.map((c) => c.votes);
    const liderV = Math.max(...votos);
    const segundoV = Math.min(...votos);
    const info = UFS.find((x) => x.uf === g.uf)!;
    for (const c of candidatos) {
      const enc = p >= 1 && c.votes === liderV;
      c.eleito = enc;
      c.matematicamente = p > 0 && p < 1 && c.votes === liderV && matematicamenteSim(liderV, segundoV, info.aptos, info.ratioValidos1T, p);
    }
    const ts = Math.round(info.secoes * 1); // seções do estado
    return {
      uf: g.uf,
      nome: govNomes.get(g.uf) ?? g.uf,
      secoesApuradas: Math.round(ts * p),
      secoesTotal: ts,
      progresso: p,
      candidatos,
      liderId: total > 0 ? (candidatos.find((c) => c.votes === liderV)?.id ?? null) : null,
      eleitoId: candidatos.find((c) => c.eleito)?.id ?? null,
    };
  });
}

function timelineSim(min: number, cenario: string): TimelinePonto[] {
  const passo = min > 240 ? Math.ceil(min / 240) : 1;
  const pontos: TimelinePonto[] = [];
  const inicioFake = new Date("2026-10-25T17:00:00-03:00").getTime();
  for (let m = 0; m <= min; m += passo) {
    const n = nacionalNoMinuto(m, cenario);
    if (n.validos <= 0) continue;
    pontos.push({
      t: inicioFake + m * 60000,
      apurado: n.progresso,
      flavioPct: n.pctF,
      lulaPct: n.pctL,
      flavioVotes: Math.round(n.flavioV),
      lulaVotes: Math.round(n.lulaV),
    });
  }
  return pontos.slice(-480);
}

function horaSim(min: number): string {
  const h = 17 + Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function buildSimPayload(): ApuracaoPayload {
  const s = S();
  const min = s.min;
  const cenario = s.cenario;
  const n = nacionalNoMinuto(min, cenario);
  const estados = estadosSim(min, cenario);
  const timeline = timelineSim(min, cenario);

  const penult = timeline.length >= 2 ? timeline[timeline.length - 2] : null;
  const ult = timeline.length >= 1 ? timeline[timeline.length - 1] : null;
  const dF = penult && ult ? ult.flavioPct - penult.flavioPct : 0;
  const dL = penult && ult ? ult.lulaPct - penult.lulaPct : 0;

  const status: ApuracaoStatus =
    n.validos === 0 && n.sa === 0
      ? "aguardando"
      : n.progresso >= 0.9999
        ? "encerrado"
        : "apurando";

  const lider: CandidatoId | null = n.validos > 0 ? (n.flavioV > n.lulaV ? "flavio" : "lula") : null;
  const enc = n.progresso >= 0.9999;
  const mat =
    !enc && lider && matematicamenteSim(Math.max(n.flavioV, n.lulaV), Math.min(n.flavioV, n.lulaV), 158745502, 0.7516, n.progresso)
      ? lider
      : null;

  const nacional: NacionalResultado = {
    flavio: { votes: Math.round(n.flavioV), pct: n.pctF, deltaPct: dF },
    lula: { votes: Math.round(n.lulaV), pct: n.pctL, deltaPct: dL },
    secoesApuradas: n.sa,
    secoesTotal: n.ts,
    progresso: n.progresso,
    validos: Math.round(n.validos),
    brancos: Math.round(n.brancos),
    nulos: Math.round(n.nulos),
    comparecimento: Math.round(n.comparecimento),
    aptos: 158745502,
    abstencao: Math.round(n.abstencao),
    lider,
    vantagemPct: Math.abs(n.pctF - n.pctL),
    vantagemVotos: Math.round(Math.abs(n.flavioV - n.lulaV)),
    eleito: enc && lider ? lider : null,
    matematicamente: mat,
    estadosLiderando: {
      lula: estados.filter((e) => e.lider === "lula").length,
      flavio: estados.filter((e) => e.lider === "flavio").length,
    },
  };

  return {
    meta: {
      fonte: "simulacao",
      atualizadoEm: new Date().toISOString(),
      geradoTSE: `simulação — ${horaSim(min)}`,
      status,
      proxima: "",
    },
    nacional,
    estados,
    governadores: governadoresSim(min, cenario),
    timeline,
  };
}

// ────────────────────────────── municípios simulados

function h01(nome: string, sal: number): number {
  let x = 2166136261 ^ sal;
  for (let i = 0; i < nome.length; i++) {
    x ^= nome.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return ((x >>> 0) % 10000) / 10000;
}

export interface MunCfgAbr {
  abr: { cd: string; ds: string; mu: { cd: string; nm: string }[] }[];
}
export type MunCfg = MunCfgAbr | null;

export function municipiosSim(
  cfg: MunCfg,
  uf: string,
  estados: EstadoResultado[],
): MunicipiosPayload | null {
  const info = UFS.find((u) => u.uf === uf.toUpperCase());
  const abr = cfg?.abr?.find((a) => a.cd === uf.toLowerCase());
  if (!info || !abr) return null;
  const estado = estados.find((e) => e.uf === info.uf)!;
  const u = simUFs(S().min, S().cenario).get(info.uf)!;
  const mus = abr.mu ?? [];
  const totalSecoesMun = info.secoes / Math.max(1, mus.length);

  const municipios: MunicipioResultado[] = mus.map((m) => {
    const h1 = h01(m.nm, 1);
    const h2 = h01(m.nm, 2);
    const h3 = h01(m.nm, 3);
    const p = clamp01(estado.progresso * (0.55 + 1.1 * h1));
    const secoesTotal = Math.max(1, Math.round(totalSecoesMun * (0.6 + 0.8 * h2)));
    const secoesApuradas = Math.round(secoesTotal * p);
    const validosFinal = u.validosFinal * (secoesTotal / info.secoes) * (0.85 + 0.3 * h2);
    const validos = Math.round(validosFinal * p);
    const share = clamp01(u.shareLula + (h3 - 0.5) * 0.1);
    const lulaVotes = Math.round(validos * share);
    const flavioVotes = validos - lulaVotes;
    const total = flavioVotes + lulaVotes;
    return {
      nome: m.nm,
      secoesApuradas,
      secoesTotal,
      progresso: p,
      validos,
      flavioVotes,
      lulaVotes,
      flavioPct: total > 0 ? (flavioVotes / total) * 100 : 0,
      lulaPct: total > 0 ? (lulaVotes / total) * 100 : 0,
      lider: total > 0 ? (flavioVotes > lulaVotes ? "flavio" : "lula") : null,
    };
  });
  municipios.sort((a, b) => b.progresso - a.progresso || b.validos - a.validos);

  return {
    uf: info.uf,
    nome: info.nome,
    atualizadoEm: new Date().toISOString(),
    boletinsRecebidos: municipios.filter((m) => m.secoesApuradas > 0).length,
    totalMunicipios: municipios.length,
    municipios,
  };
}
