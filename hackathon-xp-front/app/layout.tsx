import type { Metadata } from "next";

import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XP Open Finance | Plataforma do Assessor",
  description:
    "Plataforma para assessores analisarem clientes e oportunidades com uma visão consolidada de Open Finance.",
  icons: { icon: "/xp-logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
