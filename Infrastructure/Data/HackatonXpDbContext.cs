using hackatonxp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace hackatonxp.Infrastructure.Data
{
    public class HackatonXpDbContext : DbContext
    {
        public HackatonXpDbContext(DbContextOptions<HackatonXpDbContext> options) : base(options)
        {
        }

        public DbSet<Client> Clients => Set<Client>();
        public DbSet<Advisor> Advisors => Set<Advisor>();
        public DbSet<PortfolioPosition> PortfolioPositions => Set<PortfolioPosition>();
        public DbSet<Interaction> Interactions => Set<Interaction>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<ImportantDate> ImportantDates => Set<ImportantDate>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Client>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Name).IsRequired();
                b.Property(x => x.Cpf).HasMaxLength(11).IsRequired();
                b.HasIndex(x => x.Cpf).IsUnique();
                b.HasMany(x => x.Positions).WithOne(p => p.Client).HasForeignKey(p => p.ClientId);
                b.HasMany(x => x.Interactions).WithOne(i => i.Client).HasForeignKey(i => i.ClientId);
                b.HasMany(x => x.Tasks).WithOne(t => t.Client).HasForeignKey(t => t.ClientId);
                b.HasMany(x => x.ImportantDates).WithOne(d => d.Client).HasForeignKey(d => d.ClientId);
                b.Property(x => x.PluggyItemId);
                b.HasOne(x => x.Advisor)
                    .WithMany(a => a.Clients)
                    .HasForeignKey(x => x.AdvisorId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Advisor>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Name).IsRequired();
                b.Property(x => x.Email).IsRequired();
                b.HasIndex(x => x.Email).IsUnique();
                b.Property(x => x.PasswordHash).IsRequired();
                b.Property(x => x.IsActive).HasDefaultValue(true);
                b.Property(x => x.CreatedAt).IsRequired();
            });

            modelBuilder.Entity<PortfolioPosition>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.AssetName).IsRequired();
                b.Property(x => x.UnitPrice).HasColumnType("decimal(18,4)");
            });

            modelBuilder.Entity<Interaction>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Summary).IsRequired();
            });

            modelBuilder.Entity<TaskItem>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Title).IsRequired();
            });

            modelBuilder.Entity<ImportantDate>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Title).IsRequired();
            });
        }
    }
}
