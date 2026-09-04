(() => {
  const GRID_ID = "poster-grid";
  const DATA_URL = "/data/watch.json";

  const CATEGORY_LABELS = {
    films: "Movies",
    documentaries: "Documentaries",
    standup: "Stand Up",
    series: "Series",
    "documentary-series": "Documentary series",
  };

  const VALID_FILTERS = new Set(["all", ...Object.keys(CATEGORY_LABELS)]);

  const grid = document.getElementById(GRID_ID);
  if (!grid) return;

  const modal = document.getElementById("movie-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalYear = document.getElementById("modal-year");
  const modalNote = document.getElementById("modal-note");
  const modalClose = document.getElementById("modal-close");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const filterNav = document.querySelector(".watch-filter");
  const searchRoot = document.querySelector(".search");
  const searchToggle = document.querySelector(".search__toggle");
  const searchInput = document.querySelector(".search__input");
  const searchClear = document.querySelector(".search__clear");

  let movies = [];
  let activeFilter = "all";
  let searchQuery = "";
  let searchDebounce = null;

  function sortMovies(list) {
    const dated = [];
    const undated = [];
    list.forEach((m, i) => {
      const row = { ...m, _i: m.listOrder != null ? m.listOrder : i };
      if (m.watched) dated.push(row);
      else undated.push(row);
    });
    dated.sort((a, b) => {
      if (a.watched !== b.watched) return a.watched < b.watched ? 1 : -1;
      return a._i - b._i;
    });
    undated.sort((a, b) => a._i - b._i);
    return dated.concat(undated);
  }

  function slugify(title, year) {
    return `${title}-${year || "x"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function findBySlug(slug) {
    return movies.find((m) => slugify(m.title, m.year) === slug);
  }

  function matchesSearch(m, q) {
    if (!q) return true;
    const hay = `${m.title || ""} ${m.note || ""}`.toLowerCase();
    return hay.includes(q);
  }

  function filteredList() {
    let list = movies;
    if (activeFilter !== "all") {
      list = list.filter((m) => m.category === activeFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((m) => matchesSearch(m, q));
    return list;
  }

  function refresh() {
    render(filteredList());
  }

  function readFilterFromUrl() {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("c");
    if (fromQuery && VALID_FILTERS.has(fromQuery)) return fromQuery;
    const hash = location.hash.replace(/^#/, "");
    const hashMatch = hash.match(/^filter=(.+)$/);
    if (hashMatch && VALID_FILTERS.has(hashMatch[1])) return hashMatch[1];
    return "all";
  }

  function writeFilterToUrl(filter) {
    const params = new URLSearchParams(location.search);
    if (filter === "all") params.delete("c");
    else params.set("c", filter);
    const qs = params.toString();
    const hash = location.hash || "";
    const keepHash = hash.startsWith("#filter=") ? "" : hash;
    const next = location.pathname + (qs ? `?${qs}` : "") + keepHash;
    history.replaceState(null, "", next);
  }

  function setFilter(filter, { updateUrl = true } = {}) {
    if (!VALID_FILTERS.has(filter)) filter = "all";
    activeFilter = filter;
    if (filterNav) {
      filterNav.querySelectorAll("[data-filter]").forEach((btn) => {
        const on = btn.getAttribute("data-filter") === filter;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    if (updateUrl) writeFilterToUrl(filter);
    refresh();
  }

  function syncClearButton() {
    if (!searchClear) return;
    const show = searchQuery.length > 0;
    searchClear.hidden = !show;
  }

  function openSearch() {
    if (!searchRoot) return;
    searchRoot.setAttribute("data-open", "true");
    searchToggle?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => searchInput?.focus());
  }

  function collapseSearch() {
    if (!searchRoot) return;
    searchRoot.setAttribute("data-open", "false");
    searchToggle?.setAttribute("aria-expanded", "false");
  }

  function clearSearch({ collapse = false } = {}) {
    searchQuery = "";
    if (searchInput) searchInput.value = "";
    syncClearButton();
    refresh();
    if (collapse) collapseSearch();
    else searchInput?.focus();
  }

  function setSearchQuery(value) {
    searchQuery = value;
    syncClearButton();
    refresh();
  }

  function formatWatchedDate(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    // ISO YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, "0");
      const d = m[3].padStart(2, "0");
      return `${mo}/${d}/${y}`;
    }
    // Hungarian YYYY.MM.DD
    m = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, "0");
      const d = m[3].padStart(2, "0");
      return `${mo}/${d}/${y}`;
    }
    // German DD.MM.YYYY
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const y = m[3];
      let day, month;
      if (a > 12) {
        day = a;
        month = b;
      } else if (b > 12) {
        month = a;
        day = b;
      } else {
        // Prefer DD.MM for dotted European
        day = a;
        month = b;
      }
      return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${y}`;
    }
    // US MM/DD/YYYY already
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
    }
    return s;
  }

  function openDetail(movie) {
    if (!modal || !movie) return;
    modalTitle.textContent = movie.year
      ? `${movie.title} (${movie.year})`
      : movie.title;
    const bits = [];
    const catLabel = movie.category && CATEGORY_LABELS[movie.category];
    if (catLabel) bits.push(catLabel);
    const usDate = formatWatchedDate(movie.watched);
    if (usDate) bits.push(`Watched ${usDate}`);
    if (movie.platform) bits.push(movie.platform);
    if (movie.note) bits.push(movie.note);
    modalYear.textContent = bits.join(" · ");
    modalYear.hidden = bits.length === 0;
    // Note folded into meta line above
    modalNote.textContent = "";
    modalNote.hidden = true;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const slug = slugify(movie.title, movie.year);
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

  function renderPoster(movie, index) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "poster-card";
    const label = movie.year ? `${movie.title} (${movie.year})` : movie.title;
    btn.setAttribute("aria-label", label);

    const frame = document.createElement("div");
    frame.className = "poster-frame";

    if (movie.poster) {
      const img = document.createElement("img");
      img.src = movie.poster;
      img.alt = "";
      img.loading = index < 4 ? "eager" : "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.remove();
        const ph = document.createElement("div");
        ph.className = "poster-placeholder";
        ph.setAttribute("data-title", movie.title);
        frame.appendChild(ph);
      });
      frame.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "poster-placeholder";
      ph.setAttribute("data-title", movie.title);
      frame.appendChild(ph);
    }

    btn.appendChild(frame);
    btn.addEventListener("click", () => openDetail(movie));
    li.appendChild(btn);
    return li;
  }

  function render(list) {
    grid.replaceChildren();
    const frag = document.createDocumentFragment();
    list.forEach((m, i) => frag.appendChild(renderPoster(m, i)));
    grid.appendChild(frag);
  }

  function syncFromHash() {
    const slug = location.hash.replace(/^#/, "");
    if (!slug || slug.startsWith("filter=")) {
      closeDetail();
      return;
    }
    const movie = findBySlug(slug);
    if (movie) openDetail(movie);
  }

  filterNav?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn || !filterNav.contains(btn)) return;
    setFilter(btn.getAttribute("data-filter"));
  });

  searchToggle?.addEventListener("click", () => {
    const open = searchRoot?.getAttribute("data-open") === "true";
    if (open) {
      if (!searchQuery) collapseSearch();
      else searchInput?.focus();
    } else {
      openSearch();
    }
  });

  searchInput?.addEventListener("input", () => {
    const value = searchInput.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => setSearchQuery(value), 140);
  });

  searchClear?.addEventListener("click", () => clearSearch({ collapse: false }));

  searchInput?.addEventListener("blur", () => {
    // Defer so clear button click can fire first
    setTimeout(() => {
      if (document.activeElement === searchClear) return;
      if (!searchQuery && searchRoot?.getAttribute("data-open") === "true") {
        collapseSearch();
      }
    }, 120);
  });

  document.addEventListener("pointerdown", (e) => {
    if (!searchRoot || searchRoot.getAttribute("data-open") !== "true") return;
    if (searchRoot.contains(e.target)) return;
    if (searchQuery) return; // stay open with query
    collapseSearch();
  });

  modalClose?.addEventListener("click", closeDetail);
  modalBackdrop?.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal?.classList.contains("is-open")) {
        closeDetail();
        return;
      }
      if (searchRoot?.getAttribute("data-open") === "true") {
        if (searchQuery) {
          clearSearch({ collapse: false });
        } else {
          collapseSearch();
          searchToggle?.focus();
        }
      }
    }
  });
  window.addEventListener("hashchange", syncFromHash);

  fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load watch list (${r.status})`);
      return r.json();
    })
    .then((data) => {
      const raw = Array.isArray(data) ? data : data.movies || data.watch || [];
      movies = sortMovies(raw);
      const initial = readFilterFromUrl();
      setFilter(initial, { updateUrl: initial !== "all" });
      syncFromHash();
    })
    .catch((err) => {
      const status = document.createElement("p");
      status.className = "movies-status";
      status.textContent = "Could not load the watch list.";
      grid.replaceWith(status);
      console.error(err);
    });
})();
