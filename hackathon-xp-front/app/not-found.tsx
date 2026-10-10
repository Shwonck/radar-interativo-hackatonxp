import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="not-found">
      <Image src="/xp-logo.svg" alt="XP Investimentos" width={64} height={64} />
      <span>ERRO 404</span>
      <h1>Página não encontrada</h1>
      <p>O endereço que você acessou não está disponível.</p>
      <Link href="/">Voltar ao painel</Link>
    </main>
  );
}
