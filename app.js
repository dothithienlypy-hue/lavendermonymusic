// --- 1. CONFIG & STATE ---
const YOUTUBE_API_KEY = 'AIzaSyBK57eEaQ0xgthZKLrrHzzqlKB8doz5CLc'.trim(); 

let appState = {
    currentTrack: null,
    playbackQueue: [],
    currentQueueIndex: -1,
    isShuffle: false,
    isRepeat: false,
    playlists: JSON.parse(localStorage.getItem('appPlaylists')) || {
        "pl_lofi": { id: "pl_lofi", name: "Nhạc Lofi Chill", songs: [] },
        "pl_rainy": { id: "pl_rainy", name: "Rainy Mood", songs: [] }
    },
    likedSongs: JSON.parse(localStorage.getItem('likedSongs')) || [],
    recentlyPlayed: JSON.parse(localStorage.getItem('recentlyPlayed')) || [],
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || ["Lofi Girl", "V-Pop Hot Trend"],
    currentSearchFilter: 'all',
    users: JSON.parse(localStorage.getItem('appUsers')) || [
        { email: "user@email.com", password: "123", name: "Huỳnh Nguyên Đạt" }
    ],
    currentContextTrackId: null,
    currentContextPlaylistId: null,
    currentLanguage: localStorage.getItem('appLang') || 'vi',
    settings: JSON.parse(localStorage.getItem('appSettings')) || { icloud: true, crossfade: false, spatialAudio: false }
};

const DEFAULT_RECOMMENDATIONS = [
    { id: "jfKfPfyJRdk", title: "lofi hip hop radio - beats to relax/study to", artist: "ChilledCow", thumb: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg" },
    { id: "5qap5aO4i9A", title: "Lofi Hip Hop Radio - Beats to Relax", artist: "Lofi Girl", thumb: "https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg" },
    { id: "DWcJYXZM7o4", title: "Chilled lofi beats to code/relax to", artist: "Lofi Studio", thumb: "https://img.youtube.com/vi/DWcJYXZM7o4/hqdefault.jpg" },
    { id: "tntOCGkgt98", title: "Tokyo Lofi Chill - Relaxing Beats", artist: "Japan Vibes", thumb: "https://img.youtube.com/vi/tntOCGkgt98/hqdefault.jpg" }
];

const I18N_LANGUAGES = {
    vi: { home: "Trang chủ", discover: "Khám phá", library: "Thư viện", playlists: "PLAYLISTS", create_playlist: "Tạo Playlist mới", login: "Đăng nhập", listen_now: "Nghe Ngay", recently_played: "Nghe gần đây", recommendation: "Gợi ý dành cho bạn", search_results: "Kết quả tìm kiếm", favorites: "Bài hát yêu thích", no_song: "Chưa có bài hát", add_fav: "Thêm vào yêu thích", add_to_playlist: "Thêm vào Playlist..." },
    en: { home: "Home", discover: "Discover", library: "Library", playlists: "PLAYLISTS", create_playlist: "Create Playlist", login: "Login", listen_now: "Listen Now", recently_played: "Recently Played", recommendation: "Recommended for You", search_results: "Search Results", favorites: "Favorite Songs", no_song: "No song playing", add_fav: "Add to Favorites", add_to_playlist: "Add to Playlist..." }
};

// --- 2. INITIALIZATION & MOTION EFFECTS ---
document.addEventListener('DOMContentLoaded', () => {
    // Intro overlay fade out
    setTimeout(() => {
        const intro = document.getElementById('intro-screen');
        if(intro) intro.classList.add('fade-out');
    }, 1500);

    setupThemeAndColors();
    setupModalsAndTabs();
    setupYouTubePlayer();
    setupPremiumSliders();
    renderSidebarPlaylists();
    renderLibraryAndPlaylists();
    renderRecommendations();
    renderRecentlyPlayed();
    renderSearchHistory();
    setupVisualizer();
    checkUserLoginStatus();
    applyLanguage(appState.currentLanguage);
    setupAuroraParallax();
    loadSettingsState();
    initSmartSearchPlaceholder();
    setupMicroInteractions();
    setupSearchDimOverlay();
});

function setupAuroraParallax() {
    document.addEventListener('mousemove', e => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        document.querySelectorAll('.aurora-blob').forEach((blob, index) => {
            const speed = (index + 1) * 30;
            blob.style.transform = `translate(${x * speed}px, ${y * speed}px) scale(1.1)`;
        });
    });
}

function setupMicroInteractions() {
    document.querySelectorAll('.interactive-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            let x = e.clientX - e.target.getBoundingClientRect().left;
            let y = e.clientY - e.target.getBoundingClientRect().top;
            let ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

function setupSearchDimOverlay() {
    const searchInput = document.getElementById('search-input');
    const dimOverlay = document.getElementById('search-dim');
    searchInput.addEventListener('focus', () => { dimOverlay.classList.add('active'); });
    searchInput.addEventListener('blur', () => { 
        setTimeout(() => dimOverlay.classList.remove('active'), 200); 
    });
}

// --- 3. UI ROUTING & TRANSITIONS ---
window.switchView = function(viewId, element) {
    if (!document.startViewTransition) {
        updateDOMForView(viewId, element);
        return;
    }
    document.startViewTransition(() => updateDOMForView(viewId, element));
};

function updateDOMForView(viewId, element) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active-view'));
    const targetView = document.getElementById(`view-${viewId}`);
    if(targetView) targetView.classList.add('active-view');

    if(element) {
        document.querySelectorAll('.sidebar .menu a').forEach(a => a.classList.remove('active'));
        element.classList.add('active');
    }
    document.querySelector('.main-content').scrollTop = 0;
}

// --- 4. THEME, PREMIUM SETTINGS & i18n ---
function setupThemeAndColors() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme')) {
        body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = "<i class='bx bx-sun'></i>";
    }
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        themeToggleBtn.innerHTML = body.classList.contains('dark-mode') ? "<i class='bx bx-sun'></i>" : "<i class='bx bx-moon'></i>";
    });

    const colorBtns = document.querySelectorAll('.color-btn');
    const savedColor = localStorage.getItem('appColor') || '#a87add';
    document.documentElement.style.setProperty('--primary-color', savedColor);

    colorBtns.forEach(btn => {
        if(btn.dataset.color === savedColor) {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        btn.addEventListener('click', (e) => {
            const color = e.target.dataset.color;
            document.documentElement.style.setProperty('--primary-color', color);
            localStorage.setItem('appColor', color);
            colorBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

function setupPremiumSliders() {
    document.getElementById('blur-intensity-slider').addEventListener('input', function() {
        document.documentElement.style.setProperty('--glass-blur', `blur(${this.value}px)`);
    });
}

window.toggleSetting = function(key, element) {
    appState.settings[key] = !appState.settings[key];
    localStorage.setItem('appSettings', JSON.stringify(appState.settings));
    element.classList.toggle('active', appState.settings[key]);
    
    if(key === 'icloud' && appState.settings[key]) {
        showToast("Đang đồng bộ dữ liệu...");
        document.getElementById('global-sync-indicator').classList.add('syncing');
    } else if (key === 'icloud') {
        document.getElementById('global-sync-indicator').classList.remove('syncing');
    }
    if(key === 'spatialAudio') {
        showToast(appState.settings[key] ? "Đã bật Âm thanh không gian" : "Đã tắt Âm thanh không gian");
    }
};

function loadSettingsState() {
    document.getElementById('toggle-icloud').classList.toggle('active', appState.settings.icloud);
    document.getElementById('toggle-crossfade').classList.toggle('active', appState.settings.crossfade);
    const spatialToggle = document.getElementById('toggle-spatial');
    if(spatialToggle) spatialToggle.classList.toggle('active', appState.settings.spatialAudio);
    
    if(appState.settings.icloud) document.getElementById('global-sync-indicator').classList.add('syncing');
}

window.switchSettingsSection = function(sectionId, element) {
    document.querySelectorAll('.settings-section-block').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.settings-sidebar .settings-menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`settings-sec-${sectionId}`).classList.add('active');
    element.classList.add('active');
};

window.clearAppCache = function() {
    showToast("Đang dọn dẹp bộ nhớ đệm...");
    setTimeout(() => {
        showToast("Đã giải phóng 142MB bộ nhớ tạm!");
    }, 1500);
}

window.changeLanguage = function(lang) {
    appState.currentLanguage = lang;
    localStorage.setItem('appLang', lang);
    applyLanguage(lang);
    showToast("Đã thay đổi ngôn ngữ!");
};

function applyLanguage(lang) {
    const dict = I18N_LANGUAGES[lang] || I18N_LANGUAGES.vi;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- 5. MODALS & PLACEMENT FLOW ---
function setupModalsAndTabs() {
    document.getElementById('open-add-playlist').addEventListener('click', () => { switchPlaylistModalToCreate(); toggleCreatePlaylistModal(true); });
    document.getElementById('settings-btn').addEventListener('click', () => toggleSettingsModal(true));
    document.getElementById('login-btn').addEventListener('click', () => toggleAuthModal(true));
    document.getElementById('user-profile').addEventListener('click', () => toggleProfileModal(true));

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show-modal'); });
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('confirm-create-playlist').addEventListener('click', handleCreatePlaylist);
}

window.toggleAuthModal = (show) => document.getElementById('auth-modal').classList.toggle('show-modal', show);
window.toggleSettingsModal = (show) => document.getElementById('settings-modal').classList.toggle('show-modal', show);
window.toggleCreatePlaylistModal = (show) => document.getElementById('create-playlist-modal').classList.toggle('show-modal', show);
window.toggleProfileModal = (show) => document.getElementById('profile-modal').classList.toggle('show-modal', show);

window.switchPlaylistModalToCreate = function() {
    document.getElementById('modal-mode-picker').classList.add('hidden');
    document.getElementById('modal-mode-create').classList.remove('hidden');
};

window.switchAuthTab = function(tab) {
    const isLogin = tab === 'login';
    document.getElementById('login-form').classList.toggle('hidden', !isLogin);
    document.getElementById('register-form').classList.toggle('hidden', isLogin);
    document.getElementById('tab-login-btn').classList.toggle('active-tab', isLogin);
    document.getElementById('tab-register-btn').classList.toggle('active-tab', !isLogin);
};

function handleLogin(e) { e.preventDefault(); localStorage.setItem('isLoggedIn', 'true'); checkUserLoginStatus(); toggleAuthModal(false); showToast(`Chào mừng trở lại!`); }
function handleRegister(e) { e.preventDefault(); localStorage.setItem('isLoggedIn', 'true'); checkUserLoginStatus(); toggleAuthModal(false); showToast("Đăng ký thành công!"); }
function handleLogout() { localStorage.removeItem('isLoggedIn'); checkUserLoginStatus(); toggleProfileModal(false); showToast("Đã đăng xuất"); }
function checkUserLoginStatus() {
    const isLog = localStorage.getItem('isLoggedIn') === 'true';
    document.getElementById('login-btn').classList.toggle('hidden', isLog);
    document.getElementById('user-profile').classList.toggle('hidden', !isLog);
}

// --- 6. SMART SEARCH SYSTEM (NÂNG CẤP) ---
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchPlaceholder = document.getElementById('search-placeholder');
let searchDebounceTimeout;

function initSmartSearchPlaceholder() {
    const phrases = ["Tìm bài hát, nghệ sĩ...", "Lofi Night Drive...", "Podcast phát triển bản thân...", "Top Hits V-Pop..."];
    let i = 0; let j = 0; let currentPhrase = []; let isDeleting = false;
    
    function loop() {
        if(searchInput.value.trim().length > 0) {
            searchPlaceholder.style.opacity = 0;
            return setTimeout(loop, 1000);
        } else {
            searchPlaceholder.style.opacity = 1;
        }

        searchPlaceholder.innerHTML = currentPhrase.join('');
        if (i < phrases.length) {
            if (!isDeleting && j <= phrases[i].length) {
                currentPhrase.push(phrases[i][j]); j++;
                searchPlaceholder.innerHTML = currentPhrase.join('') + "<span class='cursor'>|</span>";
            }
            if(isDeleting && j <= phrases[i].length) {
                currentPhrase.pop(); j--;
                searchPlaceholder.innerHTML = currentPhrase.join('') + "<span class='cursor'>|</span>";
            }
            if (j == phrases[i].length) { isDeleting = true; setTimeout(loop, 1500); return; }
            if (isDeleting && j === 0) { currentPhrase = []; isDeleting = false; i++; if (i == phrases.length) i = 0; }
        }
        setTimeout(loop, isDeleting ? 50 : 100);
    }
    loop();
}

searchInput.addEventListener('input', function(e) {
    const val = this.value.trim();
    if(val.length > 0) {
        clearSearchBtn.classList.remove('hidden');
        searchPlaceholder.style.opacity = 0;
    } else {
        clearSearchBtn.classList.add('hidden');
        searchPlaceholder.style.opacity = 1;
    }
    
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
        if(val !== '') triggerSearchAPI(val, false); 
    }, 600);
});

searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim() !== '') {
        const val = this.value.trim();
        saveSearchHistory(val);
        triggerSearchAPI(val, true);
        document.getElementById('search-dim').classList.remove('active');
        this.blur();
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    searchPlaceholder.style.opacity = 1;
    searchInput.focus();
});

function saveSearchHistory(val) {
    if(!appState.searchHistory.includes(val)) {
        appState.searchHistory.unshift(val);
        if(appState.searchHistory.length > 5) appState.searchHistory.pop();
        localStorage.setItem('searchHistory', JSON.stringify(appState.searchHistory));
        renderSearchHistory();
    }
}

window.setSearchFilter = function(filter, element) {
    appState.currentSearchFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if(element) element.classList.add('active');
    const inputVal = searchInput.value.trim();
    if(inputVal) triggerSearchAPI(inputVal, true);
};

window.triggerQuickSearch = function(keyword) {
    searchInput.value = keyword;
    clearSearchBtn.classList.remove('hidden');
    searchPlaceholder.style.opacity = 0;
    saveSearchHistory(keyword);
    triggerSearchAPI(keyword, true);
    document.getElementById('search-dim').classList.remove('active');
};

function renderSearchHistory() {
    const container = document.getElementById('search-history-container');
    const title = document.querySelector('.history-title');
    if(!appState.searchHistory.length) { title.classList.add('hidden'); return; }
    title.classList.remove('hidden');
    container.innerHTML = '';
    appState.searchHistory.forEach(h => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `<i class='bx bx-history'></i> ${h}`;
        item.addEventListener('click', () => triggerQuickSearch(h));
        container.appendChild(item);
    });
}

document.getElementById('ai-generate-btn').addEventListener('click', () => {
    const prompt = document.getElementById('ai-mood-input').value.trim();
    if(!prompt) return showToast("Hãy nhập tâm trạng của bạn!");
    showToast("AI DJ đang thiết kế âm thanh cho bạn...");
    setTimeout(() => triggerQuickSearch(prompt + ' chill playlist'), 1500);
});

function renderSkeletonGrid(gridElement) {
    gridElement.innerHTML = '';
    for(let i=0; i<8; i++) {
        gridElement.innerHTML += `
            <div class="song-card skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>`;
    }
}

async function triggerSearchAPI(keyword, forceSwitchView = false) {
    if(forceSwitchView) switchView('discover');
    const grid = document.getElementById('search-results-grid');
    renderSkeletonGrid(grid);
    
    let queryModifier = ' audio';
    if(appState.currentSearchFilter === 'artists') queryModifier = ' artist official channel';
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(keyword + queryModifier)}&type=video&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.items || data.items.length === 0) return grid.innerHTML = '<p>Không tìm thấy kết quả phù hợp.</p>';
        grid.innerHTML = '';
        appState.playbackQueue = [];

        data.items.forEach(item => {
            const track = { id: item.id.videoId, title: item.snippet.title, artist: item.snippet.channelTitle, thumb: item.snippet.thumbnails.high.url };
            appState.playbackQueue.push(track);
            grid.appendChild(createTrackCardHTML(track));
        });
        renderQueueList();
    } catch(err) { 
        setTimeout(() => {
            grid.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1;">Sử dụng API Mockup. Đang hiển thị gợi ý thay thế.</p>';
            DEFAULT_RECOMMENDATIONS.forEach(track => grid.appendChild(createTrackCardHTML(track)));
        }, 800); // Fake delay to show shimmer
    }
}

