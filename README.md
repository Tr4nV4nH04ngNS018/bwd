# 🌿 Tổng Quan Dự Án EcoImpact

**EcoImpact** (hay *EcoImpact Hero*) là một nền tảng Web tương tác hiện đại hướng tới giáo dục và bảo vệ môi trường với thông điệp cốt lõi: **"Thói Quen Nhỏ, Tác Động Lớn"**. Website được thiết kế với giao diện cao cấp, kết hợp phong cách khoa học viễn tưởng tương lai (Futuristic HUD) và hiệu ứng kính mờ (Glassmorphism), mang lại trải nghiệm thị giác ấn tượng cho người dùng.

---

## 🎯 Mục Tiêu & Chức Năng Cốt Lõi

1. **Đo Lường Dấu Chân Sinh Thái (Carbon Footprint Calculator):**
   * Tính toán lượng khí thải CO₂ cá nhân phát sinh từ thói quen đi lại, nhựa tiêu dùng, và điện nước tiêu thụ hàng ngày (`calculator.html`).
   * Đưa ra các con số quy đổi trực quan như: số lượng cây cần trồng để bù đắp, lượng carbon chênh lệch so với mức trung bình toàn cầu.

2. **Bảng Điều Khiển Trực Quan (Climate Dashboard):**
   * Trực quan hóa các dữ liệu biến đổi khí hậu thực tế theo thời gian thực (Nhiệt độ toàn cầu, Nồng độ khí nhà kính CO₂, Chất lượng không khí AQI/bụi mịn PM2.5, PM10) (`dashboard.html`).
   * Hiển thị bảng xếp hạng đóng góp của các thành viên tích cực để thúc đẩy phong trào sống xanh (Gamification).

3. **Gắn Kết Cộng Đồng & Giáo Dục:**
   * Không gian chia sẻ các sáng kiến, mẹo sống xanh hữu ích giữa các thành viên (`community.html`).
   * Cập nhật tin tức sinh thái, dự án xanh nổi bật toàn cầu (`news.html`).
   * Hệ thống bản tin sinh thái tự động nhận qua email.

4. **Cá Nhân Hóa Trải Nghiệm:**
   * Hệ thống đăng nhập, đăng ký và lấy lại mật khẩu thân thiện (`login.html`, `register.html`, `forgot-password.html`).
   * Lưu trữ tiến trình và dữ liệu tính toán cục bộ của từng người dùng.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

Dự án được tối ưu hóa chạy trực tiếp trên trình duyệt ở phía Client với sự kết hợp của nhiều thư viện đồ họa và trực quan dữ liệu mạnh mẽ:

### 1. Đồ Họa 3D Tương Tác (WebGL & Real-time 3D)
* **Three.js (v0.128.0):** Thư viện chính dựng bối cảnh 3D động cho nền trang web (`js/bg3d.js`).
* **GLTFLoader:** Tải các mô hình low-poly 3D từ các file `.glb` (mô hình Trái Đất `earth.glb`, cây cối trang chủ `caytrangchu.glb`, nhân vật tương tác `juan.glb`).
* **OrbitControls:** Cho phép người dùng dùng chuột xoay, zoom và tương tác trực quan với mô hình 3D.
* **Three.js Post-processing (Hiệu ứng hậu kỳ):**
  * `EffectComposer` & `RenderPass`: Quản lý bộ lọc hiệu ứng chồng.
  * `UnrealBloomPass` & `LuminosityHighPassShader`: Tạo hiệu ứng tỏa sáng phát quang neon (Bloom/Glow) huyền ảo cho các chi tiết máy móc, khí quyển và lá cây.

