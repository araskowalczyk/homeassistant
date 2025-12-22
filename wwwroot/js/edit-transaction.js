const API = "/api";
const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    alert("Brak ID transakcji");
    window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    loadTransaction();
});

async function loadTransaction() {

    const res = await fetch(`${API}/transactions/${id}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        alert("Nie znaleziono transakcji");
        return;
    }

    const t = await res.json();

    document.getElementById("amount").value = t.amount;
    document.getElementById("date").value = t.date.split("T")[0];
    document.getElementById("category").value = t.category;
    document.getElementById("description").value = t.description ?? "";
}

document.getElementById("editForm").addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
        amount: parseFloat(amount.value),
        date: date.value,
        category: category.value,
        description: description.value
    };

    const res = await fetch(`${API}/transactions/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        alert("Błąd zapisu");
        return;
    }

    window.history.back();
});

document.getElementById("cancel").addEventListener("click", () => {
    window.history.back();
});
