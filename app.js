"use strict";

/* =========================================
   TRADINGEDGE
   MAIN APPLICATION
   ========================================= */

const STORAGE_KEY = "tradingedge_trades_v1";
const SETTINGS_KEY = "tradingedge_settings_v1";
const CHECKLIST_KEY = "tradingedge_checklist_v1";

let trades = [];
let settings = {
  balance: 1000,
  currency: "USD",
  risk: 1,
  maxTrades: 3,
  dailyLoss: 3,
  minRR: 2
};

let currentScreenshot = "";
let toastTimer = null;


/* =========================================
   START APPLICATION
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

  loadData();
  bindNavigation();
  bindTradeButtons();
  bindTradeForm();
  bindScreenshot();
  bindSearchAndFilter();
  bindCalculator();
  bindChecklist();
  bindSettings();
  bindDataManagement();
  bindImageViewer();
  bindMobileMenu();

  setToday();
  updateAll();

});


/* =========================================
   STORAGE
   ========================================= */

function loadData() {

  try {

    const savedTrades =
      localStorage.getItem(STORAGE_KEY);

    const savedSettings =
      localStorage.getItem(SETTINGS_KEY);

    const savedChecklist =
      localStorage.getItem(CHECKLIST_KEY);


    if (savedTrades) {
      trades = JSON.parse(savedTrades);
    }

    if (savedSettings) {
      settings = {
        ...settings,
        ...JSON.parse(savedSettings)
      };
    }

    if (savedChecklist) {
      restoreChecklist(JSON.parse(savedChecklist));
    }

  } catch (error) {

    console.error(
      "Could not load TradingEdge data:",
      error
    );

  }

}


function saveTrades() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(trades)
  );

}


function saveSettings() {

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );

}


function saveChecklist() {

  const checks = [];

  document
    .querySelectorAll("#checklist input")
    .forEach(input => {
      checks.push(input.checked);
    });

  localStorage.setItem(
    CHECKLIST_KEY,
    JSON.stringify(checks)
  );

}


/* =========================================
   NAVIGATION
   ========================================= */

function bindNavigation() {

  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const page =
          button.dataset.page;

        showPage(page);

        closeMobileMenu();

      });

    });

}


function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });


  const target =
    document.getElementById(
      `page-${pageName}`
    );


  if (target) {
    target.classList.add("active");
  }


  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageName
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  updateAll();

}


/* =========================================
   TRADE BUTTONS
   ========================================= */

function bindTradeButtons() {

  const buttons = [
    "dashboardAddTrade",
    "recentAddTrade",
    "journalAddTrade"
  ];


  buttons.forEach(id => {

    const button =
      document.getElementById(id);

    if (button) {

      button.addEventListener(
        "click",
        () => openTradeModal()
      );

    }

  });

}


/* =========================================
   MODAL
   ========================================= */

function openTradeModal(trade = null) {

  const modal =
    document.getElementById("tradeModal");

  if (!modal) return;


  resetTradeForm();


  if (trade) {

    document.getElementById("modalTitle")
      .textContent = "Edit Trade";

    fillTradeForm(trade);

  } else {

    document.getElementById("modalTitle")
      .textContent = "Add Trade";

    setToday();

  }


  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";

}


function closeTradeModal() {

  const modal =
    document.getElementById("tradeModal");

  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";

}


function resetTradeForm() {

  const form =
    document.getElementById("tradeForm");

  if (form) {
    form.reset();
  }


  document.getElementById("tradeId").value = "";

  currentScreenshot = "";

  hideScreenshotPreview();

}


function setToday() {

  const input =
    document.getElementById("tradeDate");

  if (!input) return;


  if (!input.value) {

    const today =
      new Date().toISOString().split("T")[0];

    input.value = today;

  }

}


/* =========================================
   TRADE FORM
   ========================================= */

