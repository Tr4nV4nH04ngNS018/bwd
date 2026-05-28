# 👤 NGƯỜI B — Đồ họa 3D, Thuật toán Carbon & API/CORS Proxy

> **Phần ôn tập riêng dành cho bạn.** Tập trung vào Three.js, công thức tính toán Carbon, tích hợp API thời gian thực và CORS Proxy.

---

## 📁 1. CÁC FILE CẦN ĐỌC KỸ

| File | Vai trò | Mức ưu tiên |
|:---|:---|:---:|
| [js/bg3d.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/bg3d.js) | Toàn bộ kịch bản Three.js: Scene, Camera, Lighting, Particles, thảm Cỏ/Hoa | ⭐⭐⭐ |
| [calculator.html](file:///c:/Users/ACER/Downloads/CNW/bwd/calculator.html) | Trang Calculator — **cả HTML lẫn JS nhúng** (hàm `calcCO2()`, Slider, quả cầu 3D) | ⭐⭐⭐ |
| [app.js](file:///c:/Users/ACER/Downloads/CNW/bwd/app.js) | Logic chính Frontend: gọi API, vẽ Chart.js, xử lý dữ liệu Dashboard | ⭐⭐⭐ |
| [serve.ps1](file:///c:/Users/ACER/Downloads/CNW/bwd/serve.ps1) | Server PowerShell — CORS Proxy, caching `$global:apiCache`, TTL 300s | ⭐⭐⭐ |
| [dashboard.html](file:///c:/Users/ACER/Downloads/CNW/bwd/dashboard.html) | Bảng điều khiển — **phần logic JS** (gọi API, render biểu đồ Chart.js) | ⭐⭐ |

---

## 🧠 2. KIẾN THỨC CẦN NẮM VỮNG

### 2.1. Đồ họa 3D với Three.js & WebGL

Đây là **điểm WOW lớn nhất** của đồ án. File chính: [js/bg3d.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/bg3d.js)

#### Bộ ba cốt lõi Three.js:
```
THREE.Scene          → Không gian 3D chứa mọi vật thể
THREE.PerspectiveCamera → Camera góc rộng quan sát scene
THREE.WebGLRenderer  → Bộ dựng hình, bật antialias + ACESFilmicToneMapping
```

#### Hệ thống ánh sáng điện ảnh (Cinematic Lighting):

| Loại đèn | Vai trò |
|:---|:---|
| `AmbientLight` | Nguồn sáng môi trường nền, giữ chiều sâu góc khuất |
| `HemisphereLight` | Giả lập ánh sáng khuếch tán từ bầu trời xanh hắt xuống mặt cỏ |
| `DirectionalLight` | Đèn định hướng tạo luồng sáng chính, chiếu bóng đổ `shadowMap` 4096px |
| `PointLight` | Đèn điểm phát quang lập lòe đỏ cam ở miệng núi lửa khi CO2 cao |

#### Tải mô hình 3D:
- Dùng `THREE.GLTFLoader` tải file `.glb` ([caytrangchu.glb](file:///c:/Users/ACER/Downloads/CNW/bwd/caytrangchu.glb) hoặc [juan.glb](file:///c:/Users/ACER/Downloads/CNW/bwd/juan.glb))
- Tự động đo chiều kích mô hình → co giãn (`scale`) và căn chỉnh vào giữa màn hình

#### Hệ thống hạt động (Dynamic Particle Systems):
Sử dụng `THREE.BufferGeometry` + `THREE.PointsMaterial` để vẽ hàng ngàn hạt hiệu năng cao:

| Loại hạt | Mô tả |
|:---|:---|
| 🌧️ Hạt mưa rơi | Quỹ đạo rơi chéo mô phỏng gió bão thổi dạt sang trái |
| 💨 Hạt bụi mịn PM2.5 | Bay hỗn loạn quanh quả cầu khi CO2 tăng cao |
| 🔥 Tàn tro đen | Phản ánh ô nhiễm khí quyển nặng nề |
| ⚡ Sấm sét động | Vẽ đoạn thẳng zíc-zắc bằng `THREE.Line`, đèn trời chớp nhoáng |

#### Thảm thực vật sinh trưởng thuật toán:
- `grassGroup`: Hàng ngàn lá cỏ dại được nhân bản, đầu đỉnh uốn cong theo **công thức Parabol**
- `flowerGroup`: Hàng ngàn hoa dại nhân bản
- **Cơ chế phản ứng sinh thái** (phần quan trọng nhất):
  - CO2 thấp (an toàn) → `scale.y` của cỏ/hoa tăng dần đến cực đại → thiên nhiên phục hồi
  - CO2 cao (nguy hiểm) → cỏ/hoa co lại ẩn đi + kích hoạt bụi tro + nham thạch nóng chảy

---

### 2.2. Thuật toán tính toán Carbon

Nằm trong [calculator.html](file:///c:/Users/ACER/Downloads/CNW/bwd/calculator.html), hàm `calcCO2()` tại [dòng 1457-1464](file:///c:/Users/ACER/Downloads/CNW/bwd/calculator.html#L1457-L1464).

#### Công thức chính:

$$\text{Tổng CO2 (kg/ngày)} = (t \times 0.178) + (p \times 0.095) + (e \times 0.155) + (w \times 0.850) + (d \times 1.150)$$

#### Giải thích từng hệ số:

| Biến | Hoạt động | Hệ số | Đơn vị | Nguồn tham chiếu |
|:---:|:---|:---:|:---|:---|
| `t` | Di chuyển | 0.178 | kg CO2/km | EPA Mỹ — phát thải xe cá nhân trung bình |
| `p` | Đồ nhựa dùng 1 lần | 0.095 | kg CO2/món | Phát thải từ sản xuất + xử lý rác nhựa |
| `e` | Điện năng tiêu thụ | 0.155 | kg CO2/kWh | IEA — hệ số lưới điện hỗn hợp |
| `w` | Rác sinh hoạt | 0.850 | kg CO2/kg rác | IPCC — khí methane từ chôn lấp rác |
| `d` | Bữa ăn thịt | 1.150 | kg CO2/bữa | IPCC — dấu chân carbon ngành chăn nuôi |

#### Quy đổi cây cần trồng (Carbon Offset):
- 1 cây hấp thụ trung bình ~21 kg CO2/năm ≈ 0.057 kg CO2/ngày
- Công thức: **Ceil( (CO2 × 365) / 21 )** cây

#### Luồng hoạt động khi kéo Slider:
```
Người dùng kéo Slider
  → oninput kích hoạt onSliderChange()
    → calcCO2() tính lượng CO2
      → Cập nhật text co2Display (hiệu ứng mượt)
      → updateEcosystem() tính % ổn định sinh thái
        → Xoay kim Gauge + đổi màu Xanh/Vàng/Đỏ
      → Cập nhật targetIntensity cho Three.js
        → Three.js tăng/giảm Bụi, Mưa, Nham thạch
        → Three.js ẩn/hiện Cỏ & Hoa
```

#### Cơ chế tịnh tiến mượt (Smooth Interpolation):
- Biến `targetIntensity`: giá trị mục tiêu (0.0 → 1.0)
- Biến `orbIntensity`: giá trị thực tế đang hiển thị
- Trong vòng lặp `animate()` (~60 FPS), `orbIntensity` liên tục tịnh tiến mượt về phía `targetIntensity`
- Khi ô nhiễm tăng:
  1. `scene.fog.density` tăng → bầu không khí ngột ngạt
  2. Hạt bụi tro tăng `opacity` → hiện rõ lớp bụi bẩn
  3. Nham thạch & lửa phun trào tăng độ sáng + đèn đỏ cam
  4. `grassGroup` & `flowerGroup` co `scale.y` về 0 → thực vật khô héo

---

### 2.3. API thời gian thực & CORS Proxy

#### 4 nguồn API sử dụng trong dự án:

| # | Dữ liệu | Nguồn API |
|:--|:---|:---|
| 1 | Nhiệt độ toàn cầu | `https://global-warming.org/api/temperature-api` |
| 2 | Nồng độ CO2 khí quyển | `https://global-warming.org/api/co2-api` |
| 3 | Chất lượng không khí AQI Hà Nội | `https://air-quality-api.open-meteo.com` (vĩ độ 21.02, kinh độ 105.83) |
| 4 | Nhiệt độ các quốc gia | `https://restcountries.com/v3.1/all` + API thời tiết tại tọa độ thủ đô |

#### Vấn đề CORS và cách giải quyết:

**Tại sao `fetch()` trực tiếp bị lỗi?**
- CORS (Cross-Origin Resource Sharing) là cơ chế bảo mật của trình duyệt
- Ngăn chặn JS từ nguồn A gọi tài nguyên từ nguồn B nếu server B không trả header `Access-Control-Allow-Origin`
- Chỉ áp dụng cho **Client-Side JavaScript** (mã chạy trên browser)

**Giải pháp: CORS Proxy trong [serve.ps1](file:///c:/Users/ACER/Downloads/CNW/bwd/serve.ps1)**

```
Client (trình duyệt)
  → fetch('/api/proxy?url=https://api-thuc-te.com/data')
    → Server PowerShell nhận yêu cầu
      → Invoke-WebRequest gọi API thật (Server-Side, không bị CORS)
      → Lưu kết quả vào $global:apiCache (TTL = 300 giây)
      → Trả kết quả về cho Client
```

**Cơ chế caching:**
- Biến `$global:apiCache` lưu trữ kết quả API theo URL
- Thời gian sống (TTL) = 300 giây (5 phút)
- Nếu cache còn hạn → trả về ngay, không gọi API lại
- Tránh bị nhà cung cấp API chặn IP do gọi quá nhiều (Rate Limit)

**Dữ liệu dự phòng FALLBACK_DATA:**
- Khi mất mạng hoặc API lỗi → hệ thống tự động dùng dữ liệu mẫu lưu sẵn
- Đảm bảo trang web vẫn hoạt động bình thường khi offline

---

### 2.4. Biểu đồ Chart.js (trong app.js)

File [app.js](file:///c:/Users/ACER/Downloads/CNW/bwd/app.js) xử lý:

- **Biểu đồ lịch sử phát thải Carbon**: Hiển thị xu hướng CO2 theo thời gian
- **Biểu đồ cột nhiệt độ các châu lục**: So sánh nhiệt độ thực tế giữa các khu vực

Luồng dữ liệu Dashboard:
```
dashboard.html load
  → renderDashboard() + initRealtimeDashboard()
    → Gọi /api/proxy cho từng API
      → Thành công → Dữ liệu thật
      → Thất bại → FALLBACK_DATA
    → Cập nhật text trên các thẻ thông tin
    → Khởi tạo Chart.js vẽ biểu đồ Carbon
    → Vẽ biểu đồ cột nhiệt độ các châu lục
```

---

## ❓ 3. CÂU HỎI PHẢN BIỆN CẦN CHUẨN BỊ

### Câu 1: Giải thích cơ chế bypass lỗi CORS? Tại sao gọi API trực tiếp bị lỗi nhưng qua proxy lại được?

> **💡 Gợi ý trả lời:**
> "CORS là cơ chế bảo mật của trình duyệt ngăn chặn mã JavaScript từ nguồn A gửi yêu cầu lấy tài nguyên từ nguồn B nếu máy chủ nguồn B không cho phép (không trả header `Access-Control-Allow-Origin`).
> Em đã xây dựng một **CORS Proxy** trong file `serve.ps1`. Nguyên lý: trình duyệt chỉ chặn CORS đối với Client-Side JavaScript, còn Server-Side thì hoàn toàn không bị hạn chế. Client gửi yêu cầu lên endpoint `/api/proxy` của server nội bộ, server PowerShell đóng vai trò trung gian gọi API thật bằng `Invoke-WebRequest` rồi chuyển tiếp kết quả về Client. Trình duyệt không phát hiện hành vi gọi chéo nguồn nên loại bỏ hoàn toàn lỗi CORS."

---

### Câu 2: Công thức tính CO2? Hệ số lấy từ đâu, có đáng tin cậy không?

> **💡 Gợi ý trả lời:**
> "Công thức được thiết lập tại hàm `calcCO2()`. Lượng phát thải hàng ngày tổng hợp từ 5 hoạt động: Di chuyển, Nhựa dùng 1 lần, Điện, Rác thải, Bữa ăn thịt.
> Các hệ số tham khảo từ nghiên cứu quốc tế: Hệ số điện `0.155` từ IEA (Tổ chức Năng lượng Quốc tế); hệ số di chuyển `0.178` từ EPA Mỹ; hệ số rác thải `0.850` và chăn nuôi `1.150` từ báo cáo IPCC. Do đó mang tính khoa học cao và phản ánh tương đối chính xác hành vi thực tế."

---

### Câu 3: Three.js cập nhật diện mạo Trái Đất khi kéo slider như thế nào?

> **💡 Gợi ý trả lời:**
> "Khi kéo slider, sự kiện `oninput` kích hoạt hàm `onSliderChange()`. Hàm này tính tỷ lệ ô nhiễm từ `0.0` đến `1.0` lưu vào biến `targetIntensity`.
> Trong vòng lặp `animate()` chạy ~60 FPS, giá trị thực tế `orbIntensity` liên tục tịnh tiến mượt mà về `targetIntensity`. Khi ô nhiễm tăng:
> 1. `scene.fog.density` tăng → bầu khí quyển ngột ngạt
> 2. Hạt bụi tro tăng `opacity` → lớp bụi bẩn hiện rõ
> 3. Nham thạch + lửa phun trào tăng sáng + đèn đỏ cam rực
> 4. `grassGroup` và `flowerGroup` co `scale.y` về 0 → thực vật khô héo, hủy diệt"

---

## 🎯 4. PHẦN DEMO CỦA BẠN TRƯỚC HỘI ĐỒNG

```
Bước 1: Mở trang chủ → chỉ vào quả cầu 3D tự quay và biểu đồ CO2 dao động
Bước 2: Chuyển sang Calculator → kéo tất cả slider từ MIN lên MAX
        → Hướng Hội đồng nhìn quả cầu 3D: xanh tươi → bão táp khói bụi nham thạch
        → Đây là điểm WOW lớn nhất!
Bước 3: Bấm "Xuất báo cáo Carbon" → hiển thị gợi ý hành động xanh
Bước 4: Chuyển sang Dashboard → chỉ biểu đồ Chart.js dữ liệu CO2 thật từ API
Bước 5: Giải thích cách server serve.ps1 chạy CORS Proxy
```

---

## 📌 5. PHẦN CHUNG — BẠN VẪN CẦN NẮM (dù không phải phần chính)

> ⚠️ Hội đồng có thể hỏi chéo! Hãy đọc lướt để hiểu tổng quan.

- [ ] Tổng quan đề tài EcoImpact Hero — 4 tính năng chính
- [ ] Cấu trúc thư mục và vai trò từng file
- [ ] 2 sơ đồ Flowchart (luồng Calculator + Dashboard)
- [ ] Kịch bản demo tổng thể (Mục 5 trong tài liệu gốc)
- [ ] Đọc lướt 5 câu FAQ — đặc biệt câu 4 (LocalStorage) và câu 5 (UI/UX)

---
*Chúc bạn ôn tập tốt và tự tin bảo vệ đồ án! 🎓*
