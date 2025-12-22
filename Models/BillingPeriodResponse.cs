namespace HomeAssistant.Api.Models;

public class BillingPeriodResponse
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int StartDay { get; set; }
}
