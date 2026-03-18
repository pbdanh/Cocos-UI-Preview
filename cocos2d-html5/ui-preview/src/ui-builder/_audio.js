/**
 * UIBuilder — Audio Helpers
 */
(function (B) {

    /**
     * Play background music.
     * @param {string}  file  Path to audio file
     * @param {boolean} [loop]  Default true
     */
    B.playMusic = function (file, loop) {
        cc.audioEngine.playMusic(file, (loop !== undefined) ? loop : true);
    };

    /**
     * Stop background music.
     */
    B.stopMusic = function () {
        cc.audioEngine.stopMusic();
    };

    /**
     * Play a sound effect.
     * @param {string}  file
     * @param {boolean} [loop]  Default false
     * @returns {number} Audio ID
     */
    B.playEffect = function (file, loop) {
        return cc.audioEngine.playEffect(file, loop || false);
    };

    /**
     * Stop a sound effect.
     * @param {number} audioId
     */
    B.stopEffect = function (audioId) {
        cc.audioEngine.stopEffect(audioId);
    };

})(UIBuilder);
