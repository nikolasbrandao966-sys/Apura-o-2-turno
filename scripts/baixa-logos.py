#!/usr/bin/env python3
"""Baixa as logos REAIS dos partidos (fonte: Wikipédia/Wikimedia Commons).

Estratégia:
 1) pt.wikipedia REST summary API -> imagem principal da página do partido (é a logo oficial)
 2) Se SVG -> baixa thumbnail PNG 512px (renderização própria do Wikimedia)
 3) Valida magic bytes PNG e extrai dimensões do IHDR
 4) Gera src/lib/apuracao/logos.ts com o mapeamento sigla -> arquivo

Salva em public/logos/{sigla}.png
"""
import json
import os
import re
import struct
import urllib.request
import urllib.parse

DEST_DIR = "/home/z/my-project/public/logos"
DEST_TS = "/home/z/my-project/src/lib/apuracao/logos.ts"
UA = "Mozilla/5.0 (compatible; ProjetoApuracao2026/1.0; contato@exemplo.org)"

# sigla -> candidatos de páginas na pt.wikipedia (na ordem de preferência)
PARTIDOS = [
    ("PT", ["Partido dos Trabalhadores"]),
    ("PL", ["Partido Liberal (Brasil)", "Partido Liberal (2020)", "Partido Liberal"]),
    ("PP", ["Partido Progressista (Brasil)", "Partido Progressista"]),
    ("REPUBLICANOS", ["Republicanos"]),
    ("PSD", ["Partido Social Democrático (Brasil, 2011)", "Partido Social Democrático (2011)", "Partido Social Democrático (Brasil)"]),
    ("PSDB", ["Partido da Social Democracia Brasileira"]),
    ("MDB", ["Movimento Democrático Brasileiro", "Movimento Democrático Brasil"]),
    ("UNIÃO", ["União Brasil"]),
    ("PODE", ["Podemos (Brasil)"]),
    ("PSB", ["Partido Socialista Brasileiro"]),
]


def http_get(url: str, binary: bool = False, timeout: int = 45):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")


def thumb_png(url: str, size: int = 512) -> str:
    """Converte URL de arquivo do Wikimedia em thumbnail PNG de N px."""
    # https://upload.wikimedia.org/wikipedia/commons/<h>/hh/Foo.svg
    m = re.match(r"^(https://upload\.wikimedia\.org/wikipedia/[a-z]+)/(?:(\w+)/)?([0-9a-f])/([0-9a-f]{2})/(.+)$", url)
    if not m:
        return url
    base, _, h1, h2, fname = m.groups()
    lower = fname.lower()
    if lower.endswith((".svg", ".svg.png")):
        name = fname[:-4] if lower.endswith(".svg.png") else fname[:-4]
        name = fname[:-4] if lower.endswith(".svg") else name
        return f"{base}/thumb/{h1}/{h2}/{fname}/{size}px-{name}.svg.png"
    if lower.endswith(".png"):
        return f"{base}/thumb/{h1}/{h2}/{fname}/{size}px-{fname}.png"
    if lower.endswith((".jpg", ".jpeg")):
        return f"{base}/thumb/{h1}/{h2}/{fname}/{size}px-{fname}.jpg"
    return url


def png_dimensions(data: bytes):
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def fetch_summary(title: str):
    url = "https://pt.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"))
    try:
        return json.loads(http_get(url))
    except Exception as e:
        print(f"    ! summary falhou para '{title}': {e}")
        return None


def commons_search(query: str):
    """Busca arquivos no Commons e devolve URL do melhor resultado svg/png."""
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&format=json"
        "&list=search&srnamespace=6&srlimit=10&srsearch=" + urllib.parse.quote(query)
    )
    try:
        data = json.loads(http_get(api))
    except Exception as e:
        print(f"    ! busca no Commons falhou: {e}")
        return None
    for hit in data.get("query", {}).get("search", []):
        title = hit["title"]
        if not title.lower().endswith((".svg", ".png")):
            continue
        # título -> URL via Special:Redirect/file
        url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(title.replace("File:", "").replace(" ", "_"))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA}, method="HEAD")
            with urllib.request.urlopen(req, timeout=30) as r:
                final = r.url
            if "upload.wikimedia.org" in final:
                return final
        except Exception:
            continue
    return None


os.makedirs(DEST_DIR, exist_ok=True)
manifest = {}
erros = []

for sigla, titulos in PARTIDOS:
    print(f"== {sigla}")
    src = None
    origem = None
    for t in titulos:
        s = fetch_summary(t)
        if not s:
            continue
        img = s.get("originalimage") or s.get("thumbnail")
        if img and img.get("source"):
            src = img["source"]
            origem = f"wikipedia:{t}"
            break
    if not src or "logo" not in (s.get("description") or "").lower() and False:
        pass
    if not src:
        # fallback: busca direta no Commons
        nome_busca = {
            "PT": "Partido dos Trabalhadores logo",
            "PL": "Partido Liberal Brasil logo",
            "PP": "Partido Progressista logo",
            "REPUBLICANOS": "Republicanos partido logo",
            "PSD": "Partido Social Democrático 2011 logo",
            "PSDB": "PSDB logo",
            "MDB": "Movimento Democrático Brasileiro logo",
            "UNIÃO": "União Brasil logo",
            "PODE": "Podemos partido logo",
            "PSB": "Partido Socialista Brasileiro logo",
        }.get(sigla, f"{sigla} logo partido")
        print(f"    (fallback Commons: {nome_busca})")
        src = commons_search(nome_busca)
        origem = "commons"
    if not src:
        erros.append(sigla)
        print("    SEM LOGO — registrar erro")
        continue

    url_png = thumb_png(src)
    print(f"    baixando {url_png}")
    try:
        data = http_get(url_png, binary=True)
    except Exception as e:
        print(f"    ! falha no download: {e}")
        erros.append(sigla)
        continue
    dims = png_dimensions(data)
    if dims is None and url_png != src:
        # tenta a original (pode já ser PNG)
        try:
            data = http_get(src, binary=True)
            dims = png_dimensions(data)
        except Exception:
            pass
    if dims is None:
        print(f"    ! arquivo não é PNG válido ({origem}) — {sigla}")
        erros.append(sigla)
        continue
    w, h = dims
    path = os.path.join(DEST_DIR, f"{sigla.lower().replace('ã', 'a').replace('ç', 'c')}.png")
    with open(path, "wb") as f:
        f.write(data)
    kb = len(data) / 1024
    print(f"    OK {w}x{h} {kb:.0f} KB -> {path} ({origem})")
    manifest[sigla] = {"src": f"/logos/{os.path.basename(path)}", "w": w, "h": h, "origem": origem}

# ---- grava logos.ts ----
linhas = [
    "// Logos OFICIAIS dos partidos — baixadas da Wikipédia/Wikimedia Commons",
    "// por scripts/baixa-logos.py (23/10/2026). Não editar à mão.",
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

print()
print(f"Concluído: {len(manifest)}/10 logos  |  erros: {erros or 'nenhum'}")
print("logos.ts gerado:", DEST_TS)
with open("/tmp/logos-manifest.json", "w") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
