/**
 * PreviewLayer — Auto-generated adaptive layout
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
        var sprBg = UIBuilder.sprite(res_preview.sprBg);
        sprBg.setName("sprBg");
        root.addChild(sprBg);
        UIBuilder.setLayoutSize(sprBg, 0, 0, "FILL");

        // ── sprResourceBar ──
        var sprResourceBar = new ccui.Layout();
        sprResourceBar.setBackGroundImage(res_preview.sprResourceBar);
        sprResourceBar.setBackGroundImageScale9Enabled(true);
        sprResourceBar.setContentSize(733, 70);
        sprResourceBar.setName("sprResourceBar");
        root.addChild(sprResourceBar);
        UIBuilder.pinEdges(sprResourceBar, { top: 8, horizontalCenter: true });

        // ── rowGold (Row) ──
        var rowGold = new ccui.Layout();
        rowGold.setName("rowGold");
        rowGold.setAnchorPoint(0, 0.5);
        sprResourceBar.addChild(rowGold);
        UIBuilder.pinEdges(rowGold, { left: 30, verticalCenter: true });

        // ── iconGold ──
        var iconGold = UIBuilder.sprite(res_preview.iconGold);
        iconGold.setName("iconGold");
        rowGold.addChild(iconGold);

        // ── sprGoldNum ──
        var sprGoldNum = UIBuilder.sprite(res_preview.sprGoldNum);
        sprGoldNum.setName("sprGoldNum");
        rowGold.addChild(sprGoldNum);

        UIBuilder.arrangeAsRow(rowGold, { gap: 5, alignItems: "center" });

        // ── rowDiamond (Row) ──
        var rowDiamond = new ccui.Layout();
        rowDiamond.setName("rowDiamond");
        rowDiamond.setAnchorPoint(1, 0.5);
        sprResourceBar.addChild(rowDiamond);
        UIBuilder.pinEdges(rowDiamond, { right: 30, verticalCenter: true });

        // ── sprDiamondNum ──
        var sprDiamondNum = UIBuilder.sprite(res_preview.sprDiamondNum);
        sprDiamondNum.setName("sprDiamondNum");
        rowDiamond.addChild(sprDiamondNum);

        // ── iconDiamond ──
        var iconDiamond = UIBuilder.sprite(res_preview.iconDiamond);
        iconDiamond.setName("iconDiamond");
        rowDiamond.addChild(iconDiamond);

        UIBuilder.arrangeAsRow(rowDiamond, { gap: 5, alignItems: "center" });

        // ── rowContent (Row) ──
        var rowContent = new ccui.Layout();
        rowContent.setName("rowContent");
        root.addChild(rowContent);
        UIBuilder.pinEdges(rowContent, { left: 40, right: 40, top: 85, bottom: 15 });

        // ── sprCard ──
        var sprCard = new ccui.Layout();
        sprCard.setBackGroundImage(res_preview.sprCard);
        sprCard.setContentSize(377, 416);
        sprCard.setName("sprCard");
        rowContent.addChild(sprCard);

        // ── colCardContent (Column) ──
        var colCardContent = new ccui.Layout();
        colCardContent.setName("colCardContent");
        sprCard.addChild(colCardContent);
        UIBuilder.pinEdges(colCardContent, { left: 20, right: 20, top: 20, bottom: 35 });

        // ── rowCardHeader (Row) ──
        var rowCardHeader = new ccui.Layout();
        rowCardHeader.setName("rowCardHeader");
        colCardContent.addChild(rowCardHeader);

        // ── sprAvatar ──
        var sprAvatar = UIBuilder.sprite(res_preview.sprAvatar);
        sprAvatar.setName("sprAvatar");
        rowCardHeader.addChild(sprAvatar);

        // ── colNameBadge (Column) ──
        var colNameBadge = new ccui.Layout();
        colNameBadge.setName("colNameBadge");
        rowCardHeader.addChild(colNameBadge);

        // ── sprName ──
        var sprName = UIBuilder.sprite(res_preview.sprName);
        sprName.setName("sprName");
        colNameBadge.addChild(sprName);

        // ── sprBadge ──
        var sprBadge = UIBuilder.sprite(res_preview.sprBadge);
        sprBadge.setName("sprBadge");
        colNameBadge.addChild(sprBadge);

        UIBuilder.arrangeAsColumn(colNameBadge, { gap: 5, alignItems: "center" });

        UIBuilder.arrangeAsRow(rowCardHeader, { gap: 10, alignItems: "center" });

        // ── colStats (Column) ──
        var colStats = new ccui.Layout();
        colStats.setName("colStats");
        colCardContent.addChild(colStats);

        // ── rowHP (Row) ──
        var rowHP = new ccui.Layout();
        rowHP.setContentSize(rowHP.getContentSize().width, 37);
        rowHP.setName("rowHP");
        colStats.addChild(rowHP);

        // ── sprTextHP ──
        var sprTextHP = UIBuilder.sprite(res_preview.sprTextHP);
        sprTextHP.setName("sprTextHP");
        rowHP.addChild(sprTextHP);
        (function() {
            var _cs = sprTextHP.getContentSize();
            var _w = _cs.width, _h = _cs.height;
            _w = Math.max(_w, 62);
            sprTextHP.setContentSize(_w, _h);
        })();

        // ── iconRed ──
        var iconRed = UIBuilder.sprite(res_preview.iconRed);
        iconRed.setName("iconRed");
        rowHP.addChild(iconRed);

        // ── sprBarRed ──
        var sprBarRed = new cc.ProgressTimer(new cc.Sprite(res_preview.sprBarRed));
        sprBarRed.setType(cc.ProgressTimer.TYPE_BAR);
        sprBarRed.setMidpoint(cc.p(0, 0.5));
        sprBarRed.setBarChangeRate(cc.p(1, 0));
        sprBarRed.setPercentage(100);
        UIBuilder.setLayoutSize(sprBarRed, 150, 20);
        sprBarRed.setName("sprBarRed");
        rowHP.addChild(sprBarRed);

        UIBuilder.arrangeAsRow(rowHP, { gap: 8, alignItems: "center" });

        // ── rowMP (Row) ──
        var rowMP = new ccui.Layout();
        rowMP.setContentSize(rowMP.getContentSize().width, 37);
        rowMP.setName("rowMP");
        colStats.addChild(rowMP);

        // ── sprTextMP ──
        var sprTextMP = UIBuilder.sprite(res_preview.sprTextMP);
        sprTextMP.setName("sprTextMP");
        rowMP.addChild(sprTextMP);
        (function() {
            var _cs = sprTextMP.getContentSize();
            var _w = _cs.width, _h = _cs.height;
            _w = Math.max(_w, 62);
            sprTextMP.setContentSize(_w, _h);
        })();

        // ── iconYellow ──
        var iconYellow = UIBuilder.sprite(res_preview.iconYellow);
        iconYellow.setName("iconYellow");
        rowMP.addChild(iconYellow);

        // ── sprBarYellow ──
        var sprBarYellow = new cc.ProgressTimer(new cc.Sprite(res_preview.sprBarYellow));
        sprBarYellow.setType(cc.ProgressTimer.TYPE_BAR);
        sprBarYellow.setMidpoint(cc.p(0, 0.5));
        sprBarYellow.setBarChangeRate(cc.p(1, 0));
        sprBarYellow.setPercentage(100);
        UIBuilder.setLayoutSize(sprBarYellow, 122, 21);
        sprBarYellow.setName("sprBarYellow");
        rowMP.addChild(sprBarYellow);

        UIBuilder.arrangeAsRow(rowMP, { gap: 8, alignItems: "center" });

        // ── rowSP (Row) ──
        var rowSP = new ccui.Layout();
        rowSP.setContentSize(rowSP.getContentSize().width, 37);
        rowSP.setName("rowSP");
        colStats.addChild(rowSP);

        // ── sprTextSP ──
        var sprTextSP = UIBuilder.sprite(res_preview.sprTextSP);
        sprTextSP.setName("sprTextSP");
        rowSP.addChild(sprTextSP);
        (function() {
            var _cs = sprTextSP.getContentSize();
            var _w = _cs.width, _h = _cs.height;
            _w = Math.max(_w, 62);
            sprTextSP.setContentSize(_w, _h);
        })();

        // ── iconGreen ──
        var iconGreen = UIBuilder.sprite(res_preview.iconGreen);
        iconGreen.setName("iconGreen");
        rowSP.addChild(iconGreen);

        // ── sprBarGreen ──
        var sprBarGreen = new cc.ProgressTimer(new cc.Sprite(res_preview.sprBarGreen));
        sprBarGreen.setType(cc.ProgressTimer.TYPE_BAR);
        sprBarGreen.setMidpoint(cc.p(0, 0.5));
        sprBarGreen.setBarChangeRate(cc.p(1, 0));
        sprBarGreen.setPercentage(100);
        UIBuilder.setLayoutSize(sprBarGreen, 173, 21);
        sprBarGreen.setName("sprBarGreen");
        rowSP.addChild(sprBarGreen);

        UIBuilder.arrangeAsRow(rowSP, { gap: 8, alignItems: "center" });

        UIBuilder.arrangeAsColumn(colStats, { gap: 8 });

        UIBuilder.arrangeAsColumn(colCardContent, { alignItems: "center", justifyContent: "spaceBetween" });

        // ── colRightPanel (Column) ──
        var colRightPanel = new ccui.Layout();
        colRightPanel.setName("colRightPanel");
        rowContent.addChild(colRightPanel);

        // ── sprDecor ──
        var sprDecor = UIBuilder.sprite(res_preview.sprDecor);
        sprDecor.setName("sprDecor");
        colRightPanel.addChild(sprDecor);

        // ── btnHighClass ──
        var btnHighClass = UIBuilder.button(res_preview.btnHighClass);
        btnHighClass.setTitleText("High Class");
        UIBuilder.setLayoutSize(btnHighClass, 212, 50);
        btnHighClass.setName("btnHighClass");
        colRightPanel.addChild(btnHighClass);

        // ── sprArrowUp ──
        var sprArrowUp = UIBuilder.sprite(res_preview.sprArrowUp);
        sprArrowUp.setName("sprArrowUp");
        colRightPanel.addChild(sprArrowUp);

        // ── btnUpgrade ──
        var btnUpgrade = UIBuilder.button(res_preview.btnUpgrade);
        btnUpgrade.setTitleText("UPGRADE");
        UIBuilder.setLayoutSize(btnUpgrade, 212, 50);
        btnUpgrade.setName("btnUpgrade");
        colRightPanel.addChild(btnUpgrade);

        // ── rowStars (Row) ──
        var rowStars = new ccui.Layout();
        rowStars.setName("rowStars");
        colRightPanel.addChild(rowStars);

        // ── star1 ──
        var star1 = UIBuilder.sprite(res_preview.star1);
        star1.setName("star1");
        rowStars.addChild(star1);

        // ── star2 ──
        var star2 = UIBuilder.sprite(res_preview.star2);
        star2.setName("star2");
        rowStars.addChild(star2);

        // ── star3 ──
        var star3 = UIBuilder.sprite(res_preview.star3);
        star3.setName("star3");
        rowStars.addChild(star3);

        // ── star4 ──
        var star4 = UIBuilder.sprite(res_preview.star4);
        star4.setName("star4");
        rowStars.addChild(star4);

        // ── star5 ──
        var star5 = UIBuilder.sprite(res_preview.star5);
        star5.setName("star5");
        rowStars.addChild(star5);

        UIBuilder.arrangeAsRow(rowStars, { gap: 12, alignItems: "center" });

        UIBuilder.arrangeAsColumn(colRightPanel, { gap: 8, alignItems: "center" });

        UIBuilder.arrangeAsRow(rowContent, { gap: 100, alignItems: "center", justifyContent: "center" });

        // ── btnReplay ──
        var btnReplay = UIBuilder.button(res_preview.btnReplay);
        UIBuilder.setLayoutSize(btnReplay, 89, 85);
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