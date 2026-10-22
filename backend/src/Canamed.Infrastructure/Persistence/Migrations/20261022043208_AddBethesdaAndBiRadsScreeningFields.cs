using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBethesdaAndBiRadsScreeningFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "bethesda_classification",
                table: "preventive_screenings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bi_rads_category",
                table: "preventive_screenings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "clinical_conduct_notes",
                table: "preventive_screenings",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "hpv_dna_result",
                table: "preventive_screenings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "bethesda_classification",
                table: "preventive_screenings");

            migrationBuilder.DropColumn(
                name: "bi_rads_category",
                table: "preventive_screenings");

            migrationBuilder.DropColumn(
                name: "clinical_conduct_notes",
                table: "preventive_screenings");

            migrationBuilder.DropColumn(
                name: "hpv_dna_result",
                table: "preventive_screenings");
        }
    }
}
