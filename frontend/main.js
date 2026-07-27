// ===== MAIN APPLICATION =====
const ALPHA = {
    // State
    state: {
        user: null,
        wallet: { balance: 0, pending: 0, lifetime: 0 },
        currentPage: 'home',
        notifications: [],
        ads: { remaining: 10, cooldown: 0 },
        level: 1,
        xp: 0,
        referrals: [],
        transactions: [],
        products: [],
        feed: [],
        tasks: [],
        missions: [],
        chats: []
    },

    // ===== INITIALIZATION =====
    init() {
        this.checkTelegram();
        this.loadState();
        this.setupNavigation();
        this.loadPage('home');
        this.startTimers();
        this.setupEventListeners();
        this.hideLoader();
    },

    // ===== TELEGRAM INTEGRATION =====
    checkTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            // Get user data from Telegram
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
        }
        // Set Telegram theme
        if (window.Telegram && window.Telegram.WebApp) {
            document.documentElement.style.setProperty('--bg-primary', 
                window.Telegram.WebApp.backgroundColor || '#0A0A0A');
        }
    },

    // ===== STATE MANAGEMENT =====
    loadState() {
        const saved = localStorage.getItem('alpha_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.warn('Failed to load state');
            }
        }
        // Load mock data if empty
        if (this.state.feed.length === 0) this.loadMockData();
    },

    saveState() {
        try {
            localStorage.setItem('alpha_state', JSON.stringify(this.state));
        } catch (e) {
            console.warn('Failed to save state');
        }
    },

    loadMockData() {
        // Mock feed posts
        this.state.feed = [
            { id: 1, user: 'CryptoKing', avatar: '👑', content: 'Just made $500 with Alpha! 🚀', likes: 42, comments: 12, time: '2h ago', type: 'post' },
            { id: 2, user: 'TechGuru', avatar: '💻', content: 'New AI course available in Marketplace!', likes: 28, comments: 8, time: '4h ago', type: 'product' },
            { id: 3, user: 'DesignMaster', avatar: '🎨', content: 'Check out my new UI templates!', likes: 35, comments: 15, time: '6h ago', type: 'post' }
        ];
        
        // Mock tasks
        this.state.tasks = [
            { id: 1, title: 'Daily Login', reward: 0.02, done: false },
            { id: 2, title: 'Watch 5 Videos', reward: 0.05, done: false },
            { id: 3, title: 'Like 10 Posts', reward: 0.03, done: false },
            { id: 4, title: 'Upload Content', reward: 0.10, done: false }
        ];

        // Mock missions
        this.state.missions = [
            { id: 1, title: 'Watch 100 Videos', reward: 1.00, progress: 0, target: 100 },
            { id: 2, title: 'Refer 10 Friends', reward: 2.00, progress: 0, target: 10 },
            { id: 3, title: 'Upload 50 Items', reward: 3.00, progress: 0, target: 50 }
        ];

        // Mock products
        this.state.products = [
            { id: 1, name: 'React Template Pro', price: 49.99, seller: 'DevMaster', category: 'tech', image: '⚛️' },
            { id: 2, name: 'AI Prompts Bundle', price: 19.99, seller: 'PromptKing', category: 'ai', image: '🤖' },
            { id: 3, name: 'UI Design Course', price: 89.99, seller: 'DesignPro', category: 'design', image: '🎨' },
            { id: 4, name: 'E-book: Crypto Guide', price: 14.99, seller: 'CryptoWriter', category: 'education', image: '📚' }
        ];

        // Mock transactions
        this.state.transactions = [
            { id: 1, type: 'credit', name: 'Ad Reward', amount: 0.05, date: 'Today' },
            { id: 2, type: 'credit', name: 'Referral Bonus', amount: 0.50, date: 'Today' },
            { id: 3, type: 'debit', name: 'Withdrawal', amount: 5.00, date: 'Yesterday' },
            { id: 4, type: 'credit', name: 'Offerwall Reward', amount: 0.25, date: 'Yesterday' }
        ];

        // Mock referrals
        this.state.referrals = [
            { id: 1, username: 'Friend1', earned: 0.50, joined: '2 days ago' },
            { id: 2, username: 'Friend2', earned: 0.30, joined: '5 days ago' }
        ];

        // Mock chats
        this.state.chats = [
            { id: 1, name: 'Admin', avatar: '🛡️', lastMsg: 'Welcome to Alpha!', time: 'Now', unread: 1 },
            { id: 2, name: 'Support', avatar: '💬', lastMsg: 'How can we help?', time: '1h ago', unread: 0 }
        ];

        this.saveState();
    },

    // ===== UI UPDATES =====
    updateUI() {
        const user = this.state.user;
        const wallet = this.state.wallet;
        
        // Header
        document.getElementById('username').textContent = user?.username || 'User';
        document.getElementById('userLevel').textContent = `Level ${this.state.level}`;
        document.getElementById('walletAmount').textContent = wallet.balance.toFixed(2);
        if (document.getElementById('avatarImg')) {
            document.getElementById('avatarImg').src = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=D4AF37&color=0A0A0A&size=128';
        }

        // Home
        document.getElementById('welcomeUsername').textContent = user?.username || 'User';
        document.getElementById('homeLevel').textContent = this.state.level;
        document.getElementById('homeXP').textContent = this.state.xp;
        document.getElementById('homeBalance').textContent = `$${wallet.balance.toFixed(2)}`;
        document.getElementById('homePending').textContent = `$${wallet.pending.toFixed(2)}`;
        document.getElementById('homeLifetime').textContent = `$${wallet.lifetime.toFixed(2)}`;
        document.getElementById('levelProgress').style.width = `${(this.state.xp % 100)}%`;

        // Earn
        document.getElementById('earnToday').textContent = `$${(wallet.balance * 0.1).toFixed(2)}`;
        document.getElementById('earnWeek').textContent = `$${(wallet.balance * 0.4).toFixed(2)}`;
        document.getElementById('earnMonth').textContent = `$${(wallet.balance * 1.2).toFixed(2)}`;
        document.getElementById('adLimit').textContent = `${this.state.ads.remaining}/10`;

        // Profile
        document.getElementById('profileUsername').textContent = user?.username || 'User';
        document.getElementById('profileBio').textContent = 'Alpha Member';
        document.getElementById('profileAvatar').src = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=D4AF37&color=0A0A0A&size=128';
        document.getElementById('profileLevel').textContent = `Level ${this.state.level}`;
        document.getElementById('profileXP').textContent = this.state.xp;
        document.getElementById('profileAchievements').textContent = Math.floor(this.state.level / 2);
        
        // Premium badge
        const premiumBadge = document.getElementById('premiumBadge');
        if (this.state.user?.premium) {
            premiumBadge.style.display = 'inline-block';
        } else {
            premiumBadge.style.display = 'none';
        }

        // Render dynamic content
        this.renderFeed();
        this.renderTasks();
        this.renderMissions();
        this.renderProducts();
        this.renderTransactions();
        this.renderChats();
        this.renderReferrals();

        // Admin (only if user is admin)
        this.renderAdmin();
    },

    // ===== RENDER FUNCTIONS =====
    renderFeed() {
        const container = document.getElementById('feedContainer');
        if (!container) return;
        
        container.innerHTML = this.state.feed.map(item => `
            <div class="feed-item">
                <div class="feed-avatar">
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--bg-secondary);">
                        ${item.avatar || '👤'}
                    </div>
                </div>
                <div class="feed-content">
                    <h4>${item.user}</h4>
                    <p>${item.content}</p>
                    <div class="feed-actions">
                        <button onclick="ALPHA.likePost(${item.id})">❤️ ${item.likes}</button>
                        <button onclick="ALPHA.commentPost(${item.id})">💬 ${item.comments}</button>
                        <button onclick="ALPHA.sharePost(${item.id})">↗️</button>
                        <button onclick="ALPHA.savePost(${item.id})">📌</button>
                    </div>
                </div>
                <span style="font-size:11px;color:var(--text-muted);flex-shrink:0;">${item.time}</span>
            </div>
        `).join('');
    },

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        if (!container) return;
        
        container.innerHTML = this.state.tasks.map(task => `
            <div class="task-item">
                <div class="task-info">
                    <span class="task-title">${task.title}</span>
                    <span class="task-reward">+$${task.reward.toFixed(2)}</span>
                </div>
                <button class="complete-btn ${task.done ? 'done' : ''}" 
                        onclick="ALPHA.completeTask(${task.id})"
                        ${task.done ? 'disabled' : ''}>
                    ${task.done ? '✅ Done' : 'Complete'}
                </button>
            </div>
        `).join('');
    },

    renderMissions() {
        const container = document.getElementById('missionsContainer');
        if (!container) return;
        
        container.innerHTML = this.state.missions.map(mission => {
            const progress = Math.round((mission.progress / mission.target) * 100);
            return `
                <div class="mission-item">
                    <div class="mission-info">
                        <span class="mission-title">${mission.title}</span>
                        <span style="font-size:12px;color:var(--text-secondary);">
                            ${mission.progress}/${mission.target} (${progress}%)
                        </span>
                        <span class="mission-reward">+$${mission.reward.toFixed(2)}</span>
                    </div>
                    <div style="width:100px;">
                        <div class="progress-bar" style="height:4px;">
                            <div class="progress-fill" style="width:${progress}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;
        
        container.innerHTML = this.state.products.map(product => `
            <div class="product-card">
                <div class="product-image">${product.image || '📦'}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-seller">by ${product.seller}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="complete-btn" style="width:100%;margin-top:8px;" onclick="ALPHA.buyProduct(${product.id})">
                    Buy Now
                </button>
            </div>
        `).join('');
    },

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        container.innerHTML = this.state.transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon ${tx.type}">
                        ${tx.type === 'credit' ? '⬆️' : '⬇️'}
                    </div>
                    <div class="transaction-info">
                        <div class="transaction-name">${tx.name}</div>
                        <div class="transaction-date">${tx.date}</div>
                    </div>
                </div>
                <div class="transaction-amount ${tx.type}">
                    ${tx.type === 'credit' ? '+' : '-'}$${tx.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
    },

    renderChats() {
        const container = document.getElementById('chatList');
        if (!container) return;
        
        container.innerHTML = this.state.chats.map(chat => `
            <div class="chat-item" onclick="ALPHA.openChat(${chat.id})">
                <div class="chat-avatar">
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--bg-secondary);">
                        ${chat.avatar || '💬'}
                    </div>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${chat.name}</div>
                    <div class="chat-last-msg">${chat.lastMsg}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${chat.time}</div>
                    ${chat.unread > 0 ? `<div class="chat-unread">${chat.unread}</div>` : ''}
                </div>
            </div>
        `).join('');
    },

    renderReferrals() {
        const container = document.getElementById('referralList');
        if (!container) return;
        
        container.innerHTML = this.state.referrals.map((ref, index) => `
            <div class="transaction-item">
                <div class="transaction-left">
                    <span style="font-weight:700;color:var(--gold);">#${index + 1}</span>
                    <span>${ref.username}</span>
                </div>
                <div>
                    <span style="color:var(--text-secondary);font-size:12px;">+$${ref.earned.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    },

    renderAdmin() {
        // Only render if user is admin
        const isAdmin = this.state.user?.id === 'admin' || this.state.user?.isAdmin;
        const container = document.getElementById('adminDashboard');
        if (!container || !isAdmin) return;
        
        // Update admin stats
        document.getElementById('totalUsers').textContent = '1,247';
        document.getElementById('onlineUsers').textContent = '89';
        document.getElementById('totalRevenue').textContent = '$12,450';
        document.getElementById('withdrawRequests').textContent = '23';
    },

    // ===== ACTIONS =====
    async completeTask(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task || task.done) return;
        
        task.done = true;
        this.state.wallet.balance += task.reward;
        this.state.wallet.lifetime += task.reward;
        this.state.xp += 10;
        this.updateLevel();
        this.saveState();
        this.updateUI();
        this.showToast(`✅ Task completed! +$${task.reward.toFixed(2)}`);
    },

    updateLevel() {
        const newLevel = Math.floor(this.state.xp / 100) + 1;
        if (newLevel > this.state.level) {
            this.state.level = newLevel;
            this.showToast(`🎉 Level Up! You're now Level ${newLevel}!`);
        }
    },

    async watchAd() {
        if (this.state.ads.remaining <= 0) {
            this.showToast('⏰ Daily ad limit reached!');
            return;
        }
        
        const btn = document.getElementById('watchAdBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Watching...';
        
        // Simulate ad watching
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const reward = 0.05;
        this.state.ads.remaining--;
        this.state.wallet.balance += reward;
        this.state.wallet.lifetime += reward;
        this.state.xp += 5;
        this.updateLevel();
        this.saveState();
        this.updateUI();
        
        btn.textContent = '✅ Done!';
        this.showToast(`📺 Ad watched! +$${reward.toFixed(2)}`);
        
        setTimeout(() => {
            btn.textContent = 'Watch Ad';
            btn.disabled = false;
        }, 1000);
    },

    buyProduct(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;
        
        if (this.state.wallet.balance < product.price) {
            this.showToast('❌ Insufficient balance!');
            return;
        }
        
        this.state.wallet.balance -= product.price;
        this.saveState();
        this.updateUI();
        this.showToast(`✅ Purchased ${product.name}!`);
    },

    likePost(postId) {
        const post = this.state.feed.find(p => p.id === postId);
        if (post) {
            post.likes++;
            this.saveState();
            this.renderFeed();
        }
    },

    commentPost(postId) {
        const post = this.state.feed.find(p => p.id === postId);
        if (post) {
            post.comments++;
            this.saveState();
            this.renderFeed();
            this.showToast('💬 Comment feature coming soon!');
        }
    },

    sharePost(postId) {
        this.showToast('↗️ Share feature coming soon!');
    },

    savePost(postId) {
        this.showToast('📌 Saved!');
    },

    openChat(chatId) {
        this.showToast('💬 Chat feature coming soon!');
    },

    // ===== NAVIGATION =====
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });
    },

    loadPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        this.state.currentPage = page;
        
        // Load page content if needed
        if (page === 'home') this.updateUI();
        if (page === 'earn') this.updateUI();
        if (page === 'profile') this.updateUI();
        if (page === 'chat') this.renderChats();
        if (page === 'marketplace') this.renderProducts();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Watch Ad
        const watchBtn = document.getElementById('watchAdBtn');
        if (watchBtn) {
            watchBtn.addEventListener('click', () => this.watchAd());
        }

        // Quick Actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Copy referral link
        const copyBtn = document.getElementById('copyLinkBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const linkInput = document.getElementById('referralLink');
                if (linkInput) {
                    linkInput.select();
                    document.execCommand('copy');
                    this.showToast('📋 Link copied!');
                }
            });
        }

        // Invite friends
        const inviteBtn = document.getElementById('inviteFriendsBtn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.showPopup({
                        title: 'Invite Friends',
                        message: 'Share your referral link with friends and earn rewards!',
                        buttons: [{ type: 'ok' }]
                    });
                } else {
                    this.showToast('👥 Share your referral link!');
                }
            });
        }

        // Wallet actions
        const depositBtn = document.getElementById('depositBtn');
        if (depositBtn) {
            depositBtn.addEventListener('click', () => this.showToast('💳 Deposit feature coming soon!'));
        }
        
        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => this.showToast('🏦 Withdraw feature coming soon!'));
        }

        // Sell button
        const sellBtn = document.getElementById('sellBtn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => this.loadPage('create'));
        }

        // Marketplace search
        const searchInput = document.getElementById('marketplaceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = this.state.products.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    p.seller.toLowerCase().includes(query)
                );
                const container = document.getElementById('productsGrid');
                if (container) {
                    container.innerHTML = filtered.map(product => `
                        <div class="product-card">
                            <div class="product-image">${product.image || '📦'}</div>
                            <div class="product-name">${product.name}</div>
                            <div class="product-seller">by ${product.seller}</div>
                            <div class="product-price">$${product.price.toFixed(2)}</div>
                            <button class="complete-btn" style="width:100%;margin-top:8px;" onclick="ALPHA.buyProduct(${product.id})">
                                Buy Now
                            </button>
                        </div>
                    `).join('');
                }
            });
        }

        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const category = e.currentTarget.dataset.category;
                if (category === 'all') {
                    this.renderProducts();
                } else {
                    const filtered = this.state.products.filter(p => p.category === category);
                    const container = document.getElementById('productsGrid');
                    if (container) {
                        container.innerHTML = filtered.map(product => `
                            <div class="product-card">
                                <div class="product-image">${product.image || '📦'}</div>
                                <div class="product-name">${product.name}</div>
                                <div class="product-seller">by ${product.seller}</div>
                                <div class="product-price">$${product.price.toFixed(2)}</div>
                                <button class="complete-btn" style="width:100%;margin-top:8px;" onclick="ALPHA.buyProduct(${product.id})">
                                    Buy Now
                                </button>
                            </div>
                        `).join('');
                    }
                }
            });
        });

        // Upload buttons
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.showToast(`📤 Upload ${type} feature coming soon!`);
            });
        });

        // Notification toggle
        const notifToggle = document.getElementById('notifToggle');
        if (notifToggle) {
            notifToggle.addEventListener('change', (e) => {
                this.showToast(e.target.checked ? '🔔 Notifications on' : '🔕 Notifications off');
            });
        }

        // Dark mode toggle
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) {
            darkToggle.checked = true;
            darkToggle.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    document.documentElement.style.setProperty('--bg-primary', '#FFFFFF');
                    document.documentElement.style.setProperty('--text-primary', '#0A0A0A');
                    document.documentElement.style.setProperty('--text-secondary', 'rgba(0,0,0,0.7)');
                } else {
                    document.documentElement.style.setProperty('--bg-primary', '#0A0A0A');
                    document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
                    document.documentElement.style.setProperty('--text-secondary', 'rgba(255,255,255,0.7)');
                }
            });
        }

        // Notification button
        const notifBtn = document.getElementById('notifBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                this.showToast('🔔 No new notifications');
            });
        }

        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.showToast(`📊 ${e.currentTarget.textContent} view`);
            });
        });

        // Leaderboard tabs
        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.showToast(`🏆 ${e.currentTarget.textContent}`);
            });
        });

        // Time filters
        document.querySelectorAll('.time-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                document.querySelectorAll('.time-filter').forEach(f => f.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.showToast(`📅 ${e.currentTarget.textContent}`);
            });
        });

        // View all buttons
        document.querySelectorAll('.view-all').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showToast('📋 View all coming soon!');
            });
        });

        // Wallet badge click
        const walletBadge = document.getElementById('walletBadge');
        if (walletBadge) {
            walletBadge.addEventListener('click', () => this.loadPage('wallet'));
        }
    },

    // ===== ACTION HANDLER =====
    handleAction(action) {
        const actions = {
            'ads': () => this.loadPage('earn'),
            'offers': () => this.loadPage('earn'),
            'marketplace': () => this.loadPage('marketplace'),
            'studio': () => this.loadPage('create'),
            'deposit': () => this.loadPage('wallet'),
            'withdraw': () => this.loadPage('wallet'),
            'invite': () => this.loadPage('referrals'),
            'spin': () => this.luckySpin()
        };
        
        if (actions[action]) {
            actions[action]();
        }
    },

    // ===== LUCKY SPIN =====
    luckySpin() {
        const rewards = [0, 0.01, 0.05, 0.10, 0.25, 0.50, 1.00];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        
        if (reward > 0) {
            this.state.wallet.balance += reward;
            this.state.wallet.lifetime += reward;
            this.saveState();
            this.updateUI();
            this.showToast(`🎰 Lucky Spin! You won $${reward.toFixed(2)}!`);
        } else {
            this.showToast('🎰 Better luck next time!');
        }
    },

    // ===== TOAST NOTIFICATIONS =====
    showToast(message) {
        // Remove existing toast
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
    },

    // ===== TIMERS =====
    startTimers() {
        // Cooldown timer for ads
        setInterval(() => {
            if (this.state.ads.remaining < 10) {
                // Refill ads every hour
                if (Math.random() < 0.01) { // 1% chance per second
                    this.state.ads.remaining = Math.min(10, this.state.ads.remaining + 1);
                    this.saveState();
                    this.updateUI();
                }
            }
        }, 1000);

        // Save state periodically
        setInterval(() => {
            this.saveState();
        }, 30000);
    },

    // ===== LOADER =====
    hideLoader() {
        const loader = document.getElementById('loader');
        const main = document.getElementById('main-content');
        if (loader && main) {
            setTimeout(() => {
                loader.classList.add('hidden');
                main.style.display = 'block';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, 500);
        }
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    window.ALPHA = ALPHA;
    ALPHA.init();
});
