"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Info, LockKeyhole } from "lucide-react";
import { AuthShell } from "../../components/AuthShell";
import { isResetTokenValid, resetPassword } from "@/lib/mock-auth";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [invalidated, setInvalidated] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // O token é salvo no navegador; a validação precisa esperar a hidratação.
  const tokenValid = useSyncExternalStore(
    () => () => {},
    () => isResetTokenValid(token),
    () => null,
  );
  const valid = invalidated ? false : tokenValid;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError("Use pelo menos 8 caracteres, com letra maiúscula, minúscula e número.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const success = await resetPassword(token, password);
    if (!success) {
      setInvalidated(true);
      setError("Este link expirou. Crie um novo link de recuperação.");
      setLoading(false);
      return;
    }
    router.replace("/?redefinida=1");
  }

  return (
    <AuthShell
      eyebrow="SEGURANÇA DA CONTA"
      title={valid === false ? "Link expirado ou inválido." : "Crie uma nova senha."}
      description={
        valid === false
          ? "Solicite outro link para redefinir sua senha."
          : "Escolha uma senha forte para voltar à sua área de assessoria."
      }
    >
      {valid === null ? (
        <p className="auth-loading">Validando link...</p>
      ) : valid === false ? (
        <div className="auth-result">
          <div className="auth-alert error">
            <Info size={18} /> Este link não está mais disponível.
          </div>
          <Link className="auth-submit" href="/esqueceu-sua-senha">
            Criar novo link <ArrowRight size={18} />
          </Link>
          <Link className="auth-back" href="/">
            <ArrowLeft size={16} /> Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">Nova senha</label>
            <div className="auth-input">
              <LockKeyhole size={18} />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a nova senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="auth-hint">Mínimo de 8 caracteres, com maiúscula, minúscula e número.</p>
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <div className="auth-input">
              <LockKeyhole size={18} />
              <input
                id="confirm-password"
                type={showConfirmation ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowConfirmation(!showConfirmation)}
                aria-label={showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"}
              >
                {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <div className="auth-alert error" role="alert">
                <Info size={18} /> {error}
              </div>
            )}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Redefinir senha"} <ArrowRight size={18} />
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
