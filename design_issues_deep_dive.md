# Layout Engine — Design Analysis

> Phân tích so sánh với CSS layout model. Scope: **static layout** cho game Cocos2d-JS.
> Updated: 2026-03-20

---

## ✅ Đã Fix

| # | Vấn đề | Fix | File |
|---|--------|-----|------|
| B3 | `scaleMode` sprite không tự center | Auto-center khi không có positioning constraints | `_layout_engine.js` |
| B1/D3 | Absolute container 0×0 | Fill parent cho container có children | `_layout_engine.js` |
| D2 | `margin` chỉ hỗ trợ `number\|object` | Thêm array: `[v,h]`, `[t,r,b,l]` | `_layout_engine.js`, `_layout.js` |
| B4 | `aspectRatio` dùng raw JSON input | Dùng computed dimensions từ constraints | `_layout_engine.js` |
| A2 | `layoutType` gán cho cả leaf nodes | Chỉ gán cho nodes có children | `_layout_engine.js` |
| C3 | Grid dùng `spacingX/spacingY`, không `gap` | `gap` alias cho `spacingX = spacingY` | `_layout_engine.js` |
| C1 | Không có `alignSelf` | Full pipeline: engine → export → runtime | All |
| C4 | `left/right` trong Linear bị ignore im lặng | Validation warnings | `_layout_engine_tools.js` |
| A1 | Node role implicit | `background` property tách rõ container vs leaf | `_layout_engine.js` |
| B5 | Row cross-axis `start/end` ngược convention Cocos | Swap: `start`=bottom, `end`=top | `_layout_engine.js` |
| B6 | Grid cell width chia đều parent | Dùng max child width | `_layout_engine.js` |
| D1 | `percentWidth` tính theo raw parent (chưa trừ padding) | Resolve against content area (trừ padding) | `_layout_engine.js`, `_layout.js` |
| D6 | Không có `flex-shrink` | Auto-shrink tỷ lệ khi overflow + `flexShrink: 0` opt-out | `_layout_engine.js`, `_layout.js` |
| E1 | Duplicate `sprite()`/`button()` trong `_base.js` và `_display.js` | Xóa duplicate từ `_base.js`, giữ canonical version ở `_display.js` | `_base.js` |
| E2 | Export tạo `cc.Node()` cho container (LayoutComponent không work) | Thay `cc.Node()` → `ccui.Layout()` | `_layout_engine_export.js` |
| E6 | Wrap layout không tính margin khi line-break | `arrangeAsWrap` include margin trong overflow check + positioning | `_layout.js` |
| E7 | Runtime `_parsePadding` không đọc `paddingTop/Right/Bottom/Left` | Thêm fallback đọc individual props từ opts | `_layout.js` |
| E8 | `useSafeArea`/`ignoreSafeArea` không cần cho game | Xóa toàn bộ safe area logic | `_layout_engine.js` |
| E9 | `setLayoutSize` duplicate branch cho non-scaleMode | Chỉ scale khi có `scaleMode`, không scale thì set contentSize | `_display.js` |
| E10 | `validate()` không tính scale khi check bounds | Account for `_scaleX/_scaleY` | `_layout_engine_tools.js` |
| E11 | `buildTree()` dùng `JSON.parse(JSON.stringify())` không document | Thêm comment về limitation (no functions, no circular refs) | `_layout_engine.js` |
| E13 | Button callback name có thể chứa ký tự invalid | Dùng `sanitizeName()` cho callback method names | `_layout_engine_export.js` |
| E14 | `align()` default dùng average cho mọi type | `left/bottom`=min, `right/top`=max, `center`=average | `_high-level.js` |
| E15 | `pinToTop/Bottom/Left/Right` có unused `parent` param | Xóa parameter, LayoutComponent tự resolve parent | `_position.js` |
| E16 | Flex + margin: runtime double-subtract margins | Flex items margins chỉ trừ từ allocated space, không cộng vào totalFixed | `_layout.js` |

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
| `flex-shrink` | `flexShrink` | ✅ Auto-shrink + opt-out |
| `gap` | `gap` | ✅ Uniform spacing |
| `padding` | `padding` (shorthand + individual) | ✅ Full CSS parity |
| `margin` | `margin` | ✅ Full support |
| `position: absolute` | `layoutType: "Absolute"` + constraints | ✅ Tốt |
| `width/height` in % | `percentWidth/percentHeight` | ✅ Hoạt động |
| `min-width/max-width` | `minWidth/maxWidth/minHeight/maxHeight` | ✅ Clamp |
| `aspect-ratio` | `aspectRatio` | ✅ Auto-compute |
| `object-fit` | `scaleMode` (FILL/FIT/STRETCH) | ✅ Tương đương |
| `display: grid` | `layoutType: "Grid"` | ⚠️ Basic |
| `flex-wrap: wrap` | `layoutType: "Wrap"` | ✅ Margin-aware |
| `overflow: scroll` | `layoutType: "ScrollView"` | ✅ Vertical + Horizontal |
| `visibility: hidden` | — | ❌ Chỉ có `visible` (= `display: none`) |
| `overflow: hidden` | `clipping` | ✅ Basic |

---

