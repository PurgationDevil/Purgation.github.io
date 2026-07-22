document.addEventListener('DOMContentLoaded', async () => {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: {
            background: '#ffffff',
            primaryColor: '#ffffff',
            primaryBorderColor: '#4f46e5',
            primaryTextColor: '#111827',
            lineColor: '#374151',
            textColor: '#111827',
            secondaryColor: '#f3f4f6',
            secondaryTextColor: '#374151',
            tertiaryColor: '#fef3c7',
            fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace',
            fontSize: '16px',
            mainBkg: '#ffffff',
            nodeBorder: '#d1d5db',
            nodeTextColor: '#111827',
            clusterBkg: '#f9fafb',
            clusterBorder: '#e5e7eb',
            edgeLabelBackground: '#ffffff',
            edgeColor: '#6b7280',
            arrowheadColor: '#6b7280'
        }
    });

    var mermaidPatterns = ['%%{init:', 'graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram',
                          'stateDiagram', 'pie ', 'gantt', 'erDiagram', 'journey', 'mindmap'];

    document.querySelectorAll('pre').forEach(function(pre) {
        var code = pre.querySelector('code');
        if (!code) return;

        var text = code.textContent.trim();
        for (var i = 0; i < mermaidPatterns.length; i++) {
            if (text.startsWith(mermaidPatterns[i])) {
                pre.innerHTML = '<div class="mermaid">' + text + '</div>';
                break;
            }
        }
    });

    await mermaid.run();

    document.querySelectorAll('.mermaid').forEach(function(mermaidEl, index) {
        var svg = mermaidEl.querySelector('svg');
        if (!svg) return;

        var card = document.createElement('div');
        card.className = 'mermaid-card';
        card.dataset.mermaidIndex = index;

        var header = document.createElement('div');
        header.className = 'mermaid-header';

        var title = document.createElement('div');
        title.className = 'mermaid-title';
        title.innerHTML = '<span class="mermaid-icon">📊</span><span>Diagram</span>';

        var actions = document.createElement('div');
        actions.className = 'mermaid-actions';

        var zoomBtn = document.createElement('button');
        zoomBtn.className = 'mermaid-action-btn';
        zoomBtn.innerHTML = '🔍';
        zoomBtn.title = '重置缩放';

        var fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'mermaid-action-btn';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.title = '全屏查看';

        actions.appendChild(zoomBtn);
        actions.appendChild(fullscreenBtn);
        header.appendChild(title);
        header.appendChild(actions);

        var wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper';

        var hint = document.createElement('div');
        hint.className = 'mermaid-hint';
        hint.innerHTML = '<span>💡</span> Ctrl+滚轮缩放 · 左键拖动 · 双击恢复';

        mermaidEl.parentNode.insertBefore(card, mermaidEl);
        card.appendChild(header);
        card.appendChild(wrapper);
        card.appendChild(hint);
        wrapper.appendChild(mermaidEl);

        zoomBtn.addEventListener('click', function() {
            var svg = card.querySelector('svg');
            svg.style.transform = 'scale(1)';
            svg.style.transformOrigin = 'center center';
        });

        fullscreenBtn.addEventListener('click', function() {
            enterFullscreen(card);
        });

        setTimeout(function() {
            hint.style.opacity = '0';
            setTimeout(function() { hint.style.display = 'none'; }, 500);
        }, 3000);
    });

    function enterFullscreen(card) {
        var fullscreenOverlay = document.createElement('div');
        fullscreenOverlay.className = 'mermaid-fullscreen-overlay';
        fullscreenOverlay.innerHTML = '<div class="mermaid-fullscreen-header"><div class="mermaid-fullscreen-title">📊 Mermaid Diagram</div><button class="mermaid-fullscreen-close">×</button></div><div class="mermaid-fullscreen-content"></div>';

        var closeBtn = fullscreenOverlay.querySelector('.mermaid-fullscreen-close');
        var content = fullscreenOverlay.querySelector('.mermaid-fullscreen-content');

        var originalParent = card.parentNode;
        var originalNextSibling = card.nextSibling;

        content.appendChild(card);

        document.body.appendChild(fullscreenOverlay);
        document.body.style.overflow = 'hidden';

        card.style.margin = '0';
        card.style.border = 'none';
        card.style.boxShadow = 'none';
        card.style.borderRadius = '0';
        card.style.height = '100%';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.querySelector('.mermaid-header').style.display = 'none';
        card.querySelector('.mermaid-hint').style.display = 'none';

        var wrapper = card.querySelector('.mermaid-wrapper');
        wrapper.style.flex = '1';
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
        wrapper.style.padding = '0';

        var svg = card.querySelector('svg');
        svg.style.maxWidth = '90vw';
        svg.style.maxHeight = '80vh';

        setTimeout(function() {
            svg.style.width = '100%';
            svg.style.height = '100%';

            var fullscreenPanZoom = svgPanZoom(svg, {
                zoomEnabled: true,
                controlIconsEnabled: false,
                fit: true,
                center: true,
                minZoom: 0.25,
                maxZoom: 10,
                zoomScaleSensitivity: 0.2
            });

            fullscreenPanZoom.resize();
            fullscreenPanZoom.fit();
            fullscreenPanZoom.center();

            svg.addEventListener('dblclick', function(e) {
                e.preventDefault();
                fullscreenPanZoom.reset();
            });
        }, 300);

        function exitFullscreen() {
            content.removeChild(card);
            if (originalNextSibling) {
                originalParent.insertBefore(card, originalNextSibling);
            } else {
                originalParent.appendChild(card);
            }
            
            card.style = '';
            card.querySelector('.mermaid-header').style.display = '';
            card.querySelector('.mermaid-hint').style.display = '';
            
            var wrapper = card.querySelector('.mermaid-wrapper');
            wrapper.removeAttribute('style');
            
            var svg = card.querySelector('svg');
            svg.removeAttribute('style');
            
            document.body.removeChild(fullscreenOverlay);
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', exitFullscreen);
        fullscreenOverlay.addEventListener('click', function(e) {
            if (e.target === fullscreenOverlay) exitFullscreen();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                exitFullscreen();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
});
