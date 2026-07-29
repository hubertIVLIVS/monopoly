// 地产系统
class PropertySystem {
    constructor() {
        this.properties = {};
        this.railroads = {};
        this.utilities = {};
        this.ownedProperties = {}; // 记录每个地产的所有者
        this.propertyDetails = {}; // 记录地产详细信息（房屋数量等）
    }

    // 地产数据（内嵌，避免 file:// 协议下 fetch 跨域失败）
    loadProperties() {
        this.properties = {
            "brown": {
                "color": "#8B4513",
                "price": 60,
                "rent": [2, 10, 30, 90, 160, 250],
                "house_cost": 50,
                "spaces": [1, 3]
            },
            "lightblue": {
                "color": "#87CEEB",
                "price": 100,
                "rent": [4, 20, 60, 180, 320, 450],
                "house_cost": 50,
                "spaces": [6, 9, 10]
            },
            "pink": {
                "color": "#FF69B4",
                "price": 140,
                "rent": [10, 30, 90, 270, 400, 550],
                "house_cost": 100,
                "spaces": [11, 13, 14]
            },
            "orange": {
                "color": "#FFA500",
                "price": 180,
                "rent": [14, 70, 200, 550, 750, 950],
                "house_cost": 100,
                "spaces": [17, 19, 20]
            },
            "red": {
                "color": "#FF0000",
                "price": 220,
                "rent": [18, 90, 250, 700, 875, 1050],
                "house_cost": 150,
                "spaces": [21, 23, 25]
            },
            "yellow": {
                "color": "#FFFF00",
                "price": 260,
                "rent": [22, 110, 330, 800, 975, 1150],
                "house_cost": 150,
                "spaces": [27, 29, 30, 31]
            }
        };
        this.railroads = {
            "price": 200,
            "rent": [50, 100, 150, 200],
            "spaces": [5, 26]
        };
        this.utilities = {
            "price": 150,
            "spaces": [12]
        };
    }

    // 获取地产信息
    getPropertyInfo(spaceId, board) {
        const space = board.spaces[spaceId];
        
        if (space.type === 'property') {
            const group = space.group;
            const propData = this.properties[group];
            const detail = this.propertyDetails[spaceId] || { houses: 0 };
            return {
                id: spaceId,
                name: space.name,
                type: 'property',
                group: group,
                color: propData.color,
                price: propData.price,
                rent: propData.rent,
                houseCost: propData.house_cost,
                houses: detail.houses,
                owner: this.ownedProperties[spaceId] || null
            };
        } else if (space.type === 'railroad') {
            return {
                id: spaceId,
                name: space.name,
                type: 'railroad',
                price: this.railroads.price,
                rent: this.railroads.rent,
                owner: this.ownedProperties[spaceId] || null
            };
        } else if (space.type === 'utility') {
            return {
                id: spaceId,
                name: space.name,
                type: 'utility',
                price: this.utilities.price,
                owner: this.ownedProperties[spaceId] || null
            };
        }
        
        return null;
    }

    // 购买地产
    buyProperty(player, spaceId, board) {
        const propertyInfo = this.getPropertyInfo(spaceId, board);
        if (!propertyInfo) return false;
        
        if (player.money < propertyInfo.price) return false;
        
        // 扣除金钱
        player.subtractMoney(propertyInfo.price);
        
        // 添加到玩家地产列表
        player.properties.push(propertyInfo);
        
        // 记录所有权
        this.ownedProperties[spaceId] = player.name;
        
        // 初始化地产详情
        if (propertyInfo.type === 'property') {
            this.propertyDetails[spaceId] = { houses: 0 };
        }
        
        return true;
    }

