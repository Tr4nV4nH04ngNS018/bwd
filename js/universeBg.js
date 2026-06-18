/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: js/universeBg.js
 *  MÔ TẢ: Background vũ trụ 3D cho các trang phụ (dashboard, calculator)
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1. Tạo bầu trời sao 3D (2000 ngôi sao) với màu xanh lá → xanh cyan
 *  2. Hệ thống sao băng (Shooting Stars) bay qua liên tục
 *  3. Hiệu ứng Parallax: cảnh dịch chuyển theo con trỏ chuột
 *  4. Tự động xoay nhẹ bầu trời → cảm giác đang di chuyển trong vũ trụ
 *  
 *  ĐẶC ĐIỂM KỸ THUẬT:
 *  - Render ở z-index: -2 (nằm SAU tất cả nội dung)
 *  - Sử dụng AdditiveBlending → ngôi sao phát sáng, không che nhau
 *  - FogExp2: Sương mù cấp số nhân tạo chiều sâu vũ trụ
 * ═══════════════════════════════════════════════════════════════════════
 */

(function() {
  /* ═══════════════════════════════════════════════════════════
   *  PHẦN 1: TẠO CONTAINER VÀ SCENE 3D
   *  - Container fixed toàn màn hình, z-index: -2 (sau tất cả)
   *  - Scene + Camera + Renderer + Fog
   * ═══════════════════════════════════════════════════════════ */

  // Tạo container HTML chứa Canvas 3D
  // position: fixed → luôn cố định khi cuộn trang
  // z-index: -2 → nằm sau tất cả nội dung trang
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:-2;overflow:hidden;background:#050a08;';
  document.body.prepend(container); // Chèn vào đầu body

  /**
   * THREE.Scene: Không gian 3D chứa tất cả đối tượng
   * THREE.FogExp2: Sương mù cấp số nhân
   *   - Công thức: opacity = 1 - e^(-density × distance)
   *   - density = 0.0002 → sương rất nhẹ, chỉ ảnh hưởng ngôi sao xa
   *   - Tạo chiều sâu: sao gần sáng rõ, sao xa mờ dần
   */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a08, 0.0002);

  /**
   * PerspectiveCamera: Camera phối cảnh
   * - FOV: 60° (góc nhìn)
   * - Near: 1 (không render vật quá gần)
   * - Far: 2000 (không render vật quá xa)
   * - position.z = 1000 → camera ở giữa trường sao
   */
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 1000;

  /**
   * WebGLRenderer: Engine render 3D sử dụng GPU
   * - antialias: Khử răng cưa cho nét vẽ mịn
   * - alpha: Nền trong suốt (dùng CSS background thay thế)
   * - pixelRatio giới hạn tối đa 2 (tiết kiệm GPU)
   */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  /* ═══════════════════════════════════════════════════════════
   *  PHẦN 2: HỆ THỐNG NGÔI SAO (Particle Stars)
   *  
   *  - 2000 ngôi sao phân bố ngẫu nhiên trong không gian 3D
   *  - Màu sắc: pha trộn ngẫu nhiên giữa xanh lá (#4ade80) và cyan (#7dd3fc)
   *  - Texture: hình tròn gradient (sáng ở tâm, mờ dần ra ngoài)
   *  - AdditiveBlending: ánh sáng cộng dồn → sao chồng nhau sáng hơn
   * ═══════════════════════════════════════════════════════════ */
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  // 2 màu cơ sở để pha trộn
  const color1 = new THREE.Color(0x4ade80); // Xanh lá EcoImpact
  const color2 = new THREE.Color(0x7dd3fc); // Xanh cyan
  
  for (let i = 0; i < particleCount; i++) {
    // Vị trí ngẫu nhiên trong cube 3000×3000×3000
    positions[i * 3]     = (Math.random() - 0.5) * 3000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3000;

    /**
     * lerp(color2, Math.random()): Nội suy tuyến tính giữa 2 màu
     * - Random = 0 → xanh lá thuần
     * - Random = 1 → cyan thuần
     * - Random = 0.5 → pha 50/50
     * → Mỗi ngôi sao có sắc thái khác nhau
     */
    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3]     = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  /**
   * Tạo texture ngôi sao bằng Canvas 2D:
   * - Canvas 16×16 pixel
   * - Gradient tỏa tròn: trắng sáng ở tâm → trong suốt ở viền
   * - Kết quả: mỗi ngôi sao trông như đốm sáng tỏa mềm mại
   */
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');      // Tâm: trắng 100%
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');  // 20%: trắng 80%
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');  // 50%: trắng 20%
  gradient.addColorStop(1, 'rgba(0,0,0,0)');            // Viền: trong suốt
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(canvas);

  /**
   * PointsMaterial: Vật liệu cho hệ thống điểm (particles)
   * - size: 12 → kích thước đốm sáng
   * - vertexColors: true → mỗi điểm có màu riêng
   * - AdditiveBlending: Ánh sáng CỘNG DỒN
   *   (2 ngôi sao chồng nhau → sáng gấp đôi, tạo hiệu ứng phát quang)
   * - depthWrite: false → không ghi depth buffer → trong suốt đúng cách
   */
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

  /* ═══════════════════════════════════════════════════════════
   *  PHẦN 3: HỆ THỐNG SAO BĂNG (Shooting Stars)
   *  
   *  - 7 sao băng bay qua liên tục
   *  - Hình dạng: CylinderGeometry (hình trụ thon nhọn = vệt sáng)
   *  - Mỗi sao băng có vận tốc và hướng riêng
   *  - Reset về vị trí mới khi bay ra ngoài màn hình
   *  - Có resetDelay: thời gian ẩn trước khi xuất hiện lại
   * ═══════════════════════════════════════════════════════════ */
  const shootingStars = [];

  /**
   * CylinderGeometry(đầu_nhỏ, đầu_lớn, chiều_dài, phân_đoạn):
   * - 0.5: Bán kính đầu nhỏ (đầu sao băng = mảnh)
   * - 4.0: Bán kính đầu lớn (đuôi sao băng = rộng)
   * - 120: Chiều dài vệt sáng
   * - 4: Số phân đoạn tròn
   * → Hình dạng: đuôi mở rộng, đầu thu nhỏ giống sao băng thật
   */
  const starGeo = new THREE.CylinderGeometry(0.5, 4.0, 120, 4);
  starGeo.rotateX(Math.PI / 2); // Xoay ngang để bay ngang

  const starMat = new THREE.MeshBasicMaterial({ 
    color: 0x86efac,                    // Xanh mint sáng
    transparent: true, 
    opacity: 1.0,
    blending: THREE.AdditiveBlending   // Phát sáng rực
  });
  
  // Tạo 7 sao băng
  for (let i = 0; i < 7; i++) {
    const star = new THREE.Mesh(starGeo, starMat);

    // Vị trí xuất phát ngẫu nhiên trong không gian
    star.position.set(
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 1500
    );

    /**
     * userData: Dữ liệu tùy chỉnh gắn vào đối tượng 3D
     * - velocity: Vector vận tốc (hướng + tốc độ bay)
     *   - X: ±(20-50) → bay ngang (trái hoặc phải)
     *   - Y: -(15-45) → rơi xuống
     *   - Z: 0 → không bay sâu/nông
     * - resetDelay: Frame chờ trước khi xuất hiện (tránh tất cả xuất hiện cùng lúc)
     */
    star.userData = {
      velocity: new THREE.Vector3(
        (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 30 + 20),
        -Math.random() * 30 - 15,
        0
      ),
      resetDelay: Math.random() * 200 // Delay ngẫu nhiên 0-200 frame
    };

    scene.add(star);
    shootingStars.push(star);
  }

  /* ═══════════════════════════════════════════════════════════
   *  PHẦN 4: XỬ LÝ RESIZE CỬA SỔ
   * ═══════════════════════════════════════════════════════════ */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Cập nhật ma trận phối cảnh
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ═══════════════════════════════════════════════════════════
   *  PHẦN 5: VÒNG LẶP ANIMATION CHÍNH (Main Render Loop)
   *  
   *  Mỗi frame:
   *  1. Xoay nhẹ bầu trời sao (tạo cảm giác bay trong vũ trụ)
   *  2. Cập nhật sao băng (di chuyển, xoay, reset)
   *  3. Hiệu ứng Parallax theo chuột
   *  4. Render scene
   * ═══════════════════════════════════════════════════════════ */

  // Theo dõi vị trí chuột cho hiệu ứng Parallax
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    // Chuyển tọa độ chuột về hệ trung tâm (0,0 ở giữa màn hình)
    mouseX = (e.clientX - window.innerWidth / 2) * 0.5;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.5;
  });

  function animate() {
    requestAnimationFrame(animate);
    
    // 1. Xoay nhẹ bầu trời sao → cảm giác trôi trong vũ trụ
    particles.rotation.y += 0.0005; // Xoay ngang rất chậm
    particles.rotation.x += 0.0002; // Nghiêng rất nhẹ
    
    // 2. Cập nhật từng sao băng
    shootingStars.forEach(star => {
      if (star.userData.resetDelay > 0) {
        // Đang trong giai đoạn chờ → ẩn sao băng
        star.userData.resetDelay--;
        star.visible = false;
      } else {
        star.visible = true;
        
        // Di chuyển sao băng theo vector vận tốc
        star.position.add(star.userData.velocity);
        
        /**
         * XOAY ĐẦU NHỌN THEO HƯỚNG BAY:
         * - Lấy hướng bay (velocity.normalize)
         * - Tính góc xoay từ trục Y mặc định → hướng bay
         * - Áp dụng quaternion để xoay mesh
         * → Sao băng luôn bay đúng hướng, đầu nhọn dẫn đường
         */
        const dir = star.userData.velocity.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, dir).normalize();
        const radians = Math.acos(up.dot(dir));
        star.quaternion.setFromAxisAngle(axis, radians);
        
        // Reset sao băng khi bay ra ngoài khu vực hiển thị
        if (star.position.x > 1500 || star.position.x < -1500 || star.position.y < -1000) {
          // Đặt vị trí mới ở phía trên
          star.position.set(
            (Math.random() - 0.5) * 2000,
            1000 + Math.random() * 500,
            (Math.random() - 0.5) * 1500
          );
          // Đợi 100-500 frame trước khi xuất hiện lại
          star.userData.resetDelay = Math.random() * 400 + 100;
          // Tạo vận tốc mới ngẫu nhiên
          star.userData.velocity.set(
            (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 30 + 20),
            -Math.random() * 30 - 15,
            0
          );
        }
      }
    });

    /**
     * 3. HIỆU ỨNG PARALLAX:
     * - Camera dịch chuyển nhẹ theo vị trí chuột
     * - Hệ số 0.02: nội suy mượt mà (easing 2%/frame)
     * - Tạo cảm giác chiều sâu 3D khi di chuột
     */
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position); // Camera luôn nhìn về tâm scene

    // 4. Render scene ra Canvas
    renderer.render(scene, camera);
  }
  
  animate(); // Bắt đầu vòng lặp
})(); // Kết thúc IIFE
