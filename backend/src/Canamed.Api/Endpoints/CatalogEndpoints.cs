using Canamed.Api.Authorization;
using Canamed.Application.Catalog;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>
/// Catálogo assistencial da clínica (seção 8 da SPEC-0004): especialidades, tipos de consulta com
/// natureza e custeio, profissionais e pacientes.
/// </summary>
public static class CatalogEndpoints
{
    private static readonly string[] CatalogReadPermissions =
    [
        Permissions.AgendaRead,
        Permissions.AgendaReadOwn,
        Permissions.AgendaWrite,
        Permissions.AgendaBlock,
    ];

    /// <summary>Mapeia as rotas de especialidades, profissionais, pacientes e tipos de consulta.</summary>
    public static RouteGroupBuilder MapCatalogEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        MapSpecialties(api);
        MapProfessionals(api);
        MapPatients(api);
        MapAppointmentTypes(api);

        return api;
    }

    private static void MapSpecialties(RouteGroupBuilder api)
    {
        var specialties = api.MapGroup("/specialties");

        specialties.MapGet(string.Empty, ListSpecialtiesAsync)
            .WithName("ListSpecialties")
            .Produces<IReadOnlyList<SpecialtyResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(CatalogReadPermissions);

        specialties.MapPost(string.Empty, CreateSpecialtyAsync)
            .WithName("CreateSpecialty")
            .Produces<SpecialtyResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaConfigure);

        specialties.MapPost("/{id:guid}", RenameSpecialtyAsync)
            .WithName("RenameSpecialty")
            .Produces<SpecialtyResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaConfigure);

        specialties.MapPost("/{id:guid}/deactivate", DeactivateSpecialtyAsync)
            .WithName("DeactivateSpecialty")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaConfigure);

        specialties.MapPost("/{id:guid}/activate", ActivateSpecialtyAsync)
            .WithName("ActivateSpecialty")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaConfigure);
    }

    private static void MapProfessionals(RouteGroupBuilder api)
    {
        var professionals = api.MapGroup("/professionals");

        professionals.MapGet(string.Empty, ListProfessionalsAsync)
            .WithName("ListProfessionals")
            .Produces<IReadOnlyList<ProfessionalResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(CatalogReadPermissions);

        professionals.MapPost(string.Empty, CreateProfessionalAsync)
            .WithName("CreateProfessional")
            .Produces<ProfessionalResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.AgendaConfigure);

        professionals.MapPost("/{id:guid}", UpdateProfessionalAsync)
            .WithName("UpdateProfessional")
            .Produces<ProfessionalResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.AgendaConfigure);

        professionals.MapPost("/{id:guid}/deactivate", DeactivateProfessionalAsync)
            .WithName("DeactivateProfessional")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaConfigure);

        professionals.MapPost("/{id:guid}/activate", ActivateProfessionalAsync)
            .WithName("ActivateProfessional")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaConfigure);
    }

    private static void MapPatients(RouteGroupBuilder api)
    {
        var patients = api.MapGroup("/patients");

        patients.MapGet(string.Empty, ListPatientsAsync)
            .WithName("ListPatients")
            .Produces<IReadOnlyList<PatientResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(CatalogReadPermissions);

        patients.MapPost(string.Empty, CreatePatientAsync)
            .WithName("CreatePatient")
            .Produces<PatientResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.AgendaWrite);

        patients.MapPost("/{id:guid}", UpdatePatientAsync)
            .WithName("UpdatePatient")
            .Produces<PatientResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.AgendaWrite);

        patients.MapPost("/{id:guid}/deactivate", DeactivatePatientAsync)
            .WithName("DeactivatePatient")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaWrite);

        patients.MapPost("/{id:guid}/activate", ActivatePatientAsync)
            .WithName("ActivatePatient")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaWrite);
    }

    private static void MapAppointmentTypes(RouteGroupBuilder api)
    {
        var appointmentTypes = api.MapGroup("/appointment-types");

        appointmentTypes.MapGet(string.Empty, ListAppointmentTypesAsync)
            .WithName("ListAppointmentTypes")
            .Produces<IReadOnlyList<AppointmentTypeResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(CatalogReadPermissions);

        appointmentTypes.MapPost(string.Empty, CreateAppointmentTypeAsync)
            .WithName("CreateAppointmentType")
            .Produces<AppointmentTypeResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.AgendaConfigure);

        appointmentTypes.MapPost("/{id:guid}", UpdateAppointmentTypeAsync)
            .WithName("UpdateAppointmentType")
            .Produces<AppointmentTypeResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaConfigure);

        appointmentTypes.MapPost("/{id:guid}/deactivate", DeactivateAppointmentTypeAsync)
            .WithName("DeactivateAppointmentType")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaConfigure);

        appointmentTypes.MapPost("/{id:guid}/activate", ActivateAppointmentTypeAsync)
            .WithName("ActivateAppointmentType")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.AgendaConfigure);
    }

    private static async Task<IResult> ListSpecialtiesAsync(
        CatalogService catalogService,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.ListSpecialtiesAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateSpecialtyAsync(
        CatalogService catalogService,
        [FromBody] CreateSpecialtyRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.CreateSpecialtyAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> RenameSpecialtyAsync(
        CatalogService catalogService,
        Guid id,
        [FromBody] RenameSpecialtyRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.RenameSpecialtyAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DeactivateSpecialtyAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.DeactivateSpecialtyAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ActivateSpecialtyAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.ActivateSpecialtyAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ListProfessionalsAsync(
        CatalogService catalogService,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.ListProfessionalsAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateProfessionalAsync(
        CatalogService catalogService,
        [FromBody] CreateProfessionalRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.CreateProfessionalAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> UpdateProfessionalAsync(
        CatalogService catalogService,
        Guid id,
        [FromBody] UpdateProfessionalRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.UpdateProfessionalAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DeactivateProfessionalAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.DeactivateProfessionalAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ActivateProfessionalAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.ActivateProfessionalAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ListPatientsAsync(
        CatalogService catalogService,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.ListPatientsAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreatePatientAsync(
        CatalogService catalogService,
        [FromBody] CreatePatientRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.CreatePatientAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> UpdatePatientAsync(
        CatalogService catalogService,
        Guid id,
        [FromBody] UpdatePatientRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.UpdatePatientAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DeactivatePatientAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.DeactivatePatientAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ActivatePatientAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.ActivatePatientAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ListAppointmentTypesAsync(
        CatalogService catalogService,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.ListAppointmentTypesAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateAppointmentTypeAsync(
        CatalogService catalogService,
        [FromBody] CreateAppointmentTypeRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.CreateAppointmentTypeAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> UpdateAppointmentTypeAsync(
        CatalogService catalogService,
        Guid id,
        [FromBody] UpdateAppointmentTypeRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await catalogService.UpdateAppointmentTypeAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DeactivateAppointmentTypeAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.DeactivateAppointmentTypeAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ActivateAppointmentTypeAsync(
        CatalogService catalogService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await catalogService.ActivateAppointmentTypeAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }
}
