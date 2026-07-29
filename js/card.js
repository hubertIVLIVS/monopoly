// 事件卡系统
class CardSystem {
    constructor() {
        this.chanceCards = [];
        this.fateCards = [];
        this.chanceIndex = 0;
        this.fateIndex = 0;
    }

    // 卡片数据（内嵌，避免 file:// 协议下 fetch 跨域失败）
    loadCards() {
        this.chanceCards = [
            { "id": 1, "text": "前进到起点，获得200元", "action": "move_to_start", "amount": 200 },
            { "id": 2, "text": "银行发放红利，获得50元", "action": "gain", "amount": 50 },
            { "id": 3, "text": "医疗费用，支付100元", "action": "lose", "amount": 100 },
            { "id": 4, "text": "前进3步", "action": "move_forward", "steps": 3 },
            { "id": 5, "text": "后退2步", "action": "move_backward", "steps": 2 },
            { "id": 6, "text": "房屋维修，每栋房子支付25元", "action": "repair_house", "amount": 25 },
            { "id": 7, "text": "交通罚款，支付15元", "action": "lose", "amount": 15 },
            { "id": 8, "text": "生日礼物，从每位玩家获得10元", "action": "birthday", "amount": 10 },
            { "id": 9, "text": "彩票中奖，获得100元", "action": "gain", "amount": 100 },
            { "id": 10, "text": "进入监狱，无法移动3回合", "action": "go_to_jail" },
            { "id": 11, "text": "前进到第15格", "action": "move_to", "position": 15 },
            { "id": 12, "text": "当选董事长，每位玩家支付50元", "action": "chairman", "amount": 50 },
            { "id": 13, "text": "建筑贷款到期，获得150元", "action": "gain", "amount": 150 },
            { "id": 14, "text": "考试不及格，罚款50元", "action": "lose", "amount": 50 },
            { "id": 15, "text": "找到宝藏，获得200元", "action": "gain", "amount": 200 }
        ];
        this.fateCards = [
            { "id": 1, "text": "股票下跌，损失50元", "action": "lose", "amount": 50 },
            { "id": 2, "text": "继承遗产，获得100元", "action": "gain", "amount": 100 },
            { "id": 3, "text": "保险到期，支付80元", "action": "lose", "amount": 80 },
            { "id": 4, "text": "投资成功，获得120元", "action": "gain", "amount": 120 },
            { "id": 5, "text": "医疗费用，支付60元", "action": "lose", "amount": 60 },
            { "id": 6, "text": "前进到第20格", "action": "move_to", "position": 20 },
            { "id": 7, "text": "后退4步", "action": "move_backward", "steps": 4 },
            { "id": 8, "text": "获得奖金，获得75元", "action": "gain", "amount": 75 },
            { "id": 9, "text": "罚款，支付40元", "action": "lose", "amount": 40 },
            { "id": 10, "text": "进入监狱", "action": "go_to_jail" },
            { "id": 11, "text": "房屋保险到期，支付30元", "action": "lose", "amount": 30 },
            { "id": 12, "text": "工作奖金，获得90元", "action": "gain", "amount": 90 },
            { "id": 13, "text": "交通违规，罚款20元", "action": "lose", "amount": 20 },
            { "id": 14, "text": "前进到第10格", "action": "move_to", "position": 10 },
            { "id": 15, "text": "幸运之星，获得150元", "action": "gain", "amount": 150 }
        ];
    }

    // 抽取机会卡
    drawChanceCard() {
        if (this.chanceCards.length === 0) return null;
        
        const card = this.chanceCards[this.chanceIndex];
        this.chanceIndex = (this.chanceIndex + 1) % this.chanceCards.length;
        return card;
    }

    // 抽取命运卡
    drawFateCard() {
        if (this.fateCards.length === 0) return null;
        
        const card = this.fateCards[this.fateIndex];
        this.fateIndex = (this.fateIndex + 1) % this.fateCards.length;
        return card;
    }

