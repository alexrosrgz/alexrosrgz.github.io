(() => {
  const GRID_ID = "poster-grid";
  const DATA_URL = "/data/watch.json";

  const CATEGORY_LABELS = {
    films: "Films",
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

  let movies = [];
  let activeFilter = "all";

  /** Newest watched at top; oldest at bottom; undated keep listOrder after dated. */
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

  function filteredList() {
    if (activeFilter === "all") return movies;
    return movies.filter((m) => m.category === activeFilter);
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
    // Keep detail slug hashes; strip filter= hashes
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
    render(filteredList());
  }

  function openDetail(movie) {
    if (!modal || !movie) return;
    modalTitle.textContent = movie.title;
    const bits = [];
    const catLabel = movie.category && CATEGORY_LABELS[movie.category];
    if (catLabel) bits.push(catLabel);
    if (movie.year) bits.push(String(movie.year));
    if (movie.watched) bits.push(`watched ${movie.watched}`);
    modalYear.textContent = bits.join(" · ");
    modalYear.hidden = bits.length === 0;
    if (movie.note) {
      modalNote.textContent = movie.note;
      modalNote.hidden = false;
    } else {
      modalNote.textContent = "";
      modalNote.hidden = true;
    }
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

  modalClose?.addEventListener("click", closeDetail);
  modalBackdrop?.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) {
      closeDetail();
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
