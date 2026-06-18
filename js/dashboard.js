/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: js/dashboard.js
 *  MÔ TẢ: Xử lý logic trang Bảng điều khiển (Dashboard) của EcoImpact
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1.  Dữ liệu dự phòng (FALLBACK_DATA) khi API lỗi
 *  2.  Giả lập Console nhật ký hệ thống (Console Log Simulator)
 *  3.  Tải dữ liệu từ nhiều API: CO2, Nhiệt độ, Chất lượng không khí
 *  4.  Vẽ biểu đồ đường (Line Chart) bằng Chart.js
 *  5.  Vẽ biểu đồ cột mini (Mini Bars) cho năng lượng tái tạo
 *  6.  Xử lý dữ liệu CSV từ Our World in Data (OWID)
 *  7.  Bảng xếp hạng Leaderboard với huy hiệu SVG
 *  8.  Bản đồ nhiệt thế giới Canvas (World Heatmap) với nội suy tọa độ
 *  9.  Biểu đồ cột nhiệt độ châu lục (Continental Bar Chart) realtime
 *  10. Tương tác di chuột tìm thành phố gần nhất (Tooltip mousemove)
 *  11. Thanh tin tức chạy ngang (News Ticker)
 * 
 *  CÁC API SỬ DỤNG:
 *  - global-warming.org/api/co2-api       → Nồng độ CO2 toàn cầu
 *  - global-warming.org/api/temperature-api → Nhiệt độ toàn cầu
 *  - air-quality-api.open-meteo.com       → Chất lượng không khí Hà Nội
 *  - restcountries.com/v3.1/all           → Tọa độ thủ đô các quốc gia
 *  - api.open-meteo.com/v1/forecast       → Nhiệt độ thực tế từng thành phố
 *  - ourworldindata.org (CSV)             → Sản lượng điện & tỷ lệ tái tạo
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * IIFE (Immediately Invoked Function Expression):
 * Tạo phạm vi cục bộ, tránh xung đột biến toàn cục với các file JS khác
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
   *  KIỂM TRA ĐIỀU KIỆN CHẠY
   *  - Chỉ chạy trên trang dashboard.html (có element #valGlobalTemp)
   *  - Yêu cầu thư viện Chart.js đã được tải
   * ═══════════════════════════════════════════════════════════ */
  const container = document.getElementById('valGlobalTemp');
  if (!container || typeof Chart === 'undefined') return; // Không phải trang dashboard → dừng

  // Biến lưu trữ instance của các biểu đồ Chart.js (để destroy khi cần vẽ lại)
  let lineChart = null;      // Biểu đồ đường CO2
  let realtimeChart = null;  // Biểu đồ cột nhiệt độ châu lục
  let dashboardChartLoaded = false; // Cờ đánh dấu đã tải biểu đồ realtime chưa

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 1: DỮ LIỆU DỰ PHÒNG (FALLBACK DATA)
   *  
   *  TẠI SAO CẦN?
   *  - Khi API bị sập, mất mạng, hoặc server không phản hồi
   *  - Dashboard vẫn hiển thị dữ liệu tĩnh thay vì trang trắng
   *  - Đảm bảo UX không bị gián đoạn (Graceful Degradation)
   * ═══════════════════════════════════════════════════════════ */
  const FALLBACK_DATA = {
    globalTemp: 14.5,        // Nhiệt độ toàn cầu trung bình (°C)
    tempChange: 0.9,         // Mức thay đổi nhiệt độ so với baseline
    co2: 421.7,              // Nồng độ CO2 (ppm - parts per million)
    aqi: 33,                 // Chỉ số chất lượng không khí (European AQI)
    pm25: 12.5,              // Bụi mịn PM2.5 (μg/m³)
    pm10: 25.0,              // Bụi thô PM10 (μg/m³)
    renewableRate: 15,       // Tỷ lệ năng lượng tái tạo (%)
    carbonHistory: [         // Lịch sử CO2 theo năm (dùng cho biểu đồ đường)
      { year: '2018', value: 408 },
      { year: '2019', value: 411 },
      { year: '2020', value: 414 },
      { year: '2021', value: 416 },
      { year: '2022', value: 418 },
      { year: '2023', value: 421 },
    ],
    renewableHistory: [      // Lịch sử năng lượng tái tạo (dùng cho mini bars)
      { year: '2018', value: 2 },
      { year: '2020', value: 5 },
      { year: '2022', value: 10 },
      { year: '2023', value: 15 },
    ],
    news: [                  // Tin tức dự phòng cho thanh ticker
      '<strong>Trực tiếp:</strong> Năng lượng tái tạo đang trở thành xu hướng chính toàn cầu...',
      'Lượng phát thải CO2 có dấu hiệu chững lại ở một số khu vực...',
      'Hội nghị chống biến đổi khí hậu công bố mục tiêu cắt giảm phát thải mới...',
      'Phát triển bền vững được các doanh nghiệp đặt lên hàng đầu...'
    ]
  };

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 2: GIẢ LẬP CONSOLE NHẬT KÝ HỆ THỐNG
   *  
   *  - Mô phỏng log hệ thống như terminal/console chuyên nghiệp
   *  - In từng dòng với độ trễ 250ms → tạo cảm giác đang kết nối
   *  - Tự động thêm log mới mỗi 4.5 giây và xóa dòng cũ
   * ═══════════════════════════════════════════════════════════ */

  /**
   * initConsoleLogs(): Khởi tạo bộ giả lập nhật ký console
   * 
   * CƠ CHẾ HOẠT ĐỘNG:
   * 1. In tuần tự các dòng initialLogs (250ms/dòng) = hiệu ứng "đang kết nối"
   * 2. Mỗi 4.5 giây, chọn ngẫu nhiên 1 dòng từ periodicLogs
   * 3. Nếu vượt quá 8 dòng → xóa dòng cũ nhất (removeChild(firstChild))
   *    → Giao diện không bị tràn
   */
  function initConsoleLogs() {
    const logsEl = document.getElementById('commandLogs');
    if (!logsEl) return;

    // Mảng các dòng log ban đầu (hiển thị khi trang vừa tải)
    const initialLogs = [
      'Connecting to Global Warming API...',
      '[OK] Connected to global-warming.org',
      'Fetching CO2 atmospheric trend data...',
      'Fetching NASA global temperature index...',
      '[OK] Syncing air quality with Open-Meteo API...',
      'Calculating local carbon offsets...',
      '[SYSTEM] Ready.'
    ];

    logsEl.innerHTML = ''; // Xóa nội dung cũ

    // In từng dòng log với delay tăng dần (0ms, 250ms, 500ms, 750ms...)
    initialLogs.forEach((log, index) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.textContent = `> ${log}`;
        logsEl.appendChild(div);
        logsEl.scrollTop = logsEl.scrollHeight; // Tự cuộn xuống dòng mới nhất
      }, index * 250); // Mỗi dòng cách nhau 250ms
    });

    // Mảng các dòng log định kỳ (hiển thị ngẫu nhiên)
    const periodicLogs = [
      'Ping global-warming.org (185ms)',
      'Checking LocalStorage session state...',
      'Ecosystem data sync: status nominal',
      'Redrawing interactive world map...',
      'Recalculating regional renewable averages...',
      'Caching Open-Meteo response (TTL 300s)'
    ];

    // setInterval: Mỗi 4.5 giây thêm 1 dòng log ngẫu nhiên
    setInterval(() => {
      // Chọn ngẫu nhiên 1 dòng từ mảng periodicLogs
      const randomLog = periodicLogs[Math.floor(Math.random() * periodicLogs.length)];
      const div = document.createElement('div');

      // Hiển thị timestamp thời gian thực theo định dạng VN (HH:mm:ss)
      div.textContent = `> [${new Date().toLocaleTimeString('vi-VN', { hour12: false })}] ${randomLog}`;
      
      // Giới hạn tối đa 8 dòng → xóa dòng cũ nhất nếu vượt quá
      if (logsEl.children.length > 8) {
        logsEl.removeChild(logsEl.firstChild); // Xóa dòng đầu tiên (cũ nhất)
      }
      
      logsEl.appendChild(div);
      logsEl.scrollTop = logsEl.scrollHeight; // Auto-scroll xuống cuối
    }, 4500); // 4500ms = 4.5 giây
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 3: TẢI DỮ LIỆU TỪ NHIỀU API (Fetch Dashboard Data)
   *  
   *  - Gọi 3 API song song: CO2, Nhiệt độ, Chất lượng không khí
   *  - Mỗi API có try-catch RIÊNG → 1 API lỗi không ảnh hưởng API khác
   *  - Luôn trả về dữ liệu (có thể là fallback nếu API lỗi)
   * ═══════════════════════════════════════════════════════════ */

  /**
   * fetchDashboardData(): Tải tất cả dữ liệu cần thiết cho Dashboard
   * 
   * @returns {Object} data - Đối tượng chứa toàn bộ dữ liệu dashboard
   * 
   * CƠ CHẾ XỬ LÝ LỖI CỤC BỘ:
   * - Mỗi API được bọc trong try-catch RIÊNG
   * - Nếu API CO2 lỗi → vẫn tải được Nhiệt độ và AQI
   * - Đảm bảo dashboard luôn có dữ liệu để hiển thị
   */
  async function fetchDashboardData() {
    // Deep clone FALLBACK_DATA để không làm thay đổi dữ liệu gốc
    const data = JSON.parse(JSON.stringify(FALLBACK_DATA));

    // Dữ liệu năng lượng tái tạo cập nhật (hardcoded)
    const renewableHistory = [
      { year: '2018', value: 25.1 },
      { year: '2019', value: 26.1 },
      { year: '2020', value: 28.0 },
      { year: '2021', value: 28.1 },
      { year: '2022', value: 29.5 },
      { year: '2023', value: 30.3 },
      { year: '2024', value: 31.9 },
    ];

    data.renewableRate = renewableHistory[renewableHistory.length - 1].value;
    data.renewableHistory = renewableHistory;

    try {
      // ═══ API 1: Nồng độ CO2 toàn cầu (global-warming.org) ═══
      try {
        const co2Res = await fetch('https://global-warming.org/api/co2-api');
        if (co2Res.ok) {
          const co2Json = await co2Res.json();
          if (co2Json.co2 && co2Json.co2.length > 0) {
            // Lấy giá trị trend (xu hướng) của phần tử cuối cùng = mới nhất
            data.co2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);

            // Trích xuất 6 điểm dữ liệu gần nhất cho biểu đồ đường
            const history = [];
            const recentData = co2Json.co2.slice(-6); // 6 tháng gần nhất
            recentData.forEach((entry, index) => {
              const monthLabel = entry.month ? `Th${entry.month}` : `Th${index + 1}`;
              history.push({ year: monthLabel, value: parseFloat(entry.trend) });
            });
            if (history.length > 0) data.carbonHistory = history;
          }
        }
      } catch (error) { console.warn('Lỗi tải dữ liệu CO2', error); }

      // ═══ API 2: Nhiệt độ toàn cầu (global-warming.org) ═══
      try {
        const tempRes = await fetch('https://global-warming.org/api/temperature-api');
        if (tempRes.ok) {
          const tempJson = await tempRes.json();
          if (tempJson.result && tempJson.result.length > 0) {
            const latest = tempJson.result[tempJson.result.length - 1]; // Dữ liệu mới nhất
            data.tempChange = parseFloat(latest.land); // Mức thay đổi nhiệt độ đất liền
            data.globalTemp = parseFloat((14.0 + data.tempChange).toFixed(1)); // Nhiệt độ tuyệt đối
          }
        }
      } catch (error) { console.warn('Lỗi tải dữ liệu Nhiệt độ', error); }

      // ═══ API 3: Chất lượng không khí Hà Nội (Open-Meteo) ═══
      try {
        const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.0285&longitude=105.8542&current=european_aqi,pm2_5,pm10');
        if (aqiRes.ok) {
          const aqiJson = await aqiRes.json();
          if (aqiJson.current) {
            data.aqi = aqiJson.current.european_aqi || data.aqi;   // Chỉ số AQI châu Âu
            data.pm25 = aqiJson.current.pm2_5 || data.pm25;       // Bụi mịn PM2.5
            data.pm10 = aqiJson.current.pm10 || data.pm10;        // Bụi thô PM10
          }
        }
      } catch (error) { console.warn('Lỗi tải dữ liệu Chất lượng không khí', error); }

      return data; // Trả về dữ liệu (có thể mix giữa API thật và fallback)
    } catch (error) {
      console.error('Lỗi cập nhật dashboard, dùng dữ liệu dự phòng', error);
      return data; // Trả về fallback data
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 4 & 5: RENDER DASHBOARD (Vẽ biểu đồ + cập nhật UI)
   *  
   *  - Cập nhật tất cả các thẻ số liệu trên giao diện
   *  - Vẽ biểu đồ đường CO2 bằng Chart.js
   *  - Vẽ biểu đồ cột mini cho năng lượng tái tạo
   *  - Tính toán quy đổi 1% từ dữ liệu CSV OWID
   * ═══════════════════════════════════════════════════════════ */

  /**
   * renderDashboard(): Hàm chính render toàn bộ Dashboard
   * 
   * LUỒNG XỬ LÝ:
   * 1. Tải dữ liệu từ API (fetchDashboardData)
   * 2. Cập nhật các thẻ số liệu (nhiệt độ, CO2, AQI)
   * 3. Vẽ biểu đồ đường CO2 (Chart.js Line Chart)
   * 4. Vẽ biểu đồ cột mini năng lượng tái tạo
   * 5. Tải và xử lý CSV để tính quy đổi 1%
   * 6. Cập nhật thanh tin tức (news ticker)
   */
  async function renderDashboard() {
    const data = await fetchDashboardData();
    const updatedAt = new Date(); // Thời điểm cập nhật

    // ═══ CẬP NHẬT CÁC THẺ SỐ LIỆU TRÊN GIAO DIỆN ═══
    document.getElementById('valGlobalTemp').textContent = `${data.globalTemp.toFixed(1)}°C`;
    
    // Hiển thị mức thay đổi nhiệt độ (+0.90°C hoặc -0.50°C)
    const tempSign = data.tempChange > 0 ? '+' : '';
    document.getElementById('valTempChange').textContent = `(${tempSign}${data.tempChange.toFixed(2)}°C)`;
    
    // Hiển thị thời gian cập nhật
    const valTempUpdated = document.getElementById('valTempUpdated');
    if (valTempUpdated) valTempUpdated.textContent = `Cập nhật lúc ${updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    // Cập nhật giá trị CO2 và AQI
    document.getElementById('valCo2').textContent = data.co2.toFixed(1);
    const aqiPercent = Math.min(100, Math.round(((data.aqi - 1) / 4) * 100)); // Quy đổi AQI → %
    document.getElementById('valAqi').textContent = `${aqiPercent}%`;

    // Cập nhật thanh progress bar
    document.getElementById('co2Bar').style.width = '74%';
    document.getElementById('aqBar').style.width = `${aqiPercent}%`;

    // ═══ VẼ BIỂU ĐỒ ĐƯỜNG CO2 BẰNG CHART.JS ═══
    /**
     * Chart.js Line Chart:
     * - Hiển thị xu hướng CO2 theo thời gian
     * - Gradient fill: Xanh lá mờ bên dưới đường
     * - Animation: Hiệu ứng vẽ 1.2 giây kiểu easeInOutCubic
     * - Tooltip: Hiển thị giá trị khi di chuột
     */
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy(); // Destroy chart cũ trước khi vẽ mới

    const lineLabels = data.carbonHistory.map((item) => item.year);   // Nhãn trục X
    const lineData = data.carbonHistory.map((item) => item.value);    // Dữ liệu trục Y

    // Tạo gradient fill (xanh lá mờ → trong suốt)
    const gradient = lineCtx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(34,197,94,0.28)');
    gradient.addColorStop(1, 'rgba(34,197,94,0.00)');

    // Khởi tạo Chart.js Line Chart
    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: lineLabels,
        datasets: [{
          data: lineData,
          borderColor: '#22c55e',           // Màu đường: xanh lá
          borderWidth: 2,                    // Độ dày đường
          pointBackgroundColor: '#22c55e',   // Màu chấm điểm
          pointRadius: 4,                    // Kích thước chấm
          pointHoverRadius: 6,               // Kích thước chấm khi hover
          fill: true,                        // Tô màu bên dưới đường
          backgroundColor: gradient,         // Gradient fill
          tension: 0.42,                     // Độ cong đường (Bezier curve)
        }],
      },
      options: {
        responsive: true,                   // Tự động co giãn theo container
        maintainAspectRatio: false,          // Không giữ tỷ lệ cố định
        animation: { duration: 1200, easing: 'easeInOutCubic' }, // Hiệu ứng vẽ
        plugins: { 
          legend: { display: false },        // Ẩn chú thích
          tooltip: {                         // Tùy chỉnh Tooltip khi di chuột
            backgroundColor: 'rgba(10,22,13,0.92)',
            borderColor: 'rgba(34,197,94,0.4)',
            borderWidth: 1,
            titleColor: '#4ade80',
            bodyColor: '#fff',
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} ppm`, // Format số có dấu phẩy
            },
          }
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' },
          },
          y: {
            ticks: {
              color: 'rgba(255,255,255,0.35)',
              font: { size: 10 },
              maxTicksLimit: 6,              // Giới hạn tối đa 6 nhãn trục Y
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' },
          },
        },
      },
    });

    // ═══ VẼ BIỂU ĐỒ CỘT MINI (Mini Bars) - NĂNG LƯỢNG TÁI TẠO ═══
    /**
     * Mini Bars: Biểu đồ cột nhỏ hiển thị tỷ lệ năng lượng tái tạo qua các năm
     * - Mỗi cột đại diện cho 1 năm
     * - Chiều cao cột = % năng lượng tái tạo
     * - Animation: cột "mọc lên" từ 0% sau 400ms delay
     */
    const miniBarsEl = document.getElementById('miniBars');
    if (miniBarsEl) {
      miniBarsEl.innerHTML = ''; // Xóa cột cũ
      data.renewableHistory.forEach((item) => {
        const bar = document.createElement('div');
        bar.className = 'mini-bar';
        bar.style.flex = '1 1 0';
        bar.title = `${item.year}: ${item.value.toFixed(1)}%`;    // Tooltip khi hover
        bar.setAttribute('aria-label', `${item.year} - ${item.value.toFixed(1)} phần trăm điện từ năng lượng tái tạo`);
        bar.style.height = '0%'; // Bắt đầu từ 0%
        miniBarsEl.appendChild(bar);

        // Animation: sau 400ms, cột mọc lên đến giá trị thực
        setTimeout(() => {
          const pct = Math.max(0, Math.min(100, item.value));
          bar.style.height = pct + '%';
        }, 400);
      });
    }

    // Hiển thị nhãn năm bên dưới biểu đồ cột mini
    const miniLabelsEl = document.getElementById('miniLabels');
    if (miniLabelsEl) {
      miniLabelsEl.innerHTML = '';
      const count = data.renewableHistory.length;
      const step = Math.max(1, Math.ceil(count / 4)); // Chỉ hiển thị tối đa 4 nhãn
      data.renewableHistory.forEach((item, idx) => {
        const label = document.createElement('span');
        label.className = 'mini-label';
        label.style.flex = '1';
        label.style.textAlign = 'center';
        label.textContent = (idx % step === 0) ? item.year : ''; // Bỏ trống nhãn thừa
        miniLabelsEl.appendChild(label);
      });
    }

    /* ═══════════════════════════════════════════════════════════
     *  CHỨC NĂNG 6: XỬ LÝ DỮ LIỆU CSV TỪ OUR WORLD IN DATA (OWID)
     *  
     *  MỤC ĐÍCH: Tính toán "1% điện năng từ năng lượng tái tạo = bao nhiêu TWh?"
     *  
     *  THUẬT TOÁN XỬ LÝ:
     *  1. Tải 2 file CSV bất đồng bộ bằng Promise.all (song song)
     *  2. Đọc CSV dạng text, tách từng dòng bằng split(/\r?\n/)
     *  3. Lọc dòng chứa "World" hoặc "OWID_WRL" (dữ liệu toàn cầu)
     *  4. Lọc theo năm 2018-2024
     *  5. Trích xuất: Tổng sản lượng điện (TWh) × Tỷ lệ tái tạo (%)
     *  6. Tính trung bình cộng → chia 100 → giá trị 1%
     * ═══════════════════════════════════════════════════════════ */
    const convEl = document.getElementById('renewableConversion');
    if (convEl) {
      convEl.textContent = 'Đang tính quy đổi 1% → năng lượng (renewables: trung bình 2018–2024)...';

      // IIFE bất đồng bộ để xử lý CSV
      (async () => {
        try {
          // URL hai file CSV từ Our World in Data
          const totalUrl = 'https://ourworldindata.org/grapher/electricity-generation.csv';
          const shareUrl = 'https://ourworldindata.org/grapher/share-electricity-renewables.csv';

          /**
           * Promise.all: Gửi 2 request HTTP ĐỒNG THỜI
           * 
           * TẠI SAO KHÔNG GỌI TUẦN TỰ?
           * - Tuần tự: await fetch1(); await fetch2(); → Tổng thời gian = T1 + T2
           * - Promise.all: → Tổng thời gian = max(T1, T2)
           * - Tối ưu đáng kể tốc độ tải trang!
           */
          const [rTotal, rShare] = await Promise.all([fetch(totalUrl), fetch(shareUrl)]);
          if (!rTotal.ok || !rShare.ok) { convEl.textContent = 'Không tải được dữ liệu cần thiết từ nguồn OWID.'; return; }

          // Chuyển response thành chuỗi text
          const [csvTotal, csvShare] = await Promise.all([rTotal.text(), rShare.text()]);

          // Tách CSV thành mảng các dòng
          // Regex /\r?\n/ xử lý cả Windows (\r\n) và Unix (\n) line endings
          const linesTotal = csvTotal.trim().split(/\r?\n/);
          const linesShare = csvShare.trim().split(/\r?\n/);

          const years = [2018,2019,2020,2021,2022,2023,2024]; // Khoảng năm cần lọc
          const renewPerYear = [];

          for (const y of years) {
            // Tìm dòng dữ liệu toàn cầu (bắt đầu bằng "World," hoặc chứa "OWID_WRL")
            let totalLine = linesTotal.find(l => l.startsWith('World,') && l.includes(`,${y},`));
            if (!totalLine) totalLine = linesTotal.find(l => l.includes('OWID_WRL') && l.includes(`,${y},`));
            let shareLine = linesShare.find(l => l.startsWith('World,') && l.includes(`,${y},`));
            if (!shareLine) shareLine = linesShare.find(l => l.includes('OWID_WRL') && l.includes(`,${y},`));

            if (totalLine && shareLine) {
              // Tách dòng CSV thành mảng các trường
              const tparts = totalLine.split(/,|\t/);
              const sparts = shareLine.split(/,|\t/);

              // Trích xuất giá trị CUỐI CÙNG của mỗi dòng
              const total = parseFloat(tparts[tparts.length - 1]); // Tổng sản lượng điện (TWh)
              const share = parseFloat(sparts[sparts.length - 1]); // Tỷ lệ tái tạo (%)

              if (!isNaN(total) && !isNaN(share)) {
                /**
                 * CÔNG THỨC TÍNH SẢN LƯỢNG TÁI TẠO:
                 * Sản lượng tái tạo (TWh) = Tổng điện phát × (Tỷ lệ / 100)
                 */
                const renewTWh = total * (share / 100);
                renewPerYear.push({ year: y, total, share, renewTWh });
              }
            }
          }

          if (renewPerYear.length === 0) { convEl.textContent = 'Không tìm thấy dữ liệu renewables cho 2018–2024.'; return; }

          // Tính TRUNG BÌNH CỘNG sản lượng tái tạo qua các năm
          const sumRenew = renewPerYear.reduce((s,i)=>s + i.renewTWh, 0);
          const avgRenew = sumRenew / renewPerYear.length;

          // Tính giá trị 1% = trung bình ÷ 100
          const onepct = avgRenew * 0.01;

          // Hiển thị kết quả lên giao diện
          convEl.textContent = `1% ≈ ${ onepct.toLocaleString('vi-VN', { maximumFractionDigits: 3 }) } TWh (renewables trung bình ${Math.round(avgRenew)} TWh/năm, ${renewPerYear.length} năm)`;
        } catch (e) {
          convEl.textContent = 'Lỗi khi tính quy đổi 1%: ' + (e && e.message ? e.message : e);
        }
      })();
    }

    // ═══ CẬP NHẬT THANH TIN TỨC (NEWS TICKER) ═══
    /**
     * News Ticker: Thanh tin tức chạy ngang liên tục
     * - Nhân đôi mảng news [...data.news, ...data.news] để tạo vòng lặp liền mạch
     * - CSS animation marquee sẽ cuộn thanh liên tục
     */
    const tickerInner = document.getElementById('tickerInner');
    if (tickerInner) {
      tickerInner.innerHTML = '';
      // Nhân đôi để khi cuộn hết nửa đầu, nửa sau tiếp nối liền mạch
      [...data.news, ...data.news].forEach((item) => {
        const span = document.createElement('span');
        span.innerHTML = item + ' &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; ';
        tickerInner.appendChild(span);
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 7: BẢNG XẾP HẠNG (LEADERBOARD) VỚI HUY HIỆU SVG
   *  
   *  - Hiển thị top 5 người đóng góp hàng đầu
   *  - Mỗi người có avatar, tên, điểm đóng góp và huy hiệu
   *  - Huy hiệu SVG: Vàng (gold), Bạc (silver), Đồng (bronze)
   * ═══════════════════════════════════════════════════════════ */

  // Dữ liệu bảng xếp hạng (hardcoded cho demo)
  const leaders = [
    { rank: 1, name: 'Lê Hoàng Gia Bảo', contrib: '2600m', badge: 'gold', initials: 'LB', color: '#6ee7b7' },
    { rank: 2, name: 'Huỳnh Kim Linh', contrib: '200m', badge: 'bronze', initials: 'HL', color: '#a78bfa' },
    { rank: 3, name: 'Trần Văn Hoàng', contrib: '360m', badge: 'silver', initials: 'TH', color: '#f9a8d4' },
    { rank: 4, name: 'Võ Tá Dũng', contrib: '258m', badge: 'gold', initials: 'VD', color: '#fcd34d' },
    { rank: 5, name: 'Light', contrib: '277m', badge: 'bronze', initials: 'LI', color: '#7dd3fc' },
  ];

  // SVG inline cho 3 loại huy hiệu
  const BADGE_SVG = {
    gold: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#f59e0b" opacity="0.9"/><path d="M12 3 L9 8 L3 8.5 L7.5 13 L6 19 L12 16 L18 19 L16.5 13 L21 8.5 L15 8 Z" fill="#fbbf24" opacity="0.7" transform="scale(0.65) translate(6.5,4)"/><circle cx="12" cy="14" r="5" fill="none" stroke="#fde68a" stroke-width="1"/></svg>`,
    silver: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#94a3b8" opacity="0.9"/><circle cx="12" cy="14" r="5" fill="none" stroke="#e2e8f0" stroke-width="1"/><path d="M9 14l2 2 4-4" stroke="#f1f5f9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    bronze: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#b45309" opacity="0.9"/><circle cx="12" cy="14" r="5" fill="none" stroke="#fcd34d" stroke-width="1"/><text x="12" y="18" text-anchor="middle" font-size="7" fill="#fef3c7" font-weight="bold">★</text></svg>`,
  };

  // Render bảng xếp hạng vào DOM
  const leaderboard = document.getElementById('leaderboard');
  if (leaderboard) {
    leaderboard.innerHTML = '';
    leaders.forEach((leader) => {
      const row = document.createElement('div');
      row.className = 'lb-row';
      row.innerHTML = `
        <span class="text-sm font-bold text-white/50">${leader.rank}</span>
        <div class="flex items-center gap-3">
          <div class="avatar" style="background:${leader.color}22; color:${leader.color};">${leader.initials}</div>
          <div>
            <p class="text-sm font-semibold text-white leading-tight">${leader.name}</p>
            <p class="text-[0.7rem] text-green-400 font-medium">Đóng góp ${leader.contrib}</p>
          </div>
        </div>
        <div>${BADGE_SVG[leader.badge]}</div>
      `;
      leaderboard.appendChild(row);
    });
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 8: BẢN ĐỒ NHIỆT THẾ GIỚI (World Canvas Heatmap)
   *  
   *  - Hiển thị nhiệt độ thực tế trên bản đồ thế giới phẳng
   *  - Sử dụng NỘI SUY TUYẾN TÍNH TỪNG ĐOẠN (Piecewise Linear Interpolation)
   *    để chuyển tọa độ địa lý → pixel chính xác trên ảnh nền
   *  - Mỗi thành phố là 1 điểm nhiệt với màu sắc theo nhiệt độ
   *  - Hỗ trợ tương tác di chuột (mousemove) để xem tooltip
   * ═══════════════════════════════════════════════════════════ */

  // Cấu hình dữ liệu các châu lục cho biểu đồ cột
  const REGION_SERIES = [
    { api: 'Americas', label: 'C. Mỹ', color: 'rgba(59, 130, 246, 0.85)' },
    { api: 'Asia', label: 'C. Á', color: 'rgba(16, 185, 129, 0.85)' },
    { api: 'Oceania', label: 'C. Đ.Dương', color: 'rgba(234, 179, 8, 0.85)' },
    { api: 'Europe', label: 'C. Âu', color: 'rgba(249, 115, 22, 0.85)' },
    { api: 'Africa', label: 'C. Phi', color: 'rgba(239, 68, 68, 0.85)' }
  ];

  // 3 thành phố đại diện hiển thị trên bản đồ nhiệt
  const activeThreeCities = [
    { label: 'New York', country: 'Hoa Kỳ', region: 'Americas', lat: 40.71, lon: -74.01, temp: 15.5 },
    { label: 'Hà Nội', country: 'Việt Nam', region: 'Asia', lat: 21.03, lon: 105.85, temp: 28.5 },
    { label: 'Sydney', country: 'Úc', region: 'Oceania', lat: -33.87, lon: 151.21, temp: 20.1 }
  ];
  let activeCapitals = null;   // Danh sách thủ đô (từ RestCountries API)
  let activeTemps = null;      // Nhiệt độ tương ứng (từ Open-Meteo API)
  let hoveredIndex = null;     // Index thành phố đang được hover

  // Hiển thị chip nhiệt độ ban đầu cho 3 thành phố
  const chipEls = [document.getElementById('tempChip1'), document.getElementById('tempChip2'), document.getElementById('tempChip3')];
  for (let i = 0; i < chipEls.length; i++) {
    if (chipEls[i]) {
      chipEls[i].innerHTML = `<span style="opacity: 0.6; font-weight: normal; margin-right: 4px;">${activeThreeCities[i].label}:</span>${activeThreeCities[i].temp.toFixed(1)}°C`;
    }
  }

  /**
   * projectCoords(lat, lon, W, H): Chuyển đổi tọa độ địa lý → pixel Canvas
   * 
   * @param {number} lat - Vĩ độ (-90 → 90)
   * @param {number} lon - Kinh độ (-180 → 180)
   * @param {number} W   - Chiều rộng Canvas (pixels)
   * @param {number} H   - Chiều cao Canvas (pixels)
   * @returns {{x: number, y: number}} - Tọa độ pixel trên Canvas
   * 
   * PHƯƠNG PHÁP NỘI SUY TUYẾN TÍNH TỪNG ĐOẠN (Piecewise Linear Interpolation):
   * 
   * TẠI SAO KHÔNG DÙNG CÔNG THỨC ĐƠN GIẢN ((lon+180)/360)*W ?
   * → Vì ảnh nền bản đồ bị bóp méo do phép chiếu (Mercator/Robinson)
   * → Cần chia nhỏ tọa độ thành các đoạn mốc và nội suy từng phần
   * → Đảm bảo các điểm thành phố rơi vào đúng vị trí trực quan
   * 
   * CÁCH HOẠT ĐỘNG:
   * 1. Định nghĩa mảng các điểm mốc: [kinh_độ, tỷ_lệ_pixel]
   * 2. Tìm đoạn chứa kinh độ đầu vào
   * 3. Nội suy tuyến tính trong đoạn đó: t = (lon - p1) / (p2 - p1)
   * 4. Tính tỷ lệ pixel: pct = p1_pct + t × (p2_pct - p1_pct)
   */
  function projectCoords(lat, lon, W, H) {
    // Mảng điểm mốc trục X (Kinh độ → tỷ lệ phần trăm chiều rộng)
    const xPts = [
      [-180, 0.0],       // Biên trái
      [-125, 0.144],
      [-74, 0.269],      // ~New York
      [0, 0.472],        // Kinh tuyến gốc (Greenwich)
      [73, 0.720],
      [106, 0.801],      // ~Hà Nội
      [140, 0.870],
      [180, 1.0]         // Biên phải
    ];
    
    // Tính tỷ lệ X mặc định (công thức đơn giản)
    let xPct = (lon + 180) / 360;

    // Nội suy từng đoạn để tăng độ chính xác
    for (let i = 0; i < xPts.length - 1; i++) {
      const p1 = xPts[i], p2 = xPts[i+1];
      if (lon >= p1[0] && lon <= p2[0]) {
        const t = (lon - p1[0]) / (p2[0] - p1[0]); // Tỷ lệ trong đoạn
        xPct = p1[1] + t * (p2[1] - p1[1]);         // Nội suy tuyến tính
        break;
      }
    }

    // Mảng điểm mốc trục Y (Vĩ độ → tỷ lệ phần trăm chiều cao)
    // Lưu ý: Canvas Y ngược với Vĩ độ (Y=0 ở trên, vĩ độ 90°N ở trên)
    const yPts = [
      [-90, 1.0],        // Cực Nam (đáy Canvas)
      [-33.87, 0.821],   // ~Sydney
      [0, 0.609],        // Xích đạo
      [21.03, 0.472],    // ~Hà Nội
      [35.68, 0.385],
      [40.71, 0.345],    // ~New York
      [90, 0.0]          // Cực Bắc (đỉnh Canvas)
    ];

    let yPct = (90 - lat) / 180; // Công thức mặc định (đảo ngược)
    for (let i = 0; i < yPts.length - 1; i++) {
      const p1 = yPts[i], p2 = yPts[i+1];
      if (lat >= p1[0] && lat <= p2[0]) {
        const t = (lat - p1[0]) / (p2[0] - p1[0]);
        yPct = p1[1] + t * (p2[1] - p1[1]);
        break;
      }
    }

    return { x: xPct * W, y: yPct * H }; // Chuyển tỷ lệ → pixel
  }

  /**
   * drawWorldHeatmap(hoveredIdx): Vẽ bản đồ nhiệt trên Canvas
   * 
   * @param {number|null} hoveredIdx - Index thành phố đang được hover (null = không hover)
   * 
   * CÁC BƯỚC VẼ:
   * 1. Xóa Canvas cũ và vẽ lưới tọa độ mờ
   * 2. Với mỗi thành phố: vẽ điểm nhiệt (gradient tỏa tròn) theo màu nhiệt độ
   * 3. Cập nhật vị trí chip nhiệt độ (HTML overlay)
   * 4. Vẽ đường nét đứt nối chip → điểm
   * 5. Nếu đang hover: vẽ vòng tròn highlight
   */
  function drawWorldHeatmap(hoveredIdx) {
    const wc = document.getElementById('worldCanvas');
    if (!wc) return;
    const ctx = wc.getContext('2d');

    // Chống nhòe Retina (giống Sparkline ở index.js)
    const dpr = window.devicePixelRatio || 1;
    const rect = wc.getBoundingClientRect();
    const W = rect.width || wc.clientWidth || 300;
    const H = rect.height || wc.clientHeight || 180;
    wc.width = W * dpr;
    wc.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H); // Xóa toàn bộ Canvas

    // Vẽ lưới tọa độ mờ (gridlines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, H * i / 6); ctx.lineTo(W, H * i / 6); ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(W * i / 8, 0); ctx.lineTo(W * i / 8, H); ctx.stroke();
    }

    /**
     * tempColor(t): Chọn bảng màu theo nhiệt độ
     * - ≤ 0°C  → Xanh dương (lạnh)
     * - ≤ 10°C → Xanh lá (mát)
     * - ≤ 20°C → Vàng (ấm)
     * - ≤ 30°C → Cam (nóng)
     * - > 30°C → Đỏ (rất nóng)
     */
    function tempColor(t) {
      if (t <= 0) return 'rgba(96, 165, 250, 0.8)';
      if (t <= 10) return 'rgba(74, 222, 128, 0.7)';
      if (t <= 20) return 'rgba(250, 204, 21, 0.7)';
      if (t <= 30) return 'rgba(251, 146, 60, 0.8)';
      return 'rgba(239, 68, 68, 0.85)';
    }

    // Vẽ điểm nhiệt cho mỗi thành phố
    activeThreeCities.forEach((cap) => {
      const temp = cap.temp;
      if (temp === null || temp === undefined) return;
      
      // Chuyển tọa độ địa lý → pixel Canvas
      const { x, y } = projectCoords(cap.lat, cap.lon, W, H);
      if (y < 0 || y > H || x < 0 || x > W) return; // Ngoài vùng vẽ → bỏ qua

      /**
       * createRadialGradient: Tạo QUẦNG NHIỆT TỎA MỜ
       * - Tâm: màu theo nhiệt độ
       * - Viền: trong suốt
       * → Tạo hiệu ứng "heat point" tỏa tròn
       */
      const color = tempColor(temp);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 8);
      grd.addColorStop(0, color);       // Tâm: màu đậm
      grd.addColorStop(1, 'transparent'); // Viền: trong suốt
      ctx.fillStyle = grd;
      ctx.fillRect(x - 8, y - 8, 16, 16);

      // Vẽ chấm tròn nhỏ ở tâm
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Cập nhật vị trí chip nhiệt độ (HTML elements phủ lên Canvas)
    const canvasLeft = wc.offsetLeft;
    const canvasTop = wc.offsetTop;

    activeThreeCities.forEach((city, idx) => {
      const chipId = `tempChip${idx + 1}`;
      const chip = document.getElementById(chipId);
      if (!chip) return;
      const { x, y } = projectCoords(city.lat, city.lon, W, H);

      // Đặt vị trí chip trùng với điểm trên Canvas
      chip.style.left = `${canvasLeft + x}px`;
      chip.style.top = `${canvasTop + y}px`;
      chip.style.display = 'block';

      // Vẽ đường nét đứt nối từ điểm lên chip
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]); // Nét đứt: 2px vẽ, 2px trống
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 10);
      ctx.stroke();
      ctx.setLineDash([]); // Reset nét đứt
    });

    // Vẽ vòng tròn highlight khi hover thành phố
    if (hoveredIdx !== null && hoveredIdx !== undefined) {
      const cap = activeThreeCities[hoveredIdx];
      const temp = cap.temp;
      if (cap && temp !== null && temp !== undefined) {
        const { x, y } = projectCoords(cap.lat, cap.lon, W, H);

        // Vòng tròn trắng (highlight chính)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Vòng tròn xanh lá mờ (hào quang)
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 9: BIỂU ĐỒ NHIỆT ĐỘ CHÂU LỤC REALTIME
   *  
   *  LUỒNG XỬ LÝ:
   *  1. Gọi RestCountries API → lấy tọa độ thủ đô TẤT CẢ quốc gia
   *  2. Gọi Open-Meteo API → lấy nhiệt độ thực tế theo từng batch
   *  3. Gom nhóm theo châu lục → tính trung bình
   *  4. Cập nhật biểu đồ cột Chart.js
   * ═══════════════════════════════════════════════════════════ */

  // Danh sách cố định 25 thủ đô lớn đại diện cho 5 châu lục (tránh gọi RestCountries API dung lượng lớn và chậm)
  const STATIC_CAPITALS = [
    // Americas
    { label: 'Washington D.C.', region: 'Americas', lat: 38.90, lon: -77.03 },
    { label: 'Ottawa', region: 'Americas', lat: 45.42, lon: -75.69 },
    { label: 'Brasilia', region: 'Americas', lat: -15.79, lon: -47.88 },
    { label: 'Mexico City', region: 'Americas', lat: 19.43, lon: -99.13 },
    { label: 'Buenos Aires', region: 'Americas', lat: -34.60, lon: -58.38 },
    // Asia
    { label: 'Hà Nội', region: 'Asia', lat: 21.03, lon: 105.85 },
    { label: 'Tokyo', region: 'Asia', lat: 35.68, lon: 139.76 },
    { label: 'Beijing', region: 'Asia', lat: 39.90, lon: 116.40 },
    { label: 'New Delhi', region: 'Asia', lat: 28.61, lon: 77.20 },
    { label: 'Jakarta', region: 'Asia', lat: -6.20, lon: 106.82 },
    // Oceania
    { label: 'Canberra', region: 'Oceania', lat: -35.28, lon: 149.13 },
    { label: 'Wellington', region: 'Oceania', lat: -41.29, lon: 174.78 },
    { label: 'Suva', region: 'Oceania', lat: -18.12, lon: 178.44 },
    { label: 'Port Moresby', region: 'Oceania', lat: -9.44, lon: 147.18 },
    { label: 'Apia', region: 'Oceania', lat: -13.83, lon: -171.75 },
    // Europe
    { label: 'London', region: 'Europe', lat: 51.51, lon: -0.13 },
    { label: 'Paris', region: 'Europe', lat: 48.85, lon: 2.35 },
    { label: 'Berlin', region: 'Europe', lat: 52.52, lon: 13.40 },
    { label: 'Rome', region: 'Europe', lat: 41.90, lon: 12.50 },
    { label: 'Madrid', region: 'Europe', lat: 40.41, lon: -3.70 },
    // Africa
    { label: 'Cairo', region: 'Africa', lat: 30.04, lon: 31.23 },
    { label: 'Pretoria', region: 'Africa', lat: -25.75, lon: 28.19 },
    { label: 'Nairobi', region: 'Africa', lat: -1.29, lon: 36.82 },
    { label: 'Lagos', region: 'Africa', lat: 6.52, lon: 3.38 },
    { label: 'Algiers', region: 'Africa', lat: 36.75, lon: 3.06 }
  ];

  const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

  /**
   * initRealtimeDashboard(): Khởi tạo dashboard realtime
   * 
   * BAO GỒM:
   * 1. Tạo biểu đồ cột Chart.js (Continental Bar Chart)
   * 2. Tải dữ liệu thủ đô + nhiệt độ
   * 3. Tính trung bình nhiệt độ theo châu lục
   * 4. Cập nhật bản đồ nhiệt + chip + biểu đồ
   * 5. Thiết lập sự kiện mousemove cho tooltip
   * 6. Tự động refresh mỗi 10 phút
   */
  async function initRealtimeDashboard() {
    if (dashboardChartLoaded) return; // Đã tải rồi → bỏ qua
    dashboardChartLoaded = true;

    const canvas = document.getElementById('continentChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (realtimeChart) realtimeChart.destroy();

    // Khởi tạo biểu đồ cột Chart.js (nhiệt độ các châu lục)
    realtimeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['C. Mỹ', 'C. Á', 'C. Đ.Dương', 'C. Âu', 'C. Phi'],
        datasets: [{
          label: 'Nhiệt độ (°C)',
          data: [0, 0, 0, 0, 0],     // Giá trị ban đầu = 0 (sẽ cập nhật sau)
          backgroundColor: [
            'rgba(59, 130, 246, 0.85)',   // Xanh dương - Châu Mỹ
            'rgba(16, 185, 129, 0.85)',   // Xanh lá - Châu Á
            'rgba(234, 179, 8, 0.85)',    // Vàng - Châu Đại Dương
            'rgba(249, 115, 22, 0.85)',   // Cam - Châu Âu
            'rgba(239, 68, 68, 0.85)'    // Đỏ - Châu Phi
          ],
          borderRadius: 6,              // Bo tròn góc cột
          borderSkipped: false,          // Bo tròn cả đáy cột
          barPercentage: 0.55            // Chiều rộng cột = 55% khoảng cách
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 22, 13, 0.95)',
            titleColor: '#4ade80',
            bodyColor: '#fff',
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => context.parsed.y + '°C'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: {
              color: 'rgba(255, 255, 255, 0.5)',
              font: { size: 10, family: "'Be Vietnam Pro', sans-serif" },
              stepSize: 10,
              callback: (value) => value + '°'
            },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              color: 'rgba(255, 255, 255, 0.75)',
              font: { size: 10, family: "'Be Vietnam Pro', sans-serif" }
            },
            border: { display: false }
          }
        }
      }
    });

    /**
     * refreshRealtimeData(): Tải lại dữ liệu realtime từ API
     * 
     * LUỒNG XỬ LÝ:
     * 1. Gọi RestCountries API → lấy tọa độ tất cả thủ đô
     * 2. Gọi Open-Meteo API → lấy nhiệt độ từng thủ đô (theo batch)
     * 3. Gom nhóm nhiệt độ theo châu lục (Americas, Asia, Europe...)
     * 4. Tính trung bình cộng mỗi châu lục
     * 5. Cập nhật biểu đồ cột + bản đồ nhiệt + chip nhiệt độ
     * 6. Cập nhật AQI Hà Nội
     */
    async function refreshRealtimeData() {
      try {
        // Tạo URL gọi hàng loạt tọa độ từ Open-Meteo trong 1 request duy nhất
        const lats = STATIC_CAPITALS.map(c => c.lat.toFixed(2)).join(',');
        const lons = STATIC_CAPITALS.map(c => c.lon.toFixed(2)).join(',');
        const multiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m`;

        const res = await fetch(multiUrl);
        if (!res.ok) throw new Error('Failed to load live temperature data');
        const jsonList = await res.json();
        
        // Open-Meteo trả về một mảng chứa dữ liệu của 25 địa điểm
        const capitalTemps = jsonList.map((item) => item.current ? item.current.temperature_2m : null);

        // Gom nhóm theo châu lục
        const regionTempsMap = new Map(REGION_SERIES.map((region) => [region.api, []]));
        
        STATIC_CAPITALS.forEach((capital, index) => {
          const temp = capitalTemps[index];
          if (temp === null || temp === undefined) return;
          if (!regionTempsMap.has(capital.region)) return;
          regionTempsMap.get(capital.region).push(temp);
        });

        // Tính trung bình cộng nhiệt độ mỗi châu lục
        const regionTemps = REGION_SERIES.map((region) => {
          const temps = regionTempsMap.get(region.api) || [];
          if (!temps.length) return null;
          const sum = temps.reduce((acc, value) => acc + value, 0);
          return sum / temps.length;
        });

        // Cập nhật biểu đồ cột
        realtimeChart.data.labels = REGION_SERIES.map((region) => region.label);
        realtimeChart.data.datasets[0].backgroundColor = REGION_SERIES.map((region) => region.color);
        realtimeChart.data.datasets[0].data = regionTemps.map((value) => value !== null ? parseFloat(value.toFixed(1)) : 0);
        realtimeChart.update();

        // Cập nhật nhiệt độ cho 3 thành phố đại diện trên bản đồ
        for (let i = 0; i < activeThreeCities.length; i++) {
          const city = activeThreeCities[i];
          try {
            const r = await fetch(OPEN_METEO_URL + '?latitude=' + city.lat + '&longitude=' + city.lon + '&current=temperature_2m');
            if (r.ok) {
              const j = await r.json();
              if (j && j.current) {
                const liveTemp = j.current.temperature_2m;
                city.temp = liveTemp;
                if (chipEls[i]) {
                  chipEls[i].innerHTML = `<span style="opacity: 0.6; font-weight: normal; margin-right: 4px;">${city.label}:</span>${liveTemp.toFixed(1)}°C`;
                }
              }
            }
          } catch (e) {
            console.warn(`Lỗi tải nhiệt độ cho ${city.label}:`, e);
          }
        }

        // Lưu dữ liệu và vẽ lại bản đồ nhiệt
        activeCapitals = STATIC_CAPITALS;
        activeTemps = capitalTemps;
        drawWorldHeatmap(hoveredIndex);

        // Tính nhiệt độ toàn cầu trung bình từ các thủ đô
        const validCapitalTemps = capitalTemps.filter((value) => value !== null && value !== undefined);
        const globalAvg = validCapitalTemps.length ? (validCapitalTemps.reduce((a, b) => a + b, 0) / validCapitalTemps.length) : FALLBACK_DATA.globalTemp;
        document.getElementById('valGlobalTemp').innerText = parseFloat(globalAvg.toFixed(1)) + '°C';
        document.getElementById('valTempChange').innerText = '(Live API)';
        const valTempUpdatedEl = document.getElementById('valTempUpdated');
        if (valTempUpdatedEl) valTempUpdatedEl.textContent = 'Cập nhật lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Cập nhật AQI Hà Nội
        const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.02&longitude=105.83&current=european_aqi');
        const aqiData = await aqiRes.json();
        if (aqiData && aqiData.current && aqiData.current.european_aqi) {
          const aqi = aqiData.current.european_aqi;
          const aqiPct = Math.min(100, Math.round(((aqi - 1) / 4) * 100));
          document.getElementById('valAqi').innerText = aqiPct + '%';
          document.getElementById('aqBar').style.width = Math.min(aqiPct, 100) + '%';
        }
      } catch (error) {
        console.error('API Error - Falling back to local data:', error);
        activeCapitals = null;
        activeTemps = null;
        drawWorldHeatmap(null);
        const fallbackTemp = FALLBACK_DATA.globalTemp.toFixed(1) + '°C';
        document.getElementById('valGlobalTemp').innerText = fallbackTemp;
        document.getElementById('valTempChange').innerText = '(Dữ liệu dự phòng)';
        const valTempUpdatedFb = document.getElementById('valTempUpdated');
        if (valTempUpdatedFb) valTempUpdatedFb.textContent = 'Không lấy được dữ liệu live, đang dùng dữ liệu dự phòng';
        
        // CẬP NHẬT BIỂU ĐỒ VỚI DỮ LIỆU DỰ PHÒNG CHÂU LỤC
        realtimeChart.data.labels = REGION_SERIES.map((region) => region.label);
        realtimeChart.data.datasets[0].backgroundColor = REGION_SERIES.map((region) => region.color);
        realtimeChart.data.datasets[0].data = [20.5, 26.2, 21.8, 12.4, 25.0];
        realtimeChart.update();
      }
    }

    /* ═══════════════════════════════════════════════════════════
     *  CHỨC NĂNG 10: TƯƠNG TÁC DI CHUỘT - TOOLTIP THÀNH PHỐ
     *  
     *  - Lắng nghe sự kiện mousemove trên Canvas bản đồ
     *  - Tính khoảng cách Euclid giữa con trỏ và mỗi thành phố
     *  - Nếu gần hơn 16px → hiển thị tooltip với thông tin thành phố
     *  
     *  CÔNG THỨC KHOẢNG CÁCH EUCLID:
     *  d = √((x_mouse - x_city)² + (y_mouse - y_city)²)
     *  Trong code: Math.hypot(mouseX - x, mouseY - y)
     * ═══════════════════════════════════════════════════════════ */
    const wc = document.getElementById('worldCanvas');
    if (wc) {
      // Sự kiện di chuột trên Canvas
      wc.addEventListener('mousemove', (e) => {
        const rect = wc.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;  // Tọa độ chuột tương đối Canvas
        const mouseY = e.clientY - rect.top;

        let closestIdx = null;
        let minDist = 16; // Ngưỡng khoảng cách tối đa (16 pixels)

        const W = rect.width || wc.clientWidth || 300;
        const H = rect.height || wc.clientHeight || 180;

        // Tìm thành phố gần nhất với con trỏ chuột
        activeThreeCities.forEach((cap, idx) => {
          const temp = cap.temp;
          if (temp === null || temp === undefined) return;

          const { x, y } = projectCoords(cap.lat, cap.lon, W, H);
          
          /**
           * Math.hypot(a, b): Tính √(a² + b²) - Khoảng cách Euclid
           * Tương đương: Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2))
           * Nhưng ngắn gọn và chính xác hơn
           */
          const dist = Math.hypot(mouseX - x, mouseY - y);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        // Chỉ cập nhật nếu thành phố gần nhất THAY ĐỔI
        if (closestIdx !== hoveredIndex) {
          hoveredIndex = closestIdx;
          drawWorldHeatmap(hoveredIndex); // Vẽ lại bản đồ với highlight

          // Tạo hoặc tìm tooltip element
          let tooltip = document.getElementById('mapTooltip');
          if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'mapTooltip';
            tooltip.className = 'map-tooltip';
            wc.parentElement.appendChild(tooltip);
          }

          if (hoveredIndex !== null) {
            // HIỂN THỊ TOOLTIP với thông tin thành phố
            const cap = activeThreeCities[hoveredIndex];
            const temp = cap.temp;

            const { x, y } = projectCoords(cap.lat, cap.lon, W, H);
            const canvasLeft = wc.offsetLeft;
            const canvasTop = wc.offsetTop;

            tooltip.innerHTML = `
              <div style="font-weight: 700; color: #3ddc84; font-size: 0.75rem;">${cap.label}</div>
              <div style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); margin-top: 1px;">${cap.country || cap.region}</div>
              <div style="font-size: 0.8rem; font-weight: 800; margin-top: 4px; color: #fff;">${temp.toFixed(1)}°C</div>
            `;

            tooltip.style.left = `${canvasLeft + x}px`;
            tooltip.style.top = `${canvasTop + y}px`;
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = 'translate(-50%, -100%) scale(1)';
            wc.style.cursor = 'pointer';
          } else {
            // ẨN TOOLTIP khi không hover thành phố nào
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translate(-50%, -100%) scale(0.9)';
            wc.style.cursor = 'default';
          }
        }
      });

      // Sự kiện chuột rời khỏi Canvas → ẩn tooltip
      wc.addEventListener('mouseleave', () => {
        if (hoveredIndex !== null) {
          hoveredIndex = null;
          drawWorldHeatmap(null);
          const tooltip = document.getElementById('mapTooltip');
          if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translate(-50%, -100%) scale(0.9)';
          }
          wc.style.cursor = 'default';
        }
      });
    }

    /**
     * XỬ LÝ RESIZE CỬA SỔ:
     * - Khi người dùng thay đổi kích thước trình duyệt
     * - Debounce 100ms: chờ 100ms sau lần resize cuối cùng mới vẽ lại
     * - Tránh vẽ lại hàng chục lần/giây khi kéo cửa sổ
     */
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        drawWorldHeatmap(hoveredIndex);
      }, 100);
    });

    // Gọi tải dữ liệu lần đầu
    await refreshRealtimeData();

    // Tự động refresh mỗi 10 phút (10 × 60 × 1000 = 600,000ms)
    setInterval(refreshRealtimeData, 10 * 60 * 1000);
  }

  /* ═══════════════════════════════════════════════════════════
   *  KHỞI TẠO DASHBOARD (Init Dashboard)
   *  
   *  Gọi 3 hàm chính theo thứ tự:
   *  1. renderDashboard() - Render biểu đồ + số liệu tĩnh
   *  2. initRealtimeDashboard() - Khởi tạo dữ liệu realtime
   *  3. initConsoleLogs() - Khởi tạo nhật ký console
   * ═══════════════════════════════════════════════════════════ */
  function initDashboard() {
    renderDashboard();        // Render Dashboard cơ bản
    initRealtimeDashboard();  // Khởi tạo realtime data
    initConsoleLogs();        // Khởi tạo console log
  }

  // Chờ DOM sẵn sàng rồi mới chạy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})(); // Kết thúc IIFE
