// --- SFX setup ---
const winSfx  = new Audio('sfx/win.mp3');
const loseSfx = new Audio('sfx/lose.mp3');
const scoreSfx  = new Audio('sfx/score.mp3');
const penaltySfx = new Audio('sfx/penalty.mp3');

// --- Difficulty settings ---
const DIFFICULTY = {
  easy:   { spawnRate: 1100, label: 'Easy'   },
  medium: { spawnRate: 700,  label: 'Medium' },
  hard:   { spawnRate: 400,  label: 'Hard'   }
};
let currentDifficulty = 'easy';

// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the countdown
let timeLeft = 60;           // Seconds left in current session

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// --- Difficulty button logic ---
function setDifficulty(level) {
  currentDifficulty = level;
  // Highlight selected button
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById(level + '-btn').classList.add('selected');
}

document.getElementById('easy-btn').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('medium-btn').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('hard-btn').addEventListener('click', () => setDifficulty('hard'));

// Set default selected
setDifficulty('easy');

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const isSpike = Math.random() < 0.33;  // 33% chance of a spiked ball

  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="${isSpike ? 'spiked-ball' : 'water-can'}"></div>
    </div>
  `;
}

// Adds a bubble animation to the grid
function bubbleGrid() {
  const grid = document.querySelector('.game-grid');
  grid.classList.remove('bubble-grid');
  void grid.offsetWidth;
  grid.classList.add('bubble-grid');
}

// Click handler for water cans & spiked balls
function handleWaterCanClick(e) {
  if (!gameActive) return;

  const target = e.target;
  const wrapper = target.closest('.water-can-wrapper');
  if (!wrapper) return;
  const cell = wrapper.closest('.grid-cell');

  if (target.classList.contains('water-can')) {
    currentCans++;
    // flash green
    scoreSfx.currentTime = 0;
    scoreSfx.play();
    cell.classList.add('flash-green');
    cell.addEventListener('animationend', () => {
      cell.classList.remove('flash-green');
    }, { once: true });
  }
  else if (target.classList.contains('spiked-ball')) {
    // flash red
    penaltySfx.currentTime = 0;
    penaltySfx.play();
    cell.classList.add('flash-red');
    cell.addEventListener('animationend', () => {
      cell.classList.remove('flash-red');
    }, { once: true });
    if (currentCans > 0) currentCans--;
  }
  else {
    return;
  }

  updateScore();
  wrapper.remove();

  // win check
  if (currentCans > 19) {
    endGame();
    celebrate();
  }
}

// Updates the displayed score
function updateScore() {
  const scoreEl = document.getElementById('current-cans');
  scoreEl.textContent = currentCans;
  scoreEl.classList.remove('bubble-score');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bubble-score');
}

// Countdown tick
function tickTimer() {
  timeLeft--;
  document.getElementById('timer').textContent = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    if (gameActive) {
      // play lose sound
      loseSfx.currentTime = 0;
      loseSfx.play();

      document.getElementById('start-game').textContent = 'Try again?';
      endGame();
    }
  }
}

// Adds click listener to the grid (event delegation)
document.querySelector('.game-grid')
        .addEventListener('click', handleWaterCanClick);

// Utility to launch N confetti pieces
function launchConfetti(count = 100) {
  const colors = [
    '#FFC907','#2E9DF7','#8BD1CB','#4FCB53',
    '#FF902A','#F5402C','#159A48','#F16061'
  ];

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti-piece');
    confetti.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
    confetti.style.setProperty('--x-offset', (Math.random() * 100 - 50) + 'vw');
    confetti.style.setProperty('--rotation', (Math.random() * 360) + 'deg');
    confetti.style.setProperty('--fall-duration', (2 + Math.random() * 3) + 's');
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    document.body.appendChild(confetti);
    confetti.addEventListener('animationend', () => confetti.remove());
  }
}

// Drops confetti, plays win SFX, then ends the game
function celebrate() {
  // play win sound
  winSfx.currentTime = 0;
  winSfx.play();

  launchConfetti(150);
  setTimeout(endGame, 3000);
}

// Initializes and starts a new game
function startGame() {
  clearInterval(spawnInterval);
  clearInterval(timerInterval);

  gameActive = true;
  document.getElementById('start-game').textContent = 'Restart';

  currentCans = 0;
  updateScore();
  timeLeft = 60;
  document.getElementById('timer').textContent = timeLeft;

  createGrid();
  bubbleGrid();

  // Use spawn rate based on difficulty
  spawnInterval = setInterval(spawnWaterCan, DIFFICULTY[currentDifficulty].spawnRate);
  timerInterval = setInterval(tickTimer, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
}

// Hook up the Start/Restart button
document.getElementById('start-game')
        .addEventListener('click', startGame);
