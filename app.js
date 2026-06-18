/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: app.js
 *  MÔ TẢ: File JavaScript DÙNG CHUNG cho toàn bộ trang web EcoImpact
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1. Cấu hình Tailwind CSS (theme, fonts, colors)
 *  2. Quản lý trạng thái đăng nhập/đăng xuất (Authentication UI)
 *  3. Hiệu ứng Loading Screen cao cấp (fade-out khi tải xong)
 *  4. Fallback an toàn: tự tắt loading sau 6 giây nếu 3D load lâu
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * IIFE: Bọc toàn bộ code trong hàm tự thực thi
 * → Tạo phạm vi cục bộ, tránh xung đột biến toàn cục
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 1: CẤU HÌNH TAILWIND CSS
   *  - Mở rộng theme mặc định với font chữ và bảng màu tùy chỉnh
   *  - Được gọi trước khi Tailwind xử lý các class CSS
   * ═══════════════════════════════════════════════════════════ */
  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['Fraunces', 'serif'],          // Font tiêu đề (serif sang trọng)
          body: ['Be Vietnam Pro', 'sans-serif'],  // Font nội dung (sans-serif dễ đọc)
        },
        colors: {
          eco: {
            green: '#3ddc84',                          // Xanh lá chủ đạo EcoImpact
            glow: '#22c55e',                           // Xanh phát sáng (hiệu ứng glow)
            dark: '#0a1a0f',                           // Nền tối xanh đen
            glass: 'rgba(255,255,255,0.08)',            // Glassmorphism (kính mờ)
          },
        },
        backdropBlur: {
          xs: '2px',       // Blur nhẹ
          glass: '18px',   // Blur chuẩn glassmorphism
          heavy: '32px',   // Blur mạnh
        },
      },
    },
  };

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 2: QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP (Authentication UI)
   *  
   *  - Kiểm tra localStorage xem người dùng đã đăng nhập chưa
   *  - Nếu ĐÃ đăng nhập: Hiển thị tên người dùng + dropdown menu
   *  - Nếu CHƯA đăng nhập: Hiển thị nút "Đăng nhập" link tới login.html
   *  
   *  CƠ CHẾ LƯU TRỮ:
   *  - localStorage key: 'current_user'
   *  - Giá trị: JSON string chứa { id, fullname, email }
   * ═══════════════════════════════════════════════════════════ */

  /**
   * initAuthUI(): Khởi tạo giao diện xác thực người dùng
   * 
   * LUỒNG XỬ LÝ:
   * 1. Đọc thông tin người dùng từ localStorage
   * 2. Tìm tất cả nút '.btn-login' trên navbar
   * 3. Nếu đã đăng nhập → đổi nút thành tên + dropdown đăng xuất
   * 4. Nếu chưa đăng nhập → giữ nguyên nút "Đăng nhập"
   */
  function initAuthUI() {
    // Đọc thông tin người dùng hiện tại từ localStorage
    const currentUser = localStorage.getItem('current_user');

    // Tìm tất cả nút đăng nhập trên trang (có thể có nhiều nút: desktop + mobile)
    const loginBtns = document.querySelectorAll('.btn-login');
    if (loginBtns.length === 0) return; // Nếu không có nút nào → dừng

    loginBtns.forEach(loginBtn => {
      if (currentUser) {
        // ═══ NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ═══
        const user = JSON.parse(currentUser); // Parse JSON → object

        // Đổi nội dung nút thành: "Tên người dùng ▼"
        loginBtn.innerHTML = `${user.fullname} <span style="margin-left: 8px;">▼</span>`;
        loginBtn.href = '#';                    // Xóa link đăng nhập
        loginBtn.style.cursor = 'pointer';

        // Gán sự kiện click: mở dropdown menu
        loginBtn.onclick = function (event) {
          event.preventDefault();
          showLogoutMenu(this, user); // Hiển thị menu đăng xuất
        };
      } else {
        // ═══ NGƯỜI DÙNG CHƯA ĐĂNG NHẬP ═══
        loginBtn.innerHTML = 'Đăng nhập';
        loginBtn.href = 'login.html';           // Link tới trang đăng nhập
        loginBtn.style.cursor = 'pointer';
        loginBtn.onclick = null;                // Xóa sự kiện click cũ (nếu có)
      }
    });

    /**
     * showLogoutMenu(btn, user): Hiển thị dropdown menu đăng xuất
     * 
     * @param {HTMLElement} btn - Nút đăng nhập đã được nhấn
     * @param {Object} user - Thông tin người dùng { fullname, email }
     * 
     * TÍNH NĂNG:
     * - Hiển thị tên và email người dùng
     * - Nút "Bảng điều khiển" → link dashboard.html
     * - Nút "Đăng xuất" → xóa localStorage và chuyển về trang chủ
     * - Tự động đóng khi nhấn ra ngoài menu (click outside)
     */
    function showLogoutMenu(btn, user) {
      // Toggle: nếu menu đã mở → đóng lại
      let menu = document.getElementById('auth-dropdown-menu');
      if (menu) {
        menu.remove();
        return;
      }

      // Tạo phần tử DOM cho dropdown menu
      menu = document.createElement('div');
      menu.id = 'auth-dropdown-menu';
      menu.style.cssText = `
        position: absolute;
        top: ${btn.offsetTop + btn.offsetHeight + 8}px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        z-index: 1000;
        overflow: hidden;
      `;

      // Nội dung HTML của dropdown menu
      menu.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid rgba(0, 0, 0, 0.1); color: #333; font-size: 14px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${user.fullname}</div>
          <div style="color: #666; font-size: 12px;">${user.email}</div>
        </div>
        <a href="dashboard.html" style="display: block; padding: 10px 16px; color: #0d1b0f; text-decoration: none; font-size: 14px; border-bottom: 1px solid rgba(0, 0, 0, 0.1); transition: background 0.2s;">
          Bảng điều khiển
        </a>
        <a href="#" id="logout-btn" style="display: block; padding: 10px 16px; color: #d32f2f; text-decoration: none; font-size: 14px; transition: background 0.2s;">
          Đăng xuất
        </a>
      `;

      document.body.appendChild(menu);

      // Xử lý nút ĐĂNG XUẤT
      document.getElementById('logout-btn').addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('current_user'); // Xóa thông tin đăng nhập
        window.location.href = 'index.html';     // Chuyển về trang chủ
      });

      // Đóng menu khi nhấn ra ngoài (click outside pattern)
      // { once: true }: Chỉ lắng nghe 1 lần rồi tự hủy
      document.addEventListener('click', function (event) {
        if (event.target !== btn && !menu.contains(event.target)) {
          menu.remove(); // Xóa menu nếu nhấn ngoài
        }
      }, { once: true });
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 3: LOADING SCREEN CAO CẤP (Premium Loading)
   *  
   *  - Hiển thị màn hình loading với spinner khi trang đang tải
   *  - Tự ẩn (fade-out) khi nội dung 3D hoặc dữ liệu đã sẵn sàng
   *  - Có cơ chế FALLBACK TIMEOUT 6 giây (tránh loading vĩnh viễn)
   * ═══════════════════════════════════════════════════════════ */

  /**
   * window.ecoImpactLoaded: Cờ boolean đánh dấu trang đã tải xong chưa
   * → Ngăn triggerPageLoaded() được gọi nhiều lần
   */
  window.ecoImpactLoaded = false;

  /**
   * window.triggerPageLoaded(): Hàm tắt màn hình loading
   * 
   * CÁCH HOẠT ĐỘNG:
   * 1. Kiểm tra nếu đã tải rồi → bỏ qua (tránh gọi lặp)
   * 2. Thêm class 'fade-out' cho loading screen (kích hoạt CSS animation)
   * 3. Sau 600ms (thời gian animation) → xóa hẳn phần tử khỏi DOM
   * 
   * ĐƯỢC GỌI BỞI:
   * - bg3d.js khi scene 3D đã render xong
   * - calculator.js khi model 3D (.glb) đã load xong
   * - Fallback timeout sau 6 giây
   */
  window.triggerPageLoaded = function () {
    if (window.ecoImpactLoaded) return; // Đã tải rồi → bỏ qua
    window.ecoImpactLoaded = true;

    const loader = document.getElementById('loading-screen');
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');  // Kích hoạt animation mờ dần
      setTimeout(() => {
        loader.remove(); // Xóa hẳn loading screen khỏi DOM sau 600ms
      }, 600);
    }
  };

  /**
   * FALLBACK TIMEOUT: Tự động tắt loading sau 6 giây
   * 
   * TẠI SAO CẦN?
   * - Nếu file 3D (.glb) tải quá lâu hoặc lỗi mạng
   * - Nếu bg3d.js không gọi được triggerPageLoaded()
   * → Loading screen sẽ bị kẹt mãi mãi
   * → Timeout 6 giây đảm bảo người dùng luôn thấy được nội dung
   */
  setTimeout(window.triggerPageLoaded, 6000);

  /**
   * KIỂM TRA CÓ PHẦN TỬ 3D TRÊN TRANG KHÔNG:
   * 
   * - Nếu KHÔNG có Three.js hoặc không có script 3D → tắt loading ngay
   * - Nếu CÓ → đợi file 3D load xong gọi triggerPageLoaded()
   * 
   * Các trang KHÔNG có 3D: news.html, community.html, login.html
   * → Loading screen sẽ tắt ngay khi window.load
   */
  window.addEventListener('load', () => {
    if (typeof THREE === 'undefined') {
      // THREE.js chưa được tải → không có 3D → tắt loading ngay
      window.triggerPageLoaded();
    } else {
      // Kiểm tra xem có script/element 3D nào trên trang không
      const has3D = document.querySelector('script[src*="bg3d.js"]') || 
                    document.querySelector('script[src*="universeBg.js"]') || 
                    document.getElementById('orbContainer') ||
                    document.getElementById('bg3d');
      if (!has3D) {
        window.triggerPageLoaded(); // Không có 3D → tắt loading
      }
    }
  });

  /* ═══════════════════════════════════════════════════════════
   *  KHỞI TẠO KHI DOM SẴN SÀNG
   *  - Gọi initAuthUI() để cập nhật trạng thái đăng nhập trên navbar
   * ═══════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  } else {
    initAuthUI();
  }
})(); // Kết thúc IIFE