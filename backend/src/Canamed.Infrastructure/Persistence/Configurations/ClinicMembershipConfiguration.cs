using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class ClinicMembershipConfiguration : IEntityTypeConfiguration<ClinicMembership>
{
    public void Configure(EntityTypeBuilder<ClinicMembership> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("clinic_memberships");
        builder.HasKey(membership => membership.Id);
        builder.Property(membership => membership.Role).HasMaxLength(40).IsRequired();
        builder.HasIndex(membership => new { membership.UserId, membership.ClinicId }).IsUnique();
        builder.HasIndex(membership => membership.ClinicId);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(membership => membership.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(membership => membership.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Professional>()
            .WithMany()
            .HasForeignKey(membership => membership.ProfessionalId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
