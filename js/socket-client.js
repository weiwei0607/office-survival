/**
 * Socket.io 客戶端
 * 連接後端，實現真實多人聊天
 */

const SocketClient = {
    socket: null,
    connected: false,
    myCodeName: null,
    myId: null,
    roomId: null,
    friends: new Set(),
    onlineUsers: [],
    
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    },

    init() {
        // 檢查是否已登入
        const savedCodeName = localStorage.getItem('my_code_name');
        if (savedCodeName) {
            this.connect(savedCodeName);
        }
    },
    
    connect(codeName, realName) {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // 連接 WebSocket（自動判斷網址）
        const wsUrl = window.location.origin;
        this.socket = io(wsUrl, { transports: ['websocket', 'polling'] });
        
        this.socket.on('connect', () => {
            console.log('✅ 已連接伺服器');
            this.connected = true;
            
            // 發送登入
            this.socket.emit('login', { 
                codeName: codeName,
                realName: realName || codeName
            });
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ 已斷線');
            this.connected = false;
            this.showConnectionStatus('disconnected');
        });
        
        // 登入成功
        this.socket.on('loginSuccess', (data) => {
            this.myCodeName = data.codeName;
            this.myId = data.userId;
            localStorage.setItem('my_code_name', data.codeName);
            localStorage.setItem('my_user_id', data.userId);
            
            this.showConnectionStatus('connected');
            
            // 隱藏登入按鈕，顯示線上區域
            const loginArea = document.getElementById('login-area');
            const onlineSection = document.getElementById('online-users-section');
            const friendsSection = document.getElementById('socket-friends-section');
            
            if (loginArea) loginArea.style.display = 'none';
            if (onlineSection) onlineSection.style.display = 'block';
            if (friendsSection) friendsSection.style.display = 'block';
            
            // 更新標題顯示自己的ID
            const noteEl = document.getElementById('chat-friend-note');
            if (noteEl) {
                noteEl.innerHTML = `我的代號：<b>${this.escapeHtml(data.codeName)}</b> · 公開ID：<b style="color:var(--primary)">${this.escapeHtml(data.publicId)}</b> <button class="btn-text" style="font-size:0.65rem" onclick="navigator.clipboard.writeText('${this.escapeHtml(data.publicId)}')">📋複製</button>`;
            }
            
            this.fetchOnlineUsers();
            this.fetchFriends();
            
            // 顯示登入成功提示
            this.showToast(`🎭 已上線：${data.codeName}`, 'success');
        });
        
        // 接收新訊息（群組）
        this.socket.on('newMessage', (msg) => {
            if (ChatModule.chatMode === 'group' && ChatModule.currentMode !== 'normal') {
                // 如果開啟加密，解密顯示
                msg.displayText = msg.text; // 後端不加密，前端處理
            }
            ChatModule.receiveMessage(msg);
        });
        
        // 接收私聊訊息
        this.socket.on('privateMessage', (msg) => {
            ChatModule.receivePrivateMessage(msg);
        });
        
        // 在線用戶列表
        this.socket.on('onlineUsers', (users) => {
            this.onlineUsers = users;
            this.renderOnlineUsers();
        });
        
        // 好友列表
        this.socket.on('friendList', (friends) => {
            friends.forEach(f => this.friends.add(f.codeName));
            this.renderFriends();
        });
        
        // 添加好友成功
        this.socket.on('friendAdded', (data) => {
            this.friends.add(data.codeName);
            this.showToast(`✅ 已添加 ${data.codeName} 為好友`, 'success');
            this.fetchFriends();
        });
        
        // 成員加入房間
        this.socket.on('memberJoined', (data) => {
            this.showToast(`👤 ${data.codeName} 加入群組`, 'info');
        });
        
        // 成員離開房間
        this.socket.on('memberLeft', (data) => {
            this.showToast(`👋 ${data.codeName} 離開群組`, 'info');
        });
        
        // 錯誤
        this.socket.on('error', (data) => {
            this.showToast(`⚠️ ${data.message}`, 'error');
        });
    },
    
    // 創建房間
    createRoom(name, theme) {
        if (!this.socket || !this.connected) {
            this.showToast('未連接伺服器', 'error');
            return;
        }
        this.socket.emit('createRoom', { name, theme });
    },
    
    // 加入房間
    joinRoom(roomId) {
        if (!this.socket || !this.connected) return;
        this.roomId = roomId;
        this.socket.emit('joinRoom', { roomId });
    },
    
    // 發送群組訊息
    sendGroupMessage(text, displayText, mode) {
        if (!this.socket || !this.connected) {
            this.showToast('未連接伺服器，訊息僅存在本地', 'warning');
            return false;
        }
        this.socket.emit('sendMessage', { text, displayText, mode });
        return true;
    },
    
    // 發送私聊訊息
    sendPrivateMessage(to, text, displayText, mode) {
        if (!this.socket || !this.connected) {
            this.showToast('未連接伺服器，訊息僅存在本地', 'warning');
            return false;
        }
        this.socket.emit('sendPrivateMessage', { to, text, displayText, mode });
        return true;
    },
    
    // 添加好友
    addFriend(friendIdOrCodeName) {
        if (!this.socket || !this.connected) {
            this.showToast('請先連接伺服器', 'error');
            return;
        }
        
        // 判斷是ID還是代號
        if (friendIdOrCodeName.length === 8 && /^[A-Z0-9]+$/.test(friendIdOrCodeName)) {
            this.socket.emit('addFriend', { friendId: friendIdOrCodeName });
        } else {
            this.socket.emit('addFriend', { friendCodeName: friendIdOrCodeName });
        }
    },
    
    // 獲取在線用戶
    fetchOnlineUsers() {
        if (this.socket) this.socket.emit('getOnlineUsers');
    },
    
    // 獲取好友列表
    fetchFriends() {
        if (this.socket) this.socket.emit('getFriends');
    },
    
    // 顯示連線狀態
    showConnectionStatus(status) {
        const indicator = document.getElementById('connection-indicator');
        if (!indicator) return;
        
        if (status === 'connected') {
            indicator.innerHTML = '🟢 線上';
            indicator.style.color = 'var(--success)';
        } else {
            indicator.innerHTML = '🔴 離線';
            indicator.style.color = 'var(--danger)';
        }
    },
    
    // 渲染在線用戶列表
    renderOnlineUsers() {
        const container = document.getElementById('online-users-list');
        if (!container) return;
        
        if (this.onlineUsers.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.75rem;padding:0.5rem">暫無其他用戶</div>';
            return;
        }
        
        container.innerHTML = this.onlineUsers.map(u => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem;background:var(--bg);border-radius:8px;margin-bottom:0.3rem">
                <div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div>
                    <span style="font-size:0.8rem">${u.codeName}</span>
                    <span style="font-size:0.65rem;color:var(--text-muted)">${u.publicId}</span>
                </div>
                <button class="btn-text" style="font-size:0.7rem;color:var(--primary)" onclick="SocketClient.addFriend('${u.publicId}')">+好友</button>
            </div>
        `).join('');
    },
    
    // 渲染好友列表
    renderFriends() {
        const container = document.getElementById('socket-friends-list');
        if (!container) return;
        
        if (this.friends.size === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.75rem;padding:0.5rem">還沒有好友</div>';
            return;
        }
        
        container.innerHTML = Array.from(this.friends).map(codeName => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem;background:var(--bg);border-radius:8px;margin-bottom:0.3rem">
                <div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div>
                    <span style="font-size:0.8rem">${this.escapeHtml(codeName)}</span>
                </div>
                <button class="btn-text" style="font-size:0.7rem;color:var(--primary)" onclick="ChatModule.startPrivateChat('${this.escapeHtml(codeName)}')">聊天</button>
            </div>
        `).join('');
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
            top: 70px;
            right: 1rem;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 50px;
            font-weight: 600;
            z-index: 5000;
            animation: slideDown 0.3s ease;
            font-size: 0.85rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // 顯示登入彈窗
    showLoginModal() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(15px);
            z-index: 4000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
        `;
        
        const savedName = localStorage.getItem('my_code_name') || '';
        
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:2rem;max-width:340px;width:100%;border:1px solid var(--border);text-align:center">
                <div style="font-size:3rem;margin-bottom:1rem">🎭</div>
                <div style="font-size:1.3rem;font-weight:600;margin-bottom:0.5rem">加入線上聊天</div>
                <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem">
                    設定一個代號，和身邊的朋友在同個網域內即時聊天
                </div>
                
                <div class="form-group" style="margin-bottom:1rem;text-align:left">
                    <label class="form-label">我的代號</label>
                    <div style="display:flex;gap:0.5rem">
                        <input type="text" id="login-codename" class="input-area" value="${savedName}" placeholder="例如：阿智" style="flex:1">
                        <button class="btn-secondary" onclick="document.getElementById('login-codename').value=FriendsModule.generateRealName('random')" style="width:auto;padding:0 0.8rem">🎲</button>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom:1.5rem;text-align:left">
                    <label class="form-label">真實名字（只有自己看）</label>
                    <input type="text" id="login-realname" class="input-area" placeholder="例如：小明">
                </div>
                
                <button class="btn-primary" style="width:100%" onclick="SocketClient.doLogin()">
                    🚀 開始聊天
                </button>
                
                <div style="margin-top:1rem;font-size:0.75rem;color:var(--text-muted)">
                    你的公開ID會顯示在這裡，分享給朋友就能加你
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    },
    
    doLogin() {
        const codeName = document.getElementById('login-codename').value.trim();
        const realName = document.getElementById('login-realname').value.trim();
        
        if (!codeName) {
            alert('請輸入代號');
            return;
        }
        
        this.connect(codeName, realName);
        document.querySelector('.fixed-overlay')?.remove();
    }
};

window.SocketClient = SocketClient;
