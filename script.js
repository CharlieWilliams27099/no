const board = document.getElementById("board");
const status = document.getElementById("status");
const endTurn = document.getElementById("end-turn");

const rows = 10;
const cols = 10;
const totalTiles = rows * cols;
let currentPlayer = 1;
let phase = "capital";
let capitalCount = 0;
let troopsToPlace = 3;
const tiles = [];

let selectedTile = null;

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
      updateTile(tile);
      capitalCount++;
      if (capitalCount === 2) {
        phase = "reinforce";
        troopsToPlace = 3;
        currentPlayer = 1;
        status.textContent = `Player 1 (🔴), place your 3 starting troops.`;
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
      updateTile(tile);
      if (troopsToPlace === 0) {
        phase = "attack";
        status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}), click your tile then adjacent tile to act.`;
      }
    }
  }

  else if (phase === "attack") {
    if (!selectedTile && owner === currentPlayer && troops > 1) {
      selectedTile = tile;
      tile.style.outline = "2px solid yellow";
    }
    else if (selectedTile && tile !== selectedTile) {
      const fromIndex = parseInt(selectedTile.dataset.index);
      const toIndex = index;
      const fromTroops = parseInt(selectedTile.dataset.troops);
      const targetOwner = parseInt(tile.dataset.owner);

      if (!isAdjacent(fromIndex, toIndex)) {
        selectedTile.style.outline = "none";
        selectedTile = null;
        return;
      }

      if (targetOwner === 0 && fromTroops > 1) {
        // Claim neutral land
        selectedTile.dataset.troops = (fromTroops - 1).toString();
        tile.dataset.troops = "1";
        tile.dataset.owner = currentPlayer;
        tile.className = `tile p${currentPlayer}`;
        updateTile(selectedTile);
        updateTile(tile);
      }

      else if (targetOwner !== currentPlayer) {
        resolveAttack(selectedTile, tile);
      }

      selectedTile.style.outline = "none";
      selectedTile = null;
      checkVictory();
    }
  }
}

function isAdjacent(i1, i2) {
  const r1 = Math.floor(i1 / cols), c1 = i1 % cols;
  const r2 = Math.floor(i2 / cols), c2 = i2 % cols;
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function updateTile(tile) {
  tile.textContent = tile.dataset.troops;
  if (tile.classList.contains("capital")) tile.classList.add("capital");
}

function resolveAttack(fromTile, toTile) {
  let atk = parseInt(fromTile.dataset.troops);
  let def = parseInt(toTile.dataset.troops);

  const atkRoll = Math.floor(Math.random() * atk);
  const defRoll = Math.floor(Math.random() * def);

  if (atkRoll > defRoll) {
    toTile.dataset.owner = currentPlayer;
    toTile.dataset.troops = (atk - 1).toString();
    fromTile.dataset.troops = "1";
    toTile.className = `tile p${currentPlayer}`;
    updateTile(fromTile);
    updateTile(toTile);
  } else {
    fromTile.dataset.troops = (atk - 1).toString();
    updateTile(fromTile);
  }
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

endTurn.addEventListener("click", () => {
  if (phase === "attack") {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    phase = "reinforce";
    troopsToPlace = 3;
    selectedTile = null;
    status.textContent = `Player ${currentPlayer} (${currentPlayer === 1 ? "🔴" : "🔵"}), place your 3 troops.`;
  }
});

createBoard();
