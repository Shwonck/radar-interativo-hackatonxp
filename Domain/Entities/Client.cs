using System;
using System.Collections.Generic;

namespace hackatonxp.Domain.Entities
{
    public enum InvestorProfile
    {
        Conservative,
        Balanced,
        Aggressive
    }

    public class Client
    {
        public Guid Id { get; set; }
        public string Cpf { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public DateTime? BirthDate { get; set; }
        public InvestorProfile? InvestorProfile { get; set; }
        public string? FinancialGoals { get; set; }
        public string? CommunicationPreferences { get; set; }
        public DateTime CreatedAt { get; set; }

        public Guid? AdvisorId { get; set; }
        public Advisor? Advisor { get; set; }
        public string? PluggyItemId { get; set; }

        public ICollection<PortfolioPosition> Positions { get; set; } = new List<PortfolioPosition>();
        public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        public ICollection<ImportantDate> ImportantDates { get; set; } = new List<ImportantDate>();
    }
}
