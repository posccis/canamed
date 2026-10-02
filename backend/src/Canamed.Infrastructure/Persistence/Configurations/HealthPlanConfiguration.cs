using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class HealthPlanConfiguration : IEntityTypeConfiguration<HealthPlan>
{
    public void Configure(EntityTypeBuilder<HealthPlan> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("health_plans");
        builder.HasKey(healthPlan => healthPlan.Id);
        builder.Property(healthPlan => healthPlan.Name).HasMaxLength(200).IsRequired();
        builder.Property(healthPlan => healthPlan.AnsCode).HasMaxLength(30);
        builder.HasIndex(healthPlan => new { healthPlan.ClinicId, healthPlan.Name });

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(healthPlan => healthPlan.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
