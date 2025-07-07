const board = document.getElementById("board");
const status = document.getElementById("status");
const endTurn = document.getElementById("end-turn");

const rows = 10;
const cols = 10;
const totalTiles = rows * cols;
let currentPlayer = 1;
let phase = "capital"; // 'capital' → 'reinforce' → 'attack'
let capitalCount = 0;
let troopsToPlace = 3;
const tiles = [];

function createBoard() {
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.dataset.owner = "0";
    tile.dataset.troops = "0";
    tile.dataset.index = i;
    tile.addEventListener("click", () => handleClick(tile));
    board.appendChild(tile);
    tiles.push(tile);
  }
}

function handleClick(tile) {
  const owner = parseInt(tile.dataset.owner);
  const troops = parseInt(tile.dataset.troops);
  const index = parseInt(tile.dataset.index);

  if (phase === "capital") {
    if (owner === 0) {
      tile.dataset.owner = currentPlayer;
      tile.dataset.troops = "5";
      tile.classList.add(`p${currentPlayer}`, "capital");
      updateTileDisplay(tile);
      capitalCount++;
      if (capitalCount === 2) {
        phase = "reinforce";
        status.textContent = `Player 1 (🔴), place your 3 starting troops.`;
        troopsToPlace = 3;
        currentPlayer = 1;
      } else {
        currentPlayer = 2;
        status.textContent = `Player 2 (🔵), select your capital.`;
      }
    }
  }

  else if (phase === "reinforce") {
    if (owner === currentPlayer && troopsToPlace > 0) {
      tile.dataset.troops = (troops + 1).toString();
      troopsToPlace--;
      updateTileDisplay(tile);
      if (troopsToPlace === 0) {
        phase = "attack";
        status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}), click your tile then an enemy to attack.`;
      }
    }
  }

  else if (phase === "attack") {
    if (selectedTile === null && owner === currentPlayer && troops > 1) {
      selectedTile = tile;
      tile.style.outline = "2px solid yellow";
    } else if (selectedTile && tile !== selectedTile) {
      const targetOwner = parseInt(tile.dataset.owner);
      const fromIndex = parseInt(selectedTile.dataset.index);
      const toIndex = index;
      if (isAdjacent(fromIndex, toIndex) && targetOwner !== currentPlayer && targetOwner !== 0) {
        resolveAttack(selectedTile, tile);
      }
      selectedTile.style.outline = "none";
      selectedTile = null;
    }
  }
}

function isAdjacent(i1, i2) {
  const r1 = Math.floor(i1 / cols);
  const c1 = i1 % cols;
  const r2 = Math.floor(i2 / cols);
  const c2 = i2 % cols;
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function updateTileDisplay(tile) {
  const troops = tile.dataset.troops;
  tile.textContent = troops;
}

function resolveAttack(fromTile, toTile) {
  let atk = parseInt(fromTile.dataset.troops);
  let def = parseInt(toTile.dataset.troops);

  const atkPower = Math.floor(Math.random() * atk);
  const defPower = Math.floor(Math.random() * def);

  if (atkPower > defPower) {
    toTile.dataset.owner = currentPlayer;
    toTile.className = `tile p${currentPlayer}`;
    toTile.dataset.troops = (atk - 1).toString();
    fromTile.dataset.troops = "1";
    if (fromTile.classList.contains("capital")) fromTile.classList.add(`p${currentPlayer}`, "capital");
    updateTileDisplay(toTile);
    updateTileDisplay(fromTile);
  } else {
    fromTile.dataset.troops = (atk - 1).toString();
    updateTileDisplay(fromTile);
  }

  checkVictory();
}

function checkVictory() {
  const p1 = tiles.filter(t => t.dataset.owner === "1").length;
  const p2 = tiles.filter(t => t.dataset.owner === "2").length;
  if (p1 === 0) {
    status.textContent = "🔵 Player 2 wins!";
    disableBoard();
  } else if (p2 === 0) {
    status.textContent = "🔴 Player 1 wins!";
    disableBoard();
  }
}

function disableBoard() {
  tiles.forEach(tile => tile.style.pointerEvents = "none");
  endTurn.disabled = true;
}

let selectedTile = null;

endTurn.addEventListener("click", () => {
  if (phase === "attack") {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    phase = "reinforce";
    troopsToPlace = 3;
    status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}), place your 3 troops.`;
  }
});

createBoard();
