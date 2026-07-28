// ===== APP CONFIGURATION =====
const ALPHA_CONFIG = {
    API_URL: 'https://alpha-1st.onrender.com',
    APP_NAME: 'ALPHA',
    VERSION: '1.0.0'
};

// ===== MAIN APPLICATION =====
const ALPHA = {
    state: {
        user: null,
        wallet: { balance: 0, pending: 0, lifetime: 0, withdrawn: 0 },
        currentPage: 'home',
        notifications: [],
        token: localStorage.getItem('alpha_token') || null,
        level: 1,
        xp: 0,
        followers: 0,
        following: 0,
        products: [],
        videos: [],
        jobs: [],
        courses: [],
        transactions: [],
        chats: [],
        messages: [],
        isInitialized: false
    },

    // ===== INITIALIZATION =====
    init() {
        try {
            console.log('🚀 ALPHA Super App Initializing...');
            
            // Load HTML pages first
            this.loadPages().then(() => {
                this.checkTelegram();
                this.loadState();
                this.setupNavigation();
                this.loadPage('home');
                this.setupEventListeners();
                this.checkBackendHealth();
                this.setupAI();
                this.hideLoader();
                this.state.isInitialized = true;
                console.log('✅ ALPHA Super App Ready!');
            }).catch(error => {
                console.error('❌ Failed to load pages:', error);
                // Still try to initialize with what we have
                this.checkTelegram();
                this.loadState();
                this.setupNavigation();
                this.loadPage('home');
                this.setupEventListeners();
                this.hideLoader();
            });
        } catch (error) {
            console.error('❌ Initialization error:', error);
            // Force hide loader after 3 seconds
            setTimeout(() => {
                this.hideLoader();
            }, 3000);
        }
    },

    // ===== LOAD HTML PAGES =====
    async loadPages() {
        const pages = [
            'home', 'explore', 'create', 'marketplace', 'videos', 
            'freelance', 'courses', 'ai-assistant', 'chat', 'wallet', 
            'profile', 'premium', 'admin'
        ];
        
        const promises = pages.map(page => {
            return fetch(`${page}.html`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${page}.html`);
                    return res.text();
                })
                .then(html => {
                    const pageContainer = document.getElementById(`page-${page}`);
                    if (pageContainer) {
                        pageContainer.innerHTML = html;
                    }
                })
                .catch(error => {
                    console.warn(`⚠️ Could not load ${page}.html, using inline content`);
                    // Create fallback content for each page
                    this.createFallbackPage(page);
                });
        });
        
        return Promise.all(promises);
    },

    // ===== FALLBACK PAGE CONTENT =====
    createFallbackPage(page) {
        const container = document.getElementById(`page-${page}`);
        if (!container) return;
        
        const fallbackContent = {
            'home': `
                <div class="home-container">
                    <div class="welcome-card glass">
                        <div class="welcome-header">
                            <div>
                                <h2>Welcome back, <span id="welcomeUsername">User</span>!</h2>
                                <p>Level <span id="homeLevel">1</span> · <span id="homeXP">0</span> XP</p>
                            </div>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-value" id="homeBalance">$0.00</span>
                                <span class="stat-label">Wallet</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="homeFollowers">0</span>
                                <span class="stat-label">Followers</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="homeEarnings">$0.00</span>
                                <span class="stat-label">Earnings</span>
                            </div>
                        </div>
                    </div>
                    <div class="quick-categories">
                        ${['🎬 Videos', '🛒 Marketplace', '💼 Freelance', '📚 Courses', '🤖 AI', '✨ Create'].map(cat => `
                            <button class="category-card" onclick="ALPHA.loadPage('${cat.split(' ')[1].toLowerCase()}')">
                                <span>${cat.split(' ')[0]}</span>
                                <span>${cat.split(' ')[1]}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="announcement glass">
                        <span>📢</span>
                        <div>
                            <h4>Welcome to ALPHA Super App!</h4>
                            <p>One app. Everything you need.</p>
                        </div>
                        <button onclick="ALPHA.loadPage('explore')">Explore →</button>
                    </div>
                </div>
            `,
            'explore': `
                <div class="explore-container">
                    <div class="search-bar">
                        <input type="text" id="globalSearch" placeholder="Search everything..." class="search-input">
                        <button class="search-btn">🔍</button>
                    </div>
                    <div class="search-results">
                        ${['🎬 Videos', '🛒 Products', '⭐ Creators', '💼 Freelancers', '📚 Courses'].map(item => `
                            <div class="result-item" onclick="ALPHA.loadPage('${item.split(' ')[1].toLowerCase()}')">
                                <span>${item.split(' ')[0]}</span>
                                <div><h4>${item}</h4><p>Browse ${item}</p></div>
                                <span>→</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            'create': `
                <div class="create-container">
                    <div class="create-header"><h2>✨ Create Something</h2><p>Share and earn</p></div>
                    <div class="upload-grid">
                        ${['🎬 Video', '📸 Photo', '🤖 Prompt', '💻 Code', '📚 Course'].map(item => `
                            <button class="upload-btn">
                                <span class="upload-icon">${item.split(' ')[0]}</span>
                                <span>${item.split(' ')[1]}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `,
            'chat': `
                <div class="chat-container">
                    <div class="chat-header"><h3>💬 Messages</h3></div>
                    <div class="chat-list">
                        <div class="chat-item"><div class="chat-avatar">🛡️</div><div class="chat-info"><div class="chat-name">Support</div><div class="chat-last-msg">Welcome to ALPHA!</div></div></div>
                    </div>
                </div>
            `,
            'profile': `
                <div class="profile-container">
                    <div class="profile-header glass">
                        <div class="profile-avatar"><img src="" alt="Profile" id="profileAvatar"></div>
                        <h2 id="profileUsername">User</h2>
                        <p id="profileBio">Super App member</p>
                        <div class="profile-stats">
                            <div class="profile-stat"><span id="profileFollowers">0</span><span>Followers</span></div>
                            <div class="profile-stat"><span id="profileFollowing">0</span><span>Following</span></div>
                            <div class="profile-stat"><span id="profileRatings">0</span><span>Ratings</span></div>
                        </div>
                    </div>
                </div>
            `
        };
        
        if (fallbackContent[page]) {
            container.innerHTML = fallbackContent[page];
        } else {
            container.innerHTML = `
                <div class="glass" style="padding:40px;text-align:center;">
                    <h2>${page.charAt(0).toUpperCase() + page.slice(1)}</h2>
                    <p style="color:var(--text-secondary);">Coming soon...</p>
                </div>
            `;
        }
    },

    // ===== CHECK TELEGRAM =====
    checkTelegram() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                tg.ready();
                tg.expand();
                
                if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                    const user = tg.initDataUnsafe.user;
                    this.state.user = {
                        id: user.id,
                        username: user.username || 'User',
                        firstName: user.first_name || '',
                        lastName: user.last_name || '',
                        avatar: user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name || 'U'}&background=D4AF37&color=0A0A0A&size=128`,
                        language: user.language_code || 'en'
                    };
                    this.updateUI();
                }
            } else {
                // Demo mode
                this.state.user = {
                    id: 'demo_' + Date.now(),
                    username: 'AlphaUser',
                    firstName: 'Alpha',
                    lastName: 'User',
                    avatar: 'https://ui-avatars.com/api/?name=Alpha+User&background=D4AF37&color=0A0A0A&size=128',
                    language: 'en'
                };
                this.updateUI();
            }
        } catch (error) {
            console.warn('Telegram check error:', error);
            this.state.user = {
                id: 'demo_' + Date.now(),
                username: 'DemoUser',
                firstName: 'Demo',
                lastName: 'User',
                avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=D4AF37&color=0A0A0A&size=128',
                language: 'en'
            };
            this.updateUI();
        }
    },

    // ===== LOAD STATE =====
    loadState() {
        try {
            const saved = localStorage.getItem('alpha_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load state');
        }
    },

    // ===== SAVE STATE =====
    saveState() {
        try {
            localStorage.setItem('alpha_state', JSON.stringify(this.state));
        } catch (e) {}
    },

    // ===== UPDATE UI =====
    updateUI() {
        try {
            const user = this.state.user;
            const wallet = this.state.wallet;
            
            // Header
            const usernameEl = document.getElementById('username');
            const levelEl = document.getElementById('userLevel');
            const walletEl = document.getElementById('walletAmount');
            const avatarEl = document.getElementById('avatarImg');
            
            if (usernameEl) usernameEl.textContent = user?.username || 'User';
            if (levelEl) levelEl.textContent = `Level ${this.state.level}`;
            if (walletEl) walletEl.textContent = wallet.balance?.toFixed(2) || '0.00';
            if (avatarEl) avatarEl.src = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=D4AF37&color=0A0A0A&size=128';
            
            // Home
            const welcomeEl = document.getElementById('welcomeUsername');
            const homeLevel = document.getElementById('homeLevel');
            const homeXP = document.getElementById('homeXP');
            const homeBalance = document.getElementById('homeBalance');
            const homeFollowers = document.getElementById('homeFollowers');
            const homeEarnings = document.getElementById('homeEarnings');
            const progressEl = document.getElementById('levelProgress');
            
            if (welcomeEl) welcomeEl.textContent = user?.username || 'User';
            if (homeLevel) homeLevel.textContent = this.state.level;
            if (homeXP) homeXP.textContent = this.state.xp;
            if (homeBalance) homeBalance.textContent = `$${wallet.balance?.toFixed(2) || '0.00'}`;
            if (homeFollowers) homeFollowers.textContent = this.state.followers;
            if (homeEarnings) homeEarnings.textContent = `$${wallet.lifetime?.toFixed(2) || '0.00'}`;
            if (progressEl) progressEl.style.width = `${(this.state.xp % 100)}%`;
            
            // Profile
            const profileName = document.getElementById('profileUsername');
            const profileBio = document.getElementById('profileBio');
            const profileAvatar = document.getElementById('profileAvatar');
            const profileLevel = document.getElementById('profileLevel');
            const profileFollowers = document.getElementById('profileFollowers');
            const profileFollowing = document.getElementById('profileFollowing');
            const profileRatings = document.getElementById('profileRatings');
            
            if (profileName) profileName.textContent = user?.username || 'User';
            if (profileBio) profileBio.textContent = 'Super App member';
            if (profileAvatar) profileAvatar.src = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=D4AF37&color=0A0A0A&size=128';
            if (profileLevel) profileLevel.textContent = `Level ${this.state.level}`;
            if (profileFollowers) profileFollowers.textContent = this.state.followers;
            if (profileFollowing) profileFollowing.textContent = this.state.following;
            if (profileRatings) profileRatings.textContent = '4.8';
            
            // Wallet
            const availBalance = document.getElementById('availableBalance');
            const pendingBalance = document.getElementById('pendingBalance');
            const totalEarned = document.getElementById('totalEarned');
            const totalWithdrawn = document.getElementById('totalWithdrawn');
            
            if (availBalance) availBalance.textContent = `$${wallet.balance?.toFixed(2) || '0.00'}`;
            if (pendingBalance) pendingBalance.textContent = `$${wallet.pending?.toFixed(2) || '0.00'}`;
            if (totalEarned) totalEarned.textContent = `$${wallet.lifetime?.toFixed(2) || '0.00'}`;
            if (totalWithdrawn) totalWithdrawn.textContent = `$${wallet.withdrawn?.toFixed(2) || '0.00'}`;
            
            // Creator analytics
            const cf = document.getElementById('creatorFollowers');
            const cv = document.getElementById('creatorViews');
            const cs = document.getElementById('creatorSales');
            const ce = document.getElementById('creatorEarnings');
            
            if (cf) cf.textContent = this.state.followers;
            if (cv) cv.textContent = '2,345';
            if (cs) cs.textContent = '47';
            if (ce) ce.textContent = `$${wallet.lifetime?.toFixed(2) || '0.00'}`;
            
        } catch (error) {
            console.warn('UI update error:', error);
        }
    },

    // ===== NAVIGATION =====
    setupNavigation() {
        try {
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const page = item.dataset.page;
                    if (page) this.loadPage(page);
                });
            });
        } catch (error) {
            console.warn('Navigation setup error:', error);
        }
    },

    loadPage(page) {
        try {
            // Hide all pages
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            // Show target page
            const target = document.getElementById(`page-${page}`);
            if (target) {
                target.classList.add('active');
                // If page is empty or has default content, render it
                if (!target.innerHTML || target.innerHTML.trim() === '') {
                    this.createFallbackPage(page);
                }
            }
            
            // Update nav
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
            if (activeNav) activeNav.classList.add('active');
            
            this.state.currentPage = page;
            this.updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.warn('Load page error:', error);
        }
    },

    // ===== CHECK BACKEND =====
    async checkBackendHealth() {
        try {
            const response = await fetch(`${ALPHA_CONFIG.API_URL}/health`);
            const data = await response.json();
            console.log('✅ Backend healthy:', data);
        } catch (error) {
            console.warn('⚠️ Backend not reachable, using offline mode');
        }
    },

    // ===== SETUP AI =====
    setupAI() {
        try {
            const sendBtn = document.getElementById('aiSendBtn');
            const input = document.getElementById('aiInput');
            if (sendBtn && input) {
                sendBtn.addEventListener('click', () => this.sendAIMessage());
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.sendAIMessage();
                });
            }
        } catch (error) {}
    },

    sendAIMessage() {
        try {
            const input = document.getElementById('aiInput');
            const messages = document.getElementById('aiMessages');
            if (!input || !messages) return;
            
            const text = input.value.trim();
            if (!text) return;
            
            messages.innerHTML += `
                <div class="ai-message user">
                    <div class="message-bubble">${text}</div>
                </div>
            `;
            input.value = '';
            messages.scrollTop = messages.scrollHeight;
            
            setTimeout(() => {
                const responses = [
                    "That's a great question! Let me help you with that.",
                    "I understand. Here's what I can do for you...",
                    "Interesting! Let me provide some insights.",
                    "I'd be happy to help with that!",
                    "Let me think about that for a moment..."
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                messages.innerHTML += `
                    <div class="ai-message bot">
                        <div class="message-bubble">${response}</div>
                    </div>
                `;
                messages.scrollTop = messages.scrollHeight;
            }, 800);
        } catch (error) {}
    },

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        try {
            // Daily reward
            const claimBtn = document.getElementById('claimDaily');
            if (claimBtn) {
                claimBtn.addEventListener('click', () => {
                    const reward = 0.02;
                    this.state.wallet.balance += reward;
                    this.state.wallet.lifetime += reward;
                    this.state.xp += 5;
                    this.saveState();
                    this.updateUI();
                    this.showToast(`🎁 Daily reward! +$${reward.toFixed(2)}`);
                });
            }
            
            // Wallet badge
            const walletBadge = document.getElementById('walletBadge');
            if (walletBadge) {
                walletBadge.addEventListener('click', () => this.loadPage('wallet'));
            }
            
            // Deposit
            const depositBtn = document.getElementById('depositBtn');
            if (depositBtn) {
                depositBtn.addEventListener('click', () => this.showToast('💳 Deposit coming soon!'));
            }
            
            // Withdraw
            const withdrawBtn = document.getElementById('withdrawBtn');
            if (withdrawBtn) {
                withdrawBtn.addEventListener('click', () => this.showToast('🏦 Withdraw coming soon!'));
            }
            
            // Premium subscribe
            const subscribeBtn = document.getElementById('subscribeBtn');
            if (subscribeBtn) {
                subscribeBtn.addEventListener('click', () => this.showToast('💎 Premium coming soon!'));
            }
            
            // Notification
            const notifBtn = document.getElementById('notifBtn');
            if (notifBtn) {
                notifBtn.addEventListener('click', () => this.showToast('🔔 No new notifications'));
            }
            
            // Search
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    document.querySelectorAll('.result-item').forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(query) ? 'flex' : 'none';
                    });
                });
            }
            
            // Upload buttons
            document.querySelectorAll('.upload-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.showToast(`📤 Upload feature coming soon!`);
                });
            });
            
            // View all buttons
            document.querySelectorAll('.view-all').forEach(btn => {
                btn.addEventListener('click', () => this.showToast('📋 View all coming soon!'));
            });
            
        } catch (error) {
            console.warn('Event listeners error:', error);
        }
    },

    // ===== TOAST =====
    showToast(message) {
        try {
            const existing = document.querySelector('.toast');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: 'calc(var(--nav-height) + 20px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 20px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: '9999',
                maxWidth: '90%',
                textAlign: 'center',
                animation: 'fadeUp 0.3s ease',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            });
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        } catch (error) {}
    },

    // ===== HIDE LOADER =====
    hideLoader() {
        try {
            const loader = document.getElementById('loader');
            const main = document.getElementById('main-content');
            
            if (loader && main) {
                console.log('🎬 Hiding loader...');
                loader.classList.add('hidden');
                main.style.display = 'block';
                
                // Update UI after showing
                setTimeout(() => {
                    this.updateUI();
                    loader.style.display = 'none';
                    console.log('✅ App is ready!');
                }, 300);
            } else {
                console.warn('⚠️ Loader or main content not found');
                // Emergency hide
                const loaderEl = document.getElementById('loader');
                if (loaderEl) {
                    loaderEl.style.display = 'none';
                }
                const mainEl = document.getElementById('main-content');
                if (mainEl) {
                    mainEl.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('❌ Error hiding loader:', error);
            // Force show content
            const mainEl = document.getElementById('main-content');
            if (mainEl) mainEl.style.display = 'block';
            const loaderEl = document.getElementById('loader');
            if (loaderEl) loaderEl.style.display = 'none';
        }
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Loaded, starting ALPHA...');
    window.ALPHA = ALPHA;
    ALPHA.init();
});

// Fallback: If DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('📱 DOM already ready, starting ALPHA...');
    if (!window.ALPHA) {
        window.ALPHA = ALPHA;
        ALPHA.init();
    }
    }
