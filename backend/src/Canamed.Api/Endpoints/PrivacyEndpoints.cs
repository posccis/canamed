using Canamed.Application.Privacy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Canamed.Api.Endpoints;

public static class PrivacyEndpoints
{
    public static RouteGroupBuilder MapPrivacyEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/patients/{id:guid}/data-portability", async (
            Guid id,
            PrivacyService service,
            CancellationToken token) =>
        {
            var result = await service.ExportDataPortabilityAsync(id, token);
            return Results.Ok(result);
        }).WithName("ExportPatientDataPortability");

        group.MapPost("/patients/{id:guid}/anonymize", async (
            Guid id,
            AnonymizePatientRequest request,
            PrivacyService service,
            CancellationToken token) =>
        {
            var result = await service.AnonymizePatientAsync(id, request, token);
            return Results.Ok(result);
        }).WithName("AnonymizePatient");

        return group;
    }
}
