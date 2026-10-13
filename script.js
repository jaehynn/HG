// ==========================================
// Heart Pick - Minimal Couple Game Script
// ==========================================

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
let screenHome, screenPlay, appContainer, btnBackHome, btnReset, cardView, rouletteView, cardGrid;
let btnSoundToggle, iconSoundOn, iconSoundOff;
let btnSelectHeartGame, btnSelectRouletteGame;
let heartOptionModal, btnOpt5x5, btnOpt4x4, btnCancelHeartOption;
let resetConfirmModal, btnConfirmResetYes, btnConfirmResetNo;
let btnOpenPlayerModal, playerModal, inputP1Name, inputP2Name, btnSavePlayers, btnCancelPlayers, previewP1, previewP2;
let turnSection, turnCardBanner, turnChip, turnMainName, gameTopTitle;
let resultModal, modalWinnerTitle, modalWinnerDesc, btnModalRetry, btnModalHome;
let rouletteCanvas, rouletteInput, btnSpinRoulette;

// Heart SVG Template
const HEART_SVG = `
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
`;

// ==========================================
// iOS Silent-Mode Bypass HTML5 Audio Synthesizer
// ==========================================
function createWavDataUri(sampleRate, duration, sampleFn) {
  try {
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
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
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
  } catch (e) {
    return '';
  }
}

// 1. Light & Cute Touch Sound (가볍고 귀여운 퐁/뽁!)
let audioClick = null;
function getAudioClick() {
  if (!audioClick && typeof Audio !== 'undefined') {
    try {
      const uri = createWavDataUri(22050, 0.075, (t, dur) => {
        const attack = Math.min(1, t / 0.006);
        const decay = Math.pow(Math.max(0, 1 - t / dur), 2.8);
        const env = attack * decay;
        const freq = 520 + 320 * Math.sin((t / dur) * Math.PI * 0.85);
        const s1 = Math.sin(2 * Math.PI * freq * t);
        const s2 = Math.sin(4 * Math.PI * freq * t) * 0.25;
        return (s1 + s2) * env * 0.85;
      });
      if (uri) {
        audioClick = new Audio(uri);
        audioClick.preload = 'auto';
      }
    } catch (e) {}
  }
  return audioClick;
}

// 2. Cute 'Heart Pyong-Pyong' Victory Sound (하트 뿅뿅! 💕 뾰로로롱~ ✨)
let audioWin = null;
function getAudioWin() {
  if (!audioWin && typeof Audio !== 'undefined') {
    try {
      const uri = createWavDataUri(22050, 0.85, (t) => {
        // 3단 상승 하트 뿅뿅 스쿱
        const pyongs = [
          { start: 0.00, end: 0.16, fStart: 540, fEnd: 1120, vol: 0.70 },
          { start: 0.11, end: 0.29, fStart: 720, fEnd: 1420, vol: 0.75 },
          { start: 0.22, end: 0.43, fStart: 920, fEnd: 1780, vol: 0.80 },
        ];

        let sum = 0;

        for (const p of pyongs) {
          if (t >= p.start && t < p.end) {
            const pt = t - p.start;
            const pdur = p.end - p.start;
            const progress = pt / pdur;
            const freq = p.fStart + (p.fEnd - p.fStart) * Math.pow(progress, 0.75);
            const attack = Math.min(1, pt / 0.007);
            const decay = Math.pow(1 - progress, 2.0);
            const env = attack * decay;
            const wave = Math.sin(2 * Math.PI * freq * pt) + 0.22 * Math.sin(4 * Math.PI * freq * pt);
            sum += wave * env * p.vol;
          }
        }

        // 반짝이는 사랑의 하트 피날레 (뾰로로롱~ ✨ C6, E6, G6, C7)
        const blossomStart = 0.32;
        const blossomEnd = 0.85;
        if (t >= blossomStart && t < blossomEnd) {
          const bt = t - blossomStart;
          const bdur = blossomEnd - blossomStart;
          const bprogress = bt / bdur;
          const bAttack = Math.min(1, bt / 0.012);
          const bDecay = Math.pow(1 - bprogress, 2.3);
          const bEnv = bAttack * bDecay;
          const tremolo = 1 + 0.18 * Math.sin(2 * Math.PI * 8 * bt);

          const s1 = Math.sin(2 * Math.PI * 1046.50 * bt); // C6
          const s2 = Math.sin(2 * Math.PI * 1318.51 * bt); // E6
          const s3 = Math.sin(2 * Math.PI * 1567.98 * bt); // G6
          const s4 = Math.sin(2 * Math.PI * 2093.00 * bt) * 0.4; // C7

          sum += (s1 + s2 + s3 + s4) * 0.26 * bEnv * tremolo;
        }

        return Math.max(-1, Math.min(1, sum * 0.9));
      });
      if (uri) {
        audioWin = new Audio(uri);
        audioWin.preload = 'auto';
      }
    } catch (e) {}
  }
  return audioWin;
}

