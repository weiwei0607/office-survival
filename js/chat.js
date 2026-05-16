/**
 * 職場偽裝聊天室 v2
 * 私聊自動加密成工作術語
 * 支援：一般 / AI 加密 / Excel / Outlook / Terminal 偽裝
 */

const ChatModule = {
    messages: [],
    currentMode: 'normal',
    disguiseSkin: 'normal',
    
    // 多主題加密詞庫
    themes: {
        office: {
            name: '職場黑話',
            icon: '💼',
            desc: '賦能、抓手、閉環',
            map: {
                '吃': '執行熱能補充', '吃飯': '執行專案評估', '用餐': '進行餐飲協作',
                '晚餐': '下班後跨部門會議', '午餐': '中午進度同步', '早餐': '晨間啟動會議',
                '火鍋': '高溫協作專案', '麻辣鍋': '高溫協作專案', '燒烤': '火力全開專案',
                '喝酒': '液態創意激盪', '咖啡': '咖啡因驅動會議', '奶茶': '糖分補給站',
                '啤酒': '氣泡式放鬆方案', '珍奶': '台灣特色補給方案',
                '約會': '一對一進度同步', '見面': '面對面協作', '聊天': '非正式需求訪談',
                '老地方': '指定協作據點', '等一下': '延遲響應', '馬上': '即時響應',
                '八卦': '市場情報交流', '抱怨': '負面回饋收集', '吐槽': '非正式意見表達',
                '機車': '管理風格強勢', '老闆': '決策層', '主管': '直屬管理單位',
                '同事': '平行協作單位', '客戶': '外部利益關係人',
                '男朋友': '專屬協作夥伴', '女朋友': '專屬協作夥伴', '曖昧': '未明確關係狀態',
                '分手': '關係終止協議', '在一起': '長期合作關係', '結婚': '永久戰略聯盟',
                '加班': '工時延長計畫', '下班': '工作時段結束', '週末': '非工作日區間',
                '放假': '人力資源暫停配置', '旅遊': '異地辦公考察', '電影': '視覺內容分析',
                '遊戲': '互動式模擬訓練', '睡覺': '生理系統維護', '累': '能量耗盡警告',
                '爽': '正向反饋狀態', '開心': '士氣指數提升', '難過': '情緒低谷期',
                '生氣': '憤怒管理需求', '煩': '心理負載過高', '爽': '正向反饋狀態',
                '錢': '資金流', '沒錢': '資金流枯竭', '買': '執行採購', '賣': '執行資產處分',
                '手機': '通訊設備終端', '電腦': '運算設備終端', '網路': '數據傳輸通道',
                '密碼': '存取授權碼', '登入': '身分驗證流程', '更新': '版本迭代',
                '照片': '視覺資料紀錄', '影片': '動態媒體檔案', '音樂': '聲波內容播放',
                '等': '佇列中', '來': '到達', '去': '前往', '走': '移動',
                '看': '視覺接收', '聽': '聲波接收', '說': '口頭輸出', '問': '資訊請求',
                '知道': '資訊已掌握', '不知道': '資訊待補充', '可以': '可行性確認',
                '好': '正向確認', '是': '邏輯真值', '有': '存在性確認'
            },
            prefixes: ['【專案同步】', '【進度更新】', '【會議紀錄】', '【部門通報】', '【資源調度】', '【風險評估】'],
            replyPrefixes: ['【回覆確認】', '【收到通知】', '【資料回饋】', '【執行回報】'],
            suffixes: ['，請相關單位留意。', '，已列入追蹤項目。', '，預計下週產出報告。', '，請於 EOD 前回覆確認。']
        },
        
        scholar: {
            name: '學霸模式',
            icon: '📚',
            desc: '論文、定理、學術名詞',
            map: {
                '吃': '攝取營養物質', '吃飯': '進行飲食攝取實驗', '晚餐': '晚間營養補充程序',
                '午餐': '中午能量攝取窗口', '早餐': '晨間代謝啟動餐',
                '火鍋': '高溫液態烹飪系統', '麻辣': '辣椒素刺激反應', '燒烤': '美拉德反應實驗',
                '喝酒': '乙醇代謝測試', '咖啡': '咖啡因中樞神經刺激', '奶茶': '高糖高脂混合溶液',
                '約會': '雙人社交互動實驗', '見面': '面對面數據交換', '聊天': '語言信息傳遞過程',
                '老地方': '慣常聚集座標', '等一下': '時間延遲變量', '馬上': '趨近於零時間差',
                '八卦': '非正式信息傳播網絡', '抱怨': '負面情緒釋放機制', '吐槽': '幽默化批評表達',
                '機車': '行為模式異常樣本', '老闆': '實驗室指導教授', '主管': '課程助教',
                '同事': '同組實驗夥伴', '同學': '平行學習個體',
                '男朋友': '親密關係研究對象', '女朋友': '親密關係研究對象', '曖昧': '關係狀態不確定性',
                '分手': '關係終止宣告', '在一起': '關係確立宣告', '結婚': '社會契約簽署',
                '考試': '知識掌握度評量', '讀書': '認知資訊輸入', '寫作業': '知識輸出作業',
                '及格': '最低門檻通過', '不及格': '未達學習目標', '滿分': '知識掌握度100%',
                '作弊': '學術誠信違規', '補考': '二次評量機會', '重修': '課程迭代學習',
                '睡覺': '神經系統維護', '累': '認知負荷超標', '開心': '多巴胺分泌峰值',
                '難過': '血清素水平下降', '生氣': '腎上腺素激增', '煩': '注意力分散狀態',
                '錢': '貨幣單位', '沒錢': '流動性不足', '買': '資產交換行為',
                '手機': '移動計算設備', '電腦': '個人計算終端', '網路': '互聯網協議網絡',
                '遊戲': '虛擬環境模擬', '電影': '視覺敘事文本', '追劇': '連續敘事消費',
                '等': '時間變量累積', '來': '空間位移完成', '去': '空間位移啟動',
                '看': '視覺信息接收', '聽': '聽覺信息接收', '說': '語言輸出過程',
                '知道': '知識圖譜命中', '不知道': '知識盲區', '可以': '條件滿足',
                '好': '正向反饋信號', '是': '命題為真', '有': '存在性驗證通過'
            },
            prefixes: ['【文獻回顧】', '【實驗紀錄】', '【研究發現】', '【數據分析】', '【理論框架】', '【研究方法】'],
            replyPrefixes: ['【實驗回覆】', '【數據回饋】', '【研究回應】'],
            suffixes: ['，樣本數 n=1。', '，p < 0.05 顯著。', '，待同儕審查。', '，建議引用文獻佐證。']
        },
        
        gamer: {
            name: '遊戲術語',
            icon: '🎮',
            desc: 'Buff、Debuff、GG',
            map: {
                '吃': '回血', '吃飯': '補HP補MP', '晚餐': '晚間補給任務',
                '午餐': '中午Buff時間', '早餐': '晨間日常任務',
                '火鍋': 'AOE火屬性傷害', '麻辣': '持續灼燒Debuff', '燒烤': '火系技能釋放',
                '喝酒': '獲得混亂狀態', '咖啡': '攻速+50%藥水', '奶茶': '甜度爆表Buff',
                '約會': '雙人副本', '見面': '組隊成功', '聊天': '公頻發言',
                '老地方': '固定刷怪點', '等一下': '讀條中', '馬上': '技能冷卻結束',
                '八卦': '世界頻道八卦', '抱怨': '輸出負面情緒', '吐槽': '發送彈幕',
                '機車': '隊友行為異常', '老闆': '副本最終BOSS', '主管': '精英怪',
                '同事': '固定隊友', '同學': '新手村夥伴',
                '男朋友': '綁定CP', '女朋友': '綁定CP', '曖昧': '好感度累積中',
                '分手': '解除綁定', '在一起': '正式組隊', '結婚': '公會合併',
                '考試': '排位賽', '讀書': '刷經驗值', '寫作業': '每日任務',
                '及格': '通關', '不及格': '任務失敗', '滿分': '三星通關',
                '作弊': '開外掛', '補考': '重開副本', '重修': '從頭練角',
                '睡覺': '下線掛機', '累': '體力值歸零', '開心': '暴擊傷害',
                '難過': '被Debuff', '生氣': '進入狂暴狀態', '煩': '被控場',
                '錢': '金幣', '沒錢': '金幣不足', '買': '商城消費',
                '手機': '移動裝備', '電腦': '主機裝備', '網路': '伺服器連線',
                '遊戲': '主線任務', '電影': '過場動畫', '追劇': '連續副本',
                '等': '排隊中', '來': '傳送到', '去': '傳送去',
                '看': '偵察', '聽': '接收語音頻道', '說': '麥克風輸出',
                '知道': '解鎖成就', '不知道': '未探索區域', '可以': '技能可用',
                '好': '收到', '是': '確認', '有': '背包有貨'
            },
            prefixes: ['【系統公告】', '【副本紀錄】', '【戰鬥日誌】', '【公會通知】', '【任務追蹤】', '【裝備評測】'],
            replyPrefixes: ['【隊友回覆】', '【語音頻道】', '【隊伍頻道】'],
            suffixes: ['，GG。', '，HP見底。', '，需要補師。', '，BOSS狂怒了！']
        },
        
        medical: {
            name: '醫學術語',
            icon: '🏥',
            desc: '症狀、診斷、處方',
            map: {
                '吃': '經口攝入', '吃飯': '進行營養支持治療', '晚餐': '晚間營養處方',
                '午餐': '中午熱量補充', '早餐': '晨間基礎代謝啟動',
                '火鍋': '高溫液體攝入療法', '麻辣': '三叉神經刺激反應', '燒烤': '高溫蛋白質變性',
                '喝酒': '中樞神經抑制劑攝入', '咖啡': '腺苷受體拮抗劑', '奶茶': '高糖高脂製劑',
                '約會': '雙人社交處方', '見面': '面對面會診', '聊天': '語言治療會話',
                '老地方': '慣常就診地點', '等一下': '候診時間', '馬上': '急診級響應',
                '八卦': '非正式病歷交換', '抱怨': '主訴症狀描述', '吐槽': '幽默化主訴',
                '機車': '行為模式異常病例', '老闆': '主治醫師', '主管': '住院醫師',
                '同事': '同科醫護人員', '同學': '醫學院同期',
                '男朋友': '固定陪病家屬', '女朋友': '固定陪病家屬', '曖昧': '關係診斷待定',
                '分手': '關係終止出院', '在一起': '關係確立入院', '結婚': '長期照護合約',
                '考試': '知識評估測驗', '讀書': '認知訓練', '寫作業': '治療性書寫',
                '睡覺': '非快速動眼期治療', '累': '慢性疲勞症候群', '開心': '血清素正常分泌',
                '難過': '抑鬱傾向篩查', '生氣': '交感神經過度活化', '煩': '焦慮量表超標',
                '錢': '醫療費用', '沒錢': '健保給付範圍外', '買': '處方籤領藥',
                '手機': '個人通訊輔具', '電腦': '資訊處理輔具', '網路': '遠距醫療通道',
                '遊戲': '認知復健活動', '電影': '視覺刺激治療', '追劇': '連續性注意力訓練',
                '等': '候診佇列', '來': '到院', '去': '轉診',
                '看': '視診', '聽': '聽診', '說': '口述病歷',
                '知道': '醫囑理解度確認', '不知道': '衛教需求評估', '可以': '活動許可',
                '好': '預後良好', '是': '陽性反應', '有': '症狀存在'
            },
            prefixes: ['【病歷紀錄】', '【會診摘要】', '【檢驗報告】', '【處方箋】', '【衛教單張】', '【轉診單】'],
            replyPrefixes: ['【護理回覆】', '【醫師回覆】', '【藥師回覆】'],
            suffixes: ['，建議回診追蹤。', '，請按時服藥。', '，注意副作用。', '，如有不適請立即就醫。']
        },
        
        coder: {
            name: '程式黑話',
            icon: '💻',
            desc: 'Bug、Feature、Commit',
            map: {
                '吃': '攝取(calories)', '吃飯': '執行 eat()', '晚餐': 'evening.meal',
                '午餐': 'lunch.consume()', '早餐': 'breakfast.init()',
                '火鍋': 'hotpot.boil(100°C)', '麻辣': 'spicy.level=MAX', '燒烤': 'bbq.grill()',
                '喝酒': 'alcohol.intoxicate()', '咖啡': 'coffee.brew()', '奶茶': 'milkTea.sugar(100%)',
                '約會': 'date.schedule()', '見面': 'meetup.connect()', '聊天': 'chat.emit(message)',
                '老地方': 'DEFAULT_LOCATION', '等一下': 'setTimeout(cb, 5000)', '馬上': 'Promise.resolve()',
                '八卦': 'gossip.broadcast()', '抱怨': 'throw new Error()', '吐槽': 'console.warn()',
                '機車': 'Exception: AnnoyingPerson', '老闆': 'repo.owner', '主管': 'repo.maintainer',
                '同事': 'collaborator', '同學': 'fellow.coder',
                '男朋友': 'const bf = new Partner()', '女朋友': 'const gf = new Partner()', '曖昧': 'status = undefined',
                '分手': 'relationship.destroy()', '在一起': 'relationship.merge()', '結婚': 'git merge --no-ff',
                '考試': 'unit.test()', '讀書': 'docs.read()', '寫作業': 'homework.commit()',
                '及格': 'test.pass', '不及格': 'test.fail', '滿分': '100% coverage',
                '作弊': 'cheat.copy()', '補考': 'test.retry()', '重修': 'git reset --hard',
                '睡覺': 'system.sleep()', '累': 'CPU.overload', '開心': 'happy === true',
                '難過': 'sad === true', '生氣': 'rage.mode = ON', '煩': 'while(true) annoy()',
                '錢': 'wallet.balance', '沒錢': 'wallet.balance === 0', '買': 'purchase.order()',
                '手機': 'mobile.device', '電腦': 'desktop.device', '網路': 'network.online',
                '遊戲': 'game.play()', '電影': 'video.stream()', '追劇': ' binge.watch()',
                '等': 'await', '來': 'import', '去': 'export',
                '看': 'view.render()', '聽': 'audio.play()', '說': 'speech.synth()',
                '知道': 'knowledge.exists', '不知道': 'knowledge === null', '可以': 'isAllowed',
                '好': 'status === OK', '是': '=== true', '有': '!== null'
            },
            prefixes: ['// TODO:', '// FIXME:', '// NOTE:', '// HACK:', '// REVIEW:', '[COMMIT]'],
            replyPrefixes: ['[REPLY]', '[ACK]', '[LGTM]'],
            suffixes: [' // Works on my machine', ' // TODO: refactor', ' // Breaking change', ' // Ship it!']
        },
        
        poetry: {
            name: '古風文藝',
            icon: '🏮',
            desc: '文言文、詩詞、意境',
            map: {
                '吃': '啖', '吃飯': '用膳', '晚餐': '晚膳', '午餐': '午膳', '早餐': '早膳',
                '火鍋': '紅泥小火爐', '麻辣': '烈火烹油', '燒烤': '炙肉於火',
                '喝酒': '舉杯邀明月', '咖啡': '西式苦茶', '奶茶': '珍珠瓊漿',
                '約會': '月上柳梢頭，人約黃昏後', '見面': '相見時難', '聊天': '剪燭西窗',
                '老地方': '舊時亭臺', '等一下': '少待片刻', '馬上': '即刻',
                '八卦': '街談巷議', '抱怨': '長太息以掩涕', '吐槽': '戲謔之言',
                '機車': '汝甚頑', '老闆': '東家', '主管': '管事',
                '同事': '同僚', '同學': '同窗',
                '男朋友': '良人', '女朋友': '佳人', '曖昧': '眉目傳情',
                '分手': '勞燕分飛', '在一起': '執子之手', '結婚': '結髮為夫妻',
                '睡覺': '夢會周公', '累': '身心俱疲', '開心': '心花怒放',
                '難過': '黯然銷魂', '生氣': '怒髮衝冠', '煩': '不勝其擾',
                '錢': '銀兩', '沒錢': '囊中羞澀', '買': '購置',
                '手機': '千里傳音匣', '電腦': '算盤精', '網路': '千里姻緣一線牽',
                '遊戲': '博弈', '電影': '光影戲', '追劇': '連日觀劇',
                '等': '候', '來': '至', '去': '往',
                '看': '觀', '聽': '聞', '說': '曰',
                '知道': '知之', '不知道': '不知', '可以': '可也',
                '好': '善', '是': '然', '有': '有之'
            },
            prefixes: ['【題記】', '【序】', '【感懷】', '【偶成】', '【即景】', '【贈友人】'],
            replyPrefixes: ['【和詩】', '【回文】', '【應和】'],
            suffixes: ['。嗚呼！', '。奈何！', '。誠如斯言。', '。此景可待成追憶。']
        }
    },
    
    currentTheme: 'office',
    
    // Excel 偽裝模板
    excelTemplates: [
        { type: 'task', cols: ['任務名稱', '負責人', '進度', '備註'] },
        { type: 'meeting', cols: ['會議主題', '與會人', '結論', 'Action Item'] },
        { type: 'budget', cols: ['項目', '預算', '實際', '差異'] },
        { type: 'kpi', cols: ['指標', '目標', '達成', '達成率'] }
    ],
    
    init() {
        this.loadTheme();
        this.chatMode = localStorage.getItem('chat_mode') || 'private';
        
        FriendsModule.init();
        GroupsModule.init();
        
        this.renderContactList();
        
        // 載入上次聊天對象
        if (this.chatMode === 'group') {
            const currentGroup = GroupsModule.getCurrentGroup();
            if (currentGroup) {
                this.loadGroupMessages(currentGroup.id);
                GroupsModule.updateChatHeader(currentGroup);
            } else if (GroupsModule.groups.length > 0) {
                GroupsModule.selectGroup(GroupsModule.groups[0].id);
            }
        } else {
            const currentFriend = FriendsModule.getCurrentFriend();
            if (currentFriend) {
                this.loadFriendMessages(currentFriend.id);
                this.updateChatHeader(currentFriend);
            } else if (FriendsModule.friends.length > 0) {
                FriendsModule.selectFriend(FriendsModule.friends[0].id);
            }
        }
        
        this.bindEvents();
        this.renderThemeSelector();
        this.renderMessages();
    },
    
    renderContactList() {
        if (this.chatMode === 'group') {
            document.getElementById('friend-list-container').style.display = 'none';
            document.getElementById('group-list-container').style.display = 'block';
            GroupsModule.renderGroupList('group-list-container');
            document.getElementById('tab-private').classList.remove('active');
            document.getElementById('tab-group').classList.add('active');
        } else {
            document.getElementById('friend-list-container').style.display = 'block';
            document.getElementById('group-list-container').style.display = 'none';
            FriendsModule.renderFriendList('friend-list-container');
            document.getElementById('tab-private').classList.add('active');
            document.getElementById('tab-group').classList.remove('active');
        }
    },
    
    switchChatMode(mode) {
        this.chatMode = mode;
        localStorage.setItem('chat_mode', mode);
        this.renderContactList();
    },
    
    loadGroupMessages(groupId) {
        const group = GroupsModule.getGroup(groupId);
        if (group) {
            this.messages = group.messages || [];
        }
    },
    
    saveGroupMessages() {
        const group = GroupsModule.getCurrentGroup();
        if (group) {
            group.messages = this.messages.slice(-100);
            GroupsModule.saveGroups();
        }
    },
    
    updateChatHeader(friend) {
        const titleEl = document.getElementById('chat-friend-title');
        const noteEl = document.getElementById('chat-friend-note');
        if (titleEl) {
            titleEl.innerHTML = `
                <span style="font-size:1rem">${friend.codeName}</span>
                <span style="font-size:0.7rem;color:var(--text-muted);margin-left:0.5rem">${FriendsModule.getThemeName(friend.theme)}</span>
            `;
        }
        if (noteEl) {
            noteEl.textContent = friend.realName + (friend.note ? ` · ${friend.note}` : '');
        }
    },
    
    loadFriendMessages(friendId) {
        const friend = FriendsModule.getFriend(friendId);
        if (friend) {
            this.messages = friend.messages || [];
            if (this.messages.length === 0) {
                // 預設訊息
                this.messages = [
                    { id: 1, text: '今晚去吃麻辣鍋？', sender: 'other', time: '14:30', mode: 'normal' },
                    { id: 2, text: '好啊！七點老地方見', sender: 'me', time: '14:32', mode: 'normal' },
                    { id: 3, text: '老闆今天很機車...', sender: 'other', time: '14:35', mode: 'normal' },
                    { id: 4, text: '又怎麼了？', sender: 'me', time: '14:36', mode: 'normal' }
                ];
                friend.messages = this.messages;
                FriendsModule.saveFriends();
            }
            
            // 如果是 Firebase 好友，啟動私聊監聽
            if (friend.firebaseUid && FirebaseClient.currentUser) {
                FirebaseClient.listenPrivateMessages(friend.firebaseUid);
            }
        }
    },
    
    loadTheme() {
        const saved = localStorage.getItem('chat_theme');
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
        }
    },
    
    saveTheme() {
        localStorage.setItem('chat_theme', this.currentTheme);
    },
    
    getCurrentTheme() {
        return this.themes[this.currentTheme] || this.themes.office;
    },
    
    loadMessages() {
        const saved = localStorage.getItem('chat_messages');
        if (saved) {
            this.messages = JSON.parse(saved);
        } else {
            this.messages = [
                { id: 1, text: '今晚去吃麻辣鍋？', sender: 'other', time: '14:30', mode: 'normal' },
                { id: 2, text: '好啊！七點老地方見', sender: 'me', time: '14:32', mode: 'normal' },
                { id: 3, text: '老闆今天很機車...', sender: 'other', time: '14:35', mode: 'normal' },
                { id: 4, text: '又怎麼了？', sender: 'me', time: '14:36', mode: 'normal' }
            ];
        }
    },
    
    saveMessages() {
        if (this.chatMode === 'group') {
            this.saveGroupMessages();
        } else {
            const friend = FriendsModule.getCurrentFriend();
            if (friend) {
                friend.messages = this.messages.slice(-100);
                FriendsModule.saveFriends();
            } else {
                localStorage.setItem('chat_messages', JSON.stringify(this.messages.slice(-100)));
            }
        }
    },
    
    renderThemeSelector() {
        const container = document.querySelector('.chat-modes');
        if (!container) return;
        
        const theme = this.getCurrentTheme();
        
        container.innerHTML = `
            <button class="chat-mode-btn ${this.currentMode === 'normal' ? 'active' : ''}" data-mode="normal">一般</button>
            <button class="chat-mode-btn ${this.currentMode === 'encrypt' ? 'active' : ''}" data-mode="encrypt">
                ${theme.icon} ${theme.name}
            </button>
            <button class="chat-mode-btn ${this.currentMode === 'excel' ? 'active' : ''}" data-mode="excel">📊 Excel</button>
            <button class="chat-mode-btn ${this.currentMode === 'outlook' ? 'active' : ''}" data-mode="outlook">📧 Outlook</button>
        `;
        
        // 主題切換下拉選單
        const themeSelect = document.createElement('select');
        themeSelect.className = 'input-area';
        themeSelect.style.cssText = 'height:36px;padding:0 0.5rem;font-size:0.8rem;background:var(--bg-card);border-radius:20px;border:1px solid var(--border);color:var(--text);width:auto;';
        themeSelect.innerHTML = Object.entries(this.themes).map(([key, t]) => 
            `<option value="${key}" ${this.currentTheme === key ? 'selected' : ''}>${t.icon} ${t.name}</option>`
        ).join('');
        
        themeSelect.addEventListener('change', (e) => {
            this.currentTheme = e.target.value;
            this.saveTheme();
            this.renderThemeSelector();
            this.renderMessages();
        });
        
        container.appendChild(themeSelect);
        
        // 重新綁定模式按鈕
        container.querySelectorAll('.chat-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chat-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                this.renderMessages();
            });
        });
    },
    
    bindEvents() {
        // 發送訊息
        const sendBtn = document.getElementById('chat-send');
        const input = document.getElementById('chat-input');
        
        sendBtn?.addEventListener('click', () => this.sendMessage());
        
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    },
    
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        
        // 如果開啟 AI 加密，先加密文字
        let displayText = text;
        if (this.currentMode === 'encrypt') {
            const encrypted = await this.encryptMessage(text);
            displayText = encrypted;
        }
        
        const msg = {
            id: Date.now(),
            text: text,
            displayText: displayText,
            sender: 'me',
            senderCode: '我',
            time: time,
            mode: this.currentMode
        };
        
        this.messages.push(msg);
        this.saveMessages();
        this.renderMessages();
        input.value = '';
        
        // 如果有 Firebase，嘗試發送
        if (FirebaseClient.db && FirebaseClient.currentUser) {
            // 私聊模式：檢查對方是否有 firebaseUid
            if (this.chatMode === 'private') {
                const friend = FriendsModule.getCurrentFriend();
                if (friend && friend.firebaseUid) {
                    FirebaseClient.sendPrivateMessage(friend.firebaseUid, text, displayText, this.currentMode);
                    return;
                }
            }
            // 群組模式或沒有 firebaseUid 的好友：發送到預設房間
            FirebaseClient.sendRoomMessage('default-room', text, displayText, this.currentMode);
            return;
        }
        
        // 沒有 Firebase，模擬對方回覆
        if (Math.random() > 0.3) {
            setTimeout(() => {
                this.simulateReply();
            }, 1000 + Math.random() * 2000);
        }
    },
    
    async encryptMessage(text) {
        // 優先使用 LLM 加密
        if (LLM.config.enabled) {
            try {
                const result = await LLM.call('encrypt', text);
                return result.text || text;
            } catch (e) {
                console.log('LLM 加密失敗，使用本地規則');
            }
        }
        
        // 本地規則加密
        let encrypted = text;
        const theme = this.getCurrentTheme();
        const sortedKeys = Object.keys(theme.map).sort((a, b) => b.length - a.length);
        
        sortedKeys.forEach(key => {
            encrypted = encrypted.split(key).join(theme.map[key]);
        });
        
        // 加專業包裝
        if (encrypted === text) {
            // 沒有匹配到，加通用包裝
            encrypted = `【同步】${text}，請確認時程並回覆。`;
        } else {
            const prefixes = ['【緊急】', '【同步】', '【確認】', '【評估】', '【追蹤】'];
            const suffixes = ['，請確認時程。', '，待您回覆。', '，已列入追蹤。', '，預計下週產出。', '，請於 EOD 前回覆。'];
            
            if (!encrypted.includes('【')) {
                encrypted = prefixes[Math.floor(Math.random() * prefixes.length)] + encrypted;
            }
            if (!encrypted.endsWith('。')) {
                encrypted += suffixes[Math.floor(Math.random() * suffixes.length)];
            }
        }
        
        return encrypted;
    },
    
    simulateReply() {
        const replies = [
            '收到，稍後確認細節',
            '了解了，感謝告知',
            '好的，我這邊處理',
            '沒問題，晚點聊',
            '嗯嗯，繼續加油',
            '哈哈哈哈',
            '真的假的！',
            '我懂我懂 😂',
            '天啊也太扯',
            '已截圖保存證據',
            '這個可以寫進日記',
            '下次聚餐約起來',
            '保重啊兄弟',
            '需要幫忙嗎？',
            '晚點電話說'
        ];
        
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        
        const rawText = replies[Math.floor(Math.random() * replies.length)];
        let displayText = rawText;
        let senderCode = '對方';
        
        // 決定主題和發送者
        let theme = this.currentTheme;
        
        if (this.chatMode === 'group') {
            const group = GroupsModule.getCurrentGroup();
            if (group && group.members.length > 0) {
                const member = group.members[Math.floor(Math.random() * group.members.length)];
                senderCode = member.codeName;
            }
            theme = group?.theme || theme;
        } else {
            const friend = FriendsModule.getCurrentFriend();
            if (friend) senderCode = friend.codeName;
            theme = friend?.theme || theme;
        }
        
        // 對方回覆也加密
        if (this.currentMode === 'encrypt') {
            const originalTheme = this.currentTheme;
            this.currentTheme = theme;
            displayText = this.localEncrypt(rawText, true);
            this.currentTheme = originalTheme;
        }
        
        const msg = {
            id: Date.now(),
            text: rawText,
            displayText: displayText,
            sender: 'other',
            senderCode: senderCode,
            time: time,
            mode: this.currentMode
        };
        
        this.messages.push(msg);
        this.saveMessages();
        this.renderMessages();
    },
    
    localEncrypt(text, isReply = false) {
        const theme = this.getCurrentTheme();
        
        // 第一步：詞彙替換（長詞優先）
        let encrypted = text;
        const sortedKeys = Object.keys(theme.map).sort((a, b) => b.length - a.length);
        sortedKeys.forEach(key => {
            encrypted = encrypted.split(key).join(theme.map[key]);
        });
        
        // 第二步：判斷處理方式
        const hasReplacement = encrypted !== text;
        const isShort = text.length <= 8;
        const isSimpleConfirm = /^(好|可以|行|沒問題|OK|ok|嗯|哦|喔|對|是|有|知道了|了解|收到|明白|清楚|懂)$/.test(text.replace(/[啊呢吧嗎嗎的得地了~!！?？\s]/g, ''));
        
        if (isSimpleConfirm && hasReplacement) {
            // 簡短確認句：只做詞替換，不加包裝，保持自然
            return encrypted;
        }
        
        if (isShort && hasReplacement) {
            // 短句且有替換：輕微潤色即可
            return this.lightWrap(encrypted, isReply);
        }
        
        if (!hasReplacement) {
            // 完全沒替換到：用模板重組
            encrypted = this.templateEncrypt(text, isReply);
        } else {
            // 有替換的長句：加專業包裝
            encrypted = this.wrapEncrypted(encrypted, isReply);
        }
        
        return encrypted;
    },
    
    // 輕度包裝：短句用，保持自然
    lightWrap(encrypted, isReply) {
        const theme = this.getCurrentTheme();
        
        // 如果已經有標點或【】就不動
        if (/[。！？.!?]$/.test(encrypted) || encrypted.includes('【')) return encrypted;
        
        // 簡單加個語尾，讓它像一句話
        const endings = {
            office: ['，了解。', '，收到。', '，確認。', '，沒問題。'],
            scholar: ['，已記錄。', '，樣本確認。', '，數據吻合。'],
            gamer: ['，收到。', '，OK。', '，+1。'],
            medical: ['，知悉。', '，收到。', '，記錄。'],
            coder: [';', ' // OK', ' // confirmed'],
            poetry: ['。', '，誠然。', '，妙哉。']
        };
        
        const pool = endings[this.currentTheme] || endings.office;
        const ending = pool[Math.floor(Math.random() * pool.length)];
        
        return encrypted + ending;
    },
    
    // 模板加密：即使沒有關鍵詞匹配，也能把日常對話變成主題術語
    templateEncrypt(text, isReply = false) {
        const theme = this.getCurrentTheme();
        const len = text.length;
        const hasQuestion = text.includes('?') || text.includes('？');
        const hasExclaim = text.includes('!') || text.includes('！');
        
        // 根據主題選擇模板風格
        const templates = this.getTemplatesForTheme(theme, text);
        
        let pool;
        if (hasQuestion) pool = templates.question;
        else if (hasExclaim) pool = templates.exclaim;
        else if (len <= 5) pool = templates.short;
        else pool = templates.normal;
        
        return pool[Math.floor(Math.random() * pool.length)];
    },
    
    getTemplatesForTheme(theme, text) {
        const cleanQ = text.replace(/[?？]/g, '');
        const cleanE = text.replace(/[!！]/g, '');
        
        switch(this.currentTheme) {
            case 'scholar':
                return {
                    question: [
                        `【研究問題】關於「${cleanQ}」的因果機制，目前文獻尚無定論，請提出假設。`,
                        `【文獻探討】「${cleanQ}」在相關領域的既有研究為何？請列舉三篇以上參考。`,
                        `【方法論】「${cleanQ}」的變數操作性定義為何？請說明測量工具。`,
                    ],
                    exclaim: [
                        `【研究發現】「${cleanE}」的現象已於實驗中複製，效應量 d=0.82。`,
                        `【突破性進展】關於「${cleanE}」的發現，已被期刊接受發表。`,
                    ],
                    short: [
                        `【備註】${text}，已記錄於實驗日誌。`,
                        `【簡答】${text}，樣本數不足，待擴大。`,
                    ],
                    normal: [
                        `【文獻綜述】關於「${text}」的學術脈絡可追溯至1980年代，現今已成為顯學。`,
                        `【實驗紀錄】「${text}」的觀察結果顯示顯著相關（r=0.67, p<0.01）。`,
                        `【理論架構】「${text}」可歸類於社會建構論典範，與符號互動論相呼應。`,
                    ]
                };
            case 'gamer':
                return {
                    question: [
                        `【任務提示】關於「${cleanQ}」的攻略，請查閱Wiki或詢問老玩家。`,
                        `【副本指引】「${cleanQ}」的掉落率是多少？有人刷出過嗎？`,
                    ],
                    exclaim: [
                        `【系統廣播】「${cleanE}」！全服玩家注意，稀有事件觸發！`,
                        `【成就解鎖】恭喜達成「${cleanE}」成就，獲得傳說裝備！`,
                    ],
                    short: [
                        `【快捷訊息】${text}，收到。`,
                        `【隊伍頻道】${text}，補師跟上。`,
                    ],
                    normal: [
                        `【副本紀錄】關於「${text}」的攻略，建議帶齊火抗裝，BOSS會放AOE。`,
                        `【裝備評測】「${text}」這把武器的DPS計算後發現不如預期，建議分解。`,
                        `【公會公告】「${text}」活動將於今晚八點開啟，請準時上線組隊。`,
                    ]
                };
            case 'medical':
                return {
                    question: [
                        `【會診申請】關於「${cleanQ}」的鑑別診斷，需要進一步影像學檢查。`,
                        `【病歷查詢】「${cleanQ}」的既往病史為何？請調閱歷次就診紀錄。`,
                    ],
                    exclaim: [
                        `【急診通報】「${cleanE}」！生命徵象不穩定，立即啟動急救流程！`,
                        `【檢驗異常】「${cleanE}」的數值超出參考範圍三倍，請複檢確認。`,
                    ],
                    short: [
                        `【護理紀錄】${text}，生命徵象穩定。`,
                        `【醫囑】${text}，按時服藥。`,
                    ],
                    normal: [
                        `【病歷摘要】關於「${text}」的主訴，初步診斷為功能性疾患，建議門診追蹤。`,
                        `【衛教指導】「${text}」的預後良好，請維持健康生活型態，三個月後回診。`,
                        `【轉診說明】「${text}」的症狀已超出本院處理範圍，建議轉介醫學中心。`,
                    ]
                };
            case 'coder':
                return {
                    question: [
                        `// TODO: 關於「${cleanQ}」的實現邏輯，需要進一步釐清需求。`,
                        `// QUESTION: 「${cleanQ}」這個edge case要怎麼handle？`,
                    ],
                    exclaim: [
                        `// FIXME: 「${cleanE}」！這個bug prod炸掉了！`,
                        `// URGENT: 「${cleanE}」CI/CD pipeline挂了，全組on call！`,
                    ],
                    short: [
                        `// NOTE: ${text}，已記錄。`,
                        `// ACK: ${text}，LGTM。`,
                    ],
                    normal: [
                        `// 關於「${text}」的功能，建議拆成microservice，避免single point of failure。`,
                        `「${text}」的這個需求，工時評估需要3個sprint，建議先出MVP。`,
                        `「${text}」已經deploy到staging了，請QA測一下regression。`,
                    ]
                };
            case 'poetry':
                return {
                    question: [
                        `【問】${cleanQ}，何以解憂？惟有杜康。`,
                        `【探問】${cleanQ}，山川異域，風月同天。`,
                    ],
                    exclaim: [
                        `【感懷】${cleanE}！大江東去，浪淘盡，千古風流人物。`,
                        `【驚嘆】${cleanE}！會當凌絕頂，一覽眾山小。`,
                    ],
                    short: [
                        `【應和】${text}，妙哉。`,
                        `【回文】${text}，誠然。`,
                    ],
                    normal: [
                        `【即景】${text}，春風得意馬蹄疾，一日看盡長安花。`,
                        `【贈言】${text}，海內存知己，天涯若比鄰。`,
                        `【感懷】${text}，人生得意須盡歡，莫使金樽空對月。`,
                    ]
                };
            default: // office
                return {
                    question: [
                        `【需求確認】關於「${cleanQ}」的執行細節，請於今日下班前提供可行性評估。`,
                        `【追蹤】針對「${cleanQ}」的進度，目前狀態為待確認，請同步最新資訊。`,
                        `【詢問】有關「${cleanQ}」的相關規劃，是否已納入本週優先處理項目？`,
                    ],
                    exclaim: [
                        `【通知】「${cleanE}」的相關事項已列入高優先處理，請相關單位留意。`,
                        `【更新】關於「${cleanE}」的執行狀態，目前進度符合預期。`,
                    ],
                    short: [
                        `【簡短回覆】${text}，已記錄於系統。`,
                        `【收到】${text}，相關單位已同步。`,
                    ],
                    normal: [
                        `【會議紀錄】關於「${text}」的討論內容，已彙整並列入下週行動項目追蹤。`,
                        `【進度更新】「${text}」的執行狀況，目前處於正常推進階段，無異常回報。`,
                        `【內部通報】「${text}」相關資訊已於今日同步至各部門，請查閱附件。`,
                        `【專案評估】針對「${text}」的可行性分析，初步評估結果為正向，建議持續跟進。`,
                    ]
                };
        }
    },
    
    // 給已加密的句子加上專業包裝
    wrapEncrypted(encrypted, isReply = false) {
        const theme = this.getCurrentTheme();
        
        // 如果已經有【】或 // 就不要再加
        if (encrypted.includes('【') || encrypted.startsWith('//')) return encrypted;
        
        const prefix = isReply 
            ? theme.replyPrefixes[Math.floor(Math.random() * theme.replyPrefixes.length)]
            : theme.prefixes[Math.floor(Math.random() * theme.prefixes.length)];
        
        const suffix = theme.suffixes[Math.floor(Math.random() * theme.suffixes.length)];
        
        // 如果句子已經有標點結尾，就不加後綴
        const hasEnding = /[。！？.!?]$/.test(encrypted);
        
        return prefix + encrypted + (hasEnding ? '' : suffix);
    },
    
    transformForMode(msg) {
        // 加密模式：優先使用已保存的加密版本，否則實時加密
        if (this.currentMode === 'encrypt') {
            if (msg.displayText && msg.mode === 'encrypt') {
                return msg.displayText;
            }
            // 對於沒有加密過的消息（預設消息 / 其他模式的消息），實時加密
            return this.localEncrypt(msg.text);
        }
        
        const text = msg.displayText || msg.text;
        
        switch(this.currentMode) {
            case 'excel':
                return this.toExcelFormat(text, msg.sender);
            case 'outlook':
                return this.toOutlookFormat(text, msg.sender);
            default:
                return msg.text; // 一般模式一律顯示原文
        }
    },
    
    toExcelFormat(text, sender) {
        const templates = ['任務', '會議', '報告', '追蹤'];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const status = sender === 'me' ? '進行中' : '待確認';
        const priority = ['高', '中', '低'][Math.floor(Math.random() * 3)];
        
        return `<span style="font-family:monospace;font-size:0.8rem">
            <span style="color:#217346">[${template}]</span> 
            ${text.substring(0, 20)}${text.length > 20 ? '...' : ''} 
            <span style="color:${status === '進行中' ? '#28a745' : '#ffc107'}">${status}</span> 
            <span style="color:${priority === '高' ? '#dc3545' : '#6c757d'}">P${priority}</span>
        </span>`;
    },
    
    toOutlookFormat(text, sender) {
        const from = sender === 'me' ? '我' : '同事A';
        const subjects = ['RE: 進度同步', 'FW: 會議紀錄', 'RE: 專案更新', 'FW: 需求確認'];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        
        return `<span style="font-size:0.8rem">
            <span style="color:#0078d4;font-weight:600">${from}</span> 
            <span style="color:#666">${subject}</span><br>
            <span style="color:#999;font-size:0.75rem">${text.substring(0, 30)}${text.length > 30 ? '...' : ''}</span>
        </span>`;
    },
    
    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        if (this.currentMode === 'excel' || this.currentMode === 'outlook') {
            this.renderAsList(container);
        } else {
            this.renderAsChat(container);
        }
        
        container.scrollTop = container.scrollHeight;
    },
    
    renderAsChat(container) {
        container.innerHTML = this.messages.map(msg => {
            const displayText = this.transformForMode(msg);
            const isEncrypted = this.currentMode === 'encrypt';
            
            // 決定顯示名稱
            let showName = msg.sender === 'me' ? (msg.senderCode || '我') : (msg.senderCode || '對方');
            
            return `
                <div class="msg ${msg.sender === 'me' ? 'sent' : 'received'}" 
                     style="${isEncrypted ? 'background:linear-gradient(135deg,#6c5ce7,#a29bfe)' : ''}">
                    <div style="font-size:0.7rem;opacity:0.7;margin-bottom:0.2rem">${showName}</div>
                    <div>${this.escapeHtml(displayText)}</div>
                    <div class="msg-time">
                        ${msg.time}
                        ${isEncrypted ? '<span style="margin-left:4px">🔒</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    renderAsList(container) {
        // Excel/Outlook 模式用列表呈現
        const items = this.messages.map((msg, i) => {
            const displayText = this.transformForMode(msg);
            return `
                <div style="padding:0.6rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:0.5rem">
                    <span style="font-size:0.75rem;color:var(--text-muted);min-width:35px">${msg.time}</span>
                    <span style="font-size:0.75rem;color:var(--primary);min-width:40px">${msg.sender === 'me' ? '我' : '同事'}</span>
                    <span style="flex:1;font-size:0.85rem">${displayText}</span>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden">
                <div style="background:var(--bg-card-hover);padding:0.5rem 0.8rem;font-size:0.8rem;font-weight:600;border-bottom:1px solid var(--border)">
                    ${this.currentMode === 'excel' ? '📊 工作項目清單' : '📧 郵件列表'}
                </div>
                ${items}
            </div>
        `;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    clearChat() {
        this.messages = [];
        this.saveMessages();
        this.renderMessages();
    },
    
    // 接收即時訊息（從 Socket）
    receiveMessage(msg) {
        this.messages.push(msg);
        this.saveMessages();
        this.renderMessages();
        
        // 震動提示
        const myName = FirebaseClient?.myCodeName || SocketClient?.myCodeName || '我';
        if (navigator.vibrate && msg.sender !== myName) {
            navigator.vibrate(50);
        }
    },
    
    // 接收私聊訊息
    receivePrivateMessage(msg) {
        // 如果是新的私聊對象，創建/切換
        const myName2 = FirebaseClient?.myCodeName || SocketClient?.myCodeName || '我';
        if (msg.sender === myName2) return; // 忽略自己發的
        
        let friend = FriendsModule.friends.find(f => f.firebaseUid === msg.senderUid);
        if (!friend) {
            friend = FriendsModule.friends.find(f => f.codeName === msg.sender);
        }
        if (!friend) {
            // 自動添加為好友（帶 firebaseUid）
            friend = FriendsModule.addFriend(msg.sender, msg.sender, '線上認識', 'office', msg.senderUid);
        }
        
        // 如果當前正在和這個好友聊天，直接顯示
        const currentFriend = FriendsModule.getCurrentFriend();
        if (currentFriend && currentFriend.id === friend.id) {
            this.messages.push(msg);
            this.saveMessages();
            this.renderMessages();
        } else {
            // 否則把訊息存到好友的 messages 中
            if (!friend.messages) friend.messages = [];
            friend.messages.push(msg);
            FriendsModule.saveFriends();
            
            // 顯示未讀提示
            FirebaseClient.showToast?.(`${msg.sender}: ${msg.text}`, 'info');
        }
        
        // 震動提示
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    },
    
    // 開始私聊
    startPrivateChat(codeName) {
        // 切換到私聊模式
        this.switchChatMode('private');
        
        // 查找或創建好友
        let friend = FriendsModule.friends.find(f => f.codeName === codeName);
        if (!friend) {
            friend = FriendsModule.addFriend(codeName, codeName, '線上好友', 'office');
        }
        
        FriendsModule.selectFriend(friend.id);
    }
};

window.ChatModule = ChatModule;
