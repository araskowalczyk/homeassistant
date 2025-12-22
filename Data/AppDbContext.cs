using HomeAssistant.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeAssistant.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<BillingSettings> BillingSettings => Set<BillingSettings>();

    public DbSet<Transaction> Transactions => Set<Transaction>();

    public DbSet<RecurringPayment> RecurringPayments => Set<RecurringPayment>();


}
