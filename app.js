document.addEventListener('DOMContentLoaded', () => {
  // --- 1. TRADINGVIEW LIVE CHART INITIALIZATION ---
  if (typeof TradingView !== 'undefined') {
    new TradingView.widget({
      "autosize": true,
      "symbol": "BINANCE:BTCUSDT",
      "interval": "15",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#0a0d14",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_chart"
    });
  }

  // --- 2. PRE-MARKET PLAN (EDITABLE NOTES) ---
  const planBias = document.getElementById('plan-bias');
  const planLevels = document.getElementById('plan-levels');
  const savePlanBtn = document.getElementById('save-plan-btn');

  function loadPlan() {
    const savedPlan = JSON.parse(localStorage.getItem('edgeflo_plan')) || { bias: '', levels: '' };
    planBias.value = savedPlan.bias;
    planLevels.value = savedPlan.levels;
  }

  function savePlan() {
    const planData = {
      bias: planBias.value,
      levels: planLevels.value
    };
    localStorage.setItem('edgeflo_plan', JSON.stringify(planData));
    alert('Pre-Market Plan Saved!');
  }

  savePlanBtn.addEventListener('click', savePlan);
  loadPlan();

  // --- 3. DYNAMIC & EDITABLE CHECKLIST ---
  const defaultRules = [
    { id: '1', text: 'Economic Calendar & High-Impact News Checked', completed: false },
    { id: '2', text: 'Higher Timeframe Bias & Market Structure Identified', completed: false },
    { id: '3', text: 'Max Daily Risk Parameter Set (1-2% hard cap)', completed: false }
  ];

  let rules = JSON.parse(localStorage.getItem('edgeflo_rules')) || defaultRules;

  const checklistContainer = document.getElementById('checklist-container');
  const addRuleForm = document.getElementById('add-rule-form');
  const newRuleInput = document.getElementById('new-rule-input');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  function saveAndRenderRules() {
    localStorage.setItem('edgeflo_rules', JSON.stringify(rules));
    renderChecklist();
  }

  function renderChecklist() {
    checklistContainer.innerHTML = '';
    let completedCount = 0;

    rules.forEach((rule, index) => {
      if (rule.completed) completedCount++;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'check-item';
      itemDiv.innerHTML = `
        <div class="check-left">
          <input type="checkbox" class="chk-input" ${rule.completed ? 'checked' : ''} data-index="${index}">
          <input type="text" class="rule-text-input" value="${rule.text}" data-index="${index}">
        </div>
        <button class="delete-btn" data-index="${index}">✕</button>
      `;
      checklistContainer.appendChild(itemDiv);
    });

    // Update Progress UI
    const total = rules.length;
    const percent = total > 0 ? (completedCount / total) * 100 : 0;
    progressText.textContent = `${completedCount}/${total} Completed`;
    progressFill.style.width = `${percent}%`;

    // System Status Trigger
    if (total > 0 && completedCount === total) {
      statusDot.classList.add('ready');
      statusText.textContent = 'System Ready';
      statusText.style.color = '#00e676';
    } else {
      statusDot.classList.remove('ready');
      statusText.textContent = 'Rules Incomplete';
      statusText.style.color = '#ff5252';
    }

    attachEventListeners();
  }

  function attachEventListeners() {
    // Checkbox toggles
    document.querySelectorAll('.chk-input').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = e.target.getAttribute('data-index');
        rules[idx].completed = e.target.checked;
        saveAndRenderRules();
      });
    });

    // Edit rule text in place
    document.querySelectorAll('.rule-text-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.getAttribute('data-index');
        rules[idx].text = e.target.value;
        saveAndRenderRules();
      });
    });

    // Delete rule
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        rules.splice(idx, 1);
        saveAndRenderRules();
      });
    });
  }

  // Add new custom rule
  addRuleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = newRuleInput.value.trim();
    if (text) {
      rules.push({ id: Date.now().toString(), text: text, completed: false });
      newRuleInput.value = '';
      saveAndRenderRules();
    }
  });

  renderChecklist();
});
