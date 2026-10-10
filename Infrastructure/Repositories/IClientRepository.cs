using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Domain.Entities;

namespace hackatonxp.Application.Interfaces
{
    public interface IClientRepository
    {
        Task<IEnumerable<Client>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<IEnumerable<Client>> GetByAdvisorIdAsync(
            Guid advisorId,
            CancellationToken cancellationToken = default);

        Task<Client?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default);

        Task<Client?> GetByIdWithRelatedAsync(
            Guid id,
            CancellationToken cancellationToken = default);

        Task<Client?> GetByCpfAsync(
            string normalizedCpf,
            CancellationToken cancellationToken = default);

        Task AddAsync(
            Client client,
            CancellationToken cancellationToken = default);

        Task UpdateAsync(
            Client client,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            Client client,
            CancellationToken cancellationToken = default);
    }
}