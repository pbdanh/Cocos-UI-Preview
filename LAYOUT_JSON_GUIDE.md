# Layout Engine JSON Guide

Guide for writing JSON files for the Layout Engine. A JSON file describes a UI node tree where each node has positioning, sizing, visual properties, and children.

## Basic Structure

```json
[
  {
    "layoutType": "Absolute",
    "name": "root",
    "width": 720, "height": 1280,
    "useSafeArea": true,
    "children": [...]
  }
]
```

- File is an **array** containing 1 root node (or a single root object directly)
- Root node accepts `width`/`height` but the engine overrides them with screen size during compute
- `name` is **required** — used as the ID for lookup (`getNodeBounds("name")`)

---

## Node Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | **Required.** Unique node ID |
| `type` | string | Render type: `"sprite"`, `"button"`, `"label"`, `"text"`, `"imageView"`, `"scale9"`, `"progressBar"` |
| `layoutType` | string | **Required** layout for children: `"Absolute"`, `"Linear"`, `"Grid"`, `"Wrap"`, `"ScrollView"` |

> **`layoutType` is always required.** If omitted, defaults to `"Absolute"`.

### Sizing

| Property | Type | Description |
|----------|------|-------------|
| `width` | number | Width in pixels |
| `height` | number | Height in pixels |
| `percentWidth` | 0.0–1.0 | Width = parent.width × percentWidth |
| `percentHeight` | 0.0–1.0 | Height = parent.height × percentHeight |
| `minWidth` | number | Minimum width |
| `maxWidth` | number | Maximum width |
| `minHeight` | number | Minimum height |
| `maxHeight` | number | Maximum height |
| `aspectRatio` | number | Width/Height ratio. Auto-computes the missing dimension if only one is set |

> **If size is not set:** `sprite`/`button`/`imageView`/`scale9`/`progressBar` default to 100×100. `label`/`text` auto-compute from text length × fontSize.

### Positioning (Constraints)

Used in **Absolute layout parents**. Coordinate origin is **bottom-left** (Cocos2d convention).

| Property | Type | Description |
|----------|------|-------------|
| `left` | number | Distance from parent's left edge |
| `right` | number | Distance from parent's right edge |
| `top` | number | Distance from parent's top edge |
| `bottom` | number | Distance from parent's bottom edge |
| `horizontalCenter` | number | Offset from horizontal center (0 = exact center) |
| `verticalCenter` | number | Offset from vertical center (0 = exact center) |
| `percentX` | 0.0–1.0 | Anchor point positioned at parentW × percentX |
| `percentY` | 0.0–1.0 | Anchor point positioned at parentH × percentY |

#### Constraint Combinations

```
left + right        → stretch width = parent.W - left - right - padding
top + bottom        → stretch height = parent.H - top - bottom - padding
left alone          → pin to left edge
right alone         → pin to right edge
top alone           → pin to top edge
bottom alone        → pin to bottom edge
horizontalCenter    → center + offset
verticalCenter      → center + offset
percentX/percentY   → percentage position (anchor point lands at %)
```

### Anchor & Transform

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `anchor` | [x, y] | [0.5, 0.5] | Anchor point, [0,0]=bottom-left, [1,1]=top-right |
| `rotation` | number | 0 | Rotation in degrees |
| `scaleX` | number | 1 | Horizontal scale |
| `scaleY` | number | 1 | Vertical scale |
| `scaleMode` | string | — | Auto scale relative to parent: `"STRETCH"`, `"FIT"`, `"FILL"` (see below) |

### Visual Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | boolean | true | Show/hide. Invisible nodes are skipped during layout |
| `opacity` | 0–255 | 255 | Transparency |
| `zOrder` | number | 0 | Render order (higher = on top) |
| `clipping` | boolean | false | Clip children outside bounds |

### Text Properties (type: label/text)

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Text content |
| `fontSize` | number | Font size (default 20) |
| `title` | string | Button text |
| `titleFontSize` | number | Button font size |

### Padding & Margin

**Padding** (inner spacing from node edges to children):

```json
"padding": 10                    // all sides
"padding": [10, 20]              // [vertical, horizontal]
"padding": [10, 20, 10, 20]     // [top, right, bottom, left]

// Or individually:
"paddingTop": 10, "paddingBottom": 10,
"paddingLeft": 20, "paddingRight": 20
```

**Margin** (outer spacing around the node in Linear/Grid/Wrap parents):

```json
"margin": 5                     // all sides
"margin": { "top": 5, "bottom": 5, "left": 10, "right": 10 }
```

### Safe Area

