String.prototype.render = function (context) {
    var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;

    return this.replace(tokenReg, function (word, slash1, token, slash2) {
        if (slash1 || slash2) {
            return word.replace('\\', '');
        }

        var variables = token.replace(/\s/g, '').split('.');
        var currentObject = context;
        var i, length, variable;

        for (i = 0, length = variables.length; i < length; i++) {
            variable = variables[i];
            currentObject = currentObject[variable];
            if (currentObject === undefined || currentObject === null) return '';
        }
        return currentObject;
    });
};

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
        }
    });
}
initTips();

(function (){
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

function showMessage(text, timeout){
    $('.waifu-tips').stop();
    $('.waifu-tips').html(text).fadeTo(200, 1);
    if (timeout === null) timeout = 5000;
    hideMessage(timeout);
}

function hideMessage(timeout){
    $('.waifu-tips').stop().css('opacity',1);
    if (timeout === null) timeout = 5000;
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

var currentDressIndex = 0;

function loadModelWithDress(dressIndex) {
    var dressName = dressList[dressIndex].replace('textures/', '').replace('-Costume.png', '').replace('Z', '');
    
    var modelConfig = {
        "version": "1.0.0",
        "model": "model.moc",
        "textures": [dressList[dressIndex]],
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
                { "file": "motions/WakeUp.mtn" },
                { "file": "motions/Breath1.mtn" },
                { "file": "motions/Breath2.mtn" }
            ],
            "tap_body": [
                { "file": "motions/Touch1.mtn" },
                { "file": "motions/Touch2.mtn" }
            ]
        }
    };
    
    var blob = new Blob([JSON.stringify(modelConfig)], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    loadlive2d("live2d", url);
    
    return dressName;
}

function changeDress() {
    currentDressIndex = (currentDressIndex + 1) % dressList.length;
    var dressName = loadModelWithDress(currentDressIndex);
    showMessage('换了一件' + dressName + '风格的衣服~', 3000);
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
    
    // 确保看板娘始终显示
    landlord.style.display = 'block';
    showWaifuBtn.style.display = 'none';
    
    hideBtn.style.display = 'none';
    hideBtn.onclick = function() {
        landlord.style.display = 'none';
        showWaifuBtn.style.display = 'flex';
    };
    
    showWaifuBtn.onclick = function() {
        showWaifuBtn.style.display = 'none';
        landlord.style.display = 'block';
    };
    
    dressBtn.style.display = 'none';
    dressBtn.onclick = function() {
        changeDress();
    };
    
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