#!/usr/bin/env python3
"""Reinicia a simulação e captura o momento do selo 'Matematicamente eleito'."""
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

# reinicia em 30x
post("/api/admin?acao=sim", {"cmd": "velocidade", "valor": "30"})
post("/api/admin?acao=sim", {"cmd": "restart"})
post("/api/admin?acao=sim", {"cmd": "resume"})
print("simulação reiniciada")

capturou = False
for i in range(200):
    s = get("/api/admin")["sim"]
    prog = s["progressoNacional"]
    if i % 10 == 0:
        print(f"  {i:3d} | {s['horaSim']} | prog {prog*100:5.1f}%")
    if prog > 0.90 and s["velocidade"] != 10:
        post("/api/admin?acao=sim", {"cmd": "velocidade", "valor": "10"})
        print("  → reduzindo para 10x na reta final")
    if 0.90 < prog < 0.9995:
        p = get("/api/apuracao?sim=1")
        n = p["nacional"]
        print(f"  !! prog {prog*100:.1f}% | Flávio {n['flavio']['pct']:.2f} x Lula {n['lula']['pct']:.2f} | mat: {n['matematicamente']}")
        if n["matematicamente"] and not capturou:
            capturou = True
            print("MAT-BADGE CAPTURADO às", s["horaSim"])
            # congela para screenshot
            post("/api/admin?acao=sim", {"cmd": "pause"})
            print("simulação PAUSADA com badge ativo — tirar screenshot agora")
            break
    if prog >= 0.9995 and not capturou:
        print("passou direto do 90→100 sem badge (janela estreita)")
        break
    time.sleep(1.2)

if not capturou:
    print("badge não capturado nesta passada")
