/**
 * UIBuilder — Shapes & Drawing
 */
(function (B) {

    /**
     * Draw a filled rectangle using cc.DrawNode.
     * @param {cc.Node}  parent
     * @param {number}   w
     * @param {number}   h
     * @param {number}   x
     * @param {number}   y
     * @param {cc.Color} fillColor
     * @param {Object}   [opts]  Extra: borderWidth, borderColor
     * @returns {cc.DrawNode}
     */
    B.createRect = function (parent, w, h, x, y, fillColor, opts) {
        var dn = new cc.DrawNode();
        dn.setPosition(x, y);
        var hw = w / 2, hh = h / 2;
        var borderWidth = (opts && opts.borderWidth) || 0;
        var borderColor = (opts && opts.borderColor) || fillColor;
        dn.drawRect(
            cc.p(-hw, -hh), cc.p(hw, hh),
            fillColor, borderWidth, borderColor
        );
        B._applyOpts(dn, opts);
        parent.addChild(dn, (opts && opts.zOrder) || 0);
        return dn;
    };

    /**
     * Draw a filled circle using cc.DrawNode.
     * @param {cc.Node}  parent
     * @param {number}   radius
     * @param {number}   x
     * @param {number}   y
     * @param {cc.Color} fillColor
     * @param {Object}   [opts]  Extra: borderWidth, borderColor, segments (default 64)
     * @returns {cc.DrawNode}
     */
    B.createCircle = function (parent, radius, x, y, fillColor, opts) {
        var dn = new cc.DrawNode();
        dn.setPosition(x, y);
        var segments = (opts && opts.segments) || 64;
        var borderWidth = (opts && opts.borderWidth) || 0;
        var borderColor = (opts && opts.borderColor) || fillColor;
        dn.drawCircle(
            cc.p(0, 0), radius, 0, segments,
            false, borderWidth, borderColor
        );
        // Fill — drawDot for solid fill
        dn.drawDot(cc.p(0, 0), radius, fillColor);
        B._applyOpts(dn, opts);
        parent.addChild(dn, (opts && opts.zOrder) || 0);
        return dn;
    };

})(UIBuilder);
