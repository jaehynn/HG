// State Management
const state = {
  currentScreen: 'home', // 'home' | 'play'
  selectedMode: '5x5',   // '5x5' | '4x4' | 'roulette'
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  currentPlayer: 1,      // 1 | 2
  heartIndex: -1,
  totalCards: 25,
  isGameOver: false,
  isProcessing: false,
  rouletteItems: ['Player 1', 'Player 2'],
  rouletteAngle: 0,
  isSpinning: false,
  wiggleTimerId: null,
  soundEnabled: true
};

// DOM Elements
const screenHome = document.getElementById('screen-home');
const screenPlay = document.getElementById('screen-play');
const appContainer = document.querySelector('.app-container');
const btnBackHome = document.getElementById('btn-back-home');
const btnReset = document.getElementById('btn-reset');
const cardView = document.getElementById('card-view');
const rouletteView = document.getElementById('roulette-view');
const cardGrid = document.getElementById('card-grid');

// Sound Toggle Elements
const btnSoundToggle = document.getElementById('btn-sound-toggle');
const iconSoundOn = document.getElementById('icon-sound-on');
const iconSoundOff = document.getElementById('icon-sound-off');

// Game Selection Elements
const btnSelectHeartGame = document.getElementById('btn-select-heart-game');
const btnSelectRouletteGame = document.getElementById('btn-select-roulette-game');

// Heart Game Option Modal Elements
const heartOptionModal = document.getElementById('heart-option-modal');
const btnOpt5x5 = document.getElementById('btn-opt-5x5');
const btnOpt4x4 = document.getElementById('btn-opt-4x4');
const btnCancelHeartOption = document.getElementById('btn-cancel-heart-option');

// Reset Confirm Modal Elements
const resetConfirmModal = document.getElementById('reset-confirm-modal');
const btnConfirmResetYes = document.getElementById('btn-confirm-reset-yes');
const btnConfirmResetNo = document.getElementById('btn-confirm-reset-no');

// Player Setup Elements
const btnOpenPlayerModal = document.getElementById('btn-open-player-modal');
const playerModal = document.getElementById('player-modal');
const inputP1Name = document.getElementById('input-p1-name');
const inputP2Name = document.getElementById('input-p2-name');
const btnSavePlayers = document.getElementById('btn-save-players');
const btnCancelPlayers = document.getElementById('btn-cancel-players');
const previewP1 = document.getElementById('preview-p1');
const previewP2 = document.getElementById('preview-p2');

// Turn Indicator Elements (Independent Section above Card UI)
const turnSection = document.getElementById('turn-section');
const turnCardBanner = document.getElementById('turn-card-banner');
const turnChip = document.getElementById('turn-chip');
const turnMainName = document.getElementById('turn-main-name');
const gameTopTitle = document.getElementById('game-top-title');

// Result Modal Elements
const resultModal = document.getElementById('result-modal');
const modalWinnerTitle = document.getElementById('modal-winner-title');
const modalWinnerDesc = document.getElementById('modal-winner-desc');
const btnModalRetry = document.getElementById('btn-modal-retry');
const btnModalHome = document.getElementById('btn-modal-home');

// Roulette Elements
const rouletteCanvas = document.getElementById('roulette-canvas');
const rouletteInput = document.getElementById('roulette-items-input');
const btnSpinRoulette = document.getElementById('btn-spin-roulette');

// Heart SVG Template
const HEART_SVG = `
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
`;

// ==========================================
// iOS Silent-Mode Bypass HTML5 Audio Synthesizer
// Generates PCM WAV Data-URIs so HTML5 Audio plays via iOS Playback category
// ==========================================
function createWavDataUri(sampleRate, duration, sampleFn) {
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);  // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, sampleFn(t, duration)));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// 1. Crisp Card Click Sound (Snappy 320Hz -> 80Hz pop, 0.06s)
const CLICK_WAV_URI = createWavDataUri(22050, 0.06, (t, dur) => {
  const env = Math.pow(1 - t / dur, 3);
  const freq = 320 - (240 * (t / dur));
  return Math.sin(2 * Math.PI * freq * t) * env * 0.9;
});

// 2. Win Celebratory Fanfare Sound (0.45s chord chime)
const WIN_WAV_URI = createWavDataUri(22050, 0.45, (t, dur) => {
  const env = Math.pow(1 - t / dur, 1.8);
  const s1 = Math.sin(2 * Math.PI * 523.25 * t); // C5
  const s2 = Math.sin(2 * Math.PI * 659.25 * t); // E5
  const s3 = Math.sin(2 * Math.PI * 783.99 * t); // G5
  const s4 = Math.sin(2 * Math.PI * 1046.50 * t); // C6
  return (s1 + s2 + s3 + s4) * 0.25 * env;
});

