/**
 * LayoutEngine (ES5)
 * 
 * A pure JavaScript, platform-agnostic layout engine.
 * Computes absolute geometric bounds and relative coordinates for UI nodes.
 * Designed for full compatibility with Cocos2d-js and HTML DOM Renderers.
 *
 * Supports: Absolute, Linear (row/column with flex), Grid, Wrap, ScrollView layouts.
 * Visual: rotation, opacity, visible, zOrder, clipping, scale9, progressBar.
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
        
        // Deep clone to prevent mutating original data
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

            // Upgrade legacy syntaxes to Unified Layout constraints
            if (!node.layoutType) {
                if (node.type === 'row') {
                    node.layoutType = 'Linear';
                    node.flexDirection = 'row';
                } else if (node.type === 'column') {
                    node.layoutType = 'Linear';
                    node.flexDirection = 'column';
                } else if (node.type === 'grid') {
                    node.layoutType = 'Grid';
                } else {
                    node.layoutType = 'Absolute'; // Default
                }
            }
            
            // Convert old pinEdges to native fields
            if (node.pinEdges) {
                var p = node.pinEdges;
                if (p.left !== undefined) node.left = p.left;
                if (p.right !== undefined) node.right = p.right;
                if (p.top !== undefined) node.top = p.top;
                if (p.bottom !== undefined) node.bottom = p.bottom;
                if (p.horizontalCenter !== undefined) node.horizontalCenter = p.horizontalCenter;
                if (p.verticalCenter !== undefined) node.verticalCenter = p.verticalCenter;
            }

            // Map legacy w/h properties
            if (node.width === undefined && node.w !== undefined) node.width = node.w;
            if (node.height === undefined && node.h !== undefined) node.height = node.h;

            // Normalize visual properties with defaults
            if (node.visible === undefined) node.visible = true;
            if (node.opacity === undefined) node.opacity = 255;
            if (node.rotation === undefined) node.rotation = 0;
            if (node.zOrder === undefined) node.zOrder = 0;

            // Normalize clipping flag
            if (node.clipping === undefined) node.clipping = false;

            // Normalize scale9 capInsets: { left, right, top, bottom }
            // (metadata only — renderer decides how to apply)
            // e.g. node.capInsets = { left: 10, right: 10, top: 10, bottom: 10 }

            // Normalize progressBar props
            // e.g. node.progressValue, node.progressMin, node.progressMax, node.progressDirection

            // Normalize animation definitions
            self._normalizeAnimations(node);

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
     * Executes Measure & Layout passes.
     */
    /**
     * computeLayout(screenWidth, screenHeight, safeAreaInsets)
     * safeAreaInsets: {top, bottom, left, right} (Optional)
     */
    LayoutEngine.prototype.computeLayout = function(screenWidth, screenHeight, safeAreaInsets) {
        if (!this._root) return;

        this._screenWidth = screenWidth || 0;
        this._screenHeight = screenHeight || 0;
        this._safeAreaInsets = safeAreaInsets || { top: 0, bottom: 0, left: 0, right: 0 };

        // 1. Setup root bounds
        this._root.width = this._screenWidth;
        this._root.height = this._screenHeight;
        this._root._absX = 0;
        this._root._absY = 0;
        this._root.anchor = [0, 0]; // Screen coordinates start from [0, 0] for root
        this._root._x = 0;         // With anchor (0,0), position = bottom-left corner
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

        // Apply Safe Area Insets if requested by the node
        if (node.useSafeArea && this._safeAreaInsets) {
            padTop += this._safeAreaInsets.top || 0;
            padBottom += this._safeAreaInsets.bottom || 0;
            padLeft += this._safeAreaInsets.left || 0;
            padRight += this._safeAreaInsets.right || 0;
        }

        return { top: padTop, bottom: padBottom, left: padLeft, right: padRight };
    };

    /**
     * Returns padding WITHOUT safe area insets applied.
     * Used when a child has ignoreSafeArea=true to bypass parent's safe area.
     */
    LayoutEngine.prototype._getPaddingWithoutSafeArea = function(node) {
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
        // Intentionally NOT applying safe area insets
        return { top: padTop, bottom: padBottom, left: padLeft, right: padRight };
    };

    LayoutEngine.prototype._getMargin = function(node) {
        var m = node.margin || {};
        var marAll = (typeof node.margin === 'number') ? node.margin : 0;
        return {
            top: m.top || marAll,
            bottom: m.bottom || marAll,
            left: m.left || marAll,
            right: m.right || marAll
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
        
        if (w === undefined && node.percentWidth !== undefined && parentW !== undefined) {
            w = parentW * node.percentWidth;
        }
        if (h === undefined && node.percentHeight !== undefined && parentH !== undefined) {
            h = parentH * node.percentHeight;
        }
        // Legacy pinEdges support: [top, bottom, left, right] boolean/pixel map
        if (node.pinEdges && Array.isArray(node.pinEdges) && node.pinEdges.length === 4) {
            if (node.pinEdges[0] !== false && node.top === undefined) node.top = (typeof node.pinEdges[0] === 'number') ? node.pinEdges[0] : 0;
            if (node.pinEdges[1] !== false && node.bottom === undefined) node.bottom = (typeof node.pinEdges[1] === 'number') ? node.pinEdges[1] : 0;
            if (node.pinEdges[2] !== false && node.left === undefined) node.left = (typeof node.pinEdges[2] === 'number') ? node.pinEdges[2] : 0;
            if (node.pinEdges[3] !== false && node.right === undefined) node.right = (typeof node.pinEdges[3] === 'number') ? node.pinEdges[3] : 0;
        }

        // Default constraints for specific UI components
        // ONLY default if we don't have dual pinning (which means we should stretch elastically)
        var isDualPinnedX = node.left !== undefined && node.right !== undefined;
        var isDualPinnedY = node.top !== undefined && node.bottom !== undefined;

        if (w === undefined && !isDualPinnedX) {
            if (node.type === 'sprite' || node.type === 'button' || node.type === 'imageView' || node.type === 'scale9' || node.type === 'progressBar') {
                w = 100;
            } else if (node.type === 'label' || node.type === 'text') {
                var str = node.text || node.title || "Text";
                var fs = node.fontSize || node.titleFontSize || 20;
                w = str.length * fs * 0.6;
            }
        }
        
        if (h === undefined && !isDualPinnedY) {
            if (node.type === 'sprite' || node.type === 'button' || node.type === 'imageView' || node.type === 'scale9' || node.type === 'progressBar') {
                h = 100;
            } else if (node.type === 'label' || node.type === 'text') {
                var fs2 = node.fontSize || node.titleFontSize || 20;
                h = fs2 * 1.2;
            }
        }

        node._width = w || 0;
        node._height = h || 0;

        // Apply pre-limits
        this._applySizeLimits(node);

        var childrenCount = node.children ? node.children.length : 0;

        // 1. Recursive Measure (Bottom-Up) — skip invisible children
        for (var i = 0; i < childrenCount; i++) {
            this._measureNode(node.children[i], node._width, node._height);
        }

        // 2. Wrap-up logic: determine organic component size if dimensions aren't explicitly provided
        var pad = this._getPadding(node);

        if (node.layoutType === 'Linear') {
            var isRow = node.flexDirection === 'row';
            var gap = node.gap || 0;
            var totalW = pad.left + pad.right;
            var totalH = pad.top + pad.bottom;
            var maxW = 0, maxH = 0;
            var visibleCount = 0;

            for (var i = 0; i < childrenCount; i++) {
                var c = node.children[i];
                if (c.visible === false) continue; // Skip invisible children
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

            // Auto-derive cell bounds from children if not specified
            if (cw === 0 || ch === 0) {
                for (var i = 0; i < visChildCount; i++) {
                   var c = visibleChildren[i];
                   if (cw === 0) cw = Math.max(cw, c._width);
                   if (ch === 0) ch = Math.max(ch, c._height);
                }
            }

            var sx = node.spacingX || 0;
            var sy = node.spacingY || 0;

            var gridTotalW = pad.left + pad.right + (cols * cw) + Math.max(0, cols - 1) * sx;
            var gridTotalH = pad.top + pad.bottom + (rows * ch) + Math.max(0, rows - 1) * sy;

            if (node.width === undefined && node.percentWidth === undefined) node._width = gridTotalW;
            if (node.height === undefined && node.percentHeight === undefined) node._height = gridTotalH;

        } else if (node.layoutType === 'Wrap') {
            var wrapMaxW = (w !== undefined && w !== 0) ? w : parentW; // Limit container bounds
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
            // ScrollView: measure total content size from children
            var scrollDir = node.scrollDirection || 'vertical'; // 'vertical', 'horizontal', 'both'
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
                } else { // 'both' — stack vertically but track horizontal overflow
                    contentH += cth + (i > 0 ? sGap : 0);
                    sMaxW = Math.max(sMaxW, ctw);
                }
            }

            if (scrollDir === 'vertical') contentW = Math.max(contentW, sMaxW + pad.left + pad.right);
            else if (scrollDir === 'horizontal') contentH = Math.max(contentH, sMaxH + pad.top + pad.bottom);
            else {
                contentW = Math.max(contentW, sMaxW + pad.left + pad.right);
            }

            // Store content size for scrollable area (renderer uses this)
            node._contentWidth = contentW;
            node._contentHeight = contentH;

            // The viewport size stays as defined (or defaults to parent)
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
        
        if (node.aspectRatio !== undefined && node.aspectRatio > 0) {
            if (node.width !== undefined && node.height === undefined) {
                node._height = node._width / node.aspectRatio;
            } else if (node.height !== undefined && node.width === undefined) {
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

                // Determine effective padding for this child
                // If child has ignoreSafeArea, use padding without safe area insets
                var cPad = pad;
                if (c.ignoreSafeArea && node.useSafeArea && this._safeAreaInsets) {
                    cPad = this._getPaddingWithoutSafeArea(node);
                }

                // percentPosition support — position the child's anchor point at the percentage
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
            
            // For reverse layouts, we reverse the children order so that
            // "First" appears rightmost (row-reverse) or bottommost (column-reverse)
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

            // --- Calculate total content for justify ---
            var totalContentMain = 0;
            for (var i = 0; i < orderedCount; i++) {
                var c = ordered[i];
                var m = this._getMargin(c);
                totalContentMain += isRow ? (c._width + m.left + m.right) : (c._height + m.top + m.bottom);
                if (i < orderedCount - 1) totalContentMain += gap;
            }

            var extraSpace = availableMain - totalContentMain;

            // For reverse directions, swap 'start' and 'end' justify behavior
            var effectiveJustify = justifyContent;
            if (isReverse) {
                if (justifyContent === 'start') effectiveJustify = 'end';
                else if (justifyContent === 'end') effectiveJustify = 'start';
            }

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
                    
                    if (alignItems === 'start') cBottom = H - pad.top - m.top - c._height;
                    else if (alignItems === 'end') cBottom = pad.bottom + m.bottom;
                    else if (alignItems === 'center') cBottom = pad.bottom + m.bottom + crossSpace / 2;
                    else if (alignItems === 'stretch') {
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

                    if (alignItems === 'start') cLeft = pad.left + m.left;
                    else if (alignItems === 'end') cLeft = W - pad.right - m.right - c._width;
                    else if (alignItems === 'center') cLeft = pad.left + m.left + crossSpace / 2;
                    else if (alignItems === 'stretch') {
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
            if (cw === 0) cw = (W - pad.left - pad.right) / cols;
            // Fix: auto-compute cellHeight when 0
            if (ch === 0 && visCount > 0) {
                for (var i = 0; i < visCount; i++) {
                    ch = Math.max(ch, visChildren[i]._height);
                }
            }

            var sx = node.spacingX || 0;
            var sy = node.spacingY || 0;

            for (var i = 0; i < visCount; i++) {
                var c = visChildren[i];
                var col = i % cols;
                var row = Math.floor(i / cols);
                
                var cLeft = pad.left + col * (cw + sx);
                var cBottom = H - pad.top - row * (ch + sy) - ch; // Top down
                
                // Align center within cell
                cLeft += (cw - c._width) / 2;
                cBottom += (ch - c._height) / 2;
                
                this._finalizeChildPos(node, c, cLeft, cBottom);
            }
        }
        else if (node.layoutType === 'Wrap') {
            var wGap = node.gap || 0;
            var cursorX = pad.left;
            var cursorY = H - pad.top; // Top down
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
            // ScrollView lays out children like a Linear column/row within a virtual content area
            var scrollDir = node.scrollDirection || 'vertical';
            var svGap = node.gap || 0;
            var svIsRow = scrollDir === 'horizontal';

            // Initialize scroll offsets (renderer can update these for scroll interaction)
            if (node._scrollOffsetX === undefined) node._scrollOffsetX = 0;
            if (node._scrollOffsetY === undefined) node._scrollOffsetY = 0;

            // Layout items within viewport space, starting from top.
            // Cursor starts at viewport top (H - pad.top) for vertical,
            // or pad.left for horizontal.
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

        // Recurse Layout Pass to children (including invisible — they may have own children to skip)
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
            child._x = child.x || 0; // Legacy local coordinate explicitly provided
            cLeft = child._x - child._width * anchor[0];
        } else {
            child._x = cLeft + child._width * anchor[0];
        }

        if (cBottom === undefined) {
            child._y = child.y || 0; // Legacy local coordinate explicitly provided
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
                    // Contain: take the smaller scale factor
                    uniformScale = Math.min(scaleX, scaleY);
                } else if (child.scaleMode === 'FILL') {
                    // Cover: take the larger scale factor
                    uniformScale = Math.max(scaleX, scaleY);
                }
                child._scaleX = uniformScale;
                child._scaleY = uniformScale;
            }
        }

        var pAbsX = parent._absX !== undefined ? parent._absX : 0;
        var pAbsY = parent._absY !== undefined ? parent._absY : 0;
        child._absX = pAbsX + cLeft;
        child._absY = pAbsY + cBottom;
    };

    // =========================================================================
    // Phase 4: Animation Data Model
    // =========================================================================

    /**
     * Built-in easing functions.
     * Each returns a function(t) => t' where t is [0,1].
     */
    LayoutEngine.Easings = {
        linear:     function(t) { return t; },
        easeIn:     function(t) { return t * t; },
        easeOut:    function(t) { return t * (2 - t); },
        easeInOut:  function(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
        easeInCubic:  function(t) { return t * t * t; },
        easeOutCubic: function(t) { var t1 = t - 1; return t1 * t1 * t1 + 1; },
        easeInOutCubic: function(t) { return t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
        bounce: function(t) {
            if (t < 1/2.75) return 7.5625 * t * t;
            if (t < 2/2.75) { t -= 1.5/2.75; return 7.5625 * t * t + 0.75; }
            if (t < 2.5/2.75) { t -= 2.25/2.75; return 7.5625 * t * t + 0.9375; }
            t -= 2.625/2.75; return 7.5625 * t * t + 0.984375;
        },
        elastic: function(t) {
            if (t === 0 || t === 1) return t;
            return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        },
        backIn: function(t) { var s = 1.70158; return t * t * ((s + 1) * t - s); },
        backOut: function(t) { var s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; }
    };

    /**
     * Normalize animation definitions on a node during buildTree.
     * Accepts: animations array, or shorthand intro/loop/exit objects.
     *
     * Schema per animation keyframe:
     * {
     *   prop: "x"|"y"|"scaleX"|"scaleY"|"rotation"|"opacity"|"width"|"height",
     *   from: <number|undefined>,   // undefined = use current value
     *   to: <number>,
     *   duration: <ms>,
     *   delay: <ms, default 0>,
     *   easing: <string, default "linear">,
     *   sequence: "intro"|"loop"|"exit" (default "intro"),
     *   repeat: <number, default 1>, // -1 = infinite
     *   yoyo: <boolean, default false>
     * }
     */
    LayoutEngine.prototype._normalizeAnimations = function(node) {
        var anims = [];

        // Shorthand: node.intro / node.loop / node.exit as single or array
        var sequences = ['intro', 'loop', 'exit'];
        for (var s = 0; s < sequences.length; s++) {
            var seqName = sequences[s];
            var seqData = node[seqName];
            if (seqData) {
                var arr = Array.isArray(seqData) ? seqData : [seqData];
                for (var j = 0; j < arr.length; j++) {
                    var a = arr[j];
                    a.sequence = seqName;
                    if (seqName === 'loop' && a.repeat === undefined) a.repeat = -1;
                    anims.push(a);
                }
            }
        }

        // Direct animations array
        if (node.animations) {
            var direct = Array.isArray(node.animations) ? node.animations : [node.animations];
            for (var k = 0; k < direct.length; k++) {
                anims.push(direct[k]);
            }
        }

        // Normalize defaults
        for (var i = 0; i < anims.length; i++) {
            var a = anims[i];
            if (!a.prop) a.prop = 'opacity';
            if (a.duration === undefined) a.duration = 300;
            if (a.delay === undefined) a.delay = 0;
            if (a.easing === undefined) a.easing = 'linear';
            if (a.sequence === undefined) a.sequence = 'intro';
            if (a.repeat === undefined) a.repeat = 1;
            if (a.yoyo === undefined) a.yoyo = false;
        }

        node._animations = anims;
    };

    /**
     * Get animation data for a specific node.
     * @param {string} id
     * @returns {Object} { intro: [], loop: [], exit: [], all: [] }
     */
    LayoutEngine.prototype.getAnimations = function(id) {
        var node = this._nodeMap[id] || this._nodeMap[String(id)];
        if (!node || !node._animations) return { intro: [], loop: [], exit: [], all: [] };

        var result = { intro: [], loop: [], exit: [], all: node._animations };
        for (var i = 0; i < node._animations.length; i++) {
            var a = node._animations[i];
            if (result[a.sequence]) result[a.sequence].push(a);
        }
        return result;
    };

    /**
     * Get a flattened timeline of all animations across all nodes.
     * Sorted by (delay + sequence offset) ascending.
     * @returns {Array} [{ nodeId, nodeName, ...animData, absoluteStart }]
     */
    LayoutEngine.prototype.getTimelineEvents = function() {
        var events = [];
        var SEQUENCE_OFFSETS = { intro: 0, loop: 100000, exit: 200000 };
        var self = this;

        function collectNode(node) {
            if (!node._animations) return;
            for (var i = 0; i < node._animations.length; i++) {
                var a = node._animations[i];
                var offset = SEQUENCE_OFFSETS[a.sequence] || 0;
                events.push({
                    nodeId: node._id,
                    nodeName: node.name || node._id,
                    prop: a.prop,
                    from: a.from,
                    to: a.to,
                    duration: a.duration,
                    delay: a.delay,
                    easing: a.easing,
                    sequence: a.sequence,
                    repeat: a.repeat,
                    yoyo: a.yoyo,
                    absoluteStart: offset + (a.delay || 0)
                });
            }
            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    collectNode(node.children[c]);
                }
            }
        }

        if (this._root) collectNode(this._root);
        events.sort(function(a, b) { return a.absoluteStart - b.absoluteStart; });
        return events;
    };

    /**
     * Interpolate a value at time t using an easing function.
     * @param {number} from
     * @param {number} to
     * @param {number} t - Progress [0,1]
     * @param {string} easingName
     * @returns {number}
     */
    LayoutEngine.prototype.interpolate = function(from, to, t, easingName) {
        var easeFn = LayoutEngine.Easings[easingName] || LayoutEngine.Easings.linear;
        var progress = easeFn(Math.max(0, Math.min(1, t)));
        return from + (to - from) * progress;
    };

    // =========================================================================
    // Phase 5: Tooling — Validation, Export, Live-edit
    // =========================================================================

    /**
     * Validate the current layout tree for common issues.
     * @returns {Array} Array of { level: "error"|"warning"|"info", nodeId, message }
     */
    LayoutEngine.prototype.validate = function() {
        var issues = [];
        if (!this._root) {
            issues.push({ level: 'error', nodeId: null, message: 'No root node found.' });
            return issues;
        }

        var screenW = this._screenWidth || 0;
        var screenH = this._screenHeight || 0;
        var self = this;

        function check(node) {
            var id = node._id || node.name || '?';

            // 1. Missing size
            if (node._width === 0 && node._height === 0 && node.visible !== false) {
                issues.push({ level: 'warning', nodeId: id, message: 'Node has zero size (0×0).' });
            }

            // 2. Out of screen bounds
            if (node._absX !== undefined && node._absY !== undefined) {
                var right = node._absX + (node._width || 0);
                var top = node._absY + (node._height || 0);
                if (node._absX < 0 || node._absY < 0 || right > screenW || top > screenH) {
                    if (node !== self._root) {
                        issues.push({ level: 'info', nodeId: id, 
                            message: 'Node extends beyond screen bounds (' +
                                Math.round(node._absX) + ',' + Math.round(node._absY) + 
                                ' → ' + Math.round(right) + ',' + Math.round(top) + ').'
                        });
                    }
                }
            }

            // 3. Negative dimensions
            if ((node._width || 0) < 0 || (node._height || 0) < 0) {
                issues.push({ level: 'error', nodeId: id, message: 'Node has negative dimensions.' });
            }

            // 4. Conflicting constraints
            if (node.left !== undefined && node.right !== undefined && node.horizontalCenter !== undefined) {
                issues.push({ level: 'warning', nodeId: id, 
                    message: 'Conflicting constraints: left + right + horizontalCenter all set.' });
            }
            if (node.top !== undefined && node.bottom !== undefined && node.verticalCenter !== undefined) {
                issues.push({ level: 'warning', nodeId: id, 
                    message: 'Conflicting constraints: top + bottom + verticalCenter all set.' });
            }

            // 5. Missing name
            if (!node.name && !node.id) {
                issues.push({ level: 'info', nodeId: id, message: 'Node has no name or id (auto-generated: ' + id + ').' });
            }

            // 6. Opacity out of range
            if (node.opacity !== undefined && (node.opacity < 0 || node.opacity > 255)) {
                issues.push({ level: 'warning', nodeId: id, 
                    message: 'Opacity (' + node.opacity + ') outside valid range [0, 255].' });
            }

            // 7. Invalid layoutType
            var validLayouts = ['Absolute', 'Linear', 'Grid', 'Wrap', 'ScrollView'];
            if (node.layoutType && validLayouts.indexOf(node.layoutType) === -1) {
                issues.push({ level: 'error', nodeId: id, 
                    message: 'Unknown layoutType: "' + node.layoutType + '".' });
            }

            // 8. Flex without Linear parent
            if (node.flex && node.flex > 0) {
                var parentLayout = node._parent ? node._parent.layoutType : '';
                if (parentLayout !== 'Linear') {
                    issues.push({ level: 'warning', nodeId: id, 
                        message: 'flex weight set but parent layout is "' + parentLayout + '" (not Linear).' });
                }
            }

            // 9. Animation validation
            if (node._animations) {
                var validProps = ['x', 'y', 'scaleX', 'scaleY', 'scale', 'rotation', 'opacity', 'width', 'height'];
                for (var i = 0; i < node._animations.length; i++) {
                    var anim = node._animations[i];
                    if (validProps.indexOf(anim.prop) === -1) {
                        issues.push({ level: 'warning', nodeId: id, 
                            message: 'Animation targets unknown prop "' + anim.prop + '".' });
                    }
                    if (!LayoutEngine.Easings[anim.easing]) {
                        issues.push({ level: 'warning', nodeId: id, 
                            message: 'Unknown easing "' + anim.easing + '". Available: ' + 
                                Object.keys(LayoutEngine.Easings).join(', ') + '.' });
                    }
                    if (anim.duration <= 0) {
                        issues.push({ level: 'warning', nodeId: id, 
                            message: 'Animation duration is ' + anim.duration + 'ms (should be > 0).' });
                    }
                }
            }

            // 10. ScrollView without clipping
            if (node.layoutType === 'ScrollView' && !node.clipping) {
                issues.push({ level: 'info', nodeId: id, 
                    message: 'ScrollView without clipping — content may overflow visually.' });
            }

            // Recurse
            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    check(node.children[c]);
                }
            }
        }

        check(this._root);
        return issues;
    };

    /**
     * Export ADAPTIVE UIBuilder code that uses UIBuilder.arrangeAsRow/Column
     * for responsive layout without runtime LayoutEngine.
     *
     * Produces code using:
     *  - cc.Node / ccui.Layout (ABSOLUTE only) for containers
     *  - UIBuilder.pinEdges() for constraints
     *  - UIBuilder.arrangeAsRow/Column() for row/column layout (gap, alignItems, justifyContent)
     *  - UIBuilder.createBackground() for scaleMode: "FILL"
     *  - setBackGroundImage() for hybrid container+visual nodes
     */
    LayoutEngine.prototype.exportAdaptiveCode = function(options) {
        options = options || {};
        var resVar = options.resourceMapVar || '';
        var layerName = options.layerName || 'GeneratedLayer';
        var tab = options.indent || '    ';
        var includeAnims = options.includeAnimations !== false;
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

        function _getEasingCode(n) {
            if (!n || n === 'linear') return null;
            var m = {
                'easeIn':'cc.easeIn(2)','easeOut':'cc.easeOut(2)','easeInOut':'cc.easeInOut(2)',
                'easeInCubic':'cc.easeIn(3)','easeOutCubic':'cc.easeOut(3)','easeInOutCubic':'cc.easeInOut(3)',
                'bounce':'cc.easeBounceOut()','elastic':'cc.easeElasticOut()',
                'backIn':'cc.easeBackIn()','backOut':'cc.easeBackOut()'
            };
            return m[n] || null;
        }

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
        //  EXPORT NODE
        // ══════════════════════════════════════════════════════════

        function exportNode(node, parentVar) {
            var name = node.name || node._id || 'node';
            var varName = sanitizeName(name);
            var type = node.type || '';
            var w = Math.round(node.w || node.width || node._width || 0);
            var h = Math.round(node.h || node.height || node._height || 0);
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
                // Container node — use cc.Node (all positioning via arrangeAsRow/Column + pinEdges)
                var containerRes = getResRef(name);
                var hasVisualBg = isVisualType && (type === 'sprite' || type === 'imageView' || type === 'scale9');
                if (hasVisualBg && containerRes) {
                    // Hybrid: container with visual background → ccui.Layout + setBackGroundImage
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
            } else if (type === 'sprite' || type === 'imageView') {
                var sprRes = getResRef(name);
                ln('var ' + varName + ' = ' + (sprRes ? 'UIBuilder.sprite(' + sprRes + ')' : 'new cc.Sprite()') + ';');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else if (type === 'button') {
                var btnRes = getResRef(name);
                ln('var ' + varName + ' = ' + (btnRes ? 'UIBuilder.button(' + btnRes + ')' : 'new ccui.Button()') + ';');
                ln(varName + '.setPressedActionEnabled(true);');
                if (node.title) ln(varName + '.setTitleText("' + node.title.replace(/"/g, '\\"') + '");');
                if (node.titleFontSize) ln(varName + '.setTitleFontSize(' + node.titleFontSize + ');');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                refNodes.push(name);
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else if (type === 'label' || type === 'text') {
                var text = (node.text || 'Text').replace(/"/g, '\\"');
                var fontSize = node.fontSize || node.titleFontSize || 20;
                ln('var ' + varName + ' = new cc.LabelTTF("' + text + '", "' + (node.fontName || 'Arial') + '", ' + fontSize + ');');
                if (node.color) ln(varName + '.setColor(cc.color(' + (node.color.r||0) + ', ' + (node.color.g||0) + ', ' + (node.color.b||0) + '));');
                ln(varName + '.setName("' + name + '");');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else if (type === 'scale9') {
                var s9Res = getResRef(name);
                ln('var ' + varName + ' = new ccui.Scale9Sprite(' + (s9Res || '') + ');');
                if (node.capInsets) {
                    var ci = node.capInsets;
                    ln(varName + '.setCapInsets(cc.rect(' + (ci.left||0) + ', ' + (ci.top||0) + ', ' + (ci.right||0) + ', ' + (ci.bottom||0) + '));');
                }
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
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
                ln(varName + '.setName("' + name + '");');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else {
                ln('var ' + varName + ' = new cc.Node();');
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                if (anchor) ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            }

            // ── Visual properties ──
            if (node.rotation) ln(varName + '.setRotation(' + node.rotation + ');');
            if (node.opacity !== undefined && node.opacity !== 255) ln(varName + '.setOpacity(' + node.opacity + ');');
            if (node.visible === false) ln(varName + '.setVisible(false);');
            if (node.zOrder) ln(varName + '.setLocalZOrder(' + node.zOrder + ');');
            // Manual scale transforms
            if (node.scaleX !== undefined && node.scaleX !== 1) ln(varName + '.setScaleX(' + node.scaleX + ');');
            if (node.scaleY !== undefined && node.scaleY !== 1) ln(varName + '.setScaleY(' + node.scaleY + ');');
            // Percent-based sizing
            if (node.percentWidth !== undefined) ln(varName + '.setContentSize(' + varName + '.getParent().getContentSize().width * ' + node.percentWidth + ', ' + varName + '.getContentSize().height);');
            if (node.percentHeight !== undefined) ln(varName + '.setContentSize(' + varName + '.getContentSize().width, ' + varName + '.getParent().getContentSize().height * ' + node.percentHeight + ');');
            // Aspect ratio — auto-compute missing dimension
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
            // Size constraints — clamp to min/max bounds
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
            // Margin (stored as _margin for arrange helpers to read)
            if (node.margin !== undefined) {
                if (typeof node.margin === 'number') {
                    ln(varName + '._margin = ' + node.margin + ';');
                } else {
                    ln(varName + '._margin = { top: ' + (node.margin.top||0) + ', right: ' + (node.margin.right||0) + ', bottom: ' + (node.margin.bottom||0) + ', left: ' + (node.margin.left||0) + ' };');
                }
            }
            // Flex weight (stored as _flex for arrange helpers to read)
            if (node.flex !== undefined && node.flex > 0) ln(varName + '._flex = ' + node.flex + ';');
            // Safe area comment
            if (node.useSafeArea) ln('// useSafeArea: true (safe area insets applied)');
            if (node.ignoreSafeArea) ln('// ignoreSafeArea: true (ignores parent safe area padding)');

            // ── Animations ──
            if (includeAnims && node._animations && node._animations.length > 0) {
                blank();
                if (includeComments) ln('// Animations for ' + name);
                for (var a = 0; a < node._animations.length; a++) {
                    var anim = node._animations[a];
                    var actVar = varName + '_anim' + a;
                    var dur = (anim.duration / 1000).toFixed(2);
                    var toVal = anim.to;
                    var isLoop = (anim.sequence === 'loop');
                    var isPosP = (anim.prop === 'x' || anim.prop === 'y');

                    if (anim.from !== undefined && !(isLoop && isPosP)) {
                        switch (anim.prop) {
                            case 'opacity': ln(varName + '.setOpacity(' + anim.from + ');'); break;
                            case 'rotation': ln(varName + '.setRotation(' + anim.from + ');'); break;
                            case 'scale': ln(varName + '.setScale(' + anim.from + ');'); break;
                            case 'scaleX': ln(varName + '.setScaleX(' + anim.from + ');'); break;
                            case 'scaleY': ln(varName + '.setScaleY(' + anim.from + ');'); break;
                        }
                    }

                    if (anim.prop === 'opacity') ln('var ' + actVar + ' = cc.fadeTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'rotation') ln('var ' + actVar + ' = cc.rotateTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'scale') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'scaleX') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + toVal + ', ' + varName + '.getScaleY());');
                    else if (anim.prop === 'scaleY') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + varName + '.getScaleX(), ' + toVal + ');');
                    else if (anim.prop === 'x') ln('var ' + actVar + ' = cc.moveTo(' + dur + ', ' + toVal + ', ' + varName + '.getPositionY());');
                    else if (anim.prop === 'y') ln('var ' + actVar + ' = cc.moveTo(' + dur + ', ' + varName + '.getPositionX(), ' + toVal + ');');
                    else if (anim.prop === 'width' || anim.prop === 'height') {
                        // Use a callFunc + repeat approach for size animation
                        ln('// Note: width/height animation requires custom tween');
                        continue;
                    }
                    else continue;

                    var ec = _getEasingCode(anim.easing);
                    if (ec) ln(actVar + ' = ' + actVar + '.easing(' + ec + ');');

                    if (anim.yoyo && anim.from !== undefined) {
                        var rv = actVar + '_rev';
                        if (anim.prop === 'opacity') ln('var ' + rv + ' = cc.fadeTo(' + dur + ', ' + anim.from + ');');
                        else if (anim.prop === 'rotation') ln('var ' + rv + ' = cc.rotateTo(' + dur + ', ' + anim.from + ');');
                        else if (anim.prop === 'scale') ln('var ' + rv + ' = cc.scaleTo(' + dur + ', ' + anim.from + ');');
                        else if (anim.prop === 'scaleX') ln('var ' + rv + ' = cc.scaleTo(' + dur + ', ' + anim.from + ', ' + varName + '.getScaleY());');
                        else if (anim.prop === 'scaleY') ln('var ' + rv + ' = cc.scaleTo(' + dur + ', ' + varName + '.getScaleX(), ' + anim.from + ');');
                        else if (anim.prop === 'x') ln('var ' + rv + ' = cc.moveTo(' + dur + ', ' + anim.from + ', ' + varName + '.getPositionY());');
                        else if (anim.prop === 'y') ln('var ' + rv + ' = cc.moveTo(' + dur + ', ' + varName + '.getPositionX(), ' + anim.from + ');');
                        if (ec) ln(rv + ' = ' + rv + '.easing(' + ec + ');');
                        ln(actVar + ' = cc.sequence(' + actVar + ', ' + rv + ');');
                    }

                    if (anim.delay > 0) ln(actVar + ' = cc.sequence(cc.delayTime(' + (anim.delay/1000).toFixed(2) + '), ' + actVar + ');');
                    if (anim.repeat === -1) ln(actVar + ' = cc.repeatForever(' + actVar + ');');
                    else if (anim.repeat > 1) ln(actVar + ' = cc.repeat(' + actVar + ', ' + anim.repeat + ');');
                    ln(varName + '.runAction(' + actVar + ');');
                }
            }

            blank();

            // ── Recurse children ──
            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    exportNode(node.children[c], varName);
                }
            }

            // ── After all children: emit arrange call for layout containers ──
            if ((isLinear || isGrid || isWrap) && hasChildren) {
                emitArrangeCall(varName, node);
                blank();
            }

            // ── ScrollView: set inner container size ──
            if (isScrollView && hasChildren) {
                var scrollDir = node.scrollDirection || 'vertical';
                var scrollGap = node.gap || 0;
                if (scrollDir === 'vertical' || scrollDir === 'both') {
                    // Arrange children as column inside scrollview, then set inner size
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

    /**
     * Live-edit: set a property on a node and re-compute layout.
     */
    LayoutEngine.prototype.setNodeProp = function(id, prop, value) {
        var node = this._nodeMap[id] || this._nodeMap[String(id)];
        if (!node) return { ok: false, error: 'Node not found: ' + id };
        node[prop] = value;
        var layoutProps = ['width', 'height', 'w', 'h', 'left', 'right', 'top', 'bottom',
            'percentWidth', 'percentHeight', 'flex', 'gap', 'padding', 'margin',
            'horizontalCenter', 'verticalCenter', 'percentX', 'percentY',
            'visible', 'layoutType', 'flexDirection', 'alignItems', 'justifyContent'];
        var needsRelayout = layoutProps.indexOf(prop) !== -1;
        if (needsRelayout && this._screenWidth) {
            if (prop === 'w') node.width = value;
            if (prop === 'h') node.height = value;
            this.computeLayout(this._screenWidth, this._screenHeight, this._safeAreaInsets);
        } else {
            if (prop === 'rotation') node._rotation = value;
            if (prop === 'opacity') node._opacity = value;
            if (prop === 'visible') node._visible = value;
            if (prop === 'zOrder') node._zOrder = value;
            if (prop === 'scaleX') node._scaleX = value;
            if (prop === 'scaleY') node._scaleY = value;
        }
        return { ok: true, bounds: this.getNodeBounds(id) };
    };

    LayoutEngine.prototype.diffLayout = function(prevBoundsMap) {
        var diffs = [];
        var compareProps = ['x', 'y', 'width', 'height', 'absX', 'absY', 'scaleX', 'scaleY', 'rotation', 'opacity', 'visible'];
        for (var id in this._nodeMap) {
            var current = this.getNodeBounds(id);
            var prev = prevBoundsMap[id];
            if (!current || !prev) continue;
            for (var p = 0; p < compareProps.length; p++) {
                var prop = compareProps[p];
                if (prev[prop] !== current[prop]) diffs.push({ nodeId: id, prop: prop, oldValue: prev[prop], newValue: current[prop] });
            }
        }
        return diffs;
    };

    LayoutEngine.prototype.snapshotBounds = function() {
        var snapshot = {};
        for (var id in this._nodeMap) snapshot[id] = this.getNodeBounds(id);
        return snapshot;
    };

    global.LayoutEngine = LayoutEngine;
    if (typeof module !== 'undefined' && module.exports) module.exports = LayoutEngine;

})(typeof window !== 'undefined' ? window : this);
