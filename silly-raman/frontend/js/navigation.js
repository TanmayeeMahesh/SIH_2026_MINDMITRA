/**
 * MindMitra: Voice-First Real AR Walking Navigation Controller
 * Implements the complete, robust navigation sequence:
 * HOME -> USER / CARETAKER -> CHOOSE DESTINATION -> GET REAL GPS -> CALCULATE REAL ROUTE
 * -> SHOW VISIBLE NAVIGATION MAP -> START USER GEOFENCE MONITOR -> AUTO TRANSITION TO AR
 * -> LIVE CAMERA + AR ARROWS -> CONTINUOUS GPS + AR POSE -> TURN GUIDANCE
 * -> OFF-ROUTE DETECTION & AUTO-REROUTE -> ARRIVAL DETECTION -> RETURN TO DESTINATIONS
 */

// =========================================================================
// 1. USER-SIDE ROUTE & GEOFENCE MONITOR
// =========================================================================

class UserRouteGeofenceMonitor {
  constructor(corridorRadiusM = 30.0) {
    this.corridorRadiusM = corridorRadiusM;
    this.activeRoute = null;
    this.currentSegmentIdx = 0;
    this.offRouteCounter = 0;
    this.isOffRoute = false;
    this.isArrived = false;
  }

  setRoute(routeData) {
    this.activeRoute = routeData;
    this.currentSegmentIdx = 0;
    this.offRouteCounter = 0;
    this.isOffRoute = false;
    this.isArrived = false;
    console.log("🛡️ User-Side Route Geofence Monitor activated for route:", routeData.id || routeData.destination_name);
  }

  /**
   * Evaluates user's position against active route corridor and maneuvers
   */
  evaluate(userCoord, gpsAccuracy = 10.0) {
    if (!this.activeRoute || !userCoord) {
      return { status: 'NO_ROUTE' };
    }

    const waypoints = this.activeRoute.waypoints || [];
    const destinationCoord = this.activeRoute.destination_coord;

    // 1. Check Arrival Detection (Radius <= 15m or <= safe_radius)
    const distToDest = this.haversineMeters(userCoord, destinationCoord);
    if (distToDest <= 15.0) {
      this.isArrived = true;
      return {
        status: 'ARRIVED',
        distanceToDestinationM: distToDest,
        isWithinCorridor: true
      };
    }

    // 2. Identify Current Active Segment and Upcoming Maneuver
    let nextWp = waypoints[this.currentSegmentIdx];
    let distToNextWp = nextWp ? this.haversineMeters(userCoord, nextWp.coord) : distToDest;

    // Advance segment when user is close to waypoint (<= 12m)
    if (nextWp && distToNextWp <= 12.0) {
      this.currentSegmentIdx++;
      nextWp = waypoints[this.currentSegmentIdx];
      distToNextWp = nextWp ? this.haversineMeters(userCoord, nextWp.coord) : distToDest;
    }

    // 3. Compute Perpendicular Cross-Track Distance from Active Road Corridor
    const prevCoord = (this.currentSegmentIdx === 0)
      ? this.activeRoute.origin_coord
      : waypoints[this.currentSegmentIdx - 1].coord;

    const targetWpCoord = nextWp ? nextWp.coord : destinationCoord;
    const crossTrackDist = this.computeCrossTrackDistance(userCoord, prevCoord, targetWpCoord);

    // Dynamic deviation threshold: 35m base + GPS horizontal accuracy
    const maxAllowedDeviation = Math.max(35.0, gpsAccuracy + 18.0);
    const isWithinCorridor = crossTrackDist <= maxAllowedDeviation;

    if (!isWithinCorridor) {
      this.offRouteCounter++;
      if (this.offRouteCounter >= 2) {
        this.isOffRoute = true;
      }
    } else {
      this.offRouteCounter = 0;
      this.isOffRoute = false;
    }

    // Calculate approximate route completion percentage
    const totalDist = this.activeRoute.total_distance_m || 100;
    const progressPercent = Math.min(100, Math.max(0, Math.round(((totalDist - distToDest) / totalDist) * 100)));

    return {
      status: this.isOffRoute ? 'OFF_ROUTE' : 'ON_ROUTE',
      isWithinCorridor: isWithinCorridor,
      crossTrackDistanceM: Math.round(crossTrackDist),
      currentSegmentIdx: this.currentSegmentIdx,
      upcomingManeuver: nextWp,
      distanceToNextManeuverM: Math.round(distToNextWp),
      distanceToDestinationM: Math.round(distToDest),
      progressPercent: progressPercent
    };
  }

