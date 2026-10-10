# Radar Interativo — hackatonxp (backend)

Plataforma 360° para o assessor acompanhar seus clientes: visão consolidada de carteira, interações, tarefas, datas importantes e dados de Open Finance (via Pluggy). Este diretório é o **backend**, uma API ASP.NET Core (.NET 10). O front-end Next.js fica em [`hackathon-xp-front/`](hackathon-xp-front/) e tem seu próprio README.

## Arquitetura

```
Domain/          Entidades de negócio (Advisor, Client, PortfolioPosition, Interaction, TaskItem, ImportantDate)
Application/     DTOs, interfaces e serviços de caso de uso
Infrastructure/  EF Core, DbContext, repositórios, seed e adaptadores (Pluggy, JWT, hashing)
Api/Controllers/ Controllers HTTP
Migrations/      Migrations do EF Core (geradas para PostgreSQL)
Tests/           Testes (ver observação abaixo sobre a estrutura de testes)
hackathon-xp-front/  Front-end Next.js (App Router) — README próprio
```

Arquivos de projeto na raiz: `hackatonxp.csproj`, `hackatonxp.slnx`, `Program.cs`, `appsettings.json`, `appsettings.Development.json`, `docker-compose.yml`, `hackatonxp.http`.

> `WeatherForecast.cs` na raiz é um resquício do template padrão do `dotnet` e não é exposto por nenhum controller.

## Pré-requisitos

- .NET 10 SDK (o projeto tem como alvo `net10.0`; os pacotes EF Core e JwtBearer referenciados são 8.0.0)
- Node.js 20+ (apenas para o front-end)
- Docker (opcional — apenas se quiser usar PostgreSQL)

---

## Subindo o backend localmente

> **Atenção:** a aplicação **não** sobe sem configuração. Na inicialização, `Program.cs` exige:
> 1. **Banco de dados:** uma connection string PostgreSQL (`ConnectionStrings:Postgres`) **ou** a variável `HACKATONXP_ALLOW_INMEMORY=true`. Sem nenhum dos dois, a aplicação lança `InvalidOperationException` e não inicia.
> 2. **Segredo JWT:** `Jwt:Secret` (configuração) ou a variável de ambiente `JWT_SECRET`. Sem isso, a aplicação lança `InvalidOperationException`. **Nenhum segredo JWT está versionado** em `appsettings.json` nem em `appsettings.Development.json`.

Observação importante sobre o padrão: `appsettings.Development.json` **já define** uma connection string PostgreSQL apontando para `localhost:5433`. Por isso, ao rodar em Development sem alterar nada, a aplicação tentará usar **PostgreSQL** (não o banco em memória). Para forçar banco em memória, remova/ignore essa connection string e defina `HACKATONXP_ALLOW_INMEMORY=true`.

### Opção A — banco em memória

```bash
dotnet restore
dotnet build

# PowerShell (Windows)
$env:HACKATONXP_ALLOW_INMEMORY = "true"
$env:JWT_SECRET = "<uma-chave-secreta-longa-para-dev>"
dotnet run
```

```bash
# bash/zsh
HACKATONXP_ALLOW_INMEMORY=true JWT_SECRET="<uma-chave-secreta-longa-para-dev>" dotnet run
```

Para o banco em memória ser usado, a connection string de `appsettings.Development.json` precisa estar ausente/vazia (caso contrário o PostgreSQL tem precedência).

### Opção B — PostgreSQL

Use a connection string já presente em `appsettings.Development.json` (ou defina a sua) e um `JWT_SECRET`, com o Postgres rodando (ver seção "PostgreSQL" abaixo). Aplique as migrations antes de usar.

A API sobe em **`http://localhost:5018`** (e `https://localhost:7279`), conforme `Properties/launchSettings.json`. O Swagger fica disponível em `/swagger` no ambiente de Development.

### Autenticação e usuários

