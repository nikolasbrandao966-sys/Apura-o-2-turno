#!/usr/bin/env python3
"""Gera src/lib/brazil-map.ts com paths SVG de cada estado (projeção Mercator manual)."""
import json
import math

SRC = "/home/z/my-project/scripts/brazil-states.geojson"
DST = "/home/z/my-project/src/lib/brazil-map.ts"

with open(SRC) as f:
    gj = json.load(f)

# --- Projeção Mercator (lon em graus, lat em graus) ---
LON0 = -52.0  # centraliza o Brasil

def project(lon, lat):
    x = math.radians(lon - LON0)
    phi = math.radians(lat)
    y = math.log(math.tan(math.pi / 4 + phi / 2))
    return x, y

pts = []
shapes = {}  # uf -> list of polygons (list of rings (list of (x,y)))
props = {}
for feat in gj["features"]:
    uf = feat["properties"]["sigla"]
    props[uf] = feat["properties"]
    geom = feat["geometry"]
    polys = []
    if geom["type"] == "Polygon":
        polys = [geom["coordinates"]]
    elif geom["type"] == "MultiPolygon":
        polys = geom["coordinates"]
    shapes[uf] = polys
    for poly in polys:
        for ring in poly:
            for lon, lat in ring:
                pts.append(project(lon, lat))

xs = [p[0] for p in pts]
ys = [p[1] for p in pts]
minx, maxx = min(xs), max(xs)
miny, maxy = min(ys), max(ys)

W = 760.0
H = W * (maxy - miny) / (maxx - minx)
PAD = 6.0
SCALE = (W - 2 * PAD) / (maxx - minx)

def to_screen(x, y):
    sx = PAD + (x - minx) * SCALE
    sy = H - PAD - (y - miny) * SCALE  # inverte Y (SVG cresce para baixo)
    return sx, sy

def fmt(v):
    return f"{v:.0f}"

MIN_DIST = 1.8  # distância mínima (px) entre pontos consecutivos

def decimate(screen):
    """Remove pontos próximos para reduzir o tamanho do path."""
    if len(screen) <= 3:
        return screen
    out_pts = [screen[0]]
    for p in screen[1:-1]:
        dx = p[0] - out_pts[-1][0]
        dy = p[1] - out_pts[-1][1]
        if (dx * dx + dy * dy) >= MIN_DIST * MIN_DIST:
            out_pts.append(p)
    out_pts.append(screen[-1])
    # remove pontos duplicados consecutivos
    final = [out_pts[0]]
    for p in out_pts[1:]:
        if p != final[-1]:
            final.append(p)
    if len(final) < 3:
        return screen
    return final

out = {}   # uf -> {"d": path, "cx":, "cy":, "bbox": [w,h]}
for uf, polys in shapes.items():
    parts = []
    all_screen = []
    for poly in polys:
        for ring in poly:
            screen_raw = [to_screen(*project(lon, lat)) for lon, lat in ring]
            screen = decimate(screen_raw)
            all_screen.extend(screen)
            d = "M" + "L".join(f"{fmt(x)},{fmt(y)}" for x, y in screen) + "Z"
            parts.append(d)
    # centroid do anel externo do maior polígono (área aproximada)
    areas = []
    cents = []
    for poly in polys:
        ring = poly[0]
        screen = [to_screen(*project(lon, lat)) for lon, lat in ring]
        a = 0.0
        cx = cy = 0.0
        for i in range(len(screen) - 1):
            x0, y0 = screen[i]
            x1, y1 = screen[i + 1]
            cross = x0 * y1 - x1 * y0
            a += cross
            cx += (x0 + x1) * cross
            cy += (y0 + y1) * cross
        a *= 0.5
        if abs(a) > 1e-6:
            cents.append((cx / (6 * a), cy / (6 * a)))
        else:
            cents.append(screen[0])
        areas.append(abs(a))
    k = areas.index(max(areas))
    cx, cy = cents[k]
    xs_s = [p[0] for p in all_screen]
    ys_s = [p[1] for p in all_screen]
    out[uf] = {
        "d": "".join(parts),
        "cx": round(cx, 1),
        "cy": round(cy, 1),
        "w": round(max(xs_s) - min(xs_s), 1),
        "h": round(max(ys_s) - min(ys_s), 1),
    }

NAME = {p["sigla"]: p["name"] for p in props.values()}
NAME["DF"] = "Distrito Federal"
REG = {
    "AC": "Norte", "AP": "Norte", "AM": "Norte", "PA": "Norte", "RO": "Norte",
    "RR": "Norte", "TO": "Norte",
    "AL": "Nordeste", "BA": "Nordeste", "CE": "Nordeste", "MA": "Nordeste",
    "PB": "Nordeste", "PE": "Nordeste", "PI": "Nordeste", "RN": "Nordeste", "SE": "Nordeste",
    "DF": "Centro-Oeste", "GO": "Centro-Oeste", "MT": "Centro-Oeste", "MS": "Centro-Oeste",
    "ES": "Sudeste", "MG": "Sudeste", "RJ": "Sudeste", "SP": "Sudeste",
    "PR": "Sul", "RS": "Sul", "SC": "Sul",
}

# Ajustes manuais de posição de rótulo para estados pequenos
LABEL_OFFSET = {"DF": (36, 16), "SE": (0, -10), "AL": (-16, 12), "RJ": (14, 18)}

lines = []
lines.append("// Auto-gerado por scripts/gen-map.py — mapa do Brasil (27 UFs)")
lines.append("export interface EstadoMapa {")
lines.append("  uf: string;")
lines.append("  nome: string;")
lines.append("  regiao: string;")
lines.append("  d: string;")
lines.append("  cx: number;")
lines.append("  cy: number;")
lines.append("  w: number;")
lines.append("  h: number;")
lines.append("  lx: number; // rótulo x")
lines.append("  ly: number; // rótulo y")
lines.append("}")
lines.append("")
lines.append(f"export const MAPA_VIEWBOX = `0 0 {round(W)} {round(H)}`;")
lines.append(f"export const MAPA_WIDTH = {round(W)};")
lines.append(f"export const MAPA_HEIGHT = {round(H)};")
lines.append("")
lines.append("export const BRASIL_MAPA: EstadoMapa[] = [")
order = sorted(out.keys())
for uf in order:
    o = out[uf]
    lx, ly = LABEL_OFFSET.get(uf, (0, 0))
    nome = NAME[uf]
    lines.append(
        f'  {{ uf: "{uf}", nome: "{nome}", regiao: "{REG[uf]}", d: "{o["d"]}", '
        f'cx: {o["cx"]}, cy: {o["cy"]}, w: {o["w"]}, h: {o["h"]}, '
        f'lx: {o["cx"] + lx}, ly: {o["cy"] + ly} }},'
    )
lines.append("];")

with open(DST, "w") as f:
    f.write("\n".join(lines) + "\n")

print("Gerado:", DST)
print("ViewBox:", round(W), "x", round(H))
for uf in order:
    o = out[uf]
    print(f"{uf}: bbox {o['w']}x{o['h']} @ ({o['cx']:.0f},{o['cy']:.0f})")
