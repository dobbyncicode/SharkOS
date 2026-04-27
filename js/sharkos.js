document.addEventListener('DOMContentLoaded', () => {
  const startMenu = document.getElementById('start-menu');
  const desktop = document.getElementById('desktop');
  const taskbarWindows = document.getElementById('taskbar-windows');
  const iconsContainer = document.getElementById('icons');
  const windowsContainer = document.getElementById('windows');
  const menuItemsContainer = document.getElementById('menu-items');
  
  let zIndex = 100;
  let draggedWindow = null;
  let offsetX, offsetY;
  const openWindows = new Set();
  let config = {};

  fetch('config.json')
    .then(res => res.json())
    .then(data => {
      config = data;
      window.gameConfig = data.game;
      window.sharkEmoji = data.profile?.partnerEmoji || '🦈';
      applyTheme();
      applyConfig();
      renderIcons();
      renderWindows();
      renderMenu();
      loadReasons();
      loadPlaylist();
    })
    .catch(err => console.log('Config error:', err));

  function applyTheme() {
    if (!config.theme?.colors) return;
    const root = document.documentElement;
    Object.entries(config.theme.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
  }

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

  function renderIcons() {
    const apps = config.apps || [];
    iconsContainer.innerHTML = apps.map(app => `
      <div class="icon" data-target="${app.id}">
        <div class="icon-img">${app.icon}</div>
        <div class="icon-label" data-config="app.${app.id}Label">${app.label}</div>
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
      return '';
    }).join('');
  }

  function renderReasonsWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 500px; height: 400px; top: 80px; left: 200px;">
        <div class="window-header" data-drag="${app.id}">
          <span class="window-title">${app.icon} <span data-config="app.${app.id}Label">${app.label}</span></span>
          <div class="window-controls">
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
          </div>
        </div>
        <div class="window-content" id="${app.id}-content" style="line-height: 2;"></div>
      </div>
    `;
  }

  function renderLetterWindow(app) {
    const letter = config.loveLetter || {};
    const me = config.profile?.me || 'Me';
    const meEmoji = config.profile?.meEmoji || '🧑';
    const partner = config.profile?.partner || 'Love';
    const partnerEmoji = config.profile?.partnerEmoji || '🦈';
    
    const replaceVars = (str) => str
      .replace(/\{\{me\}\}/g, me)
      .replace(/\{\{meEmoji\}\}/g, meEmoji)
      .replace(/\{\{partner\}\}/g, partner)
      .replace(/\{\{partnerEmoji\}\}/g, partnerEmoji);
    
    return `
      <div class="window" id="${app.id}" style="width: 500px; height: 400px; top: 90px; left: 220px;">
        <div class="window-header" data-drag="${app.id}">
          <span class="window-title">${app.icon} <span data-config="app.${app.id}Label">${app.label}</span></span>
          <div class="window-controls">
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
          </div>
        </div>
        <div class="window-content" style="font-style: italic; line-height: 2;">
          <p style="margin-bottom: 24px; text-align: center; color: var(--accent);">
            ${replaceVars(letter.title || 'Happy Anniversary!')}
          </p>
          ${(letter.paragraphs || []).map(p => `<p style="margin-bottom: 16px;">${replaceVars(p)}</p>`).join('<br>')}
          <p style="text-align: right; margin-top: 24px;">
            ${replaceVars(letter.signature || '— Yours')}
          </p>
        </div>
      </div>
    `;
  }

  function renderGameWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 450px; height: 400px; top: 120px; left: 180px;">
        <div class="window-header" data-drag="${app.id}">
          <span class="window-title">${app.icon} <span data-config="app.${app.id}Label">${app.label}</span></span>
          <div class="window-controls">
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
          </div>
        </div>
        <div class="window-content" style="display: flex; flex-direction: column; align-items: center;">
          <div class="game-stats" style="display: flex; gap: 24px; margin-bottom: 12px; font-size: 14px;">
            <span>Score: <span id="game-score">0</span></span>
            <span>Lives: <span id="game-lives">❤️❤️❤️</span></span>
          </div>
          <canvas id="game-canvas"></canvas>
          <button id="game-btn" style="margin-top: 12px; padding: 8px 16px; background: var(--accent); border: none; border-radius: 4px; cursor: pointer;">Start Game</button>
        </div>
      </div>
    `;
  }

  function renderMusicWindow(app) {
    return `
      <div class="window" id="${app.id}" style="width: 450px; height: 350px; top: 150px; left: 250px;">
        <div class="window-header" data-drag="${app.id}">
          <span class="window-title">${app.icon} <span data-config="app.${app.id}Label">${app.label}</span></span>
          <div class="window-controls">
            <div class="window-btn minimize" data-action="minimize" data-target="${app.id}"></div>
            <div class="window-btn maximize" data-action="maximize" data-target="${app.id}"></div>
            <div class="window-btn close" data-action="close" data-target="${app.id}"></div>
          </div>
        </div>
        <div class="window-content">
          <div class="now-playing" id="now-playing" style="text-align: center; margin-bottom: 20px; padding: 16px; background: var(--bg-dark); border-radius: 8px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🎵</div>
            <div class="song-title" style="font-weight: bold;">Select a song</div>
          </div>
          <div class="playlist"></div>
          <div class="player-controls" style="margin-top: 24px; display: flex; align-items: center; gap: 12px; justify-content: center;">
            <button id="prev-btn">⏮</button>
            <button id="play-pause-btn">▶</button>
            <button id="next-btn">⏭</button>
          </div>
          <input type="range" id="seek-bar" value="0" style="width: 100%; margin-top: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim);">
            <span id="current-time">0:00</span>
            <span id="duration">0:00</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
            <span style="font-size: 12px;">🔊</span>
            <input type="range" id="volume-bar" min="0" max="1" step="0.1" value="0.7" style="flex: 1;">
          </div>
        </div>
      </div>
    `;
  }

  function renderMenu() {
    const apps = config.apps || [];
    const loveApps = apps.filter(a => a.menu === 'love');
    
    menuItemsContainer.innerHTML = `
      <div class="menu-section">
        <div class="menu-title">${config.app?.menuLabels?.love || 'Love'}</div>
        ${loveApps.map(app => `
          <div class="menu-item" data-target="${app.id}">
            <span class="menu-icon">${app.icon}</span>
            <span data-config="app.${app.id}Label">${app.label}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    document.querySelector('#start-menu .avatar').textContent = config.profile?.ownerEmoji || '🧑';
    document.querySelector('#start-menu .name').textContent = config.profile?.owner || 'Owner';
    document.querySelector('#start-menu .status').textContent = config.profile?.status || 'Status';
  }

  function loadReasons() {
    const container = document.getElementById('reasons-content');
    if (!container || !config.reasons) return;
    
    container.innerHTML = config.reasons.map((r, i) => 
      `<p style="margin-bottom: 16px;">${i + 1}. ${r}</p>`
    ).join('');
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
      if (audio.duration) {
        audio.currentTime = (e.target.value / 100) * audio.duration;
      }
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
    const titleEl = document.querySelector('.song-title');
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

  function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    document.getElementById('time').textContent = `${hours}:${minutes}`;
    document.getElementById('taskbar-time').textContent = `${hours}:${minutes} ${ampm}`;
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('date').textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }
  
  setInterval(updateClock, 1000);
  updateClock();

  function updateTaskbar() {
    if (!taskbarWindows) return;
    
    taskbarWindows.innerHTML = Array.from(openWindows).map(id => {
      const win = document.getElementById(id);
      const app = config.apps?.find(a => a.id === id);
      const title = app ? `${app.icon} ${app.label}` : id;
      return `<div class="taskbar-window ${win?.classList.contains('active') ? 'active' : ''}" data-target="${id}">${title}</div>`;
    }).join('');
  }

  document.body.addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.closest('[data-action="toggle-start"]')) {
      startMenu.classList.toggle('active');
      return;
    }
    
    if (!target.closest('#start-menu') && !target.closest('#start-btn')) {
      startMenu.classList.remove('active');
    }
    
    if (target.closest('.icon')) {
      const win = target.closest('.icon').dataset.target;
      openWindow(win);
    }
    
    if (target.closest('.menu-item')) {
      const win = target.closest('.menu-item').dataset.target;
      if (win) openWindow(win);
    }
    
    if (target.closest('.taskbar-window')) {
      const win = target.closest('.taskbar-window').dataset.target;
      toggleWindow(win);
    }
    
    if (target.closest('[data-action="close"]')) {
      const win = target.closest('[data-action="close"]').dataset.target;
      closeWindow(win);
    }
    
    if (target.closest('[data-action="minimize"]')) {
      const win = target.closest('[data-action="minimize"]').dataset.target;
      minimizeWindow(win);
    }
    
    if (target.closest('[data-action="maximize"]')) {
      const win = target.closest('[data-action="maximize"]').dataset.target;
      maximizeWindow(win);
    }
  });

  function openWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.classList.add('active');
      win.style.zIndex = ++zIndex;
      openWindows.add(id);
      updateTaskbar();
      startMenu.classList.remove('active');
    }
  }

  function toggleWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    
    if (win.classList.contains('active')) {
      minimizeWindow(id);
    } else {
      openWindow(id);
    }
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.classList.remove('active');
      openWindows.delete(id);
      updateTaskbar();
      
      if (id === 'music') {
        audio.pause();
        document.getElementById('play-pause-btn').textContent = '▶';
      }
    }
  }

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.classList.remove('active');
      updateTaskbar();
    }
  }

  function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    
    if (win.style.width === '100%') {
      win.style.width = '';
      win.style.height = '';
      win.style.top = '';
      win.style.left = '';
    } else {
      win.style.width = '100%';
      win.style.height = 'calc(100vh - 48px)';
      win.style.top = '0';
      win.style.left = '0';
    }
  }

  document.body.addEventListener('mousedown', (e) => {
    const header = e.target.closest('[data-drag]');
    if (header) {
      draggedWindow = document.getElementById(header.dataset.drag);
      if (!draggedWindow) return;
      
      const rect = draggedWindow.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
    }
  });

  function doDrag(e) {
    if (draggedWindow) {
      draggedWindow.style.left = (e.clientX - offsetX) + 'px';
      draggedWindow.style.top = (e.clientY - offsetY) + 'px';
    }
  }

  function stopDrag() {
    draggedWindow = null;
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  desktop.addEventListener('click', (e) => {
    if (e.target.id === 'desktop') {
      document.querySelectorAll('.icon').forEach(icon => icon.classList.remove('selected'));
    }
  });
});