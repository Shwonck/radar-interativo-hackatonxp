using System;
using System.Collections.Generic;

namespace hackatonxp.Domain.Entities
{
    public class Advisor
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }

        public ICollection<Client> Clients { get; set; } = new List<Client>();
    }
}
