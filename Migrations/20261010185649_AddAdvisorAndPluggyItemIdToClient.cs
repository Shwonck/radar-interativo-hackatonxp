using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace hackatonxp.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvisorAndPluggyItemIdToClient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AdvisorId",
                table: "Clients",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PluggyItemId",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clients_AdvisorId",
                table: "Clients",
                column: "AdvisorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clients_Advisors_AdvisorId",
                table: "Clients",
                column: "AdvisorId",
                principalTable: "Advisors",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clients_Advisors_AdvisorId",
                table: "Clients");

            migrationBuilder.DropIndex(
                name: "IX_Clients_AdvisorId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "AdvisorId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PluggyItemId",
                table: "Clients");
        }
    }
}
