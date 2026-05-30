/**
 * 情緒防護罩翻譯機 v2
 * 把主管的謾罵轉化為純粹的待辦事項
 * 支援 LLM 智能分析 & 本地規則 fallback
 */

const ShieldModule = {
    stats: { count: 0, fire: 0, saved: 0 },
    history: [],
    isProcessing: false,
    
    init() {
        this.loadData();
        this.bindEvents();
        this.updateStatsUI();
        this.renderHistory();
    },
    
    loadData() {
        try {
            const stats = localStorage.getItem('shield_stats');
            if (stats) this.stats = JSON.parse(stats);
        } catch { localStorage.removeItem('shield_stats'); }
        try {
            const history = localStorage.getItem('shield_history');
            if (history) this.history = JSON.parse(history);
        } catch { localStorage.removeItem('shield_history'); }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    },
    
    saveData() {
        localStorage.setItem('shield_stats', JSON.stringify(this.stats));
        localStorage.setItem('shield_history', JSON.stringify(this.history.slice(-20)));
    },
    
    updateStatsUI() {
        const countEl = document.getElementById('shield-count');
        const fireEl = document.getElementById('shield-fire');
        const savedEl = document.getElementById('shield-saved');
        if (countEl) countEl.textContent = this.stats.count;
        if (fireEl) fireEl.textContent = this.stats.fire;
        if (savedEl) savedEl.textContent = this.stats.saved;
    },
    
    bindEvents() {
        const translateBtn = document.getElementById('btn-translate');
        const input = document.getElementById('shield-input');
        
        translateBtn?.addEventListener('click', () => this.translate());
        
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.translate();
        });
        
        // 快速輸入標籤
        document.querySelectorAll('.quick-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                input.value = tag.dataset.text;
                this.translate();
            });
        });
    },
    
    async translate() {
        const input = document.getElementById('shield-input');
        const text = input.value.trim();
        if (!text || this.isProcessing) return;
        
        this.isProcessing = true;
        const btn = document.getElementById('btn-translate');
        const originalText = btn.textContent;
        btn.textContent = '🔄 分析中...';
        btn.disabled = true;
        
        try {
            // 呼叫 LLM 接口
            const result = await LLM.call('shield', text);
            this.renderResult(result, text);
            
            // 更新統計
            this.stats.count++;
            this.stats.fire += result.fireLevel || 1;
            this.stats.saved += (result.todos?.length || 0);
            this.saveData();
            this.updateStatsUI();
            
            // 加入歷史
            this.history.push({
                original: text,
                result: result,
                time: new Date().toISOString()
            });
            this.saveData();
            this.renderHistory();
            
        } catch (err) {
            console.error('翻譯失敗:', err);
            this.renderError('分析失敗，請檢查 LLM 設定或網路連線');
        } finally {
            this.isProcessing = false;
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },
    
    renderResult(result, originalText) {
        const container = document.getElementById('shield-result');
        if (!container) return;
        
        const fireLevel = result.fireLevel || 1;
        const flames = '🔥'.repeat(fireLevel) + '⚪'.repeat(Math.max(0, 5 - fireLevel));
        
        const fireColors = ['#00b894', '#fdcb6e', '#e17055', '#d63031', '#6c5ce7'];
        const fireColor = fireColors[Math.min(fireLevel - 1, 4)];
        
        const hints = [
            '建議：泡杯茶，深呼吸三次 🍵',
            '建議：起來走動一下，看看窗外 🌳',
            '建議：跟同事吐個槽再繼續 ☕',
            '建議：默數到十，想像主管穿睡衣的樣子 😴',
            '建議：立刻離開座位，去洗手間冷靜 🚿'
        ];
        
        const comfort = result.comfort || hints[Math.min(fireLevel - 1, 4)];
        const todos = result.todos || ['釐清具體需求', '評估現有資源', '制定行動計畫'];
        const suggestions = result.suggestions || ['保持冷靜，理性回應'];
        
        // 判斷來源
        const sourceBadge = result.source === 'openai' || result.source === 'claude' || result.source === 'custom'
            ? '<span style="background:var(--primary);color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;margin-left:0.5rem">🤖 AI</span>'
            : '<span style="background:var(--bg-card-hover);color:var(--text-muted);padding:2px 8px;border-radius:10px;font-size:0.7rem;margin-left:0.5rem">🧠 本地</span>';
        
        const html = `
            <div class="result-box" style="animation:fadeIn 0.4s ease">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.8rem">
                    <div style="font-weight:600;color:var(--success);display:flex;align-items:center">
                        📋 已淨化待辦事項
                        ${sourceBadge}
                    </div>
                    <button class="btn-text" onclick="ShieldModule.copyTodos()" style="font-size:0.8rem">📋 複製</button>
                </div>
                <ol id="shield-todos" style="padding-left:1.2rem;line-height:1.8;margin:0">
                    ${todos.map((t, i) => `<li style="margin-bottom:0.3rem">${t}</li>`).join('')}
                </ol>
                
                <div class="emotion-meter" style="margin-top:1rem">
                    <span class="emotion-label">原始情緒強度：</span>
                    <span class="emotion-flames" style="color:${fireColor}">${flames}</span>
                    <span style="font-size:0.8rem;color:var(--text-muted);margin-left:0.5rem">${fireLevel}/5</span>
                </div>
                
                <div class="emotion-hint" style="margin-top:0.5rem;padding:0.6rem;background:rgba(108,92,231,0.1);border-radius:8px">
                    💚 ${comfort}
                </div>
                
                <div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid var(--border)">
                    ${suggestions.map(s => `<div style="font-size:0.8rem;margin-bottom:0.3rem;color:var(--text-muted)">${s}</div>`).join('')}
                </div>
                
                <div style="margin-top:0.8rem;display:flex;gap:0.5rem">
                    <button class="btn-secondary" style="flex:1;font-size:0.85rem" onclick="ShieldModule.shareResult()">
                        📤 分享淨化結果
                    </button>
                    <button class="btn-secondary" style="flex:1;font-size:0.85rem" onclick="ShieldModule.addToCalendar()">
                        📅 加入行事曆
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    renderError(msg) {
        const container = document.getElementById('shield-result');
        if (!container) return;
        container.innerHTML = `
            <div class="result-box" style="border-left-color:var(--danger)">
                <div style="color:var(--danger);font-weight:600">⚠️ ${msg}</div>
                <div style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-muted)">
                    提示：你可以在「設定」頁面開啟 Mock 模式，無需 API 金鑰即可使用本地規則。
                </div>
            </div>
        `;
    },
    
    renderHistory() {
        // 在頁面底部添加歷史記錄區域（如果存在）
        const historyContainer = document.getElementById('shield-history');
        if (!historyContainer || this.history.length === 0) return;
        
        historyContainer.innerHTML = `
            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem">最近防護記錄</div>
            ${this.history.slice(-5).reverse().map(h => `
                <div style="padding:0.5rem;background:var(--bg);border-radius:8px;margin-bottom:0.4rem;font-size:0.8rem">
                    <div style="color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.escapeHtml(h.original)}</div>
                    <div style="color:var(--success);margin-top:0.2rem">→ ${this.escapeHtml(h.result.todos?.[0] || '已淨化')}</div>
                </div>
            `).join('')}
        `;
    },
    
    copyTodos() {
        const todosEl = document.getElementById('shield-todos');
        if (!todosEl) return;
        
        const text = Array.from(todosEl.querySelectorAll('li')).map(li => li.textContent).join('\n');
        navigator.clipboard?.writeText(text).then(() => {
            alert('待辦清單已複製到剪貼簿！');
        }).catch(() => {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('待辦清單已複製！');
        });
    },
    
    shareResult() {
        const todosEl = document.getElementById('shield-todos');
        if (!todosEl) return;
        
        const text = '🛡️ 職場情緒防護罩淨化結果\n\n' + 
            Array.from(todosEl.querySelectorAll('li')).map((li, i) => `${i+1}. ${li.textContent}`).join('\n') +
            '\n\n#職場生存工具';
        
        if (navigator.share) {
            navigator.share({ title: '職場情緒防護罩', text });
        } else {
            navigator.clipboard?.writeText(text).then(() => alert('已複製分享內容！'));
        }
    },
    
    addToCalendar() {
        const todosEl = document.getElementById('shield-todos');
        if (!todosEl) return;
        
        const todos = Array.from(todosEl.querySelectorAll('li')).map(li => li.textContent);
        const title = encodeURIComponent('[職場防護罩] 待辦事項');
        const details = encodeURIComponent(todos.join('\n'));
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const format = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${format(now)}/${format(tomorrow)}`;
        window.open(url, '_blank');
    }
};

window.ShieldModule = ShieldModule;
