// 骰子系统
class Dice {
    constructor() {
        this.dice1 = document.getElementById('dice1');
        this.dice2 = document.getElementById('dice2');
        this.value1 = 1;
        this.value2 = 1;
        this.isRolling = false;
        
        // 初始化SVG骰子
        this.initDice();
    }
    
    // 初始化骰子SVG
    initDice() {
        this.dice1.innerHTML = this.createDiceSVG(1);
        this.dice2.innerHTML = this.createDiceSVG(1);
    }
    
    // 创建骰子SVG - 真实点数面（白底黑点）
    createDiceSVG(value) {
        // 点数位置映射（基于60x60的viewBox）
        const dotPositions = {
            1: [[30, 30]],
            2: [[17, 17], [43, 43]],
            3: [[17, 17], [30, 30], [43, 43]],
            4: [[17, 17], [43, 17], [17, 43], [43, 43]],
            5: [[17, 17], [43, 17], [30, 30], [17, 43], [43, 43]],
            6: [[17, 15], [43, 15], [17, 30], [43, 30], [17, 45], [43, 45]]
        };
        
        const dots = dotPositions[value] || [];
        
        // 绘制每个点（带渐变效果，更真实）
        const dotsSVG = dots.map(([x, y]) => `
            <circle cx="${x}" cy="${y}" r="5.5" fill="#222"/>
            <circle cx="${x - 1}" cy="${y - 1}" r="2" fill="rgba(255,255,255,0.3)"/>
        `).join('');
        
        return `
            <svg width="100%" height="100%" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="diceGrad_${value}_${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e8e8e8;stop-opacity:1" />
                    </linearGradient>
                    <filter id="diceShadow_${value}_${Date.now()}">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/>
                    </filter>
                </defs>
                <rect x="2" y="2" width="56" height="56" rx="10" fill="white" stroke="#2c3e50" stroke-width="2.5"/>
                <rect x="4" y="4" width="52" height="52" rx="8" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
                ${dotsSVG}
            </svg>
        `;
    }

    // 掷骰子（3D翻转动画）
    async roll() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        
        // 添加CSS旋转动画类
        this.dice1.classList.add('rolling');
        this.dice2.classList.add('rolling');
        
        // 模拟骰子滚动时快速切换点数面
        const animationDuration = 1000;
        const frameInterval = 80;
        const totalFrames = Math.floor(animationDuration / frameInterval);
        
        for (let i = 0; i < totalFrames; i++) {
            const tempValue1 = Math.floor(Math.random() * 6) + 1;
            const tempValue2 = Math.floor(Math.random() * 6) + 1;
            this.dice1.innerHTML = this.createDiceSVG(tempValue1);
            this.dice2.innerHTML = this.createDiceSVG(tempValue2);
            await this.sleep(frameInterval);
        }
        
        // 生成最终结果
        this.value1 = Math.floor(Math.random() * 6) + 1;
        this.value2 = Math.floor(Math.random() * 6) + 1;
        
        // 显示最终结果
        this.dice1.innerHTML = this.createDiceSVG(this.value1);
        this.dice2.innerHTML = this.createDiceSVG(this.value2);
        
        // 移除旋转动画类
        this.dice1.classList.remove('rolling');
        this.dice2.classList.remove('rolling');
        
        // 重置变换
        this.dice1.style.transform = '';
        this.dice2.style.transform = '';
        
        this.isRolling = false;
        
        return {
            dice1: this.value1,
            dice2: this.value2,
            total: this.value1 + this.value2,
            isDouble: this.value1 === this.value2
        };
    }

    // 获取总点数
    getTotal() {
        return this.value1 + this.value2;
    }

    // 是否是双数
    isDouble() {
        return this.value1 === this.value2;
    }

    // 延迟函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 重置骰子显示
    reset() {
        this.dice1.innerHTML = this.createDiceSVG(1);
        this.dice2.innerHTML = this.createDiceSVG(1);
        this.dice1.classList.remove('rolling');
        this.dice2.classList.remove('rolling');
        this.dice1.style.transform = '';
        this.dice2.style.transform = '';
        this.value1 = 1;
        this.value2 = 1;
    }
}
