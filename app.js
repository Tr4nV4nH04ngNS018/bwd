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