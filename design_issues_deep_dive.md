# Layout Engine — Design Analysis

> Phân tích so sánh với CSS layout model. Scope: **static layout** cho game Cocos2d-JS.

---

## ✅ Đã Fix (từ các iteration trước)

| # | Vấn đề | Fix |
|---|--------|-----|
| B3 | `scaleMode` sprite không tự center | Auto-center khi không có positioning constraints |
| B1/D3 | Absolute container 0×0 | Fill parent cho container có children |
| D2 | `margin` chỉ hỗ trợ `number\|object` | Thêm array: `[v,h]`, `[t,r,b,l]` |
| B4 | `aspectRatio` dùng raw JSON input | Dùng computed dimensions từ constraints |
| A2 | `layoutType` gán cho cả leaf nodes | Chỉ gán cho nodes có children |
| C3 | Grid dùng `spacingX/spacingY`, không `gap` | `gap` alias cho `spacingX = spacingY` |
| C1 | Không có `alignSelf` | Full pipeline: engine → export → runtime |
| C4 | `left/right` trong Linear bị ignore im lặng | Validation warnings |
| A1 | Node role implicit | `background` property tách rõ container vs leaf |
| B5 | Row cross-axis `start/end` ngược convention Cocos | Swap: `start`=bottom, `end`=top |
| B6 | Grid cell width chia đều parent | Dùng max child width |
| D1 | `percentWidth` tính theo raw parent (chưa trừ padding) | Resolve against content area (trừ padding) |
| D6 | Không có `flex-shrink` | Auto-shrink tỷ lệ khi overflow + `flexShrink: 0` opt-out |

---

## 🔍 Phân Tích So Sánh Với CSS

### Những gì hệ thống đã làm tốt (CSS-equivalent)

| CSS Feature | Layout Engine | Đánh giá |
|-------------|--------------|----------|
| `display: flex` | `layoutType: "Linear"` | ✅ Đầy đủ |
| `flex-direction` | `flexDirection` | ✅ Cả 4 hướng |
| `justify-content` | `justifyContent` | ✅ 5 values |
| `align-items` | `alignItems` | ✅ 4 values |
| `align-self` | `alignSelf` | ✅ Override per-child |
| `flex-grow` | `flex` | ✅ Proportional space |
| `gap` | `gap` | ✅ Uniform spacing |
| `padding` | `padding` (shorthand + individual) | ✅ Full CSS parity |
| `margin` | `margin` | ✅ Full support |
| `position: absolute` | `layoutType: "Absolute"` + constraints | ✅ Tốt |
| `width/height` in % | `percentWidth/percentHeight` | ✅ Hoạt động |
| `min-width/max-width` | `minWidth/maxWidth/minHeight/maxHeight` | ✅ Clamp |
| `aspect-ratio` | `aspectRatio` | ✅ Auto-compute |
| `object-fit` | `scaleMode` (FILL/FIT/STRETCH) | ✅ Tương đương |
| `display: grid` | `layoutType: "Grid"` | ⚠️ Basic (xem bên dưới) |
| `flex-wrap: wrap` | `layoutType: "Wrap"` | ⚠️ Basic (xem bên dưới) |
| `overflow: scroll` | `layoutType: "ScrollView"` | ✅ Vertical + Horizontal |
| `visibility: hidden` | — | ❌ Chỉ có `visible` (= `display: none`) |
| `overflow: hidden` | `clipping` | ✅ Basic |

---

## ⚠️ Design Issues Còn Tồn Tại

### D1. `percentWidth` trong Linear không resolve đúng thời điểm ⭐

**CSS behavior:** `width: 50%` luôn tính theo parent *content box* (trừ padding).

**Engine behavior:** `_measureNode` tính `percentWidth` theo `parentW` **raw** (bao gồm padding):

```javascript
// line 239-240
if (!w && node.percentWidth !== undefined && parentW !== undefined) {
    w = parentW * node.percentWidth;
}
```

Nhưng `parentW` ở đây là `node._width` truyền từ parent — **chưa trừ padding**. Trong khi layout Linear, available space cho children = `parentW - pad.left - pad.right`.

