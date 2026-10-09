using System.Net;
using Canamed.Application.CashRegister;
using Canamed.Application.Identity;

namespace Canamed.IntegrationTests.Payments;

[Collection(CanamedCollection.Name)]
public sealed class CashRegisterEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    [Fact]
    public async Task FluxoCompletoDeCaixa_AberturaMovimentacaoEFechamentoComDivergencia()
    {
        var operatorUser = Factory.SeedUser(Roles.Receptionist, CanamedApiFactory.ClinicAId);
        using var client = CreateClient(CanamedApiFactory.ClinicAId, operatorUser.Id.ToString(), [.. Permissions.All]);
        var clinicId = CanamedApiFactory.ClinicAId;

        // 1. Status inicial deve ser 404 (nenhuma sessão de caixa aberta)
        var statusInitialRes = await client.GetAsync(new Uri($"/api/v1/cash-register/sessions/active?clinicId={clinicId}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.NotFound, statusInitialRes.StatusCode);

        // 2. Abertura de sessão
        var openRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/sessions/open", UriKind.Relative),
            JsonBody(new OpenCashSessionRequest(clinicId, 100.00m)));
        Assert.Equal(HttpStatusCode.Created, openRes.StatusCode);
        var openSession = await ReadAsync<CashSessionDto>(openRes);
        Assert.Equal("aberta", openSession.Status);
        Assert.Equal(100.00m, openSession.InitialFloat);

        // 3. Tentar abrir de novo gera conflito (409)
        var conflictRes = await client.PostAsync(
            new Uri("/api/v1/cash-register/sessions/open", UriKind.Relative),
            JsonBody(new OpenCashSessionRequest(clinicId, 50.00m)));
        Assert.Equal(HttpStatusCode.Conflict, conflictRes.StatusCode);

        // 4. Suprimento de R$ 50,00
        var supplyRes = await client.PostAsync(
            new Uri($"/api/v1/cash-register/sessions/{openSession.Id}/suprimento?clinicId={clinicId}", UriKind.Relative),
            JsonBody(new CashSuprimentoRequest(50.00m, "Troco inicial de moedas")));
        var supplyErr = await supplyRes.Content.ReadAsStringAsync();
        Assert.True(supplyRes.StatusCode == HttpStatusCode.OK, supplyErr);

        // 5. Sangria que ultrapassa o saldo deve falhar (saldo físico = 100 + 50 = 150)
        var excessWithdrawalRes = await client.PostAsync(
            new Uri($"/api/v1/cash-register/sessions/{openSession.Id}/sangria?clinicId={clinicId}", UriKind.Relative),
            JsonBody(new CashSangriaRequest(200.00m, "Tentativa de sangria maior que saldo")));
        Assert.Equal(HttpStatusCode.BadRequest, excessWithdrawalRes.StatusCode);

        // 6. Sangria válida de R$ 30,00
        var validWithdrawalRes = await client.PostAsync(
            new Uri($"/api/v1/cash-register/sessions/{openSession.Id}/sangria?clinicId={clinicId}", UriKind.Relative),
            JsonBody(new CashSangriaRequest(30.00m, "Recolhimento parcial para cofre")));
        Assert.Equal(HttpStatusCode.OK, validWithdrawalRes.StatusCode);

        // 7. Sessão ativa deve refletir 100 + 50 - 30 = 120
        var activeRes = await client.GetAsync(new Uri($"/api/v1/cash-register/sessions/active?clinicId={clinicId}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, activeRes.StatusCode);
        var active = await ReadAsync<CashSessionDto>(activeRes);
        Assert.Equal("aberta", active.Status);
        Assert.Equal(120.00m, active.TotalCashExpected);

        // 8. Fechamento de sessão declarando R$ 118,00 em dinheiro (diferença de -R$ 2,00)
        var closeRes = await client.PostAsync(
            new Uri($"/api/v1/cash-register/sessions/{openSession.Id}/close?clinicId={clinicId}", UriKind.Relative),
            JsonBody(new CloseCashSessionRequest(118.00m, 0m, 0m, 0m, "Falta de 2 reais no fechamento do dia")));
        Assert.Equal(HttpStatusCode.OK, closeRes.StatusCode);
        var closedSession = await ReadAsync<CashSessionDto>(closeRes);
        Assert.Equal("fechada", closedSession.Status);
        Assert.Equal(118.00m, closedSession.TotalCashDeclared);
        Assert.Equal(120.00m, closedSession.TotalCashExpected);
        Assert.Equal(-2.00m, closedSession.CashDifference);
        Assert.NotNull(closedSession.ClosedAt);

        // 9. Histórico lista a sessão fechada
        var historyRes = await client.GetAsync(new Uri($"/api/v1/cash-register/sessions?clinicId={clinicId}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, historyRes.StatusCode);
        var history = await ReadAsync<List<CashSessionDto>>(historyRes);
        Assert.Contains(history, s => s.Id == closedSession.Id && s.Status == "fechada");
    }
}
