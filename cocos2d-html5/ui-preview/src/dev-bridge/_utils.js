/**
 * dev-bridge/_utils.js — Shared helpers, class detection, type icons
 */
(function () {
    "use strict";

    var B = window.__devBridge;

    // ─── Type Icons ────────────────────────────────────────────
    B.data.typeIcons = {
        "cc.Scene": "🎬", "cc.Layer": "📦", "cc.LayerColor": "🎨",
        "cc.Sprite": "🖼", "cc.LabelTTF": "🏷", "cc.LabelBMFont": "🏷",
        "cc.Menu": "📋", "cc.MenuItem": "🔘", "cc.MenuItemImage": "🔘",
        "cc.MenuItemLabel": "🔘", "cc.DrawNode": "✏️",
        "cc.ParticleSystem": "✨", "cc.ProgressTimer": "⏳",
        "ccui.Button": "🔘", "ccui.Text": "🏷", "ccui.ImageView": "🖼",
        "ccui.Layout": "📦", "ccui.ScrollView": "📜", "ccui.ListView": "📜",
        "ccui.PageView": "📑", "ccui.CheckBox": "☑️", "ccui.Slider": "🎚",
        "ccui.TextField": "📝", "ccui.LoadingBar": "📊",
        "ccui.RichText": "📄", "ccui.Scale9Sprite": "🖼"
    };

    // ─── Utilities ─────────────────────────────────────────────
    B.fn.escHtml = function (str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    B.fn.toHex = function (n) {
        var h = n.toString(16);
        return h.length < 2 ? "0" + h : h;
    };

    // ─── Class Name Detection ──────────────────────────────────
    B.fn.getClassName = function (node) {
        if (typeof ccui !== "undefined") {
            if (ccui.Button && node instanceof ccui.Button) return "ccui.Button";
            if (ccui.Text && node instanceof ccui.Text) return "ccui.Text";
            if (ccui.ImageView && node instanceof ccui.ImageView) return "ccui.ImageView";
            if (ccui.ListView && node instanceof ccui.ListView) return "ccui.ListView";
            if (ccui.ScrollView && node instanceof ccui.ScrollView) return "ccui.ScrollView";
            if (ccui.PageView && node instanceof ccui.PageView) return "ccui.PageView";
            if (ccui.Layout && node instanceof ccui.Layout) return "ccui.Layout";
            if (ccui.CheckBox && node instanceof ccui.CheckBox) return "ccui.CheckBox";
            if (ccui.Slider && node instanceof ccui.Slider) return "ccui.Slider";
            if (ccui.TextField && node instanceof ccui.TextField) return "ccui.TextField";
            if (ccui.LoadingBar && node instanceof ccui.LoadingBar) return "ccui.LoadingBar";
            if (ccui.RichText && node instanceof ccui.RichText) return "ccui.RichText";
            if (ccui.Scale9Sprite && node instanceof ccui.Scale9Sprite) return "ccui.Scale9Sprite";
        }
        if (cc.Scene && node instanceof cc.Scene) return "cc.Scene";
        if (cc.LayerColor && node instanceof cc.LayerColor) return "cc.LayerColor";
        if (cc.Layer && node instanceof cc.Layer) return "cc.Layer";
        if (cc.LabelTTF && node instanceof cc.LabelTTF) return "cc.LabelTTF";
        if (cc.LabelBMFont && node instanceof cc.LabelBMFont) return "cc.LabelBMFont";
        if (cc.ProgressTimer && node instanceof cc.ProgressTimer) return "cc.ProgressTimer";
        if (cc.Sprite && node instanceof cc.Sprite) return "cc.Sprite";
        if (cc.DrawNode && node instanceof cc.DrawNode) return "cc.DrawNode";
        if (cc.MenuItemImage && node instanceof cc.MenuItemImage) return "cc.MenuItemImage";
        if (cc.MenuItemLabel && node instanceof cc.MenuItemLabel) return "cc.MenuItemLabel";
        if (cc.MenuItem && node instanceof cc.MenuItem) return "cc.MenuItem";
        if (cc.Menu && node instanceof cc.Menu) return "cc.Menu";
        if (cc.ParticleSystem && node instanceof cc.ParticleSystem) return "cc.ParticleSystem";
        if (node.constructor && node.constructor.name &&
            node.constructor.name !== "Object" && node.constructor.name !== "Class") {
            return node.constructor.name;
        }
        return "cc.Node";
    };

    // ─── Node Path ─────────────────────────────────────────────
    B.fn.getNodePathFull = function (node) {
        var parts = [];
        var cur = node;
        while (cur) {
            parts.unshift(cur.getName() || B.fn.getClassName(cur));
            cur = cur.getParent();
        }
        return parts.join("/");
    };
})();
