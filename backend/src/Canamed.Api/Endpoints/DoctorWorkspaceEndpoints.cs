using Canamed.Api.Authorization;
using Canamed.Application.DoctorWorkspace;
using Canamed.Application.Identity;
using Canamed.Application.Queue;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class DoctorWorkspaceEndpoints
{
    public static RouteGroupBuilder MapDoctorWorkspaceEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var workspace = api.MapGroup("/doctor-workspace");

        workspace.MapGet("/state", GetWorkspaceStateAsync)
            .WithName("GetDoctorWorkspaceState")
            .Produces<DoctorWorkspaceStateResponse>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.WorkspaceAccess);

        workspace.MapGet("/dashboard/summary", GetDashboardSummaryAsync)
            .WithName("GetDoctorDashboardSummary")
            .Produces<DoctorDashboardSummaryResponse>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.WorkspaceAccess);

        workspace.MapPost("/call-patient", CallPatientAsync)
            .WithName("DoctorCallPatient")
            .Produces<QueueEntryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.WorkspaceAccess);

        workspace.MapPost("/start-consultation", StartConsultationAsync)
            .WithName("DoctorStartConsultation")
            .Produces<ActiveConsultationDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.WorkspaceAccess);

        workspace.MapPost("/start-by-appointment/{appointmentId:guid}", StartByAppointmentAsync)
            .WithName("DoctorStartConsultationByAppointment")
            .Produces<ActiveConsultationDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.WorkspaceAccess);

        workspace.MapPost("/finish-consultation", FinishConsultationAsync)
            .WithName("DoctorFinishConsultation")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.WorkspaceAccess);

        return api;
    }

    private static async Task<IResult> GetWorkspaceStateAsync(
        DoctorWorkspaceService service,
        CancellationToken cancellationToken)
    {
        var result = await service.GetWorkspaceStateAsync(cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetDashboardSummaryAsync(
        DoctorWorkspaceService service,
        CancellationToken cancellationToken)
    {
        var result = await service.GetDashboardSummaryAsync(cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> CallPatientAsync(
        DoctorWorkspaceService service,
        [FromBody] CallNextPatientRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.CallPatientAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> StartConsultationAsync(
        DoctorWorkspaceService service,
        [FromBody] StartConsultationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.StartConsultationAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> StartByAppointmentAsync(
        DoctorWorkspaceService service,
        Guid appointmentId,
        CancellationToken cancellationToken)
    {
        var result = await service.StartConsultationByAppointmentAsync(appointmentId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> FinishConsultationAsync(
        DoctorWorkspaceService service,
        [FromBody] FinishConsultationRequest request,
        CancellationToken cancellationToken)
    {
        await service.FinishConsultationAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.NoContent();
    }
}
