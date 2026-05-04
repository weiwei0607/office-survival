/**
 * 一秒變臉 UI v2
 * 聊天介面偽裝成 Excel / Outlook / Terminal / IDE / 股票看盤
 * 支援搖晃 / 音量鍵 / 點擊快捷切換
 */

const DisguiseModule = {
    currentSkin: 'normal',
    shakeEnabled: false,
    volumeEnabled: false,
    tapEnabled: false,
    
    skins: {
        normal: { name: '一般模式', icon: '💬', desc: '正常聊天介面', color: '#6c5ce7' },
        excel: { name: 'Excel 模式', icon: '📊', desc: '偽裝成試算表', color: '#217346' },
        outlook: { name: 'Outlook 模式', icon: '📧', desc: '偽裝成郵件', color: '#0078d4' },
        terminal: { name: 'Terminal 模式', icon: '💻', desc: '偽裝成命令列', color: '#0c0c0c' },
        vscode: { name: 'VS Code 模式', icon: '📝', desc: '偽裝成寫程式', color: '#007acc' },
        stock: { name: '股票模式', icon: '📈', desc: '偽裝成看盤', color: '#c41e3a' }
    },
    
    init() {
        this.loadSettings();
        this.bindEvents();
        this.renderSkinCards();
        this.renderPreview();
        this.updateToggleButtons();
    },
    
    loadSettings() {
        const saved = localStorage.getItem('disguise_settings');
        if (saved) {
            const s = JSON.parse(saved);
            this.currentSkin = s.skin || 'normal';
            this.shakeEnabled = s.shake || false;
            this.volumeEnabled = s.volume || false;
            this.tapEnabled = s.tap || false;
        }
    },
    
    saveSettings() {
        localStorage.setItem('disguise_settings', JSON.stringify({
            skin: this.currentSkin,
            shake: this.shakeEnabled,
            volume: this.volumeEnabled,
            tap: this.tapEnabled
        }));
    },
    
    renderSkinCards() {
        const container = document.querySelector('.disguise-options');
        if (!container) return;
        
        container.innerHTML = Object.entries(this.skins).map(([key, skin]) => `
            <div class="disguise-card ${this.currentSkin === key ? 'active' : ''}" data-skin="${key}">
                <div class="disguise-icon">${skin.icon}</div>
                <div class="disguise-name">${skin.name}</div>
                <div class="disguise-desc">${skin.desc}</div>
            </div>
        `).join('');
        
        container.querySelectorAll('.disguise-card').forEach(card => {
            card.addEventListener('click', () => {
                this.setSkin(card.dataset.skin);
            });
        });
    },
    
    bindEvents() {
        // 搖晃切換
        document.getElementById('btn-shake-toggle')?.addEventListener('click', () => {
            this.shakeEnabled = !this.shakeEnabled;
            this.saveSettings();
            this.updateToggleButtons();
            
            if (this.shakeEnabled) {
                this.enableShakeDetection();
                this.showSkinToast('搖晃切換已開啟', '搖一搖手機即可切換偽裝');
            } else {
                this.disableShakeDetection();
            }
        });
        
        // 音量鍵切換
        document.getElementById('btn-volume-toggle')?.addEventListener('click', () => {
            this.volumeEnabled = !this.volumeEnabled;
            this.saveSettings();
            this.updateToggleButtons();
            
            if (this.volumeEnabled) {
                this.showSkinToast('音量鍵切換已開啟', '按音量上/下鍵即可切換偽裝');
            }
        });
        
        // 點擊快捷切換（預覽區域雙擊）
        document.getElementById('disguise-preview')?.addEventListener('dblclick', () => {
            if (this.tapEnabled) {
                this.cycleSkin();
            }
        });
        
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (this.volumeEnabled) {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.cycleSkin(e.key === 'ArrowUp' ? 1 : -1);
                }
            }
        });
    },
    
    updateToggleButtons() {
        const shakeBtn = document.getElementById('btn-shake-toggle');
        const volumeBtn = document.getElementById('btn-volume-toggle');
        
        if (shakeBtn) {
            shakeBtn.textContent = `搖晃切換: ${this.shakeEnabled ? '開啟 ✅' : '關閉'}`;
            shakeBtn.style.borderColor = this.shakeEnabled ? 'var(--success)' : '';
            shakeBtn.style.color = this.shakeEnabled ? 'var(--success)' : '';
        }
        
        if (volumeBtn) {
            volumeBtn.textContent = `音量鍵切換: ${this.volumeEnabled ? '開啟 ✅' : '關閉'}`;
            volumeBtn.style.borderColor = this.volumeEnabled ? 'var(--success)' : '';
            volumeBtn.style.color = this.volumeEnabled ? 'var(--success)' : '';
        }
    },
    
    setSkin(skin) {
        this.currentSkin = skin;
        this.saveSettings();
        this.renderSkinCards();
        this.renderPreview();
    },
    
    cycleSkin(direction = 1) {
        const skinKeys = Object.keys(this.skins);
        const currentIndex = skinKeys.indexOf(this.currentSkin);
        const nextIndex = (currentIndex + direction + skinKeys.length) % skinKeys.length;
        this.setSkin(skinKeys[nextIndex]);
        this.showSkinToast(this.skins[this.currentSkin].name, `快捷切換 (${nextIndex + 1}/${skinKeys.length})`);
    },
    
    enableShakeDetection() {
        if (!window.DeviceMotionEvent) {
            alert('您的裝置不支援搖晃偵測');
            this.shakeEnabled = false;
            this.saveSettings();
            this.updateToggleButtons();
            return;
        }
        
        let lastX = 0, lastY = 0, lastZ = 0;
        let lastTime = 0;
        let shakeCount = 0;
        
        this.shakeHandler = (event) => {
            const current = event.accelerationIncludingGravity;
            if (!current) return;
            
            const currentTime = Date.now();
            if (currentTime - lastTime < 100) return;
            
            const diff = Math.abs(current.x - lastX) + Math.abs(current.y - lastY) + Math.abs(current.z - lastZ);
            
            if (diff > 25) {
                shakeCount++;
                if (shakeCount >= 2) { // 需要連續搖晃兩次
                    this.cycleSkin();
                    if (navigator.vibrate) navigator.vibrate(50);
                    shakeCount = 0;
                }
            }
            
            lastX = current.x;
            lastY = current.y;
            lastZ = current.z;
            lastTime = currentTime;
        };
        
        window.addEventListener('devicemotion', this.shakeHandler);
    },
    
    disableShakeDetection() {
        if (this.shakeHandler) {
            window.removeEventListener('devicemotion', this.shakeHandler);
            this.shakeHandler = null;
        }
    },
    
    showSkinToast(title, subtitle) {
        // 移除舊的 toast
        document.querySelectorAll('.skin-toast').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = 'skin-toast';
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-card);
            border: 1px solid ${this.skins[this.currentSkin].color};
            color: var(--text);
            padding: 0.8rem 1.2rem;
            border-radius: var(--radius);
            font-weight: 600;
            z-index: 2000;
            animation: slideDown 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            text-align: center;
        `;
        toast.innerHTML = `
            <div style="font-size:1.2rem">${this.skins[this.currentSkin].icon} ${title}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem">${subtitle}</div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },
    
    renderPreview() {
        const preview = document.getElementById('disguise-preview');
        if (!preview) return;
        
        const demos = [
            { me: '今晚去吃麻辣鍋？', other: '好啊！七點老地方見', me2: '老闆今天很機車...' }
        ];
        const demo = demos[0];
        
        switch(this.currentSkin) {
            case 'excel':
                preview.innerHTML = this.getExcelPreview(demo);
                break;
            case 'outlook':
                preview.innerHTML = this.getOutlookPreview(demo);
                break;
            case 'terminal':
                preview.innerHTML = this.getTerminalPreview(demo);
                break;
            case 'vscode':
                preview.innerHTML = this.getVSCodePreview(demo);
                break;
            case 'stock':
                preview.innerHTML = this.getStockPreview(demo);
                break;
            default:
                preview.innerHTML = this.getNormalPreview(demo);
        }
    },
    
    getNormalPreview(demo) {
        return `
            <div style="padding:1rem">
                <div style="display:flex;flex-direction:column;gap:0.6rem">
                    <div style="align-self:flex-end;background:var(--primary);color:white;padding:0.6rem 1rem;border-radius:12px 12px 4px 12px;max-width:70%;font-size:0.85rem">${demo.me}</div>
                    <div style="align-self:flex-start;background:var(--bg-card);border:1px solid var(--border);padding:0.6rem 1rem;border-radius:12px 12px 12px 4px;max-width:70%;font-size:0.85rem">${demo.other}</div>
                    <div style="align-self:flex-end;background:var(--primary);color:white;padding:0.6rem 1rem;border-radius:12px 12px 4px 12px;max-width:70%;font-size:0.85rem">${demo.me2}</div>
                </div>
            </div>
        `;
    },
    
    getExcelPreview(demo) {
        return `
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:0.75rem;background:white;color:#333">
                <div style="background:#217346;color:white;padding:0.4rem 0.6rem;font-size:0.7rem;display:flex;align-items:center;gap:0.5rem">
                    <span>📊</span> Book1 - Excel
                </div>
                <div style="background:#f3f3f3;padding:0.3rem 0.6rem;border-bottom:1px solid #d4d4d4;font-size:0.7rem;color:#666">fx | =MESSAGE(A2)</div>
                <div style="display:grid;grid-template-columns:30px repeat(3,1fr)">
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center;font-weight:600"></div>
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center;font-weight:600">A</div>
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center;font-weight:600">B</div>
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center;font-weight:600">C</div>
                    
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center">1</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem;background:#e8f5e9">任務名稱</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem;background:#e8f5e9">負責人</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem;background:#e8f5e9">進度</div>
                    
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center">2</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem">${demo.me}</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem">我</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem;color:green">進行中</div>
                    
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center">3</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem">${demo.other}</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem">同事A</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem;color:blue">待確認</div>
                    
                    <div style="background:#f3f3f3;border:1px solid #e0e0e0;padding:0.3rem;text-align:center">4</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem">${demo.me2}</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem">我</div>
                    <div style="border:1px solid #e0e0e0;padding:0.3rem;color:orange">處理中</div>
                </div>
            </div>
        `;
    },
    
    getOutlookPreview(demo) {
        return `
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:0.8rem;background:#f5f5f5;color:#333">
                <div style="background:#0078d4;color:white;padding:0.5rem 0.8rem;font-size:0.8rem">📧 Outlook</div>
                <div style="background:#f5f5f5;padding:0.3rem 0.8rem;border-bottom:1px solid #e0e0e0;font-size:0.75rem;color:#666">收件匣 (3) · 聚焦收件匣</div>
                
                <div style="padding:0.6rem 0.8rem;border-bottom:1px solid #e0e0e0;background:white;display:flex;gap:0.8rem;align-items:center">
                    <div style="width:32px;height:32px;border-radius:50%;background:#0078d4;color:white;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600">我</div>
                    <div style="flex:1">
                        <div style="font-weight:600;font-size:0.8rem">我 <span style="font-weight:normal;color:#666">RE: 進度同步</span></div>
                        <div style="font-size:0.75rem;color:#666">${demo.me.substring(0,25)}...</div>
                    </div>
                    <div style="font-size:0.7rem;color:#999">14:30</div>
                </div>
                
                <div style="padding:0.6rem 0.8rem;border-bottom:1px solid #e0e0e0;background:white;display:flex;gap:0.8rem;align-items:center">
                    <div style="width:32px;height:32px;border-radius:50%;background:#28a745;color:white;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600">A</div>
                    <div style="flex:1">
                        <div style="font-weight:600;font-size:0.8rem">同事A <span style="font-weight:normal;color:#666">FW: 會議紀錄</span></div>
                        <div style="font-size:0.75rem;color:#666">${demo.other.substring(0,25)}...</div>
                    </div>
                    <div style="font-size:0.7rem;color:#999">14:32</div>
                </div>
                
                <div style="padding:0.6rem 0.8rem;border-bottom:1px solid #e0e0e0;background:#f0f8ff;display:flex;gap:0.8rem;align-items:center">
                    <div style="width:32px;height:32px;border-radius:50%;background:#6c757d;color:white;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600">系</div>
                    <div style="flex:1">
                        <div style="font-weight:600;font-size:0.8rem">系統管理員 <span style="font-weight:normal;color:#666">系統備份完成</span></div>
                        <div style="font-size:0.75rem;color:#666">每日自動備份已成功執行...</div>
                    </div>
                    <div style="font-size:0.7rem;color:#999">14:00</div>
                </div>
            </div>
        `;
    },
    
    getTerminalPreview(demo) {
        return `
            <div style="background:#0c0c0c;color:#ccc;font-family:'Courier New',monospace;padding:1rem;font-size:0.75rem;line-height:1.6;min-height:200px">
                <div style="color:#0f0">user@workstation:~$</div>
                <div style="color:#0ff">ssh secure-chat.company.com</div>
                <div style="color:#0f0">Connected. Channel encrypted (AES-256)</div>
                <div></div>
                <div style="color:#ff0">[14:30] user@dev:~$ echo "${demo.me}"</div>
                <div style="color:#0ff">  → ${demo.me}</div>
                <div></div>
                <div style="color:#ff0">[14:32] peer@dev:~$ echo "${demo.other}"</div>
                <div style="color:#0ff">  → ${demo.other}</div>
                <div></div>
                <div style="color:#ff0">[14:35] user@dev:~$ echo "${demo.me2}"</div>
                <div style="color:#f55">  → ${demo.me2}</div>
                <div></div>
                <div style="color:#0f0">user@workstation:~$</div>
                <div style="animation:blink 1s infinite">_</div>
            </div>
        `;
    },
    
    getVSCodePreview(demo) {
        return `
            <div style="background:#1e1e1e;color:#d4d4d4;font-family:'Consolas',monospace;font-size:0.75rem;line-height:1.5">
                <div style="background:#2d2d30;padding:0.3rem 0.6rem;font-size:0.7rem;display:flex;gap:1rem">
                    <span style="color:#fff;border-bottom:2px solid #007acc;padding-bottom:0.3rem">chat.js</span>
                    <span style="color:#858585">messages.json</span>
                    <span style="color:#858585">config.ts</span>
                </div>
                <div style="padding:0.5rem">
                    <div><span style="color:#6a9955">// 職場生存工具 - 偽裝聊天模組</span></div>
                    <div><span style="color:#569cd6">const</span> <span style="color:#4fc1ff">messages</span> <span style="color:#d4d4d4">= [</span></div>
                    <div style="padding-left:1rem">
                        <span style="color:#d4d4d4">{</span> <span style="color:#9cdcfe">from</span><span style="color:#d4d4d4">:</span> <span style="color:#ce9178">'me'</span><span style="color:#d4d4d4">,</span> <span style="color:#9cdcfe">msg</span><span style="color:#d4d4d4">:</span> <span style="color:#ce9178">'${demo.me}'</span> <span style="color:#d4d4d4">},</span>
                    </div>
                    <div style="padding-left:1rem">
                        <span style="color:#d4d4d4">{</span> <span style="color:#9cdcfe">from</span><span style="color:#d4d4d4">:</span> <span style="color:#ce9178">'peer'</span><span style="color:#d4d4d4">,</span> <span style="color:#9cdcfe">msg</span><span style="color:#d4d4d4">:</span> <span style="color:#ce9178">'${demo.other}'</span> <span style="color:#d4d4d4">},</span>
                    </div>
                    <div style="padding-left:1rem">
                        <span style="color:#d4d4d4">{</span> <span style="color:#9cdcfe">from</span><span style="color:#d4d4d4">:</span> <span style="color:#ce9178">'me'</span><span style="color:#d4d4d4">,</span> <span style="color:#9cdcfe">msg</span><span style="color:#d4d4d4">:</span> <span style="color:#ce9178">'${demo.me2}'</span><span style="color:#d4d4d4">,</span> <span style="color:#9cdcfe">encrypt</span><span style="color:#d4d4d4">:</span> <span style="color:#569cd6">true</span> <span style="color:#d4d4d4">}</span>
                    </div>
                    <div><span style="color:#d4d4d4">];</span></div>
                    <div></div>
                    <div><span style="color:#6a9955">// TODO: 加上 E2EE 加密</span></div>
                    <div><span style="color:#569cd6">function</span> <span style="color:#dcdcaa">sendSecure</span><span style="color:#d4d4d4">(msg) {</span></div>
                    <div style="padding-left:1rem"><span style="color:#c586c0">return</span> <span style="color:#dcdcaa">encrypt</span><span style="color:#d4d4d4">(msg, </span><span style="color:#ce9178">'work-terminology'</span><span style="color:#d4d4d4">);</span></div>
                    <div><span style="color:#d4d4d4">}</span></div>
                </div>
            </div>
        `;
    },
    
    getStockPreview(demo) {
        return `
            <div style="background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;font-size:0.75rem">
                <div style="background:#c41e3a;padding:0.4rem 0.6rem;font-size:0.8rem;font-weight:600;display:flex;justify-content:space-between">
                    <span>📈 大盤走勢</span>
                    <span style="color:#ffeb3b">▲ 1.25%</span>
                </div>
                <div style="padding:0.6rem">
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
                        <span style="color:#999">加權指數</span>
                        <span style="color:#0f0">23,456.78 ▲</span>
                    </div>
                    <div style="display:flex;gap:0.3rem;margin-bottom:0.5rem">
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #c41e3a 60%, #ff5252)"></div>
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #c41e3a 70%, #ff5252)"></div>
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #c41e3a 55%, #ff5252)"></div>
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #c41e3a 80%, #ff5252)"></div>
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #c41e3a 65%, #ff5252)"></div>
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #c41e3a 90%, #ff5252)"></div>
                        <div style="flex:1;height:40px;background:linear-gradient(to top, #0f0 75%, #69f0ae)"></div>
                    </div>
                    <div style="border-top:1px solid #333;padding-top:0.5rem">
                        <div style="display:flex;justify-content:space-between;padding:0.3rem 0">
                            <span style="color:#999">2330 台積電</span>
                            <span style="color:#0f0">1,250 ▲2.5%</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:0.3rem 0">
                            <span style="color:#999">MSG 訊息股</span>
                            <span style="color:#0f0">${demo.me.substring(0,8)}... ▲5.2%</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:0.3rem 0">
                            <span style="color:#999">RPL 回覆股</span>
                            <span style="color:#f44">${demo.other.substring(0,8)}... ▼0.3%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

window.DisguiseModule = DisguiseModule;
