/**
 * MindMitra: Blossom Trail & Landmark Memory Stamp Quest Module
 * Strictly ensures single-time triggers for stamp popups, voice cues, and postcards.
 */

class LandmarkStampQuest {
  constructor() {
    this.stamps = [];
    this.collectedStamps = [];
    this.unlockedStampIds = new Set();
    this.shownPostcardSessionId = null;
  }

  setRouteStamps(stamps) {
    this.stamps = stamps || [];
    this.collectedStamps = this.stamps.filter(s => s.collected);
    this.unlockedStampIds.clear();
    this.shownPostcardSessionId = null;
    this.collectedStamps.forEach(s => this.unlockedStampIds.add(s.id));
    this.renderStampPassport();
  }

  renderStampPassport() {
    const passportGrid = document.getElementById('stampPassportGrid');
    const stampCountEl = document.getElementById('stampCountBadge');
    if (!passportGrid) return;

    passportGrid.innerHTML = '';
    if (stampCountEl) {
      stampCountEl.innerText = `⭐ ${this.collectedStamps.length} / ${this.stamps.length} Stamps`;
    }

    if (this.stamps.length === 0) {
      passportGrid.innerHTML = '<div style="color:var(--text-muted); font-size:12px; grid-column: 1/-1; text-align:center;">Select a destination to start your journey.</div>';
      return;
    }

    this.stamps.forEach(stamp => {
      const isCollected = this.collectedStamps.some(cs => cs.id === stamp.id) || stamp.collected;
      const card = document.createElement('div');
      card.className = `stamp-badge ${isCollected ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="stamp-icon-circle">${isCollected ? stamp.icon : '🔒'}</div>
        <div class="stamp-name">${stamp.name}</div>
        <div class="stamp-reward">${isCollected ? '✅ UNLOCKED' : `+${stamp.points_reward} Pts`}</div>
      `;
      passportGrid.appendChild(card);
    });
  }

  unlockStamp(stamp) {
    if (!stamp || !stamp.id) return;
    
    // Check if already unlocked during this session
    if (this.unlockedStampIds.has(stamp.id)) {
      return; // Guarantee single-time execution
    }

    this.unlockedStampIds.add(stamp.id);
    stamp.collected = true;
    if (!this.collectedStamps.some(s => s.id === stamp.id)) {
      this.collectedStamps.push(stamp);
    }

    this.renderStampPassport();
    this.showStampUnlockPopup(stamp);
  }

  showStampUnlockPopup(stamp) {
    // Play celebratory chime and positive voice prompt once
    window.voiceEngine.playChime('success');
    window.voiceEngine.speak({
      en: `Wonderful! You unlocked the ${stamp.name} memory stamp! Twenty-five points added to your garden!`,
      hi: `बहुत बढ़िया! आपने ${stamp.name} स्टैम्प प्राप्त कर लिया!`,
      mr: `खूप छान! तुम्हाला ${stamp.name} स्टॅम्प मिळाला आहे!`,
      as: `বৰ ভাল কথা! আপুনি ${stamp.name} মেমৰি ষ্টেম্প লাভ কৰিলে!`,
      bn: `চমৎকার! আপনি ${stamp.name} মেমরি স্ট্যাম্পটি আনলক করেছেন!`
    });

    // Create dynamic floating popup
    const popup = document.createElement('div');
    popup.className = 'stamp-popup-toast';
    popup.innerHTML = `
      <div class="stamp-popup-icon">${stamp.icon}</div>
      <div>
        <div class="stamp-popup-title">⭐ LANDMARK STAMP UNLOCKED!</div>
        <div class="stamp-popup-name">${stamp.name}</div>
        <div class="stamp-popup-desc">${stamp.description}</div>
      </div>
    `;
    document.body.appendChild(popup);

    // Particle sparkles
    if (window.patientNavigation && window.patientNavigation.gardenRenderer) {
      window.patientNavigation.gardenRenderer.emitSparkles(
        window.patientNavigation.gardenRenderer.canvas.width / 2,
        window.patientNavigation.gardenRenderer.canvas.height / 2,
        35
      );
    }

    setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 400);
    }, 4000);
  }

  showJourneyPostcard(postcard) {
    if (!postcard) return;

    // Check if modal is already open or already shown for this session
    const modal = document.getElementById('journeyPostcardModal');
    if (!modal) return;
    
    if (this.shownPostcardSessionId === postcard.postcard_id || modal.classList.contains('open')) {
      return; // Guarantee single-time popup
    }

    this.shownPostcardSessionId = postcard.postcard_id;

    document.getElementById('postcardDestName').innerText = postcard.destination_name;
    document.getElementById('postcardOriginName').innerText = postcard.origin_name;
    document.getElementById('postcardDate').innerText = postcard.date_str;
    document.getElementById('postcardDist').innerText = `${Math.round(postcard.distance_walked_m)} m`;
    document.getElementById('postcardPoints').innerText = `🌱 +${postcard.garden_points_earned}`;
    document.getElementById('postcardMsg').innerText = postcard.completion_message;

    const stampContainer = document.getElementById('postcardStampsList');
    if (stampContainer) {
      stampContainer.innerHTML = '';
      postcard.stamps_collected.forEach(s => {
        const span = document.createElement('div');
        span.className = 'postcard-stamp-item';
        span.innerHTML = `
          <div style="font-size:26px;">${s.icon}</div>
          <div style="font-size:11px; font-weight:700; color:#332F29; text-align:center;">${s.name}</div>
        `;
        stampContainer.appendChild(span);
      });
    }

    modal.classList.add('open');
  }

  closePostcard() {
    const modal = document.getElementById('journeyPostcardModal');
    if (modal) modal.classList.remove('open');
  }
}

window.stampQuest = new LandmarkStampQuest();
