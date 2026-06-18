# 🌿 CẨM NANG HƯỚNG DẪN HỌC & BẢO VỆ ĐỒ ÁN ECOIMPACT

Chào bạn! Toàn bộ nội dung cẩm nang hướng dẫn học và bảo vệ đồ án **EcoImpact** đã được chia thành **4 phần học chi tiết có khối lượng và độ khó tương đương nhau**. 

Để dọn dẹp và giữ cho thư mục gốc của trang web luôn gọn gàng, tất cả tài liệu ôn tập đã được đưa vào thư mục `/tai_lieu_on_tap/`. Vui lòng click vào các liên kết bên dưới để truy cập trực tiếp vào từng phần học:

---

## 🗺️ Bản Đồ Ôn Tập Đồ Án (4 File Riêng Biệt)

### 🚪 [PHẦN 1: Giao Diện HUD & Hệ Thống Xác Thực](file:///c:/Users/ACER/Downloads/CNW/bwd/tai_lieu_on_tap/PHAN_1_UI_XAC_THUC.md)
*   **Các file liên quan:** [login.html](file:///c:/Users/ACER/Downloads/CNW/bwd/login.html), [register.html](file:///c:/Users/ACER/Downloads/CNW/bwd/register.html), [forgot-password.html](file:///c:/Users/ACER/Downloads/CNW/bwd/forgot-password.html), [auth.js](file:///c:/Users/ACER/Downloads/CNW/bwd/auth.js), [app.js](file:///c:/Users/ACER/Downloads/CNW/bwd/app.js), [login.css](file:///c:/Users/ACER/Downloads/CNW/bwd/login.css).
*   **Kiến thức chính:** Glassmorphism & HUD Styling, Web Storage API (`localStorage`), cơ chế xác thực giả lập Mock Auth (Login, Register, Quên mật khẩu đa bước và đếm ngược OTP).

### 📊 [PHẦN 2: Trực Quan Hóa Dữ Liệu & Tích Hợp APIs](file:///c:/Users/ACER/Downloads/CNW/bwd/tai_lieu_on_tap/PHAN_2_TRUC_QUAN_API.md)
*   **Các file liên quan:** [dashboard.html](file:///c:/Users/ACER/Downloads/CNW/bwd/dashboard.html), [dashboard.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/dashboard.js).
*   **Kiến thức chính:** Gọi API bất đồng bộ (`fetch` / `async-await`), vẽ đồ thị động (`Chart.js`), đọc và bóc tách cấu trúc file CSV trực tiếp ở Client, thuật toán nội suy ánh xạ tọa độ địa lý lên Canvas 2D.

### 🌋 [PHẦN 3: Đồ Họa 3D Trái Đất Thiên Tai & Hiệu Ứng Vật Lý](file:///c:/Users/ACER/Downloads/CNW/bwd/tai_lieu_on_tap/PHAN_3_3D_THAM_HOA.md)
*   **Các file liên quan:** [calculator.html](file:///c:/Users/ACER/Downloads/CNW/bwd/calculator.html), [calculator.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/calculator.js).
*   **Kiến thức chính:** Quản lý bối cảnh 3D Three.js và nạp mô hình (`GLTFLoader`), đồng bộ sự kiện thanh trượt DOM với WebGL qua CSS filter, hệ thống hạt núi lửa chịu tác động của lực hút trọng lực, hạt lốc xoáy lượng giác cực, và thuật toán chớp sét đánh răng cưa.

### 🌲 [PHẦN 4: Đồ Họa Hồi Sinh & Máy Chủ CORS Proxy Cache](file:///c:/Users/ACER/Downloads/CNW/bwd/tai_lieu_on_tap/PHAN_4_3D_HOI_SINH_SERVER.md)
*   **Các file liên quan:** [index.html](file:///c:/Users/ACER/Downloads/CNW/bwd/index.html), [bg3d.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/bg3d.js), [serve.ps1](file:///c:/Users/ACER/Downloads/CNW/bwd/serve.ps1).
*   **Kiến thức chính:** Di chuyển camera bám theo cuộn trang (smooth scroll Lerp), toán học uốn đỉnh ngọn cỏ parabol & mọc lan tỏa theo bán kính, lập trình Fragment/Vertex Shader vẽ tia sáng God Rays, xây dựng Backend HTTP Web Server proxy CORS và in-memory caching bằng PowerShell.

---

## 💡 Mẹo Ôn Tập Nhanh Cho Bạn
*   **Bước 1:** Đọc hiểu phần giải thích lý thuyết và thuật toán ở mỗi file.
*   **Bước 2:** Xem qua các câu hỏi phản biện của thầy cô để chuẩn bị trước phương án trả lời.
*   **Bước 3:** Gõ thử đoạn **code mẫu** ở cuối mỗi file vào một file scratch trống để hiểu cách các hàm hoạt động phối hợp với nhau.
