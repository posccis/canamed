using Canamed.Application.Abstractions;
using Canamed.Application.MedicalDocuments;
using Canamed.Application.Portal;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Api.Endpoints;

public static class PortalEndpoints
{
    public static RouteGroupBuilder MapPortalEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/portal");

        group.MapGet("/meta", GetPortalMetaAsync)
            .WithName("PortalGetMeta")
            .Produces<PortalMetaResponse>(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapPost("/auth/request-otp", RequestOtpAsync)
            .WithName("PortalRequestOtp")
            .Produces<RequestOtpResponse>(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapPost("/auth/verify-otp", VerifyOtpAsync)
            .WithName("PortalVerifyOtp")
            .Produces<VerifyOtpResponse>(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapGet("/available-slots", GetAvailableSlotsAsync)
            .WithName("PortalGetAvailableSlots")
            .Produces<IReadOnlyList<PublicSlotDto>>(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapPost("/appointments/book", BookAppointmentAsync)
            .WithName("PortalBookAppointment")
            .Produces<OnlineAppointmentDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .AllowAnonymous();

        group.MapGet("/appointments/my", GetMyAppointmentsAsync)
            .WithName("PortalGetMyAppointments")
            .Produces<IReadOnlyList<OnlineAppointmentDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        group.MapPost("/appointments/{appointmentId:guid}/cancel", CancelMyAppointmentAsync)
            .WithName("PortalCancelMyAppointment")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        group.MapGet("/documents/my", GetMyDocumentsAsync)
            .WithName("PortalGetMyDocuments")
            .Produces<IReadOnlyList<MedicalDocumentResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        return api;
    }

    private static async Task<IResult> RequestOtpAsync(
        OnlineBookingService bookingService,
        [FromBody] RequestOtpRequest request,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var response = await bookingService.RequestOtpAsync(request, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> VerifyOtpAsync(
        OnlineBookingService bookingService,
        [FromBody] VerifyOtpRequest request,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        var response = await bookingService.VerifyOtpAsync(request, ip, userAgent, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> GetAvailableSlotsAsync(
        OnlineBookingService bookingService,
        [FromQuery] Guid clinicId,
        [FromQuery] Guid specialtyId,
        [FromQuery] DateOnly date,
        [FromQuery] Guid? professionalId,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var slots = await bookingService.GetAvailableSlotsAsync(clinicId, specialtyId, professionalId, date, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(slots);
    }

    private static async Task<IResult> BookAppointmentAsync(
        OnlineBookingService bookingService,
        [FromBody] BookOnlineAppointmentRequest request,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        var result = await bookingService.BookAppointmentOnlineAsync(sessionToken, request, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Created($"/api/v1/portal/appointments/{result.Id}", result);
    }

    private static async Task<IResult> GetMyAppointmentsAsync(
        OnlineBookingService bookingService,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        try
        {
            var list = await bookingService.GetMyAppointmentsAsync(sessionToken, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(list);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
    }

    private static async Task<IResult> CancelMyAppointmentAsync(
        OnlineBookingService bookingService,
        Guid appointmentId,
        [FromBody] CancelAppointmentPayload payload,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        try
        {
            await bookingService.CancelMyAppointmentAsync(sessionToken, appointmentId, payload.Reason, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(new { message = "Agendamento cancelado com sucesso." });
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> GetMyDocumentsAsync(
        IPortalRepository portalRepository,
        IMedicalDocumentRepository documentRepository,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        var session = await portalRepository.GetSessionAsync(sessionToken, timeProvider.GetUtcNow(), cancellationToken);
        if (session is null)
        {
            return Results.Unauthorized();
        }

        var docs = await documentRepository.GetByPatientIdOnlyAsync(session.PatientId, cancellationToken);
        var dtos = docs.Select(d => new MedicalDocumentResponse(
            d.Id,
            d.ClinicId,
            d.PatientId,
            d.DoctorId,
            d.MedicalRecordId,
            d.DocumentType,
            d.Status,
            d.ContentPayload,
            d.Cid10Code,
            d.PatientConsentedCid,
            d.SignatureHash,
            d.PublicToken,
            d.CancellationReason,
            d.SignedAt,
            d.CancelledAt,
            d.CreatedAt)).ToList();

        return Results.Ok(dtos);
    }

    private static async Task<IResult> GetPortalMetaAsync(
        ICatalogRepository catalogRepository,
        Canamed.Infrastructure.Persistence.CanamedDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var clinic = await dbContext.Clinics.FirstOrDefaultAsync(cancellationToken);
        if (clinic is null)
        {
            return Results.NotFound(new { message = "Nenhuma clínica cadastrada." });
        }

        var specialties = await catalogRepository.ListSpecialtiesAsync(clinic.Id, cancellationToken);
        var professionals = await catalogRepository.ListProfessionalsAsync(clinic.Id, cancellationToken);

        var specDtos = specialties.Where(s => s.IsActive).Select(s => new PortalSpecialtyItem(s.Id, s.Name)).ToList();
        var profDtos = professionals.Where(p => p.IsActive).Select(p => new PortalProfessionalItem(p.Id, p.Name, p.SpecialtyId)).ToList();

        return Results.Ok(new PortalMetaResponse(clinic.Id, clinic.Name, specDtos, profDtos));
    }
}

public sealed record CancelAppointmentPayload(string Reason);
public sealed record PortalMetaResponse(Guid ClinicId, string ClinicName, IReadOnlyList<PortalSpecialtyItem> Specialties, IReadOnlyList<PortalProfessionalItem> Professionals);
public sealed record PortalSpecialtyItem(Guid Id, string Name);
public sealed record PortalProfessionalItem(Guid Id, string Name, Guid? SpecialtyId);
