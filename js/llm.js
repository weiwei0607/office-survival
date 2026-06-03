/**
 * LLM 接口模組
 * 統一管理 AI 呼叫：Mock 模式 / OpenAI / Claude / 自定義 API
 */

const LLM = {
    config: {
        provider: 'gemini',     // 'mock' | 'gemini' | 'openai' | 'claude' | 'custom'
        apiKey: '',
        apiUrl: '',
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 500,
        enabled: false
    },
    
    // 統一 Prompt 模板
    prompts: {
        shield: `你是一個「職場情緒防護罩」。請將使用者的輸入轉化為純粹的待辦事項清單。

規則：
1. 完全剔除所有情緒化、攻擊性、貶低的字眼
2. 提取核心任務，條列為具體可執行的待辦事項（3-5項）
3. 用溫和但專業的語氣
4. 評估原始訊息的情緒強度（1-5分）
5. 給予一個簡短的安慰建議

輸出格式（嚴格使用以下 JSON）：
{
  "todos": ["待辦1", "待辦2", ...],
  "fireLevel": 1-5,
  "suggestions": ["建議1", "建議2"],
  "comfort": "一句溫暖的安慰話"
}

用戶輸入：{{input}}`,

        encrypt: `你是一個「職場術語加密器」。請將日常對話轉化為聽起來像工作內容的術語。

規則：
1. 保留原意，但用職場/商業術語重新包裝
2. 可以加入一些專案名稱、會議、報告等元素
3. 讓旁人看起來完全像是在討論工作
4. 語氣要正式、專業

輸入：{{input}}
輸出：（只輸出加密後的句子，不要其他說明）`,

        buzzword: `你是一個「職場黑話生成器」。請根據主題生成職場常見的廢話/黑話詞彙。

主題：{{theme}}
請生成 5 個相關的職場黑話詞彙，並簡短解釋其「假專業」的用法。
輸出格式：詞彙：解釋（每行一個）`,

        summary: `請將以下會議/對話內容，整理成重點摘要。

內容：{{input}}

請用繁體中文輸出，條列 3-5 個重點。`
    },
    
    init() {
        this.loadConfig();
    },
    
    loadConfig() {
        try {
            const saved = localStorage.getItem('llm_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 安全提醒：API Key 不存入 localStorage，避免 XSS 時金鑰外洩
                // 僅從 localStorage 讀取非敏感設定（provider, model, temperature, enabled）
                const { apiKey, ...safeConfig } = parsed;
                this.config = { ...this.config, ...safeConfig };
            }
        } catch { localStorage.removeItem('llm_config'); }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    },
    
    saveConfig() {
        // 安全提醒：不把 apiKey 寫入 localStorage，防止 XSS 攻擊竊取金鑰
        const { apiKey, ...safeConfig } = this.config;
        localStorage.setItem('llm_config', JSON.stringify(safeConfig));
    },
    
    // 設定 API 金鑰等
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    },

    // 帶超時的 fetch 封裝（預設 15 秒）
    fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timeoutId));
    },
    
    _cacheKey(type, input) {
        return 'llm_cache_' + [type, this.config.provider, this.config.model, input.slice(0, 80)].join('_').replace(/[^a-zA-Z0-9_-]/g, '_');
    },

    // 主呼叫入口
    async call(type, input, options = {}) {
        // 如果沒啟用 LLM 或沒有 API key，回退到 Mock
        if (!this.config.enabled || this.config.provider === 'mock' || !this.config.apiKey) {
            return this.mockCall(type, input, options);
        }

        // 檢查快取（5 分鐘 TTL，僅針對相同輸入）
        const cacheKey = this._cacheKey(type, input);
        const cachedRaw = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheKey + '_time');
        const now = Date.now();
        if (cachedRaw && cachedTime && now - parseInt(cachedTime) < 300000) {
            try { return JSON.parse(cachedRaw); } catch (_) { /* 快取損壞，繼續呼叫 */ }
        }
        
        const prompt = this.prompts[type]?.replace('{{input}}', input) || input;
        
        try {
            let result;
            switch (this.config.provider) {
                case 'gemini':
                    result = await this.callGemini(prompt, options);
                    break;
                case 'openai':
                    result = await this.callOpenAI(prompt, options);
                    break;
                case 'claude':
                    result = await this.callClaude(prompt, options);
                    break;
                case 'custom':
                    result = await this.callCustom(prompt, options);
                    break;
                default:
                    result = this.mockCall(type, input, options);
            }
            // 寫入快取
            localStorage.setItem(cacheKey, JSON.stringify(result));
            localStorage.setItem(cacheKey + '_time', String(now));
            return result;
        } catch (err) {
            console.error('LLM 呼叫失敗:', err);
            // 失敗時回退 Mock
            return this.mockCall(type, input, options);
        }
    },
    
    // Mock 模式（本地規則，無需 API）
    mockCall(type, input, options) {
        return new Promise(resolve => {
            setTimeout(() => {
                switch(type) {
                    case 'shield':
                        resolve(this.mockShield(input));
                        break;
                    case 'encrypt':
                        resolve(this.mockEncrypt(input));
                        break;
                    case 'buzzword':
                        resolve(this.mockBuzzword(input));
                        break;
                    case 'summary':
                        resolve(this.mockSummary(input));
                        break;
                    default:
                        resolve({ text: input });
                }
            }, 600 + Math.random() * 800); // 模擬網路延遲
        });
    },
    
    // Mock: 情緒防護罩
    mockShield(input) {
        const fireWords = ['廢物','混','垃圾','爛','死','幹','他媽','腦袋','白痴','沒用','廢','搞什麼','在幹嘛','怎麼回事','又','永遠','總是','從來','到底','豬','蠢'];
        const fireLevel = Math.min(5, Math.ceil(fireWords.filter(w => input.includes(w)).length / 2) + 1);
        
        // 提取待辦
        const patterns = [
            { keywords: ['delay','延遲','延期','趕不上','來不及'], todo: '確認專案延遲原因並提出補救方案與新時程' },
            { keywords: ['設計','畫面','ui','介面','視覺','圖'], todo: '檢視設計規格是否符合需求文件與品牌指引' },
            { keywords: ['bug','錯誤','問題','壞掉','當機','崩潰'], todo: '排查技術問題根因並建立修復時程與測試計畫' },
            { keywords: ['報告','報表','數據','分析','統計'], todo: '整理相關數據並產出分析報告與洞察建議' },
            { keywords: ['會議','討論','開會','會談'], todo: '準備會議議程、相關資料與預期產出' },
            { keywords: ['客戶','業主','甲方','業務'], todo: '彙整客戶需求變更並確認優先順序與影響範圍' },
            { keywords: ['文件','文案','內容','稿件'], todo: '檢查文件完整性、版本控制並進行必要更新' },
            { keywords: ['測試','驗收','qa','品質'], todo: '執行測試計畫並記錄問題清單與修復進度' },
            { keywords: ['預算','經費','成本','錢','報價'], todo: '評估預算使用狀況並提出調整建議與風險評估' },
            { keywords: ['進度','時程','排程','計畫'], todo: '更新專案進度表、確認里程碑並預警風險' },
            { keywords: ['需求','規格','功能'], todo: '釐清需求細節並更新規格文件' },
            { keywords: ['溝通','協調','聯繫'], todo: '安排跨部門溝通會議並同步資訊' },
        ];
        
        const todos = [];
        patterns.forEach(p => {
            if (p.keywords.some(k => input.toLowerCase().includes(k))) {
                if (!todos.includes(p.todo)) todos.push(p.todo);
            }
        });
        
        if (todos.length === 0) {
            todos.push('釐清主管/同事提出的具體需求與期望');
            todos.push('評估現有資源是否足夠達成目標');
            todos.push('制定下一步行動計畫與時間表');
        }
        
        const suggestions = [];
        if (fireLevel >= 4) suggestions.push('🔥 火力很強，建議先深呼吸，10分鐘後再回覆');
        else if (fireLevel >= 2) suggestions.push('⚡ 情緒指數偏高，建議冷靜後理性回應');
        else suggestions.push('✨ 情緒平穩，可以正常溝通');
        
        if (input.includes('？') || input.includes('?')) suggestions.push('❓ 訊息包含疑問，建議條列式回覆每個問題');
        if (input.includes('明天') || input.includes('今天') || input.includes('下午') || input.includes('晚上')) suggestions.push('⏰ 有時間壓力，優先處理時程相關事項');
        
        const comforts = [
            '你做得很好，這只是工作中的一個小波折。',
            '深呼吸，你有能力處理這個狀況。',
            '每個人都會遇到挑戰，這是成長的機會。',
            '保持冷靜，你的專業能力會說話。',
            '辛苦了！記得對自己好一點，下班後吃點好吃的。'
        ];
        
        return {
            todos,
            fireLevel,
            suggestions,
            comfort: comforts[Math.min(fireLevel - 1, 4)],
            source: 'mock'
        };
    },
    
    // Mock: 術語加密
    mockEncrypt(input) {
        const map = {
            '吃': '進行熱能補充', '飯': '專案評估', '晚餐': '下班後專案會議', '午餐': '中午進度同步',
            '火鍋': '高溫協作專案', '燒烤': '火力全開專案', '喝酒': '液態創意激盪', '咖啡': '咖啡因驅動會議',
            '約': '排程', '見面': '面對面協作', '聊天': '非正式需求訪談', '八卦': '市場情報交流',
            '抱怨': '負面回饋收集', '老闆': '決策層', '主管': '直屬管理單位', '同事': '平行協作單位',
            '加班': '工時延長計畫', '下班': '工作時段結束', '週末': '非工作日區間', '放假': '人力資源暫停配置',
            '累': '能量耗盡警告', '煩': '心理負載過高', '爽': '正向反饋狀態', '開心': '士氣指數提升',
            '喜歡': '正向偏好確認', '在一起': '長期合作關係', '分手': '關係終止協議',
            '男朋友': '專屬協作夥伴', '女朋友': '專屬協作夥伴', '單身': '獨立作業模式',
            '約會': '一對一進度同步', '生日': '年度週期紀念日', '禮物': '實體激勵措施',
            '錢': '資金流', '買': '採購行為', '房子': '固定資產配置', '車子': '移動式資產',
            '旅遊': '異地辦公考察', '電影': '視覺內容分析', '遊戲': '互動式模擬訓練',
            '睡覺': '生理系統維護', '手機': '通訊設備終端', '電腦': '運算設備終端'
        };
        
        let encrypted = input;
        Object.entries(map).forEach(([key, value]) => {
            encrypted = encrypted.replace(new RegExp(key, 'g'), value);
        });
        
        // 加一些專業包裝
        const prefixes = ['【緊急】', '【同步】', '【確認】', '【評估】'];
        const suffixes = ['，請確認時程。', '，待您回覆。', '，已列入追蹤。', '，預計下週產出。'];
        
        if (!encrypted.includes('【')) {
            encrypted = prefixes[Math.floor(Math.random() * prefixes.length)] + encrypted;
        }
        if (!encrypted.includes('。') || encrypted.endsWith('。')) {
            encrypted += suffixes[Math.floor(Math.random() * suffixes.length)];
        }
        
        return { text: encrypted, source: 'mock' };
    },
    
    // Mock: 黑話生成
    mockBuzzword(theme) {
        const allBuzzwords = [
            '賦能', '抓手', '顆粒度', '閉環', '底層邏輯', '對齊', '打法', '矩陣',
            '生態', '賽道', '痛點', '沉澱', '複用', '協同', '落地', '迭代',
            '心智', '場域', '價值鏈', '壁壘', '紅利', '藍海', '風口', '顛覆',
            '裂變', '引爆', '天花板', '護城河', '頂層設計', '方法論'
        ];
        const shuffled = [...allBuzzwords].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);
        
        const explanations = {
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
            '方法論': '一套聽起來很厲害的廢話'
        };
        
        const text = selected.map(w => `${w}：${explanations[w] || '職場必備術語'}`).join('\n');
        return { text, words: selected, source: 'mock' };
    },
    
    // Mock: 摘要
    mockSummary(input) {
        const sentences = input.split(/[。！？\n]/).filter(s => s.trim().length > 5);
        const points = sentences.slice(0, 5).map((s, i) => `${i+1}. ${s.trim().substring(0, 50)}...`);
        
        return {
            text: points.join('\n') || '1. 內容較短，暫無法產生摘要',
            source: 'mock'
        };
    },
    
    // 真實 API: Gemini
    async callGemini(prompt, options) {
        const model = this.config.model || 'gemini-2.5-flash';
        const response = await this.fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: 'application/json' },
                })
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Gemini API 錯誤: ${err.error?.message ?? response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== 'string') {
            return { error: 'Gemini 回傳格式異常，請檢查模型與金鑰設定', source: 'gemini' };
        }
        const content = text.trim();
        try {
            return { ...JSON.parse(content), source: 'gemini' };
        } catch {
            return { text: content, source: 'gemini' };
        }
    },

    // 真實 API: OpenAI
    async callOpenAI(prompt, options) {
        const response = await this.fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    { role: 'system', content: '你是一個專業的職場助手。請嚴格按照要求的格式輸出。' },
                    { role: 'user', content: prompt }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        });
        
        if (!response.ok) throw new Error(`OpenAI API 錯誤: ${response.status}`);
        
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            return { error: 'OpenAI 回傳格式異常，請檢查模型與金鑰設定', source: 'openai' };
        }
        
        // 嘗試解析 JSON
        try {
            return JSON.parse(content);
        } catch {
            return { text: content, source: 'openai' };
        }
    },
    
    // 真實 API: Claude
    async callClaude(prompt, options) {
        const response = await this.fetchWithTimeout('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model || 'claude-3-haiku-20240307',
                max_tokens: this.config.maxTokens,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) throw new Error(`Claude API 錯誤: ${response.status}`);
        
        const data = await response.json();
        const content = data?.content?.[0]?.text;
        if (typeof content !== 'string') {
            return { error: 'Claude 回傳格式異常，請檢查模型與金鑰設定', source: 'claude' };
        }
        
        try {
            return JSON.parse(content);
        } catch {
            return { text: content, source: 'claude' };
        }
    },
    
    // 自定義 API
    async callCustom(prompt, options) {
        const response = await this.fetchWithTimeout(this.config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                prompt: prompt,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        });
        
        if (!response.ok) throw new Error(`Custom API 錯誤: ${response.status}`);
        
        const data = await response.json();
        return { text: data.text || data.response || data.choices?.[0]?.text, source: 'custom' };
    },
    
    // 測試連線
    async testConnection() {
        try {
            const result = await this.call('summary', '測試連線');
            return { success: true, result };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },
    
    // 渲染設定頁面
    renderSettings(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="card">
                <div class="card-title">🤖 LLM 設定</div>
                <div class="card-desc">配置 AI 模型以獲得更精準的職場生存輔助</div>
                
                <div class="toggle-row" style="margin-top:1rem">
                    <span>啟用 LLM（否則使用本地規則）</span>
                    <div class="toggle-switch ${this.config.enabled ? 'active' : ''}" id="llm-toggle-enabled"></div>
                </div>
                
                <div style="margin-top:1rem;opacity:${this.config.enabled ? 1 : 0.4}">
                    <div class="form-group">
                        <label class="form-label">AI 提供商</label>
                        <select id="llm-provider" class="input-area" style="height:44px">
                            <option value="mock" ${this.config.provider === 'mock' ? 'selected' : ''}>🧠 Mock 模式（免費，本地規則）</option>
                            <option value="gemini" ${this.config.provider === 'gemini' ? 'selected' : ''}>🔵 Gemini (Google，推薦)</option>
                            <option value="openai" ${this.config.provider === 'openai' ? 'selected' : ''}>🟢 OpenAI (GPT-4/GPT-3.5)</option>
                            <option value="claude" ${this.config.provider === 'claude' ? 'selected' : ''}>🟣 Claude (Anthropic)</option>
                            <option value="custom" ${this.config.provider === 'custom' ? 'selected' : ''}>⚙️ 自定義 API</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">API 金鑰</label>
                        <input type="password" id="llm-apikey" class="input-area"
                            placeholder="${this.config.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}" value="${this.escapeHtml(this.config.apiKey)}">
                    </div>

                    <div class="form-group" id="custom-url-group" style="display:${this.config.provider === 'custom' ? 'block' : 'none'}">
                        <label class="form-label">API 網址</label>
                        <input type="text" id="llm-apiurl" class="input-area"
                            placeholder="https://api.example.com/v1/chat" value="${this.escapeHtml(this.config.apiUrl)}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">模型名稱</label>
                        <input type="text" id="llm-model" class="input-area"
                            placeholder="gemini-2.5-flash" value="${this.escapeHtml(this.config.model)}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">創意程度 (Temperature: <span id="temp-val">${this.config.temperature}</span>)</label>
                        <input type="range" id="llm-temp" min="0" max="1" step="0.1" 
                            value="${this.config.temperature}" style="width:100%">
                    </div>
                </div>
                
                <div style="display:flex;gap:0.5rem;margin-top:1rem">
                    <button id="btn-llm-test" class="btn-secondary" style="flex:1">🧪 測試連線</button>
                    <button id="btn-llm-save" class="btn-primary" style="flex:1">💾 儲存設定</button>
                </div>
                
                <div id="llm-test-result" style="margin-top:0.8rem;font-size:0.85rem"></div>
            </div>
            
            <div class="card">
                <div class="card-title">📊 使用統計</div>
                <div style="display:flex;justify-content:space-around;margin-top:1rem;text-align:center">
                    <div>
                        <div style="font-size:1.5rem;font-weight:700;color:var(--primary)">${this.getCallCount()}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">總呼叫次數</div>
                    </div>
                    <div>
                        <div style="font-size:1.5rem;font-weight:700;color:var(--success)">${this.getSavedTokens()}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">節省 token</div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindSettingsEvents();
    },
    
    bindSettingsEvents() {
        // 啟用開關
        document.getElementById('llm-toggle-enabled')?.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        // 提供商切換
        document.getElementById('llm-provider')?.addEventListener('change', (e) => {
            const urlGroup = document.getElementById('custom-url-group');
            urlGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        // 溫度滑塊
        document.getElementById('llm-temp')?.addEventListener('input', (e) => {
            document.getElementById('temp-val').textContent = e.target.value;
        });
        
        // 測試連線
        document.getElementById('btn-llm-test')?.addEventListener('click', async () => {
            const result = document.getElementById('llm-test-result');
            result.textContent = '測試中...';
            result.style.color = 'var(--text-muted)';
            
            // 暫時套用設定測試
            const testConfig = this.gatherSettings();
            const original = { ...this.config };
            this.config = { ...this.config, ...testConfig, enabled: true };
            
            const testResult = await this.testConnection();
            this.config = original;
            
            if (testResult.success) {
                result.innerHTML = '<span style="color:var(--success)">✅ 連線成功！</span>';
            } else {
                result.innerHTML = `<span style="color:var(--danger)">❌ 連線失敗：${this.escapeHtml(testResult.error)}</span>`;
            }
        });
        
        // 儲存
        document.getElementById('btn-llm-save')?.addEventListener('click', () => {
            const settings = this.gatherSettings();
            this.setConfig(settings);
            alert('設定已儲存！');
        });
    },
    
    gatherSettings() {
        const enabled = document.getElementById('llm-toggle-enabled')?.classList.contains('active') || false;
        const provider = document.getElementById('llm-provider')?.value || 'mock';
        const apiKey = document.getElementById('llm-apikey')?.value || '';
        const apiUrl = document.getElementById('llm-apiurl')?.value || '';
        const model = document.getElementById('llm-model')?.value || 'gemini-2.5-flash';
        const temperature = parseFloat(document.getElementById('llm-temp')?.value || 0.7);
        
        return { enabled, provider, apiKey, apiUrl, model, temperature };
    },
    
    getCallCount() {
        return parseInt(localStorage.getItem('llm_call_count') || '0');
    },
    
    incrementCallCount() {
        localStorage.setItem('llm_call_count', this.getCallCount() + 1);
    },
    
    getSavedTokens() {
        return parseInt(localStorage.getItem('llm_saved_tokens') || '0');
    }
};

// 初始化
LLM.init();
window.LLM = LLM;
