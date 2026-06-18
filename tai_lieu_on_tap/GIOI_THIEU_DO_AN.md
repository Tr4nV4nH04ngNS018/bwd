# 🌿 BÀI THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN: HỆ THỐNG ECOIMPACT
> **Đề tài:** Nền tảng Web 3D Tương tác Đo lường Dấu chân Carbon & Trực quan hóa Dữ liệu Khí hậu Toàn cầu.
> **Phong cách trình bày:** Chuyên nghiệp, làm nổi bật cả tính nhân văn (môi trường) và thế mạnh công nghệ (WebGL 3D, API, Backend Proxy).

---

## 👨‍🏫 PHẦN 1: MỞ ĐẦU & LÝ DO CHỌN ĐỀ TÀI (Thời gian gợi ý: 2 phút)

**Lời thoại gợi ý:**
> *"Kính thưa thầy cô trong Hội đồng phản biện. Em tên là [Tên của Bạn]. Hôm nay, em xin phép được trình bày đồ án tốt nghiệp/môn học của mình với đề tài: **EcoImpact — Nền tảng Web tương tác giáo dục môi trường**.
>
> Hiện nay, biến đổi khí hậu không còn là lời cảnh báo xa vời mà đã trực tiếp ảnh hưởng đến cuộc sống hàng ngày. Tuy nhiên, các tài liệu giáo dục môi trường truyền thống thường khô khan và thiếu tính tương tác. Từ thực tế đó, em đã xây dựng **EcoImpact** với thông điệp **'Thói quen nhỏ, Tác động lớn'**, ứng dụng các công nghệ đồ họa 3D WebGL và dữ liệu thời gian thực nhằm mang lại một trải nghiệm trực quan hóa sinh thái sống động và thuyết phục nhất."*

### 🎯 3 Mục tiêu cốt lõi của EcoImpact:
1. **Thay đổi nhận thức cá nhân:** Cung cấp công cụ đo lường dấu chân carbon trực quan, giúp người dùng nhận ra tác động từ thói quen sống hàng ngày.
2. **Cập nhật dữ liệu thời gian thực:** Kết nối với các trạm quan trắc toàn cầu để hiển thị các chỉ số sinh thái (nồng độ CO₂, nhiệt độ trái đất, bụi mịn PM2.5) một cách sinh động nhất.
3. **Thúc đẩy hành động xã hội:** Áp dụng cơ chế **Gamification** (bảng xếp hạng cộng đồng, huy hiệu danh hiệu sống xanh) để khích lệ người dùng duy trì thói quen thân thiện với môi trường.

---

## 💻 PHẦN 2: KỊCH BẢN THUYẾT TRÌNH DEMO TRỰC QUAN & CÔNG NGHỆ ÁP DỤNG (Thời gian gợi ý: 5 phút)

*Khi thuyết trình phần này, bạn hãy thao tác trực tiếp trên trình duyệt theo từng bước dưới đây để dẫn dắt giảng viên:*

### Hồi 1: Trang chủ (index.html) – Kịch bản "Hồi sinh Cây Sự Sống"
* **Thao tác:** Cuộn trang từ từ từ trên xuống dưới.
* **Mô tả cho Thầy Cô:** 
  > *"Tại Trang chủ, em xây dựng một mô hình 3D **Cây Sự Sống (Life Tree)** ở trung tâm nền. Khi người dùng ở đầu trang, bầu không khí bao quanh âm u đầy khói bụi, mưa axit rơi dày đặc (sử dụng hệ thống hạt 3D). Nhưng khi người dùng cuộn trang xuống, camera sẽ Lerp mượt mà (smooth camera Lerp), bầu trời dần quang đãng, mưa axit tắt đi, thảm cỏ xanh mướt uốn lượn theo chiều gió dưới chân cây mọc lan tỏa ra. Đây là ẩn dụ nghệ thuật về việc hành động của con người giúp phục hồi tự nhiên."*