function bindTradeForm() {

  const form =
    document.getElementById("tradeForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      saveTradeFromForm();

    }
  );


  document
    .getElementById("closeModal")
    ?.addEventListener(
      "click",
      closeTradeModal
    );


  document
    .getElementById("cancelTrade")
    ?.addEventListener(
      "click",
      closeTradeModal
    );


  document
    .getElementById("modalBackdrop")
    ?.addEventListener(
      "click",
      closeTradeModal
    );

}


function saveTradeFromForm() {

  const id =
    document.getElementById("tradeId").value;


  const trade = {

    id: id || createId(),

    pair:
      value("tradePair").toUpperCase(),

    direction:
      value("tradeDirection"),

    date:
      value("tradeDate"),

    session:
      value("tradeSession"),

    setup:
      value("tradeSetup"),

    timeframe:
      value("tradeTimeframe"),

    entry:
      number("tradeEntry"),

    stop:
      number("tradeStop"),

    tp:
      number("tradeTP"),

    lot:
      number("tradeLot"),

    risk:
      number("tradeRisk"),

    r:
      number("tradeR"),

    result:
      value("tradeResult"),

    profit:
      number("tradeProfit"),

    notes:
      value("tradeNotes"),

    screenshot:
      currentScreenshot,

    confluences: {

      structure:
        checked("confluenceStructure"),

      liquidity:
        checked("confluenceLiquidity"),

      supply:
        checked("confluenceSupply"),

      orderBlock:
        checked("confluenceOB"),

      fvg:
        checked("confluenceFVG"),

      vwap:
        checked("confluenceVWAP"),

      volume:
        checked("confluenceVolume")

    },

    updatedAt:
      new Date().toISOString()

  };


  if (!trade.pair) {

    showToast(
      "Please enter a pair.",
      "error"
    );

    return;

  }


  if (id) {

    const index =
      trades.findIndex(
        item => item.id === id
      );

    if (index !== -1) {
      trades[index] = trade;
    }

    showToast("Trade updated.");

  } else {

    trades.unshift(trade);

    showToast("Trade saved.");

  }


  saveTrades();
  closeTradeModal();
  updateAll();

}


/* =========================================
   FORM HELPERS
   ========================================= */

function value(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";

}


function number(id) {

  const valueText = value(id);

  if (valueText === "") {
    return 0;
  }

  const result =
    Number(valueText);

  return Number.isFinite(result)
    ? result
    : 0;

}


function checked(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.checked
    : false;

}


function createId() {

  return Date.now().toString(36)
    + Math.random()
      .toString(36)
      .slice(2);

   }
/* =========================================
   FILL TRADE FORM
   ========================================= */

function fillTradeForm(trade) {

  document.getElementById("tradeId").value =
    trade.id || "";

  document.getElementById("tradePair").value =
    trade.pair || "";

  document.getElementById("tradeDirection").value =
    trade.direction || "BUY";

  document.getElementById("tradeDate").value =
    trade.date || "";

  document.getElementById("tradeSession").value =
    trade.session || "London";

  document.getElementById("tradeSetup").value =
    trade.setup || "";

  document.getElementById("tradeTimeframe").value =
    trade.timeframe || "M5";

  document.getElementById("tradeEntry").value =
    trade.entry || "";

  document.getElementById("tradeStop").value =
    trade.stop || "";

  document.getElementById("tradeTP").value =
    trade.tp || "";

  document.getElementById("tradeLot").value =
    trade.lot || "";

  document.getElementById("tradeRisk").value =
    trade.risk || "";

  document.getElementById("tradeR").value =
    trade.r || "";

  document.getElementById("tradeResult").value =
    trade.result || "win";

  document.getElementById("tradeProfit").value =
    trade.profit || "";

  document.getElementById("tradeNotes").value =
    trade.notes || "";


  const c = trade.confluences || {};

  document.getElementById("confluenceStructure").checked =
    !!c.structure;

  document.getElementById("confluenceLiquidity").checked =
    !!c.liquidity;

  document.getElementById("confluenceSupply").checked =
    !!c.supply;

  document.getElementById("confluenceOB").checked =
    !!c.orderBlock;

  document.getElementById("confluenceFVG").checked =
    !!c.fvg;

  document.getElementById("confluenceVWAP").checked =
    !!c.vwap;

  document.getElementById("confluenceVolume").checked =
    !!c.volume;


  currentScreenshot =
    trade.screenshot || "";

  if (currentScreenshot) {
    showScreenshotPreview(
      currentScreenshot
    );
  }

}


