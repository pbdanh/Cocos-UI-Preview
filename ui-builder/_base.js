/**
 * UIBuilder — Comprehensive UI helper library for cocos2d-html5 (v3.x)
 *
 * Provides high-level, declarative functions so AI agents (and humans)
 * can quickly build UIs without memorising low-level cocos2d API calls.
 *
 * Coordinate system reminder:
 *   • Origin (0,0) is BOTTOM-LEFT of the screen.
 *   • "Percent" helpers map 0-100 → 0-cc.winSize.width/height.
 *
 * Every create* function returns the created node so you can chain
 * further configuration.  All of them accept an optional `opts` object
 * (see _applyOpts for supported keys).
 *
 * This file (loaded first) creates the global UIBuilder object.
 * Subsequent _*.js files extend it with additional methods.
 */
var UIBuilder = {

    // ───────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ───────────────────────────────────────────────────────────────

    /**
     * Apply common optional properties to any cc.Node-like object.
     *
     * Supported keys in `opts`:
     *   anchor    : [ax, ay]           — setAnchorPoint
     *   scale     : n  or [sx, sy]     — setScale / setScaleX+Y
     *   rotation  : degrees            — setRotation
     *   opacity   : 0-255              — setOpacity
     *   zOrder    : number             — setLocalZOrder
     *   visible   : boolean            — setVisible
     *   tag       : number             — setTag
     *   name      : string             — setName
     *   color     : cc.color(r,g,b)    — setColor
     *   flipX     : boolean            — setFlippedX
     *   flipY     : boolean            — setFlippedY
     *   size      : [w, h]             — setContentSize
     */
    _applyOpts: function (node, opts) {
        if (!opts) return;
        if (opts.anchor) node.setAnchorPoint(opts.anchor[0], opts.anchor[1]);
        if (opts.scale !== undefined) {
            if (Array.isArray(opts.scale)) {
                node.setScaleX(opts.scale[0]);
                node.setScaleY(opts.scale[1]);
            } else {
                node.setScale(opts.scale);
            }
        }
        if (opts.rotation !== undefined) node.setRotation(opts.rotation);
        if (opts.opacity !== undefined) node.setOpacity(opts.opacity);
        if (opts.zOrder !== undefined) node.setLocalZOrder(opts.zOrder);
        if (opts.visible !== undefined) node.setVisible(opts.visible);
        if (opts.tag !== undefined) node.setTag(opts.tag);
        if (opts.name !== undefined) node.setName(opts.name);
        if (opts.color) node.setColor(opts.color);
        if (opts.flipX !== undefined) node.setFlippedX(opts.flipX);
        if (opts.flipY !== undefined) node.setFlippedY(opts.flipY);
        if (opts.size) node.setContentSize(opts.size[0], opts.size[1]);
    },

    /** Convert percent (0-100) → pixel for X axis. Defaults to screen width. */
    pX: function (percent, refWidth) {
        return (refWidth || cc.winSize.width) * (percent / 100);
    },

    /** Convert percent (0-100) → pixel for Y axis. Defaults to screen height. */
    pY: function (percent, refHeight) {
        return (refHeight || cc.winSize.height) * (percent / 100);
    },

    /**
     * Convert percent position relative to a parent node's content size.
     * @param {cc.Node} parent
     * @param {number}  pX   0-100
     * @param {number}  pY   0-100
     * @returns {{ x: number, y: number }}
     */
    parentPercent: function (parent, pX, pY) {
        var s = parent.getContentSize();
        return { x: s.width * (pX / 100), y: s.height * (pY / 100) };
    },

    /**
     * Reference to the shared LayoutEngine constructor.
     * Usage: var engine = new UIBuilder.LayoutEngine();
     *        engine.buildTree(jsonData);
     *        engine.computeLayout(screenW, screenH);
     */
    LayoutEngine: (typeof LayoutEngine !== 'undefined') ? LayoutEngine : null
};