    // 计算过路费
    calculateRent(property, diceTotal, board) {
        if (!property.owner) return 0;
        
        if (property.type === 'property') {
            const houses = property.houses || 0;
            let baseRent = property.rent[houses];
            
            // 同色加成：拥有同色全部地产且无房屋时，空地过路费翻倍
            if (houses === 0 && this.checkOwnsFullGroup(property.owner, property.group, board)) {
                baseRent *= 2;
            }
            
            return baseRent;
        } else if (property.type === 'railroad') {
            // 根据拥有的火车站数量计算租金
            const ownerRailroads = this.getPlayerRailroadCount(property.owner);
            const idx = Math.max(0, ownerRailroads - 1);
            return property.rent[idx] || 0;
        } else if (property.type === 'utility') {
            // 公用事业：骰子点数 * 10（单个）或 * 20（两个）
            const ownerUtilities = this.getPlayerUtilityCount(property.owner);
            const multiplier = ownerUtilities >= 2 ? 20 : 10;
            return diceTotal * multiplier;
        }
        
        return 0;
    }

    // 检查玩家是否拥有同色全部地产
    checkOwnsFullGroup(ownerName, group, board) {
        if (!group || group === 'station' || group === 'utility') return false;
        
        const groupData = this.properties[group];
        if (!groupData) return false;
        
        const groupSpaces = groupData.spaces;
        let ownedCount = 0;
        
        groupSpaces.forEach(spaceId => {
            if (this.ownedProperties[spaceId] === ownerName) {
                ownedCount++;
            }
        });
        
        return ownedCount === groupSpaces.length;
    }

    // 获取玩家拥有的火车站数量
    getPlayerRailroadCount(ownerName) {
        let count = 0;
        Object.keys(this.ownedProperties).forEach(spaceId => {
            if (this.ownedProperties[spaceId] === ownerName) {
                const spaceIdNum = parseInt(spaceId);
                if (this.railroads.spaces.includes(spaceIdNum)) {
                    count++;
                }
            }
        });
        return count;
    }

    // 获取玩家拥有的公用事业数量
    getPlayerUtilityCount(ownerName) {
        let count = 0;
        Object.keys(this.ownedProperties).forEach(spaceId => {
            if (this.ownedProperties[spaceId] === ownerName) {
                const spaceIdNum = parseInt(spaceId);
                if (this.utilities.spaces.includes(spaceIdNum)) {
                    count++;
                }
            }
        });
        return count;
    }

    // 建造房屋（升级版：支持指定升级任意自有地产）
    buildHouse(player, spaceId, board) {
        const detail = this.propertyDetails[spaceId];
        if (!detail) return false;
        
        const propertyInfo = this.getPropertyInfo(spaceId, board);
        if (!propertyInfo || propertyInfo.owner !== player.name) return false;
        if (propertyInfo.type !== 'property') return false;
        if (detail.houses >= 5) return false; // 最多建到酒店（5级）
        
        const houseCost = propertyInfo.houseCost;
        if (player.money >= houseCost) {
            player.subtractMoney(houseCost);
            detail.houses++;
            return true;
        }
        return false;
    }

    // 获取玩家可升级的地产列表（拥有同色全部且未达最高级）
    getUpgradeableProperties(player, board) {
        const upgradeable = [];
        const checkedGroups = new Set();

        for (const spaceId in this.ownedProperties) {
            if (this.ownedProperties[spaceId] !== player.name) continue;

            const space = board.spaces[parseInt(spaceId)];
            if (!space || space.type !== 'property') continue;

            const group = space.group;
            // 跳过已检查过的颜色组
            if (checkedGroups.has(group)) continue;
            checkedGroups.add(group);

            // 检查是否拥有该颜色组全部地产
            if (!this.checkOwnsFullGroup(player.name, group, board)) continue;

            // 遍历该颜色组的所有地产，收集可升级的
            const groupData = this.properties[group];
            if (!groupData) continue;

            for (const gSpaceId of groupData.spaces) {
                const detail = this.propertyDetails[gSpaceId] || { houses: 0 };
                if (detail.houses < 5) {
                    const info = this.getPropertyInfo(gSpaceId, board);
                    upgradeable.push({
                        spaceId: gSpaceId,
                        name: info.name,
                        houses: detail.houses,
                        houseCost: info.houseCost,
                        currentRent: info.rent[detail.houses],
                        nextRent: info.rent[detail.houses + 1],
                        color: info.color,
                        canAfford: player.money >= info.houseCost
                    });
                }
            }
        }

        return upgradeable;
    }

