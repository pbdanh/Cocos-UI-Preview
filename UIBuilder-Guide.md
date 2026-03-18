# UIBuilder — Agent API Reference

> Declarative UI library for cocos2d-html5 (v3.x). Provides high-level functions so coding agents can build UIs without memorizing low-level cocos2d APIs.

## Coordinate System

```
(0, height) ──────────────── (width, height)
     │                            │
     │     (width/2, height/2)    │  ← CENTER
     │                            │
(0, 0) ────────────────────── (width, 0)
  ORIGIN (bottom-left)
```

- **Origin (0,0) is BOTTOM-LEFT** (opposite to CSS/HTML).
- `cc.winSize.width` / `cc.winSize.height` = design resolution.
- `*Percent` variants accept 0–100 instead of pixels.

## Conventions

- First parameter is always `parent` (the cc.Node to add to).
- Last parameter is always `opts` (optional object).
- All functions **return** the created node.

---

## Module Structure

Files in `src/core/ui-builder/` (loaded sequentially via `project.json`):

| File | Contents |
|------|----------|
| `_base.js` | Core object, `_applyOpts`, percent helpers |
| `_display.js` | Sprites, ImageView, Background |
| `_text.js` | Labels, Text, RichText |
| `_button.js` | Buttons, Menu |
| `_input.js` | TextField, CheckBox, Slider |
| `_progress.js` | LoadingBar, ProgressTimer |
| `_layout.js` | Layout, ScrollView, ListView, PageView, ColorLayer, **FullScreenLayout**, **pinEdges**, **setPercentPos/Size** |
| `_shapes.js` | DrawNode rect & circle |
| `_animation.js` | moveTo, fadeIn, sequence, etc. |
| `_position.js` | Alignment, centering, sizing, **pinToTop/Bottom/Left/Right** |
| `_scene.js` | Scene transitions |
| `_events.js` | Touch listeners, scheduling |
| `_audio.js` | Music, SFX |
| `_particles.js` | Particles, sprite animation |
| `_high-level.js` | Layout helpers (Row, Column, Grid, spaceBetween), composite widgets, declarative `build()` |

All methods are on the global `UIBuilder` object.

---

## Common `opts` Keys

All `create*` functions accept these in their `opts` parameter:

| Key | Type | Description |
|-----|------|-------------|
| `anchor` | `[ax, ay]` | Anchor point (0–1). Default `[0.5, 0.5]` |
| `scale` | `number` or `[sx, sy]` | Scale factor |
| `rotation` | `number` | Degrees |
| `opacity` | `number` | 0–255 |
| `zOrder` | `number` | Render order |
| `visible` | `boolean` | Show/hide |
| `name` | `string` | Node name (for lookup) |
| `tag` | `number` | Node tag |
| `color` | `cc.Color` | Tint color |
| `flipX`/`flipY` | `boolean` | Flip |
| `size` | `[w, h]` | Content size override |

---

## Layout Decision Tree

**Use this flowchart to choose the right layout function.** This is the most important section for ensuring correct, overlap-free UI layout.

```
Is it a full-screen root container?
  → YES: createFullScreenLayout()

Does it need to stick to a screen edge (header/footer)?
  → YES: createLayout() + pinEdges()

Are the items in a row or column with fixed gaps?
  → YES, horizontal: createRow(gap)
  → YES, vertical: createColumn(gap)

Are items spread evenly across full parent width/height?
  → YES: spaceBetween()  (size-aware, no overlap)

Is it a 2D grid of items?
  → YES: createGrid(cols)

Are items overlapping at the same spot (bg + icon + badge)?
  → YES: stack()

Is it a standalone element at a specific position?
  → YES: createSprite / createButton / createLabel with pixel coords
```

### Layout Function Comparison

