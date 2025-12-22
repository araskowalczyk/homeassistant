const API = "/api";
const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
    loadExpenses();
});

async function loadExpenses() {

    if (!token) {
        console.error("Brak tokena");
        return;
    }

    const res = await fetch(`${API}/transactions`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        console.error("Błąd API transactions");
        return;
    }

    const data = await res.json();
    const expenses = data.filter(t => t.type === "Expense");

    const list = document.getElementById("list");
    if (!list) {
        console.error("Brak #list w DOM");
        return;
    }

    list.innerHTML = "";

    expenses.forEach(t => {

        const wrapper = document.createElement("div");
        wrapper.className = "tx-wrapper";

        wrapper.innerHTML = `
            <div class="tx-action left">✏️</div>
            <div class="tx-action right">🗑️</div>

            <div class="transaction">
                <div class="tx-left">
                    <div class="tx-category">${t.category}</div>
                    <div class="tx-date">${new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div class="tx-amount expense">-${t.amount} zł</div>
            </div>
        `;

        addSwipe(wrapper, t.id);
        list.appendChild(wrapper);
    });
}

function addSwipe(wrapper, transactionId) {

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
            deleteTransaction(transactionId, wrapper);
            card.style.transform = "translateX(0)";
        }
        else if (currentX > 80) {

            // karta zostaje wysunięta
            card.style.transform = "translateX(80px)";

            setTimeout(() => {
                openEditTransaction(transactionId, "expenses");

                // po otwarciu modala wraca
                card.style.transform = "translateX(0)";
            }, 150);
        }



        /*else if (currentX > 80) {
            openEditTransaction(transactionId, "expenses");

        }
        else {
            card.style.transform = "translateX(0)";
        }*/

        document.removeEventListener("touchmove", move);
        document.removeEventListener("mousemove", move);
        document.removeEventListener("touchend", end);
        document.removeEventListener("mouseup", end);
    }
}

// funkcja DELETE

async function deleteTransaction(id, wrapper) {

    if (!confirm("Usunąć transakcję?")) {
        wrapper.querySelector(".transaction").style.transform = "translateX(0)";
        return;
    }

    const res = await fetch(`${API}/transactions/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        alert("Błąd usuwania");
        wrapper.querySelector(".transaction").style.transform = "translateX(0)";
        return;
    }

    // animacja znikania
    wrapper.style.height = wrapper.offsetHeight + "px";
    wrapper.style.transition = "all 0.3s ease";
    setTimeout(() => {
        wrapper.style.height = "0";
        wrapper.style.opacity = "0";
        wrapper.style.margin = "0";
    }, 10);

    setTimeout(() => wrapper.remove(), 300);
}











/*const API = "/api";
const token = localStorage.getItem("token");

async function loadExpenses() {
    const res = await fetch(`${API}/transactions`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    const expenses = data.filter(t => t.type === "Expense");

    const list = document.getElementById("list");
    list.innerHTML = "";

    expenses.forEach(t => {

        const wrapper = document.createElement("div");
        wrapper.className = "tx-wrapper";

        wrapper.innerHTML = `
            <div class="tx-action left">🗑️</div>
            <div class="tx-action right">✏️</div>

            <div class="transaction">
                <div class="tx-left">
                    <div class="tx-category">${t.category}</div>
                    <div class="tx-date">${new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div class="tx-amount expense">-${t.amount} zł</div>
            </div>
        `;

        addSwipe(wrapper, t.id);
        list.appendChild(wrapper);
    });
}

loadExpenses();

function addSwipe(wrapper, transactionId) {

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

        if (Math.abs(currentX) > 120) return;
        card.style.transform = `translateX(${currentX}px)`;
    }

    function end() {
        dragging = false;
        card.style.transition = "transform 0.25s ease";

        if (currentX < -80) {
            deleteTransaction(transactionId);
        }
        else if (currentX > 80) {
            editTransaction(transactionId);
        }
        else {
            card.style.transform = "translateX(0)";
        }

        document.removeEventListener("touchmove", move);
        document.removeEventListener("mousemove", move);
        document.removeEventListener("touchend", end);
        document.removeEventListener("mouseup", end);
    }
}

async function deleteTransaction(id) {
    if (!confirm("Usunąć wydatek?")) return;

    await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    loadExpenses();
}

function editTransaction(id) {
    alert("Edycja transakcji ID: " + id);
    // następny krok: modal edycji
}


/*const API = "/api";
const token = localStorage.getItem("token");

async function loadExpenses() {

    const res = await fetch(`${API}/transactions`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    const expenses = data.filter(t => t.type === "Expense");

    const list = document.getElementById("list");
    list.innerHTML = "";

    expenses.forEach(t => {
        const div = document.createElement("div");
        div.className = "transaction";
        div.innerHTML = `
    <div class="tx-left">
        <div class="tx-category">${t.category}</div>
        <div class="tx-date">${new Date(t.date).toLocaleDateString()}</div>
    </div>
    <div class="tx-amount expense">- ${t.amount} zł</div>
        `;
        /*div.innerHTML = `
            <div class="left">
                <div class="category">${t.category}</div>
                <div class="date">${new Date(t.date).toLocaleDateString()}</div>
            </div>
            <div class="amount">- ${t.amount} zł</div>
        `;
        list.appendChild(div);
    });
}

loadExpenses();

function go(page) {
    window.location.href = "/" + page;
}
*/