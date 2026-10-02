using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("rooms");
        builder.HasKey(room => room.Id);
        builder.Property(room => room.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(room => new { room.ClinicId, room.Name });

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(room => room.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