* **Điểm nhấn thiết kế:** Bento Grid bố trí bất đối xứng kết hợp **Glassmorphism (Kính mờ)** và các góc bo cơ khí **Futuristic HUD** tạo giao diện như một trạm điều khiển khoa học công nghệ cao.
* **🛠️ Công nghệ sử dụng trong Hồi 1:**
  * **Three.js (WebGL Engine) & GLTFLoader:** Tải và quản lý mô hình `caytrangchu.glb` (Cây Sự Sống) và mô hình Trái Đất.
  * **Three.js Post-processing (UnrealBloomPass):** Xử lý hiệu ứng Bloom phát quang cho cây xanh và các tia sáng God Rays.
  * **Toán học uốn ngọn cỏ Parabol:** Lập trình chuyển động cỏ đu đưa tự nhiên theo chiều gió và mọc lan tỏa theo bán kính.
  * **Camera Lerp (Tuyến tính hóa):** Tính toán khoảng cách cuộn trang (scroll progress) đồng bộ với ma trận camera của Three.js để di chuyển ống kính mượt mà theo kịch bản cuộn chuột.
  * **HTML5 Canvas 2D API:** Dùng để tự vẽ đồ thị thu nhỏ (Sparklines) động màu xanh lá tại các Bento card thống kê ngoài trang chủ.

### Hồi 2: Công cụ tính (calculator.html) – Kịch bản "Thảm họa Trái Đất"
* **Thao tác:** Thay đổi các thanh trượt (Đi lại, Nhựa, Điện năng) và xem Trái Đất 3D phản ứng.
* **Mô tả cho Thầy Cô:**
  > *"Đây là trang Công cụ đo Carbon. Phía bên phải là quả địa cầu 3D tương tác. Nếu người dùng chọn lối sống lãng phí (kéo thanh trượt lên cao), Trái Đất sẽ lập tức chuyển sang trạng thái ô nhiễm: dung nham phun trào từ lòng đất, các vòi rồng lốc xoáy quét qua bề mặt, và sấm sét đánh ngẫu nhiên tạo ánh sáng chớp giật gián đoạn.
  > Ngược lại, nếu người dùng kéo giảm lượng tiêu thụ, Trái Đất sẽ khôi phục lại màu xanh lục bảo trong lành. Kết quả carbon được quy đổi ra số lượng cây xanh cần trồng tương ứng để bù đắp, mang lại cái nhìn trực quan nhất."*
* **🛠️ Công nghệ sử dụng trong Hồi 2:**
  * **Three.js & GLTFLoader:** Render quả địa cầu xoay động (`earth.glb`).
  * **Particle Systems (Hệ thống hạt):** Xây dựng vòi rồng lốc xoáy (bằng logic toán học hàm lượng giác xoắn ốc phễu) và hệ dung nham phun trào (các hạt di chuyển chịu tác động của lực hút trọng lực giả lập).
  * **Custom Lightning Generator (Tạo tia sét):** Lập trình đường gấp khúc ngẫu nhiên kết hợp thay đổi cường độ `PointLight` để tạo hiệu ứng sét đánh chớp sáng sinh động.
  * **HTML5 Range Inputs & JS Event Listeners:** Lắng nghe sự thay đổi thanh trượt trong DOM, chuyển đổi dữ liệu và đồng bộ với tốc độ hạt, màu sắc của bầu khí quyển Trái Đất.

### Hồi 3: Bảng điều khiển (dashboard.html) – Kịch bản "Live Data & Heatmap"
* **Thao tác:** Chỉ vào các biểu đồ nhiệt độ các châu lục và bản đồ nhiệt phẳng ở trung tâm.
* **Mô tả cho Thầy Cô:**
  > *"Trang Dashboard hoạt động như một trung tâm kiểm soát dữ liệu khí hậu toàn cầu. Em đã tích hợp trực tiếp các API của các tổ chức uy tín (như Global Warming, Open-Meteo) để lấy nồng độ CO₂ (ppm) và chất lượng không khí AQI thời gian thực.
  > Đặc biệt, em tự viết thuật toán vẽ bản đồ nhiệt (Heatmap) trên Canvas 2D. Thuật toán này tự động đọc dữ liệu tọa độ nhiệt độ từ API, tính toán nội suy Mercator và phủ các điểm nhiệt tỏa màu (Cam-Nóng, Xanh-Lạnh) trực tiếp lên bản đồ phẳng thế giới, giúp theo dõi sự nóng lên toàn cầu một cách trực quan mà không phụ thuộc vào thư viện bản đồ nặng nề."*
