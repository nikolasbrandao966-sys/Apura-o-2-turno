// Gerado por scripts/gen-oficial.py — dados OFICIAIS extraídos do TSE em 23/10/2026.
// Fontes: resultados.tse.jus.br/oficial/ele2026/{6257,6258,6259,6260} (fotos e cadastros).
// NÃO EDITAR À MÃO — regenerar via script.

// ─────────────────────────── Candidatos à Presidência (2º turno, TSE 6258) ────
export interface CandidatoPres {
  id: "flavio" | "lula";
  sqcand: string;
  nomeCompleto: string;
  nomeUrna: string;
  numero: number;
  partido: string;
  coligacao: string;
  vice: string;
  foto: string;
  cor: string;
}

export const PRESIDENTES: Record<"flavio" | "lula", CandidatoPres> = {
  flavio: { id: "flavio", sqcand: "280002551544", nomeCompleto: "FLAVIO NANTES BOLSONARO", nomeUrna: "FLAVIO BOLSONARO", numero: 22, partido: "PL", coligacao: "O Brasil Vai Vencer", vice: "Alfredo Gaspar (PL)", foto: "/fotos/pres-280002551544.jpeg", cor: "#0A3D91" },
  lula: { id: "lula", sqcand: "280002542548", nomeCompleto: "LUIZ INÁCIO LULA DA SILVA", nomeUrna: "LULA", numero: 13, partido: "PT", coligacao: "Brasil Pronto pra Mais (Fed. Brasil da Esperança)", vice: "Geraldo Alckmin (PSB)", foto: "/fotos/pres-280002542548.jpeg", cor: "#C8102E" },
};

// ─────────────────────────── Unidades (26 estados + DF + Exterior ZZ) ────
export interface UFInfo { uf: string; nome: string; regiao: string; aptos: number; secoes: number; ratioValidos1T: number; exterior: boolean; }

export const UFS: UFInfo[] = [
  { uf: "AC", nome: "Acre", regiao: "Norte", aptos: 613715, secoes: 2270, ratioValidos1T: 0.7732, exterior: false },
  { uf: "AL", nome: "Alagoas", regiao: "Nordeste", aptos: 2442081, secoes: 7101, ratioValidos1T: 0.7813, exterior: false },
  { uf: "AP", nome: "Amapá", regiao: "Norte", aptos: 576910, secoes: 1914, ratioValidos1T: 0.8025, exterior: false },
  { uf: "AM", nome: "Amazonas", regiao: "Norte", aptos: 2798661, secoes: 8157, ratioValidos1T: 0.7328, exterior: false },
  { uf: "BA", nome: "Bahia", regiao: "Nordeste", aptos: 11312891, secoes: 35476, ratioValidos1T: 0.7567, exterior: false },
  { uf: "CE", nome: "Ceará", regiao: "Nordeste", aptos: 6996521, secoes: 23765, ratioValidos1T: 0.809, exterior: false },
  { uf: "DF", nome: "Distrito Federal", regiao: "Centro-Oeste", aptos: 2258995, secoes: 6969, ratioValidos1T: 0.8162, exterior: false },
  { uf: "ES", nome: "Espírito Santo", regiao: "Sudeste", aptos: 2991515, secoes: 9844, ratioValidos1T: 0.7523, exterior: false },
  { uf: "GO", nome: "Goiás", regiao: "Centro-Oeste", aptos: 5080385, secoes: 15686, ratioValidos1T: 0.7584, exterior: false },
  { uf: "MA", nome: "Maranhão", regiao: "Nordeste", aptos: 5183049, secoes: 18093, ratioValidos1T: 0.7933, exterior: false },
  { uf: "MT", nome: "Mato Grosso", regiao: "Centro-Oeste", aptos: 2637879, secoes: 8287, ratioValidos1T: 0.758, exterior: false },
  { uf: "MS", nome: "Mato Grosso do Sul", regiao: "Centro-Oeste", aptos: 2024437, secoes: 7106, ratioValidos1T: 0.7628, exterior: false },
  { uf: "MG", nome: "Minas Gerais", regiao: "Sudeste", aptos: 16372144, secoes: 52062, ratioValidos1T: 0.7305, exterior: false },
  { uf: "PA", nome: "Pará", regiao: "Norte", aptos: 6262063, secoes: 20827, ratioValidos1T: 0.7932, exterior: false },
  { uf: "PB", nome: "Paraíba", regiao: "Nordeste", aptos: 3248434, secoes: 10712, ratioValidos1T: 0.8049, exterior: false },
  { uf: "PR", nome: "Paraná", regiao: "Sul", aptos: 8613628, secoes: 27142, ratioValidos1T: 0.7448, exterior: false },
  { uf: "PE", nome: "Pernambuco", regiao: "Nordeste", aptos: 7223227, secoes: 21418, ratioValidos1T: 0.7835, exterior: false },
  { uf: "PI", nome: "Piauí", regiao: "Nordeste", aptos: 2704695, secoes: 10225, ratioValidos1T: 0.8644, exterior: false },
  { uf: "RJ", nome: "Rio de Janeiro", regiao: "Sudeste", aptos: 12857526, secoes: 37675, ratioValidos1T: 0.7185, exterior: false },
  { uf: "RN", nome: "Rio Grande do Norte", regiao: "Nordeste", aptos: 2659867, secoes: 8115, ratioValidos1T: 0.8064, exterior: false },
  { uf: "RS", nome: "Rio Grande do Sul", regiao: "Sul", aptos: 8522318, secoes: 27547, ratioValidos1T: 0.7252, exterior: false },
  { uf: "RO", nome: "Rondônia", regiao: "Norte", aptos: 1265926, secoes: 4698, ratioValidos1T: 0.7566, exterior: false },
  { uf: "RR", nome: "Roraima", regiao: "Norte", aptos: 401540, secoes: 1519, ratioValidos1T: 0.7822, exterior: false },
  { uf: "SC", nome: "Santa Catarina", regiao: "Sul", aptos: 5734687, secoes: 17326, ratioValidos1T: 0.7451, exterior: false },
  { uf: "SP", nome: "São Paulo", regiao: "Sudeste", aptos: 34123591, secoes: 103656, ratioValidos1T: 0.7095, exterior: false },
  { uf: "SE", nome: "Sergipe", regiao: "Nordeste", aptos: 1740093, secoes: 5923, ratioValidos1T: 0.8242, exterior: false },
  { uf: "TO", nome: "Tocantins", regiao: "Norte", aptos: 1182041, secoes: 4384, ratioValidos1T: 0.8225, exterior: false },
  { uf: "ZZ", nome: "Exterior", regiao: "Exterior", aptos: 916683, secoes: 1351, ratioValidos1T: 0.7516, exterior: true },
];

