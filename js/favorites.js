(() => {
  const GRID_ID = "poster-grid";
  const DATA_URL = "/data/favorites.json";

  const grid = document.getElementById(GRID_ID);
  if (!grid) return;

  const modal = document.getElementById("movie-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalYear = document.getElementById("modal-year");
  const modalNote = document.getElementById("modal-note");
  const modalClose = document.getElementById("modal-close");
  const modalBackdrop = document.getElementById("modal-backdrop");

  let movies = [];

  function slugify(title, year) {
    return `${title}-${year || "x"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function findBySlug(slug) {
    return movies.find((m) => slugify(m.title, m.year) === slug);
  }



  function openDetail(movie) {
    if (!modal || !movie) return;
    modalTitle.textContent = movie.year
      ? `${movie.title} (${movie.year})`
      : movie.title;
    // Favorites: title + year only
    if (modalYear) {
      modalYear.textContent = "";
      modalYear.hidden = true;
    }
    if (modalNote) {
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


    const setPressed = (on) => btn.classList.toggle("is-pressed", on);
    btn.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      setPressed(true);
    });
    const release = () => setPressed(false);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("click", () => {
      setPressed(true);
      openDetail(movie);
      requestAnimationFrame(() => setTimeout(release, 110));
    });


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
    if (!slug) {
      closeDetail();
      return;
    }
    const movie = findBySlug(slug);
    if (movie) openDetail(movie);
  }

  modalClose?.addEventListener("click", closeDetail);
  modalBackdrop?.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeDetail();
  });
  window.addEventListener("hashchange", syncFromHash);


  fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load favorites (${r.status})`);
      return r.json();
    })
    .then((data) => {
      // Keep JSON array order (Alejandro's list order)
      movies = Array.isArray(data) ? data : [];
      render(movies);
      syncFromHash();
    })
    .catch((err) => {
      const status = document.createElement("p");
      status.className = "movies-status";
      status.textContent = "Could not load favorite movies.";
      grid.replaceWith(status);
      console.error(err);
    });
})();
