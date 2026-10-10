using System;
using System.Text.Json;

namespace hackatonxp.Application.DTOs
{
    public class LoanResponse
    {
        public string? Id { get; set; }
        public string? ItemId { get; set; }
        public string? ContractNumber { get; set; }
        public string? ProductName { get; set; }
        public string? Type { get; set; }
        public DateTimeOffset? Date { get; set; }
        public DateTimeOffset? ContractDate { get; set; }
        public decimal? ContractAmount { get; set; }
        public string? CurrencyCode { get; set; }
        public DateTimeOffset? DueDate { get; set; }
        public string? InstallmentPeriodicity { get; set; }
        public decimal? CET { get; set; }

        public LoanPaymentsResponse? Payments { get; set; }

        // Flattened first interest-rate typed fields.
        public decimal? InterestRate { get; set; }
        public string? InterestRateType { get; set; }
        public string? InterestRatePeriodicity { get; set; }

        public JsonElement? InterestRates { get; set; }
        public JsonElement? Warranties { get; set; }
        public JsonElement? ContractedFees { get; set; }
        public JsonElement? ContractedFinanceCharges { get; set; }
        public JsonElement? Installments { get; set; }
    }

    public class LoanPaymentsResponse
    {
        public decimal? ContractOutstandingBalance { get; set; }
        public JsonElement? Releases { get; set; }
    }
}
