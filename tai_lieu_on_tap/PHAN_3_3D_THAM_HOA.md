# 🌋 TÀI LIỆU ÔN THI & BẢO VỆ ĐỒ ÁN - PHẦN 3: ĐỒ HỌA 3D TRÁI ĐẤT THIÊN TAI & HIỆU ỨNG VẬT LÝ

Tài liệu này được biên soạn đầy đủ và chi tiết dành riêng cho thành viên phụ trách **Phần 3**. Bạn chỉ cần đọc kỹ và học thuộc file này để tự tin trả lời mọi câu hỏi của hội đồng cũng như code lại toàn bộ phần việc của mình.

---

## 📂 Danh sách các file quản lý
1.  [calculator.html](file:///c:/Users/ACER/Downloads/CNW/bwd/calculator.html): Trang tính Carbon và hiển thị Trái Đất 3D.
2.  [js/calculator.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/calculator.js): Nạp mô hình 3D (`juan.glb`), thiết lập hệ thống hạt dung nham núi lửa, lốc xoáy lượng giác cực, sét đánh răng cưa và đồng bộ thanh kéo.

---

## 🛠️ TOÀN BỘ MÃ NGUỒN CHI TIẾT (COMPLETE CODE)

### File [js/calculator.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/calculator.js) (Toàn bộ mã nguồn)
```javascript
(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     1. 3D EARTH ORB SETUP (Three.js)
     ══════════════════════════════════════════════ */
  const orbContainer = document.getElementById('orbContainer');
  if (!orbContainer) return;

  const smokeOverlay = document.getElementById('smokeOverlay');
  const fireOverlay  = document.getElementById('fireOverlay');
  const darkOverlay  = document.getElementById('darkOverlay');
  let orbW = orbContainer.clientWidth || 320;
  let orbH = orbContainer.clientHeight || 320;
   
  const orbScene    = new THREE.Scene();
  const orbCamera   = new THREE.PerspectiveCamera(35, orbW / orbH, 0.1, 100);
  orbCamera.position.z = 5.5;
   
  const orbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  orbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  orbRenderer.setSize(orbW, orbH);
  orbRenderer.setClearColor(0x000000, 0);
  orbContainer.appendChild(orbRenderer.domElement);
   
  // OrbitControls
  const orbControls = new THREE.OrbitControls(orbCamera, orbRenderer.domElement);
  orbControls.enableZoom = true;
  orbControls.minDistance = 3;
  orbControls.maxDistance = 10;
  orbControls.enablePan = false;
  orbControls.autoRotate = true;
  orbControls.autoRotateSpeed = 1.5;
  orbControls.dampingFactor = 0.08;
  orbControls.enableDamping = true;
   
  const orbAmbient = new THREE.AmbientLight(0xffffff, 0.6);
  orbScene.add(orbAmbient);
  const orbDir = new THREE.DirectionalLight(0xffffff, 1.0);
  orbDir.position.set(3, 3, 3);
  orbScene.add(orbDir);
   
  let orbEarth = null, orbMixer = null;
  let orbIntensity = 0.0, targetIntensity = 0.0;
  const orbPivot = new THREE.Group();
  orbScene.add(orbPivot);
  
  // ── 3D DISASTER EFFECTS ──
  function createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(100, 85, 70, 0.5)');
    grad.addColorStop(0.3, 'rgba(80, 70, 60, 0.25)');
    grad.addColorStop(0.7, 'rgba(60, 50, 45, 0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }
  
  function createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 170, 1)');
    grad.addColorStop(0.2, 'rgba(255, 120, 20, 0.8)');
    grad.addColorStop(0.5, 'rgba(200, 40, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }
  
  // ── Toxic Smoke Particle System
  const smokeCount = 200;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeSpeeds = [];
  for (let i = 0; i < smokeCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = 1.35 + Math.random() * 0.75;
    
    smokePos[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    smokePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    smokePos[i * 3 + 2] = radius * Math.cos(phi);
    
    smokeSpeeds.push({
      x: (Math.random() - 0.5) * 0.05,
      y: 0.15 + Math.random() * 0.2,
      z: (Math.random() - 0.5) * 0.05
    });
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({
    size: 0.65,
    map: createSmokeTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    opacity: 0.0
  });
  const toxicSmoke = new THREE.Points(smokeGeo, smokeMat);
  orbScene.add(toxicSmoke);
  
  // ── Fire Sparks Particle System
  const sparkCount = 120;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkData = [];
  for (let i = 0; i < sparkCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );
    const startRadius = 1.05 + Math.random() * 0.1;
    const pos = dir.clone().multiplyScalar(startRadius);
    sparkPos[i * 3]     = pos.x;
    sparkPos[i * 3 + 1] = pos.y;
    sparkPos[i * 3 + 2] = pos.z;
    
    sparkData.push({
      dir: dir,
      speed: 0.6 + Math.random() * 0.8,
      radius: startRadius,
      life: Math.random()
    });
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 0.22,
    map: createSparkTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.0
  });
  const fireSparks = new THREE.Points(sparkGeo, sparkMat);
  orbScene.add(fireSparks);
  
  // ── Lightning Bolts Group
  const lightningBoltsGroup = new THREE.Group();
  orbScene.add(lightningBoltsGroup);
  let lightningCountdown = 0;
  let lightFlashTime = 0;
  
  function createLightningStrike() {
    while (lightningBoltsGroup.children.length > 0) {
      const line = lightningBoltsGroup.children[0];
      line.geometry.dispose();
      line.material.dispose();
      lightningBoltsGroup.remove(line);
    }
  
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2 * Math.PI;
    const phi = Math.acos(2 * v - 1);
    const startDir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );
    const startPos = startDir.clone().multiplyScalar(2.1);
  
    const endDir = startDir.clone().applyAxisAngle(
      new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      0.3 + Math.random() * 0.2
    );
    const endPos = endDir.clone().multiplyScalar(1.0);
  
    const points = [];
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const fraction = i / segments;
      const lerped = new THREE.Vector3().lerpVectors(startPos, endPos, fraction);
      if (i > 0 && i < segments) {
        const pathVec = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const randVec = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(pathVec).normalize();
        const displacement = 0.12 + Math.random() * 0.15;
        lerped.add(randVec.multiplyScalar(displacement));
      }
      points.push(lerped);
    }
  
    const lightningGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lightningMat = new THREE.LineBasicMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.95
    });
  
    const line = new THREE.Line(lightningGeo, lightningMat);
    lightningBoltsGroup.add(line);
  
    lightFlashTime = 0.18 + Math.random() * 0.15;
  }
  
  // ── Volcano Eruption setup
  const volcanoDir = new THREE.Vector3(0.25, -0.45, 0.85).normalize();
  
  // Volcanic Crater Mesh
  const craterGeo = new THREE.CircleGeometry(0.10, 16);
  const craterMat = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const craterMesh = new THREE.Mesh(craterGeo, craterMat);
  let craterPos = volcanoDir.clone().multiplyScalar(0.8);
  craterMesh.position.copy(craterPos);
  craterMesh.lookAt(craterPos.clone().add(volcanoDir));
  orbPivot.add(craterMesh);
  
  // Volcanic Eruption Particles
  const volCount = 90;
  const volGeo = new THREE.BufferGeometry();
  const volPos = new Float32Array(volCount * 3);
  const volColors = new Float32Array(volCount * 3);
  const volData = [];
  
  for (let i = 0; i < volCount; i++) {
    volPos[i * 3]     = craterPos.x;
    volPos[i * 3 + 1] = craterPos.y;
    volPos[i * 3 + 2] = craterPos.z;
  
    const isLava = Math.random() > 0.45;
    volColors[i * 3]     = isLava ? 1.0 : 0.3;
    volColors[i * 3 + 1] = isLava ? 0.8 : 0.3;
    volColors[i * 3 + 2] = isLava ? 0.1 : 0.3;
  
    volData.push({
      pos: craterPos.clone(),
      vel: new THREE.Vector3(),
      life: 0.3 + Math.random() * 0.6,
      age: Math.random() * 0.9,
      isLava: isLava
    });
  }
  
  volGeo.setAttribute('position', new THREE.BufferAttribute(volPos, 3));
  volGeo.setAttribute('color', new THREE.BufferAttribute(volColors, 3));
  
  const volMat = new THREE.PointsMaterial({
    size: 0.16,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });
  
  const volcanoParticles = new THREE.Points(volGeo, volMat);
  orbPivot.add(volcanoParticles);
  
  function resetVolcanoParticle(idx) {
    const data = volData[idx];
    data.pos.copy(craterPos);
    data.age = 0;
    data.life = 0.3 + Math.random() * 0.6;
  
    const randVec = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).cross(volcanoDir).normalize();
    const spread = 0.35;
    const launchDir = volcanoDir.clone().add(randVec.multiplyScalar(Math.random() * spread)).normalize();
    
    const speed = 0.6 + Math.random() * 0.9;
    data.vel.copy(launchDir.multiplyScalar(speed));
  
    const posArr = volGeo.attributes.position.array;
    const colArr = volGeo.attributes.color.array;
  
    posArr[idx * 3]     = craterPos.x;
    posArr[idx * 3 + 1] = craterPos.y;
    posArr[idx * 3 + 2] = craterPos.z;
  
    if (data.isLava) {
      colArr[idx * 3]     = 1.0;
      colArr[idx * 3 + 1] = 0.9;
      colArr[idx * 3 + 2] = 0.2;
    } else {
      colArr[idx * 3]     = 0.45;
      colArr[idx * 3 + 1] = 0.40;
      colArr[idx * 3 + 2] = 0.38;
    }
  }
  
  // ── Ground Effect: BIG Lava Pool
  const lavaPoolGeo = new THREE.CircleGeometry(0.04, 16);
  const lavaPoolMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const lavaPoolMesh = new THREE.Mesh(lavaPoolGeo, lavaPoolMat);
  lavaPoolMesh.position.copy(craterPos);
  lavaPoolMesh.lookAt(craterPos.clone().add(volcanoDir));
  orbPivot.add(lavaPoolMesh);
  
  // ── Ground Effect: Outer Scorched Ring
  const scorchedGeo = new THREE.RingGeometry(0.04, 0.09, 16);
  const scorchedMat = new THREE.MeshBasicMaterial({
    color: 0xdd3300,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const scorchedMesh = new THREE.Mesh(scorchedGeo, scorchedMat);
  scorchedMesh.position.copy(craterPos);
  scorchedMesh.lookAt(craterPos.clone().add(volcanoDir));
  orbPivot.add(scorchedMesh);
  
  // ── Ground Effect: PointLight
  const volcanoLight = new THREE.PointLight(0xff4400, 0, 0.5, 2);
  volcanoLight.position.copy(volcanoDir.clone().multiplyScalar(craterPos.length() + 0.15));
  orbPivot.add(volcanoLight);
  
  // Build tangent vectors perpendicular to volcanoDir
  const tangent1 = new THREE.Vector3();
  if (Math.abs(volcanoDir.y) < 0.9) {
    tangent1.crossVectors(volcanoDir, new THREE.Vector3(0, 1, 0)).normalize();
  } else {
    tangent1.crossVectors(volcanoDir, new THREE.Vector3(1, 0, 0)).normalize();
  }
  const tangent2 = new THREE.Vector3().crossVectors(volcanoDir, tangent1).normalize();
  
  // ── Ground Effect: Lava Flow Streams
  const lavaFlowCount = 60;
  const lavaFlowGeo = new THREE.BufferGeometry();
  const lavaFlowPos = new Float32Array(lavaFlowCount * 3);
  const lavaFlowColors = new Float32Array(lavaFlowCount * 3);
  const lavaFlowData = [];
  
  function createLavaTexture() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255, 200, 50, 1)');
    g.addColorStop(0.3, 'rgba(255, 100, 0, 0.9)');
    g.addColorStop(0.6, 'rgba(200, 30, 0, 0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }
  const lavaFlowTexture = createLavaTexture();
  
  for (let i = 0; i < lavaFlowCount; i++) {
    lavaFlowPos[i * 3] = craterPos.x;
    lavaFlowPos[i * 3 + 1] = craterPos.y;
    lavaFlowPos[i * 3 + 2] = craterPos.z;
  
    const angle = Math.random() * Math.PI * 2;
    const flowDir = tangent1.clone().multiplyScalar(Math.cos(angle))
      .add(tangent2.clone().multiplyScalar(Math.sin(angle))).normalize();
  
    lavaFlowColors[i * 3] = 1.0;
    lavaFlowColors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
    lavaFlowColors[i * 3 + 2] = 0.0;
  
    lavaFlowData.push({
      pos: craterPos.clone(),
      dir: flowDir,
      speed: 0.08 + Math.random() * 0.12,
      maxDist: 0.15 + Math.random() * 0.4,
      progress: Math.random(),
      surfaceRadius: craterPos.length()
    });
  }
  lavaFlowGeo.setAttribute('position', new THREE.BufferAttribute(lavaFlowPos, 3));
  lavaFlowGeo.setAttribute('color', new THREE.BufferAttribute(lavaFlowColors, 3));
  const lavaFlowMat = new THREE.PointsMaterial({
    size: 0.10,
    map: lavaFlowTexture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });
  const lavaFlowParticles = new THREE.Points(lavaFlowGeo, lavaFlowMat);
  orbPivot.add(lavaFlowParticles);
  
  // ── Ground Effect: Rising Embers
  const emberCount = 35;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);
  const emberData = [];
  
  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 0.35;
    const surfDir = tangent1.clone().multiplyScalar(Math.cos(angle))
      .add(tangent2.clone().multiplyScalar(Math.sin(angle)));
    const basePos = craterPos.clone().add(surfDir.multiplyScalar(dist));
    basePos.normalize().multiplyScalar(craterPos.length());
  
    emberPos[i * 3] = basePos.x;
    emberPos[i * 3 + 1] = basePos.y;
    emberPos[i * 3 + 2] = basePos.z;
  
    emberColors[i * 3] = 1.0;
    emberColors[i * 3 + 1] = 0.3 + Math.random() * 0.5;
    emberColors[i * 3 + 2] = 0.0;
  
    emberData.push({
      basePos: basePos.clone(),
      height: 0,
      maxHeight: 0.08 + Math.random() * 0.18,
      speed: 0.5 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2
    });
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));
  const emberMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });
  const emberParticles = new THREE.Points(emberGeo, emberMat);
  orbPivot.add(emberParticles);
  
  // ── Tornado / Cyclone System
  function createTornadoTexture() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(200, 210, 220, 0.9)');
    g.addColorStop(0.4, 'rgba(150, 160, 170, 0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }
  const tornadoTex = createTornadoTexture();
  
  const tornadoConfigs = [
    { dir: new THREE.Vector3(-0.6, 0.2, -0.75).normalize(), count: 100, maxH: 0.50, baseR: 0.02, topR: 0.16, size: 0.065, driftSpeed: 0.72 },
    { dir: new THREE.Vector3(0.4, 0.6, -0.65).normalize(),  count: 70,  maxH: 0.35, baseR: 0.015, topR: 0.10, size: 0.05,  driftSpeed: 1.08 },
    { dir: new THREE.Vector3(-0.3, -0.7, 0.6).normalize(),  count: 90,  maxH: 0.45, baseR: 0.02, topR: 0.14, size: 0.06,  driftSpeed: 0.60 },
    { dir: new THREE.Vector3(0.8, 0.1, 0.55).normalize(),   count: 60,  maxH: 0.30, baseR: 0.012, topR: 0.09, size: 0.045, driftSpeed: 1.32 },
    { dir: new THREE.Vector3(-0.5, 0.75, 0.4).normalize(),  count: 80,  maxH: 0.40, baseR: 0.018, topR: 0.13, size: 0.055, driftSpeed: 0.90 },
  ];
  
  const tornadoes = [];
  const tornadoSurfaceRadius = 0.8;
  
  tornadoConfigs.forEach((cfg) => {
    const t1 = new THREE.Vector3();
    if (Math.abs(cfg.dir.y) < 0.9) {
      t1.crossVectors(cfg.dir, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      t1.crossVectors(cfg.dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    const t2 = new THREE.Vector3().crossVectors(cfg.dir, t1).normalize();
  
    const basePos = cfg.dir.clone().multiplyScalar(tornadoSurfaceRadius);
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(cfg.count * 3);
    const colors = new Float32Array(cfg.count * 3);
    const particles = [];
  
    const driftAngle = Math.random() * Math.PI * 2;
    const driftAxis = t1.clone().multiplyScalar(Math.cos(driftAngle))
      .add(t2.clone().multiplyScalar(Math.sin(driftAngle))).normalize();
  
    for (let i = 0; i < cfg.count; i++) {
      const hR = Math.random();
      const fR = cfg.baseR + hR * (cfg.topR - cfg.baseR);
      const a = Math.random() * Math.PI * 2;
      const h = hR * cfg.maxH;
  
      const pt = basePos.clone()
        .add(cfg.dir.clone().multiplyScalar(h))
        .add(t1.clone().multiplyScalar(Math.cos(a) * fR))
        .add(t2.clone().multiplyScalar(Math.sin(a) * fR));
  
      positions[i * 3] = pt.x; positions[i * 3 + 1] = pt.y; positions[i * 3 + 2] = pt.z;
  
      const brightness = 0.45 + hR * 0.45;
      colors[i * 3] = brightness * 0.85; colors[i * 3 + 1] = brightness * 0.88; colors[i * 3 + 2] = brightness;
  
      particles.push({
        heightRatio: hR, angle: a, funnelRadius: fR, height: h,
        angularSpeed: 3.0 + Math.random() * 4.0 + (1.0 - hR) * 3.0,
        wobble: Math.random() * 0.3
      });
    }
  
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
    const mat = new THREE.PointsMaterial({
      size: cfg.size, map: tornadoTex, vertexColors: true,
      transparent: true, depthWrite: false, opacity: 0.0, blending: THREE.NormalBlending
    });
  
    const mesh = new THREE.Points(geo, mat);
    orbPivot.add(mesh);
  
    tornadoes.push({
      dir: cfg.dir.clone(), basePos: basePos.clone(),
      t1: t1.clone(), t2: t2.clone(),
      geo, mat, mesh, particles, count: cfg.count,
      maxH: cfg.maxH, driftAxis: driftAxis, driftSpeed: cfg.driftSpeed,
      driftAngle: 0, surfaceRadius: tornadoSurfaceRadius
    });
  });
  
  // ── Second Volcano Setup
  const volcano2Dir = new THREE.Vector3(-0.55, 0.3, -0.75).normalize();
  let crater2Pos = volcano2Dir.clone().multiplyScalar(0.8);
  
  const crater2Geo = new THREE.CircleGeometry(0.08, 16);
  const crater2Mat = new THREE.MeshBasicMaterial({
    color: 0xff3300, transparent: true, opacity: 0.0,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const crater2Mesh = new THREE.Mesh(crater2Geo, crater2Mat);
  crater2Mesh.position.copy(crater2Pos);
  crater2Mesh.lookAt(crater2Pos.clone().add(volcano2Dir));
  orbPivot.add(crater2Mesh);
  
  const vol2Count = 70;
  const vol2Geo = new THREE.BufferGeometry();
  const vol2Pos = new Float32Array(vol2Count * 3);
  const vol2Colors = new Float32Array(vol2Count * 3);
  const vol2Data = [];
  for (let i = 0; i < vol2Count; i++) {
    vol2Pos[i * 3] = crater2Pos.x; vol2Pos[i * 3 + 1] = crater2Pos.y; vol2Pos[i * 3 + 2] = crater2Pos.z;
    const isLava = Math.random() > 0.45;
    vol2Colors[i * 3] = isLava ? 1.0 : 0.3; vol2Colors[i * 3 + 1] = isLava ? 0.8 : 0.3; vol2Colors[i * 3 + 2] = isLava ? 0.1 : 0.3;
    vol2Data.push({ pos: crater2Pos.clone(), vel: new THREE.Vector3(), life: 0.3 + Math.random() * 0.6, age: Math.random() * 0.9, isLava });
  }
  vol2Geo.setAttribute('position', new THREE.BufferAttribute(vol2Pos, 3));
  vol2Geo.setAttribute('color', new THREE.BufferAttribute(vol2Colors, 3));
  const vol2Mat = new THREE.PointsMaterial({
    size: 0.14, vertexColors: true, transparent: true, depthWrite: false, opacity: 0.0, blending: THREE.AdditiveBlending
  });
  const vol2Particles = new THREE.Points(vol2Geo, vol2Mat);
  orbPivot.add(vol2Particles);
  
  // Lava pool for volcano 2
  const lava2Geo = new THREE.CircleGeometry(0.04, 16);
  const lava2Mat = new THREE.MeshBasicMaterial({
    color: 0xff5500, transparent: true, opacity: 0.0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const lava2Mesh = new THREE.Mesh(lava2Geo, lava2Mat);
  lava2Mesh.position.copy(crater2Pos);
  lava2Mesh.lookAt(crater2Pos.clone().add(volcano2Dir));
  orbPivot.add(lava2Mesh);
  
  const volcano2Light = new THREE.PointLight(0xff4400, 0, 0.5, 2);
  volcano2Light.position.copy(volcano2Dir.clone().multiplyScalar(crater2Pos.length() + 0.15));
  orbPivot.add(volcano2Light);
  
  function resetVol2Particle(idx) {
    const data = vol2Data[idx];
    data.pos.copy(crater2Pos); data.age = 0; data.life = 0.3 + Math.random() * 0.6;
    const randVec = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).cross(volcano2Dir).normalize();
    const launchDir = volcano2Dir.clone().add(randVec.multiplyScalar(Math.random() * 0.35)).normalize();
    data.vel.copy(launchDir.multiplyScalar(0.5 + Math.random() * 0.8));
    const posArr = vol2Geo.attributes.position.array;
    posArr[idx * 3] = crater2Pos.x; posArr[idx * 3 + 1] = crater2Pos.y; posArr[idx * 3 + 2] = crater2Pos.z;
  }
  
  // Load juan.glb model
  new THREE.GLTFLoader().load('./models/juan.glb', function(gltf) {
    orbEarth = gltf.scene;
    const box = new THREE.Box3().setFromObject(orbEarth);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.4 / Math.max(size.x, size.y, size.z);
    orbEarth.scale.set(scale, scale, scale);
    const scaledBox = new THREE.Box3().setFromObject(orbEarth);
    const center = scaledBox.getCenter(new THREE.Vector3());
    orbEarth.position.sub(center);
  
    const scaledSize = scaledBox.getSize(new THREE.Vector3());
    const earthBodyRadius = Math.min(scaledSize.x, scaledSize.y, scaledSize.z) / 2.0;
  
    craterPos = volcanoDir.clone().multiplyScalar(0.45);
    craterMesh.position.copy(craterPos);
    craterMesh.lookAt(craterPos.clone().add(volcanoDir));
  
    const posArr = volGeo.attributes.position.array;
    for (let i = 0; i < volCount; i++) {
      posArr[i * 3]     = craterPos.x;
      posArr[i * 3 + 1] = craterPos.y;
      posArr[i * 3 + 2] = craterPos.z;
      volData[i].pos.copy(craterPos);
    }
    volGeo.attributes.position.needsUpdate = true;
  
    lavaPoolMesh.position.copy(craterPos);
    lavaPoolMesh.lookAt(craterPos.clone().add(volcanoDir));
    scorchedMesh.position.copy(craterPos);
    scorchedMesh.lookAt(craterPos.clone().add(volcanoDir));
    volcanoLight.position.copy(volcanoDir.clone().multiplyScalar(craterPos.length() + 0.15));
  
    const lfp = lavaFlowGeo.attributes.position.array;
    for (let i = 0; i < lavaFlowCount; i++) {
      lfp[i * 3] = craterPos.x;
      lfp[i * 3 + 1] = craterPos.y;
      lfp[i * 3 + 2] = craterPos.z;
      lavaFlowData[i].pos.copy(craterPos);
      lavaFlowData[i].surfaceRadius = craterPos.length();
      lavaFlowData[i].progress = Math.random();
    }
    lavaFlowGeo.attributes.position.needsUpdate = true;
  
    const ep = emberGeo.attributes.position.array;
    for (let i = 0; i < emberCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.35;
      const surfDir = tangent1.clone().multiplyScalar(Math.cos(angle))
        .add(tangent2.clone().multiplyScalar(Math.sin(angle)));
      const basePos = craterPos.clone().add(surfDir.multiplyScalar(dist));
      basePos.normalize().multiplyScalar(craterPos.length());
      ep[i * 3] = basePos.x;
      ep[i * 3 + 1] = basePos.y;
      ep[i * 3 + 2] = basePos.z;
      emberData[i].basePos.copy(basePos);
    }
    emberGeo.attributes.position.needsUpdate = true;
  
    const trSurfR = earthBodyRadius * 0.72;
    tornadoes.forEach(tor => {
      tor.surfaceRadius = trSurfR;
      tor.basePos = tor.dir.clone().multiplyScalar(trSurfR);
      const tpArr = tor.geo.attributes.position.array;
      for (let i = 0; i < tor.count; i++) {
        const d = tor.particles[i];
        const pt = tor.basePos.clone()
          .add(tor.dir.clone().multiplyScalar(d.height))
          .add(tor.t1.clone().multiplyScalar(Math.cos(d.angle) * d.funnelRadius))
          .add(tor.t2.clone().multiplyScalar(Math.sin(d.angle) * d.funnelRadius));
        tpArr[i * 3] = pt.x; tpArr[i * 3 + 1] = pt.y; tpArr[i * 3 + 2] = pt.z;
      }
      tor.geo.attributes.position.needsUpdate = true;
    });
  
    crater2Pos = volcano2Dir.clone().multiplyScalar(craterPos.length());
    crater2Mesh.position.copy(crater2Pos);
    crater2Mesh.lookAt(crater2Pos.clone().add(volcano2Dir));
    lava2Mesh.position.copy(crater2Pos);
    lava2Mesh.lookAt(crater2Pos.clone().add(volcano2Dir));
    volcano2Light.position.copy(volcano2Dir.clone().multiplyScalar(crater2Pos.length() + 0.15));
    const v2p = vol2Geo.attributes.position.array;
    for (let i = 0; i < vol2Count; i++) {
      v2p[i * 3] = crater2Pos.x; v2p[i * 3 + 1] = crater2Pos.y; v2p[i * 3 + 2] = crater2Pos.z;
      vol2Data[i].pos.copy(crater2Pos);
    }
    vol2Geo.attributes.position.needsUpdate = true;
  
    if (gltf.animations && gltf.animations.length > 0) {
      orbMixer = new THREE.AnimationMixer(orbEarth);
      gltf.animations.forEach(clip => orbMixer.clipAction(clip).play());
    }
    const maxAniso = orbRenderer.capabilities.getMaxAnisotropy();
    orbEarth.traverse(child => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat.map) { mat.map.anisotropy = maxAniso; mat.map.needsUpdate = true; }
        });
      }
    });
    orbPivot.add(orbEarth);
    orbControls.target.set(0, 0, 0);
    orbControls.update();
    
    if (typeof window.triggerPageLoaded === 'function') {
      window.triggerPageLoaded();
    }
  }, undefined, function (error) {
    console.error('Error loading juan.glb:', error);
    if (typeof window.triggerPageLoaded === 'function') {
      window.triggerPageLoaded();
    }
  });
  
  const orbClock = new THREE.Clock();
  function animateOrb() {
    requestAnimationFrame(animateOrb);
    const delta = orbClock.getDelta();
    if (orbMixer) orbMixer.update(delta);
    orbControls.update();
   
    orbIntensity += (targetIntensity - orbIntensity) * 0.04;
    const t = orbIntensity; 
   
    // Overlays
    const smokeOpacity = Math.max(0, (t - 0.15) / 0.85) * 0.4;
    if (smokeOverlay) {
      smokeOverlay.style.opacity = smokeOpacity;
      smokeOverlay.style.filter = `blur(${12 + t * 15}px)`;
    }
   
    const fireOpacity = Math.max(0, (t - 0.45) / 0.55) * 0.45;
    if (fireOverlay) {
      fireOverlay.style.opacity = fireOpacity;
      fireOverlay.style.filter = `blur(${18 + t * 12}px)`;
    }
   
    const darkOpacity = Math.max(0, (t - 0.30) / 0.70) * 0.6;
    if (darkOverlay) darkOverlay.style.opacity = darkOpacity;
   
    const grayscale = Math.min(t * 60, 50);
    const brightness = 1.0 - t * 0.35;
    const sepia = Math.min(t * 40, 30);
    const contrast = 1.0 + t * 0.15;
    if (orbRenderer.domElement) {
      orbRenderer.domElement.style.filter = 
        `grayscale(${grayscale}%) brightness(${brightness}) sepia(${sepia}%) contrast(${contrast})`;
    }
   
    // Smoke
    toxicSmoke.rotation.y += 0.0015;
    toxicSmoke.rotation.z += 0.0008;
    const targetSmokeOpacity = Math.max(0, Math.min(0.5, (t - 0.1) * 0.7));
    smokeMat.opacity = targetSmokeOpacity;
  
    // Sparks
    const positions = sparkGeo.attributes.position.array;
    const targetSparkOpacity = Math.max(0, Math.min(0.55, (t - 0.4) * 1.2));
    sparkMat.opacity = targetSparkOpacity;
    if (targetSparkOpacity > 0) {
      for (let i = 0; i < sparkCount; i++) {
        const data = sparkData[i];
        data.life += delta * data.speed;
        if (data.life > 1.0) {
          data.life = 0;
          data.radius = 1.05 + Math.random() * 0.1;
        }
        const currentRadius = data.radius + data.life * 0.85;
        const currentPos = data.dir.clone().multiplyScalar(currentRadius);
        positions[i * 3]     = currentPos.x;
        positions[i * 3 + 1] = currentPos.y;
        positions[i * 3 + 2] = currentPos.z;
      }
      sparkGeo.attributes.position.needsUpdate = true;
    }
  
    // Volcano
    const targetCraterOpacity = Math.max(0, Math.min(0.6, (t - 0.3) * 1.2));
    craterMat.opacity = targetCraterOpacity * (0.5 + Math.sin(orbClock.getElapsedTime() * 12.0) * 0.15);
  
    const targetVolcanoOpacity = Math.max(0, Math.min(0.6, (t - 0.45) * 1.8));
    volMat.opacity = targetVolcanoOpacity;
  
    if (targetVolcanoOpacity > 0) {
      const volPositions = volGeo.attributes.position.array;
      const volColArr = volGeo.attributes.color.array;
  
      for (let i = 0; i < volCount; i++) {
        const data = volData[i];
        data.age += delta;
  
        if (data.age >= data.life) {
          resetVolcanoParticle(i);
        } else {
          const gravityDir = data.pos.clone().normalize();
          const gravityStrength = 0.45 * delta;
          data.vel.addScaledVector(gravityDir, -gravityStrength);
          data.pos.addScaledVector(data.vel, delta);
          
          volPositions[i * 3]     = data.pos.x;
          volPositions[i * 3 + 1] = data.pos.y;
          volPositions[i * 3 + 2] = data.pos.z;
  
          const progress = data.age / data.life;
          if (data.isLava) {
            volColArr[i * 3]     = 1.0 - progress * 0.3;
            volColArr[i * 3 + 1] = Math.max(0.0, 0.9 - progress * 1.0);
            volColArr[i * 3 + 2] = Math.max(0.0, 0.2 - progress * 0.35);
          } else {
            volColArr[i * 3]     = Math.max(0.08, 0.45 - progress * 0.4);
            volColArr[i * 3 + 1] = Math.max(0.08, 0.40 - progress * 0.4);
            volColArr[i * 3 + 2] = Math.max(0.08, 0.38 - progress * 0.4);
          }
        }
      }
      volGeo.attributes.position.needsUpdate = true;
      volGeo.attributes.color.needsUpdate = true;
    }
  
    // Ground effects
    const elapsed = orbClock.getElapsedTime();
    const groundEffectOpacity = Math.max(0, Math.min(1.0, (t - 0.3) * 2.5));
    lavaPoolMat.opacity = groundEffectOpacity * (0.3 + Math.sin(elapsed * 4.0) * 0.15);
    scorchedMat.opacity = groundEffectOpacity * (0.15 + Math.sin(elapsed * 2.0 + 1.0) * 0.1);
    volcanoLight.intensity = groundEffectOpacity * (1.2 + Math.sin(elapsed * 5.0) * 0.6);
  
    lavaFlowMat.opacity = groundEffectOpacity * 0.45;
    if (groundEffectOpacity > 0) {
      const lfPositions = lavaFlowGeo.attributes.position.array;
      const lfColors = lavaFlowGeo.attributes.color.array;
      for (let i = 0; i < lavaFlowCount; i++) {
        const d = lavaFlowData[i];
        d.progress += delta * d.speed;
        if (d.progress >= 1.0) d.progress = 0;
        
        const currentDist = d.progress * d.maxDist;
        const newPos = craterPos.clone().add(d.dir.clone().multiplyScalar(currentDist));
        newPos.normalize().multiplyScalar(d.surfaceRadius);
        
        lfPositions[i * 3]     = newPos.x;
        lfPositions[i * 3 + 1] = newPos.y;
        lfPositions[i * 3 + 2] = newPos.z;
  
        const cooldown = 1.0 - d.progress;
        lfColors[i * 3]     = cooldown > 0.5 ? 1.0 : 0.6;
        lfColors[i * 3 + 1] = cooldown * 0.7;
        lfColors[i * 3 + 2] = 0.0;
      }
      lavaFlowGeo.attributes.position.needsUpdate = true;
      lavaFlowGeo.attributes.color.needsUpdate = true;
    }
  
    emberMat.opacity = groundEffectOpacity * 0.4;
    if (groundEffectOpacity > 0) {
      const ePositions = emberGeo.attributes.position.array;
      for (let i = 0; i < emberCount; i++) {
        const d = emberData[i];
        d.height = (Math.sin(elapsed * d.speed + d.phase) * 0.5 + 0.5) * d.maxHeight;
        const pos = d.basePos.clone().add(volcanoDir.clone().multiplyScalar(d.height));
        ePositions[i * 3]     = pos.x;
        ePositions[i * 3 + 1] = pos.y;
        ePositions[i * 3 + 2] = pos.z;
      }
      emberGeo.attributes.position.needsUpdate = true;
    }
  
    // Tornadoes
    const tornadoOpacity = Math.max(0, Math.min(1.0, (t - 0.35) * 2.5));
    if (tornadoOpacity > 0) {
      tornadoes.forEach(tor => {
        tor.mat.opacity = tornadoOpacity * 0.5;
        tor.driftAngle += tor.driftSpeed * delta;
        const rotMatrix = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0).cross(tor.dir).normalize() || new THREE.Vector3(0, 0, 1),
          tor.driftSpeed * delta
        );
        tor.dir.applyMatrix4(rotMatrix).normalize();
        
        if (Math.abs(tor.dir.y) < 0.9) {
          tor.t1.crossVectors(tor.dir, new THREE.Vector3(0, 1, 0)).normalize();
        } else {
          tor.t1.crossVectors(tor.dir, new THREE.Vector3(1, 0, 0)).normalize();
        }
        tor.t2.crossVectors(tor.dir, tor.t1).normalize();
        tor.basePos = tor.dir.clone().multiplyScalar(tor.surfaceRadius);
  
        const tpArr = tor.geo.attributes.position.array;
        for (let i = 0; i < tor.count; i++) {
          const d = tor.particles[i];
          d.angle += d.angularSpeed * delta;
          const wobbleOff = Math.sin(elapsed * 2.0 + d.heightRatio * 4.0) * d.wobble;
          const curR = d.funnelRadius + wobbleOff * 0.02;
          const pt = tor.basePos.clone()
            .add(tor.dir.clone().multiplyScalar(d.height))
            .add(tor.t1.clone().multiplyScalar(Math.cos(d.angle) * curR))
            .add(tor.t2.clone().multiplyScalar(Math.sin(d.angle) * curR));
          tpArr[i * 3] = pt.x; tpArr[i * 3 + 1] = pt.y; tpArr[i * 3 + 2] = pt.z;
        }
        tor.geo.attributes.position.needsUpdate = true;
      });
    } else {
      tornadoes.forEach(tor => { tor.mat.opacity = 0; });
    }
  
    // Volcano 2
    const v2CraterOp = Math.max(0, Math.min(0.6, (t - 0.4) * 1.5));
    crater2Mat.opacity = v2CraterOp * (0.4 + Math.sin(elapsed * 10.0) * 0.12);
    lava2Mat.opacity = v2CraterOp * (0.25 + Math.sin(elapsed * 3.5) * 0.12);
    volcano2Light.intensity = v2CraterOp * (1.0 + Math.sin(elapsed * 4.5) * 0.5);
  
    const v2VolcanoOp = Math.max(0, Math.min(0.55, (t - 0.5) * 1.5));
    vol2Mat.opacity = v2VolcanoOp;
    if (v2VolcanoOp > 0) {
      const v2Positions = vol2Geo.attributes.position.array;
      const v2ColArr = vol2Geo.attributes.color.array;
      for (let i = 0; i < vol2Count; i++) {
        const data = vol2Data[i];
        data.age += delta;
        if (data.age >= data.life) {
          resetVol2Particle(i);
        } else {
          const gDir = data.pos.clone().normalize();
          data.vel.addScaledVector(gDir, -0.4 * delta);
          data.pos.addScaledVector(data.vel, delta);
          v2Positions[i * 3] = data.pos.x; v2Positions[i * 3 + 1] = data.pos.y; v2Positions[i * 3 + 2] = data.pos.z;
          const prog = data.age / data.life;
          if (data.isLava) {
            v2ColArr[i * 3] = 1.0 - prog * 0.3; v2ColArr[i * 3 + 1] = Math.max(0, 0.9 - prog); v2ColArr[i * 3 + 2] = Math.max(0, 0.2 - prog * 0.35);
          } else {
            v2ColArr[i * 3] = Math.max(0.08, 0.45 - prog * 0.4); v2ColArr[i * 3 + 1] = Math.max(0.08, 0.4 - prog * 0.4); v2ColArr[i * 3 + 2] = Math.max(0.08, 0.38 - prog * 0.4);
          }
        }
      }
      vol2Geo.attributes.position.needsUpdate = true;
      vol2Geo.attributes.color.needsUpdate = true;
    }
  
    // Lightning
    if (t > 0.45) {
      lightningCountdown -= delta;
      if (lightningCountdown <= 0) {
        createLightningStrike();
        const frequencyFactor = 1.5 - (t - 0.45) * 1.2;
        lightningCountdown = Math.max(0.18, Math.random() * frequencyFactor);
      }
    }
  
    if (lightFlashTime > 0) {
      lightFlashTime -= delta;
      if (lightFlashTime <= 0) {
        orbAmbient.intensity = 0.6 - t * 0.3;
        orbDir.intensity = 1.0 - t * 0.4;
        while (lightningBoltsGroup.children.length > 0) {
          const line = lightningBoltsGroup.children[0];
          line.geometry.dispose();
          line.material.dispose();
          lightningBoltsGroup.remove(line);
        }
      } else {
        const flicker = Math.sin(lightFlashTime * 80.0) > 0 ? 1 : 0;
        if (flicker) {
          orbAmbient.intensity = 1.6;
          orbDir.intensity = 3.0;
          orbAmbient.color.setHex(0xbbf7d0);
          orbDir.color.setHex(0xffffff);
        } else {
          orbAmbient.intensity = 0.3;
          orbDir.intensity = 0.5;
        }
      }
    } else {
      const healthy = new THREE.Color(0xffffff);
      const dying   = new THREE.Color(0xff6633);
      orbAmbient.color.copy(healthy).lerp(dying, t);
      orbDir.color.copy(healthy).lerp(dying, t * 0.8);
      orbAmbient.intensity = 0.6 - t * 0.3;
      orbDir.intensity = 1.0 - t * 0.4;
    }
   
    orbRenderer.render(orbScene, orbCamera);
  }
  
  animateOrb();
  
  // Resize handler
  window.addEventListener('resize', () => {
    orbW = orbContainer.clientWidth || 320;
    orbH = orbContainer.clientHeight || 320;
    orbCamera.aspect = orbW / orbH;
    orbCamera.updateProjectionMatrix();
    orbRenderer.setSize(orbW, orbH);
  });

  /* ══════════════════════════════════════════════
     2. CARBON CALCULATOR SLIDER LOGIC
     ══════════════════════════════════════════════ */
  const TRANSPORT_FACTOR = 0.178;
  const PLASTIC_FACTOR   = 0.85;
  const ELECTRIC_FACTOR  = 0.155;
  const WASTE_FACTOR     = 1.25;
  const DIET_FACTOR      = 1.95;
  
  const GLOBAL_AVG_CO2   = 10.4;
  
  const ECO_LEVELS = [
    { max: 5.0, text: 'Xuất sắc – Rất tốt', color: '#4ade80', pct: 95 },
    { max: 10.4, text: 'Tốt – Ổn định', color: '#86efac', pct: 78 },
    { max: 18.0, text: 'Trung bình', color: '#fbbf24', pct: 52 },
    { max: 28.0, text: 'Đáng lo ngại', color: '#fb923c', pct: 30 },
    { max: Infinity, text: 'Nguy hiểm – Xấu', color: '#ef4444', pct: 10 }
  ];

  let displayedCO2 = 12.5;
  let targetCO2 = 12.5;
  let animFrame = null;
  
  const sliders = {
    transport: document.getElementById('transportSlider'),
    plastic: document.getElementById('plasticSlider'),
    electric: document.getElementById('electricSlider'),
    waste: document.getElementById('wasteSlider'),
    diet: document.getElementById('dietSlider'),
  };
  
  const valDisplays = {
    transport: document.getElementById('transportVal'),
    plastic: document.getElementById('plasticVal'),
    electric: document.getElementById('electricVal'),
    waste: document.getElementById('wasteVal'),
    diet: document.getElementById('dietVal'),
  };

  function calcCO2() {
    const tVal = parseFloat(sliders.transport.value) || 0;
    const pVal = parseFloat(sliders.plastic.value) || 0;
    const eVal = parseFloat(sliders.electric.value) || 0;
    const wVal = parseFloat(sliders.waste.value) || 0;
    const dVal = parseFloat(sliders.diet.value) || 0;
    return (tVal * TRANSPORT_FACTOR) + (pVal * PLASTIC_FACTOR) + (eVal * ELECTRIC_FACTOR) + (wVal * WASTE_FACTOR) + (dVal * DIET_FACTOR);
  }

  function updateSliderTrack(slider) {
    if (!slider) return;
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #4ade80 ${pct}%, rgba(255,255,255,0.14) ${pct}%)`;
  }

  function updateEcosystem(co2) {
    const lvl = ECO_LEVELS.find(l => co2 <= l.max);
    const diff = co2 - GLOBAL_AVG_CO2;
   
    document.getElementById('ecoStatusText').textContent = lvl.text;
    document.getElementById('ecoPct').textContent         = lvl.pct + '%';
    document.getElementById('ecoPct').style.color         = lvl.color;
    
    const rotation = -45 + (lvl.pct / 100) * 180;
    const ecoGauge = document.getElementById('ecoGauge');
    if (ecoGauge) {
      ecoGauge.style.transform   = `rotate(${rotation}deg)`;
      ecoGauge.style.borderColor = `${lvl.color} ${lvl.color} transparent transparent`;
    }
   
    const offsetKg = -(co2 * 0.25).toFixed(1);
    document.getElementById('carbonOffset').textContent = offsetKg + ' kg';
   
    const trees = Math.ceil((co2 * 365) / 21);
    document.getElementById('treesNeeded').textContent = `~${trees} cây`;
   
    const vsEl = document.getElementById('vsAvg');
    if (vsEl) {
      if (diff >= 0) {
        vsEl.textContent = `+${diff.toFixed(1)} kg`;
        vsEl.style.color = '#fb923c';
      } else {
        vsEl.textContent = `${diff.toFixed(1)} kg`;
        vsEl.style.color = '#86efac';
      }
    }
  }

  function animateCO2(target) {
    if (animFrame) cancelAnimationFrame(animFrame);
    function step() {
      displayedCO2 += (target - displayedCO2) * 0.12;
      if (Math.abs(displayedCO2 - target) < 0.015) displayedCO2 = target;
      document.getElementById('co2Display').textContent = displayedCO2.toFixed(1) + ' kg CO2/ngày';
      if (Math.abs(displayedCO2 - target) > 0.01) animFrame = requestAnimationFrame(step);
    }
    step();
  }

  function onSliderChange() {
    valDisplays.transport.textContent = sliders.transport.value;
    valDisplays.plastic.textContent   = sliders.plastic.value;
    valDisplays.electric.textContent  = sliders.electric.value;
    valDisplays.waste.textContent     = sliders.waste.value;
    valDisplays.diet.textContent      = sliders.diet.value;
   
    Object.values(sliders).forEach(updateSliderTrack);
   
    targetCO2 = calcCO2();
    animateCO2(targetCO2);
   
    const maxCO2 = 100 * TRANSPORT_FACTOR + 20 * PLASTIC_FACTOR + 50 * ELECTRIC_FACTOR + 10 * WASTE_FACTOR + 3 * DIET_FACTOR;
    targetIntensity = targetCO2 / maxCO2;
   
    const orbEl = document.getElementById('orbContainer');
    if (orbEl) {
      orbEl.classList.remove('orb-flash');
      void orbEl.offsetWidth;
      orbEl.classList.add('orb-flash');
    }
   
    updateEcosystem(targetCO2);
  }

  /* ══════════════════════════════════════════════
     3. REPORT MODAL FUNCTIONS
     ══════════════════════════════════════════════ */
  window.openReportModal = function () {
    document.getElementById('reportTime').textContent = new Date().toLocaleString('vi-VN');
    document.getElementById('reportCo2').textContent = targetCO2.toFixed(1) + ' kg CO2/ngày';
    
    const lvl = ECO_LEVELS.find(l => targetCO2 <= l.max);
    document.getElementById('reportStatus').textContent = lvl.text;
    document.getElementById('reportStatus').style.color = lvl.color;
    
    document.getElementById('repValTransport').textContent = sliders.transport.value + ' km/ngày';
    document.getElementById('repValPlastic').textContent = sliders.plastic.value + ' món/ngày';
    document.getElementById('repValElectric').textContent = sliders.electric.value + ' kWh/ngày';
    document.getElementById('repValWaste').textContent = sliders.waste.value + ' kg/ngày';
    document.getElementById('repValDiet').textContent = sliders.diet.value + ' bữa/ngày';
    
    document.getElementById('reportModal').classList.add('active');
  };
  
  window.closeReportModalDirect = function () {
    const reportModal = document.getElementById('reportModal');
    if (reportModal) reportModal.classList.remove('active');
  };
  
  window.closeReportModal = function (e) {
    if (e.target.id === 'reportModal') window.closeReportModalDirect();
  };
  
  window.saveReportAlert = function () {
    alert('✓ Báo cáo sinh thái của bạn đã được xuất và lưu thành công!');
    window.closeReportModalDirect();
  };
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeReportModalDirect();
  });

  // ── News Ticker ──
  const NEWS = [
    '<strong>LIVE:</strong> Global reforestation initiative achieves 1 million trees planted...',
    'New study shows record adoption of solar energy in cities...',
    'Community cleanup removes 5 tons of plastic from oceans...',
    'Vietnam launches national carbon neutrality roadmap for 2050...',
    'Scientists report 12% recovery in coral reef coverage this year...',
    'EV adoption surpasses 30% globally for the first time...',
  ];
  const ti = document.getElementById('tickerInner');
  if (ti) {
    [...NEWS, ...NEWS].forEach(item => {
      const s = document.createElement('span');
      s.innerHTML = item + '&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;';
      ti.appendChild(s);
    });
  }

  // ── Init on load ──
  function initCalculator() {
    Object.values(sliders).forEach(updateSliderTrack);
    onSliderChange();
    
    Object.values(sliders).forEach((slider) => {
      slider.addEventListener('input', onSliderChange);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }
})();
```

---

## 🔍 GIẢI THÍCH CHI TIẾT CÁC THUẬT TOÁN ĐỒ ÁN CỦA BẠN

### 1. Phép tính hạt magma núi lửa phun trào
*   `gravityStrength = 0.45 * delta`: Mỗi hạt magma bay ra có một vận tốc ban đầu hướng chéo lên. Lực trọng lực kéo hạt rơi xuống được tính bằng cách nhân hướng tâm Trái Đất `gravityDir` với gia tốc và nhân khoảng thời gian sai lệch khung hình `delta`. Nhờ vậy hạt bay uốn cong thành hình vòm cung rồi rơi sập xuống bề mặt Trái Đất.
*   `resetVolcanoParticle(i)`: Khi hạt magma có tuổi thọ `age` vượt quá giới hạn ngẫu nhiên `life`, ta thiết lập lại tọa độ hạt trở về vị trí miệng núi lửa `craterPos` và sinh lại vận tốc mới, tránh việc các hạt bay vô hạn ra ngoài không gian gây lãng phí bộ nhớ.

### 2. Thuật toán dựng lốc xoáy (Cyclone) bằng Hệ tọa độ cực
*   `Math.cos(d.angle) * curR` và `Math.sin(d.angle) * curR`: Lốc xoáy là tập hợp hạt xoay quanh trục nghiêng hướng ra ngoài. Tại mỗi khung hình, góc xoay `d.angle` tăng dần theo vận tốc góc. Ta lấy hình nón có bán kính tăng dần theo độ cao hạt `curR` rồi áp dụng lượng giác để tính độ lệch X, Y của hạt quanh trục lốc xoáy.

### 3. Giải thuật vẽ tia sét giật cục (Lightning Strike)
*   `THREE.Line(lightningGeo, lightningMat)`: Tia sét được tạo từ một chuỗi các đoạn thẳng nối tiếp nhau.
*   `lerpVectors(startPos, endPos, fraction)`: Để tạo dáng sét ngoằn ngoèo, ta lấy các điểm nội suy tuyến tính giữa mây và đất, sau đó cộng thêm một vector dịch lệch ngẫu nhiên `randVec` vuông góc với tia sét để làm gãy gập các điểm giữa.
*   **Chớp sét:** Khi sét đánh, ta tăng độ sáng đèn AmbientLight từ mức $0.6$ lên mức cực đại $1.6$ và đèn DirectionalLight lên mức $3.0$ trong thời gian ngắn ngủi ($0.15$ giây) để tạo cảm giác toàn bộ mô hình Trái Đất rực sáng giật cục.

---

## ❓ CÂU HỎI PHẢN BIỆN THƯỜNG GẶP CỦA HỘI ĐỒNG (VÀ ĐÁP ÁN)

1.  **Hỏi:** *Làm thế nào để thay đổi màu sắc và trạng thái hủy diệt của Trái Đất khi lượng CO₂ tăng cao?*
    *   **Đáp:** Dựa vào lượng phát thải carbon tổng kết, ta tính ra hệ số hủy diệt `targetIntensity` từ 0 đến 1. Chỉ số này điều khiển lớp lọc đồ họa CSS filter của Canvas: `grayscale` (xám màu), `sepia` (úa vàng cổ xưa), và `brightness` (tối tăm). Ngoài ra, độ đục `opacity` của các hạt khói độc và bụi lửa cũng tăng tương ứng để che mờ Trái Đất.
2.  **Hỏi:** *Tại sao các hạt dung nham núi lửa lại hiển thị được hai tông màu Đỏ-Vàng (đá nóng chảy) và Xám-Đen (tro bụi) khác nhau?*
    *   **Đáp:** Ta khai báo mảng màu sắc `volColors` tương ứng với mỗi hạt dung nham. Khi hạt mới sinh, ta random xem hạt đó là dung nham hay tro bụi (`isLava`). Nếu là dung nham, ta truyền màu sắc đỏ cam, nếu là tro bụi, ta truyền màu xám nâu. Khi hạt bay ra xa, ta giảm sắc đỏ và tăng sắc đen nguội lạnh theo tỷ lệ thời gian sống của hạt.

---

## ✍️ HƯỚNG DẪN VIẾT LẠI CODE MẪU TỐI GIẢN
Code mẫu JS tạo hạt núi lửa phun trào bay chéo lên và bị hút rơi xuống bằng vector trọng lực:

```javascript
const gravity = new THREE.Vector3(0, -9.8, 0); // Lực hút hướng xuống
const pos = new THREE.Vector3(0, 0, 0);       // Điểm miệng núi lửa
const vel = new THREE.Vector3(2, 8, 0);        // Vận tốc bay lên ban đầu

function updateParticle(delta) {
  // Cập nhật vận tốc chịu tác động trọng lực
  vel.addScaledVector(gravity, delta);
  
  // Dịch chuyển hạt theo vận tốc mới
  pos.addScaledVector(vel, delta);
  
  if (pos.y < 0) {
    pos.set(0, 0, 0); // Reset hạt khi rơi xuống đất
    vel.set(2, 8, 0); // Reset vận tốc
  }
}
```
