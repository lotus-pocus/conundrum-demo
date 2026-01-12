(() => {
  const cfg = window.CONUNDRUM_CONFIG;

  // ---- sanity checks ----
  const rounds = window.CONUNDRUM_ROUNDS;
  if (!Array.isArray(rounds) || rounds.length === 0) {
    throw new Error(
      "CONUNDRUM_ROUNDS not found. Did you include js/rounds.js before js/main.js?"
    );
  }

  // Elements
  const gameCard = UI.el("gameCard");
  const questionEl = UI.el("question");
  const subEl = UI.el("sub");
  const answerRowsEl = UI.el("answerRows");
  const statusEl = UI.el("status");
  const guessInput = UI.el("guess");
  const submitBtn = UI.el("submitBtn");

  const clueEls = [UI.el("clue1"), UI.el("clue2"), UI.el("clue3")];

  // Timer ring
  const timerWrap = UI.el("timerWrap");
  const ringEl = UI.el("ringProgress");
  const ring = UI.makeRing(ringEl, 38);

  // Confetti
  const confetti = Confetti.create(
    gameCard,
    UI.el("confettiCanvas"),
    cfg.confettiColors
  );

  // State
  let tiles = [];
  let indexMap = [];
  let revealedCount = 0;
  let finished = false;
  let loopId = null;

  let roundIndex = Number.isFinite(cfg.roundIndex) ? cfg.roundIndex : 0;
  let round = null;

  function stopLoop() {
    if (loopId) clearInterval(loopId);
    loopId = null;
  }

  function resetState() {
    stopLoop();
    revealedCount = 0;
    finished = false;
    ring.setProgress(0);
    timerWrap.classList.remove("on");
    statusEl.textContent = "Round starting…";
    guessInput.value = "";
    // Remove title/clue reveal classes so the animation can replay
    questionEl.classList.remove("show");
    subEl.classList.remove("show");
    clueEls.forEach((el) => el.classList.remove("revealed"));
  }

  function autoRevealOrder(answer) {
    // Simple left-to-right reveal for all non-space characters
    const order = [];
    for (let i = 0; i < answer.length; i++) {
      if (answer[i] !== " ") order.push(i);
    }
    return order;
  }

  function loadRound(i) {
    roundIndex = (i + rounds.length) % rounds.length;
    round = rounds[roundIndex];

    if (!round || typeof round.answer !== "string") {
      throw new Error(
        `Round at index ${roundIndex} is missing a valid 'answer' string.`
      );
    }

    // Update title + subtitle
    questionEl.textContent = round.title ?? "What movie is this?";
    subEl.textContent =
      round.subtitle ?? "Watch the clues… then race the tiles.";

    // Update clue images
    if (!Array.isArray(round.clues) || round.clues.length < 3) {
      throw new Error(
        `Round '${round.id ?? roundIndex}' must have 'clues' array with 3 image paths.`
      );
    }
    clueEls[0].src = round.clues[0];
    clueEls[1].src = round.clues[1];
    clueEls[2].src = round.clues[2];

    // Rebuild tiles + index map
    tiles = UI.buildTiles(round.answer, answerRowsEl);
    indexMap = UI.buildIndexMap(round.answer);

    // Reveal order (use round's or generate)
    round._revealOrder =
      Array.isArray(round.revealOrder) && round.revealOrder.length
        ? round.revealOrder
        : autoRevealOrder(round.answer);
  }

  function revealTileByStringIndex(strIndex) {
    const obj = tiles[indexMap[strIndex]];
    if (!obj) return;
    obj.span.textContent = round.answer[strIndex];
    obj.tile.classList.add("revealed");
  }

  function revealAllLetters() {
    for (let i = 0; i < round.answer.length; i++) {
      if (round.answer[i] === " ") continue;
      revealTileByStringIndex(i);
    }
    revealedCount = round._revealOrder.length;
    ring.setProgress(1);
    timerWrap.classList.add("on");
  }

  function end(won) {
    if (finished) return;
    finished = true;
    stopLoop();

    revealAllLetters();
    tiles.forEach((o) => o.tile.classList.add("final"));
    statusEl.textContent = won
      ? "Answered early — maximum points!"
      : "Time’s up!";
    confetti.launch(() => {
      startRound(roundIndex + 1);
    });
  }

  function submitAnswer() {
    if (finished) return;
    const guess = guessInput.value.trim().toUpperCase();
    if (guess === round.answer) {
      revealAllLetters();
      statusEl.textContent = "Correct! 🎉";
      setTimeout(() => end(true), cfg.endFlashDelayMs);
    } else {
      statusEl.textContent = "Not quite… keep guessing!";
    }
  }

  // Enter-to-submit + button click
  guessInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  });
  submitBtn.addEventListener("click", submitAnswer);

  // Quick pitch controls: 1/2/3 jumps, N next
  window.addEventListener("keydown", (e) => {
    if (e.key === "n" || e.key === "N") {
      startRound(roundIndex + 1);
    }
    if (e.key === "1") startRound(0);
    if (e.key === "2") startRound(1);
    if (e.key === "3") startRound(2);
  });

  function startRound(indexToStart) {
    resetState();
    loadRound(indexToStart);

    // Title show
    setTimeout(() => {
      questionEl.classList.add("show");
      subEl.classList.add("show");
    }, cfg.preTitlePauseMs);

    // Clues show
    const clueStartMs = cfg.preTitlePauseMs + cfg.postTitlePauseMs;
    clueEls.forEach((el, i) => {
      setTimeout(
        () => el.classList.add("revealed"),
        clueStartMs + i * cfg.clueBeatMs
      );
    });

    // Tiles start
    const tilesStartMs =
      clueStartMs + 2 * cfg.clueBeatMs + cfg.pauseAfterCluesMs;

    setTimeout(() => {
      timerWrap.classList.add("on");
      ring.setProgress(0);

      const burst = Number.isFinite(cfg.tileBurst) ? cfg.tileBurst : 1;

      loopId = setInterval(() => {
        if (finished) return;

        if (revealedCount < round._revealOrder.length) {
          for (let b = 0; b < burst; b++) {
            if (revealedCount >= round._revealOrder.length) break;
            const idx = round._revealOrder[revealedCount];
            revealTileByStringIndex(idx);
            revealedCount++;
          }
          ring.setProgress(revealedCount / round._revealOrder.length);
        } else {
          ring.setProgress(1);
          setTimeout(() => end(false), cfg.endFlashDelayMs);
          stopLoop();
        }
      }, cfg.tileBeatMs);
    }, tilesStartMs);
  }

  // Start initial round
  startRound(roundIndex);
})();
