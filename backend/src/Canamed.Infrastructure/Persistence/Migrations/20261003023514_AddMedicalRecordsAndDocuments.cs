using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicalRecordsAndDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "medical_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    document_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    content_payload = table.Column<string>(type: "jsonb", nullable: false),
                    cid10_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    patient_consented_cid = table.Column<bool>(type: "boolean", nullable: false),
                    signature_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    public_token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    cancellation_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    signed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medical_documents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    subjective = table.Column<string>(type: "text", nullable: true),
                    objective = table.Column<string>(type: "text", nullable: true),
                    assessment = table.Column<string>(type: "text", nullable: true),
                    plan = table.Column<string>(type: "text", nullable: true),
                    clinical_notes = table.Column<string>(type: "text", nullable: true),
                    finalized_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    finalized_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medical_records", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_record_addenda",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: false),
                    doctor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    justification = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medical_record_addenda", x => x.id);
                    table.ForeignKey(
                        name: "FK_medical_record_addenda_medical_records_medical_record_id",
                        column: x => x.medical_record_id,
                        principalTable: "medical_records",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_medical_documents_clinic_id_patient_id_created_at",
                table: "medical_documents",
                columns: new[] { "clinic_id", "patient_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_medical_documents_medical_record_id",
                table: "medical_documents",
                column: "medical_record_id");

            migrationBuilder.CreateIndex(
                name: "IX_medical_documents_public_token",
                table: "medical_documents",
                column: "public_token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_medical_record_addenda_medical_record_id",
                table: "medical_record_addenda",
                column: "medical_record_id");

            migrationBuilder.CreateIndex(
                name: "IX_medical_records_appointment_id",
                table: "medical_records",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "IX_medical_records_clinic_id_patient_id_created_at",
                table: "medical_records",
                columns: new[] { "clinic_id", "patient_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "medical_documents");

            migrationBuilder.DropTable(
                name: "medical_record_addenda");

            migrationBuilder.DropTable(
                name: "medical_records");
        }
    }
}
