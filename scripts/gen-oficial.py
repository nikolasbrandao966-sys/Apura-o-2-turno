#!/usr/bin/env python3
"""Gera src/lib/apuracao/oficial.ts a partir dos dados oficiais extraídos do TSE."""
import json

d = json.load(open("/tmp/tse-governadores.json"))

# Nome, região e razão validos1T/aptos1T por UF (dados oficiais do 1º turno)
REGIOES = {
  "AC": ("Acre", "Norte"), "AL": ("Alagoas", "Nordeste"), "AP": ("Amapá", "Norte"),
  "AM": ("Amazonas", "Norte"), "BA": ("Bahia", "Nordeste"), "CE": ("Ceará", "Nordeste"),
  "DF": ("Distrito Federal", "Centro-Oeste"), "ES": ("Espírito Santo", "Sudeste"),
  "GO": ("Goiás", "Centro-Oeste"), "MA": ("Maranhão", "Nordeste"),
  "MT": ("Mato Grosso", "Centro-Oeste"), "MS": ("Mato Grosso do Sul", "Centro-Oeste"),
  "MG": ("Minas Gerais", "Sudeste"), "PA": ("Pará", "Norte"),
  "PB": ("Paraíba", "Nordeste"), "PR": ("Paraná", "Sul"), "PE": ("Pernambuco", "Nordeste"),
  "PI": ("Piauí", "Nordeste"), "RJ": ("Rio de Janeiro", "Sudeste"),
  "RN": ("Rio Grande do Norte", "Nordeste"), "RS": ("Rio Grande do Sul", "Sul"),
  "RO": ("Rondônia", "Norte"), "RR": ("Roraima", "Norte"),
  "SC": ("Santa Catarina", "Sul"), "SP": ("São Paulo", "Sudeste"),
  "SE": ("Sergipe", "Nordeste"), "TO": ("Tocantins", "Norte"),
  "ZZ": ("Exterior", "Exterior"),
}
# validos1T / aptos1T por UF (oficial 1º turno) — para estimar votos válidos finais
RATIO = {
  "AC": 0.7732, "AL": 0.7813, "AP": 0.8025, "AM": 0.7328, "BA": 0.7567, "CE": 0.8090,
  "DF": 0.8162, "ES": 0.7523, "GO": 0.7584, "MA": 0.7933, "MT": 0.7580, "MS": 0.7628,
  "MG": 0.7305, "PA": 0.7932, "PB": 0.8049, "PR": 0.7448, "PE": 0.7835, "PI": 0.8644,
  "RJ": 0.7185, "RN": 0.8064, "RS": 0.7252, "RO": 0.7566, "RR": 0.7822, "SC": 0.7451,
  "SP": 0.7095, "SE": 0.8242, "TO": 0.8225, "ZZ": 0.7516,
}

# Cores oficiais de identidade dos partidos (estilo urna)
COR_PARTIDO = {
  "PT": "#C8102E", "PL": "#0A3D91", "PP": "#1B8A3F", "REPUBLICANOS": "#0F3B8C",
  "PSD": "#0E5FA8", "PSDB": "#00579D", "MDB": "#00745A", "UNIÃO": "#12355F",
  "PODE": "#0E8F86", "PSB": "#F5821F", "NOVO": "#FF8C00", "PCO": "#8A2BE2",
}
NUM_PARTIDO = {"PT": 13, "PL": 22, "PP": 11, "REPUBLICANOS": 10, "PSD": 55,
  "PSDB": 45, "MDB": 15, "UNIÃO": 44, "PODE": 20, "PSB": 40}

ufs_meta = {m["uf"]: m for m in d["ufsMeta"]}

def esc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\u2013", "-")

lines = []
lines.append("// Gerado por scripts/gen-oficial.py — dados OFICIAIS extraídos do TSE em 23/10/2026.")
lines.append("// Fontes: resultados.tse.jus.br/oficial/ele2026/{6257,6258,6259,6260} (fotos e cadastros).")
lines.append("// NÃO EDITAR À MÃO — regenerar via script.")
lines.append("")
lines.append("// ─────────────────────────── Candidatos à Presidência (2º turno, TSE 6258) ────")
lines.append("export interface CandidatoPres {")
lines.append("  id: \"flavio\" | \"lula\";")
lines.append("  sqcand: string;")
lines.append("  nomeCompleto: string;")
lines.append("  nomeUrna: string;")
lines.append("  numero: number;")
lines.append("  partido: string;")
lines.append("  coligacao: string;")
lines.append("  vice: string;")
lines.append("  foto: string;")
lines.append("  cor: string;")
lines.append("}")
lines.append("")
lines.append("export const PRESIDENTES: Record<\"flavio\" | \"lula\", CandidatoPres> = {")
pres_info = {
    "280002551544": ("flavio", "O Brasil Vai Vencer", "Alfredo Gaspar (PL)", 22, "#0A3D91"),
    "280002542548": ("lula", "Brasil Pronto pra Mais (Fed. Brasil da Esperança)", "Geraldo Alckmin (PSB)", 13, "#C8102E"),
}
for c in d["presidente"]:
    pid, col, vice, num, cor = pres_info[c["sqcand"]]
    lines.append(f'  {pid}: {{ id: "{pid}", sqcand: "{c["sqcand"]}", nomeCompleto: "{esc(c["nome"])}", nomeUrna: "{esc(c["nomeUrna"])}", numero: {num}, partido: "{c["partido"]}", coligacao: "{esc(col)}", vice: "{esc(vice)}", foto: "/fotos/pres-{c["sqcand"]}.jpeg", cor: "{cor}" }},')
