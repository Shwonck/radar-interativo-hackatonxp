import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-column">
          <Link href="/" className="auth-brand" aria-label="XP Open Finance, voltar ao início">
            <span>
              <Image src="/xp-logo.svg" alt="XP Investimentos" width={36} height={36} priority />
            </span>
            <span>
              <strong>XP</strong>
              <small>OPEN FINANCE</small>
            </span>
          </Link>

          <div className="auth-content">
            <div className="auth-eyebrow">
              <span /> {eyebrow}
            </div>
            <h1>{title}</h1>
            <p className="auth-description">{description}</p>
            {children}
          </div>

          <footer className="auth-footer">
            <span>Hackathon XP · 2026</span>
          </footer>
        </div>
      </main>

      <aside className="auth-showcase" aria-label="Apresentação da plataforma">
        <div className="showcase-glow" />
        <div className="showcase-top">
          <span className="showcase-badge">
            <span>XP / 2026</span>
          </span>
        </div>
        <div className="showcase-content">
          <div className="showcase-line" />
          <h2>
            Conheça cada cliente <em>por inteiro.</em>
          </h2>
          <p>
            Uma visão consolidada para transformar dados em conversas mais relevantes, estratégias
            mais claras e uma assessoria mais próxima.
          </p>
          <div className="showcase-card">
            <div className="showcase-card-top">
              <span>VISÃO CONSOLIDADA</span>
              <ArrowUpRight size={17} />
            </div>
            <div className="showcase-card-value">
              <span className="showcase-card-icon">
                <ShieldCheck size={19} />
              </span>
              <strong>
                Mais contexto.
                <br />
                Melhores decisões.
              </strong>
            </div>
            <div className="showcase-card-bottom">
              <span>
                <i /> Visão integrada
              </span>
              <span>Open Finance</span>
            </div>
          </div>
        </div>
        <div className="showcase-bottom">
          <span>INTELIGÊNCIA PARA ASSESSORIA</span>
          <span>01 — 03</span>
        </div>
      </aside>
    </div>
  );
}
