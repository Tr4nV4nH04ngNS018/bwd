# 🌲 TÀI LIỆU ÔN THI & BẢO VỆ ĐỒ ÁN - PHẦN 4: ĐỒ HỌA HỒI SINH MÔI TRƯỜNG & MÁY CHỦ CORS PROXY

Tài liệu này được biên soạn đầy đủ và chi tiết dành riêng cho thành viên phụ trách **Phần 4**. Bạn chỉ cần đọc kỹ và học thuộc file này để tự tin trả lời mọi câu hỏi của hội đồng cũng như code lại toàn bộ phần việc của mình.

---

## 📂 Danh sách các file quản lý
1.  [index.html](file:///c:/Users/ACER/Downloads/CNW/bwd/index.html): Trang chủ chứa các bento card giới thiệu và kêu gọi bảo vệ môi trường.
2.  [js/bg3d.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/bg3d.js): Dựng bối cảnh 3D Trái Đất hồi sinh (`caytrangchu.glb`), sương mù chuyển màu, 4,000 hạt mưa giông sấm sét, uốn lá cỏ và mọc hoa theo vị trí cuộn trang, tia sáng Volumetric (God Rays) Custom Shader.
3.  [serve.ps1](file:///c:/Users/ACER/Downloads/CNW/bwd/serve.ps1): Server backend phân phối tài nguyên, CORS Proxy trung gian giải quyết bảo mật trình duyệt, in-memory caching tăng tốc độ tải trang.

---

## 🛠️ TOÀN BỘ MÃ NGUỒN CHI TIẾT (COMPLETE CODE)

### 1. File [serve.ps1](file:///c:/Users/ACER/Downloads/CNW/bwd/serve.ps1) (Toàn bộ mã nguồn)
```powershell
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server is running at http://localhost:$port/"
Write-Host "Press Ctrl+C to stop."

# Simple in-memory cache for proxied API responses
$global:apiCache = @{}


try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        $filePath = Join-Path (Get-Location).Path $path

        # Handle simple proxy route to bypass CORS and provide caching
        if ($path -like "/api/proxy*") {
            try {
                $remoteUrl = $request.QueryString["url"]
                if (-not $remoteUrl) {
                    $response.StatusCode = 400
                    $response.StatusDescription = "Missing 'url' parameter"
                    $response.Close()
                    continue
                }

                # Optional TTL param (seconds)
                $ttlParam = $request.QueryString["ttl"]
                $ttl = if ($ttlParam) { [int]$ttlParam } else { 300 }

                # Return from cache if present and fresh
                if ($global:apiCache.ContainsKey($remoteUrl)) {
                    $entry = $global:apiCache[$remoteUrl]
                    $age = (Get-Date) - $entry.time
                    if ($age.TotalSeconds -lt $ttl) {
                        $response.ContentType = $entry.contentType
                        $response.ContentLength64 = $entry.content.Length
                        if ($request.HttpMethod -ne "HEAD") {
                            $response.OutputStream.Write($entry.content, 0, $entry.content.Length)
                        }
                        $response.Close()
                        continue
                    }
                }

                # Fetch remote resource
                try {
                    $remoteResp = Invoke-WebRequest -Uri $remoteUrl -UseBasicParsing -TimeoutSec 20
                    $body = $remoteResp.Content
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
                    $contentType = $remoteResp.Headers["Content-Type"]
                    if (-not $contentType) { $contentType = "application/octet-stream" }

                    # Cache and respond
                    $global:apiCache[$remoteUrl] = @{ time = (Get-Date); content = $bytes; contentType = $contentType }
                    $response.ContentType = $contentType
                    $response.ContentLength64 = $bytes.Length
                    if ($request.HttpMethod -ne "HEAD") {
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                }
                catch {
                    $response.StatusCode = 502
                }
            }
            catch {
                $response.StatusCode = 500
            }
            $response.Close()
            continue
        }

        # Avoid path traversal
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $currentDir = [System.IO.Path]::GetFullPath((Get-Location).Path)
        
        if ($fullPath.StartsWith($currentDir) -and (Test-Path $fullPath -PathType Leaf)) {
            try {
                [byte[]]$content = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $content.Length
                
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html" }
                    ".css" { $response.ContentType = "text/css" }
                    ".js" { $response.ContentType = "application/javascript" }
                    ".glb" { $response.ContentType = "model/gltf-binary" }
                    ".png" { $response.ContentType = "image/png" }
                    ".jpg" { $response.ContentType = "image/jpeg" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($content, 0, $content.Length)
                }
            }
            catch {
                Write-Host "Error serving file: $_"
                $response.StatusCode = 500
            }
        }
        else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}
finally {
    $listener.Stop()
}
```

### 2. File [js/bg3d.js](file:///c:/Users/ACER/Downloads/CNW/bwd/js/bg3d.js) (Toàn bộ mã nguồn)
```javascript
/* ══════════════════════════════════════════════
   EcoImpact — 3D Background  (Three.js)
   Fullscreen animated scene: wireframe Earth globe + particles
   ══════════════════════════════════════════════ */

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
  const fogColor = new THREE.Color(0x0e100e); 
  scene.background = fogColor;
  scene.fog = new THREE.FogExp2(fogColor, 0.28); 
  
  const camera   = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 4.6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3; 
  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
  
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

  /* ── Colors & Config ── */
  const GREEN_PRIMARY   = 0x4ade80; 
  const GREEN_GLOW      = 0xffffff; 
  const GREEN_DIM       = 0x86efac;
  const PARTICLE_COUNT  = 1000; 
  const EARTH_SEGMENTS  = 64;

  /* ══════════════════════════════════════════════
     1. EARTH GLOBE — wireframe + atmosphere
  ══════════════════════════════════════════════ */
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const ambLight = new THREE.AmbientLight(0x0c131a, 0.20); 
  scene.add(ambLight);

  const hemiLight = new THREE.HemisphereLight(0xb0d0ff, 0x050c08, 0.85); 
  scene.add(hemiLight);
  
  const dirLight = new THREE.DirectionalLight(0xffdfb3, 3.8); 
  dirLight.position.set(-10, 18, -12); 
  dirLight.castShadow = true;
  
  const rimLight = new THREE.DirectionalLight(0x4ade80, 1.8); 
  rimLight.position.set(7, -5, 8.4); 
  scene.add(rimLight);

  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.0005; 
  scene.add(dirLight);

  const wetMaterials = [];

  const loader = new THREE.GLTFLoader();
  let loadedEarth = null;
  let mixer = null; 

  loader.load('./models/caytrangchu.glb', function (gltf) {
    loadedEarth = gltf.scene;
    
    const box = new THREE.Box3().setFromObject(loadedEarth);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 20.0 / maxDim; 
    loadedEarth.scale.set(scale, scale, scale);
    
    loadedEarth.position.x = -center.x * scale;
    loadedEarth.position.y = -center.y * scale;
    loadedEarth.position.z = -center.z * scale;

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(loadedEarth);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    
    loadedEarth.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          const applyAnisotropy = (map) => {
            if (map) {
              map.anisotropy = maxAnisotropy;
              map.needsUpdate = true; 
              map.minFilter = THREE.LinearMipmapLinearFilter; 
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

            mat.side = THREE.DoubleSide;
            
            if (mat.name.toLowerCase().includes('leaf')) {
              mat.transparent = true;
              mat.alphaTest = 0.52; 
              mat.color.setHex(0x5dbb7d); 
              if (mat.emissive) {
                mat.emissive.setHex(0x0a2f14); 
                mat.emissiveIntensity = 0.15;
              }
              mat.roughness = 0.65;
              mat.metalness = 0.05;
            }
            
            if (mat.name === 'Ground' || mat.name === 'Rock' || mat.name === 'Stump') {
              if (mat.normalMap) {
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

            if (mat.clearcoat !== undefined && mat.name !== 'Ground' && mat.name !== 'Rock' && mat.name !== 'Stump') {
              mat.clearcoat = 0.0; 
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

  /* ── 1.5 RAIN & LIGHTNING ── */
  let rainParticles = null;
  let rainGeometry = null;
  const rainCount = 4000; 
  const rainData = []; 

  function createRainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(32, 0, 32, 64);
    grad.addColorStop(0, 'rgba(174, 219, 255, 0)');      
    grad.addColorStop(0.3, 'rgba(180, 225, 255, 0.75)');  
    grad.addColorStop(0.7, 'rgba(180, 225, 255, 0.75)');
    grad.addColorStop(1, 'rgba(174, 219, 255, 0)');      
    
    ctx.fillStyle = grad;
    ctx.fillRect(30, 0, 4, 64); 
    return new THREE.CanvasTexture(canvas);
  }

  function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 256);
    
    const gradLeft = ctx.createLinearGradient(0, 256, 0, 0);
    gradLeft.addColorStop(0, '#04220f');   
    gradLeft.addColorStop(0.3, '#0e4a25');  
    gradLeft.addColorStop(0.65, '#16a34a'); 
    gradLeft.addColorStop(0.9, '#86efac');  
    gradLeft.addColorStop(1, '#bbf7d0');    
    
    const gradRight = ctx.createLinearGradient(0, 256, 0, 0);
    gradRight.addColorStop(0, '#062f14');
    gradRight.addColorStop(0.3, '#15803d');
    gradRight.addColorStop(0.65, '#22c55e'); 
    gradRight.addColorStop(0.9, '#a7f3d0');
    gradRight.addColorStop(1, '#d1fae5');
    
    ctx.fillStyle = gradLeft;
    ctx.beginPath();
    ctx.moveTo(64, 0); 
    ctx.quadraticCurveTo(24, 100, 36, 256); 
    ctx.lineTo(64, 256); 
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = gradRight;
    ctx.beginPath();
    ctx.moveTo(64, 0); 
    ctx.quadraticCurveTo(104, 100, 92, 256); 
    ctx.lineTo(64, 256); 
    ctx.closePath();
    ctx.fill();
    
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
    canvas.width = 128; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const stemGrad = ctx.createLinearGradient(64, 256, 64, 60);
    stemGrad.addColorStop(0, '#04220f'); 
    stemGrad.addColorStop(0.5, '#15803d');
    stemGrad.addColorStop(1, '#22c55e');  
    
    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(64, 256);
    ctx.quadraticCurveTo(56, 150, 64, 60); 
    ctx.stroke();
    
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(54, 150, 14, 6, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(74, 110, 12, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
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
    
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(64, 60, 9, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  function createDirtFlakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
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

  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    const rx = (Math.random() - 0.5) * 20;
    const ry = Math.random() * 20 - 5; 
    const rz = (Math.random() - 0.5) * 20;

    rainPositions[i * 3] = rx;
    rainPositions[i * 3 + 1] = ry;
    rainPositions[i * 3 + 2] = rz;

    rainData.push({
      speedY: 18 + Math.random() * 8,     
      driftX: -1.8 - Math.random() * 2.5, 
      driftZ: (Math.random() - 0.5) * 0.6
    });
  }

  rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

  const rainMaterial = new THREE.PointsMaterial({
    size: 0.48, 
    map: createRainTexture(),
    transparent: true,
    opacity: 0.85, 
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  scene.add(rainParticles);

  let lightningTime = 0;
  let nextLightningTime = 1.0 + Math.random() * 2.0; 
  let lightningFlashActive = false;
  let flashIntensity = 0;
  
  const baseHemiIntensity = 0.85;
  const baseAmbIntensity = 0.20;
  const baseFogColor = new THREE.Color(0x0e100e);
  const flashColor = new THREE.Color(0xdceeff); 

  /* ── 2. PARTICLES ── */
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
    color: 0x8a8479, 
    size: 0.032,    
    transparent: true,
    opacity: 0.40,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

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
    color: 0x6e6559, 
    size: 0.06,     
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const bigParticles = new THREE.Points(bigPGeo, bigPMat);
  scene.add(bigParticles);

  // ── 2.5 FINE DUST PARTICLES ──
  const fineDustCount = 3000; 
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
    color: 0x756f64, 
    size: 0.016, 
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const fineDustParticles = new THREE.Points(fineDustGeo, fineDustMat);
  scene.add(fineDustParticles);

  // ── 2.5.5 DIRT DEBRIS PARTICLES ──
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
    color: 0x483e35, 
    size: 0.15,      
    map: createDirtFlakeTexture(),
    transparent: true,
    opacity: 0.60,
    blending: THREE.NormalBlending, 
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const debrisParticles = new THREE.Points(debrisGeo, debrisMat);
  scene.add(debrisParticles);

  // ── 2.6 SOOT / ASH PARTICLES ──
  const sootCount = 600;
  const sootPositions = new Float32Array(sootCount * 3);
  const sootData = []; 
  
  for (let i = 0; i < sootCount; i++) {
    sootPositions[i * 3] = (Math.random() - 0.5) * 16;
    sootPositions[i * 3 + 1] = Math.random() * 15 - 5;
    sootPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    
    sootData.push({
      speedY: 0.7 + Math.random() * 1.0,   
      driftX: -0.2 - Math.random() * 0.4,  
      driftZ: (Math.random() - 0.5) * 0.3
    });
  }
  
  const sootGeo = new THREE.BufferGeometry();
  sootGeo.setAttribute('position', new THREE.BufferAttribute(sootPositions, 3));
  
  const sootMat = new THREE.PointsMaterial({
    color: 0x222220, 
    size: 0.12,      
    transparent: true,
    opacity: 0.45,
    blending: THREE.NormalBlending, 
    depthWrite: false,
    sizeAttenuation: true
  });
  
  const sootParticles = new THREE.Points(sootGeo, sootMat);
  scene.add(sootParticles);

  /* ── 3. CONNECTING LINES ── */
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

  /* ── 4. ORBIT RINGS ── */
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

  /* ── 3.8 GREEN GRASS SYSTEM ── */
  const grassGroup = new THREE.Group();
  earthGroup.add(grassGroup); 

  const grassCount = 1500; 
  const grassGeo = new THREE.PlaneGeometry(0.16, 0.58, 1, 4);
  grassGeo.translate(0, 0.29, 0);

  const posAttr = grassGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const h = y / 0.58;
    const bendZ = Math.pow(h, 2) * 0.22;
    posAttr.setZ(i, posAttr.getZ(i) - bendZ);

    const twistX = Math.sin(h * Math.PI) * 0.04;
    posAttr.setX(i, x + twistX);
  }
  posAttr.needsUpdate = true;
  grassGeo.computeVertexNormals();

  const grassMats = [
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      roughness: 0.52, 
      metalness: 0.08, 
      emissive: new THREE.Color(0x0f3e1b),
      emissiveIntensity: 0.22,
      shadowSide: THREE.DoubleSide
    }),
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      color: new THREE.Color(0xd4fcb9), 
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color(0x1a4a1c),
      emissiveIntensity: 0.25,
      shadowSide: THREE.DoubleSide
    }),
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(),
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      color: new THREE.Color(0x7ade95), 
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color(0x0a2f14),
      emissiveIntensity: 0.18,
      shadowSide: THREE.DoubleSide
    })
  ];

  for (let i = 0; i < grassCount; i++) {
    const r = 1.75 + Math.random() * 1.85;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = -0.72 - (r * r) * 0.035 + (Math.random() - 0.5) * 0.05;

    const mat = grassMats[Math.floor(Math.random() * grassMats.length)];
    const grassMesh = new THREE.Mesh(grassGeo, mat);
    grassMesh.position.set(x, y, z);
    
    grassMesh.rotation.y = Math.random() * Math.PI * 2;
    grassMesh.rotation.x = (Math.random() - 0.5) * 0.22;
    grassMesh.rotation.z = (Math.random() - 0.5) * 0.22;
    
    const scale = 0.8 + Math.random() * 0.7;
    grassMesh.userData = {
      baseScaleY: scale,
      baseScaleXZ: scale * 0.85,
      radius: r
    };
    
    grassMesh.scale.set(scale * 0.85, 0.0, scale * 0.85);
    grassMesh.castShadow = true;
    grassMesh.receiveShadow = true;
    
    grassGroup.add(grassMesh);
  }

  /* ── 3.9 WILDFLOWERS SYSTEM ── */
  const flowerGroup = new THREE.Group();
  earthGroup.add(flowerGroup);

  const flowerCount = 45;
  const flowerGeo = new THREE.PlaneGeometry(0.26, 0.95);
  flowerGeo.translate(0, 0.475, 0);

  const flowerColors = ['#f472b6', '#f8fafc', '#fb923c']; 
  const flowerMats = flowerColors.map(color => new THREE.MeshStandardMaterial({
    map: createFlowerTexture(color),
    transparent: true,
    alphaTest: 0.15,
    side: THREE.DoubleSide,
    roughness: 0.52,
    metalness: 0.08,
    emissive: new THREE.Color(0x082510), 
    emissiveIntensity: 0.18,
    shadowSide: THREE.DoubleSide
  }));

  for (let i = 0; i < flowerCount; i++) {
    const r = 1.85 + Math.random() * 1.65;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = -0.72 - (r * r) * 0.035 + (Math.random() - 0.5) * 0.03; 

    const mat = flowerMats[Math.floor(Math.random() * flowerMats.length)];
    const flowerMesh = new THREE.Mesh(flowerGeo, mat);
    flowerMesh.position.set(x, y, z);
    
    flowerMesh.rotation.x = (Math.random() - 0.5) * 0.25;
    flowerMesh.rotation.y = Math.random() * Math.PI * 2;
    flowerMesh.rotation.z = (Math.random() - 0.5) * 0.25;
    
    const scale = 0.75 + Math.random() * 0.6;
    flowerMesh.userData = {
      baseScaleY: scale,
      baseScaleXZ: scale,
      radius: r
    };
    
    flowerMesh.scale.set(scale, 0.0, scale); 
    flowerMesh.castShadow = true;
    flowerMesh.receiveShadow = true;
    
    flowerGroup.add(flowerMesh);
  }

  /* ── 4.5. VOLUMETRIC SUN GLOW & RAYS ── */
  function createSunGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
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

  const raysGroup = new THREE.Group();
  scene.add(raysGroup);

  const height = 36;
  const rayConfigs = [
    { target: new THREE.Vector3(0.1, 2.0, -0.1),  top: 0.008, bottom: 0.60, opacity: 0.36, scrollSpeed: 0.055 },
    { target: new THREE.Vector3(-0.9, 1.5, 0.4),  top: 0.005, bottom: 0.36, opacity: 0.22, scrollSpeed: 0.090 },
    { target: new THREE.Vector3(1.2, 0.7, -0.2),  top: 0.003, bottom: 0.20, opacity: 0.14, scrollSpeed: 0.038 },
    { target: new THREE.Vector3(0.2, -0.1, 0.5),  top: 0.003, bottom: 0.28, opacity: 0.24, scrollSpeed: 0.072 }
  ];

  rayConfigs.forEach((config) => {
    const rayGeo = new THREE.CylinderGeometry(config.top, config.bottom, height, 16, 1, true);
    rayGeo.translate(0, -height / 2, 0);

    const mat = rayMaterial.clone();
    mat.uniforms.opacity.value     = config.opacity;
    mat.uniforms.scrollSpeed.value = config.scrollSpeed; 
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

  /* ── 5. ORBIT CONTROLS + SCROLL GROWTH ── */
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.75;

  let scrollPct = 0;       
  let smoothPct = 0;       
  let currentAngle = 0;
  let currentHeight = 0.6;
  let currentRadius = 5.0;

  function updateScrollPct() {
    const scrollMax = document.body.scrollHeight - window.innerHeight;
    scrollPct = scrollMax > 0 ? Math.min(window.scrollY / scrollMax, 1.0) : 0.0;
  }

  window.addEventListener('scroll', updateScrollPct, { passive: true });
  window.addEventListener('resize', updateScrollPct, { passive: true });
  updateScrollPct();
  window.addEventListener('load', updateScrollPct);

  /* ── 6. POST-PROCESSING ── */
  const composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    0.45,   
    0.8,    
    0.42    
  );
  composer.addPass(bloomPass);

  const vignette = document.createElement('div');
  vignette.style.cssText = `
    position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(ellipse at 50% 50%,
      transparent 40%,
      rgba(0,0,0,0.25) 70%,
      rgba(0,0,0,0.55) 100%);
  `;
  container.appendChild(vignette);

  const lensRing = document.createElement('div');
  lensRing.style.cssText = `
    position:fixed;inset:0;z-index:1;pointer-events:none;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    mask-image: radial-gradient(ellipse 55% 55% at 50% 50%, transparent 55%, black 70%, black 100%);
    -webkit-mask-image: radial-gradient(ellipse 55% 55% at 50% 50%, transparent 55%, black 70%, black 100%);
  `;
  container.appendChild(lensRing);

  const glowRing = document.createElement('div');
  glowRing.style.cssText = `
    position:fixed;inset:0;z-index:1;pointer-events:none;
    background:radial-gradient(ellipse 60% 60% at 50% 50%, transparent 45%, rgba(74,222,128,0.06) 55%, rgba(74,222,128,0.12) 62%, rgba(74,222,128,0.04) 72%, transparent 85%);
  `;
  container.appendChild(glowRing);

  /* ── 7. ANIMATION LOOP ── */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.elapsedTime;

    if (mixer) mixer.update(delta);
    controls.update();

    smoothPct += (scrollPct - smoothPct) * 0.06;

    const pollutedColor = new THREE.Color(0x0e100e);
    const cleanColor = new THREE.Color(0x070c0a);
    const fogTransitionPct = Math.min(smoothPct / 0.55, 1.0);
    baseFogColor.copy(pollutedColor).lerp(cleanColor, fogTransitionPct);
    const targetFogDensity = 0.28 - fogTransitionPct * 0.08;

    const targetAngle = smoothPct * Math.PI * 2;
    const zoomCenter = 4.2;
    const zoomAmplitude = 1.8;
    const targetRadius = zoomCenter + Math.sin(smoothPct * Math.PI * 4) * zoomAmplitude;

    const heightCenter = 0.4;
    const heightAmp = 0.5;
    const targetHeight = heightCenter + Math.sin(smoothPct * Math.PI * 2) * heightAmp;

    currentAngle  += (targetAngle  - currentAngle)  * 0.08;
    currentRadius += (targetRadius - currentRadius) * 0.06;
    currentHeight += (targetHeight - currentHeight) * 0.06;

    const camX = Math.sin(currentAngle) * currentRadius;
    const camZ = Math.cos(currentAngle) * currentRadius;
    const camY = currentHeight * 2.0;
    camera.position.set(camX, camY, camZ);
    controls.target.set(0, 0, 0);

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

    if (typeof bigParticles !== 'undefined' && bigPMat) {
      bigPMat.opacity = 0.20 * particleFade;
      bigParticles.visible = particleFade > 0;
    }

    if (typeof fineDustParticles !== 'undefined' && fineDustMat) {
      const fineDustFade = Math.min(Math.max(1.0 - smoothPct / 0.5, 0.0), 1.0);
      fineDustMat.opacity = 0.55 * fineDustFade;
      if (fineDustFade > 0) {
        fineDustParticles.visible = true;
        const fdPos = fineDustGeo.attributes.position.array;
        for (let i = 0; i < fineDustCount; i++) {
          const off = fineDustOffsets[i];
          
          fdPos[i * 3]     += Math.sin(t * 0.1 + off) * 0.002 + 0.003; 
          fdPos[i * 3 + 1] += Math.cos(t * 0.08 + off) * 0.0015;
          fdPos[i * 3 + 2] += Math.sin(t * 0.05 + off) * 0.001;
          
          if (fdPos[i * 3] > 6.0)  fdPos[i * 3] = -6.0;
          if (fdPos[i * 3 + 1] > 6.0) fdPos[i * 3 + 1] = -2.5;
        }
        fineDustGeo.attributes.position.needsUpdate = true;
      } else {
        fineDustParticles.visible = false;
      }
    }

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
          
          if (Math.abs(dbPos[i * 3]) > 6.0) dbPos[i * 3] = (Math.random() - 0.5) * 12;
          if (dbPos[i * 3 + 1] > 6.0 || dbPos[i * 3 + 1] < -3.0) dbPos[i * 3 + 1] = -2.5 + Math.random() * 8.5;
        }
        debrisGeo.attributes.position.needsUpdate = true;
      } else {
        debrisParticles.visible = false;
      }
    }

    if (rainParticles && rainGeometry) {
      const rainFade = Math.min(Math.max(1.0 - smoothPct / 0.4, 0.0), 1.0);
      rainMaterial.opacity = 0.85 * rainFade;
      
      if (rainFade > 0) {
        rainParticles.visible = true;
        const rPos = rainGeometry.attributes.position.array;
        for (let i = 0; i < rainCount; i++) {
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

    if (typeof wetMaterials !== 'undefined' && wetMaterials.length > 0) {
      const wetness = Math.min(Math.max(1.0 - smoothPct / 0.40, 0.0), 1.0); 
      
      wetMaterials.forEach(item => {
        const mat = item.material;
        mat.roughness = item.baseRoughness + (item.wetRoughness - item.baseRoughness) * wetness;
        mat.metalness = item.baseMetalness + (item.wetMetalness - item.baseMetalness) * wetness;
        
        if (mat.clearcoat !== undefined) {
          mat.clearcoat = wetness * 0.48;
          mat.clearcoatRoughness = 0.12 + 0.38 * (1.0 - wetness);
        }
        
        const tint = 1.0 - 0.42 * wetness; 
        mat.color.setRGB(tint, tint, tint);
      });
    }

    if (sootParticles && sootGeo) {
      const sootFade = Math.min(Math.max(1.0 - smoothPct / 0.45, 0.0), 1.0);
      sootMat.opacity = 0.45 * sootFade;
      
      if (sootFade > 0) {
        sootParticles.visible = true;
        const sPos = sootGeo.attributes.position.array;
        for (let i = 0; i < sootCount; i++) {
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

    if (smoothPct < 0.25) {
      lightningTime += delta;
      if (lightningTime >= nextLightningTime) {
        lightningTime = 0;
        nextLightningTime = 0.8 + Math.random() * 1.5; 
        lightningFlashActive = true;
        flashIntensity = 1.0; 
      }
    } else {
      lightningTime = 0;
      if (lightningFlashActive) {
        flashIntensity -= delta * 5.0; 
        if (flashIntensity <= 0) {
          flashIntensity = 0;
          lightningFlashActive = false;
        }
      }
    }

    if (lightningFlashActive) {
      flashIntensity -= delta * 2.2; 
      if (flashIntensity <= 0) {
        flashIntensity = 0;
        lightningFlashActive = false;
        
        scene.background.copy(baseFogColor);
        scene.fog.color.copy(baseFogColor);
        scene.fog.density = targetFogDensity;
        hemiLight.intensity = baseHemiIntensity;
        ambLight.intensity = baseAmbIntensity;
        dirLight.intensity = 3.8; 
      } else {
        let currentFlash = flashIntensity;
        const phase = t * 35.0; 
        const flicker = Math.sin(phase) * 0.4 + 0.6; 
        currentFlash *= flicker;

        if (flashIntensity > 0.2 && flashIntensity < 0.6 && Math.sin(t * 12.0) > 0.5) {
          currentFlash *= 0.15;
        }

        scene.background.copy(baseFogColor).lerp(flashColor, currentFlash * 0.95);
        scene.fog.color.copy(baseFogColor).lerp(flashColor, currentFlash * 0.95);

        hemiLight.intensity = baseHemiIntensity + currentFlash * 6.8;
        ambLight.intensity = baseAmbIntensity + currentFlash * 2.8;
        dirLight.intensity = 3.8 + currentFlash * 5.0;
      }
    } else {
      scene.background.copy(baseFogColor);
      scene.fog.color.copy(baseFogColor);
      scene.fog.density = targetFogDensity;
      hemiLight.intensity = baseHemiIntensity;
      ambLight.intensity = baseAmbIntensity;
    }

    dirLight.position.set(-10, 18, -12);
    rimLight.position.set(7, -5, 8.4);

    if (typeof sunGlowMesh !== 'undefined') {
      const glowFade = Math.min(Math.max((smoothPct - 0.05) / 0.5, 0.0), 1.0);
      sunGlowMesh.material.opacity = 0.45 * glowFade;
      sunGlowMesh.position.copy(dirLight.position);
      sunGlowMesh.lookAt(camera.position);
    }

    if (typeof raysGroup !== 'undefined') {
      const rayFade = Math.min(Math.max((smoothPct - 0.05) / 0.5, 0.0), 1.0);

      raysGroup.children.forEach((pivot) => {
        const data = pivot.userData;
        pivot.position.copy(dirLight.position);

        const dynamicTarget = data.target.clone();
        const swingSpeed = 0.25; 
        const swingRange = 0.5;  
        dynamicTarget.x += Math.sin(t * swingSpeed + data.offset) * swingRange;
        dynamicTarget.y += Math.cos(t * swingSpeed * 0.8 + data.offset) * (swingRange * 0.4);
        dynamicTarget.z += Math.sin(t * swingSpeed * 1.2 + data.offset) * swingRange;
        pivot.lookAt(dynamicTarget);

        data.mesh.material.uniforms.time.value    = t;
        data.mesh.material.uniforms.opacity.value = data.baseOpacity * (0.82 + 0.18 * Math.sin(t * data.speed + data.offset)) * rayFade;
      });
    }

    if (typeof grassGroup !== 'undefined') {
      grassGroup.children.forEach((mesh) => {
        const data = mesh.userData;
        
        const normR = (data.radius - 1.75) / (3.6 - 1.75);
        const growStart = 0.20 + normR * 0.15; 
        const growEnd = growStart + 0.40;
        const grassPct = Math.min(Math.max((smoothPct - growStart) / (growEnd - growStart), 0.0), 1.0);
        
        mesh.scale.y = data.baseScaleY * grassPct;
        mesh.scale.x = data.baseScaleXZ * Math.min(grassPct * 1.5, 1.0);
        mesh.scale.z = data.baseScaleXZ * Math.min(grassPct * 1.5, 1.0);
        
        const sway = Math.sin(t * 2.0 + mesh.position.x * 2.0 + mesh.position.z * 1.5) * 0.08;
        mesh.rotation.z = sway;
      });
    }

    if (typeof flowerGroup !== 'undefined') {
      flowerGroup.children.forEach((mesh) => {
        const data = mesh.userData;
        
        const normR = (data.radius - 1.85) / (3.5 - 1.85);
        const bloomStart = 0.35 + normR * 0.15; 
        const bloomEnd = bloomStart + 0.30;
        const bloomPct = Math.min(Math.max((smoothPct - bloomStart) / (bloomEnd - bloomStart), 0.0), 1.0);
        
        mesh.scale.y = data.baseScaleY * bloomPct;
        mesh.scale.x = data.baseScaleXZ * bloomPct;
        mesh.scale.z = data.baseScaleXZ * bloomPct;
        
        const sway = Math.sin(t * 2.0 + mesh.position.x * 2.0 + mesh.position.z * 1.5) * 0.05;
        mesh.rotation.z = sway;
      });
    }

    composer.render();
  }

  animate();

  /* ── 8. RESIZE HANDLER ── */
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  }, { passive: true });

})();
```

---

## 🔍 GIẢI THÍCH CHI TIẾT CÁC THUẬT TOÁN ĐỒ ÁN CỦA BẠN

### 1. Camera bám theo hành vi cuộn trang mượt mà (Lerp)
*   **Trạng thái cuộn:** `scrollPct = Y / maxScroll`. Khi người dùng cuộn, con số này lập tức thay đổi.
*   **Bộ lọc Lerp mượt:** `smoothPct += (scrollPct - smoothPct) * 0.06`. Ở mỗi khung hình, giá trị hiển thị thực tế chỉ tiến thêm $6\%$ quãng đường còn lại đến giá trị mục tiêu, giúp chuyển động của camera cực kỳ êm ái, trôi nổi nghệ thuật.
*   **Độ mọc động:** Vị trí camera, khoảng cách thu phóng, sương mù ô nhiễm hay trong lành, và tỉ lệ tăng trưởng của thảm cỏ, hoa đều được ánh xạ toán học từ giá trị `smoothPct`.

### 2. Can thiệp bẻ cong và tạo sóng gió cho 1,500 lá cỏ
*   **Bẻ cong đỉnh parabol:** Lưới nguyên bản của cỏ là một Plane phẳng. Hàm lượng giác của ta duyệt qua tọa độ đỉnh, quy đổi chiều cao ngọn $h \in [0.0, 1.0]$ và bẻ lùi ngọn cỏ theo trục Z bằng bình phương độ cao: `bendZ = h^2 * 0.22`, giúp ngọn cỏ có dạng cong tự nhiên thay vì thẳng tắp.
*   **Sóng gió lan truyền:** Trong vòng lặp animate, ta gán góc nghiêng của lá cỏ bằng hàm `Math.sin(time + x + z)`. Do pha dao động phụ thuộc vào vị trí thực tế X, Z của lá cỏ, ta nhìn thấy thảm cỏ đung đưa gợn sóng lan truyền giống như gió thổi qua thảo nguyên.

### 3. God Rays Volumetric Shader chạy trên GPU
*   **Cơ chế Shader:** Đây là chương trình chạy trực tiếp trên card đồ họa. Vertex Shader xử lý tọa độ đỉnh, Fragment Shader tính màu sắc của từng pixel trên Cylinder.
*   `radialFade = dot(normal, viewDir)^3.2`: Tích vô hướng giữa hướng nhìn camera và pháp tuyến ống. Khi nhìn thẳng vào tâm ống, tích đạt mức $1.0$, nhìn nghiêng rìa ống tiến về $0.0$. Công thức này giúp rìa ống mờ ảo, tạo cảm giác tia sáng dạng làn khói thay vì ống nhựa đặc.
*   `fract(vUv.y + time * scrollSpeed)`: Cuộn liên tục toạ độ kết cấu của ống lên phía trên theo thời gian thực để tạo ra ảo ảnh dải ánh sáng đang chuyển động.

### 4. CORS Proxy Server và Bộ Nhớ Đệm RAM của PowerShell
*   **Proxy CORS:** Bản chất CORS cấm trình duyệt tải tài nguyên liên miền. Server PowerShell của ta chặn đường dẫn `/api/proxy?url=...`, sử dụng kịch bản backend tải hộ dữ liệu bằng `Invoke-WebRequest` và phản hồi lại kèm header `Access-Control-Allow-Origin: *` cho phép client sử dụng an toàn.
*   **In-Memory Cache:** Dùng Hashtable trong bộ nhớ RAM. Khi có request, đối chiếu thời gian. Nếu thời gian lưu bé hơn TTL (5 phút), server trả kết quả từ RAM ngay lập tức mà không cần gọi mạng ngoài, tăng tốc độ phản hồi và chống bị rate limit.

---

## ❓ CÂU HỎI PHẢN BIỆN THƯỜNG GẶP CỦA HỘI ĐỒNG (VÀ ĐÁP ÁN)

1.  **Hỏi:** *Làm thế nào để server PowerShell nhận diện đúng định dạng file 3D GLB khi truyền về trình duyệt?*
    *   **Đáp:** Ta can thiệp vào Header Content-Type. Khi có request tải file, server phân tích đuôi mở rộng (`.glb`). Ta viết một cấu trúc `switch-case` định nghĩa: nếu file đuôi `.glb`, server bắt buộc gán `$response.ContentType = "model/gltf-binary"`. Nếu thiếu cấu hình này, trình duyệt sẽ hiểu sai định dạng và từ chối nạp mô hình 3D.
2.  **Hỏi:** *Tại sao thảm cỏ và hoa dại lại mọc lan tỏa từ tâm đồi ra rìa ngoài khi cuộn trang?*
    *   **Đáp:** Ta chuẩn hóa bán kính khoảng cách của ngọn cỏ tới tâm đồi `normR` về $[0, 1]$. Cỏ gần gốc có `normR` nhỏ sẽ mọc sớm hơn khi cuộn trang đạt $20\%$, cỏ xa gốc có `normR` lớn sẽ mọc trễ hơn khi cuộn trang đạt $35\%$. Tỉ lệ mọc riêng biệt này nhân vào tỉ lệ co giãn `scale.y` tạo ra hoạt cảnh mọc lan tỏa sinh động.

---

## ✍️ HƯỚNG DẪN VIẾT LẠI CODE MẪU TỐI GIẢN
Khi được yêu cầu viết code Lerp camera cuộn trang và làm loãng sương mù bằng JavaScript:

```javascript
let scrollPct = 0;
let smoothPct = 0;

window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - window.innerHeight;
  scrollPct = window.scrollY / max;
});

function animate() {
  requestAnimationFrame(animate);
  
  // Nội suy Lerp
  smoothPct += (scrollPct - smoothPct) * 0.1;
  
  // Xoay mô hình hoặc dịch chuyển camera
  camera.position.x = Math.sin(smoothPct * Math.PI * 2) * 5;
  camera.position.z = Math.cos(smoothPct * Math.PI * 2) * 5;
  
  // Làm loãng sương mù
  scene.fog.density = 0.3 - smoothPct * 0.2; // Giảm dần sương mù
  
  renderer.render(scene, camera);
}
```
