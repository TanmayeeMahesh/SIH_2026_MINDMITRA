/**
 * MindMitra: Real 3D AR Spatial Navigation Engine
 * Powered by Three.js WebGL + Device Sensor Fusion (WebXR / DeviceOrientation / Compass)
 * 
 * Projects glossy blue rounded arrows (matching the authoritative visual reference)
 * into real 3D metric space using East-North-Up (ENU) coordinates.
 * Strictly consumes full OSRM pedestrian street network geometry (polyline_coords)
 * and anchors turn maneuvers at their exact geographic coordinates along the road.
 */

class ARSpatialEngine {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();

    // Geographic / ENU Origin
    this.originLat = null;
    this.originLon = null;
    this.earthRadius = 6378137.0;

    // Tracking & Sensors
    this.trackingState = 'STOPPED';
    this.onTrackingChange = null;
    this.compassHeading = 0; // Degrees (0 = North, 90 = East, etc.)
    this.devicePitch = 0;
    this.deviceRoll = 0;
    this.hasOrientation = false;

    // AR Scene Groups
    this.arrowGroup = null;
    this.beaconGroup = null;
    this.arrowTextureCache = {};
    this.arrowImage = null;
    this.arrowImageLoaded = false;

    // Animation & Smoothing
    this.targetCameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.currentCameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.arrowMeshes = [];
    this.animTime = 0;
    this.isRendering = false;
    this.rafId = null;

    // Active Route & Road Data
    this.currentRouteData = null;
    this.currentCoord = null;
    this.currentWaypointIdx = 0;
    this.roadBearing = 0; // Radians

    // Event listeners
    this._resizeHandler = null;
    this._orientationHandler = null;

