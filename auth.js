(function () {
  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          body: ['Be Vietnam Pro', 'sans-serif'],
        },
      },
    },
  };

  function initMockAuth() {
    const STORAGE_KEY = 'mock_users_v1';

    function loadUsers() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (error) { return []; }
    }

    function saveUsers(users) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch (error) { /* ignore */ }
    }

    function findUser(email) {
      const users = loadUsers();
      return users.find((user) => user.email.toLowerCase() === (email || '').toLowerCase());
    }

    function register({ fullname, email, password }) {
      if (!email || !password) return { ok: false, error: 'Email và mật khẩu bắt buộc.' };
      if (findUser(email)) return { ok: false, error: 'Email đã tồn tại.' };
      const users = loadUsers();
      users.push({ id: Date.now(), fullname: fullname || '', email, password });
      saveUsers(users);
      return { ok: true };
    }

    function login(email, password) {
      const user = findUser(email);
      if (!user) return { ok: false, error: 'Tài khoản không tồn tại.' };
      if (user.password !== password) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };
      return { ok: true, user: { id: user.id, fullname: user.fullname, email: user.email } };
    }

    function resetPassword(email, newPassword) {
      const users = loadUsers();
      const index = users.findIndex((user) => user.email.toLowerCase() === (email || '').toLowerCase());
      if (index === -1) return { ok: false, error: 'Tài khoản không tồn tại.' };
      users[index].password = newPassword;
      saveUsers(users);
      return { ok: true };
    }

    function seedTestUser() {
      const testEmail = 'admin1122@gmail.com';
      const existing = findUser(testEmail);
      if (!existing) {
        register({ fullname: 'Admin Test', email: testEmail, password: '123456' });
        console.info('MockAuth: seeded test user', testEmail);
      }
    }

    window.MockAuth = {
      loadUsers,
      saveUsers,
      findUser,
      register,
      login,
      resetPassword,
      seedTestUser,
    };

    try { seedTestUser(); } catch (error) { /* ignore */ }
  }

  function initLoginPage() {
    const form = document.querySelector('.login-form');
    const passwordInput = document.querySelector('#password');
    const toggleButton = document.querySelector('[data-toggle-password]');
    const message = document.querySelector('.message');

    if (toggleButton && passwordInput) {
      toggleButton.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        toggleButton.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleButton.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const email = form.querySelector('#email')?.value.trim();
      const password = passwordInput?.value.trim();

      if (!email || !password) {
        if (message) {
          message.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu.';
          message.classList.add('error');
        }
        return;
      }

      if (window.MockAuth) {
        const result = MockAuth.login(email, password);
        if (!result.ok) {
          if (message) {
            message.textContent = result.error || 'Đăng nhập thất bại.';
            message.classList.add('error');
          }
          return;
        }

        if (result.user) {
          localStorage.setItem('current_user', JSON.stringify(result.user));
        }

        if (message) {
          message.textContent = 'Đăng nhập thành công (mô phỏng).';
          message.classList.remove('error');
        }

        setTimeout(() => { window.location.href = 'index.html'; }, 700);
        return;
      }

      if (message) {
        message.textContent = 'Đăng nhập mô phỏng thành công. Kết nối API ở bước tiếp theo.';
        message.classList.remove('error');
      }
    });
  }

  function initRegisterPage() {
    const form = document.querySelector('.login-form');
    const passwordInput = document.querySelector('#password');
    const confirmPasswordInput = document.querySelector('#confirm-password');
    const toggleButton = document.querySelector('[data-toggle-password]');
    const toggleConfirmButton = document.querySelector('[data-toggle-confirm-password]');
    const message = document.querySelector('.message');

    if (toggleButton && passwordInput) {
      toggleButton.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        toggleButton.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleButton.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    if (toggleConfirmButton && confirmPasswordInput) {
      toggleConfirmButton.addEventListener('click', () => {
        const isHidden = confirmPasswordInput.type === 'password';
        confirmPasswordInput.type = isHidden ? 'text' : 'password';
        toggleConfirmButton.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleConfirmButton.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const fullname = form.querySelector('#fullname')?.value.trim();
      const email = form.querySelector('#email')?.value.trim();
      const password = passwordInput?.value.trim();
      const confirmPassword = confirmPasswordInput?.value.trim();

      if (!fullname || !email || !password || !confirmPassword) {
        if (message) {
          message.textContent = 'Vui lòng nhập đầy đủ thông tin.';
          message.classList.add('error');
        }
        return;
      }

      if (password !== confirmPassword) {
        if (message) {
          message.textContent = 'Mật khẩu không khớp. Vui lòng kiểm tra lại.';
          message.classList.add('error');
        }
        return;
      }

      if (password.length < 6) {
        if (message) {
          message.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
          message.classList.add('error');
        }
        return;
      }

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

        setTimeout(() => { window.location.href = 'login.html'; }, 900);
        return;
      }

      if (message) {
        message.textContent = 'Đăng ký mô phỏng thành công. Kết nối API ở bước tiếp theo.';
        message.classList.remove('error');
      }
    });
  }

  function initForgotPasswordPage() {
    const emailForm = document.querySelector('.form-email');
    const verifyForm = document.querySelector('.form-verify');
    const resetForm = document.querySelector('.form-reset');
    const steps = {
      email: document.querySelector('.step-email'),
      verify: document.querySelector('.step-verify'),
      reset: document.querySelector('.step-reset'),
    };
    const message = document.querySelector('.message');
    const resendBtn = document.getElementById('resend-code');

    let otp = null;
    let otpExpiry = null;
    let userEmail = null;
    let resendTimer = null;

    function showStep(name) {
      Object.values(steps).forEach((step) => { if (step) step.style.display = 'none'; });
      if (steps[name]) steps[name].style.display = '';
      if (message) {
        message.textContent = '';
        message.classList.remove('error');
      }
    }

    function startResendCooldown(seconds = 30) {
      if (!resendBtn) return;
      resendBtn.disabled = true;
      let timer = seconds;
      resendBtn.textContent = `Gửi lại (${timer}s)`;
      resendTimer = setInterval(() => {
        timer -= 1;
        resendBtn.textContent = `Gửi lại (${timer}s)`;
        if (timer <= 0) {
          clearInterval(resendTimer);
          resendBtn.disabled = false;
          resendBtn.textContent = 'Gửi lại';
        }
      }, 1000);
    }

    function generateOtp() {
      const code = '123456';
      otp = code;
      otpExpiry = Date.now() + 10 * 60 * 1000;
      console.info('Simulated OTP for', userEmail, ':', code);
      if (message) {
        message.innerHTML = `Mã xác nhận mới đã được gửi đến <strong>${userEmail}</strong> (mô phỏng).<br><span class="otp-preview">Mã: <strong>${code}</strong></span>`;
        message.classList.remove('error');
        message.classList.add('dev');
      }
    }

    function clearOtp() {
      otp = null;
      otpExpiry = null;
      userEmail = null;
      if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
      }
    }

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
        generateOtp();
        startResendCooldown(30);
        showStep('verify');
      });
    }

    if (verifyForm) {
      verifyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const codeInput = document.querySelector('#fp-code');
        const code = codeInput?.value.trim();
        if (!code) {
          if (message) {
            message.textContent = 'Vui lòng nhập mã xác nhận.';
            message.classList.add('error');
          }
          return;
        }
        if (!otp || !otpExpiry || Date.now() > otpExpiry) {
          if (message) {
            message.textContent = 'Mã đã hết hạn. Vui lòng gửi lại.';
            message.classList.add('error');
          }
          return;
        }
        if (code !== otp) {
          if (message) {
            message.textContent = 'Mã không đúng. Vui lòng kiểm tra lại.';
            message.classList.add('error');
          }
          return;
        }

        clearOtp();
        showStep('reset');
        if (message) message.textContent = '';
      });
    }

    if (resetForm) {
      resetForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const p1 = document.querySelector('#fp-new-password')?.value.trim();
        const p2 = document.querySelector('#fp-confirm-password')?.value.trim();
        if (!p1 || !p2) {
          if (message) {
            message.textContent = 'Vui lòng nhập mật khẩu và xác nhận.';
            message.classList.add('error');
          }
          return;
        }
        if (p1 !== p2) {
          if (message) {
            message.textContent = 'Mật khẩu không khớp.';
            message.classList.add('error');
          }
          return;
        }
        if (p1.length < 6) {
          if (message) {
            message.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
            message.classList.add('error');
          }
          return;
        }

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

        setTimeout(() => { window.location.href = 'login.html'; }, 1400);
      });
    }

    if (resendBtn) {
      resendBtn.addEventListener('click', () => {
        if (!userEmail) {
          if (message) {
            message.textContent = 'Không có email để gửi. Bắt đầu lại.';
            message.classList.add('error');
          }
          showStep('email');
          return;
        }
        generateOtp();
        startResendCooldown(30);
        if (message) message.textContent = `Mã xác nhận mới đã được gửi đến ${userEmail} (mô phỏng).`;
      });
    }

    showStep('email');
  }

  function init() {
    initMockAuth();
    initLoginPage();
    initRegisterPage();
    initForgotPasswordPage();
  }

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

  // Auth pages have no 3D elements, trigger on window load immediately
  window.addEventListener('load', window.triggerPageLoaded);
  setTimeout(window.triggerPageLoaded, 4000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();