/* =====================================================
   TRADINGEDGE
   APPLICATION JAVASCRIPT
   PART 1 / 2
   ===================================================== */

"use strict";


/* =====================================================
   STORAGE
   ===================================================== */

const STORAGE_KEY = "tradingedge_trades_v2";
const SETTINGS_KEY = "tradingedge_settings_v2";
const CHECKLIST_KEY = "tradingedge_checklist_v2";


/* =====================================================
   DEFAULT SETTINGS
   ===================================================== */

const defaultSettings = {
  balance: 1000,
  currency: "USD",
  risk: 1,
  maxTrades: 3,
  dailyLoss: 3,
  minRR: 2
};


/* =====================================================
   DEFAULT CHECKLIST
   ===================================================== */

const checklistItems = [
  "Higher-timeframe bias is clear",
  "Market structure supports the trade",
  "Liquidity has been identified",
  "Liquidity sweep occurred",
  "Supply / Demand zone is valid",
  "Order Block is valid",
  "FVG is present or respected",
  "VWAP supports the direction",
  "Entry is at a planned location",
  "Stop loss is placed logically",
  "Risk is within my rules",
  "Risk-to-reward is acceptable",
  "No emotional / revenge trading",
  "I have a clear invalidation point"
];


/* =====================================================
   APPLICATION STATE
   ===================================================== */

let trades = loadTrades();

let settings = loadSettings();

let currentScreenshot = "";

let editingTradeId = null;

let toastTimer = null;


/* =====================================================
   DOM HELPER
   ===================================================== */

function $(selector) {
  return document.querySelector(selector);
}


function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}


/* =====================================================
   STORAGE FUNCTIONS
   ===================================================== */

function loadTrades() {

  try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {

    console.error("Unable to load trades:", error);

    return [];

  }
}


function saveTrades() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(trades)
  );
}


function loadSettings() {

  try {

    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return { ...defaultSettings };
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved)
    };

  } catch (error) {

    console.error("Unable to load settings:", error);

    return { ...defaultSettings };

  }
}


function saveSettingsToStorage() {

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}


/* =====================================================
   ID GENERATOR
   ===================================================== */

function generateId() {

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );

}


/* =====================================================
   SAFE HTML
   ===================================================== */

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =====================================================
   NUMBER HELPERS
   ===================================================== */

function number(value, fallback = 0) {

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;

}


function formatNumber(value, decimals = 2) {

  return number(value).toLocaleString(
    undefined,
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }
  );

}


function formatMoney(value) {

  const amount = number(value);

  const currency = settings.currency || "USD";

  try {

    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }
    ).format(amount);

  } catch {

    return `${currency} ${formatNumber(amount)}`;

  }

}


/* =====================================================
   DATE HELPERS
   ===================================================== */