// Preload HTML5 Audio objects
const audioClick = new Audio(CLICK_WAV_URI);
const audioWin = new Audio(WIN_WAV_URI);
audioClick.preload = 'auto';
audioWin.preload = 'auto';

// Unlock iOS Audio Pipeline on user action
function unlockiOSAudio() {
  audioClick.play().then(() => {
    audioClick.pause();
    audioClick.currentTime = 0;
  }).catch(() => {});
}

// Play HTML5 Tactile Audio (Bypasses iOS hardware silent switch if media volume > 0)
function playTactileSound(type = 'light') {
  if (!state.soundEnabled) return;

  try {
    if (type === 'light') {
      const clickClone = audioClick.cloneNode();
      clickClone.volume = 0.8;
      clickClone.play().catch(() => {});
    } else if (type === 'strong-win') {
      const winClone = audioWin.cloneNode();
      winClone.volume = 0.9;
      winClone.play().catch(() => {});
    }
  } catch (e) {}
}

// Master Haptic & Sound Trigger
function triggerHaptic(type = 'light') {
  // 1. Android standard vibration
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(20);
      } else if (type === 'strong-win') {
        navigator.vibrate([160, 60, 220, 60, 320]);
      }
    } catch (e) {}
  }

  // 2. Play HTML5 Audio (Silent Switch Bypass)
  playTactileSound(type);
}

// Trigger Visual Haptic Bounce on Card Grid
function triggerVisualHaptic() {
  if (!cardGrid) return;
  cardGrid.classList.remove('impact-bounce');
  void cardGrid.offsetWidth;
  cardGrid.classList.add('impact-bounce');
}

// Trigger Big Win Visual Haptic on Screen
function triggerWinVisualHaptic() {
  if (!appContainer) return;
  appContainer.classList.remove('win-shake');
  void appContainer.offsetWidth;
  appContainer.classList.add('win-shake');
}

// Sound Toggle Update UI
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  if (state.soundEnabled) {
    iconSoundOn.style.display = 'block';
    iconSoundOff.style.display = 'none';
    unlockiOSAudio();
    playTactileSound('light');
  } else {
    iconSoundOn.style.display = 'none';
    iconSoundOff.style.display = 'block';
  }
}

// Initialize App
function init() {
  // Unlock iOS Media audio on first user touch
  document.addEventListener('touchstart', unlockiOSAudio, { once: true, passive: true });
  document.addEventListener('click', unlockiOSAudio, { once: true, passive: true });

  // Sound Toggle Button
  btnSoundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSound();
  });

  // 1. Home Game Selection
  btnSelectHeartGame.addEventListener('click', () => {
    triggerHaptic('light');
    heartOptionModal.classList.add('active');
  });

  btnOpt5x5.addEventListener('click', () => {
    triggerHaptic('light');
    state.selectedMode = '5x5';
    heartOptionModal.classList.remove('active');
    startGame();
  });

  btnOpt4x4.addEventListener('click', () => {
    triggerHaptic('light');
    state.selectedMode = '4x4';
    heartOptionModal.classList.remove('active');
    startGame();
  });

  btnCancelHeartOption.addEventListener('click', () => {
    heartOptionModal.classList.remove('active');
  });

  // Click Roulette Game -> Start Directly
  btnSelectRouletteGame.addEventListener('click', () => {
    triggerHaptic('light');
    state.selectedMode = 'roulette';
    startGame();
  });

  // Navigation
  btnBackHome.addEventListener('click', () => {
    stopCardWiggleLoop();
    switchScreen('home');
  });

  // 3. Reset Button -> Open Confirmation Modal Dialog
  btnReset.addEventListener('click', () => {
    triggerHaptic('light');
    resetConfirmModal.classList.add('active');
  });

  btnConfirmResetYes.addEventListener('click', () => {
    triggerHaptic('light');
    resetConfirmModal.classList.remove('active');
    resetCurrentGame();
  });

  btnConfirmResetNo.addEventListener('click', () => {
    triggerHaptic('light');
    resetConfirmModal.classList.remove('active');
  });

  // Player Name Settings Modal
  btnOpenPlayerModal.addEventListener('click', () => {
    triggerHaptic('light');
    inputP1Name.value = state.player1Name;
    inputP2Name.value = state.player2Name;
    playerModal.classList.add('active');
  });

  // Auto clear / select placeholder when focused
  inputP1Name.addEventListener('focus', function() {
    if (this.value === 'Player 1') {
      this.value = '';
    }
  });
  inputP1Name.addEventListener('blur', function() {
    if (!this.value.trim()) {
      this.value = 'Player 1';
    }
  });

  inputP2Name.addEventListener('focus', function() {
    if (this.value === 'Player 2') {
      this.value = '';
    }
  });
  inputP2Name.addEventListener('blur', function() {
    if (!this.value.trim()) {
      this.value = 'Player 2';
    }
  });

  btnSavePlayers.addEventListener('click', () => {
    triggerHaptic('light');
    const p1 = inputP1Name.value.trim() || 'Player 1';
    const p2 = inputP2Name.value.trim() || 'Player 2';
    state.player1Name = p1;
    state.player2Name = p2;
    previewP1.textContent = p1;
    previewP2.textContent = p2;
    rouletteInput.value = `${p1}, ${p2}`;
    playerModal.classList.remove('active');
    updateTurnDisplay();
  });

  btnCancelPlayers.addEventListener('click', () => {
    playerModal.classList.remove('active');
  });

  // Modal Actions
  btnModalRetry.addEventListener('click', () => {
    triggerHaptic('light');
    closeResultModal();
    resetCurrentGame();
  });
  btnModalHome.addEventListener('click', () => {
    closeResultModal();
    stopCardWiggleLoop();
    switchScreen('home');
  });

  // Roulette Events
  rouletteInput.addEventListener('input', updateRouletteItems);
  btnSpinRoulette.addEventListener('click', () => {
    triggerHaptic('light');
    spinRoulette();
  });
}

