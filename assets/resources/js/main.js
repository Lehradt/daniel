    const rules = document.getElementById("rules");
    const mark = document.getElementById("mark");
    mark.addEventListener("click", () => {
      if (rules.style.display === "flex") {
        rules.style.display = "none";
      } else {
        rules.style.display = "flex";
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && rules.style.display === "flex") {
        rules.style.display = "none";
      }
    });

    // DOM-Elemente
    const setup = document.getElementById("setup");
    const handover = document.getElementById("handover");
    const roleReveal = document.getElementById("roleReveal");
    const gameplay = document.getElementById("gameplay");

    const playerCountInput = document.getElementById("playerCount");
    const startButton = document.getElementById("startButton");
    const handoverNext = document.getElementById("handoverNext");
    const revealNext = document.getElementById("revealNext");
    const gameNext = document.getElementById("gameNext");
    const playerCountDisplay = document.getElementById("playerCountDisplay");

    const roleName = document.getElementById("roleName");
    const roleDescription = document.getElementById("roleDescription");
    const playerNameInput = document.getElementById("playerNameInput");
    const gameStatus = document.getElementById("gameStatus");
    const roleActionContainer = document.getElementById("roleActionContainer");

    let players = [];
    let currentPlayerIndex = 0;    
    let currentTurnPlayerIndex = 0; 
    let roundCount = 1;
    let danielAlive = true;
    let gameOver = false;
    let lose = false;


    let protectedPlayer = null;    
    let interrogatedPlayer = null; 
    let interrogatedRole = null;   
    let skippedPlayer = null;      
    let betrayalTarget = null;     
    let danielHidingFrom = null;   

    let meetingPhase = false; 

    playerCountInput.addEventListener("input", () => {
      playerCountDisplay.textContent = playerCountInput.value;
    });

    startButton.addEventListener("click", () => {
      let count = parseInt(playerCountInput.value);
      if (isNaN(count) || count < 4 || count > 6) return;

      players = [];
      currentPlayerIndex = 0;
      currentTurnPlayerIndex = 0;
      roundCount = 1;
      danielAlive = true;
      gameOver = false;
      protectedPlayer = null;
      interrogatedPlayer = null;
      interrogatedRole = null;
      skippedPlayer = null;
      betrayalTarget = null;
      danielHidingFrom = null;
      meetingPhase = false;

      let rolePool = ["Daniel", "König", "Engel", "Verräter"];
      if (count === 5) rolePool.push("Engel");
      if (count === 6) {
        rolePool.push("Engel");
        rolePool.push("Verräter");
      }

      rolePool = shuffle(rolePool);

      for (let i = 0; i < count; i++) {
        players.push({
          name: `Spieler ${i + 1}`,
          role: rolePool[i],
          alive: true,
        });
      }

      setup.classList.remove("active");
      handover.classList.add("active");
    });

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    handoverNext.addEventListener("click", () => {
      handover.classList.remove("active");
      roleReveal.classList.add("active");
      showRole(currentPlayerIndex);
    });

    function showRole(index) {
      const player = players[index];
      roleName.textContent = player.role;
      roleDescription.textContent = getRoleDescription(player.role);
      playerNameInput.value = "";
      playerNameInput.style.display = "block";
      playerNameInput.focus();
    }

    revealNext.addEventListener("click", () => {
      const inputName = playerNameInput.value.trim();
      if (!inputName) {
        alert("Bitte gib deinen Namen ein.");
        return;
      }
      players[currentPlayerIndex].name = inputName;
      playerNameInput.style.display = "none";

      currentPlayerIndex++;
      roleReveal.classList.remove("active");

      if (currentPlayerIndex < players.length) {
        handover.classList.add("active");
      } else {
        gameplay.classList.add("active");
        currentTurnPlayerIndex = 0;
        startRound();
      }
    });

    function getRoleDescription(role) {
      switch (role) {
        case "Daniel":
          return "Verstecke dich jede Runde vor den Verrätern. Überlebe bis Runde 4 oder wirf beide Verräter in die Grube!";
        case "König":
          return "Verhöre einen Spieler pro Nacht und entscheide, ob du Daniel helfen oder entlarven willst.";
        case "Engel":
          return "Beschütze jede Runde einen Spieler – du weißt nicht, wer Daniel ist.";
        case "Verräter":
          return "Finde heraus, wer Daniel ist, und wirf ihn in die Löwengrube!";
      }
      return "";
    }

    function startRound() {
      if (gameOver) return;

      updateGameStatus();

      protectedPlayer = null;
      interrogatedPlayer = null;
      interrogatedRole = null;
      skippedPlayer = null;
      betrayalTarget = null;
      danielHidingFrom = null;

      meetingPhase = false;
      currentTurnPlayerIndex = 0;
      showPlayerTurn();
    }

    function updateGameStatus() {
      const container = document.getElementById("roleActionContainer");

      if (!danielAlive) {
        gameStatus.textContent = `Runde ${roundCount} | Daniel wurde in die Löwengrube geworfen. Spiel beendet.`;
        gameOver = true;
        container.innerHTML = "";
        gameNext.disabled = false;
        gameNext.textContent = "Nächstes Spiel";
        return;
      }

      const verräterAlive = players.some(p => p.alive && p.role === "Verräter");
      if (!verräterAlive) {
        gameStatus.textContent = `Runde ${roundCount} | Alle Verräter wurden rausgeworfen. Daniel gewinnt!`;
        gameOver = true;
        container.innerHTML = "";
        gameNext.disabled = false;
        gameNext.textContent = "Nächstes Spiel";
        return;
      }

      if (roundCount > 4) {
        gameStatus.textContent = `Runde ${roundCount} | Daniel hat alle Runden überlebt. Daniel gewinnt!`;
        gameOver = true;
        container.innerHTML = "";
        gameNext.disabled = false;
        gameNext.textContent = "Nächstes Spiel";
        return;
      }
      if (lose) {
        gameStatus.textContent = `Runde ${roundCount} | Die Verräter haben eine falsche Person in die Grube geworfen. Daniel gewinnt!`;
        gameOver = true;
        container.innerHTML = "";
        gameNext.disabled = false;
        gameNext.textContent = "Nächstes Spiel";
        return;
      }


      gameStatus.textContent = `Runde ${roundCount} | Daniel ist ${danielAlive ? "am Leben" : "rausgeworfen"}`;
    }


    function getPlayerOrder() {

      const engel = players.filter(p => p.alive && p.role === "Engel");
      const koenig = players.filter(p => p.alive && p.role === "König");
      const verraeter = players.filter(p => p.alive && p.role === "Verräter");
      const daniel = players.filter(p => p.alive && p.role === "Daniel");

      return [...engel, ...koenig, ...verraeter, ...daniel];
    }

    function showPlayerTurn() {
      if (gameOver) return;

      if (meetingPhase) {
        showMeetingPhase();
        return;
      }

      let order = getPlayerOrder();

      if (order.length === 0) {
        alert("Keine Spieler mehr am Leben. Spiel beendet.");
        gameOver = true;
        updateGameStatus();
        return;
      }

      if (currentTurnPlayerIndex >= order.length) {

        meetingPhase = true;
        showMeetingPhase();
        return;
      }

      const player = order[currentTurnPlayerIndex];

      if (!player.alive) {
        currentTurnPlayerIndex++;
        showPlayerTurn();
        return;
      }

      if (skippedPlayer && skippedPlayer.name === player.name) {
        alert(`${skippedPlayer.name} wurde vom König ausgesetzt und überspringt diesen Zug.`);
        currentTurnPlayerIndex++;
        showPlayerTurn();
        return;
      }

      roleActionContainer.innerHTML = "";
      const headline = document.createElement("h3");
      headline.textContent = `Aktion für ${player.name} (${player.role})`;
      roleActionContainer.appendChild(headline);

      switch (player.role) {
        case "Daniel":
          const label = document.createElement("label");
          label.textContent = "Vor wem möchtest du dich verstecken?";
          const select = document.createElement("select");
          select.id = "hideSelect";
          players.filter(p => p.name !== player.name && p.alive).forEach(p => {
            const option = document.createElement("option");
            option.value = p.name;
            option.textContent = p.name;
            select.appendChild(option);
          });
          roleActionContainer.appendChild(label);
          roleActionContainer.appendChild(document.createElement("br"));
          roleActionContainer.appendChild(select);
          break;

        case "König":
          const interrogateLabel = document.createElement("label");
          interrogateLabel.textContent = "Wen willst du verhören?";
          const interrogateSelect = document.createElement("select");
          interrogateSelect.id = "interrogateSelect";
          players.filter(p => p.name !== player.name && p.alive).forEach(p => {
            const option = document.createElement("option");
            option.value = p.name;
            option.textContent = p.name;
            interrogateSelect.appendChild(option);
          });
          roleActionContainer.appendChild(interrogateLabel);
          roleActionContainer.appendChild(document.createElement("br"));
          roleActionContainer.appendChild(interrogateSelect);
          break;

        case "Engel":
          const protectLabel = document.createElement("label");
          protectLabel.textContent = "Wen möchtest du beschützen?";
          const protectSelect = document.createElement("select");
          protectSelect.id = "protectSelect";
          players.filter(p => p.alive).forEach(p => {
            const option = document.createElement("option");
            option.value = p.name;
            option.textContent = p.name;
            protectSelect.appendChild(option);
          });
          roleActionContainer.appendChild(protectLabel);
          roleActionContainer.appendChild(document.createElement("br"));
          roleActionContainer.appendChild(protectSelect);
          break;

          case "Verräter":
          const betrayLabel = document.createElement("label");
          betrayLabel.textContent = "Wen möchtest du in die Grube werfen?";
          const betraySelect = document.createElement("select");
          betraySelect.id = "betraySelect";

          const noOneOption = document.createElement("option");
          noOneOption.value = "";
          noOneOption.textContent = "Niemanden auswählen";
          betraySelect.appendChild(noOneOption);

          players
            .filter(p => p.alive && p.role !== "Verräter" && p.name !== player.name)
            .forEach(p => {
              const option = document.createElement("option");
              option.value = p.name;
              option.textContent = p.name;
              betraySelect.appendChild(option);
            });

          roleActionContainer.appendChild(betrayLabel);
          roleActionContainer.appendChild(document.createElement("br"));
          roleActionContainer.appendChild(betraySelect);
          break;
      }
      gameNext.disabled = false;
    }

    function showMeetingPhase() {
      roleActionContainer.innerHTML = "";
      const headline = document.createElement("h3");
      headline.textContent = "Meeting: Wähle einen Spieler zum Rauswurf aus";
      roleActionContainer.appendChild(headline);

      const meetingSelect = document.createElement("select");
      meetingSelect.id = "meetingSelect";

      players.filter(p => p.alive).forEach(p => {
        const option = document.createElement("option");
        option.value = p.name;
        option.textContent = p.name;
        meetingSelect.appendChild(option);
      });

      roleActionContainer.appendChild(meetingSelect);
      gameNext.disabled = false;
    }

    gameNext.addEventListener("click", () => {
      if (gameOver) {
        location.reload();
        return;
      }

      if (meetingPhase) {

        const meetingSelect = document.getElementById("meetingSelect");
        if (!meetingSelect) return;

        const nameToRemove = meetingSelect.value;
        const playerToRemove = players.find(p => p.name === nameToRemove);

        if (playerToRemove) {
          playerToRemove.alive = false;
          alert(`${playerToRemove.name} wurde beim Meeting rausgeworfen!`);

          if (playerToRemove.role === "Daniel") {
            danielAlive = false;
            alert("Daniel wurde rausgeworfen! Verräter gewinnen!");
            gameOver = true;
            updateGameStatus();
            return;
          }


          const verräterAlive = players.some(p => p.alive && p.role === "Verräter");
          if (!verräterAlive) {
            alert("Alle Verräter sind rausgeworfen! Daniel gewinnt!");
            gameOver = true;
            updateGameStatus();
            return; 
          }
        }

        meetingPhase = false;
        roundCount++;
        updateGameStatus();

        if (gameOver) {
          return;
        }

        startRound();
        return;
      }


      let order = getPlayerOrder();
      if (currentTurnPlayerIndex >= order.length) return;

      const player = order[currentTurnPlayerIndex];

      switch (player.role) {
        case "Daniel":
          const hideSelect = document.getElementById("hideSelect");
          if (hideSelect) danielHidingFrom = hideSelect.value;
          break;

        case "König":
          const interrogateSelect = document.getElementById("interrogateSelect");
          if (interrogateSelect) {
            const name = interrogateSelect.value;
            interrogatedPlayer = players.find(p => p.name === name);
            if (interrogatedPlayer) {
              interrogatedRole = interrogatedPlayer.role;
              alert(`Der König verhört ${interrogatedPlayer.name}. Rolle: ${interrogatedRole}`);
            }
          }
          break;

        case "Engel":
          const protectSelect = document.getElementById("protectSelect");
          if (protectSelect) {
            const name = protectSelect.value;
            protectedPlayer = players.find(p => p.name === name);
            alert(`Der Engel schützt ${protectedPlayer.name}`);
          }
          break;

          
          case "Verräter":
          const betraySelect = document.getElementById("betraySelect");
          if (betraySelect) {
            const name = betraySelect.value;

            if (!name) {
              alert("Der Verräter hat niemanden in die Grube geworfen.");
              break;
            }

            betrayalTarget = players.find(p => p.name === name);
            if (betrayalTarget && betrayalTarget.alive) {
              if (protectedPlayer && betrayalTarget.name === protectedPlayer.name) {
                alert(`${betrayalTarget.name} wurde vom Engel geschützt und entkommt der Grube!`);
              } else {
                betrayalTarget.alive = false;
                alert(`${betrayalTarget.name} wurde in die Grube geworfen!`);

                if (betrayalTarget.role === "Daniel") {
                  danielAlive = false;
                  alert("Daniel ist raus! Verräter gewinnen!");
                  gameOver = true;
                  updateGameStatus();
                } else {
                  alert(`${betrayalTarget.name} war nicht Daniel. Daniel gewinnt!`);
                  gameOver = true;
                  lose = true;
                  updateGameStatus();
                }
              }
            }
          }
          break;

      }

      currentTurnPlayerIndex++;
      showPlayerTurn();
    });
      const slider = document.getElementById("playerCount");
      const clickSound = new Audio("https://lehradt.github.io/daniel/assets/resources/audio/playerCount.mp3");

      slider.addEventListener("input", () => {
        clickSound.currentTime = 0; 
        clickSound.play();
      });

    const backgroundMusic = document.getElementById("backgroundMusic");

    startButton.addEventListener("click", () => {
      backgroundMusic.volume = 0.3;
      backgroundMusic.loop = true;
      backgroundMusic.play();
    });