| Function | Children added to parent? | Position control | CSS Equivalent |
|----------|--------------------------|-----------------|----------------|
| `createRow(parent, children, x, y, {gap})` | **No** — creates container, adds children to it | Auto-spaced left→right | `display: flex; gap` |
| `createColumn(parent, children, x, y, {gap})` | **No** — creates container, adds children to it | Auto-spaced top→bottom | `flex-direction: column; gap` |
| `createGrid(parent, cols, children, x, y)` | **No** — creates container | Auto-grid layout | `display: grid` |
| `spaceBetween(parent, children, dir)` | **Yes** — children already in parent | Repositions existing children | `justify-content: space-between` |
| `distribute(parent, children, dir)` | **Yes** — children already in parent | ⚠️ Center-point only (may overlap) | — |
| `stack(parent, children, x, y)` | **No** — creates container | All at (0,0) overlapping | `position: absolute` stacking |

> **Key distinction**: `createRow`/`createColumn`/`createGrid`/`stack` expect children that are **created but NOT yet added to parent**. `spaceBetween`/`distribute` expect children **already added to parent**.

### When NOT to use layout functions

Use direct pixel positioning when:
- Element has no spatial relationship to siblings (e.g., floating button)
- Element position was precisely measured from grid-overlaid demo
- Element is the only child of its parent

---

## API Reference — Core

### Display

| Signature | Description |
|-----------|-------------|
| `createBackground(parent, file)` | Full-screen centered sprite |
| `createSprite(parent, file, x, y, opts)` | Sprite at pixel position |
| `createSpritePercent(parent, file, pX, pY, opts)` | Sprite at percent position |
| `createScale9Sprite(parent, file, capInsets, w, h, x, y, opts)` | 9-slice sprite |
| `createImageView(parent, file, x, y, opts)` | ccui.ImageView widget |
| `createImageViewPercent(parent, file, pX, pY, opts)` | ImageView at percent |
| `setNodePercent(node, pX, pY)` | Set node position by percent |

### Text

| Signature | Description |
|-----------|-------------|
| `createLabel(parent, text, fontSize, x, y, opts)` | cc.LabelTTF. opts: `fontName` |
| `createLabelPercent(parent, text, fontSize, pX, pY, opts)` | Label at percent |
| `createLabelBMFont(parent, text, fntFile, x, y, opts)` | Bitmap font label |
| `createText(parent, text, fontName, fontSize, x, y, opts)` | ccui.Text. opts: `textColor`, `areaWidth`, `areaHeight`, `hAlign`, `vAlign` |
| `createTextPercent(parent, text, fontName, fontSize, pX, pY, opts)` | Text at percent |
| `createRichText(parent, x, y, opts)` | Rich text container. opts: `width` |
| `addRichElement(richText, type, opts)` | Add element: type=`"text"`/`"image"`/`"custom"` |

### Buttons

| Signature | Description |
|-----------|-------------|
| `createButton(parent, normalImg, x, y, callback, opts)` | ccui.Button. opts: `selectedImg`, `disabledImg`, `scale9`, `capInsets`, `pressedActionEnabled` |
| `createButtonPercent(parent, normalImg, pX, pY, callback, opts)` | Button at percent |
| `createButtonWithTitle(parent, normalImg, title, x, y, callback, opts)` | Button with label. opts: `titleFontName`, `titleFontSize`, `titleColor` |
| `createMenuItemImage(parent, normalImg, selectedImg, x, y, callback, opts)` | Classic cc.Menu button |
| `createMenuItemLabel(parent, text, fontSize, x, y, callback, opts)` | Text menu item |
| `createMenu(parent, items, x, y, opts)` | Menu container. opts: `alignVertically`, `alignHorizontally` |

### Input

| Signature | Description |
|-----------|-------------|
| `createTextField(parent, placeholder, fontName, fontSize, x, y, opts)` | Text input. opts: `maxLength`, `passwordEnabled`, `passwordChar`, `textColor`, `placeHolderColor`, `callback` |
| `createCheckBox(parent, bgImg, crossImg, x, y, callback, opts)` | Checkbox. opts: `selected`, `bgSelectedImg`, `bgDisabledImg` |
| `createSlider(parent, barImg, ballImg, x, y, callback, opts)` | Slider. opts: `progressBarImg`, `percent` |

### Progress

