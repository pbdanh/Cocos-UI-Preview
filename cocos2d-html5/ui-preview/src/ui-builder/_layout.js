/**
 * UIBuilder — Layouts & Containers
 */
(function (B) {

    /**
     * Create a ccui.Layout container.
     * @param {cc.Node} parent
     * @param {number}  layoutType  ccui.Layout.ABSOLUTE | LINEAR_VERTICAL | LINEAR_HORIZONTAL | RELATIVE
     * @param {number}  w           Width
     * @param {number}  h           Height
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: bgColor (cc.color), bgColorType (NONE/SOLID/GRADIENT),
     *                          bgImage (string), clipping (bool), padding (number)
     * @returns {ccui.Layout}
     */
    B.createLayout = function (parent, layoutType, w, h, x, y, opts) {
        var layout = new ccui.Layout();
        layout.setLayoutType(layoutType);
        layout.setContentSize(w, h);
        layout.setPosition(x, y);
        if (opts && opts.bgColorType !== undefined) {
            layout.setBackGroundColorType(opts.bgColorType);
            if (opts.bgColor) layout.setBackGroundColor(opts.bgColor);
            if (opts.bgColorOpacity !== undefined) layout.setBackGroundColorOpacity(opts.bgColorOpacity);
        }
        if (opts && opts.bgImage) layout.setBackGroundImage(opts.bgImage);
        if (opts && opts.clipping) layout.setClippingEnabled(true);
        B._applyOpts(layout, opts);
        parent.addChild(layout, (opts && opts.zOrder) || 0);
        return layout;
    };

    /**
     * Create a ccui.ScrollView.
     * @param {cc.Node} parent
     * @param {number}  w           Visible width
     * @param {number}  h           Visible height
     * @param {number}  innerW      Inner container width
     * @param {number}  innerH      Inner container height
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: direction (ccui.ScrollView.DIR_VERTICAL / HORIZONTAL / BOTH),
     *                          bounceEnabled, bgColor, bgColorType
     * @returns {ccui.ScrollView}
     */
    B.createScrollView = function (parent, w, h, innerW, innerH, x, y, opts) {
        opts = opts || {};
        var sv = new ccui.ScrollView();
        sv.setContentSize(w, h);
        sv.setInnerContainerSize(cc.size(innerW, innerH));
        sv.setPosition(x, y);
        sv.setDirection(opts.direction || ccui.ScrollView.DIR_VERTICAL);
        if (opts.bounceEnabled !== undefined) sv.setBounceEnabled(opts.bounceEnabled);
        if (opts.bgColorType !== undefined) {
            sv.setBackGroundColorType(opts.bgColorType);
            if (opts.bgColor) sv.setBackGroundColor(opts.bgColor);
        }
        B._applyOpts(sv, opts);
        parent.addChild(sv, opts.zOrder || 0);
        return sv;
    };

    /**
     * Create a ccui.ListView.
     * @param {cc.Node} parent
     * @param {number}  w
     * @param {number}  h
     * @param {number}  x
     * @param {number}  y
     * @param {number}  [direction]  ccui.ScrollView.DIR_VERTICAL (default) | DIR_HORIZONTAL
     * @param {Object}  [opts]  Extra: itemMargin, gravity, bounceEnabled
     * @returns {ccui.ListView}
     */
    B.createListView = function (parent, w, h, x, y, direction, opts) {
        opts = opts || {};
        var lv = new ccui.ListView();
        lv.setContentSize(w, h);
        lv.setPosition(x, y);
        lv.setDirection(direction || ccui.ScrollView.DIR_VERTICAL);
        if (opts.itemMargin !== undefined) lv.setItemsMargin(opts.itemMargin);
        if (opts.gravity !== undefined) lv.setGravity(opts.gravity);
        if (opts.bounceEnabled !== undefined) lv.setBounceEnabled(opts.bounceEnabled);
        B._applyOpts(lv, opts);
        parent.addChild(lv, opts.zOrder || 0);
        return lv;
    };

    /**
     * Create a ccui.PageView.
     * @param {cc.Node} parent
     * @param {number}  w
     * @param {number}  h
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: callback (page turn event)
     * @returns {ccui.PageView}
     */
    B.createPageView = function (parent, w, h, x, y, opts) {
        opts = opts || {};
        var pv = new ccui.PageView();
        pv.setContentSize(w, h);
        pv.setPosition(x, y);
        if (opts.callback) pv.addEventListener(opts.callback);
        B._applyOpts(pv, opts);
        parent.addChild(pv, opts.zOrder || 0);
        return pv;
    };

    /**
     * Create a cc.LayerColor (a simple colored rectangle layer).
     * Useful as background panels, overlays, dimming layers, etc.
     * @param {cc.Node} parent
     * @param {cc.Color} color   e.g. cc.color(0,0,0,128)
     * @param {number}   [w]    Width  (default: full screen)
     * @param {number}   [h]    Height (default: full screen)
     * @param {Object}   [opts]
     * @returns {cc.LayerColor}
     */
    B.createColorLayer = function (parent, color, w, h, opts) {
        var lw = w || cc.winSize.width;
        var lh = h || cc.winSize.height;
        var layer = new cc.LayerColor(color, lw, lh);
        B._applyOpts(layer, opts);
        parent.addChild(layer, (opts && opts.zOrder) || 0);
        return layer;
    };

    // ───────────────────────────────────────────────────────────────
    //  RESPONSIVE LAYOUT HELPERS
    // ───────────────────────────────────────────────────────────────

    /**
     * Create a full-screen ccui.Layout sized to cc.winSize, anchored at (0,0).
     * Use as the root container for any screen.
     *
     * @param {cc.Node} parent
     * @param {Object}  [opts]  Extra: bgColor, bgColorType, bgImage, clipping, name
     * @returns {ccui.Layout}
     */
    B.createFullScreenLayout = function (parent, opts) {
        var size = cc.winSize;
        var layout = new ccui.Layout();
        layout.setContentSize(size.width, size.height);
        layout.setAnchorPoint(0, 0);
        layout.setPosition(0, 0);
        if (opts && opts.bgColorType !== undefined) {
            layout.setBackGroundColorType(opts.bgColorType);
            if (opts.bgColor) layout.setBackGroundColor(opts.bgColor);
            if (opts.bgColorOpacity !== undefined) layout.setBackGroundColorOpacity(opts.bgColorOpacity);
        }
        if (opts && opts.bgImage) layout.setBackGroundImage(opts.bgImage);
        if (opts && opts.clipping) layout.setClippingEnabled(true);
        B._applyOpts(layout, opts);
        parent.addChild(layout, (opts && opts.zOrder) || 0);
        return layout;
    };

    /**
     * Pin a node to its parent's edges using ccui.LayoutComponent.
     * Works for ANY cc.Node (not limited to ccui.Widget).
     *
     * @param {cc.Node} node   The node to pin (must already have a parent)
     * @param {Object}  edges  Edge configuration:
     *   left   : number   — left margin (px). Pins to left edge.
     *   right  : number   — right margin (px). Pins to right edge.
     *   top    : number   — top margin (px). Pins to top edge.
     *   bottom : number   — bottom margin (px). Pins to bottom edge.
     *   horizontalCenter : boolean — center horizontally (overrides left/right)
     *   verticalCenter   : boolean — center vertically (overrides top/bottom)
     *   stretchWidth     : boolean — stretch width to fill between left+right margins
     *   stretchHeight    : boolean — stretch height to fill between top+bottom margins
     *   percentWidth     : number  — width as 0-1 fraction of parent
     *   percentHeight    : number  — height as 0-1 fraction of parent
     * @returns {ccui.LayoutComponent}
     *
     * @example
     * // Pin top bar: full width, 86px tall, stick to top
     * UIBuilder.pinEdges(topBar, { top: 0, left: 0, right: 0, stretchWidth: true });
     *
     * // Pin bottom nav: full width, stick to bottom with 10px margin
     * UIBuilder.pinEdges(navBar, { bottom: 10, left: 0, right: 0, stretchWidth: true });
     *
     * // Center a panel
     * UIBuilder.pinEdges(panel, { horizontalCenter: true, verticalCenter: true });
     */
    B.pinEdges = function (node, edges) {
        var parent = node.getParent();
        if (!parent) return null;
        var ps = parent.getContentSize();
        var ns = node.getContentSize();
        var ax = node.getAnchorPoint().x;
        var ay = node.getAnchorPoint().y;

        // ── Compute position based on edges ──
        var x = node.getPositionX();
        var y = node.getPositionY();

        // Horizontal
        if (edges.horizontalCenter) {
            // Center node horizontally in parent
            x = ps.width / 2 - ns.width * (0.5 - ax);
        } else if (edges.left !== undefined && edges.right !== undefined) {
            // Stretch between left and right
            var newW = ps.width - edges.left - edges.right;
            node.setContentSize(newW, ns.height);
            ns = node.getContentSize();
            x = edges.left + ns.width * ax;
        } else if (edges.left !== undefined) {
            x = edges.left + ns.width * ax;
        } else if (edges.right !== undefined) {
            x = ps.width - edges.right - ns.width * (1 - ax);
        }

        // Vertical
        if (edges.verticalCenter) {
            // Center node vertically in parent
            y = ps.height / 2 - ns.height * (0.5 - ay);
        } else if (edges.top !== undefined && edges.bottom !== undefined) {
            // Stretch between top and bottom
            var newH = ps.height - edges.top - edges.bottom;
            node.setContentSize(ns.width, newH);
            ns = node.getContentSize();
            y = edges.bottom + ns.height * ay;
        } else if (edges.top !== undefined) {
            y = ps.height - edges.top - ns.height * (1 - ay);
        } else if (edges.bottom !== undefined) {
            y = edges.bottom + ns.height * ay;
        }

        node.setPosition(x, y);

        // Also bind LayoutComponent for resize behavior (if parent is ccui.Layout)
        if (parent instanceof ccui.Layout) {
            var lc = ccui.LayoutComponent.bindLayoutComponent(node);
            if (edges.horizontalCenter) {
                lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.CENTER);
            } else if (edges.left !== undefined && edges.right !== undefined) {
                lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.CENTER);
                lc.setLeftMargin(edges.left);
                lc.setRightMargin(edges.right);
                lc.setStretchWidthEnabled(true);
            } else if (edges.left !== undefined) {
                lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.LEFT);
                lc.setLeftMargin(edges.left);
            } else if (edges.right !== undefined) {
                lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.RIGHT);
                lc.setRightMargin(edges.right);
            }

            if (edges.verticalCenter) {
                lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.CENTER);
            } else if (edges.top !== undefined && edges.bottom !== undefined) {
                lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.CENTER);
                lc.setTopMargin(edges.top);
                lc.setBottomMargin(edges.bottom);
                lc.setStretchHeightEnabled(true);
            } else if (edges.top !== undefined) {
                lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.TOP);
                lc.setTopMargin(edges.top);
            } else if (edges.bottom !== undefined) {
                lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.BOTTOM);
                lc.setBottomMargin(edges.bottom);
            }

            if (edges.percentWidth !== undefined) {
                lc.setPercentWidthEnabled(true);
                lc.setPercentWidth(edges.percentWidth);
            }
            if (edges.percentHeight !== undefined) {
                lc.setPercentHeightEnabled(true);
                lc.setPercentHeight(edges.percentHeight);
            }

            lc.refreshLayout();
        }

        return node;
    };

    /**
     * Set percent-based position on any node.
     * For ccui.Widget: uses native setPositionType + setPositionPercent.
     * For other cc.Node: uses ccui.LayoutComponent percent positioning.
     *
     * @param {cc.Node} node
     * @param {number}  pX   0-1 fraction (0.5 = center)
     * @param {number}  pY   0-1 fraction (0.5 = center)
     * @returns {cc.Node}
     */
    B.setPercentPos = function (node, pX, pY) {
        if (node instanceof ccui.Widget) {
            node.setPositionType(ccui.Widget.POSITION_PERCENT);
            node.setPositionPercent(cc.p(pX, pY));
        } else {
            var lc = ccui.LayoutComponent.bindLayoutComponent(node);
            lc.setPositionPercentXEnabled(true);
            lc.setPositionPercentYEnabled(true);
            lc.setPositionPercentX(pX);
            lc.setPositionPercentY(pY);
            lc.refreshLayout();
        }
        return node;
    };

    /**
     * Set percent-based size on any node.
     * For ccui.Widget: uses native setSizeType + setSizePercent.
     * For other cc.Node: uses ccui.LayoutComponent percent sizing.
     *
     * @param {cc.Node} node
     * @param {number}  pW   0-1 fraction of parent width (1.0 = full width)
     * @param {number}  pH   0-1 fraction of parent height (1.0 = full height)
     * @returns {cc.Node}
     */
    B.setPercentSize = function (node, pW, pH) {
        if (node instanceof ccui.Widget) {
            node.setSizeType(ccui.Widget.SIZE_PERCENT);
            node.setSizePercent(cc.p(pW, pH));
        } else {
            var lc = ccui.LayoutComponent.bindLayoutComponent(node);
            lc.setPercentWidthEnabled(true);
            lc.setPercentHeightEnabled(true);
            lc.setPercentWidth(pW);
            lc.setPercentHeight(pH);
            lc.refreshLayout();
        }
        return node;
    };

    /**
     * Add a widget to a RELATIVE layout with a RelativeLayoutParameter.
     *
     * @param {ccui.Layout} layout   Parent layout (must have layoutType = RELATIVE)
     * @param {ccui.Widget} widget   Child widget to add
     * @param {number}      align    Alignment constant (ccui.RelativeLayoutParameter.*)
     * @param {Object}      [opts]   Extra:
     *   relName  : string            — setRelativeToWidgetName (for sibling alignment)
     *   name     : string            — setRelativeName (this widget's relative id)
     *   margin   : {l,t,r,b}         — edge margins
     *   zOrder   : number
     * @returns {ccui.Widget}
     *
     * Alignment constants (most common):
     *   ccui.RelativeLayoutParameter.PARENT_TOP_LEFT
     *   ccui.RelativeLayoutParameter.PARENT_TOP_CENTER_HORIZONTAL
     *   ccui.RelativeLayoutParameter.PARENT_TOP_RIGHT
     *   ccui.RelativeLayoutParameter.PARENT_LEFT_CENTER_VERTICAL
     *   ccui.RelativeLayoutParameter.CENTER_IN_PARENT
     *   ccui.RelativeLayoutParameter.PARENT_RIGHT_CENTER_VERTICAL
     *   ccui.RelativeLayoutParameter.PARENT_LEFT_BOTTOM
     *   ccui.RelativeLayoutParameter.PARENT_BOTTOM_CENTER_HORIZONTAL
     *   ccui.RelativeLayoutParameter.PARENT_RIGHT_BOTTOM
     *   ccui.RelativeLayoutParameter.LOCATION_ABOVE_CENTER
     *   ccui.RelativeLayoutParameter.LOCATION_BELOW_CENTER
     *   ccui.RelativeLayoutParameter.LOCATION_LEFT_OF_CENTER
     *   ccui.RelativeLayoutParameter.LOCATION_RIGHT_OF_CENTER
     */
    B.addToRelativeLayout = function (layout, widget, align, opts) {
        opts = opts || {};
        var param = new ccui.RelativeLayoutParameter();
        param.setAlign(align);
        if (opts.relName) param.setRelativeToWidgetName(opts.relName);
        if (opts.name) param.setRelativeName(opts.name);
        if (opts.margin) {
            var m = opts.margin;
            param.setMargin(new ccui.Margin(m.l || 0, m.t || 0, m.r || 0, m.b || 0));
        }
        widget.setLayoutParameter(param);
        layout.addChild(widget, (opts && opts.zOrder) || 0);
        return widget;
    };

    // ───────────────────────────────────────────────────────────────
    //  FLEXBOX-LIKE ARRANGEMENT HELPERS
    // ───────────────────────────────────────────────────────────────

    /**
     * Arrange children of a container as a horizontal row (left-to-right).
     * Uses ABSOLUTE positioning — works with any cc.Node, not just ccui.Widget.
     *
     * @param {cc.Node} container  Parent node (must already have children added)
     * @param {Object}  [opts]
     *   gap            : number  — spacing between children (px)
     *   alignItems     : string  — cross-axis alignment: 'start'|'center'|'end' (default: 'start')
     *   justifyContent : string  — main-axis: 'start'|'center'|'end'|'spaceBetween'|'spaceAround'
     */
    B.arrangeAsRow = function (container, opts) {
        opts = opts || {};
        var children = container.getChildren();
        if (!children || children.length === 0) return;

        var gap = opts.gap || 0;
        var align = opts.alignItems || 'start';
        var justify = opts.justifyContent || 'start';
        var parentH = container.getContentSize().height;
        var parentW = container.getContentSize().width;

        // Calculate total width of children + gaps
        var totalW = 0;
        var i, child, cs;
        for (i = 0; i < children.length; i++) {
            cs = children[i].getContentSize();
            totalW += cs.width;
            if (i > 0) totalW += gap;
        }

        // Compute starting X based on justifyContent
        var x = 0;
        var extraGap = 0;
        if (justify === 'center') {
            x = (parentW - totalW) / 2;
        } else if (justify === 'end') {
            x = parentW - totalW;
        } else if (justify === 'spaceBetween' && children.length > 1) {
            var totalChildW = 0;
            for (i = 0; i < children.length; i++) totalChildW += children[i].getContentSize().width;
            extraGap = (parentW - totalChildW) / (children.length - 1);
            gap = extraGap;
        } else if (justify === 'spaceAround' && children.length > 0) {
            var totalChildW2 = 0;
            for (i = 0; i < children.length; i++) totalChildW2 += children[i].getContentSize().width;
            extraGap = (parentW - totalChildW2) / children.length;
            x = extraGap / 2;
            gap = extraGap;
        }

        // Position each child
        for (i = 0; i < children.length; i++) {
            child = children[i];
            cs = child.getContentSize();
            var anchor = child.getAnchorPoint();

            // Main axis (X) — position with anchor offset
            var posX = x + cs.width * anchor.x;

            // Cross axis (Y)
            var posY;
            if (align === 'center') {
                posY = parentH / 2 + (anchor.y - 0.5) * cs.height;
            } else if (align === 'end') {
                posY = parentH - cs.height * (1 - anchor.y);
            } else {
                // start (bottom)
                posY = cs.height * anchor.y;
            }

            child.setPosition(posX, posY);
            x += cs.width + (i < children.length - 1 ? gap : 0);
        }
    };

    /**
     * Arrange children of a container as a vertical column (top-to-bottom).
     * Uses ABSOLUTE positioning — works with any cc.Node, not just ccui.Widget.
     *
     * @param {cc.Node} container  Parent node (must already have children added)
     * @param {Object}  [opts]
     *   gap            : number  — spacing between children (px)
     *   alignItems     : string  — cross-axis alignment: 'start'|'center'|'end' (default: 'start')
     *   justifyContent : string  — main-axis: 'start'|'center'|'end'|'spaceBetween'|'spaceAround'
     */
    B.arrangeAsColumn = function (container, opts) {
        opts = opts || {};
        var children = container.getChildren();
        if (!children || children.length === 0) return;

        var gap = opts.gap || 0;
        var align = opts.alignItems || 'start';
        var justify = opts.justifyContent || 'start';
        var parentW = container.getContentSize().width;
        var parentH = container.getContentSize().height;

        // Calculate total height of children + gaps
        var totalH = 0;
        var i, child, cs;
        for (i = 0; i < children.length; i++) {
            cs = children[i].getContentSize();
            totalH += cs.height;
            if (i > 0) totalH += gap;
        }

        // Top-to-bottom: start from top of container
        var y = parentH;
        var extraGap = 0;
        if (justify === 'center') {
            y = parentH - (parentH - totalH) / 2;
        } else if (justify === 'end') {
            y = totalH;
        } else if (justify === 'spaceBetween' && children.length > 1) {
            var totalChildH = 0;
            for (i = 0; i < children.length; i++) totalChildH += children[i].getContentSize().height;
            extraGap = (parentH - totalChildH) / (children.length - 1);
            gap = extraGap;
        } else if (justify === 'spaceAround' && children.length > 0) {
            var totalChildH2 = 0;
            for (i = 0; i < children.length; i++) totalChildH2 += children[i].getContentSize().height;
            extraGap = (parentH - totalChildH2) / children.length;
            y = parentH - extraGap / 2;
            gap = extraGap;
        }

        // Position each child (top-to-bottom in Cocos = decreasing Y)
        for (i = 0; i < children.length; i++) {
            child = children[i];
            cs = child.getContentSize();
            var anchor = child.getAnchorPoint();

            // Main axis (Y) — position from top
            var posY = y - cs.height * (1 - anchor.y);

            // Cross axis (X)
            var posX;
            if (align === 'center') {
                posX = parentW / 2 + (anchor.x - 0.5) * cs.width;
            } else if (align === 'end') {
                posX = parentW - cs.width * (1 - anchor.x);
            } else {
                // start (left)
                posX = cs.width * anchor.x;
            }

            child.setPosition(posX, posY);
            y -= cs.height + (i < children.length - 1 ? gap : 0);
        }
    };

})(UIBuilder);