* **🛠️ Công nghệ sử dụng trong Hồi 3:**
  * **Fetch API (Async/Await):** Gọi API bất đồng bộ từ client để cập nhật dữ liệu liên tục không gây đứng trang.
  * **Chart.js:** Vẽ các biểu đồ cột và biểu đồ đường chất lượng cao, có responsive.
  * **Mercator Projection (Phép chiếu Mercator) & Canvas 2D:** Chuyển đổi cặp tọa độ Địa lý (Kinh độ/Vĩ độ) thành pixel vẽ trên ảnh nền SVG bản đồ phẳng để tạo Heatmap.
  * **PowerShell CORS Proxy Cache:** Sử dụng proxy local (`serve.ps1`) để tải dữ liệu khi API gốc chặn chính sách chia sẻ tài nguyên nguồn gốc chéo (CORS).

### Hồi 4: Xác thực & Quản lý Giao diện (auth.js, app.js, community.html)
* **Thao tác:** Di chuột lên góc phải hiển thị menu dropdown tài khoản "Admin Test". Click đăng xuất.
* **Mô tả cho Thầy Cô:**
  > *"Để tối ưu hóa trải nghiệm người dùng, em đã xây dựng hệ thống **Mock Authentication** (Đăng ký, Đăng nhập, Quên MK gửi mã OTP giả lập).
  > Đặc biệt, hệ thống giao diện HUD Glassmorphism được thiết kế tỉ mỉ. Như menu cá nhân dropdown ở góc phải màn hình, em lập trình động bằng JavaScript, tính toán vị trí nút qua `getBoundingClientRect()` để căn chỉnh tuyệt đối ở mọi thiết bị, đồng thời tạo bộ lọc làm mờ hậu cảnh, viền phát quang xanh lá và hiệu ứng chuyển dịch micro-interactions mượt mà khi di chuột qua."*
* **🛠️ Công nghệ sử dụng trong Hồi 4:**
  * **Web Storage API (localStorage):** Lưu trữ database tài khoản dạng mảng JSON (`mock_users_v1`) và phiên đăng nhập (`current_user`).
  * **Dynamic DOM & JS Event Listeners:** Tự động tạo và chèn HTML cho dropdown menu, xử lý đóng mở thông minh bằng cách lắng nghe sự kiện click ngoài (click-outside) kết hợp `setTimeout` để tránh lỗi đè sự kiện nổi bọt.
  * **CSS Keyframes Animation:** Thiết kế hiệu ứng chuyển động trượt mờ dần (Fade-in & Slide-down) khi menu mở ra.
  * **Regex (Biểu thức chính quy) & Validation:** Ràng buộc định dạng Email và độ dài mật khẩu khi Đăng ký/Đăng nhập.


---

## 🛠️ PHẦN 3: BẢNG TỔNG HỢP CÔNG NGHỆ SỬ DỤNG (TECH STACK)
*(Dành để giới thiệu trực quan với hội đồng giảng viên trước khi đi sâu vào giải thích mã nguồn)*

