# Layout Engine — Design Analysis (Post-Fix)

> Updated sau khi fix P0-P5 + `background` property + integration test 8/8 pass. Tổng: **17+ changes** trên **5 files**.

---

## ✅ Đã Fix

### P0 — Critical (Silent Bugs)

| # | Vấn đề | Fix |
|---|--------|-----|
| B3 | `scaleMode` sprite không tự center | Auto-center khi không có positioning constraints |
| B1/D3 | Absolute container 0×0 | Fill parent cho container có children |

### P1 — Consistency

| # | Vấn đề | Fix |
|---|--------|-----|
| D2 | `margin` chỉ hỗ trợ `number\|object` | Thêm array: `[v,h]`, `[t,r,b,l]` — engine, runtime, export |
| B4 | `aspectRatio` dùng raw JSON input | Dùng computed dimensions từ constraints |

### P2 — Design Clarity

| # | Vấn đề | Fix |
|---|--------|-----|
| A2 | `layoutType` gán cho cả leaf nodes | Chỉ gán cho nodes có children |
| C3 | Grid dùng `spacingX/spacingY`, không `gap` | `gap` alias cho `spacingX = spacingY` |

### P3 — New Features

| # | Vấn đề | Fix |
|---|--------|-----|
| C1 | Không có `alignSelf` | Full pipeline: engine → export → runtime |
| C4 | `left/right` trong Linear bị ignore im lặng | 3 validation warnings mới |
| — | `_layout_engine_tools.js` không load | Thêm script tags vào `index.html` |

### P4 + Background Property

| # | Vấn đề | Fix |
|---|--------|-----|
| A1 | Node role implicit (`type + children` confusing) | Thêm `background` property — tách rõ container vs leaf |
| — | Grid `_layoutNode` thiếu `gap` alias | Thêm `node.gap` fallback |
| — | Export thiếu margin array + alignSelf | Hoàn thiện export pipeline |

### P5 — Integration Test Fixes

| # | Vấn đề | Fix |
|---|--------|-----|
| B5 | Row cross-axis `start/end` ngược convention Cocos | Swap: `start`=bottom (Y=0), `end`=top (Y=H) |
| B6 | Grid cell width chia đều parent (`parentW/cols`) | Dùng max child width thay vì distribute |

---

## 🆕 `background` Property

**Trước:** AI phải dùng `"type": "sprite"` + `"children": [...]` → confusing vì sprite gợi ý leaf.

**Sau:** Tách rõ vai trò:
```json
// Container có hình nền — dùng `background`
{ "name": "card", "background": "sprite", "children": [...] }

// Leaf visual — dùng `type`
{ "type": "sprite", "name": "icon", "width": 50 }
```

- `background`: `"sprite"` | `"scale9"` | `"imageView"`
- `type + children` (cú pháp cũ): vẫn hoạt động, validation gợi ý chuyển sang `background`
- Export → `ccui.Layout()` + `setBackGroundImage()` | `setBackGroundImageScale9Enabled()`

---

## ⚠️ Hạn Chế Còn Tồn Tại

### 1. Không Có Responsive Breakpoints
Thiếu `@media`-like. Workaround: `percentWidth`, `flex`, `left+right` stretch.

### 2. Text Layout Hạn Chế
Label chỉ đo 1 dòng (`fs * 0.6 * length`). Không có `word-wrap`, `text-align`, multi-line, rich text.
> **Fix:** Cải thiện `_measureNode` label + support `maxWidth` auto wrap.

### 3. `visible: false` = `display: none`
Không có CSS `visibility: hidden` (ẩn nhưng giữ chỗ). Game UI hiếm cần.

### 4. ~~Engine vs Runtime Mismatch Risk~~ ✅ Đã Fix
~~Engine compute chính xác → HTML absolute. Export gen `arrangeAsRow/Column` → runtime tính lại. Nếu logic khác nhau → kết quả khác.~~
> **Đã fix:** Integration test 8/8 pass — row alignment + grid cell width đã sync giữa engine và runtime.

### 5. Safe Area Chỉ Root
`useSafeArea` chỉ trên root. Nested container cần safe area → không hỗ trợ.

### 6. Thiếu `backgroundColor`
Container muốn solid color phải tạo sprite child. Không có `background-color`, `border`, `border-radius`.

### 7. `_comment` Export Chưa Đủ
Export chỉ emit `_comment` trên nodes có `name`. Không propagate đầy đủ.

---

## 📋 Next Steps

| Priority | Action | Effort |
|----------|--------|--------|
| 🔴 High | **Viết guide thống nhất** — Gộp docs thành 1 file, có visual diagrams | Medium |
| 🔴 High | **Xóa/rewrite test files cũ** — `test-preview.json`, `test-all-features.json` | Small |
| 🟡 Medium | **Template examples** — Lobby, popup, inventory, card layout | Small |
| 🟡 Medium | **Label measure cải thiện** — Multi-line, maxWidth auto wrap | Medium |
| ~~🟠 Low~~ | ~~**Integration test** — Engine vs UIBuilder runtime~~ | ✅ Done (8/8 pass) |
| 🟠 Low | **`backgroundColor`** — Solid color cho container | Small |
| 🔵 Nice | **Schema validator CLI** | Small |

---

## Files Changed

| File | Changes |
|------|---------|
| `_layout_engine.js` | scaleMode center, fill-parent, margin array, aspectRatio, layoutType leaf, Grid gap, alignSelf, `background` container support, **row cross-axis start/end swap**, **grid cell width = max child** |
| `_layout_engine_export.js` | Grid gap, margin array, alignSelf, `background` → `setBackGroundImage()` |
| `_layout_engine_tools.js` | 4 validation rules (Linear constraints, Absolute props, alignSelf scope, `background` suggestion) |
| `_layout.js` | margin array, alignSelf runtime (Row + Column) |
| `index.html` | Script includes, `background` CSS class + 🖼️📐 icon |
| `preview.json` | `sprCard` + `sprResourceBar` migrated to `background` syntax |