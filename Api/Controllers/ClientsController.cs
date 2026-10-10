using System;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Application.DTOs;
using hackatonxp.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace hackatonxp.Api.Controllers
{
    [ApiController]
    [Route("api/clients")]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly IClientOverviewService _overviewService;
        private readonly IClientRepository _clientRepository;
        private readonly IPluggyService _pluggyService;

        public ClientsController(
            IClientService clientService,
            IClientOverviewService overviewService,
            IClientRepository clientRepository,
            IPluggyService pluggyService)
        {
            _clientService = clientService;
            _overviewService = overviewService;
            _clientRepository = clientRepository;
            _pluggyService = pluggyService;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(
            CancellationToken cancellationToken)
        {
            var clients = await _clientService.GetAllAsync(cancellationToken);
            return Ok(clients);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(
            Guid id,
            CancellationToken cancellationToken)
        {
            var client = await _clientService.GetByIdAsync(
                id, cancellationToken);

            return client is null ? NotFound() : Ok(client);
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create(
            [FromBody] ClientCreateDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var client = await _clientService.CreateAsync(
                    dto, cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = client.Id },
                    client);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] ClientUpdateDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var client = await _clientService.UpdateAsync(
                    id, dto, cancellationToken);

                return client is null ? NotFound() : Ok(client);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(
            Guid id,
            CancellationToken cancellationToken)
        {
            var deleted = await _clientService.DeleteAsync(
                id, cancellationToken);

            return deleted ? NoContent() : NotFound();
        }

        [HttpGet("{id:guid}/overview")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOverview(
            Guid id,
            CancellationToken cancellationToken)
        {
            var overview = await _overviewService.GetOverviewAsync(
                id, cancellationToken);

            return overview is null ? NotFound() : Ok(overview);
        }

        [HttpGet("{id:guid}/open-finance")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status502BadGateway)]
        public async Task<IActionResult> GetOpenFinance(
            Guid id,
            CancellationToken cancellationToken)
        {
            var client = await _clientRepository.GetByIdAsync(
                id, cancellationToken);

            if (client is null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(client.PluggyItemId))
            {
                return Conflict(new
                {
                    message = "O cliente não possui conexão Open Finance (PluggyItemId)."
                });
            }

            var itemId = client.PluggyItemId;

            try
            {
                var investments = await _pluggyService.GetClientInvestmentsAsync(
                    itemId, cancellationToken);
                var accounts = await _pluggyService.GetClientAccountsAsync(
                    itemId, cancellationToken);
                var loans = await _pluggyService.GetClientLoansAsync(
                    itemId, cancellationToken);
                var item = await _pluggyService.GetItemAsync(
                    itemId, cancellationToken);

                return Ok(new
                {
                    investments,
                    accounts,
                    loans,
                    item
                });
            }
            catch (HttpRequestException)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Não foi possível consultar os dados Open Finance na Pluggy."
                    });
            }
        }
    }
}