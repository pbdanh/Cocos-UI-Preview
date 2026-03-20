# Layout Engine — JSON Format Guide

> Tài liệu thống nhất cho JSON schema dùng bởi Layout Engine. Dành cho cả AI Agent và Developer.

---

## Quick Start

```json
[
  {
    "layoutType": "Absolute",
    "name": "root",
    "children": [
      { "type": "sprite", "name": "bg", "scaleMode": "FILL" },
      {
        "type": "button", "name": "btnPlay",
        "width": 200, "height": 60,
        "horizontalCenter": 0, "verticalCenter": 0
      }
    ]
  }
]
```

- File là **array** chứa 1 root object (hoặc trực tiếp 1 object).
- Root node luôn fullscreen — không cần `width`/`height`.
- Tất cả children được định vị tương đối với parent.

---

## 3 Loại Node

Mỗi node thuộc 1 trong 3 loại. Đây là khái niệm quan trọng nhất.

### 1. Pure Container — chỉ có `layoutType`, không có `type`

Tổ chức children, không có visual.

```json
{
  "layoutType": "Linear",
  "flexDirection": "row",
  "name": "toolbar",
  "gap": 10,
  "children": [...]
}
```

| Code sinh ra | Kích thước |
|-------------|-----------|
| `new cc.Node()` | Từ constraints, `width`/`height` explicit, hoặc auto-sized từ children |

### 2. Pure Visual — chỉ có `type`, không có `children`

Leaf node có visual. Không có children.

```json
{ "type": "sprite", "name": "avatar", "width": 158, "height": 172 }
```

| Code sinh ra | Kích thước |
|-------------|-----------|
| `UIBuilder.sprite(res)` + `UIBuilder.setLayoutSize(node, w, h)` | `width`/`height` = kích thước hiển thị |

### 3. Visual Container — dùng `background` property

Container có hình nền. Children layout bên trong.

```json
{
  "layoutType": "Absolute",
  "name": "card",
  "background": "sprite",
  "width": 377, "height": 416,
  "children": [...]
}
```

| Code sinh ra | Kích thước |
|-------------|-----------|
| `new ccui.Layout()` + `setBackGroundImage(res)` | `width`/`height` = kích thước container |

**`background`** nhận: `"sprite"` | `"scale9"` | `"imageView"`

> **Legacy:** `type + children` (cú pháp cũ) vẫn hoạt động, nhưng nên dùng `background` cho rõ ràng hơn.

---

## Node Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | **Bắt buộc.** ID duy nhất |
| `type` | string | Render type: `"sprite"`, `"button"`, `"label"`, `"text"`, `"imageView"`, `"scale9"`, `"progressBar"` |
| `layoutType` | string | Layout cho children: `"Absolute"`, `"Linear"`, `"Grid"`, `"Wrap"`, `"ScrollView"` |
| `background` | string | Visual container: `"sprite"`, `"scale9"`, `"imageView"` |

### Sizing

| Property | Type | Description |
|----------|------|-------------|
| `width` | number | Width (px) |
| `height` | number | Height (px) |
| `percentWidth` | 0.0–1.0 | Width = parent.**content area** × percentWidth (trừ padding) |
| `percentHeight` | 0.0–1.0 | Height = parent.**content area** × percentHeight (trừ padding) |
| `minWidth` / `maxWidth` | number | Size constraints |
| `minHeight` / `maxHeight` | number | Size constraints |
| `aspectRatio` | number | Width/Height ratio. Tự tính chiều còn lại |
| `_previewWidth` | number | **Preview-only.** Kích thước tạm cho sprite leaf (không export ra code) |
| `_previewHeight` | number | **Preview-only.** Kích thước tạm cho sprite leaf (không export ra code) |

#### Khi nào cần `width`/`height`?

| Trường hợp | Cần? | Lý do |
|------------|:----:|-------|
| Root node | ❌ | Luôn fullscreen |
| `scaleMode` sprite | ❌ | Fills parent tự động |
| Container có `left`+`right` | ❌ width | `pinEdges` tính từ parent |
| Container có `top`+`bottom` | ❌ height | `pinEdges` tính từ parent |
| Auto-sized container (Linear, không constraints) | ❌ | Shrink-to-fit từ children |
| Leaf nodes (sprite, button, progressBar) | ✅ | Kích thước hiển thị |
| Container cố định kích thước | ✅ | Layout bounding box |

> **Default size:** Nếu không set, `sprite`/`button`/`imageView`/`scale9`/`progressBar` mặc định 100×100. `label`/`text` tự tính từ `text.length × fontSize`.

### Positioning (Constraints)

