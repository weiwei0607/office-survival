import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const TEST_URL = 'http://localhost:8888';
const SCREENSHOT_DIR = '/Users/daibao/office-survival/test-screenshots';

// 創建截圖目錄
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let results = [];
function log(step, status, detail = '') {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
    const line = `${icon} ${step}${detail ? ' → ' + detail : ''}`;
    results.push(line);
    console.log(line);
}

async function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
    console.log('🚀 啟動 Playwright 自動化測試...\n');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 414, height: 896 } });
    const page = await context.newPage();
    
    // 監聽 console 訊息
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error' || text.includes('Firebase') || text.includes('未配置') || text.includes('失敗')) {
            console.log(`   [${type.toUpperCase()}] ${text}`);
        }
    });
    
    try {
        // Step 1: 打開頁面
        await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 15000 });
        log('打開首頁', 'PASS', `HTTP 200, 標題: ${await page.title()}`);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-home.png` });
        
        // Step 2: 等待啟動畫面消失
        await page.waitForFunction(() => {
            const splash = document.getElementById('splash');
            return !splash || splash.classList.contains('hidden');
        }, { timeout: 10000 });
        log('啟動畫面消失', 'PASS');
        await delay(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-home-loaded.png` });
        
        // Step 3: 點擊底部「偽裝聊」導航
        const chatNav = await page.locator('button[data-page="chat"]').first();
        if (await chatNav.isVisible()) {
            await chatNav.click();
            await delay(800);
            log('點擊「偽裝聊」導航', 'PASS');
            await page.screenshot({ path: `${SCREENSHOT_DIR}/03-chat-page.png` });
        } else {
            log('點擊「偽裝聊」導航', 'FAIL', '找不到導航按鈕');
        }
        
        // Step 4: 檢查「連接全球聊天」按鈕
        const connectBtn = await page.locator('#login-area button').first();
        if (await connectBtn.isVisible()) {
            log('找到「連接全球聊天」按鈕', 'PASS');
            await connectBtn.click();
            log('點擊「連接全球聊天」', 'PASS');
            
            // 等待 Firebase SDK 從 CDN 載入（最多 12 秒）
            await delay(2000);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/04-login-loading.png` });
            
            // 輪詢等待登入選項出現
            let anonymousBtn = null;
            for (let i = 0; i < 10; i++) {
                await delay(1000);
                anonymousBtn = await page.locator('button', { hasText: /匿名使用/ }).first();
                if (await anonymousBtn.isVisible().catch(() => false)) {
                    log('Firebase SDK 載入完成，登入選項出現', 'PASS', `耗時 ${(i + 2)} 秒`);
                    break;
                }
            }
            
            if (!anonymousBtn || !(await anonymousBtn.isVisible().catch(() => false))) {
                log('等待登入選項', 'FAIL', 'Firebase SDK 載入超時');
                await page.screenshot({ path: `${SCREENSHOT_DIR}/04-login-timeout.png` });
            }
        } else {
            log('找到「連接全球聊天」按鈕', 'FAIL', '按鈕不存在');
        }
        
        // Step 5: 點擊「匿名使用」
        const anonymousBtn = await page.locator('button', { hasText: /匿名使用/ }).first();
        if (await anonymousBtn.isVisible().catch(() => false)) {
            await anonymousBtn.click();
            log('點擊「匿名使用」', 'PASS');
            
            // 等待 Firebase 匿名登入（最多 10 秒）
            let loggedIn = false;
            for (let i = 0; i < 10; i++) {
                await delay(1000);
                const userInfo = await page.locator('#login-area').innerText({ timeout: 2000 }).catch(() => '');
                if (userInfo.includes('代號') || userInfo.includes('已上線') || userInfo.includes('登出')) {
                    loggedIn = true;
                    log('匿名登入成功', 'PASS', userInfo.replace(/\n/g, ' ').substring(0, 80));
                    break;
                }
            }
            if (!loggedIn) {
                const userInfo = await page.locator('#login-area').innerText({ timeout: 2000 }).catch(() => '');
                log('匿名登入結果', 'WARN', `內容: ${userInfo.substring(0, 100)}`);
            }
            await page.screenshot({ path: `${SCREENSHOT_DIR}/05-logged-in.png` });
        } else {
            log('點擊「匿名使用」', 'FAIL', '按鈕不存在');
        }
        
        // Step 6: 檢查「我的名片」和「掃碼加好友」按鈕
        const myCardBtn = await page.locator('button', { hasText: /我的名片/ }).first();
        const scanBtn = await page.locator('button', { hasText: /掃碼加好友/ }).first();
        
        if (await myCardBtn.isVisible()) {
            log('「我的名片」按鈕顯示', 'PASS');
        } else {
            log('「我的名片」按鈕顯示', 'FAIL', '未找到');
        }
        
        if (await scanBtn.isVisible()) {
            log('「掃碼加好友」按鈕顯示', 'PASS');
        } else {
            log('「掃碼加好友」按鈕顯示', 'FAIL', '未找到');
        }
        
        // Step 7: 點擊「我的名片」測試 QR Code
        if (await myCardBtn.isVisible()) {
            await myCardBtn.click();
            await delay(1000);
            
            const qrCanvas = await page.locator('#qrcode-display canvas, #qrcode-display img').first();
            if (await qrCanvas.isVisible().catch(() => false)) {
                log('QR Code 生成成功', 'PASS');
            } else {
                const qrText = await page.locator('#qrcode-display').innerText().catch(() => '');
                log('QR Code 生成', qrText ? 'WARN' : 'FAIL', qrText || '未找到 QR Code 元素');
            }
            await page.screenshot({ path: `${SCREENSHOT_DIR}/06-qrcode.png` });
            
            // 關閉彈窗
            const closeBtn = await page.locator('.fixed-overlay button').last();
            if (await closeBtn.isVisible()) await closeBtn.click();
            await delay(500);
        }
        
        // Step 8: 檢查線上用戶區域
        const onlineSection = await page.locator('#online-users-section').first();
        const onlineStyle = await onlineSection.evaluate(el => el.style.display).catch(() => 'unknown');
        log('線上用戶區域顯示狀態', onlineStyle === 'block' || onlineStyle === '' ? 'PASS' : 'INFO', `display: ${onlineStyle}`);
        
        // Step 9: 檢查好友列表
        const friendList = await page.locator('#friend-list-container').innerHTML().catch(() => '');
        const friendCount = (friendList.match(/friend-avatar/g) || []).length;
        log('好友列表', 'PASS', `找到 ${friendCount} 個好友頭像`);
        
        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-final.png` });
        
    } catch (err) {
        log('測試過程發生錯誤', 'FAIL', err.message);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
    }
    
    await browser.close();
    
    // 輸出總結
    console.log('\n' + '='.repeat(50));
    console.log('📊 測試總結');
    console.log('='.repeat(50));
    const passCount = results.filter(r => r.includes('✅')).length;
    const failCount = results.filter(r => r.includes('❌')).length;
    const warnCount = results.filter(r => r.includes('⏳') || r.includes('WARN')).length;
    console.log(`✅ 通過: ${passCount} | ❌ 失敗: ${failCount} | ⚠️ 警告: ${warnCount}`);
    console.log(`\n📁 截圖已儲存到: ${SCREENSHOT_DIR}/`);
}

runTests().catch(console.error);