/* =========================================
   SCREENSHOT
   ========================================= */

function bindScreenshot() {

  const fileInput =
    document.getElementById(
      "tradeScreenshot"
    );

  const uploadButton =
    document.getElementById(
      "screenshotButton"
    );

  const changeButton =
    document.getElementById(
      "changeScreenshot"
    );

  const removeButton =
    document.getElementById(
      "removeScreenshot"
    );


  uploadButton?.addEventListener(
    "click",
    () => fileInput?.click()
  );


  changeButton?.addEventListener(
    "click",
    () => fileInput?.click()
  );


  removeButton?.addEventListener(
    "click",
    () => {

      currentScreenshot = "";

      hideScreenshotPreview();

      if (fileInput) {
        fileInput.value = "";
      }

    }
  );


  fileInput?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (!file) return;


      if (!file.type.startsWith("image/")) {

        showToast(
          "Please select an image.",
          "error"
        );

        return;

      }


      const reader =
        new FileReader();


      reader.onload = () => {

        currentScreenshot =
          reader.result;

        showScreenshotPreview(
          currentScreenshot
        );

      };


      reader.onerror = () => {

        showToast(
          "Could not read the image.",
          "error"
        );

      };


      reader.readAsDataURL(file);

    }
  );

}


function showScreenshotPreview(src) {

  const preview =
    document.getElementById(
      "screenshotPreview"
    );

  const image =
    document.getElementById(
      "screenshotImage"
    );


  if (!preview || !image) return;


  image.src = src;

  preview.hidden = false;

}


function hideScreenshotPreview() {

  const preview =
    document.getElementById(
      "screenshotPreview"
    );

  const image =
    document.getElementById(
      "screenshotImage"
    );


  if (image) {
    image.src = "";
  }

  if (preview) {
    preview.hidden = true;
  }

}


/* =========================================
   SEARCH + FILTER
   ========================================= */

function bindSearchAndFilter() {

  document
    .getElementById("searchTrades")
    ?.addEventListener(
      "input",
      renderJournal
    );


  document
    .getElementById("filterResult")
    ?.addEventListener(
      "change",
      renderJournal
    );

}


/* =========================================
   RENDER ALL
   ========================================= */

function updateAll() {

  renderStats();
  renderRecentTrades();
  renderJournal();
  renderAnalytics();
  updateCalculator();
  updateChecklist();
  loadSettingsIntoForm();

}


/* =========================================
   STATISTICS
   ========================================= */

function getStats() {

  const total =
    trades.length;

  const wins =
    trades.filter(
      trade => trade.result === "win"
    ).length;

  const losses =
    trades.filter(
      trade => trade.result === "loss"
    ).length;

  const breakeven =
    trades.filter(
      trade => trade.result === "breakeven"
    ).length;


  const profit =
    trades.reduce(
      (sum, trade) =>
        sum + (Number(trade.profit) || 0),
      0
    );


  const totalR =
    trades.reduce(
      (sum, trade) =>
        sum + (Number(trade.r) || 0),
      0
    );


  const winRate =
    total > 0
      ? (wins / total) * 100
      : 0;


  const averageR =
    total > 0
      ? totalR / total
      : 0;


  return {
    total,
    wins,
    losses,
    breakeven,
    profit,
    totalR,
    winRate,
    averageR
  };

}


