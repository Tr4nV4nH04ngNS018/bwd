(function() {
  // Container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:-2;overflow:hidden;background:#050a08;';
  document.body.prepend(container);

  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a08, 0.0002); // Giảm hẳn sương mù để nhìn xuyên thấu rõ hơn

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
    size: 12, // Tăng kích thước đốm sáng to gấp đôi
    vertexColors: true,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 1.0 // Sáng 100%
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Shooting Stars (Sao băng)
  const shootingStars = [];
  // Hình dáng sao băng: bự hơn, dài hơn
  const starGeo = new THREE.CylinderGeometry(0.5, 4.0, 120, 4);
  starGeo.rotateX(Math.PI / 2);
  const starMat = new THREE.MeshBasicMaterial({ 
    color: 0x86efac, // Xanh nhạt rực rỡ
    transparent: true, 
    opacity: 1.0, // Sáng rõ
    blending: THREE.AdditiveBlending
  });
  
  for (let i = 0; i < 7; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    // Vị trí xuất phát ngẫu nhiên
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
    
    // Rotate slowly
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;
    
    // Animate Shooting Stars
    shootingStars.forEach(star => {
      if (star.userData.resetDelay > 0) {
        star.userData.resetDelay--;
        star.visible = false;
      } else {
        star.visible = true;
        star.position.add(star.userData.velocity);
        
        // Cập nhật hướng bay (xoay đầu nhọn theo hướng rơi)
        const dir = star.userData.velocity.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, dir).normalize();
        const radians = Math.acos(up.dot(dir));
        star.quaternion.setFromAxisAngle(axis, radians);
        
        // Nếu rơi ra khỏi màn hình thì reset lại ở phía trên
        if (star.position.x > 1500 || star.position.x < -1500 || star.position.y < -1000) {
          star.position.set((Math.random() - 0.5) * 2000, 1000 + Math.random() * 500, (Math.random() - 0.5) * 1500);
          star.userData.resetDelay = Math.random() * 400 + 100; // Đợi một lúc rồi rơi tiếp
          star.userData.velocity.set((Math.random() > 0.5 ? 1 : -1) * (Math.random() * 30 + 20), -Math.random() * 30 - 15, 0);
        }
      }
    });

    // Parallax effect with mouse
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  
  animate();
})();
