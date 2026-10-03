using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Application.Privacy;
using Canamed.Domain.Auditing;
using Canamed.Domain.Privacy;

namespace Canamed.Application.DpoGovernance;

public sealed class DpoGovernanceService
{
    private readonly IPrivacyRepository _privacyRepository;
    private readonly IAuditRepository _auditRepository;
    private readonly ICurrentActorAccessor _actorAccessor;
    private readonly TimeProvider _timeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public DpoGovernanceService(
        IPrivacyRepository privacyRepository,
        IAuditRepository auditRepository,
        ICurrentActorAccessor actorAccessor,
        TimeProvider timeProvider,
        IUnitOfWork unitOfWork)
    {
        _privacyRepository = privacyRepository;
        _auditRepository = auditRepository;
        _actorAccessor = actorAccessor;
        _timeProvider = timeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<DpoOverviewDto> GetOverviewAsync(
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var requests = await _privacyRepository.ListRequestsByClinicAsync(clinicId, null, cancellationToken);

        var dtoList = requests.Select(r => MapRequest(r, now)).ToList();
        var pendingCount = dtoList.Count(r => r.Status is "Pending" or "UnderReview");
        var overdueCount = dtoList.Count(r => r.UrgencyLevel == "overdue");

        var ropa = GetStandardRopaActivities();

        return new DpoOverviewDto(clinicId, pendingCount, overdueCount, dtoList, ropa);
    }

    public async Task<DpoRequestItemDto> ProcessRequestAsync(
        DpoProcessRequestCommand command,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var request = await _privacyRepository.GetRequestByIdAsync(command.RequestId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Requisição LGPD não encontrada.", "PRIVACY_REQUEST_NOT_FOUND");

            if (string.IsNullOrWhiteSpace(command.ResponseNotes) || command.ResponseNotes.Length < 10)
            {
                throw new CanamedException(
                    ProblemKind.Validation,
                    "Parecer insuficiente",
                    "A resposta fundamentada do DPO deve conter no mínimo 10 caracteres e citar a base legal.",
                    "DPO_NOTES_TOO_SHORT");
            }

            var finalStatus = command.Status.ToLowerInvariant() == "rejected"
                ? PrivacyRequestStatus.Rejected
                : PrivacyRequestStatus.Completed;

            request.Respond(command.ResponseNotes, finalStatus, now);
            await _privacyRepository.UpdateRequestAsync(request, ct);

            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "DPO",
                "DpoRequestProcessed",
                "PrivacyRequest",
                request.Id.ToString(),
                now,
                $"{{\"status\":\"{finalStatus}\",\"protocol\":\"{request.Protocol}\"}}"));

            return MapRequest(request, now);
        }, cancellationToken);
    }

    private static DpoRequestItemDto MapRequest(PrivacyRequest r, DateTimeOffset now)
    {
        var remainingDays = (int)Math.Ceiling((r.DueDate - now).TotalDays);
        string urgency;
        if (r.Status is PrivacyRequestStatus.Completed or PrivacyRequestStatus.Rejected)
        {
            urgency = "resolved";
        }
        else if (remainingDays < 0)
        {
            urgency = "overdue";
        }
        else if (remainingDays <= 1)
        {
            urgency = "critical";
        }
        else if (remainingDays <= 5)
        {
            urgency = "warning";
        }
        else
        {
            urgency = "normal";
        }

        return new DpoRequestItemDto(
            r.Id,
            r.Protocol,
            r.ClinicId,
            r.PatientId,
            r.RequestType.ToString(),
            r.Details,
            r.Status.ToString(),
            r.ResponseNotes,
            r.DueDate,
            r.CompletedAt,
            r.CreatedAt,
            remainingDays,
            urgency);
    }

    private static List<RopaActivityDto> GetStandardRopaActivities() =>
    [
        new(
            "Agendamento e Recepção",
            "Gestão da agenda médica, triagem e controle de presença na clínica",
            "Execução de Contrato (Art. 7º, V) e Tutela da Saúde (Art. 7º, VIII)",
            "Nome, CPF, Telefone, Data de Nascimento, Convênio",
            "5 anos após o último contato administrativo",
            "Criptografia TLS 1.3, controle de acesso RBAC, trilha de auditoria"),
        new(
            "Prontuário Eletrônico do Paciente (PEP)",
            "Registro de consultas, anamnese SOAP, evolução clínica e diagnóstico",
            "Tutela da Saúde por profissionais médicos (Art. 11, II, 'f') e Cumprimento de Obrigação Legal (Art. 7º, II)",
            "Dados de saúde, sinais vitais, histórico patológico, alergias, CID-10",
            "20 anos a partir do último registro (Lei nº 13.787/2018 e CFM 1.821/2007)",
            "Imutabilidade de prontuário, adendos auditados, hash SHA-256 e controle restrito de acesso"),
        new(
            "Prescrição e Documentos Clínicos",
            "Emissão de receitas, atestados e pedidos de exame com assinatura digital",
            "Tutela da Saúde (Art. 11, II, 'f') e Art. 73 do Código de Ética Médica",
            "Posologia, medicamentos prescritos, CRM do médico, CID (sob consentimento)",
            "20 anos (integrado ao prontuário médico)",
            "Assinatura ICP-Brasil, token público de validação, proteção de CPF"),
        new(
            "Lembretes e Notificações Ativas",
            "Envio de lembretes pré-consulta via WhatsApp e SMS para redução de faltas",
            "Legítimo Interesse / Execução de Contrato com garantia de Opt-out (Art. 8º)",
            "Nome e Telefone de contato celular",
            "Durante a vigência do agendamento ou até revogação de consentimento",
            "Comunicação criptografada, mascaramento em logs")
    ];
}