## ⚠️ Design Issues Còn Tồn Tại

### D2. Grid thiếu tính năng so với CSS Grid

| CSS Grid Feature | Status | Mức cần thiết cho game |
|-----------------|--------|----------------------|
| `grid-template-columns: 1fr 2fr` | ❌ | 🟡 Hữu ích cho dashboard |
| `grid-column: span 2` | ❌ | 🟠 Low — hiếm cần |
| Cell alignment (`justify-items`) | ❌ Chỉ center | 🟡 Medium |
| Auto-fill / auto-fit | ❌ | 🟠 Low |

**Workaround:** Dùng nested Linear rows.
**Severity:** 🟡 Medium

---

### D3. Wrap layout thiếu `alignItems` cho cross-axis

Wrap layout không có `alignItems`, items luôn align top trong mỗi dòng. CSS `flex-wrap: wrap` vẫn hỗ trợ `align-items`.

**Severity:** 🟠 Low — Wrap layout trong game thường dùng items cùng kích thước.

---

### D5. Label/Text measurement quá đơn giản

```javascript
w = str.length * fs * 0.6;  // Width estimate
h = fs * 1.2;                // Height estimate
```

Không handle multi-byte characters, word-wrap, multi-line. Chỉ ảnh hưởng preview (export code không dùng computed position cho text).

**Severity:** 🟡 Medium — Ảnh hưởng preview accuracy.

---

### D9. `scrollDirection: 'both'` Incomplete

> **Noted for future work** — không cần fix ngay.

`scrollDirection: 'both'` cho ScrollView chỉ layout theo vertical. Export code chỉ chọn `arrangeAsRow` hoặc `arrangeAsColumn`.

**Khi cần fix:** Thêm 2D content layout cho `both` direction, emit `UIBuilder.arrangeAsWrap` hoặc custom 2D scroll code.

**Severity:** 🟠 Low

---

## 🧪 Integration Tests (53/53 ✅)

Tests file: `tests/test-integration.html` — so sánh engine output vs UIBuilder runtime.

| # | Category | Tests | Status |
|---|----------|-------|--------|
| 1 | Linear Row (basic, gap, align, justify) | T1-T8 | ✅ |
| 2 | Linear Column (basic, gap, align, justify) | T9-T16 | ✅ |
| 3 | Grid (2-col, 3-col, spacing) | T17-T20 | ✅ |
| 4 | Wrap Layout | T21-T22 | ✅ |
| 5 | Reverse Direction | T23-T26 | ✅ |
| 6 | Percent Width/Height | T27-T30 | ✅ |
| 7 | ScaleMode (FIT, FILL, STRETCH) | T31-T36 | ✅ |
| 8 | Flex Distribution | T37-T40 | ✅ |
| 9 | AlignSelf | T41-T42 | ✅ |
| 10 | percentWidth + Padding (E3) | T43-T44 | ✅ |
| 11 | Grid Centering (E5) | T45-T46 | ✅ |
| 12 | Wrap with Margins (E6) | T47-T48 | ✅ |
| 13 | Individual Padding (E7) | T49-T50 | ✅ |
| 14 | Flex + Margin (E16) | T51-T53 | ✅ |

---

## 📊 Tổng Hợp Issues Còn Lại

| # | Vấn đề | Priority | Effort |
|---|--------|----------|--------|
| D2 | Grid chỉ hỗ trợ equal-size cells | 🟡 Medium | Medium |
| D3 | Wrap thiếu `alignItems` | 🟠 Low | Small |
| D5 | Label measurement = magic number | 🟡 Medium | Medium |
| D9 | ScrollView `both` direction incomplete | 🟠 Low | Medium |

---

## ✅ Kết Luận

Hệ thống layout **đã cover gần như toàn bộ CSS Flexbox model** bao gồm flex-grow, flex-shrink, margin, padding (shorthand + individual), align-self, và percent sizing. Engine và UIBuilder runtime đã **đồng bộ hoàn toàn** qua 53 integration tests.

Các issue còn lại chủ yếu là **nice-to-have** (Grid columns, label measure) và không ảnh hưởng tới game UI thực tế.

---

## Files Changed (lịch sử)

| File | Changes |
|------|---------|
| `_layout_engine.js` | scaleMode center, fill-parent, margin array, aspectRatio, layoutType leaf, Grid gap, alignSelf, `background`, row cross-axis swap, grid cell width, remove safe area, document clone limitation |
| `_layout_engine_export.js` | Grid gap, margin array, alignSelf, `background` → `setBackGroundImage()`, `ccui.Layout()` cho containers, sanitize callback names |
| `_layout_engine_tools.js` | 4 validation rules, scale-aware bounds check |
| `_layout.js` | margin array, alignSelf, individual padding, wrap margin-aware, flex+margin consistency |
| `_display.js` | `setLayoutSize` scaleMode-only scaling |
| `_high-level.js` | `align()` semantically correct defaults |
| `_position.js` | `pinTo*` removed unused `parent` param |
| `_base.js` | Removed duplicate `sprite()`/`button()` |
| `index.html` | Script includes, `background` CSS class + 🖼️📐 icon |
| `preview.json` | `sprCard` + `sprResourceBar` migrated to `background` syntax |