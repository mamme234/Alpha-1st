// ===== APP CONFIGURATION =====
const ALPHA_CONFIG = {
    API_URL: 'https://alpha-1st.onrender.com', // Your backend URL
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
        console.log('🚀 ALPHA Super App Initializing...');
        this.checkTelegram();
        this.loadState();
        this.loadData();
        this.setupNavigation();
        this.loadPage('home');
        this.setupEventListeners();
        this.setupAI();
        this.hideLoader();
        this.state.isInitialized = true;
        console.log('✅ ALPHA Super App Ready!');
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
            // Fallback to mock data
            return this.getMockData(endpoint);
        }
    },

    // ===== MOCK DATA FALLBACK =====
    getMockData(endpoint) {
        const mockData = {
            '/videos': { success: true, videos: [
                { id: 1, title: 'How to Use ALPHA', creator: { username: 'TeamAlpha', avatar: '🎬' }, views: 1000, likes: 50, comments: [] },
                { id: 2, title: 'AI Tutorial for Beginners', creator: { username: 'AIMaster', avatar: '🤖' }, views: 2000, likes: 100, comments: [] },
                { id: 3, title: 'Design Tips & Tricks', creator: { username: 'DesignPro', avatar: '🎨' }, views: 1500, likes: 75, comments: [] },
                { id: 4, title: 'Coding Bootcamp Highlights', creator: { username: 'CodeMaster', avatar: '💻' }, views: 3000, likes: 200, comments: [] }
            ]},
            '/products': { success: true, products: [
                { id: 1, name: 'AI Prompts Bundle', price: 19.99, seller: { username: 'PromptKing' }, category: 'prompts', icon: '🤖' },
                { id: 2, name: 'UI Kit Pro', price: 49.99, seller: { username: 'DesignPro' }, category: 'ui', icon: '🎨' },
                { id: 3, name: 'Telegram Bot Template', price: 29.99, seller: { username: 'BotDev' }, category: 'bots', icon: '🤖' },
                { id: 4, name: 'React Starter Kit', price: 39.99, seller: { username: 'ReactDev' }, category: 'code', icon: '⚛️' }
            ]},
            '/courses': { success: true, courses: [
                { id: 1, title: 'JavaScript Mastery', author: { username: 'CodeMaster' }, price: 49.99, students: 234, icon: '📚' },
                { id: 2, title: 'UI/UX Design Pro', author: { username: 'DesignPro' }, price: 59.99, students: 189, icon: '🎨' }
            ]},
            '/jobs': { success: true, jobs: [
                { id: 1, title: 'React Developer Needed', budget: 500, client: { username: 'StartupX' }, description: 'Build a web app' },
                { id: 2, title: 'Logo Design for Brand', budget: 200, client: { username: 'BrandY' }, description: 'Modern logo design' }
            ]}
        };
        return mockData[endpoint] || { success: true, data: [] };
    },

    // ===== LOAD DATA =====
    async loadData() {
        try {
            // Load videos
            const videosData = await this.apiRequest('/videos');
            this.state.videos = videosData.videos || [];
            
            // Load products
            const productsData = await this.apiRequest('/products');
            this.state.products = productsData.products || [];
            
            // Load courses
            const coursesData = await this.apiRequest('/courses');
            this.state.courses = coursesData.courses || [];
            
            // Load jobs
            const jobsData = await this.apiRequest('/jobs');
            this.state.jobs = jobsData.jobs || [];
            
            // Load wallet
            const walletData = await this.apiRequest('/wallet');
            if (walletData.success) {
                this.state.wallet = walletData.wallet;
                this.state.transactions = walletData.transactions || [];
            }
            
            this.updateUI();
        } catch (error) {
            console.warn('⚠️ Using mock data');
            this.state.videos = this.getMockData('/videos').videos || [];
            this.state.products = this.getMockData('/products').products || [];
            this.state.courses = this.getMockData('/courses').courses || [];
            this.state.jobs = this.getMockData('/jobs').jobs || [];
            this.updateUI();
        }
    },

    // ===== CHECK TELEGRAM =====
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
                return;
            }
        }
        // Demo user
        this.state.user = {
            id: 'demo_' + Date.now(),
            username: 'AlphaUser',
            firstName: 'Alpha',
            lastName: 'User',
            avatar: 'https://ui-avatars.com/api/?name=Alpha+User&background=D4AF37&color=0A0A0A&size=128',
            language: 'en'
        };
        this.updateUI();
    },

    // ===== LOAD STATE =====
    loadState() {
        try {
            const saved = localStorage.getItem('alpha_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (e) {}
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
            const homeBalance = document.getElementById('homeBalance');
            const homeEarnings = document.getElementById('homeEarnings');
            const progressEl = document.getElementById('levelProgress');
            
            if (welcomeEl) welcomeEl.textContent = user?.username || 'User';
            if (homeBalance) homeBalance.textContent = `$${wallet.balance?.toFixed(2) || '0.00'}`;
            if (homeEarnings) homeEarnings.textContent = `$${wallet.lifetime?.toFixed(2) || '0.00'}`;
            if (progressEl) progressEl.style.width = `${(this.state.xp % 100)}%`;
            
            // Profile
            const profileName = document.getElementById('profileUsername');
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileName) profileName.textContent = user?.username || 'User';
            if (profileAvatar) profileAvatar.src = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=D4AF37&color=0A0A0A&size=128';
            
            // Wallet
            const availBalance = document.getElementById('availableBalance');
            const pendingBalance = document.getElementById('pendingBalance');
            const totalEarned = document.getElementById('totalEarned');
            const totalWithdrawn = document.getElementById('totalWithdrawn');
            
            if (availBalance) availBalance.textContent = `$${wallet.balance?.toFixed(2) || '0.00'}`;
            if (pendingBalance) pendingBalance.textContent = `$${wallet.pending?.toFixed(2) || '0.00'}`;
            if (totalEarned) totalEarned.textContent = `$${wallet.lifetime?.toFixed(2) || '0.00'}`;
            if (totalWithdrawn) totalWithdrawn.textContent = `$${wallet.withdrawn?.toFixed(2) || '0.00'}`;
            
            // Render dynamic content
            this.renderVideos();
            this.renderProducts();
            this.renderCourses();
            this.renderJobs();
            this.renderTransactions();
            this.renderChats();
            this.renderProfileContent();
            
        } catch (error) {
            console.warn('UI update error:', error);
        }
    },

    // ===== RENDER FUNCTIONS =====
    renderVideos() {
        const container = document.getElementById('trendingVideos');
        if (container) {
            container.innerHTML = this.state.videos.map(v => `
                <div class="video-card" onclick="ALPHA.watchVideo('${v._id || v.id}')">
                    <div class="video-thumb">${v.avatar || '🎬'}</div>
                    <div class="video-info">
                        <h4>${v.title}</h4>
                        <p>${v.creator?.username || 'Creator'} · ${v.views || 0} views</p>
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
                        <p>${v.creator?.username || 'Creator'} · ${v.views || 0} views</p>
                    </div>
                    <div class="video-actions">
                        <button onclick="ALPHA.likeVideo('${v._id || v.id}')">❤️ ${v.likes?.length || 0}</button>
                        <button onclick="ALPHA.commentVideo('${v._id || v.id}')">💬 ${v.comments?.length || 0}</button>
                        <button onclick="ALPHA.shareVideo('${v._id || v.id}')">↗️</button>
                        <button onclick="ALPHA.followCreator('${v.creator?._id || v.creator}')">➕ Follow</button>
                    </div>
                </div>
            `).join('');
        }
    },

    renderProducts() {
        const container = document.getElementById('topProducts');
        if (container) {
            container.innerHTML = this.state.products.slice(0, 4).map(p => `
                <div class="product-card-small" onclick="ALPHA.buyProduct('${p._id || p.id}')">
                    <div class="product-icon">${p.icon || '📦'}</div>
                    <h4>${p.name}</h4>
                    <div class="price">$${p.price?.toFixed(2) || '0.00'}</div>
                </div>
            `).join('');
        }
        
        const grid = document.getElementById('marketplaceProducts');
        if (grid) {
            grid.innerHTML = this.state.products.map(p => `
                <div class="product-card">
                    <div class="product-image">${p.icon || '📦'}</div>
                    <div class="product-name">${p.name}</div>
                    <div class="product-seller">by ${p.seller?.username || 'Unknown'}</div>
                    <div class="product-price">$${p.price?.toFixed(2) || '0.00'}</div>
                    <button class="buy-btn" onclick="ALPHA.buyProduct('${p._id || p.id}')">Buy Now</button>
                </div>
            `).join('');
        }
    },

    renderCourses() {
        const container = document.getElementById('coursesGrid');
        if (container) {
            container.innerHTML = this.state.courses.map(c => `
                <div class="course-card" onclick="ALPHA.enrollCourse('${c._id || c.id}')">
                    <div class="course-image">${c.icon || '📚'}</div>
                    <h4>${c.title}</h4>
                    <div class="course-author">by ${c.author?.username || 'Unknown'}</div>
                    <div class="course-price">$${c.price?.toFixed(2) || '0.00'}</div>
                    <button class="enroll-btn">Enroll Now</button>
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
                    <p>${j.description || 'No description'}</p>
                    <div class="job-meta">
                        <span>💰 $${j.budget || 0}</span>
                        <span>👤 ${j.client?.username || 'Unknown'}</span>
                    </div>
                    <button class="apply-btn" onclick="ALPHA.applyJob('${j._id || j.id}')">Apply Now</button>
                </div>
            `).join('');
        }
    },

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (container && this.state.transactions) {
            container.innerHTML = this.state.transactions.map(tx => `
                <div class="transaction-item">
                    <div class="transaction-left">
                        <div class="transaction-icon ${tx.type}">
                            ${tx.type === 'credit' ? '⬆️' : '⬇️'}
                        </div>
                        <div class="transaction-info">
                            <div class="transaction-name">${tx.description || tx.category}</div>
                            <div class="transaction-date">${new Date(tx.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="transaction-amount ${tx.type}">
                        ${tx.type === 'credit' ? '+' : '-'}$${tx.amount?.toFixed(2) || '0.00'}
                    </div>
                </div>
            `).join('');
        }
    },

    renderChats() {
        const container = document.getElementById('chatList');
        if (container && this.state.chats) {
            container.innerHTML = this.state.chats.map(chat => `
                <div class="chat-item" onclick="ALPHA.openChat('${chat._id || chat.id}')">
                    <div class="chat-avatar">
                        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--bg-secondary);">
                            ${chat.avatar || '💬'}
                        </div>
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">${chat.participants?.find(p => p._id !== this.state.user?._id)?.username || 'User'}</div>
                        <div class="chat-last-msg">${chat.lastMessage || 'No messages'}</div>
                    </div>
                    <div class="chat-meta">
                        <div class="chat-time">${new Date(chat.lastMessageAt).toLocaleTimeString()}</div>
                    </div>
                </div>
            `).join('');
        }
    },

    renderProfileContent() {
        const container = document.getElementById('profileContent');
        if (container) {
            const items = [
                { icon: '🎬', title: 'My Videos', count: this.state.videos.length || 0 },
                { icon: '🛒', title: 'My Products', count: this.state.products.length || 0 },
                { icon: '📚', title: 'My Courses', count: this.state.courses.length || 0 },
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
        try {
            const response = await this.apiRequest(`/products/${productId}/buy`, {
                method: 'POST'
            });
            if (response.success) {
                this.showToast('✅ Purchase successful!');
                await this.loadData();
            }
        } catch (error) {
            this.showToast('❌ Purchase failed');
        }
    },

    async enrollCourse(courseId) {
        try {
            const response = await this.apiRequest(`/courses/${courseId}/enroll`, {
                method: 'POST'
            });
            if (response.success) {
                this.showToast('✅ Enrolled successfully!');
                await this.loadData();
            }
        } catch (error) {
            this.showToast('❌ Enrollment failed');
        }
    },

    async applyJob(jobId) {
        try {
            const response = await this.apiRequest(`/jobs/${jobId}/apply`, {
                method: 'POST'
            });
            if (response.success) {
                this.showToast('✅ Application submitted!');
            }
        } catch (error) {
            this.showToast('❌ Application failed');
        }
    },

    async likeVideo(videoId) {
        try {
            const response = await this.apiRequest(`/videos/${videoId}/like`, {
                method: 'POST'
            });
            if (response.success) {
                await this.loadData();
                this.showToast('❤️ Liked!');
            }
        } catch (error) {
            this.showToast('❌ Like failed');
        }
    },

    async commentVideo(videoId) {
        // Show comment modal
        AlphaComponents.modal.open('Add Comment', `
            <div style="display:flex;flex-direction:column;gap:10px;">
                <textarea id="commentText" placeholder="Write your comment..." style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);min-height:80px;"></textarea>
                <button onclick="ALPHA.postComment('${videoId}')" style="padding:12px;background:var(--gold);border:none;border-radius:8px;color:#0A0A0A;font-weight:700;cursor:pointer;">Post Comment</button>
            </div>
        `, []);
    },

    async postComment(videoId) {
        const text = document.getElementById('commentText')?.value;
        if (!text) return;
        
        try {
            const response = await this.apiRequest(`/videos/${videoId}/comment`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            if (response.success) {
                AlphaComponents.modal.close();
                this.showToast('💬 Comment posted!');
                await this.loadData();
            }
        } catch (error) {
            this.showToast('❌ Failed to post comment');
        }
    },

    async shareVideo(videoId) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this video on ALPHA!',
                    text: 'Watch this amazing video on ALPHA Super App',
                    url: window.location.href
                });
                this.showToast('📤 Shared!');
            } catch (e) {
                this.showToast('📋 Link copied!');
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            this.showToast('📋 Link copied!');
        }
    },

    async followCreator(creatorId) {
        this.showToast('✅ Following!');
    },

    async claimDaily() {
        const reward = 0.02;
        this.state.wallet.balance += reward;
        this.state.wallet.lifetime += reward;
        this.state.xp += 5;
        this.saveState();
        this.updateUI();
        this.showToast(`🎁 Daily reward! +$${reward.toFixed(2)}`);
        
        // Save to backend
        try {
            await this.apiRequest('/wallet/deposit', {
                method: 'POST',
                body: JSON.stringify({ amount: reward })
            });
        } catch (e) {}
    },

    async watchVideo(videoId) {
        this.showToast('🎬 Playing video...');
    },

    async openChat(chatId) {
        this.showToast('💬 Opening chat...');
    },

    async openPostJob() {
        AlphaComponents.modal.open('Post a Job', `
            <form id="postJobForm" style="display:flex;flex-direction:column;gap:10px;">
                <input type="text" name="title" placeholder="Job Title" required style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);">
                <textarea name="description" placeholder="Job Description" required style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);min-height:80px;"></textarea>
                <input type="number" name="budget" placeholder="Budget ($)" required style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);">
                <select name="category" style="padding:10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);">
                    <option value="programming">Programming</option>
                    <option value="design">Design</option>
                    <option value="writing">Writing</option>
                    <option value="video">Video</option>
                    <option value="marketing">Marketing</option>
                </select>
                <button type="submit" style="padding:12px;background:var(--gold);border:none;border-radius:8px;color:#0A0A0A;font-weight:700;cursor:pointer;">Post Job</button>
            </form>
        `, []);
        
        document.getElementById('postJobForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const data = {
                title: form.title.value,
                description: form.description.value,
                budget: parseFloat(form.budget.value),
                category: form.category.value
            };
            
            try {
                const response = await this.apiRequest('/jobs', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                if (response.success) {
                    AlphaComponents.modal.close();
                    this.showToast('✅ Job posted!');
                    await this.loadData();
                }
            } catch (error) {
                this.showToast('❌ Failed to post job');
            }
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
        
        try {
            const response = await this.apiRequest('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: text })
            });
            
            messages.innerHTML += `
                <div class="ai-message bot">
                    <div class="message-bubble">${response.reply || 'I\'m thinking...'}</div>
                </div>
            `;
            messages.scrollTop = messages.scrollHeight;
        } catch (error) {
            // Fallback responses
            const responses = [
                "That's a great question! Let me help you with that.",
                "I understand. Here's what I can do for you.",
                "Interesting! Let me provide some insights.",
                "I'd be happy to help with that!",
                "Let me think about that for a moment..."
            ];
            const reply = responses[Math.floor(Math.random() * responses.length)];
            messages.innerHTML += `
                <div class="ai-message bot">
                    <div class="message-bubble">${reply}</div>
                </div>
            `;
            messages.scrollTop = messages.scrollHeight;
        }
    },

    // ===== NAVIGATION =====
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.loadPage(page);
            });
        });
    },

    loadPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
        }
        
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
        
        // Wallet
        document.getElementById('walletBadge')?.addEventListener('click', () => this.loadPage('wallet'));
        document.getElementById('depositBtn')?.addEventListener('click', () => this.showToast('💳 Deposit coming soon!'));
        document.getElementById('withdrawBtn')?.addEventListener('click', () => this.showToast('🏦 Withdraw coming soon!'));
        
        // Premium
        document.getElementById('subscribeBtn')?.addEventListener('click', () => {
            this.showToast('💎 Premium coming soon!');
        });
        
        // Notifications
        document.getElementById('notifBtn')?.addEventListener('click', () => {
            this.showToast('🔔 No new notifications');
        });
        
        // Upload buttons
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showToast('📤 Upload feature coming soon!');
            });
        });
        
        // View all buttons
        document.querySelectorAll('.view-all').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showToast('📋 View all coming soon!');
            });
        });
        
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
                                <div class="product-seller">by ${p.seller?.username || 'Unknown'}</div>
                                <div class="product-price">$${p.price?.toFixed(2) || '0.00'}</div>
                                <button class="buy-btn" onclick="ALPHA.buyProduct('${p._id || p.id}')">Buy Now</button>
                            </div>
                        `).join('');
                    }
                }
            });
        });
        
        // Toggle switches
        document.getElementById('notifToggle')?.addEventListener('change', (e) => {
            this.showToast(e.target.checked ? '🔔 Notifications on' : '🔕 Notifications off');
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
    },

    // ===== TOAST =====
    showToast(message) {
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

    // ===== HIDE LOADER =====
    hideLoader() {
        const loader = document.getElementById('loader');
        const main = document.getElementById('main-content');
        if (loader && main) {
            setTimeout(() => {
                loader.classList.add('hidden');
                main.style.display = 'block';
                setTimeout(() => loader.style.display = 'none', 500);
            }, 300);
        }
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 ALPHA Super App starting...');
    window.ALPHA = ALPHA;
    ALPHA.init();
});
