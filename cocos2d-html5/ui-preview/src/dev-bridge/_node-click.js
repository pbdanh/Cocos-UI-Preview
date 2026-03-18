/**
 * dev-bridge/_node-click.js — Node click simulation & search dropdown
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    var S = B.state;

    // ─── Collect All Nodes (for search) ─────────────────────────
    B.fn.collectAllNodes = function () {
        var scene = cc.director.getRunningScene();
        if (!scene) return [];
        var results = [];
        var queue = [{ node: scene, path: "" }];
        while (queue.length > 0) {
            var item = queue.shift();
            var n = item.node;
            var name = n.getName() || "";
            var cls = B.fn.getClassName(n);
            var label = name || cls;
            var fullPath = item.path ? item.path + "/" + label : label;
            var icon = B.data.typeIcons[cls] || "◻";
            results.push({ node: n, name: name, cls: cls, icon: icon, path: fullPath });
            var kids = n.getChildren();
            for (var i = 0; i < kids.length; i++) {
                queue.push({ node: kids[i], path: fullPath });
            }
        }
        return results;
    };

    // ─── Node Click ────────────────────────────────────────────
    B.fn.clickNode = function (pathStr, nodeDirectly) {
        var output = document.getElementById("dev-cmd-output");
        var node = nodeDirectly || B.fn.findNodeByPath(pathStr);
        if (!node) {
            if (output) {
                output.style.color = "#f87171";
                output.textContent = "Node not found: " + pathStr;
            }
            return;
        }
        var className = B.fn.getClassName(node);
        var displayName = node.getName() || className;

        if (typeof ccui !== "undefined" && ccui.Button && node instanceof ccui.Button) {
            node.setHighlighted(true);
            setTimeout(function () { node.setHighlighted(false); }, 100);
            // Try click event listener first
            if (node._clickEventListener) {
                node._clickEventListener(node);
                _showClickSuccess(output, "ccui.Button (click)", displayName);
                B.fn.refreshTree();
                return;
            }
            // Try touch event callback (from addTouchEventListener)
            if (node._touchEventCallback) {
                node._touchEventCallback(node, ccui.Widget.TOUCH_ENDED);
                _showClickSuccess(output, "ccui.Button (touch)", displayName);
                B.fn.refreshTree();
                return;
            }
            // Fall through to generic touch dispatch
        }

        if (cc.MenuItem && node instanceof cc.MenuItem) {
            node.activate();
            _showClickSuccess(output, "cc.MenuItem", displayName);
            B.fn.refreshTree();
            return;
        }

        // Generic touch dispatch with BEGAN → MOVED → ENDED
        var worldPos = node.convertToWorldSpace(cc.p(
            node.getContentSize().width / 2,
            node.getContentSize().height / 2
        ));
        var touch = new cc.Touch(worldPos.x, worldPos.y, 0);
        var event = new cc.EventTouch([touch]);
        event._eventCode = cc.EventTouch.EventCode.BEGAN;
        cc.eventManager.dispatchEvent(event);
        setTimeout(function () {
            event._eventCode = cc.EventTouch.EventCode.MOVED;
            cc.eventManager.dispatchEvent(event);
        }, 16);
        setTimeout(function () {
            event._eventCode = cc.EventTouch.EventCode.ENDED;
            cc.eventManager.dispatchEvent(event);
        }, 50);

        _showClickSuccess(output, className, displayName,
            " at (" + Math.round(worldPos.x) + "," + Math.round(worldPos.y) + ")");
        B.fn.refreshTree();
    };

    function _showClickSuccess(output, type, name, suffix) {
        if (!output) return;
        output.style.color = "#4ade80";
        output.textContent = "✓ Clicked " + type + ": " + name + (suffix || "");
    }

    // ─── Search Dropdown ───────────────────────────────────────
    B.fn.populateSearchDropdown = function (query) {
        var dropdown = document.getElementById("dev-click-dropdown");
        var allNodes = B.fn.collectAllNodes();
        var q = query.toLowerCase();
        var filtered = q.length === 0 ? allNodes : allNodes.filter(function (item) {
            return item.name.toLowerCase().indexOf(q) >= 0 ||
                item.cls.toLowerCase().indexOf(q) >= 0 ||
                item.path.toLowerCase().indexOf(q) >= 0;
        });

        var totalCount = filtered.length;
        filtered = filtered.slice(0, 30);

        dropdown.innerHTML = "";
        if (filtered.length === 0) {
            dropdown.innerHTML = '<div style="padding:6px;color:#555;font-size:10px;text-align:center">No nodes found</div>';
        } else {
            if (totalCount > 30) {
                var moreDiv = document.createElement("div");
                moreDiv.style.cssText = "padding:4px 6px;color:#f59e0b;font-size:9px;text-align:center;border-bottom:1px solid #333";
                moreDiv.textContent = "Showing 30 of " + totalCount + " results — refine your search";
                dropdown.appendChild(moreDiv);
            }
            for (var i = 0; i < filtered.length; i++) {
                (function (item) {
                    var div = document.createElement("div");
                    div.className = "dev-search-item";
                    div.innerHTML = '<span class="s-icon">' + item.icon + '</span>' +
                        (item.name ? '<span class="s-name">' + B.fn.escHtml(item.name) + '</span>' : '') +
                        '<span class="s-cls">' + item.cls + '</span>' +
                        '<span class="s-path">' + B.fn.escHtml(item.path) + '</span>';
                    div.addEventListener("click", function () {
                        B.fn.selectNode(item.node);
                        B.fn.clickNode(null, item.node);
                        dropdown.classList.remove("open");
                        document.getElementById("dev-click-search").value = "";
                        document.getElementById("dev-click-search").blur();
                    });
                    dropdown.appendChild(div);
                })(filtered[i]);
            }
        }
        dropdown.classList.add("open");
    };

    B.fn.highlightSearchItem = function (items) {
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle("active", i === S.searchActiveIdx);
        }
        if (S.searchActiveIdx >= 0 && items[S.searchActiveIdx]) {
            items[S.searchActiveIdx].scrollIntoView({ block: "nearest" });
        }
    };
})();
