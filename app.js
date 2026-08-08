/* =========================================================
   TRADINGEDGE — PERSONAL TRADING JOURNAL
   ========================================================= */

const STORAGE_KEY = "tradingedge_personal_v1";


/* =========================================================
   DEFAULT DATA
   ========================================================= */

const DEFAULT_DATA = {
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
        rules: {
            context: true,
            zone: true,
            liquidity: true,
            structure: true,
            risk: true,
            rr: true
        }
    },

    trades: []
};


let data = loadData();


/* =========================================================
   STORAGE
   ========================================================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(DEFAULT_DATA);
        }

        const parsed =
            JSON.parse(saved);

        return {

            ...structuredClone(DEFAULT_DATA),

            ...parsed,

            settings: {
                ...DEFAULT_DATA.settings,
                ...(parsed.settings || {})
            },

            plan: {
                ...DEFAULT_DATA.plan,
                ...(parsed.plan || {}),
                rules: {
                    ...DEFAULT_DATA.plan.rules,
                    ...((parsed.plan || {}).rules || {})
                }
            },

            trades:
                Array.isArray(parsed.trades)
                    ? parsed.trades
                    : []

        };

    } catch (error) {

        console.error(error);

        return structuredClone(DEFAULT_DATA);
    }
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

    updateEverything();
}


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function money(value) {

    const amount =
        Number(value) || 0;

    try {

        return new Intl.NumberFormat(
            undefined,
            {
                style: "currency",
                currency: data.settings.currency,
                maximumFractionDigits: 2
            }
        ).format(amount);

    } catch {

        return `${data.settings.currency} ${amount.toFixed(2)}`;
    }
}


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}


function today() {

    const date = new Date();

    return date.toISOString().split("T")[0];
}


function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.toastTimeout);

    window.toastTimeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageNames = {
    dashboard: "Dashboard",
    plan: "My Plan",
    checklist: "Pre-Trade",
    calculator: "Risk Calculator",
    journal: "Journal",
    analytics: "Analytics",
    settings: "Settings"
};


function openPage(page) {

    document.querySelectorAll(".page")
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id === page
            );

        });


    document.querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    setText(
        "pageTitle",
        pageNames[page] || "TradingEdge"
    );


    const sidebar = $("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


document.querySelectorAll(".nav-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openPage(
                    button.dataset.page
                );

            }
        );

    });


document.querySelectorAll("[data-open]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openPage(
                    button.dataset.open
                );

            }
        );

    });


$("mobileMenu")?.addEventListener(
    "click",
    () => {

        $("sidebar")?.classList.toggle("open");

    }
);


/* =========================================================
   DATE
   ========================================================= */

