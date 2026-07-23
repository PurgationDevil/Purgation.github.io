document.addEventListener('DOMContentLoaded', async () => {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: {
            background: '#ffffff',
            primaryColor: '#ffffff',
            primaryBorderColor: '#4f46e5',
            primaryTextColor: '#000000',
            lineColor: '#374151',
            textColor: '#000000',
            secondaryColor: '#ffffff',
            secondaryTextColor: '#000000',
            tertiaryColor: '#ffffff',
            fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace',
            fontSize: '16px',
            mainBkg: '#ffffff',
            nodeBorder: '#d1d5db',
            nodeTextColor: '#000000',
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

    document.querySelectorAll('.mermaid svg').forEach(function(svg) {
        svg.querySelectorAll('text, tspan').forEach(function(el) {
            el.style.fill = '#000000';
            el.style.color = '#000000';
        });
        svg.querySelectorAll('.nodeLabel, .edgeLabel').forEach(function(el) {
            el.style.color = '#000000';
            el.style.fill = '#000000';
        });
    });

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

        svg.addEventListener('dblclick', function(e) {
            e.preventDefault();
        });

        zoomBtn.addEventListener('click', function() {
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

        var clone = card.cloneNode(true);
        clone.style.margin = '0';
        clone.style.border = 'none';
        clone.style.boxShadow = 'none';
        clone.style.borderRadius = '0';
        clone.style.height = '100%';
        clone.style.width = '100vw';
        clone.style.height = '100vh';
        clone.style.display = 'flex';
        clone.style.flexDirection = 'column';
        clone.querySelector('.mermaid-header').style.display = 'none';
        clone.querySelector('.mermaid-hint').style.display = 'none';

        var wrapper = clone.querySelector('.mermaid-wrapper');
        wrapper.style.flex = '1';
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'block';
        wrapper.style.padding = '0';

        var svg = clone.querySelector('svg');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.maxWidth = 'none';
        svg.style.maxHeight = 'none';

        content.appendChild(clone);
        document.body.appendChild(fullscreenOverlay);
        document.body.style.overflow = 'hidden';

        setTimeout(function() {
            var fullscreenPanZoom = svgPanZoom(svg, {
                zoomEnabled: true,
                controlIconsEnabled: false,
                fit: true,
                center: true,
                contain: true,
                minZoom: 0.1,
                maxZoom: 20,
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
