/**
 * UIBuilder — Input Controls
 */
(function (B) {

    /**
     * Create a ccui.TextField.
     * @param {cc.Node} parent
     * @param {string}  placeholder
     * @param {string}  fontName
     * @param {number}  fontSize
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: maxLength, passwordEnabled, passwordChar, textColor, placeHolderColor, callback
     * @returns {ccui.TextField}
     */
    B.createTextField = function (parent, placeholder, fontName, fontSize, x, y, opts) {
        var tf = new ccui.TextField(placeholder, fontName, fontSize);
        tf.setPosition(x, y);
        if (opts && opts.maxLength) {
            tf.setMaxLengthEnabled(true);
            tf.setMaxLength(opts.maxLength);
        }
        if (opts && opts.passwordEnabled) {
            tf.setPasswordEnabled(true);
            tf.setPasswordStyleText(opts.passwordChar || "•");
        }
        if (opts && opts.textColor) tf.setTextColor(opts.textColor);
        if (opts && opts.placeHolderColor) tf.setPlaceHolderColor(opts.placeHolderColor);
        if (opts && opts.callback) tf.addEventListener(opts.callback);
        B._applyOpts(tf, opts);
        parent.addChild(tf, (opts && opts.zOrder) || 0);
        return tf;
    };

    /**
     * Create a ccui.CheckBox.
     * @param {cc.Node}   parent
     * @param {string}    bgImg           Background image
     * @param {string}    crossImg        Cross / check mark image
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  [callback]     function(checkbox, eventType)
     * @param {Object}    [opts]  Extra: bgSelectedImg, bgDisabledImg, crossDisabledImg, selected (bool)
     * @returns {ccui.CheckBox}
     */
    B.createCheckBox = function (parent, bgImg, crossImg, x, y, callback, opts) {
        opts = opts || {};
        var cb = new ccui.CheckBox(
            bgImg,
            opts.bgSelectedImg || "",
            crossImg,
            opts.bgDisabledImg || "",
            opts.crossDisabledImg || ""
        );
        cb.setPosition(x, y);
        if (opts.selected !== undefined) cb.setSelected(opts.selected);
        if (callback) cb.addEventListener(callback);
        B._applyOpts(cb, opts);
        parent.addChild(cb, opts.zOrder || 0);
        return cb;
    };

    /**
     * Create a ccui.Slider.
     * @param {cc.Node}   parent
     * @param {string}    barImg          Bar texture
     * @param {string}    ballImg         Ball (thumb) normal texture
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  [callback]      function(slider, eventType)
     * @param {Object}    [opts]  Extra: progressBarImg, ballPressedImg, ballDisabledImg, percent (0-100)
     * @returns {ccui.Slider}
     */
    B.createSlider = function (parent, barImg, ballImg, x, y, callback, opts) {
        opts = opts || {};
        var slider = new ccui.Slider();
        slider.loadBarTexture(barImg);
        slider.loadSlidBallTextureNormal(ballImg);
        if (opts.progressBarImg) slider.loadProgressBarTexture(opts.progressBarImg);
        if (opts.ballPressedImg) slider.loadSlidBallTexturePressed(opts.ballPressedImg);
        if (opts.ballDisabledImg) slider.loadSlidBallTextureDisabled(opts.ballDisabledImg);
        slider.setPosition(x, y);
        if (opts.percent !== undefined) slider.setPercent(opts.percent);
        if (callback) slider.addEventListener(callback);
        B._applyOpts(slider, opts);
        parent.addChild(slider, opts.zOrder || 0);
        return slider;
    };

})(UIBuilder);
