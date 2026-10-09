using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Application.MedicalRecords;
using Canamed.Application.Queue;
using Canamed.Domain.Agenda;
using Canamed.Domain.Queue;

namespace Canamed.Application.DoctorWorkspace;

public sealed class DoctorWorkspaceService(
    IQueueRepository queueRepository,
    QueueService queueService,
    IAgendaRepository agendaRepository,
    IClinicOperationRepository clinicOperationRepository,
    ITriageRepository triageRepository,
    ICatalogRepository catalogRepository,
    IMedicalRecordRepository medicalRecordRepository,
    MedicalRecordService medicalRecordService,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    public async Task<DoctorWorkspaceStateResponse> GetWorkspaceStateAsync(CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.WorkspaceAccess))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para acessar o consultório virtual.", "permission-denied");
        }

        var targetDoctorId = actor.ProfessionalId
            ?? (Guid.TryParse(actor.UserId, out var parsedGuid) ? parsedGuid : (Guid?)null);

        var now = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(now).DateTime);

        // Obter entradas da fila do dia para o médico (ou para a clínica se não for médico específico)
        var entries = await queueRepository.ListAsync(actor.ClinicId, today, targetDoctorId, cancellationToken);

        ActiveConsultationDto? activeConsultation = null;
        var waitingList = new List<DoctorWaitingItemDto>();

        foreach (var entry in entries.OrderBy(e => e.Priority == QueuePriority.Preferential ? 0 : 1).ThenBy(e => e.ArrivedAt))
        {
            var patient = await catalogRepository.FindPatientAsync(entry.PatientId, actor.ClinicId, cancellationToken);
            var patientName = patient?.Name ?? "Paciente";

            var triage = await triageRepository.GetByQueueEntryIdAsync(entry.Id, actor.ClinicId, cancellationToken);
            TriageRecordResponse? triageDto = triage is null ? null : new TriageRecordResponse(
                triage.Id,
                triage.QueueEntryId,
                triage.PatientId,
                triage.ClinicId,
                triage.RiskClassification,
                triage.BloodPressure,
                triage.HeartRate,
                triage.Temperature,
                triage.OxygenSaturation,
                triage.Glucose,
                triage.WeightKg,
                triage.HeightCm,
                triage.CalculatedBmi,
                triage.ChiefComplaint,
                triage.Allergies,
                triage.RecordedAt,
                triage.OperatorName);

            if (entry.Status == QueueStatus.InService || (entry.Status == QueueStatus.Called && activeConsultation is null))
            {
                MedicalRecordResponse? recordDto = null;
                if (entry.AppointmentId is { } apptId)
                {
                    var record = await medicalRecordRepository.GetByAppointmentIdAsync(apptId, actor.ClinicId, cancellationToken);
                    if (record is not null)
                    {
                        recordDto = await medicalRecordService.GetByIdAsync(record.Id, cancellationToken);
                    }
                }

                activeConsultation = new ActiveConsultationDto(
                    QueueEntryId: entry.Id,
                    PatientId: entry.PatientId,
                    PatientName: patientName,
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: triage?.Allergies,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: triageDto,
                    MedicalRecord: recordDto,
                    StartedAt: entry.StartedAt);
            }
            else if (entry.IsOpen && entry.Status != QueueStatus.Completed)
            {
                var waitingTimeMinutes = (int)Math.Max(0, (now - entry.ArrivedAt).TotalMinutes);
                waitingList.Add(new DoctorWaitingItemDto(
                    entry.Id,
                    entry.PatientId,
                    patientName,
                    entry.Priority == QueuePriority.Preferential ? "preferencial" : "normal",
                    entry.Status.ToString().ToLowerInvariant(),
                    triage?.RiskClassification,
                    waitingTimeMinutes,
                    entry.ArrivedAt,
                    entry.AppointmentId));
            }
        }

        return new DoctorWorkspaceStateResponse(
            DoctorId: targetDoctorId ?? Guid.Empty,
            DoctorName: actor.Name,
            ClinicId: actor.ClinicId,
            ActiveRoomId: null,
            ActiveRoomName: null,
            ActiveConsultation: activeConsultation,
            WaitingQueue: waitingList);
    }

    public async Task<QueueEntryResponse> CallPatientAsync(
        CallNextPatientRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.WorkspaceAccess))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para chamar pacientes.", "permission-denied");
        }

        Guid entryId;
        if (request.QueueEntryId is { } id && id != Guid.Empty)
        {
            entryId = id;
        }
        else
        {
            var state = await GetWorkspaceStateAsync(cancellationToken);
            var next = state.WaitingQueue.FirstOrDefault();
            if (next is null)
            {
                throw new CanamedException(ProblemKind.Validation, "Fila vazia", "Não há pacientes aguardando na sua fila no momento.", "empty-queue");
            }
            entryId = next.QueueEntryId;
        }

        return await queueService.CallAsync(entryId, cancellationToken);
    }

    public async Task<ActiveConsultationDto> StartConsultationAsync(
        StartConsultationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.WorkspaceAccess))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para iniciar consultas.", "permission-denied");
        }

        var queueEntry = await queueService.StartAsync(request.QueueEntryId, cancellationToken);

        var medicalRecord = await medicalRecordService.StartOrGetRecordAsync(
            new StartMedicalRecordRequest(queueEntry.PatientId, queueEntry.AppointmentId),
            cancellationToken);

        var triage = await triageRepository.GetByQueueEntryIdAsync(request.QueueEntryId, actor.ClinicId, cancellationToken);
        TriageRecordResponse? triageDto = triage is null ? null : new TriageRecordResponse(
            triage.Id,
            triage.QueueEntryId,
            triage.PatientId,
            triage.ClinicId,
            triage.RiskClassification,
            triage.BloodPressure,
            triage.HeartRate,
            triage.Temperature,
            triage.OxygenSaturation,
            triage.Glucose,
            triage.WeightKg,
            triage.HeightCm,
            triage.CalculatedBmi,
            triage.ChiefComplaint,
            triage.Allergies,
            triage.RecordedAt,
            triage.OperatorName);

        var patient = await catalogRepository.FindPatientAsync(queueEntry.PatientId, actor.ClinicId, cancellationToken);

        return new ActiveConsultationDto(
            QueueEntryId: queueEntry.Id,
            PatientId: queueEntry.PatientId,
            PatientName: patient?.Name ?? "Paciente",
            PatientBirthDate: patient?.BirthDate,
            Allergies: triage?.Allergies,
            ChronicConditions: null,
            HealthPlanName: null,
            Triage: triageDto,
            MedicalRecord: medicalRecord,
            StartedAt: queueEntry.StartedAt);
    }

    public async Task<ActiveConsultationDto> StartConsultationByAppointmentAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.WorkspaceAccess))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para iniciar consultas.", "permission-denied");
        }

        var appointment = await agendaRepository.FindAppointmentAsync(appointmentId, actor.ClinicId, cancellationToken);
        if (appointment is null)
        {
            throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Agendamento não encontrado.", "appointment-not-found");
        }

        var existingQueueEntry = await queueRepository.FindOpenByAppointmentAsync(actor.ClinicId, appointmentId, cancellationToken);
        Guid queueEntryId;

        if (existingQueueEntry is not null)
        {
            queueEntryId = existingQueueEntry.Id;
        }
        else
        {
            var checkIn = await queueService.CheckInAsync(
                new CheckInRequest(
                    AppointmentId: appointmentId,
                    PatientId: null,
                    ProfessionalId: null,
                    Priority: null),
                cancellationToken);
            queueEntryId = checkIn.Id;
        }

        return await StartConsultationAsync(new StartConsultationRequest(queueEntryId), cancellationToken);
    }

    public async Task<DoctorDashboardSummaryResponse> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.WorkspaceAccess) && !actor.Has(Permissions.DashboardRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para acessar o painel do médico.", "permission-denied");
        }

        var targetDoctorId = actor.ProfessionalId
            ?? (Guid.TryParse(actor.UserId, out var parsedGuid) ? parsedGuid : (Guid?)null);

        var now = timeProvider.GetUtcNow();
        var todayLocal = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(now).DateTime);
        var (fromUtc, toUtc) = AgendaTimeZone.LocalDayToUtcRange(todayLocal);

        var appointments = await agendaRepository.ListAppointmentsAsync(
            actor.ClinicId,
            targetDoctorId,
            fromUtc,
            toUtc,
            cancellationToken);

        var todayTotal = appointments.Count;
        var todayAttended = appointments.Count(a => a.Status == AppointmentStatus.Attended);
        var todayNoShow = appointments.Count(a => a.Status == AppointmentStatus.NoShow);

        var queueEntries = await queueRepository.ListAsync(actor.ClinicId, todayLocal, targetDoctorId, cancellationToken);
        var todayWaiting = queueEntries.Count(q => q.Status == QueueStatus.Waiting || q.Status == QueueStatus.Called);

        var pendingDrafts = await medicalRecordRepository.CountPendingDraftsAsync(actor.ClinicId, targetDoctorId, cancellationToken);

        var workspaceState = await GetWorkspaceStateAsync(cancellationToken);

        var upcoming = new List<DoctorDashboardAppointmentDto>();
        foreach (var appt in appointments.OrderBy(a => a.StartsAt))
        {
            var patient = await catalogRepository.FindPatientAsync(appt.PatientId, actor.ClinicId, cancellationToken);
            var patientName = patient?.Name ?? "Paciente";

            var apptType = await catalogRepository.FindAppointmentTypeAsync(appt.AppointmentTypeId, actor.ClinicId, cancellationToken);
            var typeName = apptType?.Name ?? "Consulta Médica";
            var category = apptType?.Category switch
            {
                AppointmentCategory.FollowUp => "retorno",
                AppointmentCategory.Single => "primeira_vez",
                _ => "geral"
            };

            string? roomName = null;
            if (appt.RoomId is { } roomId)
            {
                var room = await clinicOperationRepository.FindRoomAsync(actor.ClinicId, roomId, cancellationToken);
                roomName = room?.Name;
            }

            upcoming.Add(new DoctorDashboardAppointmentDto(
                AppointmentId: appt.Id,
                PatientId: appt.PatientId,
                PatientName: patientName,
                StartsAt: appt.StartsAt,
                EndsAt: appt.EndsAt,
                Status: appt.Status.ToString().ToLowerInvariant(),
                AppointmentTypeName: typeName,
                ConsultationCategory: category,
                RoomName: roomName));
        }

        return new DoctorDashboardSummaryResponse(
            TodayTotalAppointments: todayTotal,
            TodayWaitingCount: todayWaiting,
            TodayAttendedCount: todayAttended,
            TodayNoShowCount: todayNoShow,
            PendingDraftRecordsCount: pendingDrafts,
            ActiveConsultation: workspaceState.ActiveConsultation,
            UpcomingAppointments: upcoming);
    }

    public async Task FinishConsultationAsync(
        FinishConsultationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        await medicalRecordService.FinalizeAsync(request.MedicalRecordId, cancellationToken);

        if (request.QueueEntryId != Guid.Empty)
        {
            try
            {
                await queueService.CompleteAsync(request.QueueEntryId, cancellationToken);
            }
            catch (Exception)
            {
                // Se a entrada da fila já foi concluída ou removida, preserva o encerramento do prontuário
            }
        }
    }
}
