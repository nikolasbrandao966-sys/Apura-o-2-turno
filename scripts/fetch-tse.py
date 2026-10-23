#!/usr/bin/env python3
"""Extrai dados oficiais do TSE (eleições 2026) e baixa fotos oficiais.

Fontes (portal oficial de resultados, formato JWS):
  - Governador 1º turno (eleitos):  ele2026/6259/dados/{uf}/{uf}-c0003-e006259-u.jws
  - Governador 2º turno (cands):    ele2026/6260/dados/{uf}/{uf}-c0003-e006260-u.jws
  - Presidente 2º turno (cands):    ele2026/6258/dados/br/br-c0001-e006258-u.jws
  - Fotos:                          ele2026/{ele}/fotos/{uf}/{sqcand}.jpeg
"""
import base64, json, os, ssl, sys, time, urllib.request, concurrent.futures

BASE = "https://resultados.tse.jus.br/oficial/ele2026"
OUT = "/home/z/my-project/public/fotos"
SSL = ssl.create_default_context()

UFS = ["ac","al","ap","am","ba","ce","df","es","go","ma","mt","ms","mg","pa","pb","pr","pe","pi","rj","rn","rs","ro","rr","sc","sp","se","to"]
UFS_RUNOFF = ["ac","am","df","es","rn","to"]  # governador 2º turno (config TSE 6260)

def fetch(url, timeout=20, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=timeout, context=SSL) as r:
                return r.read()
        except Exception as e:
            if i == tries - 1:
                print(f"ERRO {url}: {e}", file=sys.stderr)
                return None
            time.sleep(0.6)

def decode_jws(raw):
    parts = raw.decode().strip().split(".")
    s = parts[1].replace("-", "+").replace("_", "/")
    return json.loads(base64.b64decode(s + "=" * (-len(s) % 4)))

def cands_of(d):
    """Lista candidatos de cargo 3 (ou todos) com partido."""
    out = []
    for carg in d.get("cand") or d.get("carg") or []:
        for agr in carg.get("agr", []):
            com = agr.get("com", "")
            for par in agr.get("par", []):
                sg = par.get("sg", "")
                for c in par.get("cand", []):
                    out.append({
                        "numero": c.get("n"), "sqcand": c.get("sqcand"),
                        "nome": c.get("nm"), "nomeUrna": c.get("nmu"),
                        "partido": sg, "coligacao": com,
                        "vap": int(c.get("vap", "0") or "0"),
                        "pvap": c.get("pvap"), "e": c.get("e"), "st": c.get("st"),
                        "foto": f"{OUT}/{c.get('sqcand')}.jpeg",
                    })
    return out

def baixar_foto(ele, uf, sqcand, nome_arquivo):
    """Baixa foto oficial e salva em public/fotos/."""
    dest = os.path.join(OUT, nome_arquivo)
    if os.path.exists(dest) and os.path.getsize(dest) > 500:
        return dest
    raw = fetch(f"{BASE}/{ele}/fotos/{uf}/{sqcand}.jpeg")
    if raw and len(raw) > 500:
        with open(dest, "wb") as f:
            f.write(raw)
        return dest
    print(f"foto falhou: {ele}/fotos/{uf}/{sqcand}", file=sys.stderr)
    return None

