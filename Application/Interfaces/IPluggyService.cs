using hackatonxp.Application.DTOs;

namespace hackatonxp.Application.Interfaces
{
    public interface IPluggyService
    {
        Task<List<InvestmentResponse>> GetClientInvestmentsAsync(
            string itemId,
            CancellationToken cancellationToken = default);

        Task<List<AccountResponse>> GetClientAccountsAsync(
            string itemId,
            CancellationToken cancellationToken = default);

        Task<List<LoanResponse>> GetClientLoansAsync(
            string itemId,
            CancellationToken cancellationToken = default);

        Task<ItemResponse?> GetItemAsync(
            string itemId,
            CancellationToken cancellationToken = default);

        Task<ConnectTokenResponse?> CreateConnectTokenAsync(
            string? itemId,
            string? clientUserId,
            CancellationToken cancellationToken = default);
    }
}
