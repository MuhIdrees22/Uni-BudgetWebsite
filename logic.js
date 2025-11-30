// Add Expense Logic
document.getElementById("expense-form")?.addEventListener("submit", function(e){
    e.preventDefault();

    const name = document.getElementById("expName").value;
    const category = document.getElementById("expCategory").value;
    const date = document.getElementById("expDate").value;
    const desc = document.getElementById("expDesc").value;
    const amount = parseFloat(document.getElementById("expAmount").value);

    if(!name || !date || !amount){
        alert("Please fill all required fields.");
        return;
    }

    const expense = { name, category, date, desc, amount };

    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));

    alert("Expense Added Successfully ✔");
    this.reset();
});

function loadDashboard() {
  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

  // Update budget summary
  let totalIncome = 1200; // Temporary placeholder
  let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  let budgetLeft = totalIncome - totalExpenses;

  document.getElementById("incomeValue").textContent = `$${totalIncome.toFixed(2)}`;
  document.getElementById("expenseValue").textContent = `$${totalExpenses.toFixed(2)}`;
  document.getElementById("budgetLeftValue").textContent = `$${budgetLeft.toFixed(2)}`;

  // Fill recent transactions
  const tableBody = document.getElementById("recentTransactionsBody");
  tableBody.innerHTML = "";

  expenses.slice(-5).reverse().forEach(exp => {
    const row = `
      <tr>
        <td>${exp.date}</td>
        <td>${exp.category}</td>
        <td>${exp.name}</td>
        <td>${exp.desc}</td>
        <td>$${exp.amount.toFixed(2)}</td>
      </tr>`;
    tableBody.innerHTML += row;
  });
}

if (document.body.classList.contains("dashboard-page")) {
  loadDashboard();
}