lines.append("};")
lines.append("")
lines.append("// ─────────────────────────── Unidades (26 estados + DF + Exterior ZZ) ────")
lines.append("export interface UFInfo { uf: string; nome: string; regiao: string; aptos: number; secoes: number; ratioValidos1T: number; exterior: boolean; }")
lines.append("")
lines.append("export const UFS: UFInfo[] = [")
for uf, (nome, regiao) in REGIOES.items():
    m = ufs_meta.get(uf, {"aptos": "0", "secoes": "0"})
    ext = "true" if uf == "ZZ" else "false"
    lines.append(f'  {{ uf: "{uf}", nome: "{nome}", regiao: "{regiao}", aptos: {m["aptos"]}, secoes: {m["secoes"]}, ratioValidos1T: {RATIO[uf]}, exterior: {ext} }},')
lines.append("];")
lines.append("")
lines.append("// ─────────────────────────── Governador: eleitos no 1º turno (TSE 6259) ────")
lines.append("export interface GovernadorEleito1T { uf: string; nome: string; nomeUrna: string; partido: string; numero: number; pct: string; votos: number; foto: string; }")
lines.append("")
lines.append("export const GOVERNADORES_ELEITOS_1T: GovernadorEleito1T[] = [")
for c in sorted(d["governadoresEleitos"], key=lambda x: x["uf"]):
    num = NUM_PARTIDO.get(c["partido"], 0)
    lines.append(f'  {{ uf: "{c["uf"]}", nome: "{esc(c["nome"])}", nomeUrna: "{esc(c["nomeUrna"])}", partido: "{c["partido"]}", numero: {num}, pct: "{c["pvap"]}", votos: {c["vap"]}, foto: "/fotos/gov-{c["sqcand"]}.jpeg" }},')
lines.append("];")
lines.append("")
lines.append("// ─────────────────────────── Governador: 2º turno (TSE 6260) ────")
lines.append("export interface GovCand2T { id: string; sqcand: string; nome: string; nomeUrna: string; partido: string; numero: number; foto: string; cor: string; pct1T: string; votos1T: number; }")
lines.append("export interface GovRunoff { uf: string; candidatos: GovCand2T[] }")
lines.append("")
lines.append("export const GOVERNADORES_RUNOFF: GovRunoff[] = [")
for r in sorted(d["governadoresRunoff"], key=lambda x: x["uf"]):
    lines.append("  {")
    lines.append(f'    uf: "{r["uf"]}",')
    lines.append("    candidatos: [")
    for c in r["candidatos"]:
        cid = c["nomeUrna"].lower().split()[0].replace(".", "").replace("'", "")
        cor = COR_PARTIDO.get(c["partido"], "#475569")
        num = NUM_PARTIDO.get(c["partido"], 0)
        lines.append(f'      {{ id: "{esc(cid)}", sqcand: "{c["sqcand"]}", nome: "{esc(c["nome"])}", nomeUrna: "{esc(c["nomeUrna"])}", partido: "{c["partido"]}", numero: {num}, foto: "/fotos/gov-{c["sqcand"]}.jpeg", cor: "{cor}", pct1T: "{c.get("pvap1T", "0,00")}", votos1T: {c.get("vap1T", 0)} }},')
    lines.append("    ],")
    lines.append("  },")
lines.append("];")
lines.append("")
lines.append("// ─────────────────────────── Cores e números dos partidos (identidade urna) ────")
lines.append("export const PARTIDOS: Record<string, { cor: string; numero: number }> = {")
for sg, cor in COR_PARTIDO.items():
    lines.append(f'  "{sg}": {{ cor: "{cor}", numero: {NUM_PARTIDO.get(sg, 0)} }},')
lines.append("};")

out = "\n".join(lines) + "\n"
open("/home/z/my-project/src/lib/apuracao/oficial.ts", "w").write(out)
print("oficial.ts gerado:", len(out), "bytes")
print(out[:600])
