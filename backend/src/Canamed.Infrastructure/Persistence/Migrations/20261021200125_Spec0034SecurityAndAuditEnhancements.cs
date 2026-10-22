using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Spec0034SecurityAndAuditEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_gynecological_consultation_data_medical_records_medical_rec~",
                table: "gynecological_consultation_data");

            migrationBuilder.DropForeignKey(
                name: "FK_medical_record_addenda_medical_records_medical_record_id",
                table: "medical_record_addenda");

            migrationBuilder.AlterColumn<string>(
                name: "sti_history",
                table: "gynecological_profiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "pelvic_surgeries",
                table: "gynecological_profiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "obstetric_notes",
                table: "gynecological_profiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "family_cancer_history",
                table: "gynecological_profiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "prescription_notes",
                table: "gynecological_consultation_data",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(3000)",
                oldMaxLength: 3000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "hma",
                table: "gynecological_consultation_data",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "dyspareunia",
                table: "gynecological_consultation_data",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "client_ip",
                table: "audit_events",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "professional_registration",
                table: "audit_events",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_gynecological_consultation_data_medical_records_medical_rec~",
                table: "gynecological_consultation_data",
                column: "medical_record_id",
                principalTable: "medical_records",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_medical_record_addenda_medical_records_medical_record_id",
                table: "medical_record_addenda",
                column: "medical_record_id",
                principalTable: "medical_records",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_gynecological_consultation_data_medical_records_medical_rec~",
                table: "gynecological_consultation_data");

            migrationBuilder.DropForeignKey(
                name: "FK_medical_record_addenda_medical_records_medical_record_id",
                table: "medical_record_addenda");

            migrationBuilder.DropColumn(
                name: "client_ip",
                table: "audit_events");

            migrationBuilder.DropColumn(
                name: "professional_registration",
                table: "audit_events");

            migrationBuilder.AlterColumn<string>(
                name: "sti_history",
                table: "gynecological_profiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "pelvic_surgeries",
                table: "gynecological_profiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "obstetric_notes",
                table: "gynecological_profiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "family_cancer_history",
                table: "gynecological_profiles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "prescription_notes",
                table: "gynecological_consultation_data",
                type: "character varying(3000)",
                maxLength: 3000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "hma",
                table: "gynecological_consultation_data",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "dyspareunia",
                table: "gynecological_consultation_data",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_gynecological_consultation_data_medical_records_medical_rec~",
                table: "gynecological_consultation_data",
                column: "medical_record_id",
                principalTable: "medical_records",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_medical_record_addenda_medical_records_medical_record_id",
                table: "medical_record_addenda",
                column: "medical_record_id",
                principalTable: "medical_records",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