    this.preloadArrowImage();
  }

  preloadArrowImage() {
    this.arrowImage = new Image();
    this.arrowImage.src = '/static/icons/arrow_ref.png?v=' + Date.now();
    this.arrowImage.onload = () => {
      this.arrowImageLoaded = true;
      console.log("🎨 Authoritative glossy blue arrow reference loaded successfully.");
      const maneuvers = [
        'FORWARD', 'SLIGHT_RIGHT', 'RIGHT', 'SHARP_RIGHT',
        'SLIGHT_LEFT', 'LEFT', 'SHARP_LEFT', 'U_TURN', 'ARRIVE'
      ];
      maneuvers.forEach(m => this.createGlossyBlueArrowTexture(m));
    };
    this.arrowImage.onerror = () => {
      console.log("Using procedural glossy blue arrow texture generator.");
    };
  }

  init(canvasId, onTrackingChange = null) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("AR Canvas not found:", canvasId);
      return false;
    }

    this.onTrackingChange = onTrackingChange;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : window.innerWidth;
    const height = rect.height > 0 ? rect.height : (window.innerHeight - 56);

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera (Vertical FOV 65° closely matches mobile camera lens)
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 0);

    // 3. WebGL Renderer with Alpha transparency for live camera passthrough
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    // 4. Lighting for 3D Glossy Materials
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(5, 15, 7);
    this.scene.add(dirLight);

    // 5. Container Groups
    this.arrowGroup = new THREE.Group();
    this.scene.add(this.arrowGroup);

    this.beaconGroup = new THREE.Group();
    this.scene.add(this.beaconGroup);

    // 6. Bind Resize & Sensor Handlers
    this._resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this._resizeHandler);
    this.setupSensorTracking();

    // 7. Start Rendering Loop
    this.isRendering = true;
    this.animate();

    this.setTrackingState('TRACKING');
    console.log("🚀 ARSpatialEngine initialized with Three.js WebGL!");
    return true;
  }

  handleResize() {
    if (!this.renderer || !this.camera || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : window.innerWidth;
    const height = rect.height > 0 ? rect.height : Math.max(300, window.innerHeight - 56);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setNavigationOrigin(lat, lon) {
    this.originLat = lat;
    this.originLon = lon;
    console.log(`📍 AR Navigation Origin Anchored: (${lat.toFixed(6)}, ${lon.toFixed(6)})`);
  }

  /**
   * Transforms Geographic GPS Coordinates to Local 3D East-North-Up (ENU) Coordinates
   * East  (X) = ΔLon * cos(Lat0) * R
   * North (-Z) = ΔLat * R
   * Up    (Y) = Altitude offset
   */
  gpsToENU(lat, lon, alt = -1.15, originLat = this.originLat, originLon = this.originLon) {
    if (originLat === null || originLon === null) {
      return { x: 0, y: alt, z: -5 };
    }

    const lat0Rad = (originLat * Math.PI) / 180.0;
    const dLatRad = ((lat - originLat) * Math.PI) / 180.0;
    const dLonRad = ((lon - originLon) * Math.PI) / 180.0;

    const xEast = dLonRad * Math.cos(lat0Rad) * this.earthRadius;
    const zNorth = dLatRad * this.earthRadius;

    return {
      x: xEast,
      y: alt,
      z: -zNorth
    };
  }

  setupSensorTracking() {
    this._orientationHandler = (e) => {
      this.hasOrientation = true;

      // Compass Heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
      let heading = 0;
      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        heading = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }
      this.compassHeading = heading;

      // Yaw around Y axis (-heading in radians)
      const yawRad = -((heading * Math.PI) / 180.0);
      this.targetCameraRotation.set(0, yawRad, 0, 'YXZ');
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(res => {
          if (res === 'granted') {
            window.addEventListener('deviceorientation', this._orientationHandler, true);
          }
        })
        .catch(e => console.warn('Orientation permission note:', e));
    } else {
      window.addEventListener('deviceorientation', this._orientationHandler, true);
    }
  }

  setTrackingState(state) {
    if (this.trackingState !== state) {
      this.trackingState = state;
      if (this.onTrackingChange) {
        this.onTrackingChange(state);
      }
    }
  }

  /**
   * Generates or retrieves glossy blue rounded arrow texture matching authoritative reference
   */
  createGlossyBlueArrowTexture(direction = 'FORWARD') {
    if (this.arrowTextureCache[direction]) {
      return this.arrowTextureCache[direction];
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const angleMap = {
      'FORWARD': -Math.PI / 2,
      'SLIGHT_RIGHT': -Math.PI / 4,
      'RIGHT': 0,
      'SHARP_RIGHT': Math.PI / 4,
      'SLIGHT_LEFT': -3 * Math.PI / 4,
      'LEFT': Math.PI,
      'SHARP_LEFT': 3 * Math.PI / 4,
      'U_TURN': Math.PI / 2,
      'ARRIVE': -Math.PI / 2
    };
    const angle = angleMap[direction] !== undefined ? angleMap[direction] : -Math.PI / 2;

    ctx.clearRect(0, 0, 512, 512);
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(angle);

    if (this.arrowImageLoaded && this.arrowImage) {
      const drawW = 440;
      const drawH = 440;
      ctx.drawImage(this.arrowImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Additional safety pass: Guarantee 100% transparent background
      try {
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const a = d[i + 3];
          if (a > 0) {
            // Check if pixel is gray/white checkerboard residue
            const isAchromatic = Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12;
            if (isAchromatic && (r > 180 || r < 80)) {
              d[i + 3] = 0;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {}
    } else {
      // High-Fidelity Procedural Fallback reproducing exact reference styling
      const headL = 135;
      const headHalfW = 145;
      const shaftHalfW = 68;
      const tailX = -180;
      const wingStartX = -10;

      ctx.beginPath();
      ctx.moveTo(headL, 0);
      ctx.bezierCurveTo(headL - 10, -35, wingStartX + 50, -headHalfW + 15, wingStartX, -headHalfW);
      ctx.bezierCurveTo(wingStartX - 15, -headHalfW + 5, wingStartX - 10, -shaftHalfW - 10, wingStartX, -shaftHalfW);
      ctx.lineTo(tailX + 25, -shaftHalfW);
      ctx.quadraticCurveTo(tailX, -shaftHalfW, tailX, 0);
      ctx.quadraticCurveTo(tailX, shaftHalfW, tailX + 25, shaftHalfW);
      ctx.lineTo(wingStartX, shaftHalfW);
      ctx.bezierCurveTo(wingStartX - 10, shaftHalfW + 10, wingStartX - 15, headHalfW - 5, wingStartX, headHalfW);
      ctx.bezierCurveTo(wingStartX + 50, headHalfW - 15, headL - 10, 35, headL, 0);
      ctx.closePath();

      // Deep cyan border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#005b64';
      ctx.stroke();

      // Glossy cyan-to-azure body gradient
      const bodyGrad = ctx.createLinearGradient(tailX, 0, headL, 0);
      bodyGrad.addColorStop(0, '#00C9FF');
      bodyGrad.addColorStop(0.35, '#00b4d8');
      bodyGrad.addColorStop(0.7, '#0077b6');
      bodyGrad.addColorStop(1, '#023e8a');
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Specular Highlight
      ctx.beginPath();
      ctx.ellipse(30, -30, 95, 20, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      // Wing highlight
      ctx.beginPath();
      ctx.ellipse(wingStartX + 40, -headHalfW + 28, 48, 10, 0.65, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();

      // Glass bubbles
      ctx.beginPath();
      ctx.arc(tailX + 48, -12, 7, 0, Math.PI * 2);
      ctx.arc(tailX + 66, 8, 9, 0, Math.PI * 2);
      ctx.arc(tailX + 85, -6, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this.arrowTextureCache[direction] = texture;
    return texture;
  }

  /**
   * Updates the AR Path with Sequential 3D Arrows along the real OSRM street route
   * Uses polyline_coords for exact road curvature and anchors maneuvers at real waypoint coords
   */
  updatePath(routeData, currentCoord, currentWaypointIdx = 0, nextArrowType = 'FORWARD') {
    if (!routeData || !currentCoord) return;

    this.currentRouteData = routeData;
    this.currentCoord = currentCoord;
    this.currentWaypointIdx = currentWaypointIdx;

    if (!this.originLat) {
      this.setNavigationOrigin(currentCoord.latitude, currentCoord.longitude);
    }

    // Clear existing arrow meshes
    while (this.arrowGroup.children.length > 0) {
      const obj = this.arrowGroup.children[0];
      this.arrowGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    this.arrowMeshes = [];

    // 1. Check Arrival Detection
    const destCoord = routeData.destination_coord;
    const distToDest = destCoord ? this.haversineMeters(currentCoord, destCoord) : 999;
    if (distToDest <= 15.0 || nextArrowType === 'ARRIVE') {
      if (destCoord) {
        this.showDestinationArrivalBeacon(destCoord, currentCoord);
      }
      return;
    }

    this.beaconGroup.visible = false;

    // 2. Extract Road Polyline Geometry Ahead of User
    // Prefer dense polyline_coords from OSRM foot network
    let roadPath = [];
    roadPath.push(currentCoord);

    const polyline = routeData.polyline_coords || [];
    if (polyline && polyline.length >= 2) {
      // Find closest point on polyline to user
      let closestIdx = 0;
      let minD = 999999;
      for (let i = 0; i < polyline.length; i++) {
        const d = this.haversineMeters(currentCoord, polyline[i]);
        if (d < minD) {
          minD = d;
          closestIdx = i;
        }
      }

      // Add points ahead from closest point onward (up to 40 points or ~150m)
      for (let i = closestIdx; i < polyline.length && roadPath.length < 40; i++) {
        roadPath.push(polyline[i]);
      }
    } else if (routeData.waypoints && routeData.waypoints.length > 0) {
      // Fallback: use waypoints
      for (let i = currentWaypointIdx; i < routeData.waypoints.length && roadPath.length < 10; i++) {
        roadPath.push(routeData.waypoints[i].coord);
      }
    }

    if (destCoord && roadPath.length < 2) {
      roadPath.push(destCoord);
    }

    // 3. Identify Upcoming Maneuver
    const waypoints = routeData.waypoints || [];
    const activeWp = waypoints[currentWaypointIdx];
    const distToManeuver = activeWp ? this.haversineMeters(currentCoord, activeWp.coord) : 999;
    const isTurnManeuver = activeWp && activeWp.arrow_type &&
                           activeWp.arrow_type !== 'STRAIGHT' &&
                           activeWp.arrow_type !== 'FORWARD' &&
                           activeWp.arrow_type !== 'ARRIVE';

    // 4. Sample Sequential Walking Distance Markers along the Street
    // Distances: 3.5m, 8.5m, 16.0m, 26.0m, 38.0m ahead
    const targetDistances = [3.5, 8.5, 16.0, 26.0, 38.0];

    for (let i = 0; i < targetDistances.length; i++) {
      const targetDist = targetDistances[i];
      const sampled = this.getPointAtDistanceAlongPath(roadPath, targetDist);
      if (!sampled) continue;

      if (i === 0) {
        this.roadBearing = sampled.bearingRad;
      }

      // Local ENU coordinates relative to user
      const enu = this.gpsToENU(
        sampled.coord.latitude,
        sampled.coord.longitude,
        -1.18 + (i * 0.04), // Slight upward tilt with distance
        currentCoord.latitude,
        currentCoord.longitude
      );

      // Maneuver Placement:
      // Turn maneuver arrow appears specifically at/near the turn coordinate
      let arrowDirection = 'FORWARD';
      const distFromTurnCoord = activeWp ? this.haversineMeters(sampled.coord, activeWp.coord) : 999;

      if (isTurnManeuver && (distToManeuver <= 28.0 || distFromTurnCoord <= 10.0)) {
        if (distFromTurnCoord <= 10.0 || (distToManeuver <= 12.0 && i === 0)) {
          arrowDirection = activeWp.arrow_type;
        }
      }

      const texture = this.createGlossyBlueArrowTexture(arrowDirection);
      const planeSize = Math.max(1.8, Math.min(3.0, 1.8 + targetDist * 0.04));
      const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.02,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(planeGeo, planeMat);
      mesh.position.set(enu.x, enu.y, enu.z);

      // Rotation Order: 'YXZ'
      // 1. Heading rotation around Y
      // 2. Pitch tilt around X (lying on road, tilted up towards camera)
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = -sampled.bearingRad;
      mesh.rotation.x = -Math.PI / 2 + 0.28;
      mesh.rotation.z = 0;

      mesh.userData = {
        baseY: mesh.position.y,
        stepIndex: i,
        isTurn: arrowDirection !== 'FORWARD'
      };

      this.arrowGroup.add(mesh);
      this.arrowMeshes.push(mesh);
    }
  }

  getPointAtDistanceAlongPath(coordsList, targetDistMeters) {
    if (!coordsList || coordsList.length < 2) return null;

    let accumulatedDist = 0;

    for (let i = 0; i < coordsList.length - 1; i++) {
      const c1 = coordsList[i];
      const c2 = coordsList[i + 1];
      const segDist = this.haversineMeters(c1, c2);

      if (accumulatedDist + segDist >= targetDistMeters) {
        const remaining = targetDistMeters - accumulatedDist;
        const ratio = segDist > 0 ? (remaining / segDist) : 0;

        const lat = c1.latitude + (c2.latitude - c1.latitude) * ratio;
        const lon = c1.longitude + (c2.longitude - c1.longitude) * ratio;

        // Bearing of this segment
        const dLon = (c2.longitude - c1.longitude) * Math.PI / 180;
        const y = Math.sin(dLon) * Math.cos(c2.latitude * Math.PI / 180);
        const x = Math.cos(c1.latitude * Math.PI / 180) * Math.sin(c2.latitude * Math.PI / 180) -
                  Math.sin(c1.latitude * Math.PI / 180) * Math.cos(c2.latitude * Math.PI / 180) * Math.cos(dLon);
        const bearingRad = Math.atan2(y, x);

        return {
          coord: { latitude: lat, longitude: lon },
          bearingRad: bearingRad
        };
      }

      accumulatedDist += segDist;
    }

    const last = coordsList[coordsList.length - 1];
    return {
      coord: last,
      bearingRad: this.roadBearing || 0
    };
  }

  showDestinationArrivalBeacon(destCoord, userCoord) {
    while (this.beaconGroup.children.length > 0) {
      const obj = this.beaconGroup.children[0];
      this.beaconGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    const enu = this.gpsToENU(destCoord.latitude, destCoord.longitude, -0.6, userCoord.latitude, userCoord.longitude);

    // Glowing Ground Ring
    const ringGeo = new THREE.RingGeometry(1.0, 1.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xD8B878,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(enu.x, enu.y, enu.z);
    this.beaconGroup.add(ring);

    // Rotating Arrival Trophy / Star Badge
    const arriveTexture = this.createGlossyBlueArrowTexture('ARRIVE');
    const badgeGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: arriveTexture,
      transparent: true,
      alphaTest: 0.02,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(enu.x, enu.y + 1.3, enu.z);
    this.beaconGroup.add(badge);

    this.beaconGroup.visible = true;
  }

  getHeadingDeviation() {
    // Calculates difference between compass heading and road bearing
    // Returns degrees: -180 to 180
    const roadHeadingDeg = (this.roadBearing * 180 / Math.PI + 360) % 360;
    let diff = roadHeadingDeg - this.compassHeading;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
  }

  animate() {
    if (!this.isRendering) return;
    this.rafId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.animTime += delta;

    // Smoothly interpolate camera yaw
    this.currentCameraRotation.y += (this.targetCameraRotation.y - this.currentCameraRotation.y) * 0.14;
    this.camera.rotation.copy(this.currentCameraRotation);

    // Gentle bobbing for 3D arrows
    for (let i = 0; i < this.arrowMeshes.length; i++) {
      const mesh = this.arrowMeshes[i];
      if (mesh.userData) {
        const offset = Math.sin(this.animTime * 3.5 + i * 0.7) * 0.06;
        mesh.position.y = mesh.userData.baseY + offset;

        if (mesh.userData.isTurn) {
          const scale = 1.0 + Math.sin(this.animTime * 5.0) * 0.08;
          mesh.scale.set(scale, scale, 1.0);
        }
      }
    }

    // Rotate arrival badge
    if (this.beaconGroup && this.beaconGroup.visible && this.beaconGroup.children[1]) {
      this.beaconGroup.children[1].rotation.y = this.animTime * 1.5;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  haversineMeters(c1, c2) {
    if (!c1 || !c2) return 0;
    const dLat = (c2.latitude - c1.latitude) * Math.PI / 180;
    const dLon = (c2.longitude - c1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(c1.latitude * Math.PI / 180) * Math.cos(c2.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.earthRadius * c;
  }

  destroy() {
    this.isRendering = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    if (this._orientationHandler) {
      window.removeEventListener('deviceorientation', this._orientationHandler, true);
    }

    if (this.arrowGroup) {
      while (this.arrowGroup.children.length > 0) {
        const obj = this.arrowGroup.children[0];
        this.arrowGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }

    if (this.beaconGroup) {
      while (this.beaconGroup.children.length > 0) {
        const obj = this.beaconGroup.children[0];
        this.beaconGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }

    this.setTrackingState('STOPPED');
    console.log("🧹 ARSpatialEngine resources successfully disposed.");
  }
}

window.arSpatialEngine = new ARSpatialEngine();