// ─────────────────────────── Governador: eleitos no 1º turno (TSE 6259) ────
export interface GovernadorEleito1T { uf: string; nome: string; nomeUrna: string; partido: string; numero: number; pct: string; votos: number; foto: string; }

export const GOVERNADORES_ELEITOS_1T: GovernadorEleito1T[] = [
  { uf: "AL", nome: "JOÃO HENRIQUE HOLANDA CALDAS", nomeUrna: "JHC", partido: "PSDB", numero: 45, pct: "52,20", votos: 892484, foto: "/fotos/gov-20002553350.jpeg" },
  { uf: "AP", nome: "ANTONIO PAULO DE OLIVEIRA FURLAN", nomeUrna: "DR. FURLAN", partido: "PSD", numero: 55, pct: "62,75", votos: 281595, foto: "/fotos/gov-30002530014.jpeg" },
  { uf: "BA", nome: "JERONIMO RODRIGUES SOUZA", nomeUrna: "JERÔNIMO RODRIGUES", partido: "PT", numero: 13, pct: "55,80", votos: 4626509, foto: "/fotos/gov-50002536314.jpeg" },
  { uf: "CE", nome: "ELMANO DE FREITAS DA COSTA", nomeUrna: "ELMANO DE FREITAS", partido: "PT", numero: 13, pct: "53,19", votos: 2875573, foto: "/fotos/gov-60002543969.jpeg" },
  { uf: "GO", nome: "DANIEL ELIAS CARVALHO VILELA", nomeUrna: "DANIEL VILELA", partido: "MDB", numero: 15, pct: "59,17", votos: 2148218, foto: "/fotos/gov-90002540993.jpeg" },
  { uf: "MA", nome: "EDUARDO SALIM BRAIDE", nomeUrna: "EDUARDO BRAIDE", partido: "PSD", numero: 55, pct: "54,02", votos: 2104122, foto: "/fotos/gov-100002545679.jpeg" },
  { uf: "MG", nome: "CLEITON GONTIJO DE AZEVEDO", nomeUrna: "CLEITINHO AZEVEDO", partido: "REPUBLICANOS", numero: 10, pct: "55,40", votos: 6321590, foto: "/fotos/gov-130002552296.jpeg" },
  { uf: "MS", nome: "EDUARDO CORREA RIEDEL", nomeUrna: "EDUARDO RIEDEL", partido: "PP", numero: 11, pct: "67,07", votos: 914323, foto: "/fotos/gov-120002536582.jpeg" },
  { uf: "MT", nome: "OTAVIANO OLAVO PIVETTA", nomeUrna: "OTAVIANO PIVETTA", partido: "REPUBLICANOS", numero: 10, pct: "60,77", votos: 1128099, foto: "/fotos/gov-110002551480.jpeg" },
  { uf: "PA", nome: "DANIEL BARBOSA SANTOS", nomeUrna: "DR. DANIEL", partido: "PODE", numero: 20, pct: "51,36", votos: 2345721, foto: "/fotos/gov-140002549930.jpeg" },
  { uf: "PB", nome: "LUCAS RIBEIRO NOVAIS DE ARAUJO", nomeUrna: "LUCAS RIBEIRO", partido: "PP", numero: 11, pct: "64,30", votos: 1470252, foto: "/fotos/gov-150002551789.jpeg" },
  { uf: "PE", nome: "RAQUEL TEIXEIRA LYRA LUCENA", nomeUrna: "RAQUEL LYRA", partido: "PSD", numero: 55, pct: "53,27", votos: 2805438, foto: "/fotos/gov-170002537227.jpeg" },
  { uf: "PI", nome: "RAFAEL TAJRA FONTELES", nomeUrna: "RAFAEL FONTELES", partido: "PT", numero: 13, pct: "70,90", votos: 1436697, foto: "/fotos/gov-180002532987.jpeg" },
  { uf: "PR", nome: "SERGIO FERNANDO MORO", nomeUrna: "SERGIO MORO", partido: "PL", numero: 22, pct: "50,10", votos: 3127911, foto: "/fotos/gov-160002540833.jpeg" },
  { uf: "RJ", nome: "DOUGLAS RUAS DOS SANTOS", nomeUrna: "DOUGLAS RUAS", partido: "PL", numero: 22, pct: "50,88", votos: 4271199, foto: "/fotos/gov-190002542887.jpeg" },
  { uf: "RO", nome: "MARCOS ROGERIO DA SILVA BRITO", nomeUrna: "MARCOS ROGÉRIO", partido: "PL", numero: 22, pct: "56,86", votos: 537370, foto: "/fotos/gov-220002541939.jpeg" },
  { uf: "RR", nome: "ARTHUR HENRIQUE BRANDAO MACHADO", nomeUrna: "ARTHUR HENRIQUE", partido: "PL", numero: 22, pct: "69,13", votos: 220809, foto: "/fotos/gov-230002549223.jpeg" },
  { uf: "RS", nome: "LUCIANO LORENZINI ZUCCO", nomeUrna: "ZUCCO", partido: "PL", numero: 22, pct: "58,05", votos: 3516048, foto: "/fotos/gov-210002547857.jpeg" },
  { uf: "SC", nome: "JORGINHO DOS SANTOS MELLO", nomeUrna: "JORGINHO MELLO", partido: "PL", numero: 22, pct: "68,98", votos: 2942386, foto: "/fotos/gov-240002537073.jpeg" },
  { uf: "SE", nome: "FABIO CRUZ MITIDIERI", nomeUrna: "FÁBIO", partido: "PSD", numero: 55, pct: "59,27", votos: 727291, foto: "/fotos/gov-260002542491.jpeg" },
  { uf: "SP", nome: "TARCISIO GOMES DE FREITAS", nomeUrna: "TARCÍSIO", partido: "REPUBLICANOS", numero: 10, pct: "62,65", votos: 14491874, foto: "/fotos/gov-250002541303.jpeg" },
];

