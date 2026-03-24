// Game configuration and state variables
const GOAL_CANS = 100;        // Total items needed to collect
const STAGE_ONE_TARGET = 100;
const INACTIVITY_LIMIT = 3000;
const INACTIVITY_PENALTY = 5;
const FINAL_STAGE_MESSAGE = 'You brought clean water to every community in this quest. Incredible work.';
const CONFETTI_COLORS = ['#FFC907', '#2E9DF7', '#8BD1CB', '#159A48', '#F16061', '#FF902A'];
const WIN_MESSAGES = [
  'You win! Amazing work out there.',
  'Victory! You crushed the water quest.',
  'Nice job! You reached the winning score.'
];
const LOSS_MESSAGES = [
  'Try again! You were close.',
  'Not this round. Give it another shot.',
  'Keep going! You can beat this next time.'
];

// Milestone messages
const MILESTONES = [
  { amount: 10, message: 'Great start!' },
  { amount: 25, message: "You're making progress!" },
  { amount: 50, message: 'Halfway there!' },
  { amount: 75, message: 'Almost done!' },
  { amount: 100, message: 'Stage complete!' }
];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { duration: 50, drops: 60, inactivityPenalty: 2 },
  normal: { duration: 40, drops: 75, inactivityPenalty: 5 },
  hard: { duration: 30, drops: 100, inactivityPenalty: 8 }
};

let difficulty = 'normal'; // Current selected difficulty
let currentGameDuration = DIFFICULTY_SETTINGS['normal'].duration;
let currentRequiredDrops = DIFFICULTY_SETTINGS['normal'].drops;
let currentInactivityPenalty = DIFFICULTY_SETTINGS['normal'].inactivityPenalty;
let currentCans = 0;         // Current number of items collected
let timeLeft = currentGameDuration; // Remaining time in the current game
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;          // Holds the interval for spawning items
let timerInterval;          // Holds the interval for the countdown timer
let inactivityTimeout;      // Tracks the idle penalty timer
let milestonesDisplayed = []; // Tracks which milestones have been shown

// Sound management system
const soundManager = {
  lastCollectSoundTime: 0,
  collectSoundCooldown: 100, // Minimum milliseconds between collect sounds
  lastButtonSoundTime: 0,
  buttonSoundCooldown: 80,
  winSoundPlayed: false,

  playSoundById(audioId) {
    const audio = document.getElementById(audioId);
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silent fail if audio can't play (common on muted browsers)
    });
  },

  playCollectSound() {
    const now = Date.now();
    if (now - this.lastCollectSoundTime > this.collectSoundCooldown) {
      this.playSoundById('water-collect-sound');
      this.lastCollectSoundTime = now;
    }
  },

  playMissSound() {
    this.playSoundById('miss-sound');
  },

  playButtonSound() {
    const now = Date.now();
    if (now - this.lastButtonSoundTime > this.buttonSoundCooldown) {
      this.playSoundById('button-click-sound');
      this.lastButtonSoundTime = now;
    }
  },

  playWinSound() {
    if (!this.winSoundPlayed) {
      this.playSoundById('win-sound');
      this.winSoundPlayed = true;
    }
  },

  resetWinSound() {
    this.winSoundPlayed = false;
  }
};

function getRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function selectDifficulty(selectedDifficulty) {
  difficulty = selectedDifficulty;
  const settings = DIFFICULTY_SETTINGS[difficulty];
  currentGameDuration = settings.duration;
  currentRequiredDrops = settings.drops;
  currentInactivityPenalty = settings.inactivityPenalty;

  // Update UI to show selected difficulty
  document.querySelectorAll('.difficulty-button, .difficulty-btn').forEach((button) => {
    button.classList.remove('active');
    button.classList.remove('selected');
  });
  const selectedButton = document.getElementById(`difficulty-${difficulty}`);
  selectedButton.classList.add('active');
  selectedButton.classList.add('selected');
}

