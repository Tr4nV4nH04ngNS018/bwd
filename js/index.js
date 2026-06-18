/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: js/index.js
 *  MÔ TẢ: Xử lý logic trang chủ (index.html) của EcoImpact
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1. Xử lý đăng ký nhận bản tin (Newsletter Subscribe)
 *  2. Cuộn mượt khi nhấn link neo (Smooth Scrolling)
 *  3. Cập nhật nồng độ CO2 thời gian thực từ API + lưu localStorage
 *  4. Hiệu ứng cuộn trang kích hoạt bằng IntersectionObserver
 *  5. Bộ đếm số chạy tự động (Animated Counter) bằng requestAnimationFrame
 *  6. Vẽ biểu đồ Sparkline trên Canvas với chống nhòe Retina
 *  7. Ẩn gợi ý cuộn khi người dùng đã cuộn trang
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * IIFE (Immediately Invoked Function Expression):
 * - Hàm khởi chạy ngay lập tức sau khi định nghĩa
 * - TẠI SAO DÙNG: Tạo phạm vi biến cục bộ (Local Scope), tránh xung đột 
 *   tên biến toàn cục (Global Namespace) với các file JS khác (bg3d.js, calculator.js)
 */
(function () {
  /**
   * 'use strict': Bật chế độ nghiêm ngặt của JavaScript
   * - Ngăn chặn việc sử dụng các biến chưa khai báo (tránh lỗi ngầm)
   * - Tối ưu tốc độ chạy của trình duyệt
   * - Báo lỗi ngay khi có code thiếu an toàn
   */
  'use strict';

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 1: XỬ LÝ FORM ĐĂNG KÝ BẢN TIN (NEWSLETTER)
   *  - Khi người dùng nhập email và nhấn "Đăng ký ngay"
   *  - Hiển thị thông báo thành công và tự ẩn sau 5 giây
   * ═══════════════════════════════════════════════════════════ */

  /**
   * handleSubscribe(e): Hàm xử lý sự kiện submit form đăng ký bản tin
   * - Gán vào window để có thể gọi trực tiếp từ HTML (onsubmit="handleSubscribe(event)")
   * 
   * @param {Event} e - Sự kiện submit từ form
   */
  window.handleSubscribe = function (e) {
    // e.preventDefault(): Ngăn trình duyệt thực hiện hành vi mặc định (tải lại trang)
    // khi nhấn nút Submit trong form
    e.preventDefault();

    // Lấy giá trị email từ ô nhập liệu
    // .value.trim(): Lấy nội dung và cắt bỏ khoảng trắng thừa ở hai đầu
    const email = document.getElementById('subEmail').value.trim();

    // Nếu email rỗng thì không làm gì (return sớm)
    if (!email) return;

    // classList.remove('hidden'): Xóa class 'hidden' để hiển thị thông báo thành công
    // (thông báo màu xanh lá "✓ Đăng ký thành công!")
    document.getElementById('subSuccessMsg').classList.remove('hidden');

    // Reset form: Xóa toàn bộ nội dung đã nhập trong form
    document.getElementById('subscribeForm').reset();

    // setTimeout: Bộ đếm thời gian BẤT ĐỒNG BỘ
    // Sau 5 giây (5000ms), thêm lại class 'hidden' để ẩn thông báo thành công
    setTimeout(() => {
      document.getElementById('subSuccessMsg').classList.add('hidden');
    }, 5000); // 5000ms = 5 giây
  };

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 2: CUỘN MƯỢT CHO LINK NEO (SMOOTH SCROLLING)
   *  - Khi nhấn các link có href bắt đầu bằng "#" (ví dụ: #hien-trang)
   *  - Trang sẽ cuộn mượt mà đến vị trí đó thay vì nhảy đột ngột
   * ═══════════════════════════════════════════════════════════ */

  // querySelectorAll('a[href^="#"]'): Chọn tất cả thẻ <a> có href bắt đầu bằng "#"
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      // Tìm phần tử đích mà link trỏ tới
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return; // Nếu không tìm thấy thì bỏ qua

      event.preventDefault(); // Ngăn hành vi nhảy trang mặc định

      // scrollIntoView với behavior: 'smooth' để cuộn mượt mà
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 3: CẬP NHẬT NỒNG ĐỘ CO2 THỜI GIAN THỰC
   *  - Gọi API global-warming.org để lấy dữ liệu CO2 mới nhất
   *  - Lưu vào localStorage để dùng khi mất mạng (cơ chế Fallback)
   *  - Hiển thị xu hướng tăng/giảm bằng màu sắc (đỏ/xanh)
   * ═══════════════════════════════════════════════════════════ */

  /**
   * localStorage: Lưu trữ dữ liệu ngay trên trình duyệt người dùng
   * - parseFloat(): Chuyển chuỗi thành số thập phân
   * - Giá trị mặc định '421.7' ppm nếu chưa có dữ liệu cũ
   */
  let previousCo2 = parseFloat(localStorage.getItem('lastCo2') || '421.7');

  // Lấy các phần tử DOM để cập nhật hiển thị
  const co2ValueEl = document.querySelector('.stat-card span.text-white');   // Phần tử hiển thị giá trị CO2
  const co2StatusEl = document.getElementById('co2-status');                 // Phần tử hiển thị trạng thái

  /**
   * updateCo2Status(): Hàm bất đồng bộ cập nhật trạng thái CO2
   * 
   * LUỒNG XỬ LÝ:
   * 1. Gọi API lấy dữ liệu CO2 → 2. Trích xuất giá trị mới nhất
   * 3. Tính chênh lệch so với lần trước → 4. Cập nhật giao diện
   * 5. Lưu giá trị mới vào localStorage
   * 
   * NẾU API LỖI (catch): Dùng dữ liệu giả lập ngẫu nhiên (Fallback)
   */
  async function updateCo2Status() {
    try {
      // fetch(): Gọi API bất đồng bộ - tải dữ liệu CO2 từ server
      const co2Res = await fetch('https://global-warming.org/api/co2-api');
      if (!co2Res.ok) return; // Nếu HTTP response không thành công thì dừng

      // Chuyển đổi response thành đối tượng JSON
      const co2Json = await co2Res.json();

      // Kiểm tra dữ liệu trả về có hợp lệ không
      if (!co2Json.co2 || co2Json.co2.length === 0) return;

      // Trích xuất PHẦN TỬ CUỐI CÙNG trong mảng dữ liệu (giá trị mới nhất)
      // .trend: Giá trị xu hướng CO2 (đơn vị: ppm - parts per million)
      const currentCo2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);

      // Tính độ chênh lệch tăng/giảm so với giá trị cũ
      const change = currentCo2 - previousCo2;

      // Định dạng chuỗi hiển thị: "+0.05" nếu tăng, "-0.03" nếu giảm
      const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);

      // Chọn văn bản và màu sắc theo xu hướng
      const trend = change >= 0 ? 'tăng' : 'giảm';
      const trendColor = change >= 0 ? 'text-red-400' : 'text-green-400'; // Đỏ nếu tăng, Xanh nếu giảm

      // Cập nhật hiển thị lên giao diện
      if (co2ValueEl) co2ValueEl.textContent = `${currentCo2.toFixed(1)} ppm`;
      if (co2StatusEl) co2StatusEl.innerHTML = `${changeStr} ppm <span class="${trendColor}">(${trend})</span>`;

      // Lưu giá trị hiện tại để so sánh lần sau
      previousCo2 = currentCo2;
      localStorage.setItem('lastCo2', currentCo2.toString()); // Lưu vào localStorage

    } catch (error) {
      // FALLBACK: Khi API lỗi (mất mạng, server sập...)
      // Giả lập số ngẫu nhiên gần với giá trị cũ để giao diện không bị trống
      console.warn('Lỗi cập nhật CO2 từ API:', error);
      if (co2ValueEl) {
        // Math.random() - 0.48: Tạo số ngẫu nhiên có xu hướng tăng nhẹ
        const simulatedCo2 = previousCo2 + (Math.random() - 0.48) * 0.01;
        co2ValueEl.textContent = simulatedCo2.toFixed(1) + ' ppm';
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 4: INTERSECTION OBSERVER - CUỘN TRANG KÍCH HOẠT HIỆU ỨNG
   *  
   *  TẠI SAO DÙNG IntersectionObserver thay vì window.addEventListener('scroll')?
   *  - Sự kiện 'scroll' kích hoạt liên tục (hàng trăm lần/giây) → quá tải CPU
   *  - IntersectionObserver dùng cơ chế bất đồng bộ từ lõi trình duyệt
   *  - Chỉ thông báo khi phần tử THỰC SỰ đi vào vùng hiển thị
   *  - Hiệu năng tối ưu, trang cuộn mượt mà hơn rất nhiều
   * ═══════════════════════════════════════════════════════════ */

  /**
   * IntersectionObserver: Theo dõi khi phần tử xuất hiện trên viewport
   * 
   * @param {IntersectionObserverEntry[]} entries - Danh sách phần tử đang được theo dõi
   * 
   * CẤU HÌNH:
   * - threshold: 0.15 → Kích hoạt khi phần tử lộ diện ít nhất 15% trên màn hình
   * - rootMargin: '0px 0px -40px 0px' → Thu hẹp vùng kích hoạt 40px từ dưới lên
   */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Nếu phần tử CHƯA xuất hiện trên màn hình → bỏ qua
      if (!entry.isIntersecting) return;

      // Thêm class 'visible' để kích hoạt hiệu ứng CSS (Fade in & Slide up)
      entry.target.classList.add('visible');

      // Tìm và kích hoạt tất cả bộ đếm số (.counter) bên trong phần tử
      entry.target.querySelectorAll('.counter').forEach(startCounter);

      // Tìm và vẽ tất cả biểu đồ Sparkline (.sparkline) bên trong phần tử
      entry.target.querySelectorAll('.sparkline').forEach(drawSparkline);

      // HỦY THEO DÕI phần tử sau khi hiệu ứng đã chạy xong 1 lần
      // → Giải phóng tài nguyên hệ thống, tránh chạy hiệu ứng lặp lại
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 5: BỘ ĐẾM SỐ CHẠY TỰ ĐỘNG (ANIMATED COUNTER)
   *  
   *  - Con số chạy từ 0 lên giá trị đích (ví dụ: 0 → 12.5)
   *  - Sử dụng thuật toán easeOut: nhanh lúc đầu, chậm dần khi gần đạt đích
   *  - Sử dụng requestAnimationFrame thay vì setInterval để tối ưu hiệu năng
   * ═══════════════════════════════════════════════════════════ */

  /**
   * startCounter(el): Khởi động hiệu ứng đếm số cho một phần tử
   * 
   * @param {HTMLElement} el - Phần tử <span class="counter"> chứa số cần đếm
   * 
   * CÁC DATA ATTRIBUTES:
   * - data-target: Giá trị đích (ví dụ: "12.5")
   * - data-decimals: Số chữ số thập phân (ví dụ: "1")
   */
  function startCounter(el) {
    // Kiểm tra nếu đã bắt đầu đếm rồi thì không đếm lại
    if (el.dataset.started) return;
    el.dataset.started = '1'; // Đánh dấu đã bắt đầu

    const target = parseFloat(el.dataset.target);           // Giá trị đích (ví dụ: 12.5)
    const decimals = parseInt(el.dataset.decimals || '0', 10); // Số chữ số thập phân
    const duration = 1800;                                     // Thời gian chạy: 1800ms = 1.8 giây
    const startTime = performance.now();                       // Thời điểm bắt đầu (độ chính xác cao)

    /**
     * easeOut(t): Hàm easing bậc 3 - Hiệu ứng giảm tốc
     * 
     * CÔNG THỨC: f(t) = 1 - (1 - t)³
     * - t = 0 → f(0) = 0 (bắt đầu)
     * - t = 1 → f(1) = 1 (kết thúc)
     * - Đặc điểm: Con số chạy NHANH lúc đầu và CHẬM DẦN khi gần đạt mục tiêu
     *   → Mang lại cảm giác mượt mà, tự nhiên
     */
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    /**
     * tick(now): Hàm callback được gọi mỗi khung hình (frame)
     * 
     * @param {DOMHighResTimeStamp} now - Thời điểm hiện tại
     * 
     * requestAnimationFrame TỐI ƯU HƠN setInterval vì:
     * 1. Đồng bộ với tần số quét màn hình (60fps/120fps)
     * 2. Không gây giật hình (stuttering)
     * 3. Tự động DỪNG khi tab bị ẩn → tiết kiệm CPU & pin
     */
    function tick(now) {
      const elapsed = now - startTime;                    // Thời gian đã trôi qua
      const progress = Math.min(elapsed / duration, 1);   // Tiến độ từ 0 → 1 (giới hạn tối đa = 1)
      const value = target * easeOut(progress);           // Giá trị hiện tại = đích × easing
      el.textContent = value.toFixed(decimals);           // Cập nhật hiển thị với số thập phân

      // Nếu chưa hoàn thành → yêu cầu vẽ lại khung hình tiếp theo
      if (progress < 1) requestAnimationFrame(tick);
    }

    // Bắt đầu vòng lặp animation
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 6: VẼ BIỂU ĐỒ SPARKLINE TRÊN HTML5 CANVAS
   *  
   *  - Biểu đồ đường nhỏ gọn hiển thị xu hướng dữ liệu
   *  - Hỗ trợ chống nhòe trên màn hình Retina/AMOLED (HiDPI)
   *  - Có hiệu ứng tô màu gradient bên dưới đường (Area Fill)
   *  - Điểm chấm tròn rực rỡ ở cuối đồ thị nhấn mạnh giá trị hiện tại
   * ═══════════════════════════════════════════════════════════ */

  /**
   * drawSparkline(canvas): Vẽ biểu đồ Sparkline lên một thẻ Canvas
   * 
   * @param {HTMLCanvasElement} canvas - Thẻ canvas với data-values chứa dữ liệu
   * 
   * DATA ATTRIBUTE:
   * - data-values: Chuỗi các giá trị phân tách bởi dấu phẩy
   *   Ví dụ: data-values="9.5,10.2,10.8,11.1,11.6,12.0,12.3,12.5"
   */
  function drawSparkline(canvas) {
    // Kiểm tra nếu đã vẽ rồi thì không vẽ lại
    if (canvas.dataset.drawn) return;
    canvas.dataset.drawn = '1';

    // Chuyển chuỗi dữ liệu thành mảng số
    const values = canvas.dataset.values.split(',').map(Number);
    const ctx = canvas.getContext('2d'); // Lấy context 2D để vẽ

    /**
     * CHỐNG NHÒE TRÊN MÀN HÌNH RETINA (HiDPI):
     * 
     * VẤN ĐỀ: Màn hình Retina có devicePixelRatio = 2 hoặc 3
     * → Mỗi CSS pixel = 2-3 pixel vật lý
     * → Nếu vẽ Canvas theo CSS pixel, trình duyệt phóng to → nhòe
     * 
     * GIẢI PHÁP:
     * 1. Lấy devicePixelRatio (dpr) của màn hình
     * 2. Phóng to kích thước VẬT LÝ của Canvas lên gấp dpr lần
     * 3. Dùng ctx.scale(dpr, dpr) để thu nhỏ không gian vẽ ảo
     * → Kết quả: Nét vẽ sắc nét tuyệt đối trên mọi màn hình
     */
    const dpr = window.devicePixelRatio || 1;    // Hệ số mật độ pixel (thường 1, 2, hoặc 3)
    const rect = canvas.getBoundingClientRect();  // Kích thước CSS thực tế của canvas
    canvas.width = rect.width * dpr;              // Kích thước vật lý = CSS × dpr
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);                          // Thu nhỏ tỷ lệ nét vẽ

    const W = rect.width;   // Chiều rộng vùng vẽ (CSS pixels)
    const H = rect.height;  // Chiều cao vùng vẽ (CSS pixels)
    const pad = 4;           // Padding: khoảng cách lề

    // Tính giá trị min/max để chuẩn hóa tọa độ Y
    const min = Math.min(...values) * 0.92;  // Min với biên dưới mở rộng 8%
    const max = Math.max(...values) * 1.05;  // Max với biên trên mở rộng 5%
    const range = max - min || 1;            // Khoảng chênh lệch (tránh chia cho 0)

    // Chuyển đổi giá trị dữ liệu thành tọa độ pixel (x, y) trên Canvas
    const points = values.map((v, i) => ({
      x: pad + (i / (values.length - 1)) * (W - pad * 2),     // X: phân bố đều theo chiều ngang
      y: pad + (1 - (v - min) / range) * (H - pad * 2),       // Y: đảo ngược (Canvas y=0 ở trên)
    }));

    /**
     * TÔ MÀU GRADIENT BÊN DƯỚI ĐƯỜNG (Area Fill):
     * - createLinearGradient: Tạo dải màu chuyển sắc từ trên xuống dưới
     * - Xanh lá mờ ở trên → trong suốt ở dưới
     */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(74,222,128,0.25)');  // Trên: Xanh lá mờ 25%
    grad.addColorStop(1, 'rgba(74,222,128,0.00)');  // Dưới: Trong suốt hoàn toàn

    // Vẽ vùng tô màu (filled area) bên dưới đường
    ctx.beginPath();
    ctx.moveTo(points[0].x, H);                       // Bắt đầu từ đáy bên trái
    points.forEach(p => ctx.lineTo(p.x, p.y));        // Vẽ theo đường dữ liệu
    ctx.lineTo(points[points.length - 1].x, H);       // Kéo xuống đáy bên phải
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();                                        // Tô màu gradient

    // Vẽ đường xu hướng (trend line) - nét xanh lá
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#4ade80';     // Màu xanh lá eco
    ctx.lineWidth = 2;               // Độ dày nét vẽ
    ctx.lineJoin = 'round';          // Bo tròn góc nối
    ctx.lineCap = 'round';           // Bo tròn đầu nét
    ctx.stroke();

    /**
     * VẼ ĐIỂM CHẤM TRÒN RỰC RỠ Ở CUỐI ĐỒ THỊ:
     * - Điểm trong (3.5px): Chấm tròn đặc màu xanh lá
     * - Vòng ngoài (6px): Hào quang mở rộng mờ → nhấn mạnh giá trị hiện tại
     */
    const last = points[points.length - 1]; // Điểm cuối cùng
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2); // Chấm tròn đặc
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);   // Vòng hào quang mở rộng
    ctx.fillStyle = 'rgba(74,222,128,0.22)';        // Mờ 22%
    ctx.fill();
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 7: ẨN GỢI Ý CUỘN TRANG (SCROLL HINT)
   *  - Mũi tên "Cuộn" ở cuối trang sẽ mờ dần khi người dùng cuộn
   *  - Sử dụng { passive: true } để tối ưu hiệu năng cuộn trang
   * ═══════════════════════════════════════════════════════════ */
  const scrollHint = document.querySelector('.fixed.bottom-6');
  if (scrollHint) {
    // { passive: true }: Cho trình duyệt biết handler không gọi preventDefault()
    // → Trình duyệt tối ưu hiệu năng cuộn trang tốt hơn
    window.addEventListener('scroll', () => {
      // Khi cuộn quá 120px → ẩn gợi ý cuộn (opacity = 0)
      scrollHint.style.opacity = window.scrollY > 120 ? '0' : '0.5';
      scrollHint.style.pointerEvents = window.scrollY > 120 ? 'none' : 'auto';
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════
   *  KHỞI TẠO TRANG (INITIALIZATION)
   *  - Đăng ký Observer cho tất cả phần tử có class 'reveal'
   *  - Gọi cập nhật CO2 lần đầu và thiết lập cập nhật định kỳ
   * ═══════════════════════════════════════════════════════════ */

  /**
   * initIndex(): Hàm khởi tạo chính cho trang chủ
   * 
   * LUỒNG KHỞI TẠO:
   * 1. Đăng ký IntersectionObserver cho tất cả phần tử .reveal
   * 2. Gọi updateCo2Status() lần đầu để tải dữ liệu CO2
   * 3. Thiết lập setInterval: tự động cập nhật mỗi 10 phút (600,000ms)
   */
  function initIndex() {
    // Đăng ký theo dõi tất cả phần tử có class 'reveal'
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    // Cập nhật CO2 ngay khi trang tải
    updateCo2Status();

    // Cập nhật CO2 tự động mỗi 10 phút (10 × 60 × 1000 = 600,000ms)
    setInterval(updateCo2Status, 10 * 60 * 1000);
  }

  /**
   * KIỂM TRA TRẠNG THÁI TẢI TRANG:
   * - Nếu DOM chưa tải xong (readyState === 'loading') → đợi DOMContentLoaded
   * - Nếu DOM đã tải xong → chạy initIndex() ngay lập tức
   * 
   * ĐẢM BẢO: Code JS chỉ chạy khi DOM đã sẵn sàng,
   * tránh lỗi querySelector trả về null
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndex);
  } else {
    initIndex();
  }
})(); // Kết thúc IIFE - hàm tự thực thi
