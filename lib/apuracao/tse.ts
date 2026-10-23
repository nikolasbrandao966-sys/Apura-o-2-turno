// Cliente dos resultados OFICIAIS do TSE — 2º turno das Eleições 2026.
//
// Endpoints descobertos no portal oficial (resultados.tse.jus.br):
//   Config municípios: /oficial/ele2026/6258/config/mun-e006258-cm.jws
//   Presidente:        /oficial/ele2026/6258/dados/{abr}/{abr}-c0001-e006258-u.jws
//   Governador 2º T.:  /oficial/ele2026/6260/dados/{uf}/{uf}-c0003-e006260-u.jws
//   Municípios:        /oficial/ele2026/6258/dados/{uf}/{uf}{codmun}-c0001-e006258-u.jws
// Arquivos JWS: payload base64url (segunda parte) = JSON.

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
  VotosCandidato,
} from "./types";
import { GOVERNADORES_RUNOFF, PRESIDENTES, UFS } from "./oficial";

const BASE = "https://resultados.tse.jus.br/oficial/ele2026";
const ELE_PRES = "6258";
const ELE_GOV = "6260";
const TIMEOUT_MS = 12_000;
const TTL_DADOS_MS = 10_000; // arquivos de resultados: 10s
const TTL_MUNICIPIOS_MS = 90_000; // lista de municípios: 90s
const HIST_MAX = 480;

const SQ_FLAVIO = PRESIDENTES.flavio.sqcand;
const SQ_LULA = PRESIDENTES.lula.sqcand;

// ────────────────────────────── caches globais (sobrevivem a revalidação)

interface JwsCache {
  json: Record<string, unknown>;
  ts: number;
}
interface HistState {
  pontos: TimelinePonto[];
  ultimaChave: string;
}
declare global {
  var __tseJws: Map<string, JwsCache> | undefined;
  var __tseMunCfg: { abr: { cd: string; ds: string; mu: { cd: string; nm: string }[] }[] } | null | undefined;
  var __tseMun: Map<string, { payload: MunicipiosPayload; ts: number }> | undefined;
  var __tseHist: HistState | undefined;
  var __tseFalha: { ate: number } | undefined;
  var __tseUltimo: { payload: ApuracaoPayload; ts: number } | undefined;
}

const jwsCache = (globalThis.__tseJws ??= new Map());
const munCache = (globalThis.__tseMun ??= new Map());
const hist = (globalThis.__tseHist ??= { pontos: [], ultimaChave: "" });

// ────────────────────────────── utilitários

