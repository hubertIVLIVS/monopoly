// 玩家类
class Player {
    constructor(name, color, startPosition = 0) {
        this.name = name;
        this.color = color;
        this.money = 1500; // 初始资金
        this.position = startPosition;
        this.properties = []; // 拥有的地产
        this.isBankrupt = false;
        this._bankruptProcessed = false; // 防止破产逻辑被重复处理
        this.inJail = false;
        this.jailTurns = 0;
        this.getOutOfJailCards = 0;
    }

    // 获取当前位置格子
    getCurrentSpace(board) {
        return board.spaces[this.position];
    }

    // 增加金钱
    addMoney(amount) {
        this.money += amount;
    }

    // 减少金钱
    subtractMoney(amount) {
        this.money -= amount;
        if (this.money < 0) {
            this.money = 0;
            this.isBankrupt = true;
        }
    }

    // 移动到指定位置（纯位置移动，不处理经过起点奖励）
    // 经过起点奖励由调用方（game.js 掷骰子 / card.js 卡片效果）各自处理，避免重复加钱
    moveTo(position, boardSize) {
        this.position = position;
        if (this.position >= boardSize) {
            this.position = this.position % boardSize;
        }
    }

    // 前进指定步数（带动画）
    async moveForwardAnimated(steps, boardSize, board, allPlayers) {
        let passedStart = false;
        
        for (let i = 0; i < steps; i++) {
            this.position++;
            
            // 检查是否经过起点
            if (this.position >= boardSize) {
                this.position = 0;
                passedStart = true;
            }
            
            // 更新棋盘显示，实现逐格移动效果
            if (board && allPlayers) {
                board.setPlayers(allPlayers);
            }
            
            // 每格移动延迟
            await this.sleep(150);
        }
        
        return passedStart;
    }
    
    // 前进指定步数（无动画，用于卡片的快速移动）
    moveForward(steps, boardSize) {
        const newPosition = this.position + steps;
        this.moveTo(newPosition, boardSize);
    }
    
    // 延迟函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 后退指定步数
    moveBackward(steps, boardSize) {
        let newPosition = this.position - steps;
        if (newPosition < 0) {
            newPosition = boardSize + newPosition;
        }
        this.position = newPosition;
    }

    // 购买地产
    buyProperty(property) {
        if (this.money >= property.price) {
            this.subtractMoney(property.price);
            this.properties.push(property);
            return true;
        }
        return false;
    }

    // 支付过路费
    payRent(amount) {
        this.subtractMoney(amount);
    }

    // 进入监狱
    goToJail() {
        this.inJail = true;
        this.jailTurns = 0;
        this.position = 8; // 监狱位置
    }

    // 出狱
    leaveJail() {
        this.inJail = false;
        this.jailTurns = 0;
    }

    // 监狱回合增加
    incrementJailTurns() {
        this.jailTurns++;
    }

    // 获取玩家信息
    getInfo() {
        return {
            name: this.name,
            color: this.color,
            money: this.money,
            position: this.position,
            properties: this.properties.length,
            isBankrupt: this.isBankrupt,
            inJail: this.inJail
        };
    }

    // 重置玩家状态
    reset() {
        this.money = 1500;
        this.position = 0;
        this.properties = [];
        this.isBankrupt = false;
        this._bankruptProcessed = false;
        this.inJail = false;
        this.jailTurns = 0;
        this.getOutOfJailCards = 0;
    }
}
