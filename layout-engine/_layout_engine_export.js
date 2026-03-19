/**
 * LayoutEngine — Adaptive Code Export (ES5)
 *
 * Exports computed layout tree as UIBuilder adaptive code.
 * Uses: pinEdges, arrangeAsRow/Column/Grid/Wrap, createBackground.
 * No runtime LayoutEngine required in generated code.
 */
(function(global) {
    var LayoutEngine = global.LayoutEngine ||
        (typeof require !== 'undefined' && require('./_layout_engine')) || null;
    if (!LayoutEngine) return;

    /**
     * Export ADAPTIVE UIBuilder code that uses UIBuilder.arrangeAsRow/Column
     * for responsive layout without runtime LayoutEngine.
     *
     * Produces code using:
     *  - cc.Node / ccui.Layout (ABSOLUTE only) for containers
     *  - UIBuilder.pinEdges() for constraints
     *  - UIBuilder.arrangeAsRow/Column() for row/column layout
     *  - UIBuilder.createBackground() for scaleMode
     *  - setBackGroundImage() for hybrid container+visual nodes
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
        var refNodes = [];
        var nodeRefs = [];

        function ln(s) { lines.push(indent + (s || '')); }
        function blank() { lines.push(''); }
        function sanitizeName(name) { return (name || 'node').replace(/[^a-zA-Z0-9_$]/g, '_'); }
        function getResRef(name) { return resVar ? resVar + '.' + sanitizeName(name) : null; }

        // Check if node has pinEdges constraints
        function hasPinEdges(node) {
            return node.left !== undefined || node.right !== undefined ||
                   node.top !== undefined || node.bottom !== undefined ||
                   node.horizontalCenter !== undefined || node.verticalCenter !== undefined ||
                   node.percentX !== undefined || node.percentY !== undefined;
        }

        // Emit pinEdges call
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

        // Build padding string for arrange opts
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

        // Emit arrangeAsRow/Column/Grid/Wrap call
        function emitArrangeCall(varName, node) {
            var layoutType = node.layoutType;

            if (layoutType === 'Grid') {
                var gopts = [];
                if (node.columns) gopts.push('columns: ' + node.columns);
                if (node.spacingX) gopts.push('spacingX: ' + node.spacingX);
                if (node.spacingY) gopts.push('spacingY: ' + node.spacingY);
                if (node.cellWidth) gopts.push('cellWidth: ' + node.cellWidth);
                if (node.cellHeight) gopts.push('cellHeight: ' + node.cellHeight);
                var gpadStr = getPaddingStr(node);
                if (gpadStr) gopts.push('padding: ' + gpadStr);
                ln('UIBuilder.arrangeAsGrid(' + varName + ', { ' + gopts.join(', ') + ' });');
                return;
            }

            if (layoutType === 'Wrap') {
                var wopts = [];
                if (node.gap) wopts.push('gap: ' + node.gap);
                var wpadStr = getPaddingStr(node);
                if (wpadStr) wopts.push('padding: ' + wpadStr);
                ln('UIBuilder.arrangeAsWrap(' + varName + ', { ' + wopts.join(', ') + ' });');
                return;
            }

            if (layoutType !== 'Linear') return;
            var isRow = (node.flexDirection === 'row' || node.flexDirection === 'row-reverse');
            var isReverse = (node.flexDirection === 'row-reverse' || node.flexDirection === 'column-reverse');
            var method = isRow ? 'UIBuilder.arrangeAsRow' : 'UIBuilder.arrangeAsColumn';
            var opts = [];
            if (node.gap) opts.push('gap: ' + node.gap);
            if (node.alignItems) opts.push('alignItems: "' + node.alignItems + '"');
            if (node.justifyContent) opts.push('justifyContent: "' + node.justifyContent + '"');
            if (isReverse) opts.push('reverse: true');
            var padStr = getPaddingStr(node);
            if (padStr) opts.push('padding: ' + padStr);
            ln(method + '(' + varName + ', { ' + opts.join(', ') + ' });');
        }

        // ══════════════════════════════════════════════════════════
        //  CREATE NODE HELPER
        // ══════════════════════════════════════════════════════════

        function emitCreateNode(varName, type, node, parentVar, w, h) {
            var name = node.name || node._id || 'node';
            var anchor = node.anchor || null;

            if (type === 'sprite' || type === 'imageView') {
                var sprRes = getResRef(name);
                ln('var ' + varName + ' = ' + (sprRes ? 'UIBuilder.sprite(' + sprRes + ')' : 'new cc.Sprite()') + ';');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
            } else if (type === 'button') {
                var btnRes = getResRef(name);
                ln('var ' + varName + ' = ' + (btnRes ? 'UIBuilder.button(' + btnRes + ')' : 'new ccui.Button()') + ';');
                ln(varName + '.setPressedActionEnabled(true);');
                if (node.title) ln(varName + '.setTitleText("' + node.title.replace(/"/g, '\\"') + '");');
                if (node.titleFontSize) ln(varName + '.setTitleFontSize(' + node.titleFontSize + ');');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                refNodes.push(name);
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
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
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
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
            } else {
                // Generic node
                ln('var ' + varName + ' = new cc.Node();');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
            }

            ln(varName + '.setName("' + name + '");');
            if (anchor && type !== 'node') ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
            if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
            if (hasPinEdges(node)) emitPinEdges(varName, node);
        }

        // ══════════════════════════════════════════════════════════
        //  EXPORT NODE
        // ══════════════════════════════════════════════════════════

        function exportNode(node, parentVar) {
            var name = node.name || node._id || 'node';
            var varName = sanitizeName(name);
            var type = node.type || '';
            var w = Math.round(node.width || node._width || 0);
            var h = Math.round(node.height || node._height || 0);
            var anchor = node.anchor || null;
            var isRoot = !parentVar;

            var isVisualType = (type === 'sprite' || type === 'button' || type === 'imageView'
                || type === 'scale9' || type === 'label' || type === 'text' || type === 'progressBar');
            var hasChildren = node.children && node.children.length > 0;
            var isContainer = !!node.layoutType && (!isVisualType || hasChildren);
            var isLinear = node.layoutType === 'Linear';
            var isGrid = node.layoutType === 'Grid';
            var isWrap = node.layoutType === 'Wrap';
            var isScrollView = node.layoutType === 'ScrollView';

            nodeRefs.push(varName);

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

            if ((type === 'sprite' || type === 'imageView') && (node.scaleMode === 'FILL' || node.scaleMode === 'FIT' || node.scaleMode === 'STRETCH')) {
                // Background fill/fit sprite
                var bgRes = getResRef(name);
                if (bgRes) {
                    ln('var ' + varName + ' = UIBuilder.createBackground(' + parentVar + ', ' + bgRes + ', "' + node.scaleMode + '");');
                    ln(varName + '.setName("' + name + '");');
                } else {
                    ln('var ' + varName + ' = new cc.Sprite();');
                    ln(varName + '.setName("' + name + '");');
                    if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                }
            } else if (isScrollView && !isRoot) {
                // ScrollView container
                ln('var ' + varName + ' = new ccui.ScrollView();');
                var scrollDir = node.scrollDirection || 'vertical';
                if (scrollDir === 'horizontal') {
                    ln(varName + '.setDirection(ccui.ScrollView.DIR_HORIZONTAL);');
                } else if (scrollDir === 'both') {
                    ln(varName + '.setDirection(ccui.ScrollView.DIR_BOTH);');
                } else {
                    ln(varName + '.setDirection(ccui.ScrollView.DIR_VERTICAL);');
                }
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                if (node.clipping !== false) ln(varName + '.setClippingEnabled(true);');
                ln(varName + '.setBounceEnabled(true);');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else if (isContainer && !isRoot) {
                // Container node
                var containerRes = getResRef(name);
                var hasVisualBg = isVisualType && (type === 'sprite' || type === 'imageView' || type === 'scale9');
                if (hasVisualBg && containerRes) {
                    ln('var ' + varName + ' = new ccui.Layout();');
                    ln(varName + '.setBackGroundImage(' + containerRes + ');');
                    if (type === 'scale9') {
                        ln(varName + '.setBackGroundImageScale9Enabled(true);');
                    }
                } else {
                    ln('var ' + varName + ' = new cc.Node();');
                }
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                if (node.clipping) ln(varName + '.setClippingEnabled(true);');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else if (isRoot) {
                ln('var ' + varName + ' = UIBuilder.createFullScreenLayout(this);');
                ln(varName + '.setName("' + name + '");');
            } else {
                // Leaf visual node
                emitCreateNode(varName, type, node, parentVar, w, h);
                // Skip duplicate setName/addChild/pinEdges since emitCreateNode handles them
                // Go directly to visual properties
                goto_visual = true;
            }

            // ── Visual properties ──
            if (node.rotation) ln(varName + '.setRotation(' + node.rotation + ');');
            if (node.opacity !== undefined && node.opacity !== 255) ln(varName + '.setOpacity(' + node.opacity + ');');
            if (node.visible === false) ln(varName + '.setVisible(false);');
            if (node.zOrder) ln(varName + '.setLocalZOrder(' + node.zOrder + ');');
            if (node.scaleX !== undefined && node.scaleX !== 1) ln(varName + '.setScaleX(' + node.scaleX + ');');
            if (node.scaleY !== undefined && node.scaleY !== 1) ln(varName + '.setScaleY(' + node.scaleY + ');');
            // Percent-based sizing
            if (node.percentWidth !== undefined) ln(varName + '.setContentSize(' + varName + '.getParent().getContentSize().width * ' + node.percentWidth + ', ' + varName + '.getContentSize().height);');
            if (node.percentHeight !== undefined) ln(varName + '.setContentSize(' + varName + '.getContentSize().width, ' + varName + '.getParent().getContentSize().height * ' + node.percentHeight + ');');
            // Aspect ratio
            if (node.aspectRatio !== undefined) {
                ln('(function() {');
                ln('    var _cs = ' + varName + '.getContentSize();');
                ln('    if (_cs.width > 0 && (_cs.height === 0 || ' + (!h ? 'true' : 'false') + ')) {');
                ln('        ' + varName + '.setContentSize(_cs.width, _cs.width / ' + node.aspectRatio + ');');
                ln('    } else if (_cs.height > 0) {');
                ln('        ' + varName + '.setContentSize(_cs.height * ' + node.aspectRatio + ', _cs.height);');
                ln('    }');
                ln('})();');
            }
            // Size constraints
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
            // Margin
            if (node.margin !== undefined) {
                if (typeof node.margin === 'number') {
                    ln(varName + '._margin = ' + node.margin + ';');
                } else {
                    ln(varName + '._margin = { top: ' + (node.margin.top||0) + ', right: ' + (node.margin.right||0) + ', bottom: ' + (node.margin.bottom||0) + ', left: ' + (node.margin.left||0) + ' };');
                }
            }
            // Flex weight
            if (node.flex !== undefined && node.flex > 0) ln(varName + '._flex = ' + node.flex + ';');
            // Safe area comments
            if (node.useSafeArea) ln('// useSafeArea: true');
            if (node.ignoreSafeArea) ln('// ignoreSafeArea: true');

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

            // ── ScrollView: set inner container size ──
            if (isScrollView && hasChildren) {
                var scrollDir = node.scrollDirection || 'vertical';
                var scrollGap = node.gap || 0;
                if (scrollDir === 'vertical' || scrollDir === 'both') {
                    var svOpts = [];
                    if (scrollGap) svOpts.push('gap: ' + scrollGap);
                    ln('UIBuilder.arrangeAsColumn(' + varName + '.getInnerContainer(), { ' + svOpts.join(', ') + ' });');
                } else {
                    var svOpts2 = [];
                    if (scrollGap) svOpts2.push('gap: ' + scrollGap);
                    ln('UIBuilder.arrangeAsRow(' + varName + '.getInnerContainer(), { ' + svOpts2.join(', ') + ' });');
                }
                blank();
            }

            return varName;
        }

        // ══════════════════════════════════════════════════════════
        //  GENERATE OUTPUT
        // ══════════════════════════════════════════════════════════

        if (wrapInLayer) {
            ln('/**');
            ln(' * ' + layerName + ' — Auto-generated adaptive layout');
            ln(' * Design: ' + (this._screenWidth || 0) + 'x' + (this._screenHeight || 0));
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
                for (var nr = 0; nr < nodeRefs.length; nr++) {
                    ln(nodeRefs[nr] + ': ' + nodeRefs[nr] + (nr < nodeRefs.length - 1 ? ',' : ''));
                }
                indent = tab + tab;
                ln('};');
            }
        }

        if (wrapInLayer && refNodes.length > 0) {
            blank();
            if (includeComments) ln('// Button callbacks');
            for (var b = 0; b < refNodes.length; b++) {
                var bn = refNodes[b];
                var bv = sanitizeName(bn);
                ln(bv + '.addClickEventListener(function () {');
                indent = tab + tab + tab;
                ln('self._on' + bn.charAt(0).toUpperCase() + bn.slice(1) + '();');
                indent = tab + tab;
                ln('});');
            }
        }

        if (wrapInLayer) {
            indent = tab;
            ln('},');

            if (refNodes.length > 0) {
                blank();
                if (includeComments) ln('// ── Callbacks ──');
                for (var cb = 0; cb < refNodes.length; cb++) {
                    var cbN = refNodes[cb];
                    var mN = '_on' + cbN.charAt(0).toUpperCase() + cbN.slice(1);
                    var last = (cb === refNodes.length - 1);
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