function displayMilestone(message) {
  const popup = document.getElementById('milestoneMessage') || document.getElementById('milestone-popup');
  if (!popup) return;

  // Remove 'show' class if present to reset animation
  popup.classList.remove('show');

  // Trigger reflow to restart animation
  popup.offsetHeight;

  popup.textContent = message;
  popup.style.display = 'block';
  popup.setAttribute('aria-hidden', 'false');
  popup.classList.add('show');

  // Remove the show class after animation completes (2.3 seconds = 0.3s show + 2s fade)
  setTimeout(() => {
    popup.classList.remove('show');
    popup.setAttribute('aria-hidden', 'true');
    popup.style.display = 'none';
  }, 2300);
}

function checkMilestones() {
  MILESTONES.forEach((milestone) => {
    if (currentCans === milestone.amount && !milestonesDisplayed.includes(milestone.amount)) {
      displayMilestone(milestone.message);
      milestonesDisplayed.push(milestone.amount);
    }
  });
}

function updateScoreDisplay() {
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('water-counter-text').textContent = `Water: ${currentCans} / ${GOAL_CANS}`;
}

function updateProgressDisplay() {
  const progressPercent = Math.min((currentCans / GOAL_CANS) * 100, 100);
  const roundedPercent = Math.round(progressPercent);
  document.getElementById('progress-fill').style.width = `${progressPercent}%`;
  document.getElementById('progress-percent').textContent = `${roundedPercent}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(roundedPercent));
}

function updateTimerDisplay() {
  document.getElementById('timer').textContent = timeLeft;
}

function updateGameMessage(message, isWin) {
  const gameMessage = document.getElementById('game-message');
  gameMessage.textContent = message;
  gameMessage.classList.toggle('win', Boolean(isWin));
  gameMessage.classList.toggle('loss', isWin === false && message !== '');
}

function switchStage(stageId) {
  document.querySelectorAll('.stage-screen').forEach((screen) => {
    screen.classList.toggle('is-hidden', screen.id !== stageId);
  });
}

function showStage1() {
  switchStage('stage-1-screen');
}

function showStage2() {
  switchStage('stage-2-screen');
}

function showStage3() {
  switchStage('stage-3-screen');
}

function clearInactivityPenalty() {
  clearTimeout(inactivityTimeout);
}

function applyBounceAnimation(element) {
  element.classList.add('water-drop-bounce');
  element.addEventListener('animationend', function removeAnimation() {
    element.classList.remove('water-drop-bounce');
    element.removeEventListener('animationend', removeAnimation);
  }, { once: true });
}

function clearConfetti() {
  document.getElementById('confetti-layer').innerHTML = '';
}

function launchConfetti() {
  const confettiLayer = document.getElementById('confetti-layer');
  clearConfetti();

  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }
}

function scheduleInactivityPenalty() {
  clearInactivityPenalty();

  if (!gameActive) return;

  inactivityTimeout = setTimeout(() => {
    if (!gameActive) return;

    const previousCans = currentCans;
    currentCans = Math.max(0, currentCans - currentInactivityPenalty);
    if (currentCans < previousCans) {
      soundManager.playMissSound();
    }
    updateScoreDisplay();
    updateProgressDisplay();
    scheduleInactivityPenalty();
  }, INACTIVITY_LIMIT);
}

function checkWaterAmount() {
  if (currentCans < currentRequiredDrops) return;

  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInactivityPenalty();
  createGrid();
  document.getElementById('stage-1-water-total').textContent = currentCans;
  showStage1();
}

function showWinScreen() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInactivityPenalty();
  createGrid();
  document.getElementById('win-screen-message').textContent = FINAL_STAGE_MESSAGE;
  switchStage('win-screen');
  launchConfetti();
  soundManager.playWinSound();
}

function resetGame() {
  gameActive = false;
  currentCans = 0;
  timeLeft = currentGameDuration;
  currentGameDuration = DIFFICULTY_SETTINGS[difficulty].duration;
  currentRequiredDrops = DIFFICULTY_SETTINGS[difficulty].drops;
  currentInactivityPenalty = DIFFICULTY_SETTINGS[difficulty].inactivityPenalty;
  milestonesDisplayed = [];
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInactivityPenalty();
  createGrid();
  updateScoreDisplay();
  updateProgressDisplay();
  updateTimerDisplay();
  updateGameMessage('', null);
  document.getElementById('stage-1-water-total').textContent = '0';
  document.getElementById('win-screen-message').textContent = FINAL_STAGE_MESSAGE;
  clearConfetti();
  soundManager.resetWinSound();
  switchStage('main-clicker-screen');
}

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can"></div>
    </div>
  `;
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active

  const activeDifficultyButton = document.querySelector('.difficulty-button.active');
  if (activeDifficultyButton) {
    const selectedDifficulty = activeDifficultyButton.id.replace('difficulty-', '');
    if (DIFFICULTY_SETTINGS[selectedDifficulty]) {
      difficulty = selectedDifficulty;
    }
  }

  currentGameDuration = DIFFICULTY_SETTINGS[difficulty].duration;
  currentRequiredDrops = DIFFICULTY_SETTINGS[difficulty].drops;
  currentInactivityPenalty = DIFFICULTY_SETTINGS[difficulty].inactivityPenalty;

  if (difficulty === 'easy') {
    timeLeft = 50;
  } else if (difficulty === 'normal') {
    timeLeft = 40;
  } else {
    timeLeft = 30;
  }

  document.getElementById('timer').textContent = timeLeft;

  switchStage('main-clicker-screen');
  gameActive = true;
  currentCans = 0;
  updateGameMessage('', null);
  updateScoreDisplay();
  updateProgressDisplay();
  updateTimerDisplay();
  createGrid(); // Set up the game grid
  spawnInterval = setInterval(spawnWaterCan, 1000); // Spawn water cans every second
  scheduleInactivityPenalty();
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  if (currentCans >= currentRequiredDrops) {
    checkWaterAmount();
    return;
  }

  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop countdown timer
  clearInactivityPenalty();
  createGrid();

  if (currentCans >= 20) {
    updateGameMessage(`${getRandomMessage(WIN_MESSAGES)} You collected ${currentCans} water drops.`, true);
    return;
  }

  updateGameMessage(`${getRandomMessage(LOSS_MESSAGES)} You collected ${currentCans} water drops.`, false);
}

