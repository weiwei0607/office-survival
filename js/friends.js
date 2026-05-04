/**
 * 好友 / 代號系統
 * 每個人都有對外代號，聊天時顯示代號而非真實身份
 */

const FriendsModule = {
    // 好友列表
    friends: [],
    
    // 職場代號庫
    codeNames: {
        office: ['專案經理A', '業務窗口B', '技術顧問C', '產品負責人D', '測試工程師E', '設計師F', '數據分析師G', '系統架構師H', '客戶代表I', '品管專員J'],
        scholar: ['第一作者', '通訊作者', '實驗室學長', '指導教授', '共同研究者', '文獻回顧者', '數據處理者', '模型建立者', '田野調查員', '統計分析師'],
        gamer: [' tank主', '補師小姐姐', 'DPS大哥', '公會長', '副本指揮', '戰場領隊', '鍛造師', '煉金術師', '召喚師', '刺客玩家'],
        medical: ['主治醫師', '住院醫師', '護理長', '藥師', '放射師', '檢驗師', '個管師', '營養師', '復健師', '麻醉醫師'],
        coder: ['Frontend Lead', 'Backend Dev', 'DevOps', 'QA Engineer', 'Tech Lead', 'Product Owner', 'Scrum Master', 'Data Engineer', 'Security Expert', 'Full Stack'],
        poetry: ['青衫客', '紅袖添香', '醉臥沙場', '採菊東籬', '獨釣寒江', '踏雪尋梅', '執筆書生', '撫琴女子', '仗劍天涯', '泛舟五湖']
    },
    
    // 普通人名庫（100+ 台灣熱門真實姓名）
    realNamePool: {
        male: {
            surnames: ['林', '陳', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '郭', '邱', '曾', '廖', '賴', '徐', '周', '葉', '蘇', '莊', '呂', '江', '何', '羅', '高', '蕭', '潘', '朱', '董', '游', '余', '鄧', '胡', '沈', '柯', '梁'],
            names: [
                // 2024 台灣熱門男生名 Top
                '承翰', '冠廷', '承恩', '冠宇', '彥廷', '品睿', '子宸', '柏宇', '哲瑋', '承澤',
                '宇翔', '冠霖', '奕辰', '柏翰', '品澔', '梓豪', '睿恩', '哲宇', '承軒', '彥霖',
                '浩宇', '沐辰', '一璟', '子汐', '星安', '宇宸', '梓睿', '沐宸', '奕承', '楷瑞',
                '宥廷', '昱辰', '彥哲', '冠宇', '承恩', '品睿', '子翔', '柏睿', '宇辰', '冠宇',
                // 常見字
                '智', '明', '傑', '宏', '偉', '恩', '軒', '睿', '宇', '豪',
                '翔', '凱', '文', '廷', '佑', '丞', '維', '翰', '鈞', '秉',
                '承', '彥', '禾', '宸', '栩', '昀', '奕', '宥', '恆', '昱',
                '凱', '倫', '佑', '宏', '毅', '達', '翔', '威', '信', '誠'
            ]
        },
        female: {
            surnames: ['林', '陳', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '郭', '邱', '曾', '廖', '賴', '徐', '周', '葉', '蘇', '莊', '呂', '江', '何', '羅', '高', '蕭', '潘', '朱', '董', '游', '余', '鄧', '胡', '沈', '柯', '梁'],
            names: [
                // 2024 台灣熱門女生名 Top
                '思妤', '宜蓁', '詩涵', '欣妤', '子晴', '詠琪', '采潔', '若涵', '雅涵', '品妤',
                '羽彤', '語彤', '子涵', '芷萱', '雨桐', '欣怡', '佳妤', '佳玲', '詩婷', '宜珊',
                '沐妍', '汐玥', '一諾', '欣怡', '亦可', '伊一', '藝可', '可欣', '樂伊', '悅希',
                '語嫣', '梓萱', '沐瑤', '若汐', '語桐', '梓涵', '苡沫', '雨汐', '欣悅', '詩琪',
                // 常見字
                '美', '婷', '君', '慧', '芬', '涵', '宜', '晴', '萱', '妤',
                '芸', '婕', '欣', '怡', '珊', '玲', '萍', '琪', '彤', '瑩',
                '蓉', '茜', '甄', '琳', '佳', '佩', '如', '雅', '毓', '芳',
                '伶', '昀', '岑', '安', '婕', '瑜', '靜', '儒', '妍', '真'
            ]
        }
    },
    
    // 當前選中的聊天對象
    currentFriendId: null,
    
    init() {
        this.loadFriends();
    },
    
    loadFriends() {
        const saved = localStorage.getItem('chat_friends');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 如果數據為空或不完整，使用預設
            if (!parsed || parsed.length === 0) {
                this.resetToDefault();
            } else {
                this.friends = parsed;
            }
        } else {
            this.resetToDefault();
        }
    },
    
    resetToDefault() {
        this.friends = [
            { id: 1, codeName: '阿智', realName: '小明', note: '隔壁班的', theme: 'office', messages: [] },
            { id: 2, codeName: '小婷', realName: '小美', note: '社團認識的', theme: 'office', messages: [] }
        ];
        this.saveFriends();
    },
    
    saveFriends() {
        localStorage.setItem('chat_friends', JSON.stringify(this.friends));
    },
    
    // 生成隨機代號（職場風格）
    generateCodeName(theme = 'office') {
        const pool = this.codeNames[theme] || this.codeNames.office;
        const used = this.friends.map(f => f.codeName);
        const available = pool.filter(c => !used.includes(c));
        
        if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        
        // 如果都用完了，加編號
        const base = pool[Math.floor(Math.random() * pool.length)];
        let i = 1;
        while (used.includes(base + i)) i++;
        return base + i;
    },
    
    // 生成普通人名（像真的一樣）
    generateRealName(gender = 'random') {
        if (gender === 'random') {
            gender = Math.random() > 0.5 ? 'male' : 'female';
        }
        
        const pool = this.realNamePool[gender];
        const used = this.friends.map(f => f.codeName);
        
        // 生成 10 個候選名字
        const candidates = [];
        for (let i = 0; i < 10; i++) {
            const surname = pool.surnames[Math.floor(Math.random() * pool.surnames.length)];
            const name = pool.names[Math.floor(Math.random() * pool.names.length)];
            
            // 多種命名風格
            const styles = [
                surname + name,                    // 全名：林承翰
                '阿' + name.charAt(0),             // 阿X：阿承
                '小' + name.charAt(0),             // 小X：小承
                name + (gender === 'male' ? '哥' : '姐'),            // 承翰哥
                surname + (gender === 'male' ? '先生' : '小姐'),      // 林先生
                '阿' + name.charAt(name.length - 1), // 阿翰
            ];
            
            const codeName = styles[Math.floor(Math.random() * styles.length)];
            if (!used.includes(codeName)) {
                candidates.push(codeName);
            }
        }
        
        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }
        
        // 如果都重複了，加數字
        const surname = pool.surnames[Math.floor(Math.random() * pool.surnames.length)];
        const name = pool.names[Math.floor(Math.random() * pool.names.length)];
        return surname + name + Math.floor(Math.random() * 100);
    },
    
    // 🎂 根據日期生成名字（超好玩）
    generateNameByDate(dateStr, gender = 'random') {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return this.generateRealName(gender);
        
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();        // 1-31
        const weekday = date.getDay();     // 0-6
        
        // 根據性別選池
        if (gender === 'random') {
            // 用日期的奇偶決定性別，這樣同一天不會都同一性別
            gender = (month * day) % 2 === 0 ? 'male' : 'female';
        }
        
        const pool = this.realNamePool[gender];
        
        // 用日期數字映射到名字索引（這樣同一天總是一樣的結果）
        const nameIndex = ((month * 31 + day) * 7 + weekday) % pool.names.length;
        const surnameIndex = ((day * 13 + month) * 5 + weekday) % pool.surnames.length;
        
        const surname = pool.surnames[surnameIndex];
        const name = pool.names[nameIndex];
        
        // 根據日期特徵選風格
        const styles = [];
        
        // 特殊日期有特殊稱呼
        if (month === 2 && day === 14) {
            styles.push(surname + '情人', '小情人', '阿情');
        } else if (month === 12 && day === 25) {
            styles.push(surname + '聖誕', '小聖誕', '阿誕');
        } else if (month === 1 && day === 1) {
            styles.push(surname + '元旦', '小元旦', '阿元');
        } else if (day === 1) {
            styles.push('月初' + name.charAt(0), '小月', '阿朔');
        } else if (day >= 28) {
            styles.push('月底' + name.charAt(0), '小尾');
        }
        
        // 根據星座加風格
        const zodiacNames = this.getZodiacName(month, day);
        if (zodiacNames) {
            styles.push(zodiacNames + name.charAt(0), '小' + zodiacNames);
        }
        
        // 週末出生的有特殊標記
        if (weekday === 0 || weekday === 6) {
            styles.push('週末' + name.charAt(0), '假日' + name.charAt(0));
        }
        
        // 基礎風格（一定會有）
        styles.push(
            surname + name,                    // 林承翰
            '阿' + name.charAt(0),             // 阿承
            '小' + name.charAt(0),             // 小承
            name + (gender === 'male' ? '哥' : '姐')  // 承翰哥
        );
        
        // 用日期的數字總和來選風格（這樣每個人都不一樣）
        const styleIndex = (month + day + weekday) % styles.length;
        return styles[styleIndex];
    },
    
    getZodiacName(month, day) {
        // 簡易星座判斷
        const zodiacs = [
            { name: '摩羯', start: [1, 20] }, { name: '水瓶', start: [2, 19] },
            { name: '雙魚', start: [3, 21] }, { name: '白羊', start: [4, 20] },
            { name: '金牛', start: [5, 21] }, { name: '雙子', start: [6, 21] },
            { name: '巨蟹', start: [7, 23] }, { name: '獅子', start: [8, 23] },
            { name: '處女', start: [9, 23] }, { name: '天秤', start: [10, 23] },
            { name: '天蠍', start: [11, 22] }, { name: '射手', start: [12, 22] },
            { name: '摩羯', start: [1, 1] }
        ];
        
        for (let i = 0; i < zodiacs.length - 1; i++) {
            const [sm, sd] = zodiacs[i].start;
            const [em, ed] = zodiacs[i + 1].start;
            
            const afterStart = (month > sm) || (month === sm && day >= sd);
            const beforeEnd = (month < em) || (month === em && day < ed);
            
            if (afterStart && beforeEnd) {
                return zodiacs[i].name;
            }
        }
        return '摩羯';
    },
    
    // 添加好友
    addFriend(realName, codeName, note, theme, firebaseUid) {
        const friend = {
            id: Date.now(),
            codeName: codeName || this.generateCodeName(theme),
            realName: realName || '未知',
            note: note || '',
            theme: theme || 'office',
            firebaseUid: firebaseUid || null,
            isOnline: false,
            messages: []
        };
        
        this.friends.push(friend);
        this.saveFriends();
        return friend;
    },
    
    // 刪除好友
    removeFriend(id) {
        this.friends = this.friends.filter(f => f.id !== id);
        this.saveFriends();
    },
    
    // 取得好友
    getFriend(id) {
        return this.friends.find(f => f.id === id);
    },
    
    // 設置當前聊天對象
    setCurrentFriend(id) {
        this.currentFriendId = id;
        localStorage.setItem('chat_current_friend', id);
    },
    
    // 取得當前聊天對象
    getCurrentFriend() {
        if (!this.currentFriendId) {
            const saved = localStorage.getItem('chat_current_friend');
            if (saved) this.currentFriendId = parseInt(saved);
        }
        return this.getFriend(this.currentFriendId);
    },
    
    // 渲染好友列表（在聊天頁面側邊欄或頂部）
    renderFriendList(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const currentFriend = this.getCurrentFriend();
        
        let friendsHtml = '';
        if (this.friends.length === 0) {
            friendsHtml = `
                <div style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.85rem">
                    還沒有聊天對象<br>
                    <button class="btn-primary" style="margin-top:0.5rem;font-size:0.8rem;padding:0.4rem 1rem" onclick="FriendsModule.showAddFriend()">+ 新增第一個好友</button>
                </div>
            `;
        } else {
            friendsHtml = `
                <div style="display:flex;gap:0.4rem;overflow-x:auto;padding-bottom:0.3rem">
                    ${this.friends.map(f => `
                        <div class="friend-avatar ${currentFriend?.id === f.id ? 'active' : ''}" 
                             onclick="FriendsModule.selectFriend(${f.id})"
                             style="flex-shrink:0;width:60px;text-align:center;cursor:pointer;padding:0.4rem;border-radius:var(--radius-sm);${currentFriend?.id === f.id ? 'background:rgba(108,92,231,0.2);border:1px solid var(--primary)' : 'border:1px solid transparent'}">
                            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:1.2rem">
                                ${this.getThemeIcon(f.theme)}
                            </div>
                            <div style="font-size:0.7rem;margin-top:0.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.codeName}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        container.innerHTML = `
            <div style="margin-bottom:0.8rem">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <span style="font-size:0.8rem;color:var(--text-muted)">聊天對象 (${this.friends.length})</span>
                    <button class="btn-text" style="font-size:0.75rem;color:var(--primary)" onclick="FriendsModule.showAddFriend()">+ 新增</button>
                </div>
                <div style="display:flex;gap:0.4rem;margin-bottom:0.5rem">
                    <button class="btn-secondary" style="flex:1;font-size:0.7rem;padding:0.35rem" onclick="FirebaseClient.showMyQRCode()">👤 我的名片</button>
                    <button class="btn-secondary" style="flex:1;font-size:0.7rem;padding:0.35rem" onclick="FirebaseClient.showScanFriend()">📷 掃碼加好友</button>
                </div>
                ${friendsHtml}
            </div>
        `;
    },
    
    getThemeIcon(theme) {
        const icons = { office: '💼', scholar: '📚', gamer: '🎮', medical: '🏥', coder: '💻', poetry: '🏮' };
        return icons[theme] || '💬';
    },
    
    selectFriend(id) {
        this.setCurrentFriend(id);
        const friend = this.getFriend(id);
        
        // 更新聊天標題
        const titleEl = document.getElementById('chat-friend-title');
        if (titleEl) {
            titleEl.innerHTML = `
                <span style="font-size:1rem">${friend.codeName}</span>
                <span style="font-size:0.7rem;color:var(--text-muted);margin-left:0.5rem">${this.getThemeName(friend.theme)}</span>
            `;
        }
        
        // 顯示真實備註（只有自己看得到）
        const noteEl = document.getElementById('chat-friend-note');
        if (noteEl) {
            noteEl.textContent = friend.realName + (friend.note ? ` · ${friend.note}` : '');
        }
        
        // 載入該好友的聊天記錄
        ChatModule.loadFriendMessages(id);
        
        // 重新渲染好友列表（更新active狀態）
        this.renderFriendList('friend-list-container');
    },
    
    getThemeName(theme) {
        const names = { office: '職場', scholar: '學霸', gamer: '遊戲', medical: '醫學', coder: '程式', poetry: '古風' };
        return names[theme] || theme;
    },
    
    showAddFriend() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:1.5rem;max-width:340px;width:100%;border:1px solid var(--border)">
                <div style="font-size:1.2rem;font-weight:600;margin-bottom:1rem">🎭 新增聊天對象</div>
                
                <div class="form-group" style="margin-bottom:0.8rem">
                    <label class="form-label">對方真實名字（只有你看得到）</label>
                    <input type="text" id="add-realname" class="input-area" placeholder="例如：小明">
                </div>
                
                <!-- 代號類型選擇 -->
                <div class="form-group" style="margin-bottom:0.5rem">
                    <label class="form-label">代號類型</label>
                    <div style="display:flex;gap:0.3rem;margin-bottom:0.5rem">
                        <button type="button" id="btn-name-type-real" class="btn-secondary active" style="flex:1;font-size:0.8rem;padding:0.4rem" onclick="FriendsModule.setNameType('real')">🧑 普通人名</button>
                        <button type="button" id="btn-name-type-work" class="btn-secondary" style="flex:1;font-size:0.8rem;padding:0.4rem" onclick="FriendsModule.setNameType('work')">💼 職場代號</button>
                        <button type="button" id="btn-name-type-date" class="btn-secondary" style="flex:1;font-size:0.8rem;padding:0.4rem" onclick="FriendsModule.setNameType('date')">🎂 日期生成</button>
                    </div>
                </div>
                
                <!-- 性別選擇（人名模式） -->
                <div id="gender-select" style="margin-bottom:0.5rem">
                    <div style="display:flex;gap:0.3rem">
                        <button type="button" id="btn-gender-random" class="btn-secondary active" style="flex:1;font-size:0.8rem;padding:0.4rem" onclick="FriendsModule.setGender('random')">🎲 隨機</button>
                        <button type="button" id="btn-gender-male" class="btn-secondary" style="flex:1;font-size:0.8rem;padding:0.4rem" onclick="FriendsModule.setGender('male')">👦 男生</button>
                        <button type="button" id="btn-gender-female" class="btn-secondary" style="flex:1;font-size:0.8rem;padding:0.4rem" onclick="FriendsModule.setGender('female')">👧 女生</button>
                    </div>
                </div>
                
                <!-- 日期輸入（日期生成模式） -->
                <div id="date-select" style="margin-bottom:0.5rem;display:none">
                    <div class="form-group" style="margin-bottom:0.5rem">
                        <label class="form-label">選擇日期（生日/紀念日/任何日期）</label>
                        <input type="date" id="add-birthdate" class="input-area" style="height:44px" onchange="FriendsModule.onDateChange()">
                    </div>
                    <div id="date-name-info" style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem"></div>
                </div>
                
                <div class="form-group" style="margin-bottom:0.8rem">
                    <label class="form-label">代號（對外顯示）</label>
                    <div style="display:flex;gap:0.5rem">
                        <input type="text" id="add-codename" class="input-area" placeholder="例如：阿智" style="flex:1">
                        <button class="btn-secondary" onclick="FriendsModule.randomizeName()" style="width:auto;padding:0 0.8rem">🎲</button>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom:0.8rem">
                    <label class="form-label">備註</label>
                    <input type="text" id="add-note" class="input-area" placeholder="例如：隔壁班的，社團認識的">
                </div>
                
                <div class="form-group" style="margin-bottom:1rem">
                    <label class="form-label">偽裝主題</label>
                    <select id="add-theme" class="input-area" style="height:44px" onchange="FriendsModule.onThemeChange()">
                        <option value="office">💼 職場黑話</option>
                        <option value="scholar">📚 學霸模式</option>
                        <option value="gamer">🎮 遊戲術語</option>
                        <option value="medical">🏥 醫學術語</option>
                        <option value="coder">💻 程式黑話</option>
                        <option value="poetry">🏮 古風文藝</option>
                    </select>
                </div>
                
                <div style="display:flex;gap:0.5rem">
                    <button class="btn-secondary" style="flex:1" onclick="this.closest('.fixed-overlay').remove()">取消</button>
                    <button class="btn-primary" style="flex:1" onclick="FriendsModule.confirmAddFriend()">新增</button>
                </div>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        document.body.appendChild(overlay);
        
        // 預設隨機一個人名
        setTimeout(() => this.randomizeName(), 100);
    },
    
    nameType: 'real',
    selectedGender: 'random',
    
    setNameType(type) {
        this.nameType = type;
        document.getElementById('btn-name-type-real').classList.toggle('active', type === 'real');
        document.getElementById('btn-name-type-work').classList.toggle('active', type === 'work');
        document.getElementById('btn-name-type-date').classList.toggle('active', type === 'date');
        
        // 顯示/隱藏日期選擇
        const dateSelect = document.getElementById('date-select');
        const genderSelect = document.getElementById('gender-select');
        if (dateSelect) {
            dateSelect.style.display = type === 'date' ? 'block' : 'none';
        }
        if (genderSelect) {
            genderSelect.style.display = type === 'date' ? 'none' : 'flex';
        }
        
        // 切換時自動重新生成
        this.randomizeName();
    },
    
    setGender(gender) {
        this.selectedGender = gender;
        document.getElementById('btn-gender-random').classList.toggle('active', gender === 'random');
        document.getElementById('btn-gender-male').classList.toggle('active', gender === 'male');
        document.getElementById('btn-gender-female').classList.toggle('active', gender === 'female');
        
        if (this.nameType === 'real') {
            this.randomizeName();
        }
    },
    
    onDateChange() {
        const dateInput = document.getElementById('add-birthdate');
        const infoEl = document.getElementById('date-name-info');
        if (!dateInput || !dateInput.value) return;
        
        const date = new Date(dateInput.value);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const zodiac = this.getZodiacName(month, day);
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        
        // 根據日期生成名字
        const codeName = this.generateNameByDate(dateInput.value, 'random');
        document.getElementById('add-codename').value = codeName;
        
        // 顯示資訊
        if (infoEl) {
            const special = this.getDateSpecialName(month, day);
            infoEl.innerHTML = `📅 ${month}月${day}日 週${weekday} · ${zodiac}座${special ? ' · ' + special : ''}<br>🎲 這天生成的名字：<b style="color:var(--primary)">${codeName}</b>`;
        }
    },
    
    getDateSpecialName(month, day) {
        const specials = {
            '2-14': '情人節寶寶', '12-25': '聖誕寶寶', '1-1': '元旦寶寶',
            '7-7': '七夕寶寶', '10-10': '雙十寶寶', '6-1': '兒童節寶寶',
            '8-8': '父親節寶寶', '5-1': '勞動節寶寶'
        };
        return specials[`${month}-${day}`] || null;
    },
    
    onThemeChange() {
        if (this.nameType === 'work') {
            this.randomizeName();
        }
    },
    
    randomizeName() {
        let codeName = '';
        if (this.nameType === 'real') {
            codeName = this.generateRealName(this.selectedGender);
        } else if (this.nameType === 'date') {
            const dateInput = document.getElementById('add-birthdate');
            if (dateInput && dateInput.value) {
                codeName = this.generateNameByDate(dateInput.value, 'random');
            } else {
                // 如果沒選日期，用今天
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('add-birthdate').value = today;
                codeName = this.generateNameByDate(today, 'random');
                this.onDateChange();
            }
        } else {
            const theme = document.getElementById('add-theme')?.value || 'office';
            codeName = this.generateCodeName(theme);
        }
        document.getElementById('add-codename').value = codeName;
    },
    
    confirmAddFriend() {
        const realName = document.getElementById('add-realname').value.trim();
        const codeName = document.getElementById('add-codename').value.trim();
        const note = document.getElementById('add-note').value.trim();
        const theme = document.getElementById('add-theme').value;
        
        if (!realName && !codeName) {
            alert('請至少輸入名字或代號');
            return;
        }
        
        const friend = this.addFriend(realName, codeName, note, theme);
        
        // 關閉彈窗
        document.querySelector('.fixed-overlay')?.remove();
        
        // 選中新好友
        this.selectFriend(friend.id);
        
        // 重新渲染好友列表
        this.renderFriendList('friend-list-container');
    }
};

window.FriendsModule = FriendsModule;
