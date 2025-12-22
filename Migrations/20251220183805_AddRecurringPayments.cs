using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeAssistant.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecurringPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    DayOfMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    FrequencyType = table.Column<string>(type: "TEXT", nullable: false),
                    SelectedMonths = table.Column<string>(type: "TEXT", nullable: true),
                    DurationType = table.Column<string>(type: "TEXT", nullable: false),
                    TotalOccurrences = table.Column<int>(type: "INTEGER", nullable: true),
                    GeneratedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsArchived = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastGeneratedPeriod = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPayments", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecurringPayments");
        }
    }
}
