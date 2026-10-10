using hackatonxp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace hackatonxp.Api.Controllers
{
    [ApiController]
    [Route("api/pluggy")]
    [Authorize]
    public class PluggyController : ControllerBase
    {
        private readonly IPluggyService _pluggyService;

        public PluggyController(IPluggyService pluggyService)
        {
            _pluggyService = pluggyService;
        }

        [HttpGet("investments")]
        public async Task<IActionResult> GetInvestments(
            [FromQuery] string itemId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return BadRequest(new
                {
                    message = "O itemId é obrigatório."
                });
            }

            try
            {
                var investments =
                    await _pluggyService.GetClientInvestmentsAsync(
                        itemId,
                        cancellationToken);

                return Ok(investments);
            }
            catch (HttpRequestException)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Não foi possível consultar os investimentos na Pluggy."
                    });
            }
        }

        [HttpGet("accounts")]
        public async Task<IActionResult> GetAccounts(
            [FromQuery] string itemId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return BadRequest(new
                {
                    message = "O itemId é obrigatório."
                });
            }

            try
            {
                var accounts =
                    await _pluggyService.GetClientAccountsAsync(
                        itemId,
                        cancellationToken);

                return Ok(accounts);
            }
            catch (HttpRequestException)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Não foi possível consultar as contas na Pluggy."
                    });
            }
        }

        [HttpGet("loans")]
        public async Task<IActionResult> GetLoans(
            [FromQuery] string itemId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return BadRequest(new
                {
                    message = "O itemId é obrigatório."
                });
            }

            try
            {
                var loans =
                    await _pluggyService.GetClientLoansAsync(
                        itemId,
                        cancellationToken);

                return Ok(loans);
            }
            catch (HttpRequestException)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Não foi possível consultar os empréstimos na Pluggy."
                    });
            }
        }

        [HttpGet("item")]
        public async Task<IActionResult> GetItem(
            [FromQuery] string itemId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return BadRequest(new
                {
                    message = "O itemId é obrigatório."
                });
            }

            try
            {
                var item =
                    await _pluggyService.GetItemAsync(
                        itemId,
                        cancellationToken);

                return Ok(item);
            }
            catch (HttpRequestException)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Não foi possível consultar o item na Pluggy."
                    });
            }
        }

        [HttpPost("connect-token")]
        public async Task<IActionResult> CreateConnectToken(
            [FromBody] ConnectTokenRequest? body,
            CancellationToken cancellationToken)
        {
            try
            {
                var token =
                    await _pluggyService.CreateConnectTokenAsync(
                        body?.ItemId,
                        body?.ClientUserId,
                        cancellationToken);

                return Ok(token);
            }
            catch (HttpRequestException)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message = "Não foi possível gerar o connect token na Pluggy."
                    });
            }
        }

        public class ConnectTokenRequest
        {
            public string? ItemId { get; set; }
            public string? ClientUserId { get; set; }
        }
    }
}