// --- 7. PLAYER CORE & QUEUE (YOUTUBE LAYER) ---
let ytPlayer; let progressUpdaterInterval;
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-hidden-player', {
        height: '10', width: '10', videoId: '', 
        playerVars: { 'autoplay': 1, 'controls': 0, 'playsinline': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
    });
};

function onPlayerReady() {
    ytPlayer.setVolume(70);
    document.getElementById('play-pause-btn').addEventListener('click', togglePlayback);
    
    const progWrap = document.getElementById('player-progress-bar-wrap');
    progWrap.addEventListener('click', (e) => {
        if(ytPlayer && ytPlayer.getDuration) {
            const pct = (e.clientX - progWrap.getBoundingClientRect().left) / progWrap.offsetWidth;
            ytPlayer.seekTo(pct * ytPlayer.getDuration(), true);
        }
    });

    const volWrap = document.getElementById('player-volume-bar-wrap');
    volWrap.addEventListener('click', (e) => {
        const pct = Math.max(0, Math.min(1, (e.clientX - volWrap.getBoundingClientRect().left) / volWrap.offsetWidth));
        document.getElementById('volume-level-bar').style.width = (pct * 100) + '%';
        if(ytPlayer) ytPlayer.setVolume(pct * 100);
    });

    document.getElementById('lyrics-toggle-btn').addEventListener('click', () => document.getElementById('lyrics-screen').classList.remove('hidden-lyrics'));
    document.getElementById('close-lyrics').addEventListener('click', () => document.getElementById('lyrics-screen').classList.add('hidden-lyrics'));
    document.addEventListener('click', () => document.getElementById('song-context-menu').classList.remove('show'));
}

function togglePlayback() {
    if (!ytPlayer || !ytPlayer.getPlayerState) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
}

function onPlayerStateChange(event) {
    const btn = document.getElementById('play-pause-btn');
    const playerEl = document.querySelector('.music-player');
    if (event.data === YT.PlayerState.PLAYING) {
        btn.innerHTML = "<i class='bx bx-pause'></i>";
        document.getElementById('album-art').classList.add('playing');
        playerEl.classList.add('is-playing');
        clearInterval(progressUpdaterInterval);
        progressUpdaterInterval = setInterval(syncProgress, 500);
    } else {
        btn.innerHTML = "<i class='bx bx-play'></i>";
        document.getElementById('album-art').classList.remove('playing');
        playerEl.classList.remove('is-playing');
        clearInterval(progressUpdaterInterval);
        if(event.data === YT.PlayerState.ENDED) {
            appState.isRepeat ? ytPlayer.playVideo() : playNextTrack();
        }
    }
}

function syncProgress() {
    if (ytPlayer && ytPlayer.getDuration) {
        const d = ytPlayer.getDuration(), c = ytPlayer.getCurrentTime();
        if (d > 0) {
            document.getElementById('progress').style.width = (c / d * 100) + "%";
            document.querySelector('.time.current').textContent = formatTime(c);
            document.querySelector('.time.total').textContent = formatTime(d);
            
            const lines = document.querySelectorAll('#lyrics-text p');
            if(lines.length > 1) {
                lines.forEach(l => l.classList.remove('active'));
                const idx = Math.floor((c / d) * lines.length);
                if(lines[idx]) {
                    lines[idx].classList.add('active');
                    lines[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }
}
function formatTime(s) { return Math.floor(s/60) + ":" + Math.floor(s%60).toString().padStart(2,'0'); }

// --- 8. PLAYBACK CONTROLS & RENDER ---
window.playTrack = function(id, title, artist, thumb) {
    appState.currentTrack = { id, title, artist, thumb };
    if(!appState.playbackQueue.some(t => t.id === id)) appState.playbackQueue.push(appState.currentTrack);
    appState.currentQueueIndex = appState.playbackQueue.findIndex(t => t.id === id);

    document.getElementById('player-title').innerText = title;
    document.getElementById('player-artist').innerText = artist;
    document.getElementById('album-art').style.backgroundImage = `url('${thumb}')`;
    document.getElementById('lyrics-bg').style.backgroundImage = `url('${thumb}')`;
    
    // Dynamic Player Background sync
    const dynamicBg = document.getElementById('player-dynamic-bg');
    if(dynamicBg) dynamicBg.style.backgroundImage = `url('${thumb}')`;

    const isLiked = appState.likedSongs.some(s => s.id === id);
    const likeBtn = document.getElementById('like-btn');
    likeBtn.innerHTML = isLiked ? "<i class='bx bxs-heart' style='font-size: 24px; color: #ff2d55;'></i>" : "<i class='bx bx-heart' style='font-size: 24px;'></i>";
    
    document.documentElement.style.setProperty('--ambient-hue', `${Math.random() * 360}deg`);
    
    appState.recentlyPlayed = appState.recentlyPlayed.filter(t => t.id !== id);
    appState.recentlyPlayed.unshift(appState.currentTrack);
    if(appState.recentlyPlayed.length > 8) appState.recentlyPlayed.pop();
    renderRecentlyPlayed();
    renderQueueList();

    if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(id);
    fetchLyricsMock(title);
};

window.playNextTrack = function() {
    if(!appState.playbackQueue.length) return;
    appState.currentQueueIndex = appState.isShuffle ? Math.floor(Math.random() * appState.playbackQueue.length) : (appState.currentQueueIndex + 1) % appState.playbackQueue.length;
    const t = appState.playbackQueue[appState.currentQueueIndex];
    if(t) playTrack(t.id, t.title, t.artist, t.thumb);
};

window.playPrevTrack = function() {
    if(!appState.playbackQueue.length) return;
    appState.currentQueueIndex = (appState.currentQueueIndex - 1 + appState.playbackQueue.length) % appState.playbackQueue.length;
    const t = appState.playbackQueue[appState.currentQueueIndex];
    if(t) playTrack(t.id, t.title, t.artist, t.thumb);
};

window.toggleShuffle = function() {
    appState.isShuffle = !appState.isShuffle;
    document.getElementById('shuffle-toggle-btn').style.color = appState.isShuffle ? 'var(--primary-color)' : 'var(--text-secondary)';
};

window.toggleRepeat = function() {
    appState.isRepeat = !appState.isRepeat;
    document.getElementById('repeat-toggle-btn').style.color = appState.isRepeat ? 'var(--primary-color)' : 'var(--text-secondary)';
};

window.playTrendingHero = () => playTrack(DEFAULT_RECOMMENDATIONS[0].id, DEFAULT_RECOMMENDATIONS[0].title, DEFAULT_RECOMMENDATIONS[0].artist, DEFAULT_RECOMMENDATIONS[0].thumb);

window.toggleQueue = () => {
    document.getElementById('queue-drawer').classList.toggle('show-queue');
};

function renderQueueList() {
    const list = document.getElementById('queue-list-container');
    if(!list) return;
    list.innerHTML = '';
    appState.playbackQueue.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = `queue-item ${appState.currentQueueIndex === i ? 'playing' : ''}`;
        item.innerHTML = `
            <img src="${t.thumb}" alt="thumb">
            <div class="q-info">
                <h5>${t.title}</h5>
                <p>${t.artist}</p>
            </div>
            ${appState.currentQueueIndex === i ? "<i class='bx bx-play-circle' style='color:var(--primary-color); font-size: 20px;'></i>" : ""}
        `;
        item.onclick = () => { appState.currentQueueIndex = i; playTrack(t.id, t.title, t.artist, t.thumb); };
        list.appendChild(item);
    });
}

function fetchLyricsMock(title) {
    const box = document.getElementById('lyrics-text'); box.innerHTML = '';
    const mockLyrics = [`Đang phát: ${title}`, "Trải nghiệm Cinematic Lyrics.", "Lời bài hát đồng bộ mượt mà", "Hiệu ứng Karaoke Real-time", "Ambient Blur xóa nhòa ranh giới", "Đắm chìm hoàn toàn vào âm nhạc."];
    mockLyrics.forEach(txt => { const p = document.createElement('p'); p.innerText = txt; box.appendChild(p); });
}

// 3D Tilt Effect + Glare
function applyTiltEffect(card) {
    const glare = document.createElement('div');
    glare.className = 'glare';
    card.appendChild(glare);

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const centerX = rect.width / 2; const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15; const rotateY = ((x - centerX) / centerX) * 15;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        
        // Glare follow mouse
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4), transparent 60%)`;
    });
    card.addEventListener('mouseleave', () => { 
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`; 
        glare.style.background = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 60%)`;
    });
}

function createTrackCardHTML(track, playlistId = null) {
    const card = document.createElement('div'); card.className = 'song-card glass';
    const isLiked = appState.likedSongs.some(s => s.id === track.id);
    card.innerHTML = `
        <div class="song-img" style="background-image: url('${track.thumb}');">
            <div class="song-actions-overlay">
                <button class="quick-action-btn ${isLiked?'liked':''}" onclick="toggleLikeTrack(event, '${track.id}')"><i class='bx ${isLiked?'bxs-heart':'bx-heart'}'></i></button>
                <button class="quick-action-btn" onclick="openPlaylistPicker(event, '${track.id}')"><i class='bx bx-plus'></i></button>
                <button class="quick-action-btn" onclick="openSongContextMenu(event, '${track.id}', '${playlistId || ''}')"><i class='bx bx-dots-horizontal-rounded'></i></button>
            </div>
            <div class="card-play-overlay"><i class='bx bx-play'></i></div>
        </div>
        <h4>${track.title}</h4><p>${track.artist}</p>`;
    applyTiltEffect(card);
    card.addEventListener('click', (e) => { if(!e.target.closest('.quick-action-btn')) { playTrack(track.id, track.title, track.artist, track.thumb); appState.playbackQueue = [track]; renderQueueList(); }});
    return card;
}

window.toggleLikeTrack = function(e, id) {
    e.stopPropagation(); let track = findTrackInApp(id); if(!track) return;
    const index = appState.likedSongs.findIndex(s => s.id === id);
    const icon = e.currentTarget.querySelector('i');
    if(index > -1) { 
        appState.likedSongs.splice(index, 1); showToast("Đã xóa khỏi yêu thích"); 
        e.currentTarget.classList.remove('liked'); icon.className = 'bx bx-heart';
    } else { 
        appState.likedSongs.push(track); showToast("Đã thêm vào yêu thích");
        e.currentTarget.classList.add('liked'); icon.className = 'bx bxs-heart';
    }
    localStorage.setItem('likedSongs', JSON.stringify(appState.likedSongs)); renderLibraryAndPlaylists();
    if(appState.currentTrack && appState.currentTrack.id === id) {
        document.getElementById('like-btn').innerHTML = index > -1 ? "<i class='bx bx-heart' style='font-size: 24px;'></i>" : "<i class='bx bxs-heart' style='font-size: 24px; color: #ff2d55;'></i>";
    }
};

window.toggleLikeCurrentTrack = () => { if(appState.currentTrack) toggleLikeTrack({stopPropagation: ()=>{}, currentTarget: document.createElement('div')}, appState.currentTrack.id); }

window.openPlaylistPicker = function(e, id) {
    e.stopPropagation(); appState.currentContextTrackId = id;
    document.getElementById('modal-mode-create').classList.add('hidden');
    document.getElementById('modal-mode-picker').classList.remove('hidden');
    const listCont = document.getElementById('modal-playlists-picker-list'); listCont.innerHTML = '';
    Object.values(appState.playlists).forEach(pl => {
        const div = document.createElement('div'); div.className = 'picker-playlist-item';
        div.innerHTML = `<i class='bx bx-list-ul' style="color: var(--primary-color);"></i> <span>${pl.name}</span>`;
        div.onclick = () => addTrackToPlaylistReal(pl.id); listCont.appendChild(div);
    });
    toggleCreatePlaylistModal(true);
};

function addTrackToPlaylistReal(playlistId) {
    const trackId = appState.currentContextTrackId; const track = findTrackInApp(trackId); if(!track) return;
    if(!appState.playlists[playlistId].songs.some(s => s.id === trackId)) {
        appState.playlists[playlistId].songs.push(track); localStorage.setItem('appPlaylists', JSON.stringify(appState.playlists)); showToast(`Đã thêm vào playlist: ${appState.playlists[playlistId].name}`);
    } else { showToast("Bài hát đã tồn tại trong playlist này!"); }
    toggleCreatePlaylistModal(false); renderLibraryAndPlaylists();
}

function findTrackInApp(id) {
    let all = [...DEFAULT_RECOMMENDATIONS, ...appState.playbackQueue, ...appState.recentlyPlayed, ...appState.likedSongs];
    Object.values(appState.playlists).forEach(pl => all = [...all, ...pl.songs]); return all.find(t => t.id === id);
}

window.openSongContextMenu = function(e, id, playlistId) {
    e.stopPropagation(); e.preventDefault(); appState.currentContextTrackId = id; appState.currentContextPlaylistId = playlistId;
    const menu = document.getElementById('song-context-menu'); const removeBtn = document.getElementById('context-remove-playlist-btn');
    playlistId ? removeBtn.classList.remove('hidden') : removeBtn.classList.add('hidden');
    menu.style.top = e.clientY + 'px'; 
    if(e.clientX + 200 > window.innerWidth) menu.style.left = (e.clientX - 200) + 'px'; else menu.style.left = e.clientX + 'px'; 
    menu.classList.add('show');
};

window.removeTrackFromCurrentContextPlaylist = () => {
    const pid = appState.currentContextPlaylistId; const tid = appState.currentContextTrackId;
    if(pid && appState.playlists[pid]) {
        appState.playlists[pid].songs = appState.playlists[pid].songs.filter(s => s.id !== tid);
        localStorage.setItem('appPlaylists', JSON.stringify(appState.playlists)); showToast("Đã xóa khỏi Playlist"); renderLibraryAndPlaylists();
    }
    document.getElementById('song-context-menu').classList.remove('show');
}
window.addTrackToFavoritesFromContext = () => { toggleLikeCurrentTrack(); document.getElementById('song-context-menu').classList.remove('show'); };
window.openPlaylistPickerFromContext = () => { document.getElementById('song-context-menu').classList.remove('show'); openPlaylistPicker(event, appState.currentContextTrackId); };

function handleCreatePlaylist() {
    const name = document.getElementById('new-playlist-name').value.trim(); if(!name) return;
    const id = 'pl_' + Date.now(); appState.playlists[id] = { id: id, name: name, songs: [] };
    localStorage.setItem('appPlaylists', JSON.stringify(appState.playlists));
    renderSidebarPlaylists(); renderLibraryAndPlaylists(); toggleCreatePlaylistModal(false);
    showToast(`Đã tạo playlist "${name}" thành công!`); document.getElementById('new-playlist-name').value = '';
}

function renderRecommendations() { const g = document.getElementById('recommendations-grid'); g.innerHTML = ''; DEFAULT_RECOMMENDATIONS.forEach(t => g.appendChild(createTrackCardHTML(t))); }
function renderRecentlyPlayed() { const g = document.getElementById('recently-played-grid'); g.innerHTML = ''; appState.recentlyPlayed.forEach(t => g.appendChild(createTrackCardHTML(t))); }
function renderSidebarPlaylists() {
    const sideList = document.getElementById('sidebar-playlists-list');
    if(sideList) { sideList.innerHTML = ''; Object.values(appState.playlists).forEach(pl => { const a = document.createElement('a'); a.href = "#"; a.innerHTML = `<i class='bx bx-music'></i> <span>${pl.name}</span>`; a.onclick = () => switchView('library', document.querySelector('[onclick="switchView(\'library\', this)"]')); sideList.appendChild(a); }); }
}
function renderLibraryAndPlaylists() {
    const favGrid = document.getElementById('favorites-songs-grid');
    if(favGrid) { favGrid.innerHTML = ''; if(!appState.likedSongs.length) favGrid.innerHTML = '<p style="color:var(--text-secondary)">Chưa có bài hát yêu thích.</p>'; appState.likedSongs.forEach(t => favGrid.appendChild(createTrackCardHTML(t))); }
    const dynamicCont = document.getElementById('dynamic-playlist-sections');
    if(dynamicCont) {
        dynamicCont.innerHTML = ''; Object.values(appState.playlists).forEach(pl => {
            const sec = document.createElement('div'); sec.className = 'playlist-section'; sec.innerHTML = `<div class="section-title"><span><i class='bx bx-list-ul' style="color:var(--primary-color); margin-right:8px;"></i> ${pl.name}</span></div>`;
            const grid = document.createElement('div'); grid.className = 'grid-songs';
            if(!pl.songs.length) grid.innerHTML = '<p style="color:var(--text-secondary); padding-left:16px;">Playlist trống. Hãy khám phá và thêm bài hát mới!</p>';
            pl.songs.forEach(t => grid.appendChild(createTrackCardHTML(t, pl.id))); sec.appendChild(grid); dynamicCont.appendChild(sec);
        });
    }
}

function setupVisualizer() {
    const canvas = document.getElementById('player-visualizer'); const ctx = canvas.getContext('2d');
    function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
    resize(); window.addEventListener('resize', resize);
    let time = 0;
    function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height); let style = document.getElementById('visualizer-style-select') ? document.getElementById('visualizer-style-select').value : 'wave';
        let isPlaying = ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
        if (style === 'none') { requestAnimationFrame(draw); return; }
        if(style === 'wave') {
            time += isPlaying ? 0.03 : 0.005;
            for(let j = 0; j < 3; j++) {
                ctx.beginPath(); ctx.fillStyle = `rgba(168, 122, 221, ${0.12 - j*0.03})`; ctx.moveTo(0, canvas.height); let amp = isPlaying ? 35 - j*8 + Math.sin(time + j)*15 : 5;
                for(let x=0; x<canvas.width; x++) { let y = canvas.height/2 + Math.sin(x*0.005 + time + j*2) * amp * Math.cos(x*0.003 + time); ctx.lineTo(x, y); }
                ctx.lineTo(canvas.width, canvas.height); ctx.fill();
            }
        } else if (style === 'bars') {
            ctx.fillStyle = 'rgba(168, 122, 221, 0.2)'; let barWidth = 8, barGap = 4, barCount = Math.ceil(canvas.width / (barWidth + barGap));
            for(let i=0; i<barCount; i++) {
                let noise = Math.sin(i*0.2 + Date.now()/150) * Math.cos(i*0.5 + Date.now()/200); let h = isPlaying ? Math.abs(noise) * (canvas.height - 20) : 6;
                ctx.beginPath(); ctx.roundRect(i*(barWidth+barGap), canvas.height - h, barWidth, h, [4, 4, 0, 0]); ctx.fill();
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}
// =======================================================================
// LAVENDERMONY PRO LOGIC ENGINE - INTEGRATED ADVANCED SUBSYSTEMS
// =======================================================================

// Khởi chạy hệ thống mở rộng ngay khi DOM Sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    initLavendermonyProEngine();
});

function initLavendermonyProEngine() {
    setup3DCardTiltEffect();
    initAILiveStreamingPlaceholder();
    setupOnboardingProcess();
    injectProSettingsControls();
    listenToPlayerStateForLyrics();
}

/* --- 3D INTERACTION EFFECT ON MOUSEMOVE --- */
function setup3DCardTiltEffect() {
    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.song-card');
        if (!card) return;
        
        // Tạo hiệu ứng chói Glare động nếu chưa có
        let glare = card.querySelector('.card-glare');
        if (!glare) {
            glare = document.createElement('div');
            glare.className = 'card-glare';
            card.appendChild(glare);
        }

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        
        const tiltX = (yc - y) / 8;
        const tiltY = (x - xc) / 8;
        
        card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.18) 0%, transparent 75%)`;
    });

    document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.song-card');
        if (!card) return;
        card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
        const glare = card.querySelector('.card-glare');
        if (glare) glare.style.opacity = '0';
    });
}