| Signature | Description |
|-----------|-------------|
| `createLoadingBar(parent, texture, x, y, percent, opts)` | Loading bar. opts: `direction`, `scale9`, `capInsets` |
| `createProgressTimer(parent, spriteFile, x, y, opts)` | Radial/bar timer. opts: `type`, `midpoint`, `barChangeRate`, `percent` |

### Shapes

| Signature | Description |
|-----------|-------------|
| `createRect(parent, w, h, x, y, fillColor, opts)` | Filled rect (DrawNode). opts: `borderWidth`, `borderColor` |
| `createCircle(parent, radius, x, y, fillColor, opts)` | Filled circle. opts: `borderWidth`, `borderColor`, `segments` |

### Animation

| Signature | Description |
|-----------|-------------|
| `moveTo(node, dur, x, y, easing)` | Animate position. easing: `{rate: 2}` |
| `moveBy(node, dur, dx, dy, easing)` | Relative move |
| `fadeIn(node, dur)` | Fade from 0 to 255 |
| `fadeOut(node, dur)` | Fade to 0 |
| `scaleTo(node, dur, scaleX, scaleY, easing)` | Animate scale |
| `rotateTo(node, dur, angle, easing)` | Animate rotation |
| `sequence(node, actions)` | Run actions sequentially |
| `spawn(node, actions)` | Run actions in parallel |
| `repeatForever(node, action)` | Loop forever |
| `delay(dur)` | Delay action (for sequences) |
| `callFunc(fn)` | Callback action (for sequences) |
| `runAction(node, action)` | Run single action |

### Position & Sizing

| Signature | Description |
|-----------|-------------|
| `centerIn(node, parent)` | Center within parent |
| `centerOnScreen(node)` | Center on screen |
| `alignTop(node, margin, x)` | Align to screen top |
| `alignBottom(node, margin, x)` | Align to screen bottom |
| `alignLeft(node, margin, y)` | Align to screen left |
| `alignRight(node, margin, y)` | Align to screen right |
| `fillParent(node, parent)` | Stretch to fill parent |
| `fitParent(node, parent)` | Fit within parent (keep ratio) |
| `screenCenter()` | Returns `{ x, y }` |
| `screenSize()` | Returns `{ width, height }` |

### Scene & Transition

| Signature | Description |
|-----------|-------------|
| `replaceScene(scene)` | Switch scene |
| `replaceSceneWithTransition(scene, dur, type, color)` | Types: `"fade"`, `"slideLeft"`, `"slideRight"`, `"slideUp"`, `"slideDown"`, `"flipX"`, `"flipY"` |

### Events

| Signature | Description |
|-----------|-------------|
| `addTouchListener(node, { onBegan, onMoved, onEnded, onCancelled })` | Single-touch listener. `onBegan` must return `true`. |
| `schedule(node, callback, interval, key)` | Repeat every N seconds |
| `scheduleOnce(node, callback, delay)` | One-shot after delay |

### Audio

| Signature | Description |
|-----------|-------------|
| `playMusic(file, loop)` | Background music (loop default `true`) |
| `stopMusic()` | Stop music |
| `playEffect(file, loop)` | Sound effect → returns audioId |
| `stopEffect(audioId)` | Stop effect |

### Particles

| Signature | Description |
|-----------|-------------|
| `createParticle(parent, plistFile, x, y, opts)` | Particle system from .plist |
| `createAnimatedSprite(parent, plistFile, framePrefix, frameCount, fps, x, y, opts)` | Frame animation. opts: `loop` |

---

## API Reference — Layout System

This section covers all functions for organizing UI elements systematically, analogous to CSS Flexbox.

### Containers

```javascript
UIBuilder.createNode(parent, x, y, opts)                    // empty node (like <div>)
UIBuilder.createClippingNode(parent, stencil, x, y, opts)   // clipping mask. opts: inverted, alphaThreshold
```

### Layout Containers