**Ví dụ:** Container 100px, padding 10, child `percentWidth: 0.5`:
- Expect: `(100 - 20) * 0.5 = 40px` (50% of content area)
- Actual: `100 * 0.5 = 50px` (50% of total width, tràn padding)

**Severity:** 🟡 Medium — Chỉ ảnh hưởng khi dùng `percentWidth` kết hợp `padding`.

---

### D2. Grid thiếu tính năng so với CSS Grid ⭐

CSS Grid hỗ trợ rất nhiều mà Layout Engine chưa có:

| CSS Grid Feature | Status | Mức cần thiết cho game |
|-----------------|--------|----------------------|
| `grid-template-columns: 1fr 2fr 1fr` | ❌ | 🟡 Hữu ích cho dashboard, settings |
| `grid-column-gap` ≠ `grid-row-gap` | ✅ `spacingX/spacingY` | Đã có |
| `grid-column: span 2` | ❌ | 🟠 Low — game UI hiếm cần |
| Cell alignment (`justify-items`, `align-items`) | ❌ Chỉ center | 🟡 Medium |
| Auto-fill / auto-fit | ❌ | 🟠 Low |

**Vấn đề cụ thể:** Grid hiện tại chỉ hỗ trợ **equal-size cells**. Không có cách làm grid với column widths khác nhau (như `1fr 2fr 1fr`).

**Workaround:** Dùng nested Linear rows.

**Severity:** 🟡 Medium — Phần lớn game grid (inventory, skills) dùng equal cells.

---

### D3. Wrap layout thiếu `alignItems` cho cross-axis

**CSS `flex-wrap: wrap`** vẫn hỗ trợ `align-items` để căn chỉnh items trong mỗi dòng (ví dụ: center vertically trong 1 row khi items có height khác nhau).

**Engine:** Wrap layout không có `alignItems`, items luôn align top trong mỗi dòng.

**Severity:** 🟠 Low — Wrap layout trong game thường dùng items cùng kích thước.

---

### D4. Thiếu `overflow: hidden` tách biệt với `clipping`

**CSS:** `overflow: hidden` là property riêng, có thể set `overflow-x` khác `overflow-y`.

**Engine:** `clipping` hoạt động nhưng chỉ boolean, không phân biệt X/Y. Và chỉ thực sự work với `ccui.Layout` (không phải `cc.Node`).

**Severity:** 🟢 Low — Game UI hiếm khi cần overflow riêng X/Y.

---

### D5. Label/Text measurement quá đơn giản

**CSS:** Browser tự measure text chính xác bao gồm word-wrap, line-height, font metrics.

**Engine:**
```javascript
// line 258-259
w = str.length * fs * 0.6;  // Width estimate
h = fs * 1.2;                // Height estimate
```

Đây là **rough estimate**:
- Không handle multi-byte characters (emoji, CJK) — chiều rộng sai
- Không có word-wrap / multi-line
- Không có `maxWidth` auto-wrap
- `0.6` magic number không chính xác cho mọi font

**Impact:** Preview trong HTML sẽ không khớp chính xác với game render. Nhưng vì export code không dùng computed position cho text (UIBuilder tự measure), nên chỉ ảnh hưởng preview.

**Severity:** 🟡 Medium — Ảnh hưởng preview accuracy.

---

### D6. `flex-shrink` không tồn tại

**CSS:** `flex-shrink` cho phép items co lại khi container nhỏ hơn total children size.

**Engine:** Chỉ có `flex` (= `flex-grow`). Nếu total children width > container width → **tràn ra ngoài** mà không co lại.

**Severity:** 🟡 Medium — Game UI thường thiết kế fixed, nhưng khi chạy trên screen nhỏ hơn design, items có thể tràn.

---

### D7. Không có `box-sizing` concept

**CSS:** `box-sizing: border-box` — `width`/`height` bao gồm padding.

**Engine:** Hiện tại `width`/`height` luôn là **content-box** (không bao gồm padding). Padding được thêm bên trong.

