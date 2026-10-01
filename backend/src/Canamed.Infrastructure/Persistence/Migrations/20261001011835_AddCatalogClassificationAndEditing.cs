using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogClassificationAndEditing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "professionals",
                type: "boolean",
                nullable: false,
                // Registros existentes permanecem ativos na migração.
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "specialty_id",
                table: "professionals",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "birth_date",
                table: "patients",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "patients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "appointment_types",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                // Tipos existentes recebem a classificação padrão antes da restrição de integridade.
                defaultValue: "avulsa");

            migrationBuilder.AddColumn<string>(
                name: "coverage",
                table: "appointment_types",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "particular");

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "appointment_types",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "specialty_id",
                table: "appointment_types",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "specialties",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_specialties", x => x.id);
                    table.ForeignKey(
                        name: "FK_specialties_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_professionals_specialty_id",
                table: "professionals",
                column: "specialty_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointment_types_specialty_id",
                table: "appointment_types",
                column: "specialty_id");

            migrationBuilder.AddCheckConstraint(
                name: "ck_appointment_types_category_valid",
                table: "appointment_types",
                sql: "category IN ('avulsa', 'acompanhamento')");

            migrationBuilder.AddCheckConstraint(
                name: "ck_appointment_types_coverage_valid",
                table: "appointment_types",
                sql: "coverage IN ('particular', 'plano_saude')");

            migrationBuilder.CreateIndex(
                name: "IX_specialties_clinic_id_name",
                table: "specialties",
                columns: new[] { "clinic_id", "name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_appointment_types_specialties_specialty_id",
                table: "appointment_types",
                column: "specialty_id",
                principalTable: "specialties",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_professionals_specialties_specialty_id",
                table: "professionals",
                column: "specialty_id",
                principalTable: "specialties",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointment_types_specialties_specialty_id",
                table: "appointment_types");

            migrationBuilder.DropForeignKey(
                name: "FK_professionals_specialties_specialty_id",
                table: "professionals");

            migrationBuilder.DropTable(
                name: "specialties");

            migrationBuilder.DropIndex(
                name: "IX_professionals_specialty_id",
                table: "professionals");

            migrationBuilder.DropIndex(
                name: "IX_appointment_types_specialty_id",
                table: "appointment_types");

            migrationBuilder.DropCheckConstraint(
                name: "ck_appointment_types_category_valid",
                table: "appointment_types");

            migrationBuilder.DropCheckConstraint(
                name: "ck_appointment_types_coverage_valid",
                table: "appointment_types");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "professionals");

            migrationBuilder.DropColumn(
                name: "specialty_id",
                table: "professionals");

            migrationBuilder.DropColumn(
                name: "birth_date",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "email",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "category",
                table: "appointment_types");

            migrationBuilder.DropColumn(
                name: "coverage",
                table: "appointment_types");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "appointment_types");

            migrationBuilder.DropColumn(
                name: "specialty_id",
                table: "appointment_types");
        }
    }
}
