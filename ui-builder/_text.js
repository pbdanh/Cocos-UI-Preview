/**
 * UIBuilder — Text & Labels
 */
(function (B) {

    /**
     * Create a cc.LabelTTF.
     * @param {cc.Node} parent
     * @param {string}  text
     * @param {number}  fontSize
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: fontName (default "Arial"), color
     * @returns {cc.LabelTTF}
     */
    B.createLabel = function (parent, text, fontSize, x, y, opts) {
        var fontName = (opts && opts.fontName) || "Arial";
        var label = new cc.LabelTTF(text, fontName, fontSize);
        label.setPosition(x, y);
        B._applyOpts(label, opts);
        parent.addChild(label, (opts && opts.zOrder) || 0);
        return label;
    };



    /**
     * Create a cc.LabelBMFont (bitmap font label).
     * @param {cc.Node} parent
     * @param {string}  text
     * @param {string}  fntFile   Path to .fnt file
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]
     * @returns {cc.LabelBMFont}
     */
    B.createLabelBMFont = function (parent, text, fntFile, x, y, opts) {
        var label = new cc.LabelBMFont(text, fntFile);
        label.setPosition(x, y);
        B._applyOpts(label, opts);
        parent.addChild(label, (opts && opts.zOrder) || 0);
        return label;
    };

    /**
     * Create a ccui.Text widget.
     * @param {cc.Node} parent
     * @param {string}  text
     * @param {string}  fontName
     * @param {number}  fontSize
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: textColor, areaWidth, areaHeight, hAlign, vAlign
     * @returns {ccui.Text}
     */
    B.createText = function (parent, text, fontName, fontSize, x, y, opts) {
        var t = new ccui.Text(text, fontName, fontSize);
        t.setPosition(x, y);
        if (opts && opts.textColor) t.setTextColor(opts.textColor);
        if (opts && opts.areaWidth && opts.areaHeight) {
            t.setTextAreaSize(cc.size(opts.areaWidth, opts.areaHeight));
        }
        if (opts && opts.hAlign !== undefined) t.setTextHorizontalAlignment(opts.hAlign);
        if (opts && opts.vAlign !== undefined) t.setTextVerticalAlignment(opts.vAlign);
        B._applyOpts(t, opts);
        parent.addChild(t, (opts && opts.zOrder) || 0);
        return t;
    };



    /**
     * Create a ccui.RichText container.
     * @param {cc.Node} parent
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]   Extra: width (content width for wrapping)
     * @returns {ccui.RichText}
     */
    B.createRichText = function (parent, x, y, opts) {
        var rt = new ccui.RichText();
        rt.setPosition(x, y);
        if (opts && opts.width) {
            rt.ignoreContentAdaptWithSize(false);
            rt.setContentSize(opts.width, 0);
        }
        B._applyOpts(rt, opts);
        parent.addChild(rt, (opts && opts.zOrder) || 0);
        return rt;
    };

    /**
     * Add a rich element to a ccui.RichText.
     * @param {ccui.RichText} richText
     * @param {string}        type   "text" | "image" | "custom"
     * @param {Object}        opts
     *   For "text":   { text, fontName, fontSize, color }
     *   For "image":  { file, texType }
     *   For "custom": { node }
     */
    B.addRichElement = function (richText, type, opts) {
        opts = opts || {};
        var el;
        if (type === "text") {
            el = new ccui.RichElementText(
                0,
                opts.color || cc.color.WHITE,
                255,
                opts.text || "",
                opts.fontName || "Arial",
                opts.fontSize || 16
            );
        } else if (type === "image") {
            el = new ccui.RichElementImage(
                0,
                cc.color.WHITE,
                255,
                opts.file || "",
                opts.texType || ""
            );
        } else if (type === "custom") {
            el = new ccui.RichElementCustomNode(0, cc.color.WHITE, 255, opts.node);
        }
        if (el) richText.pushBackElement(el);
        return el;
    };

})(UIBuilder);