// Unlock iOS Audio safely
function unlockiOSAudio() {
  try {
    const click = getAudioClick();
    if (click) {
      const p = click.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          click.pause();
          click.currentTime = 0;
        }).catch(() => {});
      }
    }
  } catch (e) {}
}

// Play Tactile Audio
function playTactileSound(type = 'light') {
  if (!state.soundEnabled) return;
  try {
    if (type === 'light') {
      const click = getAudioClick();
      if (click) {
        const clone = click.cloneNode();
        clone.volume = 0.8;
        clone.play().catch(() => {});
      }
    } else if (type === 'strong-win') {
      const win = getAudioWin();
      if (win) {
        const clone = win.cloneNode();
        clone.volume = 0.9;
        clone.play().catch(() => {});
      }
    }
  } catch (e) {}
}

// Master Haptic & Sound Trigger
function triggerHaptic(type = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(20);
      } else if (type === 'strong-win') {
        navigator.vibrate([160, 60, 220, 60, 320]);
      }
    } catch (e) {}
  }
  playTactileSound(type);
}

// Big Win Visual Haptic on Screen
function triggerWinVisualHaptic() {
  if (!appContainer) return;
  appContainer.classList.remove('win-shake');
  void appContainer.offsetWidth;
  appContainer.classList.add('win-shake');
}

// Sound Toggle Update UI
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  if (iconSoundOn && iconSoundOff) {
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
}

// Safe title update (방어 코드)
function setTopTitle(text) {
  if (gameTopTitle) {
    gameTopTitle.textContent = text;
  }
}

