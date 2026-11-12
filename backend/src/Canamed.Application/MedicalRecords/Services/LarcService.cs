using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalRecords;

namespace Canamed.Application.MedicalRecords.Services;

public sealed class LarcService(
    IMedicalRecordRepository recordRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    public async Task<LarcPlacementDto> CreateAsync(
        Guid patientId,
        CreateLarcPlacementRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para registrar procedimentos de LARC.", "permission-denied");
        }

        var batch = request.BatchNumber ?? request.LotNumber;
        if (string.IsNullOrWhiteSpace(batch))
        {
            throw new CanamedException(ProblemKind.Validation, "Lote obrigatório", "O número do lote do dispositivo é obrigatório.", "invalid-batch");
        }

        var deviceName = !string.IsNullOrWhiteSpace(request.DeviceName)
            ? request.DeviceName
            : ResolveDeviceName(request.DeviceType);

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = LarcPlacementRecord.Create(
                actor.ClinicId,
                patientId,
                request.MedicalRecordId,
                request.DeviceType,
                deviceName,
                batch,
                request.InsertionDate == default ? DateOnly.FromDateTime(now.DateTime) : request.InsertionDate,
                request.HysterometryCm,
                request.ProcedureNotes ?? request.Notes,
                now);

            await recordRepository.AddLarcPlacementAsync(record, token).ConfigureAwait(false);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                "larc_placement_created",
                "larc_placement",
                record.Id.ToString(),
                now,
                $"{{{{\"patientId\":\"{patientId}\",\"deviceType\":\"{record.DeviceType}\",\"expirationDate\":\"{record.ExpirationDate}\"}}"));

            return MapToDto(record);
        }, cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<LarcPlacementDto>> ListByPatientAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar histórico de LARCs.", "permission-denied");
        }

        var list = await recordRepository.ListLarcPlacementsByPatientAsync(patientId, actor.ClinicId, cancellationToken).ConfigureAwait(false);
        return list.Select(MapToDto).ToList();
    }

    public async Task<LarcPlacementDto> RemoveAsync(
        Guid patientId,
        Guid id,
        RemoveLarcPlacementRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate) && !actor.Has(Permissions.RecordsUpdate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para registrar remoção de LARC.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var record = await recordRepository.GetLarcPlacementByIdAsync(id, actor.ClinicId, token).ConfigureAwait(false);
            if (record is null || record.PatientId != patientId)
            {
                throw new CanamedException(ProblemKind.NotFound, "Registro não encontrado", "O registro de LARC informado não foi localizado.", "larc-not-found");
            }

            record.MarkAsRemoved(request.RemovalDate, request.RemovalReason, now);
            await recordRepository.UpdateLarcPlacementAsync(record, token).ConfigureAwait(false);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                "larc_placement_removed",
                "larc_placement",
                record.Id.ToString(),
                now,
                $"{{{{\"patientId\":\"{patientId}\",\"removalDate\":\"{request.RemovalDate}\"}}"));

            return MapToDto(record);
        }, cancellationToken).ConfigureAwait(false);
    }

    private static string ResolveDeviceName(string deviceType) =>
        deviceType.ToLowerInvariant() switch
        {
            "mirena" => "DIU Hormonal Mirena 52mg",
            "kyleena" => "DIU Hormonal Kyleena 19.5mg",
            "diu_cobre" => "DIU de Cobre TCu 380A",
            "diu_prata" => "DIU de Cobre com Prata",
            "implanon" => "Implante Subdérmico Implanon NXT 68mg",
            _ => deviceType
        };

    private static LarcPlacementDto MapToDto(LarcPlacementRecord r) =>
        new(
            r.Id,
            r.ClinicId,
            r.PatientId,
            r.MedicalRecordId,
            r.DeviceType,
            r.DeviceName,
            r.BatchNumber,
            r.InsertionDate,
            r.ExpirationDate,
            r.ControlUltrasoundDate,
            r.HysterometryCm,
            r.ProcedureNotes,
            r.IsRemoved,
            r.RemovalDate,
            r.RemovalReason,
            r.CreatedAt,
            r.UpdatedAt);
}
