using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGynecologicalRecordTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "is_overbooking",
                table: "appointments",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.CreateTable(
                name: "gynecological_consultation_data",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: false),
                    dum = table.Column<DateOnly>(type: "date", nullable: true),
                    is_dum_uncertain = table.Column<bool>(type: "boolean", nullable: false),
                    is_menopausal = table.Column<bool>(type: "boolean", nullable: false),
                    chief_complaint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    hma = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    is_sexually_active = table.Column<bool>(type: "boolean", nullable: true),
                    dyspareunia = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    breasts_is_normal = table.Column<bool>(type: "boolean", nullable: false),
                    breasts_findings = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    abdomen_is_normal = table.Column<bool>(type: "boolean", nullable: false),
                    abdomen_findings = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    external_genitalia_is_normal = table.Column<bool>(type: "boolean", nullable: false),
                    external_genitalia_findings = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    speculum_exam_is_normal = table.Column<bool>(type: "boolean", nullable: false),
                    speculum_exam_findings = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    bimanual_palpation_is_normal = table.Column<bool>(type: "boolean", nullable: false),
                    bimanual_palpation_findings = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    procedure_performed = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    procedure_batch = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    procedure_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    diagnoses_json = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    prescription_notes = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                    general_orientation_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gynecological_consultation_data", x => x.id);
                    table.ForeignKey(
                        name: "FK_gynecological_consultation_data_medical_records_medical_rec~",
                        column: x => x.medical_record_id,
                        principalTable: "medical_records",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gynecological_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    menarche_age = table.Column<int>(type: "integer", nullable: true),
                    sexarche_age = table.Column<int>(type: "integer", nullable: true),
                    cycle_interval_days = table.Column<int>(type: "integer", nullable: true),
                    cycle_duration_days = table.Column<int>(type: "integer", nullable: true),
                    is_cycle_regular = table.Column<bool>(type: "boolean", nullable: true),
                    flow_intensity = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    dysmenorrhea = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    has_pms = table.Column<bool>(type: "boolean", nullable: true),
                    pms_symptoms = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    menopause_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    menopause_age = table.Column<int>(type: "integer", nullable: true),
                    hrt_in_use = table.Column<bool>(type: "boolean", nullable: true),
                    gravida = table.Column<int>(type: "integer", nullable: false),
                    para = table.Column<int>(type: "integer", nullable: false),
                    cesareans = table.Column<int>(type: "integer", nullable: false),
                    abortions = table.Column<int>(type: "integer", nullable: false),
                    living_children = table.Column<int>(type: "integer", nullable: false),
                    ectopic_pregnancies = table.Column<int>(type: "integer", nullable: false),
                    obstetric_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    current_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    current_method_usage_months = table.Column<int>(type: "integer", nullable: true),
                    previous_methods = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    reproductive_plan = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    pelvic_surgeries = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    sti_history = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    family_cancer_history = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gynecological_profiles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "preventive_screenings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    exam_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    performed_at = table.Column<DateOnly>(type: "date", nullable: false),
                    result_summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    classification = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    next_due_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_preventive_screenings", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_gynecological_consultation_data_medical_record_id",
                table: "gynecological_consultation_data",
                column: "medical_record_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gynecological_profiles_clinic_id_patient_id",
                table: "gynecological_profiles",
                columns: new[] { "clinic_id", "patient_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_preventive_screenings_clinic_id_patient_id_performed_at",
                table: "preventive_screenings",
                columns: new[] { "clinic_id", "patient_id", "performed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_preventive_screenings_medical_record_id",
                table: "preventive_screenings",
                column: "medical_record_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gynecological_consultation_data");

            migrationBuilder.DropTable(
                name: "gynecological_profiles");

            migrationBuilder.DropTable(
                name: "preventive_screenings");

            migrationBuilder.AlterColumn<bool>(
                name: "is_overbooking",
                table: "appointments",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);
        }
    }
}
