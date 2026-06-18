/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: auth.js
 *  MÔ TẢ: Xử lý toàn bộ hệ thống xác thực (Authentication) của EcoImpact
 *  DÙNG CHO: login.html, register.html, forgot-password.html
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1. MockAuth - Hệ thống xác thực giả lập dùng localStorage
 *     (Không cần backend/server, mọi thứ lưu trên trình duyệt)
 *  2. Xử lý trang Đăng nhập (Login)
 *  3. Xử lý trang Đăng ký (Register)
 *  4. Xử lý trang Quên mật khẩu (Forgot Password) với OTP mô phỏng
 *  5. Loading screen cho các trang auth (không có 3D)
 *  
 *  LƯU TRỮ DỮ LIỆU:
 *  - localStorage key 'mock_users_v1': Mảng JSON chứa tất cả tài khoản
 *  - localStorage key 'current_user': Thông tin người đang đăng nhập
 * ═══════════════════════════════════════════════════════════════════════
 */

(function () {
  /* ═══════════════════════════════════════════════════════════
   *  CẤU HÌNH TAILWIND CSS (giống app.js)
   * ═══════════════════════════════════════════════════════════ */
  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          body: ['Be Vietnam Pro', 'sans-serif'], // Font chữ chính
        },
      },
    },
  };

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 1: HỆ THỐNG XÁC THỰC GIẢ LẬP (MockAuth)
   *  
   *  TẠI SAO DÙNG MÔ PHỎNG?
   *  - Đồ án frontend không có backend/server
   *  - localStorage đóng vai trò "database" trên trình duyệt
   *  - Đầy đủ các chức năng: Đăng ký, Đăng nhập, Quên MK, Đặt lại MK
   *  
   *  CẤU TRÚC DỮ LIỆU TRONG localStorage:
   *  key: 'mock_users_v1'
   *  value: [{ id, fullname, email, password }, ...]
   * ═══════════════════════════════════════════════════════════ */

  /**
   * initMockAuth(): Khởi tạo hệ thống xác thực giả lập
   * - Định nghĩa các hàm CRUD cho tài khoản
   * - Gán vào window.MockAuth để gọi từ bất kỳ đâu
   * - Tự động tạo tài khoản test (seeding)
   */
  function initMockAuth() {
    const STORAGE_KEY = 'mock_users_v1'; // Key lưu trữ trong localStorage

    /**
     * loadUsers(): Đọc danh sách tài khoản từ localStorage
     * @returns {Array} Mảng các tài khoản [{ id, fullname, email, password }]
     */
    function loadUsers() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : []; // Parse JSON, trả về [] nếu chưa có
      } catch (error) { return []; }
    }

    /**
     * saveUsers(users): Lưu danh sách tài khoản vào localStorage
     * @param {Array} users - Mảng tài khoản cần lưu
     */
    function saveUsers(users) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch (error) { /* ignore */ }
    }

    /**
     * findUser(email): Tìm tài khoản theo email
     * @param {string} email - Email cần tìm
     * @returns {Object|undefined} Tài khoản tìm thấy hoặc undefined
     * 
     * Sử dụng .toLowerCase() để so sánh không phân biệt hoa/thường
     */
    function findUser(email) {
      const users = loadUsers();
      return users.find((user) => user.email.toLowerCase() === (email || '').toLowerCase());
    }

    /**
     * register({ fullname, email, password }): Đăng ký tài khoản mới
     * 
     * @param {Object} params - { fullname, email, password }
     * @returns {{ ok: boolean, error?: string }}
     * 
     * KIỂM TRA:
     * 1. Email và mật khẩu không được rỗng
     * 2. Email chưa tồn tại trong hệ thống
     * 3. Tạo id bằng Date.now() (timestamp mili giây) → đảm bảo duy nhất
     */
    function register({ fullname, email, password }) {
      if (!email || !password) return { ok: false, error: 'Email và mật khẩu bắt buộc.' };
      if (findUser(email)) return { ok: false, error: 'Email đã tồn tại.' };
      const users = loadUsers();
      users.push({ id: Date.now(), fullname: fullname || '', email, password });
      saveUsers(users);
      return { ok: true };
    }

    /**
     * login(email, password): Xác thực đăng nhập
     * 
     * @param {string} email - Email đăng nhập
     * @param {string} password - Mật khẩu
     * @returns {{ ok: boolean, user?: Object, error?: string }}
     * 
     * KIỂM TRA:
     * 1. Tài khoản có tồn tại không?
     * 2. Mật khẩu có khớp không? (so sánh trực tiếp string)
     * 
     * LƯU Ý: Trong thực tế, mật khẩu phải được hash (bcrypt/argon2)
     * Đây chỉ là mô phỏng cho đồ án
     */
    function login(email, password) {
      const user = findUser(email);
      if (!user) return { ok: false, error: 'Tài khoản không tồn tại.' };
      if (user.password !== password) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };
      return { ok: true, user: { id: user.id, fullname: user.fullname, email: user.email } };
    }

    /**
     * resetPassword(email, newPassword): Đặt lại mật khẩu
     * 
     * @param {string} email - Email tài khoản cần reset
     * @param {string} newPassword - Mật khẩu mới
     * @returns {{ ok: boolean, error?: string }}
     * 
     * Tìm tài khoản bằng email → cập nhật password → lưu lại
     */
    function resetPassword(email, newPassword) {
      const users = loadUsers();
      const index = users.findIndex((user) => user.email.toLowerCase() === (email || '').toLowerCase());
      if (index === -1) return { ok: false, error: 'Tài khoản không tồn tại.' };
      users[index].password = newPassword; // Cập nhật mật khẩu
      saveUsers(users);                    // Lưu lại vào localStorage
      return { ok: true };
    }

    /**
     * seedTestUser(): Tạo tài khoản test mặc định
     * 
     * Tài khoản: admin1122@gmail.com / 123456
     * Chỉ tạo nếu chưa tồn tại (tránh trùng lặp)
     * Giúp demo/thử nghiệm không cần đăng ký
     */
    function seedTestUser() {
      const testEmail = 'admin1122@gmail.com';
      const existing = findUser(testEmail);
      if (!existing) {
        register({ fullname: 'Admin Test', email: testEmail, password: '123456' });
        console.info('MockAuth: seeded test user', testEmail);
      }
    }

    // Gán tất cả hàm vào window.MockAuth để gọi từ bất kỳ đâu
    window.MockAuth = {
      loadUsers,
      saveUsers,
      findUser,
      register,
      login,
      resetPassword,
      seedTestUser,
    };

    // Tự động tạo tài khoản test khi khởi tạo
    try { seedTestUser(); } catch (error) { /* ignore */ }
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 2: XỬ LÝ TRANG ĐĂNG NHẬP (Login Page)
   *  
   *  - Toggle hiển thị/ẩn mật khẩu
   *  - Validate email + password
   *  - Gọi MockAuth.login() để xác thực
   *  - Lưu user vào localStorage → chuyển hướng về trang chủ
   * ═══════════════════════════════════════════════════════════ */

  /**
   * initLoginPage(): Khởi tạo xử lý cho trang đăng nhập
   * 
   * ELEMENTS TƯƠNG TÁC:
   * - .login-form: Form đăng nhập
   * - #email: Ô nhập email
   * - #password: Ô nhập mật khẩu
   * - [data-toggle-password]: Nút hiện/ẩn mật khẩu
   * - .message: Phần tử hiển thị thông báo lỗi/thành công
   */
  function initLoginPage() {
    const form = document.querySelector('.login-form');
    const passwordInput = document.querySelector('#password');
    const toggleButton = document.querySelector('[data-toggle-password]');
    const message = document.querySelector('.message');

    // Toggle hiển thị/ẩn mật khẩu
    if (toggleButton && passwordInput) {
      toggleButton.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password'; // Chuyển đổi type
        toggleButton.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleButton.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    if (!form) return; // Không phải trang login → dừng

    // Xử lý sự kiện submit form đăng nhập
    form.addEventListener('submit', (event) => {
      event.preventDefault(); // Ngăn tải lại trang

      // Lấy giá trị từ form
      const email = form.querySelector('#email')?.value.trim();
      const password = passwordInput?.value.trim();

      // Validate: kiểm tra không rỗng
      if (!email || !password) {
        if (message) {
          message.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu.';
          message.classList.add('error');
        }
        return;
      }

      // Gọi MockAuth để xác thực
      if (window.MockAuth) {
        const result = MockAuth.login(email, password);
        if (!result.ok) {
          // Đăng nhập THẤT BẠI → hiển thị lỗi
          if (message) {
            message.textContent = result.error || 'Đăng nhập thất bại.';
            message.classList.add('error');
          }
          return;
        }

        // Đăng nhập THÀNH CÔNG → lưu user vào localStorage
        if (result.user) {
          localStorage.setItem('current_user', JSON.stringify(result.user));
        }

        if (message) {
          message.textContent = 'Đăng nhập thành công (mô phỏng).';
          message.classList.remove('error');
        }

        // Sau 700ms → chuyển hướng về trang chủ
        setTimeout(() => { window.location.href = 'index.html'; }, 700);
        return;
      }

      // Fallback: không có MockAuth
      if (message) {
        message.textContent = 'Đăng nhập mô phỏng thành công. Kết nối API ở bước tiếp theo.';
        message.classList.remove('error');
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 3: XỬ LÝ TRANG ĐĂNG KÝ (Register Page)
   *  
   *  - Toggle hiển thị/ẩn mật khẩu (cho cả 2 ô: mật khẩu + xác nhận)
   *  - Validate: tên, email, mật khẩu ≥ 6 ký tự, mật khẩu khớp
   *  - Gọi MockAuth.register() để tạo tài khoản
   *  - Chuyển hướng về trang đăng nhập sau khi đăng ký thành công
   * ═══════════════════════════════════════════════════════════ */

  function initRegisterPage() {
    const form = document.querySelector('.login-form');
    const passwordInput = document.querySelector('#password');
    const confirmPasswordInput = document.querySelector('#confirm-password');
    const toggleButton = document.querySelector('[data-toggle-password]');
    const toggleConfirmButton = document.querySelector('[data-toggle-confirm-password]');
    const message = document.querySelector('.message');

    // Toggle hiện/ẩn mật khẩu chính
    if (toggleButton && passwordInput) {
      toggleButton.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        toggleButton.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleButton.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    // Toggle hiện/ẩn mật khẩu xác nhận
    if (toggleConfirmButton && confirmPasswordInput) {
      toggleConfirmButton.addEventListener('click', () => {
        const isHidden = confirmPasswordInput.type === 'password';
        confirmPasswordInput.type = isHidden ? 'text' : 'password';
        toggleConfirmButton.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleConfirmButton.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    if (!form) return;

    // Xử lý submit form đăng ký
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      // Lấy giá trị từ form
      const fullname = form.querySelector('#fullname')?.value.trim();
      const email = form.querySelector('#email')?.value.trim();
      const password = passwordInput?.value.trim();
      const confirmPassword = confirmPasswordInput?.value.trim();

      // VALIDATE 1: Kiểm tra đầy đủ thông tin
      if (!fullname || !email || !password || !confirmPassword) {
        if (message) {
          message.textContent = 'Vui lòng nhập đầy đủ thông tin.';
          message.classList.add('error');
        }
        return;
      }

      // VALIDATE 2: Mật khẩu phải khớp
      if (password !== confirmPassword) {
        if (message) {
          message.textContent = 'Mật khẩu không khớp. Vui lòng kiểm tra lại.';
          message.classList.add('error');
        }
        return;
      }

      // VALIDATE 3: Mật khẩu tối thiểu 6 ký tự
      if (password.length < 6) {
        if (message) {
          message.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
          message.classList.add('error');
        }
        return;
      }

      // Gọi MockAuth.register() để tạo tài khoản
      if (window.MockAuth) {
        const result = MockAuth.register({ fullname, email, password });
        if (!result.ok) {
          if (message) {
            message.textContent = result.error || 'Đăng ký thất bại.';
            message.classList.add('error');
          }
          return;
        }

        if (message) {
          message.textContent = 'Đăng ký thành công (mô phỏng). Bạn có thể đăng nhập ngay.';
          message.classList.remove('error');
        }

        // Sau 900ms → chuyển sang trang đăng nhập
        setTimeout(() => { window.location.href = 'login.html'; }, 900);
        return;
      }

      if (message) {
        message.textContent = 'Đăng ký mô phỏng thành công. Kết nối API ở bước tiếp theo.';
        message.classList.remove('error');
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 4: XỬ LÝ TRANG QUÊN MẬT KHẨU (Forgot Password)
   *  
   *  QUY TRÌNH 3 BƯỚC:
   *  Bước 1 (step-email): Nhập email → gửi mã OTP
   *  Bước 2 (step-verify): Nhập mã OTP → xác thực
   *  Bước 3 (step-reset): Nhập mật khẩu mới → đặt lại
   *  
   *  OTP MÔ PHỎNG:
   *  - Mã cố định: "123456" (hiển thị trên giao diện để test)
   *  - Hết hạn sau 10 phút
   *  - Nút "Gửi lại" có cooldown 30 giây
   * ═══════════════════════════════════════════════════════════ */

  function initForgotPasswordPage() {
    // Các form cho 3 bước
    const emailForm = document.querySelector('.form-email');
    const verifyForm = document.querySelector('.form-verify');
    const resetForm = document.querySelector('.form-reset');

    // Các bước (step) tương ứng
    const steps = {
      email: document.querySelector('.step-email'),
      verify: document.querySelector('.step-verify'),
      reset: document.querySelector('.step-reset'),
    };
    const message = document.querySelector('.message');
    const resendBtn = document.getElementById('resend-code');

    // Biến trạng thái OTP
    let otp = null;           // Mã OTP hiện tại
    let otpExpiry = null;     // Thời điểm hết hạn (timestamp)
    let userEmail = null;     // Email đang đặt lại mật khẩu
    let resendTimer = null;   // Timer cho cooldown nút "Gửi lại"

    /**
     * showStep(name): Hiển thị bước tương ứng, ẩn các bước khác
     * @param {string} name - Tên bước: 'email', 'verify', 'reset'
     */
    function showStep(name) {
      Object.values(steps).forEach((step) => { if (step) step.style.display = 'none'; });
      if (steps[name]) steps[name].style.display = '';
      if (message) {
        message.textContent = '';
        message.classList.remove('error');
      }
    }

    /**
     * startResendCooldown(seconds): Bắt đầu đếm ngược nút "Gửi lại"
     * 
     * @param {number} seconds - Số giây cooldown (mặc định: 30)
     * 
     * CƠ CHẾ:
     * - Disable nút và hiển thị đếm ngược: "Gửi lại (30s)", "Gửi lại (29s)"...
     * - Sau khi hết cooldown → enable lại nút
     * - Sử dụng setInterval mỗi 1 giây
     */
    function startResendCooldown(seconds = 30) {
      if (!resendBtn) return;
      resendBtn.disabled = true;           // Vô hiệu hóa nút
      let timer = seconds;
      resendBtn.textContent = `Gửi lại (${timer}s)`;

      // Đếm ngược mỗi giây
      resendTimer = setInterval(() => {
        timer -= 1;
        resendBtn.textContent = `Gửi lại (${timer}s)`;
        if (timer <= 0) {
          clearInterval(resendTimer);       // Dừng đếm ngược
          resendBtn.disabled = false;       // Kích hoạt lại nút
          resendBtn.textContent = 'Gửi lại';
        }
      }, 1000);
    }

    /**
     * generateOtp(): Tạo mã OTP mô phỏng
     * 
     * MÃ CỐ ĐỊNH: "123456" (để demo/test dễ dàng)
     * Hết hạn sau 10 phút (Date.now() + 10 * 60 * 1000)
     * In mã ra console.info và hiển thị trên giao diện
     */
    function generateOtp() {
      const code = '123456';                          // Mã OTP cố định
      otp = code;
      otpExpiry = Date.now() + 10 * 60 * 1000;       // Hết hạn sau 10 phút
      console.info('Simulated OTP for', userEmail, ':', code);

      // Hiển thị mã OTP trên giao diện (chỉ dùng cho mô phỏng)
      if (message) {
        message.innerHTML = `Mã xác nhận mới đã được gửi đến <strong>${userEmail}</strong> (mô phỏng).<br><span class="otp-preview">Mã: <strong>${code}</strong></span>`;
        message.classList.remove('error');
        message.classList.add('dev');
      }
    }

    /**
     * clearOtp(): Xóa trạng thái OTP sau khi xác thực thành công
     */
    function clearOtp() {
      otp = null;
      otpExpiry = null;
      userEmail = null;
      if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
      }
    }

    // ═══ BƯỚC 1: NHẬP EMAIL ═══
    if (emailForm) {
      emailForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const emailInput = document.querySelector('#fp-email');
        const email = emailInput?.value.trim();

        if (!email) {
          if (message) {
            message.textContent = 'Vui lòng nhập email.';
            message.classList.add('error');
          }
          return;
        }

        userEmail = email;
        generateOtp();              // Tạo mã OTP
        startResendCooldown(30);    // Bắt đầu cooldown 30 giây
        showStep('verify');          // Chuyển sang bước 2
      });
    }

    // ═══ BƯỚC 2: NHẬP MÃ OTP XÁC THỰC ═══
    if (verifyForm) {
      verifyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const codeInput = document.querySelector('#fp-code');
        const code = codeInput?.value.trim();

        // Validate: mã không được rỗng
        if (!code) {
          if (message) {
            message.textContent = 'Vui lòng nhập mã xác nhận.';
            message.classList.add('error');
          }
          return;
        }

        // Kiểm tra mã đã hết hạn chưa
        if (!otp || !otpExpiry || Date.now() > otpExpiry) {
          if (message) {
            message.textContent = 'Mã đã hết hạn. Vui lòng gửi lại.';
            message.classList.add('error');
          }
          return;
        }

        // So sánh mã nhập vào với mã đã tạo
        if (code !== otp) {
          if (message) {
            message.textContent = 'Mã không đúng. Vui lòng kiểm tra lại.';
            message.classList.add('error');
          }
          return;
        }

        // XÁC THỰC THÀNH CÔNG → chuyển sang bước 3
        clearOtp();           // Xóa OTP (dùng 1 lần)
        showStep('reset');    // Chuyển sang bước đặt lại mật khẩu
        if (message) message.textContent = '';
      });
    }

    // ═══ BƯỚC 3: ĐẶT LẠI MẬT KHẨU MỚI ═══
    if (resetForm) {
      resetForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const p1 = document.querySelector('#fp-new-password')?.value.trim();
        const p2 = document.querySelector('#fp-confirm-password')?.value.trim();

        // Validate: không được rỗng
        if (!p1 || !p2) {
          if (message) {
            message.textContent = 'Vui lòng nhập mật khẩu và xác nhận.';
            message.classList.add('error');
          }
          return;
        }

        // Validate: mật khẩu phải khớp
        if (p1 !== p2) {
          if (message) {
            message.textContent = 'Mật khẩu không khớp.';
            message.classList.add('error');
          }
          return;
        }

        // Validate: tối thiểu 6 ký tự
        if (p1.length < 6) {
          if (message) {
            message.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
            message.classList.add('error');
          }
          return;
        }

        // Gọi MockAuth.resetPassword() để cập nhật mật khẩu
        if (window.MockAuth && userEmail) {
          const result = MockAuth.resetPassword(userEmail, p1);
          if (!result.ok) {
            if (message) {
              message.textContent = result.error || 'Đặt lại mật khẩu thất bại.';
              message.classList.add('error');
            }
            return;
          }
        }

        if (message) {
          message.textContent = 'Mật khẩu đã được đặt lại thành công.';
          message.classList.remove('error');
        }

        // Sau 1.4 giây → chuyển sang trang đăng nhập
        setTimeout(() => { window.location.href = 'login.html'; }, 1400);
      });
    }

    // ═══ NÚT "GỬI LẠI" MÃ OTP ═══
    if (resendBtn) {
      resendBtn.addEventListener('click', () => {
        if (!userEmail) {
          if (message) {
            message.textContent = 'Không có email để gửi. Bắt đầu lại.';
            message.classList.add('error');
          }
          showStep('email'); // Quay lại bước 1
          return;
        }
        generateOtp();              // Tạo mã OTP mới
        startResendCooldown(30);    // Reset cooldown
        if (message) message.textContent = `Mã xác nhận mới đã được gửi đến ${userEmail} (mô phỏng).`;
      });
    }

    // Hiển thị bước 1 (nhập email) khi trang tải
    showStep('email');
  }

  /* ═══════════════════════════════════════════════════════════
   *  HÀM KHỞI TẠO TỔNG (Master Init)
   *  - Chạy tất cả các hàm init
   *  - Mỗi hàm tự kiểm tra xem có đúng trang không trước khi chạy
   * ═══════════════════════════════════════════════════════════ */
  function init() {
    initMockAuth();            // Khởi tạo hệ thống xác thực
    initLoginPage();           // Xử lý trang đăng nhập
    initRegisterPage();        // Xử lý trang đăng ký
    initForgotPasswordPage();  // Xử lý trang quên mật khẩu
  }

  /* ═══════════════════════════════════════════════════════════
   *  CHỨC NĂNG 5: LOADING SCREEN CHO TRANG AUTH
   *  
   *  - Trang auth không có 3D elements
   *  - Tắt loading screen ngay khi window load
   *  - Fallback timeout 4 giây (ngắn hơn app.js vì không có 3D)
   * ═══════════════════════════════════════════════════════════ */
  window.ecoImpactLoaded = false;
  window.triggerPageLoaded = function () {
    if (window.ecoImpactLoaded) return;
    window.ecoImpactLoaded = true;
    const loader = document.getElementById('loading-screen');
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.remove();
      }, 600);
    }
  };

  // Trang auth không có 3D → tắt loading ngay khi window load
  window.addEventListener('load', window.triggerPageLoaded);
  setTimeout(window.triggerPageLoaded, 4000); // Fallback 4 giây

  // Chờ DOM sẵn sàng rồi mới chạy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); // Kết thúc IIFE