/* ══════════════════════════════════════════════════════════════
   EcoImpact — 3D Background  (Three.js)
   Fullscreen animated scene: wireframe Earth globe + particles
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Container ─────────────────────────────── */
  const container = document.createElement('div');
  container.id = 'bg3d';
  container.style.cssText =
    'position:fixed;inset:0;z-index:-1;overflow:hidden;';
  document.body.prepend(container);

  // Glow backdrop — ánh sáng xanh lá phát ra từ phía sau model
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:fixed;z-index:-2;pointer-events:none;
    width:1200px;height:1200px;
    top:50%;left:50%;
    transform:translate(-50%,-50%);
    background:radial-gradient(circle,
      rgba(74,222,128,0.20) 0%,
      rgba(34,197,94,0.12) 30%,
      rgba(22,163,74,0.05) 55%,
      transparent 70%);
    filter:blur(50px);
    animation:glowPulse 6s ease-in-out infinite;
  `;
  document.body.prepend(glow);

  // CSS animation for glow pulse
  const glowStyle = document.createElement('style');
  glowStyle.textContent = `
    @keyframes glowPulse {
      0%,100% { opacity:0.7; transform:translate(-50%,-50%) scale(1); }
      50%     { opacity:1;   transform:translate(-50%,-50%) scale(1.15); }
    }
  `;
  document.head.appendChild(glowStyle);

  /* ── Scene / Camera / Renderer ─────────────── */
  const scene    = new THREE.Scene();
  const fogColor = new THREE.Color(0x1f201a); // Màu khói bụi ô nhiễm (xám ám vàng nhẹ)
  scene.background = fogColor;
  scene.fog = new THREE.FogExp2(fogColor, 0.24); // Tăng sương mù cực dày để che lấp các cạnh viền bị cắt của model
  
  const camera   = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 4.6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3; // Tăng sáng tổng thể để ánh sáng rực rỡ hơn
  renderer.shadowMap.enabled = true; // Bật đổ bóng
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Bóng mềm chân thực
  
  container.appendChild(renderer.domElement);

  /* ── Colors & Config (Sửa lại tông màu mây trời hoạt hình) ── */
  const GREEN_PRIMARY   = 0x4ade80; // Xanh da trời
  const GREEN_GLOW      = 0xffffff; // Trắng (giống mây/sao)
  const GREEN_DIM       = 0x86efac;
  const PARTICLE_COUNT  = 800; // Giảm bớt số lượng particle cho nhẹ nhàng
  const EARTH_SEGMENTS  = 64;

  /* ══════════════════════════════════════════════
     1. EARTH GLOBE — wireframe + atmosphere
  ══════════════════════════════════════════════ */
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  // Add lights for the plant model
  const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambLight);
  
  const dirLight = new THREE.DirectionalLight(0xffdfb3, 6.0); // Ánh sáng mặt trời hơi vàng/cam, siêu mạnh
  dirLight.position.set(12, 18, 10);
  dirLight.castShadow = true;
  
  // Thêm đèn Fill/Rim light (màu xanh cyan) hắt từ dưới/sau lưng để tạo khối nổi (Cinema 3-point lighting)
  const rimLight = new THREE.DirectionalLight(0x4ade80, 3.5);
  rimLight.position.set(-10, -5, -10);
  scene.add(rimLight);
  // Cấu hình độ phân giải và vùng phủ của bóng râm
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.0001; // Giảm viền đen răng cưa
  scene.add(dirLight);

  // Load the Earth model
  const loader = new THREE.GLTFLoader();
  let loadedEarth = null;
  let mixer = null; // Thêm mixer để chạy animation

  loader.load('./caytrangchu.glb', function (gltf) {
    loadedEarth = gltf.scene;
    
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(loadedEarth);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Calculate scale to fit our ~3.0 unit diameter (radius 1.5)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 20.0 / maxDim; // Phóng to hơn nữa
    loadedEarth.scale.set(scale, scale, scale);
    
    // Center it
    loadedEarth.position.x = -center.x * scale;
    loadedEarth.position.y = -center.y * scale;
    loadedEarth.position.z = -center.z * scale;

    // Chạy Animation nếu model có chứa hoạt ảnh
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(loadedEarth);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    // Improve texture quality (anisotropy) to prevent blurriness
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    
    loadedEarth.traverse((child) => {
      if (child.isMesh) {
        // Bật đổ bóng và nhận bóng cho từng phần tử của model
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          const applyAnisotropy = (map) => {
            if (map) {
              map.anisotropy = maxAnisotropy;
              map.needsUpdate = true; // Bắt buộc render lại texture
              map.minFilter = THREE.LinearMipmapLinearFilter; // Tăng độ nét
              map.magFilter = THREE.LinearFilter;
            }
          };

          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            applyAnisotropy(mat.map);
            applyAnisotropy(mat.emissiveMap);
            applyAnisotropy(mat.normalMap);
            applyAnisotropy(mat.roughnessMap);
            applyAnisotropy(mat.metalnessMap);
          });
        }
      }
    });

    earthGroup.add(loadedEarth);
  }, undefined, function (error) {
    console.error('Error loading earth.glb:', error);
  });

  /* ══════════════════════════════════════════════
     2. PARTICLES — floating around the globe
  ══════════════════════════════════════════════ */
  const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  const particleSpeeds    = new Float32Array(PARTICLE_COUNT);
  const particleOffsets   = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 2.0 + Math.random() * 5.5;

    particlePositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = r * Math.cos(phi);

    particleSpeeds[i]  = 0.0003 + Math.random() * 0.0012;
    particleOffsets[i]  = Math.random() * Math.PI * 2;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: GREEN_GLOW,
    size: 0.018,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Additional larger, dimmer particles for depth
  const bigParticleCount = 300;
  const bigPPos = new Float32Array(bigParticleCount * 3);
  for (let i = 0; i < bigParticleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 3.5 + Math.random() * 6;
    bigPPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    bigPPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bigPPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const bigPGeo = new THREE.BufferGeometry();
  bigPGeo.setAttribute('position', new THREE.BufferAttribute(bigPPos, 3));
  const bigPMat = new THREE.PointsMaterial({
    color: 0x86efac,
    size: 0.04,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(bigPGeo, bigPMat));


  /* ══════════════════════════════════════════════
     3. CONNECTING LINES — network effect
  ══════════════════════════════════════════════ */
  const lineCount  = 12;
  const lineGeoArr = [];

  for (let i = 0; i < lineCount; i++) {
    const theta1 = Math.random() * Math.PI * 2;
    const phi1   = Math.acos(2 * Math.random() - 1);
    const theta2 = theta1 + (Math.random() - 0.5) * 1.2;
    const phi2   = phi1 + (Math.random() - 0.5) * 0.8;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(
        1.52 * Math.sin(phi1) * Math.cos(theta1),
        1.52 * Math.sin(phi1) * Math.sin(theta1),
        1.52 * Math.cos(phi1),
      ),
      new THREE.Vector3(
        2.2 * Math.sin((phi1+phi2)/2) * Math.cos((theta1+theta2)/2),
        2.2 * Math.sin((phi1+phi2)/2) * Math.sin((theta1+theta2)/2),
        2.2 * Math.cos((phi1+phi2)/2),
      ),
      new THREE.Vector3(
        1.52 * Math.sin(phi2) * Math.cos(theta2),
        1.52 * Math.sin(phi2) * Math.sin(theta2),
        1.52 * Math.cos(phi2),
      ),
    );

    const pts = curve.getPoints(30);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({
      color: GREEN_GLOW,
      transparent: true,
      opacity: 0.08 + Math.random() * 0.07,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    earthGroup.add(line);
    lineGeoArr.push(line);
  }


  /* ══════════════════════════════════════════════
     4. ORBIT RINGS
  ══════════════════════════════════════════════ */
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.RingGeometry(2.0 + i * 0.8, 2.02 + i * 0.8, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: GREEN_PRIMARY,
      transparent: true,
      opacity: 0.04 - i * 0.008,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.35;
    ring.rotation.y = i * 0.4;
    scene.add(ring);
  }


  /* ══════════════════════════════════════════════
     5. ORBIT CONTROLS + SCROLL GROWTH
  ══════════════════════════════════════════════ */
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.75;

  // Scroll-based camera orbit — smooth continuous movement
  let scrollPct = 0;       // raw scroll position
  let smoothPct = 0;       // smoothed scroll position
  let currentAngle = 0;
  let currentHeight = 0.6;
  let currentRadius = 5.0;

  window.addEventListener('scroll', () => {
    const scrollMax = document.body.scrollHeight - window.innerHeight;
    scrollPct = Math.min(window.scrollY / scrollMax, 1.0);
  }, { passive: true });


  /* ══════════════════════════════════════════════
     6. POST-PROCESSING — Bloom + Vignette
  ══════════════════════════════════════════════ */
  const composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom: (resolution, strength, radius, threshold)
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    0.6,    // strength — cường độ phát sáng
    0.8,    // radius — bán kính lan tỏa
    0.35    // threshold — ngưỡng sáng bắt đầu bloom
  );
  composer.addPass(bloomPass);

  // CSS Vignette overlay cho viền tối điện ảnh
  const vignette = document.createElement('div');
  vignette.style.cssText = `
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(ellipse at 50% 50%,
      transparent 40%,
      rgba(0,0,0,0.25) 70%,
      rgba(0,0,0,0.55) 100%);
  `;
  container.appendChild(vignette);

  // Lens blur ring — vòng blur nhẹ xung quanh ống kính camera
  const lensRing = document.createElement('div');
  lensRing.style.cssText = `
    position:fixed;inset:0;z-index:1;pointer-events:none;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    mask-image: radial-gradient(ellipse 55% 55% at 50% 50%,
      transparent 55%,
      black 70%,
      black 100%);
    -webkit-mask-image: radial-gradient(ellipse 55% 55% at 50% 50%,
      transparent 55%,
      black 70%,
      black 100%);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  `;
  container.appendChild(lensRing);

  // Soft glow ring — viền phát sáng nhẹ
  const glowRing = document.createElement('div');
  glowRing.style.cssText = `
    position:fixed;inset:0;z-index:1;pointer-events:none;
    background:radial-gradient(ellipse 60% 60% at 50% 50%,
      transparent 45%,
      rgba(74,222,128,0.06) 55%,
      rgba(74,222,128,0.12) 62%,
      rgba(74,222,128,0.04) 72%,
      transparent 85%);
  `;
  container.appendChild(glowRing);


  /* ══════════════════════════════════════════════
     7. ANIMATION LOOP
  ══════════════════════════════════════════════ */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.elapsedTime;

    // Cập nhật animation
    if (mixer) mixer.update(delta);

    // ── OrbitControls
    controls.update();

    // ── Smooth scroll following (high-quality lerp)
    smoothPct += (scrollPct - smoothPct) * 0.06;

    // Scroll drives a full 360° rotation across the page
    const targetAngle = smoothPct * Math.PI * 2;

    // Sine-wave zoom: breathes in/out 2 times across the scroll
    const zoomCenter = 4.2;
    const zoomAmplitude = 1.8;
    const targetRadius = zoomCenter + Math.sin(smoothPct * Math.PI * 4) * zoomAmplitude;

    // Gentle height wave: camera bobs up and down
    const heightCenter = 0.4;
    const heightAmp = 0.5;
    const targetHeight = heightCenter + Math.sin(smoothPct * Math.PI * 2) * heightAmp;

    // Ultra-smooth lerp for cinematic feel
    currentAngle  += (targetAngle  - currentAngle)  * 0.08;
    currentRadius += (targetRadius - currentRadius) * 0.06;
    currentHeight += (targetHeight - currentHeight) * 0.06;

    // Apply to camera
    const camX = Math.sin(currentAngle) * currentRadius;
    const camZ = Math.cos(currentAngle) * currentRadius;
    const camY = currentHeight * 2.0;
    camera.position.set(camX, camY, camZ);
    controls.target.set(0, 0, 0);

    // ── Floating particles gentle motion
    const positions = particleGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const off = particleOffsets[i];
      const spd = particleSpeeds[i];
      positions[i * 3]     += Math.sin(t * spd * 50 + off) * 0.001;
      positions[i * 3 + 1] += Math.cos(t * spd * 40 + off) * 0.0008;
      positions[i * 3 + 2] += Math.sin(t * spd * 35 + off + 1.5) * 0.0006;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // ── Ánh sáng xoay quanh model (đổi chiều liên tục)
    const lightRadius = 15;
    const lightSpeed = 0.15; // tốc độ xoay (chậm = cinematic)
    dirLight.position.x = Math.sin(t * lightSpeed) * lightRadius;
    dirLight.position.z = Math.cos(t * lightSpeed) * lightRadius;
    dirLight.position.y = 12 + Math.sin(t * lightSpeed * 0.5) * 5; // lên xuống nhẹ

    // Rim light đối diện — luôn ở phía sau model so với key light
    rimLight.position.x = -dirLight.position.x * 0.7;
    rimLight.position.z = -dirLight.position.z * 0.7;

    // Render qua post-processing pipeline (Bloom)
    composer.render();
  }

  animate();


  /* ══════════════════════════════════════════════
     8. RESIZE HANDLER
  ══════════════════════════════════════════════ */
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  }, { passive: true });

})();
