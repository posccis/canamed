using System.Text;
using System.Text.Json;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;
using Canamed.IntegrationTests;

namespace Canamed.IntegrationTests.Agenda;

/// <summary>
/// Base dos testes de agenda: limpa os dados entre testes (a coleção é serializada) e oferece
/// clientes HTTP já autenticados com o ator de desenvolvimento (ADR-0009).
/// </summary>
[Collection(CanamedCollection.Name)]
public abstract class AgendaTestBase
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    protected AgendaTestBase(CanamedApiFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        Factory = factory;

        TestDatabase.ClearAgendaData();
    }

    protected CanamedApiFactory Factory { get; }

    /// <summary>Cria um cliente com as permissões completas de agenda na clínica A.</summary>
    protected HttpClient CreateReceptionClient(string actorId = "recepcao-teste") =>
        CreateClient(CanamedApiFactory.ClinicAId, actorId, [.. Permissions.All]);

    /// <summary>Cria um cliente com permissões específicas.</summary>
    protected HttpClient CreateClient(Guid clinicId, string actorId, params string[] permissions)
    {
        var client = Factory.CreateClient();

        client.DefaultRequestHeaders.Add("X-Canamed-Actor-Id", actorId);
        client.DefaultRequestHeaders.Add("X-Canamed-Actor-Name", actorId);
        client.DefaultRequestHeaders.Add("X-Canamed-Clinic-Id", clinicId.ToString());
        client.DefaultRequestHeaders.Add("X-Canamed-Requested-With", "canamed-spa");

        if (permissions.Length > 0)
        {
            client.DefaultRequestHeaders.Add("X-Canamed-Permissions", string.Join(',', permissions));
        }

        return client;
    }

    /// <summary>Monta o corpo JSON de um pedido de agendamento.</summary>
    protected static StringContent JsonBody(object payload) =>
        new(JsonSerializer.Serialize(payload, SerializerOptions), Encoding.UTF8, "application/json");

    /// <summary>Converte a hora local da clínica (America/Fortaleza) para o instante UTC enviado à API.</summary>
    protected static DateTimeOffset LocalStart(int daysFromToday, int hour, int minute = 0)
    {
        var localDate = AgendaTimeZone.ToLocal(DateTimeOffset.UtcNow).Date.AddDays(daysFromToday);

        return AgendaTimeZone.LocalToUtc(localDate.AddHours(hour).AddMinutes(minute));
    }

    /// <summary>Cria um agendamento e devolve a resposta desserializada.</summary>
    protected async Task<AppointmentResponse> CreateAppointmentAsync(
        HttpClient client,
        DateTimeOffset startsAt,
        Guid? patientId = null,
        Guid? appointmentTypeId = null,
        Guid? professionalId = null)
    {
        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = professionalId ?? CanamedApiFactory.ProfessionalAId,
                patientId = patientId ?? CanamedApiFactory.PatientAId,
                appointmentTypeId = appointmentTypeId ?? CanamedApiFactory.AppointmentTypeAId,
                startsAt,
            })).ConfigureAwait(false);

        response.EnsureSuccessStatusCode();

        return await ReadAsync<AppointmentResponse>(response).ConfigureAwait(false);
    }

    protected static async Task<T> ReadAsync<T>(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        return JsonSerializer.Deserialize<T>(content, SerializerOptions)
            ?? throw new InvalidOperationException($"Resposta vazia para {typeof(T).Name}.");
    }

    /// <summary>Lê o campo <c>type</c> do Problem Details devolvido.</summary>
    protected static async Task<string> ReadProblemTypeAsync(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        using var document = JsonDocument.Parse(content);

        return document.RootElement.TryGetProperty("type", out var type) ? type.GetString() ?? string.Empty : string.Empty;
    }

}