// Initialize App
function init() {
  screenHome = document.getElementById('screen-home');
  screenPlay = document.getElementById('screen-play');
  appContainer = document.querySelector('.app-container');
  btnBackHome = document.getElementById('btn-back-home');
  btnReset = document.getElementById('btn-reset');
  cardView = document.getElementById('card-view');
  rouletteView = document.getElementById('roulette-view');
  cardGrid = document.getElementById('card-grid');

  btnSoundToggle = document.getElementById('btn-sound-toggle');
  iconSoundOn = document.getElementById('icon-sound-on');
  iconSoundOff = document.getElementById('icon-sound-off');

  btnSelectHeartGame = document.getElementById('btn-select-heart-game');
  btnSelectRouletteGame = document.getElementById('btn-select-roulette-game');

  heartOptionModal = document.getElementById('heart-option-modal');
  btnOpt5x5 = document.getElementById('btn-opt-5x5');
  btnOpt4x4 = document.getElementById('btn-opt-4x4');
  btnCancelHeartOption = document.getElementById('btn-cancel-heart-option');

  resetConfirmModal = document.getElementById('reset-confirm-modal');
  btnConfirmResetYes = document.getElementById('btn-confirm-reset-yes');
  btnConfirmResetNo = document.getElementById('btn-confirm-reset-no');

  btnOpenPlayerModal = document.getElementById('btn-open-player-modal');
  playerModal = document.getElementById('player-modal');
  inputP1Name = document.getElementById('input-p1-name');
  inputP2Name = document.getElementById('input-p2-name');
  btnSavePlayers = document.getElementById('btn-save-players');
  btnCancelPlayers = document.getElementById('btn-cancel-players');
  previewP1 = document.getElementById('preview-p1');
  previewP2 = document.getElementById('preview-p2');

  turnSection = document.getElementById('turn-section');
  turnCardBanner = document.getElementById('turn-card-banner');
  turnChip = document.getElementById('turn-chip');
  turnMainName = document.getElementById('turn-main-name');
  gameTopTitle = document.getElementById('game-top-title');

  resultModal = document.getElementById('result-modal');
  modalWinnerTitle = document.getElementById('modal-winner-title');
  modalWinnerDesc = document.getElementById('modal-winner-desc');
  btnModalRetry = document.getElementById('btn-modal-retry');
  btnModalHome = document.getElementById('btn-modal-home');

  rouletteCanvas = document.getElementById('roulette-canvas');
  rouletteInput = document.getElementById('roulette-items-input');
  btnSpinRoulette = document.getElementById('btn-spin-roulette');

  document.addEventListener('touchstart', unlockiOSAudio, { once: true, passive: true });
  document.addEventListener('click', unlockiOSAudio, { once: true, passive: true });

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSound();
    });
  }

  if (btnSelectHeartGame && heartOptionModal) {
    btnSelectHeartGame.addEventListener('click', () => {
      triggerHaptic('light');
      heartOptionModal.classList.add('active');
    });
  }

  if (btnOpt5x5) {
    btnOpt5x5.addEventListener('click', () => {
      triggerHaptic('light');
      state.selectedMode = '5x5';
      if (heartOptionModal) heartOptionModal.classList.remove('active');
      startGame();
    });
  }

  if (btnOpt4x4) {
    btnOpt4x4.addEventListener('click', () => {
      triggerHaptic('light');
      state.selectedMode = '4x4';
      if (heartOptionModal) heartOptionModal.classList.remove('active');
      startGame();
    });
  }

  if (btnCancelHeartOption && heartOptionModal) {
    btnCancelHeartOption.addEventListener('click', () => {
      heartOptionModal.classList.remove('active');
    });
  }

  if (btnSelectRouletteGame) {
    btnSelectRouletteGame.addEventListener('click', () => {
      triggerHaptic('light');
      state.selectedMode = 'roulette';
      startGame();
    });
  }

  if (btnBackHome) {
    btnBackHome.addEventListener('click', () => {
      stopCardWiggleLoop();
      switchScreen('home');
    });
  }

  if (btnReset && resetConfirmModal) {
    btnReset.addEventListener('click', () => {
      triggerHaptic('light');
      resetConfirmModal.classList.add('active');
    });
  }

  if (btnConfirmResetYes && resetConfirmModal) {
    btnConfirmResetYes.addEventListener('click', () => {
      triggerHaptic('light');
      resetConfirmModal.classList.remove('active');
      resetCurrentGame();
    });
  }

  if (btnConfirmResetNo && resetConfirmModal) {
    btnConfirmResetNo.addEventListener('click', () => {
      triggerHaptic('light');
      resetConfirmModal.classList.remove('active');
    });
  }

  if (btnOpenPlayerModal && playerModal) {
    btnOpenPlayerModal.addEventListener('click', () => {
      triggerHaptic('light');
      if (inputP1Name) inputP1Name.value = state.player1Name;
      if (inputP2Name) inputP2Name.value = state.player2Name;
      playerModal.classList.add('active');
    });
  }

  if (inputP1Name) {
    inputP1Name.addEventListener('focus', function() {
      if (this.value === 'Player 1') this.value = '';
    });
    inputP1Name.addEventListener('blur', function() {
      if (!this.value.trim()) this.value = 'Player 1';
    });
  }

  if (inputP2Name) {
    inputP2Name.addEventListener('focus', function() {
      if (this.value === 'Player 2') this.value = '';
    });
    inputP2Name.addEventListener('blur', function() {
      if (!this.value.trim()) this.value = 'Player 2';
    });
  }

  if (btnSavePlayers) {
    btnSavePlayers.addEventListener('click', () => {
      triggerHaptic('light');
      const p1 = (inputP1Name && inputP1Name.value.trim()) || 'Player 1';
      const p2 = (inputP2Name && inputP2Name.value.trim()) || 'Player 2';
      state.player1Name = p1;
      state.player2Name = p2;
      if (previewP1) previewP1.textContent = p1;
      if (previewP2) previewP2.textContent = p2;
      if (rouletteInput) rouletteInput.value = `${p1}, ${p2}`;
      if (playerModal) playerModal.classList.remove('active');
      updateTurnDisplay();
    });
  }

  if (btnCancelPlayers && playerModal) {
    btnCancelPlayers.addEventListener('click', () => {
      playerModal.classList.remove('active');
    });
  }

  if (btnModalRetry) {
    btnModalRetry.addEventListener('click', () => {
      triggerHaptic('light');
      closeResultModal();
      resetCurrentGame();
    });
  }

  if (btnModalHome) {
    btnModalHome.addEventListener('click', () => {
      closeResultModal();
      stopCardWiggleLoop();
      switchScreen('home');
    });
  }

  if (rouletteInput) {
    rouletteInput.addEventListener('input', updateRouletteItems);
  }
  if (btnSpinRoulette) {
    btnSpinRoulette.addEventListener('click', () => {
      triggerHaptic('light');
      spinRoulette();
    });
  }
}