/* =========================================
   DASHBOARD STATS
   ========================================= */

function renderStats() {

  const stats =
    getStats();


  setText(
    "statTrades",
    stats.total
  );

  setText(
    "statWinRate",
    formatPercent(stats.winRate)
  );

  setText(
    "statProfit",
    formatMoney(stats.profit)
  );

  setText(
    "statAverageR",
    `${stats.averageR.toFixed(2)}R`
  );

}


/* =========================================
   RECENT TRADES
   ========================================= */

function renderRecentTrades() {

  const container =
    document.getElementById(
      "recentTrades"
    );

  if (!container) return;


  if (!trades.length) {

    container.innerHTML = emptyState(
      "📊",
      "No trades yet",
      "Add your first trade to start your journal."
    );

    return;

  }


  const recent =
    trades.slice(0, 5);


  container.innerHTML =
    recent.map(
      trade => tradeHTML(
        trade,
        false
      )
    ).join("");

  bindTradeActions();

}


/* =========================================
   JOURNAL
   ========================================= */

function renderJournal() {

  const container =
    document.getElementById(
      "journalList"
    );

  if (!container) return;


  const search =
    (
      document.getElementById(
        "searchTrades"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const filter =
    document.getElementById(
      "filterResult"
    )?.value || "all";


  const filtered =
    trades.filter(trade => {

      const matchesSearch =
        !search ||
        [
          trade.pair,
          trade.setup,
          trade.session,
          trade.notes,
          trade.timeframe
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);


      const matchesFilter =
        filter === "all" ||
        trade.result === filter;


      return (
        matchesSearch &&
        matchesFilter
      );

    });


  if (!filtered.length) {

    container.innerHTML =
      emptyState(
        "📓",
        trades.length
          ? "No matching trades"
          : "Your journal is empty",
        trades.length
          ? "Try another search or filter."
          : "Add a trade to begin."
      );

    return;

  }


  container.innerHTML =
    filtered
      .map(
        trade => tradeHTML(
          trade,
          true
        )
      )
      .join("");


  bindTradeActions();

}


/* =========================================
   TRADE HTML
   ========================================= */

function tradeHTML(
  trade,
  detailed = false
) {

  const resultClass =
    trade.result || "breakeven";


  const resultLabel =
    trade.result === "win"
      ? "WIN"
      : trade.result === "loss"
        ? "LOSS"
        : "BREAKEVEN";


  const profit =
    Number(trade.profit) || 0;


  const direction =
    trade.direction === "SELL"
      ? "sell"
      : "buy";


  const screenshot =
    trade.screenshot
      ? `
        <div class="trade-screenshot">
          <img
            src="${escapeAttribute(trade.screenshot)}"
            alt="Trading chart screenshot"
            data-image="${escapeAttribute(trade.screenshot)}"
          >
        </div>
      `
      : "";


  const notes =
    detailed && trade.notes
      ? `
        <div class="trade-notes">
          ${escapeHTML(trade.notes)}
        </div>
      `
      : "";


  const details =
    detailed
      ? `
        <div class="trade-details">

          <div class="trade-details-grid">

            <div>
              <span>Entry</span>
              <strong>${displayNumber(trade.entry)}</strong>
            </div>

            <div>
              <span>Stop</span>
              <strong>${displayNumber(trade.stop)}</strong>
            </div>

            <div>
              <span>Take Profit</span>
              <strong>${displayNumber(trade.tp)}</strong>
            </div>

            <div>
              <span>Lot</span>
              <strong>${displayNumber(trade.lot)}</strong>
            </div>

            <div>
              <span>Risk</span>
              <strong>${displayNumber(trade.risk)}%</strong>
            </div>

            <div>
              <span>R Multiple</span>
              <strong>${displayNumber(trade.r)}R</strong>
            </div>

            <div>
              <span>Timeframe</span>
              <strong>${escapeHTML(trade.timeframe || "-")}</strong>
            </div>

            <div>
              <span>Session</span>
              <strong>${escapeHTML(trade.session || "-")}</strong>
            </div>

          </div>

          ${notes}

          ${screenshot}

        </div>
      `
      : "";


  return `
    <div class="trade-row">

      <div>

        <div class="trade-title">

          <strong>
            ${escapeHTML(trade.pair || "-")}
          </strong>

          <span class="direction ${direction}">
            ${escapeHTML(trade.direction || "BUY")}
          </span>

        </div>


        <div class="trade-meta">

          ${escapeHTML(trade.date || "-")}
          ·
          ${escapeHTML(trade.setup || "No setup")}
          ·
          ${escapeHTML(trade.session || "-")}

        </div>


        ${
          detailed
            ? `
              <div class="tags">

                ${confluenceTags(trade)}

              </div>
            `
            : ""
        }


        ${details}

      </div>


      <div class="trade-result">

        <strong class="${resultClass}">
          ${formatMoney(profit)}
        </strong>

        <small class="${resultClass}">
          ${resultLabel}
        </small>


        ${
          detailed
            ? `
              <div class="trade-actions">

                <button
                  type="button"
                  data-edit="${escapeAttribute(trade.id)}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="delete-trade"
                  data-delete="${escapeAttribute(trade.id)}"
                >
                  Delete
                </button>

              </div>
            `
            : ""
        }

      </div>

    </div>
  `;

}


/* =========================================
   EMPTY STATE
   ========================================= */

function emptyState(
  icon,
  title,
  message
) {

  return `
    <div class="empty">

      <div class="empty-icon">
        ${icon}
      </div>

      <h3>
        ${escapeHTML(title)}
      </h3>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>
  `;

     }
/* =========================================
   CONFLUENCE TAGS
   ========================================= */

function confluenceTags(trade) {

  const c =
    trade.confluences || {};

  const tags = [];

  if (c.structure) tags.push("Structure");
  if (c.liquidity) tags.push("Liquidity");
  if (c.supply) tags.push("Supply/Demand");
  if (c.orderBlock) tags.push("Order Block");
  if (c.fvg) tags.push("FVG");
  if (c.vwap) tags.push("VWAP");
  if (c.volume) tags.push("Volume");


  if (!tags.length) {
    return `<span class="text-muted">No confluences</span>`;
  }


  return tags
    .map(
      tag => `
        <span class="tag">
          ${escapeHTML(tag)}
        </span>
      `
    )
    .join("");

}


/* =========================================
   TRADE ACTIONS
   ========================================= */

function bindTradeActions() {

  document
    .querySelectorAll("[data-edit]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.edit;

          const trade =
            trades.find(
              item => item.id === id
            );

          if (trade) {
            openTradeModal(trade);
          }

        }
      );

    });


  document
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.delete;

          deleteTrade(id);

        }
      );

    });


  document
    .querySelectorAll(
      ".trade-screenshot img"
    )
    .forEach(image => {

      image.addEventListener(
        "click",
        () => {

          const src =
            image.dataset.image;

          if (src) {
            openImageViewer(src);
          }

        }
      );

    });

}


