using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class ClinicPolicyConfiguration : IEntityTypeConfiguration<ClinicPolicy>
{
    public void Configure(EntityTypeBuilder<ClinicPolicy> builder)
    {
        builder.ToTable("clinic_policies");
        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.ClinicId).IsUnique();
    }
}
