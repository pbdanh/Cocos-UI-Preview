/**
 * dev-bridge/_panel.js — Create panel DOM & toggle button
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    B.onReady(function () {

        // ─── Create Panel DOM ──────────────────────────────────────
        var panel = document.createElement("div");
        panel.id = "dev-bridge-panel";
        panel.style.cssText = [
            "position:fixed", "top:0", "right:0", "z-index:99999",
            "width:420px", "max-height:100vh", "overflow-y:auto",
            "background:rgba(15,15,25,0.96)", "color:#e0e0e0",
            "font-family:ui-monospace,'SF Mono',Monaco,monospace",
            "font-size:11px", "border-left:2px solid #4f46e5",
            "display:none", "padding:8px"
        ].join(";");

        panel.innerHTML = [
            // Info
            '<div id="dev-info" data-devbridge-role="info" style="padding:4px 0;border-bottom:1px solid #333;margin-bottom:6px"></div>',

            // Scene Tree
            '<div class="dev-section-header" data-devbridge-role="scene-tree-header">',
            '  <b style="color:#818cf8">SCENE TREE</b>',
            '  <button id="dev-refresh-tree" class="dev-section-btn">⟳ Refresh</button>',
            '  <button id="dev-expand-all" class="dev-section-btn" style="background:#333">Expand All</button>',
            '  <button id="dev-collapse-all" class="dev-section-btn" style="background:#333">Collapse</button>',
            '</div>',
            '<div id="dev-scene-tree" data-devbridge-role="scene-tree" class="dev-tree-container"></div>',

            // Inspector
            '<div class="dev-section-header" data-devbridge-role="inspector-header">',
            '  <b style="color:#f59e0b">NODE INSPECTOR</b>',
            '  <span id="dev-selected-path" style="color:#555;font-size:9px;overflow:hidden;text-overflow:ellipsis"></span>',
            '</div>',
            '<div id="dev-inspector" data-devbridge-role="inspector"></div>',

            // JS Executor
            '<div class="dev-section-header" data-devbridge-role="executor-header" style="margin-top:4px">',
            '  <b style="color:#34d399">JS EXECUTOR</b>',
            '  <span style="color:#555;font-size:9px">Ctrl+Enter to run · this = selected node</span>',
            '</div>',
            '<div id="dev-ctx-hint" class="dev-ctx-hint">no node selected</div>',
            '<textarea id="dev-cmd-input" data-devbridge-role="executor-input" rows="3" style="width:100%;background:#111;color:#e0e0e0;border:1px solid #333;border-radius:4px;padding:4px;font-family:inherit;font-size:11px;resize:vertical" placeholder="this.setScale(2)\\nthis.getPosition()\\n$children[0].getName()"></textarea>',
            '<div id="dev-snippets" class="dev-snippets"></div>',
            '<div style="display:flex;gap:4px;margin:4px 0">',
            '  <button id="dev-cmd-run" class="dev-section-btn green">▶ Run</button>',
            '  <button id="dev-cmd-clear" class="dev-section-btn gray">Clear</button>',
            '  <span id="dev-history-hint" style="color:#555;font-size:9px;margin-left:auto">↑↓ history</span>',
            '</div>',
            '<pre id="dev-cmd-output" data-devbridge-role="executor-output" style="background:#0a1a0a;padding:6px;border-radius:4px;max-height:140px;overflow:auto;white-space:pre-wrap;margin:0 0 8px 0;color:#4ade80;font-size:10px;min-height:16px"></pre>',

            // Node Click
            '<div class="dev-section-header" data-devbridge-role="node-click-header">',
            '  <b style="color:#fb923c">NODE CLICK</b>',
            '  <button id="dev-click-selected" class="dev-section-btn orange" style="margin-left:auto">⚡ Click Selected</button>',
            '</div>',
            '<div class="dev-search-wrap" data-devbridge-role="node-click" style="margin-bottom:8px">',
            '  <input id="dev-click-search" class="dev-search-input" type="text" placeholder="🔍 Search nodes... type to filter" />',
            '  <div id="dev-click-dropdown" class="dev-search-dropdown"></div>',
            '</div>'
        ].join("\n");
        document.body.appendChild(panel);

        // Toggle button
        var toggle = document.createElement("button");
        toggle.id = "dev-toggle";
        toggle.textContent = "🔧 Dev";
        toggle.style.cssText = [
            "position:fixed", "top:4px", "right:4px", "z-index:100000",
            "background:#4f46e5", "color:#fff", "border:none",
            "padding:4px 10px", "border-radius:4px", "cursor:pointer",
            "font-size:11px", "font-weight:bold", "opacity:0.85"
        ].join(";");
        document.body.appendChild(toggle);

        // Store references for other modules
        B.els = {
            panel: panel,
            toggle: toggle
        };
    });
})();