/* =========================================
   DELETE TRADE
   ========================================= */

function deleteTrade(id) {

  const trade =
    trades.find(
      item => item.id === id
    );


  if (!trade) return;


  const confirmed =
    window.confirm(
      `Delete ${trade.pair || "this trade"}?`
    );


  if (!confirmed) return;


  trades =
    trades.filter(
      item => item.id !== id
    );


  saveTrades();
  updateAll();

  showToast("Trade deleted.");

}


/* =========================================
   ANALYTICS
   ========================================= */

function renderAnalytics() {

  const stats =
    getStats();


  setText(
    "analyticsTrades",
    stats.total
  );

  setText(
    "analyticsWins",
    stats.wins
  );

  setText(
    "analyticsLosses",
    stats.losses
  );

  setText(
    "analyticsBE",
    stats.breakeven
  );

  setText(
    "analyticsWinRate",
    formatPercent(stats.winRate)
  );

  setText(
    "analyticsTotalR",
    `${stats.totalR.toFixed(2)}R`
  );

  setText(
    "analyticsAvgR",
    `${stats.averageR.toFixed(2)}R`
  );

  setText(
    "analyticsProfit",
    formatMoney(stats.profit)
  );


  const total =
    stats.total || 1;


  const winPercent =
    (stats.wins / total) * 100;

  const lossPercent =
    (stats.losses / total) * 100;

  const bePercent =
    (stats.breakeven / total) * 100;


  setText(
    "winPercent",
    `${winPercent.toFixed(1)}%`
  );

  setText(
    "lossPercent",
    `${lossPercent.toFixed(1)}%`
  );

  setText(
    "bePercent",
    `${bePercent.toFixed(1)}%`
  );


  setWidth(
    "winBar",
    winPercent
  );

  setWidth(
    "lossBar",
    lossPercent
  );

  setWidth(
    "beBar",
    bePercent
  );

}


