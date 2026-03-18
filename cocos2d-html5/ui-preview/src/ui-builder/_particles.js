/**
 * UIBuilder — Particle & Sprite Animation Helpers
 */
(function (B) {

    /**
     * Create a particle system from a .plist file.
     * @param {cc.Node} parent
     * @param {string}  plistFile
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]
     * @returns {cc.ParticleSystem}
     */
    B.createParticle = function (parent, plistFile, x, y, opts) {
        var ps = new cc.ParticleSystem(plistFile);
        ps.setPosition(x, y);
        B._applyOpts(ps, opts);
        parent.addChild(ps, (opts && opts.zOrder) || 0);
        return ps;
    };

    /**
     * Create a sprite with frame animation from a sprite sheet.
     * @param {cc.Node} parent
     * @param {string}  plistFile       Sprite sheet .plist
     * @param {string}  framePrefix     Frame name prefix e.g. "run_"
     * @param {number}  frameCount      Number of frames
     * @param {number}  fps             Frames per second
     * @param {number}  x
     * @param {number}  y
     * @param {Object}  [opts]  Extra: loop (default true)
     * @returns {cc.Sprite}
     */
    B.createAnimatedSprite = function (parent, plistFile, framePrefix, frameCount, fps, x, y, opts) {
        cc.spriteFrameCache.addSpriteFrames(plistFile);
        var frames = [];
        for (var i = 0; i < frameCount; i++) {
            var frameName = framePrefix + i + ".png";
            var frame = cc.spriteFrameCache.getSpriteFrame(frameName);
            if (frame) frames.push(frame);
        }
        var sprite = new cc.Sprite(frames[0]);
        sprite.setPosition(x, y);
        if (frames.length > 0) {
            var animation = new cc.Animation(frames, 1.0 / fps);
            var animate = cc.animate(animation);
            var loop = (opts && opts.loop !== undefined) ? opts.loop : true;
            if (loop) {
                sprite.runAction(cc.repeatForever(animate));
            } else {
                sprite.runAction(animate);
            }
        }
        B._applyOpts(sprite, opts);
        parent.addChild(sprite, (opts && opts.zOrder) || 0);
        return sprite;
    };

})(UIBuilder);
