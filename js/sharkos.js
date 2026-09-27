document.addEventListener('DOMContentLoaded', () => {
  const dock = document.getElementById('dock-container');
  const desktop = document.getElementById('desktop');
  const iconsContainer = document.getElementById('desktop-icons');
  const windowsContainer = document.getElementById('windows');

  let zIndex = 100;
  let draggedWindow = null;
  let offsetX, offsetY;
  const openWindows = new Set();
  let config = {};

  // Changelog modal
  const changelogModal = document.getElementById('changelog-modal');
  const changelogDismiss = document.getElementById('changelog-dismiss');
  const changelogDontShow = document.getElementById('changelog-dontshow');

  if (sessionStorage.getItem('sharkos-changelog-dismissed') === 'true') {
    changelogModal.classList.add('hidden');
  }

  changelogDismiss.addEventListener('click', () => {
    if (changelogDontShow.checked) {
      sessionStorage.setItem('sharkos-changelog-dismissed', 'true');
    }
    changelogModal.classList.add('hidden');
  });

  document.getElementById('whats-new-btn').addEventListener('click', () => {
    changelogModal.classList.remove('hidden');
  });

  fetch('config.json')
    .then(res => res.json())
    .then(data => {
      config = data;
      window.gameConfig = data.game;
      window.sharkEmoji = data.profile?.partnerEmoji || '🦈';
      applyConfig();
      renderDesktopIcons();
      renderWindows();
      renderDock();
      loadReasons();
      loadPlaylist();
      startClock();
    })
    .catch(err => console.error('Config error:', err));

  function applyConfig() {
    if (!config.app || !config.profile) return;
    document.title = config.app.name || 'SharkOS';

    document.querySelectorAll('[data-config]').forEach(el => {
      const key = el.dataset.config;
      let value = getNestedValue(config, key);
      if (value !== undefined) {
        if (typeof value === 'string' && key.includes('Label')) {
          value = value.replace(/\{\{partner\}\}/g, config.profile.partner);
        }
        el.textContent = value;
      }
    });
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  function renderDesktopIcons() {
    const apps = config.apps || [];
    iconsContainer.innerHTML = apps.map(app => `
      <div class="dsk-icon" data-target="${app.id}">
        <div class="dsk-icon-img">${app.icon}</div>
        <div class="dsk-icon-label">${app.label}</div>
      </div>
    `).join('');
  }

  function renderWindows() {
    const apps = config.apps || [];
    windowsContainer.innerHTML = apps.map(app => {
      if (app.id === 'music') return renderMusicWindow(app);
      if (app.id === 'game') return renderGameWindow(app);
      if (app.id === 'letter') return renderLetterWindow(app);
      if (app.id === 'reasons') return renderReasonsWindow(app);
      if (app.id === 'story') return renderStoryWindow(app);
      return '';
    }).join('');
  }

  function renderStoryWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 90vw; height: 85vh; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div class="window-header" data-drag="${app.id}">
          <div class="window-controls">
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
          </div>
          <span class="window-title">${app.icon} ${app.label}</span>
        </div>
        <div class="window-content" style="padding: 0; overflow: hidden;">
          <iframe src="story.html" style="width: 100%; height: 100%; border: none; background: #0a0a0a;"></iframe>
        </div>
      </div>
    `;
  }

  function renderReasonsWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 480px; height: 420px; top: 80px; left: 50%; transform: translateX(-50%);">
        <div class="window-header" data-drag="${app.id}">
          <div class="window-controls">
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
          </div>
          <span class="window-title">${app.icon} ${app.label}</span>
        </div>
        <div class="window-content">
          <ul class="reasons-list" id="${app.id}-content"></ul>
        </div>
      </div>
    `;
  }

  function renderLetterWindow(app) {
    const letter = config.loveLetter || {};
    const me = config.profile?.me || 'Me';
    const meEmoji = config.profile?.meEmoji || '';
    const partner = config.profile?.partner || 'Love';
    const partnerEmoji = config.profile?.partnerEmoji || '🦈';

    const replaceVars = (str) => str
      .replace(/\{\{me\}\}/g, me)
      .replace(/\{\{meEmoji\}\}/g, meEmoji)
      .replace(/\{\{partner\}\}/g, partner)
      .replace(/\{\{partnerEmoji\}\}/g, partnerEmoji);

    return `
      <div class="window" id="${app.id}" style="width: 480px; height: 420px; top: 90px; left: 50%; transform: translateX(-50%);">
        <div class="window-header" data-drag="${app.id}">
          <div class="window-controls">
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
          </div>
          <span class="window-title">${app.icon} ${app.label}</span>
        </div>
        <div class="window-content letter-content">
          <div class="letter-title">${replaceVars(letter.title || 'Happy Anniversary!')}</div>
          ${(letter.paragraphs || []).map(p => `<p>${replaceVars(p)}</p>`).join('')}
          <div class="letter-signature">${replaceVars(letter.signature || '— Yours')}</div>
        </div>
      </div>
    `;
  }

  function renderGameWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 480px; height: 440px; top: 100px; left: 50%; transform: translateX(-50%);">
        <div class="window-header" data-drag="${app.id}">
          <div class="window-controls">
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
          </div>
          <span class="window-title">${app.icon} ${app.label}</span>
        </div>
        <div class="window-content game-container">
          <div class="game-stats">
            <span>Score: <span id="game-score">0</span></span>
            <span>Lives: <span id="game-lives">❤️❤️❤️</span></span>
          </div>
          <canvas id="game-canvas"></canvas>
          <button id="game-btn">Start Game</button>
        </div>
      </div>
    `;
  }

  function renderMusicWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 460px; height: 380px; top: 110px; left: 50%; transform: translateX(-50%);">
        <div class="window-header" data-drag="${app.id}">
          <div class="window-controls">
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
          </div>
          <span class="window-title">${app.icon} ${app.label}</span>
        </div>
        <div class="window-content">
          <div class="music-now-playing">
            <div class="music-icon">🎵</div>
            <div class="music-song-title">Select a song</div>
          </div>
          <div class="playlist"></div>
          <div class="player-controls">
            <button id="prev-btn">⏮</button>
            <button id="play-pause-btn">▶</button>
            <button id="next-btn">⏭</button>
          </div>
          <input type="range" id="seek-bar" value="0">
          <div class="music-times">
            <span id="current-time">0:00</span>
            <span id="duration">0:00</span>
          </div>
          <div class="volume-control">
            <span>🔊</span>
            <input type="range" id="volume-bar" min="0" max="1" step="0.1" value="0.7">
          </div>
        </div>
      </div>
    `;
  }

  function renderDock() {
    const apps = config.apps || [];
    dock.innerHTML = apps.map(app => `
      <div class="dock-item" data-target="${app.id}" data-label="${app.label}">
        ${app.icon}
      </div>
    `).join('') + `<div class="dock-separator"></div><div class="dock-item" id="dock-finder" style="opacity:0.6;">🗑</div>`;

    // Dock magnification with lerp smoothing
    const dockItems = dock.querySelectorAll('.dock-item');
    const itemScales = new Map();
    const itemTargets = new Map();
    let dockMouseX = -9999;
    let dockHovered = false;

    dockItems.forEach(item => {
      itemScales.set(item, 1);
      itemTargets.set(item, 1);
    });

    dock.addEventListener('mousemove', (e) => {
      const dockRect = dock.parentElement.getBoundingClientRect();
      dockMouseX = e.clientX - dockRect.left;
      dockHovered = true;
    });

    dock.addEventListener('mouseleave', () => {
      dockHovered = false;
      dockMouseX = -9999;
    });

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function updateDock() {
      if (dockHovered) {
        const dockRect = dock.parentElement.getBoundingClientRect();
        dockItems.forEach(item => {
          const itemRect = item.getBoundingClientRect();
          const itemCenter = itemRect.left - dockRect.left + itemRect.width / 2;
          const distance = Math.abs(dockMouseX - itemCenter);
          const maxDist = 100;
          const target = distance < maxDist ? 1 + (1 - distance / maxDist) * 0.4 : 1;
          itemTargets.set(item, target);
        });
      } else {
        dockItems.forEach(item => itemTargets.set(item, 1));
      }

      dockItems.forEach(item => {
        const current = itemScales.get(item);
        const target = itemTargets.get(item);
        const next = lerp(current, target, 0.2);
        itemScales.set(item, next);
        const lift = (next - 1) * 14;
        item.style.transform = `translateY(-${lift}px) scale(${next})`;
      });

      requestAnimationFrame(updateDock);
    }

    requestAnimationFrame(updateDock);
  }

  function loadReasons() {
    const container = document.getElementById('reasons-content');
    if (!container || !config.reasons) return;
    container.innerHTML = config.reasons.map(r => `<li>${r}</li>`).join('');
  }

  const audio = new Audio();
  audio.volume = 0.7;
  let currentTrack = 0;

  function loadPlaylist() {
    const playlist = document.querySelector('.playlist');
    if (!playlist || !config.playlist) return;
    playlist.innerHTML = config.playlist.map((track, i) => `
      <div class="track" data-src="${track.src}" data-index="${i}">
        <span>${track.title}</span>
        <span class="play-btn">▶</span>
      </div>
    `).join('');
    setupPlayer();
  }

  function setupPlayer() {
    const tracks = document.querySelectorAll('.track');

    audio.addEventListener('timeupdate', () => {
      const seekBar = document.getElementById('seek-bar');
      if (seekBar && audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current-time').textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      document.getElementById('duration').textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => playNext());

    tracks.forEach((track, index) => {
      track.addEventListener('click', () => {
        currentTrack = index;
        loadTrack(index);
        audio.play();
        document.getElementById('play-pause-btn').textContent = '⏸';
      });
    });

    document.getElementById('play-pause-btn')?.addEventListener('click', togglePlay);
    document.getElementById('next-btn')?.addEventListener('click', playNext);
    document.getElementById('prev-btn')?.addEventListener('click', playPrev);
    document.getElementById('seek-bar')?.addEventListener('input', (e) => {
      if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });
    document.getElementById('volume-bar')?.addEventListener('input', (e) => {
      audio.volume = parseFloat(e.target.value);
    });
  }

  function loadTrack(index) {
    const tracks = document.querySelectorAll('.track');
    const track = tracks[index];
    if (!track) return;
    audio.src = track.dataset.src;
    const titleEl = document.querySelector('.music-song-title');
    if (titleEl) titleEl.textContent = track.querySelector('span').textContent;
    tracks.forEach(t => t.classList.remove('playing'));
    track.classList.add('playing');
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play();
      document.getElementById('play-pause-btn').textContent = '⏸';
    } else {
      audio.pause();
      document.getElementById('play-pause-btn').textContent = '▶';
    }
  }

  function playNext() {
    const tracks = document.querySelectorAll('.track');
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
    audio.play();
    document.getElementById('play-pause-btn').textContent = '⏸';
  }

  function playPrev() {
    const tracks = document.querySelectorAll('.track');
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
    audio.play();
    document.getElementById('play-pause-btn').textContent = '⏸';
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function startClock() {
    const now = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function update() {
      const n = new Date();
      const h = n.getHours() % 12 || 12;
      const m = n.getMinutes().toString().padStart(2, '0');
      const ampm = n.getHours() >= 12 ? 'PM' : 'AM';
      const timeStr = `${h}:${m}`;
      const dateStr = `${months[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`;

      document.getElementById('menu-clock').textContent = `${timeStr} ${ampm}`;
      document.getElementById('widget-time').textContent = timeStr;
      document.getElementById('widget-date').textContent = dateStr;
    }

    update();
    setInterval(update, 1000);
  }

  // Window management
  function openWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.classList.remove('closing');
      win.classList.add('active');
      win.style.zIndex = ++zIndex;
      openWindows.add(id);
      updateDockActive();
    }
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.classList.add('closing');
      setTimeout(() => {
        win.classList.remove('active', 'closing');
      }, 250);
      openWindows.delete(id);
      updateDockActive();
      if (id === 'music') {
        audio.pause();
        const btn = document.getElementById('play-pause-btn');
        if (btn) btn.textContent = '▶';
      }
    }
  }

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.classList.add('closing');
      setTimeout(() => {
        win.classList.remove('active', 'closing');
      }, 250);
      openWindows.delete(id);
      updateDockActive();
    }
  }

  function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.classList.contains('maximized')) {
      win.classList.remove('maximized');
      win.style.width = '';
      win.style.height = '';
      win.style.top = '';
      win.style.left = '';
      win.style.transform = '';
    } else {
      win.classList.add('maximized');
      win.style.width = '100%';
      win.style.height = 'calc(100vh - 40px)';
      win.style.top = '40px';
      win.style.left = '0';
      win.style.transform = 'none';
    }
  }

  function updateDockActive() {
    document.querySelectorAll('.dock-item').forEach(item => {
      const target = item.dataset.target;
      const win = document.getElementById(target);
      item.classList.toggle('active', win?.classList.contains('active'));
    });
  }

  // Event delegation
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.dock-item') && !e.target.closest('#dock-finder')) {
      const id = e.target.closest('.dock-item').dataset.target;
      const win = document.getElementById(id);
      if (win?.classList.contains('active')) {
        minimizeWindow(id);
      } else {
        openWindow(id);
      }
    }

    if (e.target.closest('.dsk-icon')) {
      const id = e.target.closest('.dsk-icon').dataset.target;
      openWindow(id);
    }

    if (e.target.closest('[data-action="close"]')) {
      const id = e.target.closest('[data-action="close"]').dataset.target;
      closeWindow(id);
    }

    if (e.target.closest('[data-action="minimize"]')) {
      const id = e.target.closest('[data-action="minimize"]').dataset.target;
      minimizeWindow(id);
    }

    if (e.target.closest('[data-action="maximize"]')) {
      const id = e.target.closest('[data-action="maximize"]').dataset.target;
      maximizeWindow(id);
    }
  });

  // Window dragging
  document.body.addEventListener('mousedown', (e) => {
    const header = e.target.closest('[data-drag]');
    if (header) {
      draggedWindow = document.getElementById(header.dataset.drag);
      if (!draggedWindow) return;
      draggedWindow.style.zIndex = ++zIndex;
      const rect = draggedWindow.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
    }
  });

  function doDrag(e) {
    if (draggedWindow && !draggedWindow.classList.contains('maximized')) {
      draggedWindow.style.left = (e.clientX - offsetX) + 'px';
      draggedWindow.style.top = (e.clientY - offsetY) + 'px';
      draggedWindow.style.transform = 'none';
    }
  }

  function stopDrag() {
    draggedWindow = null;
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  // Desktop icon selection
  desktop.addEventListener('click', (e) => {
    if (e.target.id === 'desktop') {
      document.querySelectorAll('.dsk-icon').forEach(icon => icon.classList.remove('selected'));
    }
  });

  document.querySelectorAll('.dsk-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.dsk-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    });
  });
});