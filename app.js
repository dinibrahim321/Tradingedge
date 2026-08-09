document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. PRE-MARKET PLAN NOTES ---
  const planBias = document.getElementById('plan-bias');
  const planLevels = document.getElementById('plan-levels');
  const savePlanBtn = document.getElementById('save-plan-btn');

  function loadPlan() {
    const saved = JSON.parse(localStorage.getItem('edgeflo_forex_plan')) || { bias: '', levels: '' };
    planBias.value = saved.bias;
    planLevels.value = saved.levels;
  }

  savePlanBtn.addEventListener('click', () => {
    localStorage.setItem('edgeflo_forex_plan', JSON.stringify({ bias: planBias.value, levels: planLevels.value }));
    alert('Pre-Market Plan Saved!');
  });

  loadPlan();

  // --- 2. EXECUTION CHECKLIST ---
  const defaultRules = [
    { text: 'Check ForexFactory for Red Folder News Events', completed: false },
    { text: 'Determine DXY Trend & HTF Direction', completed: false },
    { text: 'Identify Asian Range High & Low Liquidity Pools', completed: false },
    { text: 'Risk strictly capped at 1% per trade', completed: false }
  ];

  let rules = JSON.parse(localStorage.getItem('edgeflo_forex_rules')) || defaultRules;

  const checklistContainer = document.getElementById('checklist-container');
  const addRuleForm = document.getElementById('add-rule-form');
  const newRuleInput = document.getElementById('new-rule-input');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  function saveAndRenderRules() {
    localStorage.setItem('edgeflo_forex_rules', JSON.stringify(rules));
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

    const total = rules.length;
    const percent = total > 0 ? (completedCount / total) * 100 : 0;
    progressText.textContent = `${completedCount}/${total} Completed`;
    progressFill.style.width = `${percent}%`;

    if (total > 0 && completedCount === total) {
      statusDot.classList.add('ready');
      statusText.textContent = 'Ready to Trade';
      statusText.style.color = '#00e676';
    } else {
      statusDot.classList.remove('ready');
      statusText.textContent = 'Rules Incomplete';
      statusText.style.color = '#ff5252';
    }

    attachChecklistEvents();
  }

  function attachChecklistEvents() {
    document.querySelectorAll('.chk-input').forEach(chk => {
      chk.addEventListener('change', (e) => {
        rules[e.target.dataset.index].completed = e.target.checked;
        saveAndRenderRules();
      });
    });

    document.querySelectorAll('.rule-text-input').forEach(input => {
      input.addEventListener('change', (e) => {
        rules[e.target.dataset.index].text = e.target.value;
        saveAndRenderRules();
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        rules.splice(e.target.dataset.index, 1);
        saveAndRenderRules();
      });
    });
  }

  addRuleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (newRuleInput.value.trim()) {
      rules.push({ text: newRuleInput.value.trim(), completed: false });
      newRuleInput.value = '';
      saveAndRenderRules();
    }
  });

  renderChecklist();

  // --- 3. TRADE JOURNAL WITH BEFORE & AFTER SCREENSHOTS ---
  const journalForm = document.getElementById('journal-form');
  const historyContainer = document.getElementById('history-container');
  const clearLogsBtn = document.getElementById('clear-logs-btn');

  let beforeImgData = '';
  let afterImgData = '';

  // Before Screenshot Handlers
  document.getElementById('img-before-file').addEventListener('change', (e) => handleImageUpload(e.target.files[0], 'before'));
  document.getElementById('img-before-url').addEventListener('input', (e) => handleImageUrl(e.target.value, 'before'));

  // After Screenshot Handlers
  document.getElementById('img-after-file').addEventListener('change', (e) => handleImageUpload(e.target.files[0], 'after'));
  document.getElementById('img-after-url').addEventListener('input', (e) => handleImageUrl(e.target.value, 'after'));

  function handleImageUpload(file, target) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (target === 'before') {
          beforeImgData = e.target.result;
          document.getElementById('preview-before').src = beforeImgData;
          document.getElementById('preview-before-wrap').classList.remove('hidden');
        } else {
          afterImgData = e.target.result;
          document.getElementById('preview-after').src = afterImgData;
          document.getElementById('preview-after-wrap').classList.remove('hidden');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleImageUrl(url, target) {
    if (url.trim()) {
      if (target === 'before') {
        beforeImgData = url.trim();
        document.getElementById('preview-before').src = beforeImgData;
        document.getElementById('preview-before-wrap').classList.remove('hidden');
      } else {
        afterImgData = url.trim();
        document.getElementById('preview-after').src = afterImgData;
        document.getElementById('preview-after-wrap').classList.remove('hidden');
      }
    }
  }

  function loadHistory() {
    const trades = JSON.parse(localStorage.getItem('edgeflo_forex_trades')) || [];
    historyContainer.innerHTML = '';

    if (trades.length === 0) {
      historyContainer.innerHTML = `<p style="color: var(--text-muted);">No trade journals recorded yet.</p>`;
      return;
    }

    trades.forEach((trade, idx) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="card-header-bar">
          <div>
            <span class="card-title">${trade.pair}</span>
            <span class="dir-tag ${trade.direction === 'LONG' ? 'tag-long' : 'tag-short'}">${trade.direction}</span>
          </div>
          <div>
            <strong style="color: var(--accent-cyan); font-size: 1.1rem; margin-right: 12px;">${trade.result}</strong>
            <span style="color: var(--text-muted); font-size: 0.85rem;">[Grade: ${trade.grade}]</span>
          </div>
        </div>

        <div class="card-images-dual">
          ${trade.beforeImg ? `<div class="comparison-thumb"><span>📷 BEFORE ENTRY</span><img src="${trade.beforeImg}" /></div>` : ''}
          ${trade.afterImg ? `<div class="comparison-thumb"><span>📸 AFTER EXIT</span><img src="${trade.afterImg}" /></div>` : ''}
        </div>

        <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">${trade.notes}</p>
        <div style="font-size: 0.75rem; color: var(--text-muted); text-align: right;">${trade.date}</div>
      `;
      historyContainer.appendChild(card);
    });
  }

  journalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const tradeEntry = {
      pair: document.getElementById('trade-pair').value.toUpperCase(),
      direction: document.getElementById('trade-dir').value,
      result: document.getElementById('trade-result').value,
      grade: document.getElementById('trade-grade').value,
      beforeImg: beforeImgData,
      afterImg: afterImgData,
      notes: document.getElementById('trade-notes').value,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    const trades = JSON.parse(localStorage.getItem('edgeflo_forex_trades')) || [];
    trades.unshift(tradeEntry);
    localStorage.setItem('edgeflo_forex_trades', JSON.stringify(trades));

    journalForm.reset();
    beforeImgData = '';
    afterImgData = '';
    document.getElementById('preview-before-wrap').classList.add('hidden');
    document.getElementById('preview-after-wrap').classList.add('hidden');

    loadHistory();
  });

  clearLogsBtn.addEventListener('click', () => {
    if (confirm('Clear all trade history logs?')) {
      localStorage.removeItem('edgeflo_forex_trades');
      loadHistory();
    }
  });

  loadHistory();
});
