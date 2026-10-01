using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Text;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Convenções de nomenclatura do banco (snake_case), exigidas pela seção 7 da SPEC-0001.</summary>
internal static class ModelBuilderExtensions
{
    /// <summary>Renomeia todas as colunas mapeadas para snake_case.</summary>
    public static void ApplySnakeCaseColumnNames(this ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entityType.GetTableName();

            if (tableName is null)
            {
                continue;
            }

            var storeObject = StoreObjectIdentifier.Table(tableName, entityType.GetSchema());

            foreach (var property in entityType.GetProperties())
            {
                var columnName = property.GetColumnName(storeObject);

                if (columnName is not null)
                {
                    property.SetColumnName(ToSnakeCase(property.Name));
                }
            }
        }
    }

    internal static string ToSnakeCase(string value)
    {
        var builder = new StringBuilder(value.Length + 8);

        for (var index = 0; index < value.Length; index++)
        {
            var character = value[index];

            if (char.IsUpper(character))
            {
                if (index > 0 && (!char.IsUpper(value[index - 1]) || (index + 1 < value.Length && char.IsLower(value[index + 1]))))
                {
                    builder.Append('_');
                }

                builder.Append(char.ToLowerInvariant(character));
            }
            else
            {
                builder.Append(character);
            }
        }

        return builder.ToString();
    }
}