Dùng trong **Absolute layout**. Gốc tọa độ **bottom-left** (Cocos2d convention).

| Property | Type | Description |
|----------|------|-------------|
| `left` | number | Khoảng cách từ mép trái parent |
| `right` | number | Khoảng cách từ mép phải parent |
| `top` | number | Khoảng cách từ mép trên parent |
| `bottom` | number | Khoảng cách từ mép dưới parent |
| `horizontalCenter` | number | Offset từ tâm ngang (0 = chính giữa) |
| `verticalCenter` | number | Offset từ tâm dọc (0 = chính giữa) |
| `percentX` | 0.0–1.0 | Vị trí anchor = parentW × percentX |
| `percentY` | 0.0–1.0 | Vị trí anchor = parentH × percentY |

#### Constraint Combinations

```
left + right        → stretch width = parent.W - left - right
top + bottom        → stretch height = parent.H - top - bottom
left alone          → pin to left edge
right alone         → pin to right edge
top alone           → pin to top edge
bottom alone        → pin to bottom edge
horizontalCenter    → center + offset
verticalCenter      → center + offset
percentX/percentY   → percentage position
```

### Anchor & Transform

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `anchor` | [x, y] | [0.5, 0.5] | Anchor point, [0,0]=bottom-left, [1,1]=top-right |
| `rotation` | number | 0 | Rotation (degrees) |
| `scaleX` | number | 1 | Horizontal scale |
| `scaleY` | number | 1 | Vertical scale |
| `scaleMode` | string | — | Auto scale theo parent: `"STRETCH"`, `"FIT"`, `"FILL"` |

### Visual Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | boolean | true | Show/hide. Node ẩn bị skip khi layout |
| `opacity` | 0–255 | 255 | Transparency |
| `zOrder` | number | 0 | Render order (higher = on top) |
| `clipping` | boolean | false | Clip children ngoài bounds |
| `color` | `{ "r", "g", "b" }` | white | Tint color |

### Text Properties

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Nội dung text (label/text) |
| `fontSize` | number | Font size (default 20) |
| `fontName` | string | Font (default "Arial") |
| `title` | string | Button text |
| `titleFontSize` | number | Button font size |

### Padding & Margin

**Padding** (inner spacing — container → children):

```json
"padding": 10                    // all sides
"padding": [10, 20]              // [vertical, horizontal]
"padding": [10, 20, 10, 20]     // [top, right, bottom, left]

// Hoặc từng phía:
"paddingTop": 10, "paddingBottom": 10,
"paddingLeft": 20, "paddingRight": 20
```

**Margin** (outer spacing — child trong Linear/Grid/Wrap):

```json
"margin": 5                     // all sides
"margin": [5, 10]               // [vertical, horizontal]
"margin": [5, 10, 5, 10]       // [top, right, bottom, left]
"margin": { "top": 5, "bottom": 5, "left": 10, "right": 10 }
```

### Flex Properties (dùng trong Linear layout)

| Property | Type | Description |
|----------|------|-------------|
| `flex` | number | Flex weight — phân bổ không gian còn lại theo tỷ lệ |
| `flexShrink` | number | `0` = không co lại khi overflow. Mặc định: co lại tỷ lệ (như CSS `flex-shrink: 1`) |
| `alignSelf` | string | Override `alignItems` cho child cụ thể: `"start"`, `"center"`, `"end"`, `"stretch"` |

### Safe Area

| Property | Type | Description |
|----------|------|-------------|
| `useSafeArea` | boolean | Thêm safe area insets vào padding (thường dùng trên root) |
| `ignoreSafeArea` | boolean | Child bỏ qua safe area của parent (e.g., header/footer flush to edge) |

### Metadata

| Property | Type | Description |
|----------|------|-------------|
| `_comment` | string | Ghi chú — exported thành comment trong code |

---

## Layout Types

### 1. Absolute (default)

Children định vị bằng constraints (`left/right/top/bottom/horizontalCenter/verticalCenter/percentX/percentY`).

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

Sắp xếp children thành hàng hoặc cột.

| Property | Values | Description |
|----------|--------|-------------|
| `flexDirection` | `"row"`, `"column"`, `"row-reverse"`, `"column-reverse"` | Hướng layout |
| `justifyContent` | `"start"`, `"end"`, `"center"`, `"spaceBetween"`, `"spaceAround"` | Phân bổ trục chính |
| `alignItems` | `"start"`, `"end"`, `"center"`, `"stretch"` | Căn chỉnh trục phụ |
| `gap` | number | Khoảng cách giữa children |

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

> **Reverse:** `row-reverse` layout phải→trái. `column-reverse` dưới→trên.

### 3. Grid

Sắp xếp children thành lưới.