- O **seed automático** (`Infrastructure/Seed/DataSeeder.cs`), executado apenas quando o provedor é **InMemory**, cria **um único cliente** (`Cliente Demo`, CPF sintético `52998224725`) com posições, interações, tarefa e data importante. **Ele não cria nenhum assessor nem senha.**
- Como o login (`POST /api/auth/login`) autentica **assessores**, não há usuário para logar logo após o seed. Para criar um assessor, use uma das opções:

  **1. Admin inicial via variáveis de ambiente** (lido por `Program.cs` na inicialização):

  ```bash
  HACKATONXP_CREATE_ADMIN=true
  HACKATONXP_ADMIN_EMAIL=<email>
  HACKATONXP_ADMIN_PASSWORD=<senha>
  ```

  Cria um assessor "Initial Admin" com o e-mail/senha informados, caso ainda não exista.

  **2. Endpoint de registro** `POST /api/advisors` com `AdvisorCreateDto`.

O hash de senha é gerado em runtime pelo `PasswordHasherService`; nenhuma senha fica em texto puro no repositório.

Exemplo de login (após criar um assessor):

```bash
curl -X POST http://localhost:5018/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "<email>", "password": "<senha>" }'
```

A resposta traz um JWT (`token`) para usar como `Authorization: Bearer <token>` nos endpoints protegidos. Em caso de credenciais inválidas, o endpoint retorna `401 Unauthorized`.

---

## Subindo o front-end

Resumo (detalhes no README de [`hackathon-xp-front/`](hackathon-xp-front/README.md)):

```bash
cd hackathon-xp-front
npm install
npm run dev
```

O front roda em `http://localhost:3000`.

- **Sem `NEXT_PUBLIC_API_URL`:** o front funciona 100% com dados fictícios (`isMock: true`).
- **Com backend real:** defina `NEXT_PUBLIC_API_URL`, `BACKEND_API_EMAIL` e `BACKEND_API_PASSWORD` (ver `.env.local.example`). As credenciais `BACKEND_API_*` são **server-only**: o `lib/api.ts` as usa para obter o JWT via `POST /api/auth/login` e mantém o token em cache apenas no processo do servidor. Em falha de chamada ao backend, o front faz fallback para os mocks.

---

## Open Finance (Pluggy) — restrições e segurança

Os endpoints de Open Finance integram com a **Pluggy**. As credenciais **não são versionadas** neste repositório.

Para testar qualquer funcionalidade que consulte dados reais de Open Finance, forneça um `PLUGGY_CLIENT_ID` e um `PLUGGY_CLIENT_SECRET` da sandbox da Pluggy. Sem essas chaves:

- O restante da API continua funcionando (login, clientes, carteira, etc.).
- As chamadas que dependem da Pluggy retornam erro controlado (`502`), sem derrubar a aplicação.

As credenciais são lidas pelo pipeline de configuração do .NET — **user-secrets** em Development e **variáveis de ambiente** em qualquer ambiente. O projeto já tem `UserSecretsId` configurado no `.csproj`.

```bash
# user-secrets (Development)
dotnet user-secrets set PLUGGY_CLIENT_ID <seu-client-id-sandbox>
dotnet user-secrets set PLUGGY_CLIENT_SECRET <seu-client-secret-sandbox>
```

```bash
# variáveis de ambiente (produção/CI)
PLUGGY_CLIENT_ID=<seu-client-id-sandbox>
PLUGGY_CLIENT_SECRET=<seu-client-secret-sandbox>
```

> Build e testes **não** dependem de credenciais reais da Pluggy. O `PluggyService` só exige as chaves quando uma chamada à Pluggy é efetivamente realizada. O cliente HTTP tem base `https://api.pluggy.ai/` e timeout de 30s (configurado em `Program.cs`).

---

## Endpoints

Autenticação (`AuthController`):

- `POST /api/auth/login` — autentica um assessor (`{ email, password }`) e retorna um JWT. `401` em falha.

Assessores (`AdvisorsController`):

- `POST /api/advisors` — cria um assessor (`AdvisorCreateDto`).
- `GET /api/advisors/me` — dados do assessor logado (requer JWT).
- `GET /api/advisors/me/portfolio-summary` — agregação da carteira do assessor logado (requer JWT): `TotalPatrimonio`, `ActiveClients`, `ActiveConsents`, `TotalExternalLiquidity`, `TotalOutstandingDebt`.

