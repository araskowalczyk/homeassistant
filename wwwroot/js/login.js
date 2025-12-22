console.log("LOGIN.JS START");

const btn = document.getElementById("loginBtn");
console.log("BTN:", btn);

btn.addEventListener("click", async () => {
    console.log("KLIK");

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    error.innerText = "";

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            error.innerText = "Nieprawidłowy login lub hasło";
            return;
        }

        const data = await res.json();
        localStorage.setItem("token", data.token);

        window.location.href = "/index.html";
    }
    catch (e) {
        console.error(e);
        error.innerText = "Błąd połączenia z API";
    }
});
