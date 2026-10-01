using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AlignAgendaExclusionWithActiveStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Alinha a integridade do banco (RN-001) à definição de agendamento ativo do domínio:
            // apenas `agendado` e `confirmado` ocupam o horário. Estados terminais (`atendido`,
            // `faltou` e `cancelado`) não impedem uma nova marcação no mesmo intervalo.
            migrationBuilder.Sql(
                "ALTER TABLE appointments DROP CONSTRAINT ex_appointments_professional_no_overlap;");

            migrationBuilder.Sql(
                """
                ALTER TABLE appointments
                    ADD CONSTRAINT ex_appointments_professional_no_overlap
                    EXCLUDE USING gist (
                        professional_id WITH =,
                        tstzrange(starts_at, ends_at, '[)') WITH &&
                    )
                    WHERE (deleted_at IS NULL AND status IN ('agendado', 'confirmado'));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE appointments DROP CONSTRAINT ex_appointments_professional_no_overlap;");

            migrationBuilder.Sql(
                """
                ALTER TABLE appointments
                    ADD CONSTRAINT ex_appointments_professional_no_overlap
                    EXCLUDE USING gist (
                        professional_id WITH =,
                        tstzrange(starts_at, ends_at, '[)') WITH &&
                    )
                    WHERE (deleted_at IS NULL AND status <> 'cancelado');
                """);
        }
    }
}
