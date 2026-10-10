using System;
using System.Threading;
using System.Threading.Tasks;
using hackatonxp.Application.DTOs;
using hackatonxp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace hackatonxp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdvisorsController : ControllerBase
    {
        private readonly IAdvisorService _advisorService;
        private readonly IPortfolioSummaryService _portfolioSummaryService;

        public AdvisorsController(
            IAdvisorService advisorService,
            IPortfolioSummaryService portfolioSummaryService)
        {
            _advisorService = advisorService;
            _portfolioSummaryService = portfolioSummaryService;
        }

        // Public registration controlled by environment flag
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AdvisorCreateDto dto)
        {
            var allow = Environment.GetEnvironmentVariable("HACKATONXP_ALLOW_ADVISOR_REGISTRATION");
            

            var created = await _advisorService.CreateAsync(dto);
            return CreatedAtAction(nameof(Me), new { id = created.Id }, created);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var sub = User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var id))
                return Unauthorized();

            var dto = await _advisorService.GetByIdAsync(id);
            if (dto is null) return NotFound();
            return Ok(dto);
        }

        [Authorize]
        [HttpGet("me/portfolio-summary")]
        public async Task<IActionResult> PortfolioSummary(
            CancellationToken cancellationToken)
        {
            var sub = User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var id))
                return Unauthorized();

            var summary = await _portfolioSummaryService.GetForAdvisorAsync(
                id, cancellationToken);

            return Ok(summary);
        }
    }
}
