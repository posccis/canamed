using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPrenatalVisitRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "first_ultrasound_ccn_mm",
                table: "gynecological_consultation_data",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "first_ultrasound_date",
                table: "gynecological_consultation_data",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "first_ultrasound_days",
                table: "gynecological_consultation_data",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "first_ultrasound_weeks",
                table: "gynecological_consultation_data",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "preferred_gestational_reference",
                table: "gynecological_consultation_data",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "prenatal_visit_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: false),
                    visit_date = table.Column<DateOnly>(type: "date", nullable: false),
                    gestational_age_weeks = table.Column<int>(type: "integer", nullable: false),
                    gestational_age_days = table.Column<int>(type: "integer", nullable: false),
                    weight_kg = table.Column<double>(type: "double precision", nullable: false),
                    blood_pressure = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    uterine_height_cm = table.Column<double>(type: "double precision", nullable: true),
                    fetal_heart_rate_bpm = table.Column<int>(type: "integer", nullable: true),
                    fetal_movement_present = table.Column<bool>(type: "boolean", nullable: true),
                    edema_classification = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    fetal_presentation = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    clinical_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prenatal_visit_records", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_prenatal_visit_records_clinic_id_patient_id_visit_date",
                table: "prenatal_visit_records",
                columns: new[] { "clinic_id", "patient_id", "visit_date" });

            migrationBuilder.CreateIndex(
                name: "IX_prenatal_visit_records_medical_record_id",
                table: "prenatal_visit_records",
                column: "medical_record_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "prenatal_visit_records");

            migrationBuilder.DropColumn(
                name: "first_ultrasound_ccn_mm",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "first_ultrasound_date",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "first_ultrasound_days",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "first_ultrasound_weeks",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "preferred_gestational_reference",
                table: "gynecological_consultation_data");
        }
    }
}
