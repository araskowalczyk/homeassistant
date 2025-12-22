using System.ComponentModel.DataAnnotations;

namespace HomeAssistant.Api.Models;

public class RecurringPayment
{
    public int Id { get; set; }

    // ===== USER =====
    public int UserId { get; set; }

    // ===== BASIC INFO =====
    [Required]
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = "Expense"; // Expense | Income

    public int DayOfMonth { get; set; } // 1–28 (bezpiecznie)

    // ===== FREQUENCY =====
    [Required]
    public string FrequencyType { get; set; } = "Monthly";
    // Monthly | SelectedMonths

    public string? SelectedMonths { get; set; }
    // np. "3,6,7,9"

    // ===== DURATION =====
    [Required]
    public string DurationType { get; set; } = "Unlimited";
    // Unlimited | Fixed

    public int? TotalOccurrences { get; set; } // NULL = Unlimited
    public int GeneratedCount { get; set; } = 0;

    // ===== STATE =====
    public bool IsActive { get; set; } = true;   // PAUSE / RESUME
    public bool IsArchived { get; set; } = false; // DELETE (soft)
    public bool IsPaused { get; set; } = false;


    // ===== CONTROL =====
    public DateTime? LastGeneratedPeriod { get; set; }
}

