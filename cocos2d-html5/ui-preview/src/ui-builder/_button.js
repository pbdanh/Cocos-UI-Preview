/**
 * UIBuilder — Buttons & Menu
 */
(function (B) {

    /**
     * Create a ccui.Button at percentage-based position (original helper, kept for backward compat).
     */
    B.createButtonPercent = function (parent, normalImg, percentX, percentY, callback, opts) {
        var btn = new ccui.Button(normalImg);
        btn.setPosition(B.pX(percentX), B.pY(percentY));
        if (callback) btn.addClickEventListener(callback);
        B._applyOpts(btn, opts);
        parent.addChild(btn, (opts && opts.zOrder) || 0);
        return btn;
    };

    /**
     * Create a ccui.Button at pixel position.
     * @param {cc.Node}   parent
     * @param {string}    normalImg
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  [callback]
     * @param {Object}    [opts]  Extra: selectedImg, disabledImg, texType, scale9, capInsets, pressedActionEnabled
     * @returns {ccui.Button}
     */
    B.createButton = function (parent, normalImg, x, y, callback, opts) {
        opts = opts || {};
        var texType = opts.texType || ccui.Widget.LOCAL_TEXTURE;
        var btn = new ccui.Button(normalImg, opts.selectedImg || "", opts.disabledImg || "", texType);
        btn.setPosition(x, y);
        if (opts.scale9) {
            btn.setScale9Enabled(true);
            if (opts.capInsets) btn.setCapInsets(opts.capInsets);
            if (opts.size) btn.setContentSize(opts.size[0], opts.size[1]);
        }
        if (opts.pressedActionEnabled !== undefined) btn.setPressedActionEnabled(opts.pressedActionEnabled);
        if (callback) btn.addClickEventListener(callback);
        B._applyOpts(btn, opts);
        parent.addChild(btn, opts.zOrder || 0);
        return btn;
    };

    /**
     * Create a ccui.Button with a title label.
     * @param {cc.Node}   parent
     * @param {string}    normalImg
     * @param {string}    title
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  [callback]
     * @param {Object}    [opts]  Extra: titleFontName, titleFontSize, titleColor + same as createButton
     * @returns {ccui.Button}
     */
    B.createButtonWithTitle = function (parent, normalImg, title, x, y, callback, opts) {
        opts = opts || {};
        var btn = B.createButton(parent, normalImg, x, y, callback, opts);
        btn.setTitleText(title);
        if (opts.titleFontName) btn.setTitleFontName(opts.titleFontName);
        if (opts.titleFontSize) btn.setTitleFontSize(opts.titleFontSize);
        if (opts.titleColor) btn.setTitleColor(opts.titleColor);
        return btn;
    };

    /**
     * Create a cc.MenuItemImage (classic menu button).
     * @param {cc.Node}   parent
     * @param {string}    normalImg
     * @param {string}    selectedImg
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  callback
     * @param {Object}    [opts]
     * @returns {cc.MenuItemImage}  (already inside a cc.Menu)
     */
    B.createMenuItemImage = function (parent, normalImg, selectedImg, x, y, callback, opts) {
        var item = new cc.MenuItemImage(normalImg, selectedImg, callback);
        item.setAnchorPoint(0.5, 0.5);
        var menu = new cc.Menu(item);
        menu.setPosition(0, 0);
        item.setPosition(x, y);
        B._applyOpts(item, opts);
        parent.addChild(menu, (opts && opts.zOrder) || 1);
        return item;
    };

    /**
     * Create a cc.MenuItemLabel.
     * @param {cc.Node}   parent
     * @param {string}    text
     * @param {number}    fontSize
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  callback
     * @param {Object}    [opts]  Extra: fontName
     * @returns {cc.MenuItemLabel}
     */
    B.createMenuItemLabel = function (parent, text, fontSize, x, y, callback, opts) {
        var fontName = (opts && opts.fontName) || "Arial";
        var label = new cc.LabelTTF(text, fontName, fontSize);
        var item = new cc.MenuItemLabel(label, callback);
        var menu = new cc.Menu(item);
        menu.setPosition(0, 0);
        item.setPosition(x, y);
        B._applyOpts(item, opts);
        parent.addChild(menu, (opts && opts.zOrder) || 1);
        return item;
    };

    /**
     * Create a cc.Menu from an array of cc.MenuItem items.
     * @param {cc.Node}  parent
     * @param {Array}    items     Array of cc.MenuItem*
     * @param {number}   [x]      Menu position X (default 0)
     * @param {number}   [y]      Menu position Y (default 0)
     * @param {Object}   [opts]   Extra: alignVertically (gap), alignHorizontally (gap)
     * @returns {cc.Menu}
     */
    B.createMenu = function (parent, items, x, y, opts) {
        var menu = new cc.Menu(items);
        menu.setPosition(x || 0, y || 0);
        if (opts && opts.alignVertically !== undefined) menu.alignItemsVerticallyWithPadding(opts.alignVertically);
        if (opts && opts.alignHorizontally !== undefined) menu.alignItemsHorizontallyWithPadding(opts.alignHorizontally);
        B._applyOpts(menu, opts);
        parent.addChild(menu, (opts && opts.zOrder) || 1);
        return menu;
    };

})(UIBuilder);
