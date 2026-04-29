import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { Camera3D } from "../components/Camera3D";
import { ScreenGlow } from "../components/ScreenGlow";
import { LeaderboardBuzz } from "../screens/LeaderboardBuzz";

// Accelerating zoom into the screen over 15s (450 frames)
const ZOOM_DURATION = 450; // 15s at 30fps
const BLACK_OVERLAY_START = 420; // 14s
const BLACK_OVERLAY_END = 450; // 15s

export const Act5Close: React.FC = () => {
  const frame = useCurrentFrame();

  // Exponential acceleration zoom: translateZ 0 -> 1200
  const zoomZ = interpolate(frame, [0, ZOOM_DURATION], [0, 1200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.exp),
  });

  // Scale: 1 -> 3 with same exponential easing
  const zoomScale = interpolate(frame, [0, ZOOM_DURATION], [1, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.exp),
  });

  // Black overlay fades in at 14-15s for hard cut to black
  const blackOverlayOpacity = interpolate(
    frame,
    [BLACK_OVERLAY_START, BLACK_OVERLAY_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* LeaderboardBuzz with accelerating zoom */}
      <Camera3D translateZ={zoomZ} scale={zoomScale}>
        <ScreenGlow intensity={0.8}>
          <div
            style={{
              width: 1920,
              height: 1080,
              overflow: "hidden",
              borderRadius: 12,
            }}
          >
            <LeaderboardBuzz />
          </div>
        </ScreenGlow>
      </Camera3D>

      {/* Black overlay for hard cut to black */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          opacity: blackOverlayOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
