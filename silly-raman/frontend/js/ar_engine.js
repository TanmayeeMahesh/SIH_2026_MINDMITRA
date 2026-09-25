/**
 * MindMitra: Google ARCore / WebXR 3D Augmented Reality Navigation Engine
 * Powered by Three.js WebGL + WebRTC Laptop/Device Camera + WebXR Spatial Orientation
 */

class ARNavigationEngine {
  constructor() {
    this.container = null;
    this.videoElement = null;
    this.canvasElement = null;
    
    // Three.js Core Components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    // 3D AR Meshes
    this.arrowGroup = null;
    this.beaconGroup = null;
    this.blossomParticles = [];
    this.groundGrid = null;

    // Spatial Orientation State
    this.cameraHeading = 0.0; // 0 = North, 90 = East, 180 = South, 270 = West
    this.targetBearing = 0.0;
    this.targetDistanceMeters = 0.0;
    this.targetName = "Select Destination";
    this.targetIcon = "📍";
    this.isCameraActive = false;
    this.isSyntheticCamera = false;
    
    // Interaction
    this.isDragging = false;
    this.previousMouseX = 0;
  }

  async init(containerId, videoId, canvasId) {
    this.container = document.getElementById(containerId);
    this.videoElement = document.getElementById(videoId);
    this.canvasElement = document.getElementById(canvasId);

    if (!this.container || !this.canvasElement) {
      console.error("AR Engine container or canvas not found");
      return;
    }

    // 1. Initialize Laptop Camera via WebRTC
    await this.initCamera();

    // 2. Initialize Three.js 3D WebGL Scene
    this.initThreeScene();

    // 3. Create 3D AR Guidance Objects
    this.create3DGuidanceArrow();
    this.create3DLandmarkBeacon();
    this.create3DBlossomCarpet();

    // 4. Setup Laptop 360° Spatial Interaction
    this.setupLaptopSpatialControls();

    // 5. Start Real-Time Render Loop
    this.animate();

    console.log("🚀 Google ARCore / WebXR 3D Engine Initialized Successfully!");
  }