/* =========================================
   CALCULATOR
   ========================================= */

function bindCalculator() {

  [
    "calcBalance",
    "calcRisk",
    "calcStop",
    "calcPipValue"
  ].forEach(id => {

    document
      .getElementById(id)
      ?.addEventListener(
        "input",
        updateCalculator
      );

  });

}


function updateCalculator() {

  const balance =
    number("calcBalance");

  const riskPercent =
    number("calcRisk");

  const stopPips =
    number("calcStop");

  const pipValue =
    number("calcPipValue");


  const riskAmount =
    balance * riskPercent / 100;


  const riskPerPip =
    stopPips > 0
      ? riskAmount / stopPips
      : 0;


  const lotSize =
    pipValue > 0
      ? riskPerPip / pipValue
      : 0;


  setText(
    "calcRiskAmount",
    formatMoney(riskAmount)
  );

  setText(
    "calcRiskPerPip",
    formatMoney(riskPerPip)
  );

  setText(
    "calcLot",
    lotSize.toFixed(2)
  );

}


/* =========================================
   CHECKLIST
   ========================================= */

function bindChecklist() {

  document
    .querySelectorAll(
      "#checklist input"
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          saveChecklist();
          updateChecklist();

        }
      );

    });

}


function updateChecklist() {

  const inputs =
    Array.from(
      document.querySelectorAll(
        "#checklist input"
      )
    );


  const total =
    inputs.length;


  const completed =
    inputs.filter(
      input => input.checked
    ).length;


  const percent =
    total > 0
      ? (completed / total) * 100
      : 0;


  setText(
    "checkCount",
    `${completed} / ${total}`
  );


  setWidth(
    "checkProgress",
    percent
  );


  const status =
    document.getElementById(
      "checkStatus"
    );


  if (status) {

    if (completed === total && total > 0) {

      status.textContent =
        "Checklist complete. You can evaluate the trade.";

      status.classList.add(
        "text-green"
      );

    } else {

      status.textContent =
        "Complete your checklist before entering.";

      status.classList.remove(
        "text-green"
      );

    }

  }

}


function restoreChecklist(values) {

  const inputs =
    Array.from(
      document.querySelectorAll(
        "#checklist input"
      )
    );


  inputs.forEach(
    (input, index) => {

      input.checked =
        !!values[index];

    }
  );

}


/* =========================================
   SETTINGS
   ========================================= */

function bindSettings() {

  const form =
    document.getElementById(
      "settingsForm"
    );


  form?.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      settings.balance =
        number("settingsBalance");

      settings.currency =
        value("settingsCurrency");

      settings.risk =
        number("settingsRisk");

      settings.maxTrades =
        number("settingsMaxTrades");

      settings.dailyLoss =
        number("settingsDailyLoss");

      settings.minRR =
        number("settingsMinRR");


      saveSettings();

      showToast(
        "Settings saved."
      );

    }
  );

}


