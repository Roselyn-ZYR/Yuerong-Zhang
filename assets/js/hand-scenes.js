(() => {
  'use strict';
  const mount = document.querySelector('[data-proximity-scenes]');
  if (!mount) return;
  mount.closest('article')?.classList.add('has-proximity-scenes');
  const project = (window.PORTFOLIO_PROJECTS || []).find((item) => item.id === new URLSearchParams(location.search).get('id'));
  const scenes = project?.proximityScenes || [];
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const asset = (value) => /^assets\/images\/hand-[\w-]+\.jpg$/.test(value || '');
  const valid = scenes.filter((scene) => asset(scene.ambient) && asset(scene.lit));
  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  mount.className = 'hand-scenes';
  mount.innerHTML = valid.map((scene, index) => `<section class="hand-scene${scene.layout === 'wide' ? ' is-wide' : scene.layout === 'closing' ? ' is-closing' : ''}" aria-labelledby="scene-title-${index}">
    <figure class="scene-figure">
      <button class="proximity-scene" type="button" aria-label="Illuminate ${escape(scene.title)}" aria-pressed="false" aria-describedby="scene-title-${index}" style="--scene-ratio: ${scene.width} / ${scene.height}">
        <img class="scene-ambient" src="${escape(scene.ambient)}" alt="${escape(scene.alt)}" width="${scene.width}" height="${scene.height}" loading="lazy">
        <span class="scene-lit" aria-hidden="true"><img src="${escape(scene.lit)}" alt="" width="${scene.width}" height="${scene.height}" loading="lazy"></span>
      </button>
      <figcaption class="scene-image-caption"><span class="scene-state" data-ambient-label="${escape(scene.ambientLabel)}" data-active-label="${escape(scene.activeLabel)}">${escape(scene.ambientLabel)}</span><div class="scene-image-tools">
        ${asset(scene.study) ? `<button type="button" class="scene-study" data-src="${escape(scene.study)}" data-alt="${escape(scene.title)}: unlit ceramic study" aria-label="View unlit study of ${escape(scene.title)}" title="Unlit study">${icon('moon')}</button>` : ''}
        <button type="button" class="scene-enlarge" aria-label="Enlarge ${escape(scene.title)}" title="Enlarge image">${icon('expand')}</button>
      </div></figcaption>
    </figure>
    <div class="scene-copy">
      <div class="scene-title"><p class="scene-index mono">${scene.layout === 'wide' ? 'Installation' : scene.layout === 'closing' ? 'The centre' : `0${index} / Scene`}</p>
      <h2 id="scene-title-${index}">${escape(scene.title)}</h2>
      <p class="scene-phrase-zh" lang="zh-Hans">${escape(scene.phraseZh || scene.titleZh)}</p>
      ${scene.phrase ? `<p class="scene-phrase-en">${escape(scene.phrase)}</p>` : ''}</div>
      <div class="scene-description"><p class="scene-meaning">${escape(scene.text)}</p>
      <p class="scene-meaning-zh" lang="zh-Hans">${escape(scene.textZh)}</p></div>
    </div>
  </section>`).join('');
  window.lucide?.createIcons();

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const states = [...mount.querySelectorAll('.proximity-scene')].map((button) => ({
    button,
    caption: button.parentElement.querySelector('.scene-state'),
    visible: false,
    focused: false,
    pinned: false,
    near: false,
    ready: false
  }));
  let pointer = null;
  let frame = 0;
  const setState = (state, near) => {
    const active = !document.hidden && state.visible && state.ready && (near || state.focused || state.pinned);
    state.near = active;
    state.button.classList.toggle('is-near', active);
    state.button.setAttribute('aria-pressed', String(active));
    state.caption.textContent = active ? state.caption.dataset.activeLabel : state.caption.dataset.ambientLabel;
  };
  const update = () => {
    frame = 0;
    let nearest = null;
    let distance = 64;
    if (pointer && !document.hidden) {
      for (const state of states) {
        if (!state.visible) continue;
        const rect = state.button.getBoundingClientRect();
        const dx = Math.max(rect.left - pointer.x, 0, pointer.x - rect.right);
        const dy = Math.max(rect.top - pointer.y, 0, pointer.y - rect.bottom);
        const gap = Math.hypot(dx, dy);
        if (gap < distance) { distance = gap; nearest = state; }
      }
    }
    states.forEach((state) => setState(state, state === nearest));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const state = states.find((item) => item.button === entry.target);
      state.visible = entry.isIntersecting;
      if (!state.visible) { state.pinned = false; state.focused = false; }
    });
    schedule();
  });
  const dialog = document.getElementById('lightbox');
  const dialogImage = document.getElementById('lightbox-image');
  const enlarge = (src, alt) => {
    if (!dialog || !dialogImage) return;
    dialogImage.src = src;
    dialogImage.alt = alt;
    dialog.showModal();
    pointer = null;
    states.forEach((state) => { state.pinned = false; state.focused = false; setState(state, false); });
  };
  states.forEach((state) => {
    const light = state.button.querySelector('.scene-lit img');
    const ready = () => { state.ready = light.naturalWidth > 0; schedule(); };
    light.addEventListener('load', ready);
    if (light.complete) ready();
    observer.observe(state.button);
    state.button.addEventListener('focus', () => {
      state.focused = state.button.matches(':focus-visible');
      schedule();
    });
    state.button.addEventListener('blur', () => { state.focused = false; state.pinned = false; schedule(); });
    state.button.addEventListener('click', () => {
      state.focused = false;
      state.pinned = !state.pinned;
      if (state.pinned) states.forEach((other) => { if (other !== state) other.pinned = false; });
      schedule();
    });
    state.button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { state.pinned = false; state.focused = false; pointer = null; schedule(); }
    });
    const figure = state.button.parentElement;
    figure.querySelector('.scene-enlarge').addEventListener('click', () => {
      const image = state.button.querySelector(state.near ? '.scene-lit img' : '.scene-ambient');
      enlarge(image.getAttribute('src'), state.button.querySelector('.scene-ambient').alt);
    });
    figure.querySelector('.scene-study')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      enlarge(button.dataset.src, button.dataset.alt);
    });
  });
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || dialog?.open) return;
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; schedule(); });
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') pointer = null;
    if (!event.target.closest('.proximity-scene')) states.forEach((state) => { state.pinned = false; state.focused = false; });
    schedule();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { pointer = null; schedule(); });
  window.addEventListener('blur', () => { pointer = null; states.forEach((state) => { state.focused = false; state.pinned = false; }); schedule(); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  const updateMotion = () => mount.classList.toggle('is-still', reducedMotion.matches);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
})();
