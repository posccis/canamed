namespace Canamed.Application.Identity;

/// <summary>Pedido de autenticação por e-mail e senha (F-001).</summary>
public sealed record LoginRequest(string Email, string Password);

/// <summary>Resultado da primeira etapa do login.</summary>
public sealed record LoginResponse(
    bool MfaRequired,
    Guid? ChallengeId,
    string? SessionToken,
    SessionResponse? Session);

/// <summary>Conclusão do login com o código do segundo fator (F-002).</summary>
public sealed record MfaLoginRequest(Guid ChallengeId, string Code);

/// <summary>Dados públicos do usuário autenticado.</summary>
public sealed record SessionUserResponse(Guid Id, string Name, string Email);

/// <summary>Clínica vinculada ao usuário.</summary>
public sealed record ClinicSummary(Guid Id, string Name, string Role);

/// <summary>Sessão corrente: quem é o usuário, onde está e o que pode fazer.</summary>
public sealed record SessionResponse(
    SessionUserResponse User,
    Guid ClinicId,
    string ClinicName,
    string Role,
    IReadOnlyList<string> Permissions,
    Guid? ProfessionalId,
    bool MfaEnabled,
    bool MfaPending,
    IReadOnlyList<ClinicSummary> Clinics,
    DateTimeOffset ExpiresAt);

/// <summary>Troca da própria senha (RN-009).</summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

/// <summary>Troca da clínica ativa (F-006).</summary>
public sealed record SwitchClinicRequest(Guid ClinicId);

/// <summary>Segredo e URI para cadastro do segundo fator (F-003).</summary>
public sealed record MfaEnrollResponse(string Secret, string OtpAuthUri);

/// <summary>Ativação do segundo fator.</summary>
public sealed record MfaActivateRequest(string Code);

/// <summary>Desativação do segundo fator (exige a senha atual).</summary>
public sealed record MfaDisableRequest(string Password);

/// <summary>Criação de usuário pelo gestor (F-005).</summary>
public sealed record CreateUserRequest(
    string Name,
    string Email,
    string Password,
    string Role,
    Guid? ProfessionalId);

/// <summary>Usuário da clínica ativa, sem dados sensíveis (RN-018).</summary>
public sealed record UserResponse(
    Guid Id,
    string Name,
    string Email,
    string Role,
    Guid? ProfessionalId,
    bool IsActive,
    bool MfaEnabled,
    int ActiveSessions);

/// <summary>Redefinição de senha pelo gestor (F-005).</summary>
public sealed record ResetUserPasswordRequest(string NewPassword);
