namespace HomeAssistant.Api.Models;

public class BillingSettings
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// Dzień miesiąca, od którego zaczyna się okres rozliczeniowy (1–28)
    /// </summary>
    public int StartDay { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
