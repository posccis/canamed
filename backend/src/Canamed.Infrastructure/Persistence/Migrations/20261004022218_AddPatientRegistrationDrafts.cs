using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientRegistrationDrafts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "patient_registration_drafts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    capability_token_id = table.Column<Guid>(type: "uuid", nullable: true),
                    payload_json = table.Column<string>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    review_note = table.Column<string>(type: "text", nullable: true),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_registration_drafts", x => x.id);
                    table.CheckConstraint("ck_patient_registration_drafts_status_valid", "status IN ('draft', 'pending_review', 'approved', 'returned')");
                    table.ForeignKey(
                        name: "FK_patient_registration_drafts_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_patient_registration_drafts_patient_capability_tokens_capab~",
                        column: x => x.capability_token_id,
                        principalTable: "patient_capability_tokens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_patient_registration_drafts_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_patient_registration_drafts_users_reviewed_by",
                        column: x => x.reviewed_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_patient_registration_drafts_capability_token_id",
                table: "patient_registration_drafts",
                column: "capability_token_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_registration_drafts_clinic_id_status",
                table: "patient_registration_drafts",
                columns: new[] { "clinic_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_registration_drafts_patient_id",
                table: "patient_registration_drafts",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_registration_drafts_reviewed_by",
                table: "patient_registration_drafts",
                column: "reviewed_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "patient_registration_drafts");
        }
    }
}
