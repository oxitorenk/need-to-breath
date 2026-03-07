let _state = {
    bank: 0,
    startTime: Date.now(), // When the current interval started
    intervalMinutes: 60,
    version: 1
};

const ui = {
    countdown: document.getElementById('countdown'),
    bankCount: document.getElementById('bank-count'),
    smokeBtn: document.getElementById('smoke-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsBtn: document.getElementById('close-settings'),
    intervalInput: document.getElementById('interval-input'),
    resetBtn: document.getElementById('reset-btn')
};

function loadState() {
    const saved = localStorage.getItem('ntb_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            _state = { ..._state, ...parsed };
        } catch (e) {
            console.error('Failed to load state', e);
        }
    } else {
        saveState();
    }
}

function saveState() {
    localStorage.setItem('ntb_state', JSON.stringify(_state));
}



function updateState() {
    const now = Date.now();
    const intervalMs = _state.intervalMinutes * 60 * 1000;

    // Check how much time passed since start
    const elapsed = now - _state.startTime;

    if (elapsed >= intervalMs) {
        const accrued = Math.floor(elapsed / intervalMs);

        _state.bank += accrued;

        // Reset start time to the beginning of the current interval
        // This preserves the remainder, so seconds aren't lost
        _state.startTime += (accrued * intervalMs);

        saveState();
        updateUI();
    }

    // Calculate remaining time for display
    const remainingMs = intervalMs - (elapsed % intervalMs);
    updateTimerDisplay(remainingMs);
}


function smoke() {
    if (_state.bank > 0) {
        _state.bank--;
        saveState();
        updateUI();


        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        // Shake animation or visual feedback for disabled state is handled by CSS (dimmed)
        // could add a shake class here if desired
    }
}

function updateInterval(newMinutes) {
    const oldMinutes = _state.intervalMinutes;
    _state.intervalMinutes = parseInt(newMinutes) || 60;
    saveState();
    updateState(); // Re-run logic immediately
}

function resetAll() {
    if (confirm("Are you sure? This will delete all progress.")) {
        _state.bank = 0;
        _state.startTime = Date.now();
        _state.intervalMinutes = 60;
        saveState();
        updateUI();
        closeSettings();
    }
}

function updateTimerDisplay(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    ui.countdown.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateUI() {
    ui.bankCount.textContent = _state.bank;
    ui.intervalInput.value = _state.intervalMinutes;

    if (_state.bank > 0) {
        ui.smokeBtn.classList.remove('disabled');
    } else {
        ui.smokeBtn.classList.add('disabled');
    }
}

function openSettings() {
    ui.intervalInput.value = _state.intervalMinutes;

    // Animation Logic
    ui.settingsModal.classList.remove('hidden');

    // Force reflow
    void ui.settingsModal.offsetWidth;
    ui.settingsModal.classList.add('active');
}

function closeSettings() {
    // Save on close
    const newInterval = parseInt(ui.intervalInput.value);
    if (newInterval && newInterval > 0) {
        updateInterval(newInterval);
    }

    // Animation Logic
    ui.settingsModal.classList.remove('active');

    // Wait for transition to finish before hiding
    setTimeout(() => {
        ui.settingsModal.classList.add('hidden');
    }, 300);
}

function init() {
    loadState();
    updateUI();

    // Event Listeners
    ui.smokeBtn.addEventListener('click', smoke);
    ui.settingsBtn.addEventListener('click', openSettings);
    ui.closeSettingsBtn.addEventListener('click', closeSettings);
    ui.resetBtn.addEventListener('click', resetAll);

    // Close on backdrop click
    ui.settingsModal.addEventListener('click', (e) => {
        if (e.target === ui.settingsModal) {
            closeSettings();
        }
    });

    // Main Loop
    setInterval(updateState, 1000);

    // Initial run
    updateState();
}

init();
