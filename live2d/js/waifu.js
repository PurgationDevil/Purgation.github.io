function showMessage(text, timeout){
    var tips = document.querySelector('.waifu-tips');
    if (!tips) return;
    
    tips.style.opacity = '1';
    tips.innerHTML = text;
    
    if (timeout === undefined) timeout = 5000;
    
    setTimeout(function() {
        tips.style.opacity = '0';
    }, timeout);
}

// 初始化欢迎消息
(function() {
    var text;
    var now = (new Date()).getHours();
    if (now > 23 || now <= 5) {
        text = '你是夜猫子呀？这么晚还不睡觉，明天起的来嘛';
    } else if (now > 5 && now <= 7) {
        text = '早上好！一日之计在于晨，美好的一天就要开始了';
    } else if (now > 7 && now <= 11) {
        text = '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！';
    } else if (now > 11 && now <= 14) {
        text = '中午了，工作了一个上午，现在是午餐时间！';
    } else if (now > 14 && now <= 17) {
        text = '午后很容易犯困呢，今天的运动目标完成了吗？';
    } else if (now > 17 && now <= 19) {
        text = '傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~';
    } else if (now > 19 && now <= 21) {
        text = '晚上好，今天过得怎么样？';
    } else if (now > 21 && now <= 23) {
        text = '已经这么晚了呀，早点休息吧，晚安~';
    } else {
        text = '嗨~ 快来逗我玩吧！';
    }
    showMessage(text, 6000);
})();

// 初始化看板娘控制
function initLive2d() {
    var landlord = document.getElementById('landlord');
    var showWaifuBtn = document.getElementById('showWaifuBtn');
    var hideBtn = document.querySelector('.hide-button');
    
    if (!landlord || !showWaifuBtn || !hideBtn) {
        setTimeout(initLive2d, 100);
        return;
    }
    
    // 确保看板娘始终显示
    landlord.style.display = 'block';
    showWaifuBtn.style.display = 'none';
    
    // 隐藏按钮
    hideBtn.style.display = 'none';
    hideBtn.onclick = function() {
        landlord.style.display = 'none';
        showWaifuBtn.style.display = 'flex';
    };
    
    // 显示按钮
    showWaifuBtn.onclick = function() {
        showWaifuBtn.style.display = 'none';
        landlord.style.display = 'block';
    };
    
    // 鼠标悬停显示隐藏按钮
    landlord.onmouseenter = function() {
        hideBtn.style.display = 'block';
    };
    landlord.onmouseleave = function() {
        hideBtn.style.display = 'none';
    };
}

initLive2d();