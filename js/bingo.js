/**
 * 職場黑話 Bingo v2
 * 會議中抓取廢話關鍵字，連線贏咖啡
 */

const BingoModule = {
    // 豐富的黑話詞庫（分類）
    wordPool: {
        strategy: ['賦能', '抓手', '顆粒度', '閉環', '底層邏輯', '頂層設計', '方法論', '戰略', '佈局', '打法'],
        growth: ['紅利', '藍海', '風口', '賽道', '天花板', '護城河', '壁壘', '生態', '矩陣', '裂變'],
        operation: ['對齊', '落地', '迭代', '沉澱', '複用', '協同', '串聯', '打通', '閉環', '復盤'],
        analysis: ['痛點', '癢點', '爽點', '心智', '場域', '價值鏈', '顆粒度', '維度', '層面', '角度'],
        bullshit: ['顛覆', '重構', '重塑', '引爆', '破局', '造勢', '造風', '顛覆式', '顛覆性', '顛覆者'],
        newage: ['元宇宙', 'Web3', 'AI賦能', '數位轉型', '敏捷', '精益', '增長黑客', '私域', '公域', '流量池'],
        meeting: ['同步', '對焦', '拉通', '碰一下', '過一下', '盤一下', '對一下', '碰個頭', '快速過', '拉個會'],
        vague: ['等等', '之類的', '那個', '這個', '基本上', '原則上', '理論上', '一般來說', '大方向上', '整體來說']
    },
    
    // 獎勵配置
    prizes: [
        { lines: 1, icon: '☕', name: '一杯咖啡', desc: '去買杯咖啡犒賞自己！' },
        { lines: 2, icon: '🍰', name: '下午茶點心', desc: '今天可以吃甜點！' },
        { lines: 3, icon: '🍕', name: '豪華午餐', desc: '中午吃頓好的！' },
        { lines: 4, icon: '🏖️', name: '提早下班', desc: '今天可以準時走人！' },
        { lines: 5, icon: '👑', name: '職場王者', desc: '你已經免疫所有黑話了！' },
        { lines: 8, icon: '🦄', name: '黑話之神', desc: '傳說級成就達成！' }
    ],
    
    grid: [],
    marked: new Set(),
    isListening: false,
    recognition: null,
    currentBingoLines: 0,
    
    init() {
        this.loadState();
        this.renderGrid();
        this.bindEvents();
        this.updateStatus();
        this.renderWordLibrary();
    },
    
    loadState() {
        const saved = localStorage.getItem('bingo_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.grid = state.grid || [];
            this.marked = new Set(state.marked || []);
            this.currentBingoLines = state.bingoLines || 0;
        }
        if (this.grid.length === 0) {
            this.newGrid();
        }
    },
    
    saveState() {
        localStorage.setItem('bingo_state', JSON.stringify({
            grid: this.grid,
            marked: Array.from(this.marked),
            bingoLines: this.currentBingoLines
        }));
    },
    
    getAllWords() {
        return Object.values(this.wordPool).flat();
    },
    
    newGrid() {
        const allWords = this.getAllWords();
        const shuffled = [...allWords].sort(() => Math.random() - 0.5);
        this.grid = shuffled.slice(0, 9);
        this.marked.clear();
        this.currentBingoLines = 0;
        this.saveState();
        this.renderGrid();
        this.updateStatus();
        this.hidePrize();
    },
    
    renderGrid() {
        const container = document.getElementById('bingo-grid');
        if (!container) return;
        
        container.innerHTML = this.grid.map((word, i) => {
            const isMarked = this.marked.has(i);
            return `<div class="bingo-cell ${isMarked ? 'marked' : ''}" data-index="${i}">${word}</div>`;
        }).join('');
        
        container.querySelectorAll('.bingo-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                this.toggleCell(parseInt(cell.dataset.index));
            });
            
            // 長按顯示解釋
            let pressTimer;
            cell.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.showWordMeaning(cell.textContent);
                }, 800);
            });
            cell.addEventListener('touchend', () => clearTimeout(pressTimer));
            cell.addEventListener('touchcancel', () => clearTimeout(pressTimer));
        });
        
        this.checkBingo();
    },
    
    toggleCell(index) {
        if (this.marked.has(index)) {
            this.marked.delete(index);
        } else {
            this.marked.add(index);
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (cell) {
                cell.style.transform = 'scale(1.2)';
                setTimeout(() => cell.style.transform = '', 200);
            }
        }
        this.saveState();
        this.renderGrid();
        this.updateStatus();
    },
    
    markWord(word) {
        const index = this.grid.findIndex(w => w === word);
        if (index !== -1 && !this.marked.has(index)) {
            this.marked.add(index);
            this.saveState();
            this.renderGrid();
            this.updateStatus();
            this.showDiscoverToast(word);
            return true;
        }
        return false;
    },
    
    showDiscoverToast(word) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success);
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 50px;
            font-weight: 600;
            z-index: 2000;
            animation: slideDown 0.4s ease;
            box-shadow: 0 4px 15px rgba(0,184,148,0.4);
        `;
        toast.textContent = `🎯 抓到「${word}」！`;
        document.body.appendChild(toast);
        
        if (navigator.vibrate) navigator.vibrate(50);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }, 2000);
    },
    
    showWordMeaning(word) {
        const meanings = {
            '賦能': '給你更多工作但美其名曰給你能力',
            '抓手': '不知道怎麼做時找的切入點',
            '顆粒度': '講細節講到讓人想睡覺的程度',
            '閉環': '事情繞一圈回到原點但覺得很厲害',
            '底層邏輯': '其實就是最基本的道理',
            '對齊': '開會開到大家都累就對了',
            '打法': '怎麼做都行但講出來要有氣勢',
            '矩陣': '把簡單的事情搞得很複雜',
            '生態': '一堆東西湊在一起不管有沒有用',
            '賽道': '選一個風口準備被吹走',
            '痛點': '用戶困擾但我們不一定想解決',
            '沉澱': '累積了一堆沒人看的文件',
            '複用': '同一份東西到處貼',
            '協同': '本來一個人做的事變成三個人做',
            '落地': '終於要開始做但不知道做不做得到',
            '迭代': '做爛了沒關係再做一次',
            '心智': '讓你不知不覺被洗腦',
            '場域': '換個地方開會但內容一樣',
            '價值鏈': '畫一條線把大家串起來',
            '壁壘': '讓別人進不來的高牆',
            '紅利': '趁大家還沒發現趕快撈',
            '藍海': '沒人做的市場因為根本沒人要做',
            '風口': '豬都能飛但風停了會摔死',
            '顛覆': '把別人做過的事再講一次',
            '裂變': '像病毒一樣傳染開來',
            '引爆': '花很多錢讓大家知道',
            '天花板': '上不去但也不想下來',
            '護城河': '挖一條溝讓別人過不來',
            '頂層設計': '老闆想的但底下做不出來',
            '方法論': '一套聽起來很厲害的廢話',
            '元宇宙': '戴VR眼鏡的線上會議',
            '數位轉型': '把紙本文件變成PDF',
            '敏捷': '每天開站會但進度還是delay',
            '私域': '偷偷加客戶微信',
            '流量池': '到處貼廣告騙點擊'
        };
        
        const meaning = meanings[word] || '職場必備術語，聽不懂就輸了';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(5px);
            z-index: 2500;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.2s ease;
        `;
        overlay.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius);padding:1.5rem;max-width:300px;width:100%;border:1px solid var(--border);text-align:center">
                <div style="font-size:2rem;margin-bottom:0.5rem">📖</div>
                <div style="font-size:1.2rem;font-weight:600;margin-bottom:0.5rem">${word}</div>
                <div style="color:var(--text-muted);line-height:1.5;font-size:0.9rem">${meaning}</div>
                <button class="btn-primary" style="margin-top:1rem" onclick="this.closest('.fixed-overlay').remove()">知道了</button>
            </div>
        `;
        overlay.className = 'fixed-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    },
    
    checkBingo() {
        const lines = [
            [0,1,2], [3,4,5], [6,7,8], // 橫
            [0,3,6], [1,4,7], [2,5,8], // 直
            [0,4,8], [2,4,6]           // 斜
        ];
        
        let bingoCount = 0;
        const bingoCells = new Set();
        
        lines.forEach(line => {
            if (line.every(i => this.marked.has(i))) {
                bingoCount++;
                line.forEach(i => bingoCells.add(i));
            }
        });
        
        // 標記連線格子
        bingoCells.forEach(i => {
            const cell = document.querySelector(`[data-index="${i}"]`);
            if (cell) cell.classList.add('bingo-line');
        });
        
        // 檢查新連線
        if (bingoCount > this.currentBingoLines) {
            const newLines = bingoCount - this.currentBingoLines;
            this.currentBingoLines = bingoCount;
            this.saveState();
            this.showBingoCelebration(newLines);
        }
        
        if (bingoCount > 0) {
            this.showPrize(bingoCount);
        }
        
        return bingoCount;
    },
    
    showBingoCelebration(newLines) {
        // 震動
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        // 慶祝畫面
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(108,92,231,0.3);
            backdrop-filter: blur(5px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        overlay.innerHTML = `
            <div style="text-align:center;animation:bounce 0.6s ease">
                <div style="font-size:5rem">🎉</div>
                <div style="font-size:1.5rem;font-weight:700;color:white;margin-top:1rem;text-shadow:0 2px 10px rgba(0,0,0,0.5)">
                    BINGO！
                </div>
                <div style="color:white;margin-top:0.5rem;text-shadow:0 1px 5px rgba(0,0,0,0.5)">
                    連成 ${this.currentBingoLines} 條線！
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(() => overlay.remove(), 500);
        }, 2000);
    },
    
    showPrize(count) {
        const prize = document.getElementById('bingo-prize');
        if (!prize) return;
        
        const prizeInfo = this.prizes.find(p => count >= p.lines) || this.prizes[this.prizes.length - 1];
        
        prize.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:0.3rem;animation:bounce 2s infinite">${prizeInfo.icon}</div>
            <div style="font-weight:600;color:var(--warning);font-size:1.1rem">${prizeInfo.name}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.3rem">${prizeInfo.desc}</div>
            <div style="font-size:0.75rem;color:var(--success);margin-top:0.5rem">
                ✨ 已連成 ${count} 條線！
            </div>
        `;
        prize.classList.remove('locked');
        prize.classList.add('unlocked');
    },
    
    hidePrize() {
        const prize = document.getElementById('bingo-prize');
        if (!prize) return;
        
        prize.innerHTML = `
            <div style="font-size:2rem;margin-bottom:0.3rem">☕</div>
            <div style="font-weight:600">贏得獎勵！</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem">
                連成一條線即可解鎖
            </div>
        `;
        prize.classList.add('locked');
        prize.classList.remove('unlocked');
    },
    
    updateStatus() {
        const count = document.getElementById('bingo-count');
        const lines = document.getElementById('bingo-lines');
        if (count) count.textContent = `${this.marked.size}/9`;
        if (lines) lines.textContent = this.currentBingoLines;
    },
    
    renderWordLibrary() {
        // 如果頁面有詞庫顯示區，渲染分類詞庫
        const libContainer = document.getElementById('bingo-library');
        if (!libContainer) return;
        
        const categories = {
            strategy: '戰略類',
            growth: '成長類',
            operation: '營運類',
            analysis: '分析類',
            bullshit: '唬爛類',
            newage: '新創類',
            meeting: '會議類',
            vague: '模糊類'
        };
        
        libContainer.innerHTML = Object.entries(this.wordPool).map(([key, words]) => `
            <div style="margin-bottom:0.8rem">
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.3rem">${categories[key]}</div>
                <div style="display:flex;flex-wrap:wrap;gap:0.3rem">
                    ${words.map(w => `<span style="background:var(--bg);padding:0.2rem 0.5rem;border-radius:10px;font-size:0.75rem">${w}</span>`).join('')}
                </div>
            </div>
        `).join('');
    },
    
    bindEvents() {
        document.getElementById('btn-new-bingo')?.addEventListener('click', () => {
            this.newGrid();
        });
        
        document.getElementById('btn-voice')?.addEventListener('click', () => {
            this.toggleVoice();
        });
    },
    
    toggleVoice() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('您的瀏覽器不支援語音辨識，請手動點擊 Bingo 格子\n\n建議使用 Chrome 或 Edge 瀏覽器');
            return;
        }
        
        if (this.isListening) {
            this.stopVoice();
        } else {
            this.startVoice();
        }
    },
    
    startVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-TW';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        this.isListening = true;
        const btn = document.getElementById('btn-voice');
        const status = document.getElementById('voice-status');
        
        btn.textContent = '⏹️ 停止監聽';
        btn.style.background = 'var(--danger)';
        status.innerHTML = '🎙️ 正在監聽會議...<br><span style="font-size:0.75rem">聽到黑話會自動標記</span>';
        
        let debounceTimer;
        
        this.recognition.onresult = (event) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    const allWords = this.getAllWords();
                    
                    allWords.forEach(word => {
                        if (transcript.includes(word)) {
                            if (this.markWord(word)) {
                                status.innerHTML = `🎯 抓到「${word}」！<br><span style="font-size:0.75rem">繼續監聽中...</span>`;
                            }
                        }
                    });
                }
            }, 500);
        };
        
        this.recognition.onerror = (event) => {
            console.log('語音錯誤:', event.error);
            if (event.error !== 'no-speech') {
                status.textContent = '⚠️ 語音辨識發生錯誤，請重試';
            }
        };
        
        this.recognition.onend = () => {
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch(e) {
                    console.warn('[Bingo] SpeechRecognition restart failed:', e);
                    this.isListening = false;
                    const status = document.getElementById('bingo-voice-status');
                    if (status) status.textContent = '⚠️ 語音辨識已停止，請重新開始';
                }
            }
        };
        
        try {
            this.recognition.start();
        } catch(e) {
            status.textContent = '⚠️ 無法啟動語音辨識';
            this.isListening = false;
        }
    },
    
    stopVoice() {
        this.isListening = false;
        if (this.recognition) {
            try { this.recognition.stop(); } catch(e) {}
        }
        
        const btn = document.getElementById('btn-voice');
        const status = document.getElementById('voice-status');
        
        btn.textContent = '🎙️ 開始監聽會議';
        btn.style.background = '';
        status.textContent = '';
    }
};

window.BingoModule = BingoModule;
