using Canamed.Api.Authorization;
using Canamed.Application.Clinics;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class ClinicPolicyEndpoints
{
    public static RouteGroupBuilder MapClinicPolicyEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/clinics/{clinicId:guid}/policies");

        group.MapGet(string.Empty, async (
            ClinicPolicyService service,
            Guid clinicId,
            CancellationToken ct) =>
        {
            var res = await service.GetPolicyAsync(clinicId, ct);
            return Results.Ok(res);
        })
        .WithName("GetClinicPolicy")
        .Produces<ClinicPolicyDto>(StatusCodes.Status200OK);

        group.MapPut(string.Empty, async (
            ClinicPolicyService service,
            Guid clinicId,
            [FromBody] UpdateClinicPolicyRequest request,
            CancellationToken ct) =>
        {
            var res = await service.UpdatePolicyAsync(clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("UpdateClinicPolicy")
        .Produces<ClinicPolicyDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.PolicyManage);

        group.MapGet("/overbooking-check", async (
            ClinicPolicyService service,
            Guid clinicId,
            [FromQuery] Guid professionalId,
            [FromQuery] DateTimeOffset targetDate,
            CancellationToken ct) =>
        {
            var (allowed, current, max, message) = await service.CheckOverbookingQuotaAsync(clinicId, professionalId, targetDate, ct);
            return Results.Ok(new { allowed, current, max, message });
        })
        .WithName("CheckOverbookingQuota")
        .Produces(StatusCodes.Status200OK);

        return api;
    }
}