def main():
    os.makedirs(OUT, exist_ok=True)
    resultado = {"governadoresEleitos": [], "governadoresRunoff": [], "presidente": [], "ufsMeta": []}

    # 1) Governador 1º turno — eleitos em cada UF (exclui estados com 2º turno)
    def fetch_uf_1t(uf):
        raw = fetch(f"{BASE}/6259/dados/{uf}/{uf}-c0003-e006259-u.jws")
        if not raw: return uf, None
        d = decode_jws(raw)
        cands = cands_of(d)
        eleitos = [c for c in cands if c["e"] == "s" and c["numero"] not in ("95", "96")]
        secoes = d.get("s", {}).get("ts", "0")
        return uf, {"secoes": secoes, "cands": cands, "eleito": eleitos[0] if eleitos else None}

    cands_1t = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        for uf, data in ex.map(fetch_uf_1t, UFS):
            if not data: continue
            cands_1t[uf] = data
            if uf in UFS_RUNOFF:
                continue  # decidirá no 2º turno
            if data["eleito"]:
                c = data["eleito"]
                c["uf"] = uf.upper()
                resultado["governadoresEleitos"].append(c)
            else:
                print(f"ATENÇÃO: {uf} sem eleito no 1º turno e sem runoff!", file=sys.stderr)

    # 2) Governador 2º turno — candidatos das 6 disputas (+ % do 1º turno)
    for uf in UFS_RUNOFF:
        raw = fetch(f"{BASE}/6260/dados/{uf}/{uf}-c0003-e006260-u.jws")
        if not raw: continue
        d = decode_jws(raw)
        cands = cands_of(d)
        c1t = {c["sqcand"]: c for c in cands_1t.get(uf, {}).get("cands", [])}
        for c in cands:
            c["uf"] = uf.upper()
            c["vap1T"] = c1t.get(c["sqcand"], {}).get("vap", 0)
            c["pvap1T"] = c1t.get(c["sqcand"], {}).get("pvap", "0,00")
        cands.sort(key=lambda c: -(c["vap1T"] or 0))
        resultado["governadoresRunoff"].append({
            "uf": uf.upper(), "secoes": d.get("s", {}).get("ts", "0"), "candidatos": cands,
        })

    # 2b) Metadados por UF (presidente 2º turno 6258): aptos, seções — 27 UFs + Exterior (zz)
    def fetch_uf_meta(uf):
        raw = fetch(f"{BASE}/6258/dados/{uf}/{uf}-c0001-e006258-u.jws")
        if not raw: return uf, None
        d = decode_jws(raw)
        return uf, {"secoes": d.get("s", {}).get("ts", "0"), "aptos": d.get("e", {}).get("te", "0")}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        for uf, m in ex.map(fetch_uf_meta, UFS + ["zz"]):
            if m: resultado["ufsMeta"].append({"uf": uf.upper(), **m})

    # 3) Presidente 2º turno — candidatos (br)
    raw = fetch(f"{BASE}/6258/dados/br/br-c0001-e006258-u.jws")
    if raw:
        d = decode_jws(raw)
        for c in cands_of(d):
            resultado["presidente"].append(c)

    # 4) Baixar fotos (paralelo)
    jobs = []
    for c in resultado["presidente"]:
        jobs.append(("6258", "br", c["sqcand"], f"pres-{c['sqcand']}.jpeg"))
    for r in resultado["governadoresRunoff"]:
        for c in r["candidatos"]:
            jobs.append(("6260", r["uf"].lower(), c["sqcand"], f"gov-{c['sqcand']}.jpeg"))
    for c in resultado["governadoresEleitos"]:
        jobs.append(("6259", c["uf"].lower(), c["sqcand"], f"gov-{c['sqcand']}.jpeg"))

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        list(ex.map(lambda j: baixar_foto(*j), jobs))

    with open("/tmp/tse-governadores.json", "w") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=1)

    print(f"\nEleitos no 1º turno: {len(resultado['governadoresEleitos'])}")
    for c in resultado["governadoresEleitos"]:
        print(f"  {c['uf']}: {c['nomeUrna']} ({c['partido']}) {c['pvap']}% sq={c['sqcand']}")
    print(f"Runoffs: {len(resultado['governadoresRunoff'])}")
    for r in resultado["governadoresRunoff"]:
        print(f"  {r['uf']}:", ", ".join(f"{c['nomeUrna']} ({c['partido']}) sq={c['sqcand']}" for c in r["candidatos"]))
    print("Presidente:", ", ".join(f"{c['nomeUrna']} ({c['partido']}) sq={c['sqcand']}" for c in resultado["presidente"]))
    fotos = [f for f in os.listdir(OUT) if f.endswith(".jpeg")]
    print(f"Fotos baixadas: {len(fotos)}")

if __name__ == "__main__":
    main()
