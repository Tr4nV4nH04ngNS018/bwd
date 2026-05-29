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
  const fogColor = new THREE.Color(0x0e100e); // Tông xám đen ô nhiễm của khói bụi bão táp
  scene.background = fogColor;
  scene.fog = new THREE.FogExp2(fogColor, 0.28); // Tăng mật độ sương mù (smog) dày đặc từ 0.22 lên 0.28
  
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

  // Tạo bản đồ môi trường phản chiếu giả lập (Procedural IBL Environment Map)
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
  
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(100, 32, 16);
  const envMat = new THREE.MeshBasicMaterial({ color: 0x050c0a, side: THREE.BackSide });
  const envMesh = new THREE.Mesh(envGeo, envMat);
  envScene.add(envMesh);
  
  // Các khối phản quang sáng để in bóng lên bề mặt ướt của cây
  const envSunSphere = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffeed0 }));
  envSunSphere.position.set(30, 40, 20);
  envScene.add(envSunSphere);
  
  const envSkySphere = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 16), new THREE.MeshBasicMaterial({ color: 0x90c0ff }));
  envSkySphere.position.set(-30, 40, -30);
  envScene.add(envSkySphere);
  
  const envGroundSphere = new THREE.Mesh(new THREE.SphereGeometry(25, 16, 16), new THREE.MeshBasicMaterial({ color: 0x030805 }));
  envGroundSphere.position.set(0, -40, 0);
  envScene.add(envGroundSphere);
  
  cubeCamera.update(renderer, envScene);
  scene.environment = cubeRenderTarget.texture;

  /* ── Colors & Config (Sửa lại tông màu mây trời hoạt hình) ── */
  const GREEN_PRIMARY   = 0x4ade80; // Xanh da trời
  const GREEN_GLOW      = 0xffffff; // Trắng (giống mây/sao)
  const GREEN_DIM       = 0x86efac;
  const PARTICLE_COUNT  = 1000; // Tăng lượng bụi bẩn lơ lửng để làm đậm bầu không khí ô nhiễm
  const EARTH_SEGMENTS  = 64;

  /* ══════════════════════════════════════════════
     1. EARTH GLOBE — wireframe + atmosphere
  ══════════════════════════════════════════════ */
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  // Hệ thống chiếu sáng 3 điểm cao cấp (Cinematic Lighting) - Giảm cường độ tránh chói mắt
  const ambLight = new THREE.AmbientLight(0x0c131a, 0.20); // Ánh sáng môi trường dịu nhẹ giữ độ sâu bóng tối
  scene.add(ambLight);

  // HemisphereLight giả lập ánh sáng bầu trời tán xạ (sky blue) phản chiếu xuống đất rừng (forest green)
  const hemiLight = new THREE.HemisphereLight(0xb0d0ff, 0x050c08, 0.85); // Giảm từ 1.4 để bớt chói
  scene.add(hemiLight);
  
  const dirLight = new THREE.DirectionalLight(0xffdfb3, 3.8); // Giảm từ 6.0 xuống 3.8 tránh cháy sáng
  dirLight.position.set(-10, 18, -12); // Ánh sáng đứng yên một chỗ phía trên bên trái (sau model) để tạo backlight ấn tượng
  dirLight.castShadow = true;
  
  // Thêm đèn Fill/Rim light hắt từ dưới/sau lưng để tạo khối nổi
  const rimLight = new THREE.DirectionalLight(0x4ade80, 1.8); // Giảm từ 3.5 xuống 1.8 giúp ánh sáng dịu hơn
  rimLight.position.set(7, -5, 8.4); // Rim light đối diện cố định
  scene.add(rimLight);
  // Cấu hình độ phân giải cực nét 4K và vùng phủ của bóng râm
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.0005; // Giảm răng cưa và khớp bóng chính xác
  scene.add(dirLight);


  // Mảng lưu trữ chất liệu môi trường để tạo hiệu ứng ướt mưa động
  const wetMaterials = [];

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

            // Cực kỳ quan trọng: hiển thị 2 mặt cho lá cây/vật thể mỏng
            mat.side = THREE.DoubleSide;
            
            // Tinh chỉnh lá cây (LeafCard) để tránh răng cưa trắng, sẫm màu tự nhiên và tránh cháy sáng
            if (mat.name.toLowerCase().includes('leaf')) {
              mat.transparent = true;
              mat.alphaTest = 0.52; // Cắt tỉa viền thô ráp của thẻ lá
              mat.color.setHex(0x5dbb7d); // Đổi sang màu xanh lục tự nhiên, dịu mát hơn màu bạc trắng
              if (mat.emissive) {
                mat.emissive.setHex(0x0a2f14); // Phát quang nhẹ màu xanh rừng già
                mat.emissiveIntensity = 0.15;
              }
              mat.roughness = 0.65;
              mat.metalness = 0.05;
            }
            
            // Lưu lại các chất liệu môi trường (Đất, Đá, Thân cây) để tạo hiệu ứng ướt mưa động
            if (mat.name === 'Ground' || mat.name === 'Rock' || mat.name === 'Stump') {
              if (mat.normalMap) {
                // Tăng cường độ gồ ghề nổi khối của vân gốc lên gấp 3.5 lần để tạo độ sần sùi chân thực không bị lỗi lưới
                mat.normalScale.set(3.5, 3.5);
              }
              
              wetMaterials.push({
                material: mat,
                baseRoughness: mat.name === 'Ground' ? 0.96 : (mat.name === 'Rock' ? 0.85 : 0.90),
                baseMetalness: mat.name === 'Ground' ? 0.01 : 0.05,
                wetRoughness: mat.name === 'Ground' ? 0.18 : 0.22,
                wetMetalness: mat.name === 'Ground' ? 0.14 : 0.16,
                name: mat.name
              });
            }

            // Tạo hiệu ứng bóng bẩy, ẩm ướt sau cơn mưa bão (wet highlights)
            // Trả lại chất liệu tự nhiên của gỗ và lá cây, tránh bóng loáng giả tạo
            // Giữ nguyên bản roughness và metalness từ file glb của họa sĩ
            if (mat.clearcoat !== undefined && mat.name !== 'Ground' && mat.name !== 'Rock' && mat.name !== 'Stump') {
              mat.clearcoat = 0.0; // Tắt lớp bóng clearcoat nhân tạo cho các bộ phận khác
            }
          });
        }
      }
    });


    earthGroup.add(loadedEarth);
    if (typeof window.triggerPageLoaded === 'function') {
      window.triggerPageLoaded();
    }
  }, undefined, function (error) {
    console.error('Error loading earth.glb:', error);
    if (typeof window.triggerPageLoaded === 'function') {
      window.triggerPageLoaded();
    }
  });

  /* ══════════════════════════════════════════════
     1.5 RAIN & LIGHTNING — Mưa sấm chớp giông bão
     ══════════════════════════════════════════════ */
  let rainParticles = null;
  let rainGeometry = null;
  const rainCount = 4000; // Tăng lượng mưa từ 1500 lên 4000 để tạo cơn mưa lớn dày đặc
  const rainData = []; // Lưu tốc độ và gió nghiêng riêng từng hạt

  function createRainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    
    // Đường vẽ mưa mờ dần hai đầu (streak)
    const grad = ctx.createLinearGradient(32, 0, 32, 64);
    grad.addColorStop(0, 'rgba(174, 219, 255, 0)');      // Mờ ở đầu
    grad.addColorStop(0.3, 'rgba(180, 225, 255, 0.75)');  // Sáng màu mưa xanh nước biển nhạt dày hơn
    grad.addColorStop(0.7, 'rgba(180, 225, 255, 0.75)');
    grad.addColorStop(1, 'rgba(174, 219, 255, 0)');      // Mờ ở đuôi
    
    ctx.fillStyle = grad;
    ctx.fillRect(30, 0, 4, 64); // Vẽ vệt mưa dày rộng 4px ở giữa (tăng từ 2px)
    return new THREE.CanvasTexture(canvas);
  }

  function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Tăng độ phân giải chiều rộng lên 128px
    canvas.height = 256; // Tăng độ phân giải chiều cao lên 256px
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 256);
    
    // Nửa lá cỏ bên trái (đổ bóng sẫm màu)
    const gradLeft = ctx.createLinearGradient(0, 256, 0, 0);
    gradLeft.addColorStop(0, '#04220f');   // Chân cỏ thẫm
    gradLeft.addColorStop(0.3, '#0e4a25');  // Thân dưới
    gradLeft.addColorStop(0.65, '#16a34a'); // Thân trên xanh tươi
    gradLeft.addColorStop(0.9, '#86efac');  // Gần ngọn cỏ nhạt
    gradLeft.addColorStop(1, '#bbf7d0');    // Đỉnh ngọn cỏ mint nhạt
    
    // Nửa lá cỏ bên phải (nhận ánh sáng tốt hơn)
    const gradRight = ctx.createLinearGradient(0, 256, 0, 0);
    gradRight.addColorStop(0, '#062f14');
    gradRight.addColorStop(0.3, '#15803d');
    gradRight.addColorStop(0.65, '#22c55e'); // Xanh sáng hơn
    gradRight.addColorStop(0.9, '#a7f3d0');
    gradRight.addColorStop(1, '#d1fae5');
    
    // Vẽ nửa lá cỏ bên trái
    ctx.fillStyle = gradLeft;
    ctx.beginPath();
    ctx.moveTo(64, 0); // Ngọn ở giữa
    ctx.quadraticCurveTo(24, 100, 36, 256); // Rìa trái cong mềm mại
    ctx.lineTo(64, 256); // Đáy giữa
    ctx.closePath();
    ctx.fill();
    
    // Vẽ nửa lá cỏ bên phải
    ctx.fillStyle = gradRight;
    ctx.beginPath();
    ctx.moveTo(64, 0); // Ngọn ở giữa
    ctx.quadraticCurveTo(104, 100, 92, 256); // Rìa phải cong mềm mại
    ctx.lineTo(64, 256); // Đáy giữa
    ctx.closePath();
    ctx.fill();
    
    // Vẽ gân lá chính ở giữa (vein) tạo khe gấp sâu 3D sắc nét
    ctx.strokeStyle = 'rgba(3, 24, 10, 0.48)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.quadraticCurveTo(64, 100, 64, 256);
    ctx.stroke();
    
    return new THREE.CanvasTexture(canvas);
  }

  function createFlowerTexture(colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 256);
    
    // 1. Vẽ cành hoa màu xanh lục (stem) cong nhẹ tự nhiên
    const stemGrad = ctx.createLinearGradient(64, 256, 64, 60);
    stemGrad.addColorStop(0, '#04220f'); // Chân cành thẫm màu đất
    stemGrad.addColorStop(0.5, '#15803d');
    stemGrad.addColorStop(1, '#22c55e');  // Ngọn cành xanh tươi
    
    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(64, 256);
    ctx.quadraticCurveTo(56, 150, 64, 60); // Cành hơi uốn cong tự nhiên
    ctx.stroke();
    
    // Vẽ lá nhỏ điểm xuyết trên cành
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(54, 150, 14, 6, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(74, 110, 12, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 2. Vẽ 5 cánh hoa tròn xung quanh tâm (64, 60)
    ctx.fillStyle = colorHex;
    const numPetals = 5;
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * Math.PI * 2) / numPetals;
      const x = 64 + Math.cos(angle) * 18;
      const y = 60 + Math.sin(angle) * 18;
      
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 3. Vẽ nhụy hoa màu vàng sáng ở tâm (64, 60)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(64, 60, 9, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  function createDirtFlakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 32);
    
    // Vẽ một hình dạng hạt bụi bẩn méo mó bất định dạng
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(16, 5);
    ctx.quadraticCurveTo(24, 7, 27, 15);
    ctx.quadraticCurveTo(23, 25, 15, 27);
    ctx.quadraticCurveTo(7, 23, 5, 15);
    ctx.quadraticCurveTo(7, 7, 16, 5);
    ctx.closePath();
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  // Khởi tạo vị trí hạt mưa ngẫu nhiên xung quanh sân khấu
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    const rx = (Math.random() - 0.5) * 20;
    const ry = Math.random() * 20 - 5; // Độ cao từ -5 đến 15
    const rz = (Math.random() - 0.5) * 20;

    rainPositions[i * 3] = rx;
    rainPositions[i * 3 + 1] = ry;
    rainPositions[i * 3 + 2] = rz;

    rainData.push({
      speedY: 18 + Math.random() * 8,     // Rơi cực nhanh (tăng từ 13-18 lên 18-26)
      driftX: -1.8 - Math.random() * 2.5, // Gió giật mạnh bay nghiêng sâu sang trái
      driftZ: (Math.random() - 0.5) * 0.6
    });
  }

  rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

  const rainMaterial = new THREE.PointsMaterial({
    size: 0.48, // Kích thước hạt mưa lớn hơn (tăng từ 0.35)
    map: createRainTexture(),
    transparent: true,
    opacity: 0.85, // Tăng độ đục của mưa lên 0.85
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  scene.add(rainParticles);

  // Biến kiểm soát sấm sét chớp nhoáng (đã tăng tần suất nhanh hơn)
  let lightningTime = 0;
  let nextLightningTime = 1.0 + Math.random() * 2.0; // Chớp sấm sét ngẫu nhiên sau mỗi 1-3 giây
  let lightningFlashActive = false;
  let flashIntensity = 0;
  
  const baseHemiIntensity = 0.85;
  const baseAmbIntensity = 0.20;
  const baseFogColor = new THREE.Color(0x0e100e);
  const flashColor = new THREE.Color(0xdceeff); // Màu xanh trắng sấm chớp

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
    color: 0x8a8479, // Bụi bặm tông xám nâu ô nhiễm
    size: 0.032,    // Kích thước hạt bụi lớn hơn một chút
    transparent: true,
    opacity: 0.40,
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
    color: 0x6e6559, // Hạt tàn bụi màu nâu xám đậm hơn
    size: 0.06,     // Kích thước hạt lớn hơn
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const bigParticles = new THREE.Points(bigPGeo, bigPMat);
  scene.add(bigParticles);

  // ── 2.5 FINE DUST PARTICLES (Đám bụi mịn ô nhiễm dày đặc) ─────────
  const fineDustCount = 3000; // Tăng từ 1200 lên 3000 để tạo bầu không khí đặc quánh khói bụi PM2.5
  const fineDustPositions = new Float32Array(fineDustCount * 3);
  const fineDustSpeeds = new Float32Array(fineDustCount);
  const fineDustOffsets = new Float32Array(fineDustCount);
  
  for (let i = 0; i < fineDustCount; i++) {
    fineDustPositions[i * 3] = (Math.random() - 0.5) * 12;
    fineDustPositions[i * 3 + 1] = -2.5 + Math.random() * 8.5;
    fineDustPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    
    fineDustSpeeds[i] = 0.05 + Math.random() * 0.15;
    fineDustOffsets[i] = Math.random() * Math.PI * 2;
  }
  
  const fineDustGeo = new THREE.BufferGeometry();
  fineDustGeo.setAttribute('position', new THREE.BufferAttribute(fineDustPositions, 3));
  
  const fineDustMat = new THREE.PointsMaterial({
    color: 0x756f64, // Màu xám đục của bụi mịn ô nhiễm
    size: 0.016, // Kích thước hạt bụi mịn
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const fineDustParticles = new THREE.Points(fineDustGeo, fineDustMat);
  scene.add(fineDustParticles);

  // ── 2.5.5 DIRT DEBRIS PARTICLES (Hạt bụi bẩn mảnh vụn bay lơ lửng) ─────────
  const debrisCount = 350;
  const debrisPositions = new Float32Array(debrisCount * 3);
  const debrisSpeeds = new Float32Array(debrisCount);
  const debrisOffsets = new Float32Array(debrisCount);
  
  for (let i = 0; i < debrisCount; i++) {
    debrisPositions[i * 3]     = (Math.random() - 0.5) * 12;
    debrisPositions[i * 3 + 1] = -2.5 + Math.random() * 8.5;
    debrisPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    
    debrisSpeeds[i]  = 0.05 + Math.random() * 0.15;
    debrisOffsets[i] = Math.random() * Math.PI * 2;
  }
  
  const debrisGeo = new THREE.BufferGeometry();
  debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
  
  const debrisMat = new THREE.PointsMaterial({
    color: 0x483e35, // Tông màu đất bẩn
    size: 0.15,      // Hạt to rõ rệt
    map: createDirtFlakeTexture(),
    transparent: true,
    opacity: 0.60,
    blending: THREE.NormalBlending, // Normal Blending để trông rõ vết bẩn che sáng
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const debrisParticles = new THREE.Points(debrisGeo, debrisMat);
  scene.add(debrisParticles);

  // ── 2.6 SOOT / ASH PARTICLES (Bụi tàn tro ô nhiễm rơi chậm) ─────────
  const sootCount = 600;
  const sootPositions = new Float32Array(sootCount * 3);
  const sootData = []; // Lưu tốc độ rơi riêng từng hạt
  
  for (let i = 0; i < sootCount; i++) {
    sootPositions[i * 3] = (Math.random() - 0.5) * 16;
    sootPositions[i * 3 + 1] = Math.random() * 15 - 5;
    sootPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    
    sootData.push({
      speedY: 0.7 + Math.random() * 1.0,   // Rơi rất chậm giống tàn tro lơ lửng
      driftX: -0.2 - Math.random() * 0.4,  // Gió thổi nghiêng nhẹ sang trái
      driftZ: (Math.random() - 0.5) * 0.3
    });
  }
  
  const sootGeo = new THREE.BufferGeometry();
  sootGeo.setAttribute('position', new THREE.BufferAttribute(sootPositions, 3));
  
  const sootMat = new THREE.PointsMaterial({
    color: 0x222220, // Hạt tàn tro các-bon đen xám hấp thụ ánh sáng
    size: 0.12,      // Hạt to nhìn rõ nét như vảy tàn tro rơi
    transparent: true,
    opacity: 0.45,
    blending: THREE.NormalBlending, // Normal Blending để nhìn thấy hạt đen cản sáng
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const sootParticles = new THREE.Points(sootGeo, sootMat);
  scene.add(sootParticles);


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
     3.8 GREEN GRASS SYSTEM — Cỏ xanh hồi sinh mọc lên
     ══════════════════════════════════════════════ */
  const grassGroup = new THREE.Group();
  earthGroup.add(grassGroup); // Thêm vào earthGroup để khớp vị trí và xoay nếu có

  const grassCount = 1500; // Tăng mật độ cỏ lên 1500 để thảm cỏ rậm rạp, bao phủ kín đồi
  // Tăng phân đoạn đứng của PlaneGeometry lên 4 để uốn cong mượt mà hơn
  const grassGeo = new THREE.PlaneGeometry(0.16, 0.58, 1, 4);
  // Dịch chuyển pivot (điểm neo) xuống đáy của PlaneGeometry để khi scale.y sẽ mọc thẳng đứng lên
  grassGeo.translate(0, 0.29, 0);

  // Uốn cong và xoắn nhẹ các đỉnh của lá cỏ theo Parabol hướng Z và sóng ngọn hướng X
  const posAttr = grassGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    // Tính toán chiều cao tương đối h từ 0 (đáy cỏ) đến 1 (ngọn cỏ)
    const h = y / 0.58;
    
    // Parabol bend: Ngọn cỏ cong nhiều nhất về phía sau (trục Z)
    const bendZ = Math.pow(h, 2) * 0.22;
    posAttr.setZ(i, posAttr.getZ(i) - bendZ);

    // Twist ngọn: Đỉnh ngọn cỏ xoắn vẹo nhẹ sang bên cạnh (trục X) để trông tự nhiên
    const twistX = Math.sin(h * Math.PI) * 0.04;
    posAttr.setX(i, x + twistX);
  }
  posAttr.needsUpdate = true;
  grassGeo.computeVertexNormals();

  // Tạo 3 chất liệu cỏ có sắc xanh khác nhau và độ bóng sáp thực vật waxy sheen
  const grassMats = [
    // 1. Xanh lá tươi chuẩn
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      roughness: 0.52, // Độ bóng mịn bắt nắng tốt
      metalness: 0.08, // Hiệu ứng bóng phản chiếu wax sáp thực vật
      emissive: new THREE.Color(0x0f3e1b),
      emissiveIntensity: 0.22,
      shadowSide: THREE.DoubleSide
    }),
    // 2. Xanh non chuối sáng (Lime/Yellow-Green)
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      color: new THREE.Color(0xd4fcb9), // Sắc xanh chuối nhẹ giúp thảm cỏ tươi tắn
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color(0x1a4a1c),
      emissiveIntensity: 0.25,
      shadowSide: THREE.DoubleSide
    }),
    // 3. Xanh rừng già thẫm (Deep Forest Green)
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      color: new THREE.Color(0x7ade95), // Màu lục sẫm sắc nét tăng chiều sâu thảm cỏ
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color(0x0a2f14),
      emissiveIntensity: 0.18,
      shadowSide: THREE.DoubleSide
    })
  ];

  for (let i = 0; i < grassCount; i++) {
    // Phân bổ hình tròn bao quanh gốc cây (loại trừ vùng đá gốc ở giữa bằng cách bắt đầu từ r = 1.75 để tránh mọc xuyên đá)
    const r = 1.75 + Math.random() * 1.85;
    const theta = Math.random() * Math.PI * 2;
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    
    // Tính toán cao độ Y khớp với mặt đồi dốc của mô hình
    const y = -0.72 - (r * r) * 0.035 + (Math.random() - 0.5) * 0.05;

    // Chọn ngẫu nhiên một chất liệu từ mảng
    const mat = grassMats[Math.floor(Math.random() * grassMats.length)];
    const grassMesh = new THREE.Mesh(grassGeo, mat);
    grassMesh.position.set(x, y, z);
    
    // Xoay ngẫu nhiên quanh trục Y và nghiêng nhẹ tự nhiên
    grassMesh.rotation.y = Math.random() * Math.PI * 2;
    grassMesh.rotation.x = (Math.random() - 0.5) * 0.22;
    grassMesh.rotation.z = (Math.random() - 0.5) * 0.22;
    
    const scale = 0.8 + Math.random() * 0.7;
    grassMesh.userData = {
      baseScaleY: scale,
      baseScaleXZ: scale * 0.85,
      radius: r
    };
    
    // Bắt đầu với tỷ lệ 0 (ẩn dưới đất)
    grassMesh.scale.set(scale * 0.85, 0.0, scale * 0.85);
    
    grassMesh.castShadow = true;
    grassMesh.receiveShadow = true;
    
    grassGroup.add(grassMesh);
  }

  /* ══════════════════════════════════════════════
     3.9 WILDFLOWERS SYSTEM — Hoa dại nở rộ sắc màu
     ══════════════════════════════════════════════ */
  const flowerGroup = new THREE.Group();
  earthGroup.add(flowerGroup);

  const flowerCount = 45;
  const flowerGeo = new THREE.PlaneGeometry(0.26, 0.95);
  // Dịch chuyển pivot xuống cạnh dưới (0.95 / 2 = 0.475)
  flowerGeo.translate(0, 0.475, 0);

  const flowerColors = ['#f472b6', '#f8fafc', '#fb923c']; // Hồng, Trắng ngà, Cam vàng
  const flowerMats = flowerColors.map(color => new THREE.MeshStandardMaterial({
    map: createFlowerTexture(color),
    transparent: true,
    alphaTest: 0.15,
    side: THREE.DoubleSide,
    roughness: 0.52,
    metalness: 0.08,
    emissive: new THREE.Color(0x082510), // Ánh sáng tự phát sẫm màu xanh lục để cành hoa trông tự nhiên trong tối
    emissiveIntensity: 0.18,
    shadowSide: THREE.DoubleSide
  }));

  for (let i = 0; i < flowerCount; i++) {
    // Nằm gọn trong thảm cỏ (loại trừ vùng đá gốc ở giữa bằng cách bắt đầu từ r = 1.85 để tránh mọc xuyên đá)
    const r = 1.85 + Math.random() * 1.65;
    const theta = Math.random() * Math.PI * 2;
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    
    // Đặt cao độ Y sát mặt đất giống cỏ
    const y = -0.72 - (r * r) * 0.035 + (Math.random() - 0.5) * 0.03; 

    const mat = flowerMats[Math.floor(Math.random() * flowerMats.length)];
    const flowerMesh = new THREE.Mesh(flowerGeo, mat);
    flowerMesh.position.set(x, y, z);
    
    // Đứng thẳng tự nhiên giống cỏ, uốn nghiêng nhẹ ngẫu nhiên các hướng
    flowerMesh.rotation.x = (Math.random() - 0.5) * 0.25;
    flowerMesh.rotation.y = Math.random() * Math.PI * 2;
    flowerMesh.rotation.z = (Math.random() - 0.5) * 0.25;
    
    const scale = 0.75 + Math.random() * 0.6;
    flowerMesh.userData = {
      baseScaleY: scale,
      baseScaleXZ: scale,
      radius: r
    };
    
    flowerMesh.scale.set(scale, 0.0, scale); // Bắt đầu bằng 0
    flowerMesh.castShadow = true;
    flowerMesh.receiveShadow = true;
    
    flowerGroup.add(flowerMesh);
  }

  /* ══════════════════════════════════════════════
     4.5. VOLUMETRIC SUN GLOW & RAYS (GOD RAYS) — Mặt trời & Tia nắng sau bão
     ══════════════════════════════════════════════ */
  // 1. Tạo nguồn sáng Mặt trời phát quang (Sun Glow Corona)
  function createSunGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 252, 245, 0.45)');
    grad.addColorStop(0.2, 'rgba(255, 248, 235, 0.22)');
    grad.addColorStop(0.5, 'rgba(255, 242, 225, 0.06)');
    grad.addColorStop(1, 'rgba(255, 242, 225, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  const sunGlowMat = new THREE.MeshBasicMaterial({
    map: createSunGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const sunGlowGeo = new THREE.PlaneGeometry(16, 16);
  const sunGlowMesh = new THREE.Mesh(sunGlowGeo, sunGlowMat);
  scene.add(sunGlowMesh);

  // 2. Tạo các tia nắng Volumetric mềm mại
  // 2. Tạo 3 ống lồng nhau tạo thành 1 luồng nắng độc nhất hùng vĩ (Majestic Crepuscular Spotlight Beam)
  const raysGroup = new THREE.Group();
  scene.add(raysGroup);

  const rayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color:       { value: new THREE.Color(0xfff3a8) },
      opacity:     { value: 0.15 },
      time:        { value: 0.0 },
      scrollSpeed: { value: 0.06 }  // tốc độ cuộn ánh sáng lên trong shader
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 color;
      uniform float opacity;
      uniform float time;
      uniform float scrollSpeed;
      void main() {
        // Fade thực tế ở 2 đầu hình học (không cuộn — để rìa mờ dịu)
        float topFade    = smoothstep(1.0, 0.82, vUv.y);
        float bottomFade = smoothstep(0.25, 0.45, vUv.y);
        float verticalFade = topFade * bottomFade;

        // Làm mờ rìa tùy theo góc nhìn
        vec3 normal  = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float radialFade = pow(max(abs(dot(normal, viewDir)), 0.0001), 3.2);

        // Cuộn pattern sáng lên vô hạn, liên tục, không giật
        float sy = fract(vUv.y + time * scrollSpeed);
        float wave1 = sin(vUv.x * 4.0 + time * 0.08) * cos(sy * 7.0);
        float wave2 = cos(vUv.x * 7.0 - time * 0.06) * sin(sy * 11.0);
        float noise = 0.90 + 0.10 * (wave1 + wave2) * 0.5;

        gl_FragColor = vec4(color, verticalFade * radialFade * opacity * noise);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });

  const rayConfigs = [
    // ① Tia chủ đạo — to & sáng nhất, cuộn chậm
    { target: new THREE.Vector3(0.1, 2.0, -0.1),  top: 0.008, bottom: 0.60, opacity: 0.36, scrollSpeed: 0.055 },
    // ② Tia phụ trái — vừa, cuộn trung bình-nhanh
    { target: new THREE.Vector3(-0.9, 1.5, 0.4),  top: 0.005, bottom: 0.36, opacity: 0.22, scrollSpeed: 0.090 },
    // ③ Tia xuyên phải — mảnh, cuộn chậm nhất
    { target: new THREE.Vector3(1.2, 0.7, -0.2),  top: 0.003, bottom: 0.20, opacity: 0.14, scrollSpeed: 0.038 },
    // ④ Tia ấm gốc cây — hẹp, cuộn vừa
    { target: new THREE.Vector3(0.2, -0.1, 0.5),  top: 0.003, bottom: 0.28, opacity: 0.24, scrollSpeed: 0.072 }
  ];

  const height = 36;

  // Tạo các tia nắng volumetric
  rayConfigs.forEach((config) => {
    const rayGeo = new THREE.CylinderGeometry(config.top, config.bottom, height, 16, 1, true);
    rayGeo.translate(0, -height / 2, 0);

    const mat = rayMaterial.clone();
    mat.uniforms.opacity.value     = config.opacity;
    mat.uniforms.scrollSpeed.value = config.scrollSpeed; // tốc độ cuộn riêng từng tia
    mat.uniforms.color.value       = new THREE.Color(0xffeba3);

    const mesh = new THREE.Mesh(rayGeo, mat);
    mesh.rotation.x = -Math.PI / 2;

    const pivot = new THREE.Object3D();
    pivot.position.copy(dirLight.position);
    pivot.lookAt(config.target);
    pivot.add(mesh);

    raysGroup.add(pivot);

    pivot.userData = {
      target:      config.target,
      mesh:        mesh,
      baseOpacity: config.opacity,
      speed:       0.18 + Math.random() * 0.22,
      offset:      Math.random() * Math.PI
    };
  });


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

  function updateScrollPct() {
    const scrollMax = document.body.scrollHeight - window.innerHeight;
    scrollPct = scrollMax > 0 ? Math.min(window.scrollY / scrollMax, 1.0) : 0.0;
  }

  window.addEventListener('scroll', updateScrollPct, { passive: true });
  window.addEventListener('resize', updateScrollPct, { passive: true });
  
  // Gọi ngay lập tức để cập nhật giá trị cuộn ban đầu phòng trường hợp tải lại trang khi đang cuộn dở
  updateScrollPct();
  window.addEventListener('load', updateScrollPct);


  /* ══════════════════════════════════════════════
     6. POST-PROCESSING — Bloom + Vignette
  ══════════════════════════════════════════════ */
  const composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom chuyên nghiệp: tạo ánh sáng phát quang huyền ảo quanh lá cây ẩm và luồng nắng
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    0.45,   // Cường độ phát sáng dịu nhẹ (giảm từ 1.2 tránh bị chói)
    0.8,    // Bán kính lan tỏa
    0.42    // Ngưỡng sáng vừa phải (tăng từ 0.18 để chỉ tập trung vào điểm bắt nắng cực đại)
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

    // Tính toán sương mù dựa trên vị trí cuộn trang (smoothPct)
    // 0.0 (đầu trang): Khói bụi xám ô nhiễm (0x0e100e, density 0.28)
    // 0.55 (cuộn xuống): Không khí trong lành xanh đen sạch sẽ (0x070c0a, density 0.20)
    const pollutedColor = new THREE.Color(0x0e100e);
    const cleanColor = new THREE.Color(0x070c0a);
    const fogTransitionPct = Math.min(smoothPct / 0.55, 1.0);
    baseFogColor.copy(pollutedColor).lerp(cleanColor, fogTransitionPct);
    const targetFogDensity = 0.28 - fogTransitionPct * 0.08;

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

    // ── Floating particles gentle motion & fade
    const particleFade = Math.min(Math.max(1.0 - smoothPct / 0.5, 0.0), 1.0);
    
    if (typeof particles !== 'undefined' && particleMat) {
      particleMat.opacity = 0.40 * particleFade;
      if (particleFade > 0) {
        particles.visible = true;
        const positions = particleGeo.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const off = particleOffsets[i];
          const spd = particleSpeeds[i];
          positions[i * 3]     += Math.sin(t * spd * 50 + off) * 0.001;
          positions[i * 3 + 1] += Math.cos(t * spd * 40 + off) * 0.0008;
          positions[i * 3 + 2] += Math.sin(t * spd * 35 + off + 1.5) * 0.0006;
        }
        particleGeo.attributes.position.needsUpdate = true;
      } else {
        particles.visible = false;
      }
    }

    // ── Depth particles fade
    if (typeof bigParticles !== 'undefined' && bigPMat) {
      bigPMat.opacity = 0.20 * particleFade;
      bigParticles.visible = particleFade > 0;
    }

    // ── Fine dust particles drifting wind-like motion & fade
    if (typeof fineDustParticles !== 'undefined' && fineDustMat) {
      const fineDustFade = Math.min(Math.max(1.0 - smoothPct / 0.5, 0.0), 1.0);
      fineDustMat.opacity = 0.55 * fineDustFade;
      if (fineDustFade > 0) {
        fineDustParticles.visible = true;
        const fdPos = fineDustGeo.attributes.position.array;
        for (let i = 0; i < fineDustCount; i++) {
          const off = fineDustOffsets[i];
          const spd = fineDustSpeeds[i];
          
          fdPos[i * 3]     += Math.sin(t * 0.1 + off) * 0.002 + 0.003; // Gió thổi dạt nhẹ sang phải
          fdPos[i * 3 + 1] += Math.cos(t * 0.08 + off) * 0.0015;
          fdPos[i * 3 + 2] += Math.sin(t * 0.05 + off) * 0.001;
          
          // Reset hạt khi bay lệch xa khỏi khu vực trung tâm để tạo dòng chảy vô tận
          if (fdPos[i * 3] > 6.0)  fdPos[i * 3] = -6.0;
          if (fdPos[i * 3 + 1] > 6.0) fdPos[i * 3 + 1] = -2.5;
        }
        fineDustGeo.attributes.position.needsUpdate = true;
      } else {
        fineDustParticles.visible = false;
      }
    }

    // ── Debris particles (bụi bẩn mới) trôi nổi & fade
    if (typeof debrisParticles !== 'undefined' && debrisMat) {
      const debrisFade = Math.min(Math.max(1.0 - smoothPct / 0.5, 0.0), 1.0);
      debrisMat.opacity = 0.60 * debrisFade;
      if (debrisFade > 0) {
        debrisParticles.visible = true;
        const dbPos = debrisGeo.attributes.position.array;
        for (let i = 0; i < debrisCount; i++) {
          const off = debrisOffsets[i];
          
          dbPos[i * 3]     += Math.sin(t * 0.12 + off) * 0.003 - 0.001;
          dbPos[i * 3 + 1] += Math.cos(t * 0.09 + off) * 0.002 - 0.001;
          dbPos[i * 3 + 2] += Math.sin(t * 0.07 + off) * 0.0015;
          
          // Reset khi bay xa khỏi khung cảnh
          if (Math.abs(dbPos[i * 3]) > 6.0) dbPos[i * 3] = (Math.random() - 0.5) * 12;
          if (dbPos[i * 3 + 1] > 6.0 || dbPos[i * 3 + 1] < -3.0) dbPos[i * 3 + 1] = -2.5 + Math.random() * 8.5;
        }
        debrisGeo.attributes.position.needsUpdate = true;
      } else {
        debrisParticles.visible = false;
      }
    }


    // ── Cập nhật trời mưa rơi (giảm dần và dừng hẳn khi cuộn xuống)
    if (rainParticles && rainGeometry) {
      // Mưa tạnh hoàn toàn khi cuộn xuống 40% trang (smoothPct >= 0.4)
      const rainFade = Math.min(Math.max(1.0 - smoothPct / 0.4, 0.0), 1.0);
      rainMaterial.opacity = 0.85 * rainFade;
      
      if (rainFade > 0) {
        rainParticles.visible = true;
        const rPos = rainGeometry.attributes.position.array;
        const rCount = rainCount;
        for (let i = 0; i < rCount; i++) {
          const data = rainData[i];
          
          rPos[i * 3]     += data.driftX * delta;
          rPos[i * 3 + 1] -= data.speedY * delta;
          rPos[i * 3 + 2] += data.driftZ * delta;
          
          if (rPos[i * 3 + 1] < -5) {
            rPos[i * 3]     = (Math.random() - 0.5) * 20;
            rPos[i * 3 + 1] = 15;
            rPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
          }
        }
        rainGeometry.attributes.position.needsUpdate = true;
      } else {
        rainParticles.visible = false;
      }
    }

    // ── Cập nhật hiệu ứng mặt đất và đá cây ướt mưa động (Dynamic Wetness)
    if (typeof wetMaterials !== 'undefined' && wetMaterials.length > 0) {
      // Khi mưa tạnh hoàn toàn ở smoothPct >= 0.40, mặt đất sẽ khô hẳn
      const wetness = Math.min(Math.max(1.0 - smoothPct / 0.40, 0.0), 1.0); 
      
      wetMaterials.forEach(item => {
        const mat = item.material;
        
        // 1. Độ nhám (Roughness): Ướt thì nhẵn bóng phản xạ gương, khô thì nhám lì chân thật
        mat.roughness = item.baseRoughness + (item.wetRoughness - item.baseRoughness) * wetness;
        
        // 2. Độ kim loại (Metalness): Tăng nhẹ phản xạ gương khi ướt
        mat.metalness = item.baseMetalness + (item.wetMetalness - item.baseMetalness) * wetness;
        
        // 3. Clearcoat (Lớp bóng phản chiếu nước bề mặt): Chỉ có ở vật liệu Physical
        if (mat.clearcoat !== undefined) {
          mat.clearcoat = wetness * 0.48;
          mat.clearcoatRoughness = 0.12 + 0.38 * (1.0 - wetness);
        }
        
        // 4. Độ tối màu (Darkening): Đất/đá/gỗ khi thấm đẫm nước mưa sẽ sẫm màu
        const tint = 1.0 - 0.42 * wetness; // Sẫm màu đi 42% khi ướt sũng
        mat.color.setRGB(tint, tint, tint);
      });
    }

    // ── Cập nhật hạt tàn tro ô nhiễm rơi chậm (giảm dần và tạnh khi cuộn xuống)
    if (sootParticles && sootGeo) {
      // Tàn tro tạnh hẳn khi cuộn xuống 45% trang (smoothPct >= 0.45)
      const sootFade = Math.min(Math.max(1.0 - smoothPct / 0.45, 0.0), 1.0);
      sootMat.opacity = 0.45 * sootFade;
      
      if (sootFade > 0) {
        sootParticles.visible = true;
        const sPos = sootGeo.attributes.position.array;
        const sCount = sootCount;
        for (let i = 0; i < sCount; i++) {
          const data = sootData[i];
          
          sPos[i * 3]     += data.driftX * delta;
          sPos[i * 3 + 1] -= data.speedY * delta;
          sPos[i * 3 + 2] += data.driftZ * delta;
          
          if (sPos[i * 3 + 1] < -5) {
            sPos[i * 3]     = (Math.random() - 0.5) * 16;
            sPos[i * 3 + 1] = 10;
            sPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
          }
        }
        sootGeo.attributes.position.needsUpdate = true;
      } else {
        sootParticles.visible = false;
      }
    }

    // ── Cập nhật sấm sét chớp giật nhấp nháy (chỉ kích hoạt ở đầu trang)
    if (smoothPct < 0.25) {
      lightningTime += delta;
      if (lightningTime >= nextLightningTime) {
        lightningTime = 0;
        nextLightningTime = 0.8 + Math.random() * 1.5; // Hẹn giờ cho lần chớp sét tiếp theo (tần suất dày đặc hơn)
        lightningFlashActive = true;
        flashIntensity = 1.0; // Bắt đầu chớp chói lòa
      }
    } else {
      // Khi lướt xuống dưới, dập tắt sấm sét lập tức
      lightningTime = 0;
      if (lightningFlashActive) {
        flashIntensity -= delta * 5.0; // Tắt chớp sét cực nhanh
        if (flashIntensity <= 0) {
          flashIntensity = 0;
          lightningFlashActive = false;
        }
      }
    }

    if (lightningFlashActive) {
      // Độ sáng tiêu giảm chậm hơn để luồng sét có chiều sâu và kéo dài hơn (từ 3.2 xuống 2.2)
      flashIntensity -= delta * 2.2; 
      if (flashIntensity <= 0) {
        flashIntensity = 0;
        lightningFlashActive = false;
        
        // Trả lại các giá trị môi trường và ánh sáng tĩnh ban đầu theo vị trí cuộn
        scene.background.copy(baseFogColor);
        scene.fog.color.copy(baseFogColor);
        scene.fog.density = targetFogDensity;
        hemiLight.intensity = baseHemiIntensity;
        ambLight.intensity = baseAmbIntensity;
        dirLight.intensity = 3.8; // Cường độ tĩnh gốc
      } else {
        // Nhấp nháy sấm chớp dạng răng cưa đa tần số (Flicker nhấp nháy 3 pha cực chân thật)
        let currentFlash = flashIntensity;
        const phase = t * 35.0; // Sử dụng thời gian thực tế để đồng bộ tần số nhấp nháy
        const flicker = Math.sin(phase) * 0.4 + 0.6; // Dao động nhẹ giữ chớp sáng liên tục
        currentFlash *= flicker;

        // Thỉnh thoảng dập tắt đột ngột rồi chớp sáng lại (Double-flash đặc trưng của giông bão)
        if (flashIntensity > 0.2 && flashIntensity < 0.6 && Math.sin(t * 12.0) > 0.5) {
          currentFlash *= 0.15;
        }

        // Lerp màu nền và màu sương mù sang sắc trắng xanh chói của sét (tăng độ bao phủ ánh chớp từ 0.75 lên 0.95)
        scene.background.copy(baseFogColor).lerp(flashColor, currentFlash * 0.95);
        scene.fog.color.copy(baseFogColor).lerp(flashColor, currentFlash * 0.95);

        // Đẩy cực mạnh cường độ ánh sáng của bầu trời và môi trường (hemi từ 3.8 lên 6.8, amb từ 1.6 lên 2.8)
        hemiLight.intensity = baseHemiIntensity + currentFlash * 6.8;
        ambLight.intensity = baseAmbIntensity + currentFlash * 2.8;
        // Chớp sáng cả nguồn Directional Light chính để tạo bóng đổ giật cục ấn tượng
        dirLight.intensity = 3.8 + currentFlash * 5.0;
      }
    } else {
      // Khi không có sấm sét, sương mù và màu nền bám theo vị trí cuộn trang (smoothPct)
      scene.background.copy(baseFogColor);
      scene.fog.color.copy(baseFogColor);
      scene.fog.density = targetFogDensity;
      hemiLight.intensity = baseHemiIntensity;
      ambLight.intensity = baseAmbIntensity;
    }

    // ── Ánh sáng cố định (không xoay) theo yêu cầu người dùng
    dirLight.position.set(-10, 18, -12);
    rimLight.position.set(7, -5, 8.4);

    // ── Sun Glow Corona orientation (cũng phai theo độ cuộn trang)
    if (typeof sunGlowMesh !== 'undefined') {
      const glowFade = Math.min(Math.max((smoothPct - 0.05) / 0.5, 0.0), 1.0);
      sunGlowMesh.material.opacity = 0.45 * glowFade;
      sunGlowMesh.position.copy(dirLight.position);
      sunGlowMesh.lookAt(camera.position);
    }

    // ── Sun rays — pivot cố định, pattern sáng cuộn lên liên tục trong shader (xuất hiện khi cuộn xuống)
    if (typeof raysGroup !== 'undefined') {
      // Lấp lánh xuất hiện dần khi cuộn xuống (bắt đầu hiện từ smoothPct > 0.05 và hiện rõ nhất ở smoothPct >= 0.55)
      const rayFade = Math.min(Math.max((smoothPct - 0.05) / 0.5, 0.0), 1.0);

      raysGroup.children.forEach((pivot) => {
        const data = pivot.userData;
        // Pivot luôn ở vị trí cố định của nguồn sáng
        pivot.position.copy(dirLight.position);

        // Tạo chuyển động quét tia nắng (god rays) đung đưa nhẹ nhàng, chuyển động vĩnh viễn
        const dynamicTarget = data.target.clone();
        const swingSpeed = 0.25; // Tốc độ quét
        const swingRange = 0.5;  // Biên độ đung đưa
        dynamicTarget.x += Math.sin(t * swingSpeed + data.offset) * swingRange;
        dynamicTarget.y += Math.cos(t * swingSpeed * 0.8 + data.offset) * (swingRange * 0.4);
        dynamicTarget.z += Math.sin(t * swingSpeed * 1.2 + data.offset) * swingRange;
        pivot.lookAt(dynamicTarget);

        // Chỉ cập nhật time — nhân thêm độ phai rayFade phụ thuộc vào cuộn trang
        data.mesh.material.uniforms.time.value    = t;
        data.mesh.material.uniforms.opacity.value = data.baseOpacity * (0.82 + 0.18 * Math.sin(t * data.speed + data.offset)) * rayFade;
      });
    }

    // ── Cỏ xanh mọc lan tỏa theo độ cuộn trang (mọc từ trong ra ngoài từ 20% đến 75% scroll)
    if (typeof grassGroup !== 'undefined') {
      grassGroup.children.forEach((mesh) => {
        const data = mesh.userData;
        
        // Tính toán lệch pha dựa theo khoảng cách bán kính r từ gốc cây (chuẩn hóa trong khoảng [1.75, 3.6])
        const normR = (data.radius - 1.75) / (3.6 - 1.75);
        const growStart = 0.20 + normR * 0.15; // Cỏ gần gốc mọc trước
        const growEnd = growStart + 0.40;
        const grassPct = Math.min(Math.max((smoothPct - growStart) / (growEnd - growStart), 0.0), 1.0);
        
        // Hiệu ứng mọc: mở rộng ngang (x, z) nhanh hơn, sau đó kéo dài chiều cao (y)
        mesh.scale.y = data.baseScaleY * grassPct;
        mesh.scale.x = data.baseScaleXZ * Math.min(grassPct * 1.5, 1.0);
        mesh.scale.z = data.baseScaleXZ * Math.min(grassPct * 1.5, 1.0);
        
        // Đung đưa sinh động lệch pha theo gió thổi gợn sóng lan truyền qua tọa độ X, Z
        const sway = Math.sin(t * 2.0 + mesh.position.x * 2.0 + mesh.position.z * 1.5) * 0.08;
        mesh.rotation.z = sway;
      });
    }

    // ── Hoa nở từ 35% đến 80% scroll (nở sau khi cỏ mọc)
    if (typeof flowerGroup !== 'undefined') {
      flowerGroup.children.forEach((mesh) => {
        const data = mesh.userData;
        
        // Tính toán nở lệch pha dựa theo khoảng cách bán kính r từ gốc cây (chuẩn hóa trong khoảng [1.85, 3.5])
        const normR = (data.radius - 1.85) / (3.5 - 1.85);
        const bloomStart = 0.35 + normR * 0.15; // Hoa gần gốc nở trước
        const bloomEnd = bloomStart + 0.30;
        const bloomPct = Math.min(Math.max((smoothPct - bloomStart) / (bloomEnd - bloomStart), 0.0), 1.0);
        
        // Hoạt ảnh nở: to dần theo mọi trục
        mesh.scale.y = data.baseScaleY * bloomPct;
        mesh.scale.x = data.baseScaleXZ * bloomPct;
        mesh.scale.z = data.baseScaleXZ * bloomPct;
        
        // Đung đưa nhẹ nhàng đồng điệu theo gió gợn sóng lan truyền
        const sway = Math.sin(t * 2.0 + mesh.position.x * 2.0 + mesh.position.z * 1.5) * 0.05;
        mesh.rotation.z = sway;
      });
    }

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
