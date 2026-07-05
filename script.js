// ============================================================
  // HOW TO ADD A REAL VIDEO — read this, then delete this comment
  // ============================================================
  // Anywhere you see <div class="p-slide video-slot">...</div>, replace
  // the whole div with this instead:
  //
  //   <div class="p-slide">
  //     <video src="videos/your-clip.mp4" autoplay muted loop playsinline></video>
  //   </div>
  //
  // Why each attribute matters:
  //   autoplay  — starts on its own, no click needed
  //   muted     — REQUIRED for autoplay to work in every browser. a video
  //               with sound will simply refuse to autoplay without it.
  //   loop      — restarts when it ends, so it behaves like a background loop
  //   playsinline — stops iOS Safari from hijacking it into fullscreen
  //
  // Where "videos/your-clip.mp4" points matters too: it has to be a real
  // file sitting next to this html file (or a full https:// URL if you're
  // hosting it elsewhere, e.g. on the same server as the rest of your site).
  // Keep clips short and compressed (a few MB, not 100MB) or the page will
  // load slowly — HandBrake (free) is the easiest way to compress an .mp4.
  //
  // Same technique works in the hero: swap the <svg> inside .portrait-wrap
  // for a <video autoplay muted loop playsinline> the same way.
  // ============================================================


  // ---- particle preloader: scattered dots settle into "nikita" ----
  const DURATION = 7000; // ms — 5-10s range, real visitors won't bounce
  const preloader = document.getElementById('preloader');
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let rafId = null;
  let introFinished = false;

  document.body.style.overflow = 'hidden'; // lock scroll while it plays

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  function buildParticles(){
    const word = 'nikita';

    // 1) draw the word onto an offscreen canvas so we can read where
    // the actual ink landed — those pixels become our target points
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    const fontSize = Math.min(160, window.innerWidth * 0.14);
    off.width = canvas.width;
    off.height = fontSize * 1.6;
    offCtx.fillStyle = '#000';
    offCtx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(word, off.width / 2, off.height / 2);

    const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;

    // 2) sample every 4th pixel on a grid — enough to read as letterforms
    // without creating tens of thousands of particles
    const step = 4;
    const targets = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const alpha = imgData[(y * off.width + x) * 4 + 3];
        if (alpha > 120) {
          targets.push({
            x: x,
            y: (y - off.height / 2) + canvas.height / 2
          });
        }
      }
    }

    // 3) one particle per target point, starting from a random scattered
    // position — this random start is the "entropy" state
    particles = targets.map(t => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      tx: t.x,
      ty: t.y,
      r: 1 + Math.random() * 1.6,
      opacity: 0.3 + Math.random() * 0.6,
      jitterSeed: Math.random() * Math.PI * 2
    }));
  }

  function easeInOutCubic(t){
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  let startTime = null;
  function animate(ts){
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    const eased = easeInOutCubic(progress);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      // jitter fades out as particles approach their target —
      // chaotic wobble early on, dead still once "settled"
      const wobble = Math.sin(elapsed / 400 + p.jitterSeed) * (1 - eased) * 14;
      const cx = p.x + (p.tx - p.x) * eased + wobble;
      const cy = p.y + (p.ty - p.y) * eased + wobble * 0.6;

      ctx.beginPath();
      ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10,10,10,${p.opacity * (0.5 + eased * 0.5)})`;
      ctx.fill();
    });

    if (progress < 1 && !introFinished) {
      rafId = requestAnimationFrame(animate);
    } else if (!introFinished) {
      setTimeout(finishIntro, 500); // hold on the finished word for a beat
    }
  }

  function finishIntro(){
    if (introFinished) return;
    introFinished = true;
    if (rafId) cancelAnimationFrame(rafId);
    preloader.classList.add('hide');
    document.body.style.overflow = '';
  }

  buildParticles();
  rafId = requestAnimationFrame(animate);
  window.addEventListener('resize', () => { resizeCanvas(); buildParticles(); });
  document.getElementById('skipIntro').addEventListener('click', finishIntro);

  // live clock
  const clockEl = document.getElementById('clock');
  function tick(){
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);

  // custom cursor: small by default, tracking the mouse directly (no easing —
  // easing would feel laggy for something standing in for the real pointer).
  // On hovering an interactive element, it stops following the mouse and
  // instead grows to frame that element's actual bounding box.
  const customCursor = document.getElementById('customCursor');
  const DEFAULT_SIZE = 18;
  const HOVER_PADDING = 8; // frame sits a little outside the element's edges
  let mouseX = 0, mouseY = 0;
  let isExpanded = false;

  function positionDefault(){
    customCursor.style.width = DEFAULT_SIZE + 'px';
    customCursor.style.height = DEFAULT_SIZE + 'px';
    customCursor.style.left = (mouseX - DEFAULT_SIZE / 2) + 'px';
    customCursor.style.top = (mouseY - DEFAULT_SIZE / 2) + 'px';
  }

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if(!isExpanded) positionDefault();
  });
  positionDefault();

  const cursorTargets = document.querySelectorAll(
    'a, button, .pill, .p-head, .skill-pill, .work-card, input, textarea'
  );
  cursorTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
      isExpanded = true;
      customCursor.classList.add('expanded');
      const r = el.getBoundingClientRect();
      customCursor.style.width = (r.width + HOVER_PADDING * 2) + 'px';
      customCursor.style.height = (r.height + HOVER_PADDING * 2) + 'px';
      customCursor.style.left = (r.left - HOVER_PADDING) + 'px';
      customCursor.style.top = (r.top - HOVER_PADDING) + 'px';
    });
    el.addEventListener('mouseleave', () => {
      isExpanded = false;
      customCursor.classList.remove('expanded');
      positionDefault();
    });
  });

  // clip the white marquee layer to exactly the photo's rectangle,
  // so the text only turns white while it's passing over the photo
  const heroEl = document.querySelector('.hero');
  const portraitEl = document.querySelector('.portrait-wrap');
  const whiteLayer = document.getElementById('whiteLayer');

  function updateClip(){
    const heroRect = heroEl.getBoundingClientRect();
    const pRect = portraitEl.getBoundingClientRect();
    const top = pRect.top - heroRect.top;
    const left = pRect.left - heroRect.left;
    const right = heroRect.right - pRect.right;
    const bottom = heroRect.bottom - pRect.bottom;
    whiteLayer.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  }
  updateClip();
  window.addEventListener('resize', updateClip);
  window.addEventListener('load', updateClip);

  // keep the two tracks perfectly synced by restarting both animations
  // on the same animation frame (guards against any load-timing drift)
  const trackBlack = document.getElementById('trackBlack');
  const trackWhite = document.getElementById('trackWhite');
  requestAnimationFrame(() => {
    trackBlack.style.animation = 'none';
    trackWhite.style.animation = 'none';
    void trackBlack.offsetWidth; // force reflow
    trackBlack.style.animation = '';
    trackWhite.style.animation = '';
  });

  // intro row fade-in on scroll
  const introRow = document.getElementById('introRow');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) introRow.classList.add('visible'); });
  }, { threshold: 0.3 });
  io.observe(introRow);

  // ---- skills: reveal progressively as you scroll through the section,
  // not all at once — each pill's reveal point is tied to scroll position ----
  const skillsCloud = document.getElementById('skillsCloud');
  const skillPills = skillsCloud.querySelectorAll('.skill-pill');

  function updateSkills(){
    const rect = skillsCloud.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress 0 → cloud just entering from the bottom, progress 1 → fully scrolled past
    const start = vh * 0.9;
    const end = vh * 0.25;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
    const total = skillPills.length;
    skillPills.forEach((pill, i) => {
      pill.classList.toggle('visible', i / total < progress);
    });
  }

  let skillsTicking = false;
  window.addEventListener('scroll', () => {
    if(skillsTicking) return;
    skillsTicking = true;
    requestAnimationFrame(() => { updateSkills(); skillsTicking = false; });
  });
  updateSkills();

  // ---- swot: trigger the geometry draw-in once, the first time it scrolls into view ----
  const swotDiagram = document.getElementById('swotDiagram');
  const swotObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        swotDiagram.classList.add('in-view');
        swotObserver.unobserve(swotDiagram);
      }
    });
  }, { threshold: 0.35 });
  swotObserver.observe(swotDiagram);

  // menu dropdown: toggle open/closed, close on outside click or after picking a link
  const menuToggle = document.getElementById('menuToggle');
  const menuDropdown = document.getElementById('menuDropdown');
  const menuBackdrop = document.getElementById('menuBackdrop');

  function closeMenu(){
    menuDropdown.classList.remove('open');
    menuBackdrop.classList.remove('open');
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menuDropdown.classList.toggle('open');
    menuBackdrop.classList.toggle('open', isOpen);
  });
  menuBackdrop.addEventListener('click', closeMenu);
  document.addEventListener('click', (e) => {
    if(!menuDropdown.contains(e.target) && e.target !== menuToggle){
      closeMenu();
    }
  });
  menuDropdown.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ---- swipeable card dots: build dots per card, keep them synced to scroll ----
  document.querySelectorAll('.p-card').forEach(cardEl => {
    const slidesEl = cardEl.querySelector('.p-slides');
    const dotsEl = cardEl.querySelector('.p-dots');
    const slideCount = slidesEl.children.length;

    for(let i = 0; i < slideCount; i++){
      const dot = document.createElement('span');
      if(i === 0) dot.classList.add('active');
      dotsEl.appendChild(dot);
    }
    const dots = dotsEl.children;

    let ticking = false;
    slidesEl.addEventListener('scroll', () => {
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const index = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth);
        Array.from(dots).forEach((d, i) => d.classList.toggle('active', i === index));
        ticking = false;
      });
    });
  });