/**
 * PreviewLayer — Auto-generated from layout JSON
 * Design: 873x643
 *
 * Uses setDesignResolutionSize() for screen adaptation.
 * Positions are pre-computed by LayoutEngine.
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
        var root = new cc.Node();
        root.setContentSize(873, 643);
        root.setPosition(0, 0);
        root.setName("root");
        root.setAnchorPoint(0, 0);

        // ── sprBg ──
        var sprBg = UIBuilder.createBackground(root, res_preview.sprBg);
        sprBg.setName("sprBg");

        // ── sprResourceBar ──
        var sprResourceBar = new ccui.Scale9Sprite(res_preview.sprResourceBar);
        sprResourceBar.setContentSize(733, 70);
        sprResourceBar.setPosition(437, 600);
        sprResourceBar.setName("sprResourceBar");
        root.addChild(sprResourceBar);

        // ── rowGold (Row) ──
        var rowGold = new cc.Node();
        rowGold.setContentSize(248, 57);
        rowGold.setPosition(30, 35);
        rowGold.setName("rowGold");
        rowGold.setAnchorPoint(0, 0.5);
        sprResourceBar.addChild(rowGold);

        // ── iconGold ──
        var iconGold = UIBuilder.sprite(res_preview.iconGold);
        iconGold.setContentSize(52, 57);
        iconGold.setPosition(26, 29);
        iconGold.setName("iconGold");
        rowGold.addChild(iconGold);

        // ── sprGoldNum ──
        var sprGoldNum = UIBuilder.sprite(res_preview.sprGoldNum);
        sprGoldNum.setContentSize(191, 32);
        sprGoldNum.setPosition(153, 29);
        sprGoldNum.setName("sprGoldNum");
        rowGold.addChild(sprGoldNum);

        // ── rowDiamond (Row) ──
        var rowDiamond = new cc.Node();
        rowDiamond.setContentSize(254, 52);
        rowDiamond.setPosition(703, 35);
        rowDiamond.setName("rowDiamond");
        rowDiamond.setAnchorPoint(1, 0.5);
        sprResourceBar.addChild(rowDiamond);

        // ── sprDiamondNum ──
        var sprDiamondNum = UIBuilder.sprite(res_preview.sprDiamondNum);
        sprDiamondNum.setContentSize(191, 32);
        sprDiamondNum.setPosition(96, 26);
        sprDiamondNum.setName("sprDiamondNum");
        rowDiamond.addChild(sprDiamondNum);

        // ── iconDiamond ──
        var iconDiamond = UIBuilder.sprite(res_preview.iconDiamond);
        iconDiamond.setContentSize(58, 52);
        iconDiamond.setPosition(225, 26);
        iconDiamond.setName("iconDiamond");
        rowDiamond.addChild(iconDiamond);

        // ── rowContent (Row) ──
        var rowContent = new cc.Node();
        rowContent.setContentSize(833, 543);
        rowContent.setPosition(437, 287);
        rowContent.setName("rowContent");
        rowContent.setAnchorPoint(0.5, 0.5);
        root.addChild(rowContent);

        // ── sprCard ──
        var sprCard = UIBuilder.sprite(res_preview.sprCard);
        sprCard.setContentSize(377, 416);
        sprCard.setPosition(189, 272);
        sprCard.setName("sprCard");
        rowContent.addChild(sprCard);

        // ── colCardContent (Column) ──
        var colCardContent = new cc.Node();
        colCardContent.setContentSize(337, 361);
        colCardContent.setPosition(189, 216);
        colCardContent.setName("colCardContent");
        colCardContent.setAnchorPoint(0.5, 0.5);
        sprCard.addChild(colCardContent);

        // ── rowCardHeader (Row) ──
        var rowCardHeader = new cc.Node();
        rowCardHeader.setContentSize(295, 172);
        rowCardHeader.setPosition(169, 275);
        rowCardHeader.setName("rowCardHeader");
        rowCardHeader.setAnchorPoint(0.5, 0.5);
        colCardContent.addChild(rowCardHeader);

        // ── sprAvatar ──
        var sprAvatar = UIBuilder.sprite(res_preview.sprAvatar);
        sprAvatar.setContentSize(158, 172);
        sprAvatar.setPosition(79, 86);
        sprAvatar.setName("sprAvatar");
        rowCardHeader.addChild(sprAvatar);

        // ── colNameBadge (Column) ──
        var colNameBadge = new cc.Node();
        colNameBadge.setContentSize(127, 157);
        colNameBadge.setPosition(232, 86);
        colNameBadge.setName("colNameBadge");
        colNameBadge.setAnchorPoint(0.5, 0.5);
        rowCardHeader.addChild(colNameBadge);

        // ── sprName ──
        var sprName = UIBuilder.sprite(res_preview.sprName);
        sprName.setContentSize(126, 35);
        sprName.setPosition(64, 140);
        sprName.setName("sprName");
        colNameBadge.addChild(sprName);

        // ── sprBadge ──
        var sprBadge = UIBuilder.sprite(res_preview.sprBadge);
        sprBadge.setContentSize(127, 117);
        sprBadge.setPosition(64, 59);
        sprBadge.setName("sprBadge");
        colNameBadge.addChild(sprBadge);

        // ── colStats (Column) ──
        var colStats = new cc.Node();
        colStats.setContentSize(283, 127);
        colStats.setPosition(169, 64);
        colStats.setName("colStats");
        colStats.setAnchorPoint(0.5, 0.5);
        colCardContent.addChild(colStats);

        // ── rowHP (Row) ──
        var rowHP = new cc.Node();
        rowHP.setContentSize(260, 37);
        rowHP.setPosition(130, 109);
        rowHP.setName("rowHP");
        rowHP.setAnchorPoint(0.5, 0.5);
        colStats.addChild(rowHP);

        // ── sprTextHP ──
        var sprTextHP = UIBuilder.sprite(res_preview.sprTextHP);
        sprTextHP.setContentSize(62, 37);
        sprTextHP.setPosition(31, 19);
        sprTextHP.setName("sprTextHP");
        rowHP.addChild(sprTextHP);

        // ── iconRed ──
        var iconRed = UIBuilder.sprite(res_preview.iconRed);
        iconRed.setContentSize(32, 32);
        iconRed.setPosition(86, 19);
        iconRed.setName("iconRed");
        rowHP.addChild(iconRed);

        // ── sprBarRed ──
        var sprBarRed = UIBuilder.sprite(res_preview.sprBarRed);
        sprBarRed.setContentSize(150, 20);
        sprBarRed.setPosition(185, 19);
        sprBarRed.setName("sprBarRed");
        rowHP.addChild(sprBarRed);

        // ── rowMP (Row) ──
        var rowMP = new cc.Node();
        rowMP.setContentSize(232, 37);
        rowMP.setPosition(116, 64);
        rowMP.setName("rowMP");
        rowMP.setAnchorPoint(0.5, 0.5);
        colStats.addChild(rowMP);

        // ── sprTextMP ──
        var sprTextMP = UIBuilder.sprite(res_preview.sprTextMP);
        sprTextMP.setContentSize(62, 36);
        sprTextMP.setPosition(31, 19);
        sprTextMP.setName("sprTextMP");
        rowMP.addChild(sprTextMP);

        // ── iconYellow ──
        var iconYellow = UIBuilder.sprite(res_preview.iconYellow);
        iconYellow.setContentSize(32, 32);
        iconYellow.setPosition(86, 19);
        iconYellow.setName("iconYellow");
        rowMP.addChild(iconYellow);

        // ── sprBarYellow ──
        var sprBarYellow = UIBuilder.sprite(res_preview.sprBarYellow);
        sprBarYellow.setContentSize(122, 21);
        sprBarYellow.setPosition(171, 19);
        sprBarYellow.setName("sprBarYellow");
        rowMP.addChild(sprBarYellow);

        // ── rowSP (Row) ──
        var rowSP = new cc.Node();
        rowSP.setContentSize(283, 37);
        rowSP.setPosition(142, 19);
        rowSP.setName("rowSP");
        rowSP.setAnchorPoint(0.5, 0.5);
        colStats.addChild(rowSP);

        // ── sprTextSP ──
        var sprTextSP = UIBuilder.sprite(res_preview.sprTextSP);
        sprTextSP.setContentSize(62, 36);
        sprTextSP.setPosition(31, 19);
        sprTextSP.setName("sprTextSP");
        rowSP.addChild(sprTextSP);

        // ── iconGreen ──
        var iconGreen = UIBuilder.sprite(res_preview.iconGreen);
        iconGreen.setContentSize(32, 32);
        iconGreen.setPosition(86, 19);
        iconGreen.setName("iconGreen");
        rowSP.addChild(iconGreen);

        // ── sprBarGreen ──
        var sprBarGreen = UIBuilder.sprite(res_preview.sprBarGreen);
        sprBarGreen.setContentSize(173, 21);
        sprBarGreen.setPosition(197, 19);
        sprBarGreen.setName("sprBarGreen");
        rowSP.addChild(sprBarGreen);

        // ── colRightPanel (Column) ──
        var colRightPanel = new cc.Node();
        colRightPanel.setContentSize(373, 486);
        colRightPanel.setPosition(647, 272);
        colRightPanel.setName("colRightPanel");
        colRightPanel.setAnchorPoint(0.5, 0.5);
        rowContent.addChild(colRightPanel);

        // ── sprDecor ──
        var sprDecor = UIBuilder.sprite(res_preview.sprDecor);
        sprDecor.setContentSize(339, 251);
        sprDecor.setPosition(187, 361);
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
        btnHighClass.setPosition(187, 202);
        btnHighClass.setName("btnHighClass");
        colRightPanel.addChild(btnHighClass);

        // ── sprArrowUp ──
        var sprArrowUp = UIBuilder.sprite(res_preview.sprArrowUp);
        sprArrowUp.setContentSize(33, 40);
        sprArrowUp.setPosition(187, 149);
        sprArrowUp.setName("sprArrowUp");
        colRightPanel.addChild(sprArrowUp);

        // Animations for sprArrowUp
        var sprArrowUp_anim0 = cc.moveBy(0.40, 0, 5);
        sprArrowUp_anim0 = sprArrowUp_anim0.easing(cc.easeInOut(2));
        sprArrowUp_anim0 = cc.sequence(sprArrowUp_anim0, sprArrowUp_anim0.reverse());
        sprArrowUp_anim0 = cc.repeatForever(sprArrowUp_anim0);
        sprArrowUp.runAction(sprArrowUp_anim0);

        // ── btnUpgrade ──
        var btnUpgrade = UIBuilder.button(res_preview.btnUpgrade);
        btnUpgrade.setPressedActionEnabled(true);
        btnUpgrade.setTitleText("UPGRADE");
        btnUpgrade.setContentSize(212, 50);
        btnUpgrade.setPosition(187, 96);
        btnUpgrade.setName("btnUpgrade");
        colRightPanel.addChild(btnUpgrade);

        // ── rowStars (Row) ──
        var rowStars = new cc.Node();
        rowStars.setContentSize(373, 63);
        rowStars.setPosition(187, 32);
        rowStars.setName("rowStars");
        rowStars.setAnchorPoint(0.5, 0.5);
        colRightPanel.addChild(rowStars);

        // ── star1 ──
        var star1 = UIBuilder.sprite(res_preview.star1);
        star1.setContentSize(65, 63);
        star1.setPosition(33, 32);
        star1.setName("star1");
        rowStars.addChild(star1);

        // ── star2 ──
        var star2 = UIBuilder.sprite(res_preview.star2);
        star2.setContentSize(65, 63);
        star2.setPosition(110, 32);
        star2.setName("star2");
        rowStars.addChild(star2);

        // ── star3 ──
        var star3 = UIBuilder.sprite(res_preview.star3);
        star3.setContentSize(65, 63);
        star3.setPosition(187, 32);
        star3.setName("star3");
        rowStars.addChild(star3);

        // ── star4 ──
        var star4 = UIBuilder.sprite(res_preview.star4);
        star4.setContentSize(65, 63);
        star4.setPosition(264, 32);
        star4.setName("star4");
        rowStars.addChild(star4);

        // ── star5 ──
        var star5 = UIBuilder.sprite(res_preview.star5);
        star5.setContentSize(65, 63);
        star5.setPosition(341, 32);
        star5.setName("star5");
        rowStars.addChild(star5);

        // ── btnReplay ──
        var btnReplay = UIBuilder.button(res_preview.btnReplay);
        btnReplay.setPressedActionEnabled(true);
        btnReplay.setContentSize(89, 85);
        btnReplay.setPosition(55, 53);
        btnReplay.setName("btnReplay");
        root.addChild(btnReplay);

        this.addChild(root);

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