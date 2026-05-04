/**
 * Office Survival - 核心框架
 * 負責：路由、頁面切換、啟動流程
 */

const App = {
    currentPage: 'shield',
    pages: {},
    
    init() {
        this.showSplash();
        this.bindNavEvents();
        this.bindHeaderEvents();
        
        // 註冊頁面
        this.registerPage('shield', '情緒防護罩', '🛡️');
        this.registerPage('bingo', '職場黑話 Bingo', '🎯');
        this.registerPage('chat', '職場偽裝聊天', '💬');
        this.registerPage('disguise', '一秒變臉 UI', '🎭');
        this.registerPage('notify', '假通知推播', '🔔');
        
        // 載入預設頁面
        setTimeout(() => {
            this.navigate('shield');
        }, 2500);
    },
    
    showSplash() {
        const splash = document.getElementById('splash');
        const app = document.getElementById('app');
        
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.classList.add('hidden');
                app.classList.remove('hidden');
            }, 600);
        }, 2200);
    },
    
    registerPage(id, title, icon) {
        this.pages[id] = { title, icon };
    },
    
    navigate(pageId) {
        if (!this.pages[pageId]) return;
        
        this.currentPage = pageId;
        
        // 更新標題
        document.getElementById('header-icon').textContent = this.pages[pageId].icon;
        document.getElementById('header-text').textContent = this.pages[pageId].title;
        
        // 更新導航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
        
        // 載入頁面內容
        const main = document.getElementById('main-content');
        main.innerHTML = this.getPageHTML(pageId);
        main.className = 'app-main page-enter';
        
        // 觸發頁面初始化
        setTimeout(() => {
            this.initPage(pageId);
        }, 50);
    },
    
    getPageHTML(pageId) {
        const pages = {
            shield: `
                <div class="shield-page">
                    <div class="card">
                        <div class="card-title">🛡️ 情緒防護罩翻譯機</div>
                        <div class="card-desc">把主管的謾罵轉化為純粹的待辦事項</div>
                        <div class="translate-box" style="margin-top:1rem">
                            <textarea id="shield-input" class="input-area" rows="4" 
                                placeholder="貼上主管/同事的情緒化訊息..."></textarea>
                            <button id="btn-translate" class="btn-primary" style="margin-top:0.8rem">
                                🔄 啟動防護罩
                            </button>
                        </div>
                        <div class="quick-inputs">
                            <span class="quick-tag" data-text="這個專案怎麼又delay！你們都在混嗎？">範例1</span>
                            <span class="quick-tag" data-text="這個設計完全不行，重做！">範例2</span>
                            <span class="quick-tag" data-text="你這週都在幹嘛？產出這麼少">範例3</span>
                        </div>
                        <div id="shield-result"></div>
                    </div>
                    <div class="card">
                        <div class="card-title">📊 今日防護統計</div>
                        <div style="display:flex;justify-content:space-around;margin-top:1rem;text-align:center">
                            <div>
                                <div style="font-size:1.8rem;font-weight:700;color:var(--success)" id="shield-count">0</div>
                                <div style="font-size:0.75rem;color:var(--text-muted)">已防護</div>
                            </div>
                            <div>
                                <div style="font-size:1.8rem;font-weight:700;color:var(--accent)" id="shield-fire">0</div>
                                <div style="font-size:0.75rem;color:var(--text-muted)">擋下火力</div>
                            </div>
                            <div>
                                <div style="font-size:1.8rem;font-weight:700;color:var(--secondary)" id="shield-saved">0</div>
                                <div style="font-size:0.75rem;color:var(--text-muted)">拯救心情</div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            bingo: `
                <div class="bingo-page">
                    <div class="card">
                        <div class="card-title">🎯 職場黑話 Bingo</div>
                        <div class="card-desc">會議中抓取廢話關鍵字，連線贏咖啡</div>
                        <div class="bingo-status">
                            <div>
                                <div style="font-size:0.8rem;color:var(--text-muted)">已標記</div>
                                <div class="bingo-counter" id="bingo-count">0/9</div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:0.8rem;color:var(--text-muted)">連線數</div>
                                <div class="bingo-counter" id="bingo-lines" style="color:var(--success)">0</div>
                            </div>
                        </div>
                        <div class="bingo-grid" id="bingo-grid"></div>
                        <button id="btn-new-bingo" class="btn-secondary" style="margin-top:0.5rem">
                            🎲 重新洗牌
                        </button>
                        <div class="bingo-prize locked" id="bingo-prize">
                            <div style="font-size:2rem;margin-bottom:0.3rem">☕</div>
                            <div style="font-weight:600">贏得一杯咖啡！</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem">
                                連成一條線即可解鎖
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">🎤 語音輸入模式</div>
                        <div class="card-desc">開啟麥克風，自動辨識會議中的黑話</div>
                        <button id="btn-voice" class="btn-primary" style="margin-top:0.8rem">
                            🎙️ 開始監聽會議
                        </button>
                        <div id="voice-status" style="text-align:center;margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted)"></div>
                    </div>
                </div>
            `,
            chat: `
                <div class="chat-page">
                    <div class="card" style="padding:0.8rem;margin-bottom:0.5rem">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
                            <div id="chat-friend-title" style="font-weight:600">
                                <span style="font-size:1rem">💬 選擇聊天對象</span>
                            </div>
                            <div id="connection-indicator" style="font-size:0.7rem;color:var(--danger)">🔴 離線</div>
                        </div>
                        <div id="chat-friend-note" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem"></div>
                        
                        <!-- 連線按鈕 -->
                        <div id="login-area" style="margin-bottom:0.8rem">
                            <button class="btn-primary" style="width:100%" onclick="FirebaseClient.init()">
                                🌍 連接全球聊天
                            </button>
                            <div style="font-size:0.7rem;color:var(--text-muted);text-align:center;margin-top:0.3rem">
                                設定 Firebase 後，同學從任何地方都能加入
                            </div>
                        </div>
                        
                        <!-- 私聊/群組切換 -->
                        <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
                            <button id="tab-private" class="chat-mode-btn active" style="flex:1" onclick="ChatModule.switchChatMode('private')">💬 私聊</button>
                            <button id="tab-group" class="chat-mode-btn" style="flex:1" onclick="ChatModule.switchChatMode('group')">👥 群組</button>
                        </div>
                        
                        <div id="friend-list-container"></div>
                        <div id="group-list-container" style="display:none"></div>
                        
                        <!-- 在線用戶（連線後顯示） -->
                        <div id="online-users-section" style="display:none;margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid var(--border)">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem">
                                <span style="font-size:0.75rem;color:var(--text-muted)">在線用戶</span>
                                <button class="btn-text" style="font-size:0.65rem" onclick="SocketClient.fetchOnlineUsers()">🔄 刷新</button>
                            </div>
                            <div id="online-users-list"></div>
                        </div>
                        
                        <!-- Socket好友列表 -->
                        <div id="socket-friends-section" style="display:none;margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid var(--border)">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem">
                                <span style="font-size:0.75rem;color:var(--text-muted)">我的好友</span>
                            </div>
                            <div id="socket-friends-list"></div>
                        </div>
                        
                        <div class="chat-modes" style="margin-top:0.5rem">
                            <button class="chat-mode-btn active" data-mode="normal">一般</button>
                            <button class="chat-mode-btn" data-mode="encrypt">🔐 加密</button>
                            <button class="chat-mode-btn" data-mode="excel">📊 Excel</button>
                            <button class="chat-mode-btn" data-mode="outlook">📧 Outlook</button>
                        </div>
                    </div>
                    <div class="chat-container" id="chat-container">
                        <div class="chat-messages" id="chat-messages"></div>
                        <div class="chat-input-area">
                            <input type="text" id="chat-input" class="chat-input" 
                                placeholder="輸入訊息...">
                            <button id="chat-send" class="chat-send">➤</button>
                        </div>
                    </div>
                </div>
            `,
            disguise: `
                <div class="disguise-page">
                    <div class="card">
                        <div class="card-title">🎭 一秒變臉 UI</div>
                        <div class="card-desc">聊天介面偽裝成 Excel 或 Outlook</div>
                        <div class="disguise-options">
                            <div class="disguise-card active" data-skin="normal">
                                <div class="disguise-icon">💬</div>
                                <div class="disguise-name">一般模式</div>
                                <div class="disguise-desc">正常聊天介面</div>
                            </div>
                            <div class="disguise-card" data-skin="excel">
                                <div class="disguise-icon">📊</div>
                                <div class="disguise-name">Excel 模式</div>
                                <div class="disguise-desc">偽裝成試算表</div>
                            </div>
                            <div class="disguise-card" data-skin="outlook">
                                <div class="disguise-icon">📧</div>
                                <div class="disguise-name">Outlook 模式</div>
                                <div class="disguise-desc">偽裝成郵件</div>
                            </div>
                            <div class="disguise-card" data-skin="cmd">
                                <div class="disguise-icon">💻</div>
                                <div class="disguise-name">Terminal 模式</div>
                                <div class="disguise-desc">偽裝成命令列</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">👁️ 預覽</div>
                        <div class="preview-area" id="disguise-preview"></div>
                    </div>
                    <div class="card">
                        <div class="card-title">⚡ 快速切換</div>
                        <div class="card-desc">搖一搖手機或按音量鍵快速切換偽裝</div>
                        <div style="margin-top:0.8rem;display:flex;gap:0.5rem">
                            <button id="btn-shake-toggle" class="btn-secondary" style="flex:1">
                                搖晃切換: 關閉
                            </button>
                            <button id="btn-volume-toggle" class="btn-secondary" style="flex:1">
                                音量鍵切換: 關閉
                            </button>
                        </div>
                    </div>
                </div>
            `,
            notify: `
                <div class="notify-page">
                    <div class="card">
                        <div class="card-title">🔔 假會議通知推播</div>
                        <div class="card-desc">八卦訊息偽裝成系統備份完成通知</div>
                        <div class="notify-templates" id="notify-templates"></div>
                    </div>
                    <div class="card">
                        <div class="card-title">✏️ 自訂假通知</div>
                        <div class="custom-notify-form">
                            <div class="form-group">
                                <label class="form-label">偽裝標題（別人看到的）</label>
                                <input type="text" id="fake-title" class="input-area" 
                                    placeholder="例如：系統備份完成">
                            </div>
                            <div class="form-group">
                                <label class="form-label">偽裝內文</label>
                                <input type="text" id="fake-body" class="input-area" 
                                    placeholder="例如：每日自動備份已成功執行">
                            </div>
                            <div class="form-group">
                                <label class="form-label">真正的祕密訊息（點開後看到）</label>
                                <input type="text" id="real-msg" class="input-area" 
                                    placeholder="例如：老王跟小美在一起了！">
                            </div>
                            <button id="btn-send-fake" class="btn-primary">
                                🚀 發射假通知
                            </button>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">⏰ 定時假通知</div>
                        <div class="card-desc">設定時間自動發送假通知掩護</div>
                        <div style="margin-top:0.8rem;display:flex;gap:0.5rem;align-items:center">
                            <input type="time" id="fake-time" class="time-input" style="flex:1">
                            <button id="btn-schedule-fake" class="btn-secondary" style="flex:1">
                                設定定時
                            </button>
                        </div>
                        <div id="schedule-list" style="margin-top:0.8rem"></div>
                    </div>
                </div>
            `,
            settings: `
                <div class="settings-page">
                    <div id="main-content">
                        <!-- LLM 設定會渲染在這裡 -->
                    </div>
                </div>
            `
        };
        return pages[pageId] || '<div class="card">頁面建構中...</div>';
    },
    
    initPage(pageId) {
        switch(pageId) {
            case 'shield':
                if (window.ShieldModule) ShieldModule.init();
                break;
            case 'bingo':
                if (window.BingoModule) BingoModule.init();
                break;
            case 'chat':
                if (window.ChatModule) ChatModule.init();
                break;
            case 'disguise':
                if (window.DisguiseModule) DisguiseModule.init();
                break;
            case 'notify':
                if (window.FakeNotifyModule) FakeNotifyModule.init();
                break;
            case 'settings':
                if (window.LLM) LLM.renderSettings('main-content');
                break;
        }
    },
    
    bindNavEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigate(item.dataset.page);
            });
        });
    },
    
    bindHeaderEvents() {
        document.getElementById('btn-boundary-toggle').addEventListener('click', () => {
            if (window.BoundaryModule) BoundaryModule.showSettings();
        });
    }
};

// 啟動
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