### 2. Thiết Kế & Giao Diện (UI/UX Styling)
* **Tailwind CSS (CDN):** Thư viện CSS hỗ trợ xây dựng giao diện đáp ứng (Responsive), cấu trúc lưới Bento Grid hiện đại và bố cục linh hoạt cực kỳ nhanh chóng.
* **Vanilla CSS (`styles.css`, `login.css`):** Được tùy biến thủ công cho các hiệu ứng cao cấp:
  * **Glassmorphism (Kính mờ):** Sử dụng `backdrop-filter: blur(...)` kết hợp viền mờ màu sáng tạo cảm giác sang trọng, trong suốt.
  * **Futuristic HUD corners:** Thiết kế các góc bo cơ khí công nghệ cao, đèn nhấp nháy (Pulse dots), và lưới đo đạc (Grid overlay) mô phỏng trung tâm điều khiển khí hậu.
* **Google Fonts:** Cặp phông chữ tinh tế:
  * **Fraunces:** Font chữ serif cổ điển đầy tính biểu cảm dành cho tiêu đề chính.
  * **Be Vietnam Pro:** Font chữ sans-serif hình khối sắc nét lý tưởng cho các con số kỹ thuật và văn bản đọc.

### 3. Biểu Đồ & Trực Quan Hóa Dữ Liệu
* **Chart.js:** Thư viện vẽ biểu đồ chính trên trang Dashboard để thể hiện xu hướng tăng CO₂ qua các năm và so sánh nhiệt độ thực tế giữa các châu lục.
* **HTML5 Canvas API:** Dùng để tự vẽ đồ thị thu nhỏ (Sparklines) động màu xanh lá tại các Bento card thống kê ngoài trang chủ, nâng cao hiệu năng tải trang.

### 4. Nguồn Dữ Liệu Thời Gian Thực (APIs)
* Tích hợp dữ liệu khoa học thực tế từ các trạm quan trắc uy tín:
  * **Global-Warming API:** Cập nhật nồng độ CO₂ (`co2-api`) và biến thiên nhiệt độ bề mặt trái đất (`temperature-api`).
  * **Open-Meteo Air Quality API:** Dự báo chỉ số chất lượng không khí AQI và các hạt bụi mịn PM2.5, PM10.
  * **Our World in Data (OWID):** Cung cấp các tệp dữ liệu CSV về sản lượng điện toàn cầu và tỷ lệ chuyển dịch sang năng lượng tái tạo.

### 5. Lưu Trữ Dữ Liệu & Server Cục Bộ
* **Web Storage (localStorage):** Lưu trữ thông tin tài khoản đang đăng nhập, kết quả đo carbon gần nhất mà không cần thiết lập Database phức tạp phía máy chủ.
* **PowerShell Web Server (`serve.ps1`):** 
  * Đóng vai trò là máy chủ phân phối file tĩnh (HTML, CSS, JS, GLB) cục bộ qua giao thức `http://localhost:8000`.
  * Hoạt động như một **CORS Proxy** trung gian (qua đường dẫn `/api/proxy`) để tải hộ dữ liệu từ các API công cộng bị chặn CORS, đi kèm bộ đệm ẩn tạm thời (Simple Cache) tối ưu hóa tốc độ tải trang.

---

## 📂 Sơ Đồ Cấu Trúc Thư Mục Chính

```text
bwd/
├── index.html                   # Trang chủ (Hiện trạng thế giới & Sứ mệnh)
├── calculator.html              # Công cụ tính toán lượng phát thải CO2 cá nhân
├── dashboard.html               # Bảng thống kê dữ liệu biến đổi khí hậu thực tế
├── community.html               # Diễn đàn chia sẻ ý tưởng xanh & Leaderboard
├── news.html                    # Tin tức và dự án môi trường nổi bật
├── login.html / register.html   # Các trang xác thực tài khoản người dùng
├── serve.ps1                    # Script khởi tạo Local Web Server & CORS Proxy
├── styles.css                   # CSS chính tùy biến giao diện HUD & Glassmorphic
├── app.js                       # Logic xử lý giao diện chung và cuộc gọi API
├── js/
│   └── bg3d.js                  # Logic dựng & tương tác bối cảnh 3D (Three.js)
├── images/                      # Thư mục chứa các tài nguyên ảnh tĩnh
└── planet_earth.glb / ...       # Các tệp mô hình 3D dung lượng nhẹ cho WebGL
```
