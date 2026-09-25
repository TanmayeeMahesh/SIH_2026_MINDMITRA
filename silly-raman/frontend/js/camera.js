/**
 * MindMitra: Live Camera Feed Module
 * Provides rock-solid, high-definition rear webcam / phone camera streaming for mobile AR.
 * Handles mobile browser autoplay policies, permission lifecycles, and gesture fallbacks.
 */

class LiveCameraManager {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.isStreaming = false;
    this.isStarting = false;
    this.statusCheckTimer = null;
    this.onStatusChange = null;
    this._hasBoundGestureFallback = false;
  }

  init(videoId) {
    this.videoElement = document.getElementById(videoId);
    if (this.videoElement) {
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.setAttribute('muted', '');
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('webkit-playsinline', '');
    }
    this.bindGestureFallback();
  }

  bindGestureFallback() {
    if (this._hasBoundGestureFallback) return;
    this._hasBoundGestureFallback = true;

    const resumeOnGesture = () => {
      if (this.videoElement && this.stream) {
        if (this.videoElement.paused) {
          this.videoElement.play().then(() => {
            this.isStreaming = true;
            this.updatePromptVisibility();
            console.log("📷 Camera feed resumed by user gesture.");
          }).catch(e => {
            console.warn("Gesture play attempt notice:", e);
          });
        }
      }
    };

    window.addEventListener('touchstart', resumeOnGesture, { passive: true });
    window.addEventListener('touchend', resumeOnGesture, { passive: true });
    window.addEventListener('click', resumeOnGesture, { passive: true });
  }

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Camera getUserMedia not supported in this browser environment.");
      this.updatePromptVisibility(true);
      return false;
    }

    if (this.isStarting) {
      return true;
    }

    // If already streaming and video is active, ensure playback
    if (this.stream && this.videoElement && this.videoElement.srcObject) {
      const activeTracks = this.stream.getVideoTracks().filter(t => t.readyState === 'live');
      if (activeTracks.length > 0) {
        return this.ensurePlaying();
      }
    }

    this.isStarting = true;

    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          try { track.stop(); } catch(e){}
        });
        this.stream = null;
      }

      let stream = null;

      // Strategy 1: High-res environment (rear) camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          audio: false
        });
      } catch (e1) {
        console.log("Strategy 1 (ideal environment) failed, trying strategy 2:", e1.name);
        // Strategy 2: Simple environment facing mode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
          });
        } catch (e2) {
          console.log("Strategy 2 (facingMode environment) failed, trying fallback:", e2.name);
          // Strategy 3: Any video device available (e.g. desktop webcam or front camera)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      this.stream = stream;

      if (this.videoElement) {
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.setAttribute('autoplay', '');
        this.videoElement.setAttribute('muted', '');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('webkit-playsinline', '');
        this.videoElement.srcObject = stream;

        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isStreaming = true;
              this.updatePromptVisibility(false);
              console.log("📷 Live camera feed streaming successfully. Video resolution:",
                this.videoElement.videoWidth, "x", this.videoElement.videoHeight);
            })
            .catch(err => {
              console.warn("Autoplay deferred by mobile browser policy:", err.name);
              this.updatePromptVisibility(true);
            });
        }

        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play().then(() => {
            this.isStreaming = true;
            this.updatePromptVisibility(false);
          }).catch(() => {});
        };

        this.videoElement.onplaying = () => {
          this.isStreaming = true;
          this.updatePromptVisibility(false);
        };
      }

      this.startHealthMonitor();
      this.isStarting = false;
      return true;

    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      this.isStreaming = false;
      this.isStarting = false;
      this.updatePromptVisibility(true);
      return false;
    }
  }

  async ensurePlaying() {
    if (!this.videoElement) return false;

    if (!this.stream) {
      return await this.startCamera();
    }

    try {
      if (this.videoElement.paused) {
        await this.videoElement.play();
      }
      this.isStreaming = true;
      this.updatePromptVisibility(false);
      return true;
    } catch (err) {
      console.warn("ensurePlaying notice:", err);
      this.updatePromptVisibility(true);
      return false;
    }
  }

  startHealthMonitor() {
    if (this.statusCheckTimer) clearInterval(this.statusCheckTimer);
    this.statusCheckTimer = setInterval(() => {
      if (!this.videoElement) return;

      const isActuallyPlaying = !this.videoElement.paused &&
                                this.videoElement.readyState >= 2 &&
                                this.videoElement.videoWidth > 0;

      if (isActuallyPlaying) {
        this.isStreaming = true;
        this.updatePromptVisibility(false);
      } else if (this.stream && this.videoElement.paused) {
        // Attempt quiet autoplay recovery
        this.videoElement.play().then(() => {
          this.isStreaming = true;
          this.updatePromptVisibility(false);
        }).catch(() => {
          this.updatePromptVisibility(true);
        });
      }
    }, 1200);
  }

  updatePromptVisibility(showPrompt = false) {
    const promptEl = document.getElementById('cameraTapToStart');
    if (!promptEl) return;

    if (showPrompt && (!this.isStreaming || (this.videoElement && this.videoElement.paused))) {
      promptEl.classList.remove('hidden');
    } else {
      promptEl.classList.add('hidden');
    }
  }

  stopCamera() {
    if (this.statusCheckTimer) {
      clearInterval(this.statusCheckTimer);
      this.statusCheckTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try { track.stop(); } catch(e){}
      });
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isStreaming = false;
    this.isStarting = false;
    this.updatePromptVisibility(false);
  }
}

window.cameraManager = new LiveCameraManager();
