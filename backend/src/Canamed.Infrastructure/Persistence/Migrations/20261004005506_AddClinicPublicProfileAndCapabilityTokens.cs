using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicPublicProfileAndCapabilityTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "allow_self_reschedule",
                table: "clinics",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "allow_waitlist",
                table: "clinics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "max_online_appointments",
                table: "clinics",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<string>(
                name: "public_name",
                table: "clinics",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "slug",
                table: "clinics",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            // Preenche as clínicas existentes antes de criar o índice único (SPEC-0026/RN-003).
            // O valor é corrigido para o slug desejado pela gestão ou pelo semeador de desenvolvimento.
            migrationBuilder.Sql(
                "UPDATE clinics SET slug = 'clinic-' || replace(id::text, '-', '') WHERE slug IS NULL OR slug = '';");

            migrationBuilder.AlterColumn<string>(
                name: "slug",
                table: "clinics",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60,
                oldDefaultValue: "");

            migrationBuilder.CreateTable(
                name: "patient_capability_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: true),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    queue_entry_id = table.Column<Guid>(type: "uuid", nullable: true),
                    medical_document_id = table.Column<Guid>(type: "uuid", nullable: true),
                    scope = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_capability_tokens", x => x.id);
                    table.CheckConstraint("ck_patient_capability_tokens_scope_valid", "scope IN ('confirm', 'cancel', 'reschedule', 'check_in', 'queue', 'registration', 'document', 'waitlist_offer')");
                    table.CheckConstraint("ck_patient_capability_tokens_status_valid", "status IN ('active', 'used', 'revoked', 'expired')");
                    table.ForeignKey(
                        name: "FK_patient_capability_tokens_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_clinics_slug",
                table: "clinics",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_patient_capability_tokens_appointment_id",
                table: "patient_capability_tokens",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_capability_tokens_clinic_id_scope",
                table: "patient_capability_tokens",
                columns: new[] { "clinic_id", "scope" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_capability_tokens_medical_document_id",
                table: "patient_capability_tokens",
                column: "medical_document_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_capability_tokens_patient_id",
                table: "patient_capability_tokens",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_capability_tokens_queue_entry_id",
                table: "patient_capability_tokens",
                column: "queue_entry_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_capability_tokens_token_hash",
                table: "patient_capability_tokens",
                column: "token_hash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "patient_capability_tokens");

            migrationBuilder.DropIndex(
                name: "IX_clinics_slug",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "allow_self_reschedule",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "allow_waitlist",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "max_online_appointments",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "public_name",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "slug",
                table: "clinics");
        }
    }
}
