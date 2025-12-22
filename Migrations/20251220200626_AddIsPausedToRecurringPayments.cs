using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeAssistant.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPausedToRecurringPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaused",
                table: "RecurringPayments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPaused",
                table: "RecurringPayments");
        }
    }
}
