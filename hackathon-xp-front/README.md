# XP Open Finance — plataforma do assessor

Protótipo front-end para o Hackathon XP. A interface reúne uma visão geral da carteira, lista de clientes, acompanhamento de consentimentos e oportunidades de conversa para apoiar uma assessoria mais personalizada.

## Executar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A entrada fica em `/`. As áreas protegidas têm rotas próprias: `/dashboard`, `/clientes`, `/clientes/[id]`, `/conexoes` e `/oportunidades`. Cada módulo possui sua própria `page.tsx`; a estrutura visual compartilhada fica em `app/(authenticated)/components`.

Para manter a indentação e a formatação do código, execute `npm run format`. Use `npm run format:check` para verificar sem alterar arquivos.
Execute `npm test` para validar posições, FGC, score e alertas da simulação.

## Acesso local

- **E-mail:** `assessor@xp-demo.com`
- **Senha inicial:** `XPdemo@2026`

O fluxo inclui login, opção de manter a sessão por sete dias, logout, recuperação de acesso e redefinição de senha. Na tela “Esqueceu sua senha?”, informe o e-mail acima: o link temporário será exibido na própria interface, sem envio de e-mail. A nova senha fica salva apenas no armazenamento local deste navegador.

## O que está disponível

- Painel responsivo com indicadores e evolução ilustrativa de patrimônio.
- Busca e filtro de clientes, detalhes pessoais e financeiros, alocação e status do consentimento.
- Visão de conexões Open Finance e oportunidades de acompanhamento.
- Perfil individual de cliente com cadastro, posições e quatro abas: Visão geral, Proteção FGC, Risco de crédito, Vencimentos e alertas.
- Temas claro e escuro, sidebar recolhível ou expansível ao passar o mouse e opção para animar ou manter estáticos os ícones. As preferências ficam salvas neste navegador.
- Exportação CSV dos clientes filtrados.
- Fluxo demonstrativo de convite de cliente.

## Dados e integração

### Análises de FGC e crédito

A página `/clientes/[id]` solicita `GET /api/clientes/{id}/analises`. Como ainda não há backend .NET, essa rota usa as posições **fictícias** de `lib/mock-positions.ts` e calcula uma simulação local em `lib/mock-analyses.ts`. O cálculo fica na API Next.js; os painéis React apenas apresentam a resposta. Nenhum registro foi adicionado à lista de clientes: Fernanda Oliveira, Mariana Costa e Ricardo Almeida ilustram, respectivamente, cenários de risco baixo, moderado e elevado. Os outros três clientes também possuem posições vinculadas aos seus IDs existentes.

Cada posição tem produto, valor, emissor quando conhecido e data de vencimento quando aplicável. A soma fecha com o patrimônio e a alocação da lista. A simulação de FGC considera apenas CDB/LCI/LCA com saldo elegível e conglomerado informados na fixture, agrupa por cliente e conglomerado e estima o limite ordinário. Ela **não confirma** titularidade, juros reconhecidos, elegibilidade definitiva nem o limite global disponível. O score é interno, usa fatores manuais fictícios e pesos da versão `sim-v1`; não é rating oficial ou probabilidade de inadimplência. Bancos não recebem o mesmo score usado para as empresas fictícias emissoras das debêntures.

O limiar de alerta de concentração pode ser configurado no servidor por `SIMULATION_CONCENTRATION_THRESHOLD` (fração entre 0 e 1; padrão `0.15`). As posições fictícias têm data-base `2026-10-10`; os dias até o vencimento e os alertas de prazo são recalculados na data atual de São Paulo em cada acesso. Os testes injetam uma data explícita para serem reproduzíveis. Nenhuma posição ou conexão vem da Pluggy/Open Finance real.

Para usar uma API própria no futuro, configure `ANALYSIS_API_BASE_URL` no servidor. A rota passa a consultar `GET {ANALYSIS_API_BASE_URL}/clientes/{id}/analises`, sem recorrer aos exemplos locais em caso de erro. A resposta deve seguir os tipos em `lib/analysis-contract.ts`, com `fgcAnalysis`, `creditAssessment`, `alerts` e `maturities`. A análise de FGC completa deve trazer `summary` e `groups`; a avaliação de crédito com nota deve trazer as seis notas por fator, versão da metodologia, fontes e data-base. Valores inválidos são rejeitados e a interface informa a indisponibilidade. Esse caminho é apenas um contrato proposto; ainda não existe backend .NET nem integração Pluggy neste repositório.

A rota local exige a sessão do protótipo. Ao integrar dados reais, substitua a autenticação mockada e defina as credenciais de serviço adequadas no backend.

Todos os nomes, e-mails, valores e insights exibidos são **fictícios**. Os indicadores do painel representam um cenário ilustrativo e não são calculados a partir dos seis clientes de exemplo. A ação de convite não envia e-mail e a solicitação de atualização de consentimento não chama serviços externos.

**A autenticação também é mockada.** O cookie de sessão e a senha redefinida são controlados pelo navegador, sem backend ou verificação de identidade real. Não use este fluxo para proteger dados verdadeiros. Para operar com dados reais, o próximo passo é integrar um provedor de identidade, APIs de um participante/provedor Open Finance, consentimento explícito do cliente, gestão de escopos e expiração, e controles adequados de acesso e auditoria. Nenhum dado financeiro real deve ser colocado nos objetos de demonstração do front-end.

## Identidade visual

O protótipo usa a marca XP e uma paleta de preto, branco e amarelo. O arquivo [`public/xp-logo.svg`](public/xp-logo.svg) reproduz o logotipo publicado pela XP em seu CDN, disponibilizado também no [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logotipo_da_XP_Investimentos.svg).

Projeto de demonstração criado para o Hackathon XP; não é um produto oficial da XP.
