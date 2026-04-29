import { interpolate, spring, Easing } from "remotion";

export function fadeIn(frame: number, fps: number, delaySec: number = 0): number {
  return interpolate(frame, [delaySec * fps, (delaySec + 0.5) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
}

export function fadeOut(frame: number, fps: number, startSec: number, durationSec: number = 0.4): number {
  return interpolate(
    frame,
    [startSec * fps, (startSec + durationSec) * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) },
  );
}

export function slideIn(
  frame: number,
  fps: number,
  direction: "left" | "right" | "up" | "down",
  delaySec: number = 0,
): number {
  const progress = spring({
    frame,
    fps,
    delay: Math.round(delaySec * fps),
    config: { damping: 200 },
  });
  const distance = direction === "left" || direction === "up" ? -100 : 100;
  return interpolate(progress, [0, 1], [distance, 0]);
}

export function scaleIn(frame: number, fps: number, delay: number = 0): number {
  return spring({ frame, fps, delay, config: { damping: 200 } });
}

export function smoothStep(frame: number, fps: number, startSec: number, endSec: number): number {
  return interpolate(frame, [startSec * fps, endSec * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
}

export function countUp(frame: number, fps: number, target: number, durationSec: number = 1.5, delaySec: number = 0): number {
  const progress = interpolate(
    frame,
    [delaySec * fps, (delaySec + durationSec) * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) },
  );
  return Math.round(progress * target);
}
