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

function showMessage(text, timeout, flag) {
    if (flag || sessionStorage.getItem('waifu-text') === '' || sessionStorage.getItem('waifu-text') === null) {
        if (Array.isArray(text)) text = getRandomText(text);
        if (flag) sessionStorage.setItem('waifu-text', text);
        $('.waifu-tips').stop();
        $('.waifu-tips').html(text).fadeTo(200, 1);
        if (timeout === null) timeout = 5000;
        hideMessage(timeout);
    }
}

function hideMessage(timeout) {
    $('.waifu-tips').stop().css('opacity', 1);
    if (timeout === null) timeout = 5000;
    window.setTimeout(function() { sessionStorage.removeItem('waifu-text'); }, timeout);
    $('.waifu-tips').delay(timeout).fadeTo(200, 0);
}

function initTips(messages) {
    if (!messages) return;
    
    if (messages.mouseover) {
        $.each(messages.mouseover, function(index, tips) {
            $(document).on('mouseover', tips.selector, function() {
                var text = getRandomText(tips.text);
                text = text.render({ text: $(this).text() });
                showMessage(text, 3000);
            });
        });
    }

    if (messages.click) {
        $.each(messages.click, function(index, tips) {
            $(document).on('click', tips.selector, function() {
                var text = getRandomText(tips.text);
                text = text.render({ text: $(this).text() });
                showMessage(text, 3000, true);
            });
        });
    }

    if (messages.seasons) {
        $.each(messages.seasons, function(index, tips) {
            var now = new Date();
            var after = tips.date.split('-')[0];
            var before = tips.date.split('-')[1] || after;

            if ((after.split('/')[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split('/')[0]) &&
                (after.split('/')[1] <= now.getDate() && now.getDate() <= before.split('/')[1])) {
                var text = tips.text;
                if (Array.isArray(tips.text)) text = getRandomText(tips.text);
                text = text.render({ year: now.getFullYear() });
                showMessage(text, 6000, true);
            }
        });
    }
}

function initWelcomeMessage(messages) {
    if (!messages) return;
    
    var text;
    var isFirstVisit = document.cookie.indexOf('visited=true') === -1;
    
    if (isFirstVisit) {
        document.cookie = 'visited=true; expires=Fri, 31 Dec 9999 23:59:59 GMT';
        
        var referrer = document.createElement('a');
        if (document.referrer !== '') {
            referrer.href = document.referrer;
        }

        if (referrer.href !== '' && referrer.hostname !== 'litblc.com') {
            var domain = referrer.hostname.split('.')[1];
            if (domain === 'baidu') {
                var wd = referrer.search.split('&wd=');
                var keyword = wd.length > 1 ? wd[1].split('&')[0] : '';
                text = 'Hello! 来自 百度搜索 的朋友<br>你是搜索 <span style="color:#0099cc;">' + keyword + '</span> 找到的我吗？';
            } else if (domain === 'so') {
                var q = referrer.search.split('&q=');
                var keyword = q.length > 1 ? q[1].split('&')[0] : '';
                text = 'Hello! 来自 360搜索 的朋友<br>你是搜索 <span style="color:#0099cc;">' + keyword + '</span> 找到的我吗？';
            } else if (domain === 'google') {
                text = 'Hello! 来自 谷歌搜索 的朋友<br>欢迎阅读<span style="color:#0099cc;">『' + document.title.split(' - ')[0] + '』</span>';
            } else {
                text = 'Hello! 来自 <span style="color:#0099cc;">' + referrer.hostname + '</span> 的朋友';
            }
        } else {
            text = getRandomText(messages.greetings ? messages.greetings.default : ['嗨~ 快来逗我玩吧！']);
        }
    } else {
        if (window.location.href === 'https://www.litblc.com/') {
            var now = (new Date()).getHours();
            var greetings = messages.greetings || {};
            
            if (now > 23 || now <= 5) {
                text = getRandomText(greetings.lateNight || ['你是夜猫子呀？这么晚还不睡觉，明天起的来嘛']);
            } else if (now > 5 && now <= 7) {
                text = getRandomText(greetings.morning || ['早上好！一日之计在于晨，美好的一天就要开始了']);
            } else if (now > 7 && now <= 11) {
                text = getRandomText(greetings.forenoon || ['上午好！工作顺利嘛，不要久坐，多起来走动走动哦！']);
            } else if (now > 11 && now <= 14) {
                text = getRandomText(greetings.noon || ['中午了，工作了一个上午，现在是午餐时间！']);
            } else if (now > 14 && now <= 17) {
                text = getRandomText(greetings.afternoon || ['午后很容易犯困呢，今天的运动目标完成了吗？']);
            } else if (now > 17 && now <= 19) {
                text = getRandomText(greetings.evening || ['傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~']);
            } else if (now > 19 && now <= 21) {
                text = getRandomText(greetings.night || ['晚上好，今天过得怎么样？']);
            } else if (now > 21 && now <= 23) {
                text = getRandomText(greetings.midnight || ['已经这么晚了呀，早点休息吧，晚安~']);
            } else {
                text = getRandomText(greetings.default || ['嗨~ 快来逗我玩吧！']);
            }
        } else {
            text = '欢迎阅读<span style="color:#0099cc;">「 ' + document.title.split(' - ')[0] + ' 」</span>';
        }
    }
    showMessage(text, 6000);
}

function initLive2d() {
    $('.hide-button').fadeOut(0).on('click', function() {
        $('#landlord').css('display', 'none');
        $('.show-button').fadeIn(300);
    });
    
    $('#landlord').hover(function() {
        $('.hide-button').fadeIn(600);
    }, function() {
        $('.hide-button').fadeOut(600);
    });
    
    $('.show-button').on('click', function() {
        $('#landlord').css('display', 'block');
        $('.show-button').fadeOut(300);
    });
}

$(document).ready(function() {
    $.ajax({
        cache: true,
        url: '../message.json',
        dataType: 'json',
        success: function(messages) {
            initTips(messages);
            initWelcomeMessage(messages);

            if (messages.copy) {
                $(document).on('copy', function() {
                    showMessage(getRandomText(messages.copy), 5000, true);
                });
            }

            window.hitokotoTimer = window.setInterval(function() {
                $.getJSON('https://v1.hitokoto.cn/', function(result) {
                    showMessage(result.hitokoto, 5000);
                });
            }, 30000);
        },
        error: function() {
            console.log('无法加载 message.json，使用默认配置');
            initWelcomeMessage(null);
            
            $(document).on('copy', function() {
                showMessage('你都复制了些什么呀，转载要记得加上出处哦', 5000, true);
            });
        }
    });

    initLive2d();
});