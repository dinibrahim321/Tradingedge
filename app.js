/* =========================================================
   TRADEFLOW - TRADING JOURNAL
   No framework required.
   Data is stored locally in the browser.
========================================================= */

const STORAGE_KEY = "tradeflow-data-v1";

const defaultData = {
  trades: [],
  checklist: {},
  plan: {
    name: "",
    markets: "",
    session: "",
    context: "",
    entry: "",
    risk: 1,
    rr: 2,
    dailyLoss: "",
    maxTrades: 3,
    management: ""
  }
};

let data = loadData();
let selectedTradeId = null;
let selectedEmotion = "";
let screenshotData = "";

/* =========================================================
   DATA
========================================================= */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    return {
      ...structuredClone(defaultData),
      ...JSON.parse(saved)
    };
  } catch (error) {
    console.error("Could not load data:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =========================================================
   HELPERS
========================================================= */

function money(value) {
  const n = Number(value) || 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(n);
}

function number(value) {
  return Number(value) || 0;
}

function dateFormat(value) {
  if (!value) return "-";

  const date = new Date(value + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* =========================================================
   NAVIGATION
========================================================= */

const pageTitles = {
  dashboard: [
    "Dashboard",
    "Your trading performance at a glance."
  ],

  journal: [
    "Trade Journal",
    "Understand what happened, why it happened, and what to improve."
  ],

  checklist: [
    "Pre-Trade Checklist",
    "Prepare before you execute."
  ],

  plan: [
    "Trading Plan",
    "Your rules should be clear before the market moves."
  ],

  analytics: [
    "Analytics",
    "Find patterns in your execution."
  ]
};

function showPage(page) {
  document.querySelectorAll(".page").forEach(el => {
    el.classList.remove("active");
  });

  document.getElementById(page)?.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === page
    );
  });

  document.getElementById("pageTitle").textContent =
    pageTitles[page][0];

  document.getElementById("pageSubtitle").textContent =
    pageTitles[page][1];

  if (page === "dashboard") renderDashboard();
  if (page === "journal") renderJournal();
  if (page === "checklist") renderChecklist();
  if (page === "plan") renderPlan();
  if (page === "analytics") renderAnalytics();

  document.getElementById("sidebar").classList.remove("open");
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-page-target]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.pageTarget);
  });
});