/* --- STREAMING SEARCH AI PLACEHOLDER --- */
function initAILiveStreamingPlaceholder() {
    const aiPhrases = [
        "🔮 Đang phân tích gu âm nhạc cá nhân...",
        "🌊 Đang tìm phối cảnh vibe Lofi Chill phù hợp...",
        "🎯 Tìm nhạc giúp tối ưu hóa sóng não tập trung...",
        "🧠 Hãy thử nhập: 'Nhạc mưa chill cho đêm muộn'..."
    ];
    let phraseIdx = 0;
    const placeholderEl = document.getElementById('search-placeholder');
    
    if(!placeholderEl) return;
    
    setInterval(() => {
        let currentText = aiPhrases[phraseIdx];
        placeholderEl.innerHTML = `<span class="ai-streaming-text"></span><span class="cursor">|</span>`;
        let textContainer = placeholderEl.querySelector('.ai-streaming-text');
        let charIdx = 0;
        
        function typeChar() {
            if (charIdx < currentText.length) {
                textContainer.textContent += currentText.charAt(charIdx);
                charIdx++;
                setTimeout(typeChar, 40);
            }
        }
        typeChar();
        
        phraseIdx = (phraseIdx + 1) % aiPhrases.length;
    }, 6000);
}

/* --- FULLSCREEN CINEMATIC CONTROLLER --- */
window.toggleFullscreenPlayer = function(show) {
    const fsOverlay = document.getElementById('fullscreen-player-overlay');
    if (!fsOverlay) return;
    
    if (show && appState.currentTrack) {
        // Đồng bộ dữ liệu bài hát hiện tại sang giao diện Fullscreen
        document.getElementById('fs-album-art').src = appState.currentTrack.thumb || 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg';
        document.getElementById('fs-track-title').innerText = appState.currentTrack.title;
        document.getElementById('fs-track-artist').innerText = appState.currentTrack.artist || 'Lavendermony Artist';
        fsOverlay.classList.add('active');
    } else {
        fsOverlay.classList.remove('active');
    }
};

// Cho phép click vào ảnh đĩa nhạc/thumbnail ở Music Player gốc để kích hoạt Immersive Player
document.addEventListener('click', (e) => {
    const originalThumb = e.target.closest('.current-track-info img, .music-player .track-info');
    if (originalThumb) {
        toggleFullscreenPlayer(true);
    }
});

/* --- LIVE LYRICS SYNCING SIMULATION ENGINE --- */
function listenToPlayerStateForLyrics() {
    const lyricsBox = document.getElementById('fs-lyrics-box');
    if(!lyricsBox) return;

    setInterval(() => {
        // Nếu trình phát nhạc Youtube đang chạy, tiến hành sync giả lập chuyển động
        if (typeof ytPlayer !== 'undefined' && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 1) {
            const currentTime = ytPlayer.getCurrentTime ? Math.floor(ytPlayer.getCurrentTime()) : 0;
            const lines = lyricsBox.querySelectorAll('.dynamic-lyric');
            
            let currentActiveLine = null;
            lines.forEach(line => {
                const triggerTime = parseInt(line.getAttribute('data-time') || '0');
                if (currentTime >= triggerTime) {
                    currentActiveLine = line;
                }
            });
            
            if (currentActiveLine && !currentActiveLine.classList.contains('active')) {
                lines.forEach(l => l.classList.remove('active'));
                currentActiveLine.classList.add('active');
                currentActiveLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, 1000);
}

/* --- AI DJ SMART CONVERSATION DRAWER --- */
window.toggleAiDjDrawer = function(show) {
    document.getElementById('ai-dj-drawer-panel').classList.toggle('active', show);
};

window.handleAiDjChatKeyPress = function(e) {
    if (e.key === 'Enter') submitAiDjRequest();
};

window.quickAiCommand = function(text) {
    document.getElementById('ai-dj-input').value = text;
    submitAiDjRequest();
};

window.submitAiDjRequest = function() {
    const inputEl = document.getElementById('ai-dj-input');
    const container = document.getElementById('ai-chat-container');
    const promptText = inputEl.value.trim();
    if (!promptText) return;

    // Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message user';
    userMsg.innerHTML = `<p>${promptText}</p>`;
    container.appendChild(userMsg);
    inputEl.value = '';
    container.scrollTop = container.scrollHeight;

    // Simulate AI Generation Stream Response
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'ai-message assistant';
        aiMsg.innerHTML = `<p>✨ <b>AI DJ:</b> Đang quét sóng não và lịch sử nghe nhạc của bạn... Đã kích hoạt cấu hình thông minh cho vibe "<b>${promptText}</b>". Đang làm mới danh sách phát!</p>`;
        container.appendChild(aiMsg);
        container.scrollTop = container.scrollHeight;

        // Tự động nạp Playlist ngẫu nhiên tương thích tâm trạng
        if (typeof renderRecommendations === 'function') {
            showToast("AI DJ đã cấu hình lại luồng nhạc cá nhân hóa!");
        }
    }, 1200);
};

/* --- ONBOARDING UX SYSTEM --- */
function setupOnboardingProcess() {
    if (!localStorage.getItem('lavender_onboarded')) {
        document.getElementById('lavender-onboarding-overlay').classList.remove('hidden');
    }
}
window.toggleOnboardingGenre = function(element) {
    element.classList.toggle('selected');
};
window.completeOnboarding = function() {
    localStorage.setItem('lavender_onboarded', 'true');
    document.getElementById('lavender-onboarding-overlay').classList.add('hidden');
    showToast("Thiết lập không gian cá nhân thành công! 🎉");
};

/* --- MOBILE BOTTOM NAVIGATION ACTIVE INDICATOR --- */
window.updateDockActive = function(element) {
    document.querySelectorAll('.mobile-bottom-dock .dock-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
};

// Bộ hàm cốt lõi điều phối cấu hình Pro Settings Hệ thống
window.applyThemePreset = function(preset) {
    document.body.classList.remove('preset-aurora', 'preset-oled', 'preset-frost', 'preset-midnight');
    if (preset !== 'none') document.body.classList.add(`preset-${preset}`);
    showToast(`Đã áp dụng giao diện ${preset.toUpperCase()}`);
};

window.applyMotionLevel = function(level) {
    document.body.classList.remove('motion-low', 'motion-cinematic');
    if (level !== 'medium') document.body.classList.add(`motion-${level}`);
    showToast(`Đã đổi chế độ chuyển động: ${level}`);
};

window.applyUiDensity = function(density) {
    document.body.classList.remove('density-compact', 'density-spacious');
    if (density !== 'cozy') document.body.classList.add(`density-${density}`);
    showToast(`Đã đổi mật độ hiển thị: ${density}`);
};
// =======================================================================
// LAVENDERMONY ULTIMATE PATCH - APPEND ONLY SCRIPT
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    applyAccessibilityEngine();
    initPerformanceObserver();
    setupMagneticInteractions();
});

/* --- 12. Accessibility Engine --- */
function applyAccessibilityEngine() {
    // Tự động rà soát và tiêm tabindex/aria-labels mà không cần sửa HTML gốc
    const interactiveSelectors = '.icon-btn, .interactive-btn, .song-card, .quick-action-btn, .dock-item';
    document.querySelectorAll(interactiveSelectors).forEach(el => {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        
        // Thêm aria-label dựa trên text hoặc title nếu có
        if (!el.hasAttribute('aria-label')) {
            const textContent = el.innerText.trim();
            if (textContent) {
                el.setAttribute('aria-label', textContent);
            } else if (el.hasAttribute('title')) {
                el.setAttribute('aria-label', el.getAttribute('title'));
            } else {
                // Fallback cho các nút icon không có text
                const icon = el.querySelector('i');
                if(icon) el.setAttribute('aria-label', icon.className.replace('bx ', ''));
            }
        }
    });

    // Kích hoạt click bằng phím Enter cho khả năng điều hướng bằng bàn phím
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.activeElement.matches(interactiveSelectors)) {
            e.preventDefault();
            document.activeElement.click();
        }
    });
}

/* --- 11. Performance & GPU Optimization --- */
function initPerformanceObserver() {
    // Dùng IntersectionObserver để dừng animation của các element nặng khi bị cuộn khuất
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    entry.target.classList.add('paused-animation');
                } else {
                    entry.target.classList.remove('paused-animation');
                }
            });
        }, { rootMargin: '100px' }); // Load trước 100px trước khi vào viewport

        // Theo dõi bóng mờ Aurora và Background động
        document.querySelectorAll('.aurora-blob, .player-dynamic-bg, .fullscreen-ambient-glow').forEach(el => {
            observer.observe(el);
        });
    }

    // Tiết kiệm pin/GPU bằng cách giảm cấu hình khi chuyển tab khác
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.body.classList.add('motion-low');
        } else {
            // Phục hồi lại setting cũ
            document.body.classList.remove('motion-low');
        }
    });
}

/* --- 3 & 4. Magnetic Buttons & Tactile Feeling --- */
function setupMagneticInteractions() {
    const magneticElements = document.querySelectorAll('.play-pause-btn, .play-btn-hero, .ai-floating-trigger, .logo-orb');
    
    magneticElements.forEach(btn => {
        btn.classList.add('magnetic-element');
        
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            // Tính toán khoảng cách từ chuột đến tâm của nút
            const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
            
            btn.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            // Spring physics reset
            btn.style.transform = `translate(0px, 0px) scale(1)`;
        });
    });
}
// =======================================================================
// LAVENDERMONY PREMIUM PATCH - APPEND ONLY LOGIC
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    initPremiumFeatures();
});

function initPremiumFeatures() {
    hookIntoPlayer();
    setupSettingsBentoBox();
    enhanceDynamicNoise();
}

/* --- 1. Dynamic Ambient Light Engine (Màu thay đổi theo bài hát) --- */
function hookIntoPlayer() {
    // Lưu lại hàm playTrack gốc
    const originalPlayTrack = window.playTrack;
    
    // Ghi đè hàm playTrack để chạy song song logic cũ và mới
    window.playTrack = function(id, title, artist, thumb) {
        // 1. Chạy logic gốc của Nguyên Đạt
        originalPlayTrack(id, title, artist, thumb);
        
        // 2. Chạy logic nâng cấp: Tạo mã băm (hash) từ tiêu đề để tạo màu sắc ngẫu nhiên nhưng cố định cho mỗi bài
        const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = Math.abs(hash % 360);
        
        // Cập nhật biến CSS toàn cục để đổi màu toàn bộ hệ thống (Aurora, Bóng đổ, v.v.)
        document.documentElement.style.setProperty('--ambient-hue', `${hue}deg`);
        
        // Nâng cấp Player Background Blur mạnh mẽ hơn
        const dynamicBg = document.getElementById('player-dynamic-bg');
        if(dynamicBg) {
            dynamicBg.style.filter = `blur(60px) saturate(250%) hue-rotate(${hue/4}deg)`;
            dynamicBg.style.opacity = document.body.classList.contains('dark-mode') ? '0.3' : '0.2';
        }

        // Đẩy thông báo nhạc mới mượt mà hơn
        if (typeof showToast === 'function') {
            showToast(`🎵 Đang phát: ${title}`);
        }
    };
}

