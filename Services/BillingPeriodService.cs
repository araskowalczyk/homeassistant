namespace HomeAssistant.Api.Services;

public class BillingPeriodService
{
    public (DateTime from, DateTime to) GetCurrentPeriod(int startDay, DateTime now)
    {
        if (startDay < 1 || startDay > 28)
            throw new ArgumentException("StartDay must be between 1 and 28");

        DateTime periodStart;

        if (now.Day >= startDay)
        {
            periodStart = new DateTime(now.Year, now.Month, startDay);
        }
        else
        {
            var prevMonth = now.AddMonths(-1);
            periodStart = new DateTime(prevMonth.Year, prevMonth.Month, startDay);
        }

        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        return (periodStart.Date, periodEnd.Date);
    }
}
