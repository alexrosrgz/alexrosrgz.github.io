(() => {
  const GRID_ID = "reading-grid";
  const DATA_URL = "/data/books.json";

  const gridEl = document.getElementById(GRID_ID);
  if (!gridEl) return;

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

    const author = document.createElement("p");
    author.className = "reading-author";
    author.textContent = book.author || "";
    meta.appendChild(author);

    const dateStr = formatDate(book.finished);
    if (dateStr) {
      const date = document.createElement("p");
      date.className = "reading-date";
      date.textContent = dateStr;
      meta.appendChild(date);
    }
    return meta;
  }

  function makeCard(book, index) {
    const a = document.createElement("a");
    a.href = "#";
    a.className = "reading-card";
    a.setAttribute(
      "aria-label",
      book.author ? `${book.title} by ${book.author}` : book.title
    );
    a.addEventListener("click", (e) => e.preventDefault());
    a.appendChild(coverFrame(book, index));
    a.appendChild(metaBlock(book));
    return a;
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

  fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load books");
      return r.json();
    })
    .then((data) => render(sortBooks(Array.isArray(data) ? data : [])))
    .catch(() => {
      gridEl.innerHTML = "";
    });
})();
