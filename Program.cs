using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using hackatonxp.Application.Interfaces;
using hackatonxp.Infrastructure.Repositories;
using hackatonxp.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers e Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description = "Cole apenas o token JWT (sem o prefixo 'Bearer ')."
    });

    options.AddSecurityRequirement(_ => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", null),
            new List<string>()
        }
    });
});

// Configuração do banco de dados
var postgres = builder.Configuration.GetConnectionString("Postgres");

var allowInMemory =
    builder.Configuration["HACKATONXP_ALLOW_INMEMORY"]
    ?? Environment.GetEnvironmentVariable("HACKATONXP_ALLOW_INMEMORY");

if (!string.IsNullOrWhiteSpace(postgres))
{
    builder.Services.AddDbContext<
        hackatonxp.Infrastructure.Data.HackatonXpDbContext>(
        options => options.UseNpgsql(postgres));
}
else if (string.Equals(
    allowInMemory,
    "true",
    StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddDbContext<
        hackatonxp.Infrastructure.Data.HackatonXpDbContext>(
        options => options.UseInMemoryDatabase("HackatonXp_InMemory"));
}
else
{
    throw new InvalidOperationException(
        "Connection string do PostgreSQL não configurada. " +
        "Configure ConnectionStrings__Postgres ou " +
        "HACKATONXP_ALLOW_INMEMORY=true para desenvolvimento local.");
}

// Serviços de clientes
builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IClientRepository,
    hackatonxp.Infrastructure.Repositories.ClientRepository>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IClientService,
    hackatonxp.Application.Services.ClientService>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IClientOverviewService,
    hackatonxp.Application.Services.ClientOverviewService>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.ICpfService,
    hackatonxp.Application.Services.CpfService>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IPortfolioSummaryService,
    hackatonxp.Application.Services.PortfolioSummaryService>();

// Integração com a Pluggy
builder.Services.AddHttpClient<IPluggyService, PluggyService>(client =>
{
    client.BaseAddress = new Uri("https://api.pluggy.ai/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Serviços de autenticação e assessores
builder.Services.AddScoped<
    hackatonxp.Infrastructure.Repositories.IAdvisorRepository,
    hackatonxp.Infrastructure.Repositories.AdvisorRepository>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IPasswordHasher,
    hackatonxp.Infrastructure.Services.PasswordHasherService>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IAdvisorService,
    hackatonxp.Application.Services.AdvisorService>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IAuthService,
    hackatonxp.Application.Services.AuthService>();

builder.Services.AddScoped<
    hackatonxp.Application.Interfaces.IJwtService,
    hackatonxp.Infrastructure.Services.JwtService>();

// Configuração da autenticação JWT
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET");

if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "Chave JWT não configurada. Defina JWT_SECRET " +
        "ou Jwt:Secret antes de iniciar a API.");
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "hackatonxp";
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? "hackatonxp_clients";

var signingKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(jwtSecret));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Inicialização e seed de dados
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<
        hackatonxp.Infrastructure.Data.HackatonXpDbContext>();

    var provider = db.Database.ProviderName;

    if (provider?.Contains("InMemory") == true)
    {
        db.Database.EnsureCreated();

        hackatonxp.Infrastructure.Seed.DataSeeder
            .EnsureSeedData(db);
    }
    else
    {
        Console.WriteLine(
            "PostgreSQL configurado. Execute 'dotnet ef database update' " +
            "para aplicar as migrations antes de utilizar a aplicação.");
    }

    // Criação opcional do administrador inicial
    var createAdmin =
        Environment.GetEnvironmentVariable("HACKATONXP_CREATE_ADMIN");

    var adminEmail =
        Environment.GetEnvironmentVariable("HACKATONXP_ADMIN_EMAIL");

    var adminPassword =
        Environment.GetEnvironmentVariable("HACKATONXP_ADMIN_PASSWORD");

    if (string.Equals(
            createAdmin,
            "true",
            StringComparison.OrdinalIgnoreCase)
        && !string.IsNullOrWhiteSpace(adminEmail)
        && !string.IsNullOrWhiteSpace(adminPassword))
    {
        var advisorRepo = scope.ServiceProvider
            .GetRequiredService<
                hackatonxp.Infrastructure.Repositories.IAdvisorRepository>();

        var hasher = scope.ServiceProvider
            .GetRequiredService<
                hackatonxp.Application.Interfaces.IPasswordHasher>();

        var existing = advisorRepo
            .GetByEmailAsync(adminEmail)
            .GetAwaiter()
            .GetResult();

        if (existing is null)
        {
            var advisor = new hackatonxp.Domain.Entities.Advisor
            {
                Id = Guid.NewGuid(),
                Name = "Initial Admin",
                Email = adminEmail,
                PasswordHash = hasher.HashPassword(adminPassword),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            advisorRepo
                .AddAsync(advisor)
                .GetAwaiter()
                .GetResult();

            Console.WriteLine(
                $"Administrador inicial criado: {adminEmail}");
        }
    }
}

// Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();