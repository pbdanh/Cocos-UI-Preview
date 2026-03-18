/**
 * dev-bridge/_styles.js — CSS injection for the dev panel
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    B.onReady(function () {
        var style = document.createElement("style");
        style.textContent = [
            /* Panel */
            "#dev-bridge-panel { scrollbar-width:thin; scrollbar-color:#4f46e5 #111; }",
            "#dev-bridge-panel ::-webkit-scrollbar { width:6px; }",
            "#dev-bridge-panel ::-webkit-scrollbar-thumb { background:#4f46e5; border-radius:3px; }",

            /* Tree */
            ".dev-tree-container { background:#111; border-radius:4px; max-height:280px; overflow:auto; padding:4px; margin:0 0 8px 0; }",
            ".dev-tree-item { display:flex; align-items:center; padding:1px 4px; border-radius:3px; cursor:pointer; white-space:nowrap; user-select:none; }",
            ".dev-tree-item:hover { background:rgba(79,70,229,0.15); }",
            ".dev-tree-item.selected { background:rgba(79,70,229,0.3); outline:1px solid #4f46e5; }",
            ".dev-tree-caret { width:14px; text-align:center; font-size:8px; color:#666; flex-shrink:0; transition:transform 0.1s; }",
            ".dev-tree-caret.expanded { transform:rotate(90deg); }",
            ".dev-tree-caret.leaf { visibility:hidden; }",
            ".dev-tree-icon { margin-right:3px; font-size:10px; flex-shrink:0; }",
            ".dev-tree-label { color:#e0e0e0; font-size:10px; }",
            ".dev-tree-label .name { color:#a5b4fc; font-weight:bold; }",
            ".dev-tree-label .cls { color:#888; }",
            ".dev-tree-label .meta { color:#555; font-size:9px; margin-left:4px; }",
            ".dev-tree-badge { font-size:8px; padding:0 3px; border-radius:2px; margin-left:3px; flex-shrink:0; }",
            ".dev-tree-badge.hidden { background:#7f1d1d; color:#fca5a5; }",
            ".dev-tree-badge.children { background:#1e1b4b; color:#a5b4fc; }",
            ".dev-tree-children { padding-left:14px; border-left:1px solid #2a2a4a; margin-left:6px; }",
            ".dev-tree-children.collapsed { display:none; }",

            /* Inspector */
            "#dev-inspector { background:#111; border-radius:4px; padding:8px; margin:0 0 8px 0; }",
            "#dev-inspector .header { color:#818cf8; font-weight:bold; font-size:11px; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px; }",
            "#dev-inspector .prop-grid { display:grid; grid-template-columns:70px 1fr; gap:2px 6px; align-items:center; }",
            "#dev-inspector .prop-label { color:#888; font-size:10px; text-align:right; }",
            "#dev-inspector .prop-row { display:flex; gap:4px; align-items:center; }",
            ".dev-drag-num { background:#1a1a2e; color:#e0e0e0; border:1px solid #333; border-radius:3px; padding:2px 4px; width:60px; font-size:10px; font-family:inherit; cursor:ew-resize; text-align:center; }",
            ".dev-drag-num:hover { border-color:#4f46e5; }",
            ".dev-drag-num:focus { outline:none; border-color:#818cf8; cursor:text; }",
            ".dev-range { width:100%; height:14px; -webkit-appearance:none; background:#1a1a2e; border-radius:3px; cursor:pointer; }",
            ".dev-range::-webkit-slider-thumb { -webkit-appearance:none; width:10px; height:14px; background:#4f46e5; border-radius:2px; cursor:pointer; }",
            ".dev-checkbox { accent-color:#4f46e5; cursor:pointer; }",
            ".dev-color-input { width:30px; height:18px; border:1px solid #333; border-radius:3px; cursor:pointer; background:none; padding:0; }",
            ".dev-type-info { color:#555; font-size:9px; font-style:italic; padding-top:4px; border-top:1px solid #222; margin-top:4px; }",
            ".dev-inspector .empty { color:#555; font-size:10px; font-style:italic; text-align:center; padding:12px; }",

            /* Section headers */
            ".dev-section-header { display:flex; align-items:center; gap:6px; margin-bottom:4px; }",
            ".dev-section-header b { font-size:11px; }",
            ".dev-section-btn { background:#4f46e5; color:#fff; border:none; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:10px; }",
            ".dev-section-btn:hover { background:#6366f1; }",
            ".dev-section-btn.green { background:#059669; }",
            ".dev-section-btn.green:hover { background:#10b981; }",
            ".dev-section-btn.orange { background:#ea580c; }",
            ".dev-section-btn.orange:hover { background:#f97316; }",
            ".dev-section-btn.gray { background:#555; }",

            /* Snippet bar */
            ".dev-snippets { display:flex; flex-wrap:wrap; gap:3px; margin:4px 0; }",
            ".dev-snippet-btn { background:#1e1b4b; color:#a5b4fc; border:1px solid #333; padding:1px 6px; border-radius:3px; cursor:pointer; font-size:9px; font-family:inherit; }",
            ".dev-snippet-btn:hover { background:#312e81; border-color:#4f46e5; }",

            /* Context hint */
            ".dev-ctx-hint { color:#555; font-size:9px; padding:2px 0; font-style:italic; }",
            ".dev-ctx-hint .node-name { color:#a5b4fc; font-style:normal; }",

            /* Node search dropdown */
            ".dev-search-wrap { position:relative; }",
            ".dev-search-input { width:100%; background:#111; color:#e0e0e0; border:1px solid #333; border-radius:4px; padding:3px 6px; font-family:inherit; font-size:11px; box-sizing:border-box; }",
            ".dev-search-input:focus { border-color:#4f46e5; outline:none; }",
            ".dev-search-dropdown { position:absolute; left:0; right:0; bottom:100%; background:#1a1a2e; border:1px solid #333; border-bottom:none; border-radius:4px 4px 0 0; max-height:180px; overflow-y:auto; z-index:10; display:none; }",
            ".dev-search-dropdown.open { display:block; }",
            ".dev-search-item { display:flex; align-items:center; gap:4px; padding:3px 6px; cursor:pointer; font-size:10px; white-space:nowrap; overflow:hidden; }",
            ".dev-search-item:hover, .dev-search-item.active { background:rgba(79,70,229,0.25); }",
            ".dev-search-item .s-icon { flex-shrink:0; }",
            ".dev-search-item .s-name { color:#a5b4fc; font-weight:bold; }",
            ".dev-search-item .s-cls { color:#888; }",
            ".dev-search-item .s-path { color:#555; font-size:9px; margin-left:auto; }",
        ].join("\n");
        document.head.appendChild(style);
    });
})();
