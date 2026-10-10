hackatonxp
=========

Backend base for the hackathon project hackatonxp. Provides a lightweight 360° client overview API using ASP.NET Core and EF Core.

Arquitetura
- Domain: entidades e regras de negócio
- Application: casos de uso, DTOs e contratos
- Infrastructure: EF Core, DbContext, repositórios, seed e adaptadores
- Api: controllers e configuração da aplicação
- Tests: testes unitários xUnit

Pré-requisitos
- .NET 10 SDK
- Docker (para executar PostgreSQL localmente)

Rodando PostgreSQL com Docker Compose
1. Copie .env.example para .env e ajuste os valores locais.
2. docker compose up -d
3. docker compose ps
4. docker compose logs postgres

Notas sobre conexão
- Defina ConnectionStrings__Postgres no .env ou em appsettings.json para apontar o banco.
- Por padrão a aplicação exige PostgreSQL para executar em modo não-ephemeral. Para executar localmente sem Postgres, defina HACKATONXP_ALLOW_INMEMORY=true no .env (apenas para desenvolvimento).

EF Core Migrations
-- Exemplo para criar a migration inicial (ajuste caminhos conforme a solução):
dotnet ef migrations add InitialCreate \
  --project . \
  --startup-project . \
  --output-dir Infrastructure/Data/Migrations

Executando a aplicação
- dotnet restore
- dotnet build
- dotnet run

Executando testes
- dotnet test

Endpoint principal
- GET /api/clients/{id:guid}/overview

Endpoints Open Finance (Pluggy)
- GET /api/pluggy/investments?itemId= — investimentos do item.
- GET /api/pluggy/accounts?itemId= — contas do item.
- GET /api/pluggy/loans?itemId= — empréstimos/financiamentos do item.
- GET /api/pluggy/item?itemId= — status/metadata do item (consentimento).
- POST /api/pluggy/connect-token — gera um connect token. Body opcional { "itemId": "...", "clientUserId": "..." }.
- GET /api/clients/{id:guid}/open-finance — visão consolidada por cliente (investments, accounts, loans, item). Retorna 409 quando o cliente não possui PluggyItemId.
- GET /api/advisors/me/portfolio-summary — agregação da carteira do assessor logado (TotalPatrimonio, ActiveClients, ActiveConsents, TotalExternalLiquidity, TotalOutstandingDebt).

Todos os endpoints Pluggy exigem autenticação ([Authorize]) e seguem o contrato de erro: 400 quando o itemId é obrigatório e está ausente, 502 em falha de comunicação com a Pluggy.

Credenciais Pluggy (user-secrets nativo do .NET)
- As credenciais são lidas via o pipeline nativo de configuração do .NET (user-secrets em Development, variáveis de ambiente em qualquer ambiente). Não use .env nem bibliotecas de carregamento de .env para elas.
- Configuração local:
  dotnet user-secrets set PLUGGY_CLIENT_ID <id>
  dotnet user-secrets set PLUGGY_CLIENT_SECRET <secret>
- Em produção/CI, forneça como variáveis de ambiente PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET.
- Build e testes não dependem de credenciais reais; o PluggyService só exige as chaves em runtime.

Dados de demonstração
- Seed adiciona um cliente demo com CPF sintético (não real) para testes locais.

Integrações externas
- A base inclui contratos para provedores externos (IExternalProfileProvider) e um adaptador de demonstração. Não há integrações reais configuradas.
