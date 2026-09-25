import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * The real, online map view — live position, the destination, and the actual
 * route drawn as a blue line, same idea as silly-raman's Leaflet map. Static
 * top-level import of `leaflet` here is deliberate: this file itself is
 * lazy-loaded (React.lazy, in SafeWalk.jsx) only when the elder actually
 * switches to Map view, so the ~40KB library and its CSS never load for
 * anyone using the default Arrow view or working offline.
 *
 * Tiles come straight from OpenStreetMap's public server, live — normal
 * interactive browsing, not bulk caching for offline use, which is the
 * specific thing their usage policy forbids (see docs/18 §5). Nothing here
 * is stored for offline use; if the connection drops, this view just stops
 * updating and the elder should be back on Arrow view, which always works.
 */
export default function LiveMap({ route, here, place }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const meMarkerRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !route) return;
    let map;
    try {
      const start = here || route.waypoints[0] || route.destination;
      map = L.map(containerRef.current, { zoomControl: false, attributionControl: true })
        .setView([start.lat, start.lng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      if (route.waypoints?.length > 1) {
        L.polyline(route.waypoints.map((w) => [w.lat, w.lng]), {
          color: '#2E5CB8', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round',
        }).addTo(map);
      }

      const destIcon = L.divIcon({
        className: 'liveMapDest', html: `<div>${place?.icon || '📍'}</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17],
      });
      L.marker([route.destination.lat, route.destination.lng], { icon: destIcon }).addTo(map);

      const meIcon = L.divIcon({ className: 'liveMapMe', html: '<div class="pulse"></div><div class="dot"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
      meMarkerRef.current = L.marker([start.lat, start.lng], { icon: meIcon }).addTo(map);

      mapRef.current = map;
    } catch {
      setFailed(true);
    }
    return () => { map?.remove(); mapRef.current = null; };
    // Re-init only when the route itself changes (a new walk) — not on every
    // position tick, which is handled by the marker-move effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    if (!mapRef.current || !meMarkerRef.current || !here) return;
    meMarkerRef.current.setLatLng([here.lat, here.lng]);
    // Keep her centred the first time we get a real fix, then let the
    // caregiver/elder pan freely without the map yanking back underneath them.
    if (!hasCenteredRef.current) { mapRef.current.panTo([here.lat, here.lng]); hasCenteredRef.current = true; }
  }, [here?.lat, here?.lng]);

  if (failed) return <p className="small">The map could not load. Try the Arrow view instead.</p>;
  return <div ref={containerRef} className="liveMap" role="img" aria-label="Live map of the route" />;
}
