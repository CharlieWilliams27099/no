const board = document.getElementById("board");
const status = document.getElementById("status");
const endTurn = document.getElementById("end-turn");
const fortifyBtn = document.getElementById("fortify");
const startGameBtn = document.getElementById("start-game");
const player1Type = document.getElementById("player1-type");
const player2Type = document.getElementById("player2-type");
const setupScreen = document.getElementById("setup-screen");
const gameUI = document.getElementById("game-ui");

const rows = 10;
const cols = 10;
let tiles = [];
let currentPlayer = 1;
let troopsToPlace = 3;
let phase = "capital";
let capitalCount = 0;
let selectedTile = null;
let fortifySource = null;
let hasFortified = false;
let control = { 1: "human", 2: "ai" };
let totalTiles = rows * cols;

startGameBtn.addEventListener("click", () => {
  control[1] = player1Type.value;
  control[2] = player2Type.value;
  setupScreen.style.display = "none";
  gameUI.style.display = "block";
  initGame();
});

function initGame() {
  createBoard();
  updateUI();
}

function createBoard() {
  board.innerHTML = "";
  tiles = [];
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.index = i;
    tile.dataset.owner = "0";
    tile.dataset.troops = "0";
    tile.addEventListener("click", () => handleClick(tile));
    tiles.push(tile);
    board.appendChild(tile);
  }
}

function handleClick(tile) {
  if (control[currentPlayer] !== "human") return;
  const owner = parseInt(tile.dataset.owner);
  const troops = parseInt(tile.dataset.troops);
  const index = parseInt(tile.dataset.index);

  if (phase === "capital" && owner === 0) {
    claimCapital(tile);
  } else if (phase === "reinforce" && owner === currentPlayer && troopsToPlace > 0) {
    tile.dataset.troops = (troops + 1).toString();
    troopsToPlace--;
  } else if (phase === "attack") {
    if (!selectedTile && owner === currentPlayer && troops > 1) {
      selectedTile = tile;
      tile.style.outline = "2px solid yellow";
    } else if (selectedTile && tile !== selectedTile) {
      attemptAttack(selectedTile, tile);
      selectedTile.style.outline = "none";
      selectedTile = null;
    }
  } else if (phase === "fortify") {
    if (!fortifySource && owner === currentPlayer && troops > 1) {
      fortifySource = tile;
      tile.style.outline = "2px solid lime";
    } else if (fortifySource && tile !== fortifySource && owner === currentPlayer) {
      attemptFortify(fortifySource, tile);
      fortifySource.style.outline = "none";
      fortifySource = null;
    }
  }
  updateUI();
}

function claimCapital(tile) {
  tile.dataset.owner = currentPlayer;
  tile.dataset.troops = "5";
  tile.classList.add(`p${currentPlayer}`, "capital");
  capitalCount++;
  if (capitalCount === 2) {
    phase = "reinforce";
    troopsToPlace = 3;
    currentPlayer = 1;
    status.textContent = "Player 1 (🔴), place your 3 troops.";
    updateUI();
    if (control[currentPlayer] === "ai") aiTurn();
  } else {
    currentPlayer = 2;
    status.textContent = "Player 2 (🔵), select your capital.";
  }
}

function attemptAttack(from, to) {
  const i1 = parseInt(from.dataset.index);
  const i2 = parseInt(to
