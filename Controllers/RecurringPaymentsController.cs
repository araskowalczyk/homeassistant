using HomeAssistant.Api.Data;
using HomeAssistant.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HomeAssistant.Api.Controllers;

[ApiController]
[Route("api/recurring")]
[Authorize]
public class RecurringPaymentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RecurringPaymentsController(AppDbContext db)
    {
        _db = db;
    }

    private int GetUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // =========================
    // GET: lista opłat
    // =========================
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();

        var list = await _db.RecurringPayments
            .Where(r => r.UserId == userId && !r.IsArchived)
            .OrderBy(r => r.Name)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Amount,
                r.Category,
                r.Type,
                r.DayOfMonth,
                r.IsActive,
                r.GeneratedCount,
                r.TotalOccurrences,
                Remaining = r.TotalOccurrences == null
                    ? $"{r.GeneratedCount} z N"
                    : $"{r.GeneratedCount} z {r.TotalOccurrences}"
            })
            .ToListAsync();

        return Ok(list);
    }

    // =========================
    // POST: dodanie opłaty
    // =========================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RecurringPayment model)
    {
        model.UserId = GetUserId();
        model.GeneratedCount = 0;
        model.IsActive = true;
        model.IsArchived = false;
        model.LastGeneratedPeriod = null;

        _db.RecurringPayments.Add(model);
        await _db.SaveChangesAsync();

        return Ok();
    }

    // =========================
    // PUT: edycja opłaty
    // =========================
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] RecurringPayment input)
    {
        var userId = GetUserId();

        var payment = await _db.RecurringPayments
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId && !r.IsArchived);

        if (payment == null)
            return NotFound();

        payment.Name = input.Name;
        payment.Amount = input.Amount;
        payment.Category = input.Category;
        payment.DayOfMonth = input.DayOfMonth;
        payment.FrequencyType = input.FrequencyType;
        payment.SelectedMonths = input.SelectedMonths;
        payment.DurationType = input.DurationType;
        payment.TotalOccurrences = input.TotalOccurrences;

        await _db.SaveChangesAsync();
        return Ok();
    }

    // =========================
    // PATCH: pauza / wznowienie
    // =========================
    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var userId = GetUserId();

        var payment = await _db.RecurringPayments
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId && !r.IsArchived);

        if (payment == null)
            return NotFound();

        payment.IsActive = !payment.IsActive;
        await _db.SaveChangesAsync();

        return Ok(new { payment.IsActive });
    }

    // =========================
    // DELETE: archiwizacja
    // =========================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(int id)
    {
        var userId = GetUserId();

        var payment = await _db.RecurringPayments
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId && !r.IsArchived);

        if (payment == null)
            return NotFound();

        payment.IsArchived = true;
        payment.IsActive = false;

        await _db.SaveChangesAsync();
        return NoContent();
    }
    // GET /api/recurring/{id}
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var userId = GetUserId();

        var bill = _db.RecurringPayments
            .Where(r => r.Id == id && r.UserId == userId)
            .Select(r => new
            {
                r.Id,
                r.Amount,
                r.Category,
                r.DayOfMonth,
                r.FrequencyType,
                r.SelectedMonths,
                r.DurationType,
                r.TotalOccurrences,
                r.IsPaused
            })
            .FirstOrDefault();

        if (bill == null)
            return NotFound();

        return Ok(bill);
    }


}