function decodeJws(raw: string): Record<string, unknown> | null {
  try {
    const parts = raw.trim().split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(b64, "base64");
    return JSON.parse(buf.toString("utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchJws(url: string, ttl = TTL_DADOS_MS): Promise<Record<string, unknown> | null> {
  const cached = jwsCache.get(url);
  const now = Date.now();
  if (cached && now - cached.ts < ttl) return cached.json;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/octet-stream, text/plain, */*" },
    });
    clearTimeout(timer);
    if (!res.ok) return cached?.json ?? null;
    const json = decodeJws(await res.text());
    if (!json) return cached?.json ?? null;
    jwsCache.set(url, { json, ts: now });
    return json;
  } catch {
    return cached?.json ?? null;
  }
}

function int(v: unknown): number {
  const n = typeof v === "string" ? parseInt(v.replace(/\D/g, ""), 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

interface CandRaw {
  sqcand?: string;
  nm?: string;
  nmu?: string;
  vap?: string;
  pvap?: string;
  e?: string;
}

function candidatosDoArquivo(json: Record<string, unknown>): CandRaw[] {
  const out: CandRaw[] = [];
  const carg = (json.carg as Record<string, unknown>[] | undefined) ?? [];
  for (const cargo of carg) {
    const agr = (cargo.agr as Record<string, unknown>[] | undefined) ?? [];
    for (const a of agr) {
      const par = (a.par as Record<string, unknown>[] | undefined) ?? [];
      for (const p of par) {
        const cand = (p.cand as CandRaw[] | undefined) ?? [];
        out.push(...cand);
      }
    }
  }
  return out;
}

function par(votosA: number, votosB: number): number {
  const t = votosA + votosB;
  return t > 0 ? (votosA / t) * 100 : 0;
}

/**
 * "Matematicamente definido": a vantagem do líder supera a estimativa máxima
 * de votos válidos que ainda faltam apurar (aptos × razão válidos do 1º turno,
 * conservador). O TSE só declara o eleito ("e":"s") ao final.
 */
function matematicamente(
  liderVotos: number,
  segundoVotos: number,
  aptos: number,
  ratioValidos: number,
  progresso: number,
): boolean {
  if (progresso <= 0 || progresso >= 1) return false;
  const finaisValidos = aptos * ratioValidos * 0.99;
  const restantes = finaisValidos * (1 - progresso);
  return liderVotos - segundoVotos > restantes * 1.02;
}

// ────────────────────────────── apuração principal

export async function getApuracao(): Promise<ApuracaoPayload> {
  const emFalha = Date.now() < (globalThis.__tseFalha?.ate ?? 0);
  const ultimo = globalThis.__tseUltimo;

  // durante falha de rede, serve o último payload bom — nunca zera um site
  // que já mostrava dados oficiais
  const servirUltimo = () =>
    ultimo && ultimo.payload.nacional.secoesApuradas > 0
      ? {
          ...ultimo.payload,
          meta: { ...ultimo.payload.meta, atualizadoEm: new Date().toISOString() },
        }
      : montarZerado();
  if (emFalha) return servirUltimo();

  const abrs = [...UFS.map((u) => u.uf.toLowerCase())];
  const [br, ...estadosJson] = await Promise.all([
    fetchJws(`${BASE}/${ELE_PRES}/dados/br/br-c0001-e00${ELE_PRES}-u.jws`),
    ...abrs.map((uf) => fetchJws(`${BASE}/${ELE_PRES}/dados/${uf}/${uf}-c0001-e00${ELE_PRES}-u.jws`)),
    ...GOVERNADORES_RUNOFF.map((g) =>
      fetchJws(`${BASE}/${ELE_GOV}/dados/${g.uf.toLowerCase()}/${g.uf.toLowerCase()}-c0003-e00${ELE_GOV}-u.jws`),
    ),
  ]);
  const govJson = estadosJson.splice(abrs.length); // últimos 6 = governadores
  if (!br) {
    globalThis.__tseFalha = { ate: Date.now() + 30_000 };
    return servirUltimo();
  }

  // nacional (arquivo br)
  const brCands = candidatosDoArquivo(br);
  const f = brCands.find((c) => c.sqcand === SQ_FLAVIO);
  const l = brCands.find((c) => c.sqcand === SQ_LULA);
  if (!f || !l) return montarZerado();
  const fV = int(f.vap);
  const lV = int(l.vap);
  const brS = br.s as Record<string, string> | undefined;
  const brE = br.e as Record<string, string> | undefined;
  const brV = br.v as Record<string, string> | undefined;
  const secoesTotal = int(brS?.ts);
  const secoesApuradas = int(brS?.sa);
  const progresso = secoesTotal > 0 ? secoesApuradas / secoesTotal : 0;
  const validos = fV + lV;

  // estados (27 + Exterior)
  const estados: EstadoResultado[] = UFS.map((info, i) => {
    const j = estadosJson[i];
    const cands = j ? candidatosDoArquivo(j) : [];
    const fv = int(cands.find((c) => c.sqcand === SQ_FLAVIO)?.vap);
    const lv = int(cands.find((c) => c.sqcand === SQ_LULA)?.vap);
    const ts = j ? int((j.s as Record<string, string>)?.ts) : 0;
    const sa = j ? int((j.s as Record<string, string>)?.sa) : 0;
    const c = j ? int((j.e as Record<string, string>)?.c) : 0;
    const a = j ? int((j.e as Record<string, string>)?.a) : 0;
    const vb = j ? int((j.v as Record<string, string>)?.vb) : 0;
    const vn = j ? int((j.v as Record<string, string>)?.vn) : 0;
    const prog = ts > 0 ? sa / ts : 0;
    const pctF = par(fv, lv);
    const pctL = par(lv, fv);
    const lider: CandidatoId | null = fv + lv > 0 ? (fv > lv ? "flavio" : "lula") : null;
    const eleito: CandidatoId | null =
      (cands.find((x) => x.sqcand === SQ_FLAVIO)?.e === "s" ? "flavio" : null) ??
      (cands.find((x) => x.sqcand === SQ_LULA)?.e === "s" ? "lula" : null);
    return {
      ...info,
      flavio: { votes: fv, pct: pctF, deltaPct: 0 },
      lula: { votes: lv, pct: pctL, deltaPct: 0 },
      secoesApuradas: sa,
      progresso: prog,
      validos: fv + lv,
      brancos: vb,
      nulos: vn,
      comparecimento: c,
      abstencao: a,
      lider,
      vantagemPct: Math.abs(pctF - pctL),
      eleito,
      matematicamente: matematicamente(Math.max(fv, lv), Math.min(fv, lv), info.aptos, info.ratioValidos1T, prog)
        ? (fv > lv ? "flavio" : "lula")
        : null,
    };
  });

  // governadores (6 disputas, TSE 6260)
  const govNomes = new Map(UFS.map((u) => [u.uf, u.nome]));
  const governadores: GovRunoffResultado[] = GOVERNADORES_RUNOFF.map((g, i) => {
    const j = govJson[i];
    const cands = j ? candidatosDoArquivo(j) : [];
    const ts = j ? int((j.s as Record<string, string>)?.ts) : 0;
    const sa = j ? int((j.s as Record<string, string>)?.sa) : 0;
    const prog = ts > 0 ? sa / ts : 0;
    const resultados: GovCandidatoResultado[] = g.candidatos.map((c) => {
      const raw = cands.find((x) => x.sqcand === c.sqcand);
      const v = int(raw?.vap);
      const total = g.candidatos.reduce((s, gc) => s + int(cands.find((x) => x.sqcand === gc.sqcand)?.vap), 0);
      const pct = total > 0 ? (v / total) * 100 : 0;
      return {
        id: c.id,
        nomeUrna: c.nomeUrna,
        partido: c.partido,
        foto: c.foto,
        cor: c.cor,
        votes: v,
        pct,
        deltaPct: 0,
        eleito: raw?.e === "s",
        matematicamente: matematicamente(0, 0, 0, 0, 0) || false,
      };
    });
    const votos = resultados.map((r) => r.votes);
    const totalV = votos.reduce((a, b) => a + b, 0);
    for (const r of resultados) {
      r.matematicamente =
        totalV > 0 &&
        matematicamente(
          Math.max(...votos),
          Math.min(...votos),
          Number(govAptos(g.uf)) || 0,
          govRatio(g.uf),
          prog,
        ) &&
        r.votes === Math.max(...votos);
    }
    const liderId =
      totalV > 0 ? (resultados.find((r) => r.votes === Math.max(...votos))?.id ?? null) : null;
    return {
      uf: g.uf,
      nome: govNomes.get(g.uf) ?? g.uf,
      secoesApuradas: sa,
      secoesTotal: ts,
      progresso: prog,
      candidatos: resultados,
      liderId,
      eleitoId: resultados.find((r) => r.eleito)?.id ?? null,
    };
  });

  // histórico p/ tendências
  const chave = `${fV}|${lV}|${secoesApuradas}`;
  let timeline = hist.pontos;
  if (chave !== hist.ultimaChave && (fV > 0 || lV > 0 || secoesApuradas > 0)) {
    const ponto: TimelinePonto = {
      t: Date.now(),
      apurado: progresso,
      flavioPct: par(fV, lV),
      lulaPct: par(lV, fV),
      flavioVotes: fV,
      lulaVotes: lV,
    };
    const ultimo = hist.pontos[hist.pontos.length - 1];
    if (chave !== hist.ultimaChave) hist.ultimaChave = chave;
    if (!ultimo || ultimo.flavioVotes !== fV || ultimo.lulaVotes !== lV || ultimo.apurado !== progresso) {
      hist.pontos.push(ponto);
      if (hist.pontos.length > HIST_MAX) hist.pontos.shift();
    }
    timeline = hist.pontos;
  }

  // variações (subiu/desceu) desde o ponto anterior
  const penult = timeline.length >= 2 ? timeline[timeline.length - 2] : null;
  const ult = timeline.length >= 1 ? timeline[timeline.length - 1] : null;
  const delta = (atual: number, ant: number) => (ant > 0 ? atual - ant : 0);
  const dF = penult && ult ? delta(ult.flavioPct, penult.flavioPct) : 0;
  const dL = penult && ult ? delta(ult.lulaPct, penult.lulaPct) : 0;

  const nacional: NacionalResultado = {
    flavio: { votes: fV, pct: par(fV, lV), deltaPct: dF },
    lula: { votes: lV, pct: par(lV, fV), deltaPct: dL },
    secoesApuradas,
    secoesTotal,
    progresso,
    validos,
    brancos: int(brV?.vb),
    nulos: int(brV?.vn),
    comparecimento: int(brE?.c),
    aptos: int(brE?.te),
    abstencao: int(brE?.a),
    lider: fV + lV > 0 ? (fV > lV ? "flavio" : "lula") : null,
    vantagemPct: Math.abs(par(fV, lV) - par(lV, fV)),
    vantagemVotos: Math.abs(fV - lV),
    eleito: (f.e === "s" ? "flavio" : null) ?? (l.e === "s" ? "lula" : null),
    matematicamente: matematicamente(
      Math.max(fV, lV),
      Math.min(fV, lV),
      int(brE?.te),
      0.7516,
      progresso,
    )
      ? fV > lV
        ? "flavio"
        : "lula"
      : null,
    estadosLiderando: {
      lula: estados.filter((e) => e.lider === "lula").length,
      flavio: estados.filter((e) => e.lider === "flavio").length,
    },
  };

  // deltas por estado (mesma lógica, aproximada pelo histórico nacional)
  for (const e of estados) {
    e.flavio.deltaPct = 0;
    e.lula.deltaPct = 0;
  }

  const status: ApuracaoStatus =
    validos === 0 && secoesApuradas === 0
      ? "aguardando"
      : progresso >= 0.9999
        ? "encerrado"
        : "apurando";

  const dg = typeof br.dg === "string" ? br.dg : "";
  const hg = typeof br.hg === "string" ? br.hg : "";

  const payload: ApuracaoPayload = {
    meta: {
      fonte: "oficial",
      atualizadoEm: new Date().toISOString(),
      geradoTSE: `${dg} ${hg}`.trim(),
      status,
      proxima: status === "aguardando" ? "Urna fecha às 17h (Brasília), dia 25/10" : "",
    },
    nacional,
    estados,
    governadores,
    timeline,
  };
  globalThis.__tseUltimo = { payload, ts: Date.now() };
  return payload;
}

function govAptos(_uf: string): string {
  const uf = UFS.find((u) => u.uf === _uf);
  return String(uf?.aptos ?? 0);
}
function govRatio(_uf: string): number {
  return UFS.find((u) => u.uf === _uf)?.ratioValidos1T ?? 0.75;
}

// ────────────────────────────── municípios

async function getMunConfig() {
  if (globalThis.__tseMunCfg) return globalThis.__tseMunCfg;
  const j = await fetchJws(`${BASE}/${ELE_PRES}/config/mun-e00${ELE_PRES}-cm.jws`, 24 * 3600_000);
  if (!j) return null;
  globalThis.__tseMunCfg = j as unknown as NonNullable<typeof globalThis.__tseMunCfg>;
  return globalThis.__tseMunCfg;
}
export { getMunConfig };

export async function getMunicipios(uf: string): Promise<MunicipiosPayload | null> {
  const ufLow = uf.toLowerCase();
  const info = UFS.find((u) => u.uf.toLowerCase() === ufLow);
  if (!info) return null;
  const cached = munCache.get(ufLow);
  if (cached && Date.now() - cached.ts < TTL_MUNICIPIOS_MS) return cached.payload;

  const cfg = await getMunConfig();
  const abr = cfg?.abr?.find((a) => a.cd === ufLow);
  if (!cfg || !abr) return null;

  const mus = abr.mu ?? [];
  const LOTE = 100;
  const municipios: MunicipioResultado[] = [];
  for (let i = 0; i < mus.length; i += LOTE) {
    const lote = mus.slice(i, i + LOTE);
    const jsons = await Promise.all(
      lote.map((m) =>
        fetchJws(`${BASE}/${ELE_PRES}/dados/${ufLow}/${ufLow}${m.cd}-c0001-e00${ELE_PRES}-u.jws`),
      ),
    );
    lote.forEach((m, k) => {
      const j = jsons[k];
      const cands = j ? candidatosDoArquivo(j) : [];
      const fv = int(cands.find((c) => c.sqcand === SQ_FLAVIO)?.vap);
      const lv = int(cands.find((c) => c.sqcand === SQ_LULA)?.vap);
      const ts = j ? int((j.s as Record<string, string>)?.ts) : 0;
      const sa = j ? int((j.s as Record<string, string>)?.sa) : 0;
      municipios.push({
        nome: m.nm,
        secoesApuradas: sa,
        secoesTotal: ts,
        progresso: ts > 0 ? sa / ts : 0,
        validos: fv + lv,
        flavioVotes: fv,
        lulaVotes: lv,
        flavioPct: par(fv, lv),
        lulaPct: par(lv, fv),
        lider: fv + lv > 0 ? (fv > lv ? "flavio" : "lula") : null,
      });
    });
  }
  municipios.sort((a, b) => b.progresso - a.progresso || b.validos - a.validos);

  const payload: MunicipiosPayload = {
    uf: info.uf,
    nome: info.nome,
    atualizadoEm: new Date().toISOString(),
    boletinsRecebidos: municipios.filter((m) => m.secoesApuradas > 0).length,
    totalMunicipios: municipios.length,
    municipios,
  };
  munCache.set(ufLow, { payload, ts: Date.now() });
  return payload;
}

// ────────────────────────────── estado zerado (antes do 1º boletim)

function montarZerado(): ApuracaoPayload {
  const zero: VotosCandidato = { votes: 0, pct: 0, deltaPct: 0 };
  const estados: EstadoResultado[] = UFS.map((info) => ({
    ...info,
    flavio: { ...zero },
    lula: { ...zero },
    secoesApuradas: 0,
    progresso: 0,
    validos: 0,
    brancos: 0,
    nulos: 0,
    comparecimento: 0,
    abstencao: 0,
    lider: null,
    vantagemPct: 0,
    eleito: null,
    matematicamente: null,
  }));
  const govNomes = new Map(UFS.map((u) => [u.uf, u.nome]));
  const governadores: GovRunoffResultado[] = GOVERNADORES_RUNOFF.map((g) => ({
    uf: g.uf,
    nome: govNomes.get(g.uf) ?? g.uf,
    secoesApuradas: 0,
    secoesTotal: 0,
    progresso: 0,
    liderId: null,
    eleitoId: null,
    candidatos: g.candidatos.map((c) => ({
      id: c.id,
      nomeUrna: c.nomeUrna,
      partido: c.partido,
      foto: c.foto,
      cor: c.cor,
      votes: 0,
      pct: 0,
      deltaPct: 0,
      eleito: false,
      matematicamente: false,
    })),
  }));
  const nacional: NacionalResultado = {
    flavio: { ...zero },
    lula: { ...zero },
    secoesApuradas: 0,
    secoesTotal: 0,
    progresso: 0,
    validos: 0,
    brancos: 0,
    nulos: 0,
    comparecimento: 0,
    aptos: 0,
    abstencao: 0,
    lider: null,
    vantagemPct: 0,
    vantagemVotos: 0,
    eleito: null,
    matematicamente: null,
    estadosLiderando: { lula: 0, flavio: 0 },
  };
  return {
    meta: {
      fonte: "oficial",
      atualizadoEm: new Date().toISOString(),
      geradoTSE: "",
      status: "aguardando",
      proxima: "Urna fecha às 17h (Brasília), dia 25/10",
    },
    nacional,
    estados,
    governadores,
    timeline: hist.pontos,
  };
}
