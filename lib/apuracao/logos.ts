// Logos OFICIAIS dos partidos — baixadas da Wikipédia/Wikimedia Commons
// por scripts/baixa-logos.py + corrige-logos.py (23/10/2026). Não editar à mão.

export interface LogoPartido { src: string; w: number; h: number }

export const LOGOS_PARTIDOS: Record<string, LogoPartido> = {
  "PT": { src: "/logos/pt.png", w: 1280, h: 1225 },
  "PL": { src: "/logos/pl.png", w: 500, h: 544 },
  "PP": { src: "/logos/pp.png", w: 960, h: 594 },
  "REPUBLICANOS": { src: "/logos/republicanos.png", w: 500, h: 173 },
  "PSD": { src: "/logos/psd.png", w: 960, h: 456 },
  "PSDB": { src: "/logos/psdb.png", w: 1280, h: 440 },
  "MDB": { src: "/logos/mdb.png", w: 500, h: 358 },
  "UNIÃO": { src: "/logos/uniao.png", w: 250, h: 134 },
  "PODE": { src: "/logos/pode.png", w: 500, h: 218 },
  "PSB": { src: "/logos/psb.png", w: 1000, h: 590 },
};

export function logoPartido(sg: string): LogoPartido | undefined {
  return LOGOS_PARTIDOS[sg];
}
