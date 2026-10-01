namespace Canamed.Application.Errors;

/// <summary>Categoria do erro de aplicação, convertida em status HTTP pela camada de API.</summary>
public enum ProblemKind
{
    /// <summary>Entrada inválida — HTTP 400.</summary>
    Validation,

    /// <summary>Ausência de autenticação — HTTP 401.</summary>
    Unauthenticated,

    /// <summary>Autenticado, porém sem permissão — HTTP 403.</summary>
    Forbidden,

    /// <summary>Recurso inexistente no escopo do usuário — HTTP 404.</summary>
    NotFound,

    /// <summary>Conflito com o estado atual — HTTP 409.</summary>
    Conflict,

    /// <summary>Dependência indisponível — HTTP 503.</summary>
    Unavailable,
}