```javascript
// Generic layout container
UIBuilder.createLayout(parent, layoutType, w, h, x, y, opts)
// layoutType: ccui.Layout.ABSOLUTE | LINEAR_VERTICAL | LINEAR_HORIZONTAL | RELATIVE
// opts: bgColor, bgColorType, bgImage, clipping

// Full-screen root (always start with this)
UIBuilder.createFullScreenLayout(parent, opts)
// Returns ccui.Layout sized to cc.winSize, anchor (0,0)
```

### Responsive Pinning — `pinEdges()`

Pin any node to its parent's edges. This is how headers and footers stay in position.

```javascript
UIBuilder.pinEdges(node, edges)
```

**Edge options:**

| Key | Type | Description |
|-----|------|-------------|
| `left` | `number` | Left margin (px). Pins to left. |
| `right` | `number` | Right margin (px). Pins to right. |
| `top` | `number` | Top margin (px). Pins to top. |
| `bottom` | `number` | Bottom margin (px). Pins to bottom. |
| `horizontalCenter` | `boolean` | Center horizontally |
| `verticalCenter` | `boolean` | Center vertically |
| `stretchWidth` | `boolean` | Stretch width to fill (used when only left OR only right is set) |
| `stretchHeight` | `boolean` | Stretch height to fill (used when only top OR only bottom is set) |
| `percentWidth` | `number` | Width as 0–1 fraction of parent |
| `percentHeight` | `number` | Height as 0–1 fraction of parent |

> **Note**: When both `left` and `right` are set, `stretchWidth` is enabled automatically (uses CENTER edge internally). Same for `top`+`bottom`→`stretchHeight`. For single-edge pinning, you can optionally set `stretchWidth`/`stretchHeight` to stretch from that edge.

**Common patterns:**

```javascript
// Full-width top bar pinned to top
var topBar = UIBuilder.createLayout(root, ccui.Layout.ABSOLUTE, 720, 86, 0, 0,
    { name: "topBar", anchor: [0, 1] });
UIBuilder.pinEdges(topBar, { top: 0, left: 0, right: 0 });

// Bottom nav pinned to bottom
UIBuilder.pinEdges(navBar, { bottom: 0, left: 0, right: 0 });

// Center a panel, 80% parent width
UIBuilder.pinEdges(panel, { horizontalCenter: true, verticalCenter: true, percentWidth: 0.8 });
```

### Convenience Pinning

```javascript
UIBuilder.pinToTop(node, parent, margin)     // Pin to parent's top, centered X
UIBuilder.pinToBottom(node, parent, margin)   // Pin to parent's bottom, centered X
UIBuilder.pinToLeft(node, parent, margin)     // Pin to parent's left, centered Y
UIBuilder.pinToRight(node, parent, margin)    // Pin to parent's right, centered Y
```

These are simpler alternatives to `pinEdges` when you just need to pin to one edge.

### Percent-Based Positioning

```javascript
UIBuilder.setPercentPos(node, pX, pY)    // Position as 0–1 fraction of parent
UIBuilder.setPercentSize(node, pW, pH)   // Size as 0–1 fraction of parent
```

Works on both `ccui.Widget` (native percent) and any `cc.Node` (via LayoutComponent).

### Relative Layout

```javascript
UIBuilder.addToRelativeLayout(layout, widget, align, opts)
// align: ccui.RelativeLayoutParameter.CENTER_IN_PARENT, PARENT_TOP_LEFT, etc.
// opts: relName, name, margin: {l,t,r,b}
```

**Alignment constants:**

| Constant | Position |
|----------|----------|
| `PARENT_TOP_LEFT` | Top-left corner |
| `PARENT_TOP_CENTER_HORIZONTAL` | Top center |
| `PARENT_TOP_RIGHT` | Top-right corner |
| `PARENT_LEFT_CENTER_VERTICAL` | Left center |
| `CENTER_IN_PARENT` | Center |
| `PARENT_RIGHT_CENTER_VERTICAL` | Right center |
| `PARENT_LEFT_BOTTOM` | Bottom-left |
| `PARENT_BOTTOM_CENTER_HORIZONTAL` | Bottom center |
| `PARENT_RIGHT_BOTTOM` | Bottom-right |

---

