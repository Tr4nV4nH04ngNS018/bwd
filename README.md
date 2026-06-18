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
📂 bwd/ (Thư mục gốc của dự án EcoImpact)
│
├── 📄 index.html               # Trang chủ chính (Giao diện cuộn cảnh 3D hồi sinh & 5 hồi kịch bản thuyết trình)
│
├── 📄 calculator.html          # Trang công cụ (Tính dấu chân carbon cá nhân & tương tác Trái Đất thiên tai 3D)
│
├── 📄 dashboard.html           # Bảng điều khiển (Đồ thị Chart.js, APIs live khí hậu & Bản đồ nhiệt Canvas)
│
├── 📄 community.html           # Diễn đàn cộng đồng (Chia sẻ ý tưởng xanh & Leaderboard bảng xếp hạng thành viên)
│
├── 📄 news.html                # Trang tin tức (Nhúng iframe trang tin Môi trường và Đời sống thực tế)
│
├── 📄 login.html               # Màn hình đăng nhập tài khoản (HUD Futuristic & Glassmorphic)
│
├── 📄 register.html            # Màn hình đăng ký tài khoản mới trong hệ sinh thái EcoImpact
│
├── 📄 forgot-password.html     # Màn hình khôi phục mật khẩu (Xác thực OTP giả lập & Cooldown 30s)
│
├── ⚙️ app.js                   # Logic xử lý giao diện chung (Đồng bộ session người dùng, dropdown Navbar)
│
├── ⚙️ auth.js                  # Logic xử lý xác thực (Lưu localStorage mock_users_v1, logic đăng ký/đăng nhập/OTP)
│
├── 🔌 serve.ps1                # Script PowerShell khởi tạo Web Server local port 8000 & CORS Proxy / RAM Caching
│
├── 🎨 styles.css               # CSS tùy biến giao diện Futuristic HUD, Radar scan & bộ lọc kính mờ (blur 18px)
│
├── 🎨 login.css                # CSS tùy biến HUD Glassmorphism riêng cho luồng xác thực (Login/Register/Forgot)
│
├── 📊 owid_electricity_generation.csv  # Dữ liệu sản lượng điện thế giới từ Our World in Data (quy đổi TWh)
│
├── 📊 owid_share_renewables.csv        # Dữ liệu tỷ trọng năng lượng tái tạo thế giới (quy đổi tỷ lệ %)
│
├── 📁 js/                      # Thư mục chứa các tệp JavaScript logic nghiệp vụ động nâng cao
│   │
│   ├── ⚙️ bg3d.js              # Khởi tạo Three.js nền: Life Tree 3D, camera Lerp cuộn trang, mưa axit, bụi mịn PM2.5
│   │
│   ├── ⚙️ calculator.js        # Điều khiển 3D Trái Đất thiên tai, hệ hạt dung nham núi lửa, lốc xoáy cực, sét chớp sáng
│   │
│   ├── ⚙️ dashboard.js         # Gọi API ngoài, vẽ Chart.js, chiếu vĩ độ/kinh độ lên Canvas bản đồ phẳng Mercator
│   │
│   ├── ⚙️ index.js             # Xử lý scroll reveal (IntersectionObserver), chạy số counter, vẽ Canvas Sparkline
│   │
│   └── ⚙️ universeBg.js        # Khởi tạo Three.js nền: Bầu trời sao động và hiệu ứng hạt sao băng chéo cho trang Auth
│
├── 📁 lib/                     # Thư mục chứa thư viện API hoặc module kết nối Client-side
│   │
│   └── 📁 api/
│       │
│       ├── ⚙️ api.js           # Module JavaScript gọi APIs
│       └── ⚙️ api.ts           # Khai báo kiểu TypeScript cho các endpoint
│
├── 📁 models/                  # Thư mục chứa các mô hình đồ họa 3D WebGL (Định dạng GLB, GLTF, Blend)
│   │
│   ├── 📦 planet_earth.glb     # Mô hình Trái Đất 3D dung lượng nhẹ cho trang chủ
│   │
│   ├── 📦 earth.glb            # Mô hình Trái Đất 3D độ phân giải trung bình phục vụ trang thiên tai
│   │
│   ├── 📦 caytrangchu.glb      # Mô hình Cây Sự Sống (Life Tree) phục vụ hiệu ứng hồi sinh mọc lá
│   │
│   ├── 📦 juan.glb             # Mô hình nhân vật tương tác động
│   │
│   └── 📦 *.blend              # Các tệp thiết kế nguồn 3D Blender gốc phục vụ chỉnh sửa (earth.blend, ...)
│
├── 📁 images/                  # Thư mục chứa các tài nguyên ảnh phẳng & Vector SVG
│   │
│   ├── 🖼️ logo.svg            # Logo chính thức của dự án EcoImpact dạng vector sắc nét phát sáng
│   │
│   ├── 🖼️ world-map.svg        # Bản đồ thế giới 2D dùng làm nền Canvas phẳng nội suy tọa độ nhiệt độ
│   │
│   └── 🖼️ *.png / *.jpg        # Các hình ảnh bento card và ảnh nền rừng xanh dự phòng khi sập mạng
│
├── 📁 textures/                # Thư mục chứa các vân phủ bề mặt (Texture maps) cho các mô hình 3D WebGL
│   │
│   ├── 🗺️ 8k_earth_daymap.png  # Vân bề mặt ban ngày độ phân giải cao 8K của Trái Đất
│   │
│   ├── 🗺️ 8k_earth_nightmap.png # Vân bề mặt ban đêm (ánh đèn thành phố tỏa sáng từ vũ trụ)
│   │
│   ├── 🗺️ Ground_BaseColor.png # Vân bề mặt mặt đất
│   │
│   └── 🗺️ Stump_Roughness.png / ... # Các map ánh xạ ánh sáng (Roughness), độ nổi gồ ghề (Normal map)
│
└── 📁 tai_lieu_on_tap/         # Thư mục chứa bộ tài liệu ôn thi học phần và phản biện đồ án chi tiết
    │
    ├── 📘 PHAN_1_UI_XAC_THUC.md       # Tài liệu ôn thi phần 1: Giao diện HUD, Mock Auth, bầu trời sao Three.js
    │
    ├── 📘 PHAN_2_TRUC_QUAN_API.md     # Tài liệu ôn thi phần 2: Gọi API, bóc tách CSV, Canvas bản đồ phẳng Mercator
    │
    ├── 📘 PHAN_3_3D_THAM_HOA.md       # Tài liệu ôn thi phần 3: Mô hình 3D thiên tai, hệ hạt dung nham, sấm sét ngẫu nhiên
    │
    ├── 📘 PHAN_4_3D_HOI_SINH_SERVER.md # Tài liệu ôn thi phần 4: Camera Lerp, thảm cỏ uốn gió, server PowerShell & CORS
    │
    ├── 📘 CAC_CONG_NGHE.md            # Tổng hợp kiến thức và vai trò của các thư viện sử dụng trong đồ án
    │
    └── 📘 HUONG_DAN_BAO_VE_DO_AN.md    # Hướng dẫn chi tiết mẹo thuyết trình, trả lời câu hỏi khó của Hội đồng
```
