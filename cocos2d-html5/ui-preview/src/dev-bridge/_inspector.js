/**
 * dev-bridge/_inspector.js — Node inspector: render, drag-num, property editing
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    var S = B.state;

    B.fn.renderInspector = function () {
        var container = document.getElementById("dev-inspector");
        if (!S.selectedNode) {
            container.innerHTML = '<div class="empty">Click a node in the tree to inspect</div>';
            return;
        }
        B.fn.updateInspector();
    };

    B.fn.updateInspector = function () {
        var container = document.getElementById("dev-inspector");
        var node = S.selectedNode;
        if (!node) return;

        var cls = B.fn.getClassName(node);
        var name = node.getName() || "(unnamed)";
        var pos = node.getPosition();
        var cs = node.getContentSize();
        var anchor = node.getAnchorPoint();
        var scale = { x: node.getScaleX(), y: node.getScaleY() };

        var html = [];
        html.push('<div class="header">' + B.fn.escHtml(name) + ' <span style="color:#666">(' + cls + ')</span></div>');
        html.push('<div class="prop-grid">');

        // Position
        html.push('<span class="prop-label">Position</span>');
        html.push('<div class="prop-row">');
        html.push('X ' + _dragNumHtml("pos-x", Math.round(pos.x), -9999, 9999, 1));
        html.push('Y ' + _dragNumHtml("pos-y", Math.round(pos.y), -9999, 9999, 1));
        html.push('</div>');

        // Scale
        html.push('<span class="prop-label">Scale</span>');
        html.push('<div class="prop-row">');
        html.push('X ' + _dragNumHtml("scale-x", scale.x.toFixed(2), -10, 10, 0.01));
        html.push('Y ' + _dragNumHtml("scale-y", scale.y.toFixed(2), -10, 10, 0.01));
        html.push('</div>');

        // Rotation
        html.push('<span class="prop-label">Rotation</span>');
        html.push('<div class="prop-row">');
        html.push(_dragNumHtml("rotation", Math.round(node.getRotation()), -360, 360, 1) + "°");
        html.push('</div>');

        // Opacity
        html.push('<span class="prop-label">Opacity</span>');
        html.push('<div class="prop-row" style="flex:1">');
        html.push('<input type="range" class="dev-range" data-prop="opacity" min="0" max="255" value="' + node.getOpacity() + '">');
        html.push('<span style="width:24px;text-align:right;font-size:9px" id="dev-opacity-val">' + node.getOpacity() + '</span>');
        html.push('</div>');

        // Visible
        html.push('<span class="prop-label">Visible</span>');
        html.push('<div class="prop-row">');
        html.push('<input type="checkbox" class="dev-checkbox" data-prop="visible" ' + (node.isVisible() ? "checked" : "") + '>');
        html.push('<span style="color:#888;font-size:9px">' + (node.isVisible() ? "yes" : "no") + '</span>');
        html.push('</div>');

        // Anchor
        html.push('<span class="prop-label">Anchor</span>');
        html.push('<div class="prop-row">');
        html.push('X ' + _dragNumHtml("anchor-x", anchor.x.toFixed(2), 0, 1, 0.01));
        html.push('Y ' + _dragNumHtml("anchor-y", anchor.y.toFixed(2), 0, 1, 0.01));
        html.push('</div>');

        // Size
        html.push('<span class="prop-label">Size</span>');
        html.push('<div class="prop-row">');
        html.push('W ' + _dragNumHtml("size-w", Math.round(cs.width), 0, 9999, 1));
        html.push('H ' + _dragNumHtml("size-h", Math.round(cs.height), 0, 9999, 1));
        html.push('</div>');

        // ZOrder
        html.push('<span class="prop-label">ZOrder</span>');
        html.push('<div class="prop-row">');
        html.push(_dragNumHtml("zorder", node.getLocalZOrder(), -999, 999, 1));
        html.push('</div>');

        // Color
        var color = node.getColor();
        html.push('<span class="prop-label">Color</span>');
        html.push('<div class="prop-row">');
        var hexColor = "#" + B.fn.toHex(color.r) + B.fn.toHex(color.g) + B.fn.toHex(color.b);
        html.push('<input type="color" class="dev-color-input" data-prop="color" value="' + hexColor + '">');
        html.push('<span style="color:#888;font-size:9px">' + hexColor + '</span>');
        html.push('</div>');

        html.push('</div>'); // end prop-grid

        // Type-specific info (uses shared function from _text-tree.js)
        var typeInfo = B.fn.getTypeInfo ? B.fn.getTypeInfo(node, cls) : null;
        if (typeInfo) {
            var parts = [];
            for (var key in typeInfo) { if (typeInfo.hasOwnProperty(key)) parts.push(key + ': ' + typeInfo[key]); }
            html.push('<div class="dev-type-info">' + parts.join(' | ') + '</div>');
        }

        container.innerHTML = html.join("");

        // Bind inspector events
        _bindInspectorEvents(container);
    };

    function _dragNumHtml(prop, value, min, max, step) {
        return '<input type="text" class="dev-drag-num" data-prop="' + prop + '" ' +
            'data-min="' + min + '" data-max="' + max + '" data-step="' + step + '" ' +
            'value="' + value + '">';
    }

    function _bindInspectorEvents(container) {
        // Drag number inputs
        var dragNums = container.querySelectorAll(".dev-drag-num");
        for (var i = 0; i < dragNums.length; i++) {
            _setupDragNum(dragNums[i]);
        }

        // Range slider (opacity)
        var range = container.querySelector('.dev-range[data-prop="opacity"]');
        if (range) {
            range.addEventListener("input", function () {
                if (!S.selectedNode) return;
                S.selectedNode.setOpacity(parseInt(this.value));
                var valEl = document.getElementById("dev-opacity-val");
                if (valEl) valEl.textContent = this.value;
            });
        }

        // Checkbox (visible)
        var checkbox = container.querySelector('.dev-checkbox[data-prop="visible"]');
        if (checkbox) {
            checkbox.addEventListener("change", function () {
                if (!S.selectedNode) return;
                S.selectedNode.setVisible(this.checked);
                B.fn.refreshTree();
            });
        }

        // Color picker
        var colorInput = container.querySelector('.dev-color-input[data-prop="color"]');
        if (colorInput) {
            colorInput.addEventListener("input", function () {
                if (!S.selectedNode) return;
                var hex = this.value;
                var r = parseInt(hex.substr(1, 2), 16);
                var g = parseInt(hex.substr(3, 2), 16);
                var b = parseInt(hex.substr(5, 2), 16);
                S.selectedNode.setColor(cc.color(r, g, b));
            });
        }
    }

    function _setupDragNum(el) {
        var prop = el.getAttribute("data-prop");
        var min = parseFloat(el.getAttribute("data-min"));
        var max = parseFloat(el.getAttribute("data-max"));
        var step = parseFloat(el.getAttribute("data-step"));
        var dragging = false;
        var startX = 0;
        var startVal = 0;

        el.addEventListener("mousedown", function (e) {
            if (document.activeElement === el) return;
            dragging = true;
            startX = e.clientX;
            startVal = parseFloat(el.value) || 0;
            e.preventDefault();

            var onMove = function (e2) {
                if (!dragging) return;
                var dx = e2.clientX - startX;
                var sensitivity = step < 1 ? 0.5 : 1;
                var newVal = startVal + dx * step * sensitivity;
                newVal = Math.max(min, Math.min(max, newVal));
                if (step >= 1) newVal = Math.round(newVal);
                else newVal = parseFloat(newVal.toFixed(2));
                el.value = newVal;
                _applyPropValue(prop, newVal);
                B.fn.updateOverlay();
            };
            var onUp = function () {
                dragging = false;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                B.fn.updateOverlay();
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });

        el.addEventListener("change", function () {
            var val = parseFloat(el.value) || 0;
            val = Math.max(min, Math.min(max, val));
            el.value = step >= 1 ? Math.round(val) : val.toFixed(2);
            _applyPropValue(prop, val);
            B.fn.updateOverlay();
        });
    }

    function _applyPropValue(prop, val) {
        if (!S.selectedNode) return;
        var n = S.selectedNode;
        switch (prop) {
            case "pos-x": n.setPositionX(val); break;
            case "pos-y": n.setPositionY(val); break;
            case "scale-x": n.setScaleX(val); break;
            case "scale-y": n.setScaleY(val); break;
            case "rotation": n.setRotation(val); break;
            case "anchor-x": n.setAnchorPoint(cc.p(val, n.getAnchorPoint().y)); break;
            case "anchor-y": n.setAnchorPoint(cc.p(n.getAnchorPoint().x, val)); break;
            case "size-w": n.setContentSize(cc.size(val, n.getContentSize().height)); break;
            case "size-h": n.setContentSize(cc.size(n.getContentSize().width, val)); break;
            case "zorder": n.setLocalZOrder(val); break;
        }
    }

    // _getTypeSpecificInfo removed — now uses shared B.fn.getTypeInfo from _text-tree.js
})();