| Property | Type | Description |
|----------|------|-------------|
| `useSafeArea` | boolean | Add safe area insets to padding (typically used on root) |
| `ignoreSafeArea` | boolean | Child ignores parent's safe area padding (e.g., footer/header flush to edge) |

---

## Layout Types

### 1. Absolute (default)

Children are positioned using constraints (`left/right/top/bottom/horizontalCenter/verticalCenter/percentX/percentY`).

```json
{
  "layoutType": "Absolute",
  "name": "panel",
  "left": 0, "right": 0, "top": 0, "bottom": 0,
  "children": [
    { "type": "sprite", "name": "bg", "left": 0, "right": 0, "top": 0, "bottom": 0 },
    { "type": "button", "name": "btn", "horizontalCenter": 0, "verticalCenter": 0, "width": 200, "height": 60 }
  ]
}
```

### 2. Linear (Flex Row/Column)

Arranges children in a row or column with flex weight support.

| Property | Values | Description |
|----------|--------|-------------|
| `flexDirection` | `"row"`, `"column"`, `"row-reverse"`, `"column-reverse"` | Layout direction |
| `justifyContent` | `"start"`, `"end"`, `"center"`, `"spaceBetween"`, `"spaceAround"` | Distribution along main axis |
| `alignItems` | `"start"`, `"end"`, `"center"`, `"stretch"` | Alignment along cross axis |
| `gap` | number | Spacing between children |
| `flex` | number | **On child:** flex weight (distributes remaining space proportionally) |

```json
{
  "layoutType": "Linear",
  "flexDirection": "row",
  "justifyContent": "spaceBetween",
  "alignItems": "center",
  "left": 20, "right": 20,
  "top": 100, "height": 60,
  "gap": 10,
  "children": [
    { "type": "button", "name": "btn1", "title": "1x", "flex": 1 },
    { "type": "button", "name": "btn2", "title": "2x", "flex": 2 },
    { "type": "button", "name": "btn3", "title": "1x", "flex": 1 }
  ]
}
```

> **Reverse:** `row-reverse` lays out from right→left. `column-reverse` from bottom→top. `justifyContent: "start"` is automatically swapped to `"end"`.

### 3. Grid

Arranges children in a grid layout.

| Property | Type | Description |
|----------|------|-------------|
| `columns` | number | Number of columns (default 3) |
| `rows` | number | Number of rows (auto = ceil(children/cols)) |
| `cellWidth` | number | Cell width (auto-derived from children if 0) |
| `cellHeight` | number | Cell height (auto-derived from children if 0) |
| `spacingX` | number | Horizontal spacing between cells |
| `spacingY` | number | Vertical spacing between cells |

```json
{
  "layoutType": "Grid",
  "name": "gridSkills",
  "columns": 4,
  "spacingX": 10, "spacingY": 10,
  "horizontalCenter": 0,
  "top": 500,
  "children": [
    { "type": "button", "name": "skill1", "title": "🔥", "width": 60, "height": 60 },
    { "type": "button", "name": "skill2", "title": "❄️", "width": 60, "height": 60 }
  ]
}
```

### 4. Wrap (Flow Layout)

Like a row, but automatically wraps to the next line when space runs out.

| Property | Type | Description |
|----------|------|-------------|
| `gap` | number | Spacing between items and between lines |

```json
{
  "layoutType": "Wrap",
  "name": "tagList",
  "left": 10, "right": 10, "top": 100,
  "gap": 8,
  "children": [
    { "type": "button", "name": "tag1", "title": "RPG", "width": 80, "height": 30 },
    { "type": "button", "name": "tag2", "title": "Action", "width": 100, "height": 30 },
    { "type": "button", "name": "tag3", "title": "Adventure", "width": 120, "height": 30 }
  ]
}
```

### 5. ScrollView

Scrollable content area. Children are laid out like a column or row.

| Property | Type | Description |
|----------|------|-------------|
| `scrollDirection` | `"vertical"`, `"horizontal"`, `"both"` | Scroll direction |
| `gap` | number | Spacing between items |
| `clipping` | boolean | Should be set to `true` to clip content outside the viewport |

```json
{
  "layoutType": "ScrollView",
  "name": "scrollList",
  "scrollDirection": "vertical",
  "clipping": true,
  "left": 20, "right": 20,
  "top": 300, "height": 200,
  "gap": 8,
  "children": [
    { "type": "button", "name": "item1", "title": "Item 1", "width": 300, "height": 60 },
    { "type": "button", "name": "item2", "title": "Item 2", "width": 300, "height": 60 },
    { "type": "button", "name": "item3", "title": "Item 3", "width": 300, "height": 60 }
  ]
}
```

