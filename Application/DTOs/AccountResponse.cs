using System.Text.Json;

namespace hackatonxp.Application.DTOs
{
    public class AccountResponse
    {
        public string? Id { get; set; }
        public string? Type { get; set; }
        public string? Subtype { get; set; }
        public string? Name { get; set; }
        public string? Number { get; set; }
        public decimal? Balance { get; set; }
        public string? CurrencyCode { get; set; }
        public string? ItemId { get; set; }

        public JsonElement? BankData { get; set; }
        public JsonElement? CreditData { get; set; }
    }
}
