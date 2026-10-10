using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Application.DTOs;
using hackatonxp.Application.Interfaces;

namespace hackatonxp.Application.Services
{
    public class PortfolioSummaryService : IPortfolioSummaryService
    {
        private const int MaxConcurrency = 4;

        private readonly IClientRepository _clientRepository;
        private readonly IPluggyService _pluggyService;

        public PortfolioSummaryService(
            IClientRepository clientRepository,
            IPluggyService pluggyService)
        {
            _clientRepository = clientRepository;
            _pluggyService = pluggyService;
        }

        public async Task<PortfolioSummaryDto> GetForAdvisorAsync(
            Guid advisorId,
            CancellationToken cancellationToken = default)
        {
            var clients =
                (await _clientRepository.GetByAdvisorIdAsync(
                    advisorId, cancellationToken))
                .ToList();

            var summary = new PortfolioSummaryDto
            {
                ActiveClients = clients.Count
            };

            var connectedClients = clients
                .Where(c => !string.IsNullOrWhiteSpace(c.PluggyItemId))
                .ToList();

            if (connectedClients.Count == 0)
            {
                return summary;
            }

            using var throttle = new SemaphoreSlim(MaxConcurrency);

            var tasks = connectedClients.Select(client =>
                FetchClientContributionAsync(
                    client.PluggyItemId!,
                    throttle,
                    cancellationToken));

            var contributions = await Task.WhenAll(tasks);

            foreach (var contribution in contributions)
            {
                if (contribution is null)
                {
                    continue;
                }

                summary.TotalPatrimonio += contribution.TotalPatrimonio;
                summary.TotalExternalLiquidity += contribution.TotalExternalLiquidity;
                summary.TotalOutstandingDebt += contribution.TotalOutstandingDebt;

                if (contribution.HasActiveConsent)
                {
                    summary.ActiveConsents++;
                }
            }

            return summary;
        }

        private async Task<ClientContribution?> FetchClientContributionAsync(
            string itemId,
            SemaphoreSlim throttle,
            CancellationToken cancellationToken)
        {
            await throttle.WaitAsync(cancellationToken);

            try
            {
                var investments = await _pluggyService.GetClientInvestmentsAsync(
                    itemId, cancellationToken);
                var accounts = await _pluggyService.GetClientAccountsAsync(
                    itemId, cancellationToken);
                var loans = await _pluggyService.GetClientLoansAsync(
                    itemId, cancellationToken);
                var item = await _pluggyService.GetItemAsync(
                    itemId, cancellationToken);

                var investmentsTotal = investments.Sum(i => i.Balance ?? 0m);

                var bankBalances = accounts
                    .Where(a => string.Equals(
                        a.Type, "BANK", StringComparison.OrdinalIgnoreCase))
                    .Sum(a => a.Balance ?? 0m);

                var outstandingDebt = loans
                    .Sum(l => l.Payments?.ContractOutstandingBalance ?? 0m);

                return new ClientContribution
                {
                    TotalPatrimonio = investmentsTotal + bankBalances,
                    TotalExternalLiquidity = bankBalances,
                    TotalOutstandingDebt = outstandingDebt,
                    HasActiveConsent = IsActiveConsent(item)
                };
            }
            catch
            {
                // Per-client resilience: skip clients whose Pluggy fetch fails.
                return null;
            }
            finally
            {
                throttle.Release();
            }
        }

        private static bool IsActiveConsent(ItemResponse? item)
        {
            if (item?.Status is null)
            {
                return false;
            }

            return string.Equals(item.Status, "UPDATED", StringComparison.OrdinalIgnoreCase)
                || string.Equals(item.Status, "LOGIN_IN_PROGRESS", StringComparison.OrdinalIgnoreCase)
                || string.Equals(item.ExecutionStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase);
        }

        private sealed class ClientContribution
        {
            public decimal TotalPatrimonio { get; set; }
            public decimal TotalExternalLiquidity { get; set; }
            public decimal TotalOutstandingDebt { get; set; }
            public bool HasActiveConsent { get; set; }
        }
    }
}