## API Reference — Layout Helpers (CSS Flexbox–like)

### `createRow` — Horizontal row with auto-spacing

```javascript
UIBuilder.createRow(parent, [child1, child2, child3], x, y, { gap: 20, align: "center", name: "rowItems" })
```

- **Children**: Must be created but **NOT yet added** to parent
- **align**: `"top"` | `"center"` (default) | `"bottom"`
- Returns a container node positioned at (x, y) with children spaced inside
- Accounts for each child's `contentSize × scaleX` and `anchor point`

> [!IMPORTANT]
> **Always pass `{ name: "..." }` in opts** for `createRow`, `createColumn`, `createGrid`, and `stack`. These functions create intermediate container nodes. Without a name, the container appears as an unnamed `cc.Node` in the scene tree, which makes DevBridge path resolution unreliable and debugging harder.

### `createColumn` — Vertical column with auto-spacing

```javascript
UIBuilder.createColumn(parent, [child1, child2], x, y, { gap: 15, align: "center", name: "colItems" })
```

- **align**: `"left"` | `"center"` (default) | `"right"`
- Children laid out **top-to-bottom**
- Accounts for each child's `contentSize × scaleY` and `anchor point`

### `createGrid` — Grid layout

```javascript
UIBuilder.createGrid(parent, 3, children, x, y, { gapX: 10, gapY: 10, name: "gridItems" })
```

- **cols**: Number of columns
- opts: `cellWidth`, `cellHeight` (auto-detected from largest child if omitted)

### `spaceBetween` — Size-aware even distribution

```javascript
UIBuilder.spaceBetween(parent, children, "horizontal", { margin: 10 })
```

- **Children**: Must **already be added** to parent
- Repositions children to spread evenly across parent width/height
- **Size-aware**: Accounts for each child's `contentSize × scale`, no overlap
- **margin**: Outer padding from parent edges
- Like CSS `justify-content: space-between`

### `distribute` — Center-point distribution

```javascript
UIBuilder.distribute(parent, children, "horizontal", { margin: 20 })
```

> ⚠️ **WARNING**: Distributes center points evenly but does NOT account for item sizes. Items wider than slot width WILL overlap. **Use `spaceBetween()` instead** for most cases.

### `stack` — Overlay children at same position

```javascript
UIBuilder.stack(parent, [bg, icon, badge], x, y, { name: "stkBadge" })
```

- All children positioned at (0,0) within a container at (x, y)
- z-order matches array order (index 0 = back, last = front)

### `align` — Multi-node alignment

```javascript
UIBuilder.align([nodeA, nodeB, nodeC], "centerX", 360)
```

- **types**: `"left"` | `"right"` | `"top"` | `"bottom"` | `"centerX"` | `"centerY"`
- If value omitted, uses average of current positions

---

## Common Layout Patterns

### Pattern 1: Currency bar (sprite with label + button inside)

Children that display text/buttons INSIDE a sprite must be children of that sprite node.

```javascript
// Create standalone (NOT added to parent)
var goldBar = new cc.Sprite(res.bgGold);
goldBar.setName("goldBar");
var barSize = goldBar.getContentSize();

// Label as CHILD of bar
var lblGold = new cc.LabelTTF("0000", "Arial", 18);
lblGold.setPosition(barSize.width / 2, barSize.height / 2);
goldBar.addChild(lblGold);

// Button as CHILD of bar
var btnAdd = new ccui.Button(res.btnAdd);
btnAdd.setPosition(barSize.width - 15, barSize.height / 2);
goldBar.addChild(btnAdd);

// Then pass to createRow (always include name):
UIBuilder.createRow(parent, [goldBar, gemsBar, btnSettings], cx, cy, { gap: 8, name: "rowCurrencies" });
```

### Pattern 2: Pinned header/footer