document.getElementById("mobileMenu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

/* =========================================================
   DASHBOARD CALCULATIONS
========================================================= */

function getStats() {
  const trades = data.trades;

  const pnl = trades.reduce(
    (sum, trade) => sum + number(trade.pnl),
    0
  );

  const wins = trades.filter(
    trade => number(trade.pnl) > 0
  ).length;

  const losses = trades.filter(
    trade => number(trade.pnl) < 0
  ).length;

  const averageR =
    trades.length
      ? trades.reduce(
          (sum, trade) => sum + number(trade.r),
          0
        ) / trades.length
      : 0;

  const followed =
    trades.filter(trade => trade.planFollowed).length;

  const discipline =
    trades.length
      ? Math.round((followed / trades.length) * 100)
      : 0;

  const grossProfit = trades
    .filter(t => number(t.pnl) > 0)
    .reduce((sum, t) => sum + number(t.pnl), 0);

  const grossLoss = Math.abs(
    trades
      .filter(t => number(t.pnl) < 0)
      .reduce((sum, t) => sum + number(t.pnl), 0)
  );

  const profitFactor =
    grossLoss > 0
      ? grossProfit / grossLoss
      : grossProfit > 0
        ? Infinity
        : 0;

  return {
    pnl,
    wins,
    losses,
    averageR,
    discipline,
    profitFactor
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  const stats = getStats();

  document.getElementById("statPnl").textContent =
    money(stats.pnl);

  document.getElementById("statPnl").className =
    stats.pnl >= 0
      ? "pnl-positive"
      : "pnl-negative";

  document.getElementById("statPnlSub").textContent =
    `${data.trades.length} trade${data.trades.length === 1 ? "" : "s"}`;

  const winRate = data.trades.length
    ? Math.round((stats.wins / data.trades.length) * 100)
    : 0;

  document.getElementById("statWinRate").textContent =
    `${winRate}%`;

  document.getElementById("statWinSub").textContent =
    `${stats.wins} wins / ${data.trades.length} trades`;

  document.getElementById("statAvgR").textContent =
    `${stats.averageR.toFixed(2)}R`;

  document.getElementById("statDiscipline").textContent =
    `${stats.discipline}%`;

  document.getElementById("sidebarDiscipline").textContent =
    `${stats.discipline}%`;

  document.getElementById("sidebarProgress").style.width =
    `${stats.discipline}%`;

  renderEquityChart();
  renderDashboardChecklist();
  renderRecentTrades();
}

/* =========================================================
   EQUITY CHART
========================================================= */

function renderEquityChart() {
  const svg = document.getElementById("equityChart");

  if (!svg) return;

  if (!data.trades.length) {
    svg.innerHTML = `
      <line x1="20" y1="230"
            x2="780" y2="230"
            class="chart-grid" />

      <text x="400" y="140"
            fill="#566172"
            text-anchor="middle"
            font-size="12">
        Log trades to build your equity curve
      </text>
    `;

    return;
  }

  const sorted = [...data.trades]
    .sort((a, b) => a.date.localeCompare(b.date));

  let equity = 0;

  const values = sorted.map(trade => {
    equity += number(trade.pnl);
    return equity;
  });

  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);

  const width = 800;
  const height = 240;
  const padding = 20;

  const points = values.map((value, index) => {
    const x =
      padding +
      (index / Math.max(values.length - 1, 1)) *
        (width - padding * 2);

    const normalized =
      (value - min) / (max - min || 1);

    const y =
      height -
      padding -
      normalized *
        (height - padding * 2);

    return `${x},${y}`;
  });

  const first = points[0];
  const last = points[points.length - 1];

  const areaPoints =
    `${first} ${points.join(" ")} ${last.split(",")[0]},${height - padding} ${first.split(",")[0]},${height - padding}`;

  svg.innerHTML = `
    <defs>
      <linearGradient
        id="areaGradient"
        x1="0"
        x2="0"
        y1="0"
        y2="1">

        <stop
          offset="0%"
          stop-color="#25d69b"
          stop-opacity=".35" />

        <stop
          offset="100%"
          stop-color="#25d69b"
          stop-opacity="0" />
      </linearGradient>
    </defs>

    <line
      x1="20"
      y1="60"
      x2="780"
      y2="60"
      class="chart-grid" />

    <line
      x1="20"
      y1="140"
      x2="780"
      y2="140"
      class="chart-grid" />

    <line
      x1="20"
      y1="220"
      x2="780"
      y2="220"
      class="chart-grid" />

    <polygon
      points="${areaPoints}"
      class="chart-area" />

    <polyline
      points="${points.join(" ")}"
      class="chart-line" />
  `;
}

/* =========================================================
   DASHBOARD CHECKLIST
========================================================= */

const checklistLabels = {
  trend: "Higher timeframe bias",
  levels: "Important levels",
  news: "News checked",
  setup: "Exact setup",
  entry: "Entry confirmed",
  rr: "Risk/reward",
  risk: "Risk calculated",
  stop: "Stop defined",
  target: "Target defined",
  calm: "Calm mindset",
  revenge: "No revenge trading",
  fomo: "No FOMO"
};

function getChecklistScore() {
  const keys = Object.keys(checklistLabels);

  const complete = keys.filter(
    key => data.checklist[key]
  ).length;

  return Math.round(
    (complete / keys.length) * 100
  );
}

function renderDashboardChecklist() {
  const container =
    document.getElementById("dashboardChecklist");

  const entries =
    Object.entries(checklistLabels);

  container.innerHTML = entries
    .slice(0, 6)
    .map(([key, label]) => {
      const done = !!data.checklist[key];

      return `
        <div class="compact-item ${done ? "done" : ""}">
          <span>${done ? "✓" : ""}</span>
          ${escapeHtml(label)}
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   RECENT TRADES
========================================================= */

function renderRecentTrades() {
  const container =
    document.getElementById("recentTrades");

  if (!data.trades.length) {
    container.innerHTML = `
      <div class="empty-state">
        No trades yet. Start by logging your first trade.
      </div>
    `;
    return;
  }

  const trades = [...data.trades]
    .sort((a, b) =>
      `${b.date}-${b.createdAt}`
        .localeCompare(`${a.date}-${a.createdAt}`)
    )
    .slice(0, 6);

  container.innerHTML = `
    <div class="trade-row trade-head">
      <div>Symbol</div>
      <div>Direction</div>
      <div>Setup</div>
      <div>Date</div>
      <div>R</div>
      <div>P&L</div>
    </div>

    ${trades.map(tradeRow).join("")}
  `;
}

function tradeRow(trade) {
  const pnl = number(trade.pnl);

  return `
    <div class="trade-row">
      <div class="symbol">
        ${escapeHtml(trade.symbol)}
      </div>

      <div class="${trade.direction === "Long"
        ? "direction-long"
        : "direction-short"}">
        ${escapeHtml(trade.direction)}
      </div>

      <div>${escapeHtml(trade.setup || "-")}</div>

      <div>${dateFormat(trade.date)}</div>

      <div>${number(trade.r).toFixed(2)}R</div>

      <div class="${pnl >= 0
        ? "pnl-positive"
        : "pnl-negative"}">
        ${money(pnl)}
      </div>
    </div>
  `;
}

/* =========================================================
   JOURNAL
========================================================= */

function renderJournal() {
  const search =
    document.getElementById("journalSearch")
      ?.value
      .toLowerCase() || "";

  const filter =
    document.getElementById("journalFilter")
      ?.value || "all";

  let trades = [...data.trades];

  if (search) {
    trades = trades.filter(trade => {
      const text = [
        trade.symbol,
        trade.setup,
        trade.reason,
        trade.lesson,
        trade.emotion
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  if (filter === "wins") {
    trades = trades.filter(
      trade => number(trade.pnl) > 0
    );
  }

  if (filter === "losses") {
    trades = trades.filter(
      trade => number(trade.pnl) < 0
    );
  }

  if (filter === "rule") {
    trades = trades.filter(
      trade => trade.planFollowed
    );
  }

  if (filter === "broken") {
    trades = trades.filter(
      trade => !trade.planFollowed
    );
  }

  trades.sort((a, b) =>
    `${b.date}-${b.createdAt}`
      .localeCompare(`${a.date}-${a.createdAt}`)
  );

  const list =
    document.getElementById("journalList");

  if (!trades.length) {
    list.innerHTML = `
      <div class="empty-state">
        No trades match your filter.
      </div>
    `;

    return;
  }

  list.innerHTML = trades.map(trade => `
    <div
      class="journal-card ${selectedTradeId === trade.id ? "selected" : ""}"
      data-trade-id="${trade.id}">

      <div class="journal-card-top">
        <span class="symbol">
          ${escapeHtml(trade.symbol)}
        </span>

        <span class="journal-date">
          ${dateFormat(trade.date)}
        </span>
      </div>

      <div class="journal-card-bottom">
        <span class="setup-tag">
          ${escapeHtml(trade.setup || "No setup")}
        </span>

        <strong class="${number(trade.pnl) >= 0
          ? "pnl-positive"
          : "pnl-negative"}">
          ${money(trade.pnl)}
        </strong>
      </div>

    </div>
  `).join("");

  document.querySelectorAll(".journal-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedTradeId = card.dataset.tradeId;
      renderJournal();
      renderJournalDetail();
    });
  });

  renderJournalDetail();
}

function renderJournalDetail() {
  const empty =
    document.getElementById("journalEmpty");

  const detail =
    document.getElementById("journalDetail");

  const trade =
    data.trades.find(
      item => item.id === selectedTradeId
    );

  if (!trade) {
    empty.classList.remove("hidden");
    detail.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  detail.classList.remove("hidden");

  const pnl = number(trade.pnl);

  detail.innerHTML = `
    <div class="detail-title">

      <div>
        <span class="eyebrow">
          ${escapeHtml(trade.setup || "TRADE")}
        </span>

        <h2>
          ${escapeHtml(trade.symbol)}
          ·
          <span class="${trade.direction === "Long"
            ? "direction-long"
            : "direction-short"}">
            ${escapeHtml(trade.direction)}
          </span>
        </h2>

        <p>${dateFormat(trade.date)}</p>
      </div>

      <div class="${pnl >= 0
        ? "pnl-positive"
        : "pnl-negative"} detail-pnl">
        ${money(pnl)}
      </div>
    </div>

    <div class="detail-grid">

      <div class="detail-stat">
        <span>Entry</span>
        <strong>${escapeHtml(trade.entry || "-")}</strong>
      </div>

      <div class="detail-stat">
        <span>Stop</span>
        <strong>${escapeHtml(trade.stop || "-")}</strong>
      </div>

      <div class="detail-stat">
        <span>Target</span>
        <strong>${escapeHtml(trade.target || "-")}</strong>
      </div>

      <div class="detail-stat">
        <span>Exit</span>
        <strong>${escapeHtml(trade.exit || "-")}</strong>
      </div>

      <div class="detail-stat">
        <span>R Multiple</span>
        <strong>${number(trade.r).toFixed(2)}R</strong>
      </div>

      <div class="detail-stat">
        <span>Emotion</span>
        <strong>${escapeHtml(trade.emotion || "Not recorded")}</strong>
      </div>

      <div class="detail-stat">
        <span>Plan</span>
        <strong>
          ${trade.planFollowed ? "✓ Followed" : "✕ Broken"}
        </strong>
      </div>

      <div class="detail-stat">
        <span>Direction</span>
        <strong>${escapeHtml(trade.direction)}</strong>
      </div>

    </div>

    <div class="detail-section">
      <h3>Trade Reasoning</h3>
      <p>${escapeHtml(
        trade.reason || "No reasoning recorded."
      )}</p>
    </div>

    <div class="detail-section">
      <h3>Lesson</h3>
      <p>${escapeHtml(
        trade.lesson || "No lesson recorded."
      )}</p>
    </div>

    ${
      trade.screenshot
        ? `
          <div class="detail-section">
            <h3>Chart Screenshot</h3>
            <img
              class="detail-screenshot"
              src="${trade.screenshot}"
              alt="Trade chart screenshot" />
          </div>
        `
        : ""
    }

    <div class="detail-section">
      <button
        class="outline-btn"
        id="deleteTradeBtn">
        Delete Trade
      </button>
    </div>
  `;

  document
    .getElementById("deleteTradeBtn")
    ?.addEventListener("click", () => {
      deleteTrade(trade.id);
    });
}

function deleteTrade(id) {
  const confirmed =
    confirm("Delete this trade permanently?");

  if (!confirmed) return;

  data.trades =
    data.trades.filter(trade => trade.id !== id);

  selectedTradeId = null;

  saveData();
  renderDashboard();
  renderJournal();

  showToast("Trade deleted");
}

/* =========================================================
   CHECKLIST
========================================================= */

function renderChecklist() {
  document
    .querySelectorAll("[data-check]")
    .forEach(input => {
      input.checked =
        !!data.checklist[input.dataset.check];
    });

  const score = getChecklistScore();

  document.getElementById("checkScore").textContent =
    `${score}%`;

  const card =
    document.getElementById("readyCard");

  if (score === 100) {
    card.style.borderColor = "#205b4b";
    card.style.background = "#0c211b";

    card.querySelector("strong").textContent =
      "Checklist complete — setup is ready";

    card.querySelector("p").textContent =
      "You have confirmed every item in your pre-trade process.";
  } else {
    card.style.borderColor = "#392f18";
    card.style.background = "#17140b";

    card.querySelector("strong").textContent =
      "Complete your checklist";

    card.querySelector("p").textContent =
      "Every unchecked item is a reason to pause before entering.";
  }
}

document
  .querySelectorAll("[data-check]")
  .forEach(input => {
    input.addEventListener("change", () => {
      data.checklist[input.dataset.check] =
        input.checked;

      saveData();
      renderChecklist();
      renderDashboard();
    });
  });

document
  .getElementById("resetChecklist")
  .addEventListener("click", () => {
    data.checklist = {};
    saveData();

    renderChecklist();
    renderDashboard();

    showToast("Checklist reset");
  });

/* =========================================================
   PLAN
========================================================= */

function renderPlan() {
  document.getElementById("planName").value =
    data.plan.name || "";

  document.getElementById("planMarkets").value =
    data.plan.markets || "";

  document.getElementById("planSession").value =
    data.plan.session || "";

  document.getElementById("planContext").value =
    data.plan.context || "";

  document.getElementById("planEntry").value =
    data.plan.entry || "";

  document.getElementById("planRisk").value =
    data.plan.risk ?? 1;

  document.getElementById("planRR").value =
    data.plan.rr ?? 2;

  document.getElementById("planDailyLoss").value =
    data.plan.dailyLoss || "";

  document.getElementById("planMaxTrades").value =
    data.plan.maxTrades ?? 3;

  document.getElementById("planManagement").value =
    data.plan.management || "";
}

document
  .getElementById("savePlan")
  .addEventListener("click", () => {

    data.plan = {
      name: document.getElementById("planName").value,
      markets: document.getElementById("planMarkets").value,
      session: document.getElementById("planSession").value,
      context: document.getElementById("planContext").value,
      entry: document.getElementById("planEntry").value,
      risk: number(
        document.getElementById("planRisk").value
      ),
      rr: number(
        document.getElementById("planRR").value
      ),
      dailyLoss:
        document.getElementById("planDailyLoss").value,
      maxTrades: number(
        document.getElementById("planMaxTrades").value
      ),
      management:
        document.getElementById("planManagement").value
    };

    saveData();

    showToast("Trading plan saved");
  });

/* =========================================================
   TRADE MODAL
========================================================= */

const modal =
  document.getElementById("tradeModal");

function openTradeModal() {
  modal.classList.add("active");

  document.getElementById("tradeDate").value =
    today();

  selectedEmotion = "";
  screenshotData = "";

  document
    .querySelectorAll(".emotion")
    .forEach(button => {
      button.classList.remove("selected");
    });

  document
    .getElementById("screenshotPreview")
    .classList.add("hidden");
}

function closeTradeModal() {
  modal.classList.remove("active");
}

document
  .getElementById("newTradeBtn")
  .addEventListener("click", openTradeModal);

document
  .getElementById("journalNewTrade")
  .addEventListener("click", openTradeModal);

document
  .getElementById("closeModal")
  .addEventListener("click", closeTradeModal);

document
  .getElementById("cancelTrade")
  .addEventListener("click", closeTradeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) {
    closeTradeModal();
  }
});

/* EMOTIONS */

document
  .querySelectorAll(".emotion")
  .forEach(button => {
    button.addEventListener("click", () => {

      document
        .querySelectorAll(".emotion")
        .forEach(item => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");

      selectedEmotion =
        button.dataset.emotion;
    });
  });

/* SCREENSHOT */

document
  .getElementById("uploadBox")
  .addEventListener("click", () => {
    document
      .getElementById("tradeScreenshot")
      .click();
  });

document
  .getElementById("tradeScreenshot")
  .addEventListener("change", event => {

    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      screenshotData = reader.result;

      const preview =
        document.getElementById("screenshotPreview");

      preview.src = screenshotData;
      preview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  });

/* SAVE TRADE */

document
  .getElementById("tradeForm")
  .addEventListener("submit", event => {

    event.preventDefault();

    const trade = {
      id:
        Date.now().toString(36) +
        Math.random().toString(36).slice(2),

      createdAt: Date.now(),

      date:
        document.getElementById("tradeDate").value ||
        today(),

      symbol:
        document
          .getElementById("tradeSymbol")
          .value
          .trim()
          .toUpperCase(),

      direction:
        document.getElementById("tradeDirection").value,

      setup:
        document.getElementById("tradeSetup").value.trim(),

      entry:
        document.getElementById("tradeEntry").value,

      stop:
        document.getElementById("tradeStop").value,

      target:
        document.getElementById("tradeTarget").value,

      exit:
        document.getElementById("tradeExit").value,

      pnl:
        number(
          document.getElementById("tradePnl").value
        ),

      r:
        number(
          document.getElementById("tradeR").value
        ),

      emotion:
        selectedEmotion,

      planFollowed:
        document.getElementById(
          "tradePlanFollowed"
        ).checked,

      reason:
        document.getElementById("tradeReason").value,

      lesson:
        document.getElementById("tradeLesson").value,

      screenshot:
        screenshotData
    };

    if (!trade.symbol) {
      showToast("Enter a symbol");
      return;
    }

    data.trades.push(trade);

    saveData();

    selectedTradeId = trade.id;

    document
      .getElementById("tradeForm")
      .reset();

    closeTradeModal();

    renderDashboard();
    renderJournal();
    renderAnalytics();

    showToast("Trade saved to journal");

    showPage("journal");
  });

/* =========================================================
   JOURNAL SEARCH
========================================================= */

document
  .getElementById("journalSearch")
  .addEventListener("input", renderJournal);

document
  .getElementById("journalFilter")
  .addEventListener("change", renderJournal);

/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {
  const trades = data.trades;
  const stats = getStats();

  document.getElementById("analyticsTrades").textContent =
    trades.length;

  document.getElementById("analyticsPF").textContent =
    stats.profitFactor === Infinity
      ? "∞"
      : stats.profitFactor.toFixed(2);

  const pnlValues =
    trades.map(t => number(t.pnl));

  document.getElementById("analyticsBest").textContent =
    trades.length
      ? money(Math.max(...pnlValues))
      : "$0";

  document.getElementById("analyticsWorst").textContent =
    trades.length
      ? money(Math.min(...pnlValues))
      : "$0";

  renderSetupAnalytics();
  renderEmotionAnalytics();
}

function renderSetupAnalytics() {
  const container =
    document.getElementById("setupAnalytics");

  const groups = {};

  data.trades.forEach(trade => {
    const setup = trade.setup || "Unspecified";

    if (!groups[setup]) {
      groups[setup] = {
        pnl: 0,
        trades: 0
      };
    }

    groups[setup].pnl += number(trade.pnl);
    groups[setup].trades++;
  });

  const entries =
    Object.entries(groups)
      .sort((a, b) => b[1].pnl - a[1].pnl);

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-state">
        Your setup analytics will appear here.
      </div>
    `;

    return;
  }

  const max =
    Math.max(
      ...entries.map(item =>
        Math.abs(item[1].pnl)
      ),
      1
    );

  container.innerHTML =
    entries.map(([name, value]) => {

      const width =
        Math.min(
          100,
          (Math.abs(value.pnl) / max) * 100
        );

      return `
        <div class="analytics-row">

          <div class="analytics-row-top">
            <span>${escapeHtml(name)}</span>

            <strong class="${value.pnl >= 0
              ? "pnl-positive"
              : "pnl-negative"}">
              ${money(value.pnl)}
            </strong>
          </div>

          <div class="analytics-bar">
            <div
              style="
                width:${width}%;
                background:${value.pnl >= 0
                  ? "var(--green)"
                  : "var(--red)"};
              ">
            </div>
          </div>

        </div>
      `;
    }).join("");
}

