# Layout JSON Guide

This document describes the JSON format used by the Layout Engine to generate adaptive UIBuilder code for Cocos2d-JS.

## Quick Start

```json
[
  {
    "layoutType": "Absolute",
    "name": "root",
    "children": [
      { "type": "sprite", "name": "bg", "scaleMode": "FILL" },
      { "type": "button", "name": "btnPlay", "width": 200, "height": 60, "horizontalCenter": 0, "verticalCenter": 0 }
    ]
  }
]
```

- The JSON is an **array** with one root object.
- The root node is always fullscreen — no `width`/`height` needed.
- All children are positioned and sized relative to their parent.

---

## 3 Node Categories

Every node falls into one of three categories. This is the most important concept in the format.

### 1. Pure Container — `layoutType` only, no `type`

A node that organizes children. No visual appearance of its own.

```json
{
  "layoutType": "Linear",
  "flexDirection": "row",
  "name": "toolbar",
  "gap": 10,
  "children": [...]
}
```

| Generated Code | Size |
|----------------|------|
| `new cc.Node()` | From constraints, explicit `width`/`height`, or auto-sized from children |

### 2. Pure Visual — `type` only, no `children`

A leaf node with visual appearance. No children.

```json
{ "type": "sprite", "name": "avatar", "width": 158, "height": 172 }
```

| Generated Code | Size |
|----------------|------|
| `UIBuilder.sprite(res)` + `UIBuilder.setLayoutSize(node, w, h)` | `width`/`height` = **desired display size** (texture scales to FIT, like CSS `<img>`) |

### 3. Visual Container — `type` AND `children`

A container with a background image. Children are laid out inside.

```json
{
  "layoutType": "Absolute",
  "name": "card",
  "type": "sprite",
  "width": 377, "height": 416,
  "children": [...]
}
```

| Generated Code | Size |
|----------------|------|
| `new ccui.Layout()` + `setBackGroundImage(res)` | `width`/`height` = container layout size. Background image stretches to fill. |

---

## When is `width`/`height` Required?

| Scenario | Required? | Why |
|----------|:---------:|-----|
| Root node | ❌ | Always fullscreen |
| `scaleMode` sprite | ❌ | Fills parent automatically |
| Container with `left`+`right` | ❌ width | `pinEdges` computes from parent |
| Container with `top`+`bottom` | ❌ height | `pinEdges` computes from parent |
| Auto-sized container (Linear, no constraints) | ❌ | Shrinks to fit children |
| Leaf nodes (sprite, button, progressBar) | ✅ | Display size |
| Containers with fixed size | ✅ | Layout bounding box |

---

## `scaleMode` — Fill Parent

For sprites that should fill their parent (backgrounds, overlays):

```json
{ "type": "sprite", "name": "bg", "scaleMode": "FILL" }
```

| Value | Behavior |
|-------|----------|
| `"FILL"` | Uniform scale to cover parent (may crop) |
| `"FIT"` | Uniform scale to fit inside parent (may letterbox) |
| `"STRETCH"` | Non-uniform scale to exact parent size (may distort) |

No `width`/`height` needed — size comes from parent. Generated: `UIBuilder.setLayoutSize(node, 0, 0, "FILL")`.

---

## Positioning (pinEdges)

| Property | Type | Description |
|----------|------|-------------|
| `left` | number | Distance from parent's left edge (px) |
| `right` | number | Distance from parent's right edge (px) |
| `top` | number | Distance from parent's top edge (px) |
| `bottom` | number | Distance from parent's bottom edge (px) |
| `horizontalCenter` | number | Center horizontally (value is offset, `0` = center) |
| `verticalCenter` | number | Center vertically (value is offset, `0` = center) |

### Constraint Combinations

```
left + right              → Width computed from parent
top + bottom              → Height computed from parent
left + right + top + bottom → Fill parent with margins
horizontalCenter          → Center horizontally
left only                 → Anchor to left edge
```

---

## Linear Layout

Used when `layoutType` is `"Linear"`.

| Property | Values | Default |
|----------|--------|---------|
| `flexDirection` | `"row"`, `"column"`, `"row-reverse"`, `"column-reverse"` | `"column"` |
| `gap` | number (px) | `0` |
| `alignItems` | `"start"`, `"center"`, `"end"`, `"stretch"` | `"start"` |
| `justifyContent` | `"start"`, `"center"`, `"end"`, `"spaceBetween"`, `"spaceAround"` | `"start"` |
| `padding` | number or `{ top, right, bottom, left }` | none |

---

## Grid Layout

Used when `layoutType` is `"Grid"`.

| Property | Description |
|----------|-------------|
| `columns` | Number of columns |
| `spacingX` / `spacingY` | Spacing (px) |
| `cellWidth` / `cellHeight` | Fixed cell size (optional) |

---

## Visual Properties

| Property | Type | Default |
|----------|------|---------|
| `opacity` | 0–255 | 255 |
| `visible` | boolean | true |
| `rotation` | degrees | 0 |
| `scaleX` / `scaleY` | number | 1 |
| `zOrder` | number | 0 |
| `anchor` | [x, y] (0–1) | [0.5, 0.5] |
| `color` | `{ "r", "g", "b" }` | white |

---

## Size Modifiers

| Property | Description |
|----------|-------------|
| `minWidth` / `maxWidth` | Size constraints (px) |
| `minHeight` / `maxHeight` | Size constraints (px) |
| `percentWidth` / `percentHeight` | Fraction of parent (0–1) |
| `aspectRatio` | Maintain width/height ratio |
| `flex` | Flex weight (like CSS `flex-grow`) |
| `margin` | Outer margin: `10` or `{ top, right, bottom, left }` |

---

## Type-Specific Properties

### Button
| `title` | Label text | `titleFontSize` | Font size |
|---------|------------|-----------------|-----------|

### Label / Text
| `text` | Display text | `fontSize` | Size | `fontName` | Font (default: "Arial") |
|--------|-------------|------------|------|------------|-------------------------|

### ProgressBar
| `progressDirection` | `"horizontal"` / `"vertical"` | `progressValue` | 0–100 |
|---------------------|-------------------------------|-----------------|-------|

### ScrollView
| `scrollDirection` | `"vertical"` / `"horizontal"` / `"both"` | `clipping` | boolean |
|-------------------|------------------------------------------|------------|---------|

---

## Size Resolution Priority

```
1. scaleMode        → setLayoutSize(node, 0, 0, mode) — fills parent
2. left + right     → pinEdges computes width
3. top + bottom     → pinEdges computes height
4. Explicit w/h     → setLayoutSize(node, w, h) or setContentSize
5. No size + layout → shrink-to-fit from children
```

Generated code is **resolution-independent** — works for landscape, portrait, square, or any aspect ratio.