function today() {

  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function formatDate(value) {

  if (!value) {
    return "No date";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


/* =====================================================
   TOAST
   ===================================================== */

function showToast(message, type = "success") {

  const toast = $("#toast");
  const toastMessage = $("#toastMessage");
  const toastIcon = $("#toastIcon");

  if (!toast || !toastMessage) {
    return;
  }

  toastMessage.textContent = message;

  if (toastIcon) {

    if (type === "error") {
      toastIcon.textContent = "!";
      toastIcon.style.color = "var(--danger)";
    }

    else if (type === "warning") {
      toastIcon.textContent = "!";
      toastIcon.style.color = "var(--warning)";
    }

    else {
      toastIcon.textContent = "✓";
      toastIcon.style.color = "var(--success)";
    }

  }

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2500);

}


/* =====================================================
   NAVIGATION
   ===================================================== */

function setupNavigation() {

  const navButtons = $all(".nav-btn");

  const sections = $all(".page-section");

  navButtons.forEach(button => {

    button.addEventListener("click", () => {

      const target =
        button.dataset.target ||
        button.getAttribute("data-page") ||
        button.getAttribute("data-section");

      if (!target) {
        return;
      }

      navButtons.forEach(item => {

        item.classList.remove("active");

      });

      button.classList.add("active");


      sections.forEach(section => {

        section.classList.remove("active");

      });


      const targetSection =
        document.getElementById(target) ||
        document.querySelector(`#${CSS.escape(target)}`);

      if (targetSection) {

        targetSection.classList.add("active");

      }


      if (window.innerWidth <= 800) {

        $(".sidebar")?.classList.remove(
          "mobile-open"
        );

      }


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });

  });

}


/* =====================================================
   MOBILE SIDEBAR
   ===================================================== */

function setupMobileMenu() {

  const menuButton =
    $("#mobileMenuBtn");

  const sidebar =
    $(".sidebar");

  if (!menuButton || !sidebar) {
    return;
  }

  menuButton.addEventListener("click", () => {

    sidebar.classList.toggle(
      "mobile-open"
    );

  });

}


/* =====================================================
   TRADE MODAL
   ===================================================== */

function openTradeModal(trade = null) {

  const modal = $("#tradeModal");

  if (!modal) {
    return;
  }

  editingTradeId = trade
    ? trade.id
    : null;


  $("#tradeModalTitle").textContent =
    trade
      ? "Edit Trade"
      : "Add Trade";


  $("#tradeId").value =
    trade?.id || "";


  $("#tradePair").value =
    trade?.pair || "";


  $("#tradeDirection").value =
    trade?.direction || "BUY";


  $("#tradeDate").value =
    trade?.date || today();


  $("#tradeSession").value =
    trade?.session || "London";


  $("#tradeEntry").value =
    trade?.entry ?? "";


  $("#tradeStop").value =
    trade?.stop ?? "";


  $("#tradeTakeProfit").value =
    trade?.takeProfit ?? "";


  $("#tradeLotSize").value =
    trade?.lotSize ?? "";


  $("#tradeRiskPercent").value =
    trade?.riskPercent ??
    settings.risk ??
    "";


  $("#tradeRMultiple").value =
    trade?.rMultiple ?? "";


  $("#tradeProfitLoss").value =
    trade?.profitLoss ?? "";


  $("#tradeResult").value =
    trade?.result || "win";


  $("#tradeSetup").value =
    trade?.setup || "";


  $("#tradeNotes").value =
    trade?.notes || "";


  $("#tradeMarketStructure").checked =
    Boolean(trade?.strategy?.marketStructure);


  $("#tradeLiquiditySweep").checked =
    Boolean(trade?.strategy?.liquiditySweep);


  $("#tradeSupplyDemand").checked =
    Boolean(trade?.strategy?.supplyDemand);


  $("#tradeOrderBlock").checked =
    Boolean(trade?.strategy?.orderBlock);


  $("#tradeFVG").checked =
    Boolean(trade?.strategy?.fvg);


  $("#tradeVWAP").checked =
    Boolean(trade?.strategy?.vwap);


  $("#tradeVolume").checked =
    Boolean(trade?.strategy?.volume);


  currentScreenshot =
    trade?.screenshot || "";


  updateScreenshotPreview();


  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow = "hidden";

}


function closeTradeModal() {

  const modal = $("#tradeModal");

  if (!modal) {
    return;
  }

  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

  editingTradeId = null;

  currentScreenshot = "";

}


/* =====================================================
   SCREENSHOT PREVIEW
   ===================================================== */

function updateScreenshotPreview() {

  const preview =
    $("#screenshotPreview");

  const image =
    $("#screenshotImage");

  const uploadBox =
    $("#uploadScreenshotBtn");


  if (!preview || !image) {
    return;
  }


  if (currentScreenshot) {

    image.src = currentScreenshot;

    preview.classList.remove("hidden");

    if (uploadBox) {
      uploadBox.classList.add("hidden");
    }

  } else {

    image.removeAttribute("src");

    preview.classList.add("hidden");

    if (uploadBox) {
      uploadBox.classList.remove("hidden");
    }

  }

}


/* =====================================================
   SCREENSHOT UPLOAD
   ===================================================== */

function setupScreenshotUpload() {

  const fileInput =
    $("#tradeScreenshot");

  const uploadButton =
    $("#uploadScreenshotBtn");

  const replaceButton =
    $("#replaceScreenshotBtn");

  const removeButton =
    $("#removeScreenshotBtn");


  if (!fileInput) {
    return;
  }


  function chooseFile() {

    fileInput.click();

  }


  uploadButton?.addEventListener(
    "click",
    chooseFile
  );


  replaceButton?.addEventListener(
    "click",
    chooseFile
  );


  removeButton?.addEventListener(
    "click",
    () => {

      currentScreenshot = "";

      fileInput.value = "";

      updateScreenshotPreview();

    }
  );


  fileInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }


      if (!file.type.startsWith("image/")) {

        showToast(
          "Please select an image file.",
          "error"
        );

        fileInput.value = "";

        return;

      }


      const reader =
        new FileReader();


      reader.onload = () => {

        currentScreenshot =
          reader.result;

        updateScreenshotPreview();

      };


      reader.onerror = () => {

        showToast(
          "Could not read the screenshot.",
          "error"
        );

      };


      reader.readAsDataURL(file);

    }
  );

}


