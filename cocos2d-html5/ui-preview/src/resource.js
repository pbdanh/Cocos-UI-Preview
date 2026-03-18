/**
 * Resource map for PreviewLayer
 * Maps node names from preview.json → asset file paths
 */
var res_preview = {
    sprBg:          "res/background.png",
    sprResourceBar: "res/bg_resource.png",
    iconGold:       "res/icon_gold.png",
    sprGoldNum:     "res/text_number.png",
    sprDiamondNum:  "res/text_number.png",
    iconDiamond:    "res/icon_diamon.png",
    sprCard:        "res/card.png",
    sprAvatar:      "res/avatar.png",
    sprName:        "res/text_unknow.png",
    sprBadge:       "res/image badge.png",
    sprTextHP:      "res/text_hp.png",
    iconRed:        "res/icon_red.png",
    sprBarRed:      "res/bar_red.png",
    sprTextMP:      "res/text_mp.png",
    iconYellow:     "res/icon_yellow.png",
    sprBarYellow:   "res/bar_yellow.png",
    sprTextSP:      "res/text_sp.png",
    iconGreen:      "res/icon_green.png",
    sprBarGreen:    "res/bar_green.png",
    sprDecor:       "res/icon_decor.png",
    btnHighClass:   "res/btn_high_class.png",
    sprArrowUp:     "res/icon_arrow_up.png",
    btnUpgrade:     "res/btn_upgrade.png",
    star1:          "res/icon_star.png",
    star2:          "res/icon_star.png",
    star3:          "res/icon_star.png",
    star4:          "res/icon_star.png",
    star5:          "res/icon_star.png",
    btnReplay:      "res/btn_replay.png"
};

// Build preload list from resource map
var g_resources = [];
var _loaded = {};
for (var k in res_preview) {
    if (res_preview.hasOwnProperty(k)) {
        var path = res_preview[k];
        if (!_loaded[path]) {
            g_resources.push(path);
            _loaded[path] = true;
        }
    }
}