/* --- 2. Xử lý Logic Form Đăng nhập & Settings Transition --- */
function setupSettingsBentoBox() {
    // Bắt sự kiện chuyển tab Form mượt mà
    const authTabs = document.querySelectorAll('.auth-tab-link');
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const forms = document.querySelectorAll('.auth-forms form:not(.auth-tabs)');
            forms.forEach(f => {
                f.style.opacity = '0';
                f.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    if(!f.classList.contains('hidden')) {
                        f.style.opacity = '1';
                        f.style.transform = 'translateY(0)';
                        f.style.transition = 'all 0.4s ease';
                    }
                }, 50);
            });
        });
    });
}

/* --- 3. Nâng cấp Noise Overlay --- */
function enhanceDynamicNoise() {
    // Cải thiện texture noise bằng SVG động
    const noiseEl = document.querySelector('.noise-overlay');
    if(noiseEl) {
        noiseEl.style.backgroundImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
        noiseEl.style.opacity = '0.04';
    }
}
// =======================================================================
// LAVENDERMONY V2 ULTIMATE PATCH - LOGIC & DOM INJECTION CONTROLLER
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Đợi một chút để đảm bảo các thành phần gốc đã render xong
    setTimeout(() => {
        injectV2UIFeatures();
        upgradeInteractiveElements();
    }, 100);
});

function injectV2UIFeatures() {
    // 1. Tiêm phần "Top Playlists / Xu hướng" vào Home View
    const homeView = document.getElementById('view-home');
    const homePlaylistsTemplate = document.getElementById('patch-home-playlists');
    
    if (homeView && homePlaylistsTemplate) {
        const heroBanner = homeView.querySelector('.hero-banner');
        if (heroBanner) {
            // Chèn ngay sau Hero Banner
            heroBanner.insertAdjacentHTML('afterend', homePlaylistsTemplate.innerHTML);
        }
    }

    // 2. Tiêm thêm tính năng vào Cài đặt (Audio & Playback)
    const audioSettingsSection = document.getElementById('settings-sec-audio');
    const extraSettingsTemplate = document.getElementById('patch-extra-settings');
    
    if (audioSettingsSection && extraSettingsTemplate) {
        audioSettingsSection.insertAdjacentHTML('beforeend', extraSettingsTemplate.innerHTML);
    }

    // 3. Nâng cấp hiệu ứng Logo (Dynamic Planet Icon)
    const logoOrbs = document.querySelectorAll('.logo-orb:not(.intro-orb)');
    logoOrbs.forEach(orb => {
        orb.innerHTML = `<i class='bx bx-planet' style='font-size: 24px; background: linear-gradient(45deg, #a87add, #007aff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'></i>`;
        
        // Dynamic glow breathing effect
        setInterval(() => {
            if(!document.hidden) {
                orb.style.boxShadow = `inset 0 0 10px rgba(255,255,255,0.2), 0 0 ${15 + Math.random() * 15}px var(--primary-color)`;
            }
        }, 1500);
    });

    // 4. Logic UI Nâng cấp cho Search Bar
    const searchInputEl = document.getElementById('search-input');
    const placeholderAnim = document.getElementById('search-placeholder');
    
    if(searchInputEl && placeholderAnim) {
        searchInputEl.addEventListener('focus', () => {
            // Khi focus, làm mờ chữ placeholder AI động để nhường chỗ nhập liệu
            placeholderAnim.style.opacity = '0';
            searchInputEl.placeholder = "Bạn muốn tìm bài hát hay nghệ sĩ nào?";
        });
        searchInputEl.addEventListener('blur', () => {
            if(searchInputEl.value.trim() === '') {
                placeholderAnim.style.opacity = '1';
                searchInputEl.placeholder = "";
            }
        });
    }
}

function upgradeInteractiveElements() {
    // Thêm hiệu ứng âm thanh UI giả lập (Tactile Feedback trên Mobile)
    const clickableElements = document.querySelectorAll('.interactive-btn, .bento-playlist-card, .dock-item');
    
    clickableElements.forEach(el => {
        el.addEventListener('click', () => {
            // Kích hoạt rung nhẹ trên điện thoại nếu trình duyệt hỗ trợ
            if (navigator.vibrate) {
                navigator.vibrate(15); 
            }
        });
        
        // Bắt sự kiện cho các playlist nổi bật mới tiêm vào
        if(el.classList.contains('bento-playlist-card')) {
            el.addEventListener('click', () => {
                if (typeof showToast === 'function') {
                    showToast("🎵 Đang tải danh sách phát thịnh hành...");
                }
                if (typeof switchView === 'function') {
                    // Chuyển sang tab khám phá (giả lập việc mở playlist)
                    setTimeout(() => switchView('discover', document.querySelector('.menu a[onclick*="discover"]')), 800);
                }
            });
        }
    });
}
// =======================================================================
// LAVENDERMONY V3 LOGIC PATCH - OFFLINE SYSTEM, AI UPGRADE & MUTATIONS
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Đợi một chút để các Patch V1 V2 render xong
    setTimeout(initLavendermonyV3, 500);
});

// Kho chứa bài hát Offline giả lập
let offlineStorage = JSON.parse(localStorage.getItem('lavenderOfflineSongs')) || [];

function initLavendermonyV3() {
    injectOfflineMenu();
    injectOfflineView();
    initDownloadButtonObserver();
    upgradeAIAccess();
}

/* --- 1. Bơm Nút Menu Tủ Nhạc Offline vào Sidebar --- */
function injectOfflineMenu() {
    const sidebarNav = document.querySelector('.menu');
    if (sidebarNav) {
        const offlineBtnHTML = `
            <a href="#" onclick="switchView('offline', this); if(window.updateDockActive) updateDockActive(this);" class="v3-nav-btn">
                <i class='bx bx-cloud-download' style="color: #34c759;"></i> 
                <span class="nav-text" style="font-weight: 800; background: linear-gradient(45deg, #34c759, #007aff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Tủ Nhạc Offline</span>
            </a>
        `;
        sidebarNav.insertAdjacentHTML('beforeend', offlineBtnHTML);
    }
    
    // Bơm vào Mobile Dock
    const mobileDock = document.querySelector('.mobile-bottom-dock');
    if(mobileDock) {
        mobileDock.insertAdjacentHTML('beforeend', `
            <a href="#" class="dock-item" onclick="switchView('offline', this); if(window.updateDockActive) updateDockActive(this);">
                <i class='bx bx-cloud-download' style="color: #34c759;"></i><span>Offline</span>
            </a>
        `);
    }
}

/* --- 2. Gắn Giao diện Offline vào Main Content --- */
function injectOfflineView() {
    const mainContent = document.querySelector('.main-content');
    const template = document.getElementById('v3-offline-view-template');
    
    if (mainContent && template) {
        mainContent.insertAdjacentHTML('beforeend', template.innerHTML);
        renderOfflineLibrary();
    }
}

/* --- 3. Mutation Observer: Tự động gắn nút Download vào MỌI thẻ Bài hát --- */
function initDownloadButtonObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                // Kiểm tra xem node được thêm vào có phải là song-card không
                if (node.nodeType === 1 && node.classList && node.classList.contains('song-card')) {
                    attachDownloadButtonToCard(node);
                } else if (node.nodeType === 1 && node.querySelectorAll) {
                    // Quét các thẻ song-card nằm bên trong node vừa được thêm
                    node.querySelectorAll('.song-card').forEach(attachDownloadButtonToCard);
                }
            });
        });
    });

    // Bắt đầu theo dõi toàn bộ app-container
    const container = document.querySelector('.app-container');
    if(container) {
        observer.observe(container, { childList: true, subtree: true });
        // Quét lần đầu cho những card đã có sẵn
        document.querySelectorAll('.song-card').forEach(attachDownloadButtonToCard);
    }
}

function attachDownloadButtonToCard(card) {
    const overlay = card.querySelector('.song-actions-overlay');
    // Nếu chưa có nút download thì mới thêm
    if (overlay && !overlay.querySelector('.dl-btn')) {
        // Lấy tên và ảnh để làm ID tìm kiếm (vì DOM không chứa sẵn Track Object)
        const titleEl = card.querySelector('h4');
        const imgEl = card.querySelector('.song-img');
        
        if(titleEl && imgEl) {
            const title = titleEl.innerText;
            // Tìm ID bài hát từ title trong hệ thống
            let trackObj = findTrackInAppByTitle(title);
            
            const isDownloaded = trackObj ? offlineStorage.some(t => t.id === trackObj.id) : false;
            
            const dlBtn = document.createElement('button');
            dlBtn.className = `quick-action-btn dl-btn ${isDownloaded ? 'downloaded' : ''}`;
            dlBtn.innerHTML = isDownloaded ? "<i class='bx bx-check'></i>" : "<i class='bx bx-download'></i>";
            dlBtn.title = "Tải xuống lưu offline";
            
            dlBtn.onclick = (e) => {
                e.stopPropagation();
                if(trackObj) handleDownloadTrack(trackObj, dlBtn);
                else showToast("Dữ liệu bài hát đang tải, thử lại sau!");
            };
            
            // Chèn vào đầu danh sách nút
            overlay.insertBefore(dlBtn, overlay.firstChild);
        }
    }
}

// Hàm hỗ trợ tìm Track
function findTrackInAppByTitle(title) {
    let all = [...(typeof DEFAULT_RECOMMENDATIONS !== 'undefined' ? DEFAULT_RECOMMENDATIONS : []), 
               ...(appState.playbackQueue || []), 
               ...(appState.recentlyPlayed || []), 
               ...(appState.likedSongs || [])];
    if(appState.playlists) {
        Object.values(appState.playlists).forEach(pl => all = [...all, ...pl.songs]);
    }
    return all.find(t => t.title === title);
}

/* --- 4. Xử lý Logic Download (Lưu LocalStorage) --- */
function handleDownloadTrack(track, btnElement) {
    const isExists = offlineStorage.some(t => t.id === track.id);
    
    if (isExists) {
        showToast("Bài hát này đã có trong thư mục Offline.");
        return;
    }
    
    // Giả lập hiệu ứng tải xuống
    btnElement.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
    showToast(`Đang tải: ${track.title}...`);
    
    setTimeout(() => {
        offlineStorage.push(track);
        localStorage.setItem('lavenderOfflineSongs', JSON.stringify(offlineStorage));
        
        btnElement.classList.add('downloaded');
        btnElement.innerHTML = "<i class='bx bx-check'></i>";
        showToast(`✅ Đã lưu ${track.title} vào Tủ Nhạc Offline!`);
        
        renderOfflineLibrary();
    }, 1500); // 1.5s fake download time
}

function renderOfflineLibrary() {
    const grid = document.getElementById('offline-songs-grid');
    const countSpan = document.getElementById('offline-count');
    if (!grid) return;
    
    countSpan.innerText = offlineStorage.length;
    grid.innerHTML = '';
    
    if (offlineStorage.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); width: 100%; grid-column: 1/-1;"><i class="bx bx-ghost" style="font-size:24px; vertical-align:middle;"></i> Tủ nhạc đang trống. Hãy tải thêm bài hát để nghe khi rớt mạng nhé!</p>';
        return;
    }
    
    offlineStorage.forEach(track => {
        // Dùng lại hàm build card gốc
        if(typeof createTrackCardHTML === 'function') {
            const card = createTrackCardHTML(track);
            grid.appendChild(card);
        }
    });
}

window.playOfflineAll = function() {
    if (offlineStorage.length === 0) return showToast("Không có bài hát nào để phát!");
    
    appState.playbackQueue = [...offlineStorage];
    appState.currentQueueIndex = 0;
    const t = appState.playbackQueue[0];
    if(typeof playTrack === 'function') {
        playTrack(t.id, t.title, t.artist, t.thumb);
        showToast("Đang phát toàn bộ thư mục Offline!");
    }
}

window.clearOfflineData = function() {
    if(confirm("Bạn có chắc chắn muốn xóa toàn bộ nhạc đã tải xuống?")) {
        offlineStorage = [];
        localStorage.setItem('lavenderOfflineSongs', JSON.stringify(offlineStorage));
        renderOfflineLibrary();
        showToast("Đã dọn dẹp Tủ Nhạc Offline.");
        
        // Reset lại icon các nút download trên giao diện
        document.querySelectorAll('.dl-btn.downloaded').forEach(btn => {
            btn.classList.remove('downloaded');
            btn.innerHTML = "<i class='bx bx-download'></i>";
        });
    }
}

/* --- 5. Nâng Cấp Nút Mở Dashboard AI --- */
function upgradeAIAccess() {
    // Hook vào nút AI cũ để mở Bảng điều khiển Master thay vì Drawer nhỏ
    const floatAIBtn = document.getElementById('floating-ai-dj-btn');
    if (floatAIBtn) {
        // Chèn đè sự kiện click
        floatAIBtn.onclick = (e) => {
            e.preventDefault();
            const aiMaster = document.getElementById('v3-ai-master-dashboard');
            if(aiMaster) aiMaster.classList.add('show-modal');
        };
    }
}
// =======================================================================
// LAVENDERMONY V4 ULTIMATE EXPANSION - DOM INJECTION & LOGIC
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Chờ các hệ thống V1, V2, V3 khởi chạy xong rồi mới tiêm V4 vào (tránh xung đột)
    setTimeout(initLavendermonyV4, 900);
});

function initLavendermonyV4() {
    injectV4HomeExpansion();
    injectV4SettingsExpansion();
    upgradeSmartSearchBarContext();
    upgradeAIDeepScanLogic();
}

/* --- 1. Tiêm giao diện mở rộng vào Trang Chủ --- */
function injectV4HomeExpansion() {
    const homeView = document.getElementById('view-home');
    const homeTemplate = document.getElementById('v4-home-expansion');
    
    // Tìm grid gợi ý cuối cùng để chèn sau nó
    if (homeView && homeTemplate) {
        const recoGrid = document.getElementById('recommendations-grid');
        if(recoGrid) {
            recoGrid.insertAdjacentHTML('afterend', homeTemplate.innerHTML);
        } else {
            homeView.appendChild(homeTemplate.content.cloneNode(true));
        }
    }
}

/* --- 2. Tiêm tính năng EQ và Haptics vào Cài đặt (Audio) --- */
function injectV4SettingsExpansion() {
    const audioSettingsSection = document.getElementById('settings-sec-audio');
    const settingsTemplate = document.getElementById('v4-settings-expansion');
    
    if (audioSettingsSection && settingsTemplate) {
        // Tìm thẻ card cuối cùng trong phần Audio và chèn nội dung vào dưới
        const cards = audioSettingsSection.querySelectorAll('.settings-card');
        const lastCard = cards[cards.length - 1];
        if(lastCard) {
            lastCard.insertAdjacentHTML('afterend', settingsTemplate.innerHTML);
        }
    }
}

/* --- 3. Nâng cấp Thanh tìm kiếm thông minh (Phân tích ngữ cảnh Keyword) --- */
function upgradeSmartSearchBarContext() {
    const searchInputEl = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    
    if (searchInputEl && searchSuggestions) {
        searchInputEl.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            
            // Xóa nút AI Quick gợi ý cũ nếu có
            const oldAiBtn = document.getElementById('v4-quick-ai-context-btn');
            if(oldAiBtn) oldAiBtn.remove();

            // Nhận diện từ khóa thông minh
            if (val.length > 2 && (val.includes('mưa') || val.includes('buồn') || val.includes('chill') || val.includes('code') || val.includes('ngủ'))) {
                const aiHTML = `
                    <div id="v4-quick-ai-context-btn" class="suggestion-item" 
                         style="color: var(--primary-color); font-weight: 800; background: rgba(168, 122, 221, 0.1); border-radius: 12px; margin-bottom: 10px;" 
                         onclick="quickAiCommand('Phối bản nhạc tối ưu cho vibe: ${val}'); document.getElementById('search-dim').classList.remove('active');">
                        <i class='bx bx-brain bx-tada' style="color: #ff2d55;"></i> ✨ AI Scan: Tạo không gian cho "${val}"
                    </div>
                `;
                // Chèn lên đầu danh sách gợi ý
                searchSuggestions.insertAdjacentHTML('afterbegin', aiHTML);
            }
        });
    }
}

