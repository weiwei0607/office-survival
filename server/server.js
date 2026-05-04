/**
 * Office Survival 多人聊天伺服器
 * Socket.io + 記憶體存儲
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 9999;

// 靜態檔案伺服器（同時服務前端）
const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, '..', filePath);
    
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(data);
    });
});

// Socket.io
const io = new Server(server, {
    cors: { origin: '*' }
});

// 資料存儲
const users = new Map();        // socketId -> { id, codeName, realName, socketId, roomId }
const rooms = new Map();        // roomId -> { id, name, members: [], messages: [] }
const friendships = new Map();  // codeName -> Set of friend codeNames

// 生成唯一 ID
function generateId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 生成隨機人名
function generateRandomName() {
    const surnames = ['林', '陳', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '郭'];
    const maleNames = ['智', '明', '傑', '宏', '偉', '恩', '軒', '睿', '宇', '豪', '翔', '凱', '文', '廷', '佑'];
    const femaleNames = ['美', '婷', '君', '慧', '芬', '涵', '宜', '晴', '萱', '妤', '芸', '婕', '欣', '怡', '珊'];
    
    const isMale = Math.random() > 0.5;
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const name = isMale 
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)];
    
    const styles = [
        surname + name,
        '阿' + name,
        '小' + name,
        name + (isMale ? '哥' : '姐')
    ];
    
    return styles[Math.floor(Math.random() * styles.length)];
}

io.on('connection', (socket) => {
    console.log('用戶連接:', socket.id);
    
    // 用戶登入（設定代號）
    socket.on('login', (data) => {
        const codeName = data.codeName || generateRandomName();
        const user = {
            id: generateId(),
            codeName: codeName,
            realName: data.realName || codeName,
            socketId: socket.id,
            roomId: null
        };
        
        users.set(socket.id, user);
        socket.emit('loginSuccess', { 
            userId: user.id, 
            codeName: user.codeName,
            publicId: user.id // 用於添加好友的公開ID
        });
        
        console.log(`用戶登入: ${codeName} (${user.id})`);
    });
    
    // 創建房間（群組）
    socket.on('createRoom', (data) => {
        const user = users.get(socket.id);
        if (!user) return;
        
        const roomId = generateId();
        const room = {
            id: roomId,
            name: data.name || generateRandomName() + '的群組',
            owner: user.codeName,
            members: [user.codeName],
            messages: [],
            theme: data.theme || 'office'
        };
        
        rooms.set(roomId, room);
        user.roomId = roomId;
        socket.join(roomId);
        
        socket.emit('roomCreated', { roomId, room });
        console.log(`房間創建: ${room.name} (${roomId})`);
    });
    
    // 加入房間
    socket.on('joinRoom', (data) => {
        const user = users.get(socket.id);
        if (!user) return;
        
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (!room) {
            socket.emit('error', { message: '房間不存在' });
            return;
        }
        
        user.roomId = roomId;
        socket.join(roomId);
        
        if (!room.members.includes(user.codeName)) {
            room.members.push(user.codeName);
        }
        
        // 發送歷史訊息
        socket.emit('roomJoined', { 
            roomId, 
            room,
            history: room.messages.slice(-50)
        });
        
        // 通知其他成員
        socket.to(roomId).emit('memberJoined', {
            codeName: user.codeName,
            members: room.members
        });
        
        console.log(`${user.codeName} 加入房間 ${roomId}`);
    });
    
    // 發送訊息（群組）
    socket.on('sendMessage', (data) => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;
        
        const room = rooms.get(user.roomId);
        if (!room) return;
        
        const msg = {
            id: generateId(),
            text: data.text,
            displayText: data.displayText || data.text,
            sender: user.codeName,
            senderId: user.id,
            time: new Date().toISOString(),
            mode: data.mode || 'normal'
        };
        
        room.messages.push(msg);
        
        // 廣播給房間所有人
        io.to(user.roomId).emit('newMessage', msg);
        
        console.log(`${user.codeName}: ${msg.text.substring(0, 30)}`);
    });
    
    // 私聊：添加好友（透過公開ID）
    socket.on('addFriend', (data) => {
        const user = users.get(socket.id);
        if (!user) return;
        
        // 查找對方
        let targetUser = null;
        for (const [sid, u] of users) {
            if (u.id === data.friendId || u.codeName === data.friendCodeName) {
                targetUser = u;
                break;
            }
        }
        
        if (!targetUser) {
            socket.emit('error', { message: '找不到該用戶，對方可能已離線' });
            return;
        }
        
        if (targetUser.codeName === user.codeName) {
            socket.emit('error', { message: '不能加自己為好友' });
            return;
        }
        
        // 建立雙向好友關係
        if (!friendships.has(user.codeName)) {
            friendships.set(user.codeName, new Set());
        }
        if (!friendships.has(targetUser.codeName)) {
            friendships.set(targetUser.codeName, new Set());
        }
        
        friendships.get(user.codeName).add(targetUser.codeName);
        friendships.get(targetUser.codeName).add(user.codeName);
        
        // 通知雙方
        socket.emit('friendAdded', {
            codeName: targetUser.codeName,
            realName: targetUser.realName,
            publicId: targetUser.id
        });
        
        // 如果對方在線，也通知對方
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) {
            targetSocket.emit('friendAdded', {
                codeName: user.codeName,
                realName: user.realName,
                publicId: user.id
            });
        }
        
        console.log(`${user.codeName} 添加 ${targetUser.codeName} 為好友`);
    });
    
    // 獲取好友列表
    socket.on('getFriends', () => {
        const user = users.get(socket.id);
        if (!user) return;
        
        const myFriends = friendships.get(user.codeName) || new Set();
        const friendList = [];
        
        for (const friendCodeName of myFriends) {
            // 查找好友是否在線
            let isOnline = false;
            let friendId = null;
            for (const [sid, u] of users) {
                if (u.codeName === friendCodeName) {
                    isOnline = true;
                    friendId = u.id;
                    break;
                }
            }
            
            friendList.push({
                codeName: friendCodeName,
                isOnline: isOnline,
                publicId: friendId
            });
        }
        
        socket.emit('friendList', friendList);
    });
    
    // 獲取在線用戶列表（公開的）
    socket.on('getOnlineUsers', () => {
        const user = users.get(socket.id);
        if (!user) return;
        
        const onlineUsers = [];
        for (const [sid, u] of users) {
            if (u.codeName !== user.codeName) {
                onlineUsers.push({
                    codeName: u.codeName,
                    publicId: u.id
                });
            }
        }
        
        socket.emit('onlineUsers', onlineUsers);
    });
    
    // 私聊發送訊息
    socket.on('sendPrivateMessage', (data) => {
        const user = users.get(socket.id);
        if (!user) return;
        
        // 查找對方 socket
        let targetSocketId = null;
        for (const [sid, u] of users) {
            if (u.codeName === data.to) {
                targetSocketId = sid;
                break;
            }
        }
        
        const msg = {
            id: generateId(),
            text: data.text,
            displayText: data.displayText || data.text,
            sender: user.codeName,
            senderId: user.id,
            to: data.to,
            time: new Date().toISOString(),
            mode: data.mode || 'normal'
        };
        
        // 發送給自己（確認送達）
        socket.emit('privateMessage', msg);
        
        // 發送給對方
        if (targetSocketId) {
            io.to(targetSocketId).emit('privateMessage', msg);
        }
        
        console.log(`[私聊] ${user.codeName} -> ${data.to}: ${msg.text.substring(0, 30)}`);
    });
    
    // 斷線處理
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            console.log(`用戶離線: ${user.codeName}`);
            
            // 通知房間成員
            if (user.roomId) {
                const room = rooms.get(user.roomId);
                if (room) {
                    socket.to(user.roomId).emit('memberLeft', {
                        codeName: user.codeName,
                        members: room.members.filter(m => m !== user.codeName)
                    });
                }
            }
            
            // 延遲刪除（讓對方有時間重連）
            setTimeout(() => {
                const current = users.get(socket.id);
                if (current && current.socketId === socket.id) {
                    users.delete(socket.id);
                }
            }, 30000); // 30秒後刪除
        }
    });
});

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🛡️ Office Survival Server 啟動`);
    console.log(`========================================`);
    console.log(`前端網址: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`同網域手機: http://<你的IP>:${PORT}`);
    console.log(`========================================`);
});
