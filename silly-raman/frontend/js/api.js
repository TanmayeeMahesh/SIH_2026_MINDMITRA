const API_BASE = window.location.origin.includes('http') ? window.location.origin : 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

class MindMitraAPI {
  static async getSafeLocations() {
    const res = await fetch(`${API_BASE}/api/safe-locations`);
    if (!res.ok) throw new Error('Failed to fetch safe locations');
    return await res.json();
  }

  static async addSafeLocation(locationData) {
    const res = await fetch(`${API_BASE}/api/safe-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });
    if (!res.ok) throw new Error('Failed to add safe location');
    return await res.json();
  }

  static async deleteSafeLocation(locId) {
    const res = await fetch(`${API_BASE}/api/safe-locations/${locId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete location');
    return await res.json();
  }

  static async startNavigation(patientId, destinationId, currentCoord) {
    const res = await fetch(`${API_BASE}/api/navigation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        destination_id: destinationId,
        latitude: currentCoord.latitude,
        longitude: currentCoord.longitude
      })
    });
    if (!res.ok) throw new Error('Failed to start navigation');
    return await res.json();
  }

  static async sendTelemetry(sessionId, patientId, coord, heading, speed, battery) {
    const res = await fetch(`${API_BASE}/api/navigation/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        patient_id: patientId,
        current_coord: coord,
        heading_deg: heading,
        speed_mps: speed,
        accuracy_m: 5.0,
        battery_pct: battery,
        timestamp: Date.now() / 1000
      })
    });
    if (!res.ok) throw new Error('Failed to send telemetry');
    return await res.json();
  }

  static async getCaregiverTelemetry(patientId = 'patient_001') {
    const res = await fetch(`${API_BASE}/api/caregiver/telemetry?patient_id=${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch caregiver telemetry');
    return await res.json();
  }

  static async getAlerts() {
    const res = await fetch(`${API_BASE}/api/caregiver/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return await res.json();
  }

  static async triggerSOS(patientId, coord) {
    const res = await fetch(`${API_BASE}/api/patient/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        coord: coord
      })
    });
    if (!res.ok) throw new Error('Failed to trigger SOS');
    return await res.json();
  }

  static connectCaregiverWebSocket(onMessageCallback) {
    const wsUrl = `${WS_BASE}/ws/caregiver`;
    let socket;
    
    function connect() {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => console.log('🟢 Caregiver WebSocket Connected');
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageCallback(data);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
      socket.onclose = () => {
        console.log('Caregiver WS closed. Reconnecting in 3s...');
        setTimeout(connect, 3000);
      };
      socket.onerror = (err) => {
        console.warn('Caregiver WS error:', err);
      };
    }
    
    connect();
    return socket;
  }
}
