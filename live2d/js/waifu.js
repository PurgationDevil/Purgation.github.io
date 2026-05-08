String.prototype.render = function (context) {
    var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;

    return this.replace(tokenReg, function (word, slash1, token, slash2) {
        if (slash1 || slash2) {
            return word.replace('\\', '');
        }

        var variables = token.replace(/\s/g, '').split('.');
        var currentObject = context;
        var i, length, variable;

        for (i = 0, length = variables.length; i < length; ++i) {
            variable = variables[i];
            currentObject = currentObject[variable];
            if (currentObject === undefined || currentObject === null) return '';
        }
        return currentObject;
    });
};

var re = /x/;
console.log(re);
re.toString = function() {
    showMessage('哈哈，你打开了控制台，是想要看看我的秘密吗？', 5000, true);
    return '';
};

$(document).on('copy', function (){
    showMessage('你都复制了些什么呀，转载要记得加上出处哦', 5000, true);
});

function initTips() {
    $.ajax({
        cache: true,
        url: "/live2d/message.json",
        dataType: "json",
        success: function (result) {
            $.each(result.mouseover, function (index, tips) {
                $(document).on("mouseover", tips.selector, function () {
                    var text = tips.text;
                    if (Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length + 1) - 1];
                    text = text.render({text: $(this).text()});
                    showMessage(text, 3000);
                });
            });
            $.each(result.click, function (index, tips) {
                $(document).on("click", tips.selector, function () {
                    var text = tips.text;
                    if (Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length + 1) - 1];
                    text = text.render({text: $(this).text()});
                    showMessage(text, 3000, true);
                });
            });
            $.each(result.seasons, function (index, tips) {
                var now = new Date();
                var after = tips.date.split('-')[0];
                var before = tips.date.split('-')[1] || after;

                if ((after.split('/')[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split('/')[0]) &&
                    (after.split('/')[1] <= now.getDate() && now.getDate() <= before.split('/')[1])) {
                    var text = tips.text;
                    if (Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length + 1) - 1];
                    text = text.render({year: now.getFullYear()});
                    showMessage(text, 6000, true);
                }
            });
        }
    });
}
initTips();

(function (){
    var text;
    var referrer = document.createElement('a');
    if(document.referrer !== ''){
        referrer.href = document.referrer;
    }

    if(referrer.href !== '' && referrer.hostname != 'litblc.com'){
        var referrer = document.createElement('a');
        referrer.href = document.referrer;
        text = 'Hello! 来自 <span style="color:#0099cc;">' + referrer.hostname + '</span> 的朋友';
        var domain = referrer.hostname.split('.')[1];
        if (domain == 'baidu') {
            text = 'Hello! 来自 百度搜索 的朋友<br>你是搜索 <span style="color:#0099cc;">' + referrer.search.split('&wd=')[1].split('&')[0] + '</span> 找到的我吗？';
        }else if (domain == 'so') {
            text = 'Hello! 来自 360搜索 的朋友<br>你是搜索 <span style="color:#0099cc;">' + referrer.search.split('&q=')[1].split('&')[0] + '</span> 找到的我吗？';
        }else if (domain == 'google') {
            text = 'Hello! 来自 谷歌搜索 的朋友<br>欢迎阅读<span style="color:#0099cc;">『' + document.title.split(' - ')[0] + '』</span>';
        }
    }else {
        if (window.location.href == 'https://www.litblc.com/') { //如果是主页
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
        }else {
            text = '欢迎阅读<span style="color:#0099cc;">「 ' + document.title.split(' - ')[0] + ' 」</span>';
        }
    }
    showMessage(text, 6000);
})();

window.hitokotoTimer = window.setInterval(showHitokoto,30000);

function showHitokoto() {
    $.getJSON("https://v1.hitokoto.cn/", function (result) {
        showMessage(result.hitokoto, 5000);
    });
}
function showMessage(text, timeout, flag){
    if(flag || sessionStorage.getItem('waifu-text') === '' || sessionStorage.getItem('waifu-text') === null){
        if(Array.isArray(text)) text = text[Math.floor(Math.random() * text.length + 1)-1];
        //console.log(text);
        if(flag) sessionStorage.setItem('waifu-text', text);
        $('.waifu-tips').stop();
        $('.waifu-tips').html(text).fadeTo(200, 1);
        if (timeout === null) timeout = 5000;
        hideMessage(timeout);
    }
}
function hideMessage(timeout){
    $('.waifu-tips').stop().css('opacity',1);
    if (timeout === null) timeout = 5000;
    window.setTimeout(function() {sessionStorage.removeItem('waifu-text')}, timeout);
    $('.waifu-tips').delay(timeout).fadeTo(200, 0);
}
// 服装列表
var dressList = [
    "textures/ZCake-Costume.png",
    "textures/Dress-Costume.png",
    "textures/Halloween-Costume.png",
    "textures/Kids-Costume.png",
    "textures/Maid-Costume.png",
    "textures/Pajamas-Costume.png",
    "textures/Sailor-Costume.png",
    "textures/Sakura-Costume.png",
    "textures/School-Costume.png",
    "textures/Succubus-Costume.png",
    "textures/Winter-Costume.png",
    "textures/Winter2-Costume.png"
];

