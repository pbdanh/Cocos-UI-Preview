/**
 * UIBuilder — Event & Touch Helpers
 */
(function (B) {

    /**
     * Add a touch listener to a node (single touch).
     * @param {cc.Node}  node
     * @param {Object}   callbacks  { onBegan, onMoved, onEnded, onCancelled }
     *                    Each receives (touch, event). onBegan must return true to receive further events.
     * @returns {cc.EventListener}
     */
    B.addTouchListener = function (node, callbacks) {
        var listener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: callbacks.onBegan || function () { return true; },
            onTouchMoved: callbacks.onMoved || function () { },
            onTouchEnded: callbacks.onEnded || function () { },
            onTouchCancelled: callbacks.onCancelled || function () { }
        });
        cc.eventManager.addListener(listener, node);
        return listener;
    };

    /**
     * Schedule a callback every `interval` seconds on a node.
     * @param {cc.Node}   node
     * @param {Function}  callback   function(dt)
     * @param {number}    interval   Seconds (0 = every frame)
     * @param {string}    [key]      Schedule key for unscheduling
     */
    B.schedule = function (node, callback, interval, key) {
        if (key) {
            node.schedule(callback, interval, cc.REPEAT_FOREVER, 0, key);
        } else {
            node.schedule(callback, interval);
        }
    };

    /**
     * Schedule a callback once after a delay.
     * @param {cc.Node}   node
     * @param {Function}  callback
     * @param {number}    delay   Seconds
     */
    B.scheduleOnce = function (node, callback, delay) {
        node.scheduleOnce(callback, delay);
    };

})(UIBuilder);
