using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientExamAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "patient_exam_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    exam_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    exam_date = table.Column<DateOnly>(type: "date", nullable: false),
                    lab_facility = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    file_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    storage_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    uploaded_by_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    uploaded_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_exam_attachments", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_patient_exam_attachments_clinic_id_id",
                table: "patient_exam_attachments",
                columns: new[] { "clinic_id", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_exam_attachments_clinic_id_patient_id_exam_date",
                table: "patient_exam_attachments",
                columns: new[] { "clinic_id", "patient_id", "exam_date" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_exam_attachments_medical_record_id",
                table: "patient_exam_attachments",
                column: "medical_record_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "patient_exam_attachments");
        }
    }
}