Clientes (`ClientsController`, rota base `api/clients`):

- `GET /api/clients` — lista de clientes.
- `GET /api/clients/{id:guid}` — detalhe de um cliente (`404` se não existir).
- `POST /api/clients` — cria cliente (`201`/`400`).
- `PUT /api/clients/{id:guid}` — atualiza cliente.
- `DELETE /api/clients/{id:guid}` — remove cliente (`204`/`404`).
- `GET /api/clients/{id:guid}/overview` — visão 360° do cliente (`404` se não existir).
- `GET /api/clients/{id:guid}/open-finance` — visão consolidada de Open Finance por cliente.

Open Finance / Pluggy (`PluggyController`, rota base `api/pluggy`, **todas exigem autenticação**):

- `GET /api/pluggy/investments?itemId=` — investimentos do item.
- `GET /api/pluggy/accounts?itemId=` — contas do item.
- `GET /api/pluggy/loans?itemId=` — empréstimos/financiamentos do item.
- `GET /api/pluggy/item?itemId=` — status/metadata do item (consentimento).
- `POST /api/pluggy/connect-token` — gera um connect token. Body opcional `ConnectTokenRequest`.

Debug (`DebugController`, rota base `api/debug`):

- `POST /api/debug/verify` — verifica e-mail/senha de um assessor (`AdvisorLoginDto`). Utilitário de diagnóstico.

Contrato de erro dos endpoints Pluggy: `400` quando o `itemId` obrigatório está ausente; `502` em falha de comunicação com a Pluggy.

---

## PostgreSQL (opcional)

O `docker-compose.yml` sobe um PostgreSQL 15 e depende de um arquivo **`.env`** com `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` e, opcionalmente, `POSTGRES_PORT` (padrão `5432`).

1. Crie o `.env` com as variáveis acima e suba o banco: `docker compose up -d`.
2. Garanta que a connection string em `ConnectionStrings:Postgres` aponte para o banco (o padrão em `appsettings*.json` usa `Host=localhost;Port=5433;Database=hackatonxp_db;Username=hackatonxp;Password=hackatonxp_pass` — ajuste a porta conforme o `POSTGRES_PORT` que você usar no compose).
3. Aplique as migrations: `dotnet ef database update`.

Quando a connection string está presente, a aplicação usa PostgreSQL em vez do banco em memória.

As migrations existentes ficam em **`Migrations/`** na raiz do projeto (`InitialCreate` e `AddAdvisorAndPluggyItemIdToClient`). Para gerar novas migrations no mesmo diretório:

```bash
dotnet ef migrations add <Nome> --output-dir Migrations
```

---

## Dados de demonstração

O seed (`Infrastructure/Seed/DataSeeder.cs`) só roda com **banco em memória** e adiciona **um** cliente (`Cliente Demo`) com posições de carteira, interações, uma tarefa e uma data importante. O CPF é sintético. **Nenhum assessor é semeado** — veja a seção de autenticação para criar um.

---

## Testes

> O arquivo de projeto principal referencia os pacotes xUnit e `Microsoft.NET.Test.Sdk`, e inclui `<None Include="tests\hackatonxp.UnitTests\hackatonxp.UnitTests.csproj" />`. A pasta `Tests/` contém arquivos de teste (`ClientCreationTests`, `ClientOverviewServiceTests`, `CpfServiceTests`, `LoanResponseTests`, `PortfolioSummaryServiceTests`) e uma subpasta `hackatonxp.UnitTests/`. Verifique a configuração da solução (`hackatonxp.slnx`) para o comando correto antes de executar.

```bash
# Backend (xUnit)
dotnet test

# Front-end
cd hackathon-xp-front
npm test
```

---

## Integrações externas

A base inclui contratos para provedores externos (`IExternalProfileProvider`) e um adaptador de demonstração em `Infrastructure/Adapters`. A integração real prevista é a Pluggy (Open Finance), condicionada às credenciais de sandbox fornecidas pelo tester (ver seção acima).
