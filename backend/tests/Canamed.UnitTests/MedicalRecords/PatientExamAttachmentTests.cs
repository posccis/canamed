using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class PatientExamAttachmentTests
{
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;

    [Fact]
    public void Create_ComDadosValidos_CriaAnexoComSucesso()
    {
        var attachment = PatientExamAttachment.Create(
            clinicId: _clinicId,
            patientId: _patientId,
            medicalRecordId: null,
            title: "Ultrassonografia Transvaginal Pélvica",
            examType: "usg_transvaginal",
            examDate: new DateOnly(2026, 3, 15),
            labFacility: "Clínica Imagem da Mulher",
            notes: "Endométrio fino e homogêneo. Ovários com aspecto normal.",
            fileName: "laudo-usg-transvaginal.pdf",
            contentType: "application/pdf",
            fileSizeBytes: 2048500,
            fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            storagePath: "patients/test/exams/1.pdf",
            uploadedByUserId: "user-123",
            uploadedByName: "Dra. Ana Ribeiro",
            now: _now);

        Assert.Equal("Ultrassonografia Transvaginal Pélvica", attachment.Title);
        Assert.Equal("usg_transvaginal", attachment.ExamType);
        Assert.Equal(new DateOnly(2026, 3, 15), attachment.ExamDate);
        Assert.Equal("Clínica Imagem da Mulher", attachment.LabFacility);
        Assert.True(attachment.IsActive);
        Assert.Equal("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", attachment.FileHash);
    }

    [Fact]
    public void Create_ComTipoInvalido_LancaArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            PatientExamAttachment.Create(
                clinicId: _clinicId,
                patientId: _patientId,
                medicalRecordId: null,
                title: "Exame Desconhecido",
                examType: "tipo_inexistente",
                examDate: new DateOnly(2026, 1, 1),
                labFacility: null,
                notes: null,
                fileName: "test.pdf",
                contentType: "application/pdf",
                fileSizeBytes: 1000,
                fileHash: "hash123",
                storagePath: "path",
                uploadedByUserId: "user-1",
                uploadedByName: "User",
                now: _now));
    }

    [Fact]
    public void Create_SemTitulo_LancaArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            PatientExamAttachment.Create(
                clinicId: _clinicId,
                patientId: _patientId,
                medicalRecordId: null,
                title: "",
                examType: "mamografia",
                examDate: new DateOnly(2026, 1, 1),
                labFacility: null,
                notes: null,
                fileName: "test.pdf",
                contentType: "application/pdf",
                fileSizeBytes: 1000,
                fileHash: "hash123",
                storagePath: "path",
                uploadedByUserId: "user-1",
                uploadedByName: "User",
                now: _now));
    }

    [Fact]
    public void Deactivate_MarcaIsActiveComoFalso()
    {
        var attachment = PatientExamAttachment.Create(
            clinicId: _clinicId,
            patientId: _patientId,
            medicalRecordId: null,
            title: "Mamografia Digital Bilateral",
            examType: "mamografia",
            examDate: new DateOnly(2026, 2, 10),
            labFacility: "Laboratório Central",
            notes: "BI-RADS 2.",
            fileName: "mamografia.pdf",
            contentType: "application/pdf",
            fileSizeBytes: 1500000,
            fileHash: "hash123",
            storagePath: "path",
            uploadedByUserId: "user-1",
            uploadedByName: "User",
            now: _now);

        Assert.True(attachment.IsActive);

        var deactivatedAt = _now.AddDays(1);
        attachment.Deactivate(deactivatedAt);

        Assert.False(attachment.IsActive);
        Assert.Equal(deactivatedAt, attachment.UpdatedAt);
    }
}