function loadSettingsIntoForm() {

  const balance =
    document.getElementById(
      "settingsBalance"
    );


  if (!balance) return;


  balance.value =
    settings.balance;


  const currency =
    document.getElementById(
      "settingsCurrency"
    );

  if (currency) {
    currency.value =
      settings.currency;
  }


  const risk =
    document.getElementById(
      "settingsRisk"
    );

  if (risk) {
    risk.value =
      settings.risk;
  }


  const maxTrades =
    document.getElementById(
      "settingsMaxTrades"
    );

  if (maxTrades) {
    maxTrades.value =
      settings.maxTrades;
  }


  const dailyLoss =
    document.getElementById(
      "settingsDailyLoss"
    );

  if (dailyLoss) {
    dailyLoss.value =
      settings.dailyLoss;
  }


  const minRR =
    document.getElementById(
      "settingsMinRR"
    );

  if (minRR) {
    minRR.value =
      settings.minRR;
  }

}


/* =========================================
   DATA MANAGEMENT
   ========================================= */

function bindDataManagement() {

  document
    .getElementById("exportBtn")
    ?.addEventListener(
      "click",
      exportData
    );


  const importButton =
    document.getElementById(
      "importBtn"
    );

  const importFile =
    document.getElementById(
      "importFile"
    );


  importButton?.addEventListener(
    "click",
    () => importFile?.click()
  );


  importFile?.addEventListener(
    "change",
    importData
  );


  document
    .getElementById("clearBtn")
    ?.addEventListener(
      "click",
      clearAllData
    );

}


/* =========================================
   EXPORT
   ========================================= */

function exportData() {

  const backup = {

    version: 1,

    exportedAt:
      new Date().toISOString(),

    trades,

    settings

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
        type: "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    `tradingedge-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;


  document.body.appendChild(link);

  link.click();

  link.remove();


  URL.revokeObjectURL(url);


  showToast(
    "Backup exported."
  );

}


/* =========================================
   IMPORT
   ========================================= */

function importData(event) {

  const file =
    event.target.files?.[0];


  if (!file) return;


  const reader =
    new FileReader();


  reader.onload = () => {

    try {

      const backup =
        JSON.parse(
          reader.result
        );


      if (
        !backup ||
        !Array.isArray(backup.trades)
      ) {

        throw new Error(
          "Invalid backup file."
        );

      }


      trades =
        backup.trades;


      if (backup.settings) {

        settings = {
          ...settings,
          ...backup.settings
        };

      }


      saveTrades();
      saveSettings();
      updateAll();


      showToast(
        "Backup imported."
      );


    } catch (error) {

      console.error(error);

      showToast(
        "Invalid backup file.",
        "error"
      );

    }


    event.target.value = "";

  };


  reader.readAsText(file);

}


/* =========================================
   CLEAR DATA
   ========================================= */

function clearAllData() {

  const confirmed =
    window.confirm(
      "Delete ALL TradingEdge data? This cannot be undone."
    );


  if (!confirmed) return;


  trades = [];


  localStorage.removeItem(
    STORAGE_KEY
  );


  updateAll();


  showToast(
    "All trade data deleted."
  );

}
/* =========================================
   IMAGE VIEWER
   ========================================= */

function bindImageViewer() {

  document
    .getElementById("imageViewerClose")
    ?.addEventListener(
      "click",
      closeImageViewer
    );


  document
    .getElementById("imageViewer")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "imageViewer"
        ) {
          closeImageViewer();
        }

      }
    );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeImageViewer();
        closeTradeModal();
        closeMobileMenu();

      }

    }
  );

}