    // 执行卡片效果
    async executeCardEffect(card, player, game) {
        const message = card.text;
        const boardSize = game.board.spaces.length;
        
        switch (card.action) {
            case 'move_to_start':
                // 移动到起点并获得奖金
                player.position = 0;
                player.addMoney(card.amount);
                return { 
                    message: `${player.name} ${message}`, 
                    movePlayer: true,
                    newPosition: 0,
                    passedStart: false,
                    moneyChange: card.amount
                };
                
            case 'gain':
                player.addMoney(card.amount);
                return { 
                    message: `${player.name} ${message}`,
                    moneyChange: card.amount
                };
                
            case 'lose':
                player.subtractMoney(card.amount);
                return { 
                    message: `${player.name} ${message}`,
                    moneyChange: -card.amount
                };
                
            case 'move_forward':
                // 前进指定步数，只有走到起点才加200（经过不加分）
                const oldPosForward = player.position;
                player.moveForward(card.steps, boardSize);
                const landOnStartForward = player.position === 0;
                if (landOnStartForward) {
                    player.addMoney(200);
                }
                return { 
                    message: `${player.name} ${message}`, 
                    movePlayer: true,
                    newPosition: player.position,
                    passedStart: landOnStartForward,
                    moneyChange: landOnStartForward ? 200 : 0
                };
                
            case 'move_backward':
                // 后退指定步数
                player.moveBackward(card.steps, boardSize);
                return { 
                    message: `${player.name} ${message}`, 
                    movePlayer: true,
                    newPosition: player.position,
                    passedStart: false,
                    moneyChange: 0
                };
                
            case 'move_to':
                // 移动到指定位置，只有走到起点才加200（经过不加分）
                const oldPosMoveTo = player.position;
                player.position = card.position;
                const landOnStartMoveTo = player.position === 0;
                if (landOnStartMoveTo) {
                    player.addMoney(200);
                }
                return { 
                    message: `${player.name} ${message}`, 
                    movePlayer: true,
                    newPosition: player.position,
                    passedStart: landOnStartMoveTo,
                    moneyChange: landOnStartMoveTo ? 200 : 0
                };
                
            case 'go_to_jail':
                // 进入监狱
                player.goToJail();
                return { 
                    message: `${player.name} ${message}`, 
                    movePlayer: true,
                    newPosition: 10,
                    passedStart: false,
                    moneyChange: 0,
                    goToJail: true
                };
                
            case 'repair_house':
                // 房屋维修费：从 propertySystem.propertyDetails 获取真实房屋数量
                // player.properties 中的 houses 是购买时的快照（始终为0），不能反映后续建造
                let cost = 0;
                player.properties.forEach(prop => {
                    if (prop.type === 'property' && prop.id !== undefined) {
                        const detail = game.propertySystem.propertyDetails[prop.id];
                        if (detail && detail.houses > 0) {
                            // houses 1-4 为普通房屋，5 为酒店
                            // 酒店按 card.amount * 4 计算（或按 card.hotel_amount 如果存在）
                            if (detail.houses === 5) {
                                const hotelCost = card.hotel_amount || card.amount * 4;
                                cost += hotelCost;
                            } else {
                                cost += detail.houses * card.amount;
                            }
                        }
                    }
                });
                player.subtractMoney(cost);
                return { 
                    message: `${player.name} ${message}，支付${cost}元`,
                    moneyChange: -cost
                };
                
            case 'birthday':
                // 生日礼物，从每位其他玩家获得金钱
                // 修复：只扣除其他玩家实际拥有的金额，避免金钱凭空产生
                let totalReceived = 0;
                game.players.forEach(p => {
                    if (p !== player && !p.isBankrupt) {
                        // 只扣除玩家实际拥有的金额（最多为 card.amount）
                        const actualAmount = Math.min(card.amount, p.money);
                        p.subtractMoney(actualAmount);
                        totalReceived += actualAmount;
                    }
                });
                player.addMoney(totalReceived);
                return { 
                    message: `${player.name} ${message}，获得${totalReceived}元`,
                    moneyChange: totalReceived
                };
                
            case 'chairman':
                // 当选董事长，向每位其他玩家支付金钱
                let totalPaid = 0;
                game.players.forEach(p => {
                    if (p !== player && !p.isBankrupt) {
                        p.addMoney(card.amount);
                        totalPaid += card.amount;
                    }
                });
                player.subtractMoney(totalPaid);
                return { 
                    message: `${player.name} ${message}，支付${totalPaid}元`,
                    moneyChange: -totalPaid
                };
                
            default:
                return { message: `${player.name} ${message}` };
        }
    }
}
