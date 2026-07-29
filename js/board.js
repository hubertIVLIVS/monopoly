// 棋盘绘制类
class Board {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.spaces = [];
        this.cellSize = 70; // 每个格子大小
        this.players = [];
        this.hoveredSpace = -1; // 悬停的格子索引
        
        // 动画相关
        this.animationPlayers = new Map(); // 存储玩家动画状态
        
        // 颜色配置
        this.colors = {
            start: '#3498db',
            chance: '#f39c12',
            fate: '#9b59b6',
            tax: '#e74c3c',
            jail: '#95a5a6',
            parking: '#2ecc71',
            station: '#34495e',
            utility: '#1abc9c',
            brown: '#8B4513',
            lightblue: '#87CEEB',
            pink: '#FF69B4',
            orange: '#FFA500',
            red: '#FF0000',
            yellow: '#FFFF00',
            gotojail: '#e74c3c'
        };
        
        // UI和PropertySystem引用（由Game设置）
        this.ui = null;
        this.propertySystem = null;
        
        // 绑定鼠标和触摸事件
        this.bindMouseEvents();
        this.bindTouchEvents();
    }
    
    // 绑定鼠标事件
    bindMouseEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const { x, y } = this.getCanvasCoordinates(e);
            
            // 检测悬停的格子
            const spaceIndex = this.getSpaceAtPosition(x, y);
            if (spaceIndex !== this.hoveredSpace) {
                this.hoveredSpace = spaceIndex;
                this.draw();
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredSpace = -1;
            this.draw();
        });
        
        // 点击事件：显示格子详细信息
        this.canvas.addEventListener('click', (e) => {
            const { x, y } = this.getCanvasCoordinates(e);
            this.handleSpaceClick(x, y);
        });
    }
    
    // 绑定触摸事件（移动端支持）
    bindTouchEvents() {
        // 使用 touchstart 快速响应，阻止 300ms 延迟和双击缩放
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return; // 仅处理单指触摸
            
            const touch = e.touches[0];
            const { x, y } = this.getCanvasCoordinates(touch);
            
            // 触摸时清除悬停状态
            if (this.hoveredSpace !== -1) {
                this.hoveredSpace = -1;
                this.draw();
            }
            
            this.handleSpaceClick(x, y);
            e.preventDefault(); // 阻止默认行为（如双击缩放）
        }, { passive: false });
    }
    
    // 将客户端坐标转换为 Canvas 内部坐标（处理 CSS transform scale）
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        // rect 返回的是视觉（缩放后）的边界框
        // 需要按比例映射回 Canvas 原始坐标
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        return { x, y };
    }
    
    // 处理格子点击（触摸和点击共用）
    handleSpaceClick(x, y) {
        const spaceIndex = this.getSpaceAtPosition(x, y);
        if (spaceIndex === -1) return;
        
        const space = this.spaces[spaceIndex];
        if (!space) return;
        
        // 调用 UI 显示格子信息
        if (this.ui && this.propertySystem) {
            this.ui.showSpaceInfo(space, this, this.propertySystem);
        } else {
            // 降级：使用 alert 显示基本信息
            alert(`格子: ${space.name}\n类型: ${space.type}`);
        }
    }
    
    // 获取指定位置的格子索引
    getSpaceAtPosition(x, y) {
        for (let i = 0; i < this.spacePositions.length; i++) {
            const pos = this.spacePositions[i];
            if (x >= pos.x && x <= pos.x + this.cellSize &&
                y >= pos.y && y <= pos.y + this.cellSize) {
                return i;
            }
        }
        return -1;
    }

    // 棋盘数据（内嵌，避免 file:// 协议下 fetch 跨域失败）
    loadBoardData() {
        this.spaces = [
            // 底边（右到左，i=0右下角起点，i=8左下角监狱）
            { "id": 0, "name": "起点", "type": "start", "group": "start" },
            { "id": 1, "name": "北京", "type": "property", "group": "brown" },
            { "id": 2, "name": "机会", "type": "chance", "group": "chance" },
            { "id": 3, "name": "上海", "type": "property", "group": "brown" },
            { "id": 4, "name": "所得税", "type": "tax", "group": "tax", "amount": 200 },
            { "id": 5, "name": "火车站1", "type": "railroad", "group": "station" },
            { "id": 6, "name": "广州", "type": "property", "group": "lightblue" },
            { "id": 7, "name": "命运", "type": "fate", "group": "fate" },
            { "id": 8, "name": "监狱", "type": "jail", "group": "jail" },
            // 左边（下到上，i=9~15中间格，i=16左上角免费停车）
            { "id": 9, "name": "深圳", "type": "property", "group": "lightblue" },
            { "id": 10, "name": "杭州", "type": "property", "group": "lightblue" },
            { "id": 11, "name": "成都", "type": "property", "group": "pink" },
            { "id": 12, "name": "电力公司", "type": "utility", "group": "utility" },
            { "id": 13, "name": "武汉", "type": "property", "group": "pink" },
            { "id": 14, "name": "南京", "type": "property", "group": "pink" },
            { "id": 15, "name": "机会", "type": "chance", "group": "chance" },
            { "id": 16, "name": "免费停车", "type": "parking", "group": "parking" },
            // 顶边（左到右，i=17~23中间格，i=24右上角入狱）
            { "id": 17, "name": "西安", "type": "property", "group": "orange" },
            { "id": 18, "name": "命运", "type": "fate", "group": "fate" },
            { "id": 19, "name": "重庆", "type": "property", "group": "orange" },
            { "id": 20, "name": "天津", "type": "property", "group": "orange" },
            { "id": 21, "name": "沈阳", "type": "property", "group": "red" },
            { "id": 22, "name": "机会", "type": "chance", "group": "chance" },
            { "id": 23, "name": "大连", "type": "property", "group": "red" },
            { "id": 24, "name": "入狱", "type": "gotojail", "group": "gotojail" },
            // 右边（上到下，i=25~31中间格）
            { "id": 25, "name": "青岛", "type": "property", "group": "red" },
            { "id": 26, "name": "火车站2", "type": "railroad", "group": "station" },
            { "id": 27, "name": "厦门", "type": "property", "group": "yellow" },
            { "id": 28, "name": "命运", "type": "fate", "group": "fate" },
            { "id": 29, "name": "昆明", "type": "property", "group": "yellow" },
            { "id": 30, "name": "贵阳", "type": "property", "group": "yellow" },
            { "id": 31, "name": "福州", "type": "property", "group": "yellow" }
        ];
        this.calculatePositions();
    }

    // 计算每个格子的位置（方形环形布局）
    calculatePositions() {
        const canvasSize = this.canvas.width;
        const totalSpaces = this.spaces.length; // 32格
        
        // 32格 = 4边 × 7中间格 + 4角格
        // 每边视觉上9格位置（含2角格），角格被相邻边共享
        
        this.cellSize = Math.floor((canvasSize - 10) / 9);
        const offset = Math.floor((canvasSize - this.cellSize * 9) / 2);
        
        this.spacePositions = [];
        
        for (let i = 0; i < totalSpaces; i++) {
            let x, y;
            
            // 角格位置（明确指定，确保对称）
            if (i === 0) {
                // 右下角
                x = offset + 8 * this.cellSize;
                y = offset + 8 * this.cellSize;
            } else if (i === 8) {
                // 左下角
                x = offset;
                y = offset + 8 * this.cellSize;
            } else if (i === 16) {
                // 左上角
                x = offset;
                y = offset;
            } else if (i === 24) {
                // 右上角
                x = offset + 8 * this.cellSize;
                y = offset;
            } else if (i < 8) {
                // 底边中间格 (i=1~7，从右到左)
                x = offset + (8 - i) * this.cellSize;
                y = offset + 8 * this.cellSize;
            } else if (i < 16) {
                // 左边中间格 (i=9~15，从下到上)
                x = offset;
                y = offset + (16 - i) * this.cellSize;
            } else if (i < 24) {
                // 顶边中间格 (i=17~23，从左到右)
                x = offset + (i - 16) * this.cellSize;
                y = offset;
            } else {
                // 右边中间格 (i=25~31，从上到下)
                x = offset + 8 * this.cellSize;
                y = offset + (i - 24) * this.cellSize;
            }
            
            this.spacePositions.push({ x, y });
        }
    }

    // 绘制棋盘
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制每个格子
        this.spaces.forEach((space, index) => {
            this.drawSpace(space, index);
        });
        
        // 绘制中央标题
        this.drawCenterTitle();
        
        // 绘制玩家
        this.drawPlayers();
    }

    // 绘制中央标题（偏上位置）
    drawCenterTitle() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height * 0.35; // 偏上位置
        
        // 绘制标题背景装饰
        ctx.save();
        
        // 绘制外圈装饰环
        const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 120);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
        gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.05)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制主标题"大富翁"
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 标题阴影
        ctx.shadowColor = 'rgba(102, 126, 234, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        
        // 主标题渐变
        const titleGradient = ctx.createLinearGradient(centerX - 100, centerY - 30, centerX + 100, centerY + 30);
        titleGradient.addColorStop(0, '#667eea');
        titleGradient.addColorStop(0.5, '#764ba2');
        titleGradient.addColorStop(1, '#667eea');
        
        ctx.fillStyle = titleGradient;
        ctx.font = 'bold 48px Microsoft YaHei';
        ctx.fillText('大富翁', centerX, centerY - 20);
        
        // 重置阴影
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // 副标题
        ctx.fillStyle = '#666';
        ctx.font = '16px Microsoft YaHei';
        ctx.fillText('MONOPOLY', centerX, centerY + 25);
        
        // 装饰线条
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 80, centerY + 45);
        ctx.lineTo(centerX + 80, centerY + 45);
        ctx.stroke();
        
        // 小装饰点
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(centerX - 85, centerY + 45, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 85, centerY + 45, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // 绘制单个格子
    drawSpace(space, index) {
        const pos = this.spacePositions[index];
        const ctx = this.ctx;
        const isHovered = index === this.hoveredSpace;
        
        // 绘制格子背景（悬停时高亮）
        ctx.fillStyle = isHovered ? '#e8f4ff' : '#ffffff';
        ctx.fillRect(pos.x, pos.y, this.cellSize, this.cellSize);
        
        // 绘制格子边框（悬停时加粗）
        ctx.strokeStyle = isHovered ? '#667eea' : '#333';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(pos.x, pos.y, this.cellSize, this.cellSize);
        
        // 绘制颜色标识条（更鲜明）
        const color = this.colors[space.group] || '#ccc';
        ctx.fillStyle = color;
        ctx.fillRect(pos.x + 2, pos.y + 2, this.cellSize - 4, 14);
        
        // 颜色条边框
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x + 2, pos.y + 2, this.cellSize - 4, 14);
        
        // 绘制格子名称
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 文字换行处理
        const name = space.name;
        const maxWidth = this.cellSize - 10;
        const lines = this.wrapText(name, maxWidth);
        const lineHeight = 12;
        const startY = pos.y + 27;
        
        lines.forEach((line, i) => {
            ctx.fillText(line, pos.x + this.cellSize / 2, startY + i * lineHeight);
        });
        
        // 绘制特殊标识
        if (space.type === 'chance') {
            this.drawQuestionMark(pos.x + this.cellSize / 2, pos.y + this.cellSize - 15, '?');
        } else if (space.type === 'fate') {
            this.drawQuestionMark(pos.x + this.cellSize / 2, pos.y + this.cellSize - 15, '★');
        } else if (space.type === 'tax') {
            this.drawQuestionMark(pos.x + this.cellSize / 2, pos.y + this.cellSize - 15, '$');
        }
        
        // 绘制所有者标记和房屋（需要propertySystem引用）
        if (this.propertySystem && (space.type === 'property' || space.type === 'railroad' || space.type === 'utility')) {
            const ownerName = this.propertySystem.getPropertyOwner(space.id);
            if (ownerName) {
                // 找到所有者玩家以获取颜色
                const ownerPlayer = this.players.find(p => p.name === ownerName);
                if (ownerPlayer) {
                    // 绘制所有者颜色标记（更醒目）
                    const markerX = pos.x + this.cellSize - 16;
                    const markerY = pos.y + this.cellSize - 16;
                    const markerSize = 14;
                    
                    // 添加发光效果
                    ctx.save();
                    ctx.shadowColor = ownerPlayer.color;
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = ownerPlayer.color;
                    ctx.fillRect(markerX, markerY, markerSize, markerSize);
                    ctx.restore();
                    
                    // 边框
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(markerX, markerY, markerSize, markerSize);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(markerX, markerY, markerSize, markerSize);
                }
                
                // 绘制房屋/酒店数量（仅普通地产）
                if (space.type === 'property') {
                    const detail = this.propertySystem.getPropertyDetail(space.id);
                    const houses = detail ? detail.houses : 0;
                    if (houses > 0) {
                        this.drawHouses(pos, houses);
                    }
                }
            }
        }
    }
    
    // 平滑移动玩家棋子（使用requestAnimationFrame）
    async animatePlayerMove(player, fromPosition, toPosition) {
        return new Promise((resolve) => {
            const steps = toPosition > fromPosition ? 
                toPosition - fromPosition : 
                (this.spaces.length - fromPosition) + toPosition;
            
            let currentStep = 0;
            const animate = () => {
                if (currentStep >= steps) {
                    resolve();
                    return;
                }
                
                currentStep++;
                const currentPosition = (fromPosition + currentStep) % this.spaces.length;
                player.position = currentPosition;
                this.draw();
                
                setTimeout(() => {
                    requestAnimationFrame(animate);
                }, 100);
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    // 绘制房屋/酒店
    drawHouses(pos, houses) {
        const ctx = this.ctx;
        const size = 6;
        const startX = pos.x + 5;
        const startY = pos.y + this.cellSize - 15;
        
        if (houses < 5) {
            // 绘制房屋（绿色小方块）
            for (let i = 0; i < houses; i++) {
                ctx.fillStyle = '#27ae60';
                ctx.fillRect(startX + i * (size + 2), startY, size, size);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(startX + i * (size + 2), startY, size, size);
            }
        } else {
            // 酒店（红色大方块）
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(startX, startY - 2, 12, 10);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(startX, startY - 2, 12, 10);
            // 酒店标记
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 7px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('H', startX + 6, startY + 3);
        }
    }

    // 文字换行
    wrapText(text, maxWidth) {
        const lines = [];
        let currentLine = '';
        
        for (let char of text) {
            const testLine = currentLine + char;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // 绘制问号或特殊符号
    drawQuestionMark(x, y, symbol) {
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, x, y);
    }

    // 绘制玩家棋子
    drawPlayers() {
        const playerPositions = {};
        
        // 统计每个位置的玩家数量
        this.players.forEach(player => {
            if (player.isBankrupt) return;
            
            const posKey = player.position;
            if (!playerPositions[posKey]) {
                playerPositions[posKey] = [];
            }
            playerPositions[posKey].push(player);
        });
        
        // 绘制每个位置的玩家
        Object.keys(playerPositions).forEach(posKey => {
            const players = playerPositions[posKey];
            const pos = this.spacePositions[parseInt(posKey)];
            
            players.forEach((player, index) => {
                const offsetX = (index % 2) * 20 + 10;
                const offsetY = Math.floor(index / 2) * 20 + 45;
                
                // 绘制圆形棋子
                this.ctx.fillStyle = player.color;
                this.ctx.beginPath();
                this.ctx.arc(pos.x + offsetX, pos.y + offsetY, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 绘制棋子边框
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 绘制玩家名称首字
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 10px Microsoft YaHei';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(player.name.charAt(0), pos.x + offsetX, pos.y + offsetY);
            });
        });
    }

    // 设置玩家列表
    setPlayers(players) {
        this.players = players;
        this.draw();
    }

    // 获取格子位置
    getSpacePosition(index) {
        return this.spacePositions[index];
    }
}
