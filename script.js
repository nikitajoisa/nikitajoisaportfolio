/* ============================================
   script.js
   1. Footer year
   2. Per-card image sliders (dots + arrows)
   3. Lightbox (click any image to view full-size,
      arrow through all images in that project)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* 1. FOOTER YEAR --------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* 1b. LIVE CLOCK ----------------------------- */
  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }


  /* 2a. SCROLL REVEAL for project cards ------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.project-card').forEach(card => revealObserver.observe(card));


  /* 2b. TILT + CURSOR-FOLLOW TAG --------------- */
  const isTouch = window.matchMedia('(hover: none)').matches;
  const cursorTag = document.getElementById('cursor-tag');
  const cursorTagText = cursorTag ? cursorTag.querySelector('span') : null;

  if (!isTouch && cursorTag) {
    let mouseX = 0, mouseY = 0, tagX = 0, tagY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // smooth-follow loop (lerp toward the real cursor position)
    (function animateTag() {
      tagX += (mouseX - tagX) * 0.18;
      tagY += (mouseY - tagY) * 0.18;
      cursorTag.style.transform = `translate(${tagX + 18}px, ${tagY + 18}px)`;
      requestAnimationFrame(animateTag);
    })();

    document.querySelectorAll('.project-card').forEach(card => {
      const label = card.dataset.cursor || 'View →';

      card.addEventListener('mouseenter', () => {
        cursorTagText.textContent = label;
        cursorTag.classList.add('visible');
      });
      card.addEventListener('mouseleave', () => {
        cursorTag.classList.remove('visible');
        card.style.transform = ''; // reset tilt smoothly via CSS transition
      });
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const midX = rect.width / 2, midY = rect.height / 2;
        const rotateY = ((x - midX) / midX) * 3.5;   // max ~3.5deg
        const rotateX = -((y - midY) / midY) * 3.5;
        card.style.transform =
          `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
    });
  }


  /* 2. IMAGE SLIDERS -------------------------- */
  const lightboxState = { images: [], index: 0 };

  document.querySelectorAll('.project-cover').forEach(cover => {
    const slider = cover.querySelector('.slider');
    if (!slider) return; // generated/gradient covers have no slider

    const imgs = [...slider.querySelectorAll('img')].filter(img => img.getAttribute('src'));
    const dotsWrap = cover.querySelector('.slider-dots');
    const prevBtn = cover.querySelector('.slider-nav.prev');
    const nextBtn = cover.querySelector('.slider-nav.next');
    let index = 0;

    // build dots
    imgs.forEach((img, i) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); });
      dotsWrap.appendChild(dot);

      // clicking a photo opens the lightbox at that index
      img.addEventListener('click', () => {
        openLightbox(imgs.map(im => im.getAttribute('src')), i);
      });
    });

    function goTo(i) {
      index = (i + imgs.length) % imgs.length;
      slider.style.transform = `translateX(-${index * 100}%)`;
      [...dotsWrap.children].forEach((d, di) => d.classList.toggle('active', di === index));
    }

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(index + 1); });

    // hide nav/dots entirely if there's only one image
    if (imgs.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      dotsWrap.style.display = 'none';
    }
  });


  /* 3. LIGHTBOX -------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lbPrev = lightbox ? lightbox.querySelector('.lightbox-nav.prev') : null;
  const lbNext = lightbox ? lightbox.querySelector('.lightbox-nav.next') : null;

  function openLightbox(images, startIndex = 0) {
    lightboxState.images = images;
    lightboxState.index = startIndex;
    renderLightbox();
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
  }

  function renderLightbox() {
    lightboxImg.src = lightboxState.images[lightboxState.index];
    const multi = lightboxState.images.length > 1;
    if (lbPrev) lbPrev.style.display = multi ? '' : 'none';
    if (lbNext) lbNext.style.display = multi ? '' : 'none';
  }

  function moveLightbox(dir) {
    const len = lightboxState.images.length;
    lightboxState.index = (lightboxState.index + dir + len) % len;
    renderLightbox();
  }

  if (lightbox) {
    // click the dark backdrop (not the image or arrows) to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); moveLightbox(-1); });
    if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); moveLightbox(1); });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') moveLightbox(-1);
      if (e.key === 'ArrowRight') moveLightbox(1);
    });
  }

});