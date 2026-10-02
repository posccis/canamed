using System.Net;
using Canamed.Application.Identity;
using Canamed.Application.Payments;

namespace Canamed.IntegrationTests.Payments;

[Collection(CanamedCollection.Name)]
public sealed class CashRegisterEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    [Fact]
    public async Task FluxoCompletoDeCaixa_AberturaMovimentacaoEFechamentoComDivergencia()
    {
        var operatorUser = Factory.SeedUser(Roles.Receptionist, CanamedApiFactory.ClinicAId);
        using var client = CreateClient(CanamedApiFactory.ClinicAId, operatorUser.Id.ToString(), [.. Permissions.All]);

        // 1. Status inicial deve ser fechado (nenhum turno)
        var statusInitialRes = await client.GetAsync(new Uri("/api/v1/cash-register/current", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, statusInitialRes.StatusCode);
        var initialStatus = await ReadAsync<CashRegisterCurrentStatusResponse>(statusInitialRes);
        Assert.False(initialStatus.IsOpen);

        // 2. Abertura de turno
        var openRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/open", UriKind.Relative),
            JsonBody(new { initialCash = 100.00m }));
        Assert.Equal(HttpStatusCode.Created, openRes.StatusCode);
        var openShift = await ReadAsync<CashRegisterShiftResponse>(openRes);
        Assert.Equal("aberto", openShift.Status);
        Assert.Equal(100.00m, openShift.InitialCash);

        // 3. Tentar abrir de novo gera conflito (409)
        var conflictRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/open", UriKind.Relative),
            JsonBody(new { initialCash = 50.00m }));
        Assert.Equal(HttpStatusCode.Conflict, conflictRes.StatusCode);

        // 4. Suprimento de R$ 50,00
        var supplyRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/movement", UriKind.Relative),
            JsonBody(new
            {
                type = "suprimento",
                amount = 50.00m,
                reason = "Troco inicial de moedas"
            }));
        Assert.Equal(HttpStatusCode.Created, supplyRes.StatusCode);

        // 5. Sangria que ultrapassa o saldo deve falhar (saldo físico = 100 + 50 = 150)
        var excessWithdrawalRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/movement", UriKind.Relative),
            JsonBody(new
            {
                type = "sangria",
                amount = 200.00m,
                reason = "Tentativa de sangria maior que saldo"
            }));
        Assert.Equal(HttpStatusCode.BadRequest, excessWithdrawalRes.StatusCode);

        // 6. Sangria válida de R$ 30,00
        var validWithdrawalRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/movement", UriKind.Relative),
            JsonBody(new
            {
                type = "sangria",
                amount = 30.00m,
                reason = "Recolhimento parcial para cofre"
            }));
        Assert.Equal(HttpStatusCode.Created, validWithdrawalRes.StatusCode);

        // 7. Status atual deve refletir 100 + 50 - 30 = 120
        var statusRes = await client.GetAsync(new Uri("/api/v1/cash-register/current", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, statusRes.StatusCode);
        var status = await ReadAsync<CashRegisterCurrentStatusResponse>(statusRes);
        Assert.True(status.IsOpen);
        Assert.Equal(50.00m, status.TotalSupplies);
        Assert.Equal(30.00m, status.TotalWithdrawals);
        Assert.Equal(120.00m, status.CurrentCashInDrawer);

        // 8. Fechamento de turno declarando R$ 118,00 (diferença de -R$ 2,00)
        var closeRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/close", UriKind.Relative),
            JsonBody(new
            {
                declaredCash = 118.00m,
                notes = "Falta de 2 reais no fechamento do dia"
            }));
        Assert.Equal(HttpStatusCode.OK, closeRes.StatusCode);
        var closedShift = await ReadAsync<CashRegisterShiftResponse>(closeRes);
        Assert.Equal("fechado", closedShift.Status);
        Assert.Equal(118.00m, closedShift.DeclaredCash);
        Assert.Equal(120.00m, closedShift.ExpectedCash);
        Assert.Equal(-2.00m, closedShift.CashDifference);
        Assert.NotNull(closedShift.ClosedAt);

        // 9. Histórico lista o turno fechado
        var historyRes = await client.GetAsync(new Uri("/api/v1/cash-register/history", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, historyRes.StatusCode);
        var history = await ReadAsync<List<CashRegisterShiftResponse>>(historyRes);
        Assert.Contains(history, s => s.Id == closedShift.Id && s.Status == "fechado");
    }
}
