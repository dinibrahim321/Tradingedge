document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const checkboxes = document.querySelectorAll('.chk-input');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  const journalForm = document.getElementById('journal-form');
  const fileInput = document.getElementById('trade-screenshot-file');
  const urlInput = document.getElementById('trade-screenshot-url');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const cardsContainer = document.getElementById('trade-cards-container');
  const clearLogsBtn = document.getElementById('clear-logs-btn');

  let currentImageData = '';

  // 1. CHECKLIST LOGIC & LOCAL STORAGE
  function updateChecklist() {
    const total = checkboxes.length;
    let checkedCount = 0;
    const savedState = {};

    checkboxes.forEach(chk => {
      const id = chk.getAttribute('data-id');
      if (chk.checked) {
        checkedCount++;
        savedState[id] = true;
      } else {
        savedState[id] = false;
      }
    });

    // Save to browser
    localStorage.setItem('edgeflo_checklist', JSON.stringify(savedState));

    // Update UI Progress
    const percent = (checkedCount / total) * 100;
    progressText.textContent = `${checkedCount}/${total} Completed`;
    progressFill.style.width = `${percent}%`;

    // System Readiness Trigger
    if (checkedCount === total) {
      statusDot.classList.add('ready');
      statusText.textContent = 'Ready to Trade';
      statusText.style.color = '#00e676';
    } else {
      statusDot.classList.remove('ready');
      statusText.textContent = 'System Locked';
      statusText.style.color = '#ff5252';
    }
  }

  function loadChecklistState() {
    const savedState = JSON.parse(localStorage.getItem('edgeflo_checklist')) || {};
    checkboxes.forEach(chk => {
      const id = chk.getAttribute('data-id');
      if (savedState[id]) chk.checked = true;
    });
    updateChecklist();
  }

  checkboxes.forEach(chk => chk.addEventListener('change', updateChecklist));

  // 2. SCREENSHOT PREVIEW HANDLING
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentImageData = event.target.result;
        imagePreview.src = currentImageData;
        imagePreviewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  urlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      currentImageData = url;
      imagePreview.src = url;
      imagePreviewContainer.classList.remove('hidden');
    } else if (!fileInput.files.length) {
      imagePreviewContainer.classList.add('hidden');
      currentImageData = '';
    }
  });

  // 3. TRADE JOURNAL STORAGE & RENDERING
  function loadTrades() {
    const trades = JSON.parse(localStorage.getItem('edgeflo_trades')) || [];
    cardsContainer.innerHTML = '';

    if (trades.length === 0) {
      cardsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No trades logged yet today. Complete your checklist and log your first entry above.</p>`;
      return;
    }

    trades.forEach((trade, index) => {
      const card = document.createElement('div');
      card.className = 'trade-card';
      card.innerHTML = `
        <div class="trade-card-header">
          <strong>${trade.asset}</strong>
          <span class="trade-tag ${trade.type === 'LONG' ? 'tag-long' : 'tag-short'}">${trade.type}</span>
        </div>
        <div class="trade-card-body">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
            <span style="color: var(--text-muted);">${trade.date}</span>
            <strong style="color: var(--accent-cyan);">${trade.result}</strong>
          </div>
          <p class="trade-notes-text">${trade.notes}</p>
          ${trade.image ? `<img src="${trade.image}" class="trade-img" alt="Chart Screenshot" />` : ''}
        </div>
      `;
      cardsContainer.appendChild(card);
    });
  }

  journalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTrade = {
      asset: document.getElementById('trade-asset').value.toUpperCase(),
      type: document.getElementById('trade-type').value,
      result: document.getElementById('trade-result').value,
      notes: document.getElementById('trade-notes').value,
      image: currentImageData,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    const trades = JSON.parse(localStorage.getItem('edgeflo_trades')) || [];
    trades.unshift(newTrade); // Put newest on top
    localStorage.setItem('edgeflo_trades', JSON.stringify(trades));

    // Reset Form
    journalForm.reset();
    currentImageData = '';
    imagePreviewContainer.classList.add('hidden');
    
    loadTrades();
  });

  clearLogsBtn.addEventListener('click', () => {
    if (confirm('Clear all logged trades from browser memory?')) {
      localStorage.removeItem('edgeflo_trades');
      loadTrades();
    }
  });

  // Initialize Page Data
  loadChecklistState();
  loadTrades();
});
