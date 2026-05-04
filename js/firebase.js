/**
 * Firebase 客戶端
 * 跨網域即時聊天，支援 Google 登入與匿名登入
 * 
 * 使用方式：
 * 1. 去 https://console.firebase.google.com 創建專案
 * 2. 啟用 Realtime Database + Authentication
 * 3. 在 Authentication → Sign-in method 啟用「Google」
 * 4. 複製配置貼到下方 firebaseConfig
 * 5. 部署到 Firebase Hosting 或 Netlify
 */

// ============================================
// 🔧 請填入你的 Firebase 配置（從 Firebase Console 複製）
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDjGZCq0J3uehh8kZqGk1XZCw0_pvT90os",
    authDomain: "space-clear-app.firebaseapp.com",
    databaseURL: "https://space-clear-app-default-rtdb.firebaseio.com",
    projectId: "space-clear-app",
    storageBucket: "space-clear-app.firebasestorage.app",
    messagingSenderId: "815296228640",
    appId: "1:815296228640:web:4f321ba84cd629ec82fb45"
};

// 模擬模式：如果沒有配置，啟用本地模擬
const USE_MOCK = !firebaseConfig.apiKey;

const FirebaseClient = {
    app: null,
    db: null,
    auth: null,
    currentUser: null,
    myCodeName: null,
    myTheme: 'office',
    onlineUsersRef: null,
    listeners: [],
    privateChatListeners: {}, // 追蹤已監聽的私聊對象，避免重複
    html5QrCode: null, // 掃描器實例
    
    init() {
        if (USE_MOCK) {
            console.log('🔧 Firebase 未配置，執行模擬模式');
            this.showSetupGuide();
            this.renderLoginUI();
            return;
        }
        
        // 載入 Firebase SDK（動態載入 CDN）
        this.loadFirebaseSDK().then(() => {
            this.setupFirebase();
        });
    },
    
    loadFirebaseSDK() {
        return new Promise((resolve) => {
            if (window.firebase) {
                resolve();
                return;
            }
            
            const scripts = [
                'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
                'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js'
            ];
            
            let loaded = 0;
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loaded++;
                    if (loaded === scripts.length) resolve();
                };
                document.head.appendChild(script);
            });
        });
    },
    
    setupFirebase() {
        // 初始化 Firebase
        this.app = firebase.initializeApp(firebaseConfig);
        this.db = firebase.database();
        this.auth = firebase.auth();
        
        // 監聽認證狀態
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.afterLogin();
            } else {
                this.currentUser = null;
                this.renderLoginUI();
            }
        });
    },
    
    // Google 登入
    signInWithGoogle() {
        if (!this.auth) {
            this.showToast('Firebase 尚未初始化', 'error');
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        this.auth.signInWithPopup(provider).catch(err => {
            console.error('Google 登入失敗:', err);
            this.showToast('Google 登入失敗: ' + err.message, 'error');
        });
    },
    
    // 匿名登入
    signInAnonymous() {
        if (!this.auth) {
            this.showToast('Firebase 尚未初始化', 'error');
            return;
        }
        this.auth.signInAnonymously().catch(err => {
            console.error('匿名登入失敗:', err);
            this.showToast('匿名登入失敗: ' + err.message, 'error');
        });
    },
    
    // 登出
    signOut() {
        if (!this.auth) return;
        
        // 移除線上狀態
        if (this.currentUser) {
            this.db.ref('office-survival/users/' + this.currentUser.uid).remove();
        }
        
        // 清除監聽器
        this.listeners.forEach(ref => ref.off());
        this.listeners = [];
        Object.values(this.privateChatListeners).forEach(ref => ref.off());
        this.privateChatListeners = {};
        
        this.auth.signOut().then(() => {
            this.showToast('已登出', 'info');
            location.reload();
        });
    },
    
    afterLogin() {
        const uid = this.currentUser.uid;
        const shortUid = uid.substring(0, 8);
        
        // 從 localStorage 讀取代號與主題，或生成新的
        this.myCodeName = localStorage.getItem('my_code_name') || this.generateCodeName();
        this.myTheme = localStorage.getItem('my_theme') || 'office';
        
        // 如果用戶是 Google 登入，嘗試使用 displayName
        if (this.currentUser.displayName && !localStorage.getItem('my_code_name')) {
            // 可選：用 Google 名字的第一個字當基礎生成代號
            // this.myCodeName = '小' + this.currentUser.displayName.charAt(0);
        }
        
        // 寫入用戶資料到線上列表
        const userRef = this.db.ref('office-survival/users/' + uid);
        userRef.set({
            codeName: this.myCodeName,
            theme: this.myTheme,
            uid: uid,
            shortUid: shortUid,
            online: true,
            provider: this.currentUser.isAnonymous ? 'anonymous' : 'google',
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });
        
        // 斷線時自動移除
        userRef.onDisconnect().remove();
        
        // 監聽線上用戶
        this.listenOnlineUsers();
        
        // 更新 UI
        this.updateUI();
        
        // 加入預設聊天室
        this.joinRoom('default-room');
    },
    
    listenOnlineUsers() {
        const usersRef = this.db.ref('office-survival/users');
        usersRef.on('value', snapshot => {
            const users = snapshot.val() || {};
            const onlineList = [];
            
            Object.entries(users).forEach(([uid, data]) => {
                if (uid !== this.currentUser?.uid) {
                    onlineList.push({
                        codeName: data.codeName,
                        uid: uid,
                        theme: data.theme || 'office',
                        shortUid: data.shortUid || uid.substring(0, 8)
                    });
                }
            });
            
            this.renderOnlineUsers(onlineList);
            this.updateFriendOnlineStatus(onlineList);
        });
        
        this.listeners.push(usersRef);
    },
    
    // 更新好友列表中的線上狀態
    updateFriendOnlineStatus(onlineList) {
        const onlineUids = new Set(onlineList.map(u => u.uid));
        
        FriendsModule.friends.forEach(friend => {
            if (friend.firebaseUid) {
                friend.isOnline = onlineUids.has(friend.firebaseUid);
            }
        });
        
        // 如果有好友列表容器，重新渲染
        const container = document.getElementById('friend-list-container');
        if (container) {
            FriendsModule.renderFriendList('friend-list-container');
        }
    },
    
    // 查詢用戶資料
    async getUserInfo(uid) {
        if (!this.db) return null;
        
        try {
            const snapshot = await this.db.ref('office-survival/users/' + uid).once('value');
            return snapshot.val();
        } catch (err) {
            console.error('查詢用戶失敗:', err);
            return null;
        }
    },
    
    // 加入/創建房間
    joinRoom(roomId) {
        if (!this.db || !this.currentUser) return;
        
        const roomRef = this.db.ref('office-survival/rooms/' + roomId);
        const memberRef = roomRef.child('members/' + this.currentUser.uid);
        
        memberRef.set({
            codeName: this.myCodeName,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        memberRef.onDisconnect().remove();
        
        // 監聽房間訊息
        this.listenRoomMessages(roomId);
    },
    
    listenRoomMessages(roomId) {
        const messagesRef = this.db.ref('office-survival/messages/' + roomId);
        messagesRef.limitToLast(50).on('child_added', snapshot => {
            const msg = snapshot.val();
            if (msg.sender !== this.myCodeName) {
                ChatModule.receiveMessage(msg);
            }
        });
        
        this.listeners.push(messagesRef);
    },
    
    // 發送群組訊息
    sendRoomMessage(roomId, text, displayText, mode) {
        if (!this.db || !this.currentUser) {
            FirebaseClient.showToast('Firebase 未連接', 'error');
            return false;
        }
        
        const msg = {
            id: Date.now().toString(),
            text: text,
            displayText: displayText || text,
            sender: this.myCodeName,
            senderCode: this.myCodeName,
            senderUid: this.currentUser.uid,
            time: new Date().toISOString(),
            mode: mode || 'normal',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        this.db.ref('office-survival/messages/' + roomId).push(msg);
        return true;
    },
    
    // 發送私聊訊息
    sendPrivateMessage(toUid, text, displayText, mode) {
        if (!this.db || !this.currentUser) return false;
        
        // 建立雙向聊天 ID（排序後拼接）
        const chatId = [this.currentUser.uid, toUid].sort().join('_');
        
        const msg = {
            id: Date.now().toString(),
            text: text,
            displayText: displayText || text,
            sender: this.myCodeName,
            senderCode: this.myCodeName,
            senderUid: this.currentUser.uid,
            to: toUid,
            time: new Date().toISOString(),
            mode: mode || 'normal',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        this.db.ref('office-survival/private/' + chatId).push(msg);
        return true;
    },
    
    listenPrivateMessages(otherUid) {
        if (!this.db || !this.currentUser) return;
        
        // 避免重複監聽同一對象
        if (this.privateChatListeners[otherUid]) return;
        
        const chatId = [this.currentUser.uid, otherUid].sort().join('_');
        const ref = this.db.ref('office-survival/private/' + chatId);
        
        ref.limitToLast(50).on('child_added', snapshot => {
            const msg = snapshot.val();
            // 只處理對方發來的訊息
            if (msg.senderUid !== this.currentUser.uid) {
                ChatModule.receivePrivateMessage(msg);
            }
        });
        
        this.privateChatListeners[otherUid] = ref;
        this.listeners.push(ref);
    },
    
    // 停止監聽特定私聊
    stopListenPrivateMessages(otherUid) {
        if (this.privateChatListeners[otherUid]) {
            this.privateChatListeners[otherUid].off();
            delete this.privateChatListeners[otherUid];
        }
    },
    
    renderOnlineUsers(users) {
        const container = document.getElementById('online-users-list');
        if (!container) return;
        
        if (users.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.75rem;padding:0.5rem">暫無其他用戶</div>';
            return;
        }
        
        container.innerHTML = users.map(u => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem;background:var(--bg);border-radius:8px;margin-bottom:0.3rem">
                <div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="width:8px;height:8px;border-radius:50%;background:var(--success);animation:pulse 2s infinite"></div>
                    <span style="font-size:0.8rem">${u.codeName}</span>
                    <span style="font-size:0.65rem;color:var(--text-muted)">${u.shortUid}</span>
                </div>
                <button class="btn-text" style="font-size:0.7rem;color:var(--primary)" onclick="FirebaseClient.startPrivateChat('${u.uid}', '${u.codeName}', '${u.theme}')">私聊</button>
            </div>
        `).join('');
    },
    
    startPrivateChat(otherUid, codeName, theme) {
        ChatModule.switchChatMode('private');
        
        // 創建/選擇好友（帶 firebaseUid）
        let friend = FriendsModule.friends.find(f => f.firebaseUid === otherUid);
        if (!friend) {
            friend = FriendsModule.addFriend(codeName, codeName, '線上認識', theme || 'office', otherUid);
        }
        
        FriendsModule.selectFriend(friend.id);
        this.listenPrivateMessages(otherUid);
    },
    
    // ========== 登入 UI ==========
    renderLoginUI() {
        const loginArea = document.getElementById('login-area');
        if (!loginArea) return;
        
        if (USE_MOCK) {
            loginArea.innerHTML = `
                <div style="text-align:center;padding:1.5rem">
                    <div style="font-size:2rem;margin-bottom:0.5rem">🔧</div>
                    <div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1rem">Firebase 未配置</div>
                    <button class="btn-secondary" style="font-size:0.8rem" onclick="FirebaseClient.showSetupGuide()">查看設定教學</button>
                </div>
            `;
            return;
        }
        
        loginArea.innerHTML = `
            <div style="text-align:center;padding:1.5rem">
                <div style="font-size:2rem;margin-bottom:0.5rem">🔐</div>
                <div style="font-size:0.9rem;font-weight:600;margin-bottom:0.5rem">登入以開始聊天</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:1rem">與朋友跨裝置即時聊天</div>
                <div style="display:flex;flex-direction:column;gap:0.5rem">
                    <button class="btn-primary" style="display:flex;align-items:center;justify-content:center;gap:0.5rem" onclick="FirebaseClient.signInWithGoogle()">
                        <span style="font-size:1rem">🔴</span> 使用 Google 登入
                    </button>
                    <button class="btn-secondary" style="font-size:0.8rem" onclick="FirebaseClient.signInAnonymous()">
                        匿名使用（無需帳號）
                    </button>
                </div>
            </div>
        `;
    },
    
    updateUI() {
        const loginArea = document.getElementById('login-area');
        const onlineSection = document.getElementById('online-users-section');
        const noteEl = document.getElementById('chat-friend-note');
        const indicator = document.getElementById('connection-indicator');
        
        if (loginArea) {
            const shortUid = this.currentUser?.uid?.substring(0, 8) || '';
            loginArea.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.8rem;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:0.8rem">
                    <div style="display:flex;align-items:center;gap:0.5rem">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:1rem">
                            ${this.currentUser?.photoURL ? `<img src="${this.currentUser.photoURL}" style="width:32px;height:32px;border-radius:50%">` : '👤'}
                        </div>
                        <div>
                            <div style="font-size:0.85rem;font-weight:600">${this.myCodeName}</div>
                            <div style="font-size:0.7rem;color:var(--text-muted)">${shortUid}</div>
                        </div>
                    </div>
                    <button class="btn-text" style="font-size:0.75rem;color:var(--danger)" onclick="FirebaseClient.signOut()">登出</button>
                </div>
            `;
        }
        
        if (onlineSection) onlineSection.style.display = 'block';
        if (indicator) {
            indicator.innerHTML = '🟢 線上';
            indicator.style.color = 'var(--success)';
        }
        
        if (noteEl) {
            const providerText = this.currentUser?.isAnonymous ? '匿名' : 'Google';
            noteEl.innerHTML = `我的代號：<b>${this.myCodeName}</b> · ${providerText} 連線中 🌍`;
        }
        
        FirebaseClient.showToast(`🌍 已上線：${this.myCodeName}`, 'success');
    },
    
    // ========== QR Code 相關 ==========
    showMyQRCode() {
        if (!this.currentUser) {
            this.showToast('請先登入', 'warning');
            return;
        }
        
        const uid = this.currentUser.uid;
        const qrData = `officesurvival://add?u=${encodeURIComponent(uid)}&c=${encodeURIComponent(this.myCodeName)}&t=${encodeURIComponent(this.myTheme)}`;
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(10px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:1.5rem;max-width:320px;width:100%;border:1px solid var(--border);text-align:center">
                <div style="font-size:1.2rem;font-weight:600;margin-bottom:0.5rem">👤 我的名片</div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem">讓朋友掃描下方 QR Code 加你為好友</div>
                
                <div id="qrcode-display" style="display:flex;justify-content:center;margin-bottom:1rem;padding:1rem;background:white;border-radius:var(--radius-sm)"></div>
                
                <div style="background:var(--bg);padding:0.8rem;border-radius:var(--radius-sm);margin-bottom:1rem">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.3rem">我的代號</div>
                    <div style="font-size:1rem;font-weight:600">${this.myCodeName}</div>
                    <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.3rem">ID: ${uid.substring(0, 8)}...</div>
                </div>
                
                <button class="btn-secondary" style="width:100%" onclick="this.closest('.fixed-overlay').remove()">關閉</button>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        document.body.appendChild(overlay);
        
        // 生成 QR Code
        setTimeout(() => {
            const qrContainer = document.getElementById('qrcode-display');
            if (qrContainer && window.QRCode) {
                new QRCode(qrContainer, {
                    text: qrData,
                    width: 180,
                    height: 180,
                    colorDark: '#1a1a2e',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            }
        }, 100);
    },
    
    showScanFriend() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(10px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:1.5rem;max-width:380px;width:100%;border:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                    <div style="font-size:1.2rem;font-weight:600">📷 掃碼加好友</div>
                    <button class="btn-text" style="font-size:1.2rem" onclick="this.closest('.fixed-overlay').remove()">✕</button>
                </div>
                
                <!-- 相機掃描區域 -->
                <div id="qr-reader" style="width:100%;border-radius:var(--radius-sm);overflow:hidden;margin-bottom:1rem"></div>
                
                <div style="text-align:center;color:var(--text-muted);font-size:0.8rem;margin-bottom:1rem">— 或 —</div>
                
                <!-- 手動輸入 -->
                <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
                    <input type="text" id="scan-manual-input" class="input-area" placeholder="輸入對方代號或 UID" style="flex:1">
                    <button class="btn-primary" style="width:auto;padding:0 1rem" onclick="FirebaseClient.addFriendByInput()">添加</button>
                </div>
                
                <button class="btn-secondary" style="width:100%;font-size:0.8rem" onclick="FirebaseClient.stopScan();this.closest('.fixed-overlay').remove()">取消</button>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.stopScan();
                overlay.remove();
            }
        });
        
        document.body.appendChild(overlay);
        
        // 啟動掃描
        setTimeout(() => this.startScan(), 200);
    },
    
    startScan() {
        if (!window.Html5Qrcode) {
            this.showToast('掃描器載入中，請稍後再試', 'warning');
            return;
        }
        
        const qrReader = document.getElementById('qr-reader');
        if (!qrReader) return;
        
        this.html5QrCode = new Html5Qrcode('qr-reader');
        
        this.html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 200, height: 200 } },
            (decodedText) => {
                this.handleScannedQR(decodedText);
            },
            (err) => {
                // 掃描中的錯誤，通常可以忽略
            }
        ).catch(err => {
            console.error('啟動掃描失敗:', err);
            this.showToast('無法啟動相機，請使用手動輸入', 'error');
            // 顯示手動輸入提示
            if (qrReader) {
                qrReader.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.85rem">無法使用相機<br>請使用下方手動輸入</div>';
            }
        });
    },
    
    stopScan() {
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(() => {
                this.html5QrCode = null;
            }).catch(() => {
                this.html5QrCode = null;
            });
        }
    },
    
    async handleScannedQR(decodedText) {
        this.stopScan();
        
        // 解析 QR Code 內容
        let uid, codeName, theme;
        
        if (decodedText.includes('officesurvival://add?')) {
            const url = new URL(decodedText.replace('officesurvival://', 'http://localhost/'));
            uid = url.searchParams.get('u');
            codeName = decodeURIComponent(url.searchParams.get('c') || '');
            theme = url.searchParams.get('t') || 'office';
        } else {
            // 嘗試直接當作 UID
            uid = decodedText.trim();
        }
        
        if (!uid) {
            this.showToast('無法識別 QR Code', 'error');
            return;
        }
        
        // 不能加自己
        if (uid === this.currentUser?.uid) {
            this.showToast('這是你自己的 QR Code！', 'warning');
            return;
        }
        
        // 從 Firebase 查詢對方資料
        const userInfo = await this.getUserInfo(uid);
        if (userInfo) {
            this.showAddConfirm(userInfo.uid, userInfo.codeName, userInfo.theme, true);
        } else {
            // 如果 Firebase 查不到，用 QR Code 裡的資訊
            if (codeName) {
                this.showAddConfirm(uid, codeName, theme, false);
            } else {
                this.showToast('找不到該用戶，對方可能已離線', 'error');
            }
        }
    },
    
    async addFriendByInput() {
        const input = document.getElementById('scan-manual-input');
        const value = input?.value?.trim();
        if (!value) return;
        
        this.stopScan();
        document.querySelector('.fixed-overlay')?.remove();
        
        // 嘗試當作 UID 查詢
        let userInfo = await this.getUserInfo(value);
        
        if (userInfo) {
            this.showAddConfirm(userInfo.uid, userInfo.codeName, userInfo.theme, true);
            return;
        }
        
        // 嘗試在線上用戶中搜尋代號
        const usersSnapshot = await this.db.ref('office-survival/users').once('value');
        const users = usersSnapshot.val() || {};
        
        let matchedUid = null;
        Object.entries(users).forEach(([uid, data]) => {
            if (data.codeName === value || uid.startsWith(value)) {
                matchedUid = uid;
                userInfo = data;
            }
        });
        
        if (matchedUid && userInfo) {
            this.showAddConfirm(matchedUid, userInfo.codeName, userInfo.theme, true);
        } else {
            this.showToast('找不到該用戶，請確認代號或 UID 正確', 'error');
        }
    },
    
    showAddConfirm(uid, codeName, theme, isOnline) {
        // 檢查是否已經是好友
        const existing = FriendsModule.friends.find(f => f.firebaseUid === uid);
        if (existing) {
            this.showToast(`${codeName} 已經是你的好友了`, 'info');
            FriendsModule.selectFriend(existing.id);
            document.querySelector('.fixed-overlay')?.remove();
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 3100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:1.5rem;max-width:300px;width:100%;border:1px solid var(--border);text-align:center">
                <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;font-size:1.5rem">
                    ${FriendsModule.getThemeIcon(theme)}
                </div>
                <div style="font-size:1.1rem;font-weight:600;margin-bottom:0.3rem">${codeName}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">${isOnline ? '🟢 上線中' : '⚪ 離線'}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:1rem">主題：${FriendsModule.getThemeName(theme)}</div>
                
                <div style="display:flex;gap:0.5rem">
                    <button class="btn-secondary" style="flex:1" onclick="this.closest('.fixed-overlay').remove()">取消</button>
                    <button class="btn-primary" style="flex:1" onclick="FirebaseClient.confirmAddFriend('${uid}', '${codeName}', '${theme}')">添加好友</button>
                </div>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        document.body.appendChild(overlay);
    },
    
    confirmAddFriend(uid, codeName, theme) {
        const friend = FriendsModule.addFriend(codeName, codeName, '掃碼添加', theme, uid);
        document.querySelectorAll('.fixed-overlay').forEach(el => el.remove());
        
        this.showToast(`已添加 ${codeName} 為好友！`, 'success');
        
        // 選中新好友並開始監聽私聊
        FriendsModule.selectFriend(friend.id);
        this.listenPrivateMessages(uid);
    },
    
    // ========== 工具方法 ==========
    generateCodeName() {
        const pool = FriendsModule.realNamePool;
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const surnames = pool[gender].surnames;
        const names = pool[gender].names;
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        const styles = [surname + name, '阿' + name.charAt(0), '小' + name.charAt(0)];
        const codeName = styles[Math.floor(Math.random() * styles.length)];
        localStorage.setItem('my_code_name', codeName);
        return codeName;
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
        }, 2500);
    },
    
    showSetupGuide() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(15px);
            z-index: 5000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
            overflow-y: auto;
        `;
        
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:2rem;max-width:520px;width:100%;border:1px solid var(--border)">
                <div style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;text-align:center">🔧 Firebase 設定指南</div>
                <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem;text-align:center">
                    只需 5 分鐘，開啟 Google 登入 + 掃碼加好友功能
                </div>
                
                <div style="margin-bottom:1rem">
                    <div style="font-weight:600;margin-bottom:0.3rem">1. 創建 Firebase 專案</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">
                        前往 <a href="https://console.firebase.google.com" target="_blank" style="color:var(--primary)">console.firebase.google.com</a><br>
                        點「建立專案」→ 取名「OfficeSurvival」
                    </div>
                </div>
                
                <div style="margin-bottom:1rem">
                    <div style="font-weight:600;margin-bottom:0.3rem">2. 啟用 Realtime Database</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">
                        左側選單 → Build → Realtime Database → 建立資料庫<br>
                        選「測試模式」（允許讀寫）
                    </div>
                </div>
                
                <div style="margin-bottom:1rem">
                    <div style="font-weight:600;margin-bottom:0.3rem">3. 啟用 Authentication + Google 登入</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">
                        Build → Authentication → 開始 → 選「Google」→ 啟用<br>
                        同時啟用「匿名」登入（作為備選）
                    </div>
                </div>
                
                <div style="margin-bottom:1rem">
                    <div style="font-weight:600;margin-bottom:0.3rem">4. 複製設定到 firebase.js</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">
                        點「⚙️ 專案設定」→ 捲到「你的應用程式」→ 複製 firebaseConfig<br>
                        貼到 <code>js/firebase.js</code> 檔案最上面的 firebaseConfig
                    </div>
                </div>
                
                <div style="margin-bottom:1rem">
                    <div style="font-weight:600;margin-bottom:0.3rem">5. 設定 authorized domains</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">
                        Authentication → Settings → Authorized domains<br>
                        添加你的部署網域（例如 <code>localhost</code>、<code>netlify.app</code>）
                    </div>
                </div>
                
                <div style="margin-bottom:1.5rem">
                    <div style="font-weight:600;margin-bottom:0.3rem">6. 部署（可選）</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">
                        Build → Hosting → 開始 → 安裝 Firebase CLI → 執行 <code>firebase deploy</code><br>
                        或直接用 <a href="https://app.netlify.com/drop" target="_blank" style="color:var(--primary)">Netlify Drop</a> 拖曳上傳
                    </div>
                </div>
                
                <div style="background:var(--bg);padding:1rem;border-radius:var(--radius-sm);margin-bottom:1.5rem">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem">不想設定？先用本地模式：</div>
                    <button class="btn-secondary" style="width:100%;font-size:0.85rem" onclick="document.querySelector('.fixed-overlay').remove()">
                        暫時使用本地模式（同網域）
                    </button>
                </div>
                
                <button class="btn-primary" style="width:100%" onclick="document.querySelector('.fixed-overlay').remove()">
                    知道了，我設定好了再來
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    },
    
    disconnect() {
        this.listeners.forEach(ref => ref.off());
        this.listeners = [];
        Object.values(this.privateChatListeners).forEach(ref => ref.off());
        this.privateChatListeners = {};
        if (this.auth) this.auth.signOut();
    }
};

window.FirebaseClient = FirebaseClient;
