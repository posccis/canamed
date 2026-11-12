using Canamed.Domain.MedicalRecords;
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
    public async Task<DoctorWorkspaceStateResponse> GetWorkspaceStateAsync(
        Guid? requestedRecordId = null,
        Guid? requestedPatientId = null,
        Guid? requestedAppointmentId = null,
        CancellationToken cancellationToken = default)
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
        var entries = (await queueRepository.ListAsync(actor.ClinicId, today, targetDoctorId, cancellationToken)).ToList();

        // Se não houver atendimento ativo para o médico atual (ou se for admin/gestor/permissão de agenda),
        // busca na fila geral da clínica para capturar qualquer consulta em andamento
        if (!entries.Any(e => e.Status == QueueStatus.InService) &&
            (actor.Role == Roles.Admin || actor.Role == Roles.Manager || actor.Has(Permissions.AgendaRead) || entries.Count == 0))
        {
            var clinicEntries = await queueRepository.ListAsync(actor.ClinicId, today, null, cancellationToken);
            if (clinicEntries.Any(e => e.Status == QueueStatus.InService) || entries.Count == 0)
            {
                entries = clinicEntries.ToList();
            }
        }

        ActiveConsultationDto? activeConsultation = null;
        var waitingList = new List<DoctorWaitingItemDto>();
        QueueEntry? activeEntry = null;

        // Caso 0: O médico solicitou explicitamente um atendimento (via recordId ou patientId)
        if (requestedRecordId is { } reqRecId && reqRecId != Guid.Empty)
        {
            var targetDraft = await medicalRecordRepository.GetByIdAsync(reqRecId, actor.ClinicId, cancellationToken);
            if (targetDraft is not null)
            {
                if (targetDraft.AppointmentId is { } apptId)
                {
                    activeEntry = await queueRepository.FindOpenByAppointmentAsync(actor.ClinicId, apptId, cancellationToken);
                }

                var patient = await catalogRepository.FindPatientAsync(targetDraft.PatientId, actor.ClinicId, cancellationToken);
                var recordDto = await medicalRecordService.GetByIdAsync(targetDraft.Id, cancellationToken);

                activeConsultation = new ActiveConsultationDto(
                    QueueEntryId: activeEntry?.Id ?? Guid.Empty,
                    PatientId: targetDraft.PatientId,
                    PatientName: patient?.Name ?? "Paciente",
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: null,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: null,
                    MedicalRecord: recordDto,
                    StartedAt: targetDraft.CreatedAt,
                    PatientBloodType: patient?.BloodType,
                    PatientRhFactor: patient?.RhFactor);
            }
        }
        else if (requestedPatientId is { } reqPatId && reqPatId != Guid.Empty)
        {
            var allInService = await queueRepository.ListInServiceAsync(actor.ClinicId, null, cancellationToken);
            activeEntry = allInService.FirstOrDefault(e => e.PatientId == reqPatId);

            var history = await medicalRecordRepository.GetHistoryByPatientIdAsync(reqPatId, actor.ClinicId, cancellationToken);
            var targetDraft = history.FirstOrDefault(r => r.Status == MedicalRecordStatus.EmAndamento);

            if (targetDraft is not null || activeEntry is not null)
            {
                var patient = await catalogRepository.FindPatientAsync(reqPatId, actor.ClinicId, cancellationToken);
                MedicalRecordResponse? recordDto = null;
                if (targetDraft is not null)
                {
                    recordDto = await medicalRecordService.GetByIdAsync(targetDraft.Id, cancellationToken);
                }

                TriageRecordResponse? triageDto = null;
                if (activeEntry is not null)
                {
                    var triage = await triageRepository.GetByQueueEntryIdAsync(activeEntry.Id, actor.ClinicId, cancellationToken);
                    if (triage is not null)
                    {
                        triageDto = new TriageRecordResponse(
                            triage.Id, triage.QueueEntryId, triage.PatientId, triage.ClinicId,
                            triage.RiskClassification, triage.BloodPressure, triage.HeartRate,
                            triage.Temperature, triage.OxygenSaturation, triage.Glucose,
                            triage.WeightKg, triage.HeightCm, triage.CalculatedBmi,
                            triage.ChiefComplaint, triage.Allergies, triage.RecordedAt, triage.OperatorName);
                    }
                }

                activeConsultation = new ActiveConsultationDto(
                    QueueEntryId: activeEntry?.Id ?? Guid.Empty,
                    PatientId: reqPatId,
                    PatientName: patient?.Name ?? "Paciente",
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: triageDto?.Allergies,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: triageDto,
                    MedicalRecord: recordDto,
                    StartedAt: activeEntry?.StartedAt ?? targetDraft?.CreatedAt,
                    PatientBloodType: patient?.BloodType,
                    PatientRhFactor: patient?.RhFactor);
            }
        }
        else if (requestedAppointmentId is { } reqApptId && reqApptId != Guid.Empty)
        {
            activeEntry = await queueRepository.FindOpenByAppointmentAsync(actor.ClinicId, reqApptId, cancellationToken);
            Guid? patId = activeEntry?.PatientId;
            MedicalRecord? targetDraft = null;

            if (patId.HasValue)
            {
                var history = await medicalRecordRepository.GetHistoryByPatientIdAsync(patId.Value, actor.ClinicId, cancellationToken);
                targetDraft = history.FirstOrDefault(r => r.AppointmentId == reqApptId || r.Status == MedicalRecordStatus.EmAndamento);
            }

            if (targetDraft is not null || activeEntry is not null)
            {
                var resolvedPatId = patId ?? targetDraft?.PatientId ?? Guid.Empty;
                var patient = resolvedPatId != Guid.Empty
                    ? await catalogRepository.FindPatientAsync(resolvedPatId, actor.ClinicId, cancellationToken)
                    : null;

                MedicalRecordResponse? recordDto = null;
                if (targetDraft is not null)
                {
                    recordDto = await medicalRecordService.GetByIdAsync(targetDraft.Id, cancellationToken);
                }

                TriageRecordResponse? triageDto = null;
                if (activeEntry is not null)
                {
                    var triage = await triageRepository.GetByQueueEntryIdAsync(activeEntry.Id, actor.ClinicId, cancellationToken);
                    if (triage is not null)
                    {
                        triageDto = new TriageRecordResponse(
                            triage.Id, triage.QueueEntryId, triage.PatientId, triage.ClinicId,
                            triage.RiskClassification, triage.BloodPressure, triage.HeartRate,
                            triage.Temperature, triage.OxygenSaturation, triage.Glucose,
                            triage.WeightKg, triage.HeightCm, triage.CalculatedBmi,
                            triage.ChiefComplaint, triage.Allergies, triage.RecordedAt, triage.OperatorName);
                    }
                }

                activeConsultation = new ActiveConsultationDto(
                    QueueEntryId: activeEntry?.Id ?? Guid.Empty,
                    PatientId: resolvedPatId,
                    PatientName: patient?.Name ?? "Paciente",
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: triageDto?.Allergies,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: triageDto,
                    MedicalRecord: recordDto,
                    StartedAt: activeEntry?.StartedAt ?? targetDraft?.CreatedAt,
                    PatientBloodType: patient?.BloodType,
                    PatientRhFactor: patient?.RhFactor,
                    AppointmentId: reqApptId);
            }
        }

        // Caso 1: Se não foi solicitado explicitamente, busca na fila do dia ou nos atendimentos em andamento mais recentes
        if (activeConsultation is null)
        {
            activeEntry = entries.FirstOrDefault(e => e.Status == QueueStatus.InService);

            if (activeEntry is null)
            {
                var clinicInService = await queueRepository.ListInServiceAsync(actor.ClinicId, null, cancellationToken);
                if (clinicInService.Count > 0)
                {
                    activeEntry = clinicInService.FirstOrDefault(e => targetDoctorId != null && e.ProfessionalId == targetDoctorId.Value)
                        ?? (actor.Role == Roles.Admin || actor.Role == Roles.Manager || actor.Has(Permissions.AgendaRead) ? clinicInService.First() : null);
                }
            }

            if (activeEntry is null)
            {
                activeEntry = entries.FirstOrDefault(e => e.Status == QueueStatus.Called);
            }

            if (activeEntry is not null)
            {
                var patient = await catalogRepository.FindPatientAsync(activeEntry.PatientId, actor.ClinicId, cancellationToken);
                var patientName = patient?.Name ?? "Paciente";

                var triage = await triageRepository.GetByQueueEntryIdAsync(activeEntry.Id, actor.ClinicId, cancellationToken);
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

                MedicalRecordResponse? recordDto = null;
                if (activeEntry.AppointmentId is { } apptId)
                {
                    var record = await medicalRecordRepository.GetByAppointmentIdAsync(apptId, actor.ClinicId, cancellationToken);
                    if (record is not null)
                    {
                        recordDto = await medicalRecordService.GetByIdAsync(record.Id, cancellationToken);
                    }
                }

                if (recordDto is null)
                {
                    var history = await medicalRecordRepository.GetHistoryByPatientIdAsync(activeEntry.PatientId, actor.ClinicId, cancellationToken);
                    var draft = history.FirstOrDefault(r => r.Status == MedicalRecordStatus.EmAndamento);
                    if (draft is not null)
                    {
                        recordDto = await medicalRecordService.GetByIdAsync(draft.Id, cancellationToken);
                    }
                }

                activeConsultation = new ActiveConsultationDto(
                    QueueEntryId: activeEntry.Id,
                    PatientId: activeEntry.PatientId,
                    PatientName: patientName,
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: triage?.Allergies,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: triageDto,
                    MedicalRecord: recordDto,
                    StartedAt: activeEntry.StartedAt,
                    PatientBloodType: patient?.BloodType,
                    PatientRhFactor: patient?.RhFactor);
            }
        }

        // Caso 2: Se ainda não há activeConsultation, verifica se há prontuário em andamento pendente
        if (activeConsultation is null)
        {
            var pendingDrafts = await medicalRecordRepository.ListPendingDraftsAsync(actor.ClinicId, targetDoctorId, cancellationToken);
            if (pendingDrafts.Count == 0 && (actor.Role == Roles.Admin || actor.Role == Roles.Manager || actor.Has(Permissions.AgendaRead)))
            {
                pendingDrafts = await medicalRecordRepository.ListPendingDraftsAsync(actor.ClinicId, null, cancellationToken);
            }
            var targetDraft = pendingDrafts.FirstOrDefault();

            if (targetDraft is not null)
            {
                var patient = await catalogRepository.FindPatientAsync(targetDraft.PatientId, actor.ClinicId, cancellationToken);
                var recordDto = await medicalRecordService.GetByIdAsync(targetDraft.Id, cancellationToken);

                QueueEntry? queueEntry = null;
                if (targetDraft.AppointmentId is { } apptId)
                {
                    queueEntry = await queueRepository.FindOpenByAppointmentAsync(actor.ClinicId, apptId, cancellationToken);
                }

                activeConsultation = new ActiveConsultationDto(
                    QueueEntryId: queueEntry?.Id ?? Guid.Empty,
                    PatientId: targetDraft.PatientId,
                    PatientName: patient?.Name ?? "Paciente",
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: null,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: null,
                    MedicalRecord: recordDto,
                    StartedAt: targetDraft.CreatedAt);
            }
        }

        // 2. Monta a lista de espera com os demais pacientes em aberto
        foreach (var entry in entries.Where(e => e.IsOpen && e.Status != QueueStatus.Completed && e.Id != activeEntry?.Id)
                     .OrderBy(e => e.Priority == QueuePriority.Preferential ? 0 : 1).ThenBy(e => e.ArrivedAt))
        {
            var patient = await catalogRepository.FindPatientAsync(entry.PatientId, actor.ClinicId, cancellationToken);
            var patientName = patient?.Name ?? "Paciente";
            var triage = await triageRepository.GetByQueueEntryIdAsync(entry.Id, actor.ClinicId, cancellationToken);

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
            var state = await GetWorkspaceStateAsync(null, null, cancellationToken: cancellationToken);
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
            if (existingQueueEntry.Status == QueueStatus.InService)
            {
                var medicalRecord = await medicalRecordService.StartOrGetRecordAsync(
                    new StartMedicalRecordRequest(existingQueueEntry.PatientId, existingQueueEntry.AppointmentId),
                    cancellationToken);

                var triage = await triageRepository.GetByQueueEntryIdAsync(existingQueueEntry.Id, actor.ClinicId, cancellationToken);
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

                var patient = await catalogRepository.FindPatientAsync(existingQueueEntry.PatientId, actor.ClinicId, cancellationToken);

                return new ActiveConsultationDto(
                    QueueEntryId: existingQueueEntry.Id,
                    PatientId: existingQueueEntry.PatientId,
                    PatientName: patient?.Name ?? "Paciente",
                    PatientBirthDate: patient?.BirthDate,
                    Allergies: triage?.Allergies,
                    ChronicConditions: null,
                    HealthPlanName: null,
                    Triage: triageDto,
                    MedicalRecord: medicalRecord,
                    StartedAt: existingQueueEntry.StartedAt);
            }

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

        if (appointments.Count == 0 && (actor.Role == Roles.Admin || actor.Role == Roles.Manager || actor.Has(Permissions.AgendaRead)))
        {
            appointments = await agendaRepository.ListAppointmentsAsync(
                actor.ClinicId,
                null,
                fromUtc,
                toUtc,
                cancellationToken);
        }

        var todayTotal = appointments.Count;
        var todayAttended = appointments.Count(a => a.Status == AppointmentStatus.Attended);
        var todayNoShow = appointments.Count(a => a.Status == AppointmentStatus.NoShow);

        var queueEntries = await queueRepository.ListAsync(actor.ClinicId, todayLocal, targetDoctorId, cancellationToken);
        var todayWaiting = queueEntries.Count(q => q.Status == QueueStatus.Waiting || q.Status == QueueStatus.Called);

        var pendingDrafts = await medicalRecordRepository.CountPendingDraftsAsync(actor.ClinicId, targetDoctorId, cancellationToken);

        var workspaceState = await GetWorkspaceStateAsync(null, null, cancellationToken: cancellationToken);

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
