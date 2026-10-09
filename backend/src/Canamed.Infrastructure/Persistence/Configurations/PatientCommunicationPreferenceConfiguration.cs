using Canamed.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PatientCommunicationPreferenceConfiguration : IEntityTypeConfiguration<PatientCommunicationPreference>
{
    public void Configure(EntityTypeBuilder<PatientCommunicationPreference> builder)
    {
        builder.ToTable("patient_communication_preferences");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.WhatsAppEnabled)
            .IsRequired();

        builder.Property(p => p.SmsEnabled)
            .IsRequired();

        builder.Property(p => p.OptOutReason)
            .HasMaxLength(250);

        builder.HasIndex(p => p.PatientId).IsUnique();
    }
}
