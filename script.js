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
    const i2 = parseInt(to.dataset.index);
    if (!isAdjacent(i1, i2)) return;
    const atkTroops = parseInt(from.dataset.troops);
    const defTroops = parseInt(to.dataset.troops);
    const defOwner = parseInt(to.dataset.owner);

    if (defOwner === 0 && atkTroops > 1) {
      from.dataset.troops = (atkTroops - 1).toString();
      to.dataset.owner = currentPlayer;
      to.dataset.troops = "1";
      to.className = `tile p${currentPlayer}`;
    } else if (defOwner !== currentPlayer && atkTroops > 1) {
      const atkRoll = Math.floor(Math.random() * atkTroops);
      const defRoll = Math.floor(Math.random() * defTroops);
      if (atkRoll > defRoll) {
        to.dataset.owner = currentPlayer;
        to.dataset.troops = (atkTroops - 1).toString();
        from.dataset.troops = "1";
        to.className = `tile p${currentPlayer}`;
      } else {
        from.dataset.troops = (atkTroops - 1).toString();
      }
    }
    checkVictory();
  }

  function attemptFortify(from, to) {
    const i1 = parseInt(from.dataset.index);
    const i2 = parseInt(to.dataset.index);
    if (!isAdjacent(i1, i2)) return;
    const ft = parseInt(from.dataset.troops);
    if (ft > 1) {
      from.dataset.troops = (ft - 1).toString();
      to.dataset.troops = (parseInt(to.dataset.troops) + 1).toString();
      phase = "end";
      hasFortified = true;
      status.textContent = "Fortify complete. Press End Turn.";
    }
  }

  function isAdjacent(i1, i2) {
    const r1 = Math.floor(i1 / cols), c1 = i1 % cols;
    const r2 = Math.floor(i2 / cols), c2 = i2 % cols;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  function updateUI() {
    tiles.forEach(tile => {
      const owner = tile.dataset.owner;
      tile.textContent = tile.dataset.troops;
      tile.className = "tile";
      if (owner === "1") tile.classList.add("p1");
      if (owner === "2") tile.classList.add("p2");
      if (tile.classList.contains("capital")) tile.classList.add("capital");
      tile.style.outline = "none";
    });

    if (phase === "reinforce") {
      endTurn.disabled = (troopsToPlace > 0);
    } else if (["attack", "fortify", "end"].includes(phase)) {
      endTurn.disabled = false;
    } else {
      endTurn.disabled = true;
    }

    fortifyBtn.style.display = (phase === "attack" && !hasFortified && control[currentPlayer] === "human")
      ? "inline-block" : "none";

    if (control[currentPlayer] === "ai") {
      setTimeout(aiTurn, 200);
    }
  }

  endTurn.addEventListener("click", () => {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    troopsToPlace = 3;
    phase = "reinforce";
    selectedTile = null;
    fortifySource = null;
    hasFortified = false;
    status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}, place 3 troops.`;
    updateUI();
  });

  fortifyBtn.addEventListener("click", () => {
    phase = "fortify";
    status.textContent = `Player ${currentPlayer === 1 ? "🔴" : "🔵"}: select tile to fortify from.`;
    updateUI();
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

  //
