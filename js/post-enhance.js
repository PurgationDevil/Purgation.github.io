document.addEventListener('DOMContentLoaded', function() {

    // === 1. 图片懒加载 ===
    var postImgs = document.querySelectorAll('.post-container img');
    postImgs.forEach(function(img) {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
    });

    // === 2. 图片点击放大 (medium-zoom) ===
    if (typeof mediumZoom !== 'undefined') {
        var zoomImgs = [];
        postImgs.forEach(function(img) {
            // 排除 Mermaid 内部的图片
            if (img.closest('.mermaid-wrapper')) return;
            // 排除标记为 no-zoom 的图片
            if (img.classList.contains('no-zoom')) return;
            // 排除太小的图片（如图标）
            if (img.width > 0 && img.width < 50) return;
            zoomImgs.push(img);
        });
        if (zoomImgs.length > 0) {
            mediumZoom(zoomImgs, {
                margin: 24,
                background: 'rgba(0, 0, 0, 0.85)',
                scrollOffset: 0
            });
        }
    }

    // === 3. 代码块复制按钮 ===
    // 延迟执行，等 Mermaid 渲染完成
    setTimeout(function() {
        document.querySelectorAll('.post-container pre').forEach(function(pre) {
            // 跳过 Mermaid 块
            if (pre.closest('.mermaid-wrapper')) return;
            if (pre.querySelector('.mermaid')) return;
            // 跳过已添加按钮的
            if (pre.querySelector('.copy-btn')) return;

            var code = pre.querySelector('code');
            if (!code) return;

            pre.style.position = 'relative';

            var btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', '复制代码');

            btn.addEventListener('click', function() {
                var text = code.textContent;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        btn.textContent = '\u2713 已复制';
                        btn.classList.add('copied');
                        setTimeout(function() {
                            btn.textContent = 'Copy';
                            btn.classList.remove('copied');
                        }, 2000);
                    }).catch(function() {
                        fallbackCopy(text, btn);
                    });
                } else {
                    fallbackCopy(text, btn);
                }
            });

            pre.appendChild(btn);
        });
    }, 1500);

    function fallbackCopy(text, btn) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            btn.textContent = '\u2713 已复制';
            btn.classList.add('copied');
            setTimeout(function() {
                btn.textContent = 'Copy';
                btn.classList.remove('copied');
            }, 2000);
        } catch (e) {
            btn.textContent = '\u2715 失败';
            setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
        }
        document.body.removeChild(textarea);
    }
});
