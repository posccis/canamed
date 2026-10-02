using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Queue;

namespace Canamed.Application.Queue;

public sealed class TriageService(
    ITriageRepository triageRepository,
    IQueueRepository queueRepository,
    IAuditRepository auditRepository,
    IAuditTrail auditTrail,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    public async Task<TriageRecordResponse> RecordTriageAsync(
        Guid queueEntryId,
        RecordTriageRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.TriageWrite))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para registrar triagem.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var entry = await queueRepository.FindAsync(actor.ClinicId, queueEntryId, token).ConfigureAwait(false);
                if (entry is null)
                {
                    throw await NotFoundAsync(actor, AuditResources.QueueEntries, queueEntryId, token).ConfigureAwait(false);
                }

                if (!entry.IsOpen)
                {
                    throw new CanamedException(
                        ProblemKind.Validation,
                        "Entrada da fila encerrada",
                        "Não é possível realizar triagem para um atendimento já finalizado ou cancelado.",
                        "queue-entry-closed");
                }

                if (!Guid.TryParse(actor.UserId, out var operatorId))
                {
                    operatorId = Guid.Empty;
                }

                var existing = await triageRepository.GetByQueueEntryIdAsync(queueEntryId, actor.ClinicId, token).ConfigureAwait(false);
                TriageRecord record;

                try
                {
                    if (existing is not null)
                    {
                        existing.Update(
                            operatorId,
                            actor.Name,
                            request.RiskClassification,
                            now,
                            request.BloodPressure,
                            request.HeartRate,
                            request.Temperature,
                            request.OxygenSaturation,
                            request.Glucose,
                            request.WeightKg,
                            request.HeightCm,
                            request.ChiefComplaint,
                            request.Allergies);

                        await triageRepository.UpdateAsync(existing, token).ConfigureAwait(false);
                        record = existing;
                    }
                    else
                    {
                        record = TriageRecord.Record(
                            actor.ClinicId,
                            queueEntryId,
                            entry.PatientId,
                            operatorId,
                            actor.Name,
                            request.RiskClassification,
                            now,
                            request.BloodPressure,
                            request.HeartRate,
                            request.Temperature,
                            request.OxygenSaturation,
                            request.Glucose,
                            request.WeightKg,
                            request.HeightCm,
                            request.ChiefComplaint,
                            request.Allergies);

                        await triageRepository.AddAsync(record, token).ConfigureAwait(false);
                    }
                }
                catch (ArgumentException ex)
                {
                    throw new CanamedException(
                        ProblemKind.Validation,
                        "Dados de triagem inválidos",
                        ex.Message,
                        "invalid-triage-data");
                }

                // Promoção de prioridade na fila em casos de alta gravidade (RN-002 da SPEC-0009)
                if (record.RiskClassification is RiskClassifications.Red or RiskClassifications.Orange or RiskClassifications.Yellow)
                {
                    entry.PromoteToPriority(QueuePriority.Preferential, now);
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.TriageRecorded,
                    AuditResources.Triage,
                    record.Id.ToString(),
                    now,
                    $"{{\"risk\":\"{record.RiskClassification}\",\"queueEntryId\":\"{queueEntryId}\"}}"));

                await queueRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(record);
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<TriageRecordResponse> GetTriageAsync(
        Guid queueEntryId,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.TriageRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para consultar triagem.", "permission-denied");
        }

        var entry = await queueRepository.FindAsync(actor.ClinicId, queueEntryId, cancellationToken).ConfigureAwait(false);
        if (entry is null)
        {
            throw await NotFoundAsync(actor, AuditResources.QueueEntries, queueEntryId, cancellationToken).ConfigureAwait(false);
        }

        var record = await triageRepository.GetByQueueEntryIdAsync(queueEntryId, actor.ClinicId, cancellationToken).ConfigureAwait(false);
        if (record is null)
        {
            throw new CanamedException(
                ProblemKind.NotFound,
                "Triagem não encontrada",
                "Nenhum registro de triagem encontrado para esta entrada da fila.",
                "triage-not-found");
        }

        return Map(record);
    }

    private static TriageRecordResponse Map(TriageRecord record) =>
        new(
            record.Id,
            record.QueueEntryId,
            record.PatientId,
            record.ClinicId,
            record.RiskClassification,
            record.BloodPressure,
            record.HeartRate,
            record.Temperature,
            record.OxygenSaturation,
            record.Glucose,
            record.WeightKg,
            record.HeightCm,
            record.CalculatedBmi,
            record.ChiefComplaint,
            record.Allergies,
            record.RecordedAt,
            record.OperatorName);

    private async Task<CanamedException> NotFoundAsync(
        CurrentActor actor,
        string resourceType,
        Guid resourceId,
        CancellationToken cancellationToken)
    {
        await auditTrail.RecordAsync(
            AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.ClinicAccessDenied,
                resourceType,
                resourceId.ToString(),
                timeProvider.GetUtcNow(),
                "{\"reason\":\"registro fora do escopo da clínica\"}"),
            cancellationToken).ConfigureAwait(false);

        return new CanamedException(
            ProblemKind.NotFound,
            "Registro não encontrado",
            "Registro não encontrado.",
            "resource-not-found");
    }
}
