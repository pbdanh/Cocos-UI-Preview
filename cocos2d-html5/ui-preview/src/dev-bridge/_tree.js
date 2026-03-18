/**
 * dev-bridge/_tree.js — Scene tree: build, expand/collapse, refresh
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    var S = B.state;

    B.fn.getNodePath = function (node, parentPath) {
        var name = node.getName() || "";
        var cls = B.fn.getClassName(node);
        var id = name || cls;
        return parentPath ? parentPath + "/" + id : id;
    };

    B.fn.refreshTree = function () {
        var container = document.getElementById("dev-scene-tree");
        var scene = cc.director.getRunningScene();
        if (!scene) {
            container.innerHTML = '<span style="color:#555;font-style:italic;padding:8px">No running scene</span>';
            return;
        }
        container.innerHTML = "";
        _buildTreeNode(container, scene, "", 0);
        B.fn.updateInfo();
        B.fn.updateOverlay();
    };

    function _buildTreeNode(parentEl, node, parentPath, depth) {
        var name = node.getName() || "";
        var cls = B.fn.getClassName(node);
        var path = B.fn.getNodePath(node, parentPath);
        var children = node.getChildren();
        var hasChildren = children.length > 0;
        var isExpanded = !!S.expandedPaths[path];
        var icon = B.data.typeIcons[cls] || "◻";

        // Row
        var row = document.createElement("div");
        row.className = "dev-tree-item" + (S.selectedNode === node ? " selected" : "");
        row.style.paddingLeft = (depth * 2) + "px";

        // Semantic attributes for AI agents
        row.setAttribute("data-node-path", path);
        row.setAttribute("data-node-class", cls);
        row.setAttribute("data-node-name", name);
        row.setAttribute("data-node-visible", String(node.isVisible()));
        row.setAttribute("data-node-children", String(children.length));

        // Caret
        var caret = document.createElement("span");
        caret.className = "dev-tree-caret" + (hasChildren ? (isExpanded ? " expanded" : "") : " leaf");
        caret.textContent = "▶";
        row.appendChild(caret);

        // Icon
        var iconEl = document.createElement("span");
        iconEl.className = "dev-tree-icon";
        iconEl.textContent = icon;
        row.appendChild(iconEl);

        // Label
        var label = document.createElement("span");
        label.className = "dev-tree-label";
        var pos = Math.round(node.getPositionX()) + "," + Math.round(node.getPositionY());
        var cs = node.getContentSize();
        var sizeStr = Math.round(cs.width) + "×" + Math.round(cs.height);

        var html = "";
        if (name) html += '<span class="name">' + B.fn.escHtml(name) + '</span> ';
        html += '<span class="cls">' + cls + '</span>';
        html += '<span class="meta"> ' + pos + ' ' + sizeStr + '</span>';
        label.innerHTML = html;
        row.appendChild(label);

        // Badges
        if (!node.isVisible()) {
            var badge = document.createElement("span");
            badge.className = "dev-tree-badge hidden";
            badge.textContent = "HIDDEN";
            row.appendChild(badge);
        }
        if (hasChildren) {
            var cBadge = document.createElement("span");
            cBadge.className = "dev-tree-badge children";
            cBadge.textContent = children.length;
            row.appendChild(cBadge);
        }

        parentEl.appendChild(row);

        // Children container
        var childContainer = null;
        if (hasChildren) {
            childContainer = document.createElement("div");
            childContainer.className = "dev-tree-children" + (isExpanded ? "" : " collapsed");
            parentEl.appendChild(childContainer);

            if (isExpanded) {
                for (var i = 0; i < children.length; i++) {
                    _buildTreeNode(childContainer, children[i], path, depth + 1);
                }
            }
        }

        // Click handlers
        row.addEventListener("click", function (e) {
            e.stopPropagation();
            B.fn.selectNode(node);
        });

        caret.addEventListener("click", function (e) {
            e.stopPropagation();
            if (!hasChildren) return;
            if (S.expandedPaths[path]) {
                delete S.expandedPaths[path];
            } else {
                S.expandedPaths[path] = true;
            }
            B.fn.refreshTree();
            B.fn.selectNode(node);
        });

        row.addEventListener("dblclick", function (e) {
            e.stopPropagation();
            if (!hasChildren) return;
            if (S.expandedPaths[path]) {
                delete S.expandedPaths[path];
            } else {
                S.expandedPaths[path] = true;
            }
            B.fn.refreshTree();
        });
    }

    B.fn.expandAll = function (node, parentPath) {
        var path = B.fn.getNodePath(node, parentPath);
        var children = node.getChildren();
        if (children.length > 0) {
            S.expandedPaths[path] = true;
            for (var i = 0; i < children.length; i++) {
                B.fn.expandAll(children[i], path);
            }
        }
    };

    // ─── Node Selection ────────────────────────────────────────
    B.fn.selectNode = function (node) {
        S.selectedNode = node;
        B.fn.refreshTree();
        B.fn.renderInspector();
        B.fn.updateOverlay();
        B.fn.updateCtxHint();
        // Update path display
        var pathEl = document.getElementById("dev-selected-path");
        if (pathEl) pathEl.textContent = node ? B.fn.getNodePathFull(node) : "";
    };

    // ─── Info ──────────────────────────────────────────────────
    B.fn.updateInfo = function () {
        var info = document.getElementById("dev-info");
        var ws = cc.winSize;
        var fs = cc.view.getFrameSize();
        var scene = cc.director.getRunningScene();
        info.innerHTML = [
            '<span style="color:#818cf8">Design:</span> ' + ws.width + '×' + ws.height,
            ' | <span style="color:#818cf8">Frame:</span> ' + Math.round(fs.width) + '×' + Math.round(fs.height),
            ' | <span style="color:#818cf8">Scene:</span> ' + (scene ? (scene.getName() || scene.constructor.name || "unnamed") : "none")
        ].join("");
    };
})();
