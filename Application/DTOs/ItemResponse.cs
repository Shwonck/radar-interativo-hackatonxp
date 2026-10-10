using System;
using System.Text.Json;

namespace hackatonxp.Application.DTOs
{
    public class ItemResponse
    {
        public string? Id { get; set; }
        public string? Status { get; set; }
        public string? ExecutionStatus { get; set; }
        public DateTimeOffset? LastUpdatedAt { get; set; }

        public ConnectorResponse? Connector { get; set; }
        public JsonElement? StatusDetail { get; set; }
    }

    public class ConnectorResponse
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
    }
}