| Property | Type | Description |
|----------|------|-------------|
| `columns` | number | Số cột (default 3) |
| `cellWidth` / `cellHeight` | number | Kích thước ô cố định (auto từ children nếu không set) |
| `spacingX` / `spacingY` | number | Khoảng cách giữa ô |
| `gap` | number | Alias: set cả `spacingX` và `spacingY` |

```json
{
  "layoutType": "Grid",
  "name": "gridSkills",
  "columns": 4,
  "gap": 10,
  "horizontalCenter": 0,
  "top": 500,
  "children": [
    { "type": "button", "name": "skill1", "title": "🔥", "width": 60, "height": 60 },
    { "type": "button", "name": "skill2", "title": "❄️", "width": 60, "height": 60 }
  ]
}
```

### 4. Wrap (Flow Layout)

Như row nhưng tự xuống dòng khi hết chỗ.

| Property | Type | Description |
|----------|------|-------------|
| `gap` | number | Khoảng cách giữa items và giữa dòng |

```json
{
  "layoutType": "Wrap",
  "name": "tagList",
  "left": 10, "right": 10, "top": 100,
  "gap": 8,
  "children": [
    { "type": "button", "name": "tag1", "title": "RPG", "width": 80, "height": 30 },
    { "type": "button", "name": "tag2", "title": "Action", "width": 100, "height": 30 }
  ]
}
```

### 5. ScrollView

Vùng cuộn nội dung. Children sắp xếp như column/row.

| Property | Type | Description |
|----------|------|-------------|
| `scrollDirection` | `"vertical"`, `"horizontal"`, `"both"` | Hướng cuộn |
| `gap` | number | Khoảng cách giữa items |
| `clipping` | boolean | Nên set `true` để clip nội dung |

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
    { "type": "button", "name": "item2", "title": "Item 2", "width": 300, "height": 60 }
  ]
}
```

---

## Scale Modes

Scale sprite theo parent. Không cần `width`/`height` — size từ parent.

| Mode | Mô tả |
|------|-------|
| `"FILL"` | Scale đều lấp kín parent (có thể crop) |
| `"FIT"` | Scale đều vừa lọt parent (có thể letterbox) |
| `"STRETCH"` | Kéo giãn theo parent (có thể méo) |

```json
{ "type": "sprite", "name": "bg", "scaleMode": "FILL" }
```

---

## Widget Types

### Scale9 Sprite

9-slice scalable sprite. `capInsets` định nghĩa vùng border không scale.

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
  "progressDirection": "horizontal"
}
```

---

## Size Resolution Priority

```
1. scaleMode        → fills parent tự động
2. left + right     → pinEdges tính width
3. top + bottom     → pinEdges tính height
4. percentWidth/percentHeight → tỷ lệ parent
5. Explicit width/height → kích thước cố định
6. No size + layout → shrink-to-fit từ children
```

---

## Best Practices

### Multi-Resolution

1. **Root**: Luôn set `useSafeArea: true`
2. **Background**: Dùng `scaleMode: "FILL"` — không cần x/y cố định
3. **Header/Footer**: `left: 0, right: 0` + `top: 0`/`bottom: 0` + `ignoreSafeArea: true`
4. **Content panels**: `left/right` constraints + `top`/`bottom` offset, hoặc `percentHeight`
5. **Tránh x/y cố định** — dùng constraints (`left`, `right`, `horizontalCenter`, ...)
6. **Flex rows**: Dùng `flex` weight thay vì width cố định cho layout adaptive

### Standard Template

```json
[
  {
    "layoutType": "Absolute",
    "name": "root",
    "useSafeArea": true,
    "children": [
      {
        "type": "sprite", "name": "bg",
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

### Dành cho AI Agent

- **Không dùng `x`, `y` cố định** — dùng constraints hoặc layout container
- **Không dùng `w`, `h` shorthand** — luôn ghi đầy đủ `width`, `height`
- **Không gen animation** trong JSON — animation do Developer code riêng
- **Dùng `_comment`** để ghi chú lý do thiết kế
- **Dùng `background`** thay vì `type + children` cho visual container

---

## Module Architecture

| Module | Chức năng |
|--------|----------|
| `_layout_engine.js` | Core: `buildTree`, `computeLayout`, `getNodeBounds`, `getRenderOrder` |
| `_layout_engine_export.js` | `exportAdaptiveCode()` — sinh code UIBuilder |
| `_layout_engine_tools.js` | Dev tools: `validate()`, `setNodeProp()`, `diffLayout()`, `snapshotBounds()` |

> **Animation** KHÔNG thuộc JSON schema. Xử lý trong code developer sau khi layout build xong.
