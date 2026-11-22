(() => {
  'use strict';
  const id = new URLSearchParams(location.search).get('sketch');
  const isVideo = id === 'video-interference';
  const status = document.getElementById('study-status');
  const cameraButton = document.getElementById('camera');
  const sampleButton = document.getElementById('sample');
  const pauseButton = document.getElementById('pause');
  const assets = window.PORTFOLIO_SKETCH_ASSETS;
  const icons = () => window.lucide?.createIcons();
  if ((!isVideo && id !== 'sky-tree-glitch') || !assets || !window.p5) {
    status.textContent = 'Artwork unavailable. Return to the project archive.';
    document.querySelector('.study-controls').hidden = true;
    return;
  }
  const title = isVideo ? 'Video Interference' : 'Sky Tree Glitch';
  document.title = `${title} | Yuerong Zhang`;
  document.getElementById('sketch-title').textContent = title;
  document.getElementById('back-link').href = `project.html?id=${id}`;
  document.body.dataset.sketch = id;
  cameraButton.hidden = sampleButton.hidden = !isVideo;
  const width = isVideo ? 640 : 480;
  const height = isVideo ? 480 : 640;
  const pointer = { x: width * 0.53, y: height * 0.28, down: false };
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let instance;
  let ready = false;
  let frame = 0;
  let sampleIndex = 3;
  let stream = null;
  let cameraVideo = null;
  let cameraPending = false;
  let cameraGeneration = 0;
  let cameraError = '';

  function setStatus() {
    status.textContent = isVideo
      ? cameraError || (cameraPending ? 'Waiting for camera permission' : stream ? 'Live camera / Local processing / No upload' : 'Sample image / Camera off')
      : 'Sky / Tree';
  }
  function updateCameraButton() {
    const action = cameraPending ? 'Cancel' : stream ? 'Stop' : 'Camera';
    cameraButton.querySelector('span').textContent = action;
    cameraButton.title = cameraPending ? 'Cancel camera request' : stream ? 'Stop camera' : 'Enable camera';
    cameraButton.setAttribute('aria-label', cameraButton.title);
    cameraButton.setAttribute('aria-pressed', String(Boolean(stream)));
    sampleButton.disabled = Boolean(stream) || cameraPending;
    setStatus();
  }
  function stopCamera(message = '') {
    cameraGeneration++;
    cameraPending = false;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    if (cameraVideo) {
      cameraVideo.pause();
      cameraVideo.srcObject = null;
      cameraVideo.remove();
      cameraVideo = null;
    }
    cameraError = message;
    updateCameraButton();
    redraw();
  }
  async function toggleCamera() {
    if (stream || cameraPending) { stopCamera(); return; }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      cameraError = 'Camera unavailable here. Use HTTPS or localhost; sample remains available.';
      setStatus();
      return;
    }
    const generation = ++cameraGeneration;
    cameraPending = true;
    cameraError = '';
    updateCameraButton();
    let acquired;
    try {
      acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (generation !== cameraGeneration || document.hidden) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = acquired;
      cameraVideo = document.createElement('video');
      cameraVideo.muted = true;
      cameraVideo.playsInline = true;
      cameraVideo.hidden = true;
      cameraVideo.srcObject = stream;
      document.body.append(cameraVideo);
      await cameraVideo.play();
      if (generation !== cameraGeneration) return;
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', () => {
        if (generation === cameraGeneration) stopCamera('Camera disconnected / Sample image');
      }, { once: true }));
      cameraPending = false;
      updateCameraButton();
      redraw();
    } catch (error) {
      acquired?.getTracks().forEach((track) => track.stop());
      if (generation !== cameraGeneration) return;
      const messages = {
        NotAllowedError: 'Camera permission not granted / Sample image',
        NotFoundError: 'No camera found / Sample image',
        NotReadableError: 'Camera busy or unavailable / Sample image',
        SecurityError: 'Camera blocked in this preview / Sample image'
      };
      stopCamera(messages[error.name] || 'Camera unavailable / Sample image');
    }
  }
  function updatePause() {
    const action = paused ? 'Play artwork' : 'Pause artwork';
    pauseButton.setAttribute('aria-label', action);
    pauseButton.title = action;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
    icons();
    if (ready) {
      if (paused || document.hidden || !visible) instance.noLoop();
      else instance.loop();
    }
  }
  function redraw() { if (ready && paused) instance.redraw(); }
  cameraButton.addEventListener('click', toggleCamera);
  sampleButton.addEventListener('click', () => { sampleIndex = (sampleIndex + 1) % assets.sky.length; cameraError = ''; setStatus(); redraw(); });
  pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); });
  document.getElementById('reset').addEventListener('click', () => {
    frame = 0;
    pointer.x = width * 0.53;
    pointer.y = height * 0.28;
    pointer.down = false;
    if (ready) { instance.clear(); redraw(); }
  });
  document.getElementById('save').addEventListener('click', () => { if (ready) instance.saveCanvas(id, 'png'); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (stream || cameraPending)) stopCamera();
    updatePause();
  });
  window.addEventListener('pagehide', () => { stopCamera(); instance?.noLoop(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updatePause(); }).observe(document.getElementById('canvas-host'));

  async function start() {
    if (!isVideo && window.FontFace) {
      try {
        const bytes = Uint8Array.from(atob(assets.font), (char) => char.charCodeAt(0));
        const font = await new FontFace('Nyushu', bytes).load();
        document.fonts.add(font);
      } catch { /* System glyphs remain available if a font cannot load. */ }
    }
    instance = new p5((p) => {
      const sky = [];
      const tree = [];
      let buffer;
      let cells = [];
      p.preload = () => {
        assets.sky.forEach((src) => sky.push(p.loadImage(src)));
        if (!isVideo) assets.tree.forEach((src) => tree.push(p.loadImage(src)));
      };
      p.setup = () => {
        const canvas = p.createCanvas(width, height);
        canvas.parent('canvas-host');
        p.pixelDensity(1);
        p.frameRate(isVideo ? 20 : 10);
        p.noStroke();
        sky.concat(tree).forEach((img) => img.loadPixels());
        if (isVideo) {
          buffer = p.createGraphics(width, height);
          buffer.pixelDensity(1);
        } else {
          for (let x = 0; x < width; x += 4) for (let y = 0; y < height; y += 6) {
            cells.push({ x, y, offset: (y * width + x) * 4, n: p.noise(x, y), sx: Math.sin(x), cy: Math.cos(y) });
          }
        }
        const element = canvas.elt;
        element.tabIndex = 0;
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', `${title} interactive canvas`);
        const move = (event) => {
          const rect = element.getBoundingClientRect();
          pointer.x = p.constrain((event.clientX - rect.left) / rect.width * width, 0, width - 1);
          pointer.y = p.constrain((event.clientY - rect.top) / rect.height * height, 0, height - 1);
          redraw();
        };
        element.addEventListener('pointermove', move);
        element.addEventListener('pointerdown', (event) => { move(event); pointer.down = true; element.setPointerCapture(event.pointerId); redraw(); });
        const release = () => { pointer.down = false; redraw(); };
        element.addEventListener('pointerup', release);
        element.addEventListener('pointercancel', release);
        element.addEventListener('lostpointercapture', release);
        element.addEventListener('keydown', (event) => {
          const keys = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] };
          if (keys[event.key]) {
            event.preventDefault();
            pointer.x = p.constrain(pointer.x + keys[event.key][0], 0, width - 1);
            pointer.y = p.constrain(pointer.y + keys[event.key][1], 0, height - 1);
            redraw();
          } else if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) { paused = !paused; updatePause(); } }
          else if (event.key === 'Enter') { event.preventDefault(); pointer.down = true; redraw(); }
        });
        element.addEventListener('keyup', (event) => { if (event.key === 'Enter') release(); });
        element.addEventListener('blur', release);
        ready = true;
        setStatus();
        updatePause();
        p.redraw();
      };
      function videoFrame() {
        buffer.image(sky[sampleIndex], 0, 0, width, height);
        if (cameraVideo && cameraVideo.readyState >= 2) {
          const vw = cameraVideo.videoWidth;
          const vh = cameraVideo.videoHeight;
          const scale = Math.max(width / vw, height / vh);
          buffer.drawingContext.drawImage(cameraVideo, (width - vw * scale) / 2, (height - vh * scale) / 2, vw * scale, vh * scale);
        }
        buffer.loadPixels();
        const pixels = buffer.pixels;
        for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
          const offset = (y * width + x) * 4;
          let r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
          if ((x - pointer.x) ** 2 + (y - pointer.y) ** 2 < 80 ** 2) {
            const colour = p.color(r, g, b);
            const h = p.hue(colour), s = Math.max(0, p.saturation(colour) - 10), v = Math.min(100, p.brightness(colour) + 10);
            p.colorMode(p.HSB, 360, 100, 100);
            const changed = p.color(h, s, v);
            r = p.red(changed); g = p.green(changed); b = p.blue(changed);
            p.colorMode(p.RGB, 255);
          } else { if (pointer.x > width / 2) r += 50; else g += 50; b += 50; }
          pixels[offset] = Math.min(255, r);
          pixels[offset + 1] = Math.min(255, g);
          pixels[offset + 2] = Math.min(255, b);
        }
        buffer.updatePixels();
        const dx = pointer.down ? pointer.x + 0.3 * p.map(Math.sin(frame * 0.2), -1, 1, 0, width / 2) : 0;
        const dy = pointer.down ? pointer.y + 0.2 * p.map(Math.cos(frame * 0.1), -1, 1, 0, height / 2) : 0;
        p.image(buffer, dx, dy);
      }
      function skyFrame() {
        p.background(230);
        const si = Math.min(sky.length - 1, Math.floor(pointer.x / width * sky.length));
        const ti = Math.min(tree.length - 1, Math.floor(pointer.x / width * tree.length));
        const upper = pointer.y < height / 2;
        const source = upper ? sky[si] : tree[ti];
        const opposite = upper ? tree[ti] : sky[si];
        const pixels = source.pixels;
        const age = Math.min(frame + 16, 220);
        cells.forEach(({ x, y, offset, n, sx, cy }) => {
          p.fill(pixels[offset], pixels[offset + 1], pixels[offset + 2], pointer.down ? 220 : 150);
          if (pointer.down) p.rect(x, y, 4, 6);
          else {
            const distance = Math.hypot(x - pointer.x, y - pointer.y);
            p.ellipse(x + p.random(distance / width * 5), y + p.random(distance / height * 5), Math.abs(2 * n * age * sx * 0.3), Math.abs(3 * n * age * cy * 0.3));
          }
        });
        const size = p.constrain(p.map(Math.hypot(width / 2 - pointer.x, height / 2 - pointer.y), 100, height / 2, 100, width / 2), 42, width / 2);
        const x = p.constrain(pointer.x - size / 2, 0, width - size);
        const y = p.constrain(pointer.y - size / 2, 0, height - size);
        p.copy(opposite, x, y, size, size, x, y, size, size);
        if (!upper) { p.fill(255, 150); p.rect(x, y, size, size); }
        p.fill(204, 103, 87);
        p.textFont('Nyushu');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(size * 0.28);
        p.text(upper ? '\u5929\u7a7a' : '\u6811', size * 0.6, upper ? size * 0.4 : height - size * 0.4);
        p.text(upper ? '\u6811' : '\u5929\u7a7a', pointer.x, pointer.y);
      }
      p.draw = () => { if (isVideo) videoFrame(); else skyFrame(); frame++; };
    });
  }
  icons();
  start().catch(() => { status.textContent = 'Artwork could not load. Please reload the page.'; });
})();
