(function () {
  // ── State ──────────────────────────────────────────────────────
  var questions = [];
  var index = 0;
  var currentRound = "all";
  var timerInterval = null;
  var timerSeconds = 180;
  var timerRunning = false;

  // ── DOM refs ───────────────────────────────────────────────────
  var questionEl = document.getElementById("mock-question");
  var positionEl = document.getElementById("q-position");
  var progressFill = document.querySelector(".progress-fill");
  var answerInput = document.getElementById("answer-input");
  var btnSave = document.getElementById("btn-save");
  var saveConfirm = document.getElementById("save-confirm");
  var btnShowAnswer = document.getElementById("btn-show-answer");
  var strongAnswerEl = document.getElementById("strong-answer");
  var timerDisplay = document.getElementById("timer-display");
  var btnTimerStart = document.getElementById("btn-timer-start");
  var btnTimerReset = document.getElementById("btn-timer-reset");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");

  // ── Helpers ────────────────────────────────────────────────────
  function buildQuestions() {
    questions = currentRound === "all"
      ? MOCK_QUESTIONS.slice()
      : MOCK_QUESTIONS.filter(function (q) { return q.round === currentRound; });
    index = 0;
  }

  function saveAnswer() {
    var q = questions[index];
    if (!q) return;
    var text = answerInput.value.trim();
    var allAnswers = Storage.get("mock-answers") || {};
    if (text) {
      allAnswers[q.id] = { answer: text, updatedAt: new Date().toISOString() };
    } else {
      delete allAnswers[q.id];
    }
    Storage.set("mock-answers", allAnswers);
  }

  function loadAnswer() {
    var q = questions[index];
    if (!q) return;
    var allAnswers = Storage.get("mock-answers") || {};
    var saved = allAnswers[q.id];
    answerInput.value = saved ? saved.answer : "";
  }

  function showSaveConfirm() {
    saveConfirm.classList.add("visible");
    setTimeout(function () { saveConfirm.classList.remove("visible"); }, 1500);
  }

  function render() {
    if (questions.length === 0) {
      questionEl.textContent = "No questions in this round.";
      positionEl.textContent = "0 / 0";
      progressFill.style.width = "0%";
      answerInput.value = "";
      strongAnswerEl.innerHTML = "";
      strongAnswerEl.classList.remove("visible");
      btnShowAnswer.textContent = "Show Strong Answer";
      return;
    }

    var q = questions[index];
    questionEl.textContent = q.question;
    positionEl.textContent = (index + 1) + " / " + questions.length;
    progressFill.style.width = ((index + 1) / questions.length * 100) + "%";

    loadAnswer();

    // Reset strong answer visibility
    strongAnswerEl.innerHTML = "";
    strongAnswerEl.classList.remove("visible");
    btnShowAnswer.textContent = "Show Strong Answer";
  }

  // ── Timer ──────────────────────────────────────────────────────
  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);
    if (timerSeconds <= 0) {
      timerDisplay.classList.add("expired");
    } else {
      timerDisplay.classList.remove("expired");
    }
  }

  function startTimer() {
    if (timerRunning) {
      // Pause
      clearInterval(timerInterval);
      timerRunning = false;
      btnTimerStart.textContent = "Resume";
      return;
    }
    timerRunning = true;
    btnTimerStart.textContent = "Pause";
    timerInterval = setInterval(function () {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        btnTimerStart.textContent = "Start";
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 180;
    btnTimerStart.textContent = "Start";
    updateTimerDisplay();
  }

  // ── Navigation ─────────────────────────────────────────────────
  function goNext() {
    if (questions.length === 0) return;
    saveAnswer();
    index = index < questions.length - 1 ? index + 1 : 0;
    render();
  }

  function goPrev() {
    if (questions.length === 0) return;
    saveAnswer();
    index = index > 0 ? index - 1 : questions.length - 1;
    render();
  }

  // ── Events ─────────────────────────────────────────────────────
  btnNext.addEventListener("click", goNext);
  btnPrev.addEventListener("click", goPrev);

  btnSave.addEventListener("click", function () {
    saveAnswer();
    showSaveConfirm();
  });

  answerInput.addEventListener("blur", function () {
    saveAnswer();
  });

  btnShowAnswer.addEventListener("click", function () {
    var q = questions[index];
    if (!q) return;
    if (strongAnswerEl.classList.contains("visible")) {
      strongAnswerEl.classList.remove("visible");
      strongAnswerEl.innerHTML = "";
      btnShowAnswer.textContent = "Show Strong Answer";
    } else {
      strongAnswerEl.innerHTML = q.strongAnswer;
      strongAnswerEl.classList.add("visible");
      btnShowAnswer.textContent = "Hide Strong Answer";
    }
  });

  btnTimerStart.addEventListener("click", startTimer);
  btnTimerReset.addEventListener("click", resetTimer);

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentRound = btn.dataset.round;
      saveAnswer();
      buildQuestions();
      resetTimer();
      render();
    });
  });

  // Keyboard shortcuts (disabled when typing)
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight") {
      goNext();
    } else if (e.key === "ArrowLeft") {
      goPrev();
    }
  });

  // ── Init ───────────────────────────────────────────────────────
  buildQuestions();
  updateTimerDisplay();
  render();
})();