// Screen Switcher
function switchScreen(screenName) {
  state.currentScreen = screenName;
  if (screenName === 'home') {
    screenPlay.classList.remove('active');
    screenHome.classList.add('active');
    closeResultModal();
    heartOptionModal.classList.remove('active');
    resetConfirmModal.classList.remove('active');
  } else {
    screenHome.classList.remove('active');
    screenPlay.classList.add('active');
  }
}

// Start Game
function startGame() {
  switchScreen('play');
  resetCurrentGame();
}

// Reset Game State
function resetCurrentGame() {
  state.currentPlayer = 1;
  state.isGameOver = false;
  state.isProcessing = false;
  closeResultModal();
  resetConfirmModal.classList.remove('active');
  stopCardWiggleLoop();

  if (state.selectedMode === 'roulette') {
    gameTopTitle.textContent = '룰렛 게임';
    cardView.style.display = 'none';
    rouletteView.style.display = 'flex';
    turnSection.style.display = 'none';
    btnReset.style.visibility = 'hidden';
    updateRouletteItems();
    drawRoulette();
  } else {
    const is5x5 = state.selectedMode === '5x5';
    gameTopTitle.textContent = is5x5 ? '하트 게임 (5x5)' : '하트 게임 (4x4)';
    cardView.style.display = 'flex';
    rouletteView.style.display = 'none';
    turnSection.style.display = 'block';
    btnReset.style.visibility = 'visible';
    updateTurnDisplay();
    setupCardGrid();
    startCardWiggleLoop();
  }
}

// Update Turn Display (Prominent UI Section)
function updateTurnDisplay() {
  const isP1 = state.currentPlayer === 1;
  const currentName = isP1 ? state.player1Name : state.player2Name;

  turnChip.textContent = isP1 ? 'P1' : 'P2';
  turnMainName.textContent = currentName;

  if (isP1) {
    turnCardBanner.classList.remove('p2');
  } else {
    turnCardBanner.classList.add('p2');
  }
}

// Setup Card Grid
function setupCardGrid() {
  cardGrid.innerHTML = '';
  const is5x5 = state.selectedMode === '5x5';
  state.totalCards = is5x5 ? 25 : 16;

  cardGrid.className = 'card-grid ' + (is5x5 ? 'grid-5x5' : 'grid-4x4');
  state.heartIndex = Math.floor(Math.random() * state.totalCards);

  for (let i = 0; i < state.totalCards; i++) {
    const card = document.createElement('div');
    card.className = 'card-item';
    card.dataset.index = i;

    card.addEventListener('click', () => handleCardClick(card, i));
    cardGrid.appendChild(card);
  }
}

// Handle Card Click
function handleCardClick(card, index) {
  if (state.isGameOver || state.isProcessing) return;
  if (card.classList.contains('disappeared') || card.classList.contains('revealed-heart')) return;

  state.isProcessing = true;
  card.classList.remove('wiggling');

  if (index === state.heartIndex) {
    // WINNER: Heart found!
    state.isGameOver = true;
    stopCardWiggleLoop();
    triggerHaptic('strong-win');
    triggerWinVisualHaptic();

    card.classList.add('revealed-heart');
    card.innerHTML = HEART_SVG;

    const winnerName = state.currentPlayer === 1 ? state.player1Name : state.player2Name;
    setTimeout(() => {
      showWinnerModal(winnerName, 'heart');
      state.isProcessing = false;
    }, 650);
  } else {
    // MISS: Smooth Fade-out & Scale-down + Visual Haptic Bounce
    triggerHaptic('light');
    triggerVisualHaptic();
    card.classList.add('disappeared');
    
    // Switch Turn
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    updateTurnDisplay();
    state.isProcessing = false;
  }
}

