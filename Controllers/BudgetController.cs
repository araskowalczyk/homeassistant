using HomeAssistant.Api.Data;
using HomeAssistant.Api.Models;
using HomeAssistant.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HomeAssistant.Api.Controllers;

[ApiController]
[Route("api/budget")]
[Authorize]
public class BudgetController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BillingPeriodService _billingService;

    public BudgetController(AppDbContext db, BillingPeriodService billingService)
    {
        _db = db;
        _billingService = billingService;
    }

    private int GetUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /*[HttpGet("summary")]
    public ActionResult<BudgetSummaryResponse> GetSummary()
    {
        var userId = GetUserId();

        var settings = _db.BillingSettings.FirstOrDefault(x => x.UserId == userId)
            ?? new BillingSettings { StartDay = 1 };

        var (from, to) = _billingService.GetCurrentPeriod(settings.StartDay, DateTime.Now);

         ⬇️ MATERIALIZUJEMY LISTĘ (LINQ → C#)
        var transactions = _db.Transactions
            .Where(t => t.UserId == userId && t.Date >= from && t.Date <= to)
            .ToList();

        var income = transactions
            .Where(t => t.Type == TransactionType.Income)
            .Sum(t => t.Amount);

        var expense = transactions
            .Where(t => t.Type == TransactionType.Expense)
            .Sum(t => t.Amount);

        return new BudgetSummaryResponse
        {
            From = from,
            To = to,
            TotalIncome = income,
            TotalExpense = expense
        };
    }*/

}

