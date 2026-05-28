# 👤 NGƯỜI A — Frontend UI/UX, Xác thực & Các trang nội dung

> **Phần ôn tập riêng dành cho bạn.** Tập trung vào giao diện, thiết kế, hệ thống đăng nhập/đăng ký và cấu trúc HTML tổng thể.

---

## 📁 1. CÁC FILE CẦN ĐỌC KỸ

| File | Vai trò | Mức ưu tiên |
|:---|:---|:---:|
| [styles.css](file:///c:/Users/ACER/Downloads/CNW/bwd/styles.css) | Toàn bộ hệ thống CSS: Glassmorphism, Bento Grid, HUD corners, micro-animations | ⭐⭐⭐ |
| [auth.js](file:///c:/Users/ACER/Downloads/CNW/bwd/auth.js) | Hệ thống xác thực mô phỏng (Mock Auth) bằng LocalStorage | ⭐⭐⭐ |
| [login.html](file:///c:/Users/ACER/Downloads/CNW/bwd/login.html) | Giao diện đăng nhập | ⭐⭐⭐ |
| [register.html](file:///c:/Users/ACER/Downloads/CNW/bwd/register.html) | Giao diện đăng ký | ⭐⭐⭐ |
| [forgot-password.html](file:///c:/Users/ACER/Downloads/CNW/bwd/forgot-password.html) | Giao diện khôi phục mật khẩu (OTP mô phỏng) | ⭐⭐⭐ |
| [login.css](file:///c:/Users/ACER/Downloads/CNW/bwd/login.css) | CSS riêng cho các trang Auth | ⭐⭐ |
| [index.html](file:///c:/Users/ACER/Downloads/CNW/bwd/index.html) | Trang chủ — cấu trúc HTML, layout, lộ trình "Hành trình người hùng" | ⭐⭐⭐ |
| [community.html](file:///c:/Users/ACER/Downloads/CNW/bwd/community.html) | Trang cộng đồng sống xanh | ⭐⭐ |
| [news.html](file:///c:/Users/ACER/Downloads/CNW/bwd/news.html) | Trang tin tức (Iframe nhúng) | ⭐⭐ |
| [dashboard.html](file:///c:/Users/ACER/Downloads/CNW/bwd/dashboard.html) | Bảng điều khiển — **phần giao diện HTML/CSS** (biểu đồ, bảng xếp hạng, huy hiệu) | ⭐⭐ |

---

## 🧠 2. KIẾN THỨC CẦN NẮM VỮNG

### 2.1. Thiết kế Glassmorphism & Sci-Fi HUD

Đây là **điểm nổi bật nhất về UI/UX** của đồ án. Bạn cần giải thích được:

**Glassmorphism (Hiệu ứng kính mờ):**
- Sử dụng lớp phủ nền bán trong suốt (`background: rgba(...)`) kết hợp `backdrop-filter: blur(24px)`
- Mục đích: Giúp các khung thẻ nội dung hiển thị sang trọng, nổi bật trên nền hoạt ảnh 3D chuyển động mà không gây rối mắt
- Nằm trong file [styles.css](file:///c:/Users/ACER/Downloads/CNW/bwd/styles.css)

**Sci-Fi HUD (Heads-Up Display):**
- Các `hud-corner` — khung viền công nghệ cao ở 4 góc mỗi thẻ card
- Tạo cảm giác như đang quan sát Trái Đất qua kính viễn vọng của trung tâm điều khiển hiện đại
- Các đường kẻ định vị radar tạo phong cách giao diện tương lai

**Bento Grid Layout:**
- Hệ thống lưới bố cục hiện đại sắp xếp các card thông tin
- Responsive — tự động thay đổi bố cục theo kích cỡ màn hình

---

### 2.2. Hệ thống Mock Auth Engine

Nằm trong file [auth.js](file:///c:/Users/ACER/Downloads/CNW/bwd/auth.js). Bạn cần hiểu rõ:

**LocalStorage là gì?**
- Bộ nhớ Key-Value lưu trữ trực tiếp trên ổ cứng của trình duyệt
- **Không có ngày hết hạn** — dữ liệu tồn tại ngay cả khi tắt trình duyệt, khởi động lại máy tính
- Khác với `SessionStorage` (mất khi đóng tab) và `Cookie` (có thể cài thời hạn, gửi kèm mọi request HTTP)

**Các khóa dữ liệu quan trọng:**
| Khóa | Chứa gì |
|:---|:---|
| `mock_users_v1` | Mảng JSON chứa danh sách tất cả user đã đăng ký |
| `current_user` | Đối tượng JSON chứa thông tin user đang đăng nhập |

**Luồng hoạt động:**

```
ĐĂNG KÝ (register):
  1. Kiểm tra mật khẩu ≥ 6 ký tự
  2. Kiểm tra email chưa tồn tại trong mock_users_v1
  3. Nếu đạt → push user mới vào mảng → lưu lại LocalStorage

ĐĂNG NHẬP (login):
  1. Tìm email trong mảng mock_users_v1
  2. So khớp mật khẩu
  3. Nếu đúng → lưu user vào current_user → hiển thị tên trên Navbar

ĐĂNG XUẤT (logout):
  1. Gọi localStorage.removeItem('current_user')
  2. Navbar quay về hiển thị nút Đăng nhập

QUÊN MẬT KHẨU:
  1. Nhập email → hệ thống tạo mã OTP cố định 123456
  2. OTP có thời hạn 10 phút
  3. In OTP ra bảng thông báo (console) để dễ kiểm thử
  4. Nhập đúng OTP → cho phép đặt lại mật khẩu mới
```

---

### 2.3. Cấu trúc HTML tổng thể

Bạn cần nắm vai trò của **tất cả các trang HTML** trong dự án:

| Trang | Chức năng chính |
|:---|:---|
| `index.html` | Trang chủ — giới thiệu sứ mệnh, số liệu tổng quan, lộ trình "Hành trình người hùng", đăng ký bản tin |
| `calculator.html` | Công cụ tính Carbon — Slider, quả cầu 3D, xuất báo cáo PDF |
| `dashboard.html` | Bảng điều khiển — biểu đồ lịch sử, bảng xếp hạng, huy hiệu |
| `news.html` | Tin tức khí hậu — nhúng Iframe cổng thông tin môi trường VN |
| `community.html` | Cộng đồng sống xanh — thử thách bảo vệ Trái Đất |
| `login.html` | Đăng nhập |
| `register.html` | Đăng ký |
| `forgot-password.html` | Khôi phục mật khẩu qua OTP |

**Navbar responsive:**
- Trước đăng nhập: hiển thị nút "Đăng nhập"
- Sau đăng nhập: thay thế bằng **tên tài khoản** của user

---

### 2.4. Micro-animations & UX

- **Counter đếm tăng dần**: Các con số thống kê trên trang chủ đếm từ 0 lên giá trị thật khi cuộn trang đến
- **Hiệu ứng hover**: Các card nổi lên, đổ bóng khi rê chuột
- **Transition mượt**: Chuyển đổi màu sắc, kích thước có thời gian chuyển tiếp (CSS `transition`)
- **Animated Charts**: Biểu đồ Chart.js vẽ dần dần khi trang load xong

---

## ❓ 3. CÂU HỎI PHẢN BIỆN CẦN CHUẨN BỊ

### Câu 4: Đồ án lưu trữ thông tin tài khoản ở đâu? Tắt trình duyệt thì còn giữ được không?

> **💡 Gợi ý trả lời:**
> "Hệ thống xác thực thành viên sử dụng bộ nhớ **LocalStorage** của trình duyệt web thông qua thư viện xác thực tự viết `auth.js`.
> LocalStorage lưu trữ dữ liệu dưới dạng khóa-giá trị (Key-Value) trực tiếp trên ổ cứng thiết bị người dùng và dữ liệu **không có ngày hết hạn**. Khi tắt trình duyệt, khởi động lại máy tính, thông tin tài khoản (khóa `mock_users_v1`) và phiên đăng nhập (khóa `current_user`) vẫn được bảo toàn. Chỉ khi đăng xuất (gọi `localStorage.removeItem('current_user')`) hoặc xóa dữ liệu duyệt web thì thông tin mới bị mất."

---

### Câu 5: Điểm nổi bật nhất về thiết kế UI/UX?

> **💡 Gợi ý trả lời:**
> "Điểm nổi bật nhất là ứng dụng phong cách **Glassmorphism (Kính mờ)** kết hợp **Sci-Fi HUD (Heads-Up Display)**:
> 1. **Hiệu ứng Kính mờ**: Lớp phủ bán trong suốt + `backdrop-filter: blur(24px)` → card nổi bật trên nền 3D mà không rối mắt.
> 2. **Phong cách HUD & Cyber**: Đường kẻ radar, khung viền `hud-corner` ở 4 góc card → cảm giác đang quan sát qua trung tâm điều khiển hiện đại.
> 3. **Trải nghiệm UX mượt mà**: Counter đếm tăng, biểu đồ chuyển động, sấm chớp lập lòe, cỏ đung đưa theo gió → hệ sinh thái số có cảm giác sống động."

---

## 🎯 4. PHẦN DEMO CỦA BẠN TRƯỚC HỘI ĐỒNG

```
Bước 1: Mở trang chủ index.html → chỉ vào layout Glassmorphism, HUD corners
Bước 2: Vào trang Đăng ký → tạo tài khoản mới → chỉ ra validation
Bước 3: Vào trang Đăng nhập → đăng nhập thành công → chỉ tên user trên Navbar
Bước 4: Demo Quên mật khẩu → nhập OTP 123456 → đặt lại mật khẩu
Bước 5: Vào Dashboard → chỉ bảng xếp hạng và huy hiệu thành tích
```

---

## 📌 5. PHẦN CHUNG — BẠN VẪN CẦN NẮM (dù không phải phần chính)

> ⚠️ Hội đồng có thể hỏi chéo! Hãy đọc lướt để hiểu tổng quan.

- [ ] Tổng quan đề tài EcoImpact Hero — 4 tính năng chính
- [ ] Cấu trúc thư mục và vai trò từng file
- [ ] 2 sơ đồ Flowchart (luồng Calculator + Dashboard)
- [ ] Kịch bản demo tổng thể (Mục 5 trong tài liệu gốc)
- [ ] Đọc lướt 5 câu FAQ — đặc biệt câu 1 (CORS) và câu 3 (Three.js)

---
*Chúc bạn ôn tập tốt và tự tin bảo vệ đồ án! 🎓*
