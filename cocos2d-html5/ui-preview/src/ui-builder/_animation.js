/**
 * UIBuilder — Animation & Action Helpers
 */
(function (B) {

    /**
     * Move a node to position with easing.
     * @param {cc.Node}   node
     * @param {number}    duration  Seconds
     * @param {number}    x
     * @param {number}    y
     * @param {Object}    [easing]  e.g. { rate: 2 } for ease-in
     * @returns {cc.Action}
     */
    B.moveTo = function (node, duration, x, y, easing) {
        var action = cc.moveTo(duration, x, y);
        if (easing && easing.rate) action = action.easing(cc.easeIn(easing.rate));
        node.runAction(action);
        return action;
    };

    /**
     * MoveBy — relative movement.
     */
    B.moveBy = function (node, duration, dx, dy, easing) {
        var action = cc.moveBy(duration, dx, dy);
        if (easing && easing.rate) action = action.easing(cc.easeIn(easing.rate));
        node.runAction(action);
        return action;
    };

    /**
     * Fade a node in.
     * @param {cc.Node} node
     * @param {number}  duration  Seconds
     * @returns {cc.Action}
     */
    B.fadeIn = function (node, duration) {
        node.setOpacity(0);
        var action = cc.fadeIn(duration);
        node.runAction(action);
        return action;
    };

    /**
     * Fade a node out.
     * @param {cc.Node} node
     * @param {number}  duration  Seconds
     * @returns {cc.Action}
     */
    B.fadeOut = function (node, duration) {
        var action = cc.fadeOut(duration);
        node.runAction(action);
        return action;
    };

    /**
     * Scale a node to target with easing.
     * @param {cc.Node} node
     * @param {number}  duration
     * @param {number}  scaleX
     * @param {number}  [scaleY]   Defaults to scaleX
     * @param {Object}  [easing]
     * @returns {cc.Action}
     */
    B.scaleTo = function (node, duration, scaleX, scaleY, easing) {
        var sy = (scaleY !== undefined) ? scaleY : scaleX;
        var action = cc.scaleTo(duration, scaleX, sy);
        if (easing && easing.rate) action = action.easing(cc.easeIn(easing.rate));
        node.runAction(action);
        return action;
    };

    /**
     * Rotate a node to angle.
     */
    B.rotateTo = function (node, duration, angle, easing) {
        var action = cc.rotateTo(duration, angle);
        if (easing && easing.rate) action = action.easing(cc.easeIn(easing.rate));
        node.runAction(action);
        return action;
    };

    /**
     * Run a sequence of actions.
     * @param {cc.Node}  node
     * @param {Array}    actions   Array of cc.Action
     * @returns {cc.Action}
     */
    B.sequence = function (node, actions) {
        var seq = cc.sequence(actions);
        node.runAction(seq);
        return seq;
    };

    /**
     * Run a spawn of actions (in parallel).
     */
    B.spawn = function (node, actions) {
        var sp = cc.spawn(actions);
        node.runAction(sp);
        return sp;
    };

    /**
     * Repeat an action forever.
     */
    B.repeatForever = function (node, action) {
        var rep = cc.repeatForever(action);
        node.runAction(rep);
        return rep;
    };

    /**
     * Create a delay action (useful inside sequences).
     * @param {number} duration Seconds
     * @returns {cc.Action}
     */
    B.delay = function (duration) {
        return cc.delayTime(duration);
    };

    /**
     * Create a callback action (useful inside sequences).
     * @param {Function} fn
     * @returns {cc.Action}
     */
    B.callFunc = function (fn) {
        return cc.callFunc(fn);
    };

    /**
     * Run a single action on a node.
     */
    B.runAction = function (node, action) {
        node.runAction(action);
        return action;
    };

})(UIBuilder);
