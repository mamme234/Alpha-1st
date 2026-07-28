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
        messages: []
    },

    // ===== INITIALIZATION =====
    init() {
        this.checkTelegram();
        this.loadState();
        this.setupNavigation();
        this.loadPage('home');
        this.setupEventListeners();
        this.hideLoader();
        this.checkBackendHealth();
        this.setupAI();
    },

    // ===== API HELPER =====
    async apiRequest(endpoint, options = {}) {
        const url = `${ALPHA_CONFIG.API_URL}/api${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.state.token ? `Bearer ${this.state.token}` : ''
            }
        };
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'API request failed');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
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
            this.loadMockData();
        }
    },

    // ===== TELEGRAM INTEGRATION =====
    checkTelegram() {
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
                this.authenticateWithTelegram(tg.initData);
            }
        } else {
            this.state.user = {
                id: 'demo_' + Date.now(),
                username: 'AlphaUser',
                firstName: 'Alpha',
                lastName: 'User',
                avatar: 'https://ui-avatars.com/api/?name=Alpha+User&background=D4AF37&color=0A0A0A&size=128',
                language: 'en'
            };
            this.updateUI();
            this.loadMockData();
        }
    },

    // ===== TELEGRAM AUTH =====
    async authenticateWithTelegram(initData) {
        try {
            const response = await fetch(`${ALPHA_CONFIG.API_URL}/api/auth/telegram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData })
            });
            const data = await response.json();
            if (data.token) {
                this.state.token = data.token;
                localStorage.setItem('alpha_token', data.token);
                this.state.user = data.user;
                this.updateUI();
            }
        } catch (error) {
            console.warn('Auth failed, using offline mode');
        }
    },

    // ===== STATE MANAGEMENT =====
    loadState() {
        const saved = localStorage.getItem('alpha_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {}
        }
    },

    saveState() {
        try {
            localStorage.setItem('alpha_state', JSON.stringify(this.state));
        } catch (e) {}
    },

    loadMockData() {
        this.state.videos = [
            { id: 1, title: 'Amazing AI Tool Demo', creator: 'TechGuru', views: 1234, likes: 89, avatar: '🤖' },
            { id: 2, title: 'Design Tips & Tricks', creator: 'DesignPro', views: 856, likes: 67, avatar: '🎨' },
            { id: 3, title: 'Coding Bootcamp Highlights', creator: 'CodeMaster', views: 2100, likes: 156, avatar: '💻' },
            { id: 4, title: 'Marketing Strategy 2026', creator: 'MarketKing', views: 543, likes: 45, avatar: '📊' }
        ];
        
        this.state.products = [
            { id: 1, name: 'AI Prompts Bundle', price: 19.99, seller: 'PromptKing', category: 'prompts', icon: '🤖' },
            { id: 2, name: 'UI Kit Pro', price: 49.99, seller: 'DesignPro', category: 'ui', icon: '🎨' },
            { id: 3, name: 'Telegram Bot Template', price: 29.99, seller: 'BotDev', category: 'bots', icon: '🤖' },
            { id: 4, name: 'React Starter Kit', price: 39.99, seller: 'ReactDev', category: 'code', icon: '⚛️' }
        ];
        
        this.state.jobs = [
            { id: 1, title: 'React Developer Needed', budget: 500, client: 'StartupX', description: 'Build a web app' },
            { id: 2, title: 'Logo Design for Brand', budget: 200, client: 'BrandY', description: 'Modern logo design' },
            { id: 3, title: 'Content Writer', budget: 300, client: 'ContentCo', description: 'Write blog posts' }
        ];
        
        this.state.courses = [
            { id: 1, title: 'JavaScript Mastery', author: 'CodeMaster', price: 49.99, students: 234, icon: '📚' },
            { id: 2, title: 'UI/UX Design Pro', author: 'DesignPro', price: 59.99, students: 189, icon: '🎨' },
            { id: 3, title: 'Digital Marketing 101', author: 'MarketKing', price: 39.99, students: 312, icon: '📊' }
        ];
        
        this.state.transactions = [
            { id: 1, type: 'credit', name: 'Product Sale', amount: 29.99, date: 'Today' },
            { id: 2, type: 'credit', name: 'Course Sale', amount: 49.99, date: 'Yesterday' },
            { id: 3, type: 'debit', name: 'Withdrawal', amount: 50.00, date: '2 days ago' }
        ];
        
        this.state.chats = [
            { id: 1, name: 'Support', avatar: '🛡️', lastMsg: 'How can we help?', time: 'Now', unread: 1 },
            { id: 2, name: 'TechGuru', avatar: '🤖', lastMsg: 'Great video!', time: '1h ago', unread: 0 }
        ];
        
        this.saveState();
        this.updateUI();
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
        document.getElementById('homeFollowers').textContent = this.state.followers;
        document.getElementById('homeEarnings').textContent = `$${wallet.lifetime.toFixed(2)}`;
        document.getElementById('levelProgress').style.width = `${(this.state.xp % 100)}%`;
        
        // Profile
        document.getElementById('profileUsername').textContent = user?.username || 'User';
        document.getElementById('profileBio').textContent = 'Super App member';
        document.getElementById('profileAvatar').src = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=D4AF37&color=0A0A0A&size=128';
        document.getElementById('profileLevel').textContent = `Level ${this.state.level}`;
        document.getElementById('profileFollowers').textContent = this.state.followers;
        document.getElementById('profileFollowing').textContent = this.state.following;
        document.getElementById('profileRatings').textContent = '4.8';
        
        // Wallet
        document.getElementById('availableBalance').textContent = `$${wallet.balance.toFixed(2)}`;
        document.getElementById('pendingBalance').textContent = `$${wallet.pending.toFixed(2)}`;
        document.getElementById('totalEarned').textContent = `$${wallet.lifetime.toFixed(2)}`;
        document.getElementById('totalWithdrawn').textContent = `$${wallet.withdrawn.toFixed(2)}`;
        
        // Creator analytics
        document.getElementById('creatorFollowers').textContent = this.state.followers;
        document.getElementById('creatorViews').textContent = '2,345';
        document.getElementById('creatorSales').textContent = '47';
        document.getElementById('creatorEarnings').textContent = `$${wallet.lifetime.toFixed(2)}`;
        
        // Render dynamic content
        this.renderVideos();
        this.renderProducts();
        this.renderJobs();
        this.renderCourses();
        this.renderTransactions();
        this.renderChats();
        this.renderProfileContent();
    },

    // ===== RENDER FUNCTIONS =====
    renderVideos() {
        const container = document.getElementById('trendingVideos');
        if (container) {
            container.innerHTML = this.state.videos.map(v => `
                <div class="video-card">
                    <div class="video-thumb">${v.avatar || '🎬'}</div>
                    <div class="video-info">
                        <h4>${v.title}</h4>
                        <p>${v.creator} · ${v.views} views</p>
                    </div>
                </div>
            `).join('');
        }
        
        const feed = document.getElementById('videoFeed');
        if (feed) {
            feed.innerHTML = this.state.videos.map(v => `
                <div class="video-feed-item">
                    <div class="video-player">${v.avatar || '🎬'}</div>
                    <div class="video-details">
                        <h4>${v.title}</h4>
                        <p>${v.creator} · ${v.views} views</p>
                    </div>
                    <div class="video-actions">
                        <button onclick="ALPHA.likeVideo(${v.id})">❤️ ${v.likes}</button>
                        <button onclick="ALPHA.commentVideo(${v.id})">💬</button>
                        <button onclick="ALPHA.shareVideo(${v.id})">↗️</button>
                        <button onclick="ALPHA.followCreator('${v.creator}')">➕ Follow</button>
                    </div>
                </div>
            `).join('');
        }
    },

    renderProducts() {
        const container = document.getElementById('topProducts');
        if (container) {
            container.innerHTML = this.state.products.slice(0, 4).map(p => `
                <div class="product-card-small">
                    <div class="product-icon">${p.icon || '📦'}</div>
                    <h4>${p.name}</h4>
                    <div class="price">$${p.price.toFixed(2)}</div>
                </div>
            `).join('');
        }
        
        const grid = document.getElementById('marketplaceProducts');
        if (grid) {
            grid.innerHTML = this.state.products.map(p => `
                <div class="product-card">
                    <div class="product-image">${p.icon || '📦'}</div>
                    <div class="product-name">${p.name}</div>
                    <div class="product-seller">by ${p.seller}</div>
                    <div class="product-price">$${p.price.toFixed(2)}</div>
                    <button class="buy-btn" onclick="ALPHA.buyProduct(${p.id})">Buy Now</button>
                </div>
            `).join('');
        }
    },

    renderJobs() {
        const container = document.getElementById('jobsList');
        if (container) {
            container.innerHTML = this.state.jobs.map(j => `
                <div class="job-item">
                    <h4>${j.title}</h4>
                    <p>${j.description}</p>
                    <div class="job-meta">
                        <span>💰 $${j.budget}</span>
                        <span>👤 ${j.client}</span>
                    </div>
                    <button class="apply-btn" onclick="ALPHA.applyJob(${j.id})">Apply Now</button>
                </div>
            `).join('');
        }
    },

    renderCourses() {
        const container = document.getElementById('coursesGrid');
        if (container) {
            container.innerHTML = this.state.courses.map(c => `
                <div class="course-card">
                    <div class="course-image">${c.icon || '📚'}</div>
                    <h4>${c.title}</h4>
                    <div class="course-author">by ${c.author}</div>
                    <div class="course-price">$${c.price.toFixed(2)}</div>
                    <button class="enroll-btn" onclick="ALPHA.enrollCourse(${c.id})">Enroll Now</button>
                </div>
            `).join('');
        }
    },

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (container) {
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
        }
    },

    renderChats() {
        const container = document.getElementById('chatList');
        if (container) {
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
        }
    },

    renderProfileContent() {
        const container = document.getElementById('profileContent');
        if (container) {
            const items = [
                { icon: '🎬', title: 'My Videos', count: 4 },
                { icon: '🛒', title: 'My Products', count: 3 },
                { icon: '📚', title: 'My Courses', count: 2 },
                { icon: '🏆', title: 'Achievements', count: 7 }
            ];
            container.innerHTML = items.map(item => `
                <div class="profile-content-item">
                    <div style="font-size:28px;">${item.icon}</div>
                    <div style="font-weight:600;font-size:13px;margin-top:4px;">${item.title}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">${item.count} items</div>
                </div>
            `).join('');
        }
    },

    // ===== ACTIONS =====
    async buyProduct(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;
        if (this.state.wallet.balance < product.price) {
            AlphaComponents.toast.show('❌ Insufficient balance!', 'error');
            return;
        }
        this.state.wallet.balance -= product.price;
        this.state.wallet.lifetime += product.price;
        this.saveState();
        this.updateUI();
        AlphaComponents.toast.show(`✅ Purchased ${product.name}!`, 'success');
    },

    async enrollCourse(courseId) {
        const course = this.state.courses.find(c => c.id === courseId);
        if (!course) return;
        if (this.state.wallet.balance < course.price) {
            AlphaComponents.toast.show('❌ Insufficient balance!', 'error');
            return;
        }
        this.state.wallet.balance -= course.price;
        this.saveState();
        this.updateUI();
        AlphaComponents.toast.show(`✅ Enrolled in ${course.title}!`, 'success');
    },

    async applyJob(jobId) {
        AlphaComponents.toast.show('✅ Application submitted!', 'success');
    },

    async likeVideo(videoId) {
        const video = this.state.videos.find(v => v.id === videoId);
        if (video) {
            video.likes++;
            this.saveState();
            this.renderVideos();
            AlphaComponents.toast.show('❤️ Liked!', 'success');
        }
    },

    async commentVideo(videoId) {
        AlphaComponents.toast.show('💬 Comment feature coming soon!', 'info');
    },

    async shareVideo(videoId) {
        AlphaComponents.toast.show('↗️ Share feature coming soon!', 'info');
    },

    async followCreator(name) {
        AlphaComponents.toast.show(`✅ Following ${name}!`, 'success');
    },

    async openChat(chatId) {
        AlphaComponents.toast.show('💬 Chat feature coming soon!', 'info');
    },

    async claimDaily() {
        const reward = 0.02;
        this.state.wallet.balance += reward;
        this.state.wallet.lifetime += reward;
        this.state.xp += 5;
        this.saveState();
        this.updateUI();
        AlphaComponents.toast.show(`🎁 Daily reward claimed! +$${reward.toFixed(2)}`, 'success');
    },

    async openPostJob() {
        AlphaComponents.modal.open('Post a Job', `
            <form id="postJobForm" style="display:flex;flex-direction:column;gap:10px;">
                <input type="text" name="title" placeholder="Job Title" required style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);">
                <textarea name="description" placeholder="Job Description" required style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);min-height:80px;"></textarea>
                <input type="number" name="budget" placeholder="Budget ($)" required style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);">
                <button type="submit" style="padding:12px;background:var(--gold);border:none;border-radius:8px;color:#0A0A0A;font-weight:700;cursor:pointer;">Post Job</button>
            </form>
        `, []);
        document.getElementById('postJobForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            AlphaComponents.modal.close();
            AlphaComponents.toast.show('✅ Job posted successfully!', 'success');
        });
    },

    // ===== AI ASSISTANT =====
    setupAI() {
        const sendBtn = document.getElementById('aiSendBtn');
        const input = document.getElementById('aiInput');
        if (sendBtn && input) {
            sendBtn.addEventListener('click', () => this.sendAIMessage());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendAIMessage();
            });
        }

        document.querySelectorAll('.ai-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const prompts = {
                    'generate': 'Write a social media post about AI',
                    'ideas': 'Give me 5 business ideas for 2026',
                    'email': 'Write a professional email to a client',
                    'translate': 'Translate "Hello, how are you?" to Spanish',
                    'summary': 'Summarize the benefits of AI in 3 points',
                    'code': 'Write a function to sort an array in JavaScript',
                    'learn': 'Explain machine learning in simple terms',
                    'chat': 'How can I improve my productivity?'
                };
                if (prompts[action]) {
                    document.getElementById('aiInput').value = prompts[action];
                    this.sendAIMessage();
                }
            });
        });
    },

    async sendAIMessage() {
        const input = document.getElementById('aiInput');
        const messages = document.getElementById('aiMessages');
        if (!input || !messages) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        // Add user message
        messages.innerHTML += `
            <div class="ai-message user">
                <div class="message-bubble">${text}</div>
            </div>
        `;
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const responses = [
            "That's a great question! Let me think about that...",
            "I understand. Here's what I can help you with...",
            "Great point! Here's my take on this...",
            "I'd be happy to help with that!",
            "Interesting! Let me provide some insights..."
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        messages.innerHTML += `
            <div class="ai-message bot">
                <div class="message-bubble">${response}</div>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;
    },

    // ===== NAVIGATION =====
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });
    },

    loadPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) targetPage.classList.add('active');
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeNav) activeNav.classList.add('active');
        
        this.state.currentPage = page;
        this.updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Daily reward
        document.getElementById('claimDaily')?.addEventListener('click', () => this.claimDaily());
        
        // Wallet clicks
        document.getElementById('walletBadge')?.addEventListener('click', () => this.loadPage('wallet'));
        document.getElementById('depositBtn')?.addEventListener('click', () => AlphaComponents.toast.show('💳 Deposit coming soon!', 'info'));
        document.getElementById('withdrawBtn')?.addEventListener('click', () => AlphaComponents.toast.show('🏦 Withdraw coming soon!', 'info'));
        
        // Premium subscribe
        document.getElementById('subscribeBtn')?.addEventListener('click', () => {
            AlphaComponents.toast.show('💎 Premium subscription coming soon!', 'info');
        });
        
        // Notification button
        document.getElementById('notifBtn')?.addEventListener('click', () => {
            AlphaComponents.toast.show('🔔 No new notifications', 'info');
        });
        
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
                    const grid = document.getElementById('marketplaceProducts');
                    if (grid) {
                        grid.innerHTML = filtered.map(p => `
                            <div class="product-card">
                                <div class="product-image">${p.icon || '📦'}</div>
                                <div class="product-name">${p.name}</div>
                                <div class="product-seller">by ${p.seller}</div>
                                <div class="product-price">$${p.price.toFixed(2)}</div>
                                <button class="buy-btn" onclick="ALPHA.buyProduct(${p.id})">Buy Now</button>
                            </div>
                        `).join('');
                    }
                }
            });
        });
        
        // Course categories
        document.querySelectorAll('.course-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.course-cat').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Freelance tabs
        document.querySelectorAll('.freelance-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.freelance-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Profile tabs
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Upload buttons
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                AlphaComponents.toast.show(`📤 Upload ${type} coming soon!`, 'info');
            });
        });
        
        // Toggle switches
        document.getElementById('notifToggle')?.addEventListener('change', (e) => {
            AlphaComponents.toast.show(e.target.checked ? '🔔 Notifications on' : '🔕 Notifications off', 'info');
        });
        
        document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
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
        
        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                AlphaComponents.toast.show(`📊 ${e.currentTarget.textContent} view`, 'info');
            });
        });
        
        // View all buttons
        document.querySelectorAll('.view-all').forEach(btn => {
            btn.addEventListener('click', () => {
                AlphaComponents.toast.show('📋 View all coming soon!', 'info');
            });
        });
    },

    // ===== HIDE LOADER =====
    hideLoader() {
        const loader = document.getElementById('loader');
        const main = document.getElementById('main-content');
        if (loader && main) {
            setTimeout(() => {
                loader.classList.add('hidden');
                main.style.display = 'block';
                setTimeout(() => loader.style.display = 'none', 500);
            }, 500);
        }
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    window.ALPHA = ALPHA;
    ALPHA.init();
});
