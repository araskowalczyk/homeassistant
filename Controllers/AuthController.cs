using HomeAssistant.Api.Data;
using HomeAssistant.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HomeAssistant.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private const string JwtKey = "SUPER_TAJNY_KLUCZ_ZMIEN_POZNIEJ_32_ZNAKI";

    public AuthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == request.Email);
        if (user == null)
            return Unauthorized("Nieprawidłowy login lub hasło");

        // NA RAZIE: hasło na sztywno (za chwilę hashowanie)
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Nieprawidłowy login lub hasło");


        var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Email)
            };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.Now.AddHours(12),
            signingCredentials: creds
        );

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token)
        });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest request)
    {
        if (_db.Users.Any(u => u.Email == request.Email))
            return BadRequest("Użytkownik już istnieje");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        return Ok("Użytkownik utworzony");
    }

}
