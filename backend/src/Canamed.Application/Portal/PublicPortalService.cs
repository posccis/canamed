using System.Globalization;
using Canamed.Application.Abstractions;
using Canamed.Application.Clinics;
using Canamed.Application.Errors;
using Canamed.Application.Kiosk;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;
using Canamed.Domain.Portal;

namespace Canamed.Application.Portal;

/// <summary>
/// Superfície pública do paciente em *path*: resolve a clínica pelo slug e opera os links
/// tokenizados de confirmação, cancelamento, check-in e fila (SPEC-0026).
/// </summary>
public sealed class PublicPortalService(
    IPublicPortalRepository publicPortalRepository,
    IAgendaRepository agendaRepository,
    IQueueRepository queueRepository,
    ITriageRepository triageRepository,
    ICatalogRepository catalogRepository,
    IClinicPolicyRepository policyRepository,
    KioskCheckInService kioskCheckInService,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork)
{
    /// <summary>Validade padrão de cada escopo, quando o emissor não informa outra.</summary>
    private static readonly Dictionary<CapabilityScope, TimeSpan> DefaultValidity = new()
    {
        [CapabilityScope.Confirm] = TimeSpan.FromDays(3),
        [CapabilityScope.Cancel] = TimeSpan.FromDays(3),
        [CapabilityScope.Reschedule] = TimeSpan.FromDays(3),
        [CapabilityScope.CheckIn] = TimeSpan.FromHours(24),
        [CapabilityScope.Queue] = TimeSpan.FromHours(12),
        [CapabilityScope.Registration] = TimeSpan.FromDays(7),
        [CapabilityScope.Document] = TimeSpan.FromDays(30),
        [CapabilityScope.WaitlistOffer] = TimeSpan.FromHours(24),
    };

    /// <summary>Metadados públicos da clínica pelo slug do link (SPEC-0026/RN-003).</summary>
    public async Task<PublicClinicMetaResponse> GetClinicBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new CanamedException(ProblemKind.NotFound, "Clínica não encontrada", "Verifique o link recebido.", "public-slug-not-found");
        }

        var clinic = await publicPortalRepository.FindClinicBySlugAsync(slug.Trim(), cancellationToken).ConfigureAwait(false)
            ?? throw new CanamedException(ProblemKind.NotFound, "Clínica não encontrada", "Verifique o link recebido.", "public-slug-not-found");

        var specialties = await catalogRepository.ListSpecialtiesAsync(clinic.Id, cancellationToken).ConfigureAwait(false);
        var professionals = await catalogRepository.ListProfessionalsAsync(clinic.Id, cancellationToken).ConfigureAwait(false);
        var appointmentTypes = await catalogRepository.ListAppointmentTypesAsync(clinic.Id, cancellationToken).ConfigureAwait(false);

        return new PublicClinicMetaResponse(
            clinic.Id,
            clinic.Slug,
            clinic.Name,
            clinic.DisplayName,
            HelpPhone: null,
            clinic.AllowWaitlist,
            clinic.AllowSelfReschedule,
            [.. specialties.Where(s => s.IsActive).Select(s => new PublicSpecialtyItem(s.Id, s.Name))],
            [.. professionals.Where(p => p.IsActive).Select(p => new PublicProfessionalItem(p.Id, p.Name, p.SpecialtyId))],
            [.. appointmentTypes.Where(t => t.IsActive).Select(t => new PublicAppointmentTypeItem(t.Id, t.Name, t.DurationMinutes))]);
    }

    /// <summary>Resolve um token de capacidade e devolve o mínimo necessário para a tela (RN-006).</summary>
    public async Task<CapabilityResolutionResponse> ResolveAsync(
        string rawToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var token = await RequireUsableTokenAsync(rawToken, now, cancellationToken).ConfigureAwait(false);
        var clinic = await RequireClinicAsync(token.ClinicId, cancellationToken).ConfigureAwait(false);

        CapabilityAppointmentSummary? appointment = null;
        string? ticketCode = null;
        string? documentType = null;
        string? patientNameMasked = null;

        if (token.AppointmentId is { } appointmentId)
        {
            var entity = await agendaRepository.FindAppointmentAsync(appointmentId, token.ClinicId, cancellationToken).ConfigureAwait(false);
            if (entity is not null)
            {
                var professional = await catalogRepository.FindProfessionalAsync(token.ClinicId, entity.ProfessionalId, cancellationToken).ConfigureAwait(false);
                var type = await catalogRepository.FindAppointmentTypeAsync(token.ClinicId, entity.AppointmentTypeId, cancellationToken).ConfigureAwait(false);

                appointment = new CapabilityAppointmentSummary(
                    entity.StartsAt,
                    professional?.Name ?? "Profissional",
                    type?.Name ?? "Consulta",
                    AppointmentStatusMap.ToStoredValue(entity.Status));
            }
        }

        if (token.QueueEntryId is { } queueEntryId)
        {
            var entry = await queueRepository.FindAsync(token.ClinicId, queueEntryId, cancellationToken).ConfigureAwait(false);
            ticketCode = entry?.TicketCode;
        }

        if (token.PatientId is { } patientId)
        {
            var patient = await catalogRepository.FindPatientAsync(patientId, token.ClinicId, cancellationToken).ConfigureAwait(false);
            patientNameMasked = patient is null ? null : MaskName(patient.Name);
        }

        auditRepository.Add(AuditEvent.Record(
            token.ClinicId,
            "public_link",
            "Link público",
            "CapabilityLinkOpened",
            "patient_capability_tokens",
            token.Id.ToString(),
            now,
            $"{{\"scope\":\"{token.Scope.ToStoredValue()}\"}}"));
        await auditRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new CapabilityResolutionResponse(
            token.Scope.ToStoredValue(),
            token.Status.ToStoredValue(),
            clinic.Id,
            clinic.Slug,
            clinic.DisplayName,
            patientNameMasked,
            token.ExpiresAt,
            appointment,
            ticketCode,
            documentType);
    }

    /// <summary>Confirmação de presença em um clique; idempotente e sem dado clínico (RN-012).</summary>
    public async Task ConfirmAsync(string rawToken, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        var token = await RequireUsableTokenAsync(rawToken, now, cancellationToken).ConfigureAwait(false);
        if (token.Scope != CapabilityScope.Confirm || token.AppointmentId is not { } appointmentId)
        {
            throw InvalidLink();
        }

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var appointment = await agendaRepository.FindAppointmentAsync(appointmentId, token.ClinicId, ct).ConfigureAwait(false)
                ?? throw InvalidLink();

            if (appointment.Status is AppointmentStatus.Scheduled)
            {
                appointment.Confirm(now);
            }

            token.Consume(now);

            auditRepository.Add(AuditEvent.Record(
                token.ClinicId,
                token.PatientId?.ToString() ?? "public_link",
                "Link público",
                "AppointmentConfirmedByLink",
                "appointments",
                appointment.Id.ToString(),
                now,
                "{\"channel\":\"link\"}"));

            return true;
        }, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Cancelamento autônomo com desafio de identidade e política da clínica (RN-013).</summary>
    public async Task CancelAsync(
        string rawToken,
        string? reason,
        string? answer,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var token = await RequireUsableTokenAsync(rawToken, now, cancellationToken).ConfigureAwait(false);
        if (token.Scope != CapabilityScope.Cancel || token.AppointmentId is not { } appointmentId)
        {
            throw InvalidLink();
        }

        await VerifyChallengeAsync(token, answer, cancellationToken).ConfigureAwait(false);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var appointment = await agendaRepository.FindAppointmentAsync(appointmentId, token.ClinicId, ct).ConfigureAwait(false)
                ?? throw InvalidLink();

            var policy = await policyRepository.GetByClinicIdAsync(token.ClinicId, ct).ConfigureAwait(false);
            var minimumNotice = policy?.MinHoursNoticeForFreeCancellation ?? 2;
            if (appointment.StartsAt < now.AddHours(minimumNotice))
            {
                throw new CanamedException(
                    ProblemKind.Conflict,
                    "Cancelamento fora do prazo",
                    $"Cancelamentos com menos de {minimumNotice} horas devem ser feitos pela recepção.",
                    "cancel-window-closed");
            }

            appointment.Cancel(string.IsNullOrWhiteSpace(reason) ? "Cancelado pelo paciente via link" : reason.Trim(), now);

            var queueEntry = await queueRepository.FindOpenByAppointmentAsync(token.ClinicId, appointmentId, ct).ConfigureAwait(false);
            if (queueEntry is not null && queueEntry.IsOpen)
            {
                queueEntry.CancelFromAgenda(now);
            }

            await RevokeAppointmentTokensAsync(token, appointmentId, now, ct).ConfigureAwait(false);
            token.Consume(now);

            auditRepository.Add(AuditEvent.Record(
                token.ClinicId,
                token.PatientId?.ToString() ?? "public_link",
                "Link público",
                "AppointmentCancelledByLink",
                "appointments",
                appointmentId.ToString(),
                now,
                "{\"channel\":\"link\"}"));

            return true;
        }, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Check-in digital por link/QR Code, reutilizando as regras do totem (RN-009).</summary>
    public async Task<CapabilityCheckInResponse> CheckInAsync(
        string rawToken,
        bool isPreferential,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var token = await RequireUsableTokenAsync(rawToken, now, cancellationToken).ConfigureAwait(false);
        if (token.Scope != CapabilityScope.CheckIn || token.AppointmentId is not { } appointmentId)
        {
            throw InvalidLink();
        }

        var result = await kioskCheckInService
            .ConfirmKioskCheckInAsync(
                new KioskConfirmCheckInRequest(token.ClinicId, appointmentId, isPreferential, "mobile_qrcode"),
                now,
                cancellationToken)
            .ConfigureAwait(false);

        string? queuePath = null;

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            token.Consume(now);

            var (queueToken, queueEntity) = PatientCapabilityToken.Issue(
                token.ClinicId,
                CapabilityScope.Queue,
                now.Add(DefaultValidity[CapabilityScope.Queue]),
                now,
                patientId: token.PatientId,
                appointmentId: appointmentId,
                queueEntryId: result.QueueEntryId,
                createdBy: "system");

            publicPortalRepository.AddToken(queueEntity);

            var clinic = await RequireClinicAsync(token.ClinicId, ct).ConfigureAwait(false);
            queuePath = BuildPath(CapabilityScope.Queue, clinic.Slug, queueToken);

            auditRepository.Add(AuditEvent.Record(
                token.ClinicId,
                token.PatientId?.ToString() ?? "public_link",
                "Link público",
                "CapabilityTokenUsed",
                "patient_capability_tokens",
                token.Id.ToString(),
                now,
                $"{{\"scope\":\"check_in\",\"ticket\":\"{result.TicketCode}\"}}"));

            return true;
        }, cancellationToken).ConfigureAwait(false);

        return new CapabilityCheckInResponse(
            result.TicketCode,
            result.Priority,
            result.PositionInQueue,
            result.ProfessionalName,
            queuePath);
    }

    /// <summary>Etapa do atendimento exibida ao paciente, sem classificação de risco (RN-011).</summary>
    public async Task<CapabilityQueueStatusResponse> GetQueueStatusAsync(
        string rawToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var token = await RequireUsableTokenAsync(rawToken, now, cancellationToken).ConfigureAwait(false);
        if (token.Scope != CapabilityScope.Queue || token.QueueEntryId is not { } queueEntryId)
        {
            throw InvalidLink();
        }

        var entry = await queueRepository.FindAsync(token.ClinicId, queueEntryId, cancellationToken).ConfigureAwait(false)
            ?? throw InvalidLink();

        var triage = await triageRepository.GetByQueueEntryIdAsync(queueEntryId, token.ClinicId, cancellationToken).ConfigureAwait(false);
        var professional = await catalogRepository.FindProfessionalAsync(token.ClinicId, entry.ProfessionalId, cancellationToken).ConfigureAwait(false);

        var dayEntries = await queueRepository.ListAsync(token.ClinicId, entry.QueueDate, entry.ProfessionalId, cancellationToken).ConfigureAwait(false);
        var position = QueueOrdering.PositionOf(QueueOrdering.Sort(dayEntries), entry) ?? 0;

        var (stage, label, message) = ProjectStage(entry, triage is not null, position, professional?.Name);
        var estimatedWait = entry.Status == QueueStatus.Waiting ? Math.Max(position - 1, 0) * 15 : 0;

        return new CapabilityQueueStatusResponse(
            entry.TicketCode ?? "—",
            stage,
            label,
            message,
            position,
            estimatedWait,
            professional?.Name,
            null,
            now);
    }

    /// <summary>Emite um link tokenizado para envio ao paciente (Central de Links e mensageria).</summary>
    public async Task<IssueCapabilityLinkResponse> IssueLinkAsync(
        Guid clinicId,
        IssueCapabilityLinkRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!Enum.TryParse<CapabilityScope>(request.Scope?.Replace("_", string.Empty, StringComparison.Ordinal), ignoreCase: true, out var scope))
        {
            throw new CanamedException(ProblemKind.Validation, "Escopo inválido", "O escopo do link não é reconhecido.", "capability-invalid-scope");
        }

        var clinic = await RequireClinicAsync(clinicId, cancellationToken).ConfigureAwait(false);

        Guid? patientId = request.PatientId;
        if (request.AppointmentId is { } appointmentId)
        {
            var appointment = await agendaRepository.FindAppointmentAsync(appointmentId, clinicId, cancellationToken).ConfigureAwait(false)
                ?? throw new CanamedException(ProblemKind.NotFound, "Agendamento não encontrado", "O agendamento informado não existe na clínica.", "appointment-not-found");
            patientId ??= appointment.PatientId;
        }

        var validity = request.ExpiresInHours is { } hours and > 0
            ? TimeSpan.FromHours(hours)
            : DefaultValidity[scope];

        var (rawToken, entity) = PatientCapabilityToken.Issue(
            clinicId,
            scope,
            now.Add(validity),
            now,
            patientId,
            request.AppointmentId,
            request.QueueEntryId,
            request.MedicalDocumentId,
            string.IsNullOrWhiteSpace(request.CreatedBy) ? "reception" : request.CreatedBy.Trim());

        publicPortalRepository.AddToken(entity);
        await publicPortalRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        auditRepository.Add(AuditEvent.Record(
            clinicId,
            entity.CreatedBy,
            entity.CreatedBy,
            "CapabilityTokenCreated",
            "patient_capability_tokens",
            entity.Id.ToString(),
            now,
            $"{{\"scope\":\"{scope.ToStoredValue()}\",\"appointmentId\":\"{request.AppointmentId}\"}}"));
        await auditRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new IssueCapabilityLinkResponse(
            rawToken,
            BuildPath(scope, clinic.Slug, rawToken),
            scope.ToStoredValue(),
            entity.ExpiresAt);
    }

    private async Task<PatientCapabilityToken> RequireUsableTokenAsync(
        string rawToken,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            throw InvalidLink();
        }

        var hash = PatientCapabilityToken.Hash(rawToken.Trim());
        var token = await publicPortalRepository.FindTokenByHashAsync(hash, cancellationToken).ConfigureAwait(false)
            ?? throw InvalidLink();

        if (!token.IsUsable(now))
        {
            if (token.Status == CapabilityTokenStatus.Active)
            {
                token.Expire(now);
                await publicPortalRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            throw InvalidLink();
        }

        return token;
    }

    private async Task<Clinic> RequireClinicAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        var clinic = await publicPortalRepository.FindClinicAsync(clinicId, cancellationToken).ConfigureAwait(false);
        return clinic ?? throw InvalidLink();
    }

    private async Task VerifyChallengeAsync(PatientCapabilityToken token, string? answer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(answer) || token.PatientId is not { } patientId)
        {
            throw new CanamedException(
                ProblemKind.Forbidden,
                "Não foi possível confirmar seus dados",
                "Tente novamente ou fale com a recepção.",
                "patient-identity-challenge-failed");
        }

        var patient = await catalogRepository.FindPatientAsync(patientId, token.ClinicId, cancellationToken).ConfigureAwait(false);
        if (patient is null)
        {
            throw InvalidLink();
        }

        var normalized = new string([.. answer.Where(char.IsAsciiDigit)]);
        var cpfDigits = new string([.. (patient.Document ?? string.Empty).Where(char.IsAsciiDigit)]);
        var firstThree = cpfDigits.Length >= 3 ? cpfDigits[..3] : cpfDigits;
        var birthYear = patient.BirthDate?.Year.ToString(CultureInfo.InvariantCulture);

        var matches = (firstThree.Length == 3 && normalized == firstThree)
            || (!string.IsNullOrEmpty(birthYear) && normalized == birthYear);

        if (!matches)
        {
            throw new CanamedException(
                ProblemKind.Forbidden,
                "Não foi possível confirmar seus dados",
                "Tente novamente ou fale com a recepção.",
                "patient-identity-challenge-failed");
        }
    }

    private async Task RevokeAppointmentTokensAsync(
        PatientCapabilityToken current,
        Guid appointmentId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var others = await publicPortalRepository
            .ListActiveTokensForAppointmentAsync(current.ClinicId, appointmentId, cancellationToken)
            .ConfigureAwait(false);

        foreach (var other in others)
        {
            if (other.Id != current.Id)
            {
                other.Revoke(now);
            }
        }
    }

    private static (string Stage, string Label, string Message) ProjectStage(
        QueueEntry entry,
        bool hasTriage,
        int position,
        string? professionalName)
    {
        var who = string.IsNullOrWhiteSpace(professionalName) ? "o(a) profissional" : professionalName;

        return entry.Status switch
        {
            QueueStatus.Waiting when !hasTriage => (
                "aguardando_triagem",
                "Aguardando triagem",
                position > 0 ? $"Você é o {position}º da fila de triagem." : "Recebemos sua chegada."),
            QueueStatus.Waiting => (
                "aguardando_profissional",
                "Aguardando o(a) profissional",
                $"Seu atendimento será com {who}."),
            QueueStatus.Called => (
                "chamado",
                "É a sua vez",
                "É a sua vez! Dirija-se à sala indicada pela recepção."),
            QueueStatus.InService => ("em_atendimento", "Em atendimento", $"Você está em atendimento com {who}."),
            QueueStatus.Completed => ("atendido", "Atendimento concluído", "Atendimento concluído. Consulte seus documentos."),
            QueueStatus.Left => ("desistiu", "Consulta não realizada", "Este atendimento não foi realizado. Fale com a recepção."),
            QueueStatus.Canceled => ("cancelado", "Consulta cancelada", "Este atendimento foi cancelado. Fale com a recepção."),
            _ => ("aguardando", "Aguardando", "Acompanhe por aqui a sua posição."),
        };
    }

    private static string BuildPath(CapabilityScope scope, string slug, string token)
    {
        var encodedToken = Uri.EscapeDataString(token);
        var basePath = $"/p/{Uri.EscapeDataString(slug)}";

        return scope switch
        {
            CapabilityScope.Confirm => $"{basePath}/c/{encodedToken}/confirmar",
            CapabilityScope.Cancel => $"{basePath}/c/{encodedToken}/cancelar",
            CapabilityScope.Reschedule => $"{basePath}/c/{encodedToken}/remarcar",
            CapabilityScope.CheckIn => $"{basePath}/check-in/{encodedToken}",
            CapabilityScope.Queue => $"{basePath}/fila/{encodedToken}",
            CapabilityScope.Registration => $"{basePath}/cadastro/{encodedToken}",
            CapabilityScope.Document => $"{basePath}/documentos/{encodedToken}",
            CapabilityScope.WaitlistOffer => $"{basePath}/fila-espera/{encodedToken}",
            _ => $"{basePath}/c/{encodedToken}",
        };
    }

    private static string MaskName(string fullName)
    {
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length <= 1)
        {
            return parts.Length == 0 ? "Paciente" : parts[0][..1] + "***";
        }

        return $"{parts[0]} {parts[^1][..1]}***";
    }

    private static CanamedException InvalidLink() =>
        new(
            ProblemKind.NotFound,
            "Este link não está mais disponível",
            "Fale com a recepção ou abra Meus atendimentos.",
            "capability-token-rejected");
}
