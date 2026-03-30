(function () {
  // ── State ──────────────────────────────────────────────────────
  var deck = [];
  var index = 0;
  var correct = 0;
  var wrong = 0;
  var currentCategory = "all";
  var hideMastered = false;

  // ── DOM refs ───────────────────────────────────────────────────
  var card = document.getElementById("flashcard");
  var questionEl = document.getElementById("card-question");
  var answerEl = document.getElementById("card-answer");
  var catFront = document.getElementById("card-category");
  var catBack = document.getElementById("card-category-back");
  var positionEl = document.getElementById("card-position");
  var correctEl = document.getElementById("correct-count");
  var wrongEl = document.getElementById("wrong-count");
  var progressFill = document.querySelector(".progress-fill");

  // Edit / Delete card DOM refs
  var btnEditCard = document.getElementById("btn-edit-card");
  var btnDeleteCard = document.getElementById("btn-delete-card");
  var editingCardId = null;

  // Stats + mastered DOM refs
  var cardStatsEl = document.getElementById("card-stats");
  var cardStatsBackEl = document.getElementById("card-stats-back");
  var btnMastered = document.getElementById("btn-mastered");
  var btnHideMastered = document.getElementById("btn-hide-mastered");

  // Modal DOM refs
  var addCardModal = document.getElementById("add-card-modal");
  var newCardCategory = document.getElementById("new-card-category");
  var newCardQuestion = document.getElementById("new-card-question");
  var newCardAnswer = document.getElementById("new-card-answer");

  // Notes DOM refs
  var notesSection = document.getElementById("notes-section");
  var notesDisplay = document.getElementById("notes-display");
  var notesEditor = document.getElementById("notes-editor");
  var notesTextarea = document.getElementById("notes-textarea");
  var btnNotesEdit = document.getElementById("btn-notes-edit");
  var btnNotesSave = document.getElementById("btn-notes-save");
  var btnNotesDelete = document.getElementById("btn-notes-delete");

  // ── Markdown helpers ─────────────────────────────────────────
  function renderMarkdown(text) {
    if (!text) return "";
    return marked.parse(text, { breaks: true, gfm: true });
  }

  function htmlToMarkdown(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");

    function walk(node) {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return "";

      var tag = node.tagName.toLowerCase();
      var children = "";
      for (var i = 0; i < node.childNodes.length; i++) {
        children += walk(node.childNodes[i]);
      }

      switch (tag) {
        case "b": case "strong": return "**" + children.trim() + "** ";
        case "i": case "em": return "*" + children.trim() + "* ";
        case "code": return "`" + children + "`";
        case "pre": return "\n```\n" + children + "\n```\n";
        case "br": return "\n";
        case "p": case "div": return children + "\n\n";
        case "li": return "- " + children.trim() + "\n";
        case "ul": case "ol": return "\n" + children;
        case "h1": return "# " + children.trim() + "\n\n";
        case "h2": return "## " + children.trim() + "\n\n";
        case "h3": return "### " + children.trim() + "\n\n";
        default: return children;
      }
    }

    return walk(doc.body).replace(/\n{3,}/g, "\n\n").trim();
  }

  function handlePasteAsMarkdown(e) {
    var html = e.clipboardData && e.clipboardData.getData("text/html");
    if (!html) return; // no rich text — let default plain paste happen
    e.preventDefault();
    var md = htmlToMarkdown(html);
    var ta = e.target;
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    ta.value = ta.value.slice(0, start) + md + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + md.length;
  }

  // Attach paste handler to all relevant textareas
  notesTextarea.addEventListener("paste", handlePasteAsMarkdown);
  newCardQuestion.addEventListener("paste", handlePasteAsMarkdown);
  newCardAnswer.addEventListener("paste", handlePasteAsMarkdown);

  var CATEGORY_LABELS = {
    k8s: "K8s Architecture",
    crd: "CRD / API Design",
    systems: "Systems Design",
    dx: "Platform DX",
    networking: "Networking",
    security: "Security",
    resiliency: "Resiliency / Observability"
  };

  // ── URL state ─────────────────────────────────────────────────
  function updateURL() {
    var params = new URLSearchParams();
    if (currentCategory !== "all") params.set("cat", currentCategory);
    if (index > 0) params.set("card", index);
    if (hideMastered) params.set("hide", "1");
    var qs = params.toString();
    var url = window.location.pathname + (qs ? "?" + qs : "");
    history.replaceState(null, "", url);
  }

  function readURL() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get("cat");
    var cardIdx = parseInt(params.get("card"), 10);
    if (cat && CATEGORY_LABELS[cat]) {
      currentCategory = cat;
    }
    if (params.get("hide") === "1") {
      hideMastered = true;
    }
    return isNaN(cardIdx) ? 0 : cardIdx;
  }

  // ── Helpers ────────────────────────────────────────────────────
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function getAllCards() {
    var userCards = Storage.get("user-cards") || [];
    return FLASHCARDS.concat(userCards);
  }

  // ── Per-card stats ───────────────────────────────────────────
  function getCardStats(id) {
    var all = Storage.get("card-stats") || {};
    return all[id] || { right: 0, wrong: 0, mastered: false };
  }

  function setCardStats(id, stats) {
    var all = Storage.get("card-stats") || {};
    all[id] = stats;
    Storage.set("card-stats", all);
  }

  function recordCardResult(id, gotIt) {
    var stats = getCardStats(id);
    if (gotIt) stats.right++;
    else stats.wrong++;
    setCardStats(id, stats);
  }

  function buildDeck() {
    var all = getAllCards();
    deck =
      currentCategory === "all"
        ? all.slice()
        : all.filter(function (c) { return c.category === currentCategory; });
    if (hideMastered) {
      deck = deck.filter(function (c) {
        return !getCardStats(c.id).mastered;
      });
    }
    index = 0;
  }

  // ── Notes ──────────────────────────────────────────────────────
  function loadNotes() {
    var c = deck[index];
    if (!c) return;
    var allNotes = Storage.get("card-notes") || {};
    var note = allNotes[c.id] || "";
    notesDisplay.innerHTML = renderMarkdown(note);
    notesTextarea.value = note;
    notesEditor.classList.remove("visible");
    if (note) {
      notesDisplay.classList.add("visible");
      btnNotesEdit.textContent = "Edit";
    } else {
      notesDisplay.classList.remove("visible");
      btnNotesEdit.textContent = "Add Note";
    }
  }

  function saveNote() {
    var c = deck[index];
    if (!c) return;
    var text = notesTextarea.value.trim();
    var allNotes = Storage.get("card-notes") || {};
    if (text) {
      allNotes[c.id] = text;
    } else {
      delete allNotes[c.id];
    }
    Storage.set("card-notes", allNotes);
    loadNotes();
  }

  function deleteNote() {
    var c = deck[index];
    if (!c) return;
    var allNotes = Storage.get("card-notes") || {};
    delete allNotes[c.id];
    Storage.set("card-notes", allNotes);
    notesTextarea.value = "";
    loadNotes();
  }

  // ── Render ─────────────────────────────────────────────────────
  function renderStatsBadge(el, stats) {
    if (stats.right === 0 && stats.wrong === 0) {
      el.innerHTML = "";
      el.classList.remove("visible");
    } else {
      el.innerHTML =
        '<span class="stat-right">\u2713' + stats.right + '</span>' +
        '<span class="stat-wrong">\u2717' + stats.wrong + '</span>';
      el.classList.add("visible");
    }
  }

  function render() {
    if (deck.length === 0) {
      questionEl.textContent = "No cards in this category.";
      answerEl.innerHTML = "";
      catFront.textContent = "";
      catBack.textContent = "";
      positionEl.textContent = "0 / 0";
      progressFill.style.width = "0%";
      cardStatsEl.classList.remove("visible");
      cardStatsBackEl.classList.remove("visible");
      return;
    }

    var c = deck[index];
    if (c.custom) {
      questionEl.innerHTML = renderMarkdown(c.q);
      answerEl.innerHTML = renderMarkdown(c.a);
    } else {
      questionEl.innerHTML = c.q;
      answerEl.innerHTML = c.a;
    }
    var label = CATEGORY_LABELS[c.category] || c.category;
    catFront.textContent = label;
    catBack.textContent = label;

    positionEl.textContent = (index + 1) + " / " + deck.length;
    correctEl.textContent = correct;
    wrongEl.textContent = wrong;
    progressFill.style.width = ((index + 1) / deck.length * 100) + "%";

    // Per-card stats badge
    var stats = getCardStats(c.id);
    renderStatsBadge(cardStatsEl, stats);
    renderStatsBadge(cardStatsBackEl, stats);

    // Mastered state
    if (stats.mastered) {
      card.classList.add("is-mastered");
      btnMastered.textContent = "Unmaster";
      btnMastered.classList.add("is-mastered");
    } else {
      card.classList.remove("is-mastered");
      btnMastered.textContent = "Mark Mastered";
      btnMastered.classList.remove("is-mastered");
    }

    // Show edit/delete buttons only for user-created cards
    if (c.id && String(c.id).indexOf("user-") === 0) {
      btnEditCard.style.display = "";
      btnDeleteCard.style.display = "";
    } else {
      btnEditCard.style.display = "none";
      btnDeleteCard.style.display = "none";
    }

    // Make sure the card is face-up
    card.classList.remove("flipped");

    // Load notes for this card
    loadNotes();

    // Sync URL
    updateURL();
  }

  function flip() {
    card.classList.toggle("flipped");
  }

  function advance(gotIt) {
    if (deck.length > 0) {
      recordCardResult(deck[index].id, gotIt);
    }
    if (gotIt) correct++;
    else wrong++;

    if (index < deck.length - 1) {
      index++;
    } else {
      index = 0;
    }
    render();
  }

  // ── Events ─────────────────────────────────────────────────────
  card.addEventListener("click", function (e) {
    // Don't flip if clicking inside notes section
    if (notesSection.contains(e.target)) return;
    flip();
  });

  document.getElementById("btn-flip").addEventListener("click", flip);

  document.getElementById("btn-right").addEventListener("click", function () {
    advance(true);
  });

  document.getElementById("btn-wrong").addEventListener("click", function () {
    advance(false);
  });

  document.getElementById("btn-prev").addEventListener("click", function () {
    if (deck.length === 0) return;
    index = index > 0 ? index - 1 : deck.length - 1;
    render();
  });

  document.getElementById("btn-next").addEventListener("click", function () {
    if (deck.length === 0) return;
    index = index < deck.length - 1 ? index + 1 : 0;
    render();
  });

  document.getElementById("btn-shuffle").addEventListener("click", function () {
    shuffle(deck);
    index = 0;
    render();
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    correct = 0;
    wrong = 0;
    buildDeck();
    render();
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      correct = 0;
      wrong = 0;
      buildDeck();
      render();
    });
  });

  // Notes events — stopPropagation prevents card flip
  notesSection.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  btnNotesEdit.addEventListener("click", function () {
    if (notesEditor.classList.contains("visible")) {
      notesEditor.classList.remove("visible");
    } else {
      notesEditor.classList.add("visible");
      notesTextarea.focus();
    }
  });

  btnNotesSave.addEventListener("click", function () {
    saveNote();
  });

  btnNotesDelete.addEventListener("click", function () {
    deleteNote();
  });

  // Add Card modal
  var modalTitle = document.querySelector("#add-card-modal .modal-title");
  document.getElementById("btn-add-card").addEventListener("click", function () {
    editingCardId = null;
    modalTitle.textContent = "Add Custom Card";
    newCardCategory.value = currentCategory === "all" ? "k8s" : currentCategory;
    newCardQuestion.value = "";
    newCardAnswer.value = "";
    addCardModal.classList.add("visible");
    newCardQuestion.focus();
  });

  // Edit Card
  btnEditCard.addEventListener("click", function (e) {
    e.stopPropagation();
    var c = deck[index];
    if (!c || !c.custom) return;
    editingCardId = c.id;
    modalTitle.textContent = "Edit Card";
    newCardCategory.value = c.category;
    newCardQuestion.value = c.q;
    newCardAnswer.value = c.a;
    addCardModal.classList.add("visible");
    newCardQuestion.focus();
  });

  document.getElementById("btn-cancel-new-card").addEventListener("click", function () {
    addCardModal.classList.remove("visible");
  });

  addCardModal.addEventListener("click", function (e) {
    if (e.target === addCardModal) {
      addCardModal.classList.remove("visible");
    }
  });

  document.getElementById("btn-save-new-card").addEventListener("click", function () {
    var cat = newCardCategory.value;
    var q = newCardQuestion.value.trim();
    var a = newCardAnswer.value.trim();
    if (!q || !a) return;

    var userCards = Storage.get("user-cards") || [];

    if (editingCardId) {
      // Update existing card
      for (var i = 0; i < userCards.length; i++) {
        if (userCards[i].id === editingCardId) {
          userCards[i].category = cat;
          userCards[i].q = q;
          userCards[i].a = a;
          break;
        }
      }
      Storage.set("user-cards", userCards);
      addCardModal.classList.remove("visible");
      buildDeck();
      // Try to stay on the same card
      for (var j = 0; j < deck.length; j++) {
        if (deck[j].id === editingCardId) { index = j; break; }
      }
      editingCardId = null;
    } else {
      // Add new card
      userCards.push({
        id: "user-" + Date.now(),
        category: cat,
        q: q,
        a: a,
        custom: true
      });
      Storage.set("user-cards", userCards);
      addCardModal.classList.remove("visible");
      buildDeck();
      index = deck.length - 1;
    }
    render();
  });

  // Delete card
  btnDeleteCard.addEventListener("click", function (e) {
    e.stopPropagation();
    var c = deck[index];
    if (!c || String(c.id).indexOf("user-") !== 0) return;
    if (!window.confirm("Delete this custom card?")) return;

    var userCards = Storage.get("user-cards") || [];
    userCards = userCards.filter(function (uc) { return uc.id !== c.id; });
    Storage.set("user-cards", userCards);
    buildDeck();
    if (index >= deck.length) index = Math.max(0, deck.length - 1);
    render();
  });

  // Mastered toggle
  btnMastered.addEventListener("click", function (e) {
    e.stopPropagation();
    var c = deck[index];
    if (!c) return;
    var stats = getCardStats(c.id);
    stats.mastered = !stats.mastered;
    setCardStats(c.id, stats);
    // Update UI immediately
    if (stats.mastered) {
      card.classList.add("is-mastered");
      btnMastered.textContent = "Unmaster";
      btnMastered.classList.add("is-mastered");
    } else {
      card.classList.remove("is-mastered");
      btnMastered.textContent = "Mark Mastered";
      btnMastered.classList.remove("is-mastered");
    }
  });

  // Hide mastered toggle
  btnHideMastered.addEventListener("click", function () {
    hideMastered = !hideMastered;
    btnHideMastered.classList.toggle("active", hideMastered);
    buildDeck();
    if (index >= deck.length) index = Math.max(0, deck.length - 1);
    render();
  });

  // Keyboard shortcuts — disabled when textarea is focused
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      flip();
    } else if (e.key === "ArrowRight") {
      advance(true);
    } else if (e.key === "ArrowLeft") {
      advance(false);
    }
  });

  // ── Init ───────────────────────────────────────────────────────
  var savedIndex = readURL();

  // Activate the correct filter button from URL
  if (currentCategory !== "all") {
    document.querySelectorAll(".filter-btn").forEach(function (b) {
      b.classList.remove("active");
      if (b.dataset.category === currentCategory) b.classList.add("active");
    });
  }

  // Activate hide-mastered button from URL
  if (hideMastered) {
    btnHideMastered.classList.add("active");
  }

  buildDeck();
  if (savedIndex > 0 && savedIndex < deck.length) {
    index = savedIndex;
  }
  render();
})();
