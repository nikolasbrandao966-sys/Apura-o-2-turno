// Logos REAIS dos partidos (oficiais, baixadas da Wikipédia/Wikimedia Commons em
// public/logos/, mapeadas em @/lib/apuracao/logos). Quando não há arquivo
// disponível, cai para um desenho estilo urna (sigla + número).

import Image from "next/image";
import { PARTIDOS } from "@/lib/apuracao/oficial";
import { LOGOS_PARTIDOS } from "@/lib/apuracao/logos";

export function corPartido(sg: string): string {
  return PARTIDOS[sg]?.cor ?? "#475569";
}

export function numeroPartido(sg: string): number {
  return PARTIDOS[sg]?.numero ?? 0;
}

/**
 * Logo oficial do partido.
 * - `width`: largura em px (altura derivada da proporção real do arquivo)
 * - `height`: se informado, tem precedência (útil para "chips" alinhados)
 * - fallback: caixa estilo urna com sigla + número
 */
export function PartidoLogo({
  sg,
  width,
  height,
  className,
  cor,
}: {
  sg: string;
  width?: number;
  height?: number;
  className?: string;
  cor?: string;
}) {
  const logo = LOGOS_PARTIDOS[sg];
  const c = cor ?? corPartido(sg);

  if (logo) {
    let w = width ?? 120;
    let h = Math.round((w * logo.h) / logo.w);
    if (height !== undefined) {
      h = height;
      w = Math.round((h * logo.w) / logo.h);
    }
    return (
      <Image
        src={logo.src}
        alt={`Logo oficial do partido ${sg}`}
        width={w}
        height={h}
        className={className}
        unoptimized
        style={{ objectFit: "contain" }}
      />
    );
  }

  // fallback: estilo urna (sigla + número)
  const num = numeroPartido(sg);
  const fs = sg.length > 8 ? 15 : sg.length > 5 ? 19 : 24;
  const boxW = width ?? 120;
  const boxH = height ?? Math.round((boxW * 72) / 120);
  return (
    <svg
      viewBox="0 0 120 72"
      width={boxW}
      height={boxH}
      className={className}
      aria-hidden="true"
      role="presentation"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="3" y="3" width="114" height="66" rx="9" fill="none" stroke={c} strokeWidth="4" />
      <text
        x="60"
        y={fs + 16}
        textAnchor="middle"
        fill={c}
        fontWeight="800"
        fontSize={fs}
        fontFamily="var(--font-geist-sans), sans-serif"
        letterSpacing="1"
      >
        {sg}
      </text>
      <text
        x="60"
        y="62"
        textAnchor="middle"
        fill={c}
        fontWeight="700"
        fontSize="16"
        fontFamily="var(--font-geist-sans), sans-serif"
      >
        {num}
      </text>
    </svg>
  );
}
