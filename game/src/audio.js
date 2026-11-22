// The Opera House Caper — sound, synthesized, no audio files.
// One file, one job: tiny WebAudio bleeps for pickup, alarm and victory, with
// a mute toggle. Everything is generated at run time, so the game ships zero
// media assets and makes zero network requests.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmOsc = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarm();
    return this.muted;
  }

  blip(freq, dur, type, gain) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain ?? 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  pickup() {
    this.blip(660, 0.12, 'triangle', 0.09);
    setTimeout(() => this.blip(990, 0.16, 'triangle', 0.09), 90);
  }

  disguiseOn() {
    this.blip(420, 0.1, 'sine', 0.06);
    setTimeout(() => this.blip(560, 0.12, 'sine', 0.06), 80);
  }

  spotted() {
    this.blip(220, 0.25, 'square', 0.05);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'triangle', 0.09), i * 130));
  }

  caught() {
    [330, 262, 196].forEach((f, i) => setTimeout(() => this.blip(f, 0.25, 'sawtooth', 0.05), i * 160));
  }

  // A soft two-tone alarm that follows the alarm meter; call every frame.
  alarmTick(level) {
    if (this.muted || level < 40) {
      this.stopAlarm();
      return;
    }
    const ctx = this.ensure();
    if (!ctx) return;
    if (!this.alarmOsc) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 520;
      g.gain.value = 0.0;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      this.alarmOsc = { osc, g };
    }
    const target = 0.015 + (level / 100) * 0.03;
    this.alarmOsc.g.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
    const now = ctx.currentTime;
    this.alarmOsc.osc.frequency.setTargetAtTime(level > 75 ? 740 : 520, now, 0.2);
  }

  stopAlarm() {
    if (!this.alarmOsc) return;
    try {
      this.alarmOsc.g.gain.value = 0;
      this.alarmOsc.osc.stop();
    } catch (e) { /* already stopped */ }
    this.alarmOsc = null;
  }
}
