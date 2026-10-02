using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWaitingQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "queue_entries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    professional_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    queue_date = table.Column<DateOnly>(type: "date", nullable: false),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    arrived_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    called_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    finished_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_queue_entries", x => x.id);
                    table.CheckConstraint("ck_queue_entries_period_valid", "finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at");
                    table.CheckConstraint("ck_queue_entries_priority_valid", "priority IN ('normal', 'preferencial')");
                    table.CheckConstraint("ck_queue_entries_status_valid", "status IN ('aguardando', 'chamado', 'em_atendimento', 'atendido', 'desistiu', 'cancelado')");
                    table.ForeignKey(
                        name: "FK_queue_entries_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_queue_entries_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_queue_entries_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_queue_entries_professionals_professional_id",
                        column: x => x.professional_id,
                        principalTable: "professionals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_queue_entries_appointment_id",
                table: "queue_entries",
                column: "appointment_id",
                unique: true,
                filter: "status IN ('aguardando', 'chamado', 'em_atendimento')");

            migrationBuilder.CreateIndex(
                name: "IX_queue_entries_clinic_id_queue_date_professional_id",
                table: "queue_entries",
                columns: new[] { "clinic_id", "queue_date", "professional_id" });

            migrationBuilder.CreateIndex(
                name: "IX_queue_entries_patient_id",
                table: "queue_entries",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_queue_entries_professional_id",
                table: "queue_entries",
                column: "professional_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "queue_entries");
        }
    }
}
