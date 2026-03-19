cc.game.onStart = function () {
    if (!cc.sys.isNative && document.getElementById("cocosLoading"))
        document.body.removeChild(document.getElementById("cocosLoading"));

    var designSize = cc.size(1280, 720);

    cc.view.setDesignResolutionSize(designSize.width, designSize.height, cc.ResolutionPolicy.SHOW_ALL);
    cc.view.resizeWithBrowserSize(true);

    // Preload resources then run PreviewScene
    cc.LoaderScene.preload(g_resources, function () {
        cc.director.runScene(new PreviewScene());
    }, this);
};
cc.game.run();
