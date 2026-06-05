(function () {
  'use strict';

  const container = document.getElementById('valGlobalTemp');
  if (!container || typeof Chart === 'undefined') return;

  let lineChart = null;
  let realtimeChart = null;
  let dashboardChartLoaded = false;

  const FALLBACK_DATA = {
    globalTemp: 14.5,
    tempChange: 0.9,
    co2: 421.7,
    aqi: 33,
    pm25: 12.5,
    pm10: 25.0,
    renewableRate: 15,
    carbonHistory: [
      { year: '2018', value: 408 },
      { year: '2019', value: 411 },
      { year: '2020', value: 414 },
      { year: '2021', value: 416 },
      { year: '2022', value: 418 },
      { year: '2023', value: 421 },
    ],
    renewableHistory: [
      { year: '2018', value: 2 },
      { year: '2020', value: 5 },
      { year: '2022', value: 10 },
      { year: '2023', value: 15 },
    ],
    news: [
      '<strong>Trực tiếp:</strong> Năng lượng tái tạo đang trở thành xu hướng chính toàn cầu...',
      'Lượng phát thải CO2 có dấu hiệu chững lại ở một số khu vực...',
      'Hội nghị chống biến đổi khí hậu công bố mục tiêu cắt giảm phát thải mới...',
      'Phát triển bền vững được các doanh nghiệp đặt lên hàng đầu...'
    ]
  };

  // ── Console Log Simulator ──
  function initConsoleLogs() {
    const logsEl = document.getElementById('commandLogs');
    if (!logsEl) return;

    const initialLogs = [
      'Connecting to Global Warming API...',
      '[OK] Connected to global-warming.org',
      'Fetching CO2 atmospheric trend data...',
      'Fetching NASA global temperature index...',
      '[OK] Syncing air quality with Open-Meteo API...',
      'Calculating local carbon offsets...',
      '[SYSTEM] Ready.'
    ];

    logsEl.innerHTML = '';
    initialLogs.forEach((log, index) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.textContent = `> ${log}`;
        logsEl.appendChild(div);
        logsEl.scrollTop = logsEl.scrollHeight;
      }, index * 250);
    });

    const periodicLogs = [
      'Ping global-warming.org (185ms)',
      'Checking LocalStorage session state...',
      'Ecosystem data sync: status nominal',
      'Redrawing interactive world map...',
      'Recalculating regional renewable averages...',
      'Caching Open-Meteo response (TTL 300s)'
    ];

    setInterval(() => {
      const randomLog = periodicLogs[Math.floor(Math.random() * periodicLogs.length)];
      const div = document.createElement('div');
      div.textContent = `> [${new Date().toLocaleTimeString('vi-VN', { hour12: false })}] ${randomLog}`;
      
      // Keep only last 10 log lines
      if (logsEl.children.length > 8) {
        logsEl.removeChild(logsEl.firstChild);
      }
      
      logsEl.appendChild(div);
      logsEl.scrollTop = logsEl.scrollHeight;
    }, 4500);
  }

  async function fetchDashboardData() {
    const data = JSON.parse(JSON.stringify(FALLBACK_DATA));

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
      try {
        const co2Res = await fetch('https://global-warming.org/api/co2-api');
        if (co2Res.ok) {
          const co2Json = await co2Res.json();
          if (co2Json.co2 && co2Json.co2.length > 0) {
            data.co2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);

            const history = [];
            const recentData = co2Json.co2.slice(-6);
            recentData.forEach((entry, index) => {
              const monthLabel = entry.month ? `Th${entry.month}` : `Th${index + 1}`;
              history.push({ year: monthLabel, value: parseFloat(entry.trend) });
            });
            if (history.length > 0) data.carbonHistory = history;
          }
        }
      } catch (error) { console.warn('Lỗi tải dữ liệu CO2', error); }

      try {
        const tempRes = await fetch('https://global-warming.org/api/temperature-api');
        if (tempRes.ok) {
          const tempJson = await tempRes.json();
          if (tempJson.result && tempJson.result.length > 0) {
            const latest = tempJson.result[tempJson.result.length - 1];
            data.tempChange = parseFloat(latest.land);
            data.globalTemp = parseFloat((14.0 + data.tempChange).toFixed(1));
          }
        }
      } catch (error) { console.warn('Lỗi tải dữ liệu Nhiệt độ', error); }

      try {
        const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.0285&longitude=105.8542&current=european_aqi,pm2_5,pm10');
        if (aqiRes.ok) {
          const aqiJson = await aqiRes.json();
          if (aqiJson.current) {
            data.aqi = aqiJson.current.european_aqi || data.aqi;
            data.pm25 = aqiJson.current.pm2_5 || data.pm25;
            data.pm10 = aqiJson.current.pm10 || data.pm10;
          }
        }
      } catch (error) { console.warn('Lỗi tải dữ liệu Chất lượng không khí', error); }

      return data;
    } catch (error) {
      console.error('Lỗi cập nhật dashboard, dùng dữ liệu dự phòng', error);
      return data;
    }
  }

  async function renderDashboard() {
    const data = await fetchDashboardData();
    const updatedAt = new Date();

    document.getElementById('valGlobalTemp').textContent = `${data.globalTemp.toFixed(1)}°C`;
    const tempSign = data.tempChange > 0 ? '+' : '';
    document.getElementById('valTempChange').textContent = `(${tempSign}${data.tempChange.toFixed(2)}°C)`;
    const valTempUpdated = document.getElementById('valTempUpdated');
    if (valTempUpdated) valTempUpdated.textContent = `Cập nhật lúc ${updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    document.getElementById('valCo2').textContent = data.co2.toFixed(1);
    const aqiPercent = Math.min(100, Math.round(((data.aqi - 1) / 4) * 100));
    document.getElementById('valAqi').textContent = `${aqiPercent}%`;

    document.getElementById('co2Bar').style.width = '74%';
    document.getElementById('aqBar').style.width = `${aqiPercent}%`;

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy();

    const lineLabels = data.carbonHistory.map((item) => item.year);
    const lineData = data.carbonHistory.map((item) => item.value);

    const gradient = lineCtx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(34,197,94,0.28)');
    gradient.addColorStop(1, 'rgba(34,197,94,0.00)');

    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: lineLabels,
        datasets: [{
          data: lineData,
          borderColor: '#22c55e',
          borderWidth: 2,
          pointBackgroundColor: '#22c55e',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          backgroundColor: gradient,
          tension: 0.42,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeInOutCubic' },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: 'rgba(10,22,13,0.92)',
          borderColor: 'rgba(34,197,94,0.4)',
          borderWidth: 1,
          titleColor: '#4ade80',
          bodyColor: '#fff',
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} ppm`,
          },
        }},
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
              maxTicksLimit: 6,
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' },
          },
        },
      },
    });

    const miniBarsEl = document.getElementById('miniBars');
    if (miniBarsEl) {
      miniBarsEl.innerHTML = '';
      data.renewableHistory.forEach((item) => {
        const bar = document.createElement('div');
        bar.className = 'mini-bar';
        bar.style.flex = '1 1 0';
        bar.title = `${item.year}: ${item.value.toFixed(1)}%`;
        bar.setAttribute('aria-label', `${item.year} - ${item.value.toFixed(1)} phần trăm điện từ năng lượng tái tạo`);
        bar.style.height = '0%';
        miniBarsEl.appendChild(bar);
        setTimeout(() => {
          const pct = Math.max(0, Math.min(100, item.value));
          bar.style.height = pct + '%';
        }, 400);
      });
    }

    const miniLabelsEl = document.getElementById('miniLabels');
    if (miniLabelsEl) {
      miniLabelsEl.innerHTML = '';
      const count = data.renewableHistory.length;
      const step = Math.max(1, Math.ceil(count / 4));
      data.renewableHistory.forEach((item, idx) => {
        const label = document.createElement('span');
        label.className = 'mini-label';
        label.style.flex = '1';
        label.style.textAlign = 'center';
        label.textContent = (idx % step === 0) ? item.year : '';
        miniLabelsEl.appendChild(label);
      });
    }

    const convEl = document.getElementById('renewableConversion');
    if (convEl) {
      convEl.textContent = 'Đang tính quy đổi 1% → năng lượng (renewables: trung bình 2018–2024)...';
      (async () => {
        try {
          const totalUrl = 'https://ourworldindata.org/grapher/electricity-generation.csv';
          const shareUrl = 'https://ourworldindata.org/grapher/share-electricity-renewables.csv';
          const [rTotal, rShare] = await Promise.all([fetch(totalUrl), fetch(shareUrl)]);
          if (!rTotal.ok || !rShare.ok) { convEl.textContent = 'Không tải được dữ liệu cần thiết từ nguồn OWID.'; return; }
          const [csvTotal, csvShare] = await Promise.all([rTotal.text(), rShare.text()]);
          const linesTotal = csvTotal.trim().split(/\r?\n/);
          const linesShare = csvShare.trim().split(/\r?\n/);
          const years = [2018,2019,2020,2021,2022,2023,2024];
          const renewPerYear = [];
          for (const y of years) {
            let totalLine = linesTotal.find(l => l.startsWith('World,') && l.includes(`,${y},`));
            if (!totalLine) totalLine = linesTotal.find(l => l.includes('OWID_WRL') && l.includes(`,${y},`));
            let shareLine = linesShare.find(l => l.startsWith('World,') && l.includes(`,${y},`));
            if (!shareLine) shareLine = linesShare.find(l => l.includes('OWID_WRL') && l.includes(`,${y},`));
            if (totalLine && shareLine) {
              const tparts = totalLine.split(/,|\t/);
              const sparts = shareLine.split(/,|\t/);
              const total = parseFloat(tparts[tparts.length - 1]);
              const share = parseFloat(sparts[sparts.length - 1]);
              if (!isNaN(total) && !isNaN(share)) {
                const renewTWh = total * (share / 100);
                renewPerYear.push({ year: y, total, share, renewTWh });
              }
            }
          }
          if (renewPerYear.length === 0) { convEl.textContent = 'Không tìm thấy dữ liệu renewables cho 2018–2024.'; return; }
          const sumRenew = renewPerYear.reduce((s,i)=>s + i.renewTWh, 0);
          const avgRenew = sumRenew / renewPerYear.length;
          const onepct = avgRenew * 0.01;
          convEl.textContent = `1% ≈ ${ onepct.toLocaleString('vi-VN', { maximumFractionDigits: 3 }) } TWh (renewables trung bình ${Math.round(avgRenew)} TWh/năm, ${renewPerYear.length} năm)`;
        } catch (e) {
          convEl.textContent = 'Lỗi khi tính quy đổi 1%: ' + (e && e.message ? e.message : e);
        }
      })();
    }

    const tickerInner = document.getElementById('tickerInner');
    if (tickerInner) {
      tickerInner.innerHTML = '';
      [...data.news, ...data.news].forEach((item) => {
        const span = document.createElement('span');
        span.innerHTML = item + ' &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; ';
        tickerInner.appendChild(span);
      });
    }
  }

  const leaders = [
    { rank: 1, name: 'Lê Hoàng Gia Bảo', contrib: '2600m', badge: 'gold', initials: 'LB', color: '#6ee7b7' },
    { rank: 2, name: 'Huỳnh Kim Linh', contrib: '200m', badge: 'bronze', initials: 'HL', color: '#a78bfa' },
    { rank: 3, name: 'Trần Văn Hoàng', contrib: '360m', badge: 'silver', initials: 'TH', color: '#f9a8d4' },
    { rank: 4, name: 'Võ Tá Dũng', contrib: '258m', badge: 'gold', initials: 'VD', color: '#fcd34d' },
    { rank: 5, name: 'Light', contrib: '277m', badge: 'bronze', initials: 'LI', color: '#7dd3fc' },
  ];

  const BADGE_SVG = {
    gold: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#f59e0b" opacity="0.9"/><path d="M12 3 L9 8 L3 8.5 L7.5 13 L6 19 L12 16 L18 19 L16.5 13 L21 8.5 L15 8 Z" fill="#fbbf24" opacity="0.7" transform="scale(0.65) translate(6.5,4)"/><circle cx="12" cy="14" r="5" fill="none" stroke="#fde68a" stroke-width="1"/></svg>`,
    silver: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#94a3b8" opacity="0.9"/><circle cx="12" cy="14" r="5" fill="none" stroke="#e2e8f0" stroke-width="1"/><path d="M9 14l2 2 4-4" stroke="#f1f5f9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    bronze: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#b45309" opacity="0.9"/><circle cx="12" cy="14" r="5" fill="none" stroke="#fcd34d" stroke-width="1"/><text x="12" y="18" text-anchor="middle" font-size="7" fill="#fef3c7" font-weight="bold">★</text></svg>`,
  };

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

  const REGION_SERIES = [
    { api: 'Americas', label: 'C. Mỹ', color: 'rgba(59, 130, 246, 0.85)' },
    { api: 'Asia', label: 'C. Á', color: 'rgba(16, 185, 129, 0.85)' },
    { api: 'Oceania', label: 'C. Đ.Dương', color: 'rgba(234, 179, 8, 0.85)' },
    { api: 'Europe', label: 'C. Âu', color: 'rgba(249, 115, 22, 0.85)' },
    { api: 'Africa', label: 'C. Phi', color: 'rgba(239, 68, 68, 0.85)' }
  ];

  const activeThreeCities = [
    { label: 'New York', country: 'Hoa Kỳ', region: 'Americas', lat: 40.71, lon: -74.01, temp: 15.5 },
    { label: 'Hà Nội', country: 'Việt Nam', region: 'Asia', lat: 21.03, lon: 105.85, temp: 28.5 },
    { label: 'Sydney', country: 'Úc', region: 'Oceania', lat: -33.87, lon: 151.21, temp: 20.1 }
  ];
  let activeCapitals = null;
  let activeTemps = null;
  let hoveredIndex = null;

  const chipEls = [document.getElementById('tempChip1'), document.getElementById('tempChip2'), document.getElementById('tempChip3')];
  for (let i = 0; i < chipEls.length; i++) {
    if (chipEls[i]) {
      chipEls[i].innerHTML = `<span style="opacity: 0.6; font-weight: normal; margin-right: 4px;">${activeThreeCities[i].label}:</span>${activeThreeCities[i].temp.toFixed(1)}°C`;
    }
  }

  function projectCoords(lat, lon, W, H) {
    const xPts = [
      [-180, 0.0],
      [-125, 0.144],
      [-74, 0.269],
      [0, 0.472],
      [73, 0.720],
      [106, 0.801],
      [140, 0.870],
      [180, 1.0]
    ];
    
    let xPct = (lon + 180) / 360;
    for (let i = 0; i < xPts.length - 1; i++) {
      const p1 = xPts[i], p2 = xPts[i+1];
      if (lon >= p1[0] && lon <= p2[0]) {
        const t = (lon - p1[0]) / (p2[0] - p1[0]);
        xPct = p1[1] + t * (p2[1] - p1[1]);
        break;
      }
    }

    const yPts = [
      [-90, 1.0],
      [-33.87, 0.821],
      [0, 0.609],
      [21.03, 0.472],
      [35.68, 0.385],
      [40.71, 0.345],
      [90, 0.0]
    ];

    let yPct = (90 - lat) / 180;
    for (let i = 0; i < yPts.length - 1; i++) {
      const p1 = yPts[i], p2 = yPts[i+1];
      if (lat >= p1[0] && lat <= p2[0]) {
        const t = (lat - p1[0]) / (p2[0] - p1[0]);
        yPct = p1[1] + t * (p2[1] - p1[1]);
        break;
      }
    }

    return { x: xPct * W, y: yPct * H };
  }

  function drawWorldHeatmap(hoveredIdx) {
    const wc = document.getElementById('worldCanvas');
    if (!wc) return;
    const ctx = wc.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = wc.getBoundingClientRect();
    
    const W = rect.width || wc.clientWidth || 300;
    const H = rect.height || wc.clientHeight || 180;
    
    wc.width = W * dpr;
    wc.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, H * i / 6); ctx.lineTo(W, H * i / 6); ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(W * i / 8, 0); ctx.lineTo(W * i / 8, H); ctx.stroke();
    }

    function tempColor(t) {
      if (t <= 0) return 'rgba(96, 165, 250, 0.8)';
      if (t <= 10) return 'rgba(74, 222, 128, 0.7)';
      if (t <= 20) return 'rgba(250, 204, 21, 0.7)';
      if (t <= 30) return 'rgba(251, 146, 60, 0.8)';
      return 'rgba(239, 68, 68, 0.85)';
    }

    activeThreeCities.forEach((cap) => {
      const temp = cap.temp;
      if (temp === null || temp === undefined) return;
      
      const { x, y } = projectCoords(cap.lat, cap.lon, W, H);
      if (y < 0 || y > H || x < 0 || x > W) return;

      const color = tempColor(temp);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 8);
      grd.addColorStop(0, color);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(x - 8, y - 8, 16, 16);

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    const canvasLeft = wc.offsetLeft;
    const canvasTop = wc.offsetTop;

    activeThreeCities.forEach((city, idx) => {
      const chipId = `tempChip${idx + 1}`;
      const chip = document.getElementById(chipId);
      if (!chip) return;
      const { x, y } = projectCoords(city.lat, city.lon, W, H);

      chip.style.left = `${canvasLeft + x}px`;
      chip.style.top = `${canvasTop + y}px`;
      chip.style.display = 'block';

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 10);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    if (hoveredIdx !== null && hoveredIdx !== undefined) {
      const cap = activeThreeCities[hoveredIdx];
      const temp = cap.temp;
      if (cap && temp !== null && temp !== undefined) {
        const { x, y } = projectCoords(cap.lat, cap.lon, W, H);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  const CAPITALS_API_URL = 'https://restcountries.com/v3.1/all?fields=name,capital,capitalInfo,latlng,region,translations';
  const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

  function getCapitalLocations(countries) {
    if (!Array.isArray(countries)) return [];
    return countries.flatMap((country) => {
      const capitalName = Array.isArray(country.capital) ? country.capital[0] : null;
      const capitalLatLng = country?.capitalInfo?.latlng;
      const fallbackLatLng = country?.latlng;
      const coords = Array.isArray(capitalLatLng) && capitalLatLng.length >= 2
        ? capitalLatLng
        : (Array.isArray(fallbackLatLng) && fallbackLatLng.length >= 2 ? fallbackLatLng : null);

      if (!capitalName || !coords) return [];

      return [{
        label: capitalName,
        country: country.translations?.vie?.common || country.name?.common || '',
        region: country.region || 'Unknown',
        lat: coords[0],
        lon: coords[1]
      }];
    });
  }

  async function fetchTemperaturesForLocations(locations, batchSize = 12) {
    const temps = [];
    for (let index = 0; index < locations.length; index += batchSize) {
      const batch = locations.slice(index, index + batchSize);
      const batchTemps = await Promise.all(batch.map(async (location) => {
        const url = OPEN_METEO_URL + '?latitude=' + location.lat + '&longitude=' + location.lon + '&current=temperature_2m';
        try {
          const response = await fetch(url);
          if (!response.ok) return null;
          const json = await response.json();
          return json && json.current ? json.current.temperature_2m : null;
        } catch {
          return null;
        }
      }));
      temps.push(...batchTemps);
    }
    return temps;
  }

  async function initRealtimeDashboard() {
    if (dashboardChartLoaded) return;
    dashboardChartLoaded = true;

    const canvas = document.getElementById('continentChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (realtimeChart) realtimeChart.destroy();

    realtimeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['C. Mỹ', 'C. Á', 'C. Đ.Dương', 'C. Âu', 'C. Phi'],
        datasets: [{
          label: 'Nhiệt độ (°C)',
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(59, 130, 246, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(234, 179, 8, 0.85)',
            'rgba(249, 115, 22, 0.85)',
            'rgba(239, 68, 68, 0.85)'
          ],
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.55
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

    async function refreshRealtimeData() {
      try {
        const countriesRes = await fetch(CAPITALS_API_URL);
        if (!countriesRes.ok) throw new Error('Failed to load capital data');

        const countries = await countriesRes.json();
        const capitals = getCapitalLocations(countries);
        if (!capitals.length) throw new Error('No capital locations found');

        const regionTempsMap = new Map(REGION_SERIES.map((region) => [region.api, []]));
        const capitalTemps = await fetchTemperaturesForLocations(capitals);

        capitals.forEach((capital, index) => {
          const temp = capitalTemps[index];
          if (temp === null || temp === undefined) return;
          if (!regionTempsMap.has(capital.region)) return;
          regionTempsMap.get(capital.region).push(temp);
        });

        const regionTemps = REGION_SERIES.map((region) => {
          const temps = regionTempsMap.get(region.api) || [];
          if (!temps.length) return null;
          const sum = temps.reduce((acc, value) => acc + value, 0);
          return sum / temps.length;
        });

        realtimeChart.data.labels = REGION_SERIES.map((region) => region.label);
        realtimeChart.data.datasets[0].backgroundColor = REGION_SERIES.map((region) => region.color);
        realtimeChart.data.datasets[0].data = regionTemps.map((value) => value !== null ? parseFloat(value.toFixed(1)) : 0);
        realtimeChart.update();

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

        activeCapitals = capitals;
        activeTemps = capitalTemps;
        drawWorldHeatmap(hoveredIndex);

        const validCapitalTemps = capitalTemps.filter((value) => value !== null && value !== undefined);
        const globalAvg = validCapitalTemps.length ? (validCapitalTemps.reduce((a, b) => a + b, 0) / validCapitalTemps.length) : FALLBACK_DATA.globalTemp;
        document.getElementById('valGlobalTemp').innerText = parseFloat(globalAvg.toFixed(1)) + '°C';
        document.getElementById('valTempChange').innerText = '(Live API)';
        const valTempUpdatedEl = document.getElementById('valTempUpdated');
        if (valTempUpdatedEl) valTempUpdatedEl.textContent = 'Cập nhật lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
      }
    }

    // Add Mouse Events on worldCanvas
    const wc = document.getElementById('worldCanvas');
    if (wc) {
      wc.addEventListener('mousemove', (e) => {
        const rect = wc.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let closestIdx = null;
        let minDist = 16;

        const W = rect.width || wc.clientWidth || 300;
        const H = rect.height || wc.clientHeight || 180;

        activeThreeCities.forEach((cap, idx) => {
          const temp = cap.temp;
          if (temp === null || temp === undefined) return;

          const { x, y } = projectCoords(cap.lat, cap.lon, W, H);
          const dist = Math.hypot(mouseX - x, mouseY - y);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        if (closestIdx !== hoveredIndex) {
          hoveredIndex = closestIdx;
          drawWorldHeatmap(hoveredIndex);

          let tooltip = document.getElementById('mapTooltip');
          if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'mapTooltip';
            tooltip.className = 'map-tooltip';
            wc.parentElement.appendChild(tooltip);
          }

          if (hoveredIndex !== null) {
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
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translate(-50%, -100%) scale(0.9)';
            wc.style.cursor = 'default';
          }
        }
      });

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

    // Handle window resize dynamically
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        drawWorldHeatmap(hoveredIndex);
      }, 100);
    });

    await refreshRealtimeData();
    setInterval(refreshRealtimeData, 10 * 60 * 1000);
  }

  // ── Init Dashboard ──
  function initDashboard() {
    renderDashboard();
    initRealtimeDashboard();
    initConsoleLogs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})();
