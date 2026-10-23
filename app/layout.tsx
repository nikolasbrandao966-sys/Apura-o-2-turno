import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apuração 2º Turno — Eleições 2026 | Dados oficiais do TSE",
  description:
    "Acompanhe em tempo real a apuração do 2º turno das Eleições 2026 entre Lula (PT) e Flávio Bolsonaro (PL): placar nacional, tendências minuto a minuto, todos os estados, Exterior, municípios e as 6 disputas de governador — com dados e fotos oficiais do TSE.",
  keywords: [
    "eleições 2026",
    "segundo turno",
    "apuração",
    "resultado eleição 2026",
    "Lula",
    "Flávio Bolsonaro",
    "TSE",
    "presidente 2026",
    "governadores 2026",
  ],
  authors: [{ name: "Apuração 2026" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Apuração 2º Turno — Eleições 2026",
    description:
      "Placar em tempo real com dados oficiais do TSE: Lula x Flávio Bolsonaro, estados, Exterior, municípios e governadores.",
    siteName: "Apuração 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
