/* =========================================================
   TRADEFLOW
   Trading Discipline Dashboard
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       PAGE NAVIGATION
       ========================= */

    const navButtons = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");
    const pageTitle = document.getElementById("pageTitle");

    navButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const pageName = button.getAttribute("data-page");

            pages.forEach(function (page) {
                page.classList.remove("active");
            });

            const selectedPage = document.getElementById(pageName);

            if (selectedPage) {
                selectedPage.classList.add("active");
            }

            navButtons.forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            const titles = {
                dashboard: "Dashboard",
                tradeplan: "Trade Plan",
                calculator: "Risk Calculator",
                journal: "Trade Journal",
                analytics: "Analytics",
                calendar: "Economic Calendar"
            };

            pageTitle.textContent = titles[pageName] || "TradeFlow";

            const sidebar = document.getElementById("sidebar");

            if (sidebar) {
                sidebar.classList.remove("open");
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    });


    /* =========================
       MOBILE MENU
       ========================= */

    const mobileMenu = document.getElementById("mobileMenu");
    const sidebar = document.getElementById("sidebar");

    if (mobileMenu) {

        mobileMenu.addEventListener("click", function () {

            sidebar.classList.toggle("open");

        });

    }


    /* =========================
       TRADE PLAN CHECKLIST
       ========================= */

    const checklist = document.querySelectorAll(".plan-check");
    const tradeGate = document.getElementById("tradeGate");
    const gateMessage = document.getElementById("gateMessage");
    const adherence = document.getElementById("adherence");

    function updateTradeGate() {

        if (!checklist.length) {
            return;
        }

        let completed = 0;

        checklist.forEach(function (item) {

            if (item.checked) {
                completed++;
            }

        });

        const total = checklist.length;

        const percentage = Math.round(
            (completed / total) * 100
        );

        if (adherence) {
            adherence.textContent = percentage;
        }

        if (completed === total) {

            tradeGate.classList.remove("blocked");
            tradeGate.classList.add("allowed");

            tradeGate.querySelector(".gate-status").textContent =
                "🟢 TRADE ALLOWED";

            gateMessage.textContent =
                "All requirements completed. Execute only according to your plan.";

        } else {

            tradeGate.classList.remove("allowed");
            tradeGate.classList.add("blocked");

            tradeGate.querySelector(".gate-status").textContent =
                "🔴 TRADE BLOCKED";

            gateMessage.textContent =
                completed +
                " / " +
                total +
                " requirements completed.";

        }

        saveChecklist();

    }


    checklist.forEach(function (item) {

        item.addEventListener("change", updateTradeGate);

    });


    /* =========================
       SAVE CHECKLIST
       ========================= */

    function saveChecklist() {

        const values = [];

        checklist.forEach(function (item) {
            values.push(item.checked);
        });

        localStorage.setItem(
            "tradeflowChecklist",
            JSON.stringify(values)
        );

    }


    function loadChecklist() {

        const saved = localStorage.getItem(
            "tradeflowChecklist"
        );

        if (!saved) {
            updateTradeGate();
            return;
        }

        try {

            const values = JSON.parse(saved);

            checklist.forEach(function (item, index) {

                item.checked = values[index] === true;

            });

        } catch (error) {

            console.log("Checklist data could not be loaded.");

        }

        updateTradeGate();

    }


    loadChecklist();


    /* =========================
       RESET CHECKLIST
       ========================= */

    const resetPlan = document.getElementById("resetPlan");

    if (resetPlan) {

        resetPlan.addEventListener("click", function () {

            checklist.forEach(function (item) {

                item.checked = false;

            });

            localStorage.removeItem(
                "tradeflowChecklist"
            );

            updateTradeGate();

        });

    }


    /* =========================
       RISK CALCULATOR
       ========================= */

    const calculateRisk =
        document.getElementById("calculateRisk");

    function calculatePosition() {

        const balance =
            Number(document.getElementById("balance").value);

        const riskPercent =
            Number(document.getElementById("riskPercent").value);

        const entry =
            Number(document.getElementById("entry").value);

        const stop =
            Number(document.getElementById("stop").value);

        const target =
            Number(document.getElementById("target").value);

        const pair =
            document.getElementById("pair").value;


        if (
            !balance ||
            !riskPercent ||
            !entry ||
            !stop ||
            !target
        ) {
            return;
        }


        /* Money risk */

        const moneyRisk =
            balance * (riskPercent / 100);


        /* Price distance */

        const stopDistance =
            Math.abs(entry - stop);

        const rewardDistance =
            Math.abs(target - entry);


        /* R:R */

        let rr = 0;

        if (stopDistance > 0) {

            rr =
                rewardDistance /
                stopDistance;

        }


        /* Pip calculation */

        let pipSize = 0.0001;

        if (pair.includes("JPY")) {
            pipSize = 0.01;
        }

        /*
           This is a simplified calculator.

           Standard USD-quoted forex pairs:
           approximately $10 per pip per standard lot.

           XAU/USD is intentionally not treated
           as a normal forex pair.
        */

        let lots = 0;

        if (pair === "XAU/USD") {

            const movement =
                stopDistance;

            if (movement > 0) {

                lots =
                    moneyRisk /
                    (movement * 100);

            }

        } else {

            const pips =
                stopDistance / pipSize;

            if (pips > 0) {

                lots =
                    moneyRisk /
                    (pips * 10);

            }

        }


        const potentialProfit =
            moneyRisk * rr;


        const pips =
            stopDistance / pipSize;


        /* Display */

        document.getElementById("moneyRisk").textContent =
            "$" + moneyRisk.toFixed(2);

        document.getElementById("stopDistance").textContent =
            pips.toFixed(1) + " pips";

        document.getElementById("rewardRisk").textContent =
            rr.toFixed(2) + "R";

        document.getElementById("potentialProfit").textContent =
            "$" + potentialProfit.toFixed(2);


        /* Save calculator data */

        localStorage.setItem(
            "tradeflowCalculator",
            JSON.stringify({
                balance: balance,
                riskPercent: riskPercent,
                entry: entry,
                stop: stop,
                target: target,
                pair: pair
            })
        );

    }


    if (calculateRisk) {

        calculateRisk.addEventListener(
            "click",
            calculatePosition
        );

    }


    /* =========================
       AUTO CALCULATE
       ========================= */

    const calculatorInputs = [
        "balance",
        "riskPercent",
        "entry",
        "stop",
        "target",
        "pair"
    ];

    calculatorInputs.forEach(function (id) {

        const input = document.getElementById(id);

        if (input) {

            input.addEventListener(
                "input",
                calculatePosition
            );

            input.addEventListener(
                "change",
                calculatePosition
            );

        }

    });


    /* =========================
       LOAD CALCULATOR
       ========================= */

    function loadCalculator() {

        const saved =
            localStorage.getItem(
                "tradeflowCalculator"
            );

        if (!saved) {

            calculatePosition();

            return;

        }

        try {

            const data =
                JSON.parse(saved);

            if (data.balance !== undefined) {
                document.getElementById("balance").value =
                    data.balance;
            }

            if (data.riskPercent !== undefined) {
                document.getElementById("riskPercent").value =
                    data.riskPercent;
            }

            if (data.entry !== undefined) {
                document.getElementById("entry").value =
                    data.entry;
            }

            if (data.stop !== undefined) {
                document.getElementById("stop").value =
                    data.stop;
            }

            if (data.target !== undefined) {
                document.getElementById("target").value =
                    data.target;
            }

            if (data.pair !== undefined) {
                document.getElementById("pair").value =
                    data.pair;
            }

        } catch (error) {

            console.log(
                "Calculator data could not be loaded."
            );

        }

        calculatePosition();

    }


    loadCalculator();


    /* =========================
       TRADE COUNT
       ========================= */

    let tradesToday = 2;

    const tradeCount =
        document.getElementById("tradeCount");

    function updateTradeCount() {

        if (tradeCount) {

            tradeCount.textContent =
                tradesToday;

        }

        updateTradingLock();

    }


    /* =========================
       TRADING LOCK
       ========================= */

    function updateTradingLock() {

        const gate =
            document.querySelector(
                "#dashboard .trade-gate"
            );

        if (!gate) {
            return;
        }


        if (tradesToday >= 3) {

            gate.classList.remove("allowed");
            gate.classList.add("blocked");

            gate.querySelector(".gate-status").textContent =
                "🔴 TRADING LOCKED";

            gate.querySelector("small").textContent =
                "Maximum daily trades reached.";

        } else {

            gate.classList.remove("blocked");
            gate.classList.add("allowed");

            gate.querySelector(".gate-status").textContent =
                "🟢 TRADE ALLOWED";

            gate.querySelector("small").textContent =
                (3 - tradesToday) +
                " trade(s) remaining today.";

        }

    }


    updateTradeCount();


    /* =========================
       QUICK TRADE
       ========================= */

    const quickTrade =
        document.getElementById("quickTrade");

    if (quickTrade) {

        quickTrade.addEventListener(
            "click",
            function () {

                const journalButton =
                    document.querySelector(
                        '[data-page="journal"]'
                    );

                if (journalButton) {
                    journalButton.click();
                }

            }
        );

    }


    /* =========================
       NEW TRADE
       ========================= */

    const newTrade =
        document.getElementById("newTrade");

    if (newTrade) {

        newTrade.addEventListener(
            "click",
            function () {

                if (tradesToday >= 3) {

                    alert(
                        "TRADING LOCKED\n\n" +
                        "You already reached your maximum " +
                        "of 3 trades today."
                    );

                    return;

                }


                const pair =
                    prompt(
                        "Enter pair:",
                        "EUR/USD"
                    );

                if (!pair) {
                    return;
                }


                const direction =
                    prompt(
                        "Direction: BUY or SELL",
                        "BUY"
                    );

                if (!direction) {
                    return;
                }


                const setup =
                    prompt(
                        "Setup:",
                        "Demand + MSS"
                    );

                if (!setup) {
                    return;
                }


                const entry =
                    prompt(
                        "Entry price:",
                        "1.16500"
                    );

                const stop =
                    prompt(
                        "Stop loss:",
                        "1.16300"
                    );

                const target =
                    prompt(
                        "Take profit:",
                        "1.16900"
                    );


                const result =
                    prompt(
                        "Result: WIN or LOSS",
                        "WIN"
                    );


                const r =
                    prompt(
                        "R result:",
                        result &&
                        result.toUpperCase() === "WIN"
                            ? "2"
                            : "-1"
                    );


                if (
                    !entry ||
                    !stop ||
                    !target ||
                    !result ||
                    !r
                ) {
                    return;
                }


                const table =
                    document.getElementById(
                        "journalBody"
                    );


                const row =
                    document.createElement("tr");


                const resultUpper =
                    result.toUpperCase();


                const rNumber =
                    Number(r);


                const resultClass =
                    resultUpper === "WIN"
                        ? "green"
                        : "red";


                row.innerHTML = `
                    <td>${pair}</td>
                    <td>${direction.toUpperCase()}</td>
                    <td>${setup}</td>
                    <td>${entry}</td>
                    <td>${stop}</td>
                    <td>${target}</td>
                    <td class="${resultClass}">
                        ${resultUpper}
                    </td>
                    <td class="${resultClass}">
                        ${rNumber > 0 ? "+" : ""}
                        ${rNumber}R
                    </td>
                `;


                table.prepend(row);


                tradesToday++;

                updateTradeCount();


                saveTrade({
                    pair: pair,
                    direction: direction.toUpperCase(),
                    setup: setup,
                    entry: entry,
                    stop: stop,
                    target: target,
                    result: resultUpper,
                    r: rNumber
                });


                alert(
                    "Trade saved successfully."
                );

            }
        );

    }


    /* =========================
       SAVE JOURNAL
       ========================= */

    function saveTrade(trade) {

        let trades = [];

        const saved =
            localStorage.getItem(
                "tradeflowTrades"
            );

        if (saved) {

            try {

                trades =
                    JSON.parse(saved);

            } catch (error) {

                trades = [];

            }

        }


        trades.push(trade);


        localStorage.setItem(
            "tradeflowTrades",
            JSON.stringify(trades)
        );

    }


    /* =========================
       LOAD JOURNAL
       ========================= */

    function loadTrades() {

        const saved =
            localStorage.getItem(
                "tradeflowTrades"
            );

        if (!saved) {
            return;
        }


        try {

            const trades =
                JSON.parse(saved);

            const table =
                document.getElementById(
                    "journalBody"
                );


            trades.forEach(function (trade) {

                const row =
                    document.createElement("tr");


                const resultClass =
                    trade.result === "WIN"
                        ? "green"
                        : "red";


                row.innerHTML = `
                    <td>${trade.pair}</td>
                    <td>${trade.direction}</td>
                    <td>${trade.setup}</td>
                    <td>${trade.entry}</td>
                    <td>${trade.stop}</td>
                    <td>${trade.target}</td>
                    <td class="${resultClass}">
                        ${trade.result}
                    </td>
                    <td class="${resultClass}">
                        ${trade.r > 0 ? "+" : ""}
                        ${trade.r}R
                    </td>
                `;


                table.prepend(row);

            });


        } catch (error) {

            console.log(
                "Journal data could not be loaded."
            );

        }

    }


    loadTrades();


    /* =========================
       KEYBOARD SHORTCUT
       ========================= */

    document.addEventListener(
        "keydown",
        function (event) {

            /*
              Press ESC to close mobile sidebar.
            */

            if (event.key === "Escape") {

                if (sidebar) {
                    sidebar.classList.remove("open");
                }

            }

        }
    );


    /* =========================
       STARTUP
       ========================= */

    updateTradeGate();
    updateTradingLock();
    calculatePosition();

});
