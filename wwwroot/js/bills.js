const API = "/api";
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {

    const addBtn = document.getElementById("addBillBtn");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            window.location.href = "/index.html?add=bill";
        });
    }

    loadBills();
});

async function loadBills() {
    const list = document.getElementById("list");

    if (!list) {
        console.error("❌ Brak elementu #list w bills.html");
        return;
    }

    list.innerHTML = "";

    const res = await fetch(`${API}/recurring`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        alert("Błąd pobierania opłat");
        return;
    }

    const bills = await res.json();

    bills.forEach(b => {
        const wrapper = document.createElement("div");
        wrapper.className = "tx-wrapper";

        const badge = b.badge === "LAST_ONE"
            ? `<span class="badge last">zostało 1</span>`
            : "";

        wrapper.innerHTML = `
            <div class="tx-action left">✏️</div>
            <div class="tx-action right">${b.isActive ? "⏸️" : "▶️"}</div>

            <div class="transaction">
                <div class="tx-left">
                    <div class="tx-category">
                        ${b.name}
                        ${badge}
                    </div>
                    <div class="tx-date">
                        Następna: ${b.nextRun ?? "—"}<br>
                        ${b.remaining}
                    </div>
                </div>
                <div class="tx-amount expense">
                    ${b.amount} zł
                </div>
            </div>
        `;

        addSwipe(wrapper, b.id);
        list.appendChild(wrapper);
    });
}

function addSwipe(wrapper, billId) {
    const card = wrapper.querySelector(".transaction");
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    card.addEventListener("touchstart", start);
    card.addEventListener("mousedown", start);

    function start(e) {
        dragging = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        card.style.transition = "none";

        document.addEventListener("touchmove", move);
        document.addEventListener("mousemove", move);
        document.addEventListener("touchend", end);
        document.addEventListener("mouseup", end);
    }

    function move(e) {
        if (!dragging) return;

        currentX = (e.touches ? e.touches[0].clientX : e.clientX) - startX;
        if (Math.abs(currentX) > 100) return;

        card.style.transform = `translateX(${currentX}px)`;
    }

    function end() {
        dragging = false;
        card.style.transition = "transform 0.25s ease";

        if (currentX < -80) {
            toggleBill(billId);
        }
        else if (currentX > 80) {
            window.location.href = `/index.html?editBill=${billId}`;
        }

        card.style.transform = "translateX(0)";
        cleanup();
    }

    function cleanup() {
        document.removeEventListener("touchmove", move);
        document.removeEventListener("mousemove", move);
        document.removeEventListener("touchend", end);
        document.removeEventListener("mouseup", end);
    }
}

async function toggleBill(id) {
    const res = await fetch(`${API}/recurring/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        alert("Błąd pauzy");
        return;
    }

    loadBills(); // 🔥 odśwież listę
}
