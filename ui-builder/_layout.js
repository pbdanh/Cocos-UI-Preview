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
        var lc = ccui.LayoutComponent.bindLayoutComponent(node);

        // Horizontal edge
        if (edges.horizontalCenter) {
            lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.CENTER);
        } else if (edges.left !== undefined && edges.right !== undefined) {
            // Both edges: use CENTER + margins + stretch to fill between them
            lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.CENTER);
            lc.setLeftMargin(edges.left);
            lc.setRightMargin(edges.right);
            lc.setStretchWidthEnabled(true);
        } else if (edges.left !== undefined) {
            lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.LEFT);
            lc.setLeftMargin(edges.left);
            if (edges.stretchWidth) lc.setStretchWidthEnabled(true);
        } else if (edges.right !== undefined) {
            lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.RIGHT);
            lc.setRightMargin(edges.right);
            if (edges.stretchWidth) lc.setStretchWidthEnabled(true);
        }

        // Vertical edge
        if (edges.verticalCenter) {
            lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.CENTER);
        } else if (edges.top !== undefined && edges.bottom !== undefined) {
            // Both edges: use CENTER + margins + stretch to fill between them
            lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.CENTER);
            lc.setTopMargin(edges.top);
            lc.setBottomMargin(edges.bottom);
            lc.setStretchHeightEnabled(true);
        } else if (edges.top !== undefined) {
            lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.TOP);
            lc.setTopMargin(edges.top);
            if (edges.stretchHeight) lc.setStretchHeightEnabled(true);
        } else if (edges.bottom !== undefined) {
            lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.BOTTOM);
            lc.setBottomMargin(edges.bottom);
            if (edges.stretchHeight) lc.setStretchHeightEnabled(true);
        }

        // Percent sizing
        if (edges.percentWidth !== undefined) {
            lc.setPercentWidthEnabled(true);
            lc.setPercentWidth(edges.percentWidth);
        }
        if (edges.percentHeight !== undefined) {
            lc.setPercentHeightEnabled(true);
            lc.setPercentHeight(edges.percentHeight);
        }

        // Stretch (without both edges set above)
        if (edges.stretchWidth && edges.left === undefined && edges.right === undefined) {
            lc.setStretchWidthEnabled(true);
        }
        if (edges.stretchHeight && edges.top === undefined && edges.bottom === undefined) {
            lc.setStretchHeightEnabled(true);
        }

        lc.refreshLayout();
        return lc;
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

})(UIBuilder);
