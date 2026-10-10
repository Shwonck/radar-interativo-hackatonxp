using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Application.Interfaces;
using hackatonxp.Domain.Entities;
using hackatonxp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace hackatonxp.Infrastructure.Repositories
{
    public class ClientRepository : IClientRepository
    {
        private readonly HackatonXpDbContext _db;

        public ClientRepository(HackatonXpDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Client>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await _db.Clients
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Client>> GetByAdvisorIdAsync(
            Guid advisorId,
            CancellationToken cancellationToken = default)
        {
            return await _db.Clients
                .AsNoTracking()
                .Where(c => c.AdvisorId == advisorId)
                .ToListAsync(cancellationToken);
        }

        public async Task<Client?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            return await _db.Clients
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }

        public async Task<Client?> GetByIdWithRelatedAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            return await _db.Clients
                .AsNoTracking()
                .Include(c => c.Positions)
                .Include(c => c.Interactions)
                .Include(c => c.Tasks)
                .Include(c => c.ImportantDates)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }

        public async Task<Client?> GetByCpfAsync(
            string normalizedCpf,
            CancellationToken cancellationToken = default)
        {
            return await _db.Clients
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    c => c.Cpf == normalizedCpf,
                    cancellationToken);
        }

        public async Task AddAsync(
            Client client,
            CancellationToken cancellationToken = default)
        {
            await _db.Clients.AddAsync(client, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateAsync(
            Client client,
            CancellationToken cancellationToken = default)
        {
            _db.Clients.Update(client);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(
            Client client,
            CancellationToken cancellationToken = default)
        {
            _db.Clients.Remove(client);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}