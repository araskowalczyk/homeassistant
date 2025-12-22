namespace HomeAssistant.Api.Models.Dto;

public class TransactionListItemDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string Category { get; set; } = "";
    public decimal Amount { get; set; }
    public string Type { get; set; } = ""; // Income / Expense
    public string? Description { get; set; }
}
