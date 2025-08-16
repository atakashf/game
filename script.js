document.addEventListener("DOMContentLoaded", () => {
  // Game elements
  const gameBoard = document.getElementById("gameBoard");
  const dice = document.getElementById("dice");
  const rollBtn = document.getElementById("rollBtn");
  const resetBtn = document.getElementById("resetBtn");
  const gameStatus = document.getElementById("gameStatus");
  const winAnimation = document.getElementById("winAnimation");
  const winText = document.getElementById("winText");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const player1Info = document.getElementById("player1");
  const player2Info = document.getElementById("player2");

  // Game state
  let currentPlayer = 1;
  let gameActive = true;
  const playerPositions = { 1: 1, 2: 1 };
  const playerNames = { 1: "Player 1", 2: "Player 2" };

  // Track consecutive sixes for each player
  const consecutiveSixes = { 1: 0, 2: 0 };

  // Define snakes and ladders (start: end)
  const snakes = {
    16: 5,
    47: 34,
    49: 32,
    56: 45,
    62: 59,
    64: 57,
    87: 74,
    93: 88,
    95: 86,
    98: 83,
  };

  // Ladders: key is start, value is end. If end > start, move up. If end < start, move down.
  const ladders = {
    4: 17,
    9: 12,
    21: 40,
    28: 33,
    36: 45,
    51: 70,
    71: 90,
    80: 81,
    // Example ladder move down:
    99: 82, // ladder move down from 99 to 78
  };

  // Initialize the game board
  function initializeBoard() {
    gameBoard.innerHTML = "";

    // Create cells from 100 to 1 in a snake pattern
    for (let row = 0; row < 10; row++) {
      // Create row container
      const rowDiv = document.createElement("div");
      rowDiv.style.display = "contents";

      for (let col = 0; col < 10; col++) {
        // Calculate cell number based on row and column
        const cellNum =
          row % 2 === 0 ? 100 - row * 10 - col : 91 - row * 10 + col;

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = cellNum;
        cell.id = `cell-${cellNum}`;

        // Mark snakes
        if (snakes[cellNum]) {
          cell.classList.add("snake-head");
        }

        // Mark ladders
        if (ladders[cellNum]) {
          if (ladders[cellNum] > cellNum) {
            cell.classList.add("ladder-start"); // move up
          } else {
            cell.classList.add("ladder-down"); // move down
          }
        }

        rowDiv.appendChild(cell);
      }

      gameBoard.appendChild(rowDiv);
    }

    // Place players on starting position
    updatePlayerPosition(1);
    updatePlayerPosition(2);
  }

  // Update player position on board
  function updatePlayerPosition(player) {
    // Remove player from previous position
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove(`player${player}`);
    });

    // Add player to new position if on board
    if (playerPositions[player] <= 100) {
      const cell = document.getElementById(`cell-${playerPositions[player]}`);
      if (cell) {
        cell.classList.add(`player${player}`);
      }
    }

    // Update player info display
    const playerElement = document.getElementById(`player${player}`);
    playerElement.querySelector(
      ".player-position"
    ).textContent = `Position: ${playerPositions[player]}`;
  }

  // Roll the dice
  function rollDice() {
    if (!gameActive) return;

    // Play dice sound effect
    diceSound.currentTime = 0;
    diceSound.play();

    // Disable button during roll
    rollBtn.disabled = true;

    // Add rolling animation
    dice.classList.add("rolling");

    // Simulate dice roll
    let rolls = 0;
    const maxRolls = 8;
    const rollInterval = setInterval(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      dice.textContent = value;
      rolls++;

      if (rolls >= maxRolls) {
        clearInterval(rollInterval);
        dice.classList.remove("rolling");

        // Final dice value
        const diceValue = Math.floor(Math.random() * 6) + 1;
        dice.textContent = diceValue;

        // Handle rolling logic for 6s
        if (diceValue === 6) {
          consecutiveSixes[currentPlayer]++;
          if (consecutiveSixes[currentPlayer] < 2) {
            movePlayer(currentPlayer, diceValue, false);
            // Allow rolling again
            setTimeout(() => {
              if (gameActive) rollBtn.disabled = false;
              gameStatus.textContent = `${playerNames[currentPlayer]} rolled a 6! Roll again (Consecutive 6s: ${consecutiveSixes[currentPlayer]})`;
            }, 1000);
            return;
          } else {
            // Two consecutive 6s: lose turn, do not move
            gameStatus.textContent = `${playerNames[currentPlayer]} rolled two 6s in a row! Turn lost.`;
            consecutiveSixes[currentPlayer] = 0;
            setTimeout(() => {
              switchPlayer();
              if (gameActive) rollBtn.disabled = false;
            }, 1500);
            return;
          }
        } else {
          // Reset consecutive sixes
          consecutiveSixes[currentPlayer] = 0;
          movePlayer(currentPlayer, diceValue, true);
          setTimeout(() => {
            if (gameActive) rollBtn.disabled = false;
          }, 1000);
        }
      }
    }, 150);
  }

  // Move player based on dice roll
  // If switchAfterMove is false, do not switch player (for extra rolls)
  function movePlayer(player, diceValue, switchAfterMove = true) {
    gameStatus.textContent = `${playerNames[player]} rolled a ${diceValue}!`;

    // Calculate new position
    let newPosition = playerPositions[player] + diceValue;

    // Check if player wins
    if (newPosition === 100) {
      playerPositions[player] = newPosition;
      updatePlayerPosition(player);
      endGame(player);
      return;
    }

    // Player can't move beyond 100
    if (newPosition > 100) {
      gameStatus.textContent = `${playerNames[player]} needs exactly ${
        100 - playerPositions[player]
      } to win!`;
      if (switchAfterMove) switchPlayer();
      return;
    }

    playerPositions[player] = newPosition;

    // Check for snake or ladder
    if (snakes[newPosition]) {
      gameStatus.textContent += ` Oh no! Snake bite! Sliding down to ${snakes[newPosition]}.`;
      playerPositions[player] = snakes[newPosition];
    } else if (ladders[newPosition]) {
      if (ladders[newPosition] > newPosition) {
        gameStatus.textContent += ` Yay! Ladder climb! Jumping up to ${ladders[newPosition]}.`;
      } else {
        gameStatus.textContent += ` Oops! Ladder slide! Moving down to ${ladders[newPosition]}.`;
      }
      playerPositions[player] = ladders[newPosition];
    }

    // Update position on board
    updatePlayerPosition(player);

    // Switch player after a delay if needed
    if (switchAfterMove) {
      setTimeout(switchPlayer, 1500);
    }
  }

  // Switch to next player
  function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;

    // Update UI
    player1Info.classList.toggle("active", currentPlayer === 1);
    player2Info.classList.toggle("active", currentPlayer === 2);

    gameStatus.textContent = `${playerNames[currentPlayer]}'s turn. Roll the dice!`;
  }

  // End the game
  function endGame(winningPlayer) {
    gameActive = false;
    winText.textContent = `${playerNames[winningPlayer]} Wins!`;
    winAnimation.classList.add("show");
  }

  // Reset the game
  function resetGame() {
    playerPositions[1] = 1;
    playerPositions[2] = 1;
    currentPlayer = 1;
    gameActive = true;

    consecutiveSixes[1] = 0;
    consecutiveSixes[2] = 0;

    // Update UI
    updatePlayerPosition(1);
    updatePlayerPosition(2);

    player1Info.classList.add("active");
    player2Info.classList.remove("active");

    gameStatus.textContent = "Player 1's turn. Roll the dice!";
    dice.textContent = "6";
    winAnimation.classList.remove("show");
    rollBtn.disabled = false;
  }

  // Add backsound audio element and music icon
  const backsound = document.createElement("audio");
  backsound.id = "backsound";
  backsound.src = "music/backsound.mp3";
  backsound.loop = true;
  backsound.volume = 0.3;
  document.body.appendChild(backsound);

  const musicIcon = document.createElement("div");
  musicIcon.id = "musicIcon";
  musicIcon.style.position = "fixed";
  musicIcon.style.top = "20px";
  musicIcon.style.right = "20px";
  musicIcon.style.zIndex = "999";
  musicIcon.style.width = "40px";
  musicIcon.style.height = "40px";
  musicIcon.style.background = "rgba(0,0,0,0.5)";
  musicIcon.style.borderRadius = "50%";
  musicIcon.style.display = "flex";
  musicIcon.style.alignItems = "center";
  musicIcon.style.justifyContent = "center";
  musicIcon.style.cursor = "pointer";
  musicIcon.innerHTML =
    '<svg width="24" height="24" fill="#ffd700" viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';
  document.body.appendChild(musicIcon);

  // Add volume control for music
  const volumeControl = document.createElement("input");
  volumeControl.type = "range";
  volumeControl.min = "0";
  volumeControl.max = "1";
  volumeControl.step = "0.01";
  volumeControl.value = backsound.volume;
  volumeControl.style.position = "fixed";
  volumeControl.style.top = "70px";
  volumeControl.style.right = "20px";
  volumeControl.style.zIndex = "999";
  volumeControl.style.width = "100px";
  volumeControl.style.background = "rgba(0,0,0,0.5)";
  volumeControl.style.borderRadius = "5px";
  document.body.appendChild(volumeControl);

  volumeControl.addEventListener("input", () => {
    backsound.volume = volumeControl.value;
  });

  // Play music on load
  backsound.play();

  // Toggle music on icon click
  let musicPlaying = true;
  musicIcon.addEventListener("click", () => {
    if (musicPlaying) {
      backsound.pause();
      musicIcon.innerHTML =
        '<svg width="24" height="24" fill="#ffd700" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    } else {
      backsound.play();
      musicIcon.innerHTML =
        '<svg width="24" height="24" fill="#ffd700" viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';
    }
    musicPlaying = !musicPlaying;
  });

  // Add dice sound effect
  const diceSound = document.createElement("audio");
  diceSound.id = "diceSound";
  diceSound.src = "music/dice.mp3";
  diceSound.preload = "auto";
  document.body.appendChild(diceSound);

  // Event listeners
  rollBtn.addEventListener("click", rollDice);
  resetBtn.addEventListener("click", resetGame);
  playAgainBtn.addEventListener("click", resetGame);

  // Initialize the game
  initializeBoard();
});