```javascript
// Header: full-width, pinned to top
var pnlHeader = UIBuilder.createLayout(root, ccui.Layout.ABSOLUTE, 720, 86, 0, 0, {
    name: "pnlHeader", anchor: [0, 1], zOrder: 5
});
UIBuilder.pinEdges(pnlHeader, { top: 0, left: 0, right: 0 });

// Footer: full-width, pinned to bottom
var pnlFooter = UIBuilder.createLayout(root, ccui.Layout.ABSOLUTE, 720, 100, 0, 0, {
    name: "pnlFooter", anchor: [0, 0], zOrder: 5
});
UIBuilder.pinEdges(pnlFooter, { bottom: 0, left: 0, right: 0 });
```

### Pattern 3: Navigation bar with spaceBetween

```javascript
// Create buttons first (they ARE added to parent by createButton)
var navChildren = [];
var navDefs = [
    { img: res.btn1, name: "btn1" },
    { img: res.btn2, name: "btn2" },
    { img: res.btn3, name: "btn3" }
];
for (var i = 0; i < navDefs.length; i++) {
    (function (info) {
        var btn = UIBuilder.createButton(pnlFooter, info.img, 0, 50, function () {
            cc.log(info.name + " clicked");
        }, { name: info.name, scale: 0.75 });
        navChildren.push(btn);
    })(navDefs[i]);
}
// Spread evenly (children already in parent)
UIBuilder.spaceBetween(pnlFooter, navChildren, "horizontal", { margin: 10 });
```

### Pattern 4: Dropdown panel with scaleY animation

```javascript
// Panel container
var panel = UIBuilder.createNode(root, x, y, {
    name: "pnlDropdown", anchor: [0.5, 1]
});

// Background — collapsed initially
var panelBG = UIBuilder.createSprite(panel, res.panelBG, 0, 0, {
    name: "panelBG", anchor: [0.5, 1]
});
panelBG.setScaleY(0);

// Hidden buttons
var btn = UIBuilder.createButton(panel, res.btn, 0, -100, callback, {
    name: "btnA", visible: false
});

// Toggle animation
function toggle(expanded) {
    panelBG.stopAllActions();
    if (expanded) {
        panelBG.runAction(cc.scaleTo(0.3, 1, 1).easing(cc.easeBackOut()));
        btn.setVisible(true);
        UIBuilder.fadeIn(btn, 0.3);
    } else {
        panelBG.runAction(cc.scaleTo(0.25, 1, 0).easing(cc.easeBackIn()));
        UIBuilder.fadeOut(btn, 0.2);
        UIBuilder.scheduleOnce(btn, function () { btn.setVisible(false); }, 0.2);
    }
}
```

---

## API Reference — Composite Widgets

### `createPopup(parent, opts)` → `{ root, panel, content }`

```javascript
var popup = UIBuilder.createPopup(this, {
    title: "SETTINGS",              // optional title
    width: 400, height: 500,        // panel dimensions
    panelImg: "panel_bg.png",       // optional scale9 background
    panelCapInsets: cc.rect(20,20,20,20),
    closeImg: "btn_close.png",      // optional (default: "✕" text button)
    onClose: function() {},         // default: fade out & remove
    fadeIn: 0.25                    // entrance animation
});
// popup.root    → overlay layer (full screen dimming)
// popup.panel   → background panel node
// popup.content → cc.Node for adding your UI (centered in panel)
```

### `createTabBar(parent, tabs, x, y, opts)` → `{ container, switchTo(index) }`

```javascript
var tabs = UIBuilder.createTabBar(this, [
    { title: "Home",     content: homeNode },
    { title: "Shop",     content: shopNode },
    { title: "Settings", content: settingsNode }
], 360, 640, { tabWidth: 120, tabHeight: 44, fontSize: 16 });
tabs.switchTo(1);  // switch to Shop tab
```

### `createNavBar(parent, items, opts)` → `cc.DrawNode`

```javascript
UIBuilder.createNavBar(this, [
    { img: "home.png",    label: "Home",    onClick: fn },
    { img: "shop.png",    label: "Shop",    onClick: fn },
    { img: "profile.png", label: "Profile", onClick: fn }
], { height: 100, bgColor: cc.color(30, 30, 50, 240), y: 50 });
```

### `createToast(parent, message, opts)`