| Lớp công nghệ (Layer) | Tên công nghệ / Thư viện | Vai trò & Ứng dụng cụ thể trong Đồ án |
| :--- | :--- | :--- |
| **Frontend Core** | HTML5, Vanilla CSS3, JavaScript (ES6+) | Xây dựng cấu trúc trang, logic điều phối và đồng bộ hóa trạng thái giao diện người dùng. |
| **Giao diện & Bố cục** | **Tailwind CSS (CDN)** | Hỗ trợ chia lưới Bento Grid hiện đại, xử lý giao diện đáp ứng (Responsive) trên Mobile và Desktop cực nhanh. |
| **Đồ họa WebGL 3D** | **Three.js (r128)** | Thư viện đồ họa cốt lõi để tạo cảnh 3D động, di chuyển máy ảnh và quản lý ánh sáng. |
| **Nạp mô hình 3D** | **GLTFLoader.js** | Tải các tệp mô hình nén dạng `.glb` (Life Tree, Trái đất thiên tai, nhân vật Juan) tối ưu dung lượng. |
| **Hiệu ứng hậu kỳ** | **Three.js Post-processing** | Tạo hiệu ứng phát sáng Neon (UnrealBloomPass), bụi bặm sương mù và luồng sáng God Rays đi xuyên tán lá. |
| **Trực quan dữ liệu** | **Chart.js (v4.4.2)** | Vẽ đồ thị đường động biểu diễn xu hướng phát thải CO2 và đồ thị cột so sánh nhiệt độ giữa các châu lục. |
| **Đồ họa 2D Hiệu năng** | **HTML5 Canvas API** | Vẽ đồ thị thu nhỏ (Sparklines) ngoài trang chủ và lập trình bản đồ phẳng nội suy nhiệt độ (Heatmap) thế giới. |
| **Dữ liệu Thời gian thực** | **APIs (Global Warming, Open-Meteo, REST Countries)** | Cung cấp dữ liệu trực tiếp về nồng độ khí nhà kính CO2 (ppm), chỉ số AQI/PM2.5, tọa độ quốc gia toàn cầu. |
| **Lưu trữ dữ liệu** | **Web Storage API (localStorage)** | Lưu trữ thông tin đăng nhập, dữ liệu tài khoản (Mock Auth) và kết quả đo carbon của người dùng. |
| **Backend / Local Server** | **PowerShell HTTP Server (`serve.ps1`)** | Máy chủ cục bộ tích hợp CORS Proxy trung gian và bộ nhớ đệm ẩn (In-memory Cache) tối ưu hóa API. |

---

## 🧬 PHẦN 4: ĐIỂM NHẤN THUẬT TOÁN & KỸ THUẬT
*(Phần này dùng để giải thích sâu về kỹ thuật, giúp ghi điểm phản biện xuất sắc)*

### 1. Kỹ thuật Đồ họa WebGL 3D (Client-side)
* **Three.js & GLTFLoader:** Load trực tiếp các mô hình nén dạng `.glb` (Life Tree, Trái đất thiên tai) giúp tối ưu hóa dung lượng tải trang (dưới 3MB).
* **Hiệu ứng Hậu kỳ Unreal Bloom Pass:** Sử dụng bộ lọc tỏa sáng (Bloom Filter) giúp các tia sét 3D, dòng dung nham và các điểm khí quyển phát quang neon tự nhiên, tạo chiều sâu thị giác chuẩn Sci-Fi.
* **Hệ thống hạt (Particle System) & Toán học:**
  * **Mưa axit/Bụi mịn:** Tạo bằng `THREE.Points`, cập nhật tọa độ `y` theo trọng lực rơi tự do.
  * **Lốc xoáy cực:** Sử dụng hàm lượng giác $x = R \cdot \cos(\theta)$, $z = R \cdot \sin(\theta)$ với bán kính $R$ thu hẹp dần theo chiều cao $y$ để tạo hình phễu hút.
  * **Sét đánh:** Sinh ngẫu nhiên các đường gấp khúc răng cưa (tạo đoạn thẳng nối tiếp có độ lệch trục ngẫu nhiên) đi kèm hiệu ứng đổi màu đột ngột của nguồn sáng `PointLight` để giả lập chớp giật.

### 2. Xử lý Dữ liệu & APIs
* **Đọc file CSV động:** Tải và bóc tách trực tiếp tệp CSV sản lượng điện sạch của Our World in Data ngay trên trình duyệt bằng JavaScript Client-side để vẽ biểu đồ so sánh chuyển dịch năng lượng.
* **Thuật toán Nội suy Bản đồ phẳng (Mercator Projection):** 
  * Chuyển đổi Vĩ độ ($\phi$) và Kinh độ ($\lambda$) từ API thành tọa độ pixel $(X, Y)$ trên canvas:
    $$X = \frac{\lambda + 180}{360} \cdot W$$
    $$Y = \left( 1 - \frac{\ln\left(\tan\left(\frac{\pi}{4} + \frac{\phi}{2}\right)\right)}{\pi} \right) \cdot \frac{H}{2}$$
  * Sử dụng hiệu ứng mờ viền (Radial Gradient) vẽ lên Canvas để mô phỏng các vùng khí hậu nóng lạnh toàn cầu.

