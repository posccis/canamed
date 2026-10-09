using Canamed.Domain.Portal;
using Xunit;

namespace Canamed.UnitTests.Portal;

public sealed class PatientRegistrationDraftTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();

    [Fact]
    public void Create_InitializesDraftStatus()
    {
        var draft = PatientRegistrationDraft.Create(
            _clinicId,
            _patientId,
            "{\"name\":\"Maria\",\"phone\":\"81999998888\"}",
            _now);

        Assert.Equal(RegistrationDraftStatus.Draft, draft.Status);
        Assert.Equal("draft", draft.Status.ToStoredValue());
        Assert.Equal(_clinicId, draft.ClinicId);
        Assert.Equal(_patientId, draft.PatientId);
        Assert.Contains("Maria", draft.PayloadJson);
        Assert.Null(draft.SubmittedAt);
        Assert.Null(draft.ReviewedAt);
    }

    [Fact]
    public void UpdateDraft_UpdatesPayload_AndThrowsWhenApproved()
    {
        var draft = PatientRegistrationDraft.Create(_clinicId, _patientId, "{}", _now);
        draft.UpdateDraft("{\"address\":\"Rua Teste\"}", _now.AddMinutes(5));

        Assert.Contains("Rua Teste", draft.PayloadJson);

        draft.SubmitForReview(_now.AddMinutes(6));
        draft.Approve(Guid.NewGuid(), _now.AddMinutes(7));

        Assert.Throws<InvalidOperationException>(() => draft.UpdateDraft("{\"address\":\"Outra\"}", _now.AddMinutes(8)));
    }

    [Fact]
    public void SubmitForReview_TransitionsToPendingReview()
    {
        var draft = PatientRegistrationDraft.Create(_clinicId, _patientId, "{}", _now);
        draft.SubmitForReview(_now.AddMinutes(1));

        Assert.Equal(RegistrationDraftStatus.PendingReview, draft.Status);
        Assert.Equal(_now.AddMinutes(1), draft.SubmittedAt);
        Assert.Null(draft.ReviewNote);
    }

    [Fact]
    public void Approve_TransitionsToApproved_AndSetsReviewer()
    {
        var draft = PatientRegistrationDraft.Create(_clinicId, _patientId, "{}", _now);
        draft.SubmitForReview(_now.AddMinutes(1));

        var reviewerId = Guid.NewGuid();
        draft.Approve(reviewerId, _now.AddMinutes(2));

        Assert.Equal(RegistrationDraftStatus.Approved, draft.Status);
        Assert.Equal(reviewerId, draft.ReviewedBy);
        Assert.Equal(_now.AddMinutes(2), draft.ReviewedAt);
    }

    [Fact]
    public void Return_SetsReviewNote_AndAllowsResubmission()
    {
        var draft = PatientRegistrationDraft.Create(_clinicId, _patientId, "{}", _now);
        draft.SubmitForReview(_now.AddMinutes(1));

        var reviewerId = Guid.NewGuid();
        draft.Return(reviewerId, "Comprovante ilegível", _now.AddMinutes(2));

        Assert.Equal(RegistrationDraftStatus.Returned, draft.Status);
        Assert.Equal("Comprovante ilegível", draft.ReviewNote);

        // Paciente pode corrigir e reenviar
        draft.UpdateDraft("{\"document\":\"12345678901\"}", _now.AddMinutes(3));
        draft.SubmitForReview(_now.AddMinutes(4));

        Assert.Equal(RegistrationDraftStatus.PendingReview, draft.Status);
        Assert.Null(draft.ReviewNote);
    }
}
