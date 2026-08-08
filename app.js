/* =========================================================
   TRADINGEDGE APP ENGINE
   ========================================================= */

const STORAGE_KEY = "tradingEdgeData_v1";


/* =========================================================
   DEFAULT DATA
   ========================================================= */

const defaultData = {
    settings: {
        balance: 10000,
        currency: "USD",
        risk: 1,
        maxTrades: 3,
        dailyLoss: 200,
        minRR: 2
    },

    plan: {
        htf: "4H",
        entryTF: "15M",
        notes: "",
        rules: {}
    },

    trades: [],

    discipline: {
        totalChecks: 0,
        completedChecks: 0
    }
};


/* =========================================================
   DATA STORAGE
   ========================================================= */

function loadData() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,
            settings: {
                ...defaultData.settings,
                ...(parsed.settings || {})
            },
            plan: {
                ...defaultData.plan,
                ...(parsed.plan || {})
            },
            trades: Array.isArray(parsed.trades)
                ? parsed.trades
                : []
        };

    } catch (error) {

        console.error("Unable to load TradingEdge data:", error);

        return structuredClone(defaultData);
    }
}


let data = loadData();


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

    updateAll();
}


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function formatMoney(value) {

    const currency = data.settings.currency || "USD";

    try {

        return new Intl.NumberFormat(
            undefined,
            {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 2
            }
        ).format(Number(value) || 0);

    } catch {

        return `${currency} ${Number(value || 0).toFixed(2)}`;
    }
}


function formatR(value) {

    const n = Number(value) || 0;

    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;
}


function todayString() {

    return new Date()
        .toISOString()
        .slice(0, 10);
}


function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageTitles = {
    dashboard: "Dashboard",
    plan: "My Plan",
    trade: "Pre-Trade",
    calculator: "Risk Calculator",
    journal: "Journal",
    analytics: "Analytics",
    settings: "Settings"
};


function openPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {

        page.classList.toggle(
            "active",
            page.id === pageName
        );

    });


    document.querySelectorAll(".nav-btn").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );

    });


    if ($("pageTitle")) {
        $("pageTitle").textContent =
            pageTitles[pageName] || "TradingEdge";
    }


    const sidebar = $("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        openPage(button.dataset.page);

    });

});


document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

        openPage(button.dataset.go);

    });

});


const mobileMenu = $("mobileMenu");

if (mobileMenu) {

    mobileMenu.addEventListener("click", () => {

        $("sidebar").classList.toggle("open");

    });

}


/* =========================================================
   DATE
   ========================================================= */