function openImageViewer(src) {

  const viewer =
    document.getElementById(
      "imageViewer"
    );

  const image =
    document.getElementById(
      "viewerImage"
    );


  if (!viewer || !image) return;


  image.src = src;

  viewer.hidden = false;

  document.body.style.overflow =
    "hidden";

}


function closeImageViewer() {

  const viewer =
    document.getElementById(
      "imageViewer"
    );


  const image =
    document.getElementById(
      "viewerImage"
    );


  if (!viewer) return;


  viewer.hidden = true;


  if (image) {
    image.src = "";
  }


  if (
    !document
      .getElementById("tradeModal")
      ?.classList.contains("open")
  ) {
    document.body.style.overflow = "";
  }

}


/* =========================================
   MOBILE MENU
   ========================================= */

function bindMobileMenu() {

  const menuButton =
    document.getElementById(
      "menuButton"
    );


  const overlay =
    document.getElementById(
      "mobileOverlay"
    );


  menuButton?.addEventListener(
    "click",
    toggleMobileMenu
  );


  overlay?.addEventListener(
    "click",
    closeMobileMenu
  );

}


function toggleMobileMenu() {

  const sidebar =
    document.querySelector(
      ".sidebar"
    );

  const overlay =
    document.getElementById(
      "mobileOverlay"
    );


  if (!sidebar) return;


  sidebar.classList.toggle(
    "open"
  );


  overlay?.classList.toggle(
    "active"
  );

}


function closeMobileMenu() {

  const sidebar =
    document.querySelector(
      ".sidebar"
    );

  const overlay =
    document.getElementById(
      "mobileOverlay"
    );


  sidebar?.classList.remove(
    "open"
  );


  overlay?.classList.remove(
    "active"
  );

}


/* =========================================
   TOAST
   ========================================= */

function showToast(
  message,
  type = "success"
) {

  const toast =
    document.getElementById(
      "toast"
    );


  const messageElement =
    document.getElementById(
      "toastMessage"
    );


  if (!toast || !messageElement) {

    alert(message);

    return;

  }


  messageElement.textContent =
    message;


  toast.classList.remove(
    "show"
  );


  if (type === "error") {

    toast.style.borderColor =
      "rgba(239,68,68,.5)";

  } else {

    toast.style.borderColor =
      "var(--border)";

  }


  requestAnimationFrame(() => {

    toast.classList.add(
      "show"
    );

  });


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );

}


/* =========================================
   DOM HELPERS
   ========================================= */

function setText(
  id,
  text
) {

  const element =
    document.getElementById(id);


  if (element) {
    element.textContent = text;
  }

}


function setWidth(
  id,
  percent
) {

  const element =
    document.getElementById(id);


  if (!element) return;


  const safe =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );


  element.style.width =
    `${safe}%`;

}


/* =========================================
   NUMBER / MONEY FORMATTING
   ========================================= */

function formatMoney(
  amount
) {

  const numberAmount =
    Number(amount) || 0;


  const currency =
    settings.currency || "USD";


  try {

    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }
    ).format(numberAmount);

  } catch {

    return `${currency} ${numberAmount.toFixed(2)}`;

  }

}


function formatPercent(
  value
) {

  return `${(
    Number(value) || 0
  ).toFixed(1)}%`;

}


function displayNumber(
  value
) {

  const numberValue =
    Number(value);


  if (!Number.isFinite(numberValue)) {
    return "-";
  }


  return numberValue
    .toString();

}


/* =========================================
   HTML SAFETY
   ========================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}


/* =========================================
   GLOBAL KEYBOARD SHORTCUT
   ========================================= */

document.addEventListener(
  "keydown",
  event => {

    /*
      Ctrl/Cmd + K
      opens the trade form.
    */

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      openTradeModal();

    }

  }
);


/* =========================================
   FINAL INITIALIZATION
   ========================================= */

window.TradingEdge = {

  addTrade: openTradeModal,

  showPage,

  getTrades: () => [...trades],

  getStats

};
