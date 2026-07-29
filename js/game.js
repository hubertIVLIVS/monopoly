// 游戏主逻辑
class Game {
    constructor() {
        this.board = null;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.dice = null;
        this.cardSystem = null;
        this.propertySystem = null;
        this.ui = null;
        this.gameState = 'waiting'; // waiting, rolling, moving, action, ended
        this.hasRolledDice = false;
    }

    // 初始化游戏
    async init() {
        this.ui = new UI();
        this.ui.showLoading();
        
        // 初始化各个系统
        this.board = new Board('gameBoard');
        this.dice = new Dice();
        this.cardSystem = new CardSystem();
        this.propertySystem = new PropertySystem();
        
        // 加载数据（已内嵌，同步加载）
        this.board.loadBoardData();
        this.cardSystem.loadCards();
        this.propertySystem.loadProperties();
        
        // 设置board的propertySystem和ui引用
        this.board.propertySystem = this.propertySystem;
        this.board.ui = this.ui;
        
        this.ui.hideLoading();
        this.ui.addMessage('点击"新游戏"开始游戏！');
        
        // 绑定事件
        this.bindEvents();
        
        // 初始绘制棋盘
        this.board.draw();
    }

    // 绑定按钮事件
    bindEvents() {
        this.ui.bindEvents({
            onRollDice: () => this.rollDice(),
            onBuyProperty: () => this.buyProperty(),
            onBuildHouse: () => this.buildHouse(),
            onSellProperty: () => this.sellProperty(),
            onEndTurn: () => this.endTurn(),
            onNewGame: () => this.newGame()
        });
    }

    // 开始新游戏
    newGame() {
        // 获取玩家数量（从main.js的全局变量）
        const count = window.getPlayerCount ? window.getPlayerCount() : 4;
        const playerConfigs = [
            { name: '玩家1', color: '#e74c3c' },
            { name: '玩家2', color: '#3498db' },
            { name: '玩家3', color: '#2ecc71' },
            { name: '玩家4', color: '#f39c12' }
        ];
        
        // 创建玩家
        this.players = playerConfigs.slice(0, count).map(config => new Player(config.name, config.color));
        
        this.currentPlayerIndex = 0;
        this.gameState = 'playing';
        this.hasRolledDice = false;
        
        // 重置地产所有权和地产详情（房屋数量等）
        this.propertySystem.ownedProperties = {};
        this.propertySystem.propertyDetails = {};
        
        // 更新UI
        this.updateUI();
        this.ui.clearMessages();
        this.ui.addMessage('游戏开始！玩家1的回合。', true);
        
        // 更新按钮状态
        this.ui.updateButtons({
            canRollDice: true,
            canBuyProperty: false,
            canBuildHouse: false,
            canSellProperty: false,
            canEndTurn: false
        });
    }

    // 掷骰子
    async rollDice() {
        if (this.gameState !== 'playing' || this.hasRolledDice) return;
        
        const currentPlayer = this.getCurrentPlayer();
        
        this.gameState = 'rolling';
        this.ui.updateButtons({
            canRollDice: false,
            canBuyProperty: false,
            canBuildHouse: false,
            canSellProperty: false,
            canEndTurn: false
        });
        
        // 掷骰子
        const result = await this.dice.roll();
        this.ui.addMessage(`${currentPlayer.name}掷出了 ${result.dice1} + ${result.dice2} = ${result.total}`);
        
        this.hasRolledDice = true;
        
        // 检查是否在监狱中
        if (currentPlayer.inJail) {
            await this.handleJailTurn(currentPlayer, result);
            return;
        }
        
        // 移动玩家
        await this.movePlayer(currentPlayer, result.total);
        
        // 处理到达格子的事件
        await this.handleLanding(currentPlayer, result.total);
    }

