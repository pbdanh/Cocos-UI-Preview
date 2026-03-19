# Đặc tả JSON Schema cho Hệ thống Sinh Giao Diện UI

Bản tóm tắt này đóng vai trò như một bộ **Nguyên tắc Thiết kế (Design Guidelines)** dành riêng cho AI Agent. Mục tiêu là giúp AI xuất ra file định dạng JSON tối ưu nhất, sạch nhất, chỉ tập trung vào cấu trúc (Structure) và bố cục (Layout), tận dụng toàn bộ sức mạnh tự động hóa của hàm `computeLayout` trong `_layout_engine.js`.

---

## Kiến trúc Module

| Module | Chức năng |
|--------|--------|
| `_layout_engine.js` | Core: `buildTree`, `computeLayout`, `getNodeBounds`, `getRenderOrder` |
| `_layout_engine_export.js` | `exportAdaptiveCode()` — sinh code UIBuilder |
| `_layout_engine_tools.js` | Dev tools: `validate()`, `setNodeProp()`, `diffLayout()` |

---

## 1. Mục tiêu và Nguyên tắc Thiết kế
- **Tập trung Hình Thái Nội Dung (Static Layout):** AI đóng vai trò thao tác cắt layout HTML/CSS cơ bản: khai báo loại Node, chia Flexbox, căn lề Absolute.
- **Để Máy Lọc Tính Toán Pixel:** Thuật toán `computeLayout` nội bộ sẽ lo hoàn toàn việc đong đếm tọa độ `px` tĩnh và tính tỉ lệ đa màn hình (Multi-resolution).
- **Loại bỏ Logic Hành Vi:** Mọi xử lý State (Hover/Click), Data Binding, và **Animation** (hoạt ảnh) sẽ được Lập trình viên lập trình (Code) bổ sung ở giai đoạn tiếp nối. JSON gốc phải hoàn toàn "tĩnh".

---

## 2. Đặc tả JSON Component (Phạm vi GIỮ LẠI cho AI)
Yêu cầu bắt buộc AI phải nắm vững và output đúng các trường cốt lõi này theo đúng chính tả.

### A. Định danh và Hierarchy (Cấu trúc Cây)
- `name` *(String)*: Tên định danh của Node (ví dụ: `btn_play`, `bg_main`). Rất quan trọng để Code truy xuất.
- `children` *(Array)*: Tổ hợp mảng chứa các Node con bao bọc bên trong.
- `type` *(String)*: Kiểu khởi tạo. Hỗ trợ bắt buộc: `sprite`, `button`, `label`, `scale9`, `progressBar`, `imageView`, hoặc `node` (đối với container rỗng).

### B. Hệ thống Dàn trang (Bố cục Flexbox & Absolute)
- `layoutType` *(String)*: Phải chọn đúng mô hình: `Absolute`, `Linear`, `Grid`, `Wrap`, `ScrollView`.
- `flexDirection`, `justifyContent`, `alignItems`, `gap`: Cực kỳ quan trọng để chia luồng khi `layoutType: "Linear"`.
- `margin`, `padding` *(Number/Array)*: Khoảng cách đệm bên trong và lề bên ngoài.
- `left`, `right`, `top`, `bottom` *(Number)*: Khoảng cách biên neo cứng nội tại so với mép thẻ cha (dùng ở chế độ `Absolute`).
- `horizontalCenter`, `verticalCenter` *(Number)*: Căn giữa đối tượng kèm theo khoảng độ lệch (offset pixels).
- `percentWidth`, `percentHeight` *(Number 0.0 - 1.0)*: Kích thước co giãn linh hoạt tỷ lệ theo Size thẻ cha mẹ.
- `flex` *(Number)*: Tỷ lệ không gian giãn rở trong nhóm Linear Layout.

### C. Quản lý Hiển thị và Đồ họa
- Tính chất hiển thị (Độ trong, Khóa Ẩn): `visible` *(Boolean)*, `opacity` *(0-255)*, `color` *(Object RGB)*.
- Phân lớp chồng đè: `zOrder` *(Number)* - AI cần gán chỉ số bậc gốc này để lớp ảnh nền không đè lên chữ.
- Chuyển đổi ma trận tĩnh: `rotation` *(Number)*, mảng trọng tâm `anchor` *(Array `[x, y]`)*.
- Khai báo Nội dung File/Text: Tham chiếu `src` hoặc `file` (dẫn link tập tin ảnh), `text` hoặc `title` (nội dung cho nhãn/nút), `fontSize`.

