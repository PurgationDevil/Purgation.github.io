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

    document.querySelectorAll('.mermaid').forEach(function(mermaidEl) {
        var svg = mermaidEl.querySelector('svg');
        if (!svg) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper';

        mermaidEl.parentNode.insertBefore(wrapper, mermaidEl);
        wrapper.appendChild(mermaidEl);

        var zoomInfo = document.createElement('div');
        zoomInfo.className = 'mermaid-zoom-info';
        zoomInfo.textContent = '滚轮缩放 · 拖拽移动 · 双击重置';
        wrapper.appendChild(zoomInfo);

        svg.style.maxWidth = 'none';
        svg.style.maxHeight = 'none';

        var panZoom = svgPanZoom(svg, {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true,
            minZoom: 0.25,
            maxZoom: 10,
            zoomScaleSensitivity: 0.2
        });

        svg.addEventListener('dblclick', function(e) {
            e.preventDefault();
            panZoom.reset();
        });
    });
});