function renderEmotionAnalytics() {
  const container =
    document.getElementById("emotionAnalytics");

  const groups = {};

  data.trades.forEach(trade => {
    const emotion =
      trade.emotion || "Not recorded";

    if (!groups[emotion]) {
      groups[emotion] = {
        pnl: 0,
        trades: 0
      };
    }

    groups[emotion].pnl += number(trade.pnl);
    groups[emotion].trades++;
  });

  const entries =
    Object.entries(groups)
      .sort((a, b) => b[1].pnl - a[1].pnl);

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-state">
        Add emotions to your trades to find psychology patterns.
      </div>
    `;

    return;
  }

  container.innerHTML =
    entries.map(([emotion, value]) => `
      <div class="analytics-row">

        <div class="analytics-row-top">
          <span>${escapeHtml(emotion)}</span>

          <strong class="${value.pnl >= 0
            ? "pnl-positive"
            : "pnl-negative"}">
            ${money(value.pnl)}
          </strong>
        </div>

        <div style="
          color:#566172;
          font-size:9px;
        ">
          ${value.trades}
          trade${value.trades === 1 ? "" : "s"}
        </div>

      </div>
    `).join("");
}

/* =========================================================
   BACKUP / RESTORE
========================================================= */

document
  .getElementById("backupBtn")
  .addEventListener("click", () => {

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: "application/json"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download =
      `tradeflow-backup-${today()}.json`;

    a.click();

    URL.revokeObjectURL(url);

    showToast("Backup downloaded");
  });

document
  .getElementById("importBtn")
  .addEventListener("click", () => {
    document
      .getElementById("importFile")
      .click();
  });

document
  .getElementById("importFile")
  .addEventListener("change", event => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {

      try {

        const imported =
          JSON.parse(reader.result);

        if (
          !imported ||
          !Array.isArray(imported.trades)
        ) {
          throw new Error("Invalid backup");
        }

        data = {
          ...structuredClone(defaultData),
          ...imported
        };

        saveData();

        renderDashboard();
        renderJournal();
        renderChecklist();
        renderPlan();
        renderAnalytics();

        showToast("Backup imported");

      } catch (error) {
        console.error(error);
        showToast("Invalid backup file");
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  });

/* =========================================================
   CSV EXPORT
========================================================= */

function exportCSV() {
  if (!data.trades.length) {
    showToast("No trades to export");
    return;
  }

  const headers = [
    "Date",
    "Symbol",
    "Direction",
    "Setup",
    "Entry",
    "Stop",
    "Target",
    "Exit",
    "PnL",
    "R",
    "Emotion",
    "Plan Followed",
    "Reason",
    "Lesson"
  ];

  const rows =
    data.trades.map(trade => [
      trade.date,
      trade.symbol,
      trade.direction,
      trade.setup,
      trade.entry,
      trade.stop,
      trade.target,
      trade.exit,
      trade.pnl,
      trade.r,
      trade.emotion,
      trade.planFollowed,
      trade.reason,
      trade.lesson
    ]);

  const csv = [
    headers,
    ...rows
  ]
    .map(row =>
      row.map(value =>
        `"${String(value ?? "")
          .replaceAll('"', '""')}"`
      ).join(",")
    )
    .join("\n");

  const blob =
    new Blob([csv], {
      type: "text/csv"
    });

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download =
    `tradeflow-journal-${today()}.csv`;

  a.click();

  URL.revokeObjectURL(url);

  showToast("CSV exported");
}

/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener("keydown", event => {

  if (
    event.key.toLowerCase() === "n" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(
      document.activeElement.tagName
    )
  ) {
    openTradeModal();
  }

  if (event.key === "Escape") {
    closeTradeModal();
  }
});

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  document
    .getElementById("tradeDate")
    .value = today();

  renderDashboard();
  renderJournal();
  renderChecklist();
  renderPlan();
  renderAnalytics();

});
