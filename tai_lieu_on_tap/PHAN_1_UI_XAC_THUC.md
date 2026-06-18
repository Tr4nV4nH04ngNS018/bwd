# 🚪 TÀI LIỆU ÔN THI & BẢO VỆ ĐỒ ÁN - PHẦN 1: GIAO DIỆN HUD, XÁC THỰC & BẦU TRỜI SAO 3D

Tài liệu này được biên soạn đầy đủ và chi tiết dành riêng cho thành viên phụ trách **Phần 1**. Bạn chỉ cần đọc kỹ và học thuộc file này để tự tin trả lời mọi câu hỏi của hội đồng cũng như code lại toàn bộ phần việc của mình.

---

## 📂 Danh sách các file quản lý
1.  [login.html](file:///c:/Users/ACER/Downloads/CNW/bwd/login.html), [register.html](file:///c:/Users/ACER/Downloads/CNW/bwd/register.html), [forgot-password.html](file:///c:/Users/ACER/Downloads/CNW/bwd/forgot-password.html): Giao diện HTML của các trang xác thực.
2.  [login.css](file:///c:/Users/ACER/Downloads/CNW/bwd/login.css): Định nghĩa hiệu ứng Glassmorphism & HUD.
3.  [app.js](file:///c:/Users/ACER/Downloads/CNW/bwd/app.js): Xử lý dropdown user & đồng bộ session đăng nhập.
4.  [auth.js](file:///c:/Users/ACER/Downloads/CNW/bwd/auth.js): Động cơ lưu trữ danh sách tài khoản & kiểm tra đăng nhập/đăng ký/OTP quên mật khẩu.
5.  [js/universeBg.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/universeBg.js): Dựng không gian 3D bầu trời sao và dải sao băng rơi cho nền trang xác thực.

---

## 🛠️ TOÀN BỘ MÃ NGUỒN CHI TIẾT (COMPLETE CODE)

### 1. File [app.js](file:///c:/Users/ACER/Downloads/CNW/bwd/app.js) (Toàn bộ mã nguồn)
```javascript
(function () {
  'use strict';

  // ── Tailwind CSS configuration theme ──
  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['Fraunces', 'serif'],
          body: ['Be Vietnam Pro', 'sans-serif'],
        },
        colors: {
          eco: {
            green: '#3ddc84',
            glow: '#22c55e',
            dark: '#0a1a0f',
            glass: 'rgba(255,255,255,0.08)',
          },
        },
        backdropBlur: {
          xs: '2px',
          glass: '18px',
          heavy: '32px',
        },
      },
    },
  };

  // ── Shared User Dropdown & Authentication UI ──
  function initAuthUI() {
    const currentUser = localStorage.getItem('current_user');
    const loginBtns = document.querySelectorAll('.btn-login');
    if (loginBtns.length === 0) return;

    loginBtns.forEach(loginBtn => {
      if (currentUser) {
        const user = JSON.parse(currentUser);
        loginBtn.innerHTML = `${user.fullname} <span style="margin-left: 8px;">▼</span>`;
        loginBtn.href = '#';
        loginBtn.style.cursor = 'pointer';
        loginBtn.onclick = function (event) {
          event.preventDefault();
          showLogoutMenu(this, user);
        };
      } else {
        loginBtn.innerHTML = 'Đăng nhập';
        loginBtn.href = 'login.html';
        loginBtn.style.cursor = 'pointer';
        loginBtn.onclick = null;
      }
    });

    function showLogoutMenu(btn, user) {
      let menu = document.getElementById('auth-dropdown-menu');
      if (menu) {
        menu.remove();
        return;
      }

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

      document.getElementById('logout-btn').addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('current_user');
        window.location.href = 'index.html';
      });

      document.addEventListener('click', function (event) {
        if (event.target !== btn && !menu.contains(event.target)) {
          menu.remove();
        }
      }, { once: true });
    }
  }

  // ── Premium loading screen fade-out control ──
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

  // Safety fallback timeout (6 seconds)
  setTimeout(window.triggerPageLoaded, 6000);

  // Trigger load immediately if THREE is not defined or there are no 3D elements/scripts on the page
  window.addEventListener('load', () => {
    if (typeof THREE === 'undefined') {
      window.triggerPageLoaded();
    } else {
      const has3D = document.querySelector('script[src*="bg3d.js"]') || 
                    document.querySelector('script[src*="universeBg.js"]') || 
                    document.getElementById('orbContainer') ||
                    document.getElementById('bg3d');
      if (!has3D) {
        window.triggerPageLoaded();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  } else {
    initAuthUI();
  }
})();
```

### 2. File [auth.js](file:///c:/Users/ACER/Downloads/CNW/bwd/auth.js) (Toàn bộ mã nguồn)
```javascript
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

  window.addEventListener('load', window.triggerPageLoaded);
  setTimeout(window.triggerPageLoaded, 4000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### 3. File [js/universeBg.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/universeBg.js) (Toàn bộ mã nguồn)
```javascript
(function() {
  // Container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:-2;overflow:hidden;background:#050a08;';
  document.body.prepend(container);

  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a08, 0.0002); 

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 1000;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Particles (Stars)
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  const color1 = new THREE.Color(0x4ade80); // Green
  const color2 = new THREE.Color(0x7dd3fc); // Cyan
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 3000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3000;

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3]     = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Circle texture for stars
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 12, 
    vertexColors: true,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 1.0 
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Shooting Stars (Sao băng)
  const shootingStars = [];
  const starGeo = new THREE.CylinderGeometry(0.5, 4.0, 120, 4);
  starGeo.rotateX(Math.PI / 2);
  const starMat = new THREE.MeshBasicMaterial({ 
    color: 0x86efac, 
    transparent: true, 
    opacity: 1.0, 
    blending: THREE.AdditiveBlending
  });
  
  for (let i = 0; i < 7; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 1500);
    star.userData = {
      velocity: new THREE.Vector3((Math.random() > 0.5 ? 1 : -1) * (Math.random() * 30 + 20), -Math.random() * 30 - 15, 0),
      resetDelay: Math.random() * 200
    };
    scene.add(star);
    shootingStars.push(star);
  }

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation Loop
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.5;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.5;
  });

  function animate() {
    requestAnimationFrame(animate);
    
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;
    
    shootingStars.forEach(star => {
      if (star.userData.resetDelay > 0) {
        star.userData.resetDelay--;
        star.visible = false;
      } else {
        star.visible = true;
        star.position.add(star.userData.velocity);
        
        const dir = star.userData.velocity.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, dir).normalize();
        const radians = Math.acos(up.dot(dir));
        star.quaternion.setFromAxisAngle(axis, radians);
        
        if (star.position.x > 1500 || star.position.x < -1500 || star.position.y < -1000) {
          star.position.set((Math.random() - 0.5) * 2000, 1000 + Math.random() * 500, (Math.random() - 0.5) * 1500);
          star.userData.resetDelay = Math.random() * 400 + 100; 
          star.userData.velocity.set((Math.random() > 0.5 ? 1 : -1) * (Math.random() * 30 + 20), -Math.random() * 30 - 15, 0);
        }
      }
    });

    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  
  animate();
})();
```

---

## 🔍 GIẢI THÍCH CHI TIẾT TỪNG DÒNG CODE CỦA BẠN

### 1. Quản lý Đăng nhập & Đăng ký bằng `localStorage`
*   `localStorage.setItem('key', value)`: Lưu chuỗi thông tin vào trình duyệt. Bản chất dữ liệu chỉ lưu dạng string nên bắt buộc phải ép kiểu thành JSON string thông qua `JSON.stringify(users)`.
*   `JSON.parse(localStorage.getItem('mock_users_v1'))`: Lấy chuỗi JSON thô từ trình duyệt và dịch ngược thành mảng đối tượng JavaScript để có thể lọc tài khoản.
*   `users.push(...)`: Đẩy thêm tài khoản mới vào mảng dữ liệu sau khi đã thực hiện xong các bước xác nhận logic.

### 2. Thiết lập bầu trời sao hạt và Parallax của camera
*   `Float32Array(particleCount * 3)`: Tạo mảng phẳng tốc độ cao lưu trữ các bộ 3 số thực ($x, y, z$) làm tọa độ không gian cho 2,000 hạt sao.
*   `mixedColor = color1.clone().lerp(color2, Math.random())`: Tính toán nội suy pha trộn ngẫu nhiên màu sắc giữa Xanh lá (`0x4ade80`) và Xanh dương (`0x7dd3fc`) tạo nên dải sao lấp lánh có chiều sâu.
*   `camera.position.x += (mouseX - camera.position.x) * 0.02`: Thuật toán Lerp mượt mà. Giúp tọa độ Camera không đổi ngột dịch theo chuột mà trượt từ từ, tạo hiệu ứng chuyển động Parallax dịu mắt.

---

## ❓ CÂU HỎI PHẢN BIỆN THƯỜNG GẶP CỦA HỘI ĐỒNG (VÀ ĐÁP ÁN)

1.  **Hỏi:** *Hệ thống đăng nhập/đăng ký hoạt động như thế nào khi không có cơ sở dữ liệu (Database)? Dữ liệu có bị mất khi tải lại trang không?*
    *   **Đáp:** Ứng dụng tận dụng bộ nhớ trình duyệt `localStorage` để lưu chuỗi JSON làm cơ sở dữ liệu tạm thời. Vì `localStorage` ghi trực tiếp xuống đĩa cứng thiết bị nên dữ liệu tài khoản sẽ được giữ nguyên vẹn kể cả khi tắt trình duyệt hay khởi động lại máy tính.
2.  **Hỏi:** *Làm thế nào để xoay đầu nhọn sao băng trùng khớp với hướng rơi chéo của nó?*
    *   **Đáp:** Ta sử dụng phép nhân Quaternion trong Three.js thông qua phương thức `quaternion.setFromAxisAngle(axis, radians)`. Trong đó, trục xoay `axis` là tích có hướng của vector hướng lên và vector vận tốc rơi, còn góc xoay `radians` là góc giữa 2 vector đó. Điều này bảo đảm đầu xi lanh sao băng luôn cắm đúng hướng rơi tự nhiên.

---

## ✍️ HƯỚNG DẪN VIẾT LẠI CODE MẪU TỐI GIẢN
Khi thầy cô yêu cầu viết code kiểm tra login thô bằng localStorage ngay tại chỗ, hãy viết đoạn này:

```javascript
function loginUser(email, password) {
  const users = JSON.parse(localStorage.getItem('mock_users_v1') || '[]');
  const match = users.find(u => u.email === email && u.password === password);
  if (match) {
    localStorage.setItem('current_user', JSON.stringify(match));
    alert('Đăng nhập thành công!');
  } else {
    alert('Sai email hoặc mật khẩu!');
  }
}
```
