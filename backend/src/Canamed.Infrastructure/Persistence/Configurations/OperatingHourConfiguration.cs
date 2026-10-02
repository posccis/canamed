using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class OperatingHourConfiguration : IEntityTypeConfiguration<OperatingHour>
{
    public void Configure(EntityTypeBuilder<OperatingHour> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("operating_hours", table =>
        {
            table.HasCheckConstraint("ck_operating_hours_day_valid", "day_of_week BETWEEN 0 AND 6");
            table.HasCheckConstraint("ck_operating_hours_period_valid", "ends_at > starts_at");
        });

        builder.HasKey(hour => hour.Id);
        builder.Property(hour => hour.StartsAt).HasColumnType("time").IsRequired();
        builder.Property(hour => hour.EndsAt).HasColumnType("time").IsRequired();
        builder.HasIndex(hour => new { hour.ClinicId, hour.DayOfWeek });

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(hour => hour.ClinicId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
