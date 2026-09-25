class CaregiverPortal {
  constructor() {
    this.map = null;
    this.patientMarker = null;
    this.safeLocationMarkers = [];
    this.geofenceCircles = [];
    this.routePolyline = null;
    this.corridorPolygon = null;
    this.safeLocations = [];
    this.patientCoord = { latitude: 13.14537, longitude: 77.61979 };
  }

  init() {
    this.initMap();
    this.loadSafeLocations();
    this.loadAlertHistory();
    this.initWebSocket();
    this.setupEventListeners();
  }

  initMap() {
    const mapElement = document.getElementById('caregiverMap');
    if (!mapElement || this.map) return;

    this.map = L.map('caregiverMap').setView([13.1550, 77.6200], 14);

    // 1. Google HD Hybrid Satellite Layer (Real Satellite Photos with Road & Place Labels)
    const googleSatelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Satellite Imagery | MindMitra SafeNav'
    });

    // 2. Esri World Imagery (High-Resolution Satellite Backup)
    const esriSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri World Imagery'
    });

    // 3. OpenStreetMap Vector Street Map
    const osmStreetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    // Default to Google HD Satellite view
    googleSatelliteLayer.addTo(this.map);

    // Add Layer Switcher Control
    const baseLayers = {
      "🛰️ HD Satellite View": googleSatelliteLayer,
      "🌍 Esri Satellite": esriSatelliteLayer,
      "🗺️ Street Map": osmStreetLayer
    };
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(this.map);

    // Click map to set coordinates in "Add Safe Place" form
    this.map.on('click', (e) => {
      const latInput = document.getElementById('newPlaceLat');
      const lngInput = document.getElementById('newPlaceLng');
      if (latInput && lngInput) {
        latInput.value = e.latlng.lat.toFixed(5);
        lngInput.value = e.latlng.lng.toFixed(5);
      }
    });

    // Create custom Patient Marker
    const patientIcon = L.divIcon({
      className: 'custom-patient-marker',
      html: '<div style="background:#10b981; border:3px solid #fff; border-radius:50%; width:24px; height:24px; box-shadow:0 0 14px #10b981; display:flex; align-items:center; justify-content:center; font-size:12px;">🚶</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.patientMarker = L.marker([this.patientCoord.latitude, this.patientCoord.longitude], {
      icon: patientIcon
    }).addTo(this.map);
  }

  async loadSafeLocations() {
    try {
      this.safeLocations = await MindMitraAPI.getSafeLocations();
      this.renderSafeLocationsOnMap();
      this.renderSafeLocationsList();
    } catch (e) {
      console.error('Error loading safe locations:', e);
    }
  }

  renderSafeLocationsOnMap() {
    if (!this.map) return;

    // Clear existing
    this.safeLocationMarkers.forEach(m => this.map.removeLayer(m));
    this.geofenceCircles.forEach(c => this.map.removeLayer(c));
    this.safeLocationMarkers = [];
    this.geofenceCircles = [];

    this.safeLocations.forEach(loc => {
      const iconHtml = `<div style="background:#1e293b; border:2px solid #f59e0b; border-radius:12px; padding:4px 8px; font-size:18px; box-shadow:0 4px 10px rgba(0,0,0,0.5); text-align:center;">${loc.icon}</div>`;
      const customIcon = L.divIcon({
        className: 'place-marker',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([loc.coord.latitude, loc.coord.longitude], { icon: customIcon })
        .bindPopup(`<b>${loc.name}</b><br>Safe Radius: ${loc.safe_radius_m}m<br><i>${loc.landmark_cue || ''}</i>`)
        .addTo(this.map);
      this.safeLocationMarkers.push(marker);

      // Draw safe geofence circle
      const circle = L.circle([loc.coord.latitude, loc.coord.longitude], {
        radius: loc.safe_radius_m || 30,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(this.map);
      this.geofenceCircles.push(circle);
    });
  }

  renderSafeLocationsList() {
    const listContainer = document.getElementById('caregiverPlacesList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    this.safeLocations.forEach(loc => {
      const item = document.createElement('div');
      item.className = 'place-item';
      item.innerHTML = `
        <div class="place-info">
          <span class="place-icon">${loc.icon}</span>
          <div>
            <div class="place-name">${loc.name}</div>
            <div class="place-meta">${loc.category.toUpperCase()} • Radius ${loc.safe_radius_m}m</div>
          </div>
        </div>
        <div class="place-actions">
          <button class="icon-btn delete-btn" data-id="${loc.id}" title="Remove place">🗑️</button>
        </div>
      `;
      listContainer.appendChild(item);
    });

    // Attach delete listeners
    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Remove this safe location?')) {
          await MindMitraAPI.deleteSafeLocation(id);
          this.loadSafeLocations();
          if (window.patientNavigation) window.patientNavigation.loadDestinations();
        }
      });
    });
  }

  async loadAlertHistory() {
    try {
      const alerts = await MindMitraAPI.getAlerts();
      const feed = document.getElementById('caregiverAlertFeed');
      if (!feed) return;

      feed.innerHTML = '';
      if (alerts.length === 0) {
        feed.innerHTML = '<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:12px;">No active alerts. Patient journey is peaceful.</div>';
        return;
      }

      alerts.forEach(a => {
        const div = document.createElement('div');
        div.className = `alert-item ${a.level === 2 ? 'crit' : 'warn'}`;
        const timeStr = new Date(a.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        div.innerHTML = `
          <div style="display:flex; justify-content:space-between;">
            <strong>${a.level === 2 ? '🚨 CRITICAL ESCALATION' : '⚠️ GENTLE REORIENT'}</strong>
            <span class="alert-time">${timeStr}</span>
          </div>
          <div>${a.message}</div>
          <div style="font-size:11px; opacity:0.8;">Target: ${a.target_destination}</div>
        `;
        feed.appendChild(div);
      });
    } catch (e) {
      console.error('Error loading alerts:', e);
    }
  }

  initWebSocket() {
    MindMitraAPI.connectCaregiverWebSocket((msg) => {
      if (msg.type === 'TELEMETRY_UPDATE') {
        this.updatePatientTelemetry(msg.telemetry, msg.alert);
      } else if (msg.type === 'SESSION_STARTED') {
        this.drawActiveRoute(msg.waypoints);
        this.loadAlertHistory();
      } else if (msg.type === 'SOS_EMERGENCY') {
        this.handleCriticalSOS(msg.alert);
      }
    });
  }

  updatePatientTelemetry(telem, alert) {
    if (!telem) return;
    this.patientCoord = telem.coord;

    // Update map marker
    if (this.patientMarker && this.map) {
      this.patientMarker.setLatLng([telem.coord.latitude, telem.coord.longitude]);
      
      const markerEl = this.patientMarker.getElement();
      if (markerEl) {
        if (telem.status === 'CRITICAL_DEVIATION' || (alert && alert.level === 2)) {
          markerEl.querySelector('div').style.background = '#ef4444';
          markerEl.querySelector('div').style.boxShadow = '0 0 20px #ef4444';
        } else if (telem.status === 'GENTLE_REORIENT') {
          markerEl.querySelector('div').style.background = '#f59e0b';
          markerEl.querySelector('div').style.boxShadow = '0 0 16px #f59e0b';
        } else {
          markerEl.querySelector('div').style.background = '#10b981';
          markerEl.querySelector('div').style.boxShadow = '0 0 14px #10b981';
        }
      }
    }

    // Update UI Telemetry Boxes
    const statusVal = document.getElementById('telemStatus');
    const destVal = document.getElementById('telemDest');
    const distVal = document.getElementById('telemDist');
    const speedVal = document.getElementById('telemSpeed');
    const batteryVal = document.getElementById('telemBattery');

    if (statusVal) statusVal.innerText = telem.status.replace('_', ' ');
    if (destVal) destVal.innerText = telem.destination_name || 'None';
    if (distVal) distVal.innerText = `${Math.round(telem.distance_remaining_m || 0)} m`;
    if (speedVal) speedVal.innerText = `${(telem.speed_mps || 1.1).toFixed(1)} m/s`;
    if (batteryVal) batteryVal.innerText = `${telem.battery_pct || 90}%`;

    // Trigger audio & log if alert
    if (alert) {
      if (alert.level === 2) {
        window.voiceEngine.playChime('alert');
      }
      this.loadAlertHistory();
    }
  }

  async drawActiveRoute(waypoints) {
    if (!this.map || !waypoints || waypoints.length === 0) return;

    if (this.routePolylineGlow) {
      this.map.removeLayer(this.routePolylineGlow);
      this.routePolylineGlow = null;
    }
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }

    let latlngs = [];
    try {
      const first = waypoints[0].coord;
      const last = waypoints[waypoints.length - 1].coord;
      const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${first.longitude},${first.latitude};${last.longitude},${last.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      const osrmData = await res.json();
      if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
        latlngs = osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      }
    } catch (e) {
      console.warn('Caregiver map OSRM notice:', e);
    }

    if (latlngs.length === 0) {
      latlngs = waypoints.map(wp => [wp.coord.latitude, wp.coord.longitude]);
    }

    this.routePolylineGlow = L.polyline(latlngs, {
      color: '#0284c7',
      weight: 10,
      opacity: 0.4
    }).addTo(this.map);

    this.routePolyline = L.polyline(latlngs, {
      color: '#38bdf8',
      weight: 5,
      opacity: 0.9,
      dashArray: '6, 6'
    }).addTo(this.map);

    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });
  }

  handleCriticalSOS(alert) {
    window.voiceEngine.playChime('alert');
    alert(`🚨 CAREGIVER SOS ALERT: ${alert.message}`);
    this.loadAlertHistory();
  }

  setupEventListeners() {
    const addBtn = document.getElementById('btnOpenAddPlaceModal');
    const modal = document.getElementById('addPlaceModal');
    const cancelBtn = document.getElementById('btnCancelAddPlace');
    const saveBtn = document.getElementById('btnSaveAddPlace');
    const pinGpsBtn = document.getElementById('btnUseCurrentLocationForPlace');

    if (pinGpsBtn) {
      pinGpsBtn.addEventListener('click', () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById('newPlaceLat').value = pos.coords.latitude.toFixed(5);
            document.getElementById('newPlaceLng').value = pos.coords.longitude.toFixed(5);
          }, (err) => {
            alert('Could not get GPS fix: ' + err.message);
          }, { enableHighAccuracy: true });
        } else {
          alert('Geolocation not supported by device.');
        }
      });
    }

    if (addBtn && modal) {
      addBtn.addEventListener('click', () => modal.classList.add('open'));
    }
    if (cancelBtn && modal) {
      cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    if (saveBtn && modal) {
      saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('newPlaceName').value.trim();
        const category = document.getElementById('newPlaceCategory').value;
        const lat = parseFloat(document.getElementById('newPlaceLat').value);
        const lng = parseFloat(document.getElementById('newPlaceLng').value);
        const radius = parseFloat(document.getElementById('newPlaceRadius').value) || 30.0;
        const cue = document.getElementById('newPlaceCue').value.trim();

        const iconMap = { home: '🏠', temple: '🛕', mart: '🛒', hospital: '🏥', park: '🌳', relative: '👨‍👩‍👧', custom: '📍' };
        
        if (!name || isNaN(lat) || isNaN(lng)) {
          alert('Please enter a valid place name and coordinates.');
          return;
        }

        await MindMitraAPI.addSafeLocation({
          id: `loc_${Date.now()}`,
          name: name,
          category: category,
          icon: iconMap[category] || '📍',
          coord: { latitude: lat, longitude: lng },
          safe_radius_m: radius,
          landmark_cue: cue
        });

        modal.classList.remove('open');
        this.loadSafeLocations();
        if (window.patientNavigation) window.patientNavigation.loadDestinations();
      });
    }
  }
}

window.caregiverPortal = new CaregiverPortal();
