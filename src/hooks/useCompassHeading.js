import { useEffect, useState } from 'react';

/**
 * Real compass heading via DeviceOrientationEvent — the magnetometer, which
 * works whether the phone is moving or standing still.
 *
 * This is NOT the same thing as GeolocationCoordinates.heading (what
 * useSafeWalk was reading before this file existed). That's "course over
 * ground" — derived from the last couple of GPS fixes, so it's null until
 * the device has actually moved in a fairly straight line for a bit, and
 * useless the moment she stops walking (or on a laptop, which has no GPS
 * motion to derive a course from at all). The arrow needs to point the right
 * way the instant she's standing still turning to face a direction — that's
 * what a real compass reading gives you and a GPS course never can.
 *
 * iOS 13+ requires this to be requested from within a user gesture handler
 * (a tap), so call requestPermission() from a click handler, not on mount.
 */
export function useCompassHeading() {
  const [heading, setHeading] = useState(null);
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

  useEffect(() => {
    if (!supported) return;
    function handle(e) {
      let h = null;
      if (e.webkitCompassHeading != null) h = e.webkitCompassHeading; // iOS Safari: already 0=N, clockwise-positive
      else if (e.alpha != null) h = (360 - e.alpha) % 360;            // Android/standard: alpha counts the other way
      if (h != null && !Number.isNaN(h)) setHeading(h);
    }
    window.addEventListener('deviceorientation', handle, true);
    return () => window.removeEventListener('deviceorientation', handle, true);
  }, [supported]);

  /** Must be called from inside a click/tap handler on iOS, or the browser
   *  silently refuses forever. Harmless no-op on platforms that don't ask. */
  async function requestPermission() {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try { return (await DOE.requestPermission()) === 'granted'; }
      catch { return false; }
    }
    return true;
  }

  return { heading, supported, requestPermission };
}
