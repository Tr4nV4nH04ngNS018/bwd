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

      const rect = btn.getBoundingClientRect();

      // Tạo phần tử DOM cho dropdown menu
      menu = document.createElement('div');
      menu.id = 'auth-dropdown-menu';
      menu.style.cssText = `
        position: absolute;
        top: ${rect.bottom + window.scrollY + 8}px;
        left: ${Math.max(10, rect.right + window.scrollX - 220)}px;
        width: 220px;
        background: rgba(10, 20, 14, 0.85);
        backdrop-filter: blur(20px) saturate(150%);
        -webkit-backdrop-filter: blur(20px) saturate(150%);
        border: 1px solid rgba(74, 222, 128, 0.3);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(74, 222, 128, 0.15);
        z-index: 1000;
        overflow: hidden;
        animation: navDropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Be Vietnam Pro', sans-serif;
      `;

      // Nội dung HTML của dropdown menu
      menu.innerHTML = `
        <div style="padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #fff;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 3px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.fullname}</div>
          <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email}</div>
        </div>
        <a href="dashboard.html" class="dropdown-item" style="display: block; padding: 12px 18px; color: rgba(255, 255, 255, 0.85); text-decoration: none; font-size: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s ease;">
          Bảng điều khiển
        </a>
        <a href="#" id="logout-btn" class="dropdown-item" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 14px; transition: all 0.2s ease;">
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
      setTimeout(() => {
        const handleOutsideClick = function (event) {
          // Nếu menu đã bị xóa khỏi DOM bởi hành động khác (ví dụ: click lại nút để đóng)
          if (!document.getElementById('auth-dropdown-menu')) {
            document.removeEventListener('click', handleOutsideClick);
            return;
          }
          if (!btn.contains(event.target) && !menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener('click', handleOutsideClick);
          }
        };
        document.addEventListener('click', handleOutsideClick);
      }, 0);
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