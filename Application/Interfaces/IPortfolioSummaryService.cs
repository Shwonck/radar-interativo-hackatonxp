using System;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Application.DTOs;

namespace hackatonxp.Application.Interfaces
{
    public interface IPortfolioSummaryService
    {
        Task<PortfolioSummaryDto> GetForAdvisorAsync(
            Guid advisorId,
            CancellationToken cancellationToken = default);
    }
}
