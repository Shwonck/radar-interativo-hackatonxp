# Radar Interativo — hackatonxp

Plataforma 360° para o assessor acompanhar seus clientes: visão consolidada de carteira, interações, tarefas, datas importantes e dados de Open Finance (via Pluggy). O backend é uma API ASP.NET Core (.NET 10) e o front-end é uma aplicação Next.js.

## Arquitetura

```
Domain/         Entidades e regras de negócio
Application/    Casos de uso, DTOs e contratos (interfaces)
Infrastructure/ EF Core, DbContext, repositórios, seed e adaptadores (Pluggy, JWT, hashing)
Api/            Controllers e configuração HTTP
Tests/          Testes unitários (xUnit)
hackathon-xp-front/  Front-end Next.js (App Router)
```

## Pré-requisitos

- .NET 10 SDK
- Node.js 20+ (para o front-end)
- Docker (opcional — apenas se quiser usar PostgreSQL no lugar do banco em memória)

---

## Subindo o backend para testar localmente (clone-and-run)

O projeto já vem pronto para rodar em qualquer máquina sem configuração adicional. Em ambiente de **Development**, a API usa um **banco em memória** e um **JWT secret de desenvolvimento** já incluídos em `appsettings.Development.json`, e popula automaticamente um assessor de teste com clientes.

```bash
dotnet restore
dotnet build
dotnet run
```

A API sobe em `http://localhost:5080` (ajuste a porta conforme `Properties/launchSettings.json`). O Swagger fica disponível em `/swagger` no ambiente de Development.

### Credenciais de teste (login)

O seed cria automaticamente um assessor com clientes populados, para você logar no front e exercitar a API:

| Campo | Valor |
| --- | --- |
| E-mail | `assessor.teste@example.com` |
| Senha | `Teste@123` |

> Essas credenciais são **apenas para desenvolvimento local** com o banco em memória. Não as utilize em produção. O hash da senha é gerado em runtime pelo `PasswordHasherService`, então nenhuma senha fica armazenada em texto puro no repositório.

Exemplo de login:

```bash
curl -X POST http://localhost:5080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "assessor.teste@example.com", "password": "Teste@123" }'
```

A resposta traz um JWT (`token`) para usar como `Authorization: Bearer <token>` nos endpoints protegidos.

---

## Subindo o front-end

```bash
cd hackathon-xp-front
npm install
npm run dev
```

O front roda em `http://localhost:3000`.

- **Sem backend configurado:** o front funciona 100% com dados fictícios (`isMock: true`). Basta `npm run dev`.
- **Com backend real:** copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_API_URL=http://localhost:5080
BACKEND_API_EMAIL=assessor.teste@example.com
BACKEND_API_PASSWORD=Teste@123
```

As credenciais `BACKEND_API_*` são **server-only** (nunca expostas ao navegador): o `lib/api.ts` as usa para obter o JWT no backend e manter o token em cache apenas no processo do servidor.

---

## Open Finance (Pluggy) — restrições e segurança

Os endpoints de Open Finance integram com a **Pluggy**. Por questões de segurança da ferramenta, **as credenciais da Pluggy não são versionadas neste repositório** e não são compartilhadas junto com o projeto.

Para testar qualquer funcionalidade que consulte dados reais de Open Finance, **o próprio tester precisa fornecer um `PLUGGY_CLIENT_ID` e um `PLUGGY_CLIENT_SECRET` da sandbox da Pluggy** (criados na conta de desenvolvedor da Pluggy). Sem essas chaves:

- O restante da API continua funcionando normalmente (login, listagem de clientes, carteira, etc.).
- Qualquer chamada que dependa da Pluggy retorna erro controlado (ex.: `502 Bad Gateway`), sem derrubar a aplicação.

As credenciais são lidas pelo pipeline nativo de configuração do .NET — **user-secrets** em Development e **variáveis de ambiente** em qualquer ambiente. Não use `.env` nem bibliotecas de carregamento de `.env` para elas.

Configuração local via user-secrets:

```bash
dotnet user-secrets set PLUGGY_CLIENT_ID <seu-client-id-sandbox>
dotnet user-secrets set PLUGGY_CLIENT_SECRET <seu-client-secret-sandbox>
```

Ou via variáveis de ambiente (produção/CI):

```bash
PLUGGY_CLIENT_ID=<seu-client-id-sandbox>
PLUGGY_CLIENT_SECRET=<seu-client-secret-sandbox>
```

> Build e testes **não** dependem de credenciais reais da Pluggy. O `PluggyService` só exige as chaves no momento em que uma chamada à Pluggy é efetivamente realizada.

---

## Endpoints principais

Clientes:

- `GET /api/clients` — lista de clientes.
- `GET /api/clients/{id:guid}` — detalhe de um cliente.
- `GET /api/clients/{id:guid}/overview` — visão 360° do cliente.
- `POST /api/clients` — cria cliente. `PUT /api/clients/{id}` atualiza, `DELETE /api/clients/{id}` remove.

Assessor:

- `GET /api/advisors/me/portfolio-summary` — agregação da carteira do assessor logado (TotalPatrimonio, ActiveClients, ActiveConsents, TotalExternalLiquidity, TotalOutstandingDebt).

Open Finance (Pluggy) — exigem autenticação e credenciais Pluggy configuradas:

- `GET /api/pluggy/investments?itemId=` — investimentos do item.
- `GET /api/pluggy/accounts?itemId=` — contas do item.
- `GET /api/pluggy/loans?itemId=` — empréstimos/financiamentos do item.
- `GET /api/pluggy/item?itemId=` — status/metadata do item (consentimento).
- `POST /api/pluggy/connect-token` — gera um connect token. Body opcional `{ "itemId": "...", "clientUserId": "..." }`.
- `GET /api/clients/{id:guid}/open-finance` — visão consolidada por cliente. Retorna `409` quando o cliente não possui `PluggyItemId`.

Contrato de erro dos endpoints Pluggy: `400` quando o `itemId` é obrigatório e está ausente; `502` em falha de comunicação com a Pluggy.

---

## Executando com PostgreSQL (opcional)

Por padrão o desenvolvimento local usa banco em memória. Para usar PostgreSQL:

1. Suba o banco: `docker compose up -d`.
2. Defina a connection string em `ConnectionStrings__Postgres` (variável de ambiente ou `appsettings`), por exemplo:
   `Host=localhost;Port=5433;Database=hackatonxp_db;Username=hackatonxp;Password=hackatonxp_pass`.
3. Aplique as migrations: `dotnet ef database update`.

Quando a connection string está presente, a aplicação usa PostgreSQL em vez do banco em memória.

Criar a migration inicial (ajuste caminhos conforme a solução):

```bash
dotnet ef migrations add InitialCreate \
  --project . \
  --startup-project . \
  --output-dir Infrastructure/Data/Migrations
```

---

## Dados de demonstração

O seed (`Infrastructure/Seed/DataSeeder.cs`) adiciona, no banco em memória:

- Um assessor de teste (credenciais acima).
- Clientes de exemplo vinculados a esse assessor, com posições de carteira, interações, tarefas e datas importantes. Os CPFs são sintéticos (não reais).

---

## Executando testes

```bash
# Backend
dotnet test

# Front-end
cd hackathon-xp-front
npm test
```

---

## Integrações externas

A base inclui contratos para provedores externos (`IExternalProfileProvider`) e um adaptador de demonstração. A única integração real prevista é a Pluggy (Open Finance), condicionada às credenciais de sandbox fornecidas pelo tester (ver seção acima).
