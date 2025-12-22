namespace HomeAssistant.Api.Models;

public class BudgetSummaryResponse
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }

    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }

    public decimal Balance => TotalIncome - TotalExpense;
}
