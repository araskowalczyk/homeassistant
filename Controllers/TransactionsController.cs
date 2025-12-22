using HomeAssistant.Api.Data;
using HomeAssistant.Api.Models;
using HomeAssistant.Api.Models.Dto;
using HomeAssistant.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;



namespace HomeAssistant.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BillingPeriodService _billingService;
    private readonly RecurringPaymentsService _recurringService;

    public TransactionsController(
    AppDbContext db,
    BillingPeriodService billingService,
    RecurringPaymentsService recurringService)
    {
        _db = db;
        _billingService = billingService;
        _recurringService = recurringService;
    }


    private int GetUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Dodanie transakcji
    [HttpPost]
    public IActionResult Add([FromBody] TransactionRequest request)
    {
        var userId = GetUserId();

        var transaction = new Transaction
        {
            UserId = userId,
            Type = request.Type,
            Amount = request.Amount,
            Date = request.Date.Date,
            Category = request.Category,
            Description = request.Description
        };

        _db.Transactions.Add(transaction);
        _db.SaveChanges();

        return Ok();
    }

    // Lista transakcji z aktualnego okresu



    [HttpGet]
    public async Task<IActionResult> GetCurrentPeriodTransactions()
    {
        var userId = GetUserId();

        // 🔥 GENERUJ OPŁATY CYKLICZNE
        await _recurringService.EnsureGeneratedAsync(userId);

        var settings = _db.BillingSettings
            .FirstOrDefault(x => x.UserId == userId)
            ?? new BillingSettings { StartDay = 1 };

        var (from, to) = _billingService.GetCurrentPeriod(settings.StartDay, DateTime.Now);

        var list = await _db.Transactions
            .Where(t =>
                t.UserId == userId &&
                t.Date >= from &&
                t.Date <= to)
            .OrderByDescending(t => t.Date)
            .Select(t => new TransactionListItemDto
            {
                Id = t.Id,
                Date = t.Date,
                Category = t.Category,
                Amount = t.Amount,
                Type = t.Type.ToString(),
                Description = t.Description
            })
            .ToListAsync();

        return Ok(list);
    }

    // DELETE /api/transactions/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        var userId = GetUserId();

        var tx = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (tx == null)
            return NotFound();

        _db.Transactions.Remove(tx);
        await _db.SaveChangesAsync();

        return NoContent();
    }


    //Edycja wpływów i wydatków
    // GET /api/transactions/{id}
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var userId = GetUserId();

        var tx = _db.Transactions
            .Where(t => t.Id == id && t.UserId == userId)
            .Select(t => new
            {
                t.Id,
                t.Type,
                t.Amount,
                t.Date,
                t.Category,
                t.Description
            })
            .FirstOrDefault();

        if (tx == null)
            return NotFound();

        return Ok(tx);
    }


    //Zapis edytowanej transakcji
    // PUT /api/transactions/{id}
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] TransactionRequest request)
    {
        var userId = GetUserId();

        var tx = _db.Transactions
            .FirstOrDefault(t => t.Id == id && t.UserId == userId);

        if (tx == null)
            return NotFound();

        tx.Amount = request.Amount;
        tx.Date = request.Date.Date;
        tx.Category = request.Category;
        tx.Description = request.Description;

        _db.SaveChanges();

        return NoContent();
    }


}


