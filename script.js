document.addEventListener("DOMContentLoaded", () => {
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
  const totalTiles = rows * cols;
  let tiles = [];
  let control = { 1: "human", 2: "ai" };
  let currentPlayer = 1;
  let troopsToPlace = 3;
  let phase = "capital";
  let capitalCount = 0;
  let selectedTile = null;
  let fortifySource = null;
  let hasFortified = false;

  startGameBtn.addEventListener("click", () => {
    control[1] = player1Type.value;
    control[2] = player2Type.value;
    setupScreen.style.display = "none";
    gameUI.style.display = "block";
    initGame();
  });

  function initGame() {
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
    updateUI();
  }

   function handleClick(tile) {
    if (control[currentPlayer] !== "human") return;
    const owner = parseInt(tile.dataset.owner);
    const troops = parseInt(tile.dataset.troops);
    const index = parseInt(tile.dataset.index);

    if (phase === "capital" && owner === 0) {
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
        if (control[1] === "ai") setTimeout(aiTurn, 500);
      } else {
        currentPlayer = 2;
        status.textContent = "Player 2 (🔵), select your capital.";
      }
      updateUI();
    }

    if (phase === "reinforce" && owner === currentPlayer && troopsToPlace > 0) {
      tile.dataset.troops = (troops + 1).toString();
      troopsToPlace--;
      if (troopsToPlace === 0) {
        phase = "attack";
        status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}: Attack or Fortify.`;
        updateUI();
      }
    }

    if (phase === "attack") {
      if (!selectedTile && owner === currentPlayer && troops > 1) {
        selectedTile = tile;
        tile.style.outline = "2px solid yellow";
      } else if (selectedTile && tile !== selectedTile) {
        const atk = parseInt(selectedTile.dataset.troops);
        const def = parseInt(tile.dataset.troops);
        const targetOwner = parseInt(tile.dataset.owner);
        const fromIdx = parseInt(selectedTile.dataset.index);
        const toIdx = parseInt(tile.dataset.index);

        if (isAdjacent(fromIdx, toIdx)) {
          if (targetOwner === 0 && atk > 1) {
            selectedTile.dataset.troops = (atk - 1).toString();
            tile.dataset.owner = currentPlayer;
            tile.dataset.troops = "1";
            tile.className = `tile p${currentPlayer}`;
          } else if (targetOwner !== currentPlayer && atk > def) {
            tile.dataset.owner = currentPlayer;
            tile.dataset.troops = (atk - 1).toString();
            selectedTile.dataset.troops = "1";
            tile.className = `tile p${currentPlayer}`;
          }
        }

        selectedTile.style.outline = "none";
        selectedTile = null;
        checkVictory();
        updateUI();
      }
    }

    if (phase === "fortify") {
      if (!fortifySource && owner === currentPlayer && troops > 1) {
        fortifySource = tile;
        tile.style.outline = "2px solid lime";
      } else if (fortifySource && tile !== fortifySource && owner === currentPlayer) {
        const fromIdx = parseInt(fortifySource.dataset.index);
        const toIdx = parseInt(tile.dataset.index);
        if (isAdjacent(fromIdx, toIdx)) {
          fortifySource.dataset.troops = (parseInt(fortifySource.dataset.troops) - 1).toString();
          tile.dataset.troops = (parseInt(tile.dataset.troops) + 1).toString();
          phase = "end";
          status.textContent = "Fortify complete. Press End Turn.";
        }
        fortifySource.style.outline = "none";
        fortifySource = null;
        updateUI();
      }
    }
  }

  function isAdjacent(i1, i2) {
    const r1 = Math.floor(i1 / cols), c1 = i1 % cols;
    const r2 = Math.floor(i2 / cols), c2 = i2 % cols;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  function endHumanTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    troopsToPlace = 3;
    hasFortified = false;
    fortifySource = null;
    selectedTile = null;
    phase = "reinforce";
    status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}: place 3 troops.`;
    updateUI();
    if (control[currentPlayer] === "ai") setTimeout(aiTurn, 500);
  }

  endTurn.addEventListener("click", endHumanTurn);

  fortifyBtn.addEventListener("click", () => {
    if (phase === "attack") {
      phase = "fortify";
      status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}: select tile to fortify from.`;
      updateUI();
    }
  });

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

  function aiTurn() {
    if (phase === "capital") {
      const neutral = tiles.filter(t => t.dataset.owner === "0");
      const tile = neutral[Math.floor(Math.random() * neutral.length)];
      tile.click();
      return;
    }

    if (phase === "reinforce") {
      const ownTiles = tiles.filter(t => t.dataset.owner === currentPlayer.toString());
      const borderTiles = ownTiles.filter(t => {
        const i = parseInt(t.dataset.index);
        return tiles.some(n =>
          isAdjacent(i, parseInt(n.dataset.index)) &&
          n.dataset.owner !== t.dataset.owner
        );
      });
      const reinforceTile = borderTiles[0] || ownTiles[0];
      for (let i = 0; i < 3; i++) {
        reinforceTile.dataset.troops = (parseInt(reinforceTile.dataset.troops) + 1).toString();
      }
      troopsToPlace = 0;
      phase = "attack";
      updateUI();
      setTimeout(aiTurn, 300);
      return;
    }

    if (phase === "attack") {
      const attackers = tiles.filter(t =>
        t.dataset.owner === currentPlayer.toString() &&
        parseInt(t.dataset.troops) > 1
      );
      for (let a of attackers) {
        const i = parseInt(a.dataset.index);
        const neighbors = tiles.filter(n =>
          isAdjacent(i, parseInt(n.dataset.index)) &&
          n.dataset.owner !== a.dataset.owner
        );
        for (let t of neighbors) {
          const atk = parseInt(a.dataset.troops);
          const def = parseInt(t.dataset.troops);
          if (atk > def || t.dataset.owner === "0") {
            attemptAttack(a, t);
            checkVictory();
            updateUI();
            setTimeout(aiTurn, 300);
            return;
          }
        }
      }
      phase = "fortify";
      updateUI();
      setTimeout(aiTurn, 300);
      return;
    }

    if (phase === "fortify") {
      const ownTiles = tiles.filter(t => t.dataset.owner === currentPlayer.toString());
      const safe = ownTiles.filter(t =>
        parseInt(t.dataset.troops) > 1 &&
        tiles.every(n =>
          isAdjacent(parseInt(t.dataset.index), parseInt(n.dataset.index)) ?
          n.dataset.owner === t.dataset.owner : true
        )
      );
      const border = ownTiles.filter(t =>
        tiles.some(n =>
          isAdjacent(parseInt(t.dataset.index), parseInt(n.dataset.index)) &&
          n.dataset.owner !== t.dataset.owner
        )
      );
      if (safe.length && border.length) {
        const from = safe[0];
        const to = border.find(t =>
          isAdjacent(parseInt(from.dataset.index), parseInt(t.dataset.index))
        );
        if (to) {
          attemptFortify(from, to);
          updateUI();
          setTimeout(() => endTurn.click(), 300);
          return;
        }
      }
      phase = "end";
      updateUI();
      setTimeout(() => endTurn.click(), 300);
    }
  }
});


