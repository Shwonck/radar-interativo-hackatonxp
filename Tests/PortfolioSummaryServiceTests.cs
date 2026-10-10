using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Application.DTOs;
using hackatonxp.Application.Interfaces;
using hackatonxp.Application.Services;
using hackatonxp.Domain.Entities;
using hackatonxp.Infrastructure.Data;
using hackatonxp.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace hackatonxp.UnitTests
{
    public class PortfolioSummaryServiceTests
    {
        private sealed class StubPluggyService : IPluggyService
        {
            public Func<string, List<InvestmentResponse>> Investments { get; set; }
                = _ => new List<InvestmentResponse>();
            public Func<string, List<AccountResponse>> Accounts { get; set; }
                = _ => new List<AccountResponse>();
            public Func<string, List<LoanResponse>> Loans { get; set; }
                = _ => new List<LoanResponse>();
            public Func<string, ItemResponse?> Item { get; set; }
                = _ => new ItemResponse { Status = "UPDATED" };

            public Task<List<InvestmentResponse>> GetClientInvestmentsAsync(
                string itemId, CancellationToken cancellationToken = default)
                => Task.FromResult(Investments(itemId));

            public Task<List<AccountResponse>> GetClientAccountsAsync(
                string itemId, CancellationToken cancellationToken = default)
                => Task.FromResult(Accounts(itemId));

            public Task<List<LoanResponse>> GetClientLoansAsync(
                string itemId, CancellationToken cancellationToken = default)
                => Task.FromResult(Loans(itemId));

            public Task<ItemResponse?> GetItemAsync(
                string itemId, CancellationToken cancellationToken = default)
                => Task.FromResult(Item(itemId));

            public Task<ConnectTokenResponse?> CreateConnectTokenAsync(
                string? itemId, string? clientUserId, CancellationToken cancellationToken = default)
                => Task.FromResult<ConnectTokenResponse?>(new ConnectTokenResponse());
        }

        private static HackatonXpDbContext CreateInMemoryDb()
        {
            var options = new DbContextOptionsBuilder<HackatonXpDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new HackatonXpDbContext(options);
        }

        [Fact]
        public async Task GetForAdvisor_AggregatesConnectedClientsAndSkipsFailures()
        {
            using var db = CreateInMemoryDb();

            var advisorId = Guid.NewGuid();
            db.Advisors.Add(new Advisor
            {
                Id = advisorId,
                Name = "Assessor Teste",
                Email = "assessor@teste.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });

            var connectedClientId = Guid.NewGuid();
            db.Clients.Add(new Client
            {
                Id = connectedClientId,
                Cpf = "11111111111",
                Name = "Cliente Conectado",
                AdvisorId = advisorId,
                PluggyItemId = "item-ok",
                CreatedAt = DateTime.UtcNow
            });

            db.Clients.Add(new Client
            {
                Id = Guid.NewGuid(),
                Cpf = "22222222222",
                Name = "Cliente Sem Conexao",
                AdvisorId = advisorId,
                PluggyItemId = null,
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();

            var stub = new StubPluggyService
            {
                Investments = _ => new List<InvestmentResponse>
                {
                    new() { Balance = 100000m }
                },
                Accounts = _ => new List<AccountResponse>
                {
                    new() { Type = "BANK", Balance = 20000m },
                    new() { Type = "CREDIT", Balance = 5000m }
                },
                Loans = _ => new List<LoanResponse>
                {
                    new() { Payments = new LoanPaymentsResponse { ContractOutstandingBalance = 30000m } }
                },
                Item = _ => new ItemResponse { Status = "UPDATED" }
            };

            var service = new PortfolioSummaryService(
                new ClientRepository(db), stub);

            var summary = await service.GetForAdvisorAsync(advisorId);

            Assert.Equal(2, summary.ActiveClients);
            // Only the connected client contributes: investments 100000 + BANK 20000.
            Assert.Equal(120000m, summary.TotalPatrimonio);
            Assert.Equal(20000m, summary.TotalExternalLiquidity);
            Assert.Equal(30000m, summary.TotalOutstandingDebt);
            Assert.Equal(1, summary.ActiveConsents);
        }

        [Fact]
        public async Task GetForAdvisor_SkipsClientWhenPluggyCallThrows()
        {
            using var db = CreateInMemoryDb();

            var advisorId = Guid.NewGuid();
            db.Advisors.Add(new Advisor
            {
                Id = advisorId,
                Name = "Assessor Teste",
                Email = "assessor2@teste.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });

            db.Clients.Add(new Client
            {
                Id = Guid.NewGuid(),
                Cpf = "33333333333",
                Name = "Cliente Falha",
                AdvisorId = advisorId,
                PluggyItemId = "item-broken",
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();

            var stub = new StubPluggyService
            {
                Investments = _ => throw new HttpRequestException("boom")
            };

            var service = new PortfolioSummaryService(
                new ClientRepository(db), stub);

            var summary = await service.GetForAdvisorAsync(advisorId);

            Assert.Equal(1, summary.ActiveClients);
            Assert.Equal(0m, summary.TotalPatrimonio);
            Assert.Equal(0m, summary.TotalOutstandingDebt);
            Assert.Equal(0, summary.ActiveConsents);
        }
    }
}
