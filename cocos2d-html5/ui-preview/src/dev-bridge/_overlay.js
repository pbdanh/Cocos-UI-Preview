/**
 * dev-bridge/_overlay.js — Canvas overlay (bounding box) & drag-to-move
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    var S = B.state;

    // ─── Canvas Overlay (bounding box) ─────────────────────────
    B.fn.updateOverlay = function () {
        // Remove old overlay
        if (S.overlayNode && S.overlayNode.getParent()) {
            S.overlayNode.removeFromParent(true);
            S.overlayNode = null;
        }

        if (!S.selectedNode) return;

        var scene = cc.director.getRunningScene();
        if (!scene) return;

        // Create overlay draw node
        S.overlayNode = new cc.DrawNode();
        S.overlayNode.setLocalZOrder(99999);
        scene.addChild(S.overlayNode);

        var bb = B.fn.getWorldBB(S.selectedNode);
        if (!bb) return;

        // Draw bounding box
        var p1 = cc.p(bb.x, bb.y);
        var p2 = cc.p(bb.x + bb.width, bb.y);
        var p3 = cc.p(bb.x + bb.width, bb.y + bb.height);
        var p4 = cc.p(bb.x, bb.y + bb.height);

        // Fill with semi-transparent
        S.overlayNode.drawPoly([p1, p2, p3, p4], cc.color(79, 70, 229, 20), 1.5, cc.color(79, 70, 229, 180));

        // Center dot (drag handle indicator)
        var cx = bb.x + bb.width / 2;
        var cy = bb.y + bb.height / 2;
        S.overlayNode.drawDot(cc.p(cx, cy), 4, cc.color(99, 102, 241, 200));

        // Corner dots
        S.overlayNode.drawDot(p1, 2, cc.color(129, 140, 248, 180));
        S.overlayNode.drawDot(p2, 2, cc.color(129, 140, 248, 180));
        S.overlayNode.drawDot(p3, 2, cc.color(129, 140, 248, 180));
        S.overlayNode.drawDot(p4, 2, cc.color(129, 140, 248, 180));
    };

    B.fn.getWorldBB = function (node) {
        if (!node) return null;
        var cs = node.getContentSize();
        if (cs.width === 0 && cs.height === 0) {
            cs = cc.size(20, 20);
        }
        var bl = node.convertToWorldSpace(cc.p(0, 0));
        var tr = node.convertToWorldSpace(cc.p(cs.width, cs.height));
        var tl = node.convertToWorldSpace(cc.p(0, cs.height));
        var br = node.convertToWorldSpace(cc.p(cs.width, 0));
        var minX = Math.min(bl.x, tr.x, tl.x, br.x);
        var maxX = Math.max(bl.x, tr.x, tl.x, br.x);
        var minY = Math.min(bl.y, tr.y, tl.y, br.y);
        var maxY = Math.max(bl.y, tr.y, tl.y, br.y);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    };

    // ─── Canvas drag-to-move ───────────────────────────────────
    B.onReady(function () {
        var canvas = document.getElementById("gameCanvas");
        if (!canvas) return;

        canvas.addEventListener("mousedown", function (e) {
            var panel = B.els.panel;
            if (!S.selectedNode || !panel.style.display || panel.style.display === "none") return;
            var rect = canvas.getBoundingClientRect();
            var scaleX = cc.view.getFrameSize().width / rect.width;
            var scaleY = cc.view.getFrameSize().height / rect.height;
            var clickX = (e.clientX - rect.left) * scaleX;
            var clickY = cc.view.getFrameSize().height - (e.clientY - rect.top) * scaleY;

            var bb = B.fn.getWorldBB(S.selectedNode);
            if (bb && clickX >= bb.x && clickX <= bb.x + bb.width &&
                clickY >= bb.y && clickY <= bb.y + bb.height) {
                S.isDraggingCanvas = true;
                S.dragStart = { x: clickX, y: clickY };
                S.dragNodeStartPos = { x: S.selectedNode.getPositionX(), y: S.selectedNode.getPositionY() };
                e.preventDefault();
            }
        });

        canvas.addEventListener("mousemove", function (e) {
            if (!S.isDraggingCanvas || !S.selectedNode) return;
            var rect = canvas.getBoundingClientRect();
            var scaleX = cc.view.getFrameSize().width / rect.width;
            var scaleY = cc.view.getFrameSize().height / rect.height;
            var curX = (e.clientX - rect.left) * scaleX;
            var curY = cc.view.getFrameSize().height - (e.clientY - rect.top) * scaleY;

            var dx = curX - S.dragStart.x;
            var dy = curY - S.dragStart.y;

            // Accumulate scale through the ancestor chain
            var ancestor = S.selectedNode.getParent();
            var accScaleX = 1, accScaleY = 1;
            while (ancestor) {
                accScaleX *= ancestor.getScaleX();
                accScaleY *= ancestor.getScaleY();
                ancestor = ancestor.getParent();
            }
            if (accScaleX !== 0) dx /= accScaleX;
            if (accScaleY !== 0) dy /= accScaleY;

            S.selectedNode.setPosition(
                Math.round(S.dragNodeStartPos.x + dx),
                Math.round(S.dragNodeStartPos.y + dy)
            );
            B.fn.updateOverlay();
            B.fn.updateInspector();
        });

        window.addEventListener("mouseup", function () {
            S.isDraggingCanvas = false;
        });
    });
})();
