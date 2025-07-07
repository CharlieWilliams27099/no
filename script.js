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
  requestAnimationFrame(() => {
    initGame();
  });
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
  if (phase === "reinforce") {
    const ownTiles = tiles.filter(t => t.dataset.owner === currentPlayer.toString());
    const borderTiles = ownTiles.filter(tile => {
      const i = parseInt(tile.dataset.index);
      return tiles.some(n => isAdjacent(i, parseInt(n.dataset.index)) && n.dataset.owner !== tile.dataset.owner);
    });

    const reinforceTile = borderTiles.sort((a, b) => parseInt(b.dataset.troops) - parseInt(a.dataset.troops))[0]
                      || ownTiles[Math.floor(Math.random() * ownTiles.length)];

    for (let i = 0; i < 3; i++) {
      reinforceTile.dataset.troops = (parseInt(reinforceTile.dataset.troops) + 1).toString();
    }

    troopsToPlace = 0;
    phase = "attack";
    status.textContent = `AI Player ${currentPlayer} has reinforced.`;
    updateUI();
    return;
  }

  if (phase === "attack") {
    const attackers = tiles.filter(t => t.dataset.owner === currentPlayer.toString() && parseInt(t.dataset.troops) > 1);
    let didAttack = false;

    for (let attacker of attackers) {
      const i = parseInt(attacker.dataset.index);
      const neighbors = tiles.filter(n => isAdjacent(i, parseInt(n.dataset.index)));

      for (let target of neighbors) {
        const targetOwner = parseInt(target.dataset.owner);
        const atk = parseInt(attacker.dataset.troops);
        const def = parseInt(target.dataset.troops);

        if (targetOwner !== currentPlayer && targetOwner !== 0 && atk > def) {
          attemptAttack(attacker, target);
          didAttack = true;
          break;
        } else if (targetOwner === 0 && atk > 1) {
          attemptAttack(attacker, target);
          didAttack = true;
          break;
        }
      }
      if (didAttack) break;
    }

    if (!didAttack || Math.random() < 0.3) {
      phase = hasFortified ? "end" : "fortify";
      updateUI();
    } else {
      setTimeout(aiTurn, 300);
    }
    return;
  }

  if (phase === "fortify") {
    const ownTiles = tiles.filter(t => t.dataset.owner === currentPlayer.toString());
    const safeTiles = ownTiles.filter(t => {
      const i = parseInt(t.dataset.index);
      return tiles.every(n => isAdjacent(i, parseInt(n.dataset.index)) ? n.dataset.owner === t.dataset.owner : true);
    }).filter(t => parseInt(t.dataset.troops) > 1);

    const frontTiles = ownTiles.filter(t => {
      const i = parseInt(t.dataset.index);
      return tiles.some(n => isAdjacent(i, parseInt(n.dataset.index)) && n.dataset.owner !== t.dataset.owner);
    });

    if (safeTiles.length && frontTiles.length) {
      const from = safeTiles[Math.floor(Math.random() * safeTiles.length)];
      const iFrom = parseInt(from.dataset.index);
      const neighbors = tiles.filter(t => frontTiles.includes(t) && isAdjacent(iFrom, parseInt(t.dataset.index)));
      if (neighbors.length) {
        const to = neighbors[0];
        attemptFortify(from, to);
      } else {
        phase = "end";
      }
    } else {
      phase = "end";
    }

    updateUI();
    return;
  }

  if (phase === "end") {
    setTimeout(() => endTurn.click(), 400);
  }
}
