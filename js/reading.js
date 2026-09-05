(() => {
  const GRID_ID = "reading-grid";
  const DATA_URL = "/data/books.json";
  const MIN_PRESS_MS = 80;

  const gridEl = document.getElementById(GRID_ID);
  if (!gridEl) return;

  const modal = document.getElementById("book-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMeta = document.getElementById("modal-meta");
  const modalNote = document.getElementById("modal-note");
  const modalClose = document.getElementById("modal-close");
  const modalBackdrop = document.getElementById("modal-backdrop");

  let books = [];

  function sortBooks(list) {
    const dated = [];
    const undated = [];
    list.forEach((b, i) => {
      const row = { ...b, _i: b.listOrder != null ? b.listOrder : i };
      if (b.finished) dated.push(row);
      else undated.push(row);
    });
    dated.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished < b.finished ? 1 : -1;
      return a._i - b._i;
    });
    undated.sort((a, b) => a._i - b._i);
    return dated.concat(undated);
  }

  function formatDate(iso) {
    if (!iso) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    return `${m[2]}/${m[3]}/${m[1]}`;
  }

  function capitalizeNote(note) {
    const s = String(note || "").trim();
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /** Notes that only restate the platform — drop from comment line. */
  function isPlatformOnlyNote(note, platform) {
    if (!note) return true;
    const n = note.trim().toLowerCase();
    const p = (platform || "").trim().toLowerCase();
    const platformish = [
      "audible.com",
      "audible.fr",
      "audible.de",
      "audible.fr free trial",
      "audible audiobook",
      "spotify audiobook",
      "amazon music audiobook",
      "audiobooks.com",
    ];
    if (platformish.includes(n)) return true;
    if (p && (n === p || n === `${p} audiobook` || n.startsWith(p + "."))) return true;
    if (/^audible(\.(com|fr|de))?(\s+free trial)?$/i.test(n)) return true;
    return false;
  }

  function buildMetaLine(book) {
    const bits = [];
    if (book.author) bits.push(book.author);
    const finished = formatDate(book.finished);
    if (finished) bits.push(`Finished ${finished}`);
    if (book.platform) bits.push(book.platform);
    if (book.edition) bits.push(book.edition);
    if (book.note && !isPlatformOnlyNote(book.note, book.platform)) {
      bits.push(capitalizeNote(book.note));
    }
    return bits.join(" · ");
  }

  function displayTitle(book) {
    if (!book) return "";
    const t = book.title || "";
    return book.year ? `${t} (${book.year})` : t;
  }

  function slugify(title) {
    return String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function findBySlug(slug) {
    return books.find((b) => slugify(b.title) === slug);
  }

  function openDetail(book) {
    if (!modal || !book) return;
    document
      .querySelectorAll(".reading-card.is-pressed")
      .forEach((el) => el.classList.remove("is-pressed"));
    modalTitle.textContent = displayTitle(book);
    const meta = buildMetaLine(book);
    if (modalMeta) {
      modalMeta.textContent = meta;
      modalMeta.hidden = !meta;
    }
    if (modalNote) {
      modalNote.textContent = "";
      modalNote.hidden = true;
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const slug = slugify(book.title);
    if (location.hash !== `#${slug}`) {
      history.replaceState(null, "", location.pathname + location.search + `#${slug}`);
    }
    modalClose?.focus();
  }

  function closeDetail() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function coverFrame(book, index) {
    const frame = document.createElement("div");
    frame.className = "reading-cover";

    if (book.cover) {
      const img = document.createElement("img");
      img.src = book.cover;
      img.alt = "";
      img.loading = index < 10 ? "eager" : "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.remove();
        const ph = document.createElement("div");
        ph.className = "poster-placeholder";
        ph.setAttribute("data-title", book.title);
        frame.appendChild(ph);
      });
      frame.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "poster-placeholder";
      ph.setAttribute("data-title", book.title);
      frame.appendChild(ph);
    }
    return frame;
  }

  function metaBlock(book) {
    const meta = document.createElement("div");
    meta.className = "reading-meta";

    const title = document.createElement("p");
    title.className = "reading-title";
    title.textContent = book.title || "";
    meta.appendChild(title);

    if (book.author) {
      const author = document.createElement("p");
      author.className = "reading-author";
      author.textContent = book.author;
      meta.appendChild(author);
    }
    return meta;
  }

  function makeCard(book, index) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reading-card";
    const shown = displayTitle(book);
    btn.setAttribute(
      "aria-label",
      book.author ? `${shown} by ${book.author}` : shown
    );
    btn.appendChild(coverFrame(book, index));
    btn.appendChild(metaBlock(book));

    let pressAt = 0;
    const setPressed = (on) => btn.classList.toggle("is-pressed", on);
    btn.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      pressAt = performance.now();
      setPressed(true);
    });
    const cancelPress = () => {
      setPressed(false);
      pressAt = 0;
    };
    btn.addEventListener("pointercancel", cancelPress);
    btn.addEventListener("pointerleave", cancelPress);
    btn.addEventListener("click", () => {
      setPressed(true);
      const elapsed = pressAt ? performance.now() - pressAt : 0;
      const wait = Math.max(0, MIN_PRESS_MS - elapsed);
      pressAt = 0;
      setTimeout(() => {
        setPressed(false);
        openDetail(book);
      }, wait);
    });

    return btn;
  }

  function render(list) {
    gridEl.replaceChildren();
    const frag = document.createDocumentFragment();
    list.forEach((b, i) => {
      const li = document.createElement("li");
      li.appendChild(makeCard(b, i));
      frag.appendChild(li);
    });
    gridEl.appendChild(frag);
  }

  function syncFromHash() {
    const slug = location.hash.replace(/^#/, "");
    if (!slug) {
      closeDetail();
      return;
    }
    const book = findBySlug(slug);
    if (book) openDetail(book);
  }

  modalClose?.addEventListener("click", closeDetail);
  modalBackdrop?.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeDetail();
  });
  window.addEventListener("hashchange", syncFromHash);

  fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load books");
      return r.json();
    })
    .then((data) => {
      books = sortBooks(Array.isArray(data) ? data : []);
      render(books);
      syncFromHash();
    })
    .catch(() => {
      gridEl.innerHTML = "";
    });
})();
