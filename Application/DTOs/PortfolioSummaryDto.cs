namespace hackatonxp.Application.DTOs
{
    public class PortfolioSummaryDto
    {
        public decimal TotalPatrimonio { get; set; }
        public int ActiveClients { get; set; }
        public int ActiveConsents { get; set; }
        public decimal TotalExternalLiquidity { get; set; }
        public decimal TotalOutstandingDebt { get; set; }
    }
}