    // 检查玩家是否破产，若破产则处理
    // 注意：Player.subtractMoney 会在 money<0 时将其设为0并标记 isBankrupt=true
    // 因此这里检查 isBankrupt 标志，而非 money<0
    // 使用 _bankruptProcessed 标记防止同一次破产被重复处理
    checkBankruptcy(player) {
        if (player.isBankrupt && !player._bankruptProcessed) {
            player._bankruptProcessed = true;
            // 释放所有地产
            this.propertySystem.releaseAllProperties(player.name);
            // 清空玩家地产列表
            player.properties = [];
            this.ui.addMessage(`${player.name} 破产了！所有地产已被释放。`, true);
            this.updateUI();
            this.checkGameOver();
            return true;
        }
        return false;
    }

    // 在当前位置提供升级机会（仅当前所在地产，每次只能建一栋）
    async offerUpgradeAtCurrentSpace(player) {
        const space = player.getCurrentSpace(this.board);
        
        // 检查当前位置是否是自己的地产
        if (space.type !== 'property') return;
        
        const ownerName = this.propertySystem.getPropertyOwner(space.id);
        if (ownerName !== player.name) return;
        
        // 检查是否可以升级
        const detail = this.propertySystem.getPropertyDetail(space.id);
        if (!detail || detail.houses >= 5) return;
        
        // 检查是否拥有同色组全部地产
        if (!this.propertySystem.checkOwnsFullGroup(player.name, space.group, this.board)) return;
        
        const propertyInfo = this.propertySystem.getPropertyInfo(space.id, this.board);
        const houseCost = propertyInfo.houseCost;
        
        // 检查是否买得起
        if (player.money < houseCost) return;
        
        // 显示升级对话框（单栋）
        const levelName = detail.houses + 1 === 5 ? '酒店' : `${detail.houses + 1}栋房屋`;
        const message = `
            <div class="property-info">
                <div class="property-name" style="color: ${propertyInfo.color}">${space.name}</div>
                <div class="house-info">当前房屋: ${detail.houses}栋</div>
                <div class="house-cost">建造费用: ${houseCost}元</div>
                <div class="rent-info">过路费将提升至: ${propertyInfo.rent[detail.houses + 1]}元</div>
                <div class="player-money">你的资金: ${player.money}元</div>
            </div>
        `;
        
        const buttons = [
            { text: '建造', class: 'btn-warning' },
            { text: '取消', class: 'btn-secondary' }
        ];
        
        const result = await this.ui.showDialog('建造房屋', message, buttons);
        
        if (result === 0) { // 点击了"建造"按钮
            const success = this.propertySystem.buildHouse(player, space.id, this.board);
            if (success) {
                this.ui.addMessage(`${player.name}在${space.name}建造了${levelName}！`, true);
                this.updateUI();
                
                // 升级后检查是否破产
                this.checkBankruptcy(player);
            }
        }
    }

    // 处理监狱回合
    async handleJailTurn(player, diceResult) {
        player.incrementJailTurns();
        
        // 检查是否掷出对子
        if (diceResult.dice1 === diceResult.dice2) {
            this.ui.addMessage(`${player.name}掷出对子，出狱！`, true);
            player.leaveJail();
            
            // 掷出对子后正常移动
            await this.movePlayer(player, diceResult.total);
            await this.handleLanding(player, diceResult.total);
            return;
        }
        
        // 检查是否已经在监狱中3回合
        if (player.jailTurns >= 3) {
            // 支付50元出狱
            player.subtractMoney(50);
            this.ui.addMessage(`${player.name}支付50元出狱！`, true);

            // 检查破产
            if (this.checkBankruptcy(player)) return;

            player.leaveJail();
            
            // 出狱后正常移动
            await this.movePlayer(player, diceResult.total);
            await this.handleLanding(player, diceResult.total);
        } else {
            this.ui.addMessage(`${player.name}在监狱中（第${player.jailTurns}回合）`);
            this.ui.updateButtons({
                canRollDice: false,
                canBuyProperty: false,
                canBuildHouse: false,
                canSellProperty: false,
                canEndTurn: true
            });
        }
    }

