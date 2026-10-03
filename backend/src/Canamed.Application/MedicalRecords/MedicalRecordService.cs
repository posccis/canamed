using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalRecords;

namespace Canamed.Application.MedicalRecords;

public sealed class MedicalRecordService(
    IMedicalRecordRepository medicalRecordRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    public async Task<MedicalRecordResponse> StartOrGetRecordAsync(
        StartMedicalRecordRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para iniciar registros de prontuário.", "permission-denied");
        }

        if (!Guid.TryParse(actor.UserId, out var doctorId))
        {
            doctorId = Guid.Empty;
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            if (request.AppointmentId is { } apptId && apptId != Guid.Empty)
            {
                var existing = await medicalRecordRepository.GetByAppointmentIdAsync(apptId, actor.ClinicId, token);
                if (existing is not null)
                {
                    return MapToResponse(existing);
                }
            }

            var record = MedicalRecord.Create(actor.ClinicId, request.PatientId, doctorId, request.AppointmentId, now);
            await medicalRecordRepository.AddAsync(record, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalRecordCreated,
                AuditResources.MedicalRecords,
                record.Id.ToString(),
                now,
                $"{{\"patientId\":\"{record.PatientId}\",\"doctorId\":\"{record.DoctorId}\"}}"));

            return MapToResponse(record);
        }, cancellationToken);
    }

    public async Task<MedicalRecordResponse> UpdateDraftAsync(
        Guid recordId,
        UpdateDraftMedicalRecordRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsUpdate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para atualizar prontuários.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = await medicalRecordRepository.GetByIdAsync(recordId, actor.ClinicId, token);
            if (record is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Prontuário clínico não encontrado.", "record-not-found");
            }

            try
            {
                record.UpdateDraft(request.Subjective, request.Objective, request.Assessment, request.Plan, request.ClinicalNotes, now);
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Conflict, "Conflito de estado", ex.Message, "record-already-finalized");
            }

            await medicalRecordRepository.UpdateAsync(record, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalRecordDraftUpdated,
                AuditResources.MedicalRecords,
                record.Id.ToString(),
                now,
                $"{{\"status\":\"{record.Status}\"}}"));

            return MapToResponse(record);
        }, cancellationToken);
    }

    public async Task<MedicalRecordResponse> FinalizeAsync(
        Guid recordId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsFinalize))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para finalizar prontuários.", "permission-denied");
        }

        if (!Guid.TryParse(actor.UserId, out var doctorId))
        {
            doctorId = Guid.Empty;
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = await medicalRecordRepository.GetByIdAsync(recordId, actor.ClinicId, token);
            if (record is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Prontuário clínico não encontrado.", "record-not-found");
            }

            try
            {
                record.FinalizeRecord(doctorId, now);
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Validação clínica", ex.Message, "invalid-finalize");
            }

            await medicalRecordRepository.UpdateAsync(record, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalRecordFinalized,
                AuditResources.MedicalRecords,
                record.Id.ToString(),
                now,
                $"{{\"finalizedAt\":\"{record.FinalizedAt:O}\",\"finalizedBy\":\"{record.FinalizedBy}\"}}"));

            return MapToResponse(record);
        }, cancellationToken);
    }

    public async Task<MedicalRecordAddendumResponse> AddAddendumAsync(
        Guid recordId,
        AddAddendumRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsAddendum))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para adicionar adendos.", "permission-denied");
        }

        if (!Guid.TryParse(actor.UserId, out var doctorId))
        {
            doctorId = Guid.Empty;
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = await medicalRecordRepository.GetByIdAsync(recordId, actor.ClinicId, token);
            if (record is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Prontuário clínico não encontrado.", "record-not-found");
            }

            MedicalRecordAddendum addendum;
            try
            {
                addendum = record.AddAddendum(doctorId, request.Justification, request.Notes, now);
            }
            catch (ArgumentException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Dados inválidos", ex.Message, "invalid-addendum");
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Conflict, "Conflito", ex.Message, "record-not-finalized");
            }

            await medicalRecordRepository.UpdateAsync(record, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalRecordAddendumAdded,
                AuditResources.MedicalRecords,
                record.Id.ToString(),
                now,
                $"{{\"addendumId\":\"{addendum.Id}\"}}"));

            return new MedicalRecordAddendumResponse(
                addendum.Id,
                addendum.MedicalRecordId,
                addendum.DoctorId,
                addendum.Justification,
                addendum.Notes,
                addendum.CreatedAt);
        }, cancellationToken);
    }

    public async Task<MedicalRecordResponse> GetByIdAsync(
        Guid recordId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar prontuários.", "permission-denied");
        }

        var record = await medicalRecordRepository.GetByIdAsync(recordId, actor.ClinicId, cancellationToken);
        if (record is null)
        {
            throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Prontuário clínico não encontrado.", "record-not-found");
        }

        var now = timeProvider.GetUtcNow();
        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.MedicalRecordViewed,
            AuditResources.MedicalRecords,
            record.Id.ToString(),
            now,
            $"{{\"patientId\":\"{record.PatientId}\"}}"));
        await auditRepository.SaveChangesAsync(cancellationToken);

        return MapToResponse(record);
    }

    public async Task<IReadOnlyList<MedicalRecordResponse>> GetHistoryByPatientIdAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar o histórico clínico de pacientes.", "permission-denied");
        }

        var records = await medicalRecordRepository.GetHistoryByPatientIdAsync(patientId, actor.ClinicId, cancellationToken);

        var now = timeProvider.GetUtcNow();
        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.MedicalRecordViewed,
            AuditResources.MedicalRecords,
            patientId.ToString(),
            now,
            $"{{\"action\":\"history_viewed\",\"count\":{records.Count}}}"));
        await auditRepository.SaveChangesAsync(cancellationToken);

        return records.Select(MapToResponse).ToList();
    }

    private static MedicalRecordResponse MapToResponse(MedicalRecord record) =>
        new(
            record.Id,
            record.ClinicId,
            record.PatientId,
            record.DoctorId,
            record.AppointmentId,
            record.Status,
            record.Subjective,
            record.Objective,
            record.Assessment,
            record.Plan,
            record.ClinicalNotes,
            record.FinalizedAt,
            record.FinalizedBy,
            record.CreatedAt,
            record.UpdatedAt,
            record.Addenda.Select(a => new MedicalRecordAddendumResponse(
                a.Id,
                a.MedicalRecordId,
                a.DoctorId,
                a.Justification,
                a.Notes,
                a.CreatedAt)).ToList());
}
