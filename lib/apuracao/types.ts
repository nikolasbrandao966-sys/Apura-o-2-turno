// Tipos compartilhados — Apuração oficial do 2º turno (Eleições 2026, TSE)
import type { UFInfo } from "./oficial";

export type CandidatoId = "lula" | "flavio";

export interface VotosCandidato {
  votes: number;
  pct: number; // % dos válidos
  deltaPct: number; // variação em pontos percentuais vs. ponto anterior
}

export interface EstadoResultado extends UFInfo {
  flavio: VotosCandidato;
  lula: VotosCandidato;
  secoesApuradas: number;
  progresso: number; // 0..1
  validos: number;
  brancos: number;
  nulos: number;
  comparecimento: number;
  abstencao: number;
  lider: CandidatoId | null;
  vantagemPct: number;
  eleito: CandidatoId | null; // declarado pelo TSE
  matematicamente: CandidatoId | null; // matematicamente definido
}

export interface GovCandidatoResultado {
  id: string;
  nomeUrna: string;
  partido: string;
  foto: string;
  cor: string;
  votes: number;
  pct: number;
  deltaPct: number;
  eleito: boolean;
  matematicamente: boolean;
}

export interface GovRunoffResultado {
  uf: string;
  nome: string;
  secoesApuradas: number;
  secoesTotal: number;
  progresso: number;
  candidatos: GovCandidatoResultado[];
  liderId: string | null;
  eleitoId: string | null;
}

export interface NacionalResultado {
  flavio: VotosCandidato;
  lula: VotosCandidato;
  secoesApuradas: number;
  secoesTotal: number;
  progresso: number;
  validos: number;
  brancos: number;
  nulos: number;
  comparecimento: number;
  aptos: number;
  abstencao: number;
  lider: CandidatoId | null;
  vantagemPct: number;
  vantagemVotos: number;
  eleito: CandidatoId | null;
  matematicamente: CandidatoId | null;
  estadosLiderando: { lula: number; flavio: number };
}

export interface TimelinePonto {
  t: number; // epoch ms
  apurado: number; // 0..1
  flavioPct: number;
  lulaPct: number;
  flavioVotes: number;
  lulaVotes: number;
}

export type ApuracaoStatus = "aguardando" | "apurando" | "encerrado";

export interface ApuracaoMeta {
  fonte: "oficial" | "simulacao";
  atualizadoEm: string; // ISO
  geradoTSE: string; // data/hora de geração do arquivo (TSE)
  status: ApuracaoStatus;
  proxima: string; // texto da próxima etapa (ex.: urnas fecham em ...)
}

export interface MunicipioResultado {
  nome: string;
  secoesApuradas: number;
  secoesTotal: number;
  progresso: number;
  validos: number;
  flavioVotes: number;
  lulaVotes: number;
  flavioPct: number;
  lulaPct: number;
  lider: CandidatoId | null;
}

export interface MunicipiosPayload {
  uf: string;
  nome: string;
  atualizadoEm: string;
  boletinsRecebidos: number; // municípios com boletim
  totalMunicipios: number;
  municipios: MunicipioResultado[];
}

export interface ApuracaoPayload {
  meta: ApuracaoMeta;
  nacional: NacionalResultado;
  estados: EstadoResultado[];
  governadores: GovRunoffResultado[];
  timeline: TimelinePonto[];
}
