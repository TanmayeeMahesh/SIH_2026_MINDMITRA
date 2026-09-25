class JourneyGardenRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.state = {
      total_points: 40,
      stage_level: 1,
      stage_name: "🌱 Moist Soil & Sprouting Seeds",
      grid: [
        ["soil", "soil", "soil"],
        ["soil", "sprout", "soil"],
        ["seed", "soil", "soil"]
      ],
      recent_event: "Seed planted! Walking will nurture your garden."
    };

    this.particles = [];
    this.butterflies = [];
    this.animationFrameId = null;
    this.time = 0;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.initButterflies();
      this.startLoop();
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 320;
    this.canvas.height = 240;
  }

  initButterflies() {
    this.butterflies = [
      { x: 50, y: 100, vx: 0.8, vy: -0.4, size: 14, color: '#f59e0b', phase: 0 },
      { x: 200, y: 140, vx: -0.6, vy: 0.5, size: 12, color: '#38bdf8', phase: 2 },
      { x: 120, y: 60, vx: 0.5, vy: 0.3, size: 10, color: '#ec4899', phase: 4 }
    ];
  }

  updateState(gardenState) {
    if (!gardenState) return;
    const oldPoints = this.state.total_points;
    this.state = gardenState;

    if (gardenState.total_points > oldPoints) {
      this.emitSparkles(this.canvas.width / 2, this.canvas.height / 2, 25);
    }
  }

  emitSparkles(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 3 + 2,
        color: ['#f59e0b', '#10b981', '#6ee7b7', '#fde047', '#ec4899'][Math.floor(Math.random() * 5)],
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }

  startLoop() {
    const loop = () => {
      this.time += 0.03;
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Garden Background Sky & Grassy Hills
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (this.state.stage_level >= 3) {
      grad.addColorStop(0, '#1e3a5f'); // Sunny Morning Blue
      grad.addColorStop(0.6, '#134e4a'); // Lush Green Horizon
      grad.addColorStop(1, '#064e3b'); // Rich Emerald Ground
    } else {
      grad.addColorStop(0, '#17253b'); // Quiet Dawn
      grad.addColorStop(0.6, '#1f382b');
      grad.addColorStop(1, '#241a12'); // Rich Earth Soil
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Gentle Sun / Warm Glow in Level 2+
    if (this.state.stage_level >= 2) {
      const sunGlow = ctx.createRadialGradient(w - 40, 40, 5, w - 40, 40, 45);
      sunGlow.addColorStop(0, 'rgba(253, 224, 71, 0.8)');
      sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(w - 40, 40, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Isometric Garden Beds / Soil Plots
    const grid = this.state.grid || [];
    const cellW = w / 3;
    const cellH = (h - 60) / 3;
    const startY = 55;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r] || []).length; c++) {
        const item = grid[r][c];
        const cx = c * cellW + cellW / 2;
        const cy = startY + r * cellH + cellH / 2;

        // Soil mound base
        ctx.fillStyle = 'rgba(67, 48, 30, 0.6)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Element
        this.drawItem(ctx, item, cx, cy, r, c);
      }
    }

    // 4. Draw Animated Butterflies in Level 3+
    if (this.state.stage_level >= 3) {
      this.butterflies.forEach(b => {
        b.x += b.vx;
        b.y += b.vy + Math.sin(this.time + b.phase) * 0.5;
        if (b.x < 10 || b.x > w - 10) b.vx *= -1;
        if (b.y < 20 || b.y > h - 40) b.vy *= -1;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = b.color;
        const wingFlap = Math.sin(this.time * 8 + b.phase);
        ctx.beginPath();
        ctx.ellipse(-b.size / 2, 0, b.size / 2, Math.abs(wingFlap) * b.size, 0.3, 0, Math.PI * 2);
        ctx.ellipse(b.size / 2, 0, b.size / 2, Math.abs(wingFlap) * b.size, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 5. Draw Active Floating Sparkles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawItem(ctx, type, x, y, r, c) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bounce = Math.sin(this.time * 2 + r * 1.5 + c) * 3;

    if (type === 'sprout') {
      ctx.font = '28px serif';
      ctx.fillText('🌱', x, y + bounce);
    } else if (type === 'tulsi' || type === 'fern') {
      ctx.font = '32px serif';
      ctx.fillText('🌿', x, y + bounce);
    } else if (type === 'marigold') {
      ctx.font = '34px serif';
      ctx.fillText('🌼', x, y + bounce);
    } else if (type === 'orchid') {
      ctx.font = '34px serif';
      ctx.fillText('🌸', x, y + bounce);
    } else if (type === 'banyan_tree' || type === 'tree') {
      ctx.font = '48px serif';
      ctx.fillText('🌳', x, y - 6 + bounce);
    } else if (type === 'butterfly') {
      ctx.font = '28px serif';
      ctx.fillText('🦋', x, y + bounce);
    } else if (type === 'bird') {
      ctx.font = '26px serif';
      ctx.fillText('🐦', x, y + bounce);
    } else if (type === 'lotus_pond') {
      ctx.font = '30px serif';
      ctx.fillText('🪷', x, y + 8);
    } else if (type === 'seed') {
      ctx.font = '20px serif';
      ctx.fillText('🌰', x, y + 8);
    } else {
      // Moist Soil patch
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.arc(x, y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
