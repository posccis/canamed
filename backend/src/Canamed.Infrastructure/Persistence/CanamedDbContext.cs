using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>
/// Contexto de acesso a dados do CANAMED. As entidades de domínio são adicionadas por suas SPECs.
/// </summary>
public sealed class CanamedDbContext(DbContextOptions<CanamedDbContext> options) : DbContext(options)
{
}
