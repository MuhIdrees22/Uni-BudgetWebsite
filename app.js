document.addEventListener("DOMContentLoaded", () => {

    // ===== LOGIN + SIGNUP =====
    const page = document.body.getAttribute("data-page") || document.body.className;

    // Handle sign up button click from login page
    document.getElementById("go-signup")?.addEventListener("click", () => {
        window.location.href = "signup.html";
    });

    document.getElementById("go-reviews")?.addEventListener("click", () => {
        window.location.href = "reviews.html";
    });

    // Sign out handler (clears session and returns to sign-in page)
    document.getElementById("sign-out")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Sign out now?")) {
            localStorage.removeItem("loggedIn");
            // Optionally keep user data but clear session
            window.location.href = "index.html";
        }
    });

    if (page.includes("signup")) {
        document.getElementById("signup-form")?.addEventListener("submit", e => {
            e.preventDefault();
            const user = {
                name: document.getElementById("signup-name").value,
                email: document.getElementById("signup-email").value,
                phone: document.getElementById("signup-phone").value || "",
                address: document.getElementById("signup-address").value || "",
                password: document.getElementById("signup-password").value
            };
            localStorage.setItem("user", JSON.stringify(user));
            alert("Account created! You can sign in now.");
            setTimeout(() => window.location.href = "index.html", 100);
        });
    }

    if (page.includes("login")) {
        document.getElementById("login-form")?.addEventListener("submit", e => {
            e.preventDefault();

            const savedUser = JSON.parse(localStorage.getItem("user"));
            const email = document.getElementById("login-email").value;
            const pass = document.getElementById("login-password").value;

            if (!savedUser) return alert("Please sign up first.");

            if (email === savedUser.email && pass === savedUser.password) {
                localStorage.setItem("loggedIn", "true");
                setTimeout(() => window.location.href = "dashboard.html", 100);
            } else {
                alert("Incorrect login.");
            }
        });
    }

    if (!localStorage.getItem("loggedIn") && !page.includes("login") && !page.includes("signup")) {
        window.location.href = "index.html";
        return;
    }

    // ===== EXPENSE SYSTEM =====
    function sanitizeAmount(val) {
        if (typeof val === 'number') return Number(val);
        if (!val) return 0;
        // remove anything except digits, dot, minus
        const cleaned = String(val).replace(/[^0-9.\-]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const _rawExpenses = JSON.parse(localStorage.getItem("expenses")) || [];
    const expenses = _rawExpenses.map(e => ({ ...e, amount: sanitizeAmount(e.amount) }));

    function addExpense() {
        const form = document.getElementById("add-expense-form");
        if (!form) return;

        form.addEventListener("submit", e => {
            e.preventDefault();

            const rawAmount = document.getElementById("exp-amount").value;
            const newExpense = {
                name: document.getElementById("exp-name").value,
                category: document.getElementById("exp-category").value,
                date: document.getElementById("exp-date").value,
                description: document.getElementById("exp-description").value,
                amount: sanitizeAmount(rawAmount),
                tag: document.getElementById("exp-tag").value
            };

            expenses.push(newExpense);
            localStorage.setItem("expenses", JSON.stringify(expenses));

            alert("Expense added!");
            window.location.href = "dashboard.html";
        });
    }

    function updateBalances() {
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Build a month map so we can compute per-month incomes and expenses
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthMap = {};
        expenses.forEach(e => {
            const date = new Date(e.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            const monthLabel = monthNames[date.getMonth()];

            if (!monthMap[monthKey]) monthMap[monthKey] = { label: monthLabel, expenses: 0, incomeEntries: 0 };

            const name = (e.name || "").toString().toLowerCase();
            const category = (e.category || "").toString().toLowerCase();
            const tag = (e.tag || "").toString().toLowerCase();
            const incomeKeywords = /money|salary|pay|deposit|transfer|income/;
            const isIncome = category === 'income' || tag === 'income' || incomeKeywords.test(name);

            if (isIncome) {
                monthMap[monthKey].incomeEntries += Number(e.amount);
            } else {
                monthMap[monthKey].expenses += Number(e.amount);
            }
        });

        // Read optional default monthly income from settings (localStorage). If not set, default to 1200.
        const defaultIncome = Number(localStorage.getItem('defaultIncome')) || 1200;

        // Total income is the sum of per-month incomes (use stored default for months without explicit income entries)
        const monthKeys = Object.keys(monthMap);
        let totalIncome = 0;
        if (monthKeys.length > 0) {
            // Sum each month's income as base default + any explicit income entries for that month
            totalIncome = monthKeys.reduce((sum, k) => {
                const m = monthMap[k];
                return sum + (defaultIncome + (m.incomeEntries || 0));
            }, 0);
        } else {
            // If there are no months recorded yet, assume a single month with the default income
            totalIncome = defaultIncome;
        }

        const totalBalance = totalIncome - totalExpenses;

        // Calculate current month's budget left using per-month income (or default)
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`;
        const currentMonthExpenses = (monthMap[currentMonthKey] && monthMap[currentMonthKey].expenses) ? monthMap[currentMonthKey].expenses : 0;
        // Compute current month income as base default plus any explicit income entries (keep behaviour consistent with reports)
        const currentMonthIncome = defaultIncome + ((monthMap[currentMonthKey] && monthMap[currentMonthKey].incomeEntries) || 0);
        const currentMonthBudgetLeft = currentMonthIncome - currentMonthExpenses;

        setText("bal-total", totalBalance);
        setText("bal-income", totalIncome);
        setText("bal-expense", totalExpenses);
        // Ensure budget left is non-negative and does not exceed the total balance
        setText("bal-left", Math.max(0, Math.min(currentMonthBudgetLeft, totalBalance)));
    }

    function getCurrencySymbol() {
        const currency = localStorage.getItem("pref-currency") || "CAD";
        const symbols = { CAD: "$", USD: "$", EUR: "€" };
        return symbols[currency] || "$";
    }

    function getCurrencyCode() {
        return localStorage.getItem("pref-currency") || "CAD";
    }

    // Exchange rates (base: CAD)
    function convertCurrency(amountInCAD, targetCurrency) {
        const rates = {
            CAD: 1,
            USD: 0.75,      // 1 CAD = 0.75 USD
            EUR: 0.68       // 1 CAD = 0.68 EUR
        };
        const rate = rates[targetCurrency] || 1;
        return amountInCAD * rate;
    }

    function getDisplayAmount(amountInCAD) {
        const currency = getCurrencyCode();
        return convertCurrency(amountInCAD, currency);
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        const symbol = getCurrencySymbol();
        const convertedValue = getDisplayAmount(Number(value));
        if (el) el.textContent = `${symbol}${convertedValue.toFixed(2)}`;
    }

    function updateRecent() {
        const body = document.getElementById("recent-body");
        if (!body) return;

        if (expenses.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align: center; opacity: 0.7; padding: 20px;">No expenses yet. Add one to get started!</td></tr>`;
            return;
        }

                body.innerHTML = "";
                const symbol = getCurrencySymbol();
                expenses.slice(-5).reverse().forEach(e => {
                        const category = (e.category || e.tag || "Other");
                        let catSlug = String(category).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
                        const allowed = ["food", "school", "transport", "rent", "other"];
                        if (!allowed.includes(catSlug)) catSlug = "other";
                        const convertedAmount = getDisplayAmount(Number(e.amount));
                        body.insertAdjacentHTML("beforeend", `
                            <tr>
                                <td>${e.date}</td>
                                <td>${e.category}</td>
                                <td>${e.name}</td>
                                <td>${e.description || "-"}</td>
                                <td>${symbol}${convertedAmount.toFixed(2)}</td>
                                <td><span class="tag-bar tag-${catSlug}" title="${category}"></span></td>
                            </tr>
                        `);
                });
    }

    function updateReports() {
        const monthlyBody = document.getElementById("monthly-report-body");
        const highestIncomeEl = document.getElementById("highest-income-month");
        const lowestBudgetEl = document.getElementById("lowest-budget-month");

        if (!monthlyBody) return;

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthMap = {};
        const defaultIncome = Number(localStorage.getItem('defaultIncome')) || 1200;

        // Group expenses by month. Detect income entries and separate them.
        expenses.forEach(e => {
            const date = new Date(e.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            const monthLabel = monthNames[date.getMonth()];

            if (!monthMap[monthKey]) {
                monthMap[monthKey] = { label: monthLabel, expenses: 0, incomeEntries: 0 };
            }

            const name = (e.name || "").toString().toLowerCase();
            const category = (e.category || "").toString().toLowerCase();
            const tag = (e.tag || "").toString().toLowerCase();

            const incomeKeywords = /money|salary|pay|deposit|transfer|income/;
            const isIncome = category === 'income' || tag === 'income' || incomeKeywords.test(name);

            if (isIncome) {
                monthMap[monthKey].incomeEntries += Number(e.amount);
            } else {
                monthMap[monthKey].expenses += Number(e.amount);
            }
        });

        // Render monthly reports and find highest/lowest
        monthlyBody.innerHTML = "";
        let highestIncome = { month: "—", value: -Infinity };
        let lowestBudget = { month: "—", value: Infinity };

        Object.keys(monthMap).sort().forEach(key => {
            const m = monthMap[key];
            // Use base default income plus any explicit income entries for that month (preserve previous behavior)
            const income = defaultIncome + (m.incomeEntries || 0);
            const expensesVal = m.expenses || 0;
            const budgetLeft = income - expensesVal;

            // Track highest income month (by computed income)
            if (income > highestIncome.value) {
                highestIncome = { month: m.label, value: income };
            }
            // Track lowest budget left
            if (budgetLeft < lowestBudget.value) {
                lowestBudget = { month: m.label, value: budgetLeft };
            }

            const symbol = getCurrencySymbol();
            const convertedIncome = getDisplayAmount(income);
            const convertedExpenses = getDisplayAmount(expensesVal);
            const convertedBudgetLeft = getDisplayAmount(Math.max(0, budgetLeft));
            monthlyBody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${m.label}</td>
                    <td>${symbol}${convertedIncome.toFixed(2)}</td>
                    <td>${symbol}${convertedExpenses.toFixed(2)}</td>
                    <td>${symbol}${convertedBudgetLeft.toFixed(2)}</td>
                </tr>
            `);
        });

        // If no months with expenses, show placeholder
        if (Object.keys(monthMap).length === 0) {
            monthlyBody.innerHTML = `<tr><td colspan="4" style="text-align: center; opacity: 0.7; padding: 20px;">No data yet. Add expenses to see monthly reports.</td></tr>`;
            highestIncome = { month: "—", value: -Infinity };
            lowestBudget = { month: "—", value: Infinity };
        }

        // Update overview with month names
        if (highestIncomeEl) highestIncomeEl.textContent = highestIncome.month;
        if (lowestBudgetEl) lowestBudgetEl.textContent = lowestBudget.month;
    }

    function buildCharts() {
        const pie = document.getElementById("pieChart");
        const bar = document.getElementById("barChart");
        if (!pie && !bar) return;

        const categories = ["Food", "School", "Transport", "Rent", "Other"];
        const totals = categories.map(cat =>
            expenses.filter(e => e.category === cat)
                    .reduce((s, e) => s + Number(e.amount), 0)
        );

        const colors = ["#3b82f6", "#9333ea", "#16a34a", "#ea580c", "#dc2626"];

        // Destroy existing charts if they exist
        if (pie && pie.chart) {
            try { pie.chart.destroy(); } catch (err) { /* ignore */ }
        }
        if (bar && bar.chart) {
            try { bar.chart.destroy(); } catch (err) { /* ignore */ }
        }

        if (pie) {
            pie.chart = new Chart(pie, {
                type: "pie",
                data: {
                    labels: categories,
                    datasets: [{
                        data: totals,
                        backgroundColor: colors,
                        borderColor: "rgba(255, 255, 255, 0.06)",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } }
                }
            });
        }

        if (bar) {
            bar.chart = new Chart(bar, {
                type: "bar",
                data: {
                    labels: categories,
                    datasets: [{
                        data: totals,
                        backgroundColor: colors,
                        borderRadius: 8
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true },
                        y: { ticks: { autoSkip: false } }
                    }
                }
            });
        }
    }

    // Debug: Show total expenses stored and add clear button
    function updateDebugInfo() {
        const debugEl = document.getElementById("debug-info");
        if (debugEl) {
            const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            debugEl.textContent = `Total expenses stored: ${expenses.length} items = $${total.toFixed(2)}`;
        }
    }

    // Populate settings page with user account info
    function populateAccountInfo() {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (savedUser) {
            const nameEl = document.getElementById("set-name");
            const emailEl = document.getElementById("set-email");
            const phoneEl = document.getElementById("set-phone");
            const addressEl = document.getElementById("set-address");
            if (nameEl) nameEl.textContent = savedUser.name || "Student";
            if (emailEl) emailEl.textContent = savedUser.email || "you@example.com";
            if (phoneEl) phoneEl.textContent = savedUser.phone || "—";
            if (addressEl) addressEl.textContent = savedUser.address || "—";
        }
    }

    // Export expenses as JSON
    function exportExpenses() {
        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        const dataStr = JSON.stringify(expenses, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `expenses_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Export expenses as CSV
    function exportExpensesCSV() {
        const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        if (expenses.length === 0) {
            alert("No expenses to export.");
            return;
        }
        const headers = ["Date", "Name", "Category", "Amount", "Description", "Tag"];
        const rows = expenses.map(e => [
            e.date || "",
            e.name || "",
            e.category || "",
            e.amount || "",
            e.description || "",
            e.tag || ""
        ]);
        let csv = headers.join(",") + "\n";
        rows.forEach(row => {
            csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
        });
        const dataBlob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Wire up export buttons
    document.querySelectorAll('button.btn.secondary').forEach(btn => {
        if (btn.textContent.includes("Export expenses")) {
            btn.addEventListener("click", exportExpenses);
        } else if (btn.textContent.includes("Export CSV")) {
            btn.addEventListener("click", exportExpensesCSV);
        }
    });

    // Handle Clear all data button
    document.getElementById("btn-clear-data")?.addEventListener("click", () => {
        if (confirm("Clear ALL expenses? This cannot be undone.")) {
            localStorage.removeItem("expenses");
            alert("All expenses cleared.");
            window.location.reload();
        }
    });

    // Load and handle preferences (currency and timezone)
    function loadPreferences() {
        const savedCurrency = localStorage.getItem("pref-currency") || "CAD";
        const savedTimezone = localStorage.getItem("pref-timezone") || "EST";
        const currencySelect = document.getElementById("pref-currency");
        const timezoneSelect = document.getElementById("pref-timezone");
        if (currencySelect) currencySelect.value = savedCurrency;
        if (timezoneSelect) timezoneSelect.value = savedTimezone;
    }

    // Wire up preference dropdowns
    document.getElementById("pref-currency")?.addEventListener("change", (e) => {
        localStorage.setItem("pref-currency", e.target.value);
        // Update currency display on add-expense page if it exists
        updateCurrencyDisplay();
        // Trigger refresh of all monetary displays
        updateBalances();
        updateRecent();
        updateReports();
    });

    document.getElementById("pref-timezone")?.addEventListener("change", (e) => {
        localStorage.setItem("pref-timezone", e.target.value);
    });

    // Update currency code display
    function updateCurrencyDisplay() {
        const currencyCodeEl = document.getElementById("currency-code");
        if (currencyCodeEl) {
            currencyCodeEl.textContent = `(${getCurrencyCode()})`;
        }
    }

    loadPreferences();
    updateCurrencyDisplay();

    addExpense();
    updateBalances();
    updateRecent();
    updateReports();
    buildCharts();
    updateDebugInfo();
    populateAccountInfo();
});
