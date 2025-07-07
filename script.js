const board = document.getElementById("board");
const status = document.getElementById("status");
const endTurn = document.getElementById("end-turn");
const fortifyBtn = document.getElementById("fortify");

const rows = 10;
const cols = 10;
const totalTiles = rows * cols;
let currentPlayer = 1;
let phase = "capital";
let capitalCount = 0;
let troopsToPlace = 3;
let selectedTile = null;
let fortifySource = null;
let hasFortified = false;
const tiles = [];

function createBoard() {
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.owner = "0";
    tile.dataset.troops = "0";
    tile.dataset.index = i;
    tile.addEventListener("click", () => handleClick(tile));
    board.appendChild(tile);
    tiles.push(tile);
  }
  updateUI();
}

function updateUI() {
  tiles.forEach(tile => {
    tile.textContent = tile.dataset.troops;
    tile.style.outline = "none";
    const o = tile.dataset.owner;
    tile.className = "tile";
    if (o === "1") tile.classList.add("p1");
    if (o === "2") tile.classList.add("p2");
    if (tile.classList.contains("capital")) tile.classList.add("capital");
  });

  fortifyBtn.style.display = (phase === "attack" && !hasFortified) ? "inline-block" : "none";

  // ✅ Enables End Turn at correct times
  if (phase === "reinforce") {
    endTurn.disabled = (troopsToPlace > 0);
  } else if (phase === "attack" || phase === "fortify") {
    endTurn.disabled = false;
  } else {
    endTurn.disabled = true;
  }
}

function handleClick(tile) {
  const owner = parseInt(tile.dataset.owner);
  const troops = parseInt(tile.dataset.troops);
  const index = parseInt(tile.dataset.index);

  if (phase === "capital" && owner === 0) {
    tile.dataset.owner = currentPlayer;
    tile.dataset.troops = "5";
    tile.classList.add(`p${currentPlayer}`, "capital");
    capitalCount++;
    if (capitalCount === 2) {
      currentPlayer = 1;
      troopsToPlace = 3;
      phase = "reinforce";
      status.textContent = `Player 1 (🔴), place your 3 troops.`;
    } else {
      currentPlayer = 2;
      status.textContent = `Player 2 (🔵), select your capital.`;
    }
    updateUI();
    return;
  }

  if (phase === "reinforce") {
    if (owner === currentPlayer && troopsToPlace > 0) {
      tile.dataset.troops = (troops + 1).toString();
      troopsToPlace--;
      if (troopsToPlace === 0) {
        phase = "attack";
        hasFortified = false;
        status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}, attack as much as you want or Fortify.`;
      }
      updateUI();
    }
    return;
  }

  if (phase === "attack") {
    if (!selectedTile && owner === currentPlayer && troops > 1) {
      selectedTile = tile;
      tile.style.outline = "2px solid yellow";
    } else if (selectedTile && tile !== selectedTile) {
      const fromIndex = parseInt(selectedTile.dataset.index);
      const toIndex = index;

      if (!isAdjacent(fromIndex, toIndex)) {
        selectedTile.style.outline = "none";
        selectedTile = null;
        updateUI();
        return;
      }

      if (owner === 0) {
        selectedTile.dataset.troops = (parseInt(selectedTile.dataset.troops) - 1).toString();
        tile.dataset.owner = currentPlayer;
        tile.dataset.troops = "1";
      } else if (owner !== currentPlayer) {
        const atk = parseInt(selectedTile.dataset.troops);
        const def = parseInt(tile.dataset.troops);
        const atkRoll = Math.floor(Math.random() * atk);
        const defRoll = Math.floor(Math.random() * def);
        if (atkRoll > defRoll) {
          tile.dataset.owner = currentPlayer;
          tile.dataset.troops = (atk - 1).toString();
          selectedTile.dataset.troops = "1";
        } else {
          selectedTile.dataset.troops = (atk - 1).toString();
        }
      }

      selectedTile.style.outline = "none";
      selectedTile = null;
      updateUI();
      checkVictory();
    }
    return;
  }

  if (phase === "fortify") {
    if (!fortifySource && owner === currentPlayer && troops > 1) {
      fortifySource = tile;
      tile.style.outline = "2px solid lime";
    } else if (fortifySource && tile !== fortifySource && owner === currentPlayer) {
      const i1 = parseInt(fortifySource.dataset.index);
      const i2 = index;
      if (isAdjacent(i1, i2)) {
        const max = parseInt(fortifySource.dataset.troops) - 1;
        const amount = Math.min(1, max);
        if (amount >= 1) {
          fortifySource.dataset.troops = (parseInt(fortifySource.dataset.troops) - amount).toString();
          tile.dataset.troops = (parseInt(tile.dataset.troops) + amount).toString();
          phase = "end";
          hasFortified = true;
          fortifySource = null;
          status.textContent = "Fortify complete. Press End Turn.";
          updateUI();
        }
      } else {
        fortifySource.style.outline = "none";
        fortifySource = null;
        updateUI();
      }
    }
  }
}

function isAdjacent(i1, i2) {
  const r1 = Math.floor(i1 / cols), c1 = i1 % cols;
  const r2 = Math.floor(i2 / cols), c2 = i2 % cols;
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function checkVictory() {
  const p1 = tiles.filter(t => t.dataset.owner === "1").length;
  const p2 = tiles.filter(t => t.dataset.owner === "2").length;
  if (p1 === 0) {
    status.textContent = "🔵 Player 2 wins!";
    disableGame();
  } else if (p2 === 0) {
    status.textContent = "🔴 Player 1 wins!";
    disableGame();
  }
}

function disableGame() {
  tiles.forEach(t => t.style.pointerEvents = "none");
  endTurn.disabled = true;
  fortifyBtn.disabled = true;
}

endTurn.addEventListener("click", () => {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  phase = "reinforce";
  troopsToPlace = 3;
  selectedTile = null;
  fortifySource = null;
  hasFortified = false;
  status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}, place 3 troops.`;
  updateUI();
});

fortifyBtn.addEventListener("click", () => {
  phase = "fortify";
  status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}: Select a tile to move troops from.`;
  updateUI();
});

createBoard();
