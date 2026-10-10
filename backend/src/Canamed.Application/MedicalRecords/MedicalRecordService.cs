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

        var doctorId = actor.ProfessionalId
            ?? (Guid.TryParse(actor.UserId, out var parsedGuid) ? parsedGuid : Guid.Empty);

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

    public async Task<GynecologicalProfileDto> GetGynecologicalProfileAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar o perfil ginecológico.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var profile = await medicalRecordRepository.GetGynecologicalProfileAsync(patientId, actor.ClinicId, token);
            if (profile is null)
            {
                profile = GynecologicalProfile.Create(actor.ClinicId, patientId, now);
                await medicalRecordRepository.SaveGynecologicalProfileAsync(profile, token);
            }

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.GynecologicalProfileViewed,
                AuditResources.GynecologicalProfile,
                patientId.ToString(),
                now,
                $"{{\"patientId\":\"{patientId}\"}}"));

            return MapProfileToDto(profile);
        }, cancellationToken);
    }

    public async Task<GynecologicalProfileDto> UpdateGynecologicalProfileAsync(
        Guid patientId,
        UpdateGynecologicalProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para atualizar o perfil ginecológico.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var profile = await medicalRecordRepository.GetGynecologicalProfileAsync(patientId, actor.ClinicId, token);
            if (profile is null)
            {
                profile = GynecologicalProfile.Create(actor.ClinicId, patientId, now);
            }

            profile.Update(
                request.MenarcheAge,
                request.SexarcheAge,
                request.CycleIntervalDays,
                request.CycleDurationDays,
                request.IsCycleRegular,
                request.FlowIntensity,
                request.Dysmenorrhea,
                request.HasPms,
                request.PmsSymptoms,
                request.MenopauseStatus,
                request.MenopauseAge,
                request.HrtInUse,
                request.Gravida,
                request.Para,
                request.Cesareans,
                request.Abortions,
                request.LivingChildren,
                request.EctopicPregnancies,
                request.ObstetricNotes,
                request.CurrentMethod,
                request.CurrentMethodUsageMonths,
                request.PreviousMethods,
                request.ReproductivePlan,
                request.PelvicSurgeries,
                request.StiHistory,
                request.FamilyCancerHistory,
                now);

            await medicalRecordRepository.SaveGynecologicalProfileAsync(profile, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.GynecologicalProfileUpdated,
                AuditResources.GynecologicalProfile,
                patientId.ToString(),
                now,
                $"{{\"patientId\":\"{patientId}\"}}"));

            return MapProfileToDto(profile);
        }, cancellationToken);
    }

    public async Task<GynecologicalConsultationDataDto> GetGynecologicalConsultationDataAsync(
        Guid medicalRecordId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar dados da consulta ginecológica.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = await medicalRecordRepository.GetByIdAsync(medicalRecordId, actor.ClinicId, token);
            if (record is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Prontuário não encontrado", "O prontuário especificado não foi localizado.", "record-not-found");
            }

            var data = await medicalRecordRepository.GetGynecologicalConsultationDataAsync(medicalRecordId, token);
            if (data is null)
            {
                data = GynecologicalConsultationData.Create(medicalRecordId, now);
                await medicalRecordRepository.SaveGynecologicalConsultationDataAsync(data, token);
            }

            return MapGynecologicalData(data)!;
        }, cancellationToken);
    }

    public async Task<GynecologicalConsultationDataDto> UpdateGynecologicalConsultationDataAsync(
        Guid medicalRecordId,
        UpdateGynecologicalConsultationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para editar dados da consulta ginecológica.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = await medicalRecordRepository.GetByIdAsync(medicalRecordId, actor.ClinicId, token);
            if (record is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Prontuário não encontrado", "O prontuário especificado não foi localizado.", "record-not-found");
            }

            if (record.Status == MedicalRecordStatus.Finalizado)
            {
                throw new CanamedException(ProblemKind.Conflict, "Prontuário finalizado", "Este prontuário já foi finalizado e não permite alterações diretas.", "record-finalized");
            }

            var data = await medicalRecordRepository.GetGynecologicalConsultationDataAsync(medicalRecordId, token);
            if (data is null)
            {
                data = GynecologicalConsultationData.Create(medicalRecordId, now);
            }

            data.Update(
                request.Dum,
                request.IsDumUncertain,
                request.IsMenopausal,
                request.ChiefComplaint,
                request.Hma,
                request.IsSexuallyActive,
                request.Dyspareunia,
                request.BreastsIsNormal,
                request.BreastsFindings,
                request.AbdomenIsNormal,
                request.AbdomenFindings,
                request.ExternalGenitaliaIsNormal,
                request.ExternalGenitaliaFindings,
                request.SpeculumExamIsNormal,
                request.SpeculumExamFindings,
                request.BimanualPalpationIsNormal,
                request.BimanualPalpationFindings,
                request.ProcedurePerformed,
                request.ProcedureBatch,
                request.ProcedureNotes,
                request.DiagnosesJson,
                request.PrescriptionNotes,
                request.GeneralOrientationNotes,
                now);

            await medicalRecordRepository.SaveGynecologicalConsultationDataAsync(data, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.GynecologicalConsultationUpdated,
                AuditResources.MedicalRecords,
                medicalRecordId.ToString(),
                now,
                $"{{\"medicalRecordId\":\"{medicalRecordId}\"}}"));

            return MapGynecologicalData(data)!;
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<PreventiveScreeningDto>> ListScreeningsAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar exames preventivos.", "permission-denied");
        }

        var screenings = await medicalRecordRepository.ListScreeningsByPatientAsync(patientId, actor.ClinicId, cancellationToken);

        var now = timeProvider.GetUtcNow();
        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.ScreeningRecordViewed,
            AuditResources.PreventiveScreenings,
            patientId.ToString(),
            now,
            $"{{\"patientId\":\"{patientId}\",\"count\":{screenings.Count}}}"));
        await auditRepository.SaveChangesAsync(cancellationToken);

        return screenings.Select(MapScreeningToDto).ToList();
    }

    public async Task<PreventiveScreeningDto> AddScreeningAsync(
        Guid patientId,
        CreatePreventiveScreeningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para registrar exames preventivos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var screening = PreventiveScreeningRecord.Create(
                actor.ClinicId,
                patientId,
                request.MedicalRecordId,
                request.ExamType,
                request.PerformedAt,
                request.ResultSummary,
                request.Classification,
                request.NextDueDate,
                now);

            await medicalRecordRepository.AddScreeningAsync(screening, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.ScreeningRecordCreated,
                AuditResources.PreventiveScreenings,
                screening.Id.ToString(),
                now,
                $"{{\"patientId\":\"{patientId}\",\"examType\":\"{screening.ExamType}\"}}"));

            return MapScreeningToDto(screening);
        }, cancellationToken);
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
                a.CreatedAt)).ToList(),
            MapGynecologicalData(record.GynecologicalData));

    private static GynecologicalProfileDto MapProfileToDto(GynecologicalProfile p) =>
        new(
            p.Id,
            p.ClinicId,
            p.PatientId,
            p.MenarcheAge,
            p.SexarcheAge,
            p.CycleIntervalDays,
            p.CycleDurationDays,
            p.IsCycleRegular,
            p.FlowIntensity,
            p.Dysmenorrhea,
            p.HasPms,
            p.PmsSymptoms,
            p.MenopauseStatus,
            p.MenopauseAge,
            p.HrtInUse,
            p.Gravida,
            p.Para,
            p.Cesareans,
            p.Abortions,
            p.LivingChildren,
            p.EctopicPregnancies,
            p.ObstetricNotes,
            p.CurrentMethod,
            p.CurrentMethodUsageMonths,
            p.PreviousMethods,
            p.ReproductivePlan,
            p.PelvicSurgeries,
            p.StiHistory,
            p.FamilyCancerHistory,
            p.CreatedAt,
            p.UpdatedAt);

    private static PreventiveScreeningDto MapScreeningToDto(PreventiveScreeningRecord s) =>
        new(
            s.Id,
            s.ClinicId,
            s.PatientId,
            s.MedicalRecordId,
            s.ExamType,
            s.PerformedAt,
            s.ResultSummary,
            s.Classification,
            s.NextDueDate,
            s.CreatedAt);

    private static GynecologicalConsultationDataDto? MapGynecologicalData(GynecologicalConsultationData? data) =>
        data is null ? null : new(
            data.Id,
            data.MedicalRecordId,
            data.Dum,
            data.IsDumUncertain,
            data.IsMenopausal,
            data.ChiefComplaint,
            data.Hma,
            data.IsSexuallyActive,
            data.Dyspareunia,
            data.BreastsIsNormal,
            data.BreastsFindings,
            data.AbdomenIsNormal,
            data.AbdomenFindings,
            data.ExternalGenitaliaIsNormal,
            data.ExternalGenitaliaFindings,
            data.SpeculumExamIsNormal,
            data.SpeculumExamFindings,
            data.BimanualPalpationIsNormal,
            data.BimanualPalpationFindings,
            data.ProcedurePerformed,
            data.ProcedureBatch,
            data.ProcedureNotes,
            data.DiagnosesJson,
            data.PrescriptionNotes,
            data.GeneralOrientationNotes,
            data.CreatedAt,
            data.UpdatedAt);
}
