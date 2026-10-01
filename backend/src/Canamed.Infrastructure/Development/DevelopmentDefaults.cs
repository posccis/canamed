namespace Canamed.Infrastructure.Development;

/// <summary>
/// Identificadores determinísticos dos dados sintéticos de desenvolvimento (ADR-0003).
/// Servem apenas para demonstração local: nunca representam dados reais de paciente.
/// </summary>
public static class DevelopmentDefaults
{
    /// <summary>Clínica de demonstração criada pelo semeador de desenvolvimento.</summary>
    public static Guid DemoClinicId { get; } = Guid.Parse("11111111-1111-4111-8111-111111111111");

    /// <summary>Profissional de demonstração.</summary>
    public static Guid DemoProfessionalId { get; } = Guid.Parse("22222222-2222-4222-8222-222222222222");

    /// <summary>Paciente sintético de demonstração.</summary>
    public static Guid DemoPatientId { get; } = Guid.Parse("33333333-3333-4333-8333-333333333333");

    /// <summary>Tipo de atendimento "Consulta" (30 minutos).</summary>
    public static Guid DemoConsultationTypeId { get; } = Guid.Parse("44444444-4444-4444-8444-444444444444");

    /// <summary>Tipo de atendimento "Retorno" (15 minutos).</summary>
    public static Guid DemoFollowUpTypeId { get; } = Guid.Parse("55555555-5555-4555-8555-555555555555");

    /// <summary>Tipo de atendimento "Avaliação" (60 minutos).</summary>
    public static Guid DemoAssessmentTypeId { get; } = Guid.Parse("66666666-6666-4666-8666-666666666666");

    /// <summary>Especialidade "Ortopedia".</summary>
    public static Guid DemoOrthopedicsSpecialtyId { get; } = Guid.Parse("77777777-7777-4777-8777-777777777777");

    /// <summary>Especialidade "Ginecologia".</summary>
    public static Guid DemoGynecologySpecialtyId { get; } = Guid.Parse("88888888-8888-4888-8888-888888888888");

    /// <summary>Especialidade "Clínica Geral".</summary>
    public static Guid DemoGeneralPracticeSpecialtyId { get; } = Guid.Parse("99999999-9999-4999-8999-999999999999");

    /// <summary>Tipo "Acompanhamento por convênio" (30 minutos).</summary>
    public static Guid DemoFollowUpHealthPlanTypeId { get; } = Guid.Parse("aaaaaaaa-1111-4111-8111-111111111111");

    /// <summary>Tipo "Avaliação ortopédica" (60 minutos).</summary>
    public static Guid DemoOrthopedicAssessmentTypeId { get; } = Guid.Parse("bbbbbbbb-2222-4222-8222-222222222222");
}
