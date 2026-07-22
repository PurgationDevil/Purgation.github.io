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

    // === 2. 图片点击放大（自定义实现） ===
    var overlay = document.createElement('div');
    overlay.id = 'img-zoom-overlay';
    overlay.innerHTML = '<img id="img-zoom-target" />';
    document.body.appendChild(overlay);

    var zoomImg = overlay.querySelector('#img-zoom-target');
    var scale = 1;
    var isDragging = false;
    var startX = 0, startY = 0;
    var translateX = 0, translateY = 0;

    postImgs.forEach(function(img) {
        if (img.closest('.mermaid-wrapper')) return;
        if (img.classList.contains('no-zoom')) return;
        if (img.width > 0 && img.width < 50) return;

        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openZoom(img);
        });
    });

    function openZoom(img) {
        zoomImg.src = img.src;
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeZoom() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateTransform() {
        zoomImg.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target === zoomImg && scale === 1) {
            closeZoom();
        }
    });

    zoomImg.addEventListener('click', function(e) {
        e.stopPropagation();
        if (scale === 1) closeZoom();
    });

    // 滚轮缩放
    overlay.addEventListener('wheel', function(e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        scale = Math.max(0.5, Math.min(10, scale * delta));
        if (scale < 1) {
            scale = 1;
            translateX = 0;
            translateY = 0;
        }
        updateTransform();
    }, { passive: false });

    // 拖拽
    zoomImg.addEventListener('mousedown', function(e) {
        if (scale <= 1) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        zoomImg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            zoomImg.style.cursor = 'grab';
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeZoom();
        }
    });

    // === 3. 代码块复制按钮 ===
    setTimeout(function() {
        document.querySelectorAll('.post-container pre').forEach(function(pre) {
            if (pre.closest('.mermaid-wrapper')) return;
            if (pre.querySelector('.mermaid')) return;
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
