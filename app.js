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
        { email: "user@email.com", password: "123", name: "Lavendermony User" }
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
    initSmartSearchPlaceholder(); // Khởi tạo thanh tìm kiếm động
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
    document.getElementById('glass-opacity-slider').addEventListener('input', function() {
        document.documentElement.style.setProperty('--surface', `rgba(255, 255, 255, ${this.value / 100})`);
    });
    const savedVis = localStorage.getItem('visualizerStyle');
    if(savedVis) document.getElementById('visualizer-style-select').value = savedVis;
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

// --- 6. SMART SEARCH SYSTEM (NÂNG CẤP CHỮ CHẠY) ---
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

async function triggerSearchAPI(keyword, forceSwitchView = false) {
    if(forceSwitchView) switchView('discover');
    const grid = document.getElementById('search-results-grid');
    grid.innerHTML = '<p style="color: var(--primary-color);">Đang tìm kiếm thông minh...</p>';
    
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
    } catch(err) { 
        grid.innerHTML = '<p style="color:var(--text-secondary)">Sử dụng API Mockup. Đang hiển thị gợi ý thay thế.</p>';
        DEFAULT_RECOMMENDATIONS.forEach(track => grid.appendChild(createTrackCardHTML(track)));
    }
}

// --- 7. PLAYER CORE (YOUTUBE LAYER) ---
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
    if (event.data === YT.PlayerState.PLAYING) {
        btn.innerHTML = "<i class='bx bx-pause'></i>";
        document.getElementById('album-art').classList.add('playing');
        clearInterval(progressUpdaterInterval);
        progressUpdaterInterval = setInterval(syncProgress, 500);
    } else {
        btn.innerHTML = "<i class='bx bx-play'></i>";
        document.getElementById('album-art').classList.remove('playing');
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
    
    const isLiked = appState.likedSongs.some(s => s.id === id);
    const likeBtn = document.getElementById('like-btn');
    likeBtn.innerHTML = isLiked ? "<i class='bx bxs-heart' style='font-size: 24px; color: #ff2d55;'></i>" : "<i class='bx bx-heart' style='font-size: 24px;'></i>";
    
    document.documentElement.style.setProperty('--ambient-hue', `${Math.random() * 360}deg`);
    
    appState.recentlyPlayed = appState.recentlyPlayed.filter(t => t.id !== id);
    appState.recentlyPlayed.unshift(appState.currentTrack);
    if(appState.recentlyPlayed.length > 8) appState.recentlyPlayed.pop();
    renderRecentlyPlayed();

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

function fetchLyricsMock(title) {
    const box = document.getElementById('lyrics-text'); box.innerHTML = '';
    const mockLyrics = [`Đang phát: ${title}`, "Trải nghiệm Cinematic Lyrics.", "Lời bài hát đồng bộ mượt mà", "Hiệu ứng Karaoke Real-time", "Ambient Blur xóa nhòa ranh giới", "Đắm chìm hoàn toàn vào âm nhạc."];
    mockLyrics.forEach(txt => { const p = document.createElement('p'); p.innerText = txt; box.appendChild(p); });
}

function applyTiltEffect(card) {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const centerX = rect.width / 2; const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12; const rotateY = ((x - centerX) / centerX) * 12;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`; });
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
            <div class="card-play-overlay"><i class='bx bx-play-circle'></i></div>
        </div>
        <h4>${track.title}</h4><p>${track.artist}</p>`;
    applyTiltEffect(card);
    card.addEventListener('click', (e) => { if(!e.target.closest('.quick-action-btn')) playTrack(track.id, track.title, track.artist, track.thumb); });
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