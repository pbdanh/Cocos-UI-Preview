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
     * Create a cc.Sprite (shorthand).
     * @param {string} file  Path to image
     * @returns {cc.Sprite}
     */
    B.sprite = function (file) {
        return new cc.Sprite(file);
    };

    /**
     * Create a ccui.Button (shorthand).
     * @param {string} file  Path to image for normal state
     * @returns {ccui.Button}
     */
    B.button = function (file) {
        var btn = new ccui.Button(file);
        btn.setPressedActionEnabled(true);
        return btn;
    };

    /**
     * Set the desired layout size for any node.
     *
     * For visual nodes (cc.Sprite, ccui.ImageView):
     *   - Default: uniform scale to FIT within w×h (no distortion).
     *   - scaleMode "FILL": uniform scale to COVER w×h (may crop).
     *   - scaleMode "STRETCH": non-uniform scale to exact w×h.
     *   - If w/h are 0 and scaleMode is set, uses parent's size as target.
     *   - setContentSize(w, h) is always set for layout bounding box.
     *
     * For containers (cc.Node, ccui.Layout):
     *   - Sets contentSize directly.
     *
     * If width/height not provided and no scaleMode, sprite keeps natural texture size.
     *
     * @param {cc.Node} node       Target node
     * @param {number}  w          Desired layout width (px), 0 = use parent width
     * @param {number}  h          Desired layout height (px), 0 = use parent height
     * @param {string}  [scaleMode]  "FIT" (default), "FILL" (cover), "STRETCH"
     * @returns {cc.Node}
     */
    B.setLayoutSize = function (node, w, h, scaleMode) {
        // If scaleMode set but no explicit size, use parent's size
        if (scaleMode && (w <= 0 || h <= 0)) {
            var parent = node.getParent();
            if (parent) {
                var ps = parent.getContentSize();
                if (w <= 0) w = ps.width;
                if (h <= 0) h = ps.height;
            }
        }

        if (w <= 0 && h <= 0) return node;

        var origSize = node.getContentSize();
        var scaledSprite = false;

        // For sprites/images: scale texture to fit layout size
        if ((node instanceof cc.Sprite || node instanceof ccui.ImageView) &&
            origSize.width > 0 && origSize.height > 0) {
            var sx = w > 0 ? w / origSize.width : Infinity;
            var sy = h > 0 ? h / origSize.height : Infinity;

            if (scaleMode === 'FILL') {
                var s = Math.max(sx, sy);
                node.setScale(s);
            } else if (scaleMode === 'STRETCH') {
                if (sx === Infinity) sx = 1;
                if (sy === Infinity) sy = 1;
                node.setScaleX(sx);
                node.setScaleY(sy);
            } else if (scaleMode) {
                // FIT (default when scaleMode is set)
                var s = Math.min(sx, sy);
                if (s === Infinity) s = 1;
                node.setScale(s);
            } else {
                // No scaleMode: uniform scale to FIT
                var s = Math.min(sx, sy);
                if (s === Infinity) s = 1;
                node.setScale(s);
            }
            scaledSprite = true;
        }

        // Center sprite within its layout bounds when using scaleMode
        if (scaleMode && w > 0 && h > 0) {
            node.setAnchorPoint(0.5, 0.5);
            node.setPosition(w / 2, h / 2);
        }

        // Set content size for layout calculations
        // IMPORTANT: Skip for scaleMode sprites — their original texture contentSize
        // is the correct base for anchor/position math. setScale handles visual sizing.
        // Calling setContentSize here would make worldBounds = newSize * scale (too large).
        if (scaleMode && scaledSprite) {
            // Don't override contentSize — scale already handles visual sizing
        } else if (w > 0 && h > 0) {
            node.setContentSize(w, h);
        } else if (w > 0) {
            node.setContentSize(w, origSize.height);
        } else if (h > 0) {
            node.setContentSize(origSize.width, h);
        }

        return node;
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
     * Set any node's position using percent values (0-100).
     */
    B.setNodePercent = function (node, pX, pY) {
        node.setPosition(B.pX(pX), B.pY(pY));
        return node;
    };

})(UIBuilder);
