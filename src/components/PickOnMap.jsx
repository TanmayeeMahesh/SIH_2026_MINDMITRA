import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Guwahati, Assam — used only if we can't get even a rough location fix to
// centre the map on. This product's whole premise is Assam/NER households
// (docs/01), so that's a better blind starting point than 0,0.
const FALLBACK_CENTER = { lat: 26.1445, lng: 91.7362 };

/**
 * "Pick it on a map" — the alternative to physically standing at a place
 * (see the caregiver-onboarding conversation this came out of). A caregiver
 * taps or drags a pin to where the place actually is, instead of travelling
 * there right now. Trades GPS-grade accuracy for convenience — deliberately
 * offered as an ALTERNATIVE to "Use my current location", never a silent
 * replacement, so the more accurate option still exists for anyone willing
 * to go stand there. Online only — needs live tiles, same as LiveMap.jsx.
 */
export default function PickOnMap({ onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [coord, setCoord] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    function init(center, zoom) {
      if (cancelled || !containerRef.current) return;
      try {
        const map = L.map(containerRef.current).setView([center.lat, center.lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const icon = L.divIcon({ className: 'pickPin', html: '<div>📍</div>', iconSize: [36, 36], iconAnchor: [18, 34] });
        const marker = L.marker([center.lat, center.lng], { icon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          setCoord({ lat: p.lat, lng: p.lng });
        });
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        mapRef.current = map;
        markerRef.current = marker;
        setCoord({ lat: center.lat, lng: center.lng });
      } catch {
        setFailed(true);
      }
    }

    if ('geolocation' in navigator) {
      // A rough, possibly-cached fix is fine here — the caregiver is going
      // to manually correct the pin anyway, this just saves them panning
      // across a world map to find their own town first.
      navigator.geolocation.getCurrentPosition(
        (pos) => init({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 15),
        () => init(FALLBACK_CENTER, 12),
        { enableHighAccuracy: false, maximumAge: Infinity, timeout: 4000 },
      );
    } else {
      init(FALLBACK_CENTER, 12);
    }

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (failed) {
    return (
      <div className="panel">
        <p className="small">The map could not load. Try "Use my current location" instead.</p>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onCancel}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="pickMapWrap">
      <div ref={containerRef} className="liveMap" role="img" aria-label="Tap or drag the pin to mark the place" />
      <p className="small" style={{ marginTop: 8 }}>Tap anywhere on the map, or drag the pin, to mark the spot.</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost" style={{ width: 'auto', flex: 1 }} onClick={onCancel}>Cancel</button>
        <button className="btn primary" style={{ width: 'auto', flex: 1 }} disabled={!coord} onClick={() => coord && onConfirm(coord)}>
          Use this spot
        </button>
      </div>
    </div>
  );
}
