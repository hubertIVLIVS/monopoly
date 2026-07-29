// UI交互系统
class UI {
    constructor() {
        this.playerInfoBar = document.getElementById('playerInfoBar');
        this.messageLog = document.getElementById('messageLog');
        this.rollDiceBtn = document.getElementById('rollDiceBtn');
        this.buyPropertyBtn = document.getElementById('buyPropertyBtn');
        this.buildHouseBtn = document.getElementById('buildHouseBtn');
        this.sellPropertyBtn = document.getElementById('sellPropertyBtn');
        this.endTurnBtn = document.getElementById('endTurnBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        
        // 创建对话框容器
        this.createDialogContainer();
    }

    // 创建对话框容器
    createDialogContainer() {
        if (!document.getElementById('dialogContainer')) {
            const container = document.createElement('div');
            container.id = 'dialogContainer';
            container.className = 'dialog-container';
            // 不设置内联 display，由 CSS 类控制显示/隐藏
            document.body.appendChild(container);
        }
    }

    // 更新玩家信息显示
    updatePlayerInfo(players, currentPlayerIndex) {
        this.playerInfoBar.innerHTML = '';
        
        players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            
            if (index === currentPlayerIndex) {
                card.classList.add('active');
            }
            
            if (player.isBankrupt) {
                card.classList.add('bankrupt');
            }
            
            card.innerHTML = `
                <div class="player-name">
                    <span class="player-color-dot" style="background-color: ${player.color}"></span>
                    ${player.name}
                </div>
                <div class="player-money">💰 ${player.money}元</div>
                <div class="player-properties">🏠 地产: ${player.properties.length}</div>
                ${player.inJail ? '<div style="color: #e74c3c; font-size: 12px;">🔒 在监狱中</div>' : ''}
            `;
            
            this.playerInfoBar.appendChild(card);
        });
    }

    // 添加消息到日志
    addMessage(message, highlight = false) {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        
        if (highlight) {
            messageItem.classList.add('highlight');
        }
        
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        messageItem.innerHTML = `<span style="color: #999; font-size: 11px;">[${timestamp}]</span> ${message}`;
        
        this.messageLog.insertBefore(messageItem, this.messageLog.firstChild);
        
        // 限制消息数量
        while (this.messageLog.children.length > 50) {
            this.messageLog.removeChild(this.messageLog.lastChild);
        }
        
        // 自动滚动到顶部
        this.messageLog.scrollTop = 0;
    }

    // 清空消息日志
    clearMessages() {
        this.messageLog.innerHTML = '';
    }

    // 更新按钮状态
    updateButtons(state) {
        this.rollDiceBtn.disabled = !state.canRollDice;
        this.buyPropertyBtn.disabled = !state.canBuyProperty;
        this.buildHouseBtn.disabled = !state.canBuildHouse;
        if (this.sellPropertyBtn) {
            this.sellPropertyBtn.disabled = !state.canSellProperty;
        }
        this.endTurnBtn.disabled = !state.canEndTurn;
        
        // 更新按钮提示文字
        this.updateButtonTooltips(state);
    }

    // 更新按钮禁用时的提示文字
    updateButtonTooltips(state) {
        const buttons = [
            { el: this.rollDiceBtn, enabled: state.canRollDice, tip: '请先掷骰子' },
            { el: this.buyPropertyBtn, enabled: state.canBuyProperty, tip: '无可购买地产' },
            { el: this.buildHouseBtn, enabled: state.canBuildHouse, tip: '无可建造房屋' },
            { el: this.sellPropertyBtn, enabled: state.canSellProperty, tip: '无可出售地产' },
            { el: this.endTurnBtn, enabled: state.canEndTurn, tip: '请先掷骰子' }
        ];
        
        buttons.forEach(({ el, enabled, tip }) => {
            if (el && !enabled) {
                el.title = tip;
            } else if (el) {
                el.title = '';
            }
        });
    }

    // 显示自定义对话框（带弹性动画）
    showDialog(title, content, buttons) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'dialog';
            
            let buttonsHtml = '';
            buttons.forEach((btn, index) => {
                buttonsHtml += `<button class="btn ${btn.class || 'btn-primary'}" data-index="${index}">${btn.text}</button>`;
            });
            
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-title">${title}</div>
                    <div class="dialog-body">${content}</div>
                    <div class="dialog-footer">${buttonsHtml}</div>
                </div>
            `;
            
            const container = document.getElementById('dialogContainer');
            container.classList.add('active');
            container.appendChild(dialog);
            
            // 绑定按钮事件
            dialog.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    
                    container.removeChild(dialog);
                    if (container.children.length === 0) {
                        container.classList.remove('active');
                    }
                    resolve(index);
                });
            });
        });
    }
    
    // 金钱数字滚动动画
    animateMoneyChange(element, fromValue, toValue, duration = 800) {
        const startTime = performance.now();
        const diff = toValue - fromValue;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(fromValue + diff * easeProgress);
            
            element.textContent = `💰 ${currentValue}元`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // 显示购买地产对话框
    async showBuyPropertyDialog(property, player) {
        const canAfford = player.money >= property.price;
        const message = `
            <div class="property-info">
                <div class="property-name" style="color: ${property.color || '#333'}">${property.name}</div>
                <div class="property-price">价格: ${property.price}元</div>
                <div class="player-money">你的资金: ${player.money}元</div>
                ${!canAfford ? '<div class="insufficient-funds">资金不足！</div>' : ''}
            </div>
        `;
        
        this.addMessage(`${player.name}，是否购买${property.name}？价格: ${property.price}元`, true);
        
        const buttons = [
            { text: '购买', class: 'btn-success' },
            { text: '取消', class: 'btn-secondary' }
        ];
        
        const result = await this.showDialog('购买地产', message, buttons);
        return result === 0 && canAfford;
    }

    // 显示建造房屋对话框
    async showBuildHouseDialog(property, player) {
        const canAfford = player.money >= property.houseCost;
        const message = `
            <div class="property-info">
                <div class="property-name">${property.name}</div>
                <div class="house-cost">建造费用: ${property.houseCost}元</div>
                <div class="current-houses">当前房屋: ${property.houses || 0}个</div>
                <div class="player-money">你的资金: ${player.money}元</div>
                ${!canAfford ? '<div class="insufficient-funds">资金不足！</div>' : ''}
            </div>
        `;
        
        this.addMessage(`${player.name}，是否在${property.name}建造房屋？价格: ${property.houseCost}元`, true);
        
        const buttons = [
            { text: '建造', class: 'btn-warning' },
            { text: '取消', class: 'btn-secondary' }
        ];
        
        const result = await this.showDialog('建造房屋', message, buttons);
        return result === 0 && canAfford;
    }

    // 显示过路费支付提示
    showRentPayment(payer, owner, property, rent) {
        const message = `
            <div class="rent-info">
                <div class="rent-payer">${payer.name} 向 ${owner.name} 支付过路费</div>
                <div class="rent-property">${property.name}</div>
                <div class="rent-amount">金额: ${rent}元</div>
            </div>
        `;
        
        this.addMessage(`${payer.name}向${owner.name}支付过路费${rent}元`, true);
        
        return this.showDialog('支付过路费', message, [{ text: '确定', class: 'btn-primary' }]);
    }

    // 显示事件卡（带翻牌动画）
    async showCard(card, type) {
        const typeName = type === 'chance' ? '机会卡' : '命运卡';
        const cardClass = type === 'chance' ? 'card-chance' : 'card-fate';
        const icon = type === 'chance' ? '?' : '★';
        
        this.addMessage(`抽取${typeName}: ${card.text}`, true);
        
        return new Promise((resolve) => {
            // 创建卡片容器
            const cardOverlay = document.createElement('div');
            cardOverlay.className = 'card-overlay';
            
            // 创建翻牌卡片
            const flipCard = document.createElement('div');
            flipCard.className = 'flip-card';
            
            flipCard.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front ${cardClass}">
                        <div class="card-icon">${icon}</div>
                        <div class="card-label">${typeName}</div>
                    </div>
                    <div class="flip-card-back ${cardClass}">
                        <div class="card-header ${cardClass}">
                            <span class="card-header-icon">${icon}</span>
                            <span class="card-header-title">${typeName}</span>
                        </div>
                        <div class="card-body-content">
                            <div class="card-text-display">${card.text}</div>
                        </div>
                        <div class="card-footer-content">
                            <button class="btn btn-primary card-confirm-btn">确定</button>
                        </div>
                    </div>
                </div>
            `;
            
            cardOverlay.appendChild(flipCard);
            document.body.appendChild(cardOverlay);
            
            // 触发动画：先显示背面（翻牌），延迟后翻开
            requestAnimationFrame(() => {
                flipCard.classList.add('flipped');
            });
            
            // 绑定确定按钮
            flipCard.querySelector('.card-confirm-btn').addEventListener('click', () => {
                // 添加淡出动画
                cardOverlay.classList.add('fade-out');
                setTimeout(() => {
                    if (document.body.contains(cardOverlay)) {
                        document.body.removeChild(cardOverlay);
                    }
                    resolve();
                }, 300);
            });
        });
    }

    // 显示升级选择对话框
    async showUpgradeDialog(upgradeableProperties, player) {
        if (!upgradeableProperties || upgradeableProperties.length === 0) return null;

        return new Promise((resolve) => {
            let listHtml = '<div class="upgrade-list">';
            upgradeableProperties.forEach((prop) => {
                const levelLabel = prop.houses === 4 ? '酒店' : `${prop.houses}栋 → ${prop.houses + 1}栋`;
                const disabledClass = !prop.canAfford ? 'upgrade-item-disabled' : '';
                listHtml += `
                    <div class="upgrade-item ${disabledClass}" data-space-id="${prop.spaceId}">
                        <div class="upgrade-item-left">
                            <span class="upgrade-color-dot" style="background-color: ${prop.color}"></span>
                            <span class="upgrade-name">${prop.name}</span>
                        </div>
                        <div class="upgrade-item-center">
                            <span class="upgrade-level">${levelLabel}</span>
                        </div>
                        <div class="upgrade-item-right">
                            <span class="upgrade-rent">过路费: ${prop.currentRent} → ${prop.nextRent}元</span>
                            <span class="upgrade-cost">费用: ${prop.houseCost}元</span>
                            ${!prop.canAfford ? '<span class="upgrade-no-afford">资金不足</span>' : ''}
                        </div>
                    </div>
                `;
            });
            listHtml += '</div>';

            const message = `
                <div class="upgrade-dialog-content">
                    <div class="upgrade-player-money">当前资金: ${player.money}元</div>
                    ${listHtml}
                </div>
            `;

            const buttons = [
                { text: '跳过升级', class: 'btn-secondary' }
            ];

            const dialog = document.createElement('div');
            dialog.className = 'dialog';

            let buttonsHtml = '';
            buttons.forEach((btn, index) => {
                buttonsHtml += `<button class="btn ${btn.class || 'btn-primary'}" data-action="skip">${btn.text}</button>`;
            });

            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-title">升级地产</div>
                    <div class="dialog-body">${message}</div>
                    <div class="dialog-footer">${buttonsHtml}</div>
                </div>
            `;

            const container = document.getElementById('dialogContainer');
            container.classList.add('active');
            container.appendChild(dialog);

            // 绑定升级项点击事件
            dialog.querySelectorAll('.upgrade-item:not(.upgrade-item-disabled)').forEach(item => {
                item.addEventListener('click', () => {
                    const spaceId = parseInt(item.dataset.spaceId);
                    container.removeChild(dialog);
                    if (container.children.length === 0) container.classList.remove('active');
                    resolve(spaceId);
                });
            });

            // 绑定跳过按钮
            dialog.querySelectorAll('[data-action="skip"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.removeChild(dialog);
                    if (container.children.length === 0) container.classList.remove('active');
                    resolve(-1);
                });
            });
        });
    }

    // 显示出售地产对话框
    async showSellDialog(sellableProperties, player) {
        if (!sellableProperties || sellableProperties.length === 0) return null;

        return new Promise((resolve) => {
            let listHtml = '<div class="sell-list">';
            sellableProperties.forEach((prop) => {
                const housesText = prop.houses > 0 ? ` (${prop.houses}栋房屋)` : '';
                listHtml += `
                    <div class="sell-item" data-space-id="${prop.spaceId}">
                        <div class="sell-item-left">
                            <span class="sell-color-dot" style="background-color: ${prop.color}"></span>
                            <span class="sell-name">${prop.name}${housesText}</span>
                        </div>
                        <div class="sell-item-right">
                            <span class="sell-price">出售价: ${prop.sellPrice}元</span>
                            <span class="sell-original">原价: ${prop.originalPrice}元</span>
                        </div>
                    </div>
                `;
            });
            listHtml += '</div>';

            const message = `
                <div class="sell-dialog-content">
                    <div class="sell-player-money">当前资金: ${player.money}元</div>
                    <div class="sell-tip">提示: 出售地产将获得原价一半的金额，房屋价值也按一半计算</div>
                    ${listHtml}
                </div>
            `;

            const buttons = [
                { text: '取消', class: 'btn-secondary' }
            ];

            const dialog = document.createElement('div');
            dialog.className = 'dialog';

            let buttonsHtml = '';
            buttons.forEach((btn, index) => {
                buttonsHtml += `<button class="btn ${btn.class || 'btn-primary'}" data-action="cancel">${btn.text}</button>`;
            });

            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-title">出售地产</div>
                    <div class="dialog-body">${message}</div>
                    <div class="dialog-footer">${buttonsHtml}</div>
                </div>
            `;

            const container = document.getElementById('dialogContainer');
            container.classList.add('active');
            container.appendChild(dialog);

            // 绑定出售项点击事件
            dialog.querySelectorAll('.sell-item').forEach(item => {
                item.addEventListener('click', () => {
                    const spaceId = parseInt(item.dataset.spaceId);
                    container.removeChild(dialog);
                    if (container.children.length === 0) container.classList.remove('active');
                    resolve(spaceId);
                });
            });

            // 绑定取消按钮
            dialog.querySelectorAll('[data-action="cancel"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.removeChild(dialog);
                    if (container.children.length === 0) container.classList.remove('active');
                    resolve(-1);
                });
            });
        });
    }

    // 显示游戏结束
    async showGameOver(winner) {
        const message = `
            <div class="game-over-info">
                <div class="winner-name" style="color: ${winner.color}">${winner.name}</div>
                <div class="winner-title">获胜！</div>
            </div>
        `;
        
        this.addMessage(`游戏结束！${winner.name}获胜！`, true);
        
        await this.showDialog('游戏结束', message, [{ text: '确定', class: 'btn-primary' }]);
    }

    // 绑定按钮事件
    bindEvents(callbacks) {
        this.rollDiceBtn.addEventListener('click', callbacks.onRollDice);
        this.buyPropertyBtn.addEventListener('click', callbacks.onBuyProperty);
        this.buildHouseBtn.addEventListener('click', callbacks.onBuildHouse);
        if (this.sellPropertyBtn) {
            this.sellPropertyBtn.addEventListener('click', callbacks.onSellProperty);
        }
        this.endTurnBtn.addEventListener('click', callbacks.onEndTurn);
        this.newGameBtn.addEventListener('click', callbacks.onNewGame);
    }

    // 显示加载状态
    showLoading() {
        this.addMessage('正在加载游戏数据...', false);
    }

    // 隐藏加载状态
    hideLoading() {
        this.addMessage('游戏加载完成！', false);
    }

    // 显示格子详细信息
    showSpaceInfo(space, board, propertySystem) {
        let content = '<div class="space-info">';
        
        // 格子名称
        content += `<div class="space-name">${space.name}</div>`;
        
        // 格子类型
        const typeNames = {
            'start': '起点',
            'property': '地产',
            'railroad': '火车站',
            'utility': '公用事业',
            'chance': '机会',
            'fate': '命运',
            'tax': '税款',
            'jail': '监狱',
            'parking': '免费停车',
            'gotojail': '入狱'
        };
        const typeName = typeNames[space.type] || space.type;
        content += `<div class="space-type">类型: ${typeName}</div>`;
        
        // 根据类型显示不同信息
        if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
            const propertyInfo = propertySystem.getPropertyInfo(space.id, board);
            
            if (propertyInfo) {
                // 价格
                content += `<div class="space-price">价格: ${propertyInfo.price}元</div>`;
                
                // 颜色组（仅地产）
                if (space.type === 'property' && propertyInfo.color) {
                    const groupName = this.getGroupName(space.group);
                    content += `<div class="space-group"><span class="group-color-dot" style="background-color: ${propertyInfo.color}"></span>颜色组: ${groupName}</div>`;
                }
                
                // 过路费
                if (propertyInfo.type === 'property') {
                    const houses = propertyInfo.houses || 0;
                    const rent = propertyInfo.rent[houses];
                    content += `<div class="space-rent">过路费: ${rent}元</div>`;
                    content += `<div class="space-houses">房屋: ${houses >= 5 ? '酒店' : houses + '栋'}</div>`;
                } else if (propertyInfo.type === 'railroad') {
                    content += `<div class="space-rent">过路费: 50-200元 (根据拥有数量)</div>`;
                } else if (propertyInfo.type === 'utility') {
                    content += `<div class="space-rent">过路费: 骰子点数×10/20</div>`;
                }
                
                // 所有者
                const ownerName = propertySystem.getPropertyOwner(space.id);
                if (ownerName) {
                    content += `<div class="space-owner">所有者: ${ownerName}</div>`;
                } else {
                    content += `<div class="space-owner unowned">待售</div>`;
                }
            }
        } else if (space.type === 'tax') {
            content += `<div class="space-amount">税款: ${space.amount}元</div>`;
        } else if (space.type === 'chance' || space.type === 'fate') {
            content += `<div class="space-description">抽取一张${typeName}卡</div>`;
        } else if (space.type === 'start') {
            content += `<div class="space-description">经过或停留获得200元</div>`;
        } else if (space.type === 'jail') {
            content += `<div class="space-description">探访监狱（不入狱）</div>`;
        } else if (space.type === 'parking') {
            content += `<div class="space-description">免费停车休息</div>`;
        } else if (space.type === 'gotojail') {
            content += `<div class="space-description">直接入狱</div>`;
        }
        
        content += '</div>';
        
        this.addMessage(`查看格子信息: ${space.name}`, false);
        
        return this.showDialog('格子信息', content, [{ text: '关闭', class: 'btn-primary' }]);
    }

    // 获取颜色组中文名称
    getGroupName(group) {
        const groupNames = {
            'brown': '棕色',
            'lightblue': '浅蓝色',
            'pink': '粉色',
            'orange': '橙色',
            'red': '红色',
            'yellow': '黄色'
        };
        return groupNames[group] || group;
    }
}
