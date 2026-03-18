/**
 * dev-bridge/_bootstrap.js — Guard & shared state initialization
 *
 * Must be loaded FIRST among all dev-bridge files.
 * Waits for cc.director to be ready, then signals other modules via callback.
 */
(function () {
    "use strict";

    if (window.__devBridge) return;

    // Shared state accessible by all dev-bridge modules
    window.__devBridge = {
        _fired: false,
        _readyCallbacks: [],
        state: {
            selectedNode: null,
            expandedPaths: {},   // track which tree paths are expanded
            overlayNode: null,   // cc.DrawNode for bounding box
            isDraggingCanvas: false,
            dragStart: null,
            dragNodeStartPos: null,
            cmdHistory: [],
            cmdHistoryIdx: -1,
            searchActiveIdx: -1
        },
        fn: {},   // populated by other modules
        data: {}  // populated by other modules
    };

    // Wait for cocos engine to be ready, then fire init
    var _checkInterval = setInterval(function () {
        if (typeof cc === "undefined" || !cc.director || !cc.director.getRunningScene()) return;
        clearInterval(_checkInterval);

        var B = window.__devBridge;
        B._fired = true;
        var callbacks = B._readyCallbacks;
        for (var i = 0; i < callbacks.length; i++) {
            try { callbacks[i](); } catch (e) {
                console.error("[DevBridge] onReady callback error:", e);
            }
        }
    }, 300);

    /**
     * Register a callback that runs when cc is ready.
     * If already fired, runs the callback immediately.
     */
    window.__devBridge.onReady = function (cb) {
        if (window.__devBridge._fired) {
            try { cb(); } catch (e) {
                console.error("[DevBridge] onReady callback error:", e);
            }
            return;
        }
        window.__devBridge._readyCallbacks.push(cb);
    };
})();