### D. Cơ chế Scale Hình Ảnh (Hình nền hiển thị đa màn hình)
- `scaleMode` *(String)*: Áp dụng cho ảnh hiển thị trên kích thước không có định. Hỗ trợ 3 Mode: `FILL` (Lắp kín trào mép viền), `FIT` (Canh lọt lòng), `STRETCH` (Kéo méo dãn kín vùng).

---

## 3. Các "Best Practices" và Tuyệt chiêu khuyến nghị cho AI
Để chất lượng mã JSON sinh ra nhìn chuẩn chỉnh chuyên nghiệp như Lập trình viên làm, AI cần học các Design Pattern sau:

- **Tuyệt Chiêu Hình Nền Lấp Đầy (Background Scale):** 
  - Đặt `percentWidth: 1.0` và `percentHeight: 1.0` (hoặc cấu hình neo tứ phía `left: 0, right: 0, top: 0, bottom: 0`) cho node background để kích thước node đúng bằng 100% kích thước Node mẹ nó.
  - Gắn kèm thuộc tính ảnh `scaleMode: "FILL"`. Ảnh sẽ tự động Zoom In giữ đúng tỉ lệ khung nét mà lấp trào trọn vẹn dải nền thừa thiết bị.
- **Giữ Tỉ Lệ Khung Hình Chặt Chẽ (`aspectRatio`):** 
  - AI chỉ cần khai báo `aspectRatio: 1.0` (Khung vuông tỉ lệ 1:1) hoặc `aspectRatio: 1.77` (16:9 ngang). Khi đó Engine sẽ tự tính ra chiều còn lại (`height` ăn theo `width`). Rất hiệu quả cho các loại Avatars, Icons không muốn bị móp méo lùn đi.
- **Đừng Vướng "Tai Thỏ" Điện Thoại (`useSafeArea`):** 
  - Đối với thẻ gốc (Root node) hoặc Khung lưới khối thông tin (Info Container), AI nên nhúng thêm biến `useSafeArea: true` để Engine lo liệu thuật toán đẩy Margin chừa Vùng An Toàn (Notch), trong khi đó ở lớp nền cực sâu Background ở ngoài thì ta không set biến này.
- **Ghi chú Khối Layout (`_comment`):** AI có thể lưu lại "Ghi chú suy nghĩ" lý do thiết kế (`"_comment": "Canh giữa vì đây là Popup"`), giúp Lập trình viên người trực tiếp đọc cấu trúc XML/JSON đó không bối rối.

---

## 4. Các trường LOẠI BỎ KHỎI TỪ ĐIỂN JSON (Không dùng để tránh làm rối AI)
Nhằm giữ cho file JSON tinh gọn nhất và giữ AI ở trạng thái sắc bén (Sharp Context):

- **Loại bỏ Tọa Độ & Kích thước Pixel Chết Cố Định (`x`, `y`):** Yêu cầu KHÔNG cho AI sử dụng bộ gán trực tiếp `x, y` cố định hoặc ôm khư khư tham chiếu `width, height` cực đoan vào các lớp Layout chính. Những đại lượng số tĩnh này sẽ khiến bố cục chỉ hoạt động tốt ở màn 1 độ phân giải mà vỡ toang ở iPad hay Mobile dọc.
- **Loại bỏ Hoạt Ảnh (Animation):** Hệ thống Animation đã được di dời sang công nghệ viết file Script JS riêng biệt ở phía Dev. AI hoàn toàn **không cần thiết phải gen chuỗi mảng rắc rối** `animations`, `intro`, `loop`, `exit`, `easing`, hay `duration` trong giai đoạn Layout DOM này. Ưu tiên tải hình ảnh UI lên trước (Static Load).
- **Cắt Gọt Cú Pháp Cũ (Legacy Refactoring):** AI phải viết văn phong cấu trúc mới nhất, nghiêm cấm khai báo lỗi thời do thói quen: 
  - Sài mảng `w`, `h` ngắn gọn -> Bắt buộc ghi rành mạch `width`, `height`.
  - Phế bỏ bộ cục `pinEdges` hỗn độn -> Giải tỏa ghi đè thẳng `left`, `right`, `top`, `bottom` ra Root Node Properties.
  - Vứt bỏ kiểu `type: "row"` hoặc `"column"` -> Đồng bộ kiến trúc với `layoutType: "Linear"` kèm `flexDirection`.
- **Logic Trạng Thái (States) & Dữ Liệu:** Không nhồi gửi UI Trạng thái rườm rà (States Hover/Pressed/Selected) hay bộ gõ móc nối Data Binding.