/* =====================================================
   TRADE FORM
   ===================================================== */

function getTradeFromForm() {

  const pair =
    $("#tradePair").value.trim();


  if (!pair) {

    showToast(
      "Enter a pair or instrument.",
      "error"
    );

    return null;

  }


  const date =
    $("#tradeDate").value;


  if (!date) {

    showToast(
      "Select a trade date.",
      "error"
    );

    return null;

  }


  return {

    id:
      editingTradeId ||
      generateId(),

    pair:

      pair.toUpperCase(),

    direction:
      $("#tradeDirection").value,

    date,

    session:
      $("#tradeSession").value,

    entry:
      number($("#tradeEntry").value),

    stop:
      number($("#tradeStop").value),

    takeProfit:
      number($("#tradeTakeProfit").value),

    lotSize:
      number($("#tradeLotSize").value),

    riskPercent:
      number($("#tradeRiskPercent").value),

    rMultiple:
      number($("#tradeRMultiple").value),

    profitLoss:
      number($("#tradeProfitLoss").value),

    result:
      $("#tradeResult").value,

    setup:
      $("#tradeSetup").value.trim(),

    notes:
      $("#tradeNotes").value.trim(),

    screenshot:
      currentScreenshot,

    strategy: {

      marketStructure:
        $("#tradeMarketStructure").checked,

      liquiditySweep:
        $("#tradeLiquiditySweep").checked,

      supplyDemand:
        $("#tradeSupplyDemand").checked,

      orderBlock:
        $("#tradeOrderBlock").checked,

      fvg:
        $("#tradeFVG").checked,

      vwap:
        $("#tradeVWAP").checked,

      volume:
        $("#tradeVolume").checked

    },

    updatedAt:
      new Date().toISOString()

  };

}


/* =====================================================
   SAVE TRADE
   ===================================================== */