  async initCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user", // Laptop webcam
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (this.videoElement) {
          this.videoElement.srcObject = stream;
          await this.videoElement.play();
          this.isCameraActive = true;
          this.updateCameraStatus("🟢 Live Laptop Webcam Active");
        }
      } catch (err) {
        console.warn("Webcam access denied or unavailable. Using AR Street Simulation backdrop:", err);
        this.enableSyntheticCamera();
      }
    } else {
      this.enableSyntheticCamera();
    }
  }

  enableSyntheticCamera() {
    this.isSyntheticCamera = true;
    if (this.videoElement) {
      this.videoElement.style.display = "none";
    }
    if (this.container) {
      this.container.classList.add("synthetic-ar-backdrop");
    }
    this.updateCameraStatus("🌆 AR Real-World Spatial Simulation");
  }

  updateCameraStatus(text) {
    const el = document.getElementById("arCameraStatusText");
    if (el) el.innerText = text;
  }

  initThreeScene() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // Scene with transparent background so camera video shows through
    this.scene = new THREE.Scene();

    // Perspective Camera matching human field-of-view
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.6, 0); // Average human eye level at 1.6 meters

    // WebGL Renderer with Alpha Transparency & Antialiasing
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Lighting (Sunlight + Ambient Glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.2);
    sunLight.position.set(5, 12, 7);
    this.scene.add(sunLight);

    // Responsive Window Resize Handler
    window.addEventListener("resize", () => this.onWindowResize());
  }

  create3DGuidanceArrow() {
    this.arrowGroup = new THREE.Group();

    // 1. Neon Glowing 3D Chevron Arrow Body
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.8);
    arrowShape.lineTo(0.5, 0.1);
    arrowShape.lineTo(0.22, 0.1);
    arrowShape.lineTo(0.22, -0.7);
    arrowShape.lineTo(-0.22, -0.7);
    arrowShape.lineTo(-0.22, 0.1);
    arrowShape.lineTo(-0.5, 0.1);
    arrowShape.closePath();

    const extrudeSettings = {
      steps: 2,
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
    geometry.center();

    // Emissive holographic emerald-cyan material
    const material = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });

    const arrowMesh = new THREE.Mesh(geometry, material);
    arrowMesh.rotation.x = Math.PI / 2; // Flat facing forward
    this.arrowGroup.add(arrowMesh);

    // 2. Pulsating Neon Halo Ring beneath Arrow
    const ringGeo = new THREE.RingGeometry(0.7, 0.85, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const haloRing = new THREE.Mesh(ringGeo, ringMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.y = -0.4;
    this.arrowGroup.add(haloRing);

    // Position arrow 3.2 meters in front of camera
    this.arrowGroup.position.set(0, 0.9, -3.2);
    this.scene.add(this.arrowGroup);
  }

  create3DLandmarkBeacon() {
    this.beaconGroup = new THREE.Group();

    // 1. Vertical Holographic Light Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.25, 4.0, 16);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 2.0;
    this.beaconGroup.add(pillar);

    // 2. Floating 3D Badge Sprite on Top of Beacon
    this.beaconBadgeSprite = this.createDynamicBadgeSprite("📍", "Destination");
    this.beaconBadgeSprite.position.set(0, 4.2, 0);
    this.beaconBadgeSprite.scale.set(3.2, 1.6, 1.0);
    this.beaconGroup.add(this.beaconBadgeSprite);

    // Position beacon along default target vector
    this.beaconGroup.position.set(0, 0, -8.0);
    this.scene.add(this.beaconGroup);
  }

  createDynamicBadgeSprite(icon, name) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Rounded Holographic Pill
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 8;
    this.roundRect(ctx, 16, 16, 480, 224, 40, true, true);

    // Icon & Text
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`${icon} ${name}`, 256, 110);

    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("⭐ AR Landmark Beacon", 256, 180);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    return new THREE.Sprite(spriteMat);
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  create3DBlossomCarpet() {
    const flowerIcons = ["🌸", "🌼", "🌷", "🌿", "🌺"];
    for (let i = 0; i < 35; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const icon = flowerIcons[i % flowerIcons.length];
      ctx.fillText(icon, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
      const sprite = new THREE.Sprite(spriteMat);

      // Distribute along the ground corridor
      sprite.position.set(
        (Math.random() - 0.5) * 4.5,
        0.05 + Math.random() * 0.4,
        -1.0 - Math.random() * 12.0
      );
      sprite.scale.set(0.4, 0.4, 0.4);
      sprite.userData = {
        baseY: sprite.position.y,
        speed: 0.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2
      };

      this.scene.add(sprite);
      this.blossomParticles.push(sprite);
    }
  }

  setupLaptopSpatialControls() {
    // 1. Mouse Drag to Pan 360° on Laptop
    if (this.container) {
      this.container.addEventListener("mousedown", (e) => {
        this.isDragging = true;
        this.previousMouseX = e.clientX;
      });

      window.addEventListener("mouseup", () => {
        this.isDragging = false;
      });

      window.addEventListener("mousemove", (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMouseX;
        this.previousMouseX = e.clientX;
        this.cameraHeading = (this.cameraHeading - deltaX * 0.35 + 360) % 360;
        this.updateSpatialHUD();
      });
    }

    // 2. Keyboard Arrow Navigation (◄ / ►)
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.cameraHeading = (this.cameraHeading - 5 + 360) % 360;
        this.updateSpatialHUD();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.cameraHeading = (this.cameraHeading + 5) % 360;
        this.updateSpatialHUD();
      }
    });

    // 3. Mobile DeviceOrientation Sensor Fusion Fallback
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (e) => {
        if (e.alpha !== null && !isNaN(e.alpha)) {
          this.cameraHeading = (360 - e.alpha) % 360;
          this.updateSpatialHUD();
        }
      });
    }
  }

  setNavigationTarget(bearingDeg, distanceMeters, name, icon) {
    this.targetBearing = bearingDeg || 0.0;
    this.targetDistanceMeters = distanceMeters || 0.0;
    this.targetName = name || "Safe Path";
    this.targetIcon = icon || "📍";

    // Update 3D Billboard Sprite with new destination name
    if (this.beaconBadgeSprite && this.beaconGroup) {
      this.beaconGroup.remove(this.beaconBadgeSprite);
      this.beaconBadgeSprite = this.createDynamicBadgeSprite(this.targetIcon, this.targetName);
      this.beaconBadgeSprite.position.set(0, 4.2, 0);
      this.beaconBadgeSprite.scale.set(3.2, 1.6, 1.0);
      this.beaconGroup.add(this.beaconBadgeSprite);
    }

    this.updateSpatialHUD();
  }

  updateSpatialHUD() {
    // Angular Difference between Phone/Laptop Camera Heading and Target Bearing
    let diff = this.targetBearing - this.cameraHeading;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    const diffRad = THREE.MathUtils.degToRad(diff);

    // 1. Orient 3D Guidance Arrow in 3D Perspective
    if (this.arrowGroup) {
      const radius = 3.2;
      this.arrowGroup.position.x = Math.sin(diffRad) * radius;
      this.arrowGroup.position.z = -Math.cos(diffRad) * radius;
      this.arrowGroup.rotation.y = -diffRad;
    }

    // 2. Position 3D Landmark Beacon in distance perspective
    if (this.beaconGroup) {
      const beaconDist = Math.min(Math.max(this.targetDistanceMeters * 0.1, 5.0), 20.0);
      this.beaconGroup.position.x = Math.sin(diffRad) * beaconDist;
      this.beaconGroup.position.z = -Math.cos(diffRad) * beaconDist;
    }

    // 3. Update 2D Screen Compass & Horizon Meter
    const compassEl = document.getElementById("arCompassDial");
    const headingEl = document.getElementById("arHeadingVal");
    const guidePillEl = document.getElementById("arSpatialGuidePill");

    if (compassEl) {
      compassEl.style.transform = `rotate(${-this.cameraHeading}deg)`;
    }
    if (headingEl) {
      headingEl.innerText = `${Math.round(this.cameraHeading)}°`;
    }

    if (guidePillEl) {
      if (Math.abs(diff) <= 25) {
        guidePillEl.className = "ar-guide-pill aligned";
        guidePillEl.innerHTML = "<span>✨</span> Facing Target Path Directly (Walk Forward)";
      } else if (diff > 25) {
        guidePillEl.className = "ar-guide-pill turn-right";
        guidePillEl.innerHTML = `<span>►</span> Turn Right (~${Math.round(diff)}°)`;
      } else {
        guidePillEl.className = "ar-guide-pill turn-left";
        guidePillEl.innerHTML = `<span>◄</span> Turn Left (~${Math.round(-diff)}°)`;
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // 1. Pulsating 3D Arrow Animation (Bobbing + Light Pulse)
    if (this.arrowGroup) {
      this.arrowGroup.position.y = 0.9 + Math.sin(elapsedTime * 3.0) * 0.12;
      this.arrowGroup.children[0].rotation.z = Math.sin(elapsedTime * 2.0) * 0.05;
    }

    // 2. Floating 3D Blossom Particles
    this.blossomParticles.forEach((p) => {
      p.position.y = p.userData.baseY + Math.sin(elapsedTime * p.userData.speed + p.userData.phase) * 0.15;
    });

    // 3. Render WebGL Frame
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.arEngine = new ARNavigationEngine();
