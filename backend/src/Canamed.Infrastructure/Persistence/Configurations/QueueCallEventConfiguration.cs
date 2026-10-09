using Canamed.Domain.Queue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class QueueCallEventConfiguration : IEntityTypeConfiguration<QueueCallEvent>
{
    public void Configure(EntityTypeBuilder<QueueCallEvent> builder)
    {
        builder.ToTable("queue_call_events");
        builder.HasKey(q => q.Id);

        builder.Property(q => q.TicketCode).HasMaxLength(20).IsRequired();
        builder.Property(q => q.PatientName).HasMaxLength(150).IsRequired();
        builder.Property(q => q.RoomName).HasMaxLength(100).IsRequired();
        builder.Property(q => q.ProfessionalName).HasMaxLength(150).IsRequired();

        builder.HasIndex(q => new { q.ClinicId, q.CalledAt });
    }
}
