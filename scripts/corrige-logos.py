#!/usr/bin/env python3
"""Corrige as 3 logos que falharam: PL, REPUBLICANOS e MDB.

PL  -> File:Partido Liberal (Brazil) logo.svg   (logo atual, Manual da Marca 2023)
MDB -> File:Movimento Democrático Brasileiro (2017).svg (logo atual MDB)
REP -> via Wikidata: item do partido -> propriedade P154 (logo) -> Commons
"""
import json
import os
import struct
import time
import urllib.request
import urllib.parse

UA = "Mozilla/5.0 (compatible; ProjetoApuracao2026/1.0; +contato@exemplo.org)"
DEST_DIR = "/home/z/my-project/public/logos"
DEST_TS = "/home/z/my-project/src/lib/apuracao/logos.ts"


def http(url: str, method="GET", binary=False, timeout=45):
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read() if binary else (r.url, r.read().decode("utf-8"))


def resolve_file_url(filename: str) -> str | None:
    """Special:Redirect/file/Nome.svg -> URL final no upload.wikimedia.org."""
    url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(filename.replace(" ", "_"))
    try:
        final, _ = http(url, method="HEAD")
        if "upload.wikimedia.org" in final:
            return final.split("?")[0]
    except Exception as e:
        print(f"    ! redirect falhou para {filename}: {e}")
    return None


def png_dims(data):
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", data[16:24])


def thumb_size(url: str, size: int) -> str:
    import re
    m = re.match(r"^(https://upload\.wikimedia\.org/wikipedia/[a-z]+)/([0-9a-f])/([0-9a-f]{2})/(.+?)(?:\.svg|\.png|\.jpg)$", url)
    if not m:
        return None
    base, h1, h2, fname = m.groups()
    ext = url.lower().rsplit(".", 1)[-1]
    if ext == "svg":
        return f"{base}/thumb/{h1}/{h2}/{fname}.svg/{size}px-{fname}.svg.png"
    if ext == "png":
        return f"{base}/thumb/{h1}/{h2}/{fname}.png/{size}px-{fname}.png"
    return f"{base}/thumb/{h1}/{h2}/{fname}.jpg/{size}px-{fname}.jpg"


TAMANHOS = [500, 960, 250, 1280, 330, 240, 200]


def baixar(sigla: str, filename: str) -> dict | None:
    print(f"== {sigla}: {filename}")
    final = resolve_file_url(filename)
    if not final:
        return None
    for size in TAMANHOS:
        url = thumb_size(final, size)
        if not url:
            return None
        try:
            data = http(url, binary=True)
            dims = png_dims(data)
            if dims is None:
                print(f"   ! {size}px não é PNG")
                continue
            w, h = dims
            path = os.path.join(DEST_DIR, f"{sigla.lower().replace('ã', 'a').replace('ç', 'c')}.png")
            with open(path, "wb") as f:
                f.write(data)
            print(f"   OK {w}x{h} {len(data) / 1024:.0f} KB ({size}px) -> {path}")
            return {"src": f"/logos/{os.path.basename(path)}", "w": w, "h": h, "origem": f"commons:{filename}"}
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            print(f"   ! {size}px HTTP {e.code}")
            if e.code == 403:
                print("   rate limit — aguardando 20s")
                time.sleep(20)
    print("   ! todos os tamanhos falharam")
    return None


def logo_republicanos_via_wikidata() -> dict | None:
    print("== REPUBLICANOS via artigo pt.wikipedia")
    # lista as imagens do artigo e procura algo com "logo"/"republicanos"
    try:
        api = ("https://pt.wikipedia.org/w/api.php?action=parse&format=json"
               "&page=Republicanos&prop=images&redirects=1")
        _, body = http(api)
        imgs = json.loads(body)["parse"]["images"]
        print("   imagens do artigo (candidatos):")
        for i in imgs:
            print("     -", i)
    except Exception as e:
        print(f"   ! erro ao listar imagens: {e}")
        return None
    preferidas = [i for i in imgs if ("logo" in i.lower() or "logotipo" in i.lower()) and "republicanos" in i.lower()]
    secundarias = [i for i in imgs if "logo" in i.lower() or "logotipo" in i.lower()]
    terciarias = [i for i in imgs if "republicanos" in i.lower() and i.lower().endswith((".svg", ".png"))]
    for cand in (preferidas + secundarias + terciarias):
        if not cand.lower().endswith((".svg", ".png")):
            continue
        print("   tentando:", cand)
        r = baixar("REPUBLICANOS", cand)
        if r:
            return r
    return None


novos = {}
time.sleep(2)
novos["PL"] = baixar("PL", "Partido Liberal (Brazil) logo.svg")
time.sleep(2)
novos["MDB"] = baixar("MDB", "Movimento Democrático Brasileiro (2017).svg")
time.sleep(2)
if not novos.get("REPUBLICANOS"):
    novos["REPUBLICANOS"] = logo_republicanos_via_wikidata()

falhas = [k for k, v in novos.items() if not v]
print()
print("falhas:", falhas or "nenhuma")

# ---- regenera logos.ts com o manifest completo ----
with open("/tmp/logos-manifest.json") as f:
    manifest = json.load(f)
for k, v in novos.items():
    if v:
        manifest[k] = v

linhas = [
    "// Logos OFICIAIS dos partidos — baixadas da Wikipédia/Wikimedia Commons",
    "// por scripts/baixa-logos.py + scripts/corrige-logos.py (23/10/2026). Não editar à mão.",
    "",
    "export interface LogoPartido { src: string; w: number; h: number }",
    "",
    "export const LOGOS_PARTIDOS: Record<string, LogoPartido> = {",
]
for sigla, info in manifest.items():
    linhas.append(f'  "{sigla}": {{ src: "{info["src"]}", w: {info["w"]}, h: {info["h"]} }},')
linhas += [
    "};",
    "",
    "export function logoPartido(sg: string): LogoPartido | undefined {",
    "  return LOGOS_PARTIDOS[sg];",
    "}",
    "",
]
with open(DEST_TS, "w") as f:
    f.write("\n".join(linhas))
with open("/tmp/logos-manifest.json", "w") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"logos.ts com {len(manifest)} partidos ->", DEST_TS)
