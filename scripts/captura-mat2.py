#!/usr/bin/env python3
"""Continua o loop até capturar o badge 'Matematicamente eleito' (janela ~99,3%+)."""
import json, time, urllib.request

BASE = "http://localhost:3000"
COOKIE = "adm26=adm-2t-2026-sim"

def post(path, body=None):
    req = urllib.request.Request(BASE + path, method="POST",
        data=json.dumps(body or {}).encode(),
        headers={"content-type": "application/json", "cookie": COOKIE})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)

def get(path):
    req = urllib.request.Request(BASE + path, headers={"cookie": COOKIE})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)

s = get("/api/admin")["sim"]
print(f"estado atual: {s['horaSim']} | prog {s['progressoNacional']*100:.1f}% | vel {s['velocidade']}x | ativo={s['ativo']} pausado={s['pausado']}")
if s["pausado"]:
    post("/api/admin?acao=sim", {"cmd": "resume"})
if s["velocidade"] != 10:
    post("/api/admin?acao=sim", {"cmd": "velocidade", "valor": "10"})

capturou = False
for i in range(300):
    p = get("/api/apuracao?sim=1")
    n = p["nacional"]
    prog = n["progresso"]
    if n["matematicamente"]:
        print(f"BADGE! {p['meta']['geradoTSE']} | prog {prog*100:.2f}% | Flávio {n['flavio']['pct']:.2f} x Lula {n['lula']['pct']:.2f}")
        print(f"  gap: {n['vantagemVotos']} votos | líder: {n['lider']}")
        post("/api/admin?acao=sim", {"cmd": "pause"})
        print("PAUSADO — screenshot agora")
        capturou = True
        break
    if i % 20 == 0:
        print(f"  {i:3d} | {p['meta']['geradoTSE']} | prog {prog*100:5.2f}% | F {n['flavio']['pct']:.2f} x L {n['lula']['pct']:.2f} | mat={n['matematicamente']}")
    if prog >= 0.99999:
        print(f"  chegou a 100% sem badge: F {n['flavio']['pct']:.2f} x L {n['lula']['pct']:.2f} eleito={n['eleito']}")
        break
    time.sleep(0.8)

print("capturado!" if capturou else "não capturado")
