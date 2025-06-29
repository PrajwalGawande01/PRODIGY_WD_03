const grid = document.getElementById("grid");
const statusText = document.getElementById("status");
const scoreX = document.getElementById("scoreX");
const scoreO = document.getElementById("scoreO");
const leaderX = document.getElementById("leaderX");
const leaderO = document.getElementById("leaderO");
const draws = document.getElementById("draws");
const modeSelect = document.getElementById("mode");

let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let scores = { X: 0, O: 0 };
let leaderboard = { X: 0, O: 0, D: 0 };
let timerInterval, seconds = 0;

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").textContent = `⏱️ Time: 0s`;
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `⏱️ Time: ${seconds}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function launchConfetti() {
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}

function resetGame() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  grid.innerHTML = "";
  statusText.textContent = "";
  startTimer();
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleClick);
    grid.appendChild(cell);
  }
  if (modeSelect.value.startsWith("ai") && currentPlayer === "O") aiMove();
}

function handleClick(e) {
  const idx = e.target.dataset.index;
  if (gameOver || board[idx]) return;
  makeMove(idx, currentPlayer);
  if (!gameOver && modeSelect.value.startsWith("ai") && currentPlayer === "O") {
    setTimeout(aiMove, 300);
  }
}

function makeMove(index, player) {
  board[index] = player;
  const cell = grid.children[index];
  cell.classList.add(player.toLowerCase());

  const winCombo = checkWin();
  if (winCombo) {
    winCombo.forEach(i => grid.children[i].classList.add("win"));
    statusText.textContent = `${player} wins!`;
    scores[player]++;
    leaderboard[player]++;
    updateScore();
    stopTimer();
    launchConfetti();
    gameOver = true;
    saveLeaderboard();
    return;
  }

  if (!board.includes("")) {
    statusText.textContent = "Draw!";
    leaderboard.D++;
    stopTimer();
    gameOver = true;
    saveLeaderboard();
    updateScore();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
}

function updateScore() {
  scoreX.textContent = `X: ${scores.X}`;
  scoreO.textContent = `O: ${scores.O}`;
  leaderX.textContent = `Player X Wins: ${leaderboard.X}`;
  leaderO.textContent = `Player O Wins: ${leaderboard.O}`;
  draws.textContent = `Draws: ${leaderboard.D}`;
}

function checkWin() {
  const combos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return combos.find(([a, b, c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  );
}

function aiMove() {
  const mode = modeSelect.value;
  let idx;
  if (mode === "ai-easy") {
    const empty = board.map((v, i) => !v ? i : null).filter(v => v !== null);
    idx = empty[Math.floor(Math.random() * empty.length)];
  } else if (mode === "ai-medium") {
    idx = findMediumMove();
  } else {
    idx = findBestMove();
  }
  if (idx !== undefined) makeMove(idx, "O");
}

function findMediumMove() {
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      if (checkWin()) { board[i] = ""; return i; }
      board[i] = "";
    }
  }
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "X";
      if (checkWin()) { board[i] = ""; return i; }
      board[i] = "";
    }
  }
  const empty = board.map((v, i) => !v ? i : null).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function findBestMove() {
  const result = minimax(board, true);
  return result.index;
}

function minimax(newBoard, isMaximizing) {
  const winner = getWinner(newBoard);
  if (winner === "O") return { score: 1 };
  if (winner === "X") return { score: -1 };
  if (newBoard.every(cell => cell)) return { score: 0 };

  const scores = [];
  newBoard.forEach((cell, idx) => {
    if (!cell) {
      const next = [...newBoard];
      next[idx] = isMaximizing ? "O" : "X";
      const result = minimax(next, !isMaximizing);
      scores.push({ index: idx, score: result.score });
    }
  });
  return isMaximizing
    ? scores.reduce((a, b) => a.score > b.score ? a : b)
    : scores.reduce((a, b) => a.score < b.score ? a : b);
}

function getWinner(board) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function saveLeaderboard() {
  localStorage.setItem("ttt-leaderboard", JSON.stringify(leaderboard));
}
function loadLeaderboard() {
  const data = JSON.parse(localStorage.getItem("ttt-leaderboard"));
  if (data) leaderboard = data;
}
function resetLeaderboard() {
  leaderboard = { X: 0, O: 0, D: 0 };
  saveLeaderboard();
  updateScore();
}

loadLeaderboard();
resetGame();
