using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Canamed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPrenatalVisitBmiAndBloodType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "bmi",
                table: "prenatal_visit_records",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "bmi",
                table: "prenatal_visit_records");
        }
    }
}
