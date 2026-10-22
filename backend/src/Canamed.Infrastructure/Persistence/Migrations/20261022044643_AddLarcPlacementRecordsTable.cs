using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLarcPlacementRecordsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "larc_placements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_record_id = table.Column<Guid>(type: "uuid", nullable: true),
                    device_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    device_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    batch_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    insertion_date = table.Column<DateOnly>(type: "date", nullable: false),
                    expiration_date = table.Column<DateOnly>(type: "date", nullable: false),
                    control_ultrasound_date = table.Column<DateOnly>(type: "date", nullable: true),
                    hysterometry_cm = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    procedure_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    is_removed = table.Column<bool>(type: "boolean", nullable: false),
                    removal_date = table.Column<DateOnly>(type: "date", nullable: true),
                    removal_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_larc_placements", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_larc_placements_clinic_id_patient_id_insertion_date",
                table: "larc_placements",
                columns: new[] { "clinic_id", "patient_id", "insertion_date" });

            migrationBuilder.CreateIndex(
                name: "IX_larc_placements_expiration_date",
                table: "larc_placements",
                column: "expiration_date");

            migrationBuilder.CreateIndex(
                name: "IX_larc_placements_medical_record_id",
                table: "larc_placements",
                column: "medical_record_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "larc_placements");
        }
    }
}
