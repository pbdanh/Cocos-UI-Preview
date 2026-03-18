/**
 * dev-bridge/_init.js — Wire all event handlers & expose global API
 *
 * Must be loaded LAST among all dev-bridge files.
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    var S = B.state;

    B.onReady(function () {

        // ─── Toggle button ────────────────────────────────────────
        B.els.toggle.addEventListener("click", function () {
            var visible = B.els.panel.style.display !== "none";
            B.els.panel.style.display = visible ? "none" : "block";
            if (!visible) B.fn.refreshTree();
        });

        // ─── Tree buttons ─────────────────────────────────────────
        document.getElementById("dev-refresh-tree").addEventListener("click", B.fn.refreshTree);

        document.getElementById("dev-expand-all").addEventListener("click", function () {
            B.fn.expandAll(cc.director.getRunningScene(), "");
            B.fn.refreshTree();
        });

        document.getElementById("dev-collapse-all").addEventListener("click", function () {
            S.expandedPaths = {};
            B.fn.refreshTree();
        });

        // ─── Executor events ──────────────────────────────────────
        document.getElementById("dev-cmd-run").addEventListener("click", function () {
            var code = document.getElementById("dev-cmd-input").value;
            B.fn.execJS(code);
        });

        document.getElementById("dev-cmd-clear").addEventListener("click", function () {
            document.getElementById("dev-cmd-input").value = "";
            document.getElementById("dev-cmd-output").textContent = "";
        });

        // Ctrl+Enter to run, ↑↓ for history
        document.getElementById("dev-cmd-input").addEventListener("keydown", function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                B.fn.execJS(this.value);
            } else if (e.key === "ArrowUp" && this.selectionStart === 0) {
                e.preventDefault();
                if (S.cmdHistory.length > 0 && S.cmdHistoryIdx < S.cmdHistory.length - 1) {
                    S.cmdHistoryIdx++;
                    this.value = S.cmdHistory[S.cmdHistory.length - 1 - S.cmdHistoryIdx];
                }
            } else if (e.key === "ArrowDown" && this.selectionEnd === this.value.length) {
                e.preventDefault();
                if (S.cmdHistoryIdx > 0) {
                    S.cmdHistoryIdx--;
                    this.value = S.cmdHistory[S.cmdHistory.length - 1 - S.cmdHistoryIdx];
                } else {
                    S.cmdHistoryIdx = -1;
                    this.value = "";
                }
            }
        });

        // ─── Node Click events ────────────────────────────────────
        document.getElementById("dev-click-selected").addEventListener("click", function () {
            if (S.selectedNode) {
                B.fn.clickNode(null, S.selectedNode);
            } else {
                var output = document.getElementById("dev-cmd-output");
                output.style.color = "#f87171";
                output.textContent = "No node selected. Click a node in the tree first.";
            }
        });

        var searchInput = document.getElementById("dev-click-search");
        var searchDropdown = document.getElementById("dev-click-dropdown");

        searchInput.addEventListener("input", function () {
            S.searchActiveIdx = -1;
            B.fn.populateSearchDropdown(this.value.trim());
        });

        searchInput.addEventListener("focus", function () {
            this.select();
            S.searchActiveIdx = -1;
            B.fn.populateSearchDropdown(this.value.trim());
        });

        searchInput.addEventListener("keydown", function (e) {
            var items = searchDropdown.querySelectorAll(".dev-search-item");
            if (e.key === "ArrowDown") {
                e.preventDefault();
                S.searchActiveIdx = Math.min(S.searchActiveIdx + 1, items.length - 1);
                B.fn.highlightSearchItem(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                S.searchActiveIdx = Math.max(S.searchActiveIdx - 1, 0);
                B.fn.highlightSearchItem(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (S.searchActiveIdx >= 0 && items[S.searchActiveIdx]) {
                    items[S.searchActiveIdx].click();
                }
            } else if (e.key === "Escape") {
                searchDropdown.classList.remove("open");
            }
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest(".dev-search-wrap")) {
                searchDropdown.classList.remove("open");
            }
        });

        // ─── Init calls ──────────────────────────────────────────
        B.fn.updateInfo();
        B.fn.buildSnippets();
        B.fn.refreshTree();
        B.fn.renderInspector();
        cc.log("[CocosDevBridge] Initialized — click 🔧 Dev button to open panel");

        // ─── Global API ──────────────────────────────────────────
        window.DevBridge = {
            // --- Original methods (backward-compatible) ---
            refreshTree: B.fn.refreshTree,
            exec: B.fn.execJS,
            clickNode: B.fn.clickNode,
            findNode: B.fn.findNodeByPath,
            getClassName: B.fn.getClassName,
            getTree: B.fn.getTextTree,
            _getWorldBB: B.fn.getWorldBB,
            collectNodes: B.fn.collectAllNodes,
            selectNode: function (nodeOrPath) {
                var node = typeof nodeOrPath === "string" ? B.fn.findNodeByPath(nodeOrPath) : nodeOrPath;
                if (node) B.fn.selectNode(node);
                return node;
            },
            getSelected: function () { return S.selectedNode; },

            // --- AI-Agent API ---

            /** Full JSON snapshot of the scene tree */
            snapshot: B.fn.getSnapshot,

            /** Detailed JSON info for a single node by path */
            nodeInfo: B.fn.getNodeInfo,

            /** Query nodes by filter: { class, name, visible, interactable } */
            query: B.fn.queryNodes,

            /** Set a node's property: setProp(path, prop, value) */
            setProp: B.fn.setProp,

            /** Click a node by path string */
            click: function (pathStr) {
                return B.fn.clickNode(pathStr, null);
            },

            /** Self-documenting API — returns all available methods */
            listActions: function () {
                return {
                    _description: "DevBridge API for AI agents and developers",
                    methods: {
                        "snapshot()": {
                            returns: "JSON",
                            description: "Full scene tree as JSON. Contains: scene name, designSize, frameSize, and recursive tree of all nodes with name, class, path, pos, size, visible, opacity, zOrder, interactable, typeInfo, children."
                        },
                        "nodeInfo(path)": {
                            returns: "JSON",
                            description: "Detailed info for one node. Includes all snapshot fields plus scale, rotation, anchor, color, tag, worldBounds, childCount.",
                            example: 'DevBridge.nodeInfo("cc.Scene/MainLayer/btn_start")'
                        },
                        "query(filter)": {
                            returns: "JSON[]",
                            description: "Find nodes matching filter criteria. Filter keys: class (exact), name (glob, e.g. 'btn_*'), visible (bool), interactable (bool).",
                            example: 'DevBridge.query({ class: "ccui.Button", visible: true })'
                        },
                        "setProp(path, prop, value)": {
                            returns: "{ ok, prop, value } or { error }",
                            props: ["x", "y", "scaleX", "scaleY", "scale", "rotation", "opacity", "visible", "anchorX", "anchorY", "width", "height", "zOrder", "color", "text", "name"],
                            example: 'DevBridge.setProp("cc.Scene/label", "text", "Hello")'
                        },
                        "click(path)": {
                            returns: "void",
                            description: "Simulate click/touch on a node. Handles ccui.Button, cc.MenuItem, and generic touch dispatch.",
                            example: 'DevBridge.click("cc.Scene/MainLayer/btn_start")'
                        },
                        "selectNode(pathOrNode)": {
                            returns: "cc.Node or null",
                            description: "Select a node in the inspector. Accepts path string or node reference."
                        },
                        "getTree()": {
                            returns: "string",
                            description: "Plain-text tree of the scene (indented, human-readable)."
                        },
                        "exec(code)": {
                            returns: "void",
                            description: "Execute JS code in the executor context. 'this' = selected node."
                        },
                        "findNode(path)": {
                            returns: "cc.Node or null",
                            description: "Find and return a node by path string."
                        },
                        "refreshTree()": {
                            returns: "void",
                            description: "Refresh the scene tree UI."
                        }
                    }
                };
            },

            /** Human-readable quick reference */
            help: function () {
                var lines = [
                    "╔══════════════════════════════════════════╗",
                    "║       DevBridge API Quick Reference      ║",
                    "╠══════════════════════════════════════════╣",
                    "║ READ                                     ║",
                    "║  snapshot()         → JSON scene tree     ║",
                    "║  nodeInfo(path)     → JSON node details   ║",
                    "║  query(filter)      → find nodes          ║",
                    "║  getTree()          → text tree            ║",
                    "║  getSelected()      → current node         ║",
                    "║ WRITE                                     ║",
                    "║  setProp(path,p,v)  → set property         ║",
                    "║  click(path)        → simulate click       ║",
                    "║  selectNode(path)   → select in inspector  ║",
                    "║  exec(code)         → run JS               ║",
                    "║ META                                      ║",
                    "║  listActions()      → full API as JSON     ║",
                    "║  help()             → this message         ║",
                    "╚══════════════════════════════════════════╝",
                    "",
                    "Props for setProp: x, y, scaleX, scaleY, scale,",
                    "  rotation, opacity, visible, anchorX, anchorY,",
                    "  width, height, zOrder, color, text, name",
                    "",
                    "Query filter: { class, name, visible, interactable }",
                    "  name supports glob: 'btn_*', '*label*'"
                ];
                return lines.join("\n");
            }
        };
    });
})();
