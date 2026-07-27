// ===== REUSABLE COMPONENTS =====
const AlphaComponents = {
    // Toast system
    toast: {
        show(message, type = 'info', duration = 3000) {
            const existing = document.querySelector('.alpha-toast');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'alpha-toast';
            const colors = {
                info: 'var(--blue)',
                success: '#10B981',
                error: '#EF4444',
                warning: '#F59E0B'
            };
            
            toast.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="color:${colors[type] || colors.info}">●</span>
                    <span>${message}</span>
                </div>
            `;
            
            Object.assign(toast.style, {
                position: 'fixed',
                top: '80px',
                right: '16px',
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: '9999',
                maxWidth: '320px',
                animation: 'slideIn 0.3s ease',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            });
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },

    // Modal system
    modal: {
        open(title, content, actions = []) {
            const existing = document.querySelector('.alpha-modal-overlay');
            if (existing) existing.remove();
            
            const overlay = document.createElement('div');
            overlay.className = 'alpha-modal-overlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '9999',
                animation: 'fadeIn 0.3s ease'
            });
            
            const modal = document.createElement('div');
            modal.className = 'alpha-modal';
            Object.assign(modal.style, {
                background: 'var(--bg-secondary)',
                borderRadius: '18px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                maxHeight: '80vh',
                overflow: 'auto'
            });
            
            let actionsHtml = actions.map(action => `
                <button onclick="(${action.onClick.toString()})()" 
                        style="padding:10px 20px;background:${action.color || 'var(--gold)'};border:none;border-radius:10px;color:${action.textColor || '#0A0A0A'};font-weight:600;cursor:pointer;font-family:'Urbanist',sans-serif;">
                    ${action.label}
                </button>
            `).join('');
            
            modal.innerHTML = `
                <h3 style="font-size:18px;font-weight:700;margin-bottom:12px;">${title}</h3>
                <div style="color:var(--text-secondary);margin-bottom:16px;">${content}</div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    ${actionsHtml}
                    <button onclick="this.closest('.alpha-modal-overlay').remove()" 
                            style="padding:10px 20px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;color:var(--text-secondary);font-weight:600;cursor:pointer;font-family:'Urbanist',sans-serif;">
                        Close
                    </button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
        },
        
        close() {
            const existing = document.querySelector('.alpha-modal-overlay');
            if (existing) existing.remove();
        }
    },

    // Loading spinner
    loader: {
        show(message = 'Loading...') {
            const existing = document.querySelector('.alpha-loader');
            if (existing) existing.remove();
            
            const loader = document.createElement('div');
            loader.className = 'alpha-loader';
            Object.assign(loader.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '9999',
                gap: '16px'
            });
            
            loader.innerHTML = `
                <div style="width:40px;height:40px;border:3px solid rgba(212,175,55,0.2);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                <span style="color:var(--text-primary);font-weight:500;">${message}</span>
            `;
            
            document.body.appendChild(loader);
        },
        
        hide() {
            const existing = document.querySelector('.alpha-loader');
            if (existing) existing.remove();
        }
    },

    // Form helpers
    form: {
        validate(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            let valid = true;
            
            inputs.forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    valid = false;
                    input.style.borderColor = '#EF4444';
                    input.setAttribute('placeholder', 'This field is required');
                } else {
                    input.style.borderColor = '';
                }
            });
            
            return valid;
        },
        
        serialize(form) {
            const data = {};
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.name) {
                    data[input.name] = input.value;
                }
            });
            return data;
        }
    },

    // Animations
    animate: {
        fadeIn(element, duration = 300) {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease`;
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
        },
        
        slideUp(element, duration = 300) {
            element.style.transform = 'translateY(20px)';
            element.style.opacity = '0';
            element.style.transition = `all ${duration}ms ease`;
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
            });
        }
    },

    // Currency formatter
    currency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    },

    // Time formatter
    timeAgo: (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    },

    // Generate random ID
    generateId: () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    // Copy to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },

    // Debounce
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Add animation keyframes if not present
if (!document.getElementById('alpha-styles')) {
    const style = document.createElement('style');
    style.id = 'alpha-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Export for use
window.AlphaComponents = AlphaComponents;
