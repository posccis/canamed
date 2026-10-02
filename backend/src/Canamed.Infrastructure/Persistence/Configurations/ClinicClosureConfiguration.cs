using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class ClinicClosureConfiguration : IEntityTypeConfiguration<ClinicClosure>
{
    public void Configure(EntityTypeBuilder<ClinicClosure> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("clinic_closures");
        builder.HasKey(closure => closure.Id);
        builder.Property(closure => closure.Date).HasColumnType("date").IsRequired();
        builder.Property(closure => closure.Description).HasMaxLength(200).IsRequired();
        builder.HasIndex(closure => new { closure.ClinicId, closure.Date }).IsUnique();

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(closure => closure.ClinicId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
