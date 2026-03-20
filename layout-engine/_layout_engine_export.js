/**
 * LayoutEngine — Adaptive Code Export (ES5)
 *
 * Generates UIBuilder code directly from JSON tree.
 * Only requires buildTree() — does NOT require computeLayout().
 *
 * Size resolution:
 *  - Leaf nodes: use explicit width/height from JSON
 *  - Containers with constraints (left+right, top+bottom): pinEdges computes size synchronously
 *  - Containers with explicit size: use width/height from JSON
 *
 * Uses: pinEdges, arrangeAsRow/Column/Grid/Wrap, createBackground.
 * No runtime LayoutEngine required in generated code.
 */
(function(global) {
    var LayoutEngine = global.LayoutEngine ||
        (typeof require !== 'undefined' && require('./_layout_engine')) || null;
    if (!LayoutEngine) return;

    /**
     * Export adaptive UIBuilder code from the raw JSON tree.
     * Only requires buildTree() to be called first (for node normalization).
     * Does NOT require computeLayout().
     *
     * @param {Object} options
     * @param {string} options.resourceMapVar — resource variable prefix (e.g., "res_preview")
     * @param {string} options.layerName — Layer class name (default: "GeneratedLayer")
     * @param {string} options.indent — tab string (default: 4 spaces)
     * @param {boolean} options.includeComments — emit // comments (default: true)
     * @param {boolean} options.wrapInLayer — wrap in cc.Layer.extend (default: true)
     */
    LayoutEngine.prototype.exportAdaptiveCode = function(options) {
        options = options || {};
        var resVar = options.resourceMapVar || '';
        var layerName = options.layerName || 'GeneratedLayer';
        var tab = options.indent || '    ';
        var includeComments = options.includeComments !== false;
        var wrapInLayer = options.wrapInLayer !== false;

        var srcTree = this._root;
        if (!srcTree) return '';

        var lines = [];
        var indent = '';
        var buttonNodes = [];   // Button names for callback generation
        var allNodeVars = [];   // All variable names for _nodes map

        // ── Utility helpers ──

        function ln(s) { lines.push(indent + (s || '')); }
        function blank() { lines.push(''); }
        function sanitizeName(name) { return (name || 'node').replace(/[^a-zA-Z0-9_$]/g, '_'); }
        function getResRef(name) { return resVar ? resVar + '.' + sanitizeName(name) : null; }

        // ── setContentSize (skips dimensions computed by pinEdges) ──

        function emitSize(varName, node) {
            var w = Math.round(node.width || 0);
            var h = Math.round(node.height || 0);
            // Skip dimension that pinEdges will compute from parent
            if (node.left !== undefined && node.right !== undefined) w = 0;
            if (node.top !== undefined && node.bottom !== undefined) h = 0;
            if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
            else if (w > 0) ln(varName + '.setContentSize(' + w + ', ' + varName + '.getContentSize().height);');
            else if (h > 0) ln(varName + '.setContentSize(' + varName + '.getContentSize().width, ' + h + ');');
        }

        // ── pinEdges ──

        function hasPinEdges(node) {
            return node.left !== undefined || node.right !== undefined ||
                   node.top !== undefined || node.bottom !== undefined ||
                   node.horizontalCenter !== undefined || node.verticalCenter !== undefined ||
                   node.percentX !== undefined || node.percentY !== undefined;
        }

        function emitPinEdges(varName, node) {
            var edges = [];
            if (node.left !== undefined) edges.push('left: ' + node.left);
            if (node.right !== undefined) edges.push('right: ' + node.right);
            if (node.top !== undefined) edges.push('top: ' + node.top);
            if (node.bottom !== undefined) edges.push('bottom: ' + node.bottom);
            if (node.horizontalCenter !== undefined) edges.push('horizontalCenter: true');
            if (node.verticalCenter !== undefined) edges.push('verticalCenter: true');
            if (node.percentX !== undefined) edges.push('percentX: ' + node.percentX);
            if (node.percentY !== undefined) edges.push('percentY: ' + node.percentY);
            if (edges.length > 0) {
                ln('UIBuilder.pinEdges(' + varName + ', { ' + edges.join(', ') + ' });');
            }
        }

        // ── Padding ──

        function getPaddingStr(node) {
            if (!node.padding && !node.paddingTop && !node.paddingRight && !node.paddingBottom && !node.paddingLeft) return null;
            if (typeof node.padding === 'number') return '' + node.padding;
            if (Array.isArray(node.padding)) return JSON.stringify(node.padding);
            var pt = node.paddingTop || (node.padding && node.padding.top) || 0;
            var pr = node.paddingRight || (node.padding && node.padding.right) || 0;
            var pb = node.paddingBottom || (node.padding && node.padding.bottom) || 0;
            var pl = node.paddingLeft || (node.padding && node.padding.left) || 0;
            if (pt === pr && pr === pb && pb === pl) return '' + pt;
            return '{ top: ' + pt + ', right: ' + pr + ', bottom: ' + pb + ', left: ' + pl + ' }';
        }

        // ── arrangeAs* calls ──

        function emitArrangeCall(varName, node) {
            var layoutType = node.layoutType;

            if (layoutType === 'Grid') {
                var gopts = [];
                if (node.columns) gopts.push('columns: ' + node.columns);
                if (node.spacingX) gopts.push('spacingX: ' + node.spacingX);
                else if (node.gap) gopts.push('spacingX: ' + node.gap);
                if (node.spacingY) gopts.push('spacingY: ' + node.spacingY);
                else if (node.gap) gopts.push('spacingY: ' + node.gap);
                if (node.cellWidth) gopts.push('cellWidth: ' + node.cellWidth);
                if (node.cellHeight) gopts.push('cellHeight: ' + node.cellHeight);
                var gpad = getPaddingStr(node);
                if (gpad) gopts.push('padding: ' + gpad);
                ln('UIBuilder.arrangeAsGrid(' + varName + ', { ' + gopts.join(', ') + ' });');
                return;
            }

            if (layoutType === 'Wrap') {
                var wopts = [];
                if (node.gap) wopts.push('gap: ' + node.gap);
                var wpad = getPaddingStr(node);
                if (wpad) wopts.push('padding: ' + wpad);
                ln('UIBuilder.arrangeAsWrap(' + varName + ', { ' + wopts.join(', ') + ' });');
                return;
            }

            if (layoutType !== 'Linear') return;
            var isRow = (node.flexDirection === 'row' || node.flexDirection === 'row-reverse');
            var isReverse = (node.flexDirection === 'row-reverse' || node.flexDirection === 'column-reverse');
            var method = isRow ? 'UIBuilder.arrangeAsRow' : 'UIBuilder.arrangeAsColumn';
            var lopts = [];
            if (node.gap) lopts.push('gap: ' + node.gap);
            if (node.alignItems) lopts.push('alignItems: "' + node.alignItems + '"');
            if (node.justifyContent) lopts.push('justifyContent: "' + node.justifyContent + '"');
            if (isReverse) lopts.push('reverse: true');
            var lpad = getPaddingStr(node);
            if (lpad) lopts.push('padding: ' + lpad);
            ln(method + '(' + varName + ', { ' + lopts.join(', ') + ' });');
        }

        // ── Common properties (applied to every node after creation) ──

        function emitCommonProps(varName, node) {
            if (node.rotation) ln(varName + '.setRotation(' + node.rotation + ');');
            if (node.opacity !== undefined && node.opacity !== 255) ln(varName + '.setOpacity(' + node.opacity + ');');
            if (node.visible === false) ln(varName + '.setVisible(false);');
            if (node.zOrder) ln(varName + '.setLocalZOrder(' + node.zOrder + ');');
            if (node.scaleX !== undefined && node.scaleX !== 1) ln(varName + '.setScaleX(' + node.scaleX + ');');
            if (node.scaleY !== undefined && node.scaleY !== 1) ln(varName + '.setScaleY(' + node.scaleY + ');');

            // Percent-based sizing (runtime calculation)
            if (node.percentWidth !== undefined) {
                ln(varName + '.setContentSize(' + varName + '.getParent().getContentSize().width * ' + node.percentWidth + ', ' + varName + '.getContentSize().height);');
            }
            if (node.percentHeight !== undefined) {
                ln(varName + '.setContentSize(' + varName + '.getContentSize().width, ' + varName + '.getParent().getContentSize().height * ' + node.percentHeight + ');');
            }

            // Aspect ratio (runtime calculation)
            if (node.aspectRatio !== undefined) {
                var hasH = node.height !== undefined && node.height > 0;
                ln('(function() {');
                ln('    var _cs = ' + varName + '.getContentSize();');
                ln('    if (_cs.width > 0 && (_cs.height === 0 || ' + (!hasH ? 'true' : 'false') + ')) {');
                ln('        ' + varName + '.setContentSize(_cs.width, _cs.width / ' + node.aspectRatio + ');');
                ln('    } else if (_cs.height > 0) {');
                ln('        ' + varName + '.setContentSize(_cs.height * ' + node.aspectRatio + ', _cs.height);');
                ln('    }');
                ln('})();');
            }

            // Size constraints (runtime clamp)
            if (node.minWidth !== undefined || node.maxWidth !== undefined || node.minHeight !== undefined || node.maxHeight !== undefined) {
                ln('(function() {');
                ln('    var _cs = ' + varName + '.getContentSize();');
                ln('    var _w = _cs.width, _h = _cs.height;');
                if (node.minWidth !== undefined) ln('    _w = Math.max(_w, ' + node.minWidth + ');');
                if (node.maxWidth !== undefined) ln('    _w = Math.min(_w, ' + node.maxWidth + ');');
                if (node.minHeight !== undefined) ln('    _h = Math.max(_h, ' + node.minHeight + ');');
                if (node.maxHeight !== undefined) ln('    _h = Math.min(_h, ' + node.maxHeight + ');');
                ln('    ' + varName + '.setContentSize(_w, _h);');
                ln('})();');
            }

            // Margin (consumed by arrangeAsRow/Column at runtime)
            if (node.margin !== undefined) {
                if (typeof node.margin === 'number') {
                    ln(varName + '._margin = ' + node.margin + ';');
                } else if (Array.isArray(node.margin)) {
                    ln(varName + '._margin = ' + JSON.stringify(node.margin) + ';');
                } else {
                    ln(varName + '._margin = { top: ' + (node.margin.top||0) + ', right: ' + (node.margin.right||0) + ', bottom: ' + (node.margin.bottom||0) + ', left: ' + (node.margin.left||0) + ' };');
                }
            }

            // Flex weight (consumed by arrangeAsRow/Column at runtime)
            if (node.flex !== undefined && node.flex > 0) ln(varName + '._flex = ' + node.flex + ';');

            // Flex shrink opt-out (consumed by arrangeAsRow/Column at runtime)
            if (node.flexShrink === 0) ln(varName + '._flexShrink = 0;');

            // alignSelf (consumed by arrangeAsRow/Column at runtime)
            if (node.alignSelf) ln(varName + '._alignSelf = "' + node.alignSelf + '";');
        }

        // ══════════════════════════════════════════════════════════
        //  EXPORT NODE (recursive)
        // ══════════════════════════════════════════════════════════

        function exportNode(node, parentVar) {
            var name = node.name || 'node';
            var varName = sanitizeName(name);
            var type = node.type || '';
            var w = Math.round(node.width || 0);
            var h = Math.round(node.height || 0);
            var anchor = node.anchor || null;
            var isRoot = !parentVar;

            var isVisualType = (type === 'sprite' || type === 'button' || type === 'imageView'
                || type === 'scale9' || type === 'label' || type === 'text' || type === 'progressBar');
            var hasChildren = node.children && node.children.length > 0;
            var hasBgProp = !!node.background;
            // A node is a container if: it has layoutType AND (not visual, or has children, or has background prop)
            var isContainer = (!!node.layoutType || hasBgProp || hasChildren) && (!isVisualType || hasChildren || hasBgProp);
            var isLinear = node.layoutType === 'Linear';
            var isGrid = node.layoutType === 'Grid';
            var isWrap = node.layoutType === 'Wrap';
            var isScrollView = node.layoutType === 'ScrollView';

            allNodeVars.push(varName);

            // ── Comment ──
            if (includeComments && node._comment) {
                ln('// ' + node._comment);
            }
            if (includeComments && node.name) {
                var lbl = '';
                if (isLinear) {
                    lbl = (node.flexDirection === 'row' || node.flexDirection === 'row-reverse') ? ' (Row)' : ' (Column)';
                } else if (isGrid) {
                    lbl = ' (Grid)';
                } else if (isWrap) {
                    lbl = ' (Wrap)';
                } else if (isScrollView) {
                    lbl = ' (ScrollView)';
                }
                ln('// ── ' + name + lbl + ' ──');
            }

            // ══════════════════════════════════════════════════════
            //  CREATE NODE
            // ══════════════════════════════════════════════════════

            if (isRoot) {
                // Root node — always fullscreen
                ln('var ' + varName + ' = UIBuilder.createFullScreenLayout(this);');
                ln(varName + '.setName("' + name + '");');

            } else if ((type === 'sprite' || type === 'imageView') && node.scaleMode) {
                // Sprite with scaleMode (FILL/FIT/STRETCH) — fills parent
                var bgRes = getResRef(name);
                ln('var ' + varName + ' = ' + (bgRes ? 'UIBuilder.sprite(' + bgRes + ')' : 'new cc.Sprite()') + ';');
                ln(varName + '.setName("' + name + '");');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                ln('UIBuilder.setLayoutSize(' + varName + ', 0, 0, "' + node.scaleMode + '");');
                if (hasPinEdges(node)) emitPinEdges(varName, node);

            } else if (isScrollView) {
                // ScrollView
                ln('var ' + varName + ' = new ccui.ScrollView();');
                var scrollDir = node.scrollDirection || 'vertical';
                if (scrollDir === 'horizontal') {
                    ln(varName + '.setDirection(ccui.ScrollView.DIR_HORIZONTAL);');
                } else if (scrollDir === 'both') {
                    ln(varName + '.setDirection(ccui.ScrollView.DIR_BOTH);');
                } else {
                    ln(varName + '.setDirection(ccui.ScrollView.DIR_VERTICAL);');
                }
                emitSize(varName, node);
                ln(varName + '.setName("' + name + '");');
                if (node.clipping !== false) ln(varName + '.setClippingEnabled(true);');
                ln(varName + '.setBounceEnabled(true);');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);

            } else if (isContainer) {
                // Container node (has layoutType/children/background)
                var bgType = node.background || '';
                var containerRes = getResRef(name);
                // Support both new `background` property and legacy `type + children` combo
                var hasVisualBg = bgType === 'sprite' || bgType === 'scale9' || bgType === 'imageView'
                    || (isVisualType && hasChildren && (type === 'sprite' || type === 'imageView' || type === 'scale9'));
                if (hasVisualBg && containerRes) {
                    ln('var ' + varName + ' = new ccui.Layout();');
                    ln(varName + '.setBackGroundImage(' + containerRes + ');');
                    if (bgType === 'scale9' || type === 'scale9') {
                        ln(varName + '.setBackGroundImageScale9Enabled(true);');
                    }
                } else {
                    ln('var ' + varName + ' = new ccui.Layout();');
                }
                emitSize(varName, node);
                ln(varName + '.setName("' + name + '");');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                if (node.clipping) ln(varName + '.setClippingEnabled(true);');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);

            } else {
                // ── Leaf visual node ──
                emitLeafNode(varName, type, name, node, parentVar, w, h, anchor);
            }

            // ── Common properties ──
            emitCommonProps(varName, node);
            blank();

            // ── Recurse children ──
            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    exportNode(node.children[c], varName);
                }
            }

            // ── After all children: emit arrange call ──
            if ((isLinear || isGrid || isWrap) && hasChildren) {
                emitArrangeCall(varName, node);
                blank();
            }

            // ── ScrollView: arrange inner container ──
            if (isScrollView && hasChildren) {
                var svDir = node.scrollDirection || 'vertical';
                var svGap = node.gap || 0;
                var svOpts = [];
                if (svGap) svOpts.push('gap: ' + svGap);
                var svMethod = (svDir === 'horizontal') ? 'UIBuilder.arrangeAsRow' : 'UIBuilder.arrangeAsColumn';
                ln(svMethod + '(' + varName + '.getInnerContainer(), { ' + svOpts.join(', ') + ' });');
                blank();
            }

            return varName;
        }

        // ── Leaf node creation (sprite, button, label, etc.) ──

        function emitLeafNode(varName, type, name, node, parentVar, w, h, anchor) {
            if (type === 'sprite' || type === 'imageView') {
                var sprRes = getResRef(name);
                ln('var ' + varName + ' = ' + (sprRes ? 'UIBuilder.sprite(' + sprRes + ')' : 'new cc.Sprite()') + ';');
                if (w > 0 && h > 0) ln('UIBuilder.setLayoutSize(' + varName + ', ' + w + ', ' + h + ');');

            } else if (type === 'button') {
                var btnRes = getResRef(name);
                ln('var ' + varName + ' = ' + (btnRes ? 'UIBuilder.button(' + btnRes + ')' : 'new ccui.Button()') + ';');
                if (node.title) ln(varName + '.setTitleText("' + node.title.replace(/"/g, '\\"') + '");');
                if (node.titleFontSize) ln(varName + '.setTitleFontSize(' + node.titleFontSize + ');');
                if (w > 0 && h > 0) ln('UIBuilder.setLayoutSize(' + varName + ', ' + w + ', ' + h + ');');
                buttonNodes.push(name);

            } else if (type === 'label' || type === 'text') {
                var text = (node.text || 'Text').replace(/"/g, '\\"');
                var fontSize = node.fontSize || node.titleFontSize || 20;
                ln('var ' + varName + ' = new cc.LabelTTF("' + text + '", "' + (node.fontName || 'Arial') + '", ' + fontSize + ');');
                if (node.color) ln(varName + '.setColor(cc.color(' + (node.color.r||0) + ', ' + (node.color.g||0) + ', ' + (node.color.b||0) + '));');

            } else if (type === 'scale9') {
                var s9Res = getResRef(name);
                ln('var ' + varName + ' = new ccui.Scale9Sprite(' + (s9Res || '') + ');');
                if (node.capInsets) {
                    var ci = node.capInsets;
                    ln(varName + '.setCapInsets(cc.rect(' + (ci.left||0) + ', ' + (ci.top||0) + ', ' + (ci.right||0) + ', ' + (ci.bottom||0) + '));');
                }
                if (w > 0 && h > 0) ln('UIBuilder.setLayoutSize(' + varName + ', ' + w + ', ' + h + ');');

            } else if (type === 'progressBar') {
                var pbRes = getResRef(name);
                ln('var ' + varName + ' = new cc.ProgressTimer(' + (pbRes ? 'new cc.Sprite(' + pbRes + ')' : 'new cc.Sprite()') + ');');
                ln(varName + '.setType(cc.ProgressTimer.TYPE_BAR);');
                var pbDir = node.progressDirection || 'horizontal';
                if (pbDir === 'vertical') {
                    ln(varName + '.setMidpoint(cc.p(0, 0));');
                    ln(varName + '.setBarChangeRate(cc.p(0, 1));');
                } else {
                    ln(varName + '.setMidpoint(cc.p(0, 0.5));');
                    ln(varName + '.setBarChangeRate(cc.p(1, 0));');
                }
                var pbVal = node.progressValue !== undefined ? node.progressValue : 100;
                ln(varName + '.setPercentage(' + pbVal + ');');
                if (w > 0 && h > 0) ln('UIBuilder.setLayoutSize(' + varName + ', ' + w + ', ' + h + ');');

            } else {
                // Unknown type — generic node
                ln('var ' + varName + ' = new cc.Node();');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
            }

            ln(varName + '.setName("' + name + '");');
            if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
            if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
            if (hasPinEdges(node)) emitPinEdges(varName, node);
        }

        // ══════════════════════════════════════════════════════════
        //  GENERATE OUTPUT
        // ══════════════════════════════════════════════════════════

        if (wrapInLayer) {
            ln('/**');
            ln(' * ' + layerName + ' — Auto-generated adaptive layout');
            ln(' *');
            ln(' * Uses UIBuilder.arrangeAsRow/Column + pinEdges for responsive layout.');
            ln(' * No runtime LayoutEngine required.');
            ln(' */');
            blank();
            ln('var ' + layerName + ' = cc.Layer.extend({');
            blank();
            indent = tab;
            ln('ctor: function () {');
            indent = tab + tab;
            ln('this._super();');
            ln('this._buildUI();');
            ln('return true;');
            indent = tab;
            ln('},');
            blank();
            ln('_buildUI: function () {');
            indent = tab + tab;
            ln('var self = this;');
            blank();
        }

        if (srcTree) {
            exportNode(srcTree, null);

            if (wrapInLayer) {
                if (includeComments) ln('// Store node references');
                ln('this._nodes = {');
                indent = tab + tab + tab;
                for (var nr = 0; nr < allNodeVars.length; nr++) {
                    ln(allNodeVars[nr] + ': ' + allNodeVars[nr] + (nr < allNodeVars.length - 1 ? ',' : ''));
                }
                indent = tab + tab;
                ln('};');
            }
        }

        if (wrapInLayer && buttonNodes.length > 0) {
            blank();
            if (includeComments) ln('// Button callbacks');
            for (var b = 0; b < buttonNodes.length; b++) {
                var bn = buttonNodes[b];
                var bv = sanitizeName(bn);
                ln(bv + '.addClickEventListener(function () {');
                indent = tab + tab + tab;
                ln('self._on' + sanitizeName(bn).charAt(0).toUpperCase() + sanitizeName(bn).slice(1) + '();');
                indent = tab + tab;
                ln('});');
            }
        }

        if (wrapInLayer) {
            indent = tab;
            ln('},');

            if (buttonNodes.length > 0) {
                blank();
                if (includeComments) ln('// ── Callbacks ──');
                for (var cb = 0; cb < buttonNodes.length; cb++) {
                    var cbN = buttonNodes[cb];
                    var mN = '_on' + sanitizeName(cbN).charAt(0).toUpperCase() + sanitizeName(cbN).slice(1);
                    var last = (cb === buttonNodes.length - 1);
                    ln(mN + ': function () {');
                    indent = tab + tab;
                    ln('cc.log("' + cbN + ' clicked");');
                    indent = tab;
                    ln('}' + (last ? '' : ','));
                    if (!last) blank();
                }
            }

            indent = '';
            ln('});');
            blank();

            ln('var ' + layerName.replace('Layer', 'Scene') + ' = cc.Scene.extend({');
            indent = tab;
            ln('onEnter: function () {');
            indent = tab + tab;
            ln('this._super();');
            ln('var layer = new ' + layerName + '();');
            ln('layer.setName("' + layerName + '");');
            ln('this.addChild(layer);');
            indent = tab;
            ln('}');
            indent = '';
            ln('});');
        }

        return lines.join('\n');
    };

})(typeof window !== 'undefined' ? window : this);
