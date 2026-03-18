/**
 * UIBuilder — Scene & Transition Helpers
 */
(function (B) {

    /**
     * Replace the current scene.
     * @param {cc.Scene} scene
     */
    B.replaceScene = function (scene) {
        cc.director.runScene(scene);
    };

    /**
     * Replace the current scene with a transition.
     * @param {cc.Scene} scene
     * @param {number}   duration  Seconds
     * @param {string}   [type]   "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "flipX" | "flipY"
     * @param {cc.Color} [color]  For fade transition
     */
    B.replaceSceneWithTransition = function (scene, duration, type, color) {
        var t;
        switch (type) {
            case "fade": t = new cc.TransitionFade(duration, scene, color || cc.color.BLACK); break;
            case "slideLeft": t = new cc.TransitionSlideInR(duration, scene); break;
            case "slideRight": t = new cc.TransitionSlideInL(duration, scene); break;
            case "slideUp": t = new cc.TransitionSlideInT(duration, scene); break;
            case "slideDown": t = new cc.TransitionSlideInB(duration, scene); break;
            case "flipX": t = new cc.TransitionFlipX(duration, scene); break;
            case "flipY": t = new cc.TransitionFlipY(duration, scene); break;
            default: t = new cc.TransitionFade(duration, scene, color || cc.color.BLACK); break;
        }
        cc.director.runScene(t);
    };

})(UIBuilder);
