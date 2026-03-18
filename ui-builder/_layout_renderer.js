/**
 * _layout_renderer.js — Cocos2d Renderer Bridge for LayoutEngine
 *
 * Takes the same JSON used by the HTML5 previewer, runs it through
 * LayoutEngine, and creates Cocos2d nodes at the computed positions.
 *
 * Usage:
 *   var result = UIBuilder.renderLayout(parentNode, jsonData, resourceMap, {
 *       callbacks: { "btnReplay": function() { ... } }
 *   });
 *   // result.root    — the root cc.Node
 *   // result.nodes   — { name: cocosNode } map
 *   // result.engine  — the LayoutEngine instance
 *
 * ⚡ Requires: LayoutEngine (_layout_engine.js) loaded before this file.
 */
(function () {
    "use strict";

    // Will be attached to UIBuilder in the bridge section at bottom

    /**
     * Render a LayoutEngine JSON tree into Cocos2d nodes.
     *
     * @param {cc.Node} parent - Parent node to add the root to
     * @param {Object|Array} jsonData - The layout JSON (same as previewer)
     * @param {Object} resourceMap - { nodeName: "path/to/asset.png" }
     * @param {Object} [opts] - Options
     * @param {Object} [opts.callbacks] - { nodeName: function() {} } for buttons
     * @param {boolean} [opts.skipAnimations] - If true, skip intro/loop animations
     * @returns {{ root: cc.Node, nodes: Object, engine: LayoutEngine }}
     */
    function renderLayout(parent, jsonData, resourceMap, opts) {
        opts = opts || {};
        var callbacks = opts.callbacks || {};
        var skipAnims = opts.skipAnimations || false;

        // 1. Compute layout using LayoutEngine
        var engine = new LayoutEngine();
        engine.buildTree(jsonData);
        var size = cc.winSize;
        engine.computeLayout(size.width, size.height);

        // 2. Walk the internal tree and create Cocos2d nodes
        var nodeMap = {};  // name → cc.Node
        var internalRoot = engine._root;

        var rootNode = _createNodeTree(internalRoot, engine, resourceMap, callbacks, nodeMap, null);

        // 3. Add to parent
        if (parent && rootNode) {
            parent.addChild(rootNode);
        }

        // 4. Run intro animations (unless skipped)
        if (!skipAnims) {
            _runAnimations(engine, nodeMap, "intro");
            _runAnimations(engine, nodeMap, "loop");
        }

        return {
            root: rootNode,
            nodes: nodeMap,
            engine: engine
        };
    }

    /**
     * Recursively create Cocos2d nodes from the LayoutEngine internal tree.
     */
    function _createNodeTree(node, engine, resourceMap, callbacks, nodeMap, parentCocosNode) {
        var name = node.name || node._id;
        var bounds = engine.getNodeBounds(name);
        if (!bounds) return null;

        var type = node.type || "";
        var resPath = resourceMap[name];
        var cocosNode = null;

        // --- Create node based on type ---
        if (type === "sprite" || type === "imageView") {
            if (resPath) {
                cocosNode = new cc.Sprite(resPath);
            } else {
                cocosNode = new cc.Sprite();
            }
        } else if (type === "button") {
            if (resPath) {
                cocosNode = new ccui.Button(resPath);
                cocosNode.setPressedActionEnabled(true);
            } else {
                cocosNode = new ccui.Button();
            }
            // Attach callback
            if (callbacks[name]) {
                cocosNode.addClickEventListener(callbacks[name]);
            }
        } else if (type === "scale9") {
            if (resPath) {
                cocosNode = new ccui.Scale9Sprite(resPath);
                if (bounds.width && bounds.height) {
                    cocosNode.setContentSize(bounds.width, bounds.height);
                }
            } else {
                cocosNode = new cc.Node();
            }
        } else if (type === "label" || type === "text") {
            var text = node.text || "";
            var fontSize = node.fontSize || 20;
            var fontName = node.fontName || "Arial";
            cocosNode = new cc.LabelTTF(text, fontName, fontSize);
            if (node.color) {
                cocosNode.setColor(cc.color(node.color));
            }
        } else if (type === "progressBar") {
            // Use sprite as visual, actual progress logic is app-specific
            if (resPath) {
                cocosNode = new cc.Sprite(resPath);
            } else {
                cocosNode = new cc.Node();
            }
        } else {
            // Container / layout node — just a cc.Node
            cocosNode = new cc.Node();
            if (bounds.width && bounds.height) {
                cocosNode.setContentSize(bounds.width, bounds.height);
            }
        }

        // --- Set common properties ---
        cocosNode.setName(name);

        // Anchor
        var anchor = node.anchor || [0.5, 0.5];
        cocosNode.setAnchorPoint(anchor[0], anchor[1]);

        // Position: for root node (no parent), place at (0,0) since the root
        // occupies the full screen. For child nodes, _x/_y are the anchor-point
        // position relative to parent's bottom-left, which is what setPosition expects.
        if (!parentCocosNode) {
            cocosNode.setPosition(0, 0);
        } else {
            cocosNode.setPosition(bounds.x, bounds.y);
        }

        // Scale
        if (bounds.scaleX !== undefined && bounds.scaleX !== 1) {
            cocosNode.setScaleX(bounds.scaleX);
        }
        if (bounds.scaleY !== undefined && bounds.scaleY !== 1) {
            cocosNode.setScaleY(bounds.scaleY);
        }

        // Rotation
        if (bounds.rotation) {
            cocosNode.setRotation(bounds.rotation);
        }

        // Opacity
        if (bounds.opacity !== undefined && bounds.opacity !== 255) {
            cocosNode.setOpacity(bounds.opacity);
        }

        // Visibility
        if (!bounds.visible) {
            cocosNode.setVisible(false);
        }

        // zOrder
        if (bounds.zOrder) {
            cocosNode.setLocalZOrder(bounds.zOrder);
        }

        // Store in map
        nodeMap[name] = cocosNode;

        // --- Recurse children ---
        if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
                var childNode = _createNodeTree(
                    node.children[i], engine, resourceMap, callbacks, nodeMap, cocosNode
                );
                if (childNode) {
                    cocosNode.addChild(childNode);
                }
            }
        }

        return cocosNode;
    }

    /**
     * Run animations (intro or loop) for all nodes that have them.
     */
    function _runAnimations(engine, nodeMap, sequence) {
        var timeline = engine.getTimelineEvents();
        for (var i = 0; i < timeline.length; i++) {
            var evt = timeline[i];
            if (evt.sequence !== sequence) continue;

            var cocosNode = nodeMap[evt.nodeName] || nodeMap[evt.nodeId];
            if (!cocosNode) continue;

            var action = _createCocosAction(evt, cocosNode, sequence);
            if (action) {
                cocosNode.runAction(action);
            }
        }
    }

    /**
     * Create a Cocos2d action from an animation event.
     */
    function _createCocosAction(evt, cocosNode, sequence) {
        var dur = (evt.duration || 300) / 1000;
        var action = null;
        var isLoop = (sequence === "loop");
        var isPositionProp = (evt.prop === "x" || evt.prop === "y");

        // Determine "from" value — set initial state if specified
        // BUT skip for loop x/y animations to preserve layout-computed position
        if (evt.from !== undefined && !(isLoop && isPositionProp)) {
            _setAnimProp(cocosNode, evt.prop, evt.from);
        }

        // Create the target action
        switch (evt.prop) {
            case "opacity":
                action = cc.fadeTo(dur, evt.to);
                break;
            case "rotation":
                action = cc.rotateTo(dur, evt.to);
                break;
            case "scale":
            case "scaleX":
            case "scaleY":
                if (evt.prop === "scale") {
                    action = cc.scaleTo(dur, evt.to);
                } else if (evt.prop === "scaleX") {
                    action = cc.scaleTo(dur, evt.to, cocosNode.getScaleY());
                } else {
                    action = cc.scaleTo(dur, cocosNode.getScaleX(), evt.to);
                }
                break;
            case "x":
                // For loops, use relative moveBy to preserve layout position
                if (isLoop) {
                    action = cc.moveBy(dur, evt.to - (evt.from || 0), 0);
                } else {
                    action = cc.moveTo(dur, evt.to, cocosNode.getPositionY());
                }
                break;
            case "y":
                // For loops, use relative moveBy to preserve layout position
                if (isLoop) {
                    action = cc.moveBy(dur, 0, evt.to - (evt.from || 0));
                } else {
                    action = cc.moveTo(dur, cocosNode.getPositionX(), evt.to);
                }
                break;
            default:
                return null;
        }

        // Apply easing
        action = _applyEasing(action, evt.easing);

        // Handle yoyo (forward + reverse)
        if (evt.yoyo) {
            var reverseAction;
            if (isLoop && isPositionProp) {
                // For loop x/y: reverse the moveBy action to bounce back
                reverseAction = action.reverse();
                if (reverseAction) {
                    reverseAction = _applyEasing(reverseAction, evt.easing);
                    action = cc.sequence(action, reverseAction);
                }
            } else if (evt.from !== undefined) {
                // Create reverse: go back to "from"
                reverseAction = _createReverseAction(evt, cocosNode);
                if (reverseAction) {
                    reverseAction = _applyEasing(reverseAction, evt.easing);
                    action = cc.sequence(action, reverseAction);
                }
            }
        }

        // Handle delay
        if (evt.delay > 0) {
            action = cc.sequence(cc.delayTime(evt.delay / 1000), action);
        }

        // Handle repeat
        if (evt.repeat === -1) {
            action = cc.repeatForever(action);
        } else if (evt.repeat > 1) {
            action = cc.repeat(action, evt.repeat);
        }

        return action;
    }

    /**
     * Create a reverse action (for yoyo).
     */
    function _createReverseAction(evt, cocosNode) {
        var dur = (evt.duration || 300) / 1000;
        switch (evt.prop) {
            case "opacity": return cc.fadeTo(dur, evt.from);
            case "rotation": return cc.rotateTo(dur, evt.from);
            case "scale": return cc.scaleTo(dur, evt.from);
            case "scaleX": return cc.scaleTo(dur, evt.from, cocosNode.getScaleY());
            case "scaleY": return cc.scaleTo(dur, cocosNode.getScaleX(), evt.from);
            case "x": return cc.moveTo(dur, evt.from, cocosNode.getPositionY());
            case "y": return cc.moveTo(dur, cocosNode.getPositionX(), evt.from);
            default: return null;
        }
    }

    /**
     * Apply easing to a Cocos2d action.
     */
    function _applyEasing(action, easingName) {
        if (!easingName || easingName === "linear") return action;
        var easingMap = {
            "easeIn": cc.easeIn(2),
            "easeOut": cc.easeOut(2),
            "easeInOut": cc.easeInOut(2),
            "easeInCubic": cc.easeIn(3),
            "easeOutCubic": cc.easeOut(3),
            "easeInOutCubic": cc.easeInOut(3),
            "bounce": cc.easeBounceOut(),
            "elastic": cc.easeElasticOut(),
            "backIn": cc.easeBackIn(),
            "backOut": cc.easeBackOut()
        };
        var easing = easingMap[easingName];
        if (easing) {
            return action.easing(easing);
        }
        return action;
    }

    /**
     * Set an animation property's initial value on a Cocos node.
     */
    function _setAnimProp(cocosNode, prop, value) {
        switch (prop) {
            case "opacity": cocosNode.setOpacity(value); break;
            case "rotation": cocosNode.setRotation(value); break;
            case "scale": cocosNode.setScale(value); break;
            case "scaleX": cocosNode.setScaleX(value); break;
            case "scaleY": cocosNode.setScaleY(value); break;
            case "x": cocosNode.setPositionX(value); break;
            case "y": cocosNode.setPositionY(value); break;
        }
    }

    // ── Bridge to UIBuilder ───────────────────────────
    // Attach after UIBuilder is initialized (loaded after _base.js via bridging)
    // We use a polling approach since load order may vary
    function _bridge() {
        if (typeof UIBuilder !== "undefined") {
            UIBuilder.renderLayout = renderLayout;
        } else {
            // UIBuilder not ready yet — try on next frame
            setTimeout(_bridge, 0);
        }
    }
    _bridge();

    // Also export standalone for direct access
    if (typeof window !== "undefined") {
        window.LayoutRenderer = {
            renderLayout: renderLayout
        };
    }

})();