  computeCrossTrackDistance(point, lineStart, lineEnd) {
    if (!point || !lineStart || !lineEnd) return 0;
    const pX = point.longitude;
    const pY = point.latitude;
    const aX = lineStart.longitude;
    const aY = lineStart.latitude;
    const bX = lineEnd.longitude;
    const bY = lineEnd.latitude;

    const dX = bX - aX;
    const dY = bY - aY;
    const lenSq = dX * dX + dY * dY;

    if (lenSq === 0) {
      return this.haversineMeters(point, lineStart);
    }

    // Projection scalar t along segment
    let t = ((pX - aX) * dX + (pY - aY) * dY) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projCoord = {
      latitude: aY + t * dY,
      longitude: aX + t * dX
    };

    return this.haversineMeters(point, projCoord);
  }

  haversineMeters(c1, c2) {
    if (!c1 || !c2) return 0;
    const R = 6378137.0;
    const dLat = (c2.latitude - c1.latitude) * Math.PI / 180;
    const dLon = (c2.longitude - c1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(c1.latitude * Math.PI / 180) * Math.cos(c2.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// =========================================================================
// 2. MAIN PATIENT NAVIGATION CONTROLLER
// =========================================================================

class PatientNavigation {
  constructor() {
    this.patientId = 'patient_001';
    this.state = 'IDLE'; // Navigation State Machine
    this.sessionId = null;
    this.destinations = [];
    this.selectedDestination = null;

    // Real GPS Position (Strictly no hardcoded fallback)
    this.currentCoord = null;
    this.lastRawCoord = null;
    this.currentAccuracy = null;
    this.currentSpeed = 0.0;
    this.heading = 0.0;
    this.battery = 92;
    this.gpsWatchId = null;
    this.isGpsLocked = false;
    this.lastGpsTimestamp = 0;

    // Active Route & Progression
    this.currentRoute = null;
    this.currentWaypointIdx = 0;
    this.remainingDistanceM = 0;
    this.hasCelebratedArrival = false;
    this.lastSpokenInstruction = null;
    this.hasAnnouncedTurnWarning = false;

    // User-Side Geofence Monitor
    this.geofenceMonitor = new UserRouteGeofenceMonitor(30.0);

    // Active Screen: 'DESTINATIONS', 'MAP', 'AR'
    this.activeScreen = 'DESTINATIONS';

    // Map instances (Leaflet)
    this.elderMap = null;
    this.patientMarker = null;
    this.destinationMarker = null;
    this.routePolyline = null;
    this.routePolylineGlow = null;
    this.maneuverMarkers = [];

    // Cached DOM Elements
    this.destScreenEl = null;
    this.mapScreenEl = null;
    this.arScreenEl = null;
    this.destListEl = null;
    this.statusToastEl = null;
    this.statusToastText = null;
    this.arTurnIconEl = null;
    this.arTurnTextEl = null;
    this.arTotalDistBadge = null;
    this.arTrackingNoticeEl = null;
    this.mapDestNameEl = null;
    this.mapRouteMetricsEl = null;
    this.mapCorridorTextEl = null;
  }

  init() {
    // 1. Cache DOM Elements
    this.destScreenEl = document.getElementById('destinationSelectionScreen');
    this.mapScreenEl = document.getElementById('navigationMapScreen');
    this.arScreenEl = document.getElementById('arNavigationScreen');
    this.destListEl = document.getElementById('elderDestList');
    this.statusToastEl = document.getElementById('statusToast');
    this.statusToastText = document.getElementById('statusToastText');
    this.arTurnIconEl = document.getElementById('arManeuverIcon');
    this.arTurnTextEl = document.getElementById('arTurnInstructionText');
    this.arTotalDistBadge = document.getElementById('arTotalDistBadge');
    this.arTrackingNoticeEl = document.getElementById('arTrackingNotice');
    this.mapDestNameEl = document.getElementById('mapDestName');
    this.mapRouteMetricsEl = document.getElementById('mapRouteMetrics');
    this.mapCorridorTextEl = document.getElementById('mapCorridorText');
    this.arDirectionHintEl = document.getElementById('arDirectionHint');

    // 2. Initialize Leaflet HD Satellite Map
    this.initElderSatelliteMap();

    // 3. Load Safe Destinations from Database
    this.loadDestinations();

    // 4. Start Background High-Accuracy GPS Pre-acquisition
    this.startContinuousRealGPS();

    // 5. Connect Camera Stream Component
    if (window.cameraManager) {
      window.cameraManager.init('liveCameraFeed');
    }

    // 6. Connect Voice Engine for Voice-First Interaction
    if (window.voiceEngine) {
      window.voiceEngine.onVoiceCommand = (cmd) => this.handleVoiceCommand(cmd);
    }

    this.showDestinationSelectionScreen();
    this.setState('IDLE');
    console.log("🚀 PatientNavigation Controller Active & Listening.");
  }

  // =========================================================================
  // SCREEN SWITCHING (Clean, Predictable Navigation Stages)
  // =========================================================================

  showDestinationSelectionScreen() {
    this.activeScreen = 'DESTINATIONS';
    if (this.destScreenEl) this.destScreenEl.style.display = 'flex';
    if (this.mapScreenEl) this.mapScreenEl.style.display = 'none';
    if (this.arScreenEl) this.arScreenEl.style.display = 'none';
  }

  showNavigationMapScreen() {
    this.activeScreen = 'MAP';
    if (this.destScreenEl) this.destScreenEl.style.display = 'none';
    if (this.mapScreenEl) this.mapScreenEl.style.display = 'flex';
    if (this.arScreenEl) this.arScreenEl.style.display = 'none';

    setTimeout(() => {
      if (this.elderMap) {
        this.elderMap.invalidateSize();
        if (this.routePolyline) {
          try { this.elderMap.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] }); } catch(e){}
        }
      }
    }, 120);
  }

  showARNavigationScreen() {
    this.activeScreen = 'AR';
    if (this.destScreenEl) this.destScreenEl.style.display = 'none';
    if (this.mapScreenEl) this.mapScreenEl.style.display = 'none';
    if (this.arScreenEl) this.arScreenEl.style.display = 'flex';

    // Ensure camera is actively streaming on mobile
    if (window.cameraManager) {
      window.cameraManager.ensurePlaying();
    }
    if (window.arSpatialEngine) {
      setTimeout(() => {
        window.arSpatialEngine.handleResize();
        if (this.currentRoute && this.currentCoord) {
          window.arSpatialEngine.updatePath(
            this.currentRoute,
            this.currentCoord,
            this.currentWaypointIdx,
            'FORWARD'
          );
        }
      }, 80);
    }
  }

  // =========================================================================
  // STATE MACHINE COORDINATION
  // =========================================================================

  setState(newState) {
    console.log(`🧭 Navigation State: ${this.state} ➔ ${newState}`);
    this.state = newState;

    if (newState === 'IDLE') {
      this.hideStatusToast();
      this.hideTrackingNotice();
    } else if (newState === 'DESTINATION_SELECTED') {
      this.showStatusToast(`Selected: ${this.selectedDestination.name}`);
    } else if (newState === 'LOCATING') {
      this.showStatusToast("Finding your live location...");
    } else if (newState === 'CALCULATING_ROUTE') {
      this.showStatusToast("Calculating safe pedestrian route...");
    } else if (newState === 'SHOWING_MAP') {
      this.showStatusToast("Route locked • Starting safe corridor...");
    } else if (newState === 'INITIALIZING_AR' || newState === 'CALIBRATING_AR') {
      this.showStatusToast("Calibrating 3D AR guidance...");
    } else if (newState === 'NAVIGATING') {
      this.hideStatusToast();
    } else if (newState === 'LIMITED_TRACKING') {
      this.showTrackingNotice("Move your phone slowly to improve tracking.");
    } else if (newState === 'OFF_ROUTE') {
      this.showStatusToast("Off-corridor detected. Preparing safe recovery...");
    } else if (newState === 'REROUTING') {
      this.showStatusToast("Updating route to guide you safely...");
    } else if (newState === 'ARRIVED') {
      this.showStatusToast("✨ Destination reached!");
      if (this.arTurnTextEl) this.arTurnTextEl.innerText = `You have arrived at ${this.selectedDestination.name}!`;
      if (this.arTurnIconEl) this.arTurnIconEl.innerText = "⭐";
    }
  }

  showStatusToast(text) {
    if (this.statusToastText) this.statusToastText.innerText = text;
    if (this.statusToastEl) this.statusToastEl.classList.remove('hidden');
  }

  hideStatusToast() {
    if (this.statusToastEl) this.statusToastEl.classList.add('hidden');
  }

  showTrackingNotice(text) {
    if (this.arTrackingNoticeEl) {
      this.arTrackingNoticeEl.innerText = text;
      this.arTrackingNoticeEl.classList.remove('hidden');
    }
  }

  hideTrackingNotice() {
    if (this.arTrackingNoticeEl) this.arTrackingNoticeEl.classList.add('hidden');
  }

  // =========================================================================
  // LEAFLET MAP INITIALIZATION & ROUTE RENDERING (Route Authority)
  // =========================================================================

  initElderSatelliteMap() {
    const mapEl = document.getElementById('elderSatelliteMap');
    if (!mapEl || this.elderMap) return;

    const initLat = this.currentCoord ? this.currentCoord.latitude : 13.14537;
    const initLng = this.currentCoord ? this.currentCoord.longitude : 77.61979;

    this.elderMap = L.map('elderSatelliteMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([initLat, initLng], 17);

    // Google HD Hybrid Satellite Layer
    const googleSatelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Satellite'
    });

    // Esri World Imagery Backup
    const esriSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri World Imagery'
    });

    googleSatelliteLayer.addTo(this.elderMap);

    const baseLayers = {
      "🛰️ HD Satellite": googleSatelliteLayer,
      "🌍 Esri Satellite": esriSatelliteLayer
    };
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(this.elderMap);

    // Live Patient Marker
    const patientIcon = L.divIcon({
      className: 'elder-live-marker',
      html: `
        <div class="patient-radar-pulse"></div>
        <div class="patient-core-dot">🚶</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.patientMarker = L.marker([initLat, initLng], { icon: patientIcon }).addTo(this.elderMap);
  }

  renderRouteOnElderMap(routeData, destLoc) {
    if (!this.elderMap) return;

    // Clear previous route polylines and markers
    if (this.routePolylineGlow) this.elderMap.removeLayer(this.routePolylineGlow);
    if (this.routePolyline) this.elderMap.removeLayer(this.routePolyline);
    if (this.destinationMarker) this.elderMap.removeLayer(this.destinationMarker);
    this.maneuverMarkers.forEach(m => this.elderMap.removeLayer(m));
    this.maneuverMarkers = [];

    const destCoord = destLoc.coord || routeData.destination_coord;
    if (destCoord) {
      const destIcon = L.divIcon({
        className: 'elder-dest-marker',
        html: `<div style="background:#332F29; border:3px solid #D8B878; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 0 16px rgba(216, 184, 120, 0.85);">${destLoc.icon || '📍'}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      this.destinationMarker = L.marker([destCoord.latitude, destCoord.longitude], { icon: destIcon })
        .bindPopup(`<b>${destLoc.name}</b>`).addTo(this.elderMap);
    }

    let latlngs = [];
    if (routeData.polyline_coords && routeData.polyline_coords.length > 2) {
      latlngs = routeData.polyline_coords.map(c => [c.latitude, c.longitude]);
    } else if (routeData.waypoints && routeData.waypoints.length > 0) {
      latlngs = routeData.waypoints.map(wp => [wp.coord.latitude, wp.coord.longitude]);
    }

    if (latlngs.length > 1) {
      // Glow underlay (deep brick maroon casing)
      this.routePolylineGlow = L.polyline(latlngs, {
        color: '#6F3D35',
        weight: 10,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.elderMap);

      // Core route polyline (vibrant terracotta)
      this.routePolyline = L.polyline(latlngs, {
        color: '#B77952',
        weight: 6,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.elderMap);

      // Add maneuver markers on the map at turn locations
      if (routeData.waypoints) {
        routeData.waypoints.forEach((wp, idx) => {
          if (idx > 0 && idx < routeData.waypoints.length - 1 && wp.arrow_type && wp.arrow_type !== 'STRAIGHT' && wp.arrow_type !== 'FORWARD') {
            const iconSymbol = wp.arrow_type.includes('RIGHT') ? '►' : (wp.arrow_type.includes('LEFT') ? '◄' : '▲');
            const turnMarker = L.marker([wp.coord.latitude, wp.coord.longitude], {
              icon: L.divIcon({
                className: 'map-maneuver-marker',
                html: `<div>${iconSymbol}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).addTo(this.elderMap);
            this.maneuverMarkers.push(turnMarker);
          }
        });
      }

      try {
        this.elderMap.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50], maxZoom: 18 });
      } catch (e) {}
    }
  }

  // =========================================================================
  // DESTINATIONS LOADING & COMPACT CHIPS
  // =========================================================================

  async loadDestinations() {
    try {
      this.destinations = await MindMitraAPI.getSafeLocations();
      if (!this.destListEl) return;

      this.destListEl.innerHTML = '';
      this.destinations.forEach(loc => {
        const btn = document.createElement('button');
        btn.className = 'dest-chip-btn';
        btn.innerHTML = `
          <div class="dest-chip-icon">${loc.icon || '📍'}</div>
          <div class="dest-chip-info">
            <span class="dest-chip-name">${loc.name}</span>
            <span class="dest-chip-category">${loc.category || 'Safe Place'}</span>
          </div>
        `;
        btn.addEventListener('click', () => this.selectDestination(loc));
        this.destListEl.appendChild(btn);
      });
    } catch (err) {
      console.error("Failed to load destinations:", err);
    }
  }

  // =========================================================================
  // COMPLETE NAVIGATION PIPELINE (Voice or Tap Initiated)
  // =========================================================================

  async selectDestination(loc) {
    if (this.state !== 'IDLE') {
      console.warn("Navigation session already in progress. State:", this.state);
      return;
    }

    this.selectedDestination = loc;
    this.hasCelebratedArrival = false;
    this.lastSpokenInstruction = null;
    this.hasAnnouncedTurnWarning = false;
    this.setState('DESTINATION_SELECTED');

    // 0. SYNCHRONOUS CAMERA START ON DIRECT USER TAP GESTURE
    // Guarantees camera permissions & playback token are acquired within user activation window
    if (window.cameraManager) {
      window.cameraManager.startCamera().catch(e => console.warn("Sync camera start note:", e));
    }

    // 1. GET ACTUAL REAL GPS LOCATION & VERIFY ACCURACY
    this.setState('LOCATING');
    const coord = await this.getFreshAccurateGPS();
    if (!coord) {
      alert("⚠️ Unable to acquire reliable live GPS. Please ensure Location Permissions are enabled on your device.");
      this.setState('IDLE');
      this.showDestinationSelectionScreen();
      return;
    }

    // 2. CALCULATE ACTUAL WALKING ROUTE (OSRM Pedestrian Road Network)
    this.setState('CALCULATING_ROUTE');
    let routeData = null;
    try {
      routeData = await MindMitraAPI.startNavigation(this.patientId, loc.id, coord);
      this.sessionId = routeData.session_id;
      this.currentRoute = routeData;
      this.currentWaypointIdx = routeData.current_waypoint_idx || 0;
      this.remainingDistanceM = routeData.total_distance_m;

      // 3. SHOW THE VISIBLE NAVIGATION MAP FIRST (Map is Route Authority)
      this.setState('SHOWING_MAP');
      this.showNavigationMapScreen();
      this.renderRouteOnElderMap(routeData, loc);

      if (this.mapDestNameEl) this.mapDestNameEl.innerText = `${loc.icon || '📍'} ${loc.name}`;
      if (this.mapRouteMetricsEl) {
        this.mapRouteMetricsEl.innerText = `${Math.round(routeData.total_distance_m)}m safe road route • ~${Math.round(routeData.estimated_minutes)} mins walk`;
      }
      if (this.mapCorridorTextEl) this.mapCorridorTextEl.innerText = "Safe walking corridor active";

    } catch (err) {
      console.error("Failed to calculate pedestrian route:", err);
      alert("Could not compute walkable route to destination. Please check network connection.");
      this.setState('IDLE');
      this.showDestinationSelectionScreen();
      return;
    }

    // Check if user is already within arrival threshold (<= 15m)
    if (routeData.total_distance_m <= 15.0) {
      this.triggerArrival();
      return;
    }

    // 4. START USER-SIDE GEOFENCE / ROUTE MONITOR
    this.setState('STARTING_GEOFENCE');
    this.geofenceMonitor.setRoute(routeData);

    // Voice announcement of route start
    if (window.voiceEngine) {
      window.voiceEngine.playChime('success');
      window.voiceEngine.speak(routeData.voice_prompts || {
        en: `Route found to ${loc.name}. Preparing camera guidance.`
      });
    }

    // 5. INITIALIZATION OF ARCORE / THREE.JS 3D ENGINE
    this.setState('INITIALIZING_AR');
    try {
      if (window.cameraManager) {
        window.cameraManager.ensurePlaying();
      }

      if (window.arSpatialEngine) {
        window.arSpatialEngine.init('arCanvas', (trackingState) => {
          if (trackingState === 'LIMITED_TRACKING') {
            this.setState('LIMITED_TRACKING');
          } else if (trackingState === 'TRACKING' && this.state === 'LIMITED_TRACKING') {
            this.setState('NAVIGATING');
          }
        });
        window.arSpatialEngine.setNavigationOrigin(coord.latitude, coord.longitude);
      }
    } catch (e) {
      console.warn("AR/Camera init notice:", e);
    }

    // 6. BRIEF AUTOMATIC CALIBRATION (3.2s allows user to clearly inspect route on map first!)
    this.setState('CALIBRATING_AR');
    await new Promise(r => setTimeout(r, 3200));

    // 7. AUTOMATICALLY TRANSITION TO LIVE AR CAMERA VIEW (if user hasn't switched already)
    if (this.activeScreen === 'MAP' && this.state !== 'IDLE') {
      this.showARNavigationScreen();
      this.setState('NAVIGATING');
    }

    this.updateNavigationUI({
      current_instruction: routeData.initial_instruction || "Follow the blue arrows forward.",
      arrow_type: routeData.arrow_type || 'FORWARD',
      distance_to_next_m: routeData.total_distance_m,
      distance_total_remaining_m: routeData.total_distance_m
    });

    if (window.voiceEngine) {
      window.voiceEngine.speak({
        en: "Camera ready. Follow the blue arrows forward."
      });
    }
  }

  // =========================================================================
  // REAL GPS ACQUISITION & CONTINUOUS TRACKING
  // =========================================================================

  getFreshAccurateGPS() {
    return new Promise((resolve) => {
      const now = Date.now();
      if (this.currentCoord && this.currentAccuracy !== null && this.currentAccuracy <= 30.0 && (now - this.lastGpsTimestamp) < 12000) {
        return resolve(this.currentCoord);
      }

      if (!("geolocation" in navigator)) {
        return resolve(null);
      }

      let hasResolved = false;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.handleRealGPSPosition(pos);
          if (pos.coords.accuracy <= 30.0) {
            if (!hasResolved) {
              hasResolved = true;
              navigator.geolocation.clearWatch(watchId);
              resolve(this.currentCoord);
            }
          } else {
            this.showStatusToast(`Improving GPS accuracy (currently ±${Math.round(pos.coords.accuracy)}m)...`);
          }
        },
        (err) => console.warn("GPS acquisition notice:", err.message),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      // Max timeout fallback: after 6.5s accept best available coordinate
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          try { navigator.geolocation.clearWatch(watchId); } catch(e){}
          resolve(this.currentCoord || null);
        }
      }, 6500);
    });
  }

  startContinuousRealGPS() {
    if (!("geolocation" in navigator)) return;

    this.gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => this.handleRealGPSPosition(pos),
      (err) => console.warn("Background GPS notice:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  }

  handleRealGPSPosition(pos) {
    const rawLat = pos.coords.latitude;
    const rawLng = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy || 10);
    const speed = pos.coords.speed !== null && !isNaN(pos.coords.speed) ? pos.coords.speed : 1.0;
    const heading = pos.coords.heading !== null && !isNaN(pos.coords.heading) ? pos.coords.heading : this.heading;

    this.currentAccuracy = accuracy;
    this.currentSpeed = speed;
    this.lastGpsTimestamp = Date.now();

    // Exponential Moving Average (EMA) smoothing
    if (!this.currentCoord) {
      this.currentCoord = { latitude: rawLat, longitude: rawLng };
    } else {
      this.currentCoord = {
        latitude: this.currentCoord.latitude * 0.65 + rawLat * 0.35,
        longitude: this.currentCoord.longitude * 0.65 + rawLng * 0.35
      };
    }

    this.lastRawCoord = { latitude: rawLat, longitude: rawLng };
    this.heading = heading;
    this.isGpsLocked = true;

    // Update patient marker on Leaflet Satellite Map
    if (this.patientMarker) {
      this.patientMarker.setLatLng([this.currentCoord.latitude, this.currentCoord.longitude]);
    }

    // If actively navigating, evaluate user-side geofence progress
    if (this.state === 'NAVIGATING' && this.sessionId) {
      this.evaluateRouteProgress();
    }
  }

  // =========================================================================
  // CONTINUOUS PROGRESS EVALUATION & TURN ANNOUNCEMENTS
  // =========================================================================

  async evaluateRouteProgress() {
    if (!this.currentRoute || !this.currentCoord) return;

    // Run User-Side Route Geofence Monitor
    const evalResult = this.geofenceMonitor.evaluate(this.currentCoord, this.currentAccuracy || 10);

    if (evalResult.status === 'ARRIVED') {
      this.triggerArrival();
      return;
    }

    if (evalResult.status === 'OFF_ROUTE') {
      this.triggerReroute();
      return;
    }

    // Sync segment progression
    this.currentWaypointIdx = evalResult.currentSegmentIdx;
    this.remainingDistanceM = evalResult.distanceToDestinationM;

    const upcoming = evalResult.upcomingManeuver;
    const distToTurn = evalResult.distanceToNextManeuverM;

    // Turn Approaching Voice Cues (Only speak at meaningful milestones: 25m and 10m)
    if (upcoming && upcoming.arrow_type && upcoming.arrow_type !== 'STRAIGHT' && upcoming.arrow_type !== 'FORWARD') {
      if (distToTurn <= 25 && distToTurn > 12 && !this.hasAnnouncedTurnWarning) {
        this.hasAnnouncedTurnWarning = true;
        if (window.voiceEngine) {
          const turnName = upcoming.arrow_type.toLowerCase().replace('_', ' ');
          window.voiceEngine.speak({
            en: `In 25 meters, turn ${turnName}.`
          });
        }
      } else if (distToTurn <= 10 && this.hasAnnouncedTurnWarning) {
        this.hasAnnouncedTurnWarning = false;
        if (window.voiceEngine) {
          const turnName = upcoming.arrow_type.toLowerCase().replace('_', ' ');
          window.voiceEngine.speak({
            en: `Turn ${turnName} now.`
          });
        }
      }
    } else {
      this.hasAnnouncedTurnWarning = false;
    }

    // Update heading deviation hint
    if (window.arSpatialEngine && this.arDirectionHintEl) {
      const dev = window.arSpatialEngine.getHeadingDeviation();
      if (Math.abs(dev) > 50) {
        this.arDirectionHintEl.innerText = dev > 0 ? "Turn right ➔ toward route" : "Turn left ⬅ toward route";
        this.arDirectionHintEl.classList.remove('hidden');
      } else {
        this.arDirectionHintEl.classList.add('hidden');
      }
    }

    // Update UI & 3D AR Arrows
    this.updateNavigationUI({
      current_instruction: upcoming ? upcoming.instruction : "Continue along the road.",
      arrow_type: upcoming ? upcoming.arrow_type : 'FORWARD',
      distance_to_next_m: distToTurn,
      distance_total_remaining_m: evalResult.distanceToDestinationM
    });

    // Sync telemetry to backend
    try {
      await MindMitraAPI.sendTelemetry(
        this.sessionId,
        this.patientId,
        this.currentCoord,
        this.heading,
        this.currentSpeed,
        this.battery
      );
    } catch (e) {}
  }

  // =========================================================================
  // AUTOMATIC REROUTING FROM NEW USER LOCATION
  // =========================================================================

  async triggerReroute() {
    this.setState('OFF_ROUTE');
    await new Promise(r => setTimeout(r, 400));
    this.setState('REROUTING');

    if (window.voiceEngine) {
      window.voiceEngine.speak({
        en: "Updating your route to guide you safely. Please follow the blue arrows."
      });
    }

    try {
      const freshRoute = await MindMitraAPI.startNavigation(
        this.patientId,
        this.selectedDestination.id,
        this.currentCoord
      );

      this.currentRoute = freshRoute;
      this.currentWaypointIdx = 0;
      this.remainingDistanceM = freshRoute.total_distance_m;

      // Update User Geofence Monitor
      this.geofenceMonitor.setRoute(freshRoute);

      // Re-anchor AR Navigation Origin to User's NEW Location
      if (window.arSpatialEngine) {
        window.arSpatialEngine.setNavigationOrigin(this.currentCoord.latitude, this.currentCoord.longitude);
      }

      // Re-render route on Navigation Map
      this.renderRouteOnElderMap(freshRoute, this.selectedDestination);

      this.setState('NAVIGATING');
      this.updateNavigationUI({
        current_instruction: freshRoute.initial_instruction || "Follow the blue arrows forward.",
        arrow_type: freshRoute.arrow_type || 'FORWARD',
        distance_to_next_m: freshRoute.total_distance_m,
        distance_total_remaining_m: freshRoute.total_distance_m
      });
    } catch (err) {
      console.warn("Reroute attempt failed, continuing current route:", err);
      this.setState('NAVIGATING');
    }
  }

  // =========================================================================
  // DESTINATION ARRIVAL & CLEAN TEARDOWN
  // =========================================================================

  triggerArrival() {
    if (this.state === 'ARRIVED') return;
    this.setState('ARRIVED');

    if (window.voiceEngine && !this.hasCelebratedArrival) {
      this.hasCelebratedArrival = true;
      window.voiceEngine.playChime('success');
      window.voiceEngine.speak({
        en: `Destination reached! You have arrived safely at ${this.selectedDestination.name}. Wonderful walk!`
      });
    }

    // Automatically return to destination selection screen after 3.6 seconds
    setTimeout(() => {
      this.cleanupNavigationSession();
      this.showDestinationSelectionScreen();
      this.setState('IDLE');
    }, 3600);
  }

  cancelNavigation() {
    if (window.voiceEngine) {
      window.voiceEngine.speak({ en: "Navigation cancelled." });
    }
    this.cleanupNavigationSession();
    this.showDestinationSelectionScreen();
    this.setState('IDLE');
  }

  cleanupNavigationSession() {
    if (window.arSpatialEngine) {
      window.arSpatialEngine.destroy();
    }
    if (window.cameraManager) {
      window.cameraManager.stopCamera();
    }
    if (this.arDirectionHintEl) {
      this.arDirectionHintEl.classList.add('hidden');
    }

    // Clear polylines from map
    if (this.routePolyline && this.elderMap) {
      this.elderMap.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    if (this.routePolylineGlow && this.elderMap) {
      this.elderMap.removeLayer(this.routePolylineGlow);
      this.routePolylineGlow = null;
    }
    if (this.destinationMarker && this.elderMap) {
      this.elderMap.removeLayer(this.destinationMarker);
      this.destinationMarker = null;
    }
    this.maneuverMarkers.forEach(m => {
      if (this.elderMap) this.elderMap.removeLayer(m);
    });
    this.maneuverMarkers = [];

    this.sessionId = null;
    this.currentRoute = null;
    this.currentWaypointIdx = 0;
    this.selectedDestination = null;
    console.log("🧹 Navigation session safely cleaned up and returned to destination selection.");
  }

  // =========================================================================
  // AR HUD & 3D AR ARROW SYNCHRONIZATION
  // =========================================================================

  updateNavigationUI(data) {
    if (!data) return;

    const dist = Math.round(data.distance_total_remaining_m || data.distance_to_next_m || 0);
    this.remainingDistanceM = dist;

    // Update Turn Instruction Text
    if (this.arTurnTextEl) {
      this.arTurnTextEl.innerText = data.current_instruction || "Follow the blue arrows forward.";
    }

    // Update Distance Remaining Badge
    if (this.arTotalDistBadge) {
      this.arTotalDistBadge.innerText = `${dist}m remaining`;
    }

    // Update Maneuver Arrow Preview Icon
    const iconMap = {
      'FORWARD': '▲',
      'SLIGHT_RIGHT': '↗',
      'RIGHT': '►',
      'SHARP_RIGHT': '⤵',
      'SLIGHT_LEFT': '↖',
      'LEFT': '◄',
      'SHARP_LEFT': '⤴',
      'U_TURN': '🔄',
      'ARRIVE': '⭐'
    };
    if (this.arTurnIconEl) {
      this.arTurnIconEl.innerText = iconMap[data.arrow_type] || '▲';
    }

    // UPDATE REAL 3D AR SPATIAL ARROWS (Three.js WebGL in ENU World Space)
    if (window.arSpatialEngine && this.currentRoute) {
      window.arSpatialEngine.updatePath(
        this.currentRoute,
        this.currentCoord,
        this.currentWaypointIdx,
        data.arrow_type || 'FORWARD'
      );
    }
  }

  // =========================================================================
  // VOICE-FIRST COMMAND HANDLER
  // =========================================================================

  handleVoiceCommand(cmd) {
    if (!cmd) return;

    if (cmd.action === 'NAVIGATE_DESTINATION') {
      const match = this.destinations.find(d => {
        const name = d.name.toLowerCase();
        const cat = (d.category || '').toLowerCase();
        return name.includes(cmd.targetName) || cat.includes(cmd.targetName);
      });

      if (match) {
        if (window.voiceEngine) {
          window.voiceEngine.speak({
            en: `Navigating to ${match.name}.`
          });
        }
        this.selectDestination(match);
      } else {
        if (window.voiceEngine) {
          window.voiceEngine.speak({
            en: `Destination not found. Please choose from the safe places on screen.`
          });
        }
      }
    } else if (cmd.action === 'CANCEL_NAVIGATION') {
      this.cancelNavigation();
    } else if (cmd.action === 'QUERY_LOCATION') {
      if (this.selectedDestination) {
        if (window.voiceEngine) {
          window.voiceEngine.speak({
            en: `Walking to ${this.selectedDestination.name}. ${this.remainingDistanceM} meters remaining.`
          });
        }
      } else {
        if (window.voiceEngine) {
          window.voiceEngine.speak({
            en: "You are at the home screen. Please choose a safe destination to walk."
          });
        }
      }
    } else if (cmd.action === 'REPEAT') {
      if (window.voiceEngine) {
        window.voiceEngine.repeatLast();
      }
    }
  }
}

window.patientNavigation = new PatientNavigation();
