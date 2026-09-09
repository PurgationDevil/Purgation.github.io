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

    // === 2. 图片点击放大 ===
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

        var parentAnchor = img.closest('a');

        img.style.cursor = 'zoom-in';

        function handleZoom(e) {
            e.preventDefault();
            e.stopPropagation();
            openZoom(img);
        }

        img.addEventListener('click', handleZoom);
        if (parentAnchor) {
            parentAnchor.addEventListener('click', handleZoom);
        }
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
            // 跳过 Rouge 行号表格的内部结构（行号列 gutter / 代码列 rouge-code 里的 pre），
            // 标签只挂在外层的 pre.highlight 上，避免同一代码块出现两个标签
            if (pre.closest('.rouge-gutter') || pre.closest('.rouge-code') || pre.classList.contains('lineno')) return;

            var code = pre.querySelector('code');
            var codeText = (code || pre).textContent;

            pre.style.position = 'relative';

            var lang = '';
            var parent = pre.parentNode;
            var allClasses = '';
            
            while (parent && parent !== document.body) {
                if (parent.className) {
                    allClasses += ' ' + parent.className;
                }
                parent = parent.parentNode;
            }
            
            if (allClasses) {
                var langMatch = allClasses.match(/language-([^ ]+)/i);
                if (!langMatch) {
                    langMatch = allClasses.match(/lang-([^ ]+)/i);
                }
                if (!langMatch) {
                    langMatch = allClasses.match(/highlight-([^ ]+)/i);
                }
                if (langMatch) {
                    lang = langMatch[1];
                }
            }

            // 构建时 _plugins/asm_alias.rb 已把 asm/assembly 映射到 Rouge 的 nasm 高亮器，
            // 构建输出 language-nasm；这里把标签统一显示为 asm
            if (lang === 'nasm' || lang === 'assembly') {
                lang = 'asm';
            }
            // 兜底：未标注语言但内容是汇编的纯文本块
            if (!lang || lang === 'text' || lang === 'plaintext' || lang === 'plain') {
                if (looksLikeAssembly(codeText)) {
                    lang = 'asm';
                }
            }

            var langBadge = document.createElement('span');
            langBadge.className = 'code-lang';
            langBadge.textContent = lang || 'CODE';

            var btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', '复制代码');

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var text = '';
                var rougeCode = pre.querySelector('.rouge-code');
                if (rougeCode) {
                    var codeElements = rougeCode.querySelectorAll('pre, code');
                    if (codeElements.length > 0) {
                        text = codeElements[codeElements.length - 1].textContent;
                    }
                }
                if (!text) {
                    text = (code || pre).textContent;
                }
                text = text.replace(/^\s+|\s+$/g, '');
                
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        btn.textContent = '\u2713 已复制';
                        btn.classList.add('copied');
                        setTimeout(function() {
                            btn.textContent = 'Copy';
                            btn.classList.remove('copied');
                        }, 2000);
                        if (typeof showMessage === 'function') {
                            showMessage('代码拿走可以，转载要记得加上出处哦~', 3000, true);
                        }
                    }).catch(function() {
                        fallbackCopy(text, btn);
                    });
                } else {
                    fallbackCopy(text, btn);
                }
            });

            pre.appendChild(langBadge);
            pre.appendChild(btn);
        });
    }, 1500);

    // 内容嗅探：判断代码是否像 x86/x64 汇编（IDA/GDB 反汇编风格）
    // 命中 ≥2 行即认定（覆盖短块）；前缀支持 label: / rep* / lock；助记符含 SIMD 与常见伪指令
    function looksLikeAssembly(text) {
        if (!text) return false;
        var re = /^\s*(?:[a-z_.$][\w.$]*\s*:\s*)?(?:rep|repe|repz|repne|repnz|lock)?\s*(mov|movzx|movsx|movsxd|movq|movaps|movdqa|movdqu|lea|push|pop|call|ret|retq|leave|iret|iretq|jmp|je|jne|jz|jnz|jg|jge|jl|jle|ja|jae|jb|jbe|jcxz|jecxz|jrcxz|cmp|test|add|sub|xor|and|or|not|neg|shl|shr|sar|sal|inc|dec|nop|xchg|cdq|cdqe|cqo|cbw|cwde|movsb|stosb|lodsb|cmpsb|scasb|int|syscall|sysenter|sysret|cli|sti|hlt|imul|mul|div|idiv|enter|pushad|popad|pushfd|popfd|pxor|pand|por|paddb|psubb|pcmpeqb|pshufb|shufps|unpcklps|maxps|minps|movss|addss|mulss|cvtsi2ss|cvtss2si|endp|ends|assume|segment|extern|global|section|db|dw|dd|dq)\b/i;
        var count = 0;
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (re.test(lines[i])) {
                count++;
                if (count >= 2) return true;
            }
        }
        return false;
    }

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
