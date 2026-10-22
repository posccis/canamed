using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class LarcPlacementRecordConfiguration : IEntityTypeConfiguration<LarcPlacementRecord>
{
    public void Configure(EntityTypeBuilder<LarcPlacementRecord> builder)
    {
        builder.ToTable("larc_placements");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.ClinicId).IsRequired();
        builder.Property(l => l.PatientId).IsRequired();
        builder.Property(l => l.DeviceType).HasMaxLength(50).IsRequired();
        builder.Property(l => l.DeviceName).HasMaxLength(100).IsRequired();
        builder.Property(l => l.BatchNumber).HasMaxLength(50).IsRequired();
        builder.Property(l => l.InsertionDate).IsRequired();
        builder.Property(l => l.ExpirationDate).IsRequired();
        builder.Property(l => l.HysterometryCm).HasPrecision(4, 1);
        builder.Property(l => l.ProcedureNotes).HasMaxLength(2000);
        builder.Property(l => l.RemovalReason).HasMaxLength(500);

        builder.HasIndex(l => new { l.ClinicId, l.PatientId, l.InsertionDate });
        builder.HasIndex(l => l.ExpirationDate);
        builder.HasIndex(l => l.MedicalRecordId);
    }
}
