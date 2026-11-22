(() => {
  const carousel = document.querySelector('[data-teaching-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.teaching-poster-track');
  const slides = [...track.children];
  const controls = carousel.querySelector('.teaching-carousel-controls');
  const counter = controls.querySelector('output');
  const play = controls.querySelector('[data-poster-play]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let playing = !motion.matches;
  let inView = false;
  let hovered = false;
  let focused = false;
  let timer;

  const offset = (index) => slides[index].offsetLeft - slides[0].offsetLeft;
  const schedule = () => {
    clearTimeout(timer);
    if (playing && inView && !hovered && !focused && !document.hidden) {
      timer = setTimeout(() => show(current + 1), 6000);
    }
  };
  const update = () => {
    let distance = Infinity;
    slides.forEach((slide, index) => {
      const delta = Math.abs(offset(index) - track.scrollLeft);
      if (delta < distance) { distance = delta; current = index; }
    });
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    schedule();
  };
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    track.scrollTo({ left: offset(current), behavior: 'instant' });
    update();
  };
  const updatePlay = () => {
    const label = playing ? 'Pause poster slideshow' : 'Play poster slideshow';
    play.setAttribute('aria-label', label);
    play.setAttribute('aria-pressed', String(playing));
    play.title = label;
    play.innerHTML = `<i data-lucide="${playing ? 'pause' : 'play'}"></i>`;
    window.lucide?.createIcons();
    schedule();
  };

  controls.hidden = false;
  controls.querySelector('[data-poster-prev]').addEventListener('click', () => show(current - 1));
  controls.querySelector('[data-poster-next]').addEventListener('click', () => show(current + 1));
  play.addEventListener('click', () => { playing = !playing; updatePlay(); });
  track.addEventListener('scroll', update, { passive: true });
  carousel.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  carousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', () => { focused = true; schedule(); });
  carousel.addEventListener('focusout', (event) => { focused = carousel.contains(event.relatedTarget); schedule(); });
  carousel.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  window.addEventListener('resize', () => { track.scrollTo({ left: offset(current), behavior: 'instant' }); update(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', (event) => { if (event.matches) { playing = false; updatePlay(); } });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedule(); }, { threshold: 0.15 }).observe(carousel);
  update();
  updatePlay();
})();
