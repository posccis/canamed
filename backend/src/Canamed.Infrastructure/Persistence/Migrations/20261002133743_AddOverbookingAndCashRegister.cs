using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOverbookingAndCashRegister : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_overbooking",
                table: "appointments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "overbooking_reason",
                table: "appointments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.Sql("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ex_appointments_professional_no_overlap;");
            migrationBuilder.Sql("""
                ALTER TABLE appointments
                    ADD CONSTRAINT ex_appointments_professional_no_overlap
                    EXCLUDE USING gist (
                        professional_id WITH =,
                        tstzrange(starts_at, ends_at, '[)') WITH &&
                    )
                    WHERE (deleted_at IS NULL AND is_overbooking = false AND status IN ('agendado', 'confirmado'));
                """);

            migrationBuilder.CreateTable(
                name: "cash_register_shifts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    operator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    initial_cash = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    opened_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    closed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    declared_cash = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    expected_cash = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    cash_difference = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cash_register_shifts", x => x.id);
                    table.CheckConstraint("ck_cash_shifts_initial_cash_non_negative", "initial_cash >= 0");
                    table.CheckConstraint("ck_cash_shifts_status_valid", "status IN ('aberto', 'fechado')");
                    table.ForeignKey(
                        name: "FK_cash_register_shifts_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cash_register_shifts_users_operator_id",
                        column: x => x.operator_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cash_movements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cash_register_shift_id = table.Column<Guid>(type: "uuid", nullable: false),
                    operator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cash_movements", x => x.id);
                    table.CheckConstraint("ck_cash_movements_amount_positive", "amount > 0");
                    table.CheckConstraint("ck_cash_movements_type_valid", "type IN ('suprimento', 'sangria')");
                    table.ForeignKey(
                        name: "FK_cash_movements_cash_register_shifts_cash_register_shift_id",
                        column: x => x.cash_register_shift_id,
                        principalTable: "cash_register_shifts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cash_movements_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cash_movements_users_operator_id",
                        column: x => x.operator_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cash_movements_cash_register_shift_id_created_at",
                table: "cash_movements",
                columns: new[] { "cash_register_shift_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_cash_movements_clinic_id",
                table: "cash_movements",
                column: "clinic_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_movements_operator_id",
                table: "cash_movements",
                column: "operator_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_register_shifts_clinic_id_opened_at",
                table: "cash_register_shifts",
                columns: new[] { "clinic_id", "opened_at" });

            migrationBuilder.CreateIndex(
                name: "IX_cash_register_shifts_clinic_id_operator_id_status",
                table: "cash_register_shifts",
                columns: new[] { "clinic_id", "operator_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_cash_register_shifts_operator_id",
                table: "cash_register_shifts",
                column: "operator_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cash_movements");

            migrationBuilder.DropTable(
                name: "cash_register_shifts");

            migrationBuilder.DropColumn(
                name: "is_overbooking",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "overbooking_reason",
                table: "appointments");

            migrationBuilder.Sql("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ex_appointments_professional_no_overlap;");
            migrationBuilder.Sql("""
                ALTER TABLE appointments
                    ADD CONSTRAINT ex_appointments_professional_no_overlap
                    EXCLUDE USING gist (
                        professional_id WITH =,
                        tstzrange(starts_at, ends_at, '[)') WITH &&
                    )
                    WHERE (deleted_at IS NULL AND status IN ('agendado', 'confirmado'));
                """);
        }
    }
}