// Random Card Wiggle (Vibration) Loop
function startCardWiggleLoop() {
  stopCardWiggleLoop();

  function triggerNextWiggle() {
    if (state.isGameOver || state.currentScreen !== 'play' || state.selectedMode === 'roulette') {
      return;
    }

    // Get all cards that haven't disappeared yet
    const activeCards = Array.from(cardGrid.querySelectorAll('.card-item:not(.disappeared):not(.revealed-heart)'));
    if (activeCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * activeCards.length);
      const targetCard = activeCards[randomIndex];

      targetCard.classList.remove('wiggling');
      void targetCard.offsetWidth;
      targetCard.classList.add('wiggling');

      targetCard.addEventListener('animationend', () => {
        targetCard.classList.remove('wiggling');
      }, { once: true });
    }

    const nextInterval = 1200 + Math.random() * 2000;
    state.wiggleTimerId = setTimeout(triggerNextWiggle, nextInterval);
  }

  state.wiggleTimerId = setTimeout(triggerNextWiggle, 1500);
}

function stopCardWiggleLoop() {
  if (state.wiggleTimerId) {
    clearTimeout(state.wiggleTimerId);
    state.wiggleTimerId = null;
  }
  const wigglingCards = cardGrid.querySelectorAll('.card-item.wiggling');
  wigglingCards.forEach(c => c.classList.remove('wiggling'));
}

// Show Winner Modal
function showWinnerModal(winnerName, gameType = 'heart') {
  if (gameType === 'roulette') {
    modalWinnerTitle.textContent = `${winnerName} 당첨!`;
    modalWinnerDesc.textContent = `축하합니다! 룰렛의 선택이 결정되었습니다.`;
  } else {
    modalWinnerTitle.textContent = `${winnerName} 승리!`;
    modalWinnerDesc.textContent = `축하합니다! 단 하나의 하트를 찾았습니다.`;
  }
  resultModal.classList.add('active');
}

function closeResultModal() {
  resultModal.classList.remove('active');
}

// Roulette Implementation
function updateRouletteItems() {
  const raw = rouletteInput.value;
  const items = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
  state.rouletteItems = items.length >= 2 ? items : [state.player1Name, state.player2Name];
  drawRoulette();
}

function drawRoulette() {
  const ctx = rouletteCanvas.getContext('2d');
  const items = state.rouletteItems;
  const total = items.length;
  const arc = (Math.PI * 2) / total;
  const cx = 150;
  const cy = 150;
  const radius = 145;

  ctx.clearRect(0, 0, 300, 300);

  // Soft Minimal Colors Palette for Roulette
  const colors = [
    '#EAE4D9', '#D8D2C9', '#F0EBE1', '#DFD7CB', 
    '#E3DBD0', '#ECE5DB'
  ];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.rouletteAngle);

  for (let i = 0; i < total; i++) {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angle, angle + arc);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw item text
    ctx.save();
    ctx.fillStyle = '#2D2A26';
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.rotate(angle + arc / 2);
    ctx.fillText(items[i], radius - 20, 0);
    ctx.restore();
  }

  ctx.restore();
}

function spinRoulette() {
  if (state.isSpinning) return;
  state.isSpinning = true;
  btnSpinRoulette.disabled = true;

  const total = state.rouletteItems.length;
  const spinRotations = 5 + Math.random() * 4; // 5~9 turns
  const extraAngle = Math.random() * Math.PI * 2;
  const totalRadian = spinRotations * Math.PI * 2 + extraAngle;

  const startAngle = state.rouletteAngle;
  const startTime = performance.now();
  const duration = 3800; // 3.8s ease-out

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const ease = 1 - Math.pow(1 - progress, 3);
    state.rouletteAngle = startAngle + totalRadian * ease;
    drawRoulette();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      state.isSpinning = false;
      btnSpinRoulette.disabled = false;

      // Calculate winning item
      const normalized = ((-state.rouletteAngle - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const arc = (Math.PI * 2) / total;
      const winningIndex = Math.floor(normalized / arc);
      const winner = state.rouletteItems[winningIndex];

      triggerHaptic('strong-win');
      triggerWinVisualHaptic();
      showWinnerModal(winner, 'roulette');
    }
  }

  requestAnimationFrame(animate);
}

// Start on load
window.addEventListener('DOMContentLoaded', init);