    // 释放玩家所有地产（破产时调用）
    releaseAllProperties(playerName) {
        const released = [];
        for (const spaceId in this.ownedProperties) {
            if (this.ownedProperties[spaceId] === playerName) {
                released.push(spaceId);
                // 重置房屋数量
                if (this.propertyDetails[spaceId]) {
                    this.propertyDetails[spaceId].houses = 0;
                }
                delete this.ownedProperties[spaceId];
            }
        }
        return released;
    }

    // 出售地产给银行（获得原价的一半）
    sellProperty(player, spaceId, board) {
        const ownerName = this.ownedProperties[spaceId];
        if (ownerName !== player.name) return 0;
        
        const propertyInfo = this.getPropertyInfo(spaceId, board);
        if (!propertyInfo) return 0;
        
        // 计算出售价格（原价的一半 + 房屋价值的一半）
        let sellPrice = Math.floor(propertyInfo.price / 2);
        
        // 如果有房屋，加上房屋价值的一半
        if (propertyInfo.type === 'property') {
            const detail = this.propertyDetails[spaceId];
            if (detail && detail.houses > 0) {
                const houseValue = detail.houses * propertyInfo.houseCost;
                sellPrice += Math.floor(houseValue / 2);
            }
        }
        
        // 移除所有权
        delete this.ownedProperties[spaceId];
        
        // 重置房屋数量
        if (this.propertyDetails[spaceId]) {
            this.propertyDetails[spaceId].houses = 0;
        }
        
        // 从玩家地产列表中移除
        const propIndex = player.properties.findIndex(p => p.id === spaceId);
        if (propIndex !== -1) {
            player.properties.splice(propIndex, 1);
        }
        
        // 给玩家钱
        player.addMoney(sellPrice);
        
        return sellPrice;
    }

    // 获取玩家可出售的地产列表
    getSellableProperties(player, board) {
        const sellable = [];
        
        for (const spaceId in this.ownedProperties) {
            if (this.ownedProperties[spaceId] !== player.name) continue;
            
            const propertyInfo = this.getPropertyInfo(parseInt(spaceId), board);
            if (!propertyInfo) continue;
            
            // 计算出售价格
            let sellPrice = Math.floor(propertyInfo.price / 2);
            if (propertyInfo.type === 'property') {
                const detail = this.propertyDetails[spaceId];
                if (detail && detail.houses > 0) {
                    const houseValue = detail.houses * propertyInfo.houseCost;
                    sellPrice += Math.floor(houseValue / 2);
                }
            }
            
            sellable.push({
                spaceId: parseInt(spaceId),
                name: propertyInfo.name,
                type: propertyInfo.type,
                color: propertyInfo.color,
                originalPrice: propertyInfo.price,
                sellPrice: sellPrice,
                houses: propertyInfo.houses || 0
            });
        }
        
        return sellable;
    }

    // 检查是否可以购买地产
    canBuyProperty(player, space, board) {
        if (space.type !== 'property' && space.type !== 'railroad' && space.type !== 'utility') {
            return false;
        }
        
        if (this.ownedProperties[space.id]) return false; // 已被购买
        
        const propertyInfo = this.getPropertyInfo(space.id, board);
        if (!propertyInfo) return false;
        
        if (player.money < propertyInfo.price) return false;
        
        return true;
    }

    // 获取地产所有者
    getPropertyOwner(spaceId) {
        return this.ownedProperties[spaceId] || null;
    }

    // 获取地产详情
    getPropertyDetail(spaceId) {
        return this.propertyDetails[spaceId] || { houses: 0 };
    }
}