// 从 localStorage 读取上次保存的服装索引
var currentDressIndex = 0;
try {
    var savedIndex = localStorage.getItem('waifu-dress-index');
    if (savedIndex !== null) {
        currentDressIndex = parseInt(savedIndex, 10);
        if (isNaN(currentDressIndex) || currentDressIndex < 0 || currentDressIndex >= dressList.length) {
            currentDressIndex = 0;
        }
    }
} catch(e) {
    console.log('localStorage 不可用，使用默认服装');
}

// 根据服装索引加载模型
function loadModelWithDress(dressIndex) {
    var dressName = dressList[dressIndex].replace('textures/', '').replace('-Costume.png', '').replace('Z', '');
    
    var modelConfig = {
        "version": "1.0.0",
        "model": "/live2d/model/pio/model.moc",
        "textures": ["/live2d/model/pio/" + dressList[dressIndex]],
        "layout": {
            "center_x": 0.0,
            "center_y": -0.05,
            "width": 2.0
        },
        "hit_areas_custom": {
            "head_x": [-0.35, 0.6],
            "head_y": [0.19, -0.2],
            "body_x": [-0.3, -0.25],
            "body_y": [0.3, -0.9]
        },
        "motions": {
            "idle": [
                { "file": "/live2d/model/pio/motions/WakeUp.mtn" },
                { "file": "/live2d/model/pio/motions/Breath1.mtn" },
                { "file": "/live2d/model/pio/motions/Breath2.mtn" }
            ],
            "tap_body": [
                { "file": "/live2d/model/pio/motions/Touch1.mtn" },
                { "file": "/live2d/model/pio/motions/Touch2.mtn" }
            ]
        }
    };
    
    var blob = new Blob([JSON.stringify(modelConfig)], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    loadlive2d("live2d", url);
    
    return dressName;
}

// 切换服装 - 通过重新加载模型实现
function changeDress() {
    currentDressIndex = (currentDressIndex + 1) % dressList.length;
    
    // 保存到 localStorage
    try {
        localStorage.setItem('waifu-dress-index', currentDressIndex.toString());
    } catch(e) {}
    
    var dressName = loadModelWithDress(currentDressIndex);
    showMessage('换了一件' + dressName + '风格的衣服~', 3000, true);
}

function initLive2d() {
    var landlord = document.getElementById('landlord');
    var showWaifuBtn = document.getElementById('showWaifuBtn');
    var hideBtn = document.querySelector('.hide-button');
    var dressBtn = document.querySelector('.dress-button');
    
    if (!landlord || !showWaifuBtn || !hideBtn || !dressBtn) {
        setTimeout(initLive2d, 100);
        return;
    }
    
    // 检查 localStorage 中的隐藏状态
    var isHidden = false;
    try {
        isHidden = localStorage.getItem('waifu-hidden') === 'true';
    } catch(e) {
        console.log('localStorage 不可用');
    }
    
    // 设置初始显示状态
    if (isHidden) {
        landlord.style.display = 'none';
        showWaifuBtn.style.display = 'flex';
    } else {
        landlord.style.display = 'block';
        showWaifuBtn.style.display = 'none';
    }
    
    // 隐藏按钮事件
    hideBtn.style.display = 'none';
    hideBtn.onclick = function() {
        landlord.style.display = 'none';
        showWaifuBtn.style.display = 'flex';
        try {
            localStorage.setItem('waifu-hidden', 'true');
        } catch(e) {}
    };
    
    // 显示按钮事件
    showWaifuBtn.onclick = function() {
        showWaifuBtn.style.display = 'none';
        landlord.style.display = 'block';
        try {
            localStorage.removeItem('waifu-hidden');
        } catch(e) {}
    };
    
    // 换衣服按钮事件
    dressBtn.style.display = 'none';
    dressBtn.onclick = function() {
        changeDress();
    };
    
    // 鼠标悬停显示按钮
    landlord.onmouseenter = function() {
        hideBtn.style.display = 'block';
        dressBtn.style.display = 'block';
    };
    landlord.onmouseleave = function() {
        hideBtn.style.display = 'none';
        dressBtn.style.display = 'none';
    };
}

initLive2d();