/* --- 4. Nâng cấp hiệu ứng AI Deep Scan khi submit yêu cầu AI --- */
function upgradeAIDeepScanLogic() {
    // Lưu lại hàm AI gốc
    const originalAiSubmit = window.submitAiDjRequest;
    
    // Ghi đè hàm mới tích hợp UI V4
    window.submitAiDjRequest = function() {
        const overlay = document.getElementById('v4-ai-deepscan');
        const inputEl = document.getElementById('ai-dj-input') || document.getElementById('ai-mood-input');
        
        // Chỉ chạy hiệu ứng nếu input có dữ liệu
        if(inputEl && inputEl.value.trim() !== '') {
            if(overlay) {
                overlay.classList.remove('hidden');
                overlay.style.opacity = '1';
                
                // Rung nhẹ màn hình nếu hỗ trợ (Haptics)
                if (navigator.vibrate) navigator.vibrate([50, 100, 50]);

                // Giả lập thời gian quét nơ-ron mạng AI
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.classList.add('hidden'), 400);
                    
                    // Sau khi quét xong thì gọi logic AI gốc xử lý Chat/Render nhạc
                    if(typeof originalAiSubmit === 'function') {
                        originalAiSubmit();
                    }
                }, 1800);
                return; // Tránh chạy logic gốc ngay lập tức
            }
        }
        
        // Fallback chạy bình thường nếu rỗng hoặc không có overlay
        if(typeof originalAiSubmit === 'function') originalAiSubmit();
    };
}
// =======================================================================
// LAVENDERMONY V5 - SETTINGS LOGIC OVERRIDE (APPEND ONLY)
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Chờ các hệ thống trước render xong
    setTimeout(injectV5SettingsRedesign, 1500); 
});

function injectV5SettingsRedesign() {
    const settingsModal = document.querySelector('.settings-layout-premium');
    
    // 1. Tiêm Tiêu đề Trung Tâm Điều Khiển (Control Center)
    if(settingsModal && !document.getElementById('v5-settings-header')) {
        const headerHTML = `
            <div id="v5-settings-header" style="text-align: center; padding: 10px 0 25px 0; animation: fadeUp 0.6s ease forwards;">
                <h2 style="font-size: 34px; font-weight: 900; background: var(--purple-glow-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 5px;">Trung Tâm Điều Khiển</h2>
                <p style="color: var(--text-secondary); font-size: 15px; font-weight: 600;">Cá nhân hóa không gian Lavendermony của bạn</p>
            </div>
        `;
        // Chèn lên trên cùng của Modal
        settingsModal.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // 2. Ghi đè logic chuyển tab: Thêm tự động cuộn lên đầu mượt mà
    if (typeof window.switchSettingsSection === 'function') {
        const originalSwitch = window.switchSettingsSection;
        window.switchSettingsSection = function(sectionId, element) {
            // Chạy logic cũ để đổi nội dung
            originalSwitch(sectionId, element);
            
            // Thêm logic mới: Tự cuộn lên đầu vùng content
            const bodyContent = document.querySelector('.settings-body-content');
            if(bodyContent) {
                bodyContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
}
// =======================================================================
// LAVENDERMONY V6 - ULTIMATE SETTINGS OVERHAUL (APPEND ONLY)
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Đợi 2s để đảm bảo các Patch V1->V5 render và chèn DOM hoàn tất
    setTimeout(initLavendermonyV6Settings, 2000); 
});

function initLavendermonyV6Settings() {
    injectV6SettingsSidebar();
    injectV6SettingsSections();
    initSettingsSmartSearch();
    initLivePreviewEngine();
    initSettingsImportExport();
}

function injectV6SettingsSidebar() {
    const sidebar = document.querySelector('.settings-sidebar');
    if (!sidebar) return;
    
    // Thêm các Tabs Setting mới vào thanh Navigation ngang của V5
    const newNavItems = `
        <div class="settings-menu-item" onclick="switchSettingsSection('performance', this)"><i class='bx bx-tachometer'></i> <span>Hiệu suất</span></div>
        <div class="settings-menu-item" onclick="switchSettingsSection('ai', this)"><i class='bx bx-brain'></i> <span>AI DJ</span></div>
        <div class="settings-menu-item" onclick="switchSettingsSection('accessibility', this)"><i class='bx bx-accessibility'></i> <span>Trợ năng</span></div>
        <div class="settings-menu-item" onclick="switchSettingsSection('advanced', this)"><i class='bx bx-code-alt'></i> <span>Nâng cao</span></div>
    `;
    sidebar.insertAdjacentHTML('beforeend', newNavItems);
}

function injectV6SettingsSections() {
    const bodyContent = document.querySelector('.settings-body-content');
    const v6Templates = document.getElementById('v6-settings-templates');
    if (bodyContent && v6Templates) {
        bodyContent.insertAdjacentHTML('beforeend', v6Templates.innerHTML);
    }
    
    // Chèn thanh trượt Live Preview vào tab Giao diện (Appearance) hiện có
    const appearanceSection = document.getElementById('settings-sec-appearance');
    const v6AppearanceUpgrades = document.getElementById('v6-appearance-upgrades');
    if (appearanceSection && v6AppearanceUpgrades) {
        appearanceSection.insertAdjacentHTML('beforeend', v6AppearanceUpgrades.innerHTML);
    }
    
    // Chèn thanh Smart Search vào Header của Settings
    const header = document.getElementById('v5-settings-header');
    if (header && !document.getElementById('v6-settings-search')) {
        const searchHTML = `
            <div class="settings-search-wrapper" style="margin-top: 20px; max-width: 450px; margin-inline: auto; animation: fadeUp 0.7s ease forwards;">
                <div class="search-bar glass" style="padding: 12px 24px; border-radius: 30px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.3);">
                    <i class='bx bx-search search-icon' style="color: var(--primary-color); font-size: 20px;"></i>
                    <input type="text" id="v6-settings-search" placeholder="Tìm cài đặt (VD: blur, AI, theme...)" style="width: 100%; background: transparent; border: none; outline: none; color: var(--text-primary); margin-left: 12px; font-weight: 600; font-size: 15px;">
                </div>
            </div>
        `;
        header.insertAdjacentHTML('beforeend', searchHTML);
    }
}

function initSettingsSmartSearch() {
    const searchInput = document.getElementById('v6-settings-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const allCards = document.querySelectorAll('.settings-section-block .settings-card');
        
        allCards.forEach(card => {
            const text = card.innerText.toLowerCase();
            if (val === '') {
                card.style.display = 'flex'; 
                card.style.opacity = '1';
            } else if (text.includes(val)) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                // Đổi tab sang tab chứa card này nếu tìm thấy (Advanced Logic)
                const parentSection = card.closest('.settings-section-block');
                if (parentSection && !parentSection.classList.contains('active')) {
                    const sectionId = parentSection.id.replace('settings-sec-', '');
                    const tabBtn = document.querySelector(`.settings-menu-item[onclick*="${sectionId}"]`);
                    if(tabBtn) window.switchSettingsSection(sectionId, tabBtn);
                }
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        });
    });
}

function initLivePreviewEngine() {
    // Live Preview: Blur Intensity
    const blurSlider = document.getElementById('v6-blur-slider');
    if (blurSlider) {
        blurSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            document.documentElement.style.setProperty('--glass-blur', `blur(${val}px)`);
        });
    }
    
    // Live Preview: Ambient Glow Intensity
    const glowSlider = document.getElementById('v6-glow-slider');
    if (glowSlider) {
        glowSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            document.documentElement.style.setProperty('--ambient-glow', `rgba(168, 122, 221, ${val})`);
        });
    }
}

function initSettingsImportExport() {
    window.exportSettingsConfig = () => {
        const config = JSON.stringify(appState.settings || {});
        prompt("Copy mã cấu hình của bạn (Ctrl+C / Cmd+C):", btoa(config));
    };
    
    window.importSettingsConfig = () => {
        const code = prompt("Dán mã cấu hình vào đây:");
        if (code) {
            try {
                const parsed = JSON.parse(atob(code));
                appState.settings = { ...appState.settings, ...parsed };
                localStorage.setItem('appSettings', JSON.stringify(appState.settings));
                showToast("✅ Đã nhập cấu hình! Đang khởi động lại UI...");
                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                showToast("❌ Mã cấu hình không hợp lệ hoặc bị hỏng!");
            }
        }
    };
    
    window.resetSettingsConfig = () => {
        if (confirm("Khôi phục toàn bộ cài đặt về mặc định của nhà phát triển?")) {
            localStorage.removeItem('appSettings');
            localStorage.removeItem('theme');
            localStorage.removeItem('appColor');
            showToast("Đang dọn dẹp hệ thống...");
            setTimeout(() => location.reload(), 1000);
        }
    };
}

// Logic điều khiển Accessibility
window.toggleHighContrast = (el) => {
    el.classList.toggle('active');
    document.body.classList.toggle('high-contrast-mode');
    showToast(el.classList.contains('active') ? "Bật chế độ Tương phản cao" : "Tắt chế độ Tương phản cao");
};

window.toggleLargeText = (el) => {
    el.classList.toggle('active');
    document.body.classList.toggle('large-text-mode');
    showToast(el.classList.contains('active') ? "Đã phóng to văn bản" : "Trở về kích thước chuẩn");
};
// =======================================================================
// LAVENDERMONY AUTOMATIC CLEANUP - REMOVE PRO EXPERIENCE DIRECTLY FROM DOM
// =======================================================================
(function() {
    const dọnDẹpHệThống = () => {
        // Tìm khối Cấu hình Pro Experience
        const proBlock = document.querySelector('.settings-group-pro');
        // Tìm khối Cấu hình Chung (General)
        const generalBlock = document.querySelector('.settings-group-general');
        
        if (proBlock) {
            // Xóa tận gốc phần tử Pro Experience ra khỏi mã nguồn HTML khi chạy
            proBlock.remove(); 
        }
        
        if (generalBlock) {
            // Ép khối General giãn đều ra 100% diện tích không gian trống
            generalBlock.style.setProperty('grid-column', '1 / -1', 'important');
            generalBlock.style.setProperty('width', '100%', 'important');
            generalBlock.style.setProperty('max-width', '100%', 'important');
            
            // Đồng bộ lại tất cả card con bên trong để lấp đầy không gian mới
            const cards = generalBlock.querySelectorAll('.settings-card');
            cards.forEach(card => {
                card.style.setProperty('width', '100%', 'important');
                card.style.setProperty('max-width', '100%', 'important');
            });
        }
    };

    // Chạy dọn dẹp ngay khi cấu trúc HTML vừa dựng xong
    document.addEventListener('DOMContentLoaded', dọnDẹpHệThống);
    // Chạy dự phòng lại sau 1.5 giây phòng trường hợp các bản patch trước render chậm
    setTimeout(dọnDẹpHệThống, 1500);
})();
// =======================================================================
// LAVENDERMONY V7 - PREMIUM SIDEBAR LAYOUT PATCH (APPEND ONLY)
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Đợi các Patch V5, V6 render xong rồi mới tái cấu trúc DOM
    setTimeout(applyV7PremiumLayout, 2500); 
});

