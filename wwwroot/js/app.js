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


// GENEROWANIE CHIPSÓW

const months = [
    "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
    "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"
];

function initMonthChips(selected = "") {
    const container = document.getElementById("monthsChips");
    const hiddenInput = document.getElementById("selectedMonths");

    if (!container || !hiddenInput) return;

    const selectedSet = new Set(
        selected
            .split(",")
            .map(x => parseInt(x))
            .filter(x => !isNaN(x))
    );

    container.innerHTML = "";

    months.forEach((name, i) => {
        const monthNumber = i + 1;
        const chip = document.createElement("div");
        chip.className = "month-chip";
        chip.innerText = name;

        if (selectedSet.has(monthNumber)) {
            chip.classList.add("active");
        }

        chip.addEventListener("click", () => {
            chip.classList.toggle("active");

            const activeMonths = [...container.children]
                .map((c, idx) => c.classList.contains("active") ? idx + 1 : null)
                .filter(x => x !== null);

            hiddenInput.value = activeMonths.join(",");
        });

        container.appendChild(chip);
    });

    hiddenInput.value = [...selectedSet].join(",");
}

function updateMonthsVisibility() {
    const frequencySelect = document.getElementById("frequencyType");
    const chips = document.getElementById("monthsChips");
    const hiddenInput = document.getElementById("selectedMonths");

    if (!frequencySelect || !chips || !hiddenInput) return;

    if (frequencySelect.value === "SelectedMonths") {
        chips.classList.remove("hidden");
        initMonthChips(hiddenInput.value);
    } else {
        chips.classList.add("hidden");
        hiddenInput.value = "";
    }
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

    // Tutaj doałem Chipsy w DOM
    const monthsContainer = document.getElementById("monthsChips");
    if (monthsContainer) {
        initMonthChips();
    }

    // obsługa ?edit=ID
    const editId = params.get("edit");
    const returnParam = params.get("return");
    if (returnParam) {
        returnPage = returnParam;
    }

    if (editId) {
        window.openEditTransaction(editId);
    }

    // OBSŁUGA FREQUNCY TYPE (OPŁAT CYKLICZNYCH DLA WYBRANYCH MIESIECY ETC.)

    const frequencySelect = document.getElementById("frequencyType");
    const monthsChipsContainer = document.getElementById("monthsChips");
    const selectedMonthsInput = document.getElementById("selectedMonths");

    if (frequencySelect && monthsChipsContainer && selectedMonthsInput) {

        function updateFrequencyUI() {
            if (frequencySelect.value === "SelectedMonths") {
                // ✅ pokazujemy TYLKO chipsy
                monthsChipsContainer.classList.remove("hidden");

                // inicjalizujemy chipsy z aktualnej wartości
                initMonthChips(selectedMonthsInput.value);
            } else {
                // ✅ ukrywamy chipsy
                monthsChipsContainer.classList.add("hidden");

                // ✅ czyścimy wybrane miesiące
                selectedMonthsInput.value = "";
            }
        }

        // 🔹 reaguj na zmianę selecta
        frequencySelect.addEventListener("change", updateFrequencyUI);

        // 🔹 WAŻNE: ustaw UI przy starcie (ADD / EDIT)
        updateFrequencyUI();
    }




    const durationSelect = document.getElementById("durationType");
    const totalOccurrencesInput = document.getElementById("totalOccurrences");

    if (durationSelect) {
        durationSelect.addEventListener("change", () => {
            if (durationSelect.value === "Fixed") {
                totalOccurrencesInput.classList.remove("hidden");
            } else {
                totalOccurrencesInput.classList.add("hidden");
                totalOccurrencesInput.value = ""; // 🔥 ważne
            }
        });
    }




});

// =======================
// NAVIGATION
// =======================

function go(page) {
    window.location.href = "/" + page;
}

// =======================
// EDIT RECURRING PAYMENT (KROK 2.3)
// =======================

window.openEditRecurring = async function (id) {
    modalMode = "editRecurring";
    editingRecurringId = id;

    const res = await fetch(`/api/recurring/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        alert("Nie udało się pobrać opłaty");
        return;
    }

    const b = await res.json();

    document.getElementById("modalTitle").innerText = "Edytuj opłatę";

    document.getElementById("amount").value = b.amount;
    document.getElementById("category").value = b.category;

    document.getElementById("billDay").value = b.dayOfMonth;

    document.getElementById("frequencyType").value = b.frequencyType;
    document.getElementById("selectedMonths").value = b.selectedMonths ?? "";
    initMonthChips(b.selectedMonths ?? "");

    const monthsChips = document.getElementById("monthsChips");

    if (b.frequencyType === "SelectedMonths") {
        monthsChips?.classList.remove("hidden");
        initMonthChips(b.selectedMonths ?? "");
    } else {
        monthsChips?.classList.add("hidden");
    }


    document.getElementById("durationType").value = b.durationType;
    document.getElementById("totalOccurrences").value = b.totalOccurrences ?? "";

    document.getElementById("type").value = "Expense";
    document.getElementById("type").disabled = true;

    showRecurringFields(true);
    updateMonthsVisibility();
    openModal();
};



function openRecurringModal() {
    modalMode = "recurring";

    document.getElementById("modalTitle").innerText = "Nowa opłata cykliczna";

    document.getElementById("type").value = "Expense";
    document.getElementById("type").disabled = true;

    showRecurringFields(true);
    updateMonthsVisibility();
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


