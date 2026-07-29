// 游戏入口
let game = null;
let playerCount = 4; // 默认4人

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', async () => {
    console.log('大富翁游戏初始化中...');
    
    // 初始化玩家数量选择器
    initPlayerCountSelector();
    
    try {
        game = new Game();
        await game.init();
        console.log('游戏初始化完成！');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试');
    }
});

// 初始化玩家数量选择器
function initPlayerCountSelector() {
    const selector = document.getElementById('playerCountSelector');
    if (!selector) return;
    
    const buttons = selector.querySelectorAll('.player-count-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有active类
            buttons.forEach(b => b.classList.remove('active'));
            // 添加active类到当前按钮
            btn.classList.add('active');
            // 更新玩家数量
            playerCount = parseInt(btn.dataset.count);
            console.log('玩家数量设置为:', playerCount);
        });
    });
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    game = null;
});

// 导出playerCount供game.js使用
window.getPlayerCount = () => playerCount;
