import React, { useEffect, useRef, useState } from 'react';
import BigArrow from './BigArrow.jsx';

/**
 * Camera passthrough with the same rotating arrow overlaid on top. Honest
 * framing, worth reading before deciding whether to keep this: this is NOT
 * true spatial AR. Read docs/18 §4 first — silly-raman's own "AR" wasn't
 * either, underneath the Three.js polish: no feature tracking, no anchoring
 * to anything the camera actually sees, just GPS + compass math positioning
 * a shape on screen. What this view adds over the plain Arrow view is purely
 * "hold the phone up like you're taking a photo, turn your body until the
 * arrow points straight up, walk that way" — a real, coherent, well-known
 * pattern (several ordinary walking-nav apps do exactly this), just not the
 * more impressive thing "AR" usually implies. It costs a camera permission
 * prompt and battery for that. Kept as an optional view, never the default —
 * see the Arrow/Map/Camera switch in SafeWalk.jsx.
 */
export default function ArrowCameraView({ rotateDeg = 0, distanceLabel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | live | denied | unsupported

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('unsupported'); return; }
      // Same three-tier fallback silly-raman's camera.js used: an ideal rear
      // camera, then any rear camera, then whatever camera exists at all
      // (desktop webcams have no facingMode, and would otherwise get nothing).
      const attempts = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false },
        { video: true, audio: false },
      ];
      for (const constraints of attempts) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }
          setStatus('live');
          return;
        } catch { /* try the next strategy */ }
      }
      if (!cancelled) setStatus('denied');
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  if (status === 'unsupported' || status === 'denied') {
    return (
      <div className="panel" style={{ textAlign: 'center' }}>
        <p className="small">
          {status === 'unsupported' ? 'This browser has no camera support.' : 'Camera permission was not given.'}
          {' '}Use the Arrow view instead — it works exactly the same way, just without the camera behind it.
        </p>
      </div>
    );
  }

  return (
    <div className="cameraView">
      <video ref={videoRef} className="cameraFeed" muted playsInline autoPlay aria-hidden="true" />
      <div className="cameraOverlay">
        <BigArrow rotateDeg={rotateDeg} />
        {distanceLabel && <b className="cameraDist">{distanceLabel}</b>}
      </div>
      {status === 'starting' && <div className="cameraLoading">Starting camera…</div>}
    </div>
  );
}