function applyV7PremiumLayout() {
    const bodyContent = document.querySelector('.settings-body-content');
    const headerV5 = document.getElementById('v5-settings-header');

    if (bodyContent && headerV5) {
        // Chuyển khối Header (Tiêu đề + Thanh Search) vào khu vực cuộn bên phải
        // Giúp Sidebar bên trái được kéo dài full 100% chiều cao
        bodyContent.insertBefore(headerV5, bodyContent.firstChild);
        
        // Log báo cáo hệ thống
        if (typeof showToast === 'function') {
            console.log("Lavendermony V7: Premium 2-Column Sidebar Active!");
        }
    }
}
// =======================================================================
// LAVENDERMONY V9 - PERFECT TRIPLE ISOLATION ARCHITECTURE (APPEND ONLY)
// =======================================================================
(function() {
    const executeTripleIsolation = () => {
        const header = document.getElementById('v5-settings-header');
        const content = document.querySelector('.settings-body-content');
        const sidebar = document.querySelector('.settings-sidebar');
        
        if (header && content && sidebar) {
            const parent = content.parentElement;
            if (parent) {
                // Đảm bảo phần tử cha kích hoạt bộ khung Premium Layout
                parent.classList.add('settings-layout-premium');
                
                // Đưa cả 3 thành phần về làm con trực tiếp, xếp hàng ngay ngắn: Sidebar -> Header -> Content
                parent.appendChild(sidebar);
                parent.appendChild(header);
                parent.appendChild(content);
            }
        }
    };

    // Chạy liên tiếp tại các mốc thời gian để đè bẹp các logic cũ bị lỗi
    document.addEventListener('DOMContentLoaded', executeTripleIsolation);
    window.addEventListener('load', executeTripleIsolation);
    setTimeout(executeTripleIsolation, 400);
    setTimeout(executeTripleIsolation, 1200);
    setTimeout(executeTripleIsolation, 2600);
})();
// =======================================================================
// LAVENDERMONY V10 - CORE TAB ENGINE & NEW FEATURES LOGIC (APPEND ONLY)  
// =======================================================================
(function() {
    const initializeV10Engine = () => {
        const sidebar = document.querySelector('.settings-sidebar');
        const contentArea = document.querySelector('.settings-body-content');
        if (!sidebar || !contentArea) return;

        // 1. Đồng bộ cấu trúc dữ liệu Sidebar chuẩn xác theo yêu cầu
        sidebar.innerHTML = `
            <div class="settings-menu-item active-tab" data-target="v10-chung"><i class='bx bx-cog' style='margin-right:10px;'></i>Chung</div>
            <div class="settings-menu-item" data-target="v10-giaodien"><i class='bx bx-palette' style='margin-right:10px;'></i>Giao diện</div>
            <div class="settings-menu-item" data-target="v10-amthanh"><i class='bx bx-volume-full' style='margin-right:10px;'></i>Âm thanh</div>
            <div class="settings-menu-item" data-target="v10-aidj"><i class='bx bx-brain' style='margin-right:10px;'></i>AI DJ</div>
            <div class="settings-menu-item" data-target="v10-tronang"><i class='bx bx-accessibility' style='margin-right:10px;'></i>Trợ năng</div>
        `;

        // 2. Định nghĩa và kết xuất nội dung phong phú cho cả 5 Tab mới
        contentArea.innerHTML = `
            <div id="v10-chung" class="settings-tab-panel active-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Khởi động cùng hệ thống</h4><span>Tự động mở nhạc ngay khi thiết bị sẵn sàng</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Đồng bộ đám mây (iCloud/Drive)</h4><span>Sao lưu playlist và thư viện nhạc tự động</span></div>
                    <label class="v10-toggle"><input type="checkbox" id="v10-sync-cloud" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Bộ nhớ đệm (Cache)</h4><span>Đã dùng 142 MB</span></div>
                    <button class="glass" style="padding:8px 16px; border-radius:10px; border:1px solid var(--surface-border); cursor:pointer;" onclick="alert('Đã xóa sạch bộ nhớ đệm ứng dụng mượt mà!')">Xóa bộ đệm</button>
                </div>
            </div>

            <div id="v10-giaodien" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Màu sắc chủ đạo (Accent Color)</h4><span>Thay đổi sắc thái hiển thị ứng dụng</span></div>
                    <div class="v10-color-picker">
                        <div class="v10-color-dot active-color" style="background:#a87add;" data-color="#a87add" title="Lavender"></div>
                        <div class="v10-color-dot" style="background:#10b981;" data-color="#10b981" title="Emerald"></div>
                        <div class="v10-color-dot" style="background:#3b82f6;" data-color="#3b82f6" title="Sapphire"></div>
                        <div class="v10-color-dot" style="background:#ef4444;" data-color="#ef4444" title="Ruby"></div>
                    </div>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Độ nhòe kính (Glass Blur)</h4><span>Điều chỉnh hiệu ứng Liquid Glass nền</span></div>
                    <input type="range" class="v10-range" min="10" max="60" value="40" id="v10-blur-slider">
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Chế độ tối động (Dynamic Dark Mode)</h4><span>Tự động tối màu dựa trên bìa đĩa nhạc đang phát</span></div>
                    <label class="v10-toggle"><input type="checkbox"><span class="v10-slider"></span></label>
                </div>
            </div>

            <div id="v10-amthanh" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Hòa âm chuyển bài (Crossfade)</h4><span>Lồng ghép âm thanh mượt mà giữa các bài hát</span></div>
                    <label class="v10-toggle"><input type="checkbox" id="v10-crossfade-toggle" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Thời gian trộn nhạc</h4><span>Thời gian giao thoa âm thanh bài cũ và mới</span></div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="range" class="v10-range" min="0" max="12" value="4" id="v10-crossfade-time">
                        <span id="v10-cf-val" style="font-size:13px; font-weight:600; width:30px;">4s</span>
                    </div>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Bộ chỉnh âm (Equalizer Preset)</h4><span>Tối ưu hóa dải tần cho tai nghe</span></div>
                    <select class="v10-select" id="v10-eq-select">
                        <option value="flat">Mặc định (Flat)</option>
                        <option value="bass">Tăng cường Bass (Bass Boost)</option>
                        <option value="vocal">Làm rõ giọng ca (Vocal Clear)</option>
                        <option value="acoustic">Acoustic mộc mạc</option>
                    </select>
                </div>
            </div>

            <div id="v10-aidj" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Bình luận viên thông minh</h4><span>AI DJ phân tích và nói lời dẫn chuyện giữa các bài hát</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Tần suất xuất hiện giọng nói</h4><span>Tùy biến mức độ can thiệp dẫn nhạc của AI</span></div>
                    <select class="v10-select">
                        <option value="low">Thỉnh thoảng (3 bài/lần)</option>
                        <option value="medium" selected>Vừa phải (2 bài/lần)</option>
                        <option value="high">Liên tục (Mỗi bài đều nói)</option>
                    </select>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Tự động bắt nhịp cảm xúc</h4><span>Phân tích dữ liệu thời gian, thời tiết để đổi nhạc phù hợp</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
            </div>

            <div id="v10-tronang" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Cỡ chữ giao diện lớn hơn</h4><span>Tăng kích thước text hỗ trợ nhìn xa rõ nét</span></div>
                    <label class="v10-toggle"><input type="checkbox" id="v10-large-text"><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Tốc độ chuyển động (Animation Speed)</h4><span>Kiểm soát độ trễ các hiệu ứng bay nhảy trên màn hình</span></div>
                    <select class="v10-select" id="v10-anim-speed">
                        <option value="smooth" selected>Mượt mà chuẩn (0.4s)</option>
                        <option value="fast">Siêu tốc phản hồi nhanh (0.15s)</option>
                        <option value="none">Tắt chuyển động (Không độ trễ)</option>
                    </select>
                </div>
            </div>
        `;

        // 3. Cơ chế kích hoạt chuyển đổi Tab mượt mà khi người dùng bấm chọn
        const menuItems = sidebar.querySelectorAll('.settings-menu-item');
        const panels = contentArea.querySelectorAll('.settings-tab-panel');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(i => i.classList.remove('active-tab'));
                panels.forEach(p => p.classList.remove('active-panel'));

                item.classList.add('active-tab');
                const targetId = item.getAttribute('data-target');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active-panel');
                }
            });
        });

        // 4. Liên kết tính năng tương tác trực tiếp
        // Thay đổi Accent Color động
        const colorDots = contentArea.querySelectorAll('.v10-color-dot');
        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                colorDots.forEach(d => d.classList.remove('active-color'));
                dot.classList.add('active-color');
                const selectedColor = dot.getAttribute('data-color');
                document.documentElement.style.setProperty('--primary-color', selectedColor);
                document.documentElement.style.setProperty('--ambient-glow', selectedColor + "59");
            });
        });

        // Điều chỉnh độ nhòe kính nền
        const blurSlider = document.getElementById('v10-blur-slider');
        if (blurSlider) {
            blurSlider.addEventListener('input', (e) => {
                document.documentElement.style.setProperty('--glass-blur', `blur(${e.target.value}px)`);
            });
        }

        // Đồng bộ hiển thị giây trộn nhạc Crossfade
        const cfSlider = document.getElementById('v10-crossfade-time');
        const cfVal = document.getElementById('v10-cf-val');
        if (cfSlider && cfVal) {
            cfSlider.addEventListener('input', (e) => {
                cfVal.innerText = e.target.value + 's';
            });
        }
    };

    // Thực thi tuần tự chặn đứng hoàn toàn mọi xung đột layout cũ
    window.addEventListener('load', () => setTimeout(initializeV10Engine, 3000));
    setTimeout(initializeV10Engine, 3200);
})();
// =======================================================================
// LAVENDERMONY V11 - GLOBALIZATION & EXPANDED FEATURES (APPEND ONLY)  
// =======================================================================
(function() {
    const applyV11Expansion = () => {
        const sidebar = document.querySelector('.settings-sidebar');
        const contentArea = document.querySelector('.settings-body-content');
        if (!sidebar || !contentArea) return;

        // 1. Cập nhật Sidebar thêm Tab "Tài khoản (Pro)"
        sidebar.innerHTML = `
            <div class="settings-menu-item active-tab" data-target="v11-chung"><i class='bx bx-cog' style='margin-right:10px;'></i>Chung</div>
            <div class="settings-menu-item" data-target="v11-giaodien"><i class='bx bx-palette' style='margin-right:10px;'></i>Giao diện</div>
            <div class="settings-menu-item" data-target="v11-amthanh"><i class='bx bx-volume-full' style='margin-right:10px;'></i>Âm thanh</div>
            <div class="settings-menu-item" data-target="v11-aidj"><i class='bx bx-brain' style='margin-right:10px;'></i>AI DJ</div>
            <div class="settings-menu-item" data-target="v11-tronang"><i class='bx bx-accessibility' style='margin-right:10px;'></i>Trợ năng</div>
            <div class="settings-menu-item" data-target="v11-taikhoan"><i class='bx bx-user-circle' style='margin-right:10px;'></i>Tài khoản <span class="v11-pro-badge">PRO</span></div>
        `;

        // 2. Nạp toàn bộ tính năng nội dung mới siêu khủng
        contentArea.innerHTML = `
            <div id="v11-chung" class="settings-tab-panel active-panel">
                <div class="settings-card glass" style="padding: 24px !important;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Ngôn ngữ hiển thị (Localization)</h4>
                    <p style="font-size: 13px; color: var(--text-secondary);">Hệ thống AI sẽ tự động đồng bộ phụ đề lời bài hát theo ngôn ngữ bạn chọn.</p>
                    <div class="v11-lang-grid">
                        <div class="v11-lang-btn active-lang"><span class="v11-flag">🇻🇳</span> Tiếng Việt</div>
                        <div class="v11-lang-btn"><span class="v11-flag">🇺🇸</span> English</div>
                        <div class="v11-lang-btn"><span class="v11-flag">🇪🇸</span> Español</div>
                        <div class="v11-lang-btn"><span class="v11-flag">🇫🇷</span> Français</div>
                        <div class="v11-lang-btn"><span class="v11-flag">🇯🇵</span> 日本語</div>
                        <div class="v11-lang-btn"><span class="v11-flag">🇰🇷</span> 한국어</div>
                        <div class="v11-lang-btn"><span class="v11-flag">🇨🇳</span> 中文 (Giản thể)</div>
                    </div>
                </div>

                <div class="v10-row">
                    <div class="v10-meta"><h4>Chế độ tiết kiệm dữ liệu (Data Saver)</h4><span>Chỉ tải nhạc chất lượng cao khi có Wi-Fi</span></div>
                    <label class="v10-toggle"><input type="checkbox"><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Chế độ ô tô (Carplay Mode)</h4><span>Tự động chuyển giao diện lớn khi kết nối Bluetooth ô tô</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
            </div>

            <div id="v11-giaodien" class="settings-tab-panel">
                <div class="settings-card glass" style="padding: 24px !important;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Thay đổi Biểu tượng ứng dụng (App Icon)</h4>
                    <p style="font-size: 13px; color: var(--text-secondary);">Chỉ dành cho thành viên Premium.</p>
                    <div class="v11-icon-picker">
                        <div class="v11-icon-opt active-icon" style="background: linear-gradient(135deg, #a87add, #007aff);"></div>
                        <div class="v11-icon-opt" style="background: linear-gradient(135deg, #ff2d55, #ff9500);"></div>
                        <div class="v11-icon-opt" style="background: linear-gradient(135deg, #111, #333);"></div>
                        <div class="v11-icon-opt" style="background: linear-gradient(135deg, #34c759, #115c2a);"></div>
                    </div>
                </div>

                <div class="v10-row">
                    <div class="v10-meta"><h4>Màu sắc chủ đạo (Accent Color)</h4></div>
                    <div class="v10-color-picker">
                        <div class="v10-color-dot active-color" style="background:#a87add;" data-color="#a87add"></div>
                        <div class="v10-color-dot" style="background:#10b981;" data-color="#10b981"></div>
                        <div class="v10-color-dot" style="background:#3b82f6;" data-color="#3b82f6"></div>
                        <div class="v10-color-dot" style="background:#ef4444;" data-color="#ef4444"></div>
                        <div class="v10-color-dot" style="background:#f59e0b;" data-color="#f59e0b"></div>
                    </div>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Font chữ hệ thống</h4><span>Đổi font chữ để thay đổi cá tính không gian</span></div>
                    <select class="v10-select">
                        <option selected>Inter (Hiện đại)</option>
                        <option>SF Pro (Apple Style)</option>
                        <option>Roboto (Android Style)</option>
                    </select>
                </div>
            </div>

            <div id="v11-amthanh" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Âm thanh Lossless (Hi-Res) <span class="v11-pro-badge">PRO</span></h4><span>Phát nhạc định dạng không nén (ALAC/FLAC) 24-bit/192kHz</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Dolby Atmos (Spatial Audio)</h4><span>Trải nghiệm không gian âm thanh vòm 360 độ</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Chuẩn hóa âm lượng (Normalize)</h4><span>Cân bằng âm lượng tự động giữa các bài hát cũ và mới</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Thiết bị phát nhạc hiện tại</h4><span>Cập nhật luồng âm thanh đầu ra</span></div>
                    <select class="v10-select">
                        <option selected>MacBook Pro Speakers</option>
                        <option>AirPods Pro (Hệ sinh thái)</option>
                        <option>Sony WH-1000XM5 (Bluetooth)</option>
                    </select>
                </div>
            </div>

            <div id="v11-aidj" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Giọng nói AI DJ (Persona)</h4><span>Chọn tính cách cho trợ lý âm nhạc của bạn</span></div>
                    <select class="v10-select">
                        <option selected>Emma (Nữ, Nhẹ nhàng, Truyền cảm)</option>
                        <option>David (Nam, Trầm ấm, Radio Host)</option>
                        <option>Nova (Robot, Tương lai, Cyberpunk)</option>
                    </select>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Độ sáng tạo của AI (Creativity Slider)</h4><span>Kéo sang phải để AI gợi ý nhạc lạ/indie nhiều hơn</span></div>
                    <input type="range" class="v10-range" min="1" max="100" value="70">
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Chế độ đọc tiểu sử nghệ sĩ</h4><span>AI kể chuyện ngắn về bài hát trước khi phát</span></div>
                    <label class="v10-toggle"><input type="checkbox"><span class="v10-slider"></span></label>
                </div>
            </div>

            <div id="v11-tronang" class="settings-tab-panel">
                <div class="v10-row">
                    <div class="v10-meta"><h4>Bộ lọc mù màu (Color Blind Filter)</h4><span>Hỗ trợ hiển thị màu sắc rõ nét hơn</span></div>
                    <select class="v10-select">
                        <option selected>Tắt (Mặc định)</option>
                        <option>Protanomaly (Mù màu Đỏ)</option>
                        <option>Deuteranomaly (Mù màu Xanh lục)</option>
                        <option>Tritanomaly (Mù màu Xanh lam)</option>
                    </select>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Giảm độ trong suốt (Reduce Transparency)</h4><span>Xóa bỏ hiệu ứng kính mờ để ưu tiên hiệu năng và độ nét</span></div>
                    <label class="v10-toggle"><input type="checkbox"><span class="v10-slider"></span></label>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Phụ đề đóng (Closed Captions cho AI)</h4><span>Hiển thị text khi AI DJ đang trò chuyện</span></div>
                    <label class="v10-toggle"><input type="checkbox" checked><span class="v10-slider"></span></label>
                </div>
            </div>

            <div id="v11-taikhoan" class="settings-tab-panel">
                <div class="settings-card glass" style="padding: 24px !important; display: flex; align-items: center; gap: 20px;">
                    <img src="https://i.pravatar.cc/150?img=11" style="width: 70px; height: 70px; border-radius: 50%; border: 3px solid var(--primary-color);">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">Huỳnh Nguyên Đạt <span class="v11-pro-badge" style="vertical-align: middle;">PRO MAX</span></h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">Gói thuê bao sẽ gia hạn vào 24/05/2027.</p>
                    </div>
                </div>
                <div class="v10-row">
                    <div class="v10-meta"><h4>Quản lý thiết bị</h4><span>Bạn đang đăng nhập trên 3 thiết bị</span></div>
                    <button class="v10-select" style="cursor:pointer;" onclick="alert('Đã mở trình quản lý thiết bị!')">Xem & Đăng xuất</button>
                </div>
                <div class="v10-row v11-danger-zone">
                    <div class="v10-meta"><h4>Xóa dữ liệu cá nhân hóa</h4><span>Reset thuật toán AI và lịch sử nghe nhạc</span></div>
                    <button class="v10-select v11-danger-btn" style="cursor:pointer;" onclick="confirm('Bạn có chắc chắn muốn xóa não bộ AI đã được huấn luyện?')">Reset AI</button>
                </div>
            </div>
        `;

        // 3. Xử lý Logic Chuyển Tab (Tab Switcher Engine)
        const menuItems = sidebar.querySelectorAll('.settings-menu-item');
        const panels = contentArea.querySelectorAll('.settings-tab-panel');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(i => i.classList.remove('active-tab'));
                panels.forEach(p => p.classList.remove('active-panel'));

                item.classList.add('active-tab');
                const targetId = item.getAttribute('data-target');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active-panel');
                }
            });
        });

        // 4. Xử lý Logic Chọn Ngôn Ngữ (UI Only)
        const langBtns = contentArea.querySelectorAll('.v11-lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                langBtns.forEach(b => b.classList.remove('active-lang'));
                btn.classList.add('active-lang');
                if (typeof showToast === 'function') {
                    showToast(`Đã thay đổi ngôn ngữ sang ${btn.innerText.trim()}`);
                }
            });
        });

        // 5. Xử lý Logic Đổi App Icon (UI Only)
        const iconBtns = contentArea.querySelectorAll('.v11-icon-opt');
        iconBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                iconBtns.forEach(b => b.classList.remove('active-icon'));
                btn.classList.add('active-icon');
                if (typeof showToast === 'function') {
                    showToast("App Icon đã được cập nhật!");
                }
            });
        });
        
        // 6. Xử lý Accent Color (Giữ lại tính năng cốt lõi)
        const colorDots = contentArea.querySelectorAll('.v10-color-dot');
        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                colorDots.forEach(d => d.classList.remove('active-color'));
                dot.classList.add('active-color');
                const selectedColor = dot.getAttribute('data-color');
                document.documentElement.style.setProperty('--primary-color', selectedColor);
                document.documentElement.style.setProperty('--ambient-glow', selectedColor + "59");
            });
        });
    };

    // Nạp V11 đè lên ngay sau khi V10 vừa chạy xong để ghi đè giao diện
    window.addEventListener('load', () => setTimeout(applyV11Expansion, 3500));
    setTimeout(applyV11Expansion, 3800);
})();
// =======================================================================
// LAVENDERMONY V12 - CARTOON PHYSICS ENGINE (APPEND ONLY)  
// =======================================================================
(function() {
    const initCartoonPhysics = () => {
        // 1. Quét và gắn hiệu ứng lún (Squash & Stretch) cho mọi nút bấm, thẻ bài hát
        const interactables = document.querySelectorAll('.interactive-btn, .song-card, .play-pause-btn, .submit-btn, .bento-playlist-card, .dock-item, .v11-lang-btn, .color-btn');
        
        interactables.forEach(el => {
            // Chuột (PC)
            el.addEventListener('mousedown', () => el.classList.add('v12-squash-active'));
            el.addEventListener('mouseup', () => {
                el.classList.remove('v12-squash-active');
                createClickParticles(el);
            });
            el.addEventListener('mouseleave', () => el.classList.remove('v12-squash-active'));
            
            // Cảm ứng (Mobile)
            el.addEventListener('touchstart', () => el.classList.add('v12-squash-active'), {passive: true});
            el.addEventListener('touchend', () => {
                el.classList.remove('v12-squash-active');
                createClickParticles(el);
            }, {passive: true});
            el.addEventListener('touchcancel', () => el.classList.remove('v12-squash-active'), {passive: true});
        });

        // 2. Logic tính toán Vật lý hạt (Particle System) khi thả tay/nhả chuột
        const particleContainer = document.getElementById('particle-container');
        if(!particleContainer) return;

        function createClickParticles(element) {
            const rect = element.getBoundingClientRect();
            // Xác định tâm của nút vừa bấm
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Random sinh ra từ 6 đến 10 hạt
            const particleCount = Math.floor(Math.random() * 5) + 6;
            const colors = ['#ff2d55', '#a87add', '#007aff', '#34c759', '#ffcc00', '#ffffff'];
            
            for(let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'v12-particle';
                
                // Chọn màu ngẫu nhiên cho hạt
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.background = color;
                particle.style.color = color; // Gán để tạo màu bóng sáng (Glow)
                
                // Thuật toán phát nổ xoay vòng 360 độ ngẫu nhiên
                const angle = Math.random() * Math.PI * 2;
                // Vận tốc văng ngẫu nhiên (từ 40px đến 100px)
                const velocity = 40 + Math.random() * 60; 
                
                const dx = Math.cos(angle) * velocity;
                const dy = Math.sin(angle) * velocity;
                
                // Đặt tọa độ ban đầu tại tâm nút
                particle.style.left = centerX + 'px';
                particle.style.top = centerY + 'px';
                
                // Truyền tham số CSS Vector bay
                particle.style.setProperty('--dx', dx + 'px');
                particle.style.setProperty('--dy', dy + 'px');
                
                particleContainer.appendChild(particle);
                
                // Dọn dẹp DOM ngay khi animation kết thúc để tránh lag (0.7s)
                setTimeout(() => particle.remove(), 700);
            }
        }
    };

    // Đợi tất cả hệ thống V1 -> V11 khởi chạy xong mới tiêm bộ máy Vật lý V12 vào
    window.addEventListener('load', () => setTimeout(initCartoonPhysics, 4000));
    // Dự phòng bắt buộc chạy sau 4.5s
    setTimeout(initCartoonPhysics, 4500);
})();
// ============================================================================
//               START OF LAVENDERMONY V13 SUPER ENGINE CORE
// ============================================================================

