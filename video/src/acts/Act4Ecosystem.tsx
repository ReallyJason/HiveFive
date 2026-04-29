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
import { Dashboard } from "../screens/Dashboard";
import { LeaderboardBuzz } from "../screens/LeaderboardBuzz";

// Phase 1: Dashboard (0-30s = frames 0-900)
const DASHBOARD_ZOOM_END = 120; // 4s -- zoom from tight crop to full view
const DASHBOARD_FADE_OUT_START = 870; // 29s
const DASHBOARD_FADE_OUT_END = 900; // 30s

// Phase 2: LeaderboardBuzz (30-60s = frames 900-1800)
const LEADERBOARD_ENTRY_START = 900; // 30s
const LEADERBOARD_ENTRY_END = 990; // 33s

export const Act4Ecosystem: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Phase 1: Dashboard ---

  // Scale: 2.5 -> 1 over first 4s (zoomed in on stats, pulls back to full)
  const dashboardScale = interpolate(
    frame,
    [0, DASHBOARD_ZOOM_END],
    [2.5, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // TranslateX: -400 -> 0 (panning from left offset)
  const dashboardTranslateX = interpolate(
    frame,
    [0, DASHBOARD_ZOOM_END],
    [-400, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // TranslateY: -200 -> 0 (panning from top offset)
  const dashboardTranslateY = interpolate(
    frame,
    [0, DASHBOARD_ZOOM_END],
    [-200, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // Dashboard opacity for crossfade
  const dashboardOpacity = interpolate(
    frame,
    [DASHBOARD_FADE_OUT_START, DASHBOARD_FADE_OUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // --- Phase 2: LeaderboardBuzz ---

  // Leaderboard fades in as dashboard fades out
  const leaderboardOpacity = interpolate(
    frame,
    [DASHBOARD_FADE_OUT_START, DASHBOARD_FADE_OUT_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // RotateY entry: -10 -> 0 over 30-33s
  const leaderboardRotateY = interpolate(
    frame,
    [LEADERBOARD_ENTRY_START, LEADERBOARD_ENTRY_END],
    [-10, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Phase 1: Dashboard with zoom pullback */}
      {frame < DASHBOARD_FADE_OUT_END && (
        <AbsoluteFill style={{ opacity: dashboardOpacity }}>
          <Camera3D
            scale={dashboardScale}
            translateX={dashboardTranslateX}
            translateY={dashboardTranslateY}
          >
            <ScreenGlow intensity={0.6}>
              <div
                style={{
                  width: 1920,
                  height: 1080,
                  overflow: "hidden",
                  borderRadius: 12,
                }}
              >
                <Dashboard />
              </div>
            </ScreenGlow>
          </Camera3D>
        </AbsoluteFill>
      )}

      {/* Phase 2: LeaderboardBuzz with rotateY entry */}
      {frame >= DASHBOARD_FADE_OUT_START && (
        <AbsoluteFill style={{ opacity: leaderboardOpacity }}>
          <Camera3D rotateY={leaderboardRotateY}>
            <ScreenGlow intensity={0.7}>
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
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
