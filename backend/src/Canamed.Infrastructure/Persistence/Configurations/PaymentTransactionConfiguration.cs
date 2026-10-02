using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("payment_transactions");

        builder.HasKey(transaction => transaction.Id);
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(transaction => transaction.Method).HasMaxLength(30).IsRequired();
        builder.Property(transaction => transaction.Status).HasMaxLength(20).IsRequired();
        builder.Property(transaction => transaction.CardBrand).HasMaxLength(50);
        builder.Property(transaction => transaction.CardLastFourDigits).HasMaxLength(4);
        builder.Property(transaction => transaction.PaidAt).IsRequired();
        builder.Property(transaction => transaction.OperatorId).IsRequired();
        builder.Property(transaction => transaction.Notes).HasMaxLength(500);
        builder.Property(transaction => transaction.RefundReason).HasMaxLength(500);

        builder.HasIndex(transaction => new { transaction.ClinicId, transaction.PaidAt });
        builder.HasIndex(transaction => new { transaction.ClinicId, transaction.AppointmentId });

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(transaction => transaction.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Appointment>()
            .WithMany()
            .HasForeignKey(transaction => transaction.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Patient>()
            .WithMany()
            .HasForeignKey(transaction => transaction.PatientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
