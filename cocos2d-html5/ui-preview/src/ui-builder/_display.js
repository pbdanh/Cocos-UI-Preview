/**
 * UIBuilder — Display: Sprite & Image
 */
(function (B) {

    /**
     * Create a full-screen background sprite centered on the parent.
     * @param {cc.Node} parent
     * @param {string}  file       Path to image or AssetManifest key
     * @param {string}  [scaleMode]  "FILL" (cover), "FIT" (contain), or "STRETCH" (fill, may distort). Default: "FILL"
     * @returns {cc.Sprite}
     */
    B.createBackground = function (parent, file, scaleMode) {
        var bg = new cc.Sprite(file);
        var ps = parent.getContentSize();
        var origSize = bg.getContentSize();
        if (origSize.width > 0 && origSize.height > 0) {
            var scaleX = ps.width / origSize.width;
            var scaleY = ps.height / origSize.height;
            if (scaleMode === 'FIT') {
                var s = Math.min(scaleX, scaleY);  // contain (uniform)
                bg.setScale(s);
            } else if (scaleMode === 'STRETCH') {
                bg.setScaleX(scaleX);               // fill exactly (non-uniform)
                bg.setScaleY(scaleY);
            } else {
                var s = Math.max(scaleX, scaleY);  // cover (uniform) — default FILL
                bg.setScale(s);
            }
        }
        bg.setPosition(ps.width / 2, ps.height / 2);
        parent.addChild(bg);
        return bg;
    };

    /**
     * Create a cc.Sprite at pixel position.
     * @param {cc.Node} parent
     * @param {string}  file
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]
     * @returns {cc.Sprite}
     */
    B.createSprite = function (parent, file, x, y, opts) {
        var sp = new cc.Sprite(file);
        sp.setPosition(x, y);
        B._applyOpts(sp, opts);
        parent.addChild(sp, (opts && opts.zOrder) || 0);
        return sp;
    };

    /**
     * Create a cc.Sprite at percentage-based position.
     */
    B.createSpritePercent = function (parent, file, pX, pY, opts) {
        return B.createSprite(parent, file, B.pX(pX), B.pY(pY), opts);
    };

    /**
     * Create a 9-slice (scale9) sprite.
     * @param {cc.Node} parent
     * @param {string}  file
     * @param {cc.Rect} capInsets  e.g. cc.rect(10,10,20,20)
     * @param {number}  w         Desired width
     * @param {number}  h         Desired height
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]
     * @returns {ccui.Scale9Sprite}
     */
    B.createScale9Sprite = function (parent, file, capInsets, w, h, x, y, opts) {
        var s9 = new ccui.Scale9Sprite(file, cc.rect(0, 0, 0, 0), capInsets);
        s9.setContentSize(w, h);
        s9.setPosition(x, y);
        B._applyOpts(s9, opts);
        parent.addChild(s9, (opts && opts.zOrder) || 0);
        return s9;
    };

    /**
     * Create a ccui.ImageView (widget-based image).
     * @param {cc.Node} parent
     * @param {string}  file
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: texType (ccui.Widget.LOCAL_TEXTURE | PLIST_TEXTURE)
     * @returns {ccui.ImageView}
     */
    B.createImageView = function (parent, file, x, y, opts) {
        var texType = (opts && opts.texType) || ccui.Widget.LOCAL_TEXTURE;
        var iv = new ccui.ImageView(file, texType);
        iv.setPosition(x, y);
        B._applyOpts(iv, opts);
        parent.addChild(iv, (opts && opts.zOrder) || 0);
        return iv;
    };

    /**
     * Create a ccui.ImageView at percentage-based position.
     */
    B.createImageViewPercent = function (parent, file, pX, pY, opts) {
        return B.createImageView(parent, file, B.pX(pX), B.pY(pY), opts);
    };

    /**
     * Set any node's position using percent values (0-100).
     */
    B.setNodePercent = function (node, pX, pY) {
        node.setPosition(B.pX(pX), B.pY(pY));
        return node;
    };

})(UIBuilder);
