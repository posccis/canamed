using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentsAndTriage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "payment_status",
                table: "appointments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "pendente");

            migrationBuilder.CreateTable(
                name: "payment_transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    method = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    card_brand = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    card_last_four_digits = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    operator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    refunded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    refund_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    refunded_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_payment_transactions_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_payment_transactions_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_payment_transactions_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "triage_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    queue_entry_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    blood_pressure = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    heart_rate = table.Column<int>(type: "integer", nullable: true),
                    temperature = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    oxygen_saturation = table.Column<int>(type: "integer", nullable: true),
                    glucose = table.Column<int>(type: "integer", nullable: true),
                    weight_kg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    height_cm = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    calculated_bmi = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    chief_complaint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    allergies = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    risk_classification = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    recorded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    operator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    operator_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_triage_records", x => x.id);
                    table.ForeignKey(
                        name: "FK_triage_records_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_triage_records_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_triage_records_queue_entries_queue_entry_id",
                        column: x => x.queue_entry_id,
                        principalTable: "queue_entries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_appointment_id",
                table: "payment_transactions",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_clinic_id_appointment_id",
                table: "payment_transactions",
                columns: new[] { "clinic_id", "appointment_id" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_clinic_id_paid_at",
                table: "payment_transactions",
                columns: new[] { "clinic_id", "paid_at" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_transactions_patient_id",
                table: "payment_transactions",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_triage_records_clinic_id_queue_entry_id",
                table: "triage_records",
                columns: new[] { "clinic_id", "queue_entry_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_triage_records_patient_id",
                table: "triage_records",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_triage_records_queue_entry_id",
                table: "triage_records",
                column: "queue_entry_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "payment_transactions");

            migrationBuilder.DropTable(
                name: "triage_records");

            migrationBuilder.DropColumn(
                name: "payment_status",
                table: "appointments");
        }
    }
}
