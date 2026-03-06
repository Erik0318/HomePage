/* =========================
   Global helpers + grain toggle
========================= */
(function initGrainToggle() {
  const storageKey = "grainEnabled";
  const toggle = document.querySelector("[data-grain-toggle]");
  if (!toggle) return;

  const applyState = (enabled) => {
    document.body.classList.toggle("grain-off", !enabled);
    toggle.textContent = enabled ? "Grain: On" : "Grain: Off";
    sessionStorage.setItem(storageKey, String(enabled));
  };

  const stored = sessionStorage.getItem(storageKey);
  applyState(stored !== "false");

  toggle.addEventListener("click", () => {
    const enabled = !document.body.classList.contains("grain-off");
    applyState(!enabled);
  });
})();

/* =========================
   Blogs page polish
========================= */
(function initBlogEntries() {
  const entries = document.querySelectorAll(".log-item");
  if (!entries.length) return;

  entries.forEach((entry) => {
    entry.addEventListener("toggle", () => {
      if (!entry.open) return;
      entries.forEach((other) => {
        if (other !== entry) other.open = false;
      });
    });
  });
})();

/* =========================
   Albums data + lightbox
   Data format: array of {src, thumb, alt, caption}
========================= */
const albumItems = [
  { src: "assets/images/album-01.svg", thumb: "assets/images/album-01.svg", alt: "Frame 01", caption: "Frame 01" },
  { src: "assets/images/album-02.svg", thumb: "assets/images/album-02.svg", alt: "Frame 02", caption: "Frame 02" },
  { src: "assets/images/album-03.svg", thumb: "assets/images/album-03.svg", alt: "Frame 03", caption: "Frame 03" },
  { src: "assets/images/album-04.svg", thumb: "assets/images/album-04.svg", alt: "Frame 04", caption: "Frame 04" },
  { src: "assets/images/album-05.svg", thumb: "assets/images/album-05.svg", alt: "Frame 05", caption: "Frame 05" },
  { src: "assets/images/album-06.svg", thumb: "assets/images/album-06.svg", alt: "Frame 06", caption: "Frame 06" }
];

(function initAlbums() {
  const grid = document.getElementById("albumGrid");
  if (!grid) return;

  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  const caption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("closeBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  let currentIndex = 0;

  const preloadNeighbors = (index) => {
    [index - 1, index + 1].forEach((i) => {
      const item = albumItems[(i + albumItems.length) % albumItems.length];
      const img = new Image();
      img.src = item.src;
    });
  };

  const renderImage = (index) => {
    const item = albumItems[index];
    image.src = item.src;
    image.alt = item.alt;
    caption.textContent = item.caption;
    preloadNeighbors(index);
  };

  const openLightbox = (index) => {
    currentIndex = index;
    renderImage(currentIndex);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    closeBtn.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % albumItems.length;
    renderImage(currentIndex);
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + albumItems.length) % albumItems.length;
    renderImage(currentIndex);
  };

  albumItems.forEach((item, index) => {
    const figure = document.createElement("figure");
    figure.className = "thumb";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Open ${item.caption}`);

    const img = document.createElement("img");
    img.src = item.thumb;
    img.alt = item.alt;

    const figcaption = document.createElement("figcaption");
    figcaption.textContent = item.caption;

    button.appendChild(img);
    figure.appendChild(button);
    figure.appendChild(figcaption);
    grid.appendChild(figure);

    button.addEventListener("click", () => openLightbox(index));
  });

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", showPrev);
  nextBtn.addEventListener("click", showNext);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });
})();
