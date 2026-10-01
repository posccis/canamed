using Canamed.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class LoginChallengeConfiguration : IEntityTypeConfiguration<LoginChallenge>
{
    public void Configure(EntityTypeBuilder<LoginChallenge> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("login_challenges");
        builder.HasKey(challenge => challenge.Id);
        builder.HasIndex(challenge => challenge.UserId);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(challenge => challenge.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
