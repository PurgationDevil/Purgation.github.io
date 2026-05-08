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
re.toString = function() {
    showMessage('哈哈，你打开了控制台，是想要看看我的秘密吗？', 5000, true);
    return '';
};

function getRandomText(arr) {
    if (!arr || !Array.isArray(arr)) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

function showMessage(text, timeout, flag){
    if(flag || sessionStorage.getItem('waifu-text') === '' || sessionStorage.getItem('waifu-text') === null){
        if(Array.isArray(text)) text = getRandomText(text);
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

function initTips(messages) {
    // 鼠标悬停事件
    $.each(messages.mouseover, function (index, tips) {
        $(document).on("mouseover", tips.selector, function () {
            var text = getRandomText(tips.text);
            text = text.render({text: $(this).text()});
            showMessage(text, 3000);
        });
    });

    // 点击事件
    $.each(messages.click, function (index, tips) {
        $(document).on("click", tips.selector, function () {
            var text = getRandomText(tips.text);
            text = text.render({text: $(this).text()});
            showMessage(text, 3000, true);
        });
    });

    // 节日消息
    $.each(messages.seasons, function (index, tips) {
        var now = new Date();
        var after = tips.date.split('-')[0];
        var before = tips.date.split('-')[1] || after;

        if ((after.split('/')[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split('/')[0]) &&
            (after.split('/')[1] <= now.getDate() && now.getDate() <= before.split('/')[1])) {
            var text = tips.text;
            if (Array.isArray(tips.text)) text = getRandomText(tips.text);
            text = text.render({year: now.getFullYear()});
            showMessage(text, 6000, true);
        }
    });
}

function initWelcomeMessage(messages) {
    var text;
    var isFirstVisit = !document.cookie.includes('visited=true');
    
    if (isFirstVisit) {
        // 首次访问
        document.cookie = 'visited=true; expires=Fri, 31 Dec 9999 23:59:59 GMT';
        
        var referrer = document.createElement('a');
        if(document.referrer !== ''){
            referrer.href = document.referrer;
        }

        if(referrer.href !== '' && referrer.hostname != 'litblc.com'){
            var domain = referrer.hostname.split('.')[1];
            if (domain == 'baidu') {
                text = getRandomText(messages.welcome).render({
                    keyword: referrer.search.split('&wd=')[1].split('&')[0],
                    referrer: referrer.hostname
                });
            } else if (domain == 'so') {
                text = getRandomText(messages.welcome).render({
                    keyword: referrer.search.split('&q=')[1].split('&')[0],
                    referrer: referrer.hostname
                });
            } else if (domain == 'google') {
                text = getRandomText(messages.welcome).render({
                    title: document.title.split(' - ')[0],
                    referrer: referrer.hostname
                });
            } else {
                text = getRandomText(messages.welcome).render({
                    referrer: referrer.hostname
                });
            }
        } else {
            text = getRandomText(messages.greetings.default);
        }
    } else {
        // 非首次访问
        if (window.location.href == 'https://www.litblc.com/') {
            // 主页 - 根据时间显示问候语
            var now = (new Date()).getHours();
            if (now > 23 || now <= 5) {
                text = getRandomText(messages.greetings.lateNight);
            } else if (now > 5 && now <= 7) {
                text = getRandomText(messages.greetings.morning);
            } else if (now > 7 && now <= 11) {
                text = getRandomText(messages.greetings.forenoon);
            } else if (now > 11 && now <= 14) {
                text = getRandomText(messages.greetings.noon);
            } else if (now > 14 && now <= 17) {
                text = getRandomText(messages.greetings.afternoon);
            } else if (now > 17 && now <= 19) {
                text = getRandomText(messages.greetings.evening);
            } else if (now > 19 && now <= 21) {
                text = getRandomText(messages.greetings.night);
            } else if (now > 21 && now <= 23) {
                text = getRandomText(messages.greetings.midnight);
            } else {
                text = getRandomText(messages.greetings.default);
            }
        } else {
            // 文章页
            text = getRandomText(messages.welcome).render({
                title: document.title.split(' - ')[0]
            });
        }
    }
    showMessage(text, 6000);
}

function initLive2d() {
    $('.hide-button').fadeOut(0).on('click', () => {
        $('#landlord').css('display', 'none')
        $('.show-button').fadeIn(300)
    })
    $('#landlord').hover(() => {
        $('.hide-button').fadeIn(600)
    }, () => {
        $('.hide-button').fadeOut(600)
    })
    $('.show-button').on('click', () => {
        $('#landlord').css('display', 'block')
        $('.show-button').fadeOut(300)
    })
}

// 主初始化函数
$(document).ready(function() {
    $.ajax({
        cache: true,
        url: "../message.json",
        dataType: "json",
        success: function (messages) {
            // 初始化悬停和点击事件
            initTips(messages);
            
            // 初始化欢迎消息（带cookie判断逻辑）
            initWelcomeMessage(messages);

            // 复制事件
            $(document).on('copy', function (){
                showMessage(getRandomText(messages.copy), 5000, true);
            });

            // 30秒随机句子（保持原有功能）
            window.hitokotoTimer = window.setInterval(function() {
                $.getJSON("https://v1.hitokoto.cn/", function (result) {
                    showMessage(result.hitokoto, 5000);
                });
            }, 30000);
        },
        error: function() {
            // 如果加载失败，使用默认消息
            console.log('无法加载 message.json，使用默认配置');
        }
    });

    // 初始化看板娘显示/隐藏
    initLive2d();
});