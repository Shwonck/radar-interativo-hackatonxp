using System.Text.Json;
using hackatonxp.Application.DTOs;
using Xunit;

namespace hackatonxp.UnitTests
{
    public class LoanResponseTests
    {
        private const string LoanJson = @"
        {
            ""id"": ""a0b1c2d3-0000-1111-2222-333344445555"",
            ""itemId"": ""item-123"",
            ""contractNumber"": ""CN-998877"",
            ""productName"": ""Crédito Consignado"",
            ""type"": ""PERSONAL_CREDIT"",
            ""date"": ""2024-01-10T00:00:00.000Z"",
            ""contractDate"": ""2023-12-01T00:00:00.000Z"",
            ""contractAmount"": 50000.75,
            ""currencyCode"": ""BRL"",
            ""dueDate"": ""2027-12-01T00:00:00.000Z"",
            ""installmentPeriodicity"": ""MONTHLY"",
            ""CET"": 0.0215,
            ""payments"": {
                ""contractOutstandingBalance"": 42350.40,
                ""releases"": []
            },
            ""interestRates"": [
                { ""rate"": 0.019, ""type"": ""NOMINAL"", ""referentialRateIndexerType"": ""PRE_FIXADO"" }
            ]
        }";

        [Fact]
        public void Deserialize_PluggyLoanJson_MapsCoreFields()
        {
            var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);

            var loan = JsonSerializer.Deserialize<LoanResponse>(LoanJson, options);

            Assert.NotNull(loan);
            Assert.Equal(50000.75m, loan!.ContractAmount);
            Assert.NotNull(loan.Payments);
            Assert.Equal(42350.40m, loan.Payments!.ContractOutstandingBalance);
            Assert.Equal("Crédito Consignado", loan.ProductName);
            Assert.Equal("PERSONAL_CREDIT", loan.Type);
            Assert.Equal(0.0215m, loan.CET);
        }
    }
}
