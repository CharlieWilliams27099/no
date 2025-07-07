const board = document.getElementById("board");
const status = document.getElementById("status");
const endTurn = document.getElementById("end-turn");

const rows = 10;
const cols = 10;
let currentPlayer = 1;
let claimedTiles = 0;
let isSetup = true;
const totalTiles = rows * cols;
const tiles = [];

function createBoard() {
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.dataset.owner = "0";
    tile.dataset.index = i;
    tile.addEventListener("click", () => handleTileClick(tile));
    board.appendChild(tile);
    tiles.push(tile);
  }
}

function handleTileClick(tile) {
  const owner = parseInt(tile.dataset.owner);

  // Setup phase: claim unowned tiles
  if (isSetup && owner === 0) {
    tile.dataset.owner = currentPlayer;
    tile.classList.add(currentPlayer === 1 ? "p1" : "p2");
    claimedTiles++;
    switchTurn();
    if (claimedTiles === totalTiles) {
      isSetup = false;
      status.textContent = `All tiles claimed. Player 1 (🔴) starts attacking.`;
    } else {
      status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}) — claim a tile`;
    }
    return;
  }

  // Combat phase
  if (!isSetup && owner !== currentPlayer && owner !== 0) {
    const tileIndex = parseInt(tile.dataset.index);
    const neighbors = getAdjacentOwnedTiles(tileIndex, currentPlayer);

    if (neighbors.length > 0) {
      tile.dataset.owner = currentPlayer;
      tile.className = `tile ${currentPlayer === 1 ? "p1" : "p2"}`;
      checkVictory();
    } else {
      status.textContent = "⚠️ You must attack from an adjacent tile!";
    }
  }
}

function switchTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
}

function getAdjacentOwnedTiles(index, player) {
  const adjacent = [];
  const row = Math.floor(index / cols);
  const col = index % cols;

  const directions = [
    [0, -1], [0, 1],  // Left, Right
    [-1, 0], [1, 0]   // Up, Down
  ];

  for (let [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const neighborIndex = nr * cols + nc;
      const neighbor = tiles[neighborIndex];
      if (parseInt(neighbor.dataset.owner) === player) {
        adjacent.push(neighbor);
      }
    }
  }

  return adjacent;
}

function checkVictory() {
  const p1Tiles = tiles.filter(t => t.dataset.owner === "1").length;
  const p2Tiles = tiles.filter(t => t.dataset.owner === "2").length;

  if (p1Tiles === 0) {
    status.textContent = "🔵 Player 2 wins!";
    disableBoard();
  } else if (p2Tiles === 0) {
    status.textContent = "🔴 Player 1 wins!";
    disableBoard();
  } else {
    status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}), your turn to attack.`;
  }
}

function disableBoard() {
  tiles.forEach(tile => tile.style.pointerEvents = "none");
  endTurn.disabled = true;
}

endTurn.addEventListener("click", () => {
  switchTurn();
  status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}), your turn to attack.`;
});

createBoard();
