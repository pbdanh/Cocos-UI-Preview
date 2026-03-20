/**
 * LayoutEngine (ES5)
 *
 * A pure JavaScript, platform-agnostic layout engine.
 * Computes absolute geometric bounds and relative coordinates for UI nodes.
 * Designed for full compatibility with Cocos2d-js and HTML DOM Renderers.
 *
 * Supports: Absolute, Linear (row/column with flex), Grid, Wrap, ScrollView layouts.
 * Visual: rotation, opacity, visible, zOrder, clipping, scale9, progressBar.
 *
 * Extension modules (loaded after this file):
 *  - _layout_engine_export.js  — exportAdaptiveCode()
 *  - _layout_engine_tools.js   — validate(), setNodeProp(), diffLayout(), snapshotBounds()
 */
(function(global) {
    /**
     * @constructor
     */
    function LayoutEngine() {
        this._root = null;
        this._nodeMap = {};
        this._nextId = 1;
    }

    /**
     * Ingests a JSON-based UI tree.
     * @param {Object|Array} uiJsonData
     */
    LayoutEngine.prototype.buildTree = function(uiJsonData) {
        this._nodeMap = {};
        this._nextId = 1;

        // Deep clone to prevent mutating original data.
        // LIMITATION: JSON.parse(JSON.stringify()) drops functions, undefined values,
        // and throws on circular references. This is acceptable because layout JSON
        // data should only contain plain data (no functions or circular refs).
        this._root = JSON.parse(JSON.stringify(uiJsonData));
        if (Array.isArray(this._root)) {
            this._root = this._root[0];
        }

        var self = this;
        function traverse(node, parent) {
            node._id = node.id || node.name || ("node_" + self._nextId++);
            self._nodeMap[node._id] = node;

            // To prevent circular json issues, use non-enumerable property
            Object.defineProperty(node, '_parent', { value: parent, writable: true, configurable: true });

            // Default layoutType to Absolute only if node has children
            if (!node.layoutType && node.children && node.children.length > 0) {
                node.layoutType = 'Absolute';
            }

            // Normalize visual properties with defaults
            if (node.visible === undefined) node.visible = true;
            if (node.opacity === undefined) node.opacity = 255;
            if (node.rotation === undefined) node.rotation = 0;
            if (node.zOrder === undefined) node.zOrder = 0;

            // Normalize clipping flag
            if (node.clipping === undefined) node.clipping = false;

            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    traverse(node.children[i], node);
                }
            }
        }

        if (this._root) {
            traverse(this._root, null);
        }
    };

    /**
     * computeLayout(screenWidth, screenHeight, safeAreaInsets)
     * safeAreaInsets: {top, bottom, left, right} (Optional)
     */
    LayoutEngine.prototype.computeLayout = function(screenWidth, screenHeight) {
        if (!this._root) return;

        this._screenWidth = screenWidth || 0;
        this._screenHeight = screenHeight || 0;

        // 1. Setup root bounds
        this._root.width = this._screenWidth;
        this._root.height = this._screenHeight;
        this._root._absX = 0;
        this._root._absY = 0;
        this._root.anchor = [0, 0];
        this._root._x = 0;
        this._root._y = 0;

        // Pass 1: Measure
        this._measureNode(this._root, screenWidth, screenHeight);

        // Enforce root size to exactly match screen size
        this._root._width = screenWidth;
        this._root._height = screenHeight;

        // Pass 2: Layout
        this._layoutNode(this._root);
    };

    /**
     * @param {string} nodeId
     * @returns {Object} Full resolved bounds + visual props
     */
    LayoutEngine.prototype.getNodeBounds = function(id) {
        var node = this._nodeMap[id] || this._nodeMap[String(id)];
        if (!node) return null;
        return {
            x: node._x,
            y: node._y,
            width: node._width,
            height: node._height,
            scaleX: node._scaleX !== undefined ? node._scaleX : 1,
            scaleY: node._scaleY !== undefined ? node._scaleY : 1,
            absX: node._absX,
            absY: node._absY,
            // Visual properties
            rotation: node.rotation || 0,
            opacity: node.opacity !== undefined ? node.opacity : 255,
            visible: node.visible !== false,
            zOrder: node.zOrder || 0,
            // Widget metadata
            clipping: node.clipping || false,
            capInsets: node.capInsets || null,
            // ProgressBar metadata
            progressValue: node.progressValue,
            progressMin: node.progressMin,
            progressMax: node.progressMax,
            progressDirection: node.progressDirection
        };
    };

    /**
     * Get all nodes sorted by zOrder (for render-order).
     * @returns {Array} Flat array of { id, zOrder, path }
     */
    LayoutEngine.prototype.getRenderOrder = function() {
        var result = [];
        function collect(node, path) {
            var p = path ? (path + '/' + (node._id || node.name)) : (node._id || node.name || 'root');
            result.push({ id: node._id, zOrder: node.zOrder || 0, path: p });
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    collect(node.children[i], p);
                }
            }
        }
        if (this._root) collect(this._root, '');
        result.sort(function(a, b) { return a.zOrder - b.zOrder; });
        return result;
    };

    // --- Internal Helpers ---

    LayoutEngine.prototype._getPadding = function(node) {
        var p = node.padding;
        var padTop = 0, padBottom = 0, padLeft = 0, padRight = 0;
        if (p !== undefined) {
             if (typeof p === 'number') {
                 padTop = padBottom = padLeft = padRight = p;
             } else if (Array.isArray(p)) {
                 if (p.length === 1) padTop = padBottom = padLeft = padRight = p[0];
                 else if (p.length === 2) { padTop = padBottom = p[0]; padLeft = padRight = p[1]; }
                 else if (p.length === 4) { padTop = p[0]; padRight = p[1]; padBottom = p[2]; padLeft = p[3]; }
             }
        } else {
             padTop = node.paddingTop || 0;
             padBottom = node.paddingBottom || 0;
             padLeft = node.paddingLeft || 0;
             padRight = node.paddingRight || 0;
        }

        return { top: padTop, bottom: padBottom, left: padLeft, right: padRight };
    };

    LayoutEngine.prototype._getMargin = function(node) {
        var m = node.margin;
        if (!m) return { top: 0, bottom: 0, left: 0, right: 0 };
        if (typeof m === 'number') return { top: m, bottom: m, left: m, right: m };
        if (Array.isArray(m)) {
            if (m.length === 1) return { top: m[0], bottom: m[0], left: m[0], right: m[0] };
            if (m.length === 2) return { top: m[0], bottom: m[0], left: m[1], right: m[1] };
            if (m.length === 4) return { top: m[0], right: m[1], bottom: m[2], left: m[3] };
        }
        return {
            top: m.top || 0,
            bottom: m.bottom || 0,
            left: m.left || 0,
            right: m.right || 0
        };
    };

    LayoutEngine.prototype._measureNode = function(node, parentW, parentH) {
        // Skip invisible nodes — don't measure or layout their subtree
        if (node.visible === false) {
            node._width = 0;
            node._height = 0;
            return;
        }

        var w = node.width;
        var h = node.height;

        // Preview-only size: fallback when width/height not set.
        // Used for sprite leaf nodes where real size comes from texture at runtime.
        // _previewWidth/_previewHeight are NOT exported to code.
        if (w === undefined && node._previewWidth !== undefined) w = node._previewWidth;
        if (h === undefined && node._previewHeight !== undefined) h = node._previewHeight;

        if (!w && node.percentWidth !== undefined && parentW !== undefined) {
            w = parentW * node.percentWidth;
        }
        if (!h && node.percentHeight !== undefined && parentH !== undefined) {
            h = parentH * node.percentHeight;
        }

        // Default constraints for specific UI components
        var isDualPinnedX = node.left !== undefined && node.right !== undefined;
        var isDualPinnedY = node.top !== undefined && node.bottom !== undefined;

        if (w === undefined && !isDualPinnedX) {
            if (node.type === 'sprite' || node.type === 'button' || node.type === 'imageView' || node.type === 'scale9' || node.type === 'progressBar') {
                // Nodes with `background` are containers, not leaf visuals — skip default 100
                if (!node.background || !node.children || node.children.length === 0) {
                    w = 100;
                }
            } else if (node.type === 'label' || node.type === 'text') {
                var str = node.text || node.title || "Text";
                var fs = node.fontSize || node.titleFontSize || 20;
                w = str.length * fs * 0.6;
            }
            // Absolute container with no explicit size fills parent
            if (w === undefined && node.children && node.children.length > 0 && node.layoutType === 'Absolute') {
                w = parentW;
            }
        }

        if (h === undefined && !isDualPinnedY) {
            if (node.type === 'sprite' || node.type === 'button' || node.type === 'imageView' || node.type === 'scale9' || node.type === 'progressBar') {
                if (!node.background || !node.children || node.children.length === 0) {
                    h = 100;
                }
            } else if (node.type === 'label' || node.type === 'text') {
                var fs2 = node.fontSize || node.titleFontSize || 20;
                h = fs2 * 1.2;
            }
            // Absolute container with no explicit size fills parent
            if (h === undefined && node.children && node.children.length > 0 && node.layoutType === 'Absolute') {
                h = parentH;
            }
        }

        node._width = w || 0;
        node._height = h || 0;

        // Apply pre-limits
        this._applySizeLimits(node);

        var childrenCount = node.children ? node.children.length : 0;

        // D1 fix: Pass content area (minus padding) to children,
        // so percentWidth/percentHeight resolves against available space, not raw parent.
        var pad = this._getPadding(node);
        var contentW = Math.max(0, node._width - pad.left - pad.right);
        var contentH = Math.max(0, node._height - pad.top - pad.bottom);

        // 1. Recursive Measure (Bottom-Up) — skip invisible children
        for (var i = 0; i < childrenCount; i++) {
            this._measureNode(node.children[i], contentW, contentH);
        }

        // 2. Wrap-up logic: determine organic component size if dimensions aren't explicitly provided
        // (pad already computed above before recursive measure)

        if (node.layoutType === 'Linear') {
            var isRow = node.flexDirection === 'row';
            var gap = node.gap || 0;
            var totalW = pad.left + pad.right;
            var totalH = pad.top + pad.bottom;
            var maxW = 0, maxH = 0;
            var visibleCount = 0;

            for (var i = 0; i < childrenCount; i++) {
                var c = node.children[i];
                if (c.visible === false) continue;
                var m = this._getMargin(c);
                var childTotalW = c._width + m.left + m.right;
                var childTotalH = c._height + m.top + m.bottom;

                if (isRow) {
                    totalW += childTotalW + (visibleCount > 0 ? gap : 0);
                    maxH = Math.max(maxH, childTotalH);
                } else {
                    totalH += childTotalH + (visibleCount > 0 ? gap : 0);
                    maxW = Math.max(maxW, childTotalW);
                }
                visibleCount++;
            }

            if (isRow) totalH = Math.max(totalH, maxH + pad.top + pad.bottom);
            else totalW = Math.max(totalW, maxW + pad.left + pad.right);

            if (node.width === undefined && node.percentWidth === undefined) node._width = totalW;
            if (node.height === undefined && node.percentHeight === undefined) node._height = totalH;

        } else if (node.layoutType === 'Grid') {
            var cols = node.columns || 3;
            var visibleChildren = [];
            for (var i = 0; i < childrenCount; i++) {
                if (node.children[i].visible !== false) visibleChildren.push(node.children[i]);
            }
            var visChildCount = visibleChildren.length;
            var rows = node.rows || Math.ceil(visChildCount / cols);
            var cw = node.cellWidth || 0;
            var ch = node.cellHeight || 0;

            if (cw === 0 || ch === 0) {
                for (var i = 0; i < visChildCount; i++) {
                   var c = visibleChildren[i];
                   if (cw === 0) cw = Math.max(cw, c._width);
                   if (ch === 0) ch = Math.max(ch, c._height);
                }
            }

            var sx = node.spacingX || node.gap || 0;
            var sy = node.spacingY || node.gap || 0;

            var gridTotalW = pad.left + pad.right + (cols * cw) + Math.max(0, cols - 1) * sx;
            var gridTotalH = pad.top + pad.bottom + (rows * ch) + Math.max(0, rows - 1) * sy;

            if (node.width === undefined && node.percentWidth === undefined) node._width = gridTotalW;
            if (node.height === undefined && node.percentHeight === undefined) node._height = gridTotalH;

        } else if (node.layoutType === 'Wrap') {
            var wrapMaxW = (w !== undefined && w !== 0) ? w : parentW;
            var wGap = node.gap || 0;
            var curWrapW = pad.left;
            var curWrapH = pad.bottom;
            var maxWrapLineH = 0;
            var maxWrapUsedW = 0;

            for (var i = 0; i < childrenCount; i++) {
                var c = node.children[i];
                if (c.visible === false) continue;
                var m = this._getMargin(c);
                var cW = c._width + m.left + m.right;
                var cH = c._height + m.top + m.bottom;

                if (curWrapW + cW + pad.right > wrapMaxW && curWrapW > pad.left) {
                    curWrapW = pad.left;
                    curWrapH += maxWrapLineH + wGap;
                    maxWrapLineH = 0;
                }
                curWrapW += cW + wGap;
                maxWrapLineH = Math.max(maxWrapLineH, cH);
                maxWrapUsedW = Math.max(maxWrapUsedW, curWrapW - wGap);
            }
            curWrapH += maxWrapLineH + pad.top;

            if (node.width === undefined && node.percentWidth === undefined) node._width = maxWrapUsedW + pad.right;
            if (node.height === undefined && node.percentHeight === undefined) node._height = curWrapH;

        } else if (node.layoutType === 'ScrollView') {
            var scrollDir = node.scrollDirection || 'vertical';
            var sGap = node.gap || 0;
            var contentW = pad.left + pad.right;
            var contentH = pad.top + pad.bottom;
            var sMaxW = 0, sMaxH = 0;

            for (var i = 0; i < childrenCount; i++) {
                var c = node.children[i];
                if (c.visible === false) continue;
                var m = this._getMargin(c);
                var ctw = c._width + m.left + m.right;
                var cth = c._height + m.top + m.bottom;

                if (scrollDir === 'vertical') {
                    contentH += cth + (i > 0 ? sGap : 0);
                    sMaxW = Math.max(sMaxW, ctw);
                } else if (scrollDir === 'horizontal') {
                    contentW += ctw + (i > 0 ? sGap : 0);
                    sMaxH = Math.max(sMaxH, cth);
                } else {
                    contentH += cth + (i > 0 ? sGap : 0);
                    sMaxW = Math.max(sMaxW, ctw);
                }
            }

            if (scrollDir === 'vertical') contentW = Math.max(contentW, sMaxW + pad.left + pad.right);
            else if (scrollDir === 'horizontal') contentH = Math.max(contentH, sMaxH + pad.top + pad.bottom);
            else {
                contentW = Math.max(contentW, sMaxW + pad.left + pad.right);
            }

            node._contentWidth = contentW;
            node._contentHeight = contentH;

            if (node.width === undefined && node.percentWidth === undefined) node._width = parentW;
            if (node.height === undefined && node.percentHeight === undefined) node._height = parentH;
        }

        // Apply final limits
        this._applySizeLimits(node);
    };

    LayoutEngine.prototype._applySizeLimits = function(node) {
        if (node.minWidth !== undefined) node._width = Math.max(node._width, node.minWidth);
        if (node.maxWidth !== undefined) node._width = Math.min(node._width, node.maxWidth);
        if (node.minHeight !== undefined) node._height = Math.max(node._height, node.minHeight);
        if (node.maxHeight !== undefined) node._height = Math.min(node._height, node.maxHeight);

        // P1 fix: Use computed _width/_height instead of raw JSON width/height
        // This allows aspectRatio to work with constraint-stretched dimensions
        if (node.aspectRatio !== undefined && node.aspectRatio > 0) {
            var hasExplicitW = node.width !== undefined || node.percentWidth !== undefined ||
                (node.left !== undefined && node.right !== undefined);
            var hasExplicitH = node.height !== undefined || node.percentHeight !== undefined ||
                (node.top !== undefined && node.bottom !== undefined);

            if (hasExplicitW && !hasExplicitH && node._width > 0) {
                node._height = node._width / node.aspectRatio;
            } else if (hasExplicitH && !hasExplicitW && node._height > 0) {
                node._width = node._height * node.aspectRatio;
            }
        }
    };

    LayoutEngine.prototype._layoutNode = function(node) {
        var W = node._width;
        var H = node._height;
        var pad = this._getPadding(node);

        var children = node.children;
        if (!children || children.length === 0) return;

        // Filter to visible children for layout purposes
        var visChildren = [];
        for (var i = 0; i < children.length; i++) {
            if (children[i].visible !== false) visChildren.push(children[i]);
        }
        var visCount = visChildren.length;

        if (node.layoutType === 'Absolute') {
            for (var i = 0; i < visCount; i++) {
                var c = visChildren[i];
                var cLeft = undefined, cBottom = undefined;
                var cPad = pad;

                // percentPosition support
                var cAnchor = c.anchor || [0.5, 0.5];
                if (c.percentX !== undefined) cLeft = W * c.percentX - c._width * cAnchor[0];
                if (c.percentY !== undefined) cBottom = H * c.percentY - c._height * cAnchor[1];

                if (cLeft === undefined) {
                    if (c.left !== undefined && c.right !== undefined) {
                        var flexW = W - c.left - c.right - cPad.left - cPad.right;
                        c._width = Math.max(0, flexW);
                        cLeft = cPad.left + c.left;
                    } else if (c.left !== undefined) {
                        cLeft = cPad.left + c.left;
                    } else if (c.right !== undefined) {
                        cLeft = W - cPad.right - c.right - c._width;
                    } else if (c.horizontalCenter !== undefined) {
                        cLeft = (W - c._width) / 2 + c.horizontalCenter;
                    }
                }

                if (cBottom === undefined) {
                    if (c.bottom !== undefined && c.top !== undefined) {
                        var flexH = H - c.bottom - c.top - cPad.bottom - cPad.top;
                        c._height = Math.max(0, flexH);
                        cBottom = cPad.bottom + c.bottom;
                    } else if (c.bottom !== undefined) {
                        cBottom = cPad.bottom + c.bottom;
                    } else if (c.top !== undefined) {
                        cBottom = H - cPad.top - c.top - c._height;
                    } else if (c.verticalCenter !== undefined) {
                        cBottom = (H - c._height) / 2 + c.verticalCenter;
                    }
                }

                this._finalizeChildPos(node, c, cLeft, cBottom);
            }
        }
        else if (node.layoutType === 'Linear') {
            var dir = node.flexDirection || 'column';
            var isReverse = dir === 'row-reverse' || dir === 'column-reverse';
            var isRow = dir === 'row' || dir === 'row-reverse';
            var gap = node.gap || 0;
            var alignItems = node.alignItems || 'start';
            var justifyContent = node.justifyContent || 'start';

            var ordered = isReverse ? visChildren.slice().reverse() : visChildren;
            var orderedCount = ordered.length;

            // --- Flex weight pre-pass ---
            var totalFlex = 0;
            var totalFixedMain = 0;
            for (var i = 0; i < orderedCount; i++) {
                var c = ordered[i];
                var m = this._getMargin(c);
                if (c.flex && c.flex > 0) {
                    totalFlex += c.flex;
                } else {
                    totalFixedMain += isRow ? (c._width + m.left + m.right) : (c._height + m.top + m.bottom);
                }
            }
            var totalGaps = Math.max(0, orderedCount - 1) * gap;
            var availableMain = isRow ? (W - pad.left - pad.right) : (H - pad.top - pad.bottom);
            var flexSpace = Math.max(0, availableMain - totalFixedMain - totalGaps);

            // Distribute flex space
            if (totalFlex > 0) {
                for (var i = 0; i < orderedCount; i++) {
                    var c = ordered[i];
                    if (c.flex && c.flex > 0) {
                        var m = this._getMargin(c);
                        var allocated = (c.flex / totalFlex) * flexSpace;
                        if (isRow) {
                            c._width = Math.max(0, allocated - m.left - m.right);
                        } else {
                            c._height = Math.max(0, allocated - m.top - m.bottom);
                        }
                    }
                }
            }

            // --- D6: Flex-shrink — auto-shrink items when overflow ---
            var totalAfterFlex = 0;
            for (var i = 0; i < orderedCount; i++) {
                var c = ordered[i];
                var m = this._getMargin(c);
                totalAfterFlex += isRow ? (c._width + m.left + m.right) : (c._height + m.top + m.bottom);
                if (i < orderedCount - 1) totalAfterFlex += gap;
            }
            var overflow = totalAfterFlex - availableMain;
            if (overflow > 0) {
                // Shrink proportionally based on each item's main-axis size
                var totalItemMain = 0;
                for (var i = 0; i < orderedCount; i++) {
                    var c = ordered[i];
                    if (c.flexShrink !== 0) { // flexShrink: 0 = don't shrink
                        totalItemMain += isRow ? c._width : c._height;
                    }
                }
                if (totalItemMain > 0) {
                    for (var i = 0; i < orderedCount; i++) {
                        var c = ordered[i];
                        if (c.flexShrink !== 0) {
                            var itemMain = isRow ? c._width : c._height;
                            var reduction = overflow * (itemMain / totalItemMain);
                            if (isRow) {
                                c._width = Math.max(0, c._width - reduction);
                            } else {
                                c._height = Math.max(0, c._height - reduction);
                            }
                        }
                    }
                }
            }

            // --- Calculate total content for justify ---
            var totalContentMain = 0;
            for (var i = 0; i < orderedCount; i++) {
                var c = ordered[i];
                var m = this._getMargin(c);
                totalContentMain += isRow ? (c._width + m.left + m.right) : (c._height + m.top + m.bottom);
                if (i < orderedCount - 1) totalContentMain += gap;
            }

            var extraSpace = availableMain - totalContentMain;

            // Reverse: only reverses array order, does NOT swap justify
            var effectiveJustify = justifyContent;

            var cursor = isRow ? pad.left : (H - pad.top);
            var spaceBetweenGap = 0;
            var spaceAroundGap = 0;

            if (effectiveJustify === 'end') {
                cursor += isRow ? extraSpace : -extraSpace;
            } else if (effectiveJustify === 'center') {
                cursor += (isRow ? extraSpace : -extraSpace) / 2;
            } else if (effectiveJustify === 'spaceBetween' && orderedCount > 1) {
                spaceBetweenGap = extraSpace / (orderedCount - 1);
            } else if (effectiveJustify === 'spaceAround' && orderedCount > 0) {
                spaceAroundGap = extraSpace / (orderedCount * 2);
                cursor += isRow ? spaceAroundGap : -spaceAroundGap;
            }

            for (var i = 0; i < orderedCount; i++) {
                var c = ordered[i];
                var m = this._getMargin(c);
                var cLeft = 0, cBottom = 0;

                if (isRow) {
                    cursor += m.left;
                    cLeft = cursor;
                    var crossSpace = H - pad.top - pad.bottom - m.top - m.bottom - c._height;

                    // P3: alignSelf overrides parent alignItems per-child
                    // Cocos convention: start=bottom (Y=0), end=top (Y=H)
                    var childAlign = c.alignSelf || alignItems;
                    if (childAlign === 'start') cBottom = pad.bottom + m.bottom;
                    else if (childAlign === 'end') cBottom = H - pad.top - m.top - c._height;
                    else if (childAlign === 'center') cBottom = pad.bottom + m.bottom + crossSpace / 2;
                    else if (childAlign === 'stretch') {
                        cBottom = pad.bottom + m.bottom;
                        c._height = H - pad.top - pad.bottom - m.top - m.bottom;
                    }

                    this._finalizeChildPos(node, c, cLeft, cBottom);
                    cursor += c._width + m.right + gap;
                    if (effectiveJustify === 'spaceBetween') cursor += spaceBetweenGap;
                    else if (effectiveJustify === 'spaceAround') cursor += spaceAroundGap * 2;
                } else {
                    cursor -= m.top;
                    cBottom = cursor - c._height;
                    var crossSpace = W - pad.left - pad.right - m.left - m.right - c._width;

                    // P3: alignSelf overrides parent alignItems per-child
                    var childAlign = c.alignSelf || alignItems;
                    if (childAlign === 'start') cLeft = pad.left + m.left;
                    else if (childAlign === 'end') cLeft = W - pad.right - m.right - c._width;
                    else if (childAlign === 'center') cLeft = pad.left + m.left + crossSpace / 2;
                    else if (childAlign === 'stretch') {
                        cLeft = pad.left + m.left;
                        c._width = W - pad.left - pad.right - m.left - m.right;
                    }

                    this._finalizeChildPos(node, c, cLeft, cBottom);
                    cursor -= c._height + m.bottom + gap;
                    if (effectiveJustify === 'spaceBetween') cursor -= spaceBetweenGap;
                    else if (effectiveJustify === 'spaceAround') cursor -= spaceAroundGap * 2;
                }
            }
        }
        else if (node.layoutType === 'Grid') {
            var cols = node.columns || 3;
            var cw = node.cellWidth || 0;
            var ch = node.cellHeight || 0;
            if ((cw === 0 || ch === 0) && visCount > 0) {
                for (var i = 0; i < visCount; i++) {
                    if (cw === 0) cw = Math.max(cw, visChildren[i]._width);
                    if (ch === 0) ch = Math.max(ch, visChildren[i]._height);
                }
            }

            var sx = node.spacingX || node.gap || 0;
            var sy = node.spacingY || node.gap || 0;

            for (var i = 0; i < visCount; i++) {
                var c = visChildren[i];
                var col = i % cols;
                var row = Math.floor(i / cols);

                var cLeft = pad.left + col * (cw + sx);
                var cBottom = H - pad.top - row * (ch + sy) - ch;

                cLeft += (cw - c._width) / 2;
                cBottom += (ch - c._height) / 2;

                this._finalizeChildPos(node, c, cLeft, cBottom);
            }
        }
        else if (node.layoutType === 'Wrap') {
            var wGap = node.gap || 0;
            var cursorX = pad.left;
            var cursorY = H - pad.top;
            var maxRowH = 0;
            var maxAW = W - pad.right;

            for (var i = 0; i < visCount; i++) {
                var c = visChildren[i];
                var m = this._getMargin(c);

                if (cursorX + m.left + c._width + m.right > maxAW && cursorX > pad.left) {
                    cursorX = pad.left;
                    cursorY -= maxRowH + wGap;
                    maxRowH = 0;
                }

                var cLeft = cursorX + m.left;
                var cBottom = cursorY - m.top - c._height;

                maxRowH = Math.max(maxRowH, c._height + m.top + m.bottom);
                this._finalizeChildPos(node, c, cLeft, cBottom);

                cursorX += m.left + c._width + m.right + wGap;
            }
        }
        else if (node.layoutType === 'ScrollView') {
            var scrollDir = node.scrollDirection || 'vertical';
            var svGap = node.gap || 0;
            var svIsRow = scrollDir === 'horizontal';

            if (node._scrollOffsetX === undefined) node._scrollOffsetX = 0;
            if (node._scrollOffsetY === undefined) node._scrollOffsetY = 0;

            var svCursor = svIsRow ? pad.left : (H - pad.top);

            for (var i = 0; i < visCount; i++) {
                var c = visChildren[i];
                var m = this._getMargin(c);
                var cLeft = 0, cBottom = 0;

                if (svIsRow) {
                    svCursor += m.left;
                    cLeft = svCursor;
                    cBottom = pad.bottom + m.bottom;
                    this._finalizeChildPos(node, c, cLeft, cBottom);
                    svCursor += c._width + m.right + svGap;
                } else {
                    svCursor -= m.top;
                    cBottom = svCursor - c._height;
                    cLeft = pad.left + m.left;
                    this._finalizeChildPos(node, c, cLeft, cBottom);
                    svCursor -= c._height + m.bottom + svGap;
                }
            }
        }

        // Recurse Layout Pass to children
        for (var i = 0; i < children.length; i++) {
            this._layoutNode(children[i]);
        }
    };

    /**
     * Map Bottom-Left coords from parent to Absolute Bounds and Relative Anchored Local coords.
     */
    LayoutEngine.prototype._finalizeChildPos = function(parent, child, cLeft, cBottom) {
        var anchor = child.anchor || [0.5, 0.5];

        if (cLeft === undefined) {
            child._x = child.x || 0;
            cLeft = child._x - child._width * anchor[0];
        } else {
            child._x = cLeft + child._width * anchor[0];
        }

        if (cBottom === undefined) {
            child._y = child.y || 0;
            cBottom = child._y - child._height * anchor[1];
        } else {
            child._y = cBottom + child._height * anchor[1];
        }

        // Initialize Scale
        child._scaleX = child.scaleX !== undefined ? child.scaleX : 1;
        child._scaleY = child.scaleY !== undefined ? child.scaleY : 1;

        // Propagate visual properties
        child._rotation = child.rotation || 0;
        child._opacity = child.opacity !== undefined ? child.opacity : 255;
        child._visible = child.visible !== false;
        child._zOrder = child.zOrder || 0;
        child._clipping = child.clipping || false;

        // Apply Scale Modes if specified
        if (child.scaleMode && parent) {
            var targetW = parent._width;
            var targetH = parent._height;

            if (child.scaleMode === 'STRETCH') {
                child._scaleX = targetW / (child._width || 1);
                child._scaleY = targetH / (child._height || 1);
            } else if (child.scaleMode === 'FIT' || child.scaleMode === 'FILL') {
                var scaleX = targetW / (child._width || 1);
                var scaleY = targetH / (child._height || 1);
                var uniformScale = 1;

                if (child.scaleMode === 'FIT') {
                    uniformScale = Math.min(scaleX, scaleY);
                } else if (child.scaleMode === 'FILL') {
                    uniformScale = Math.max(scaleX, scaleY);
                }
                child._scaleX = uniformScale;
                child._scaleY = uniformScale;
            }

            // P0 fix: Auto-center sprite in parent when scaleMode is set
            // Only if no explicit positioning constraints were given
            var hasExplicitPosX = child.left !== undefined || child.right !== undefined ||
                child.horizontalCenter !== undefined || child.percentX !== undefined;
            var hasExplicitPosY = child.top !== undefined || child.bottom !== undefined ||
                child.verticalCenter !== undefined || child.percentY !== undefined;

            if (!hasExplicitPosX) {
                cLeft = (targetW - child._width) / 2;
                child._x = cLeft + child._width * anchor[0];
            }
            if (!hasExplicitPosY) {
                cBottom = (targetH - child._height) / 2;
                child._y = cBottom + child._height * anchor[1];
            }
        }

        var pAbsX = parent._absX !== undefined ? parent._absX : 0;
        var pAbsY = parent._absY !== undefined ? parent._absY : 0;
        child._absX = pAbsX + cLeft;
        child._absY = pAbsY + cBottom;
    };

    global.LayoutEngine = LayoutEngine;
    if (typeof module !== 'undefined' && module.exports) module.exports = LayoutEngine;

})(typeof window !== 'undefined' ? window : this);