function initV13SuperUpgrade() {
    console.log("Lavendermony V13 Super Upgrade Engine initializing...");

    // 1. TỰ ĐỘNG TIÊM CÁC CƠ SỞ DỮ LIỆU HTML TỪ TẬP EXTENSIONS VÀO MODAL CÀI ĐẶT CHÍNH
    const extensionsContainer = document.getElementById('lavendermony-v13-extensions');
    if (extensionsContainer) {
        const tabsSource = extensionsContainer.querySelector('.v13-tabs-source');
        const sectionsSource = extensionsContainer.querySelector('.v13-sections-source');
        
        const realSidebar = document.querySelector('#settings-modal .settings-sidebar');
        const realBody = document.querySelector('#settings-modal .settings-body-content');
        
        if (realSidebar && tabsSource) {
            while (tabsSource.children.length > 0) {
                realSidebar.appendChild(tabsSource.children[0]);
            }
        }
        
        if (realBody && sectionsSource) {
            while (sectionsSource.children.length > 0) {
                realBody.appendChild(sectionsSource.children[0]);
            }
        }
    }

    // 2. NÂNG CẤP SIÊU ĐA NGÔN NGỮ (VIỆT - ANH - NHẬT - HÀN) TOÀN DIỆN
    const V13_I18N_EXTENSIONS = {
        vi: {
            tab_ai: "AI Agent Pro", tab_eq: "Bộ cân bằng EQ", tab_automation: "Hẹn giờ & Tự động",
            tab_lang: "Ngôn ngữ quốc tế", tab_backup: "Sao lưu & Đồng bộ", title_ai: "Siêu trí tuệ AI Trợ lý DJ",
            ai_radar_title: "🧠 AI Mood Radar (Quét tâm trạng sinh học)",
            ai_radar_desc: "Sử dụng thuật toán AI phân tích tần số giọng nói hoặc hành vi để đề xuất tần số âm thanh thích ứng.",
            ai_radar_btn: "Bắt đầu quét tâm trạng AI", ai_voice_title: "🎙️ Trợ lý ảo dẫn chương trình (AI Voice Host)",
            ai_voice_desc: "Chọn giọng nói dẫn dắt, bình luận âm nhạc của AI DJ giữa các bài hát.",
            title_eq: "Bộ cân bằng âm thanh Graphic Equalizer (10-Band)",
            eq_preset_title: "🎛️ Chế độ âm thanh mẫu (EQ Presets)",
            eq_preset_desc: "Tối ưu hóa dải tần cho từng dòng nhạc chữa lành.",
            title_automation: "Hẹn giờ tắt nhạc & Tự động hóa",
            timer_title: "🌙 Hẹn giờ tắt ứng dụng (Sleep Timer)",
            timer_desc: "Tự động dừng phát nhạc mượt mà sau khi bạn chìm vào giấc ngủ."
        },
        en: {
            home: "Home", discover: "Discover", library: "Library", playlists: "Playlists", create_playlist: "Create New Playlist",
            login: "Login", listen_now: "Listen Now", recently_played: "Recently Played", recommendation: "Recommended For You",
            search_results: "Search Results", favorites: "Favorite Songs", no_song: "No song selected", add_fav: "Add to favorites",
            add_to_playlist: "Add to Playlist...", tab_ai: "AI Agent Pro", tab_eq: "EQ Equalizer", tab_automation: "Timer & Auto",
            tab_lang: "Global Language", tab_backup: "Backup & Sync", title_ai: "AI DJ Agent Super Intelligence",
            ai_radar_title: "🧠 AI Mood Radar (Biometric Mood Scan)",
            ai_radar_desc: "Analyzes virtual behavior rhythms and neural audio waves to auto-match music.",
            ai_radar_btn: "Start AI Mood Scan", ai_voice_title: "🎙️ AI Voice Host Companion (Persona)",
            ai_voice_desc: "Choose an AI voice personality to guide and talk between songs.",
            title_eq: "Graphic Equalizer (10-Band Pro)", eq_preset_title: "🎛️ EQ Sound Profiles (Presets)",
            eq_preset_desc: "Optimize acoustic frequencies for deeper body healing effects.",
            title_automation: "Sleep Timer & System Automation",
            timer_title: "🌙 Sleep Timer Countdown", timer_desc: "Automatically pause your music smoothly after you fall asleep."
        },
        ja: {
            home: "ホーム", discover: "発見する", library: "ライブラリ", playlists: "プレイリスト", create_playlist: "新規プレイリスト作成",
            login: "ログイン", listen_now: "今すぐ聴く", recently_played: "最近再生した曲", recommendation: "あなたへのおすすめ",
            search_results: "検索結果", favorites: "お気に入り曲", no_song: "再生中の曲なし", add_fav: "お気に入りに追加",
            add_to_playlist: "プレイリストに追加...", tab_ai: "AIエージェント Pro", tab_eq: "EQ調整", tab_automation: "タイマー設定",
            tab_lang: "多言語設定", tab_backup: "同期・バックアップ", title_ai: "AI DJ インテリジェントコア",
            ai_radar_title: "🧠 AI気分レーダー (生体スキャン)",
            ai_radar_desc: "現在のあなたの精神状態を検知し、最適な周波数の音楽を自動構築します。",
            ai_radar_btn: "AI気分スキャンを開始", ai_voice_title: "🎙️ AIボイスコンパニオン設定",
            ai_voice_desc: "曲間でナレーションを行うAIエージェントの音声キャラクターを選びます。",
            title_eq: "10バンド・グラフィックイコライザー", eq_preset_title: "🎛️ EQ音響プリセット",
            eq_preset_desc: "各周波数帯域を最適化して、瞑想やリラックス効果を最大限に高めます。",
            title_automation: "スリープタイマーと自動化",
            timer_title: "🌙 スリープタイマー", timer_desc: "深く心地よい眠りに入った後、音楽再生を自動停止します。"
        },
        ko: {
            home: "홈", discover: "둘러보기", library: "보관함", playlists: "플레이리스트", create_playlist: "새 플레이리스트 생성",
            login: "로그인", listen_now: "지금 듣기", recently_played: "최근 재생 항목", recommendation: "회원님을 위한 추천",
            search_results: "검색 결과", favorites: "좋아요 표시한 곡", no_song: "재생 중인 곡 없음", add_fav: "즐겨찾기에 추가",
            add_to_playlist: "플레이리스트에 추가...", tab_ai: "AI 에이전트 Pro", tab_eq: "EQ 이퀄라이저", tab_automation: "취침 타이머",
            tab_lang: "글로벌 언어 설정", tab_backup: "백업 및 복구", title_ai: "AI DJ 인공지능 보조 에이전트",
            ai_radar_title: "🧠 AI 위성 기분 레이더 (바이오 스캔)",
            ai_radar_desc: "AI 알고리즘이 행동 패턴을 분석하여 가장 심신이 편안해지는 주파수를 대입합니다.",
            ai_radar_btn: "AI 감정 스캔 시작", ai_voice_title: "🎙️ AI 보이스 컴패니언 (페르소나)",
            ai_voice_desc: "곡 사이사이에 대화 및 명상 가이드를 제공할 AI 목소리를 설정합니다.",
            title_eq: "그래픽 이퀄라이저 (10밴드 고음질)", eq_preset_title: "🎛️ 오디오 음향 모드 (프리셋)",
            eq_preset_desc: "치유와 치유적 명상을 위한 전용 주파수 스펙트럼을 작동시킵니다.",
            title_automation: "취침 예약 타이머 설정",
            timer_title: "🌙 취침 타이머 (Sleep Timer)", timer_desc: "사용자가 깊은 잠에 들면 음악 재생을 자동으로 오프합니다."
        }
    };

    // Hợp nhất bộ tự điển mới vào biến hệ thống cũ một cách an toàn
    if (typeof I18N_LANGUAGES !== 'undefined') {
        Object.keys(V13_I18N_EXTENSIONS).forEach(lang => {
            if (!I18N_LANGUAGES[lang]) I18N_LANGUAGES[lang] = {};
            Object.assign(I18N_LANGUAGES[lang], V13_I18N_EXTENSIONS[lang]);
        });
    }

    // Ghi đè mở rộng hàm changeLanguage cũ để kích hoạt đa ngôn ngữ chạy mượt cho toàn bộ thẻ
    if (window.changeLanguage) {
        const oldChangeLanguage = window.changeLanguage;
        window.changeLanguage = function(lang) {
            oldChangeLanguage(lang);
            if (typeof I18N_LANGUAGES !== 'undefined') {
                const dict = I18N_LANGUAGES[lang] || I18N_LANGUAGES.vi;
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (dict[key]) el.innerText = dict[key];
                });
                const sel = document.getElementById('lang-selector');
                if (sel) sel.value = lang;
            }
        };
        // Cập nhật lại ngôn ngữ hiện tại của app
        if (typeof appState !== 'undefined' && appState.currentLanguage) {
            window.changeLanguage(appState.currentLanguage);
        }
    }

    // 3. THIẾT LẬP HOẠT ĐỘNG PHẦN GRAPHIC EQUALIZER (10-BAND)
    document.querySelectorAll('.v13-eq-range').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const band = e.target.dataset.band;
            const val = e.target.value;
            console.log(`[Equalizer Audio Node] Band ${band} set to ${val}dB`);
            
            // Siêu hiệu ứng: Kéo EQ làm biến đổi vận tốc ánh sáng và độ bão hòa màu của Visualizer nền
            const visualizerCanvas = document.getElementById('player-visualizer');
            if (visualizerCanvas && Math.abs(val) > 1) {
                visualizerCanvas.style.filter = `hue-rotate(${val * 6}deg) saturate(${100 + val * 12}%)`;
            }
        });
    });
}

// 4. CHỨC NĂNG CHỌN EQ PRESETS SẴN CÓ
window.v13ApplyEQPreset = function(preset) {
    const sliders = document.querySelectorAll('.v13-eq-range');
    const presetValues = {
        flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        lofi: [5, 4, 2, 0, -1, -2, -1, 0, 1, -3],
        bass: [9, 8, 6, 4, 1, 0, 0, 0, -1, -2],
        vocal: [-2, -1, 0, 2, 5, 6, 5, 3, 1, 0],
        acoustic: [4, 3, 1, 2, 3, 4, 5, 4, 3, 4]
    };
    
    const values = presetValues[preset] || presetValues.flat;
    sliders.forEach((slider, idx) => {
        slider.value = values[idx];
        slider.dispatchEvent(new Event('input'));
    });
    
    const currentLang = (typeof appState !== 'undefined' && appState.currentLanguage) || 'vi';
    showToast(currentLang === 'vi' ? `Đã cấu hình bộ lọc: ${preset.toUpperCase()}` : `Audio Preset Applied: ${preset.toUpperCase()}`);
};

// 5. CHỨC NĂNG HẸN GIỜ TẮT NHẠC VÀ GIẢM TIẾNG MƯỢT MÀ (SLEEP TIMER CORE)
let v13SleepTimeout = null;
let v13SleepInterval = null;

window.v13UpdateTimerLabel = function(val) {
    const label = document.getElementById('v13-timer-label');
    if (!label) return;
    if (parseInt(val) === 0) {
        label.innerText = (typeof appState !== 'undefined' && appState.currentLanguage === 'vi') ? "Tắt" : "Off";
        clearTimeout(v13SleepTimeout);
        clearInterval(v13SleepInterval);
    } else {
        label.innerText = val + "m";
    }
};

