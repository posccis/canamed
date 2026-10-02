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

    public const string QueueCheckedIn = "queue.checked_in";
    public const string QueueCalled = "queue.called";
    public const string QueueStarted = "queue.started";
    public const string QueueCompleted = "queue.completed";
    public const string QueueLeft = "queue.left";
    public const string QueueCanceled = "queue.canceled";
    public const string AgendaDayClosed = "agenda.day_closed";

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

    public const string HealthPlanCreated = "health_plan.created";
    public const string HealthPlanUpdated = "health_plan.updated";
    public const string HealthPlanDeactivated = "health_plan.deactivated";
    public const string HealthPlanActivated = "health_plan.activated";
    public const string RoomCreated = "room.created";
    public const string RoomUpdated = "room.updated";
    public const string RoomDeactivated = "room.deactivated";
    public const string RoomActivated = "room.activated";
    public const string OperatingHoursReplaced = "operating_hours.replaced";
    public const string ClinicClosureCreated = "clinic_closure.created";
    public const string ClinicClosureRemoved = "clinic_closure.removed";

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

    public const string PaymentReceived = "payment.received";
    public const string PaymentRefunded = "payment.refunded";
    public const string TriageRecorded = "triage.recorded";
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
    public const string QueueEntries = "queue_entries";
    public const string Agenda = "agenda";
    public const string HealthPlans = "health_plans";
    public const string Rooms = "rooms";
    public const string OperatingHours = "operating_hours";
    public const string ClinicClosures = "clinic_closures";
    public const string Payments = "payments";
    public const string Triage = "triage";
}
