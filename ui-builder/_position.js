/**
 * UIBuilder — Positioning & Sizing Utilities
 */
(function (B) {

    /**
     * Center a node within its parent.
     */
    B.centerIn = function (node, parent) {
        var ps = parent.getContentSize();
        node.setPosition(ps.width / 2, ps.height / 2);
        return node;
    };

    /**
     * Center a node on screen.
     */
    B.centerOnScreen = function (node) {
        node.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        return node;
    };

    /**
     * Align node to the top of the screen.
     * @param {cc.Node} node
     * @param {number}  [margin]   Pixels from the top edge (default 0)
     * @param {number}  [x]       X position — defaults to center
     */
    B.alignTop = function (node, margin, x) {
        var m = margin || 0;
        var px = (x !== undefined) ? x : cc.winSize.width / 2;
        node.setPosition(px, cc.winSize.height - m);
        return node;
    };

    /**
     * Align node to the bottom of the screen.
     * @param {cc.Node} node
     * @param {number}  [margin]
     * @param {number}  [x]
     */
    B.alignBottom = function (node, margin, x) {
        var m = margin || 0;
        var px = (x !== undefined) ? x : cc.winSize.width / 2;
        node.setPosition(px, m);
        return node;
    };

    /**
     * Align node to the left of the screen.
     * @param {cc.Node} node
     * @param {number}  [margin]
     * @param {number}  [y]
     */
    B.alignLeft = function (node, margin, y) {
        var m = margin || 0;
        var py = (y !== undefined) ? y : cc.winSize.height / 2;
        node.setPosition(m, py);
        return node;
    };

    /**
     * Align node to the right of the screen.
     * @param {cc.Node} node
     * @param {number}  [margin]
     * @param {number}  [y]
     */
    B.alignRight = function (node, margin, y) {
        var m = margin || 0;
        var py = (y !== undefined) ? y : cc.winSize.height / 2;
        node.setPosition(cc.winSize.width - m, py);
        return node;
    };

    /**
     * Scale a node so it fills the parent's content size.
     * @param {cc.Node} node
     * @param {cc.Node} parent
     */
    B.fillParent = function (node, parent) {
        var ns = node.getContentSize();
        var ps = parent.getContentSize();
        if (ns.width > 0 && ns.height > 0) {
            node.setScaleX(ps.width / ns.width);
            node.setScaleY(ps.height / ns.height);
        }
        return node;
    };

    /**
     * Scale a node to fit within parent while preserving aspect ratio.
     * @param {cc.Node} node
     * @param {cc.Node} parent
     */
    B.fitParent = function (node, parent) {
        var ns = node.getContentSize();
        var ps = parent.getContentSize();
        if (ns.width > 0 && ns.height > 0) {
            var s = Math.min(ps.width / ns.width, ps.height / ns.height);
            node.setScale(s);
        }
        return node;
    };

    /**
     * Get screen center point.
     * @returns {{ x: number, y: number }}
     */
    B.screenCenter = function () {
        return { x: cc.winSize.width / 2, y: cc.winSize.height / 2 };
    };

    /**
     * Get screen size.
     * @returns {{ width: number, height: number }}
     */
    B.screenSize = function () {
        return { width: cc.winSize.width, height: cc.winSize.height };
    };

    // ───────────────────────────────────────────────────────────────
    //  PARENT-RELATIVE PINNING (via ccui.LayoutComponent)
    // ───────────────────────────────────────────────────────────────

    /**
     * Pin node to its PARENT's top edge using LayoutComponent.
     * Unlike alignTop (screen-relative), this works within any container.
     *
     * @param {cc.Node} node
     * @param {cc.Node} parent   The parent node (must be node's actual parent)
     * @param {number}  [margin] Pixels from the top edge (default 0)
     * @returns {ccui.LayoutComponent}
     */
    B.pinToTop = function (node, parent, margin) {
        var lc = ccui.LayoutComponent.bindLayoutComponent(node);
        lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.TOP);
        lc.setTopMargin(margin || 0);
        lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.NONE);
        lc.setPositionPercentXEnabled(true);
        lc.setPositionPercentX(0.5);
        lc.refreshLayout();
        return lc;
    };

    /**
     * Pin node to its PARENT's bottom edge using LayoutComponent.
     * Unlike alignBottom (screen-relative), this works within any container.
     *
     * @param {cc.Node} node
     * @param {cc.Node} parent   The parent node (must be node's actual parent)
     * @param {number}  [margin] Pixels from the bottom edge (default 0)
     * @returns {ccui.LayoutComponent}
     */
    B.pinToBottom = function (node, parent, margin) {
        var lc = ccui.LayoutComponent.bindLayoutComponent(node);
        lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.BOTTOM);
        lc.setBottomMargin(margin || 0);
        lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.NONE);
        lc.setPositionPercentXEnabled(true);
        lc.setPositionPercentX(0.5);
        lc.refreshLayout();
        return lc;
    };

    /**
     * Pin node to its PARENT's left edge using LayoutComponent.
     * Unlike alignLeft (screen-relative), this works within any container.
     *
     * @param {cc.Node} node
     * @param {cc.Node} parent   The parent node (must be node's actual parent)
     * @param {number}  [margin] Pixels from the left edge (default 0)
     * @returns {ccui.LayoutComponent}
     */
    B.pinToLeft = function (node, parent, margin) {
        var lc = ccui.LayoutComponent.bindLayoutComponent(node);
        lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.LEFT);
        lc.setLeftMargin(margin || 0);
        lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.NONE);
        lc.setPositionPercentYEnabled(true);
        lc.setPositionPercentY(0.5);
        lc.refreshLayout();
        return lc;
    };

    /**
     * Pin node to its PARENT's right edge using LayoutComponent.
     * Unlike alignRight (screen-relative), this works within any container.
     *
     * @param {cc.Node} node
     * @param {cc.Node} parent   The parent node (must be node's actual parent)
     * @param {number}  [margin] Pixels from the right edge (default 0)
     * @returns {ccui.LayoutComponent}
     */
    B.pinToRight = function (node, parent, margin) {
        var lc = ccui.LayoutComponent.bindLayoutComponent(node);
        lc.setHorizontalEdge(ccui.LayoutComponent.horizontalEdge.RIGHT);
        lc.setRightMargin(margin || 0);
        lc.setVerticalEdge(ccui.LayoutComponent.verticalEdge.NONE);
        lc.setPositionPercentYEnabled(true);
        lc.setPositionPercentY(0.5);
        lc.refreshLayout();
        return lc;
    };

})(UIBuilder);
