                                                                                                                                                                                                                                                                                                                                                                                                                                                                    /**
 * dev-bridge/_text-tree.js — Text tree, JSON API for AI agents, & node finding
 */
(function () {
    "use strict";

    var B = window.__devBridge;

    // ─── Text Tree (original, kept for backward compat) ─────
    B.fn.getTextTree = function () {
        var scene = cc.director.getRunningScene();
        if (!scene) return "(no running scene)";
        var lines = [];
        _traverseText(scene, 0, lines);
        return lines.join("\n");
    };

    function _traverseText(node, depth, lines) {
        var indent = "";
        for (var i = 0; i < depth; i++) indent += "  ";
        var name = node.getName() || "";
        var cls = B.fn.getClassName(node);
        var pos = "(" + Math.round(node.getPositionX()) + "," + Math.round(node.getPositionY()) + ")";
        var cs = node.getContentSize();
        var size = Math.round(cs.width) + "×" + Math.round(cs.height);
        var vis = node.isVisible() ? "" : " [HIDDEN]";
        var tag = node.getTag();
        var tagStr = tag >= 0 ? " tag=" + tag : "";
        var opacity = node.getOpacity();
        var opStr = opacity < 255 ? " α=" + opacity : "";
        var label = cls;
        if (name) label = '"' + name + '" (' + cls + ")";
        var childCount = node.getChildrenCount();
        var childStr = childCount > 0 ? " [" + childCount + " children]" : "";
        lines.push(indent + "├─ " + label + " " + pos + " " + size + tagStr + opStr + vis + childStr);
        var children = node.getChildren();
        for (var j = 0; j < children.length; j++) {
            _traverseText(children[j], depth + 1, lines);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // JSON API for AI Agents
    // ═══════════════════════════════════════════════════════════

    /**
     * getSnapshot() - Full JSON tree of the running scene.
     * Returns: { scene, designSize, frameSize, tree: [...] }
     */
    B.fn.getSnapshot = function () {
        var scene = cc.director.getRunningScene();
        if (!scene) return { error: "no running scene" };
        var ws = cc.winSize;
        var fs = cc.view.getFrameSize();
        return {
            scene: scene.getName() || scene.constructor.name || "unnamed",
            designSize: { w: ws.width, h: ws.height },
            frameSize: { w: Math.round(fs.width), h: Math.round(fs.height) },
            tree: _buildJsonTree(scene, "")
        };
    };

    function _buildJsonTree(node, parentPath) {
        var name = node.getName() || "";
        var cls = B.fn.getClassName(node);
        var id = name || cls;
        var path = parentPath ? parentPath + "/" + id : id;
        var pos = node.getPosition();
        var cs = node.getContentSize();
        var children = node.getChildren();

        var entry = {
            name: name,
            class: cls,
            path: path,
            pos: { x: Math.round(pos.x), y: Math.round(pos.y) },
            size: { w: Math.round(cs.width), h: Math.round(cs.height) },
            visible: node.isVisible(),
            opacity: node.getOpacity(),
            zOrder: node.getLocalZOrder()
        };

        // Add interactable flag
        entry.interactable = _isInteractable(node, cls);

        // Add type-specific short info
        var typeInfo = B.fn.getTypeInfo(node, cls);
        if (typeInfo) entry.typeInfo = typeInfo;

        // Recurse children
        if (children.length > 0) {
            entry.children = [];
            for (var i = 0; i < children.length; i++) {
                entry.children.push(_buildJsonTree(children[i], path));
            }
        }

        return entry;
    }

    function _isInteractable(node, cls) {
        if (typeof ccui !== "undefined") {
            if (ccui.Button && node instanceof ccui.Button) return true;
            if (ccui.TextField && node instanceof ccui.TextField) return true;
            if (ccui.CheckBox && node instanceof ccui.CheckBox) return true;
            if (ccui.Slider && node instanceof ccui.Slider) return true;
        }
        if (cc.MenuItem && node instanceof cc.MenuItem) return true;
        return false;
    }

    B.fn.getTypeInfo = function (node, cls) {
        var info = {};
        var hasInfo = false;
        if (cc.Sprite && node instanceof cc.Sprite) {
            var tex = node.getTexture();
            if (tex && tex.url) { info.texture = tex.url.split("/").pop(); hasInfo = true; }
        }
        if (cc.LabelTTF && node instanceof cc.LabelTTF) {
            info.text = node.getString() || "";
            info.font = (node.getFontName() || "?") + " " + node.getFontSize() + "px";
            hasInfo = true;
        }
        if (cc.LabelBMFont && node instanceof cc.LabelBMFont) {
            info.text = node.getString() || "";
            hasInfo = true;
        }
        if (typeof ccui !== "undefined") {
            if (ccui.Button && node instanceof ccui.Button) {
                info.title = node.getTitleText() || "";
                hasInfo = true;
            }
            if (ccui.Text && node instanceof ccui.Text) {
                info.text = node.getString() || "";
                info.fontSize = node.getFontSize();
                hasInfo = true;
            }
            if (ccui.TextField && node instanceof ccui.TextField) {
                info.text = node.getString() || "";
                info.placeholder = node.getPlaceHolder() || "";
                hasInfo = true;
            }
            if (ccui.CheckBox && node instanceof ccui.CheckBox) {
                info.selected = node.isSelected();
                hasInfo = true;
            }
            if (ccui.Slider && node instanceof ccui.Slider) {
                info.percent = node.getPercent();
                hasInfo = true;
            }
            if (ccui.LoadingBar && node instanceof ccui.LoadingBar) {
                info.percent = node.getPercent();
                hasInfo = true;
            }
        }
        return hasInfo ? info : null;
    }

    /**
     * getNodeInfo(path) - Detailed JSON for one node.
     * Returns: { name, class, path, pos, size, visible, opacity, scale, rotation,
     *            anchor, zOrder, color, typeInfo, interactable }
     */
    B.fn.getNodeInfo = function (pathStr) {
        var node = B.fn.findNodeByPath(pathStr);
        if (!node) return { error: "Node not found: " + pathStr };

        var cls = B.fn.getClassName(node);
        var pos = node.getPosition();
        var cs = node.getContentSize();
        var anchor = node.getAnchorPoint();
        var color = node.getColor();

        var result = {
            name: node.getName() || "",
            class: cls,
            path: B.fn.getNodePathFull(node),
            pos: { x: Math.round(pos.x), y: Math.round(pos.y) },
            size: { w: Math.round(cs.width), h: Math.round(cs.height) },
            visible: node.isVisible(),
            opacity: node.getOpacity(),
            scale: { x: node.getScaleX(), y: node.getScaleY() },
            rotation: node.getRotation(),
            anchor: { x: anchor.x, y: anchor.y },
            zOrder: node.getLocalZOrder(),
            color: "#" + B.fn.toHex(color.r) + B.fn.toHex(color.g) + B.fn.toHex(color.b),
            interactable: _isInteractable(node, cls),
            childCount: node.getChildrenCount()
        };

        var tag = node.getTag();
        if (tag >= 0) result.tag = tag;

        var typeInfo = B.fn.getTypeInfo(node, cls);
        if (typeInfo) result.typeInfo = typeInfo;

        var bb = B.fn.getWorldBB(node);
        if (bb) result.worldBounds = {
            x: Math.round(bb.x), y: Math.round(bb.y),
            w: Math.round(bb.width), h: Math.round(bb.height)
        };

        return result;
    };

    /**
     * queryNodes(filter) - Find nodes matching criteria.
     * filter = { class, name, visible, interactable }
     * name supports simple glob: "btn_*" matches names starting with "btn_"
     * Returns: array of { name, class, path, interactable, visible }
     */
    B.fn.queryNodes = function (filter) {
        filter = filter || {};
        var scene = cc.director.getRunningScene();
        if (!scene) return [];
        var results = [];
        _queryTraverse(scene, "", filter, results);
        return results;
    };

    function _matchGlob(str, pattern) {
        if (!pattern) return true;
        // Simple glob: * matches anything
        var regex = "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$";
        return new RegExp(regex, "i").test(str);
    }

    function _queryTraverse(node, parentPath, filter, results) {
        var name = node.getName() || "";
        var cls = B.fn.getClassName(node);
        var id = name || cls;
        var path = parentPath ? parentPath + "/" + id : id;
        var interactable = _isInteractable(node, cls);

        var match = true;
        if (filter.class && cls !== filter.class) match = false;
        if (filter.name && !_matchGlob(name, filter.name)) match = false;
        if (filter.visible !== undefined && node.isVisible() !== filter.visible) match = false;
        if (filter.interactable !== undefined && interactable !== filter.interactable) match = false;

        if (match) {
            var entry = {
                name: name,
                class: cls,
                path: path,
                visible: node.isVisible(),
                interactable: interactable
            };
            var typeInfo = B.fn.getTypeInfo(node, cls);
            if (typeInfo) entry.typeInfo = typeInfo;
            results.push(entry);
        }

        var children = node.getChildren();
        for (var i = 0; i < children.length; i++) {
            _queryTraverse(children[i], path, filter, results);
        }
    }

    /**
     * setProp(path, prop, value) - Set a node's property.
     * Supported props: "x","y","scaleX","scaleY","scale","rotation",
     *   "opacity","visible","anchorX","anchorY","width","height",
     *   "zOrder","color","text","name"
     * Returns: { ok, prop, value } or { error }
     */
    B.fn.setProp = function (pathStr, prop, value) {
        var node = B.fn.findNodeByPath(pathStr);
        if (!node) return { error: "Node not found: " + pathStr };

        try {
            switch (prop) {
                case "x": node.setPositionX(value); break;
                case "y": node.setPositionY(value); break;
                case "scaleX": node.setScaleX(value); break;
                case "scaleY": node.setScaleY(value); break;
                case "scale": node.setScale(value); break;
                case "rotation": node.setRotation(value); break;
                case "opacity": node.setOpacity(value); break;
                case "visible": node.setVisible(!!value); break;
                case "anchorX": node.setAnchorPoint(cc.p(value, node.getAnchorPoint().y)); break;
                case "anchorY": node.setAnchorPoint(cc.p(node.getAnchorPoint().x, value)); break;
                case "width": node.setContentSize(cc.size(value, node.getContentSize().height)); break;
                case "height": node.setContentSize(cc.size(node.getContentSize().width, value)); break;
                case "zOrder": node.setLocalZOrder(value); break;
                case "color":
                    if (typeof value === "string" && value.charAt(0) === "#") {
                        var r = parseInt(value.substr(1, 2), 16);
                        var g = parseInt(value.substr(3, 2), 16);
                        var b = parseInt(value.substr(5, 2), 16);
                        node.setColor(cc.color(r, g, b));
                    }
                    break;
                case "text":
                    if (node.setString) node.setString(String(value));
                    else if (node.setTitleText) node.setTitleText(String(value));
                    else return { error: "Node does not support setText" };
                    break;
                case "name":
                    node.setName(String(value)); break;
                default:
                    return { error: "Unknown property: " + prop + ". Use DevBridge.listActions() for supported props." };
            }
            // Refresh UI
            B.fn.refreshTree();
            B.fn.updateInspector();
            B.fn.updateOverlay();
            return { ok: true, prop: prop, value: value };
        } catch (err) {
            return { error: "Failed to set " + prop + ": " + err.message };
        }
    };

    // ─── Node Finding ─────────────────────────────────────────
    B.fn.findNodeByPath = function (pathStr) {
        var scene = cc.director.getRunningScene();
        if (!scene) return null;
        var parts = pathStr.split("/").filter(function (p) { return p.length > 0; });
        if (parts.length === 0) return scene;

        // First segment: match against scene itself (self-match OK)
        var current = _findChild(scene, parts[0], true);
        if (!current) return null;

        // Remaining segments: always search children only (no self-match)
        for (var i = 1; i < parts.length; i++) {
            var found = _findChild(current, parts[i], false);
            if (!found) return null;
            current = found;
        }
        return current;
    };

    /**
     * Find a node by name or class among children.
     * @param {cc.Node} parent   - Node to search within
     * @param {string}  segment  - Path segment (node name or class like "cc.Node")
     * @param {boolean} allowSelf - If true, check parent itself first
     */
    function _findChild(parent, segment, allowSelf) {
        if (allowSelf) {
            if (parent.getName() === segment) return parent;
            if (B.fn.getClassName(parent) === segment) return parent;
        }
        // Search direct children
        var kids = parent.getChildren();
        for (var i = 0; i < kids.length; i++) {
            var child = kids[i];
            if (child.getName() === segment || B.fn.getClassName(child) === segment) return child;
        }
        return null;
    }
})();