// ─────────────────────────── Governador: 2º turno (TSE 6260) ────
export interface GovCand2T { id: string; sqcand: string; nome: string; nomeUrna: string; partido: string; numero: number; foto: string; cor: string; pct1T: string; votos1T: number; }
export interface GovRunoff { uf: string; candidatos: GovCand2T[] }

export const GOVERNADORES_RUNOFF: GovRunoff[] = [
  {
    uf: "AC",
    candidatos: [
      { id: "mailza", sqcand: "10002544107", nome: "MAILZA ASSIS CAMELI", nomeUrna: "MAILZA ASSIS", partido: "PP", numero: 11, foto: "/fotos/gov-10002544107.jpeg", cor: "#1B8A3F", pct1T: "49,76", votos1T: 218760 },
      { id: "alan", sqcand: "10002532492", nome: "ALAN RICK MIRANDA", nomeUrna: "ALAN RICK", partido: "REPUBLICANOS", numero: 10, foto: "/fotos/gov-10002532492.jpeg", cor: "#0F3B8C", pct1T: "32,27", votos1T: 141859 },
    ],
  },
  {
    uf: "AM",
    candidatos: [
      { id: "omar", sqcand: "40002532272", nome: "OMAR JOSE ABDELAZIZ", nomeUrna: "OMAR AZIZ", partido: "PSD", numero: 55, foto: "/fotos/gov-40002532272.jpeg", cor: "#0E5FA8", pct1T: "40,63", votos1T: 841846 },
      { id: "professora", sqcand: "40002541626", nome: "MARIA DO CARMO SEFFAIR LINS DE ALBUQUERQUE", nomeUrna: "PROFESSORA MARIA DO CARMO", partido: "PL", numero: 22, foto: "/fotos/gov-40002541626.jpeg", cor: "#0A3D91", pct1T: "24,49", votos1T: 507335 },
    ],
  },
  {
    uf: "DF",
    candidatos: [
      { id: "celina", sqcand: "70002553055", nome: "CELINA LEAO HIZIM FERREIRA", nomeUrna: "CELINA LEÃO", partido: "PP", numero: 11, foto: "/fotos/gov-70002553055.jpeg", cor: "#1B8A3F", pct1T: "49,93", votos1T: 825530 },
      { id: "leandro", sqcand: "70002552496", nome: "LEANDRO ANTÔNIO GRASS PEIXOTO", nomeUrna: "LEANDRO GRASS", partido: "PT", numero: 13, foto: "/fotos/gov-70002552496.jpeg", cor: "#C8102E", pct1T: "34,47", votos1T: 569930 },
    ],
  },
  {
    uf: "ES",
    candidatos: [
      { id: "lorenzo", sqcand: "80002552682", nome: "LORENZO SILVA DE PAZOLINI", nomeUrna: "LORENZO PAZOLINI", partido: "REPUBLICANOS", numero: 10, foto: "/fotos/gov-80002552682.jpeg", cor: "#0F3B8C", pct1T: "49,65", votos1T: 1048633 },
      { id: "ricardo", sqcand: "80002552172", nome: "RICARDO DE REZENDE FERRAÇO", nomeUrna: "RICARDO FERRAÇO", partido: "MDB", numero: 15, foto: "/fotos/gov-80002552172.jpeg", cor: "#00745A", pct1T: "34,06", votos1T: 719397 },
    ],
  },
  {
    uf: "RN",
    candidatos: [
      { id: "allyson", sqcand: "200002535255", nome: "ALLYSON LEANDRO BEZERRA SILVA", nomeUrna: "ALLYSON", partido: "UNIÃO", numero: 44, foto: "/fotos/gov-200002535255.jpeg", cor: "#12355F", pct1T: "36,94", votos1T: 733809 },
      { id: "cadu", sqcand: "200002534001", nome: "CARLOS EDUARDO XAVIER", nomeUrna: "CADU DE LULA", partido: "PT", numero: 13, foto: "/fotos/gov-200002534001.jpeg", cor: "#C8102E", pct1T: "36,16", votos1T: 718300 },
    ],
  },
  {
    uf: "TO",
    candidatos: [
      { id: "professora", sqcand: "270002544599", nome: "MARIA AUXILIADORA SEABRA REZENDE", nomeUrna: "PROFESSORA DORINHA", partido: "UNIÃO", numero: 44, foto: "/fotos/gov-270002544599.jpeg", cor: "#12355F", pct1T: "45,52", votos1T: 386260 },
      { id: "vicentinho", sqcand: "270002544544", nome: "VICENTE ALVES DE OLIVEIRA JÚNIOR", nomeUrna: "VICENTINHO JÚNIOR", partido: "PSDB", numero: 45, foto: "/fotos/gov-270002544544.jpeg", cor: "#00579D", pct1T: "43,94", votos1T: 372848 },
    ],
  },
];

// ─────────────────────────── Cores e números dos partidos (identidade urna) ────
export const PARTIDOS: Record<string, { cor: string; numero: number }> = {
  "PT": { cor: "#C8102E", numero: 13 },
  "PL": { cor: "#0A3D91", numero: 22 },
  "PP": { cor: "#1B8A3F", numero: 11 },
  "REPUBLICANOS": { cor: "#0F3B8C", numero: 10 },
  "PSD": { cor: "#0E5FA8", numero: 55 },
  "PSDB": { cor: "#00579D", numero: 45 },
  "MDB": { cor: "#00745A", numero: 15 },
  "UNIÃO": { cor: "#12355F", numero: 44 },
  "PODE": { cor: "#0E8F86", numero: 20 },
  "PSB": { cor: "#F5821F", numero: 40 },
  "NOVO": { cor: "#FF8C00", numero: 0 },
  "PCO": { cor: "#8A2BE2", numero: 0 },
};
