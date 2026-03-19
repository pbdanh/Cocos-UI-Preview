/**
 * UIBuilder — High-Level Composite APIs
 *
 * CSS-like layout helpers, composite widgets, and a declarative builder
 * that make it as easy for AI agents to create cocos2d UIs as writing HTML.
 */
(function (B) {

    // ───────────────────────────────────────────────────────────────
    //  CONTAINER / NODE HELPERS
    // ───────────────────────────────────────────────────────────────

    /**
     * Create an empty cc.Node container (the equivalent of <div>).
     * @param {cc.Node} parent
     * @param {number}  [x]   Default 0
     * @param {number}  [y]   Default 0
     * @param {Object}  [opts]
     * @returns {cc.Node}
     */
    B.createNode = function (parent, x, y, opts) {
        var node = new cc.Node();
        node.setPosition(x || 0, y || 0);
        B._applyOpts(node, opts);
        if (parent) parent.addChild(node, (opts && opts.zOrder) || 0);
        return node;
    };

    /**
     * Create a cc.ClippingNode with stencil.
     * @param {cc.Node}  parent
     * @param {cc.Node}  stencil    The stencil node (DrawNode, Sprite, etc.)
     * @param {number}   x
     * @param {number}   y
     * @param {Object}   [opts]  Extra: inverted (bool), alphaThreshold (0-1)
     * @returns {cc.ClippingNode}
     */
    B.createClippingNode = function (parent, stencil, x, y, opts) {
        var cn = new cc.ClippingNode(stencil);
        cn.setPosition(x, y);
        if (opts && opts.inverted !== undefined) cn.setInverted(opts.inverted);
        if (opts && opts.alphaThreshold !== undefined) cn.setAlphaThreshold(opts.alphaThreshold);
        B._applyOpts(cn, opts);
        parent.addChild(cn, (opts && opts.zOrder) || 0);
        return cn;
    };

    // NOTE: createRow, createColumn, createGrid have been removed.
    //       Use UIBuilder.arrangeAsRow/Column/Grid from _layout.js instead.

    /**
     * Evenly distribute existing children within a range.
     * ⚠️ WARNING: This divides center points evenly WITHOUT considering item sizes.
     * If items are wider than slot width, they WILL overlap. For size-aware spacing,
     * use spaceBetween() instead, or use createRow()/createColumn() for tight packing.
     * @param {cc.Node}  parent      Parent containing children
     * @param {Array}    children    Array of child nodes (already in parent)
     * @param {string}   direction   "horizontal" | "vertical"
     * @param {Object}   [opts]      Extra: startX/Y, endX/Y (defaults to parent bounds), margin
     */
    B.distribute = function (parent, children, direction, opts) {
        opts = opts || {};
        var ps = parent.getContentSize();
        var margin = opts.margin || 0;
        var n = children.length;
        if (n === 0) return;

        if (direction === "horizontal") {
            var sx = (opts.startX !== undefined) ? opts.startX : margin;
            var ex = (opts.endX !== undefined) ? opts.endX : (ps.width - margin);
            var slotW = (ex - sx) / n;
            for (var i = 0; i < n; i++) {
                var oldPos = children[i].getPosition();
                children[i].setPosition(sx + slotW * i + slotW / 2, oldPos.y);
            }
        } else {
            var sy = (opts.startY !== undefined) ? opts.startY : margin;
            var ey = (opts.endY !== undefined) ? opts.endY : (ps.height - margin);
            var slotH = (ey - sy) / n;
            for (var j = 0; j < n; j++) {
                var oPos = children[j].getPosition();
                children[j].setPosition(oPos.x, ey - slotH * j - slotH / 2);
            }
        }
    };

    /**
     * Space-between layout — distributes children so edges don't overlap.
     * Unlike distribute(), this accounts for each item's actual contentSize × scale.
     * Behaves like CSS `justify-content: space-between`.
     * @param {cc.Node}  parent      Parent containing children (already added)
     * @param {Array}    children    Array of child nodes
     * @param {string}   direction   "horizontal" | "vertical"
     * @param {Object}   [opts]      margin (outer padding from parent edges)
     */
    B.spaceBetween = function (parent, children, direction, opts) {
        opts = opts || {};
        var ps = parent.getContentSize();
        var margin = opts.margin || 0;
        var n = children.length;
        if (n === 0) return;
        if (n === 1) {
            // Single item → center it
            var ch = children[0];
            if (direction === "horizontal") {
                ch.setPosition(ps.width / 2, ch.getPosition().y);
            } else {
                ch.setPosition(ch.getPosition().x, ps.height / 2);
            }
            return;
        }

        if (direction === "horizontal") {
            var totalW = 0;
            var sizes = [];
            for (var i = 0; i < n; i++) {
                var cs = children[i].getContentSize();
                var sc = children[i].getScaleX();
                var w = cs.width * sc;
                sizes.push(w);
                totalW += w;
            }
            var range = ps.width - 2 * margin;
            var gap = (range - totalW) / (n - 1);
            if (gap < 0) gap = 0; // fallback: items too large, pack tightly

            var cursor = margin;
            for (var j = 0; j < n; j++) {
                var anchor = children[j].getAnchorPoint();
                var posX = cursor + sizes[j] * anchor.x;
                children[j].setPosition(posX, children[j].getPosition().y);
                cursor += sizes[j] + gap;
            }
        } else {
            var totalH = 0;
            var hSizes = [];
            for (var k = 0; k < n; k++) {
                var csV = children[k].getContentSize();
                var scV = children[k].getScaleY();
                var h = csV.height * scV;
                hSizes.push(h);
                totalH += h;
            }
            var rangeV = ps.height - 2 * margin;
            var gapV = (rangeV - totalH) / (n - 1);
            if (gapV < 0) gapV = 0;

            // Top to bottom
            var cursorV = ps.height - margin;
            for (var m = 0; m < n; m++) {
                var anchorV = children[m].getAnchorPoint();
                var posY = cursorV - hSizes[m] * (1 - anchorV.y);
                children[m].setPosition(children[m].getPosition().x, posY);
                cursorV -= hSizes[m] + gapV;
            }
        }
    };

    /**
     * Stack children at the same position (overlapping).
     * @param {cc.Node}  parent
     * @param {Array}    children
     * @param {number}   x
     * @param {number}   y
     * @param {Object}   [opts]
     * @returns {cc.Node}
     */
    B.stack = function (parent, children, x, y, opts) {
        var container = new cc.Node();
        container.setPosition(x, y);
        for (var i = 0; i < children.length; i++) {
            children[i].setPosition(0, 0);
            container.addChild(children[i], i);
        }
        B._applyOpts(container, opts);
        parent.addChild(container, (opts && opts.zOrder) || 0);
        return container;
    };

    /**
     * Multi-child alignment utility.
     * @param {Array}   nodes
     * @param {string}  type   "left"|"right"|"top"|"bottom"|"centerX"|"centerY"
     * @param {number}  [value]  Target position (defaults to average)
     */
    B.align = function (nodes, type, value) {
        if (nodes.length === 0) return;
        var val = value;

        // Calculate default value if not provided
        if (val === undefined) {
            var sum = 0;
            for (var i = 0; i < nodes.length; i++) {
                var p = nodes[i].getPosition();
                if (type === "left" || type === "right" || type === "centerX") sum += p.x;
                else sum += p.y;
            }
            val = sum / nodes.length;
        }

        for (var j = 0; j < nodes.length; j++) {
            var pos = nodes[j].getPosition();
            if (type === "left" || type === "right" || type === "centerX") {
                nodes[j].setPosition(val, pos.y);
            } else {
                nodes[j].setPosition(pos.x, val);
            }
        }
    };

    // ───────────────────────────────────────────────────────────────
    //  COMPOSITE WIDGETS
    // ───────────────────────────────────────────────────────────────

    /**
     * Create a full modal popup with dimming overlay, panel, title, and close button.
     *
     * @param {cc.Node} parent
     * @param {Object}  opts
     *   title        : string   — popup title text
     *   width        : number   — panel width (default 400)
     *   height       : number   — panel height (default 500)
     *   bgColor      : cc.Color — dimming overlay color (default black 180 alpha)
     *   panelImg     : string   — scale9 panel background image
     *   panelCapInsets: cc.Rect  — capInsets for scale9
     *   panelColor   : cc.Color — solid color if no image (default white 240)
     *   titleFontSize: number   — default 28
     *   titleColor   : cc.Color — default dark grey
     *   closeImg     : string   — close button image
     *   onClose      : Function — close callback (default: remove popup)
     *   fadeIn       : number   — entrance fade duration (default 0.25)
     * @returns {{ root: cc.Node, panel: cc.Node, content: cc.Node }}
     *          root   = the overlay layer
     *          panel  = the background panel node
     *          content = a cc.Node inside panel for adding custom content
     */
    B.createPopup = function (parent, opts) {
        opts = opts || {};
        var w = opts.width || 400;
        var h = opts.height || 500;
        var cx = cc.winSize.width / 2;
        var cy = cc.winSize.height / 2;

        // Overlay
        var dimColor = opts.bgColor || cc.color(0, 0, 0, 180);
        var overlay = new cc.LayerColor(dimColor, cc.winSize.width, cc.winSize.height);
        overlay.setLocalZOrder(opts.zOrder || 100);
        parent.addChild(overlay);

        // Block touches behind popup
        B.addTouchListener(overlay, {
            onBegan: function () { return true; }
        });

        // Panel
        var panel;
        if (opts.panelImg) {
            var capInsets = opts.panelCapInsets || cc.rect(20, 20, 20, 20);
            panel = new ccui.Scale9Sprite(opts.panelImg, cc.rect(0, 0, 0, 0), capInsets);
            panel.setContentSize(w, h);
        } else {
            // DrawNode panel with rounded feel
            panel = new cc.DrawNode();
            var color = opts.panelColor || cc.color(240, 240, 240, 255);
            panel.drawRect(cc.p(-w / 2, -h / 2), cc.p(w / 2, h / 2), color, 2, cc.color(200, 200, 200));
            panel.setContentSize(w, h);
        }
        panel.setPosition(cx, cy);
        overlay.addChild(panel, 1);

        // Title
        if (opts.title) {
            var titleSize = opts.titleFontSize || 28;
            var titleColor = opts.titleColor || cc.color(50, 50, 50);
            var titleLabel = new cc.LabelTTF(opts.title, "Arial", titleSize);
            titleLabel.setColor(titleColor);
            titleLabel.setPosition(cx, cy + h / 2 - 40);
            overlay.addChild(titleLabel, 2);
        }

        // Close button
        var closeFn = opts.onClose || function () {
            overlay.runAction(cc.sequence(
                cc.fadeOut(0.15),
                cc.callFunc(function () { overlay.removeFromParent(true); })
            ));
        };
        if (opts.closeImg) {
            B.createButton(overlay, opts.closeImg, cx + w / 2 - 25, cy + h / 2 - 25, closeFn, { zOrder: 3 });
        } else {
            // Default X button using label
            var closeItem = new cc.LabelTTF("✕", "Arial", 22);
            var closeBtn = new cc.MenuItemLabel(closeItem, closeFn);
            var closeMenu = new cc.Menu(closeBtn);
            closeMenu.setPosition(0, 0);
            closeBtn.setPosition(cx + w / 2 - 25, cy + h / 2 - 25);
            closeBtn.setColor(cc.color(100, 100, 100));
            overlay.addChild(closeMenu, 3);
        }

        // Content area node
        var content = new cc.Node();
        content.setPosition(cx, cy);
        content.setContentSize(w - 40, h - 80);
        overlay.addChild(content, 2);

        // Fade in
        var fadeDur = (opts.fadeIn !== undefined) ? opts.fadeIn : 0.25;
        if (fadeDur > 0) {
            overlay.setOpacity(0);
            overlay.setCascadeOpacityEnabled(true);
            overlay.runAction(cc.fadeIn(fadeDur));
        }

        return { root: overlay, panel: panel, content: content };
    };

    /**
     * Create a tab bar with content switching.
     * @param {cc.Node}  parent
     * @param {Array}    tabs      Array of { title: string, content: cc.Node }
     *                              or { img: string, content: cc.Node }
     * @param {number}   x
     * @param {number}   y
     * @param {Object}   [opts]    Extra: tabWidth, tabHeight, fontSize, activeColor, inactiveColor, gap
     * @returns {{ container: cc.Node, switchTo: function(index) }}
     */
    B.createTabBar = function (parent, tabs, x, y, opts) {
        opts = opts || {};
        var tabW = opts.tabWidth || 100;
        var tabH = opts.tabHeight || 40;
        var fontSize = opts.fontSize || 18;
        var activeColor = opts.activeColor || cc.color(60, 120, 255);
        var inactiveColor = opts.inactiveColor || cc.color(180, 180, 180);
        var gap = (opts.gap !== undefined) ? opts.gap : 2;
        var container = new cc.Node();
        container.setPosition(x, y);

        var tabNodes = [];
        var contentNodes = [];
        var activeIndex = 0;

        function switchTo(idx) {
            for (var k = 0; k < tabs.length; k++) {
                if (contentNodes[k]) contentNodes[k].setVisible(k === idx);
                if (tabNodes[k]) {
                    tabNodes[k].bg.clear();
                    var bgCol = (k === idx) ? activeColor : inactiveColor;
                    tabNodes[k].bg.drawRect(
                        cc.p(-tabW / 2, -tabH / 2), cc.p(tabW / 2, tabH / 2),
                        bgCol, 0, bgCol
                    );
                    if (tabNodes[k].label) {
                        tabNodes[k].label.setColor(k === idx ? cc.color.WHITE : cc.color(80, 80, 80));
                    }
                }
            }
            activeIndex = idx;
        }

        var totalW = tabs.length * tabW + (tabs.length - 1) * gap;
        for (var i = 0; i < tabs.length; i++) {
            (function (tab, index) {
                var tx = -totalW / 2 + index * (tabW + gap) + tabW / 2;
                var bg = new cc.DrawNode();
                var col = (index === 0) ? activeColor : inactiveColor;
                bg.drawRect(cc.p(-tabW / 2, -tabH / 2), cc.p(tabW / 2, tabH / 2), col, 0, col);
                bg.setPosition(tx, 0);
                container.addChild(bg, 1);

                var label = null;
                if (tab.title) {
                    label = new cc.LabelTTF(tab.title, "Arial", fontSize);
                    label.setPosition(tx, 0);
                    label.setColor(index === 0 ? cc.color.WHITE : cc.color(80, 80, 80));
                    container.addChild(label, 2);
                }

                tabNodes.push({ bg: bg, label: label });

                // Touch on tab
                B.addTouchListener(bg, {
                    onBegan: function (touch) {
                        var loc = touch.getLocation();
                        var nodePos = bg.convertToNodeSpace(loc);
                        if (Math.abs(nodePos.x) <= tabW / 2 && Math.abs(nodePos.y) <= tabH / 2) {
                            switchTo(index);
                            return true;
                        }
                        return false;
                    }
                });

                // Content
                if (tab.content) {
                    tab.content.setVisible(index === 0);
                    contentNodes.push(tab.content);
                    container.addChild(tab.content, 0);
                } else {
                    contentNodes.push(null);
                }
            })(tabs[i], i);
        }

        B._applyOpts(container, opts);
        parent.addChild(container, (opts && opts.zOrder) || 0);
        return { container: container, switchTo: switchTo };
    };

    /**
     * Create a bottom/top navigation bar with icon buttons.
     * @param {cc.Node}  parent
     * @param {Array}    items   Array of { img: string, label: string, onClick: Function }
     * @param {Object}   [opts]  Extra: y (default 50), bgColor, height (default 100), iconScale
     * @returns {cc.Node}
     */
    B.createNavBar = function (parent, items, opts) {
        opts = opts || {};
        var barH = opts.height || 100;
        var barY = (opts.y !== undefined) ? opts.y : barH / 2;
        var bgColor = opts.bgColor || cc.color(30, 30, 50, 240);
        var sw = cc.winSize.width;
        var iconScale = opts.iconScale || 0.7;

        // Background
        var bg = new cc.DrawNode();
        bg.drawRect(cc.p(0, 0), cc.p(sw, barH), bgColor, 0, bgColor);
        bg.setPosition(0, barY - barH / 2);
        parent.addChild(bg, (opts && opts.zOrder) || 10);

        // Buttons
        var slotW = sw / items.length;
        for (var i = 0; i < items.length; i++) {
            (function (item, index) {
                var bx = slotW * index + slotW / 2;
                if (item.img) {
                    var btn = B.createButton(parent, item.img, bx, barY + (item.label ? 8 : 0),
                        item.onClick || function () { },
                        { scale: iconScale, zOrder: (opts.zOrder || 10) + 1, name: item.label || ("nav_" + index) }
                    );
                }
                if (item.label) {
                    B.createLabel(parent, item.label, 11, bx, barY - 25, {
                        color: cc.color(200, 200, 200),
                        zOrder: (opts.zOrder || 10) + 1
                    });
                }
            })(items[i], i);
        }

        return bg;
    };

    /**
     * Create a temporary toast notification that auto-dismisses.
     * @param {cc.Node}  parent
     * @param {string}   message
     * @param {Object}   [opts]  Extra: duration (default 2s), fontSize (default 18),
     *                           bgColor, textColor, y (default center)
     * @returns {cc.Node}
     */
    B.createToast = function (parent, message, opts) {
        opts = opts || {};
        var duration = (opts.duration !== undefined) ? opts.duration : 2;
        var fontSize = opts.fontSize || 18;
        var cx = cc.winSize.width / 2;
        var cy = (opts.y !== undefined) ? opts.y : (cc.winSize.height * 0.3);

        var container = new cc.Node();
        container.setPosition(cx, cy);

        // Measure text to create background
        var tempLabel = new cc.LabelTTF(message, "Arial", fontSize);
        var ts = tempLabel.getContentSize();
        var padX = 30, padY = 16;

        // Background
        var bgColor = opts.bgColor || cc.color(40, 40, 40, 220);
        var bg = new cc.DrawNode();
        bg.drawRect(
            cc.p(-(ts.width + padX) / 2, -(ts.height + padY) / 2),
            cc.p((ts.width + padX) / 2, (ts.height + padY) / 2),
            bgColor, 0, bgColor
        );
        container.addChild(bg);

        // Label
        var label = new cc.LabelTTF(message, "Arial", fontSize);
        label.setColor(opts.textColor || cc.color.WHITE);
        container.addChild(label, 1);

        parent.addChild(container, opts.zOrder || 200);

        // Entrance
        container.setOpacity(0);
        container.setCascadeOpacityEnabled(true);
        container.runAction(cc.sequence(
            cc.fadeIn(0.2),
            cc.delayTime(duration),
            cc.fadeOut(0.3),
            cc.callFunc(function () { container.removeFromParent(true); })
        ));

        return container;
    };

    /**
     * Create a card component (image + title + description).
     * @param {cc.Node}  parent
     * @param {Object}   opts
     *   img         : string   — card image
     *   title       : string   — card title
     *   desc        : string   — card description
     *   width       : number   — card width (default 200)
     *   height      : number   — card height (default 280)
     *   x, y        : number   — position
     *   bgColor     : cc.Color — card bg (default white)
     *   onClick     : Function — tap callback
     * @returns {cc.Node}
     */
    B.createCard = function (parent, opts) {
        opts = opts || {};
        var w = opts.width || 200;
        var h = opts.height || 280;
        var x = opts.x || 0;
        var y = opts.y || 0;
        var bgColor = opts.bgColor || cc.color(255, 255, 255, 240);

        var card = new cc.Node();
        card.setPosition(x, y);
        card.setContentSize(w, h);

        // Background
        var bg = new cc.DrawNode();
        bg.drawRect(cc.p(-w / 2, -h / 2), cc.p(w / 2, h / 2), bgColor, 1, cc.color(200, 200, 200));
        card.addChild(bg);

        // Image
        if (opts.img) {
            var img = new cc.Sprite(opts.img);
            var imgSize = img.getContentSize();
            var imgScale = Math.min((w - 20) / imgSize.width, (h * 0.5) / imgSize.height);
            img.setScale(imgScale);
            img.setPosition(0, h / 2 - (h * 0.25) - 10);
            card.addChild(img, 1);
        }

        // Title
        if (opts.title) {
            var title = new cc.LabelTTF(opts.title, "Arial", opts.titleFontSize || 16);
            title.setColor(opts.titleColor || cc.color(30, 30, 30));
            title.setPosition(0, -h * 0.05);
            card.addChild(title, 1);
        }

        // Description
        if (opts.desc) {
            var desc = new cc.LabelTTF(opts.desc, "Arial", opts.descFontSize || 12);
            desc.setColor(opts.descColor || cc.color(120, 120, 120));
            desc.setPosition(0, -h * 0.2);
            desc.setDimensions(cc.size(w - 20, 0));
            desc.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            card.addChild(desc, 1);
        }

        // Click handler
        if (opts.onClick) {
            B.addTouchListener(card, {
                onBegan: function (touch) {
                    var loc = card.convertToNodeSpace(touch.getLocation());
                    return (Math.abs(loc.x) <= w / 2 && Math.abs(loc.y) <= h / 2);
                },
                onEnded: function () { opts.onClick(); }
            });
        }

        B._applyOpts(card, opts);
        parent.addChild(card, (opts && opts.zOrder) || 0);
        return card;
    };

    /**
     * Create a notification badge on any existing node.
     * @param {cc.Node}  targetNode   The node to attach badge to
     * @param {number}   count        Badge number (0 hides badge)
     * @param {Object}   [opts]       Extra: bgColor, textColor, fontSize, offsetX, offsetY
     * @returns {cc.Node} The badge node
     */
    B.createBadge = function (targetNode, count, opts) {
        opts = opts || {};
        var radius = opts.radius || 14;
        var fontSize = opts.fontSize || 12;
        var bgColor = opts.bgColor || cc.color(255, 60, 60);
        var textColor = opts.textColor || cc.color.WHITE;
        var size = targetNode.getContentSize();
        var ox = (opts.offsetX !== undefined) ? opts.offsetX : size.width / 2;
        var oy = (opts.offsetY !== undefined) ? opts.offsetY : size.height / 2;

        var badge = new cc.Node();

        var bg = new cc.DrawNode();
        bg.drawDot(cc.p(0, 0), radius, bgColor);
        badge.addChild(bg);

        var label = new cc.LabelTTF(count.toString(), "Arial", fontSize);
        label.setColor(textColor);
        badge.addChild(label, 1);

        badge.setPosition(ox, oy);
        badge.setVisible(count > 0);
        badge._badgeLabel = label;
        badge._badgeBg = bg;

        /**
         * Update badge count programmatically.
         */
        badge.updateCount = function (n) {
            label.setString(n.toString());
            badge.setVisible(n > 0);
        };

        targetNode.addChild(badge, 100);
        return badge;
    };

    /**
     * Create a toggle button with on/off visual states.
     * @param {cc.Node}   parent
     * @param {Object}    opts
     *   onImg       : string — image for "on" state
     *   offImg      : string — image for "off" state
     *   x, y        : number
     *   isOn        : boolean (default false)
     *   onChange     : function(isOn)
     * @returns {{ node: ccui.Button, isOn: function, setOn: function(bool) }}
     */
    B.createToggleButton = function (parent, opts) {
        opts = opts || {};
        var isOn = opts.isOn || false;
        var onImg = opts.onImg || opts.offImg || "";
        var offImg = opts.offImg || opts.onImg || "";

        var btn = new ccui.Button(isOn ? onImg : offImg);
        btn.setPosition(opts.x || 0, opts.y || 0);

        function updateVisual() {
            btn.loadTextureNormal(isOn ? onImg : offImg);
        }

        btn.addClickEventListener(function () {
            isOn = !isOn;
            updateVisual();
            if (opts.onChange) opts.onChange(isOn);
        });

        B._applyOpts(btn, opts);
        parent.addChild(btn, (opts && opts.zOrder) || 0);

        return {
            node: btn,
            isOn: function () { return isOn; },
            setOn: function (val) {
                isOn = val;
                updateVisual();
            }
        };
    };

    /**
     * Create an iOS-style toggle switch using DrawNode.
     * @param {cc.Node}   parent
     * @param {number}    x
     * @param {number}    y
     * @param {Function}  [callback]   function(isOn)
     * @param {Object}    [opts]       Extra: isOn, width, height, onColor, offColor
     * @returns {{ node: cc.Node, isOn: function, setOn: function(bool) }}
     */
    B.createSwitch = function (parent, x, y, callback, opts) {
        opts = opts || {};
        var w = opts.width || 60;
        var h = opts.height || 30;
        var r = h / 2;
        var onColor = opts.onColor || cc.color(76, 217, 100);
        var offColor = opts.offColor || cc.color(200, 200, 200);
        var isOn = opts.isOn || false;

        var container = new cc.Node();
        container.setPosition(x, y);
        container.setContentSize(w, h);

        var track = new cc.DrawNode();
        var knob = new cc.DrawNode();
        knob.drawDot(cc.p(0, 0), r - 3, cc.color.WHITE);

        function drawTrack() {
            track.clear();
            var col = isOn ? onColor : offColor;
            // Draw rounded rect as two circles + rect
            track.drawDot(cc.p(-w / 2 + r, 0), r, col);
            track.drawDot(cc.p(w / 2 - r, 0), r, col);
            track.drawRect(cc.p(-w / 2 + r, -r), cc.p(w / 2 - r, r), col, 0, col);
            // Knob position
            var kx = isOn ? (w / 2 - r) : (-w / 2 + r);
            knob.stopAllActions();
            knob.runAction(cc.moveTo(0.15, kx, 0));
        }

        container.addChild(track);
        container.addChild(knob, 1);
        drawTrack();

        // Initial knob position (instant, no animation)
        knob.setPosition(isOn ? (w / 2 - r) : (-w / 2 + r), 0);

        B.addTouchListener(container, {
            onBegan: function (touch) {
                var loc = container.convertToNodeSpace(touch.getLocation());
                return (Math.abs(loc.x) <= w / 2 && Math.abs(loc.y) <= h / 2);
            },
            onEnded: function () {
                isOn = !isOn;
                drawTrack();
                if (callback) callback(isOn);
            }
        });

        B._applyOpts(container, opts);
        parent.addChild(container, (opts && opts.zOrder) || 0);

        return {
            node: container,
            isOn: function () { return isOn; },
            setOn: function (val) {
                isOn = val;
                drawTrack();
                knob.setPosition(isOn ? (w / 2 - r) : (-w / 2 + r), 0);
            }
        };
    };

    // ───────────────────────────────────────────────────────────────
    //  DECLARATIVE BUILDER — the key feature for AI agents
    // ───────────────────────────────────────────────────────────────

    /**
     * Build an entire UI tree from a JSON-like declaration.
     * This is the "HTML for cocos2d" — AI agents can describe UI as a tree
     * and UIBuilder.build() will create all nodes.
     *
     * Each node in the tree is an object with:
     *   type     : string (required) — node type identifier
     *   children : Array  (optional) — child node descriptors
     *   ref      : string (optional) — key name to store in returned refs object
     *   ...other properties specific to the type
     *
     * Supported types:
     *   "node"       — empty container
     *   "sprite"     — { file, x, y, ...opts }
     *   "label"      — { text, fontSize, x, y, fontName, ...opts }
     *   "text"       — { text, fontName, fontSize, x, y, ...opts }
     *   "button"     — { img, x, y, onClick, title, titleFontSize, titleColor, ...opts }
     *   "imageView"  — { file, x, y, ...opts }
     *   "rect"       — { w, h, x, y, color, ...opts }
     *   "circle"     — { radius, x, y, color, ...opts }
     *   "colorLayer" — { color, w, h, ...opts }
     *   "scale9"     — { file, capInsets, w, h, x, y, ...opts }
     *   "layout"     — { layoutType, w, h, x, y, ...opts }
     *   "row"        — { x, y, gap, align, ...opts }  (children auto-laid out)
     *   "column"     — { x, y, gap, align, ...opts }  (children auto-laid out)
     *   "grid"       — { cols, x, y, gapX, gapY, ...opts }
     *   "scrollView" — { w, h, innerW, innerH, x, y, ...opts }
     *   "listView"   — { w, h, x, y, direction, ...opts }
     *
     * @param {cc.Node} parent
     * @param {Object|Array} tree  — single descriptor or array of descriptors
     * @returns {Object} refs — map of ref names to created nodes
     *
     * @example
     * var refs = UIBuilder.build(this, {
     *     type: "column", x: 360, y: 640, gap: 20, children: [
     *         { type: "sprite", file: "logo.png", ref: "logo" },
     *         { type: "label", text: "Xin chào!", fontSize: 32, ref: "title" },
     *         { type: "row", gap: 15, children: [
     *             { type: "button", img: "btn_play.png", title: "CHƠI", onClick: onPlay },
     *             { type: "button", img: "btn_settings.png", title: "CÀI ĐẶT", onClick: onSettings }
     *         ]}
     *     ]
     * });
     * // refs.logo, refs.title  — direct references to created nodes
     */
    B.build = function (parent, tree) {
        var refs = {};

        function buildOne(parentNode, desc) {
            if (!desc || !desc.type) return null;

            var type = desc.type;
            var node = null;

            // Extract common position (default 0,0)
            var x = desc.x || 0;
            var y = desc.y || 0;

            // Build opts from remaining properties
            var opts = {};
            var reserved = ["type", "children", "ref", "x", "y", "file", "text", "fontSize",
                "fontName", "img", "onClick", "title", "w", "h", "color", "radius",
                "capInsets", "layoutType", "innerW", "innerH", "direction", "cols",
                "gap", "gapX", "gapY", "align", "titleFontSize", "titleColor"];
            for (var key in desc) {
                if (desc.hasOwnProperty(key) && reserved.indexOf(key) === -1) {
                    opts[key] = desc[key];
                }
            }
            // Also pass through known opts keys
            if (desc.name) opts.name = desc.name;
            if (desc.anchor) opts.anchor = desc.anchor;
            if (desc.scale !== undefined) opts.scale = desc.scale;
            if (desc.opacity !== undefined) opts.opacity = desc.opacity;
            if (desc.zOrder !== undefined) opts.zOrder = desc.zOrder;
            if (desc.visible !== undefined) opts.visible = desc.visible;
            if (desc.rotation !== undefined) opts.rotation = desc.rotation;
            if (desc.color) opts.color = desc.color;
            if (desc.size) opts.size = desc.size;

            switch (type) {
                case "node":
                    node = B.createNode(parentNode, x, y, opts);
                    break;

                case "sprite":
                    node = B.createSprite(parentNode, desc.file, x, y, opts);
                    break;

                case "label":
                    node = B.createLabel(parentNode, desc.text || "", desc.fontSize || 20, x, y, opts);
                    if (desc.fontName) opts.fontName = desc.fontName;
                    break;

                case "text":
                    node = B.createText(parentNode, desc.text || "", desc.fontName || "Arial",
                        desc.fontSize || 16, x, y, opts);
                    break;

                case "button":
                    var btnOpts = opts;
                    if (desc.titleFontSize) btnOpts.titleFontSize = desc.titleFontSize;
                    if (desc.titleColor) btnOpts.titleColor = desc.titleColor;
                    if (desc.title) {
                        node = B.createButtonWithTitle(parentNode, desc.img, desc.title, x, y,
                            desc.onClick || null, btnOpts);
                    } else {
                        node = B.createButton(parentNode, desc.img, x, y,
                            desc.onClick || null, btnOpts);
                    }
                    break;

                case "imageView":
                    node = B.createImageView(parentNode, desc.file, x, y, opts);
                    break;

                case "rect":
                    node = B.createRect(parentNode, desc.w || 100, desc.h || 100, x, y,
                        desc.color || cc.color.WHITE, opts);
                    break;

                case "circle":
                    node = B.createCircle(parentNode, desc.radius || 50, x, y,
                        desc.color || cc.color.WHITE, opts);
                    break;

                case "colorLayer":
                    node = B.createColorLayer(parentNode, desc.color || cc.color(0, 0, 0, 128),
                        desc.w, desc.h, opts);
                    break;

                case "scale9":
                    node = B.createScale9Sprite(parentNode, desc.file,
                        desc.capInsets || cc.rect(20, 20, 20, 20),
                        desc.w || 100, desc.h || 100, x, y, opts);
                    break;

                case "layout":
                    node = B.createLayout(parentNode, desc.layoutType || ccui.Layout.ABSOLUTE,
                        desc.w || 100, desc.h || 100, x, y, opts);
                    break;

                case "scrollView":
                    node = B.createScrollView(parentNode, desc.w || 200, desc.h || 200,
                        desc.innerW || desc.w || 200, desc.innerH || desc.h || 200,
                        x, y, opts);
                    break;

                case "listView":
                    node = B.createListView(parentNode, desc.w || 200, desc.h || 200,
                        x, y, desc.direction, opts);
                    break;

                case "row":
                case "column":
                case "grid":
                    // Container node + arrange children using layout helpers
                    node = B.createNode(parentNode, x, y, opts);
                    if (desc.children) {
                        for (var lc = 0; lc < desc.children.length; lc++) {
                            buildOne(node, desc.children[lc]);
                        }
                    }
                    var layoutOpts = {};
                    if (desc.gap !== undefined) layoutOpts.gap = desc.gap;
                    if (desc.align) layoutOpts.alignItems = desc.align;
                    if (type === "row") {
                        B.arrangeAsRow(node, layoutOpts);
                    } else if (type === "column") {
                        B.arrangeAsColumn(node, layoutOpts);
                    } else {
                        layoutOpts.columns = desc.cols || 3;
                        if (desc.gapX !== undefined) layoutOpts.spacingX = desc.gapX;
                        if (desc.gapY !== undefined) layoutOpts.spacingY = desc.gapY;
                        B.arrangeAsGrid(node, layoutOpts);
                    }
                    desc.children = null;
                    break;

                default:
                    cc.warn("UIBuilder.build: unknown type '" + type + "'");
                    node = B.createNode(parentNode, x, y, opts);
                    break;
            }

            // Store ref
            if (desc.ref && node) {
                refs[desc.ref] = node;
            }

            // Process children (for non-layout types)
            if (desc.children && node) {
                for (var ci = 0; ci < desc.children.length; ci++) {
                    buildOne(node, desc.children[ci]);
                }
            }

            return node;
        }

        // Handle array of root descriptors
        if (Array.isArray(tree)) {
            for (var ti = 0; ti < tree.length; ti++) {
                buildOne(parent, tree[ti]);
            }
        } else {
            buildOne(parent, tree);
        }

        return refs;
    };

})(UIBuilder);
