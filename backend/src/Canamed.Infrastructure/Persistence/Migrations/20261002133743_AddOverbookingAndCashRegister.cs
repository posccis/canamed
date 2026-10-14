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
            migrationBuilder.Sql("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_overbooking boolean NOT NULL DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS overbooking_reason character varying(500);");

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

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS cash_register_shifts (
                    id uuid NOT NULL PRIMARY KEY,
                    clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
                    operator_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                    status character varying(20) NOT NULL,
                    initial_cash numeric(18,2) NOT NULL,
                    opened_at timestamp with time zone NOT NULL,
                    closed_at timestamp with time zone,
                    declared_cash numeric(18,2),
                    expected_cash numeric(18,2),
                    cash_difference numeric(18,2),
                    notes character varying(500),
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT ck_cash_shifts_initial_cash_non_negative CHECK (initial_cash >= 0),
                    CONSTRAINT ck_cash_shifts_status_valid CHECK (status IN ('aberto', 'fechado'))
                );
                CREATE INDEX IF NOT EXISTS "IX_cash_register_shifts_clinic_id_opened_at" ON cash_register_shifts (clinic_id, opened_at);
                CREATE INDEX IF NOT EXISTS "IX_cash_register_shifts_clinic_id_operator_id_status" ON cash_register_shifts (clinic_id, operator_id, status);
                CREATE INDEX IF NOT EXISTS "IX_cash_register_shifts_operator_id" ON cash_register_shifts (operator_id);
            """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS cash_movements (
                    id uuid NOT NULL PRIMARY KEY,
                    clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
                    cash_register_shift_id uuid REFERENCES cash_register_shifts(id) ON DELETE RESTRICT,
                    operator_id uuid REFERENCES users(id) ON DELETE RESTRICT,
                    type character varying(20),
                    amount numeric(18,2) NOT NULL,
                    reason character varying(500) NOT NULL,
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL
                );
                CREATE INDEX IF NOT EXISTS "IX_cash_movements_clinic_id" ON cash_movements (clinic_id);
                CREATE INDEX IF NOT EXISTS "IX_cash_movements_operator_id" ON cash_movements (operator_id);
            """);
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