    // 移动玩家（带动画）
    async movePlayer(player, steps) {
        const boardSize = this.board.spaces.length;
        
        // 使用动画移动方法
        await player.moveForwardAnimated(steps, boardSize, this.board, this.players);
        
        // 只有走到起点才获得200元（经过不加分）
        if (player.position === 0) {
            player.addMoney(200);
            this.ui.addMessage(`${player.name}到达起点，获得200元！`, true);
            this.updateUI();
        }
    }

    // 处理到达格子的事件
    async handleLanding(player, diceTotal) {
        const space = player.getCurrentSpace(this.board);
        this.ui.addMessage(`${player.name}到达${space.name}`);
        
        switch (space.type) {
            case 'property':
            case 'railroad':
            case 'utility':
                await this.handlePropertyLanding(player, space, diceTotal);
                break;
                
            case 'chance':
                await this.handleChanceCard(player);
                break;
                
            case 'fate':
                await this.handleFateCard(player);
                break;
                
            case 'tax':
                player.subtractMoney(space.amount);
                this.ui.addMessage(`${player.name}支付税款${space.amount}元`, true);
                // 检查税款导致破产
                if (this.checkBankruptcy(player)) return;
                break;
                
            case 'jail':
                this.ui.addMessage(`${player.name}探访监狱`);
                break;
                
            case 'gotojail':
                this.ui.addMessage(`${player.name}被送进监狱！`, true);
                player.goToJail();
                this.updateUI();
                break;
                
            default:
                break;
        }
        
        // 检查玩家是否破产（处理首次破产或已在分支中处理过的破产）
        this.checkBankruptcy(player);
        if (player.isBankrupt) {
            this.ui.updateButtons({
                canRollDice: false,
                canBuyProperty: false,
                canBuildHouse: false,
                canSellProperty: false,
                canEndTurn: true
            });
            return;
        }
        
        // 更新UI
        this.updateUI();
        this.gameState = 'action';
        
        // 更新按钮状态
        const canBuy = this.propertySystem.canBuyProperty(player, space, this.board);
        const canBuild = this.canBuildHouse(player);
        const canSell = this.canSellProperty(player);
        
        this.ui.updateButtons({
            canRollDice: false,
            canBuyProperty: canBuy,
            canBuildHouse: canBuild,
            canSellProperty: canSell,
            canEndTurn: true
        });
    }

    // 处理地产格子
    async handlePropertyLanding(player, space, diceTotal) {
        const ownerName = this.propertySystem.getPropertyOwner(space.id);
        
        if (!ownerName) {
            // 地产未被购买 - 自动触发购买对话框
            const propertyInfo = this.propertySystem.getPropertyInfo(space.id, this.board);
            this.ui.addMessage(`${space.name}待售，价格${propertyInfo.price}元`);
            
            // 检查玩家是否有足够金钱购买
            if (player.money >= propertyInfo.price) {
                // 显示购买对话框
                const bought = await this.ui.showBuyPropertyDialog(propertyInfo, player);
                if (bought) {
                    if (this.propertySystem.buyProperty(player, space.id, this.board)) {
                        this.ui.addMessage(`${player.name}购买了${propertyInfo.name}！`, true);
                        this.updateUI();
                    }
                }
            }
        } else if (ownerName !== player.name) {
            // 地产属于其他玩家，支付过路费
            const owner = this.players.find(p => p.name === ownerName);
            const propertyInfo = this.propertySystem.getPropertyInfo(space.id, this.board);
            const rent = this.propertySystem.calculateRent(propertyInfo, diceTotal, this.board);
            
            player.payRent(rent);
            owner.addMoney(rent);
            
            // 显示过路费支付提示
            await this.ui.showRentPayment(player, owner, propertyInfo, rent);
            
            // 检查过路费导致破产
            if (this.checkBankruptcy(player)) return;
            
            this.updateUI();
        } else {
            this.ui.addMessage(`${player.name}到达自己的地产`);
        }
    }

