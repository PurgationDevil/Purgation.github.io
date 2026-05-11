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
    showMessage('哈哈，你打开了控制台，是想要看看我的秘密吗？', 5000);
    return '';
};

$(document).on('copy', function (){
    showMessage('你都复制了些什么呀，转载要记得加上出处哦', 5000);
});

function initTips() {
    var mouseoverTips = [
        {selector: ".post-list-item-container .item-title a[href^='http']", text: ["要看看 <span style=\"color:#0099cc;\">{text}</span> 么？"]},
        {selector: ".navbar-brand", text: ["欢迎回来！", "主人的博客首页哦~", "回到首页看看吧"]},
        {selector: ".navbar-nav li a[href*='about']", text: ["想了解主人吗？", "关于主人的故事~", "主人是个有趣的人哦"]},
        {selector: ".navbar-nav li a[href*='archive']", text: ["有很多文章呢~", "看看历史文章吧", "好多技术文章哦"]},
        {selector: ".navbar-nav li a[href*='friends']", text: ["主人的朋友们~", "友情链接", "去看看其他博客吧"]},
        {selector: ".page-navigator .prev, .pagination .prev", text: ["去上一页看看吧", "上一篇文章", "还有更多内容哦"]},
        {selector: ".page-navigator .next, .pagination .next", text: ["去下一页看看吧", "下一篇文章", "继续探索吧"]},
        {selector: "#comment-form #textarea", text: ["认真填写哦，垃圾评论是禁止事项"]},
        {selector: "#comment-form #misubmit", text: ["要提交了吗，首次评论需要审核，请耐心等待~"]},
        {selector: ".navbar-menu a[href^='https://github.com/PurgationDevil']", text: ["这里有一些关于我家主人的秘密哦，要不要看看呢？"]},
        {selector: "#rewardButton", text: ["主人最近在吃土呢，很辛苦的样子。"]},
        {selector: ".github-corner", text: ["这里是我家主人的GitHub，去看看嘛~"]},
        {selector: ".waifu #live2d", text: ["干嘛呢你，快把手拿开~~", "鼠…鼠标放错地方了！", "怕怕", "非礼呀！救命！( ⓛ ω ⓛ *)", "喵喵喵？", "你要干嘛呀？"]}
    ];

    var clickTips = [
        {selector: ".waifu #live2d", text: ["是…是不小心碰到的吧！(´・ω・`)", "萝莉控是什么呀？", "干嘛动我啊，小心我咬你！(〃｀ 3′〃)", "不要再摸我啦，我告诉你老婆来打你的！", "真…真是不知羞耻！", "我要生气了哦", "再摸的话我可要报警了！⌇●﹏●⌇", "110吗，这里有个变态一直在摸我(ó﹏ò｡)"]}
    ];

    var seasonsTips = [
        {date: "01/01", text: "<span style=\"color:#0099cc;\">元旦</span>了呢，新的一年又开始了，{year}年打算做些什么呢~"},
        {date: "02/14", text: "又是一年<span style=\"color:#0099cc;\">情人节</span>，{year}年找到对象了嘛~"},
        {date: "03/08", text: "今天是<span style=\"color:#0099cc;\">妇女节</span>！"},
        {date: "03/12", text: "今天是<span style=\"color:#0099cc;\">植树节</span>，要保护环境呀"},
        {date: "03/30", text: "今天是<span style=\"color:#0099cc;\">博客主生日</span>，祝愿每个人都开心欧~"},
        {date: "04/01", text: "悄悄告诉你一个秘密~<span style=\"color:#34495e;background-color:#34495e;\">今天是愚人节，不要被骗了哦~</span>"},
        {date: "05/01", text: "今天是<span style=\"color:#0099cc;\">五一劳动节</span>，计划好假期去哪里了吗~"},
        {date: "06/01", text: "<span style=\"color:#0099cc;\">儿童节</span>了呢，快活的时光总是短暂，要是永远长不大该多好啊…"},
        {date: "09/03", text: "<span style=\"color:#0099cc;\">中国人民抗日战争胜利纪念日</span>，铭记历史、缅怀先烈、珍爱和平、开创未来。"},
        {date: "09/10", text: "<span style=\"color:#0099cc;\">教师节</span>，在学校要给老师问声好呀~"},
        {date: "10/01", text: "<span style=\"color:#0099cc;\">国庆节</span>，新中国已经成立69年了呢"},
        {date: "11/05-11/12", text: "今年的<span style=\"color:#0099cc;\">双十一</span>是和谁一起过的呢~"},
        {date: "12/20-12/28", text: "这几天是<span style=\"color:#0099cc;\">圣诞节</span>，主人肯定又去剁手买买买了~"},
        {date: "12/29-12/31", text: "要<span style=\"color:#0099cc;\">年终</span>了哦~ 年初许下的愿望都实现了吗？"}
    ];

    $.each(mouseoverTips, function (index, tips) {
        $(document).on("mouseover", tips.selector, function () {
            var text = tips.text;
            if (Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length)];
            text = text.render({text: $(this).text()});
            showMessage(text, 3000);
        });
    });

    $.each(clickTips, function (index, tips) {
        $(document).on("click", tips.selector, function () {
            var text = tips.text;
            if (Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length)];
            text = text.render({text: $(this).text()});
            showMessage(text, 3000);
        });
    });

    $.each(seasonsTips, function (index, tips) {
        var now = new Date();
        var after = tips.date.split('-')[0];
        var before = tips.date.split('-')[1] || after;

        if ((after.split('/')[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split('/')[0]) &&
            (after.split('/')[1] <= now.getDate() && now.getDate() <= before.split('/')[1])) {
            var text = tips.text;
            if (Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length)];
            text = text.render({year: now.getFullYear()});
            showMessage(text, 6000);
        }
    });
}

initTips();

(function (){
    var text;
    if (window.location.href == 'https://purgationdevil.github.io/' || window.location.href == 'https://www.purgationdevil.github.io/') {
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
    } else {
        text = '欢迎阅读<span style="color:#0099cc;">「 ' + document.title.split(' - ')[0] + ' 」</span>';
    }
    showMessage(text, 6000);
})();

window.hitokotoTimer = window.setInterval(showHitokoto, 30000);

function showHitokoto() {
    $.getJSON("https://v1.hitokoto.cn/", function (result) {
        showMessage(result.hitokoto, 5000);
    });
}

var messageTimeout = null;

function showMessage(text, timeout) {
    if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];

    if (messageTimeout) {
        clearTimeout(messageTimeout);
        messageTimeout = null;
    }

    $('.waifu-tips').stop(true, true);
    $('.waifu-tips').html(text).fadeTo(200, 1);
    
    if (timeout === undefined || timeout === null) timeout = 5000;
    
    messageTimeout = setTimeout(function() {
        $('.waifu-tips').fadeTo(200, 0);
        messageTimeout = null;
    }, timeout);
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

initLive2d();