/**
 * 群組系統
 * 開群聊天，每個成員都顯示代號，群組也有偽裝名稱
 */

const GroupsModule = {
    groups: [],
    currentGroupId: null,
    
    // 群組名稱庫
    groupNames: {
        office: ['跨部門協調小組', 'Q3專案衝刺群', '年度預算審查會', '系統上線應變小組', '客戶需求對接群', '週一進度同步會', '產品迭代討論區'],
        scholar: ['實驗室文獻討論群', '論文寫作互助會', '期刊投稿策略組', '研究方法論讀書會', '田野調查後援會', '統計分析求助區', '畢業論文衝刺組'],
        gamer: ['公會副本攻略群', '週末開黑車隊', '排位賽上分小隊', '裝備交易市集', '新遊戲測試團', '成就收集互助會', '戰場指揮頻道'],
        medical: ['病例討論讀書會', '晨會交班群組', '跨科會診協調群', '住院醫師互助區', '護理排班調度群', '藥品資訊更新區', '急診應變通知群'],
        coder: ['Sprint Planning群', 'Code Review頻道', 'Bug回報追蹤區', '技術分享讀書會', 'Deploy通知群', '面試經驗互助會', '開源專案貢獻群'],
        poetry: ['詩社雅集聚會', '詞牌創作研討', '對聯切磋會館', '古風音樂同好群', '書法臨摹互助會', '山水遊記分享群', '茶藝詩文雅集']
    },
    
    init() {
        this.loadGroups();
    },
    
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    },

    loadGroups() {
        const saved = localStorage.getItem('chat_groups');
        if (saved) {
            try { this.groups = JSON.parse(saved); } catch { localStorage.removeItem('chat_groups'); }
        }
        if (!this.groups.length) {
            // 預設群組
            this.groups = [
                {
                    id: 100,
                    name: '跨部門協調小組',
                    members: [
                        { id: 1, codeName: '專案經理A', role: '群主' },
                        { id: 2, codeName: '業務窗口B', role: '成員' },
                        { id: 3, codeName: '技術顧問C', role: '成員' }
                    ],
                    myCodeName: '產品負責人D',
                    theme: 'office',
                    messages: [
                        { id: 1, text: '今晚大家有空嗎？', sender: 'other', senderCode: '專案經理A', time: '14:30', mode: 'normal' },
                        { id: 2, text: '有啊，約哪？', sender: 'other', senderCode: '業務窗口B', time: '14:31', mode: 'normal' },
                        { id: 3, text: '老地方麻辣鍋？', sender: 'other', senderCode: '技術顧問C', time: '14:32', mode: 'normal' },
                        { id: 4, text: '好啊七點見', sender: 'me', senderCode: '產品負責人D', time: '14:33', mode: 'normal' }
                    ]
                },
                {
                    id: 101,
                    name: '實驗室文獻討論群',
                    members: [
                        { id: 1, codeName: '指導教授', role: '群主' },
                        { id: 2, codeName: '第一作者', role: '成員' }
                    ],
                    myCodeName: '通訊作者',
                    theme: 'scholar',
                    messages: []
                }
            ];
            this.saveGroups();
        }
    },

    
    saveGroups() {
        localStorage.setItem('chat_groups', JSON.stringify(this.groups));
    },
    
    generateGroupName(theme) {
        const pool = this.groupNames[theme] || this.groupNames.office;
        return pool[Math.floor(Math.random() * pool.length)];
    },
    
    addGroup(name, myCodeName, theme) {
        const group = {
            id: Date.now(),
            name: name || this.generateGroupName(theme),
            members: [],
            myCodeName: myCodeName || '成員A',
            theme: theme || 'office',
            messages: []
        };
        this.groups.push(group);
        this.saveGroups();
        return group;
    },
    
    getGroup(id) {
        return this.groups.find(g => g.id === id);
    },
    
    setCurrentGroup(id) {
        this.currentGroupId = id;
        localStorage.setItem('chat_current_group', id);
    },
    
    getCurrentGroup() {
        if (!this.currentGroupId) {
            const saved = localStorage.getItem('chat_current_group');
            if (saved) this.currentGroupId = parseInt(saved);
        }
        return this.getGroup(this.currentGroupId);
    },
    
    addMemberToGroup(groupId, codeName) {
        const group = this.getGroup(groupId);
        if (!group) return;
        group.members.push({
            id: Date.now(),
            codeName: codeName,
            role: '成員'
        });
        this.saveGroups();
    },
    
    renderGroupList(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const currentGroup = this.getCurrentGroup();
        
        let groupsHtml = '';
        if (this.groups.length === 0) {
            groupsHtml = `
                <div style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.85rem">
                    還沒有群組<br>
                    <button class="btn-primary" style="margin-top:0.5rem;font-size:0.8rem;padding:0.4rem 1rem" onclick="GroupsModule.showAddGroup()">+ 開第一個群</button>
                </div>
            `;
        } else {
            groupsHtml = `
                <div style="display:flex;gap:0.4rem;overflow-x:auto;padding-bottom:0.3rem">
                    ${this.groups.map(g => `
                        <div class="group-avatar ${currentGroup?.id === g.id ? 'active' : ''}"
                             onclick="GroupsModule.selectGroup(${Number(g.id)})"
                             style="flex-shrink:0;width:70px;text-align:center;cursor:pointer;padding:0.4rem;border-radius:var(--radius-sm);${currentGroup?.id === g.id ? 'background:rgba(108,92,231,0.2);border:1px solid var(--primary)' : 'border:1px solid transparent'}">
                            <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--primary),var(--secondary));margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:1.2rem">👥</div>
                            <div style="font-size:0.65rem;margin-top:0.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.escapeHtml(g.name)}</div>
                            <div style="font-size:0.6rem;color:var(--text-muted)">${g.members.length + 1}人</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        container.innerHTML = `
            <div style="margin-bottom:0.8rem">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <span style="font-size:0.8rem;color:var(--text-muted)">群組 (${this.groups.length})</span>
                    <button class="btn-text" style="font-size:0.75rem;color:var(--primary)" onclick="GroupsModule.showAddGroup()">+ 開新群</button>
                </div>
                ${groupsHtml}
            </div>
        `;
    },
    
    selectGroup(id) {
        this.setCurrentGroup(id);
        const group = this.getGroup(id);
        
        // 更新聊天標題
        const titleEl = document.getElementById('chat-friend-title');
        const noteEl = document.getElementById('chat-friend-note');
        if (titleEl) {
            titleEl.innerHTML = `
                <span style="font-size:1rem">👥 ${this.escapeHtml(group.name)}</span>
                <span style="font-size:0.7rem;color:var(--text-muted);margin-left:0.5rem">${this.escapeHtml(this.getThemeName(group.theme))}</span>
            `;
        }
        if (noteEl) {
            const memberNames = group.members.map(m => m.codeName).concat(group.myCodeName).join('、');
            noteEl.textContent = `我在群裡是「${group.myCodeName}」· 成員：${memberNames}`;
        }
        
        // 載入群組聊天記錄
        ChatModule.loadGroupMessages(id);
        
        // 更新UI
        this.renderGroupList('group-list-container');
        FriendsModule.renderFriendList('friend-list-container');
    },
    
    getThemeName(theme) {
        const names = { office: '職場', scholar: '學霸', gamer: '遊戲', medical: '醫學', coder: '程式', poetry: '古風' };
        return names[theme] || theme;
    },
    
    showAddGroup() {
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
                <div style="font-size:1.2rem;font-weight:600;margin-bottom:1rem">👥 開新群組</div>
                
                <div class="form-group" style="margin-bottom:0.8rem">
                    <label class="form-label">群組名稱（對外顯示）</label>
                    <div style="display:flex;gap:0.5rem">
                        <input type="text" id="add-group-name" class="input-area" placeholder="例如：跨部門協調小組" style="flex:1">
                        <button class="btn-secondary" onclick="GroupsModule.randomizeGroupName()" style="width:auto;padding:0 0.8rem">🎲</button>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom:0.8rem">
                    <label class="form-label">我在群裡的代號</label>
                    <input type="text" id="add-group-myname" class="input-area" placeholder="例如：產品負責人D" value="成員A">
                </div>
                
                <div class="form-group" style="margin-bottom:0.8rem">
                    <label class="form-label">偽裝主題</label>
                    <select id="add-group-theme" class="input-area" style="height:44px" onchange="GroupsModule.randomizeGroupName()">
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
                    <button class="btn-primary" style="flex:1" onclick="GroupsModule.confirmAddGroup()">開群</button>
                </div>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        document.body.appendChild(overlay);
    },
    
    randomizeGroupName() {
        const theme = document.getElementById('add-group-theme')?.value || 'office';
        const name = this.generateGroupName(theme);
        document.getElementById('add-group-name').value = name;
    },
    
    confirmAddGroup() {
        const name = document.getElementById('add-group-name').value.trim();
        const myName = document.getElementById('add-group-myname').value.trim() || '成員A';
        const theme = document.getElementById('add-group-theme').value;
        
        if (!name) {
            alert('請輸入群組名稱');
            return;
        }
        
        const group = this.addGroup(name, myName, theme);
        document.querySelector('.fixed-overlay')?.remove();
        
        // 切換到群組模式並選中新群
        ChatModule.chatMode = 'group';
        this.selectGroup(group.id);
        this.renderGroupList('group-list-container');
    }
};

window.GroupsModule = GroupsModule;