> The engine computes `_contentWidth`/`_contentHeight` for total content size. The renderer uses these values for scrollbar calculations.

---

## Scale Modes

Applied on a child node. Scales relative to the parent's size.

| Mode | Description |
|------|-------------|
| `"STRETCH"` | Stretches to fill parent (scaleX and scaleY may differ) |
| `"FIT"` | Uniform scale to fit inside parent (may leave letterbox margins) |
| `"FILL"` | Uniform scale to cover parent completely (may be cropped) |

```json
{
  "type": "sprite",
  "name": "background",
  "width": 720, "height": 1280,
  "horizontalCenter": 0, "verticalCenter": 0,
  "scaleMode": "FILL"
}
```

---

## Widget Types

### Scale9 Sprite

9-slice scalable sprite. `capInsets` defines the non-scalable border regions.

```json
{
  "type": "scale9",
  "name": "bgPanel",
  "left": 0, "right": 0, "top": 0, "bottom": 0,
  "capInsets": { "left": 15, "right": 15, "top": 10, "bottom": 10 }
}
```

### Progress Bar

```json
{
  "type": "progressBar",
  "name": "hpBar",
  "left": 20, "right": 20, "top": 700, "height": 30,
  "progressValue": 75,
  "progressMin": 0,
  "progressMax": 100,
  "progressDirection": "horizontal",
  "capInsets": { "left": 8, "right": 8, "top": 4, "bottom": 4 }
}
```

---

## Metadata

### Developer Comments

Use `_comment` to annotate nodes. Exported code will include these as comment lines.

```json
{
  "type": "sprite",
  "name": "bg",
  "_comment": "Full-screen background with cave theme",
  "scaleMode": "FILL"
}
```

---

## Best Practices for Multi-Resolution

1. **Root**: Always set `useSafeArea: true` and `width`/`height` to your design resolution
2. **Background**: Use `horizontalCenter: 0, verticalCenter: 0` + `scaleMode: "FILL"` (avoid fixed x/y)
3. **Header/Footer**: Use `left: 0, right: 0` + `top: 0`/`bottom: 0` + `ignoreSafeArea: true` to pin flush to edges
4. **Content panels**: Use `left/right` constraints with `top` pixel offset, or `percentHeight`
5. **Avoid hardcoded x/y** — prefer constraints (`left`, `right`, `horizontalCenter`, etc.)
6. **Flex rows**: Use `flex` weights instead of fixed widths for adaptive layouts

### Standard Template

```json
[
  {
    "layoutType": "Absolute",
    "name": "root",
    "width": 720, "height": 1280,
    "useSafeArea": true,
    "children": [
      {
        "type": "sprite", "name": "bg",
        "width": 720, "height": 1280,
        "horizontalCenter": 0, "verticalCenter": 0,
        "scaleMode": "FILL"
      },
      {
        "layoutType": "Absolute", "name": "header",
        "height": 80, "ignoreSafeArea": true,
        "top": 0, "left": 0, "right": 0,
        "children": [
          { "type": "sprite", "name": "bgHeader", "left": 0, "right": 0, "top": 0, "bottom": 0 },
          { "type": "label", "name": "title", "text": "Screen Title", "horizontalCenter": 0, "verticalCenter": 0 }
        ]
      },
      {
        "layoutType": "Linear", "flexDirection": "column",
        "name": "content",
        "left": 20, "right": 20, "top": 100, "bottom": 120,
        "gap": 16,
        "children": []
      },
      {
        "layoutType": "Linear", "flexDirection": "row",
        "name": "footer",
        "justifyContent": "spaceAround",
        "height": 80, "ignoreSafeArea": true,
        "bottom": 0, "left": 0, "right": 0,
        "children": [
          { "type": "button", "name": "tab1", "title": "Home", "width": 80, "height": 60 },
          { "type": "button", "name": "tab2", "title": "Shop", "width": 80, "height": 60 }
        ]
      }
    ]
  }
]
```

---

## Module Architecture

The Layout Engine is split into focused modules:

| Module | Purpose |
|--------|---------|
| `_layout_engine.js` | Core: `buildTree`, `computeLayout`, `getNodeBounds`, `getRenderOrder` |
| `_layout_engine_export.js` | `exportAdaptiveCode()` — generates UIBuilder code |
| `_layout_engine_tools.js` | Dev tools: `validate()`, `setNodeProp()`, `diffLayout()`, `snapshotBounds()` |

> **Animations** are NOT part of the JSON schema. They should be handled in developer code after the layout is built.