function updateDate() {

    const element =
        $("currentDate");

    if (!element) return;

    element.textContent =
        new Date().toLocaleDateString(
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

function loadSettings() {

    const s =
        data.settings;


    if ($("settingBalance"))
        $("settingBalance").value =
            s.balance;

    if ($("settingCurrency"))
        $("settingCurrency").value =
            s.currency;

    if ($("settingRisk"))
        $("settingRisk").value =
            s.risk;

    if ($("settingMaxTrades"))
        $("settingMaxTrades").value =
            s.maxTrades;

    if ($("settingDailyLoss"))
        $("settingDailyLoss").value =
            s.dailyLoss;

    if ($("settingMinRR"))
        $("settingMinRR").value =
            s.minRR;


    if ($("calcBalance"))
        $("calcBalance").value =
            s.balance;

    if ($("calcRisk"))
        $("calcRisk").value =
            s.risk;
}


$("saveSettings")
    ?.addEventListener(
        "click",
        () => {

            const balance =
                Number(
                    $("settingBalance").value
                );

            const risk =
                Number(
                    $("settingRisk").value
                );

            const maxTrades =
                Number(
                    $("settingMaxTrades").value
                );

            const dailyLoss =
                Number(
                    $("settingDailyLoss").value
                );

            const minRR =
                Number(
                    $("settingMinRR").value
                );


            if (
                !Number.isFinite(balance) ||
                balance <= 0
            ) {

                showToast(
                    "Enter a valid balance."
                );

                return;
            }


            if (
                !Number.isFinite(risk) ||
                risk <= 0
            ) {

                showToast(
                    "Enter a valid risk percentage."
                );

                return;
            }


            data.settings = {

                balance,

                currency:
                    $("settingCurrency").value,

                risk,

                maxTrades:
                    Math.max(1, maxTrades),

                dailyLoss:
                    Math.max(0, dailyLoss),

                minRR:
                    Math.max(0, minRR)

            };


            saveData();

            showToast(
                "Settings saved."
            );

        }
    );


/* =========================================================
   TRADING PLAN
   ========================================================= */

function loadPlan() {

    const plan =
        data.plan;


    if ($("planHTF"))
        $("planHTF").value =
            plan.htf;

    if ($("planEntryTF"))
        $("planEntryTF").value =
            plan.entryTF;

    if ($("planNotes"))
        $("planNotes").value =
            plan.notes || "";


    document.querySelectorAll(".plan-rule")
        .forEach(input => {

            input.checked =
                Boolean(
                    plan.rules[
                        input.dataset.rule
                    ]
                );

        });
}


$("savePlan")
    ?.addEventListener(
        "click",
        () => {

            const rules = {};

            document.querySelectorAll(".plan-rule")
                .forEach(input => {

                    rules[
                        input.dataset.rule
                    ] = input.checked;

                });


            data.plan = {

                htf:
                    $("planHTF").value,

                entryTF:
                    $("planEntryTF").value,

                notes:
                    $("planNotes").value.trim(),

                rules

            };


            saveData();

            showToast(
                "Trading plan saved."
            );

        }
    );


/* =========================================================
   DAILY TRADING LIMITS
   ========================================================= */

function todaysTrades() {

    return data.trades.filter(
        trade =>
            trade.date === today()
    );
}


function todaysLoss() {

    return todaysTrades()
        .filter(
            trade =>
                Number(trade.pl) < 0
        )
        .reduce(
            (sum, trade) =>
                sum +
                Math.abs(
                    Number(trade.pl) || 0
                ),
            0
        );
}


function updateDashboard() {

    const trades =
        data.trades;


    const totalPL =
        trades.reduce(
            (sum, trade) =>
                sum +
                (Number(trade.pl) || 0),
            0
        );


    const wins =
        trades.filter(
            trade =>
                trade.result === "WIN"
        ).length;


    const winRate =
        trades.length
            ? (wins / trades.length) * 100
            : 0;


    const todayCount =
        todaysTrades().length;


    const loss =
        todaysLoss();


    const maxTrades =
        Number(
            data.settings.maxTrades
        ) || 1;


    const dailyLoss =
        Number(
            data.settings.dailyLoss
        ) || 0;


    setText(
        "dashBalance",
        money(data.settings.balance)
    );


    setText(
        "dashPnl",
        money(totalPL)
    );


    const pnlPercent =
        data.settings.balance
            ? (
                totalPL /
                data.settings.balance *
                100
            )
            : 0;


    setText(
        "dashPnlPercent",
        `${pnlPercent.toFixed(2)}%`
    );


    setText(
        "dashWinRate",
        `${winRate.toFixed(1)}%`
    );


    setText(
        "dashTradeCount",
        `${trades.length} trades`
    );


    setText(
        "todayTrades",
        todayCount
    );


    setText(
        "maxTrades",
        maxTrades
    );


    setText(
        "todayLoss",
        loss.toFixed(2)
    );


    setText(
        "dailyLossLimit",
        dailyLoss.toFixed(2)
    );


    const tradePercent =
        Math.min(
            100,
            todayCount /
            maxTrades *
            100
        );


    const lossPercent =
        dailyLoss > 0
            ? Math.min(
                100,
                loss /
                dailyLoss *
                100
            )
            : 0;


    if ($("tradeProgress"))
        $("tradeProgress").style.width =
            `${tradePercent}%`;


    if ($("lossProgress"))
        $("lossProgress").style.width =
            `${lossPercent}%`;


    const locked =
        todayCount >= maxTrades ||
        (
            dailyLoss > 0 &&
            loss >= dailyLoss
        );


    const gate =
        $("dashboardGate");


    if (gate) {

        if (locked) {

            gate.className =
                "trade-gate blocked";

            setText(
                "dashboardGateTitle",
                "🔴 TRADING LOCKED"
            );


            setText(
                "dashboardGateMessage",

                todayCount >= maxTrades
                    ? "Daily trade limit reached."
                    : "Daily loss limit reached."
            );

        } else {

            gate.className =
                "trade-gate allowed";

            setText(
                "dashboardGateTitle",
                "🟢 TRADING AVAILABLE"
            );


            setText(
                "dashboardGateMessage",
                "You may begin your pre-trade checklist."
            );

        }

    }


    renderRecentTrades();
}


/* =========================================================
   CHECKLIST
   ========================================================= */

function updateChecklist() {

    const checks =
        document.querySelectorAll(
            ".trade-check"
        );


    const completed =
        document.querySelectorAll(
            ".trade-check:checked"
        ).length;


    const total =
        checks.length;


    const percent =
        total
            ? Math.round(
                completed /
                total *
                100
            )
            : 0;


    setText(
        "checksDone",
        completed
    );


    setText(
        "checksTotal",
        total
    );


    setText(
        "checkPercent",
        `${percent}%`
    );


    if ($("checkProgress"))
        $("checkProgress").style.width =
            `${percent}%`;


    const gate =
        $("executionGate");


    if (!gate) return;


    if (
        completed === total &&
        total > 0
    ) {

        gate.className =
            "trade-gate allowed";

        setText(
            "executionGateTitle",
            "🟢 TRADE ALLOWED"
        );

        setText(
            "executionMessage",
            "All checklist conditions are satisfied."
        );

    } else {

        gate.className =
            "trade-gate blocked";

        setText(
            "executionGateTitle",
            "🔴 TRADE BLOCKED"
        );

        setText(
            "executionMessage",
            `${total - completed} requirement(s) remaining.`
        );

    }

}


document.querySelectorAll(".trade-check")
    .forEach(check => {

        check.addEventListener(
            "change",
            updateChecklist
        );

    });


$("resetChecklist")
    ?.addEventListener(
        "click",
        () => {

            document.querySelectorAll(".trade-check")
                .forEach(check => {

                    check.checked = false;

                });


            updateChecklist();

            showToast(
                "Checklist reset."
            );

        }
    );


$("goCalculator")
    ?.addEventListener(
        "click",
        () => {

            const checks =
                document.querySelectorAll(
                    ".trade-check"
                );


            const completed =
                document.querySelectorAll(
                    ".trade-check:checked"
                ).length;


            if (
                completed !== checks.length
            ) {

                showToast(
                    "Complete the checklist first."
                );

                return;
            }


            openPage("calculator");

        }
    );


/* =========================================================
   RISK CALCULATOR
   ========================================================= */

$("calculateRisk")
    ?.addEventListener(
        "click",
        calculateRisk
    );


function calculateRisk() {

    const balance =
        Number(
            $("calcBalance").value
        );


    const riskPercent =
        Number(
            $("calcRisk").value
        );


    const entry =
        Number(
            $("calcEntry").value
        );


    const stop =
        Number(
            $("calcStop").value
        );


    const target =
        Number(
            $("calcTarget").value
        );


    if (
        !Number.isFinite(balance) ||
        balance <= 0
    ) {

        showToast(
            "Enter a valid account balance."
        );

        return;
    }


    if (
        !Number.isFinite(riskPercent) ||
        riskPercent <= 0
    ) {

        showToast(
            "Enter a valid risk percentage."
        );

        return;
    }


    const riskMoney =
        balance *
        riskPercent /
        100;


    let stopDistance = 0;
    let targetDistance = 0;


    if (
        Number.isFinite(entry) &&
        Number.isFinite(stop)
    ) {

        stopDistance =
            Math.abs(
                entry - stop
            );

    }


    if (
        Number.isFinite(entry) &&
        Number.isFinite(target)
    ) {

        targetDistance =
            Math.abs(
                target - entry
            );

    }


    let rr = 0;


    if (stopDistance > 0) {

        rr =
            targetDistance /
            stopDistance;

    }


    const pair =
        (
            $("calcPair").value ||
            "EURUSD"
        )
        .toUpperCase();


    const pipSize =
        pair.includes("JPY")
            ? 0.01
            : 0.0001;


    const pips =
        stopDistance > 0
            ? stopDistance /
              pipSize
            : 0;


    /*
       Simplified estimate.

       Actual lot sizing depends on
       instrument specifications,
       contract size, pip value and
       account currency.
    */

    const lots =
        pips > 0
            ? riskMoney /
              (pips * 10)
            : 0;


    const potentialProfit =
        riskMoney * rr;


    setText(
        "resultRisk",
        money(riskMoney)
    );


    setText(
        "resultPips",
        `${pips.toFixed(1)} pips`
    );


    setText(
        "resultRR",
        `${rr.toFixed(2)}R`
    );


    setText(
        "resultProfit",
        money(potentialProfit)
    );


    setText(
        "resultLots",
        lots.toFixed(2)
    );


    const status =
        $("resultStatus");


    if (status) {

        if (
            rr >=
            Number(data.settings.minRR)
        ) {

            status.textContent =
                "VALID";

            status.className =
                "green";

        } else {

            status.textContent =
                "BELOW MIN R:R";

            status.className =
                "red";

        }

    }

}


/* =========================================================
   JOURNAL MODAL
   ========================================================= */

$("addTrade")
    ?.addEventListener(
        "click",
        () => {

            $("tradeModal")
                ?.classList.add("open");

        }
    );


$("closeModal")
    ?.addEventListener(
        "click",
        closeModal
    );


$("cancelTrade")
    ?.addEventListener(
        "click",
        closeModal
    );


$("tradeModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("tradeModal")
            ) {

                closeModal();

            }

        }
    );


