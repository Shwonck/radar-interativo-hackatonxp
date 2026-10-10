"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Info, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "./components/AuthShell";
import { signIn } from "@/lib/mock-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // A URL só é lida no navegador, evitando diferenças entre servidor e hidratação.
  const resetComplete = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("redefinida") === "1",
    () => false,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }
    setLoading(true);
    try {
      const success = await signIn(email, password, remember);
      if (!success) {
        setError("E-mail ou senha incorretos.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="BEM-VINDO DE VOLTA"
      title="Entre na sua plataforma de assessoria."
      description="Acesse uma visão mais completa dos seus clientes e encontre novas oportunidades de relacionamento."
    >
      {resetComplete && (
        <div className="auth-alert success" role="status">
          <CheckCircle2 size={18} /> Senha redefinida. Entre com a nova senha.
        </div>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">E-mail</label>
        <div className="auth-input">
          <Mail size={18} />
          <input
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="auth-label-row">
          <label htmlFor="password">Senha</label>
          <Link href="/esqueceu-sua-senha">Esqueceu a senha?</Link>
        </div>
        <div className="auth-input">
          <LockKeyhole size={18} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <label className="auth-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />{" "}
          Manter conectado por 7 dias
        </label>
        {error && (
          <div className="auth-alert error" role="alert">
            <Info size={18} /> {error}
          </div>
        )}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar na plataforma"}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthShell>
  );
}