function saveTradeFromForm(event) {

  event.preventDefault();


  const trade =
    getTradeFromForm();


  if (!trade) {
    return;
  }


  if (editingTradeId) {

    const index =
      trades.findIndex(
        item => item.id === editingTradeId
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

  renderAll();

  closeTradeModal();

}


/* =====================================================
   DELETE TRADE
   ===================================================== */

function deleteTrade(id) {

  const trade =
    trades.find(item => item.id === id);


  if (!trade) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete the ${trade.pair} trade? This cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  trades =
    trades.filter(
      item => item.id !== id
    );


  saveTrades();

  renderAll();

  showToast("Trade deleted.");

}


/* =====================================================
   EDIT TRADE
   ===================================================== */

function editTrade(id) {

  const trade =
    trades.find(
      item => item.id === id
    );


  if (!trade) {
    return;
  }


  openTradeModal(trade);

}


/* =====================================================
   IMAGE VIEWER
   ===================================================== */

function openImageViewer(src) {

  const viewer =
    $("#imageViewer");

  const image =
    $("#fullScreenshotImage");


  if (!viewer || !image || !src) {
    return;
  }


  image.src = src;

  viewer.classList.add("open");

  viewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow = "hidden";

}


function closeImageViewer() {

  const viewer =
    $("#imageViewer");

  if (!viewer) {
    return;
  }


  viewer.classList.remove("open");

  viewer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

}


/* =====================================================
   JOURNAL FILTER
   ===================================================== */

function getFilteredTrades() {

  const search =
    (
      $("#journalSearch")?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const resultFilter =
    $("#journalResultFilter")?.value ||
    "all";


  return trades.filter(trade => {

    const matchesResult =
      resultFilter === "all" ||
      trade.result === resultFilter;


    if (!matchesResult) {
      return false;
    }


    if (!search) {
      return true;
    }


    const searchable = [

      trade.pair,

      trade.session,

      trade.setup,

      trade.notes,

      trade.direction,

      trade.result

    ]
      .join(" ")
      .toLowerCase();


    return searchable.includes(search);

  });

}


/* =====================================================
   STRATEGY TAGS
   ===================================================== */

function getStrategyTags(trade) {

  const tags = [];


  if (trade.strategy?.marketStructure) {
    tags.push("Market Structure");
  }

  if (trade.strategy?.liquiditySweep) {
    tags.push("Liquidity Sweep");
  }

  if (trade.strategy?.supplyDemand) {
    tags.push("Supply / Demand");
  }

  if (trade.strategy?.orderBlock) {
    tags.push("Order Block");
  }

  if (trade.strategy?.fvg) {
    tags.push("FVG");
  }

  if (trade.strategy?.vwap) {
    tags.push("VWAP");
  }

  if (trade.strategy?.volume) {
    tags.push("Volume");
  }


  return tags;

}


/* =====================================================
   JOURNAL CARD
   ===================================================== */

function renderJournalCard(trade) {

  const resultClass =
    trade.result === "win"
      ? "positive"
      : trade.result === "loss"
        ? "negative"
        : "neutral";


  const resultLabel =
    trade.result === "win"
      ? "WIN"
      : trade.result === "loss"
        ? "LOSS"
        : "BREAKEVEN";


  const rValue =
    number(trade.rMultiple);


  const tags =
    getStrategyTags(trade);


  const tagsHTML =
    tags.length

      ? `
        <div class="strategy-tags">
          ${tags.map(tag => `
            <span class="strategy-tag">
              ${escapeHTML(tag)}
            </span>
          `).join("")}
        </div>
      `

      : "";


  const screenshotHTML =
    trade.screenshot

      ? `
        <div class="journal-screenshot">

          <img
            src="${trade.screenshot}"
            alt="Chart screenshot for ${escapeHTML(trade.pair)}"
            data-image="${trade.screenshot}"
            class="journal-image"
          >

          <div class="screenshot-label">

            <strong>Chart Screenshot</strong>

            <small>
              Tap image to enlarge
            </small>

          </div>

        </div>
      `

      : "";


  const notesHTML =
    trade.notes

      ? `
        <div class="trade-notes">
          ${escapeHTML(trade.notes)}
        </div>
      `

      : "";


  return `

    <article
      class="journal-card"
      data-trade-id="${escapeHTML(trade.id)}"
    >

      <div class="journal-card-main">

        <div class="journal-card-header">

          <div>

            <div class="journal-card-title">

              <h3>
                ${escapeHTML(trade.pair)}
              </h3>

              <span
                class="direction-badge ${
                  trade.direction === "SELL"
                    ? "sell"
                    : "buy"
                }"
              >
                ${escapeHTML(trade.direction)}
              </span>

            </div>

            <div class="journal-date">

              ${escapeHTML(
                formatDate(trade.date)
              )}

              ·

              ${escapeHTML(
                trade.session || "No session"
              )}
                          </div>

          </div>


          <div class="journal-data">

            <span>Result</span>

            <strong class="${resultClass}">
              ${resultLabel}
            </strong>

          </div>


          <div class="journal-data">

            <span>P/L</span>

            <strong class="${
              number(trade.profitLoss) > 0
                ? "positive"
                : number(trade.profitLoss) < 0
                  ? "negative"
                  : "neutral"
            }">

              ${escapeHTML(
                formatMoney(trade.profitLoss)
              )}

            </strong>

          </div>


          <div class="journal-data">

            <span>R Multiple</span>

            <strong class="${resultClass}">

              ${rValue > 0 ? "+" : ""}
              ${formatNumber(rValue, 2)}R

            </strong>

          </div>


          <div class="journal-data">

            <span>Entry</span>

            <strong>
              ${formatNumber(trade.entry, 5)}
            </strong>

          </div>


          <div class="journal-data">

            <span>Stop</span>

            <strong>
              ${formatNumber(trade.stop, 5)}
            </strong>

          </div>


          <div class="journal-data">

            <span>TP</span>

            <strong>
              ${formatNumber(trade.takeProfit, 5)}
            </strong>

          </div>

        </div>


        ${tagsHTML}

        ${screenshotHTML}

        ${notesHTML}

      </div>

    </article>

  `;

}


/* =====================================================
   RENDER JOURNAL
   ===================================================== */

function renderJournal() {

  const container =
    $("#journalList");


  if (!container) {
    return;
  }


  const filtered =
    getFilteredTrades();


  if (!filtered.length) {

    container.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          📓
        </div>

        <h4>
          ${
            trades.length
              ? "No matching trades"
              : "Your journal is empty"
          }
        </h4>

        <p>
          ${
            trades.length
              ? "Try changing your search or filters."
              : "Add a trade and start building your trading history."
          }
        </p>

        <button
          type="button"
          class="primary-btn"
          id="journalEmptyAddBtnDynamic"
        >
          + Add Trade
        </button>

      </div>

    `;


    $("#journalEmptyAddBtnDynamic")
      ?.addEventListener(
        "click",
        () => openTradeModal()
      );


    return;

  }


  container.innerHTML =
    filtered
      .map(renderJournalCard)
      .join("");


  $all(".edit-trade-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => editTrade(button.dataset.id)
      );

    });


  $all(".delete-trade-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => deleteTrade(button.dataset.id)
      );

    });


  $all(".journal-image")
    .forEach(image => {

      image.addEventListener(
        "click",
        () => openImageViewer(
          image.dataset.image
        )
      );

    });

}


/* =====================================================
   END OF PART 1
   ===================================================== */
/* =====================================================
   DASHBOARD STATISTICS
   ===================================================== */

function calculateStats() {

  const total = trades.length;

  const wins = trades.filter(
    trade => trade.result === "win"
  ).length;

  const losses = trades.filter(
    trade => trade.result === "loss"
  ).length;

  const breakeven = trades.filter(
    trade => trade.result === "breakeven"
  ).length;

  const winRate =
    total > 0
      ? (wins / total) * 100
      : 0;

  const totalProfit = trades.reduce(
    (sum, trade) =>
      sum + number(trade.profitLoss),
    0
  );

  const totalR = trades.reduce(
    (sum, trade) =>
      sum + number(trade.rMultiple),
    0
  );

  const averageR =
    total > 0
      ? totalR / total
      : 0;

  return {
    total,
    wins,
    losses,
    breakeven,
    winRate,
    totalProfit,
    totalR,
    averageR
  };

}


/* =====================================================
   UPDATE DASHBOARD
   ===================================================== */

function renderDashboard() {

  const stats =
    calculateStats();


  const elements = {

    totalTrades:
      $("#totalTrades"),

    winRate:
      $("#winRate"),

    totalProfit:
      $("#totalProfit"),

    averageR:
      $("#averageR"),

    recentTrades:
      $("#recentTrades")

  };


  if (elements.totalTrades) {

    elements.totalTrades.textContent =
      stats.total;

  }


  if (elements.winRate) {

    elements.winRate.textContent =
      `${formatNumber(stats.winRate, 1)}%`;

  }


  if (elements.totalProfit) {

    elements.totalProfit.textContent =
      formatMoney(stats.totalProfit);

  }


  if (elements.averageR) {

    elements.averageR.textContent =
      `${stats.averageR >= 0 ? "+" : ""}${formatNumber(stats.averageR, 2)}R`;

  }


  if (!elements.recentTrades) {
    return;
  }


  const recent =
    trades.slice(0, 5);


  if (!recent.length) {

    elements.recentTrades.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          📊
        </div>

        <h4>
          No trades yet
        </h4>

        <p>
          Your latest trades will appear here.
        </p>

      </div>

    `;

    return;

  }


  elements.recentTrades.innerHTML =
    recent.map(trade => {

      const resultClass =
        trade.result === "win"
          ? "win"
          : trade.result === "loss"
            ? "loss"
            : "breakeven";


      const resultText =
        trade.result === "win"
          ? "WIN"
          : trade.result === "loss"
            ? "LOSS"
            : "BE";


      return `

        <div class="trade-row">

          <div class="trade-main">

            <div class="trade-pair">

              ${escapeHTML(trade.pair)}

              ·

              ${escapeHTML(trade.direction)}

            </div>

            <div class="trade-meta">

              ${formatDate(trade.date)}

              ·

              ${escapeHTML(
                trade.session || "No session"
              )}

            </div>

          </div>


          <div
            class="trade-result ${resultClass}"
          >

            ${resultText}

            ·

            ${formatMoney(
              trade.profitLoss
            )}

          </div>

        </div>

      `;

    }).join("");

}


/* =====================================================
   ANALYTICS
   ===================================================== */

function renderAnalytics() {

  const stats =
    calculateStats();


  const total =
    stats.total;


  const setText = (
    id,
    value
  ) => {

    const element = $(`#${id}`);

    if (element) {
      element.textContent = value;
    }

  };


  setText(
    "analyticsTotalTrades",
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
    "analyticsBreakeven",
    stats.breakeven
  );


  setText(
    "analyticsWinRate",
    `${formatNumber(stats.winRate, 1)}%`
  );


  setText(
    "analyticsTotalR",
    `${stats.totalR >= 0 ? "+" : ""}${formatNumber(stats.totalR, 2)}R`
  );


  setText(
    "analyticsAverageR",
    `${stats.averageR >= 0 ? "+" : ""}${formatNumber(stats.averageR, 2)}R`
  );


  setText(
    "analyticsProfit",
    formatMoney(stats.totalProfit)
  );


  const winBar =
    $("#winDistribution");


  const lossBar =
    $("#lossDistribution");


  const breakevenBar =
    $("#breakevenDistribution");


  if (winBar) {

    winBar.style.width =
      total
        ? `${(stats.wins / total) * 100}%`
        : "0%";

  }


  if (lossBar) {

    lossBar.style.width =
      total
        ? `${(stats.losses / total) * 100}%`
        : "0%";

  }


  if (breakevenBar) {

    breakevenBar.style.width =
      total
        ? `${(stats.breakeven / total) * 100}%`
        : "0%";

  }

}


/* =====================================================
   RISK CALCULATOR
   ===================================================== */

function calculateRisk() {

  const balance =
    number(
      $("#calcBalance")?.value,
      settings.balance
    );


  const riskPercent =
    number(
      $("#calcRiskPercent")?.value,
      settings.risk
    );


  const stopPips =
    number(
      $("#calcStopPips")?.value
    );


  const pipValue =
    number(
      $("#calcPipValue")?.value
    );


  const riskAmount =
    balance *
    (riskPercent / 100);


  const riskPerPip =
    stopPips > 0
      ? riskAmount / stopPips
      : 0;


  const suggestedLot =
    pipValue > 0
      ? riskPerPip / pipValue
      : 0;


  const setValue = (
    id,
    value
  ) => {

    const element = $(`#${id}`);

    if (element) {
      element.textContent = value;
    }

  };


  setValue(
    "calcRiskAmount",
    formatMoney(riskAmount)
  );


  setValue(
    "calcRiskPerPip",
    formatNumber(riskPerPip, 2)
  );


  setValue(
    "calcSuggestedLot",
    formatNumber(suggestedLot, 2)
  );


  setValue(
    "calcBalanceDisplay",
    formatMoney(balance)
  );

}


/* =====================================================
   CHECKLIST STORAGE
   ===================================================== */

function loadChecklist() {

  try {

    const saved =
      localStorage.getItem(
        CHECKLIST_KEY
      );


    if (!saved) {
      return [];
    }


    const parsed =
      JSON.parse(saved);


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {

    return [];

  }

}


function saveChecklist(values) {

  localStorage.setItem(
    CHECKLIST_KEY,
    JSON.stringify(values)
  );

}


/* =====================================================
   RENDER CHECKLIST
   ===================================================== */

function renderChecklist() {

  const container =
    $("#checklistItems");


  if (!container) {
    return;
  }


  const checked =
    loadChecklist();


  container.innerHTML =
    checklistItems.map(
      (item, index) => `

        <label class="check-item">

          <input
            type="checkbox"
            class="checklist-checkbox"
            data-index="${index}"
            ${checked.includes(index)
              ? "checked"
              : ""}
          >

          <span>
            ${escapeHTML(item)}
          </span>

        </label>

      `
    ).join("");


  updateChecklistProgress();


  $all(".checklist-checkbox")
    .forEach(checkbox => {

      checkbox.addEventListener(
        "change",
        () => {

          const values =
            $all(".checklist-checkbox")
              .filter(
                item => item.checked
              )
              .map(
                item =>
                  Number(item.dataset.index)
              );


          saveChecklist(values);

          updateChecklistProgress();

        }
      );

    });

}


/* =====================================================
   CHECKLIST PROGRESS
   ===================================================== */

function updateChecklistProgress() {

  const boxes =
    $all(".checklist-checkbox");


  const completed =
    boxes.filter(
      box => box.checked
    ).length;


  const total =
    checklistItems.length;


  const percent =
    total > 0
      ? (completed / total) * 100
      : 0;


  const progress =
    $("#checklistProgress");


  const count =
    $("#checklistCount");


  const status =
    $("#checklistStatus");


  if (progress) {

    progress.style.width =
      `${percent}%`;

  }


  if (count) {

    count.textContent =
      `${completed} / ${total}`;

  }


  if (status) {

    if (completed === total) {

      status.textContent =
        "✓ Checklist complete — you are ready to trade.";

    }

    else if (completed >= total * 0.7) {

      status.textContent =
        "Good preparation. Complete the remaining checks before entering.";

    }

    else {

      status.textContent =
        "Complete your pre-trade checklist before entering.";

    }

  }

}


/* =====================================================
   SETTINGS
   ===================================================== */

function loadSettingsIntoForm() {

  const balance =
    $("#settingsBalance");

  const currency =
    $("#settingsCurrency");

  const risk =
    $("#settingsRisk");

  const maxTrades =
    $("#settingsMaxTrades");

  const dailyLoss =
    $("#settingsDailyLoss");

  const minRR =
    $("#settingsMinRR");


  if (balance) {
    balance.value = settings.balance;
  }

  if (currency) {
    currency.value = settings.currency;
  }

  if (risk) {
    risk.value = settings.risk;
  }

  if (maxTrades) {
    maxTrades.value = settings.maxTrades;
  }

  if (dailyLoss) {
    dailyLoss.value = settings.dailyLoss;
  }

  if (minRR) {
    minRR.value = settings.minRR;
  }

}


/* =====================================================
   SAVE SETTINGS
   ===================================================== */

function saveSettingsFromForm(event) {

  event?.preventDefault();


  settings = {

    balance:
      number(
        $("#settingsBalance")?.value,
        1000
      ),

    currency:
      $("#settingsCurrency")?.value ||
      "USD",

    risk:
      number(
        $("#settingsRisk")?.value,
        1
      ),

    maxTrades:
      number(
        $("#settingsMaxTrades")?.value,
        3
      ),

    dailyLoss:
      number(
        $("#settingsDailyLoss")?.value,
        3
      ),

    minRR:
      number(
        $("#settingsMinRR")?.value,
        2
      )

  };


  saveSettingsToStorage();

  renderAll();

  showToast(
    "Settings saved."
  );

}


/* =====================================================
   EXPORT DATA
   ===================================================== */

function exportData() {

  const data = {

    version: 2,

    exportedAt:
      new Date().toISOString(),

    settings,

    trades

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
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
    `tradingedge-backup-${today()}.json`;


  document.body.appendChild(link);

  link.click();

  link.remove();


  URL.revokeObjectURL(url);


  showToast(
    "Backup exported."
  );

}


/* =====================================================
   IMPORT DATA
   ===================================================== */

function importData(file) {

  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload = event => {

    try {

      const data =
        JSON.parse(
          event.target.result
        );


      if (
        !data ||
        !Array.isArray(data.trades)
      ) {

        throw new Error(
          "Invalid backup file."
        );

      }


      trades =
        data.trades;


      if (data.settings) {

        settings = {
          ...defaultSettings,
          ...data.settings
        };

        saveSettingsToStorage();

      }


      saveTrades();

      renderAll();

      loadSettingsIntoForm();


      showToast(
        "Backup imported successfully."
      );


    } catch (error) {

      console.error(error);

      showToast(
        "Invalid TradingEdge backup file.",
        "error"
      );

    }

  };


  reader.onerror = () => {

    showToast(
      "Could not read the backup file.",
      "error"
    );

  };


  reader.readAsText(file);

}


/* =====================================================
   CLEAR ALL DATA
   ===================================================== */

function clearAllData() {

  const confirmed =
    window.confirm(
      "Delete ALL TradingEdge trades and saved data? This cannot be undone."
    );


  if (!confirmed) {
    return;
  }


  trades = [];

  localStorage.removeItem(
    STORAGE_KEY
  );

  localStorage.removeItem(
    CHECKLIST_KEY
  );


  renderAll();

  renderChecklist();


  showToast(
    "All trading data deleted."
  );

}


/* =====================================================
   FORM EVENT SETUP
   ===================================================== */

function setupForms() {

  const tradeForm =
    $("#tradeForm");


  tradeForm?.addEventListener(
    "submit",
    saveTradeFromForm
  );


  const settingsForm =
    $("#settingsForm");


  settingsForm?.addEventListener(
    "submit",
    saveSettingsFromForm
  );


  const cancelTrade =
    $("#cancelTradeBtn");


  cancelTrade?.addEventListener(
    "click",
    closeTradeModal
  );


  const closeModal =
    $("#closeTradeModalBtn");


  closeModal?.addEventListener(
    "click",
    closeTradeModal
  );


  const modalOverlay =
    $("#tradeModalOverlay");


  modalOverlay?.addEventListener(
    "click",
    closeTradeModal
  );


  const openTradeButtons =
    $all(
      "#addTradeBtn, #addTradeBtn2, #addTradeBtn3"
    );


  openTradeButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => openTradeModal()
    );

  });


  const search =
    $("#journalSearch");


  search?.addEventListener(
    "input",
    renderJournal
  );


  const filter =
    $("#journalResultFilter");


  filter?.addEventListener(
    "change",
    renderJournal
  );

}


/* =====================================================
   CALCULATOR EVENT SETUP
   ===================================================== */

function setupCalculator() {

  const fields = [

    "#calcBalance",
    "#calcRiskPercent",
    "#calcStopPips",
    "#calcPipValue"

  ];


  fields.forEach(selector => {

    $(selector)?.addEventListener(
      "input",
      calculateRisk
    );

  });


  calculateRisk();

}


/* =====================================================
   DATA BUTTONS
   ===================================================== */

function setupDataButtons() {

  $("#exportDataBtn")
    ?.addEventListener(
      "click",
      exportData
    );


  const importButton =
    $("#importDataBtn");


  const importInput =
    $("#importDataInput");


  importButton?.addEventListener(
    "click",
    () => importInput?.click()
  );


  importInput?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];


      if (file) {
        importData(file);
      }


      event.target.value = "";

    }
  );


  $("#clearDataBtn")
    ?.addEventListener(
      "click",
      clearAllData
    );

}


/* =====================================================
   MODAL / IMAGE EVENTS
   ===================================================== */

function setupViewer() {

  $("#closeImageViewerBtn")
    ?.addEventListener(
      "click",
      closeImageViewer
    );


  $("#imageViewerOverlay")
    ?.addEventListener(
      "click",
      closeImageViewer
    );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeTradeModal();

        closeImageViewer();

      }

    }
  );

}


/* =====================================================
   RENDER ALL
   ===================================================== */

function renderAll() {

  renderDashboard();

  renderJournal();

  renderAnalytics();

  calculateRisk();

}


/* =====================================================
   INITIALIZATION
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupNavigation();

    setupMobileMenu();

    setupForms();

    setupScreenshotUpload();

    setupCalculator();

    setupDataButtons();

    setupViewer();

    renderChecklist();

    loadSettingsIntoForm();

    renderAll();

  }
);
  calculateRisk();

}


/* =====================================================
   INITIALIZATION
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupNavigation();

    setupMobileMenu();

    setupForms();

    setupScreenshotUpload();

    setupCalculator();

    setupDataButtons();

    setupViewer();

    renderChecklist();

    loadSettingsIntoForm();

    renderAll();

  }
);
