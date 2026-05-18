/**
 * 下班結界強制阻斷 v2
 * 下班後工作群組模糊化，要打擾須付費
 * 支援：時間設定、工作App管理、多種解除方式、詳細統計
 */

const BoundaryModule = {
    settings: {
        enabled: false,
        startTime: '18:00',
        endTime: '09:00',
        workDays: [1, 2, 3, 4, 5], // 週一到週五
        cost: 50,
        blurPreview: true,
        vibrateOnBlock: true,
        autoReply: false,
        autoReplyMsg: '我已下班，有事請明天上班時間聯繫 🌙',
        blockApps: ['Slack', 'Teams', 'LINE工作', 'WeChat工作', 'Email']
    },
    
    stats: {
        blocked: 0,
        earned: 0,
        savedHours: 0,
        lastTrigger: null
    },
    
    isOverlayActive: false,
    snoozeUntil: null,
    checkInterval: null,
    
    init() {
        this.loadData();
        this.updateIndicator();
        this.startChecker();
        
        // 頁面載入時檢查
        if (this.shouldBlock()) {
            this.showOverlay();
        }
    },
    
    loadData() {
        const settings = localStorage.getItem('boundary_settings');
        if (settings) this.settings = { ...this.settings, ...JSON.parse(settings) };
        
        const stats = localStorage.getItem('boundary_stats');
        if (stats) this.stats = { ...this.stats, ...JSON.parse(stats) };
        
        const snooze = localStorage.getItem('boundary_snooze');
        if (snooze) this.snoozeUntil = new Date(snooze);
    },
    
    saveData() {
        localStorage.setItem('boundary_settings', JSON.stringify(this.settings));
        localStorage.setItem('boundary_stats', JSON.stringify(this.stats));
    },
    
    updateIndicator() {
        const indicator = document.getElementById('boundary-indicator');
        const btn = document.getElementById('btn-boundary-toggle');
        if (!indicator || !btn) return;
        
        if (this.settings.enabled) {
            indicator.textContent = this.shouldBlock() ? '🔒' : '🔐';
            btn.classList.add('active');
            btn.title = this.shouldBlock() ? '結界啟動中' : '結界待命中';
        } else {
            indicator.textContent = '🔓';
            btn.classList.remove('active');
            btn.title = '下班結界已關閉';
        }
    },
    
    _taipeiParts(d) {
        const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', weekday: 'short', hour: 'numeric', minute: 'numeric', day: 'numeric', hour12: false });
        const p = Object.fromEntries(fmt.formatToParts(d).map(({ type, value }) => [type, value]));
        return {
            day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday),
            hours: Number(p.hour) % 24,
            minutes: Number(p.minute),
            date: Number(p.day),
        };
    },

    shouldBlock() {
        if (!this.settings.enabled) return false;

        const now = new Date();
        const tp = this._taipeiParts(now);

        // 檢查是否在工作日
        const day = tp.day; // 0=週日, 1=週一...
        if (!this.settings.workDays.includes(day)) return false; // 週末不阻斷

        // 檢查是否在暫停期間
        if (this.snoozeUntil && now < this.snoozeUntil) return false;

        // 檢查時間
        const current = tp.hours * 60 + tp.minutes;
        const [startH, startM] = this.settings.startTime.split(':').map(Number);
        const [endH, endM] = this.settings.endTime.split(':').map(Number);
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        
        if (start > end) {
            // 跨午夜，例如 18:00 ~ 09:00
            return current >= start || current <= end;
        } else {
            return current >= start && current <= end;
        }
    },
    
    startChecker() {
        // 每分鐘檢查
        this.checkInterval = setInterval(() => {
            this.updateIndicator();
            
            if (this.shouldBlock() && !this.isOverlayActive) {
                this.showOverlay();
            } else if (!this.shouldBlock() && this.isOverlayActive) {
                // 時間到了自動解除
                this.hideOverlay();
                if (this.settings.vibrateOnBlock && navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
                this.showToast('🌅 上班時間到！結界自動解除', 'success');
            }
        }, 60000);
        
        // 每秒更新時間顯示
        setInterval(() => {
            const timeEl = document.getElementById('boundary-time');
            if (timeEl && this.isOverlayActive) {
                timeEl.textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Taipei' });
            }
        }, 1000);
    },
    
    showOverlay() {
        const overlay = document.getElementById('boundary-overlay');
        const timeEl = document.getElementById('boundary-time');
        if (!overlay) return;
        
        this.isOverlayActive = true;
        
        if (timeEl) {
            timeEl.textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Taipei' });
        }
        
        // 更新阻斷統計
        if (!this.stats.lastTrigger || this._taipeiParts(new Date(this.stats.lastTrigger)).date !== this._taipeiParts(new Date()).date) {
            this.stats.blocked++;
            this.stats.savedHours += 8;
            this.stats.lastTrigger = new Date().toISOString();
            this.saveData();
        }
        
        overlay.classList.remove('hidden');
        
        // 震動提示
        if (this.settings.vibrateOnBlock && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // 播放阻斷音效
        this.playBlockSound();
    },
    
    hideOverlay() {
        const overlay = document.getElementById('boundary-overlay');
        if (overlay) overlay.classList.add('hidden');
        this.isOverlayActive = false;
    },
    
    playBlockSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            gainNode.gain.value = 0.05;
            
            oscillator.start();
            oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch(e) {}
    },
    
    showSettings() {
        // 如果結界已啟用且正在阻斷時間，顯示覆蓋層
        if (this.settings.enabled && this.shouldBlock()) {
            this.showOverlay();
            return;
        }
        
        this.renderSettingsPage();
    },
    
    renderSettingsPage() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="boundary-settings page-enter">
                <div class="card">
                    <div class="card-title">🚧 下班結界設定</div>
                    <div class="card-desc">設定你的工作時間，下班後自動阻斷工作干擾</div>
                    
                    <div class="toggle-row" style="margin-top:1rem">
                        <span>啟用下班結界</span>
                        <div class="toggle-switch ${this.settings.enabled ? 'active' : ''}" id="toggle-boundary"></div>
                    </div>
                    
                    <div style="margin-top:1rem;opacity:${this.settings.enabled ? 1 : 0.5}">
                        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">工作時間</div>
                        <div class="time-range">
                            <input type="time" class="time-input" id="boundary-start" value="${this.settings.startTime}">
                            <span style="color:var(--text-muted)">至</span>
                            <input type="time" class="time-input" id="boundary-end" value="${this.settings.endTime}">
                        </div>
                        
                        <div style="margin-top:0.8rem">
                            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">工作日</div>
                            <div style="display:flex;gap:0.3rem">
                                ${['日','一','二','三','四','五','六'].map((d, i) => `
                                    <button class="day-btn ${this.settings.workDays.includes(i) ? 'active' : ''}" data-day="${i}" 
                                        style="width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:${this.settings.workDays.includes(i) ? 'var(--primary)' : 'var(--bg-card)'};color:${this.settings.workDays.includes(i) ? 'white' : 'var(--text-muted)'};cursor:pointer;font-size:0.8rem">
                                        ${d}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">💰 阻斷付費設定</div>
                    <div class="card-desc">同事要解除結界打擾你，需要支付的代價</div>
                    
                    <div style="margin-top:1rem">
                        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">解除費用</div>
                        <div style="display:flex;gap:0.5rem">
                            ${[0, 50, 100, 500, 1000].map(c => `
                                <button class="btn-secondary cost-btn ${this.settings.cost === c ? 'active' : ''}" data-cost="${c}" style="flex:1;font-size:0.85rem">
                                    ${c === 0 ? '免費' : c + '元'}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="toggle-row" style="margin-top:0.8rem">
                        <span>模糊化訊息預覽</span>
                        <div class="toggle-switch ${this.settings.blurPreview ? 'active' : ''}" id="toggle-blur"></div>
                    </div>
                    
                    <div class="toggle-row">
                        <span>阻斷時震動提醒</span>
                        <div class="toggle-switch ${this.settings.vibrateOnBlock ? 'active' : ''}" id="toggle-vibrate"></div>
                    </div>
                    
                    <div class="toggle-row">
                        <span>自動回覆訊息</span>
                        <div class="toggle-switch ${this.settings.autoReply ? 'active' : ''}" id="toggle-autoreply"></div>
                    </div>
                    
                    ${this.settings.autoReply ? `
                        <div style="margin-top:0.5rem">
                            <input type="text" id="autoreply-msg" class="input-area" value="${this.settings.autoReplyMsg}" placeholder="自動回覆內容...">
                        </div>
                    ` : ''}
                </div>
                
                <div class="card">
                    <div class="card-title">📊 結界統計</div>
                    <div style="display:flex;justify-content:space-around;margin-top:1rem;text-align:center">
                        <div>
                            <div style="font-size:1.8rem;font-weight:700;color:var(--primary)">${this.stats.blocked}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted)">已阻擋</div>
                        </div>
                        <div>
                            <div style="font-size:1.8rem;font-weight:700;color:var(--success)">${this.stats.earned}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted)">賺取金額</div>
                        </div>
                        <div>
                            <div style="font-size:1.8rem;font-weight:700;color:var(--accent)">${this.stats.savedHours}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted)">拯救小時</div>
                        </div>
                    </div>
                    <button class="btn-text" style="margin-top:0.8rem;width:100%;text-align:center" onclick="BoundaryModule.resetStats()">
                        重置統計
                    </button>
                </div>
                
                <button class="btn-primary" style="margin-top:1rem" onclick="BoundaryModule.saveAndBack()">
                    💾 儲存設定
                </button>
            </div>
        `;
        
        this.bindSettingsEvents();
    },
    
    bindSettingsEvents() {
        // 開關
        document.getElementById('toggle-boundary')?.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        document.getElementById('toggle-blur')?.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        document.getElementById('toggle-vibrate')?.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        document.getElementById('toggle-autoreply')?.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        // 工作日選擇
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                const isActive = btn.classList.contains('active');
                btn.style.background = isActive ? 'var(--primary)' : 'var(--bg-card)';
                btn.style.color = isActive ? 'white' : 'var(--text-muted)';
            });
        });
        
        // 費用按鈕
        document.querySelectorAll('.cost-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cost-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = '';
                    b.style.background = '';
                    b.style.color = '';
                });
                btn.classList.add('active');
                btn.style.borderColor = 'var(--primary)';
                btn.style.background = 'rgba(108,92,231,0.2)';
                btn.style.color = 'var(--text)';
            });
        });
        
        // 覆蓋層按鈕
        document.getElementById('btn-close-boundary')?.addEventListener('click', () => {
            this.hideOverlay();
        });
        
        document.getElementById('btn-pay-boundary')?.addEventListener('click', () => {
            this.simulatePayment();
        });
        
        // 小睡按鈕（免費暫時解除）
        const overlay = document.getElementById('boundary-overlay');
        if (overlay && !document.getElementById('btn-snooze')) {
            const snoozeBtn = document.createElement('button');
            snoozeBtn.id = 'btn-snooze';
            snoozeBtn.className = 'btn-text';
            snoozeBtn.style.cssText = 'margin-top:1rem;font-size:0.85rem';
            snoozeBtn.textContent = '⏰ 小睡 15 分鐘（免費）';
            snoozeBtn.addEventListener('click', () => this.snooze(15));
            
            const costDiv = overlay.querySelector('.boundary-cost');
            if (costDiv) costDiv.appendChild(snoozeBtn);
        }
    },
    
    snooze(minutes) {
        this.snoozeUntil = new Date(Date.now() + minutes * 60000);
        localStorage.setItem('boundary_snooze', this.snoozeUntil.toISOString());
        
        this.hideOverlay();
        this.showToast(`⏰ 結界小睡 ${minutes} 分鐘`, 'info');
        
        // 設定自動恢復提醒
        setTimeout(() => {
            if (this.shouldBlock()) {
                this.showToast('⏰ 小睡時間結束，結界重新啟動！', 'warning');
                this.showOverlay();
            }
        }, minutes * 60000);
    },
    
    simulatePayment() {
        const btn = document.getElementById('btn-pay-boundary');
        const originalText = btn.textContent;
        btn.textContent = '💳 處理中...';
        btn.disabled = true;
        
        setTimeout(() => {
            this.stats.earned += this.settings.cost;
            this.saveData();
            
            btn.textContent = '✅ 已支付！結界暫時解除 30 分鐘';
            btn.style.background = 'var(--success)';
            
            // 記錄暫時解除
            this.snooze(30);
            
            setTimeout(() => {
                this.hideOverlay();
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        }, 1500);
    },
    
    saveAndBack() {
        const boundaryToggle = document.getElementById('toggle-boundary');
        const blurToggle = document.getElementById('toggle-blur');
        const vibrateToggle = document.getElementById('toggle-vibrate');
        const autoReplyToggle = document.getElementById('toggle-autoreply');
        const startInput = document.getElementById('boundary-start');
        const endInput = document.getElementById('boundary-end');
        
        // 收集工作日
        const workDays = [];
        document.querySelectorAll('.day-btn.active').forEach(btn => {
            workDays.push(parseInt(btn.dataset.day));
        });
        
        // 收集費用
        const activeCostBtn = document.querySelector('.cost-btn.active');
        const cost = activeCostBtn ? parseInt(activeCostBtn.dataset.cost) : 50;
        
        this.settings = {
            enabled: boundaryToggle?.classList.contains('active') || false,
            startTime: startInput?.value || '18:00',
            endTime: endInput?.value || '09:00',
            workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5],
            cost: cost,
            blurPreview: blurToggle?.classList.contains('active') || false,
            vibrateOnBlock: vibrateToggle?.classList.contains('active') || false,
            autoReply: autoReplyToggle?.classList.contains('active') || false,
            autoReplyMsg: document.getElementById('autoreply-msg')?.value || this.settings.autoReplyMsg
        };
        
        this.saveData();
        this.updateIndicator();
        
        this.showToast('設定已儲存！', 'success');
        
        // 返回首頁
        setTimeout(() => App.navigate('shield'), 500);
    },
    
    resetStats() {
        if (confirm('確定要重置所有統計資料嗎？')) {
            this.stats = { blocked: 0, earned: 0, savedHours: 0, lastTrigger: null };
            this.saveData();
            this.renderSettingsPage();
            this.showToast('統計已重置', 'success');
        }
    },
    
    showToast(message, type = 'info') {
        const colors = {
            success: 'var(--success)',
            warning: 'var(--warning)',
            error: 'var(--danger)',
            info: 'var(--primary)'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 50px;
            font-weight: 600;
            z-index: 2000;
            animation: slideUp 0.3s ease;
            font-size: 0.85rem;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

window.BoundaryModule = BoundaryModule;
