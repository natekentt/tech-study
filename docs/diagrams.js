(function () {
  // ── State ──────────────────────────────────────────────────────
  var currentCategory = "all";
  var selectedFile = null;

  // ── DOM refs ───────────────────────────────────────────────────
  var grid = document.getElementById("diagrams-grid");
  var emptyMsg = document.getElementById("diagrams-empty");
  var countEl = document.getElementById("diagram-count");
  var btnAdd = document.getElementById("btn-add-diagram");
  var modal = document.getElementById("upload-modal");
  var dropzone = document.getElementById("diagram-dropzone");
  var fileInput = document.getElementById("diagram-file");
  var previewWrap = document.getElementById("diagram-preview");
  var previewImg = document.getElementById("preview-img");
  var titleInput = document.getElementById("diagram-title");
  var categorySelect = document.getElementById("diagram-category");
  var commentInput = document.getElementById("diagram-comment");
  var btnSave = document.getElementById("btn-save-diagram");
  var btnCancel = document.getElementById("btn-cancel-diagram");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");

  // ── Category labels ────────────────────────────────────────────
  var CATEGORY_LABELS = {
    k8s: "K8s Architecture",
    crd: "CRD / API Design",
    systems: "Systems Design",
    dx: "Platform DX",
    networking: "Networking",
    security: "Security",
    resiliency: "Resiliency / Observability"
  };

  // ── Storage helpers ────────────────────────────────────────────
  function getDiagrams() {
    return Storage.get("diagrams") || [];
  }

  function saveDiagrams(diagrams) {
    try {
      Storage.set("diagrams", diagrams);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Image resize ───────────────────────────────────────────────
  var MAX_WIDTH = 1200;

  function resizeImage(dataUrl, callback) {
    var img = new Image();
    img.onload = function () {
      if (img.width <= MAX_WIDTH) {
        callback(dataUrl);
        return;
      }
      var ratio = MAX_WIDTH / img.width;
      var canvas = document.createElement("canvas");
      canvas.width = MAX_WIDTH;
      canvas.height = Math.round(img.height * ratio);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  }

  // ── Render ─────────────────────────────────────────────────────
  function render() {
    var diagrams = getDiagrams();
    var filtered = currentCategory === "all"
      ? diagrams
      : diagrams.filter(function (d) { return d.category === currentCategory; });

    countEl.textContent = filtered.length + " diagram" + (filtered.length !== 1 ? "s" : "");

    if (filtered.length === 0) {
      grid.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }

    emptyMsg.style.display = "none";
    grid.innerHTML = filtered.map(function (d) {
      return '<div class="diagram-card" data-id="' + d.id + '">' +
        '<img src="' + d.imageData + '" alt="' + escapeHtml(d.title) + '" class="diagram-card-img">' +
        '<div class="diagram-card-body">' +
          '<div class="diagram-card-header">' +
            '<span class="diagram-category-label">' + escapeHtml(CATEGORY_LABELS[d.category] || d.category) + '</span>' +
          '</div>' +
          '<div class="diagram-title">' + escapeHtml(d.title) + '</div>' +
          '<div class="diagram-comment" data-id="' + d.id + '">' +
            (d.comment ? escapeHtml(d.comment) : '<span class="diagram-comment-placeholder">Click to add a comment...</span>') +
          '</div>' +
          '<div class="diagram-actions">' +
            '<button class="action-btn diagram-delete-btn" data-id="' + d.id + '">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Filter buttons ─────────────────────────────────────────────
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      render();
    });
  });

  // ── Upload modal ───────────────────────────────────────────────
  function openModal() {
    modal.classList.add("visible");
    titleInput.value = "";
    commentInput.value = "";
    fileInput.value = "";
    selectedFile = null;
    previewWrap.style.display = "none";
    dropzone.style.display = "";
  }

  function closeModal() {
    modal.classList.remove("visible");
    selectedFile = null;
  }

  btnAdd.addEventListener("click", openModal);
  btnCancel.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  // File selection
  dropzone.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  // Drag and drop
  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  function handleFile(file) {
    if (!file.type.startsWith("image/")) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      selectedFile = e.target.result;
      previewImg.src = selectedFile;
      previewWrap.style.display = "block";
      dropzone.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  // Save diagram
  btnSave.addEventListener("click", function () {
    var title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    if (!selectedFile) return;

    resizeImage(selectedFile, function (resizedData) {
      var diagrams = getDiagrams();
      diagrams.push({
        id: "diag-" + Date.now(),
        category: categorySelect.value,
        title: title,
        imageData: resizedData,
        comment: commentInput.value.trim(),
        createdAt: new Date().toISOString()
      });

      try {
        Storage.set("diagrams", diagrams);
      } catch (e) {
        alert("Storage quota exceeded. Try uploading a smaller image or deleting existing diagrams.");
        return;
      }

      // Verify it was actually saved (Storage.set silently catches errors)
      var saved = Storage.get("diagrams");
      if (!saved || saved.length !== diagrams.length) {
        alert("Storage quota exceeded. Try uploading a smaller image or deleting existing diagrams.");
        return;
      }

      closeModal();
      render();
    });
  });

  // ── Grid event delegation ──────────────────────────────────────
  grid.addEventListener("click", function (e) {
    // Lightbox — click on image
    if (e.target.classList.contains("diagram-card-img")) {
      lightboxImg.src = e.target.src;
      lightbox.style.display = "flex";
      return;
    }

    // Delete
    if (e.target.classList.contains("diagram-delete-btn")) {
      var id = e.target.dataset.id;
      if (!confirm("Delete this diagram?")) return;
      var diagrams = getDiagrams().filter(function (d) { return d.id !== id; });
      saveDiagrams(diagrams);
      render();
      return;
    }

    // Inline comment editing — click on comment area
    var commentEl = e.target.closest(".diagram-comment");
    if (commentEl && !commentEl.querySelector("textarea")) {
      var diagId = commentEl.dataset.id;
      var diagrams = getDiagrams();
      var diag = null;
      for (var i = 0; i < diagrams.length; i++) {
        if (diagrams[i].id === diagId) { diag = diagrams[i]; break; }
      }
      if (!diag) return;

      var textarea = document.createElement("textarea");
      textarea.className = "diagram-comment-editor";
      textarea.rows = 2;
      textarea.value = diag.comment || "";
      commentEl.innerHTML = "";
      commentEl.appendChild(textarea);
      textarea.focus();

      textarea.addEventListener("blur", function () {
        diag.comment = textarea.value.trim();
        var all = getDiagrams();
        for (var j = 0; j < all.length; j++) {
          if (all[j].id === diagId) { all[j].comment = diag.comment; break; }
        }
        saveDiagrams(all);
        render();
      });

      textarea.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          textarea.blur();
        }
      });
    }
  });

  // ── Lightbox ───────────────────────────────────────────────────
  lightbox.addEventListener("click", function () {
    lightbox.style.display = "none";
  });

  // ── Keyboard ───────────────────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (lightbox.style.display === "flex") {
        lightbox.style.display = "none";
      } else if (modal.classList.contains("visible")) {
        closeModal();
      }
    }
  });

  // ── Init ───────────────────────────────────────────────────────
  render();
})();
