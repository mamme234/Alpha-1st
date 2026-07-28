// ===== REUSABLE COMPONENTS =====
const AlphaComponents = {
    toast: {
        show(message, type = 'info', duration = 3000) {
            const existing = document.querySelector('.alpha-toast');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'alpha-toast';
            const colors = {
                info: '#3B82F6',
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
                        style="padding:10px 20px;background:${action.color || '#D4AF37'};border:none;border-radius:10px;color:${action.textColor || '#0A0A0A'};font-weight:600;cursor:pointer;font-family:'Urbanist',sans-serif;">
                    ${action.label}
                </button>
            `).join('');
            
            modal.innerHTML = `
                <h3 style="font-size:18px;font-weight:700;margin-bottom:12px;color:var(--text-primary);">${title}</h3>
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
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
        },
        
        close() {
            const existing = document.querySelector('.alpha-modal-overlay');
            if (existing) existing.remove();
        }
    },

    currency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    },

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

    generateId: () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },

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
    }
};

// Add animation keyframes
if (!document.getElementById('alpha-styles')) {
    const style = document.createElement('style');
    style.id = 'alpha-styles';
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

window.AlphaComponents = AlphaComponents;
console.log('✅ AlphaComponents loaded');
