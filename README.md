# 🛡️ 職場生存工具 Office Survival

> 上班摸魚不被發現的終極武器 — AI 加密聊天、變臉偽裝、下班結界

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-PWA-E34F26?logo=html5" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript" />
  <img src="https://img.shields.io/badge/Firebase-Realtime-FFCA28?logo=firebase" />
  <img src="https://img.shields.io/badge/AI-OpenAI%20%7C%20Claude-412991?logo=openai" />
  <img src="https://img.shields.io/badge/QR_Code-加好友-black?logo=qrcode" />
</p>

<p align="center">
  <b>老闆走過來時，一秒變成 Excel 表格</b><br/>
  <b>下班後自動啟動結界，工作訊息統統擋住</b>
</p>

---

## 🎯 這是什麼？

一個給「職場求生者」的 PWA 工具箱，包含 6 大模組：

| 模組 | 功能 | 使用場景 |
|------|------|---------|
| 💬 **偽裝聊天** | AI 即時加密對話（職場黑話/學術術語/遊戲術語） | 在辦公室聊私人話題，被看到也像是工作討論 |
| 🎭 **變臉 UI** | 一鍵偽裝成 Excel / Outlook / Terminal / VS Code | 老闆走過來時秒切工作介面 |
| 🛡️ **防護罩** | 職場黑話 Bingo + 情緒翻譯器 | 開會時聽不懂主管在說什麼？即時翻譯 |
| 🔕 **假通知** | 偽造系統通知（備份完成/會議提醒） | 想提早離開會議？手機跳出「緊急通知」 |
| 🚧 **下班結界** | 下班後封鎖工作相關網站/App | 防止下班後還在回工作訊息 |
| 🤖 **AI 加密引擎** | 6 主題 × 200+ 詞彙映射的智能加密 | 「今晚吃麻辣鍋」→「執行高溫協作專案」 |

---

## ✨ 核心亮點

### 🤖 AI 加密聊天

```
你輸入：「今晚去吃麻辣鍋？老地方見」

加密後：
【專案同步】執行高溫協作專案（麻辣鍋）
         於指定協作據點（老地方）進行
         請相關單位於 19:00 前回覆確認。

主題可切換：
• 💼 職場黑話  → 賦能、抓手、閉環
• 📚 學霸模式  → 攝取營養物質、高溫液態烹飪系統
• 🎮 遊戲術語  → 開副本、刷裝備、組隊
• 🏥 醫學術語  → 攝取熱能、進行餐飲協作
• 💻 程式黑話  → 執行補給方案、進行非正式需求訪談
• 🏮 古風文藝  → 圍爐夜話、對酒當歌
```

### 🎭 變臉 UI（老闆模式）

一鍵切換偽裝介面：
- 📊 **Excel** — 看起來在做數據分析
- 📧 **Outlook** — 看起來在回郵件
- 💻 **VS Code** — 看起來在寫程式
- 🖥️ **Terminal** — 看起來在跑指令
- 📈 **股票看盤** — 看起來在關注市場（其實是聊天）

### 🌍 跨網域聊天（Firebase）

```
學生 A（學校 WiFi）←──→ Firebase Realtime DB ←──→ 學生 B（家裡 WiFi）
     掃描 QR Code 加好友
     或用 Google 帳號登入
```

- 支援 **Google 登入** 和 **匿名登入**
- 掃描 QR Code 即可加好友
- 訊息即時同步，跨裝置可用

---

## 🏗️ 技術架構

```
PWA（純前端）
├── 核心引擎
│   ├── js/chat.js          # 聊天核心 + 加密引擎
│   ├── js/llm.js           # LLM API 整合（OpenAI/Claude/自訂）
│   └── js/firebase.js      # Firebase Auth + Realtime DB
│
├── 功能模組
│   ├── js/shield.js        # 防護罩（Bingo + 情緒翻譯）
│   ├── js/bingo.js         # 職場黑話 Bingo
│   ├── js/disguise.js      # 變臉 UI
│   ├── js/fake-notify.js   # 假通知系統
│   └── js/boundary.js      # 下班結界
│
├── 社交系統
│   ├── js/friends.js       # 好友/代號系統
│   ├── js/groups.js        # 群組聊天
│   └── js/app.js           # 頁面路由 + UI
│
└── 部署
    ├── index.html
    ├── manifest.json       # PWA 安裝配置
    └── css/style.css
```

---

## 🛠️ 技術棧

| 技術 | 用途 |
|------|------|
| 純 HTML/CSS/JS | 無框架，零依賴，載入極快 |
| Firebase Auth | Google 登入 + 匿名登入 |
| Firebase Realtime DB | 跨網域即時聊天 |
| OpenAI API | AI 加密（可選）|
| QRCode.js | 掃碼加好友 |
| html5-qrcode | 相機掃描 |
| Service Worker | PWA 離線可用 |

---

## 🚀 快速開始

```bash
# 本地開發
python3 -m http.server 8888
# 打開 http://localhost:8888

# 或使用任何靜態伺服器
npx serve .
```

### Firebase 設定（可選）

如果要啟用跨網域聊天：
1. 去 [Firebase Console](https://console.firebase.google.com) 創建專案
2. 啟用 Realtime Database + Authentication
3. 在 `js/firebase.js` 填入 `firebaseConfig`
4. 啟用 Google / 匿名登入

---

## 🗺️ 產品路線圖

- [x] **核心功能**
  - [x] AI 加密聊天（6 主題）
  - [x] 變臉 UI（5 種偽裝）
  - [x] 下班結界
  - [x] 假通知
  - [x] 職場黑話 Bingo

- [x] **社交功能**
  - [x] 掃碼加好友
  - [x] Google / 匿名登入
  - [x] 私聊 + 群組
  - [x] Firebase 即時同步

- [ ] **AI 增強**
  - [ ] 智能主題切換（AI 自動判斷最適合的偽裝主題）
  - [ ] 語音輸入加密
  - [ ] 圖片加密（傳圖片自動加上 Excel 遮罩）

---

## ⚠️ 聲明

本工具僅供娛樂和正當用途。請遵守公司網路使用規範，我們不對任何使用後果負責。

---

## 📝 License

MIT License © 2026
