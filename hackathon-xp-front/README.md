# XP Open Finance — plataforma do assessor (front-end)

Front-end Next.js (App Router) do Radar Interativo. A interface reúne visão geral da carteira, lista de clientes, acompanhamento de consentimentos e oportunidades de conversa para apoiar uma assessoria mais personalizada.

Nome do pacote: `xp-open-finance-front`. Stack: Next.js 16, React 19, TypeScript, `lucide-react` e `motion`. O backend .NET correspondente fica no diretório raiz do repositório ([`../`](../README.md)); este front funciona com ou sem ele.

## Executar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Scripts disponíveis (`package.json`):

- `npm run dev` — servidor de desenvolvimento (`next dev`).
- `npm run build` / `npm start` — build e execução de produção.
- `npm test` — testes com `tsx --test tests/*.test.ts`.
- `npm run lint` — ESLint.
- `npm run format` / `npm run format:check` — Prettier (escreve / apenas verifica) em `app/**`, `lib/**`, `proxy.ts` e `next.config.ts`.

Atualmente há um arquivo de teste: `tests/mock-analyses.test.ts`, que valida a simulação local de posições, FGC, score e alertas.

## Rotas

Área pública (`app/(public)`):

- `/` — tela de login.
- `/esqueceu-sua-senha` — solicitação de recuperação de acesso.
- `/recuperar-senha/[token]` — redefinição de senha.

Área autenticada (`app/(authenticated)`), com layout compartilhado:

- `/dashboard`
- `/clientes`
- `/clientes/[id]`
- `/conexoes`
- `/oportunidades`

A estrutura visual compartilhada fica em `app/(authenticated)/components` e `app/(public)/components`.

## Acesso local (autenticação mockada)

- **E-mail:** `assessor@xp-demo.com`
- **Senha inicial:** `XPdemo@2026`

As credenciais e a lógica de sessão ficam em `lib/mock-auth.ts`. O fluxo inclui login, opção de manter a sessão por sete dias (cookie com `Max-Age`), logout, recuperação de acesso e redefinição de senha. Na tela "Esqueceu sua senha?", informe o e-mail acima: o link temporário (válido por 15 minutos) é exibido na própria interface, sem envio de e-mail. A nova senha fica salva apenas no `localStorage` deste navegador (hash SHA-256).

> Essa autenticação é **mockada** e roda no navegador, sem backend nem verificação de identidade real. Não a use para proteger dados verdadeiros.

## O que está disponível

- Painel responsivo com indicadores e evolução ilustrativa de patrimônio.
- Busca e filtro de clientes, detalhes pessoais e financeiros, alocação e status do consentimento.
- Visão de conexões Open Finance e oportunidades de acompanhamento.
- Perfil individual de cliente com cadastro, posições e abas (Visão geral, Proteção FGC, Risco de crédito, Vencimentos e alertas).
- Temas claro e escuro, sidebar recolhível/expansível e opção de animar ou manter estáticos os ícones. As preferências ficam salvas neste navegador.
- Exportação CSV dos clientes filtrados.
- Fluxo demonstrativo de convite de cliente.

## Dados e integração com o backend

O cliente de API server-only fica em `lib/api.ts` e decide a fonte dos dados pela variável `NEXT_PUBLIC_API_URL`:

- **Sem `NEXT_PUBLIC_API_URL`:** o front devolve dados fictícios locais com `isMock: true` (ex.: `getPortfolioSummary`, `getClientLoans`). Mocks em `lib/mock-data.ts` e `lib/mock-positions.ts`.
- **Com `NEXT_PUBLIC_API_URL`:** o front consulta o backend .NET. Para autenticar, usa as variáveis **server-only** `BACKEND_API_EMAIL` e `BACKEND_API_PASSWORD` para obter um JWT via `POST /api/auth/login`, mantém o token em cache apenas no processo do servidor e chama endpoints como `GET /api/advisors/me/portfolio-summary` e `GET /api/clients/{id}/open-finance`. Em qualquer falha, há **fallback automático para os mocks**.

Configuração: copie `.env.local.example` para `.env.local` e preencha conforme o cenário.

```env
NEXT_PUBLIC_API_URL=http://localhost:5018
BACKEND_API_EMAIL=<email-do-assessor>
BACKEND_API_PASSWORD=<senha-do-assessor>
```

> As credenciais `BACKEND_API_*` nunca são expostas ao navegador. O backend não semeia um assessor automaticamente — veja o README raiz para criar um antes de usar essas variáveis.

### Análises de FGC e crédito

A rota de API interna `GET /api/clientes/{id}/analises` (`app/api/clientes/[id]/analises/route.ts`) calcula uma **simulação local** a partir das posições fictícias de `lib/mock-positions.ts`, com a lógica em `lib/mock-analyses.ts`. Os painéis React apenas apresentam a resposta.

Cada posição tem produto, valor, emissor (quando conhecido) e data de vencimento (quando aplicável). A simulação de FGC considera apenas CDB/LCI/LCA com saldo elegível e conglomerado informados na fixture, agrupa por cliente e conglomerado e estima o limite ordinário. Ela **não confirma** titularidade, juros reconhecidos, elegibilidade definitiva nem limite global. O score é interno (versão `sim-v1`), com fatores manuais fictícios; não é rating oficial nem probabilidade de inadimplência.

O limiar de alerta de concentração pode ser configurado por `SIMULATION_CONCENTRATION_THRESHOLD` (fração entre 0 e 1; padrão `0.15`). As posições fictícias têm data-base `2026-10-10`; os dias até o vencimento e os alertas de prazo são recalculados na data atual de São Paulo. Os testes injetam uma data explícita para serem reproduzíveis.

Para apontar essa rota a uma API própria, configure `ANALYSIS_API_BASE_URL`: a rota passa a consultar `GET {ANALYSIS_API_BASE_URL}/clientes/{id}/analises`, sem recorrer aos exemplos locais em caso de erro. A resposta deve seguir os tipos de `lib/analysis-contract.ts` (`fgcAnalysis`, `creditAssessment`, `alerts`, `maturities`). Valores inválidos são rejeitados e a interface informa indisponibilidade.

A rota `GET /api/clientes/{id}/loans` (`app/api/clientes/[id]/loans/route.ts`) e `GET /api/portfolio-summary` (`app/api/portfolio-summary/route.ts`) complementam esse fluxo.

Todos os nomes, e-mails, valores e insights exibidos são **fictícios**. A ação de convite não envia e-mail e a solicitação de atualização de consentimento não chama serviços externos.

## Identidade visual

O protótipo usa a marca XP e uma paleta de preto, branco e amarelo. O arquivo [`public/xp-logo.svg`](public/xp-logo.svg) reproduz o logotipo publicado pela XP em seu CDN, disponível também no [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logotipo_da_XP_Investimentos.svg).

Projeto de demonstração criado para o Hackathon XP; não é um produto oficial da XP.