    // 处理机会卡
    async handleChanceCard(player) {
        const card = this.cardSystem.drawChanceCard();
        if (!card) return;
        
        // 显示卡片动画（带翻牌效果）
        await this.ui.showCard(card, 'chance');
        
        // 执行卡片效果
        const result = await this.cardSystem.executeCardEffect(card, player, this);
        
        // 更新棋盘显示
        if (result.movePlayer) {
            this.board.setPlayers(this.players);
        }
        
        // 显示效果结果
        this.ui.addMessage(result.message, true);
        
        // 如果卡片导致移动到新位置，触发新位置的事件（连锁效果）
        if (result.movePlayer && result.newPosition !== undefined) {
            const newSpace = player.getCurrentSpace(this.board);
            // 避免重复触发机会/命运卡（防止无限循环）
            if (newSpace.type === 'property' || newSpace.type === 'railroad' || newSpace.type === 'utility') {
                await this.handlePropertyLanding(player, newSpace, 0);
            } else if (newSpace.type === 'tax') {
                player.subtractMoney(newSpace.amount);
                this.ui.addMessage(`${player.name}支付税款${newSpace.amount}元`, true);
            } else if (newSpace.type === 'chance' || newSpace.type === 'fate') {
                // 连锁抽卡：再抽一张
                if (newSpace.type === 'chance') {
                    await this.handleChanceCard(player);
                } else {
                    await this.handleFateCard(player);
                }
            }
        }
        
        // 更新UI
        this.updateUI();
    }

    // 处理命运卡
    async handleFateCard(player) {
        const card = this.cardSystem.drawFateCard();
        if (!card) return;
        
        // 显示卡片动画（带翻牌效果）
        await this.ui.showCard(card, 'fate');
        
        // 执行卡片效果
        const result = await this.cardSystem.executeCardEffect(card, player, this);
        
        // 更新棋盘显示
        if (result.movePlayer) {
            this.board.setPlayers(this.players);
        }
        
        // 显示效果结果
        this.ui.addMessage(result.message, true);
        
        // 如果卡片导致移动到新位置，触发新位置的事件（连锁效果）
        if (result.movePlayer && result.newPosition !== undefined) {
            const newSpace = player.getCurrentSpace(this.board);
            // 避免重复触发机会/命运卡（防止无限循环）
            if (newSpace.type === 'property' || newSpace.type === 'railroad' || newSpace.type === 'utility') {
                await this.handlePropertyLanding(player, newSpace, 0);
            } else if (newSpace.type === 'tax') {
                player.subtractMoney(newSpace.amount);
                this.ui.addMessage(`${player.name}支付税款${newSpace.amount}元`, true);
            } else if (newSpace.type === 'chance' || newSpace.type === 'fate') {
                // 连锁抽卡：再抽一张
                if (newSpace.type === 'chance') {
                    await this.handleChanceCard(player);
                } else {
                    await this.handleFateCard(player);
                }
            }
        }
        
        // 更新UI
        this.updateUI();
    }

    // 购买地产
    async buyProperty() {
        const player = this.getCurrentPlayer();
        const space = player.getCurrentSpace(this.board);
        
        if (!this.propertySystem.canBuyProperty(player, space, this.board)) {
            return;
        }
        
        const property = this.propertySystem.getPropertyInfo(space.id, this.board);
        
        const bought = await this.ui.showBuyPropertyDialog(property, player);
        if (bought) {
            if (this.propertySystem.buyProperty(player, space.id, this.board)) {
                this.ui.addMessage(`${player.name}购买了${property.name}！`, true);
                this.updateUI();
            } else {
                this.ui.addMessage(`${player.name}资金不足，无法购买`);
            }
        }
        
        this.ui.updateButtons({
            canRollDice: false,
            canBuyProperty: false,
            canBuildHouse: false, // 购买地产后禁止同回合建造
            canSellProperty: this.canSellProperty(player),
            canEndTurn: true
        });
    }

    // 建造房屋（仅当前所在地块，每次只能建设一栋）
    async buildHouse() {
        const player = this.getCurrentPlayer();
        await this.offerUpgradeAtCurrentSpace(player);
        
        this.ui.updateButtons({
            canRollDice: false,
            canBuyProperty: false,
            canBuildHouse: false, // 建造后禁用，下次走到才能再建
            canSellProperty: this.canSellProperty(player),
            canEndTurn: true
        });
    }

