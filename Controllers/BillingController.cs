using Microsoft.AspNetCore.Mvc;
using HomeAssistant.Api.Data;
using HomeAssistant.Api.Models;
using HomeAssistant.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace HomeAssistant.Api.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BillingPeriodService _service;

    public BillingController(AppDbContext db, BillingPeriodService service)
    {
        _db = db;
        _service = service;
    }

    private int GetUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Ustawienie dnia startowego okresu
    [HttpPut("settings")]
    public IActionResult SetSettings([FromBody] BillingSettingsRequest request)
    {
        if (request.StartDay < 1 || request.StartDay > 28)
            return BadRequest("StartDay must be between 1 and 28");

        var userId = GetUserId();

        var settings = _db.BillingSettings.FirstOrDefault(x => x.UserId == userId);

        if (settings == null)
        {
            settings = new BillingSettings
            {
                UserId = userId,
                StartDay = request.StartDay
            };

            _db.BillingSettings.Add(settings);
        }
        else
        {
            settings.StartDay = request.StartDay;
        }

        _db.SaveChanges();
        return Ok();
    }

    // Pobranie aktualnego okresu rozliczeniowego
    [HttpGet("current")]
    public ActionResult<BillingPeriodResponse> GetCurrent()
    {
        var userId = GetUserId();

        var settings = _db.BillingSettings.FirstOrDefault(x => x.UserId == userId)
            ?? new BillingSettings { StartDay = 1 };

        var (from, to) = _service.GetCurrentPeriod(settings.StartDay, DateTime.Now);

        return new BillingPeriodResponse
        {
            From = from,
            To = to,
            StartDay = settings.StartDay
        };
    }

    private (DateTime from, DateTime to) CalculateBillingPeriod(int startDay)
    {
        var today = DateTime.Today;

        DateTime periodStart;

        if (today.Day >= startDay)
        {
            // okres zaczyna się w bieżącym miesiącu
            periodStart = new DateTime(today.Year, today.Month, startDay);
        }
        else
        {
            // okres zaczyna się w poprzednim miesiącu
            var prevMonth = today.AddMonths(-1);
            periodStart = new DateTime(prevMonth.Year, prevMonth.Month, startDay);
        }

        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        return (periodStart, periodEnd);
    }
    [Authorize]
    [HttpGet("summary")]
    public IActionResult GetSummary()
    {
        var userId = GetUserId();

        var settings = _db.BillingSettings
            .FirstOrDefault(x => x.UserId == userId)
            ?? new BillingSettings { StartDay = 1 };

        var (from, to) = _service.GetCurrentPeriod(settings.StartDay, DateTime.Now);

        var transactions = _db.Transactions
            .Where(t =>
                t.UserId == userId &&
                t.Date >= from &&
                t.Date <= to)
            .ToList();

        var totalIncome = transactions
            .Where(t => t.Type == TransactionType.Income)
            .Sum(t => t.Amount);

        var totalExpense = transactions
            .Where(t => t.Type == TransactionType.Expense)
            .Sum(t => t.Amount);

        return Ok(new
        {
            from,
            to,
            totalIncome,
            totalExpense,
            balance = totalIncome - totalExpense
        });
    }



}