function updateDate() {

    const element = $("currentDate");

    if (!element) return;

    const date = new Date();

    element.textContent =
        date.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function loadSettingsIntoUI() {

    const s = data.settings;

    if ($("settingBalance"))
        $("settingBalance").value = s.balance;

    if ($("settingCurrency"))
        $("settingCurrency").value = s.currency;

    if ($("settingRisk"))
        $("settingRisk").value = s.risk;

    if ($("settingMaxTrades"))
        $("settingMaxTrades").value = s.maxTrades;

    if ($("settingDailyLoss"))
        $("settingDailyLoss").value = s.dailyLoss;

    if ($("settingMinRR"))
        $("settingMinRR").value = s.minRR;


    if ($("calcBalance"))
        $("calcBalance").value = s.balance;

    if ($("calcRisk"))
        $("calcRisk").value = s.risk;
}


function saveSettings() {

    const balance =
        Number($("settingBalance").value);

    const risk =
        Number($("settingRisk").value);

    const maxTrades =
        Number($("settingMaxTrades").value);

    const dailyLoss =
        Number($("settingDailyLoss").value);

    const minRR =
        Number($("settingMinRR").value);

    if (
        !Number.isFinite(balance) ||
        balance <= 0
    ) {

        showToast("Enter a valid account balance.");

        return;
    }


    if (
        !Number.isFinite(risk) ||
        risk <= 0
    ) {

        showToast("Enter a valid risk percentage.");

        return;
    }


    if (
        !Number.isFinite(maxTrades) ||
        maxTrades < 1
    ) {

        showToast("Maximum trades must be at least 1.");

        return;
    }


    if (
        !Number.isFinite(dailyLoss) ||
        dailyLoss < 0
    ) {

        showToast("Enter a valid daily loss limit.");

        return;
    }


    if (
        !Number.isFinite(minRR) ||
        minRR < 0
    ) {

        showToast("Enter a valid minimum R:R.");

        return;
    }


    data.settings = {

        balance,
        currency: $("settingCurrency").value,
        risk,
        maxTrades,
        dailyLoss,
        minRR

    };


    saveData();

    showToast("Trading rules saved.");
}


$("saveSettings")?.addEventListener(
    "click",
    saveSettings
);


/* =========================================================
   PLAN
   ========================================================= */

function loadPlanIntoUI() {

    const p = data.plan;

    if ($("planHTF"))
        $("planHTF").value = p.htf;

    if ($("planEntryTF"))
        $("planEntryTF").value = p.entryTF;

    if ($("planNotes"))
        $("planNotes").value = p.notes || "";


    document.querySelectorAll(".plan-rule")
        .forEach(input => {

            input.checked =
                Boolean(
                    p.rules[input.dataset.rule]
                );

        });
}


function savePlan() {

    const rules = {};

    document.querySelectorAll(".plan-rule")
        .forEach(input => {

            rules[input.dataset.rule] =
                input.checked;

        });


    data.plan = {

        htf: $("planHTF").value,

        entryTF:
            $("planEntryTF").value,

        notes:
            $("planNotes").value.trim(),

        rules

    };


    saveData();

    showToast("Trading plan saved.");
}


$("savePlan")?.addEventListener(
    "click",
    savePlan
);


/* =========================================================
   PRE-TRADE CHECKLIST
   ========================================================= */

function updateTradeChecklist() {

    const checks =
        document.querySelectorAll(".trade-check");

    const completed =
        document.querySelectorAll(
            ".trade-check:checked"
        ).length;

    const total = checks.length;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    if ($("checkCompleted"))
        $("checkCompleted").textContent =
            completed;

    if ($("checkTotal"))
        $("checkTotal").textContent =
            total;

    if ($("executionPercentage"))
        $("executionPercentage").textContent =
            `${percentage}%`;


    const gate =
        $("executionGate");

    const message =
        $("executionMessage");


    if (!gate) return;


    if (completed === total && total > 0) {

        gate.className =
            "trade-gate allowed";

        gate.querySelector(".gate-status")
            .textContent =
            "🟢 TRADE ALLOWED";

        message.textContent =
            "All pre-trade conditions are satisfied.";

    } else {

        gate.className =
            "trade-gate blocked";

        gate.querySelector(".gate-status")
            .textContent =
            "🔴 TRADE BLOCKED";

        message.textContent =
            `${total - completed} requirement(s) remaining.`;

    }
}


document.querySelectorAll(".trade-check")
    .forEach(input => {

        input.addEventListener(
            "change",
            updateTradeChecklist
        );

    });


$("resetTradeCheck")?.addEventListener(
    "click",
    () => {

        document.querySelectorAll(".trade-check")
            .forEach(input => {

                input.checked = false;

            });

        updateTradeChecklist();

        showToast("Checklist reset.");

    }
);


$("continueToCalculator")
    ?.addEventListener("click", () => {

        const checks =
            document.querySelectorAll(".trade-check");

        const completed =
            document.querySelectorAll(
                ".trade-check:checked"
            ).length;

        if (
            completed !== checks.length
        ) {

            showToast(
                "Complete the checklist before continuing."
            );

            return;
        }

        openPage("calculator");

    });


/* =========================================================
   DAILY STATS
   ========================================================= */

function getTodayTrades() {

    const today = todayString();

    return data.trades.filter(
        trade =>
            trade.date === today
    );
}


function getTodayLoss() {

    return getTodayTrades()
        .filter(trade =>
            Number(trade.pl) < 0
        )
        .reduce(
            (sum, trade) =>
                sum + Math.abs(Number(trade.pl) || 0),
            0
        );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const trades = data.trades;

    const balance =
        Number(data.settings.balance) || 0;


    const pnl =
        trades.reduce(
            (sum, trade) =>
                sum + (Number(trade.pl) || 0),
            0
        );


    const wins =
        trades.filter(
            trade =>
                trade.result === "WIN"
        ).length;


    const winRate =
        trades.length
            ? Math.round(
                (wins / trades.length) * 100
            )
            : 0;


    const todayTrades =
        getTodayTrades().length;


    const todayLoss =
        getTodayLoss();


    const maxTrades =
        Number(data.settings.maxTrades) || 1;


    const dailyLoss =
        Number(data.settings.dailyLoss) || 0;


    const tradePercentage =
        Math.min(
            100,
            (todayTrades / maxTrades) * 100
        );


    const lossPercentage =
        dailyLoss > 0
            ? Math.min(
                100,
                (todayLoss / dailyLoss) * 100
            )
            : 0;


    const discipline =
        calculateDiscipline();


    setText(
        "dashBalance",
        formatMoney(balance)
    );

    setText(
        "dashPnl",
        formatMoney(pnl)
    );

    setText(
        "dashPnlPercent",
        balance
            ? `${((pnl / balance) * 100).toFixed(2)}%`
            : "0.00%"
    );

    setText(
        "dashWinRate",
        `${winRate}%`
    );

    setText(
        "dashTradeCount",
        `${trades.length} trades`
    );

    setText(
        "dashDiscipline",
        `${discipline}%`
    );

    setText(
        "sideDiscipline",
        `${discipline}%`
    );

    setText(
        "todayTrades",
        todayTrades
    );

    setText(
        "maxTradesDisplay",
        maxTrades
    );

    setText(
        "todayLoss",
        todayLoss.toFixed(2)
    );

    setText(
        "dailyLossDisplay",
        dailyLoss.toFixed(2)
    );

    setText(
        "riskDisplay",
        data.settings.risk
    );


    if ($("tradeProgress"))
        $("tradeProgress").style.width =
            `${tradePercentage}%`;

    if ($("lossProgress"))
        $("lossProgress").style.width =
            `${lossPercentage}%`;


    const gate =
        $("dashboardGate");

    const gateMessage =
        $("dashboardGateMessage");


    const blockedByTrades =
        todayTrades >= maxTrades;

    const blockedByLoss =
        dailyLoss > 0 &&
        todayLoss >= dailyLoss;


    if (
        blockedByTrades ||
        blockedByLoss
    ) {

        gate.className =
            "trade-gate blocked";

        gate.querySelector(".gate-status")
            .textContent =
            "🔴 TRADING LOCKED";

        gateMessage.textContent =
            blockedByTrades
                ? "Daily trade limit reached."
                : "Daily loss limit reached.";

    } else {

        gate.className =
            "trade-gate allowed";

        gate.querySelector(".gate-status")
            .textContent =
            "🟢 TRADING AVAILABLE";

        gateMessage.textContent =
            "You may begin your pre-trade checklist.";

    }


    renderRecentTrades();
}


/* =========================================================
   RECENT TRADES
   ========================================================= */

function renderRecentTrades() {

    const body =
        $("recentTrades");

    if (!body) return;


    const trades =
        [...data.trades]
            .reverse()
            .slice(0, 5);


    if (!trades.length) {

        body.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No trades recorded yet.
                </td>
            </tr>
        `;

        return;
    }


    body.innerHTML =
        trades.map(trade => {

            const resultClass =
                trade.result === "WIN"
                    ? "green"
                    : trade.result === "LOSS"
                        ? "red"
                        : "yellow";


            const r =
                Number(trade.r) || 0;

            const pl =
                Number(trade.pl) || 0;


            return `
                <tr>

                    <td>${escapeHTML(trade.date)}</td>

                    <td>${escapeHTML(trade.pair)}</td>

                    <td>${escapeHTML(trade.direction)}</td>

                    <td>${escapeHTML(trade.setup)}</td>

                    <td class="${resultClass}">
                        ${escapeHTML(trade.result)}
                    </td>

                    <td class="${r >= 0 ? "green" : "red"}">
                        ${formatR(r)}
                    </td>

                    <td class="${pl >= 0 ? "green" : "red"}">
                        ${formatMoney(pl)}
                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   JOURNAL
   ========================================================= */

function openTradeModal() {

    $("tradeModal")
        ?.classList.add("open");

}


function closeTradeModal() {

    $("tradeModal")
        ?.classList.remove("open");

}


$("openTradeModal")
    ?.addEventListener(
        "click",
        openTradeModal
    );


$("closeTradeModal")
    ?.addEventListener(
        "click",
        closeTradeModal
    );


$("cancelTrade")
    ?.addEventListener(
        "click",
        closeTradeModal
    );


$("tradeModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("tradeModal")
            ) {

                closeTradeModal();

            }

        }
    );


$("tradeForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const trade = {

                id:
                    Date.now().toString(),

                date:
                    todayString(),

                pair:
                    $("tradePair").value
                        .trim()
                        .toUpperCase(),

                direction:
                    $("tradeDirection").value,

                setup:
                    $("tradeSetup").value
                        .trim(),

                result:
                    $("tradeResult").value,

                r:
                    Number($("tradeR").value),

                pl:
                    Number($("tradePL").value),

                notes:
                    $("tradeNotes").value.trim()

            };


            if (!trade.pair || !trade.setup) {

                showToast(
                    "Complete the required fields."
                );

                return;
            }


            if (
                !Number.isFinite(trade.r) ||
                !Number.isFinite(trade.pl)
            ) {

                showToast(
                    "Enter valid R and P/L values."
                );

                return;
            }


            data.trades.push(trade);

            saveData();

            $("tradeForm").reset();

            closeTradeModal();

            showToast("Trade added to journal.");

        }
    );


function renderJournal() {

    const body =
        $("journalBody");

    if (!body) return;


    const trades =
        [...data.trades]
            .reverse();


    if (!trades.length) {

        body.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    No trades yet. Start your journal.
                </td>
            </tr>
        `;

        return;
    }


    body.innerHTML =
        trades.map(trade => {

            const r =
                Number(trade.r) || 0;

            const pl =
                Number(trade.pl) || 0;


            const resultClass =
                trade.result === "WIN"
                    ? "green"
                    : trade.result === "LOSS"
                        ? "red"
                        : "yellow";


            return `
                <tr>

                    <td>${escapeHTML(trade.date)}</td>

                    <td>${escapeHTML(trade.pair)}</td>

                    <td>${escapeHTML(trade.direction)}</td>

                    <td>${escapeHTML(trade.setup)}</td>

                    <td class="${resultClass}">
                        ${escapeHTML(trade.result)}
                    </td>

                    <td class="${r >= 0
