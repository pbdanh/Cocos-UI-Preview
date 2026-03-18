/**
 * UIBuilder — Progress & Loading
 */
(function (B) {

    /**
     * Create a ccui.LoadingBar.
     * @param {cc.Node} parent
     * @param {string}  texture
     * @param {number}  x
     * @param {number}  y
     * @param {number}  [percent]  Initial percent (0-100, default 0)
     * @param {Object}  [opts]     Extra: direction (LoadingBar.TYPE_LEFT / TYPE_RIGHT), scale9, capInsets
     * @returns {ccui.LoadingBar}
     */
    B.createLoadingBar = function (parent, texture, x, y, percent, opts) {
        var bar = new ccui.LoadingBar(texture, percent || 0);
        bar.setPosition(x, y);
        if (opts && opts.direction !== undefined) bar.setDirection(opts.direction);
        if (opts && opts.scale9) {
            bar.setScale9Enabled(true);
            if (opts.capInsets) bar.setCapInsets(opts.capInsets);
            if (opts.size) bar.setContentSize(opts.size[0], opts.size[1]);
        }
        B._applyOpts(bar, opts);
        parent.addChild(bar, (opts && opts.zOrder) || 0);
        return bar;
    };

    /**
     * Create a cc.ProgressTimer (radial / bar progress).
     * @param {cc.Node} parent
     * @param {string}  spriteFile
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: type (cc.ProgressTimer.TYPE_RADIAL / TYPE_BAR),
     *                          midpoint [mx,my], barChangeRate [rx,ry], percent, reverseDir
     * @returns {cc.ProgressTimer}
     */
    B.createProgressTimer = function (parent, spriteFile, x, y, opts) {
        opts = opts || {};
        var sprite = new cc.Sprite(spriteFile);
        var pt = new cc.ProgressTimer(sprite);
        pt.setType(opts.type || cc.ProgressTimer.TYPE_RADIAL);
        pt.setPosition(x, y);
        if (opts.midpoint) pt.setMidpoint(cc.p(opts.midpoint[0], opts.midpoint[1]));
        if (opts.barChangeRate) pt.setBarChangeRate(cc.p(opts.barChangeRate[0], opts.barChangeRate[1]));
        if (opts.percent !== undefined) pt.setPercentage(opts.percent);
        if (opts.reverseDir !== undefined) pt.setReverseDirection(opts.reverseDir);
        B._applyOpts(pt, opts);
        parent.addChild(pt, opts.zOrder || 0);
        return pt;
    };

})(UIBuilder);