window.v13SetSleepTimer = function(minutes) {
    const slider = document.getElementById('v13-sleep-slider');
    if (slider) {
        slider.value = minutes;
        v13UpdateTimerLabel(minutes);
    }
    
    clearTimeout(v13SleepTimeout);
    clearInterval(v13SleepInterval);
    
    const currentLang = (typeof appState !== 'undefined' && appState.currentLanguage) || 'vi';
    showToast(currentLang === 'vi' ? `Hẹn giờ tắt nhạc sau ${minutes} phút!` : `Sleep timer scheduled for ${minutes} minutes!`);
    
    let secondsLeft = minutes * 60;
    v13SleepInterval = setInterval(() => {
        secondsLeft--;
        // 60 giây cuối cùng kích hoạt giảm âm lượng tuyến tính tránh giật mình khi tắt nhạc
        if (secondsLeft <= 60 && secondsLeft > 0) {
            if (typeof ytPlayer !== 'undefined' && ytPlayer && typeof ytPlayer.getVolume === 'function') {
                let vol = ytPlayer.getVolume();
                if (vol > 1) ytPlayer.setVolume(vol - 1);
            }
        }
        if (secondsLeft <= 0) clearInterval(v13SleepInterval);
    }, 1000);
    
    v13SleepTimeout = setTimeout(() => {
        if (typeof ytPlayer !== 'undefined' && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            ytPlayer.pauseVideo();
            showToast(currentLang === 'vi' ? "Giấc ngủ an toàn! AI đã tắt nhạc." : "Sleep timer ended. Audio paused.");
            v13UpdateTimerLabel(0);
            if(slider) slider.value = 0;
        }
    }, minutes * 60 * 1000);
};

// 6. TÍNH NĂNG AI MOOD RADAR BIOMETRIC SIMULATOR
window.v13TriggerMoodRadar = function() {
    const radar = document.querySelector('.v13-radar-container');
    const statusText = document.getElementById('v13-radar-status');
    if (!radar || !statusText) return;
    
    const currentLang = (typeof appState !== 'undefined' && appState.currentLanguage) || 'vi';
    radar.classList.add('scanning');
    statusText.innerText = currentLang === 'vi' ? "Đang quét sóng não..." : "Scanning brainwaves...";
    
    setTimeout(() => { statusText.innerText = currentLang === 'vi' ? "Phân tích nhịp sinh học..." : "Analyzing cadence..."; }, 1200);
    setTimeout(() => { statusText.innerText = currentLang === 'vi' ? "Đang giải mã cảm xúc..." : "Decoding emotions..."; }, 2400);
    
    setTimeout(() => {
        radar.classList.remove('scanning');
        statusText.innerText = currentLang === 'vi' ? "Hoàn thành" : "Finished";
        showToast(currentLang === 'vi' ? "AI phát hiện căng thẳng! Đã kích hoạt dải sóng tần số Solfeggio 528Hz" : "AI Detected High Fatigue! Solfeggio 528Hz loaded.");
        
        if (window.triggerQuickSearch) {
            window.triggerQuickSearch("Solfeggio 528Hz Healing Sleep");
        }
    }, 3800);
};

// 7. TÍNH NĂNG CHỌN NGƯỜI BẠN ĐỒNG HÀNH AI VOICE PERSONA
window.v13ChangeAIVoice = function(voice) {
    const bubble = document.getElementById('v13-voice-bubble');
    const textNode = document.getElementById('v13-voice-text');
    if (!bubble || !textNode) return;
    
    bubble.classList.remove('hidden');
    const scripts = {
        lily: {
            vi: "Mình là Lily đây. Hôm nay thế giới ngoài kia có làm bạn mệt mỏi không? Ngồi xuống đây nghe bài lofi này nhé...",
            en: "Hey, I'm Lily. Did the world make you feel anxious today? Sit back, take a deep breath, and play this lofi beat..."
        },
        alex: {
            vi: "Chào các bạn. Radio Đêm Muộn Lavendermony trở lại cùng Alex. Hãy để những âm trầm này ôm lấy bạn.",
            en: "Welcome back. Alex here hosting Lavendermony Late Night Radio. Let's melt into these warm basslines."
        },
        sophia: {
            vi: "Chào bạn. Tần số âm thanh 432Hz được chứng minh cải thiện 20% khả năng tập trung. Chúng ta cùng làm việc nhé.",
            en: "Greetings. 432Hz soundscapes are mathematically proven to enhance memory focus by 20%. Let's begin."
        }
    };
    
    const currentLang = (typeof appState !== 'undefined' && appState.currentLanguage) || 'vi';
    textNode.innerText = scripts[voice][currentLang] || scripts[voice]['vi'];
    showToast(currentLang === 'vi' ? "Đã đồng bộ tính cách AI Host!" : "AI Voice Host character loaded!");
};

// 8. AI VISUAL PROMPT SINGER - ĐỒNG BỘ KHÔNG GIAN BẰNG VĂN BẢN MÔ TẢ
window.v13ApplyVisualPrompt = function() {
    const input = document.getElementById('v13-ai-prompt-input');
    if (!input || !input.value.trim()) return;
    
    const prompt = input.value.trim().toLowerCase();
    showToast("AI đang kết xuất phân cảnh ánh sáng...");
    
    setTimeout(() => {
        const docRoot = document.documentElement;
        if (prompt.includes("hồng") || prompt.includes("sunset") || prompt.includes("hoàng hôn") || prompt.includes("đỏ")) {
            docRoot.style.setProperty('--primary-color', '#ff5e62');
            docRoot.style.setProperty('--ambient-glow', 'rgba(255, 94, 98, 0.4)');
        } else if (prompt.includes("biển") || prompt.includes("mưa") || prompt.includes("blue") || prompt.includes("ocean") || prompt.includes("xanh dương")) {
            docRoot.style.setProperty('--primary-color', '#00c6ff');
            docRoot.style.setProperty('--ambient-glow', 'rgba(0, 198, 255, 0.4)');
        } else if (prompt.includes("rừng") || prompt.includes("lá") || prompt.includes("green") || prompt.includes("forest") || prompt.includes("cây")) {
            docRoot.style.setProperty('--primary-color', '#11998e');
            docRoot.style.setProperty('--ambient-glow', 'rgba(17, 153, 142, 0.4)');
        } else if (prompt.includes("vàng") || prompt.includes("gold") || prompt.includes("nắng")) {
            docRoot.style.setProperty('--primary-color', '#f5af19');
            docRoot.style.setProperty('--ambient-glow', 'rgba(245, 175, 25, 0.4)');
        } else {
            docRoot.style.setProperty('--primary-color', '#a87add');
            docRoot.style.setProperty('--ambient-glow', 'rgba(168, 122, 221, 0.35)');
        }
        showToast("Không gian ánh sáng AI đã đồng bộ!");
    }, 1200);
};

// 9. XUẤT VÀ NHẬP THƯ VIỆN ĐỒNG BỘ HÓA DỮ LIỆU BẰNG JSON CẤU HÌNH CÀI ĐẶT
window.v13ExportData = function() {
    if (typeof appState === 'undefined') return;
    const dataStr = JSON.stringify({
        playlists: appState.playlists,
        likedSongs: appState.likedSongs,
        recentlyPlayed: appState.recentlyPlayed
    }, null, 4);
    
    const blob = new Blob([dataStr], {type : "application/json"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'lavendermony_premium_backup.json';
    link.click();
    showToast("Đã tải tệp cấu hình sao lưu về máy!");
};

window.v13ImportData = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function() {
        try {
            const data = JSON.parse(reader.result);
            if (typeof appState !== 'undefined') {
                if (data.playlists) appState.playlists = data.playlists;
                if (data.likedSongs) appState.likedSongs = data.likedSongs;
                if (data.recentlyPlayed) appState.recentlyPlayed = data.recentlyPlayed;
                
                localStorage.setItem('appPlaylists', JSON.stringify(appState.playlists));
                localStorage.setItem('likedSongs', JSON.stringify(appState.likedSongs));
                localStorage.setItem('recentlyPlayed', JSON.stringify(appState.recentlyPlayed));
                
                showToast("Khôi phục thư viện dữ liệu thành công!");
                if (window.renderLibraryAndPlaylists) window.renderLibraryAndPlaylists();
                if (window.renderSidebarPlaylists) window.renderSidebarPlaylists();
            }
        } catch(err) {
            showToast("Tệp sao lưu bị lỗi cấu trúc!");
        }
    };
    reader.readAsText(file);
};

// 10. HỆ THỐNG TRÒ CHUYỆN ĐIỀU KHIỂN APP BẰNG CHATBOT AI DJ AGENT THÔNG MINH
window.v13ToggleChatPanel = function() {
    const panel = document.getElementById('v13-chat-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        const badge = document.querySelector('.v13-chat-badge');
        if (badge) badge.style.display = 'none';
    }
};

window.v13HandleChatKeypress = function(e) {
    if (e.key === 'Enter') v13SendChatMessage();
};

window.v13SendChatMessage = function() {
    const input = document.getElementById('v13-chat-input');
    const container = document.getElementById('v13-chat-messages-container');
    if (!input || !input.value.trim() || !container) return;
    
    const txt = input.value.trim();
    
    const userBubble = document.createElement('div');
    userBubble.className = 'v13-message user';
    userBubble.innerText = txt;
    container.appendChild(userBubble);
    
    input.value = '';
    container.scrollTop = container.scrollHeight;
    
    // Thuật toán NLP nội bộ của AI Agent phân tích ngữ cảnh người dùng nhập để điều khiển hệ thống
    setTimeout(() => {
        const aiBubble = document.createElement('div');
        aiBubble.className = 'v13-message ai';
        
        const key = txt.toLowerCase();
        let reply = "Mình ghi nhận ý kiến của bạn rồi, hãy để mình tìm giai điệu tương thích nhé! ✨";
        
        if (key.includes("lofi") || key.includes("nhạc") || key.includes("bật") || key.includes("hát")) {
            reply = "🎵 Luồng lệnh âm nhạc được kích hoạt! Mình đang tiến hành tìm kiếm bài hát phù hợp nhất với từ khóa của bạn.";
            if (window.triggerQuickSearch) setTimeout(() => window.triggerQuickSearch(txt), 1000);
        } else if (key.includes("mệt") || key.includes("buồn") || key.includes("chán") || key.includes("stress") || key.includes("khóc")) {
            reply = "❤️ Thương gửi cái ôm ấm áp đến bạn. Mình đã tinh chỉnh Equalizer sang cấu hình 'Lofi Soft' dịu nhẹ và đang phát luồng nhạc xoa dịu tâm trạng.";
            if (window.v13ApplyEQPreset) window.v13ApplyEQPreset('lofi');
            if (window.triggerQuickSearch) setTimeout(() => window.triggerQuickSearch("lofi chill healing stress relief"), 1000);
        } else if (key.includes("code") || key.includes("học") || key.includes("tập trung") || key.includes("focus")) {
            reply = "💻 Kích hoạt không gian làm việc tối đa! Mình đang mở cấu hình Âm thanh không gian Spatial Audio 360 độ và khởi chạy Lofi Code.";
            const spatToggle = document.getElementById('toggle-spatial');
            if (spatToggle && !spatToggle.classList.contains('active') && window.toggleSetting) {
                window.toggleSetting('spatialAudio', spatToggle);
            }
            if (window.triggerQuickSearch) setTimeout(() => window.triggerQuickSearch("lofi coding focus study beats"), 1000);
        } else if (key.includes("màu") || key.includes("giao diện") || key.includes("theme") || key.includes("đổi")) {
            reply = "🎨 Cảm xúc thị giác thay đổi! Đang luân chuyển hệ thống màu sắc điểm nhấn để làm mới không gian kính của bạn.";
            const presetColors = ['#ff2d55', '#007aff', '#34c759', '#f5af19', '#a87add'];
            const chosen = presetColors[Math.floor(Math.random() * presetColors.length)];
            document.documentElement.style.setProperty('--primary-color', chosen);
            localStorage.setItem('appColor', chosen);
        } else if (key.includes("hẹn giờ") || key.includes("ngủ") || key.includes("tắt")) {
            reply = "🌙 Đã kích hoạt tự động đếm ngược ngắt nhạc sau 30 phút. Chúc bạn có một giấc ngủ ngon sâu và bình yên nhất.";
            if (window.v13SetSleepTimer) window.v13SetSleepTimer(30);
        }
        
        aiBubble.innerText = reply;
        container.appendChild(aiBubble);
        container.scrollTop = container.scrollHeight;
    }, 1000);
};

// Kiểm tra vòng đời DOM để tiêm máy cơ học V13 chạy mượt mà ngay lập tức
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initV13SuperUpgrade, 400);
} else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(initV13SuperUpgrade, 400));
}

// ============================================================================
//                END OF LAVENDERMONY V13 SUPER ENGINE CORE
// ============================================================================
// =======================================================================
// LAVENDERMONY V14 - ULTRA PREMIUM INTERACTION ENGINE (APPEND ONLY)
// =======================================================================
(function initV14PremiumEngine() {
    console.log("V14 Premium Interaction Engine Initialized.");

    const applyPremiumInteractions = () => {
        // 1. Ánh sáng thực tế (Realistic Glow) đi theo trỏ chuột cho các Card
        const glowCards = document.querySelectorAll('.song-card, .settings-card, .bento-playlist-card');
        glowCards.forEach(card => {
            if (card.classList.contains('mouse-glow-card')) return; // Tránh gắn đè
            card.classList.add('mouse-glow-card');
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });

        // 2. Magnetic Buttons (Nút bấm Nam châm hút mượt mà)
        const magneticBtns = document.querySelectorAll('.play-pause-btn, .logo-orb, .icon-btn, .v4-artist-avatar');
        magneticBtns.forEach(btn => {
            if (btn.hasAttribute('data-magnetic')) return;
            btn.setAttribute('data-magnetic', 'true');
            
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) * 0.45; // Hệ số hút
                const y = (e.clientY - rect.top - rect.height / 2) * 0.45;
                btn.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = `translate(0px, 0px) scale(1)`; // Spring reset
            });
        });

        // 3. Cinematic Player Dynamic Pulse (Hiệu ứng nhịp đập màu nền)
        const playerBg = document.getElementById('player-dynamic-bg');
        if (playerBg && !window.v14PulseActive) {
            window.v14PulseActive = true;
            setInterval(() => {
                if (document.querySelector('.music-player.is-playing')) {
                    // Liên tục thay đổi độ mờ và rực màu ngẫu nhiên để tạo cảm giác "thở"
                    const currentSaturate = 180 + Math.random() * 80;
                    const currentBlur = 45 + Math.random() * 25;
                    playerBg.style.filter = `blur(${currentBlur}px) saturate(${currentSaturate}%)`;
                }
            }, 2500);
        }
    };

    // Chạy Engine sau khi DOM và toàn bộ API đã Render xong thẻ
    if (document.readyState === 'complete') {
        setTimeout(applyPremiumInteractions, 1500);
    } else {
        window.addEventListener('load', () => setTimeout(applyPremiumInteractions, 1500));
    }

    // Theo dõi DOM: Nếu tìm kiếm ra bài hát mới, tự động gắn Ánh sáng & Nam châm vào Card mới
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) shouldUpdate = true;
        });
        if (shouldUpdate) setTimeout(applyPremiumInteractions, 300);
    });
    
    const container = document.querySelector('.main-content');
    if (container) {
        observer.observe(container, { childList: true, subtree: true });
    }
})();
// --- BỔ SUNG: Gợi ý tìm kiếm & tính năng thú vị ---
window.triggerQuickSearch = function(query) {
    document.getElementById('search-input').value = query;
    triggerSearchAPI(query, true);
    document.getElementById('search-suggestions').classList.add('hidden');
    showToast(`Đang tìm kiếm: ${query}...`);
};

// Hiệu ứng tương tác cho thanh tìm kiếm
const searchBar = document.querySelector('.search-bar');
searchBar.addEventListener('mouseenter', () => {
    searchBar.style.transform = 'scale(1.02)';
});
searchBar.addEventListener('mouseleave', () => {
    searchBar.style.transform = 'scale(1)';
});
