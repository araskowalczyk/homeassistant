namespace HomeAssistant.Api.Models;

public class TransactionRequest
{
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Category { get; set; } = "";
    public string? Description { get; set; }
}