function collectWater() {
  if (!gameActive) return;
  if (currentCans >= GOAL_CANS) return;

  currentCans += 1;
  soundManager.playCollectSound();
  applyBounceAnimation(document.getElementById('water-drop-button'));
  updateScoreDisplay();
  updateProgressDisplay();
  checkMilestones();
  scheduleInactivityPenalty();
  checkWaterAmount();
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);
document.getElementById('stage-1-choice-a').addEventListener('click', showStage2);
document.getElementById('stage-1-choice-b').addEventListener('click', showStage2);
document.getElementById('stage-2-choice-a').addEventListener('click', showStage3);
document.getElementById('stage-2-choice-b').addEventListener('click', showStage3);
document.getElementById('stage-3-choice-a').addEventListener('click', showWinScreen);
document.getElementById('stage-3-choice-b').addEventListener('click', showWinScreen);
document.getElementById('play-again').addEventListener('click', resetGame);
document.getElementById('water-drop-button').addEventListener('click', collectWater);

// Play click sound for UI buttons (except the main collect button, which uses collect sound).
document.querySelectorAll('button').forEach((button) => {
  if (button.id === 'water-drop-button') return;
  button.addEventListener('click', () => {
    soundManager.playButtonSound();
  });
});

// Set up difficulty button handlers
document.getElementById('difficulty-easy').addEventListener('click', () => selectDifficulty('easy'));
document.getElementById('difficulty-normal').addEventListener('click', () => selectDifficulty('normal'));
document.getElementById('difficulty-hard').addEventListener('click', () => selectDifficulty('hard'));

// Increment score when a spawned water can is clicked
document.querySelector('.game-grid').addEventListener('click', (event) => {
  if (!gameActive) return;
  if (!event.target.classList.contains('water-can')) return;

  const wrapper = event.target.closest('.water-can-wrapper');
  if (wrapper) {
    applyBounceAnimation(event.target);
    wrapper.remove();
  }

  collectWater();
});
