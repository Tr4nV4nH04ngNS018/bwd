# 🌟 CẨM NANG BẢO VỆ ĐỒ ÁN SIÊU CHI TIẾT - PHẦN 2 🌟
## TRỰC QUAN HÓA DỮ LIỆU, APIS & TIỆN ÍCH TRANG CHỦ

> [!IMPORTANT]
> Tài liệu này được thiết kế dành riêng cho bạn để học nhanh trong 1 buổi tối và tự tin trả lời mọi câu hỏi chất vấn của Hội đồng bảo vệ đồ án ngày mai. Nội dung bám sát từng dòng mã nguồn trong các file của bạn.

---

## 🎯 PHẦN I: TỔNG QUAN HỆ THỐNG VÀ CÁC THÀNH PHẦN

Bạn đang phụ trách các tính năng tương tác dữ liệu và đồ họa trên giao diện. Các file của bạn nằm tại:
1.  **[index.html](file:///c:/Users/ACER/Downloads/CNW/bwd/index.html) & [js/index.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/index.js)**: Trang chủ quảng bá dự án.
2.  **[dashboard.html](file:///c:/Users/ACER/Downloads/CNW/bwd/dashboard.html) & [js/dashboard.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/dashboard.js)**: Trang bảng số liệu Dashboard.
3.  **Dữ liệu CSV**: [owid_electricity_generation.csv](file:///c:/Users/ACER/Downloads/CNW/bwd/owid_electricity_generation.csv) và [owid_share_renewables.csv](file:///c:/Users/ACER/Downloads/CNW/bwd/owid_share_renewables.csv).

---

## 🛠️ PHẦN II: GIẢI THÍCH CHI TIẾT TỪNG DÒNG CODE CỦA BẠN

### 1. Phân tích File [js/index.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/index.js)

#### 🔸 IIFE (Immediately Invoked Function Expression) & 'use strict'
```javascript
(function () {
  'use strict';
  // ... code ...
})();
```
*   **IIFE là gì?** Là hàm khởi chạy ngay lập tức sau khi định nghĩa.
*   **Tại sao dùng?** Để tạo phạm vi biến cục bộ (Local Scope), tránh xung đột tên biến toàn cục (Global Namespace) với các file JS khác trong dự án (như `bg3d.js`, `calculator.js`).
*   **`use strict` là gì?** Bật chế độ nghiêm ngặt của JavaScript. Nó ngăn chặn việc sử dụng các biến chưa khai báo (tránh lỗi ngầm), tối ưu tốc độ chạy của trình duyệt và báo lỗi ngay khi có code thiếu an toàn.

#### 🔸 Xử lý Sự kiện Form Đăng ký (Newsletter)
```javascript
window.handleSubscribe = function (e) {
  e.preventDefault();
  const email = document.getElementById('subEmail').value.trim();
  if (!email) return;
  document.getElementById('subSuccessMsg').classList.remove('hidden');
  document.getElementById('subscribeForm').reset();
  setTimeout(() => {
    document.getElementById('subSuccessMsg').classList.add('hidden');
  }, 5000);
};
```
*   `e.preventDefault()`: Ngăn không cho trình duyệt thực hiện hành vi mặc định (tải lại trang) khi nhấn Submit Form.
*   `value.trim()`: Lấy nội dung ô nhập liệu và cắt bỏ khoảng trắng thừa ở hai đầu.
*   `classList.remove('hidden')`: Xóa class ẩn để hiển thị thông báo thành công màu xanh lá cây cực đẹp.
*   `setTimeout(..., 5000)`: Sử dụng bộ đếm thời gian bất đồng bộ để ẩn thông báo thành công sau 5 giây (5000ms).

#### 🔸 API CO2 Thời Gian Thực & Lưu Trữ `localStorage`
```javascript
let previousCo2 = parseFloat(localStorage.getItem('lastCo2') || '421.7');
// ...
async function updateCo2Status() {
  try {
    const co2Res = await fetch('https://global-warming.org/api/co2-api');
    // ... xử lý lưu trữ và hiển thị ...
    localStorage.setItem('lastCo2', currentCo2.toString());
  } catch (error) {
    // Fallback: giả lập số ngẫu nhiên nếu mất mạng
    const simulatedCo2 = previousCo2 + (Math.random() - 0.48) * 0.01;
  }
}
```
*   **`localStorage`**: Dùng để lưu trữ giá trị $CO_2$ lần tải trang trước đó ngay trên trình duyệt của người dùng. Khi mất mạng, trang web vẫn hiển thị được con số gần nhất mà không bị trống.
*   **Cơ chế cập nhật**: Tải dữ liệu từ API bất đồng bộ bằng `fetch()`. Nếu API hoạt động, trích xuất phần tử cuối cùng trong mảng dữ liệu trả về (giá trị mới nhất), tính toán độ chênh lệch tăng/giảm so với giá trị cũ, rồi định dạng chữ màu đỏ (nếu tăng) hoặc xanh (nếu giảm).

#### 🔸 IntersectionObserver - Cuộn trang kích hoạt hiệu ứng
```javascript
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    entry.target.querySelectorAll('.counter').forEach(startCounter);
    entry.target.querySelectorAll('.sparkline').forEach(drawSparkline);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
```
*   **Tại sao dùng?** Thay vì lắng nghe sự kiện `window.addEventListener('scroll')` (gây quá tải CPU vì sự kiện kích hoạt liên tục), `IntersectionObserver` tối ưu hiệu năng bằng cách lắng nghe qua cơ chế bất đồng bộ từ lõi trình duyệt.
*   **Cách hoạt động**:
    *   `threshold: 0.15`: Kích hoạt khi phần tử lộ diện ít nhất $15\%$ trên màn hình.
    *   `visible`: Thêm class CSS để chạy hiệu ứng mờ dần và trượt lên (Fade in & Slide up).
    *   `unobserve(entry.target)`: Hủy theo dõi phần tử ngay sau khi hiệu ứng đã chạy xong một lần để giải phóng tài nguyên hệ thống.

#### 🔸 Bộ Đếm Số Chạy Tự Động (`startCounter`)
```javascript
function startCounter(el) {
  // ...
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = target * easeOut(progress);
    el.textContent = value.toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```
*   **Thuật toán easing (`easeOut`)**: Hàm bậc 3 giúp con số chạy nhanh lúc đầu và chậm lại khi gần đạt mục tiêu, mang lại cảm giác mượt mà tự nhiên.
*   **`requestAnimationFrame`**: Yêu cầu trình duyệt lên lịch vẽ lại màn hình ở chu kỳ quét tiếp theo (thường là 60fps hoặc 120fps). Kỹ thuật này tối ưu hơn `setInterval` rất nhiều vì không gây hiện tượng giật hình (stuttering) và tự động dừng khi tab bị ẩn.

#### 🔸 Biểu đồ Sparkline trên Canvas
```javascript
function drawSparkline(canvas) {
  // ...
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  // ...
}
```
*   **Chống nhòe**: Phóng to kích thước vật lý của Canvas bằng hệ số `dpr` rồi dùng `scale` để thu nhỏ tỷ lệ nét vẽ. Kết quả: Biểu đồ sắc nét tuyệt đối trên màn hình độ phân giải cao (Retina/Amoled).
*   **Vẽ đường và tô màu (Area Fill)**:
    *   Dùng `createLinearGradient` để tạo hiệu ứng đổ màu từ xanh lá mờ sang trong suốt bên dưới đường xu hướng.
    *   Dùng `arc` để vẽ điểm chấm tròn rực rỡ và vòng tròn hào quang mở rộng ở cuối đồ thị để nhấn mạnh giá trị hiện tại.

---

### 2. Phân tích File [js/dashboard.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/dashboard.js)

#### 🔸 Bộ giả lập Console Hệ Thống (`initConsoleLogs`)
*   Mô phỏng nhật ký hệ thống bằng mảng `initialLogs` kết hợp `setTimeout` để in từng dòng với độ trễ $250ms$, tạo cảm giác ứng dụng đang kết nối và đồng bộ dữ liệu trực tiếp.
*   Sử dụng `setInterval` mỗi $4.5$ giây chọn ngẫu nhiên các dòng log hoạt động từ mảng `periodicLogs`, tự động xóa dòng cũ nhất (`removeChild(firstChild)`) nếu vượt quá 8 dòng để giao diện không bị tràn.

#### 🔸 Tích hợp APIs nâng cao & Xử lý lỗi cục bộ
*   Gọi API chất lượng không khí của Open-Meteo cho Hà Nội.
*   Tích hợp bản đồ thế giới hiển thị thời tiết thực tế bằng cách gọi đồng thời thông tin từ 2 nguồn: danh sách tất cả các quốc gia từ RestCountries để lấy vĩ độ/kinh độ của thủ đô, sau đó dùng Open-Meteo API để tải nhiệt độ thực tế của các thành phố đó theo từng cụm (batch).

#### 🔸 Xử lý dữ liệu CSV lớn từ Our World in Data (OWID)
```javascript
const totalUrl = 'https://ourworldindata.org/grapher/electricity-generation.csv';
const shareUrl = 'https://ourworldindata.org/grapher/share-electricity-renewables.csv';
```
*   **Tại sao cần xử lý CSV?** Đồ án yêu cầu cung cấp một phép tính toán quy đổi thực tế: **"1% điện năng từ năng lượng tái tạo quy đổi ra bao nhiêu Terawatt-giờ (TWh)?"**
*   **Thuật toán xử lý**:
    1.  Tải 2 file CSV bất đồng bộ bằng `fetch()`.
    2.  Đọc chuỗi văn bản CSV và dùng regex hoặc `split(/\r?\n/)` để cắt thành từng dòng.
    3.  Lọc dòng chứa dữ liệu của toàn cầu (tìm chữ `World` hoặc mã quốc gia `OWID_WRL`) trong khoảng năm từ 2018 đến 2024.
    4.  Trích xuất giá trị cuối dòng:
        *   Tệp 1: Tổng sản lượng điện phát ra toàn cầu (đơn vị: TWh).
        *   Tệp 2: Tỷ lệ phần trăm điện tái tạo chiếm trong tổng sản lượng điện.
    5.  Tính toán lượng điện tái tạo thực tế phát ra mỗi năm:
        $$\text{Sản lượng tái tạo (TWh)} = \text{Tổng điện phát} \times \frac{\text{Tỷ lệ}}{100}$$
    6.  Tính trung bình cộng sản lượng điện tái tạo của các năm rồi chia cho 100 để tìm ra giá trị tương đương với $1\%$ (hiển thị động lên giao diện).

#### 🔸 Bản Đồ Nhiệt Tự Vẽ (World Canvas Heatmap)
```javascript
function projectCoords(lat, lon, W, H) {
  // Mảng các điểm mốc nội suy để sửa méo bản đồ phẳng
  const xPts = [ [-180, 0.0], [-125, 0.144], ... ];
  // ...
}
```
*   **Nội suy tuyến tính từng đoạn (Piecewise Linear Interpolation)**: Bản đồ thế giới dùng làm hình nền không phải là bản đồ phẳng tuyệt đối thông thường (có thể bị bóp méo do phép chiếu bản đồ Mercator hoặc Robinson). Do đó, việc chia nhỏ tọa độ thành các đoạn mốc và tính toán vị trí tỉ lệ tuyến tính từng phần giúp các điểm thành phố (New York, Hà Nội, Sydney) rơi vào đúng vị trí trực quan trên ảnh nền.
*   **Vẽ điểm nhiệt (Heat points)**:
    *   Tự động tính nhiệt độ để chọn bảng màu: Dưới $0^\circ C$ chọn màu Xanh dương, từ $10^\circ C - 20^\circ C$ màu Vàng, trên $30^\circ C$ chọn màu Cam/Đỏ.
    *   Tạo quầng nhiệt tỏa mờ bằng cách vẽ một hình tròn có màu chuyển sắc toả tròn `createRadialGradient` từ tâm điểm nóng ra trong suốt.
*   **Tương tác di chuột tìm thành phố gần nhất**:
    *   Lắng nghe sự kiện `mousemove` trên Canvas.
    *   Tính khoảng cách Euclid giữa con trỏ chuột $(x_{mouse}, y_{mouse})$ và từng thành phố trên bản đồ $(x_{city}, y_{city})$ bằng công thức hình học:
        $$d = \sqrt{(x_{mouse} - x_{city})^2 + (y_{mouse} - y_{city})^2}$$
        (Trong mã nguồn sử dụng: `Math.hypot(mouseX - x, mouseY - y)`).
    *   Nếu khoảng cách nhỏ hơn 16 pixel, hiển thị cửa sổ gợi ý thông tin (**Tooltip**) chứa tên thành phố, quốc gia và nhiệt độ thực tế ngay tại vị trí đó.

---

## ❓ PHẦN III: BỘ CÂU HỎI PHẢN BIỆN "NÓNG" CỦA HỘI ĐỒNG BẢO VỆ

Hãy đọc và nhớ kỹ các câu hỏi dưới đây, đây đều là những câu hỏi "tủ" của các thầy cô chấm đồ án:

### 💡 Nhóm câu hỏi về API & Xử lý bất đồng bộ

#### 💬 Câu 1: Em hãy giải thích từ khóa `async` và `await` hoạt động như thế nào trong code của em?
> * **Cách trả lời**:
>   * `async` đặt trước một khai báo hàm biến hàm đó thành một hàm bất đồng bộ, luôn trả về một `Promise`.
>   * `await` chỉ được sử dụng bên trong hàm `async`, có nhiệm vụ tạm dừng việc thực thi hàm cho đến khi `Promise` được giải quyết (thành công hoặc thất bại) và trả về kết quả.
>   * Việc này giúp code bất đồng bộ nhìn giống như code đồng bộ tuần tự, dễ đọc và dễ bảo trì hơn cơ chế gọi Callback truyền thống.

#### 💬 Câu 2: Tại sao em lại dùng `Promise.all` mà không phải gọi `await fetch()` tuần tự từng dòng?
> * **Cách trả lời**:
>   * Khi gọi tuần tự `await fetch1(); await fetch2();`, trình duyệt bắt buộc phải đợi yêu cầu HTTP thứ nhất hoàn thành, nhận kết quả rồi mới gửi yêu cầu HTTP thứ hai. Tổng thời gian là $T_1 + T_2$.
>   * Sử dụng `Promise.all([fetch1(), fetch2()])` cho phép trình duyệt gửi đi cả hai yêu cầu cùng một lúc dưới nền. Tổng thời gian phản hồi rút ngắn lại chỉ còn bằng thời gian của API chạy lâu nhất $\max(T_1, T_2)$, tối ưu đáng kể tốc độ tải trang Dashboard.

#### 💬 Câu 3: Làm thế nào để đảm bảo hệ thống không bị lỗi trắng màn hình nếu server API của NASA bị sập?
> * **Cách trả lời**:
>   * Em sử dụng khối lệnh `try...catch`. Bất kỳ lỗi mạng hoặc lỗi API nào phát sinh trong khối `try` sẽ được chuyển tiếp ngay lập tức sang khối `catch`.
>   * Tại đây, em thiết lập cơ chế **Fallback**: lấy dữ liệu tĩnh giả lập được định nghĩa sẵn trong hằng số `FALLBACK_DATA` để vẽ đồ thị và hiển thị số liệu. Giao diện người dùng vẫn hoạt động bình thường và hiển thị cảnh báo lỗi nhẹ ở console thay vì sập trang.

---

### 💡 Nhóm câu hỏi về Canvas & Trực quan hóa dữ liệu

#### 💬 Câu 4: Sự khác biệt giữa việc hiển thị biểu đồ bằng Canvas tự vẽ và thư viện Chart.js là gì? Tại sao em dùng cả hai?
> * **Cách trả lời**:
>   * **Canvas tự vẽ (như Sparklines và Bản đồ nhiệt)**: Nhẹ, không tốn dung lượng tải thư viện bên ngoài. Phù hợp cho các nét vẽ tùy biến cao, đồ họa đơn giản, hoặc hiệu ứng đặc thù cần tùy biến sâu về mặt thuật toán ánh xạ.
>   * **Chart.js**: Là một thư viện đồ họa mạnh mẽ được tối ưu sẵn. Em sử dụng cho các biểu đồ cột/đường lớn của Dashboard vì nó cung cấp sẵn hệ thống lưới tọa độ, chú thích, hiệu ứng chuyển động khi tải trang và chú thích động khi di chuột (Tooltip) cực kỳ chuyên nghiệp mà nếu tự viết bằng Canvas thuần sẽ mất hàng ngàn dòng code.

#### 💬 Câu 5: Em hãy giải thích thuật toán chuyển đổi tọa độ địa lý sang pixel trên Canvas?
> * **Cách trả lời**:
>   * Em chuyển đổi dựa trên tỷ lệ phần trăm phân bố. Bản đồ phẳng của em có Kinh độ $[-180, 180]$ và Vĩ độ $[-90, 90]$.
>   * Kinh độ $X$: Khoảng cách từ điểm đó đến biên trái chia cho tổng chiều rộng kinh độ là $360^\circ$: `((lon + 180) / 360) * canvas.width`.
>   * Vĩ độ $Y$: Vì tọa độ Canvas tính từ đỉnh xuống, còn vĩ độ tính từ xích đạo lên cực Bắc, nên em dùng công thức nghịch đảo vĩ độ: `((90 - lat) / 180) * canvas.height`.
>   * Để tối ưu độ chính xác trên ảnh nền thế giới thực tế, em dùng phương pháp **Nội suy tuyến tính từng đoạn** (như định nghĩa ở mảng `xPts` và `yPts`) để hiệu chỉnh hiện tượng bóp méo hình ảnh do phép chiếu bản đồ gây ra.

#### 💬 Câu 6: Làm thế nào biểu đồ Sparkline nhỏ của em không bị mờ (nhòe) trên các dòng điện thoại cao cấp có màn hình Retina?
> * **Cách trả lời**:
>   * Màn hình cao cấp có mật độ điểm ảnh vật lý cao gấp nhiều lần pixel logic (CSS pixel), đặc trưng bởi chỉ số `window.devicePixelRatio` (thường là 2 hoặc 3). Nếu vẽ Canvas bằng pixel logic thông thường, trình duyệt sẽ tự động nội suy phóng to hình ảnh lên gây ra hiện tượng mờ nét.
>   * Em khắc phục bằng cách lấy kích thước vùng vẽ nhân với `devicePixelRatio` để đặt làm kích thước thật cho thuộc tính `width` và `height` của thẻ Canvas vật lý.
>   * Sau đó, em dùng hàm `ctx.scale(devicePixelRatio, devicePixelRatio)` để thu nhỏ không gian vẽ ảo trong Javascript về đúng tỷ lệ khung nhìn CSS. Nhờ đó mọi nét vẽ vẽ ra đều khớp hoàn hảo với điểm ảnh vật lý của màn hình và sắc nét tuyệt đối.

---

### 💡 Nhóm câu hỏi về Tối ưu hóa UI/UX & JavaScript nâng cao

#### 💬 Câu 7: Tại sao em lại chọn `requestAnimationFrame` thay vì `setInterval` hay `setTimeout` cho hiệu ứng chạy số tăng dần?
> * **Cách trả lời**:
>   * `setInterval` và `setTimeout` chạy theo thời gian tuyệt đối mà không quan tâm đến tần số quét (Refresh Rate) của màn hình, dễ dẫn đến hiện tượng trồi sụt khung hình hoặc giật hình (stuttering).
>   * `requestAnimationFrame` được tối ưu hóa bởi chính trình duyệt. Nó đồng bộ hóa trực tiếp các lệnh vẽ với tần số quét của màn hình (60Hz, 90Hz, 120Hz).
>   * Hơn thế nữa, nếu người dùng chuyển sang tab khác, trình duyệt sẽ tự động tạm dừng `requestAnimationFrame` giúp tiết kiệm tài nguyên CPU và thời lượng pin của thiết bị.

#### 💬 Câu 8: `IntersectionObserver` mang lại lợi ích gì so với việc lắng nghe sự kiện `scroll` thông thường?
> * **Cách trả lời**:
>   * Sự kiện `scroll` kích hoạt liên tục (hàng chục đến hàng trăm lần mỗi giây) khi người dùng cuộn chuột, đòi hỏi CPU liên tục tính toán lại vị trí phần tử bằng hàm `getBoundingClientRect()`, gây ra hiện tượng giật màn hình (lag/jank).
>   * `IntersectionObserver` hoạt động theo cơ chế hướng sự kiện bất đồng bộ của trình duyệt. Trình duyệt chỉ thông báo cho Javascript khi một phần tử thực sự đi vào hoặc đi ra khỏi vùng hiển thị. Cách này giảm tải tính toán cho CPU tối đa, đảm bảo trang web cuộn cực kỳ mượt mà.

#### 💬 Câu 9: Trình bày quy trình xử lý dữ liệu CSV từ Our World In Data?
> * **Cách trả lời**:
>   * Dữ liệu CSV từ OWID được lưu trữ dưới dạng một chuỗi văn bản lớn phân tách bằng dấu phẩy. Sau khi tải về qua `fetch().text()`, em xử lý bằng cách:
>     1. Tách chuỗi thành mảng các dòng bằng hàm `split(/\r?\n/)`.
>     2. Tìm các dòng chứa chuỗi dữ liệu toàn cầu bằng cách kiểm tra sự tồn tại của từ khóa `"World"` hoặc `"OWID_WRL"`.
>     3. Trích xuất các trường dữ liệu tương ứng với năm trong khoảng 2018–2024 (bao gồm tổng sản lượng điện phát ra và tỷ lệ phần trăm năng lượng tái tạo chiếm dụng).
>     4. Thực hiện phép toán nhân tỷ lệ phần trăm với tổng sản lượng để quy đổi ra giá trị tuyệt đối bằng Terawatt-giờ ($TWh$).
>     5. Lấy trung bình cộng của các năm thu được và chia cho 100 để tìm ra giá trị tương đương của $1\%$ hiển thị lên giao diện.

---

## 📝 PHẦN IV: CÁC KỊCH BẢN THỰC HÀNH CODE TAY KHI ĐƯỢC HỎI

Nếu thầy cô chấm đồ án muốn thử tay nghề và yêu cầu bạn viết một đoạn code ngắn trên bảng hoặc giấy, hãy học thuộc 2 kịch bản sau:

### Kịch bản 1: Viết mã nguồn vẽ điểm nhiệt độ Canvas
*Được dùng khi thầy cô bảo: "Em viết thử hàm vẽ điểm nhiệt độ thủ đô lên Canvas phẳng"*

```javascript
function drawTempPoint(canvas, lat, lon, temp) {
  const ctx = canvas.getContext('2d');
  
  // Ánh xạ tọa độ phẳng
  const x = ((lon + 180) / 360) * canvas.width;
  const y = ((90 - lat) / 180) * canvas.height;
  
  // Vẽ điểm nhiệt độ dạng gradient tròn tỏa mờ
  const grad = ctx.createRadialGradient(x, y, 0, x, y, 12);
  grad.addColorStop(0, temp > 25 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
}
```

### Kịch bản 2: Gọi API bất đồng bộ có xử lý lỗi
*Được dùng khi thầy cô bảo: "Em hãy viết hàm gọi API lấy thông tin chất lượng không khí và in ra màn hình console"*

```javascript
async function getAirQuality() {
  const url = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.02&longitude=105.83&current=european_aqi';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Mạng bị lỗi hoặc server không phản hồi');
    }
    const data = await response.json();
    console.log('Chỉ số AQI hiện tại:', data.current.european_aqi);
  } catch (error) {
    console.warn('Lỗi gọi API, sử dụng dữ liệu dự phòng. Chi tiết:', error.message);
  }
}
```
