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
   Data format: array of albums, each with title and images array
========================= */
const albums = [
  {
  title: "United Kingdom Feb 2024",
  images: [
      { src: "assets/images/UK_Feb2024/001.jpg", thumb: "assets/images/UK_Feb2024/001.jpg", alt: "001" },
      { src: "assets/images/UK_Feb2024/002.jpg", thumb: "assets/images/UK_Feb2024/002.jpg", alt: "002" },
      { src: "assets/images/UK_Feb2024/003.jpg", thumb: "assets/images/UK_Feb2024/003.jpg", alt: "003" },
      { src: "assets/images/UK_Feb2024/004.jpg", thumb: "assets/images/UK_Feb2024/004.jpg", alt: "004" },
      { src: "assets/images/UK_Feb2024/005.jpg", thumb: "assets/images/UK_Feb2024/005.jpg", alt: "005" },
      { src: "assets/images/UK_Feb2024/006.jpg", thumb: "assets/images/UK_Feb2024/006.jpg", alt: "006" },
      { src: "assets/images/UK_Feb2024/007.jpg", thumb: "assets/images/UK_Feb2024/007.jpg", alt: "007" },
      { src: "assets/images/UK_Feb2024/008.jpg", thumb: "assets/images/UK_Feb2024/008.jpg", alt: "008" },
      { src: "assets/images/UK_Feb2024/009.jpg", thumb: "assets/images/UK_Feb2024/009.jpg", alt: "009" },
      { src: "assets/images/UK_Feb2024/010.jpg", thumb: "assets/images/UK_Feb2024/010.jpg", alt: "010" },
      { src: "assets/images/UK_Feb2024/011.jpg", thumb: "assets/images/UK_Feb2024/011.jpg", alt: "011" },
      { src: "assets/images/UK_Feb2024/012.jpg", thumb: "assets/images/UK_Feb2024/012.jpg", alt: "012" },
      { src: "assets/images/UK_Feb2024/013.jpg", thumb: "assets/images/UK_Feb2024/013.jpg", alt: "013" },
      { src: "assets/images/UK_Feb2024/014.jpg", thumb: "assets/images/UK_Feb2024/014.jpg", alt: "014" },
      { src: "assets/images/UK_Feb2024/015.jpg", thumb: "assets/images/UK_Feb2024/015.jpg", alt: "015" },
      { src: "assets/images/UK_Feb2024/016.jpg", thumb: "assets/images/UK_Feb2024/016.jpg", alt: "016" },
      { src: "assets/images/UK_Feb2024/017.jpg", thumb: "assets/images/UK_Feb2024/017.jpg", alt: "017" },
      { src: "assets/images/UK_Feb2024/018.jpg", thumb: "assets/images/UK_Feb2024/018.jpg", alt: "018" },
      { src: "assets/images/UK_Feb2024/019.jpg", thumb: "assets/images/UK_Feb2024/019.jpg", alt: "019" },
      { src: "assets/images/UK_Feb2024/020.jpg", thumb: "assets/images/UK_Feb2024/020.jpg", alt: "020" },
      { src: "assets/images/UK_Feb2024/021.jpg", thumb: "assets/images/UK_Feb2024/021.jpg", alt: "021" },
      { src: "assets/images/UK_Feb2024/022.jpg", thumb: "assets/images/UK_Feb2024/022.jpg", alt: "022" },
      { src: "assets/images/UK_Feb2024/023.jpg", thumb: "assets/images/UK_Feb2024/023.jpg", alt: "023" },
      { src: "assets/images/UK_Feb2024/024.jpg", thumb: "assets/images/UK_Feb2024/024.jpg", alt: "024" },
      { src: "assets/images/UK_Feb2024/025.jpg", thumb: "assets/images/UK_Feb2024/025.jpg", alt: "025" },
      { src: "assets/images/UK_Feb2024/026.jpg", thumb: "assets/images/UK_Feb2024/026.jpg", alt: "026" },
      { src: "assets/images/UK_Feb2024/027.jpg", thumb: "assets/images/UK_Feb2024/027.jpg", alt: "027" },
      { src: "assets/images/UK_Feb2024/028.jpg", thumb: "assets/images/UK_Feb2024/028.jpg", alt: "028" },
      { src: "assets/images/UK_Feb2024/029.jpg", thumb: "assets/images/UK_Feb2024/029.jpg", alt: "029" },
      { src: "assets/images/UK_Feb2024/030.jpg", thumb: "assets/images/UK_Feb2024/030.jpg", alt: "030" },
      { src: "assets/images/UK_Feb2024/031.jpg", thumb: "assets/images/UK_Feb2024/031.jpg", alt: "031" },
      { src: "assets/images/UK_Feb2024/032.jpg", thumb: "assets/images/UK_Feb2024/032.jpg", alt: "032" },
      { src: "assets/images/UK_Feb2024/033.jpg", thumb: "assets/images/UK_Feb2024/033.jpg", alt: "033" },
      { src: "assets/images/UK_Feb2024/034.jpg", thumb: "assets/images/UK_Feb2024/034.jpg", alt: "034" },
      { src: "assets/images/UK_Feb2024/035.jpg", thumb: "assets/images/UK_Feb2024/035.jpg", alt: "035" },
      { src: "assets/images/UK_Feb2024/036.jpg", thumb: "assets/images/UK_Feb2024/036.jpg", alt: "036" },
      { src: "assets/images/UK_Feb2024/037.jpg", thumb: "assets/images/UK_Feb2024/037.jpg", alt: "037" },
      { src: "assets/images/UK_Feb2024/038.jpg", thumb: "assets/images/UK_Feb2024/038.jpg", alt: "038" },
      { src: "assets/images/UK_Feb2024/039.jpg", thumb: "assets/images/UK_Feb2024/039.jpg", alt: "039" },
      { src: "assets/images/UK_Feb2024/040.jpg", thumb: "assets/images/UK_Feb2024/040.jpg", alt: "040" },
      { src: "assets/images/UK_Feb2024/041.jpg", thumb: "assets/images/UK_Feb2024/041.jpg", alt: "041" },
      { src: "assets/images/UK_Feb2024/042.jpg", thumb: "assets/images/UK_Feb2024/042.jpg", alt: "042" },
      { src: "assets/images/UK_Feb2024/043.jpg", thumb: "assets/images/UK_Feb2024/043.jpg", alt: "043" },
      { src: "assets/images/UK_Feb2024/044.jpg", thumb: "assets/images/UK_Feb2024/044.jpg", alt: "044" },
      { src: "assets/images/UK_Feb2024/045.jpg", thumb: "assets/images/UK_Feb2024/045.jpg", alt: "045" },
      { src: "assets/images/UK_Feb2024/046.jpg", thumb: "assets/images/UK_Feb2024/046.jpg", alt: "046" },
      { src: "assets/images/UK_Feb2024/047.jpg", thumb: "assets/images/UK_Feb2024/047.jpg", alt: "047" },
      { src: "assets/images/UK_Feb2024/048.jpg", thumb: "assets/images/UK_Feb2024/048.jpg", alt: "048" },
      { src: "assets/images/UK_Feb2024/049.jpg", thumb: "assets/images/UK_Feb2024/049.jpg", alt: "049" },
      { src: "assets/images/UK_Feb2024/050.jpg", thumb: "assets/images/UK_Feb2024/050.jpg", alt: "050" },
      { src: "assets/images/UK_Feb2024/051.jpg", thumb: "assets/images/UK_Feb2024/051.jpg", alt: "051" },
      { src: "assets/images/UK_Feb2024/052.jpg", thumb: "assets/images/UK_Feb2024/052.jpg", alt: "052" },
      { src: "assets/images/UK_Feb2024/053.jpg", thumb: "assets/images/UK_Feb2024/053.jpg", alt: "053" },
      { src: "assets/images/UK_Feb2024/054.jpg", thumb: "assets/images/UK_Feb2024/054.jpg", alt: "054" },
      { src: "assets/images/UK_Feb2024/055.jpg", thumb: "assets/images/UK_Feb2024/055.jpg", alt: "055" },
      { src: "assets/images/UK_Feb2024/056.jpg", thumb: "assets/images/UK_Feb2024/056.jpg", alt: "056" },
      { src: "assets/images/UK_Feb2024/057.jpg", thumb: "assets/images/UK_Feb2024/057.jpg", alt: "057" },
      { src: "assets/images/UK_Feb2024/058.jpg", thumb: "assets/images/UK_Feb2024/058.jpg", alt: "058" },
      { src: "assets/images/UK_Feb2024/059.jpg", thumb: "assets/images/UK_Feb2024/059.jpg", alt: "059" },
      { src: "assets/images/UK_Feb2024/060.jpg", thumb: "assets/images/UK_Feb2024/060.jpg", alt: "060" }
    ]
  },
  {
    title: "More to go...",
    images: [
      
    ]
  }
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
  const indexDisplay = document.getElementById("lightboxIndex");
  let currentAlbum = null;
  let currentIndex = 0;

  const preloadNeighbors = (album, index) => {
    [index - 1, index + 1].forEach((i) => {
      if (i >= 0 && i < album.images.length) {
        const img = new Image();
        img.src = album.images[i].src;
      }
    });
  };

  const renderImage = (album, index) => {
    const item = album.images[index];
    image.src = item.src;
    image.alt = item.alt;
    caption.textContent = item.caption || "";
    indexDisplay.textContent = `${index + 1} of ${album.images.length}`;
    preloadNeighbors(album, index);
  };

  const openLightbox = (album, index) => {
    currentAlbum = album;
    currentIndex = index;
    renderImage(currentAlbum, currentIndex);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    closeBtn.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    currentAlbum = null;
    currentIndex = 0;
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % currentAlbum.images.length;
    renderImage(currentAlbum, currentIndex);
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + currentAlbum.images.length) % currentAlbum.images.length;
    renderImage(currentAlbum, currentIndex);
  };

  albums.forEach((album) => {
    if (!album.images || album.images.length === 0) return;
    
    const figure = document.createElement("figure");
    figure.className = "album-thumb";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Open ${album.title} album`);

    const img = document.createElement("img");
    img.src = album.images[0].thumb;
    img.alt = album.title;

    const figcaption = document.createElement("figcaption");
    figcaption.textContent = album.title;

    button.appendChild(img);
    figure.appendChild(button);
    figure.appendChild(figcaption);
    grid.appendChild(figure);

    button.addEventListener("click", () => openLightbox(album, 0));
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

/* =========================
   Custom Cursor & Particles
========================= */
(function initCustomCursor() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
  } else {
    initCursor();
  }

  function initCursor() {
    // Small delay to ensure elements are rendered
    setTimeout(() => {
      const cursor = document.getElementById('customCursor');
      const particlesContainer = document.getElementById('particlesContainer');

      // Debug: check if elements exist
      console.log('Custom cursor initialization on page:', document.body.dataset.page);
      console.log('Custom cursor elements:', { cursor, particlesContainer });

      if (!cursor || !particlesContainer) {
        console.warn('Custom cursor elements not found, creating them...');

        // Try to create elements if they don't exist
        if (!cursor) {
          const newCursor = document.createElement('div');
          newCursor.className = 'custom-cursor';
          newCursor.id = 'customCursor';
          document.body.appendChild(newCursor);
        }
        if (!particlesContainer) {
          const newContainer = document.createElement('div');
          newContainer.className = 'particles-container';
          newContainer.id = 'particlesContainer';
          document.body.appendChild(newContainer);
        }

        // Retry initialization
        setTimeout(initCursor, 100);
        return;
      }

      let mouseX = 0;
      let mouseY = 0;
      let cursorX = 0;
      let cursorY = 0;

      // Make cursor visible initially
      cursor.style.opacity = '1';
      cursor.style.display = 'block';

      // Smooth cursor movement
      function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;

        cursor.style.left = cursorX - 4 + 'px';
        cursor.style.top = cursorY - 4 + 'px';

        requestAnimationFrame(updateCursor);
      }

      // Mouse move handler
      document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Create particle occasionally
        if (Math.random() < 0.3) { // 30% chance
          createParticle(mouseX, mouseY);
        }
      });

      // Create particle
      function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        // Random slight offset
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        particlesContainer.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 1500);
      }

      // Hide cursor on mouse leave
      document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
      });

      document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
      });

      // Start animation
      updateCursor();

      console.log('Custom cursor initialized successfully on page:', document.body.dataset.page);
    }, 100);
  }
})();
