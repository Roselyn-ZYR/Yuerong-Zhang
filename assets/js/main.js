(() => {
  'use strict';
  function projectYear(project) {
    const year = String(project.year ?? '').trim();
    if (/\b(?:ongoing|present)\b|进行中|至今/i.test(year)) return Infinity;
    const years = year.match(/\b\d{4}\b/g);
    return years ? Math.max(...years.map(Number)) : -Infinity;
  }

  const projects = [...(window.PORTFOLIO_PROJECTS || [])].sort((left, right) => {
    const leftYear = projectYear(left);
    const rightYear = projectYear(right);
    return leftYear === rightYear ? 0 : rightYear - leftYear;
  });
  const page = document.body.dataset.page;
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const projectUrl = (project) => `project.html?id=${encodeURIComponent(project.id)}`;
  const imageSize = (width, height) => Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0
    ? { width, height } : { width: 1200, height: 900 };
  const projectImageSize = (project) => project.coverCrop
    ? imageSize(project.coverCrop.width, project.coverCrop.height)
    : imageSize(project.imageWidth, project.imageHeight);
  const coverImageStyle = (project) => {
    if (!project.coverCrop) return '';
    const size = projectImageSize(project);
    const y = Number(project.coverCrop.positionY);
    const position = Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50;
    return ` style="aspect-ratio: ${size.width} / ${size.height}; object-fit: cover; object-position: 50% ${position}%;"`;
  };
  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const refreshIcons = () => window.lucide?.createIcons();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => motion.matches ? 'instant' : 'smooth';

  const headerSlot = document.querySelector('[data-site-header]');
  const nav = [
    ['work', 'Work', 'work.html'], ['profile', 'About', 'about.html'],
    ['teaching', 'Teaching', 'teaching.html'],
    ['contact', 'Contact', 'contact.html']
  ];
  if (headerSlot) {
    headerSlot.innerHTML = `<header class="site-header"><a class="identity" href="index.html" aria-label="Yuerong Zhang home"><span class="identity-name">Yuerong Zhang</span></a><button class="menu-button icon-button" aria-label="Open navigation" title="Open navigation" aria-expanded="false" aria-controls="primary-nav" type="button">${icon('menu')}</button><div class="header-actions"><nav class="primary-nav" id="primary-nav" aria-label="Main navigation">${nav.map(([id, title, url]) => `<a href="${url}"${page === id || (id === 'work' && ['project', 'gallery'].includes(page)) ? ' aria-current="page"' : ''}>${title}</a>`).join('')}</nav><button class="theme-toggle icon-button" id="theme-toggle" type="button" aria-label="Switch to dark mode" title="Switch to dark mode" aria-pressed="false">${icon('moon')}</button></div></header>`;
  }
  const footer = document.querySelector('[data-site-footer]');
  if (footer) footer.innerHTML = `<footer class="site-footer"><span>© ${new Date().getFullYear()} Yuerong Zhang</span><nav aria-label="Additional links"><a href="research.html">Research</a><a href="mailto:roselynzyr@gmail.com">Email</a><a href="https://www.instagram.com/zhang_yuerong_521/" target="_blank" rel="noopener noreferrer">Instagram</a></nav></footer>`;

  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-button');
  const primaryNav = document.querySelector('.primary-nav');
  function setMenuBackground(open) {
    document.querySelector('main').inert = open;
    if (footer) footer.inert = open;
  }
  function closeMenu() {
    if (!menu) return;
    document.body.classList.remove('menu-open');
    setMenuBackground(false);
    primaryNav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    menu.title = 'Open navigation';
    menu.innerHTML = icon('menu');
    refreshIcons();
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    document.body.classList.toggle('menu-open', open);
    setMenuBackground(open);
    primaryNav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.title = open ? 'Close navigation' : 'Open navigation';
    menu.innerHTML = icon(open ? 'x' : 'menu');
    refreshIcons();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      closeMenu();
      menu.focus();
    }
  });
  primaryNav?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  matchMedia('(min-width: 541px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });
  header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const sideIndex = document.querySelector('.side-index');
  const sideLinks = [...document.querySelectorAll('.side-index a')];
  const sections = sideLinks.map((link) => document.querySelector(link.hash)).filter(Boolean);
  let lastScrollY = window.scrollY;
  let scrollFrame = false;
  function updateScroll() {
    const y = Math.max(window.scrollY, 0);
    if (Math.abs(y - lastScrollY) > 4 || y < 90) {
      const hide = y > lastScrollY && y > 90 && !document.body.classList.contains('menu-open') && !header?.contains(document.activeElement);
      header?.classList.toggle('is-hidden', hide);
      lastScrollY = y;
    }
    document.body.classList.toggle('is-scrolled', y > 40);
    if (sideIndex) {
      sideIndex.classList.toggle('is-visible', y > 180);
      const marker = innerHeight * .46;
      const current = sections.filter((section) => section.getBoundingClientRect().top <= marker).at(-1);
      sideIndex.classList.toggle('is-paper', !!current?.classList.contains('paper'));
      sideLinks.forEach((link) => {
        if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    scrollFrame = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) { scrollFrame = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  const grid = document.querySelector('[data-project-grid]');
  if (grid) {
    const featured = grid.dataset.projectGrid === 'featured';
    const visible = featured ? projects.filter((project) => project.featured && project.homeGallery !== false) : projects;
    const yearLabel = (year) => year === Infinity ? 'Ongoing' : year === -Infinity ? 'Undated' : String(year);
    const projectCard = (project) => {
      const size = projectImageSize(project);
      const title = !featured && project.headingEn && project.headingZh
        ? `${escape(project.headingEn)}<span class="archive-title-zh" lang="zh-Hans"> / ${escape(project.headingZh)}</span>`
        : escape(project.title);
      const thumbnail = `<img src="${escape(project.image)}" alt="${escape(project.alt)}" width="${size.width}" height="${size.height}"${coverImageStyle(project)} loading="lazy">`;
      const media = !featured && project.coverCrop ? `<div class="archive-crop" style="aspect-ratio: ${size.width} / ${size.height}">${thumbnail}</div>` : thumbnail;
      const archiveYear = !featured ? ` data-year="${yearLabel(projectYear(project))}"` : '';
      return `<a class="project-card" data-category="${escape(project.category)}"${archiveYear} href="${projectUrl(project)}" style="--cover-ratio: ${size.width} / ${size.height}"><div class="project-image${project.imageFit === 'contain' ? ' is-contained' : ''}">${media}${project.image.endsWith('.svg') ? '<span class="image-note">Image study</span>' : ''}</div><div class="card-label"><div><h3>${title}</h3><p>${escape(project.category)}${featured && project.year ? ` / ${escape(project.year)}` : ''}</p></div>${icon('arrow-up-right')}</div></a>`;
    };
    if (featured) {
      const rows = [];
      for (let index = 0; index < visible.length; index += 2) {
        const row = visible.slice(index, index + 2);
        const columns = row.map((project) => {
          const size = projectImageSize(project);
          return `minmax(0, ${size.width / size.height}fr)`;
        }).join(' ');
        rows.push(`<div class="project-row${row.length === 1 ? ' is-single' : ''}" style="--project-columns: ${columns}">${row.map(projectCard).join('')}</div>`);
      }
      grid.innerHTML = rows.join('');
    }
    const yearNav = document.getElementById('archive-years');
    const archive = document.querySelector('.archive-section');
    const toolbar = document.querySelector('.archive-toolbar');
    const timeline = document.querySelector('.archive-timeline');
    const yearUrl = (year) => {
      const params = new URLSearchParams(location.search);
      params.set('year', year);
      return `?${params}${location.hash}`;
    };
    let archiveCards = [];
    let archiveYearStarts = [];
    let archiveFrame = false;
    let archiveJump = null;
    const archiveOffset = () => toolbar.offsetHeight + (matchMedia('(max-width: 760px)').matches ? timeline.offsetHeight : 0) + 24;
    function setActiveYear(year) {
      if (!yearNav) return;
      const links = [...yearNav.querySelectorAll('a')];
      const active = links.find((link) => link.dataset.year === year);
      if (!active || active.getAttribute('aria-current') === 'location') return;
      links.forEach((link) => {
        if (link === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (matchMedia('(max-width: 760px)').matches) {
        yearNav.scrollTo({ left: active.offsetLeft - yearNav.offsetLeft - (yearNav.clientWidth - active.offsetWidth) / 2, behavior: behavior() });
      }
    }
    function updateArchiveYear() {
      archiveFrame = false;
      if (!archiveCards.length) return;
      const offset = archiveOffset();
      const marker = offset + 4;
      if (archiveJump) {
        const top = Math.max(0, Math.min(window.scrollY + archiveJump.card.getBoundingClientRect().top - offset, document.documentElement.scrollHeight - innerHeight));
        if (Math.abs(window.scrollY - top) < 2) {
          archiveJump.arrived = true;
          setActiveYear(archiveJump.year);
          return;
        }
        if (archiveJump.arrived) archiveJump = null;
      }
      const atBottom = window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
      const positions = archiveCards.map((card) => ({ card, top: card.getBoundingClientRect().top }));
      const crossed = positions.filter((item) => item.top <= marker);
      const latest = crossed.at(-1) || positions[0];
      const row = crossed.filter((item) => Math.abs(item.top - latest.top) < 1);
      const currentYear = yearNav?.querySelector('[aria-current="location"]')?.dataset.year;
      // Years can share a row; keep a clicked year selected until that row passes.
      const active = atBottom ? positions.at(-1) : row.find((item) => item.card.dataset.year === currentYear) || row[0] || latest;
      setActiveYear(active.card.dataset.year);
    }
    function queueArchiveYear() {
      if (!archiveFrame) { archiveFrame = true; requestAnimationFrame(updateArchiveYear); }
    }
    function layoutArchiveCovers() {
      const works = grid.querySelector('.archive-works');
      if (!works) return;
      const styles = getComputedStyle(works);
      const gap = parseFloat(styles.getPropertyValue('--archive-card-gap'));
      const rowHeight = parseFloat(styles.getPropertyValue('--archive-row-height'));
      const cards = archiveCards.map((card) => ({ card, span: Math.ceil((card.getBoundingClientRect().height + gap) / rowHeight) }));
      cards.forEach(({ card, span }) => {
        const placement = `span ${span}`;
        if (card.style.gridRowEnd !== placement) card.style.gridRowEnd = placement;
      });
      works.classList.add('is-measured');
      queueArchiveYear();
    }
    const coverObserver = !featured && 'ResizeObserver' in window ? new ResizeObserver(layoutArchiveCovers) : null;
    function goToYear(year, save = true) {
      const firstCard = archiveYearStarts.find((item) => item.dataset.year === year);
      if (!firstCard) return;
      if (save) history.replaceState(null, '', yearUrl(year));
      setActiveYear(year);
      archiveJump = { card: firstCard, year, arrived: false };
      window.scrollTo({ top: window.scrollY + firstCard.getBoundingClientRect().top - archiveOffset(), behavior: behavior() });
    }
    const renderArchive = (items) => {
      const years = new Map();
      items.forEach((project) => {
        const year = projectYear(project);
        if (!years.has(year)) years.set(year, []);
        years.get(year).push(project);
      });
      if (yearNav) yearNav.innerHTML = [...years].map(([year, entries]) => {
        const label = yearLabel(year);
        return `<a href="${escape(yearUrl(label))}" data-year="${label}" aria-controls="archive-year-${label.toLowerCase()}"><span>${label}</span><small>${entries.length}</small></a>`;
      }).join('');
      return `<div class="archive-works">${items.map(projectCard).join('')}</div>`;
    };
    const buttons = [...document.querySelectorAll('[data-filter]')];
    const categories = { media: 'Media Art', robotic: 'Robotic Fabrication', spatial: 'Spatial Design', drawing: 'Painting & Drawing' };
    const filter = () => {
      const category = categories[location.hash.slice(1)] || 'All';
      const selected = visible.filter((project) => category === 'All' || project.category === category);
      if (featured) {
        grid.querySelectorAll('.project-card').forEach((card) => {
          card.hidden = category !== 'All' && card.dataset.category !== category;
        });
      } else {
        coverObserver?.disconnect();
        archiveJump = null;
        grid.innerHTML = renderArchive(selected);
        archiveCards = [...grid.querySelectorAll('.project-card')];
        archiveYearStarts = archiveCards.filter((card, index) => index === 0 || card.dataset.year !== archiveCards[index - 1].dataset.year);
        archiveYearStarts.forEach((card) => { card.id = `archive-year-${card.dataset.year.toLowerCase()}`; });
        queueArchiveYear();
        refreshIcons();
        if (coverObserver) {
          layoutArchiveCovers();
          archiveCards.forEach((card) => coverObserver.observe(card));
        }
      }
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      const countNode = document.getElementById('work-count');
      if (countNode) countNode.textContent = `${String(selected.length).padStart(2, '0')} projects`;
    };
    buttons.forEach((button) => button.addEventListener('click', () => {
      const key = Object.keys(categories).find((name) => categories[name] === button.dataset.filter);
      const params = new URLSearchParams(location.search);
      params.delete('year');
      history.replaceState(null, '', location.pathname + (params.size ? `?${params}` : '') + (key ? `#${key}` : ''));
      filter();
      if (!featured) archive.scrollIntoView({ block: 'start', behavior: behavior() });
    }));
    window.addEventListener('hashchange', filter);
    if (!featured) {
      yearNav?.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-year]');
        if (!link || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        goToYear(link.dataset.year);
      });
      yearNav?.addEventListener('keydown', (event) => {
        const link = event.target.closest('a[data-year]');
        const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!link || !keys.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const links = [...yearNav.querySelectorAll('a')];
        const index = links.indexOf(link);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : Math.max(0, Math.min(links.length - 1, index + (['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1)));
        links[next].focus({ preventScroll: true });
        goToYear(links[next].dataset.year);
      });
      window.addEventListener('scroll', queueArchiveYear, { passive: true });
      const cancelArchiveJump = () => { archiveJump = null; };
      window.addEventListener('wheel', cancelArchiveJump, { passive: true });
      window.addEventListener('touchstart', cancelArchiveJump, { passive: true });
      const updateArchiveToolbar = () => {
        if (toolbar && archive) archive.style.setProperty('--archive-toolbar-height', `${toolbar.offsetHeight}px`);
        queueArchiveYear();
      };
      window.addEventListener('resize', updateArchiveToolbar);
      if (toolbar && archive && 'ResizeObserver' in window) new ResizeObserver(updateArchiveToolbar).observe(toolbar);
      updateArchiveToolbar();
    }
    filter();
    if (!featured) {
      const requestedYear = new URLSearchParams(location.search).get('year');
      if (requestedYear) requestAnimationFrame(() => goToYear(requestedYear, false));
    }
  }

  const target = document.getElementById('project');
  if (target) {
    const project = projects.find((item) => item.id === new URLSearchParams(location.search).get('id'));
    if (!project) {
      target.innerHTML = '<section class="page-intro"><p class="eyebrow">Project archive</p><h1>Find a work.</h1><p>This project is not in the archive.</p><a class="text-link" href="work.html">Browse all projects</a></section>';
    } else {
      document.title = `${project.title} | Yuerong Zhang`;
      const next = projects[(projects.indexOf(project) + 1) % projects.length];
      const allPhotos = Array.isArray(project.images) ? project.images : [];
      const documentationGroups = (Array.isArray(project.documentationGroups) ? project.documentationGroups : [])
        .filter((group) => group.id && allPhotos.some((photo) => photo.group === group.id));
      const groupIds = new Set(documentationGroups.map((group) => group.id));
      const documentation = allPhotos.filter((photo) => !groupIds.has(photo.group));
      const coverSize = projectImageSize(project);
      const portraitCover = coverSize.width < coverSize.height;
      const rows = [];
      const rowCapacity = project.documentationColumns === 3 ? 3 : 2;
      let pendingPhotos = [];
      // Portraits form pairs or triptychs; an unpaired portrait stays centred.
      for (const photo of documentation) {
        const size = imageSize(photo.width, photo.height);
        if (photo.layout === 'single') {
          if (pendingPhotos.length) { rows.push(pendingPhotos); pendingPhotos = []; }
          rows.push([photo]);
          continue;
        }
        if (size.width < size.height || photo.layout === 'pair') {
          pendingPhotos.push(photo);
          if (pendingPhotos.length === rowCapacity) { rows.push(pendingPhotos); pendingPhotos = []; }
        } else {
          if (pendingPhotos.length) { rows.push(pendingPhotos); pendingPhotos = []; }
          rows.push([photo]);
        }
      }
      if (pendingPhotos.length) rows.push(pendingPhotos);
      const photoCaption = (photo) => {
        const answers = Array.isArray(photo.answers) ? photo.answers : [];
        if (!photo.question && !answers.length) return photo.caption ? `<figcaption>${escape(photo.caption)}</figcaption>` : '';
        const bilingual = !!photo.questionZh;
        const answerList = answers.map((answer) => answer && typeof answer === 'object'
          ? `<li><span class="answer-zh" lang="zh-Hans">${escape(answer.zh)}</span><span class="answer-en">${escape(answer.en)}</span></li>`
          : `<li>${escape(answer)}</li>`).join('');
        return `<figcaption class="documentation-caption${bilingual ? ' is-bilingual' : ''}">${photo.caption ? `<p class="caption-label">${escape(photo.caption)}</p>` : ''}${photo.captionZh ? `<p class="caption-label-zh" lang="zh-Hans">${escape(photo.captionZh)}</p>` : ''}${photo.question ? `<h3 class="caption-question">${escape(photo.question)}</h3>` : ''}${photo.questionZh ? `<p class="caption-question-zh" lang="zh-Hans">${escape(photo.questionZh)}</p>` : ''}${answers.length ? `<ul class="caption-answers">${answerList}</ul>` : ''}${photo.captionNote ? `<p class="caption-note">${photo.captionNoteZh ? `<span lang="zh-Hans">${escape(photo.captionNoteZh)}</span> / ` : ''}${escape(photo.captionNote)}</p>` : ''}</figcaption>`;
      };
      const photoFigure = (photo) => {
        const size = imageSize(photo.width, photo.height);
        return `<figure><button class="documentation-image" type="button" aria-label="Enlarge image: ${escape(photo.alt)}"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${size.width}" height="${size.height}" loading="lazy"></button>${photoCaption(photo)}</figure>`;
      };
      const documentationClass = ['compact', 'spacious'].includes(project.documentationLayout) ? ` is-${project.documentationLayout}` : '';
      const photos = rows.length ? `<div class="documentation${documentationClass}">${rows.map((row) => {
        const sizes = row.map((photo) => imageSize(photo.width, photo.height));
        const columns = sizes.map((size) => `minmax(0, ${size.width / size.height}fr)`).join(' ');
        const singlePortrait = row.length === 1 && sizes[0].width < sizes[0].height;
        return `<div class="documentation-row${singlePortrait ? ' is-single-portrait' : ''}" style="--photo-columns: ${columns}">${row.map(photoFigure).join('')}</div>`;
      }).join('')}${project.documentationCaption ? `<p class="documentation-note">${escape(project.documentationCaption)}</p>` : ''}</div>` : '';
      const groupedPhotos = documentationGroups.length ? `<div class="documentation-groups">${documentationGroups.map((group) => {
        const layout = ['material', 'study', 'wide'].includes(group.layout) ? ` is-${group.layout}` : '';
        const columns = group.columns === 3 ? 3 : 2;
        return `<section class="documentation-group${layout}" style="--study-columns: ${columns}" aria-label="${escape(group.title)}"><div class="documentation-group-copy"><h2>${escape(group.title)}</h2>${group.text ? `<p>${escape(group.text)}</p>` : ''}</div><div class="documentation-group-images">${allPhotos.filter((photo) => photo.group === group.id).map(photoFigure).join('')}</div></section>`;
      }).join('')}</div>` : '';
      const sections = Array.isArray(project.sections) ? project.sections : [];
      const story = sections.length ? `<div class="project-story">${sections.map((section) => `<section><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></section>`).join('')}</div>` : '';
      const isLocalImageLink = (link) => /^assets\/images\/[\w-]+\.(?:jpe?g|png)$/i.test(link.url);
      const links = (project.links || []).filter((link) => /^(https?:\/\/|mailto:)/i.test(link.url) || isLocalImageLink(link));
      const related = projects.find((item) => item.id === project.relatedProject);
      const source = /^assets\/source\/[\w-]+\.pde$/.test(project.source?.src || '') ? project.source : null;
      const credits = Array.isArray(project.credits) ? project.credits : [];
      const creditFacts = credits.map((credit) => `<div><dt>${escape(credit.role)}</dt><dd>${escape(credit.name)}</dd></div>`).join('');
      const videoId = String(project.video?.vimeoId || '');
      const requestedRatio = Number(project.video?.aspectRatio);
      const videoRatio = Number.isFinite(requestedRatio) && requestedRatio >= 0.25 && requestedRatio <= 4 ? requestedRatio : 16 / 9;
      const localVideo = /^assets\/videos\/[\w-]+\.mp4$/.test(project.video?.src || '') ? project.video.src : '';
      const interactiveId = ['video-interference', 'sky-tree-glitch'].includes(project.interactive?.id) ? project.interactive.id : '';
      const interactiveRatio = interactiveId === 'sky-tree-glitch' ? 0.75 : 4 / 3;
      const interactive = interactiveId ? `<div class="project-interactive-frame" style="--interactive-ratio: ${interactiveRatio}"><iframe src="interactive.html?sketch=${interactiveId}&embed=1" title="${escape(project.title)} interactive artwork" ${interactiveId === 'video-interference' ? 'allow="camera"' : ''} referrerpolicy="no-referrer"></iframe></div>` : '';
      const audioSrc = /^assets\/audio\/[\w-]+\.mp3$/.test(project.audio?.src || '') ? project.audio.src : '';
      const audio = audioSrc ? `<section class="project-audio" aria-label="${escape(project.title)} audio"><img class="audio-waveform" src="${escape(project.image)}" alt="${escape(project.alt)}" width="${coverSize.width}" height="${coverSize.height}"><div class="audio-listening-note">${icon('headphones')}<p>${escape(project.audio.listeningNote || 'Please listen with headphones.')}</p>${project.audio.duration ? `<span class="mono">${escape(project.audio.duration)}</span>` : ''}</div><audio hidden preload="metadata" controlslist="nodownload" aria-label="Listen to ${escape(project.title)}"><source src="${escape(audioSrc)}" type="audio/mpeg"></audio><div class="audio-player" role="group" aria-label="Audio player"><button class="audio-play" type="button" aria-label="Play audio" title="Play audio">${icon('play')}</button><input class="audio-seek" type="range" min="0" max="0" value="0" step="0.1" aria-label="Audio position" disabled><output class="audio-time">0:00 / --:--</output><button class="audio-mute" type="button" aria-label="Mute audio" title="Mute audio">${icon('volume-2')}</button><input class="audio-volume" type="range" min="0" max="100" value="100" step="1" aria-label="Volume"></div><p class="audio-status" role="status"></p></section>` : '';
      const video = /^\d+$/.test(videoId) ? `<section class="project-video" aria-label="${escape(project.title)} film"><div class="project-video-frame" style="--video-ratio: ${videoRatio}"><iframe src="https://player.vimeo.com/video/${videoId}?dnt=1" title="${escape(project.title)} film" loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></section>` : localVideo ? `<section class="project-video" aria-label="${escape(project.title)} film" style="--video-ratio: ${videoRatio}"><div class="project-video-frame"><video controls playsinline preload="none" poster="${escape(project.image)}" width="${coverSize.width}" height="${coverSize.height}" aria-label="${escape(project.title)} screen recording"><source src="${escape(localVideo)}" type="video/mp4"><a href="${escape(localVideo)}" download>Download film</a></video></div>${project.video.caption ? `<p class="project-video-caption">${escape(project.video.caption)}</p>` : ''}</section>` : '';
      target.innerHTML = `
        <div class="project-heading">
          <a class="text-link" href="work.html">${icon('arrow-left')} Work archive</a>
          <h1>${project.headingEn && project.headingZh ? `${escape(project.headingEn)}<span class="project-title-zh" lang="zh-Hans">${escape(project.headingZh)}</span>` : escape(project.title)}</h1>
          ${project.subtitle ? `<p class="project-subtitle">${escape(project.subtitle)}</p>` : ''}
        </div>
        <div class="section paper project-content">
          <div class="project-overview${portraitCover ? ' is-portrait' : ''}">
            <figure class="project-cover">
              ${audio || interactive || (localVideo ? video : `<button class="project-feature" type="button" aria-label="Enlarge ${escape(project.title)} image"><img src="${escape(project.image)}" alt="${escape(project.alt)}" width="${coverSize.width}" height="${coverSize.height}"${coverImageStyle(project)}></button>`)}
              ${!audioSrc && !interactiveId && !localVideo && project.imageCredit ? `<figcaption>${escape(project.imageCredit)}</figcaption>` : ''}
            </figure>
            <div class="project-details">
              <div class="project-summary">
                <p class="project-description">${escape(project.description)}</p>
                ${project.body ? `<p class="project-body">${escape(project.body)}</p>` : ''}
                ${links.length || related || source ? `<div class="inline-links">${links.map((link) => `<a class="text-link" href="${escape(link.url)}" target="_blank" rel="noopener noreferrer">${escape(link.label)} ${icon('arrow-up-right')}</a>`).join('')}${related ? `<a class="text-link" href="${projectUrl(related)}">${escape(related.title)} ${icon('arrow-right')}</a>` : ''}${source ? `<a class="text-link" href="${escape(source.src)}" download>${escape(source.label || 'Processing sketch')} ${icon('download')}</a>` : ''}</div>` : ''}
              </div>
              <dl class="facts">
                <div><dt>Field</dt><dd>${escape(project.category)}</dd></div>
                ${project.period || project.year ? `<div><dt>Period</dt><dd>${escape(project.period || project.year)}</dd></div>` : ''}
                ${project.materials ? `<div><dt>Tools & materials</dt><dd>${escape(project.materials)}</dd></div>` : ''}
                ${audioSrc && project.audio.duration ? `<div><dt>Duration</dt><dd>${escape(project.audio.duration)}</dd></div>` : ''}
                ${project.role ? `<div><dt>Contribution</dt><dd>${escape(project.role)}</dd></div>` : ''}
                ${creditFacts}
              </dl>
            </div>
          </div>
          ${story}${localVideo || interactiveId ? '' : video}${Array.isArray(project.proximityScenes) && project.proximityScenes.length ? '<div data-proximity-scenes></div>' : ''}${photos}${groupedPhotos}
          <nav class="project-navigation" aria-label="Project navigation"><a class="text-link" href="work.html">${icon('arrow-left')} All works</a><a class="text-link" href="${projectUrl(next)}">${escape(next.title)} ${icon('arrow-right')}</a></nav>
        </div>`;
      const player = target.querySelector('.audio-player');
      if (player) {
        const media = target.querySelector('audio');
        const play = player.querySelector('.audio-play');
        const seek = player.querySelector('.audio-seek');
        const time = player.querySelector('.audio-time');
        const mute = player.querySelector('.audio-mute');
        const volume = player.querySelector('.audio-volume');
        const status = target.querySelector('.audio-status');
        const formatTime = (seconds) => {
          const safe = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
          return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
        };
        const updatePosition = () => {
          const hasDuration = Number.isFinite(media.duration) && media.duration > 0;
          seek.disabled = !hasDuration;
          seek.max = hasDuration ? String(media.duration) : '0';
          seek.value = hasDuration ? String(media.currentTime) : '0';
          seek.setAttribute('aria-valuetext', `${formatTime(media.currentTime)} of ${hasDuration ? formatTime(media.duration) : 'unknown duration'}`);
          time.textContent = `${formatTime(media.currentTime)} / ${hasDuration ? formatTime(media.duration) : '--:--'}`;
        };
        const updatePlay = () => {
          const label = media.paused ? 'Play audio' : 'Pause audio';
          play.setAttribute('aria-label', label);
          play.title = label;
          play.innerHTML = icon(media.paused ? 'play' : 'pause');
          refreshIcons();
        };
        const updateVolume = () => {
          const silent = media.muted || media.volume === 0;
          const label = silent ? 'Unmute audio' : 'Mute audio';
          mute.setAttribute('aria-label', label);
          mute.title = label;
          mute.innerHTML = icon(silent ? 'volume-x' : 'volume-2');
          volume.value = String(Math.round(media.volume * 100));
          refreshIcons();
        };
        play.addEventListener('click', async () => {
          status.textContent = '';
          if (!media.paused) { media.pause(); return; }
          try { await media.play(); }
          catch (error) {
            if (error.name !== 'AbortError') status.textContent = 'Audio could not be played. Please try again.';
          }
        });
        seek.addEventListener('input', () => {
          if (Number.isFinite(media.duration) && media.duration > 0) {
            media.currentTime = Math.max(0, Math.min(media.duration, Number(seek.value)));
            updatePosition();
          }
        });
        mute.addEventListener('click', () => {
          if (media.volume === 0) { media.volume = 0.5; media.muted = false; }
          else media.muted = !media.muted;
          updateVolume();
        });
        volume.addEventListener('input', () => {
          media.volume = Math.max(0, Math.min(1, Number(volume.value) / 100));
          if (media.volume > 0) media.muted = false;
          updateVolume();
        });
        ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked'].forEach((event) => media.addEventListener(event, updatePosition));
        ['play', 'pause', 'ended'].forEach((event) => media.addEventListener(event, updatePlay));
        media.addEventListener('volumechange', updateVolume);
        media.addEventListener('error', () => { status.textContent = 'Audio is currently unavailable. Please try again later.'; });
        updatePosition();
        updatePlay();
        updateVolume();
      }
    }
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  if (lightbox && lightboxImage) {
    document.querySelectorAll('.project-feature, .documentation-image').forEach((button) => {
      button.addEventListener('click', () => {
        const image = button.querySelector('img');
        lightboxImage.src = image.getAttribute('src');
        lightboxImage.alt = image.alt;
        lightbox.showModal();
      });
    });
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  }

  const heroArt = document.getElementById('hero-art');
  const heroProjects = projects.filter((project) => project.homeGallery !== false);
  if (heroArt && heroProjects.length) {
    const hero = document.querySelector('.hero');
    const play = document.getElementById('hero-play');
    hero.style.setProperty('--hero-max-ratio', Math.max(...heroProjects.map((project) => {
      const size = projectImageSize(project);
      return size.width / size.height;
    })));
    heroArt.innerHTML = heroProjects.map((project, index) => {
      const size = projectImageSize(project);
      return `<article class="hero-slide" role="listitem" style="--hero-image-ratio: ${size.width / size.height}"><a href="${projectUrl(project)}" title="${escape(project.title)}"><div class="hero-slide-media"><img src="${escape(project.image)}" alt="${escape(project.alt)}" width="${size.width}" height="${size.height}"${coverImageStyle(project)} loading="${index < 3 ? 'eager' : 'lazy'}"${index === 0 ? ' fetchpriority="high"' : ''} draggable="false"></div><div class="hero-slide-caption"><h2>${escape(project.title)}</h2><p class="hero-slide-meta">${escape(project.category)}${project.year ? ` / ${escape(project.year)}` : ''}</p><p class="hero-slide-credit" title="${escape(project.imageCredit || '')}">${escape(project.imageCredit || '')}</p></div></a></article>`;
    }).join('');
    const slides = [...heroArt.children];
    let current = 0;
    let playing = false;
    let timer;
    let hovered = false;
    let focused = false;
    let nativeScroll = false;
    const offset = (index) => slides[index].offsetLeft - slides[0].offsetLeft;
    const maxScroll = () => Math.max(0, heroArt.scrollWidth - heroArt.clientWidth);
    const position = (index) => index === slides.length - 1 ? maxScroll() : Math.min(offset(index), maxScroll());
    function schedule() {
      clearTimeout(timer);
      if (playing && !hovered && !focused && !document.hidden) timer = setTimeout(() => show(current + 1), 6000);
    }
    function update() {
      document.getElementById('hero-counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(heroProjects.length).padStart(2, '0')}`;
      slides.forEach((slide, index) => {
        if (index === current) slide.setAttribute('aria-current', 'true');
        else slide.removeAttribute('aria-current');
      });
      schedule();
    }
    function readScroll() {
      // Several trailing slides can share the same scroll limit on wide screens.
      if (!nativeScroll && Math.abs(position(current) - heroArt.scrollLeft) < 1) return;
      if (heroArt.scrollLeft <= 1) current = 0;
      else if (heroArt.scrollLeft >= maxScroll() - 1) current = slides.length - 1;
      else {
        let distance = Infinity;
        slides.forEach((slide, index) => {
          const delta = Math.abs(position(index) - heroArt.scrollLeft);
          if (delta < distance) { distance = delta; current = index; }
        });
      }
      update();
    }
    function show(index, focusSlide = false) {
      current = (index + heroProjects.length) % heroProjects.length;
      nativeScroll = false;
      // Button steps are immediate; swiping and trackpads retain native scrolling.
      heroArt.scrollTo({ left: position(current), behavior: 'instant' });
      if (focusSlide) slides[current].querySelector('a').focus({ preventScroll: true });
      update();
    }
    function layout() {
      show(current);
    }
    function updatePlay() {
      const label = playing ? 'Pause slideshow' : 'Play slideshow';
      play.setAttribute('aria-label', label);
      play.setAttribute('aria-pressed', String(playing));
      play.title = label;
      play.innerHTML = icon(playing ? 'pause' : 'play');
      refreshIcons();
      schedule();
    }
    document.getElementById('hero-prev').addEventListener('click', () => show(current - 1));
    document.getElementById('hero-next').addEventListener('click', () => show(current + 1));
    play.addEventListener('click', () => { playing = !playing; updatePlay(); });
    heroArt.addEventListener('scroll', readScroll, { passive: true });
    ['wheel', 'touchstart', 'pointerdown'].forEach((event) => heroArt.addEventListener(event, () => {
      nativeScroll = true;
    }, { passive: true }));
    heroArt.addEventListener('focusin', (event) => {
      const index = slides.indexOf(event.target.closest('.hero-slide'));
      if (index >= 0 && index !== current) show(index);
    });
    window.addEventListener('resize', layout);
    heroArt.addEventListener('mouseenter', () => { hovered = true; schedule(); });
    heroArt.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    hero.addEventListener('focusin', (event) => { focused = heroArt.contains(event.target); schedule(); });
    hero.addEventListener('focusout', (event) => { focused = heroArt.contains(event.relatedTarget); schedule(); });
    hero.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? heroProjects.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1);
        show(index, !!event.target.closest('.hero-slide'));
      }
    });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', (event) => { if (event.matches) { playing = false; updatePlay(); } });
    layout();
  }

  const rail = document.getElementById('exhibition-rail');
  if (rail) {
    const selected = projects.filter((project) => project.featured);
    rail.innerHTML = selected.map((project) => `<article class="exhibition-slide${project.imageFit === 'contain' ? ' is-contained' : ''}"><a href="${projectUrl(project)}"><img src="${escape(project.image)}" alt="${escape(project.alt)}" width="1200" height="900" draggable="false"></a><div class="exhibition-caption"><h2><a href="${projectUrl(project)}">${escape(project.title)}</a></h2><p class="eyebrow">${escape(project.category)}</p></div></article>`).join('');
    const slides = [...rail.children];
    const dots = document.getElementById('exhibition-dots');
    dots.innerHTML = selected.map((project) => `<button type="button" aria-label="Go to ${escape(project.title)}"></button>`).join('');
    const prev = document.getElementById('gallery-prev');
    const next = document.getElementById('gallery-next');
    let active = 0;
    const offset = (index) => slides[index].offsetLeft - slides[0].offsetLeft;
    function select(index) {
      rail.scrollTo({ left: offset(Math.max(0, Math.min(slides.length - 1, index))), behavior: behavior() });
    }
    function update() {
      let distance = Infinity;
      slides.forEach((slide, index) => {
        const delta = Math.abs(offset(index) - rail.scrollLeft);
        if (delta < distance) { distance = delta; active = index; }
      });
      [...dots.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
      prev.disabled = active === 0;
      next.disabled = active === slides.length - 1;
      document.getElementById('exhibition-counter').textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    }
    prev.addEventListener('click', () => select(active - 1));
    next.addEventListener('click', () => select(active + 1));
    [...dots.children].forEach((button, i) => button.addEventListener('click', () => select(i)));
    rail.addEventListener('scroll', update, { passive: true });
    rail.addEventListener('keydown', (event) => {
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        select(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    window.addEventListener('resize', () => { rail.scrollTo({ left: offset(active), behavior: 'instant' }); update(); });
    update();
  }
  refreshIcons();
})();
