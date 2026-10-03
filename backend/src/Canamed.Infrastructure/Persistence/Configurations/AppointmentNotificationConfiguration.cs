using Canamed.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class AppointmentNotificationConfiguration : IEntityTypeConfiguration<AppointmentNotification>
{
    public void Configure(EntityTypeBuilder<AppointmentNotification> builder)
    {
        builder.ToTable("appointment_notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Channel)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(n => n.RecipientPhone)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(n => n.TriggerType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(n => n.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(n => n.MessageBody)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(n => n.ResponsePayload)
            .HasMaxLength(1000);

        builder.Property(n => n.IdempotencyKey)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(n => n.FailureReason)
            .HasMaxLength(500);

        builder.HasIndex(n => n.IdempotencyKey).IsUnique();
        builder.HasIndex(n => new { n.ClinicId, n.Status, n.CreatedAt });
        builder.HasIndex(n => n.AppointmentId);
        builder.HasIndex(n => n.PatientId);
    }
}