function closeModal() {

    $("tradeModal")
        ?.classList.remove("open");

}


/* =========================================================
   ADD TRADE
   ========================================================= */

$("tradeForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const pair =
                $("tradePair").value
                    .trim()
                    .toUpperCase();


            const setup =
                $("tradeSetup").value
                    .trim();


            const r =
                Number(
                    $("tradeR").value
                );


            const pl =
                Number(
                    $("tradePL").value
                );


            if (!pair || !setup) {

                showToast(
                    "Complete the required fields."
                );

                return;
            }


            if (
                !Number.isFinite(r) ||
                !Number.isFinite(pl)
            ) {

                showToast(
                    "Enter valid R and P/L values."
                );

                return;
            }


            const trade = {

                id:
                    Date.now().toString(),

                date:
                    today(),

                pair,

                direction:
                    $("tradeDirection").value,

                setup,

                result:
                    $("tradeResult").value,

                r,

                pl,

                notes:
                    $("tradeNotes").value.trim()

            };


            data.trades.push(
                trade
            );


            saveData();


            $("tradeForm").reset();

            closeModal();


            showToast(
                "Trade added."
            );

        }
    );


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
        trades.map(
            trade => {

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

                        <td>
                            ${escapeHTML(trade.date)}
                        </td>

                        <td>
                            ${escapeHTML(trade.pair)}
                        </td>

                        <td>
                            ${escapeHTML(trade.direction)}
                        </td>

                        <td>
                            ${escapeHTML(trade.setup)}
                        </td>

                        <td class="${resultClass}">
                            ${escapeHTML(trade.result)}
                        </td>

                        <td class="${r >= 0 ? "green" : "red"}">
                            ${r >= 0 ? "+" : ""}${r.toFixed(2)}R
                        </td>

                        <td class="${pl >= 0 ? "green" : "red"}">
                            ${money(pl)}
                        </td>

                    </tr>
                `;

            }
        ).join("");
}


/* =========================================================
   JOURNAL
   ========================================================= */

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
                    No trades yet.
                </td>
            </tr>
        `;

        updateJournalStats();

        return;
    }


    body.innerHTML =
        trades.map(
            trade => {

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

                        <td>
                            ${escapeHTML(trade.date)}
                        </td>

                        <td>
                            ${escapeHTML(trade.pair)}
                        </td>

                        <td>
                            ${escapeHTML(trade.direction)}
                        </td>

                        <td>
                            ${escapeHTML(trade.setup)}
                        </td>

                        <td class="${resultClass}">
                            ${escapeHTML(trade.result)}
                        </td>

                        <td class="${r >= 0 ? "green" : "red"}">
                            ${r >= 0 ? "+" : ""}${r.toFixed(2)}R
                        </td>

                        <td class="${pl >= 0 ? "green" : "red"}">
                            ${money(pl)}
                        </td>

                        <td>
                            <button
                                class="table-action delete"
                                data-delete="${trade.id}">
                                Delete
                            </button>
                        </td>

                    </tr>
                `;

            }
        ).join("");


    document.querySelectorAll(
        "[data-delete]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteTrade(
                    button.dataset.delete
                );

            }
        );

    });


    updateJournalStats();
}


function updateJournalStats() {

    const trades =
        data.trades;


    const wins =
        trades.filter(
            trade =>
                trade.result === "WIN"
        ).length;


    const losses =
        trades.filter(
            trade =>
                trade.result === "LOSS"
        ).length;


    const netR =
        trades.reduce(
            (sum, trade) =>
                sum +
                (Number(trade.r) || 0),
            0
        );


    setText(
        "journalTotal",
        trades.length
    );


    setText(
        "journalWins",
        wins
    );


    setText(
        "journalLosses",
        losses
    );


    setText(
        "journalNetR",
        `${netR >= 0 ? "+" : ""}${netR.toFixed(2)}R`
    );
}


function deleteTrade(id) {

    const trade =
        data.trades.find(
            item =>
                item.id === id
        );


    if (!trade) return;


    if (
        !confirm(
            `Delete ${trade.pair} trade?`
        )
    ) {

        return;

    }


    data.trades =
        data.trades.filter(
            item =>
                item.id !== id
        );


    saveData();

    showToast(
        "Trade deleted."
    );
}


/* =========================================================
   ANALYTICS
   ========================================================= */

function updateAnalytics() {

    const trades =
        data.trades;


    const wins =
        trades.filter(
            trade =>
                trade.result === "WIN"
        );


    const losses =
        trades.filter(
            trade =>
                trade.result === "LOSS"
        );


    const winRate =
        trades.length
            ? wins.length /
              trades.length *
              100
            : 0;


    const netR =
        trades.reduce(
            (sum, trade) =>
                sum +
                (Number(trade.r) || 0),
            0
        );


    const averageR =
        trades.length
            ? netR /
              trades.length
            : 0;


    const grossProfit =
        wins.reduce(
            (sum, trade) =>
                sum +
                Math.max(
                    0,
                    Number(trade.pl) || 0
                ),
            0
        );


    const grossLoss =
        losses.reduce(
            (sum, trade) =>
                sum +
                Math.abs(
                    Math.min(
                        0,
                        Number(trade.pl) || 0
                    )
                ),
            0
        );


    const profitFactor =
        grossLoss > 0
            ? grossProfit /
              grossLoss
            : grossProfit > 0
                ? Infinity
                : 0;


    setText(
        "analyticsWinRate",
        `${winRate.toFixed(1)}%`
    );


    setText(
        "analyticsAvgR",
        `${averageR >= 0 ? "+" : ""}${averageR.toFixed(2)}R`
    );


    setText(
        "analyticsPF",
        Number.isFinite(profitFactor)
            ? profitFactor.toFixed(2)
            : "∞"
    );


    setText(
        "analyticsNetR",
        `${netR >= 0 ? "+" : ""}${netR.toFixed(2)}R`
    );


    setText(
        "metricWinRate",
        `${winRate.toFixed(1)}%`
    );


    if ($("winRateBar"))
        $("winRateBar").style.width =
            `${Math.min(100, winRate)}%`;


    setText(
        "metricDiscipline",
        "100%"
    );


    if ($("disciplineBar"))
        $("disciplineBar").style.width =
            "100%";
}


/* =========================================================
   EXPORT
   ========================================================= */

$("exportData")
    ?.addEventListener(
        "click",
        () => {

            const backup = {

                application:
                    "TradingEdge",

                version:
                    1,

                exportedAt:
                    new Date().toISOString(),

                data

            };


            const blob =
                new Blob(
                    [
                        JSON.stringify(
                            backup,
                            null,
                            2
                        )
                    ],
                    {
                        type:
                            "application/json"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                `tradingedge-backup-${today()}.json`;


            document.body.appendChild(link);

            link.click();

            link.remove();

            URL.revokeObjectURL(url);


            showToast(
                "Backup exported."
            );

        }
    );


/* =========================================================
   IMPORT
   ========================================================= */

$("importData")
    ?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) return;


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    try {

                        const backup =
                            JSON.parse(
                                reader.result
                            );


                        const imported =
                            backup.data ||
                            backup;


                        if (
                            !imported ||
                            typeof imported !==
                            "object"
                        ) {

                            throw new Error(
                                "Invalid backup"
                            );

                        }


                        data = {

                            ...structuredClone(
                                DEFAULT_DATA
                            ),

                            ...imported,

                            settings: {
                                ...DEFAULT_DATA.settings,
                                ...(imported.settings || {})
                            },

                            plan: {
                                ...DEFAULT_DATA.plan,
                                ...(imported.plan || {}),
                                rules: {
                                    ...DEFAULT_DATA.plan.rules,
                                    ...(
                                        imported.plan?.rules ||
                                        {}
                                    )
                                }
                            },

                            trades:
                                Array.isArray(
                                    imported.trades
                                )
                                    ? imported.trades
                                    : []

                        };


                        localStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(data)
                        );


                        updateEverything();


                        showToast(
                            "Backup imported."
                        );


                    } catch {

                        showToast(
                            "Invalid backup file."
                        );

                    }


                    event.target.value = "";

                };


            reader.readAsText(file);

        }
    );


/* =========================================================
   CLEAR DATA
   ========================================================= */

$("clearData")
    ?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Delete all TradingEdge data from this browser?"
                )
            ) {

                return;

            }


            localStorage.removeItem(
                STORAGE_KEY
            );


            data =
                structuredClone(
                    DEFAULT_DATA
                );


            updateEverything();


            showToast(
                "All data cleared."
            );

        }
    );


/* =========================================================
   UPDATE EVERYTHING
   ========================================================= */

function updateEverything() {

    updateDate();

    loadSettings();

    loadPlan();

    updateDashboard();

    updateChecklist();

    renderJournal();

    updateAnalytics();

}


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateEverything();

    }
);