// Screen Switcher
function switchScreen(screenName) {
  state.currentScreen = screenName;
  if (!screenHome || !screenPlay) return;

  if (screenName === 'home') {
    screenPlay.classList.remove('active');
    screenHome.classList.add('active');
    closeResultModal();
    if (heartOptionModal) heartOptionModal.classList.remove('active');
    if (resetConfirmModal) resetConfirmModal.classList.remove('active');
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
  if (resetConfirmModal) resetConfirmModal.classList.remove('active');
  stopCardWiggleLoop();

  if (state.selectedMode === 'roulette') {
    setTopTitle('룰렛 게임');
    if (cardView) cardView.style.display = 'none';
    if (rouletteView) rouletteView.style.display = 'flex';
    if (turnSection) turnSection.style.display = 'none';
    if (btnReset) btnReset.style.visibility = 'hidden';
    updateRouletteItems();
    drawRoulette();
  } else {
    const is5x5 = state.selectedMode === '5x5';
    setTopTitle(is5x5 ? '하트 게임 (5x5)' : '하트 게임 (4x4)');
    if (cardView) cardView.style.display = 'flex';
    if (rouletteView) rouletteView.style.display = 'none';
    if (turnSection) turnSection.style.display = 'block';
    if (btnReset) btnReset.style.visibility = 'visible';
    updateTurnDisplay();
    setupCardGrid();
    startCardWiggleLoop();
  }
}

// Update Turn Display
function updateTurnDisplay() {
  if (!turnChip || !turnMainName || !turnCardBanner) return;
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
  if (!cardGrid) return;
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

// Handle Card Click (그리드 반동 제거 & 귀여운 사운드)
function handleCardClick(card, index) {
  if (state.isGameOver || state.isProcessing) return;
  if (card.classList.contains('disappeared') || card.classList.contains('revealed-heart')) return;

  state.isProcessing = true;
  card.classList.remove('wiggling');

  if (index === state.heartIndex) {
    // WINNER: 하트 당첨 (하트 뿅뿅 사운드 + 축하 진동)
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
    // MISS: 꽝 (그리드 반동 없이 부드러운 개별 카드 소멸 & 퐁! 효과음)
    triggerHaptic('light');
    card.classList.add('disappeared');
    
    // Switch Turn
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    updateTurnDisplay();
    state.isProcessing = false;
  }
}

// Random Card Wiggle Loop
function startCardWiggleLoop() {
  stopCardWiggleLoop();

  function triggerNextWiggle() {
    if (state.isGameOver || state.currentScreen !== 'play' || state.selectedMode === 'roulette' || !cardGrid) {
      return;
    }

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
  if (cardGrid) {
    const wigglingCards = cardGrid.querySelectorAll('.card-item.wiggling');
    wigglingCards.forEach(c => c.classList.remove('wiggling'));
  }
}

// Show Winner Modal
function showWinnerModal(winnerName, gameType = 'heart') {
  if (!resultModal || !modalWinnerTitle || !modalWinnerDesc) return;
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
  if (resultModal) resultModal.classList.remove('active');
}

// Roulette Implementation
function updateRouletteItems() {
  if (!rouletteInput) return;
  const raw = rouletteInput.value;
  const items = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
  state.rouletteItems = items.length >= 2 ? items : [state.player1Name, state.player2Name];
  drawRoulette();
}

function drawRoulette() {
  if (!rouletteCanvas) return;
  const ctx = rouletteCanvas.getContext('2d');
  if (!ctx) return;

  const items = state.rouletteItems;
  const total = items.length;
  const arc = (Math.PI * 2) / total;
  const cx = 150;
  const cy = 150;
  const radius = 145;

  ctx.clearRect(0, 0, 300, 300);

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
  if (btnSpinRoulette) btnSpinRoulette.disabled = true;

  const total = state.rouletteItems.length;
  const spinRotations = 5 + Math.random() * 4;
  const extraAngle = Math.random() * Math.PI * 2;
  const totalRadian = spinRotations * Math.PI * 2 + extraAngle;

  const startAngle = state.rouletteAngle;
  const startTime = performance.now();
  const duration = 3800;

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
      if (btnSpinRoulette) btnSpinRoulette.disabled = false;

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

// Safe Start on Load (로드 타이밍 안전 보장)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
