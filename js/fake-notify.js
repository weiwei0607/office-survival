/**
 * 假會議通知推播 v2
 * 八卦訊息偽裝成系統備份完成通知
 * 支援：瀏覽器推播、Service Worker、定時發送、歷史記錄
 */

const FakeNotifyModule = {
    templates: [
        { icon: '⚙️', title: '系統備份完成', body: '每日自動備份已成功執行', category: 'system', sound: false },
        { icon: '🔒', title: '防火牆更新通知', body: '安全政策已自動更新至 v2.4.1', category: 'security', sound: false },
        { icon: '💾', title: '硬碟健康度檢查', body: '所有磁碟區狀態良好，無異常', category: 'hardware', sound: false },
        { icon: '📡', title: '網路連線測試', body: '連線速度：Download 892 Mbps', category: 'network', sound: false },
        { icon: '📊', title: '資料庫優化完成', body: '索引重建完成，效能提升 15%', category: 'database', sound: false },
        { icon: '🔄', title: '同步狀態', body: 'OneDrive 已同步 1,247 個檔案', category: 'sync', sound: false },
        { icon: '🔔', title: '行事曆提醒', body: '系統維護窗口：週日凌晨 2:00', category: 'calendar', sound: true },
        { icon: '📧', title: '郵件伺服器', body: 'SSL 憑證將於 30 天後到期', category: 'email', sound: false },
        { icon: '🛡️', title: '防毒軟體更新', body: '病毒碼已更新至最新版本', category: 'security', sound: false },
        { icon: '☁️', title: '雲端儲存空間', body: '您的儲存空間已使用 78%', category: 'storage', sound: false },
        { icon: '🔋', title: '電池健康度', body: '裝置電池目前處於正常狀態', category: 'hardware', sound: false },
        { icon: '📶', title: 'Wi-Fi 連線狀態', body: '已連線至公司無線網路', category: 'network', sound: false }
    ],
    
    schedules: [],
    history: [],
    scheduleInterval: null,
    swRegistration: null,
    
    init() {
        this.loadData();
        this.renderTemplates();
        this.bindEvents();
        this.renderScheduleList();
        this.renderHistory();
        this.requestNotificationPermission();
        this.registerServiceWorker();
        this.startScheduleChecker();
    },
    
    loadData() {
        const schedules = localStorage.getItem('fake_notify_schedules');
        if (schedules) this.schedules = JSON.parse(schedules);
        
        const history = localStorage.getItem('fake_notify_history');
        if (history) this.history = JSON.parse(history);
    },
    
    saveData() {
        localStorage.setItem('fake_notify_schedules', JSON.stringify(this.schedules));
        localStorage.setItem('fake_notify_history', JSON.stringify(this.history.slice(-50)));
    },
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // 建立一個內聯 Service Worker
                const swContent = `
                    self.addEventListener('push', event => {
                        const data = event.data?.json() || {};
                        event.waitUntil(
                            self.registration.showNotification(data.title || '系統通知', {
                                body: data.body || '',
                                icon: data.icon || '',
                                badge: data.badge || '',
                                tag: data.tag || 'fake-notify',
                                requireInteraction: false
                            })
                        );
                    });
                    
                    self.addEventListener('notificationclick', event => {
                        event.notification.close();
                        event.waitUntil(
                            clients.matchAll({ type: 'window' }).then(clientList => {
                                if (clientList.length > 0) {
                                    clientList[0].focus();
                                    clientList[0].postMessage({ type: 'NOTIFICATION_CLICK', realMsg: event.notification.data?.realMsg });
                                }
                            })
                        );
                    });
                `;
                
                const swBlob = new Blob([swContent], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(swBlob);
                this.swRegistration = await navigator.serviceWorker.register(swUrl);
                
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'NOTIFICATION_CLICK') {
                        this.showRealMessage(event.data.realMsg);
                    }
                });
                
            } catch (err) {
                console.log('Service Worker 註冊失敗:', err);
            }
        }
    },
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('通知權限已獲取');
                }
            });
        }
    },
    
    renderTemplates() {
        const container = document.getElementById('notify-templates');
        if (!container) return;
        
        container.innerHTML = this.templates.map((t, i) => `
            <div class="notify-template" data-index="${i}">
                <div class="notify-template-icon">${t.icon}</div>
                <div class="notify-template-info">
                    <div class="notify-template-title">${t.title}</div>
                    <div class="notify-template-desc">${t.body}</div>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('.notify-template').forEach(el => {
            el.addEventListener('click', () => {
                const t = this.templates[parseInt(el.dataset.index)];
                this.showFakeNotification(t.title, t.body, '點擊查看祕密訊息...');
            });
        });
    },
    
    bindEvents() {
        // 自訂發送
        document.getElementById('btn-send-fake')?.addEventListener('click', () => {
            const title = document.getElementById('fake-title').value.trim();
            const body = document.getElementById('fake-body').value.trim();
            const realMsg = document.getElementById('real-msg').value.trim();
            
            if (!title || !body) {
                this.showToast('請填寫偽裝標題和內文', 'warning');
                return;
            }
            
            this.showFakeNotification(title, body, realMsg || '（沒有祕密訊息）');
            this.showToast('假通知已發送！', 'success');
        });
        
        // 快速填入範本
        document.getElementById('fake-title')?.addEventListener('focus', () => {
            // 隨機填入一個範本
            const t = this.templates[Math.floor(Math.random() * this.templates.length)];
            if (!document.getElementById('fake-title').value) {
                document.getElementById('fake-title').value = t.title;
                document.getElementById('fake-body').value = t.body;
            }
        });
        
        // 定時設定
        document.getElementById('btn-schedule-fake')?.addEventListener('click', () => {
            const time = document.getElementById('fake-time').value;
            if (!time) {
                this.showToast('請選擇時間', 'warning');
                return;
            }
            
            const schedule = {
                id: Date.now(),
                time: time,
                title: document.getElementById('fake-title').value.trim() || '系統備份完成',
                body: document.getElementById('fake-body').value.trim() || '每日自動備份已成功執行',
                realMsg: document.getElementById('real-msg').value.trim() || '祕密訊息！',
                active: true,
                createdAt: new Date().toISOString()
            };
            
            this.schedules.push(schedule);
            this.saveData();
            this.renderScheduleList();
            this.showToast(`已設定 ${time} 發送假通知`, 'success');
        });
        
        // 點擊假通知顯示真實內容
        document.getElementById('fake-notification')?.addEventListener('click', () => {
            this.showRealMessage(this.pendingRealMsg);
        });
    },
    
    showFakeNotification(title, body, realMsg) {
        this.pendingRealMsg = realMsg;
        
        // 記錄歷史
        this.history.push({
            title, body, realMsg,
            time: new Date().toISOString()
        });
        this.saveData();
        this.renderHistory();
        
        // 瀏覽器通知（使用 Service Worker 如果可用）
        if (this.swRegistration && 'PushManager' in window) {
            this.swRegistration.showNotification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚙️</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚙️</text></svg>',
                tag: 'fake-notify-' + Date.now(),
                requireInteraction: false,
                data: { realMsg }
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚙️</text></svg>'
            });
        }
        
        // 應用內通知
        const notify = document.getElementById('fake-notification');
        const titleEl = notify.querySelector('.fake-notify-title');
        const bodyEl = notify.querySelector('.fake-notify-body');
        
        titleEl.textContent = title;
        bodyEl.textContent = body;
        
        notify.classList.remove('hidden', 'hiding');
        
        // 通知音效（如果需要）
        const template = this.templates.find(t => t.title === title);
        if (template?.sound) {
            this.playNotificationSound();
        }
        
        setTimeout(() => {
            notify.classList.add('hiding');
            setTimeout(() => {
                notify.classList.add('hidden');
                notify.classList.remove('hiding');
            }, 400);
        }, 5000);
    },
    
    playNotificationSound() {
        // 使用 Web Audio API 產生簡短提示音
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch(e) {}
    },
    
    showRealMessage(msg) {
        const notify = document.getElementById('fake-notification');
        notify.classList.add('hiding');
        
        setTimeout(() => {
            notify.classList.add('hidden');
            notify.classList.remove('hiding');
            
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(15px);
                z-index: 3000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                animation: fadeIn 0.3s ease;
            `;
            
            overlay.innerHTML = `
                <div style="background:var(--bg-card);border-radius:var(--radius);padding:2rem;max-width:340px;width:100%;border:1px solid var(--border);text-align:center">
                    <div style="font-size:3rem;margin-bottom:1rem">🔓</div>
                    <div style="font-size:1.3rem;font-weight:600;margin-bottom:0.5rem">祕密訊息</div>
                    <div style="background:var(--bg);padding:1rem;border-radius:var(--radius-sm);margin:1rem 0;font-size:1rem;line-height:1.6;color:var(--accent);word-break:break-all">
                        ${this.escapeHtml(msg || '沒有祕密訊息')}
                    </div>
                    <button class="btn-primary" style="margin-top:0.5rem" onclick="this.closest('.fixed-overlay').remove()">
                        知道了
                    </button>
                </div>
            `;
            
            overlay.className = 'fixed-overlay';
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            
            document.body.appendChild(overlay);
        }, 400);
    },
    
    renderScheduleList() {
        const container = document.getElementById('schedule-list');
        if (!container) return;
        
        const activeSchedules = this.schedules.filter(s => s.active);
        
        if (activeSchedules.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;padding:1rem">尚未設定定時通知</div>';
            return;
        }
        
        container.innerHTML = activeSchedules.map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:0.4rem">
                <div style="flex:1;min-width:0">
                    <div style="font-size:0.85rem;font-weight:600">${s.time}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title}</div>
                </div>
                <button class="btn-text" onclick="FakeNotifyModule.removeSchedule(${s.id})" style="color:var(--danger);flex-shrink:0">刪除</button>
            </div>
        `).join('');
    },
    
    renderHistory() {
        const container = document.getElementById('notify-history');
        if (!container) return;
        
        if (this.history.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem">尚無發送記錄</div>';
            return;
        }
        
        container.innerHTML = this.history.slice(-10).reverse().map(h => {
            const time = new Date(h.time);
            const timeStr = `${time.getHours().toString().padStart(2,'0')}:${time.getMinutes().toString().padStart(2,'0')}`;
            return `
                <div style="padding:0.5rem;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:0.4rem;font-size:0.8rem">
                    <div style="display:flex;justify-content:space-between">
                        <span style="color:var(--text-muted)">${timeStr}</span>
                        <span style="color:var(--success);font-size:0.7rem">已發送</span>
                    </div>
                    <div style="margin-top:0.2rem">${h.title}</div>
                    <div style="color:var(--accent);font-size:0.75rem;margin-top:0.2rem">🔓 ${h.realMsg.substring(0,20)}${h.realMsg.length > 20 ? '...' : ''}</div>
                </div>
            `;
        }).join('');
    },
    
    removeSchedule(id) {
        this.schedules = this.schedules.filter(s => s.id !== id);
        this.saveData();
        this.renderScheduleList();
    },
    
    startScheduleChecker() {
        if (this.scheduleInterval) clearInterval(this.scheduleInterval);
        
        this.scheduleInterval = setInterval(() => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            
            this.schedules.forEach(s => {
                if (s.active && s.time === currentTime) {
                    const lastTrigger = s.lastTriggered ? new Date(s.lastTriggered) : null;
                    const today = new Date().toDateString();
                    
                    if (!lastTrigger || lastTrigger.toDateString() !== today) {
                        s.lastTriggered = new Date().toISOString();
                        this.saveData();
                        this.showFakeNotification(s.title, s.body, s.realMsg);
                    }
                }
            });
        }, 30000); // 每30秒檢查
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
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.FakeNotifyModule = FakeNotifyModule;