```javascript
UIBuilder.createToast(this, "Saved successfully!", {
    duration: 2, fontSize: 18, y: 200,
    bgColor: cc.color(40, 40, 40, 220)
});
// auto-fades and removes after duration
```

### `createCard(parent, opts)` → `cc.Node`

```javascript
UIBuilder.createCard(this, {
    img: "sword.png", title: "Sword", desc: "+50 ATK",
    width: 200, height: 280, x: 200, y: 400,
    onClick: function() { cc.log("selected"); }
});
```

### `createBadge(targetNode, count, opts)` → badge node

```javascript
var badge = UIBuilder.createBadge(button, 3);
badge.updateCount(5);   // update number
badge.updateCount(0);   // hides badge
```

### `createToggleButton(parent, opts)` → `{ node, isOn(), setOn(bool) }`

```javascript
var toggle = UIBuilder.createToggleButton(this, {
    onImg: "sound_on.png", offImg: "sound_off.png",
    x: 200, y: 400, isOn: true,
    onChange: function(isOn) { cc.log(isOn); }
});
```

### `createSwitch(parent, x, y, callback, opts)` → `{ node, isOn(), setOn(bool) }`

```javascript
var sw = UIBuilder.createSwitch(this, 360, 400, function(isOn) {
    cc.log("Sound: " + (isOn ? "ON" : "OFF"));
}, { isOn: true, width: 60, height: 30 });
```

---

## Declarative Builder — `build()`

Build entire UI trees from a JSON descriptor. Returns a `refs` map for accessing named nodes.

```javascript
var refs = UIBuilder.build(this, {
    type: "column", x: 360, y: 640, gap: 20, children: [
        { type: "sprite", file: "logo.png", ref: "logo" },
        { type: "label", text: "Welcome!", fontSize: 32, ref: "title",
          color: cc.color.WHITE },
        { type: "row", gap: 15, children: [
            { type: "button", img: "btn_play.png", title: "PLAY",
              titleFontSize: 22, onClick: function() { cc.log("play"); } },
            { type: "button", img: "btn_settings.png", title: "SETTINGS",
              onClick: function() { cc.log("settings"); } }
        ]},
        { type: "text", text: "v1.0.0", fontName: "Arial", fontSize: 12,
          color: cc.color(150,150,150) }
    ]
});
refs.logo;   // → cc.Sprite
refs.title;  // → cc.LabelTTF
```

### Supported Types

| Type | Required Props | Optional Props |
|------|---------------|----------------|
| `"node"` | — | x, y |
| `"sprite"` | `file` | x, y |
| `"label"` | `text`, `fontSize` | x, y, fontName |
| `"text"` | `text`, `fontName`, `fontSize` | x, y |
| `"button"` | `img` | x, y, onClick, title, titleFontSize, titleColor |
| `"imageView"` | `file` | x, y |
| `"rect"` | — | w, h, x, y, color |
| `"circle"` | — | radius, x, y, color |
| `"colorLayer"` | `color` | w, h |
| `"scale9"` | `file` | capInsets, w, h, x, y |
| `"layout"` | — | layoutType, w, h, x, y |
| `"scrollView"` | — | w, h, innerW, innerH, x, y |
| `"listView"` | — | w, h, x, y, direction |
| `"row"` | `children` | x, y, gap, align |
| `"column"` | `children` | x, y, gap, align |
| `"grid"` | `children`, `cols` | x, y, gapX, gapY |

**Special props:** `ref` (store in refs map), `children` (nest sub-nodes). All common `opts` keys work on every type.

Can also pass an array of root descriptors: `UIBuilder.build(this, [{...}, {...}])`.

---

## Anchor Point Reference

```
(0,1)────(0.5,1)────(1,1)      TOP
  │                    │
(0,0.5)  (0.5,0.5)  (1,0.5)    MIDDLE
  │                    │
(0,0)────(0.5,0)────(1,0)      BOTTOM
 LEFT     CENTER     RIGHT
```

Default: `(0.5, 0.5)` = center.

## Required Modules

```json
{ "modules": ["cocos2d", "extensions"] }
```
