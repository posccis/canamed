using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Spec0035ConsolidationGynObstetricAndAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "abdomen_is_normal",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "bimanual_palpation_is_normal",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "breasts_is_normal",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "external_genitalia_is_normal",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "speculum_exam_is_normal",
                table: "gynecological_consultation_data");

            migrationBuilder.AlterColumn<string>(
                name: "preferred_gestational_reference",
                table: "gynecological_consultation_data",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "abdomen_status",
                table: "gynecological_consultation_data",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bimanual_palpation_status",
                table: "gynecological_consultation_data",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "breasts_status",
                table: "gynecological_consultation_data",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cervical_clock_findings_json",
                table: "gynecological_consultation_data",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "external_genitalia_status",
                table: "gynecological_consultation_data",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "speculum_exam_status",
                table: "gynecological_consultation_data",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "clinical_pre_anamnesis",
                table: "appointments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "planned_return_days",
                table: "appointments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "pre_exam_instructions_acknowledged",
                table: "appointments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "abdomen_status",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "bimanual_palpation_status",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "breasts_status",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "cervical_clock_findings_json",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "external_genitalia_status",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "speculum_exam_status",
                table: "gynecological_consultation_data");

            migrationBuilder.DropColumn(
                name: "clinical_pre_anamnesis",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "planned_return_days",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "pre_exam_instructions_acknowledged",
                table: "appointments");

            migrationBuilder.AlterColumn<int>(
                name: "preferred_gestational_reference",
                table: "gynecological_consultation_data",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "abdomen_is_normal",
                table: "gynecological_consultation_data",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "bimanual_palpation_is_normal",
                table: "gynecological_consultation_data",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "breasts_is_normal",
                table: "gynecological_consultation_data",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "external_genitalia_is_normal",
                table: "gynecological_consultation_data",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "speculum_exam_is_normal",
                table: "gynecological_consultation_data",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
