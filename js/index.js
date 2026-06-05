(function () {
  'use strict';

  // ── Newsletter subscription handler ────────────────
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

  // ── Smooth scrolling for anchor links ──────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Live CO2 status updater (Fetches from live API and falls back) ──
  let previousCo2 = parseFloat(localStorage.getItem('lastCo2') || '421.7');
  const co2ValueEl = document.querySelector('.stat-card span.text-white');
  const co2StatusEl = document.getElementById('co2-status');

  async function updateCo2Status() {
    try {
      const co2Res = await fetch('https://global-warming.org/api/co2-api');
      if (!co2Res.ok) return;

      const co2Json = await co2Res.json();
      if (!co2Json.co2 || co2Json.co2.length === 0) return;

      const currentCo2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);
      const change = currentCo2 - previousCo2;
      const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
      const trend = change >= 0 ? 'tăng' : 'giảm';
      const trendColor = change >= 0 ? 'text-red-400' : 'text-green-400';

      if (co2ValueEl) co2ValueEl.textContent = `${currentCo2.toFixed(1)} ppm`;
      if (co2StatusEl) co2StatusEl.innerHTML = `${changeStr} ppm <span class="${trendColor}">(${trend})</span>`;

      previousCo2 = currentCo2;
      localStorage.setItem('lastCo2', currentCo2.toString());
    } catch (error) {
      console.warn('Lỗi cập nhật CO2 từ API:', error);
      // Fallback local simulation if API fails
      if (co2ValueEl) {
        const simulatedCo2 = previousCo2 + (Math.random() - 0.48) * 0.01;
        co2ValueEl.textContent = simulatedCo2.toFixed(1) + ' ppm';
      }
    }
  }

  // ── Scroll reveal — IntersectionObserver ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.counter').forEach(startCounter);
      entry.target.querySelectorAll('.sparkline').forEach(drawSparkline);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  // ── Animated Counters ──
  function startCounter(el) {
    if (el.dataset.started) return;
    el.dataset.started = '1';

    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1800; // ms
    const startTime = performance.now();

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = target * easeOut(progress);
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ── Sparkline Charts ──
  function drawSparkline(canvas) {
    if (canvas.dataset.drawn) return;
    canvas.dataset.drawn = '1';

    const values = canvas.dataset.values.split(',').map(Number);
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = 4;
    const min = Math.min(...values) * 0.92;
    const max = Math.max(...values) * 1.05;
    const range = max - min || 1;

    const points = values.map((v, i) => ({
      x: pad + (i / (values.length - 1)) * (W - pad * 2),
      y: pad + (1 - (v - min) / range) * (H - pad * 2),
    }));

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(74,222,128,0.25)');
    grad.addColorStop(1, 'rgba(74,222,128,0.00)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, H);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74,222,128,0.22)';
    ctx.fill();
  }

  // ── Hide scroll hint on scroll ──
  const scrollHint = document.querySelector('.fixed.bottom-6');
  if (scrollHint) {
    window.addEventListener('scroll', () => {
      scrollHint.style.opacity = window.scrollY > 120 ? '0' : '0.5';
      scrollHint.style.pointerEvents = window.scrollY > 120 ? 'none' : 'auto';
    }, { passive: true });
  }

  // ── Initialization ──
  function initIndex() {
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
    updateCo2Status();
    setInterval(updateCo2Status, 10 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndex);
  } else {
    initIndex();
  }
})();
