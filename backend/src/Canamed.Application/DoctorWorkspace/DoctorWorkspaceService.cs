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

        if (!Guid.TryParse(actor.UserId, out var doctorId))
        {
            doctorId = Guid.Empty;
        }

        var now = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(now).DateTime);

        // Obter entradas da fila do dia para o médico
        var entries = await queueRepository.ListAsync(actor.ClinicId, today, doctorId, cancellationToken);

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
            DoctorId: doctorId,
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

    public async Task FinishConsultationAsync(
        FinishConsultationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        await medicalRecordService.FinalizeAsync(request.MedicalRecordId, cancellationToken);
        await queueService.CompleteAsync(request.QueueEntryId, cancellationToken);
    }
}
