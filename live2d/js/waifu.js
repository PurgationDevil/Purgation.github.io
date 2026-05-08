var messages = {};

// 加载消息配置文件
function loadMessages(callback) {
    var xhr = new XMLHttpRequest();
    // 使用相对路径，waifu.js 在 live2d/js/ 目录下，message.json 在 live2d/ 目录下
    xhr.open('GET', '../message.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            messages = JSON.parse(xhr.responseText);
            if (callback) callback();
        } else if (xhr.readyState === 4) {
            // 如果加载失败，使用默认消息
            initDefaultMessages();
            if (callback) callback();
        }
    };
    xhr.send();
}

// 默认消息（备用）
function initDefaultMessages() {
    messages = {
        "mouseover": [
            {
                "selector": ".waifu #live2d",
                "text": ["干嘛呢你，快把手拿开", "鼠…鼠标放错地方了！"]
            }
        ],
        "click": [
            {
                "selector": ".waifu #live2d",
                "text": ["是…是不小心碰到了吧", "萝莉控是什么呀", "你看到我的小熊了吗", "再摸的话我可要报警了！⌇●﹏●⌇", "110吗，这里有个变态一直在摸我(ó﹏ò｡)"]
            }
        ],
        "seasons": []
    };
}

// 获取随机消息
function getRandomMessage(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 显示消息提示框
function showMessage(text, timeout) {
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
function initWelcomeMessage() {
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
}

// 检查节日消息
function checkSeasonMessage() {
    if (!messages.seasons || messages.seasons.length === 0) return;
    
    var today = new Date();
    var month = String(today.getMonth() + 1).padStart(2, '0');
    var day = String(today.getDate()).padStart(2, '0');
    var dateStr = month + '/' + day;
    var year = today.getFullYear();
    
    for (var i = 0; i < messages.seasons.length; i++) {
        var season = messages.seasons[i];
        var dateRange = season.date;
        
        if (dateRange.includes('-')) {
            var dates = dateRange.split('-');
            var startDate = dates[0];
            var endDate = dates[1];
            
            if ((dateStr >= startDate && dateStr <= endDate)) {
                var text = season.text.replace(/{year}/g, year);
                showMessage(text, 8000);
                return;
            }
        } else {
            if (dateStr === dateRange) {
                var text = season.text.replace(/{year}/g, year);
                showMessage(text, 8000);
                return;
            }
        }
    }
}

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
    hideBtn.onclick = function(e) {
        e.stopPropagation();
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
        // 触发鼠标悬停消息
        if (messages.mouseover) {
            for (var i = 0; i < messages.mouseover.length; i++) {
                var item = messages.mouseover[i];
                if (document.querySelector(item.selector)) {
                    showMessage(getRandomMessage(item.text), 3000);
                    break;
                }
            }
        }
    };
    landlord.onmouseleave = function() {
        hideBtn.style.display = 'none';
    };
    
    // 点击看板娘互动
    landlord.addEventListener('click', function(e) {
        if (e.target === hideBtn || e.target.classList.contains('hide-button')) {
            return;
        }
        
        // 查找点击消息
        if (messages.click) {
            for (var i = 0; i < messages.click.length; i++) {
                var item = messages.click[i];
                if (document.querySelector(item.selector)) {
                    showMessage(getRandomMessage(item.text), 3000);
                    return;
                }
            }
        }
    });
}

// 初始化页面元素的鼠标悬停事件
function initMouseoverEvents() {
    if (!messages.mouseover) return;
    
    messages.mouseover.forEach(function(item) {
        var elements = document.querySelectorAll(item.selector);
        elements.forEach(function(el) {
            el.addEventListener('mouseover', function() {
                var text = getRandomMessage(item.text);
                // 如果是带链接的消息，替换{text}为链接文本
                if (text.includes('{text}')) {
                    var linkText = el.textContent || el.innerText;
                    text = text.replace(/{text}/g, linkText);
                }
                showMessage(text, 3000);
            });
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadMessages(function() {
        initWelcomeMessage();
        checkSeasonMessage();
        initLive2d();
        initMouseoverEvents();
    });
});