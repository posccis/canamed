using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientPortalAndKioskAndPrivacy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "check_in_origin",
                table: "queue_entries",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ticket_code",
                table: "queue_entries",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "origin",
                table: "appointments",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "desk");

            migrationBuilder.CreateTable(
                name: "appointment_notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    channel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    recipient_phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    trigger_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    message_body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    response_payload = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    idempotency_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    replied_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    failure_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointment_notifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_document_access_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    medical_document_id = table.Column<Guid>(type: "uuid", nullable: false),
                    access_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medical_document_access_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "patient_communication_preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    whats_app_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    sms_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    opted_out_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    opt_out_reason = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_communication_preferences", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "patient_otp_codes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    cpf = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    code_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    attempts_count = table.Column<int>(type: "integer", nullable: false),
                    verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_otp_codes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "patient_portal_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    session_token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_portal_sessions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "privacy_consents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    consent_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    policy_version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_granted = table.Column<bool>(type: "boolean", nullable: false),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    granted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_privacy_consents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "privacy_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    protocol = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    request_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    details = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    response_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    due_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_privacy_requests", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_appointment_notifications_appointment_id",
                table: "appointment_notifications",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointment_notifications_clinic_id_status_created_at",
                table: "appointment_notifications",
                columns: new[] { "clinic_id", "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_appointment_notifications_idempotency_key",
                table: "appointment_notifications",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_appointment_notifications_patient_id",
                table: "appointment_notifications",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_medical_document_access_logs_medical_document_id_created_at",
                table: "medical_document_access_logs",
                columns: new[] { "medical_document_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_communication_preferences_patient_id",
                table: "patient_communication_preferences",
                column: "patient_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_patient_otp_codes_phone_cpf_expires_at",
                table: "patient_otp_codes",
                columns: new[] { "phone", "cpf", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_portal_sessions_patient_id_expires_at",
                table: "patient_portal_sessions",
                columns: new[] { "patient_id", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_portal_sessions_session_token",
                table: "patient_portal_sessions",
                column: "session_token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_privacy_consents_patient_id_consent_type",
                table: "privacy_consents",
                columns: new[] { "patient_id", "consent_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_privacy_requests_clinic_id_status",
                table: "privacy_requests",
                columns: new[] { "clinic_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_privacy_requests_patient_id",
                table: "privacy_requests",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_privacy_requests_protocol",
                table: "privacy_requests",
                column: "protocol",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointment_notifications");

            migrationBuilder.DropTable(
                name: "medical_document_access_logs");

            migrationBuilder.DropTable(
                name: "patient_communication_preferences");

            migrationBuilder.DropTable(
                name: "patient_otp_codes");

            migrationBuilder.DropTable(
                name: "patient_portal_sessions");

            migrationBuilder.DropTable(
                name: "privacy_consents");

            migrationBuilder.DropTable(
                name: "privacy_requests");

            migrationBuilder.DropColumn(
                name: "check_in_origin",
                table: "queue_entries");

            migrationBuilder.DropColumn(
                name: "ticket_code",
                table: "queue_entries");

            migrationBuilder.DropColumn(
                name: "origin",
                table: "appointments");
        }
    }
}
