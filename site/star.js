(function () {
  // ── State ──────────────────────────────────────────────────────
  var prompts = [];
  var index = 0;
  var currentCategory = "all";
  var fieldsVisible = false;

  // ── DOM refs ───────────────────────────────────────────────────
  var promptEl = document.getElementById("star-prompt");
  var positionEl = document.getElementById("q-position");
  var answeredEl = document.getElementById("answered-count");
  var progressFill = document.querySelector(".progress-fill");
  var starFields = document.getElementById("star-fields");
  var btnStartWriting = document.getElementById("btn-start-writing");
  var btnShowPrevious = document.getElementById("btn-show-previous");
  var inputS = document.getElementById("star-situation");
  var inputT = document.getElementById("star-task");
  var inputA = document.getElementById("star-action");
  var inputR = document.getElementById("star-result");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");
  var btnAddPrompt = document.getElementById("btn-add-prompt");
  var modal = document.getElementById("add-prompt-modal");
  var btnSavePrompt = document.getElementById("btn-save-prompt");
  var btnCancelPrompt = document.getElementById("btn-cancel-prompt");

  // ── Helpers ────────────────────────────────────────────────────
  function getAllPrompts() {
    var custom = Storage.get("star-custom") || [];
    return STAR_QUESTIONS.concat(custom);
  }

  function buildPrompts() {
    var all = getAllPrompts();
    prompts = currentCategory === "all"
      ? all.slice()
      : all.filter(function (q) { return q.category === currentCategory; });
    index = 0;
  }

  function saveCurrentAnswer() {
    var q = prompts[index];
    if (!q) return;
    var s = inputS.value.trim();
    var t = inputT.value.trim();
    var a = inputA.value.trim();
    var r = inputR.value.trim();
    var allAnswers = Storage.get("star-answers") || {};
    if (s || t || a || r) {
      allAnswers[q.id] = { s: s, t: t, a: a, r: r, updatedAt: new Date().toISOString() };
    } else {
      delete allAnswers[q.id];
    }
    Storage.set("star-answers", allAnswers);
  }

  function getSavedAnswer(id) {
    var allAnswers = Storage.get("star-answers") || {};
    return allAnswers[id] || null;
  }

  function countAnswered() {
    var allAnswers = Storage.get("star-answers") || {};
    var count = 0;
    for (var i = 0; i < prompts.length; i++) {
      if (allAnswers[prompts[i].id]) count++;
    }
    return count;
  }

  function hideFields() {
    starFields.classList.remove("visible");
    fieldsVisible = false;
    inputS.value = "";
    inputT.value = "";
    inputA.value = "";
    inputR.value = "";
  }

  function showFields() {
    starFields.classList.add("visible");
    fieldsVisible = true;
  }

  function render() {
    if (prompts.length === 0) {
      promptEl.textContent = "No prompts in this category.";
      positionEl.textContent = "0 / 0";
      answeredEl.textContent = "0 answered";
      progressFill.style.width = "0%";
      hideFields();
      btnStartWriting.style.display = "none";
      btnShowPrevious.style.display = "none";
      return;
    }

    var q = prompts[index];
    promptEl.textContent = q.prompt;
    positionEl.textContent = (index + 1) + " / " + prompts.length;
    var answered = countAnswered();
    answeredEl.textContent = answered + " answered";
    progressFill.style.width = ((index + 1) / prompts.length * 100) + "%";

    // Reset fields
    hideFields();

    var saved = getSavedAnswer(q.id);
    btnStartWriting.style.display = "";
    btnStartWriting.textContent = "Start Writing";
    btnShowPrevious.style.display = saved ? "" : "none";
  }

  // ── Navigation ─────────────────────────────────────────────────
  function goNext() {
    if (prompts.length === 0) return;
    if (fieldsVisible) saveCurrentAnswer();
    index = index < prompts.length - 1 ? index + 1 : 0;
    render();
  }

  function goPrev() {
    if (prompts.length === 0) return;
    if (fieldsVisible) saveCurrentAnswer();
    index = index > 0 ? index - 1 : prompts.length - 1;
    render();
  }

  // ── Events ─────────────────────────────────────────────────────
  btnNext.addEventListener("click", goNext);
  btnPrev.addEventListener("click", goPrev);

  btnStartWriting.addEventListener("click", function () {
    showFields();
    btnStartWriting.style.display = "none";
    inputS.focus();
  });

  btnShowPrevious.addEventListener("click", function () {
    var q = prompts[index];
    if (!q) return;
    var saved = getSavedAnswer(q.id);
    if (!saved) return;
    if (!fieldsVisible) showFields();
    inputS.value = saved.s || "";
    inputT.value = saved.t || "";
    inputA.value = saved.a || "";
    inputR.value = saved.r || "";
    btnShowPrevious.style.display = "none";
    btnStartWriting.style.display = "none";
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      if (fieldsVisible) saveCurrentAnswer();
      buildPrompts();
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

  // ── Add Custom Prompt Modal ────────────────────────────────────
  btnAddPrompt.addEventListener("click", function () {
    modal.classList.add("visible");
  });

  btnCancelPrompt.addEventListener("click", function () {
    modal.classList.remove("visible");
    document.getElementById("new-prompt-text").value = "";
  });

  btnSavePrompt.addEventListener("click", function () {
    var text = document.getElementById("new-prompt-text").value.trim();
    var cat = document.getElementById("new-prompt-category").value;
    if (!text) return;
    var custom = Storage.get("star-custom") || [];
    custom.push({
      id: "custom-" + Date.now(),
      category: cat,
      prompt: text
    });
    Storage.set("star-custom", custom);
    modal.classList.remove("visible");
    document.getElementById("new-prompt-text").value = "";
    if (fieldsVisible) saveCurrentAnswer();
    buildPrompts();
    render();
  });

  // Close modal on overlay click
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("visible");
      document.getElementById("new-prompt-text").value = "";
    }
  });

  // ── Init ───────────────────────────────────────────────────────
  buildPrompts();
  render();
})();
