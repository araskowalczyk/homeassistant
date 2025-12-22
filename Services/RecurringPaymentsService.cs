using HomeAssistant.Api.Data;
using HomeAssistant.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeAssistant.Api.Services;

public class RecurringPaymentsService
{
    private readonly AppDbContext _db;
    private readonly BillingPeriodService _billing;

    public RecurringPaymentsService(
        AppDbContext db,
        BillingPeriodService billing)
    {
        _db = db;
        _billing = billing;
    }

    public async Task EnsureGeneratedAsync(int userId)
    {
        var settings = await _db.BillingSettings
            .FirstOrDefaultAsync(x => x.UserId == userId)
            ?? new BillingSettings { StartDay = 1 };

        var (periodStart, _) =
            _billing.GetCurrentPeriod(settings.StartDay, DateTime.Now);

        var payments = await _db.RecurringPayments
            .Where(r =>
                r.UserId == userId &&
                r.IsActive &&
                !r.IsArchived)
            .ToListAsync();

        foreach (var rp in payments)
        {
            // już wygenerowana w tym okresie
            if (rp.LastGeneratedPeriod == periodStart)
                continue;

            // zakończona (Fixed)
            if (rp.DurationType == "Fixed" &&
                rp.TotalOccurrences != null &&
                rp.GeneratedCount >= rp.TotalOccurrences)
            {
                rp.IsActive = false;
                continue;
            }

            // czy ten miesiąc jest dozwolony
            if (!IsMonthAllowed(rp, periodStart.Month))
                continue;

            // tworzymy transakcję
            var tx = new Transaction
            {
                UserId = userId,
                Type = Enum.Parse<TransactionType>(rp.Type, ignoreCase: true),

                Amount = rp.Amount,
                Category = rp.Category,
                Date = new DateTime(
                    periodStart.Year,
                    periodStart.Month,
                    Math.Min(rp.DayOfMonth, 28)),
                Description = $"Opłata cykliczna: {rp.Name}"
            };

            _db.Transactions.Add(tx);

            rp.GeneratedCount++;
            rp.LastGeneratedPeriod = periodStart;

            // jeśli to była ostatnia
            if (rp.DurationType == "Fixed" &&
                rp.TotalOccurrences != null &&
                rp.GeneratedCount >= rp.TotalOccurrences)
            {
                rp.IsActive = false;
            }
        }

        await _db.SaveChangesAsync();
    }

    private bool IsMonthAllowed(RecurringPayment rp, int month)
    {
        if (rp.FrequencyType == "Monthly")
            return true;

        if (string.IsNullOrWhiteSpace(rp.SelectedMonths))
            return false;

        var months = rp.SelectedMonths
            .Split(',')
            .Select(int.Parse);

        return months.Contains(month);
    }
}
