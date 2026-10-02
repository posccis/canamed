using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;
using Canamed.Application.Payments;
using Canamed.Domain.Agenda;
using Canamed.Infrastructure.Persistence;

namespace Canamed.IntegrationTests.Payments;

[Collection(CanamedCollection.Name)]
public sealed class PaymentEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    [Fact]
    public async Task CA001_RegistrarPagamentoComSucesso_AtualizaStatusParaPago()
    {
        using var client = CreateReceptionClient("recepcao-pagamento-1");
        var appointment = await CreateAppointmentAsync(client, LocalStart(5, 9));

        var paymentResponse = await client.PostAsync(
            new Uri("/api/v1/payments", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appointment.Id,
                amount = 250.00m,
                paymentMethod = "pix",
                notes = "Recebimento PIX balcão"
            }));

        Assert.Equal(HttpStatusCode.Created, paymentResponse.StatusCode);
        var payment = await ReadAsync<PaymentTransactionResponse>(paymentResponse);
        Assert.Equal(250.00m, payment.Amount);
        Assert.Equal("pix", payment.PaymentMethod);
        Assert.Equal("pago", payment.Status);
        Assert.Equal(appointment.Id, payment.AppointmentId);

        // Verifica na consulta do agendamento que o status financeiro foi persistido
        var getAppointmentResponse = await client.GetAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, getAppointmentResponse.StatusCode);
    }

    [Fact]
    public async Task CA002_ListarPagamentosPorAgendamento_RetornaHistorico()
    {
        using var client = CreateReceptionClient("recepcao-pagamento-2");
        var appointment = await CreateAppointmentAsync(client, LocalStart(6, 10));

        await client.PostAsync(
            new Uri("/api/v1/payments", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appointment.Id,
                amount = 150.00m,
                paymentMethod = "cartao_debito",
                cardBrand = "Mastercard",
                cardLastFourDigits = "4567"
            }));

        var listResponse = await client.GetAsync(
            new Uri($"/api/v1/payments/appointment/{appointment.Id}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var transactions = await ReadAsync<IReadOnlyList<PaymentTransactionResponse>>(listResponse);
        Assert.Single(transactions);
        Assert.Equal(150.00m, transactions[0].Amount);
        Assert.Equal("cartao_debito", transactions[0].PaymentMethod);
        Assert.Equal("Mastercard", transactions[0].CardBrand);
        Assert.Equal("4567", transactions[0].CardLastFourDigits);
    }

    [Fact]
    public async Task CA003_EstornoComSucesso_AtualizaStatusParaEstornado()
    {
        using var client = CreateClient(CanamedApiFactory.ClinicAId, "gestor-estorno", [.. Permissions.All]);
        var appointment = await CreateAppointmentAsync(client, LocalStart(7, 14));

        var paymentResponse = await client.PostAsync(
            new Uri("/api/v1/payments", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appointment.Id,
                amount = 300.00m,
                paymentMethod = "dinheiro",
                notes = "Valor em espécie"
            }));

        var payment = await ReadAsync<PaymentTransactionResponse>(paymentResponse);

        var refundResponse = await client.PostAsync(
            new Uri($"/api/v1/payments/{payment.Id}/refund", UriKind.Relative),
            JsonBody(new
            {
                reason = "Paciente desistiu da consulta antes do início"
            }));

        Assert.Equal(HttpStatusCode.OK, refundResponse.StatusCode);
        var refunded = await ReadAsync<PaymentTransactionResponse>(refundResponse);
        Assert.Equal("estornado", refunded.Status);
        Assert.Equal("Paciente desistiu da consulta antes do início", refunded.RefundReason);
        Assert.NotNull(refunded.RefundedAt);
    }

    [Fact]
    public async Task CA004_ResumoDiarioDePagamentos_CalculaTotaisPorForma()
    {
        using var client = CreateReceptionClient("recepcao-pagamento-resumo");
        var appointment1 = await CreateAppointmentAsync(client, LocalStart(8, 8));
        var appointment2 = await CreateAppointmentAsync(client, LocalStart(8, 9));

        await client.PostAsync(
            new Uri("/api/v1/payments", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appointment1.Id,
                amount = 100.00m,
                paymentMethod = "dinheiro"
            }));

        await client.PostAsync(
            new Uri("/api/v1/payments", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appointment2.Id,
                amount = 200.00m,
                paymentMethod = "pix"
            }));

        var today = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(CanamedApiFactory.FixedNow).DateTime);
        var summaryResponse = await client.GetAsync(
            new Uri($"/api/v1/payments/summary?date={today:yyyy-MM-dd}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, summaryResponse.StatusCode);
        var summary = await ReadAsync<DailyPaymentSummaryResponse>(summaryResponse);
        Assert.True(summary.TotalReceived >= 300.00m);
        Assert.True(summary.CashTotal >= 100.00m);
        Assert.True(summary.PixTotal >= 200.00m);
    }

    [Fact]
    public async Task CA005_AgendamentoDeOutraClinica_Retorna404()
    {
        using var clientA = CreateReceptionClient("recepcao-clinica-a");
        var appointmentBId = await CreateForeignAppointmentAsync();

        // Clínica A tenta registrar pagamento para agendamento da Clínica B
        var crossPaymentResponse = await clientA.PostAsync(
            new Uri("/api/v1/payments", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appointmentBId,
                amount = 200.00m,
                paymentMethod = "pix"
            }));

        Assert.Equal(HttpStatusCode.NotFound, crossPaymentResponse.StatusCode);
    }

    private static async Task<Guid> CreateForeignAppointmentAsync()
    {
        await using var context = new CanamedDbContext(TestDatabase.Options);
        var now = CanamedApiFactory.FixedNow;
        var appointment = Appointment.Schedule(
            CanamedApiFactory.ClinicBId,
            CanamedApiFactory.ProfessionalBId,
            CanamedApiFactory.PatientAId,
            CanamedApiFactory.AppointmentTypeAId,
            now.AddDays(2),
            30,
            now);

        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();
        return appointment.Id;
    }
}
