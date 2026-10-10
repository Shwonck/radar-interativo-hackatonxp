"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Mail } from "lucide-react";
import { AuthShell } from "../components/AuthShell";
import { createResetRequest } from "@/lib/mock-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = createResetRequest(email);
    if (!nextToken) {
      setError("Não encontramos uma conta com esse e-mail.");
      return;
    }
    setError("");
    setToken(nextToken);
  }

  return (
    <AuthShell
      eyebrow="RECUPERAR ACESSO"
      title={token ? "Link de recuperação preparado." : "Esqueceu sua senha?"}
      description={
        token
          ? "Use o link abaixo para redefinir sua senha."
          : "Informe o e-mail da sua conta para criar um link temporário de redefinição."
      }
    >
      {token ? (
        <div className="auth-result">
          <span className="auth-result-icon">
            <CheckCircle2 size={27} />
          </span>
          <strong>Solicitação criada</strong>
          <p>O link é válido por 15 minutos e pode ser usado uma vez neste navegador.</p>
          <Link className="auth-submit" href={`/recuperar-senha/${token}`}>
            Redefinir senha <ArrowRight size={18} />
          </Link>
          <Link className="auth-back" href="/">
            <ArrowLeft size={16} /> Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="recovery-email">E-mail do assessor</label>
            <div className="auth-input">
              <Mail size={18} />
              <input
                id="recovery-email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {error && (
              <div className="auth-alert error" role="alert">
                <Info size={18} /> {error}
              </div>
            )}
            <button className="auth-submit" type="submit">
              Criar link de recuperação <ArrowRight size={18} />
            </button>
          </form>
          <Link className="auth-back" href="/">
            <ArrowLeft size={16} /> Voltar ao login
          </Link>
        </>
      )}
    </AuthShell>
  );
}
