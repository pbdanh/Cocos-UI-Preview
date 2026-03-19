/**
 * PreviewLayer — Auto-generated adaptive layout
 * Design: 873x643
 *
 * Uses UIBuilder.arrangeAsRow/Column + pinEdges for responsive layout.
 * No runtime LayoutEngine required.
 */

var PreviewLayer = cc.Layer.extend({

    ctor: function () {
        this._super();
        this._buildUI();
        return true;
    },

    _buildUI: function () {
        var self = this;

        // ── root ──
        var root = UIBuilder.createFullScreenLayout(this);
        root.setName("root");

        // ── sprBg ──
        var sprBg = UIBuilder.createBackground(root, res_preview.sprBg, "FILL");
        sprBg.setName("sprBg");

        // ── sprResourceBar ──
        var sprResourceBar = new ccui.Layout();
        sprResourceBar.setBackGroundImage(res_preview.sprResourceBar);
        sprResourceBar.setBackGroundImageScale9Enabled(true);
        sprResourceBar.setContentSize(733, 70);
        sprResourceBar.setName("sprResourceBar");
        root.addChild(sprResourceBar);
        UIBuilder.pinEdges(sprResourceBar, { top: 8, horizontalCenter: true });

        // ── rowGold (Row) ──
        var rowGold = new cc.Node();
        rowGold.setContentSize(248, 57);
        rowGold.setName("rowGold");
        rowGold.setAnchorPoint(0, 0.5);
        sprResourceBar.addChild(rowGold);
        UIBuilder.pinEdges(rowGold, { left: 30, verticalCenter: true });

        // ── iconGold ──
        var iconGold = UIBuilder.sprite(res_preview.iconGold);
        iconGold.setContentSize(52, 57);
        iconGold.setName("iconGold");
        rowGold.addChild(iconGold);

        // ── sprGoldNum ──
        var sprGoldNum = UIBuilder.sprite(res_preview.sprGoldNum);
        sprGoldNum.setContentSize(191, 32);
        sprGoldNum.setName("sprGoldNum");
        rowGold.addChild(sprGoldNum);

        UIBuilder.arrangeAsRow(rowGold, { gap: 5, alignItems: "center" });

        // ── rowDiamond (Row) ──
        var rowDiamond = new cc.Node();
        rowDiamond.setContentSize(254, 52);
        rowDiamond.setName("rowDiamond");
        rowDiamond.setAnchorPoint(1, 0.5);
        sprResourceBar.addChild(rowDiamond);
        UIBuilder.pinEdges(rowDiamond, { right: 30, verticalCenter: true });

        // ── sprDiamondNum ──
        var sprDiamondNum = UIBuilder.sprite(res_preview.sprDiamondNum);
        sprDiamondNum.setContentSize(191, 32);
        sprDiamondNum.setName("sprDiamondNum");
        rowDiamond.addChild(sprDiamondNum);

        // ── iconDiamond ──
        var iconDiamond = UIBuilder.sprite(res_preview.iconDiamond);
        iconDiamond.setContentSize(58, 52);
        iconDiamond.setName("iconDiamond");
        rowDiamond.addChild(iconDiamond);

        UIBuilder.arrangeAsRow(rowDiamond, { gap: 5, alignItems: "center" });

        // ── rowContent (Row) ──
        var rowContent = new cc.Node();
        rowContent.setContentSize(833, 543);
        rowContent.setName("rowContent");
        root.addChild(rowContent);
        UIBuilder.pinEdges(rowContent, { left: 20, right: 20, top: 85, bottom: 15 });

        // ── sprCard ──
        var sprCard = new ccui.Layout();
        sprCard.setBackGroundImage(res_preview.sprCard);
        sprCard.setContentSize(377, 416);
        sprCard.setName("sprCard");
        rowContent.addChild(sprCard);

        // ── colCardContent (Column) ──
        var colCardContent = new cc.Node();
        colCardContent.setContentSize(337, 361);
        colCardContent.setName("colCardContent");
        sprCard.addChild(colCardContent);
        UIBuilder.pinEdges(colCardContent, { left: 20, right: 20, top: 20, bottom: 35 });

        // ── rowCardHeader (Row) ──
        var rowCardHeader = new cc.Node();
        rowCardHeader.setContentSize(295, 172);
        rowCardHeader.setName("rowCardHeader");
        colCardContent.addChild(rowCardHeader);

        // ── sprAvatar ──
        var sprAvatar = UIBuilder.sprite(res_preview.sprAvatar);
        sprAvatar.setContentSize(158, 172);
        sprAvatar.setName("sprAvatar");
        rowCardHeader.addChild(sprAvatar);

        // ── colNameBadge (Column) ──
        var colNameBadge = new cc.Node();
        colNameBadge.setContentSize(127, 157);
        colNameBadge.setName("colNameBadge");
        rowCardHeader.addChild(colNameBadge);

        // ── sprName ──
        var sprName = UIBuilder.sprite(res_preview.sprName);
        sprName.setContentSize(126, 35);
        sprName.setName("sprName");
        colNameBadge.addChild(sprName);

        // ── sprBadge ──
        var sprBadge = UIBuilder.sprite(res_preview.sprBadge);
        sprBadge.setContentSize(127, 117);
        sprBadge.setName("sprBadge");
        colNameBadge.addChild(sprBadge);

        UIBuilder.arrangeAsColumn(colNameBadge, { gap: 5, alignItems: "center" });

        UIBuilder.arrangeAsRow(rowCardHeader, { gap: 10, alignItems: "center" });

        // ── colStats (Column) ──
        var colStats = new cc.Node();
        colStats.setContentSize(283, 127);
        colStats.setName("colStats");
        colCardContent.addChild(colStats);

        // ── rowHP (Row) ──
        var rowHP = new cc.Node();
        rowHP.setContentSize(260, 37);
        rowHP.setName("rowHP");
        colStats.addChild(rowHP);

        // ── sprTextHP ──
        var sprTextHP = UIBuilder.sprite(res_preview.sprTextHP);
        sprTextHP.setContentSize(62, 37);
        sprTextHP.setName("sprTextHP");
        rowHP.addChild(sprTextHP);

        // ── iconRed ──
        var iconRed = UIBuilder.sprite(res_preview.iconRed);
        iconRed.setContentSize(32, 32);
        iconRed.setName("iconRed");
        rowHP.addChild(iconRed);

        // ── sprBarRed ──
        var sprBarRed = UIBuilder.sprite(res_preview.sprBarRed);
        sprBarRed.setContentSize(150, 20);
        sprBarRed.setName("sprBarRed");
        rowHP.addChild(sprBarRed);

        UIBuilder.arrangeAsRow(rowHP, { gap: 8, alignItems: "center" });

        // ── rowMP (Row) ──
        var rowMP = new cc.Node();
        rowMP.setContentSize(232, 37);
        rowMP.setName("rowMP");
        colStats.addChild(rowMP);

        // ── sprTextMP ──
        var sprTextMP = UIBuilder.sprite(res_preview.sprTextMP);
        sprTextMP.setContentSize(62, 36);
        sprTextMP.setName("sprTextMP");
        rowMP.addChild(sprTextMP);

        // ── iconYellow ──
        var iconYellow = UIBuilder.sprite(res_preview.iconYellow);
        iconYellow.setContentSize(32, 32);
        iconYellow.setName("iconYellow");
        rowMP.addChild(iconYellow);

        // ── sprBarYellow ──
        var sprBarYellow = UIBuilder.sprite(res_preview.sprBarYellow);
        sprBarYellow.setContentSize(122, 21);
        sprBarYellow.setName("sprBarYellow");
        rowMP.addChild(sprBarYellow);

        UIBuilder.arrangeAsRow(rowMP, { gap: 8, alignItems: "center" });

        // ── rowSP (Row) ──
        var rowSP = new cc.Node();
        rowSP.setContentSize(283, 37);
        rowSP.setName("rowSP");
        colStats.addChild(rowSP);

        // ── sprTextSP ──
        var sprTextSP = UIBuilder.sprite(res_preview.sprTextSP);
        sprTextSP.setContentSize(62, 36);
        sprTextSP.setName("sprTextSP");
        rowSP.addChild(sprTextSP);

        // ── iconGreen ──
        var iconGreen = UIBuilder.sprite(res_preview.iconGreen);
        iconGreen.setContentSize(32, 32);
        iconGreen.setName("iconGreen");
        rowSP.addChild(iconGreen);

        // ── sprBarGreen ──
        var sprBarGreen = UIBuilder.sprite(res_preview.sprBarGreen);
        sprBarGreen.setContentSize(173, 21);
        sprBarGreen.setName("sprBarGreen");
        rowSP.addChild(sprBarGreen);

        UIBuilder.arrangeAsRow(rowSP, { gap: 8, alignItems: "center" });

        UIBuilder.arrangeAsColumn(colStats, { gap: 8 });

        UIBuilder.arrangeAsColumn(colCardContent, { alignItems: "center", justifyContent: "spaceBetween" });

        // ── colRightPanel (Column) ──
        var colRightPanel = new cc.Node();
        colRightPanel.setContentSize(373, 486);
        colRightPanel.setName("colRightPanel");
        rowContent.addChild(colRightPanel);

        // ── sprDecor ──
        var sprDecor = UIBuilder.sprite(res_preview.sprDecor);
        sprDecor.setContentSize(339, 251);
        sprDecor.setName("sprDecor");
        colRightPanel.addChild(sprDecor);

        // Animations for sprDecor
        sprDecor.setScale(0);
        var sprDecor_anim0 = cc.scaleTo(0.40, 1);
        sprDecor_anim0 = sprDecor_anim0.easing(cc.easeOut(3));
        sprDecor.runAction(sprDecor_anim0);

        // ── btnHighClass ──
        var btnHighClass = UIBuilder.button(res_preview.btnHighClass);
        btnHighClass.setPressedActionEnabled(true);
        btnHighClass.setTitleText("High Class");
        btnHighClass.setContentSize(212, 50);
        btnHighClass.setName("btnHighClass");
        colRightPanel.addChild(btnHighClass);

        // ── sprArrowUp ──
        var sprArrowUp = UIBuilder.sprite(res_preview.sprArrowUp);
        sprArrowUp.setContentSize(33, 40);
        sprArrowUp.setName("sprArrowUp");
        colRightPanel.addChild(sprArrowUp);

        // Animations for sprArrowUp

        // ── btnUpgrade ──
        var btnUpgrade = UIBuilder.button(res_preview.btnUpgrade);
        btnUpgrade.setPressedActionEnabled(true);
        btnUpgrade.setTitleText("UPGRADE");
        btnUpgrade.setContentSize(212, 50);
        btnUpgrade.setName("btnUpgrade");
        colRightPanel.addChild(btnUpgrade);

        // ── rowStars (Row) ──
        var rowStars = new cc.Node();
        rowStars.setContentSize(373, 63);
        rowStars.setName("rowStars");
        colRightPanel.addChild(rowStars);

        // ── star1 ──
        var star1 = UIBuilder.sprite(res_preview.star1);
        star1.setContentSize(65, 63);
        star1.setName("star1");
        rowStars.addChild(star1);

        // ── star2 ──
        var star2 = UIBuilder.sprite(res_preview.star2);
        star2.setContentSize(65, 63);
        star2.setName("star2");
        rowStars.addChild(star2);

        // ── star3 ──
        var star3 = UIBuilder.sprite(res_preview.star3);
        star3.setContentSize(65, 63);
        star3.setName("star3");
        rowStars.addChild(star3);

        // ── star4 ──
        var star4 = UIBuilder.sprite(res_preview.star4);
        star4.setContentSize(65, 63);
        star4.setName("star4");
        rowStars.addChild(star4);

        // ── star5 ──
        var star5 = UIBuilder.sprite(res_preview.star5);
        star5.setContentSize(65, 63);
        star5.setName("star5");
        rowStars.addChild(star5);

        UIBuilder.arrangeAsRow(rowStars, { gap: 12, alignItems: "center" });

        UIBuilder.arrangeAsColumn(colRightPanel, { gap: 8, alignItems: "center" });

        UIBuilder.arrangeAsRow(rowContent, { gap: 20, alignItems: "center", justifyContent: "spaceBetween" });

        // ── btnReplay ──
        var btnReplay = UIBuilder.button(res_preview.btnReplay);
        btnReplay.setPressedActionEnabled(true);
        btnReplay.setContentSize(89, 85);
        btnReplay.setName("btnReplay");
        root.addChild(btnReplay);
        UIBuilder.pinEdges(btnReplay, { left: 10, bottom: 10 });

        // Store node references
        this._nodes = {
            root: root,
            sprBg: sprBg,
            sprResourceBar: sprResourceBar,
            rowGold: rowGold,
            iconGold: iconGold,
            sprGoldNum: sprGoldNum,
            rowDiamond: rowDiamond,
            sprDiamondNum: sprDiamondNum,
            iconDiamond: iconDiamond,
            rowContent: rowContent,
            sprCard: sprCard,
            colCardContent: colCardContent,
            rowCardHeader: rowCardHeader,
            sprAvatar: sprAvatar,
            colNameBadge: colNameBadge,
            sprName: sprName,
            sprBadge: sprBadge,
            colStats: colStats,
            rowHP: rowHP,
            sprTextHP: sprTextHP,
            iconRed: iconRed,
            sprBarRed: sprBarRed,
            rowMP: rowMP,
            sprTextMP: sprTextMP,
            iconYellow: iconYellow,
            sprBarYellow: sprBarYellow,
            rowSP: rowSP,
            sprTextSP: sprTextSP,
            iconGreen: iconGreen,
            sprBarGreen: sprBarGreen,
            colRightPanel: colRightPanel,
            sprDecor: sprDecor,
            btnHighClass: btnHighClass,
            sprArrowUp: sprArrowUp,
            btnUpgrade: btnUpgrade,
            rowStars: rowStars,
            star1: star1,
            star2: star2,
            star3: star3,
            star4: star4,
            star5: star5,
            btnReplay: btnReplay
        };

        // Button callbacks
        btnHighClass.addClickEventListener(function () {
            self._onBtnHighClass();
        });
        btnUpgrade.addClickEventListener(function () {
            self._onBtnUpgrade();
        });
        btnReplay.addClickEventListener(function () {
            self._onBtnReplay();
        });
    },

    // ── Callbacks ──
    _onBtnHighClass: function () {
        cc.log("btnHighClass clicked");
    },

    _onBtnUpgrade: function () {
        cc.log("btnUpgrade clicked");
    },

    _onBtnReplay: function () {
        cc.log("btnReplay clicked");
    }
});

var PreviewScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new PreviewLayer();
        layer.setName("PreviewLayer");
        this.addChild(layer);
    }
});