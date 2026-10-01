using Canamed.Application.Errors;
using Canamed.Domain.Agenda;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Errors;

/// <summary>
/// Converte erros previstos em Problem Details (RFC 7807), sem expor detalhe interno nem dados
/// pessoais de paciente (RN-008 e RN-014 da SPEC-0002).
/// </summary>
public sealed class CanamedExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<CanamedExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        var problem = Map(exception);

        if (problem is null)
        {
            // Erro inesperado: registra com correlação e responde 500 genérico, sem vazar detalhe.
            logger.LogError(
                exception,
                "Falha inesperada ao processar {Method} {Path}.",
                httpContext.Request.Method,
                httpContext.Request.Path);

            problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Erro inesperado",
                Detail = "Não foi possível concluir a operação. Tente novamente.",
                Type = ProblemTypeUri.From("unexpected-error"),
            };
        }
        else
        {
            logger.LogInformation(
                "Requisição rejeitada com {StatusCode} em {Method} {Path}.",
                problem.Status,
                httpContext.Request.Method,
                httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
        problem.Extensions.TryAdd("traceId", httpContext.TraceIdentifier);

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception,
        }).ConfigureAwait(false);
    }

    private static ProblemDetails? Map(Exception exception) => exception switch
    {
        CanamedException canamed => MapCanamed(canamed),
        PastSchedulingException => Create(
            StatusCodes.Status400BadRequest,
            "Data no passado",
            "Não é possível agendar em data passada.",
            "past-scheduling"),
        AppointmentConflictException => Create(
            StatusCodes.Status409Conflict,
            "Horário ocupado",
            "Este horário já está ocupado para o profissional selecionado.",
            "appointment-overlap"),
        ScheduleBlockedException => Create(
            StatusCodes.Status409Conflict,
            "Profissional indisponível",
            "O profissional está indisponível neste horário.",
            "professional-blocked"),
        AppointmentStatusTransitionException => Create(
            StatusCodes.Status409Conflict,
            "Agendamento não pode ser alterado",
            "Este agendamento não pode mais ser alterado.",
            "appointment-state"),
        ArgumentException argument => Create(
            StatusCodes.Status400BadRequest,
            "Dados inválidos",
            argument.Message,
            "invalid-request"),
        _ => null,
    };

    private static ProblemDetails MapCanamed(CanamedException exception)
    {
        var status = exception.Kind switch
        {
            ProblemKind.Validation => StatusCodes.Status400BadRequest,
            ProblemKind.Unauthenticated => StatusCodes.Status401Unauthorized,
            ProblemKind.Forbidden => StatusCodes.Status403Forbidden,
            ProblemKind.NotFound => StatusCodes.Status404NotFound,
            ProblemKind.Conflict => StatusCodes.Status409Conflict,
            ProblemKind.Unavailable => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status500InternalServerError,
        };

        var problem = Create(status, exception.Title, exception.Detail, exception.ProblemType);

        foreach (var extension in exception.Extensions)
        {
            problem.Extensions[extension.Key] = extension.Value;
        }

        return problem;
    }

    private static ProblemDetails Create(int status, string title, string? detail, string? problemType) =>
        new()
        {
            Status = status,
            Title = title,
            Detail = detail,
            Type = ProblemTypeUri.From(problemType),
        };
}
