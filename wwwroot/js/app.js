// =======================
// GLOBAL CONFIG
// =======================
window.API = "/api";
window.token = localStorage.getItem("token");

let modalMode = "transaction";
// transaction | recurring | editRecurring
let editingRecurringId = null;
let editMode = false;
let editingTransactionId = null;
let returnPage = "index";


if (!token) {
    window.location.href = "/login.html";
}

// =======================
// SUMMARY + CHART
// =======================

let miniChart = null;

async function loadSummary() {
    const res = await fetch(`${API}/billing/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();

    const balanceEl = document.getElementById("balance");
    const periodEl = document.getElementById("period");

    if (!balanceEl || !periodEl) return;

    balanceEl.innerText = `${data.balance.toFixed(2)} zł`;
    periodEl.innerText = `${formatDate(data.from)} – ${formatDate(data.to)}`;

    drawChart(data.totalIncome, data.totalExpense);
}

function drawChart(income, expense) {
    const canvas = document.getElementById("miniChart");
    if (!canvas) return;

    if (miniChart) miniChart.destroy();

    miniChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Wpływy", "Wydatki"],
            datasets: [{
                data: [income, expense],
                backgroundColor: ["#2e7d32", "#d32f2f"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "70%",
            plugins: { legend: { display: false } }
        }
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

// =======================
// RECENT TRANSACTIONS (DASHBOARD)
// =======================

async function loadRecentTransactions() {
    const res = await fetch(`${API}/transactions`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) return;

    const list = await res.json();
    const container = document.getElementById("transactionsList");
    if (!container) return;

    container.innerHTML = "";

    list.slice(0, 5).forEach(t => {
        const row = document.createElement("div");
        row.className = "transaction-item";

        row.innerHTML = `
            <div class="transaction-left">
                <div>${t.category}</div>
                <small>${formatDate(t.date)}</small>
            </div>
            <div class="transaction-right ${t.type === "Income"
                ? "transaction-income"
                : "transaction-expense"}">
                ${t.type === "Income" ? "+" : "-"}${t.amount.toFixed(2)} zł
            </div>
        `;

        container.appendChild(row);
    });
}

// =======================
// MODAL HELPERS
// =======================

function openModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.remove("hidden");
}

function showRecurringFields(show) {
    const box = document.getElementById("recurringFields");
    if (!box) return;

    box.classList.toggle("hidden", !show);
}

function resetRecurringFields() {
    showRecurringFields(false);
    editingRecurringId = null;

    document.getElementById("billDay").value = "";
    document.getElementById("frequencyType").value = "Monthly";
    document.getElementById("selectedMonths").value = "";
    document.getElementById("durationType").value = "Unlimited";
    document.getElementById("totalOccurrences").value = "";
}


function resetModalState() {
    editMode = false;
    editingTransactionId = null;

    const title = document.getElementById("modalTitle");
    if (title) title.innerText = "Nowa transakcja";

    const typeEl = document.getElementById("type");
    if (typeEl) typeEl.disabled = false;
}

// =======================
// ADD + EDIT TRANSACTION
// =======================

window.submitTransaction = async function () {

    if (modalMode === "recurring" || modalMode === "editRecurring") {
        saveRecurring();
        return;
    }

    const body = {
        type: document.getElementById("type")?.value,
        amount: parseFloat(document.getElementById("amount")?.value),
        category: document.getElementById("category")?.value,
        date: document.getElementById("date")?.value,
        description: document.getElementById("description")?.value
    };

    const url = editMode
        ? `${API}/transactions/${editingTransactionId}`
        : `${API}/transactions`;

    const method = editMode ? "PUT" : "POST";

    const res = await fetch(url, {
        method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        alert("Błąd zapisu");
        return;
    }

    closeModal();
    resetModalState();

    if (returnPage === "expenses") {
        window.location.href = "/expenses.html";
        return;
    }

    if (returnPage === "income") {
        window.location.href = "/income.html";
        return;
    }

    // domyślnie pulpit
    loadSummary();
    loadRecentTransactions();

};

// =======================
// EDIT TRANSACTION
// =======================

window.openEditTransaction = function (id, returnTo = "index") {


    // jeśli jesteśmy poza pulpitą → redirect
    if (!document.getElementById("modal")) {
        window.location.href = `/index.html?edit=${id}&return=${returnTo}`;
        return;
    }

    editMode = true;
    editingTransactionId = id;

    const title = document.getElementById("modalTitle");
    if (title) title.innerText = "Edytuj transakcję";

    const typeEl = document.getElementById("type");
    if (typeEl) typeEl.disabled = true;

    fetch(`${API}/transactions/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(t => {
            document.getElementById("type").value = t.type;
            document.getElementById("amount").value = t.amount;
            document.getElementById("category").value = t.category;
            document.getElementById("date").value = t.date.split("T")[0];
            document.getElementById("description").value = t.description ?? "";
            openModal();
        });
};