Nhưng hành vi không nhất quán:
- Khi set `width: 400` + `padding: 20` → container vẫn 400px, children layout trong 360px ✅
- Khi auto-sized (shrink-to-fit) → `_width = totalChildrenWidth + padding` ✅

Thực ra hành vi hiện tại đã gần giống `border-box` rồi (width bao gồm padding). Nên đây **không phải issue**, chỉ cần document rõ.

**Severity:** 🟢 Info — Chỉ cần document.

---

### D8. Không hỗ trợ `gap` riêng `row-gap` / `column-gap` cho Linear

**CSS:** `row-gap` và `column-gap` là 2 properties riêng.

**Engine:** Linear layout chỉ có 1 `gap` cho main axis. Cross-axis spacing phải dùng `margin`.

**Severity:** 🟢 Low — Linear là 1 chiều, chỉ cần 1 gap.

---

### D9. Constraint `left+right` trong Absolute không tính padding đúng cách cho `ignoreSafeArea` children

Code hiện tại (line 483-486):
```javascript
if (c.left !== undefined && c.right !== undefined) {
    var flexW = W - c.left - c.right - cPad.left - cPad.right;
    c._width = Math.max(0, flexW);
    cLeft = cPad.left + c.left;
}
```

Khi child có `ignoreSafeArea: true` thì `cPad` đã được switch sang padding-without-safe-area. Đúng.

Nhưng **`W`** vẫn là parent `_width` (full width), trong khi `cPad` đã trừ safe area. Điều này đúng vì child `ignoreSafeArea` muốn span full parent width bỏ qua safe area insets.

**Severity:** ✅ Không phải issue — logic đúng.

---

## 📊 Tổng Hợp Issues Mới

| # | Vấn đề | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| D2 | Grid chỉ hỗ trợ equal-size cells | 🟡 Medium | Medium | Thiếu flexibility |
| D3 | Wrap thiếu `alignItems` | 🟠 Low | Small | Items khác height align sai |
| D4 | `clipping` không phân biệt X/Y | 🟢 Low | Small | Hiếm khi cần |
| D5 | Label measurement = magic number | 🟡 Medium | Medium | Preview không chính xác |
| D7 | Thiếu `box-sizing` documentation | 🟢 Info | Tiny | Chỉ cần document |
| D8 | Thiếu `row-gap`/`column-gap` riêng | 🟢 Low | Small | Linear chỉ 1 chiều |

---

## ✅ Kết Luận

Hệ thống layout **đã cover phần lớn CSS Flexbox model** — đây là phần quan trọng nhất cho game UI. Các issue còn lại chủ yếu là:

1. **Nice-to-have:** D2 (Grid columns), D5 (Label measure)
2. **Không cần:** D3, D4, D7, D8 (quá niche cho game UI)

So với CSS, **thiếu lớn nhất** là `flex-shrink` — vì game static layout nên ít gặp, nhưng sẽ gây tràn layout trên screen nhỏ hơn design resolution.

---

## 📋 Next Steps

| Priority | Action | Effort |
|----------|--------|--------|
| 🟡 Medium | **Template examples** — Lobby, popup, inventory, card layout | Small |
| 🟡 Medium | **Label measure cải thiện** — Multi-line, maxWidth auto wrap | Medium |
| 🟠 Low | **`backgroundColor`** — Solid color cho container | Small |
| 🔵 Nice | **Schema validator CLI** | Small |

---

## Files Changed (lịch sử)

| File | Changes |
|------|---------|
| `_layout_engine.js` | scaleMode center, fill-parent, margin array, aspectRatio, layoutType leaf, Grid gap, alignSelf, `background` container support, row cross-axis start/end swap, grid cell width = max child |
| `_layout_engine_export.js` | Grid gap, margin array, alignSelf, `background` → `setBackGroundImage()` |
| `_layout_engine_tools.js` | 4 validation rules (Linear constraints, Absolute props, alignSelf scope, `background` suggestion) |
| `_layout.js` | margin array, alignSelf runtime (Row + Column) |
| `index.html` | Script includes, `background` CSS class + 🖼️📐 icon |
| `preview.json` | `sprCard` + `sprResourceBar` migrated to `background` syntax |