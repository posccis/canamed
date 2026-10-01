namespace Canamed.Application.Auditing;

/// <summary>Ações registradas na trilha de auditoria (seção 17 da SPEC-0002).</summary>
public static class AuditActions
{
    public const string AppointmentCreated = "appointment.created";
    public const string AppointmentRescheduled = "appointment.rescheduled";
    public const string AppointmentCancelled = "appointment.cancelled";
    public const string AppointmentAttended = "appointment.attended";
    public const string AppointmentNoShow = "appointment.no_show";
    public const string ProfessionalBlockCreated = "professional_block.created";
    public const string ProfessionalBlockRemoved = "professional_block.removed";
    public const string ClinicAccessDenied = "clinic.access_denied";

    public const string SpecialtyCreated = "specialty.created";
    public const string SpecialtyUpdated = "specialty.updated";
    public const string SpecialtyDeactivated = "specialty.deactivated";
    public const string SpecialtyActivated = "specialty.activated";
    public const string AppointmentTypeCreated = "appointment_type.created";
    public const string AppointmentTypeUpdated = "appointment_type.updated";
    public const string AppointmentTypeDeactivated = "appointment_type.deactivated";
    public const string AppointmentTypeActivated = "appointment_type.activated";
    public const string ProfessionalUpdated = "professional.updated";
    public const string ProfessionalCreated = "professional.created";
    public const string ProfessionalDeactivated = "professional.deactivated";
    public const string ProfessionalActivated = "professional.activated";
    public const string PatientCreated = "patient.created";
    public const string PatientUpdated = "patient.updated";
    public const string PatientDeactivated = "patient.deactivated";
    public const string PatientActivated = "patient.activated";

    public const string LoginSucceeded = "auth.login_succeeded";
    public const string LoginFailed = "auth.login_failed";
    public const string LoginBlocked = "auth.login_blocked";
    public const string MfaChallengeIssued = "auth.mfa_challenge_issued";
    public const string MfaFailed = "auth.mfa_failed";
    public const string MfaEnabled = "auth.mfa_enabled";
    public const string MfaDisabled = "auth.mfa_disabled";
    public const string Logout = "auth.logout";
    public const string PasswordChanged = "auth.password_changed";
    public const string ClinicSwitched = "auth.clinic_switched";
    public const string UserCreated = "user.created";
    public const string UserPasswordReset = "user.password_reset";
    public const string UserDeactivated = "user.deactivated";
    public const string UserSessionsRevoked = "user.sessions_revoked";
}

/// <summary>Tipos de recurso da trilha de auditoria.</summary>
public static class AuditResources
{
    public const string Appointments = "appointments";
    public const string ProfessionalBlocks = "professional_blocks";
    public const string Users = "users";
    public const string UserSessions = "user_sessions";
    public const string Authorization = "authorization";
    public const string Specialties = "specialties";
    public const string AppointmentTypes = "appointment_types";
    public const string Professionals = "professionals";
    public const string Patients = "patients";
}
