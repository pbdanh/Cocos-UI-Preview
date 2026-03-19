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
     * Export the computed layout as Cocos2d-js code.
     * Generates UIBuilder-compatible code using the resolved bounds.
     * @param {Object} options - { varPrefix: "ui", indent: "    ", includeAnimations: true }
     * @returns {string} JavaScript code string
     */
    LayoutEngine.prototype.exportCocosCode = function(options) {
        options = options || {};
        var prefix = options.varPrefix || 'ui';
        var tab = options.indent || '    ';
        var includeAnims = options.includeAnimations !== false;
        var lines = [];
        var self = this;

        lines.push('// Auto-generated by LayoutEngine');
        lines.push('// Design: ' + (this._screenWidth || 0) + 'x' + (this._screenHeight || 0));
        lines.push('');

        function sanitizeName(name) {
            return (name || 'node').replace(/[^a-zA-Z0-9_]/g, '_');
        }

        function exportNode(node, parentVar, depth) {
            var indent = '';
            for (var d = 0; d < depth; d++) indent += tab;

            var varName = prefix + '_' + sanitizeName(node._id || node.name);
            var nodeType = node.type || 'node';
            var w = Math.round(node._width || 0);
            var h = Math.round(node._height || 0);
            var x = Math.round(node._x || 0);
            var y = Math.round(node._y || 0);

            // Create node based on type
            if (nodeType === 'sprite' || nodeType === 'imageView') {
                var file = node.file || node.src || '';
                lines.push(indent + 'var ' + varName + ' = UIBuilder.sprite("' + file + '");');
            } else if (nodeType === 'button') {
                var normalFile = node.normalImage || node.file || '';
                lines.push(indent + 'var ' + varName + ' = UIBuilder.button("' + normalFile + '");');
                if (node.title) {
                    lines.push(indent + varName + '.setTitleText("' + node.title.replace(/"/g, '\\"') + '");');
                }
            } else if (nodeType === 'label' || nodeType === 'text') {
                var text = (node.text || 'Text').replace(/"/g, '\\"');
                var fontSize = node.fontSize || node.titleFontSize || 20;
                lines.push(indent + 'var ' + varName + ' = UIBuilder.label("' + text + '", ' + fontSize + ');');
            } else if (nodeType === 'scale9') {
                var s9file = node.file || '';
                var ci = node.capInsets || { left: 0, top: 0, right: 0, bottom: 0 };
                lines.push(indent + 'var ' + varName + ' = UIBuilder.scale9("' + s9file + 
                    '", cc.rect(' + (ci.left||0) + ', ' + (ci.top||0) + ', ' + 
                    (w - (ci.left||0) - (ci.right||0)) + ', ' + (h - (ci.top||0) - (ci.bottom||0)) + '));');
            } else if (nodeType === 'progressBar') {
                lines.push(indent + 'var ' + varName + ' = UIBuilder.progressBar();');
                if (node.progressValue !== undefined) {
                    lines.push(indent + varName + '.setPercent(' + node.progressValue + ');');
                }
            } else {
                lines.push(indent + 'var ' + varName + ' = new cc.Node();');
            }

            // Size + Position
            lines.push(indent + varName + '.setContentSize(' + w + ', ' + h + ');');
            lines.push(indent + varName + '.setPosition(' + x + ', ' + y + ');');

            // Anchor
            if (node.anchor) {
                lines.push(indent + varName + '.setAnchorPoint(' + node.anchor[0] + ', ' + node.anchor[1] + ');');
            }

            // Visual properties
            if (node.rotation) {
                lines.push(indent + varName + '.setRotation(' + node.rotation + ');');
            }
            if (node.opacity !== undefined && node.opacity !== 255) {
                lines.push(indent + varName + '.setOpacity(' + node.opacity + ');');
            }
            if (node.visible === false) {
                lines.push(indent + varName + '.setVisible(false);');
            }
            if (node.zOrder) {
                lines.push(indent + varName + '.setLocalZOrder(' + node.zOrder + ');');
            }

            // Scale
            var sx = node._scaleX !== undefined ? node._scaleX : 1;
            var sy = node._scaleY !== undefined ? node._scaleY : 1;
            if (sx !== 1 || sy !== 1) {
                lines.push(indent + varName + '.setScaleX(' + sx.toFixed(4) + ');');
                lines.push(indent + varName + '.setScaleY(' + sy.toFixed(4) + ');');
            }

            // Clipping
            if (node.clipping) {
                lines.push(indent + '// ' + varName + ': clipping enabled');
            }

            // Name
            if (node.name) {
                lines.push(indent + varName + '.setName("' + node.name + '");');
            }

            // Add to parent
            if (parentVar) {
                lines.push(indent + parentVar + '.addChild(' + varName + ');');
            }

            // Animations
            if (includeAnims && node._animations && node._animations.length > 0) {
                lines.push(indent + '// Animations for ' + (node.name || node._id));
                for (var a = 0; a < node._animations.length; a++) {
                    var anim = node._animations[a];
                    var actionName = varName + '_anim' + a;
                    var toVal = anim.to;
                    var dur = (anim.duration / 1000).toFixed(2);

                    if (anim.prop === 'opacity') {
                        lines.push(indent + 'var ' + actionName + ' = cc.fadeTo(' + dur + ', ' + toVal + ');');
                    } else if (anim.prop === 'rotation') {
                        lines.push(indent + 'var ' + actionName + ' = cc.rotateTo(' + dur + ', ' + toVal + ');');
                    } else if (anim.prop === 'scaleX' || anim.prop === 'scaleY' || anim.prop === 'scale') {
                        lines.push(indent + 'var ' + actionName + ' = cc.scaleTo(' + dur + ', ' + toVal + ');');
                    } else if (anim.prop === 'x' || anim.prop === 'y') {
                        var moveX = anim.prop === 'x' ? toVal : x;
                        var moveY = anim.prop === 'y' ? toVal : y;
                        lines.push(indent + 'var ' + actionName + ' = cc.moveTo(' + dur + ', ' + moveX + ', ' + moveY + ');');
                    }

                    if (anim.delay > 0) {
                        lines.push(indent + actionName + ' = cc.sequence(cc.delayTime(' + (anim.delay/1000).toFixed(2) + '), ' + actionName + ');');
                    }
                    if (anim.repeat === -1) {
                        lines.push(indent + actionName + ' = cc.repeatForever(' + actionName + ');');
                    } else if (anim.repeat > 1) {
                        lines.push(indent + actionName + ' = cc.repeat(' + actionName + ', ' + anim.repeat + ');');
                    }
                    lines.push(indent + varName + '.runAction(' + actionName + ');');
                }
            }

            lines.push('');

            // Recurse children
            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    exportNode(node.children[c], varName, depth);
                }
            }
        }

        if (this._root) {
            exportNode(this._root, null, 0);
        }

        return lines.join('\n');
    };

    /**
     * Export responsive UIBuilder code from the original JSON tree.
     * Generates code using UIBuilder layout APIs (pinEdges, createRow,
     * createColumn, createFullScreenLayout, spaceBetween, fillParent)
     * so the UI adapts to different screen sizes at runtime.
     *
     * @param {Object} options
     *   resourceMapVar : string   — JS variable name for resource map (e.g. "res_endgame")
     *   layerName      : string   — Layer class name (e.g. "EndGameLayer")
     *   indent         : string   — indentation string (default "    ")
     *   includeAnimations : boolean (default true)
     *   includeComments   : boolean (default true)
     *   wrapInLayer       : boolean — wrap output in Layer.extend (default true)
     * @returns {string} JavaScript code string
     */
LayoutEngine.prototype.exportUIBuilderCode = function(options) {
        options = options || {};
        var resVar = options.resourceMapVar || '';
        var layerName = options.layerName || 'GeneratedLayer';
        var tab = options.indent || '    ';
        var includeAnims = options.includeAnimations !== false;
        var includeComments = options.includeComments !== false;
        var wrapInLayer = options.wrapInLayer !== false;

        var lines = [];
        var indent = '';
        var refNodes = [];
        var nodeRefs = [];

        function ln(s) { lines.push(indent + (s || '')); }
        function blank() { lines.push(''); }
        function sanitizeName(name) { return (name || 'node').replace(/[^a-zA-Z0-9_$]/g, '_'); }
        function getResRef(name) { return resVar ? resVar + '.' + sanitizeName(name) : null; }

        // ── Easing helper ──
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

        // ══════════════════════════════════════════════════════════
        //  EXPORT NODE — uses COMPUTED positions (_x, _y, _width, _height)
        //  These are already in bottom-left (Cocos) coordinate system.
        //  Responsiveness is handled by setDesignResolutionSize().
        // ══════════════════════════════════════════════════════════

        function exportNode(node, parentVar) {
            var name = node.name || node._id || 'node';
            var varName = sanitizeName(name);
            var type = node.type || '';
            var w = Math.round(node._width || 0);
            var h = Math.round(node._height || 0);
            var x = Math.round(node._x || 0);
            var y = Math.round(node._y || 0);
            var anchor = node.anchor || [0.5, 0.5];
            var isRoot = !parentVar;

            nodeRefs.push(varName);

            // ── Comment ──
            if (includeComments && node.name) {
                var lbl = '';
                if (node.layoutType === 'Linear') {
                    lbl = node.flexDirection === 'row' || node.flexDirection === 'row-reverse' ? ' (Row)' : ' (Column)';
                }
                ln('// ── ' + name + lbl + ' ──');
            }

            // ── Create node based on type ──
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
            } else if (type === 'sprite' || type === 'imageView') {
                var sprRes = getResRef(name);
                ln('var ' + varName + ' = ' + (sprRes ? 'UIBuilder.sprite(' + sprRes + ')' : 'new cc.Sprite()') + ';');
            } else if (type === 'button') {
                var btnRes = getResRef(name);
                ln('var ' + varName + ' = ' + (btnRes ? 'UIBuilder.button(' + btnRes + ')' : 'new ccui.Button()') + ';');
                ln(varName + '.setPressedActionEnabled(true);');
                if (node.title) ln(varName + '.setTitleText("' + node.title.replace(/"/g, '\\"') + '");');
                refNodes.push(name);
            } else if (type === 'label' || type === 'text') {
                var text = (node.text || 'Text').replace(/"/g, '\\"');
                var fontSize = node.fontSize || node.titleFontSize || 20;
                ln('var ' + varName + ' = new cc.LabelTTF("' + text + '", "' + (node.fontName || 'Arial') + '", ' + fontSize + ');');
                if (node.color) ln(varName + '.setColor(cc.color(' + (node.color.r||0) + ', ' + (node.color.g||0) + ', ' + (node.color.b||0) + '));');
            } else if (type === 'scale9') {
                var s9Res = getResRef(name);
                ln('var ' + varName + ' = new ccui.Scale9Sprite(' + (s9Res || '') + ');');
            } else if (type === 'progressBar') {
                var pbRes = getResRef(name);
                ln('var ' + varName + ' = ' + (pbRes ? 'UIBuilder.sprite(' + pbRes + ')' : 'new cc.Node()') + ';');
            } else {
                ln('var ' + varName + ' = new cc.Node();');
            }

            // ── Size & Position ──
            // Skip for FILL/FIT backgrounds (createBackground handles this)
            if (!((type === 'sprite' || type === 'imageView') && (node.scaleMode === 'FILL' || node.scaleMode === 'FIT' || node.scaleMode === 'STRETCH'))) {
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                if (isRoot) {
                    ln(varName + '.setPosition(0, 0);');
                } else {
                    ln(varName + '.setPosition(' + x + ', ' + y + ');');
                }

                if (node.name) ln(varName + '.setName("' + name + '");');

                // Anchor — cc.Node defaults to (0,0), cc.Sprite/ccui.Button default to (0.5,0.5)
                // Always emit for plain cc.Node containers to avoid mismatch
                var isVisualType = (type === 'sprite' || type === 'button' || type === 'imageView'
                    || type === 'scale9' || type === 'label' || type === 'text' || type === 'progressBar');
                if (!isVisualType || anchor[0] !== 0.5 || anchor[1] !== 0.5) {
                    ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
                }

                // Scale
                var sx = node._scaleX !== undefined ? node._scaleX : 1;
                var sy = node._scaleY !== undefined ? node._scaleY : 1;
                if (sx !== 1 && sy !== 1 && sx === sy) {
                    ln(varName + '.setScale(' + sx.toFixed(4) + ');');
                } else {
                    if (sx !== 1) ln(varName + '.setScaleX(' + sx.toFixed(4) + ');');
                    if (sy !== 1) ln(varName + '.setScaleY(' + sy.toFixed(4) + ');');
                }

                // Visual properties
                if (node.rotation) ln(varName + '.setRotation(' + node.rotation + ');');
                if (node.opacity !== undefined && node.opacity !== 255) ln(varName + '.setOpacity(' + node.opacity + ');');
                if (node.visible === false) ln(varName + '.setVisible(false);');
                if (node.zOrder) ln(varName + '.setLocalZOrder(' + node.zOrder + ');');

                // Add to parent
                if (parentVar && !((type === 'sprite' || type === 'imageView') && (node.scaleMode === 'FILL' || node.scaleMode === 'FIT' || node.scaleMode === 'STRETCH'))) {
                    ln(parentVar + '.addChild(' + varName + ');');
                }
            }

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

                    // Set initial value
                    if (anim.from !== undefined && !(isLoop && isPosP)) {
                        switch (anim.prop) {
                            case 'opacity': ln(varName + '.setOpacity(' + anim.from + ');'); break;
                            case 'rotation': ln(varName + '.setRotation(' + anim.from + ');'); break;
                            case 'scale': ln(varName + '.setScale(' + anim.from + ');'); break;
                            case 'scaleX': ln(varName + '.setScaleX(' + anim.from + ');'); break;
                            case 'scaleY': ln(varName + '.setScaleY(' + anim.from + ');'); break;
                            case 'x': ln(varName + '.setPositionX(' + anim.from + ');'); break;
                            case 'y': ln(varName + '.setPositionY(' + anim.from + ');'); break;
                        }
                    }

                    // Create action
                    if (anim.prop === 'opacity') ln('var ' + actVar + ' = cc.fadeTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'rotation') ln('var ' + actVar + ' = cc.rotateTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'scale') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'scaleX') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + toVal + ', ' + varName + '.getScaleY());');
                    else if (anim.prop === 'scaleY') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + varName + '.getScaleX(), ' + toVal + ');');
                    else if (anim.prop === 'x') {
                        if (isLoop) ln('var ' + actVar + ' = cc.moveBy(' + dur + ', ' + (toVal - (anim.from||0)) + ', 0);');
                        else ln('var ' + actVar + ' = cc.moveTo(' + dur + ', ' + toVal + ', ' + varName + '.getPositionY());');
                    } else if (anim.prop === 'y') {
                        if (isLoop) ln('var ' + actVar + ' = cc.moveBy(' + dur + ', 0, ' + (toVal - (anim.from||0)) + ');');
                        else ln('var ' + actVar + ' = cc.moveTo(' + dur + ', ' + varName + '.getPositionX(), ' + toVal + ');');
                    } else continue;

                    var ec = _getEasingCode(anim.easing);
                    if (ec) ln(actVar + ' = ' + actVar + '.easing(' + ec + ');');

                    if (anim.yoyo) {
                        if (isLoop && isPosP) {
                            ln(actVar + ' = cc.sequence(' + actVar + ', ' + actVar + '.reverse());');
                        } else if (anim.from !== undefined) {
                            var rv = actVar + '_rev';
                            if (anim.prop === 'opacity') ln('var ' + rv + ' = cc.fadeTo(' + dur + ', ' + anim.from + ');');
                            else if (anim.prop === 'rotation') ln('var ' + rv + ' = cc.rotateTo(' + dur + ', ' + anim.from + ');');
                            else if (anim.prop === 'scale') ln('var ' + rv + ' = cc.scaleTo(' + dur + ', ' + anim.from + ');');
                            else if (anim.prop === 'x') ln('var ' + rv + ' = cc.moveTo(' + dur + ', ' + anim.from + ', ' + varName + '.getPositionY());');
                            else if (anim.prop === 'y') ln('var ' + rv + ' = cc.moveTo(' + dur + ', ' + varName + '.getPositionX(), ' + anim.from + ');');
                            if (ec) ln(rv + ' = ' + rv + '.easing(' + ec + ');');
                            ln(actVar + ' = cc.sequence(' + actVar + ', ' + rv + ');');
                        }
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

            return varName;
        }

        // ══════════════════════════════════════════════════════════
        //  GENERATE OUTPUT
        // ══════════════════════════════════════════════════════════

        if (wrapInLayer) {
            ln('/**');
            ln(' * ' + layerName + ' — Auto-generated from layout JSON');
            ln(' * Design: ' + (this._screenWidth || 0) + 'x' + (this._screenHeight || 0));
            ln(' *');
            ln(' * Uses setDesignResolutionSize() for screen adaptation.');
            ln(' * Positions are pre-computed by LayoutEngine.');
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
        } else {
            if (includeComments) {
                ln('// Auto-generated UIBuilder code');
                ln('// Design: ' + (this._screenWidth || 0) + 'x' + (this._screenHeight || 0));
                blank();
            }
        }

        // Export all nodes
        if (this._root) {
            exportNode(this._root, null);

            // Root is added to this layer
            if (wrapInLayer) {
                var rootVar = sanitizeName(this._root.name || this._root._id || 'root');
                ln('this.addChild(' + rootVar + ');');
                blank();

                // Store node references
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

        // Button callbacks
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

            // Callback stubs
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

            // Scene wrapper
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
                   node.horizontalCenter !== undefined || node.verticalCenter !== undefined;
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
            if (edges.length > 0) {
                ln('UIBuilder.pinEdges(' + varName + ', { ' + edges.join(', ') + ' });');
            }
        }

        // Emit arrangeAsRow / arrangeAsColumn call for Linear containers
        function emitArrangeCall(varName, node) {
            if (node.layoutType !== 'Linear') return;
            var isRow = (node.flexDirection === 'row' || node.flexDirection === 'row-reverse');
            var method = isRow ? 'UIBuilder.arrangeAsRow' : 'UIBuilder.arrangeAsColumn';
            var opts = [];
            if (node.gap) opts.push('gap: ' + node.gap);
            if (node.alignItems) opts.push('alignItems: "' + node.alignItems + '"');
            if (node.justifyContent) opts.push('justifyContent: "' + node.justifyContent + '"');
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

            nodeRefs.push(varName);

            // ── Comment ──
            if (includeComments && node.name) {
                var lbl = '';
                if (isLinear) {
                    lbl = (node.flexDirection === 'row' || node.flexDirection === 'row-reverse') ? ' (Row)' : ' (Column)';
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
                if (w > 0 && h > 0) ln(varName + '.setContentSize(' + w + ', ' + h + ');');
                ln(varName + '.setName("' + name + '");');
                if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
                if (hasPinEdges(node)) emitPinEdges(varName, node);
            } else if (type === 'progressBar') {
                var pbRes = getResRef(name);
                ln('var ' + varName + ' = ' + (pbRes ? 'UIBuilder.sprite(' + pbRes + ')' : 'new cc.Node()') + ';');
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
                    else continue;

                    var ec = _getEasingCode(anim.easing);
                    if (ec) ln(actVar + ' = ' + actVar + '.easing(' + ec + ');');

                    if (anim.yoyo && anim.from !== undefined) {
                        var rv = actVar + '_rev';
                        if (anim.prop === 'opacity') ln('var ' + rv + ' = cc.fadeTo(' + dur + ', ' + anim.from + ');');
                        else if (anim.prop === 'rotation') ln('var ' + rv + ' = cc.rotateTo(' + dur + ', ' + anim.from + ');');
                        else if (anim.prop === 'scale') ln('var ' + rv + ' = cc.scaleTo(' + dur + ', ' + anim.from + ');');
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

            // ── After all children: emit arrange call for Linear containers ──
            if (isLinear && hasChildren) {
                emitArrangeCall(varName, node);
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
     * Export RESPONSIVE UIBuilder code that uses LayoutEngine at runtime.
     * Generated code reads cc.winSize and computes layout dynamically,
     * so the same code works at any screen resolution.
     *
     * @param {Object} options
     *   resourceMapVar    : string   — JS variable for resource map (e.g. "res_preview")
     *   layerName         : string   — Layer class name (e.g. "PreviewLayer")
     *   indent            : string   — indentation (default "    ")
     *   includeAnimations : boolean  (default true)
     *   includeComments   : boolean  (default true)
     * @returns {string} JavaScript code string
     */
    LayoutEngine.prototype.exportResponsiveCode = function(options) {
        options = options || {};
        var resVar = options.resourceMapVar || '';
        var layerName = options.layerName || 'GeneratedLayer';
        var tab = options.indent || '    ';
        var includeAnims = options.includeAnimations !== false;
        var includeComments = options.includeComments !== false;

        var lines = [];
        var indent = '';
        var refNodes = [];
        var nodeNames = [];

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

        // ── Build node: create without position/size ──
        function buildNode(node, parentVar) {
            var name = node.name || node._id || 'node';
            var varName = sanitizeName(name);
            var type = node.type || '';
            var anchor = node.anchor || [0.5, 0.5];

            nodeNames.push(varName);

            if (includeComments && node.name) {
                var lbl = '';
                if (node.layoutType === 'Linear') {
                    lbl = node.flexDirection === 'row' || node.flexDirection === 'row-reverse' ? ' (Row)' : ' (Column)';
                }
                ln('// ── ' + name + lbl + ' ──');
            }

            if ((type === 'sprite' || type === 'imageView') && node.scaleMode === 'FILL') {
                var bgRes = getResRef(name);
                ln('var ' + varName + ' = new cc.Sprite(' + (bgRes || '') + ');');
            } else if (type === 'sprite' || type === 'imageView') {
                var sprRes = getResRef(name);
                ln('var ' + varName + ' = ' + (sprRes ? 'UIBuilder.sprite(' + sprRes + ')' : 'new cc.Sprite()') + ';');
            } else if (type === 'button') {
                var btnRes = getResRef(name);
                ln('var ' + varName + ' = ' + (btnRes ? 'UIBuilder.button(' + btnRes + ')' : 'new ccui.Button()') + ';');
                ln(varName + '.setPressedActionEnabled(true);');
                if (node.title) ln(varName + '.setTitleText("' + node.title.replace(/"/g, '\\"') + '");');
                refNodes.push(name);
            } else if (type === 'label' || type === 'text') {
                var text = (node.text || 'Text').replace(/"/g, '\\"');
                var fontSize = node.fontSize || node.titleFontSize || 20;
                ln('var ' + varName + ' = new cc.LabelTTF("' + text + '", "' + (node.fontName || 'Arial') + '", ' + fontSize + ');');
            } else if (type === 'scale9') {
                var s9Res = getResRef(name);
                ln('var ' + varName + ' = new ccui.Scale9Sprite(' + (s9Res || '') + ');');
            } else if (type === 'progressBar') {
                var pbRes = getResRef(name);
                ln('var ' + varName + ' = ' + (pbRes ? 'UIBuilder.sprite(' + pbRes + ')' : 'new cc.Node()') + ';');
            } else {
                ln('var ' + varName + ' = new cc.Node();');
            }

            if (node.name) ln(varName + '.setName("' + name + '");');

            var isVisualType = (type === 'sprite' || type === 'button' || type === 'imageView'
                || type === 'scale9' || type === 'label' || type === 'text' || type === 'progressBar');
            if (!isVisualType || anchor[0] !== 0.5 || anchor[1] !== 0.5) {
                ln(varName + '.setAnchorPoint(' + anchor[0] + ', ' + anchor[1] + ');');
            }

            if (node.rotation) ln(varName + '.setRotation(' + node.rotation + ');');
            if (node.opacity !== undefined && node.opacity !== 255) ln(varName + '.setOpacity(' + node.opacity + ');');
            if (node.visible === false) ln(varName + '.setVisible(false);');
            if (node.zOrder) ln(varName + '.setLocalZOrder(' + node.zOrder + ');');

            if (parentVar) ln(parentVar + '.addChild(' + varName + ');');
            blank();

            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    buildNode(node.children[c], varName);
                }
            }
        }

        // ── Emit animations using nodes map ──
        function emitAnimations(node) {
            var name = node.name || node._id || 'node';
            var varName = 'nodes.' + sanitizeName(name);
            var anims = node._animations;

            if (anims && anims.length > 0) {
                if (includeComments) ln('// Animations for ' + name);
                for (var a = 0; a < anims.length; a++) {
                    var anim = anims[a];
                    var actVar = sanitizeName(name) + '_anim' + a;
                    var dur = (anim.duration / 1000).toFixed(2);
                    var toVal = anim.to;
                    var isLoop = (anim.sequence === 'loop');
                    var isPosP = (anim.prop === 'x' || anim.prop === 'y');

                    if (anim.from !== undefined && !(isLoop && isPosP)) {
                        switch (anim.prop) {
                            case 'opacity': ln(varName + '.setOpacity(' + anim.from + ');'); break;
                            case 'rotation': ln(varName + '.setRotation(' + anim.from + ');'); break;
                            case 'scale': ln(varName + '.setScale(' + anim.from + ');'); break;
                        }
                    }

                    if (anim.prop === 'opacity') ln('var ' + actVar + ' = cc.fadeTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'rotation') ln('var ' + actVar + ' = cc.rotateTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'scale') ln('var ' + actVar + ' = cc.scaleTo(' + dur + ', ' + toVal + ');');
                    else if (anim.prop === 'y') {
                        if (isLoop) ln('var ' + actVar + ' = cc.moveBy(' + dur + ', 0, ' + (toVal - (anim.from||0)) + ');');
                        else ln('var ' + actVar + ' = cc.moveTo(' + dur + ', ' + varName + '.getPositionX(), ' + toVal + ');');
                    } else if (anim.prop === 'x') {
                        if (isLoop) ln('var ' + actVar + ' = cc.moveBy(' + dur + ', ' + (toVal - (anim.from||0)) + ', 0);');
                        else ln('var ' + actVar + ' = cc.moveTo(' + dur + ', ' + toVal + ', ' + varName + '.getPositionY());');
                    } else continue;

                    var ec = _getEasingCode(anim.easing);
                    if (ec) ln(actVar + ' = ' + actVar + '.easing(' + ec + ');');

                    if (anim.yoyo) {
                        if (isLoop && isPosP) {
                            ln(actVar + ' = cc.sequence(' + actVar + ', ' + actVar + '.reverse());');
                        } else if (anim.from !== undefined) {
                            var rv = actVar + '_rev';
                            if (anim.prop === 'scale') ln('var ' + rv + ' = cc.scaleTo(' + dur + ', ' + anim.from + ');');
                            if (ec) ln(rv + ' = ' + rv + '.easing(' + ec + ');');
                            ln(actVar + ' = cc.sequence(' + actVar + ', ' + rv + ');');
                        }
                    }

                    if (anim.delay > 0) ln(actVar + ' = cc.sequence(cc.delayTime(' + (anim.delay/1000).toFixed(2) + '), ' + actVar + ');');
                    if (anim.repeat === -1) ln(actVar + ' = cc.repeatForever(' + actVar + ');');
                    else if (anim.repeat > 1) ln(actVar + ' = cc.repeat(' + actVar + ', ' + anim.repeat + ');');
                    ln(varName + '.runAction(' + actVar + ');');
                }
                blank();
            }

            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    emitAnimations(node.children[c]);
                }
            }
        }

        // ── Serialize JSON (skip internal _ keys) ──
        function serializeJSON(obj, depth) {
            depth = depth || 0;
            var pad = ''; for (var d = 0; d < depth; d++) pad += tab;
            var pad1 = pad + tab;

            if (obj === null || obj === undefined) return 'null';
            if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
            if (typeof obj === 'string') return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

            if (Array.isArray(obj)) {
                var allPrim = obj.every(function(v) { return v === null || typeof v !== 'object'; });
                if (allPrim && obj.length <= 6) {
                    return '[' + obj.map(function(v) { return serializeJSON(v, 0); }).join(', ') + ']';
                }
                var items = obj.map(function(v) { return pad1 + serializeJSON(v, depth + 1); });
                return '[\n' + items.join(',\n') + '\n' + pad + ']';
            }

            var keys = Object.keys(obj).filter(function(k) { return k[0] !== '_'; });
            if (keys.length === 0) return '{}';

            var allPrimVals = keys.every(function(k) { return obj[k] === null || typeof obj[k] !== 'object'; });
            if (allPrimVals && keys.length <= 4) {
                var pairs = keys.map(function(k) {
                    var qk = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : '"' + k + '"';
                    return qk + ': ' + serializeJSON(obj[k], 0);
                });
                return '{ ' + pairs.join(', ') + ' }';
            }

            var objPairs = keys.map(function(k) {
                var qk = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : '"' + k + '"';
                return pad1 + qk + ': ' + serializeJSON(obj[k], depth + 1);
            });
            return '{\n' + objPairs.join(',\n') + '\n' + pad + '}';
        }

        // ═══════════════════════════════════════════
        //  GENERATE OUTPUT
        // ═══════════════════════════════════════════

        ln('/**');
        ln(' * ' + layerName + ' — Auto-generated RESPONSIVE layout');
        ln(' * Adapts to any screen size via LayoutEngine at runtime.');
        ln(' */');
        blank();
        ln('var ' + layerName + ' = cc.Layer.extend({');
        blank();
        indent = tab;

        // ctor
        ln('ctor: function () {');
        indent = tab + tab;
        ln('this._super();');
        ln('this._buildUI();');
        ln('this._relayout();');
        if (includeAnims) ln('this._startAnimations();');
        ln('return true;');
        indent = tab;
        ln('},');
        blank();

        // _buildUI
        ln('_buildUI: function () {');
        indent = tab + tab;
        ln('var self = this;');
        blank();

        if (this._root) {
            buildNode(this._root, null);
            var rootVar = sanitizeName(this._root.name || this._root._id || 'root');
            ln('this.addChild(' + rootVar + ');');
            blank();
            if (includeComments) ln('// Store node references');
            ln('this._nodes = {');
            indent = tab + tab + tab;
            for (var nr = 0; nr < nodeNames.length; nr++) {
                ln(nodeNames[nr] + ': ' + nodeNames[nr] + (nr < nodeNames.length - 1 ? ',' : ''));
            }
            indent = tab + tab;
            ln('};');
        }

        if (refNodes.length > 0) {
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

        indent = tab;
        ln('},');
        blank();

        // _getLayoutJSON
        ln('_getLayoutJSON: function () {');
        indent = tab + tab;
        ln('return ' + serializeJSON(this._root, 2) + ';');
        indent = tab;
        ln('},');
        blank();

        // _relayout
        ln('_relayout: function () {');
        indent = tab + tab;
        ln('var engine = new LayoutEngine();');
        ln('engine.buildTree(this._getLayoutJSON());');
        ln('engine.computeLayout(cc.winSize.width, cc.winSize.height);');
        blank();
        ln('var nodes = this._nodes;');
        ln('for (var name in nodes) {');
        indent = tab + tab + tab;
        ln('var b = engine.getNodeBounds(name);');
        ln('if (b) {');
        indent = tab + tab + tab + tab;
        ln('nodes[name].setContentSize(b.width, b.height);');
        ln('nodes[name].setPosition(b.x, b.y);');
        ln('if (b.scaleX !== 1 || b.scaleY !== 1) {');
        indent = tab + tab + tab + tab + tab;
        ln('nodes[name].setScaleX(b.scaleX);');
        ln('nodes[name].setScaleY(b.scaleY);');
        indent = tab + tab + tab + tab;
        ln('}');
        indent = tab + tab + tab;
        ln('}');
        indent = tab + tab;
        ln('}');
        indent = tab;
        ln('},');

        // _startAnimations
        if (includeAnims && this._root) {
            blank();
            ln('_startAnimations: function () {');
            indent = tab + tab;
            ln('var nodes = this._nodes;');
            blank();
            emitAnimations(this._root);
            indent = tab;
            ln('},');
        }

        // Callback stubs
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

        // Scene wrapper
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
