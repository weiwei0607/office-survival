/**
 * Office Survival 多人聊天伺服器
 * Socket.io + 記憶體存儲
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 9999;
const BASE_DIR = path.resolve(path.join(__dirname, '..'));
const MAX_MSG_LENGTH = 2000;
const MAX_CODENAME_LENGTH = 50;
const MAX_ROOM_MESSAGES = 500;

// 靜態檔案伺服器（同時服務前端）
const server = http.createServer((req, res) => {
    let urlPath = req.url === '/' ? '/index.html' : req.url;
    urlPath = urlPath.split('?')[0];
    const resolved = path.resolve(path.join(BASE_DIR, urlPath));

    // Path traversal protection
    const rootDir = path.resolve(__dirname, '..');
    const resolvedPath = path.resolve(resolved);
    if (!resolvedPath.startsWith(rootDir + path.sep) && resolvedPath !== rootDir) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(resolved);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };

    fs.readFile(resolved, (err, data) => {
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
    cors: {
        origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
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
        if (typeof data.codeName !== 'string' || data.codeName.length > MAX_CODENAME_LENGTH) return;
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
            publicId: user.id
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

        socket.emit('roomJoined', {
            roomId,
            room,
            history: room.messages.slice(-50)
        });

        socket.to(roomId).emit('memberJoined', {
            codeName: user.codeName,
            members: room.members
        });

        console.log(`${user.codeName} 加入房間 ${roomId}`);
    });

    // 發送訊息（群組）
    socket.on('sendMessage', (data) => {
        if (typeof data.text !== 'string' || data.text.length > MAX_MSG_LENGTH) return;
        if (data.displayText !== undefined && (typeof data.displayText !== 'string' || data.displayText.length > MAX_MSG_LENGTH)) return;

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
        if (room.messages.length > MAX_ROOM_MESSAGES) room.messages.shift();

        io.to(user.roomId).emit('newMessage', msg);

        console.log(`${user.codeName}: ${msg.text.substring(0, 30)}`);
    });

    // 私聊：添加好友（透過公開ID）
    socket.on('addFriend', (data) => {
        const user = users.get(socket.id);
        if (!user) return;

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

        if (!friendships.has(user.codeName)) {
            friendships.set(user.codeName, new Set());
        }
        if (!friendships.has(targetUser.codeName)) {
            friendships.set(targetUser.codeName, new Set());
        }

        friendships.get(user.codeName).add(targetUser.codeName);
        friendships.get(targetUser.codeName).add(user.codeName);

        socket.emit('friendAdded', {
            codeName: targetUser.codeName,
            realName: targetUser.realName,
            publicId: targetUser.id
        });

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

        if (!data.text || typeof data.text !== 'string') return;
        if (data.text.length > MAX_MSG_LENGTH) {
            socket.emit('error', { message: '訊息過長' });
            return;
        }
        if (data.displayText !== undefined && (typeof data.displayText !== 'string' || data.displayText.length > MAX_MSG_LENGTH)) return;

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

        socket.emit('privateMessage', msg);

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

            if (user.roomId) {
                const room = rooms.get(user.roomId);
                if (room) {
                    socket.to(user.roomId).emit('memberLeft', {
                        codeName: user.codeName,
                        members: room.members.filter(m => m !== user.codeName)
                    });
                }
            }

            setTimeout(() => {
                const current = users.get(socket.id);
                if (current && current.socketId === socket.id) {
                    users.delete(socket.id);
                }
            }, 30000);
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