### 3. Giải pháp Backend & Local Server (PowerShell Engine)
* **serve.ps1:** Thay vì dùng NodeJS hay các server cồng kềnh, em tự viết một máy chủ HTTP tĩnh bằng PowerShell (sử dụng `System.Net.HttpListener`).
* **CORS Bypass & Cache:** Server đóng vai trò như một **CORS Proxy** trung gian. Khi Client gọi API ngoài bị chặn chính sách bảo mật CORS, Request sẽ gửi qua Server PowerShell của em. Server thực hiện tải dữ liệu, lưu tạm thời vào bộ nhớ RAM (In-memory Caching) trong 5 phút để tránh spam giới hạn API của nhà cung cấp, rồi trả lại kết quả sạch cho Client.

---

## 🎯 PHẦN 5: KẾT LUẬN & HƯỚNG PHÁT TRIỂN (Thời gian gợi ý: 1 phút)

**Lời thoại gợi ý:**
> *"Qua quá trình thực hiện đồ án EcoImpact, em đã tự nghiên cứu và giải quyết được các bài toán khó về đồ họa WebGL hiệu năng cao trên Client, thuật toán xử lý bản đồ nhiệt, và xây dựng máy chủ trung gian CORS Proxy tối giản.
>
> **Hướng phát triển tương lai:** Em mong muốn tích hợp thêm AI để phân tích ảnh chụp hóa đơn sinh hoạt của người dùng để tự động tính toán lượng phát thải, đồng thời phát triển phiên bản Multiplayer để các cộng đồng có thể cùng tham gia trồng cây ảo và quy đổi thành cây xanh thật ngoài đời thực.
>
> Em xin chân thành cảm ơn thầy cô đã lắng nghe. Em rất mong nhận được những ý kiến đóng góp và câu hỏi phản biện từ Hội đồng để hoàn thiện đồ án này tốt hơn."*

---

## 📝 BỘ CÂU HỎI PHẢN BIỆN NHANH (Bỏ túi phòng thân)

1. **❓ Tại sao không dùng Database như MySQL/MongoDB mà dùng localStorage?**
   * **💡 Trả lời:** Đồ án tập trung mạnh vào giải pháp giao diện tương tác Client-side và trực quan hóa WebGL. Việc dùng `localStorage` giúp hệ thống hoạt động hoàn hảo, bảo mật dữ liệu cá nhân cục bộ ngay trên máy người dùng, giảm tải tài nguyên server và có thể chạy offline/local cực kỳ linh hoạt mà không cần cài đặt database phức tạp.
2. **❓ Việc render nhiều mô hình 3D cùng lúc có gây giật lag (sụt giảm FPS) không?**
   * **💡 Trả lời:** Em đã tối ưu hóa hiệu năng bằng các cách: (1) Nén các mô hình 3D sang định dạng `.glb` với số lượng đa giác thấp (Low-poly), (2) Hủy giải phóng bộ nhớ hình học (`geometry.dispose()`, `material.dispose()`) khi người dùng chuyển trang để tránh rò rỉ bộ nhớ (Memory Leak), (3) Sử dụng RequestAnimationFrame để đồng bộ vòng lặp render với tần số quét của màn hình.
3. **❓ Tại sao phải tự viết CORS Proxy trên PowerShell thay vì dùng các proxy có sẵn trên mạng?**
   * **💡 Trả lời:** Các CORS proxy miễn phí trên mạng thường có tốc độ tải rất chậm, không an toàn bảo mật và thường xuyên bị sập. Việc tự viết CORS Proxy trên `serve.ps1` giúp làm chủ hoàn toàn luồng dữ liệu, tích hợp thêm bộ đệm ẩn RAM Cache giúp giảm thời gian phản hồi từ 1.5 giây xuống dưới 50ms cho các lượt truy cập sau.
