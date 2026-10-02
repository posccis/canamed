using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "registration_number",
                table: "professionals",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "document",
                table: "patients",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "health_plan_id",
                table: "patients",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "room_id",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "clinic_closures",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clinic_closures", x => x.id);
                    table.ForeignKey(
                        name: "FK_clinic_closures_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "health_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ans_code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_health_plans", x => x.id);
                    table.ForeignKey(
                        name: "FK_health_plans_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "operating_hours",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    starts_at = table.Column<TimeOnly>(type: "time", nullable: false),
                    ends_at = table.Column<TimeOnly>(type: "time", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operating_hours", x => x.id);
                    table.CheckConstraint("ck_operating_hours_day_valid", "day_of_week BETWEEN 0 AND 6");
                    table.CheckConstraint("ck_operating_hours_period_valid", "ends_at > starts_at");
                    table.ForeignKey(
                        name: "FK_operating_hours_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rooms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rooms", x => x.id);
                    table.ForeignKey(
                        name: "FK_rooms_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_patients_health_plan_id",
                table: "patients",
                column: "health_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_clinic_id_room_id_starts_at",
                table: "appointments",
                columns: new[] { "clinic_id", "room_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "IX_appointments_room_id",
                table: "appointments",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinic_closures_clinic_id_date",
                table: "clinic_closures",
                columns: new[] { "clinic_id", "date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_health_plans_clinic_id_name",
                table: "health_plans",
                columns: new[] { "clinic_id", "name" });

            migrationBuilder.CreateIndex(
                name: "IX_operating_hours_clinic_id_day_of_week",
                table: "operating_hours",
                columns: new[] { "clinic_id", "day_of_week" });

            migrationBuilder.CreateIndex(
                name: "IX_rooms_clinic_id_name",
                table: "rooms",
                columns: new[] { "clinic_id", "name" });

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_rooms_room_id",
                table: "appointments",
                column: "room_id",
                principalTable: "rooms",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_patients_health_plans_health_plan_id",
                table: "patients",
                column: "health_plan_id",
                principalTable: "health_plans",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointments_rooms_room_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_patients_health_plans_health_plan_id",
                table: "patients");

            migrationBuilder.DropTable(
                name: "clinic_closures");

            migrationBuilder.DropTable(
                name: "health_plans");

            migrationBuilder.DropTable(
                name: "operating_hours");

            migrationBuilder.DropTable(
                name: "rooms");

            migrationBuilder.DropIndex(
                name: "IX_patients_health_plan_id",
                table: "patients");

            migrationBuilder.DropIndex(
                name: "IX_appointments_clinic_id_room_id_starts_at",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "IX_appointments_room_id",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "registration_number",
                table: "professionals");

            migrationBuilder.DropColumn(
                name: "document",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "health_plan_id",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "room_id",
                table: "appointments");
        }
    }
}