// =======================
// DOM READY
// =======================

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    if (params.get("add") === "bill") {
        openRecurringModal();
    }

    if (params.get("editBill")) {
        openEditRecurring(params.get("editBill"));
    }


    loadSummary();
    loadRecentTransactions();

    const modal = document.getElementById("modal");
    const addBtn = document.getElementById("addBtn");

    if (modal && addBtn) {
        addBtn.addEventListener("click", () => {
            document.getElementById("date").value =
                new Date().toISOString().substring(0, 10);
            openModal();
        });

        window.closeModal = function () {
            modal.classList.add("hidden");
            resetModalState();

            if (returnPage === "expenses") {
                window.location.href = "/expenses.html";
            }
            if (returnPage === "income") {
                window.location.href = "/income.html";
            }
        };

    }

    // obsługa ?edit=ID
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const returnParam = params.get("return");
    if (returnParam) {
        returnPage = returnParam;
    }

    if (editId) {
        window.openEditTransaction(editId);
    }
});

// =======================
// NAVIGATION
// =======================

function go(page) {
    window.location.href = "/" + page;
}

function openRecurringModal() {
    modalMode = "recurring";

    document.getElementById("modalTitle").innerText = "Nowa opłata cykliczna";

    document.getElementById("type").value = "Expense";
    document.getElementById("type").disabled = true;

    showRecurringFields(true);
    openModal();
}

async function openEditRecurring(id) {
    modalMode = "editRecurring";
    editingRecurringId = id;

    const res = await fetch(`/api/recurring/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const b = await res.json();

    document.getElementById("modalTitle").innerText = "Edytuj opłatę";

    document.getElementById("amount").value = b.amount;
    document.getElementById("category").value = b.category;

    document.getElementById("billDay").value = b.dayOfMonth;
    document.getElementById("frequencyType").value = b.frequencyType;
    document.getElementById("selectedMonths").value = b.selectedMonths ?? "";
    document.getElementById("durationType").value = b.durationType;
    document.getElementById("totalOccurrences").value = b.totalOccurrences ?? "";

    document.getElementById("type").value = "Expense";
    document.getElementById("type").disabled = true;

    showRecurringFields(true);
    openModal();
}


async function saveRecurring() {
    const body = {
        name: document.getElementById("category").value,
        amount: parseFloat(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        type: "Expense",
        dayOfMonth: parseInt(document.getElementById("billDay").value),
        frequencyType: document.getElementById("frequencyType").value,
        selectedMonths: document.getElementById("selectedMonths").value,
        durationType: document.getElementById("durationType").value,
        totalOccurrences:
            document.getElementById("durationType").value === "Fixed"
                ? parseInt(document.getElementById("totalOccurrences").value)
                : null
    };

    const url = modalMode === "editRecurring"
        ? `/api/recurring/${editingRecurringId}`
        : `/api/recurring`;

    const method = modalMode === "editRecurring" ? "PUT" : "POST";

    await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    closeModal();
    resetRecurringFields();
}