    // 出售地产
    async sellProperty() {
        const player = this.getCurrentPlayer();
        const sellable = this.propertySystem.getSellableProperties(player, this.board);
        
        if (sellable.length === 0) {
            this.ui.addMessage('没有可出售的地产');
            return;
        }
        
        // 显示出售对话框
        const choice = await this.ui.showSellDialog(sellable, player);
        
        if (choice !== null && choice !== -1) {
            const property = sellable.find(p => p.spaceId === choice);
            if (property) {
                const sellPrice = this.propertySystem.sellProperty(player, choice, this.board);
                this.ui.addMessage(`${player.name}出售了${property.name}，获得${sellPrice}元`, true);
                this.updateUI();
            }
        }
        
        this.ui.updateButtons({
            canRollDice: false,
            canBuyProperty: false,
            canBuildHouse: this.canBuildHouse(player),
            canSellProperty: this.canSellProperty(player),
            canEndTurn: true
        });
    }

    // 检查是否可以出售地产
    canSellProperty(player) {
        const sellable = this.propertySystem.getSellableProperties(player, this.board);
        return sellable.length > 0;
    }

    // 检查是否可以建造房屋（仅检查当前所在地块）
    canBuildHouse(player) {
        const space = player.getCurrentSpace(this.board);
        
        // 必须是自己的地产
        if (space.type !== 'property') return false;
        
        const ownerName = this.propertySystem.getPropertyOwner(space.id);
        if (ownerName !== player.name) return false;
        
        // 检查是否可以升级
        const detail = this.propertySystem.getPropertyDetail(space.id);
        if (!detail || detail.houses >= 5) return false;
        
        // 检查是否拥有同色组全部地产
        if (!this.propertySystem.checkOwnsFullGroup(player.name, space.group, this.board)) return false;
        
        const propertyInfo = this.propertySystem.getPropertyInfo(space.id, this.board);
        const houseCost = propertyInfo.houseCost;
        
        // 检查是否买得起
        return player.money >= houseCost;
    }

    // 结束回合
    async endTurn() {
        // 切换到下一个未破产的玩家
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        let safety = 0;
        while (this.players[nextIndex].isBankrupt && safety < this.players.length) {
            nextIndex = (nextIndex + 1) % this.players.length;
            safety++;
        }

        // 如果所有其他玩家都破产了，游戏应该已经结束
        if (this.players[nextIndex].isBankrupt) {
            return;
        }

        this.currentPlayerIndex = nextIndex;
        this.hasRolledDice = false;
        this.gameState = 'playing';
        
        const currentPlayer = this.getCurrentPlayer();
        this.ui.addMessage(`轮到${currentPlayer.name}的回合`, true);
        
        this.updateUI();
        
        // 如果玩家在监狱中且已满3回合，强制出狱
        if (currentPlayer.inJail && currentPlayer.jailTurns >= 3) {
            currentPlayer.subtractMoney(50);
            this.ui.addMessage(`${currentPlayer.name}在监狱中待满3回合，支付50元出狱！`, true);
            
            if (this.checkBankruptcy(currentPlayer)) {
                return;
            }
            
            currentPlayer.leaveJail();
        }
        
        // 更新按钮状态
        this.ui.updateButtons({
            canRollDice: true,
            canBuyProperty: false,
            canBuildHouse: false,
            canSellProperty: false,
            canEndTurn: true
        });
    }

    // 检查游戏是否结束
    checkGameOver() {
        const activePlayers = this.players.filter(p => !p.isBankrupt);
        
        if (activePlayers.length === 1) {
            this.gameState = 'ended';
            this.ui.showGameOver(activePlayers[0]);
            this.ui.updateButtons({
                canRollDice: false,
                canBuyProperty: false,
                canBuildHouse: false,
                canSellProperty: false,
                canEndTurn: false
            });
        }
    }

    // 获取当前玩家
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // 更新UI
    updateUI() {
        this.ui.updatePlayerInfo(this.players, this.currentPlayerIndex);
        this.board.setPlayers(this.players);
    }

    // 延迟函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
