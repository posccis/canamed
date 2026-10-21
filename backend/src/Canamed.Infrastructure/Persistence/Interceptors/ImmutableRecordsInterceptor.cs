using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalDocuments;
using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Canamed.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Interceptor do EF Core que impede a exclusão física (DELETE) de prontuários médicos,
/// adendos, dados de consultas ginecológicas, documentos médicos e eventos de auditoria (RN-002, SPEC-0034).
/// Atende às exigências de guarda mínima de 20 anos da Lei nº 13.787/2018 e Resoluções CFM nº 1.821/2007 e 2.217/2018.
/// </summary>
public sealed class ImmutableRecordsInterceptor : SaveChangesInterceptor
{
    public const string DeletionBlockedMessage =
        "Registros clínicos e trilhas de auditoria são imutáveis e não podem ser excluídos (Lei nº 13.787/2018 e CFM 1.821/2007).";

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        ValidateNoImmutableDeletions(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ValidateNoImmutableDeletions(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void ValidateNoImmutableDeletions(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Deleted && IsImmutableEntity(entry.Entity))
            {
                throw new InvalidOperationException(DeletionBlockedMessage);
            }
        }
    }

    public static bool IsImmutableEntity(object entity) =>
        entity is MedicalRecord
            or MedicalRecordAddendum
            or GynecologicalConsultationData
            or MedicalDocument
            or AuditEvent;
}
