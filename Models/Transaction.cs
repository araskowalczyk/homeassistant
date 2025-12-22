namespace HomeAssistant.Api.Models;

public enum TransactionType
{
    Expense = 1,
    Income = 2
}

public class Transaction
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public TransactionType Type { get; set; }

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string Category { get; set; } = "";

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
