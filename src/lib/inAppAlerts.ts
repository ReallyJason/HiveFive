const NOTIFICATION_REFRESH_EVENT = 'hive:notifications-refresh';

let audioContext: AudioContext | null = null;
let unlockBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const AudioCtx = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) return null;
  if (!audioContext) audioContext = new AudioCtx();
  return audioContext;
}

function scheduleTone(
  ctx: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  glideTo?: number,
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  if (glideTo && glideTo > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(glideTo, startAt + duration * 0.85);
  }

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, startAt);
  filter.Q.setValueAtTime(0.0001, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.75, startAt + duration * 0.45);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function scheduleChime(
  ctx: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  volume: number,
) {
  scheduleTone(ctx, startAt, frequency, duration, volume, 'triangle', frequency * 1.015);
  scheduleTone(ctx, startAt + 0.015, frequency * 2, Math.max(0.16, duration * 0.72), volume * 0.24, 'sine');
}

export function initInAppSounds() {
  if (typeof window === 'undefined' || unlockBound) return;

  const resume = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
    unlockBound = false;
  };

  unlockBound = true;
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

export function playAlertSound(kind: 'message' | 'notification') {
  const ctx = getAudioContext();
  if (!ctx) return;

  ctx.resume().catch(() => {});
  if (ctx.state !== 'running') return;

  const now = ctx.currentTime;
  if (kind === 'message') {
    scheduleChime(ctx, now, 392.0, 0.34, 0.018);
    scheduleChime(ctx, now + 0.14, 493.88, 0.38, 0.015);
    return;
  }

  scheduleChime(ctx, now, 329.63, 0.36, 0.015);
  scheduleChime(ctx, now + 0.12, 415.3, 0.4, 0.013);
  scheduleTone(ctx, now + 0.27, 523.25, 0.44, 0.008, 'sine', 531.25);
}

export function dispatchNotificationsRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
}

export function subscribeNotificationsRefresh(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(NOTIFICATION_REFRESH_EVENT, callback);
  return () => window.removeEventListener(NOTIFICATION_REFRESH_EVENT, callback);
}
