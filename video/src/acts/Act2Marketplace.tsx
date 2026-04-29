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
import { DiscoverPage } from "../screens/DiscoverPage";
import { ServiceDetailBooking } from "../screens/ServiceDetailBooking";

// Phase 1: Discover page (0-25s = frames 0-750)
const DISCOVER_ENTRY_START = 0;
const DISCOVER_ENTRY_END = 90; // 3s rotateY entry
const DISCOVER_FADE_OUT_START = 720; // 24s
const DISCOVER_FADE_OUT_END = 750; // 25s

// Phase 2: ServiceDetailBooking (25-50s = frames 750-1500)
const DETAIL_ZOOM_START = 750; // 25s
const DETAIL_ZOOM_END = 780; // 26s -- scale 0.5 -> 1 over ~1s
const DETAIL_SCROLL_START = 810; // 27s
const DETAIL_SCROLL_END = 1440; // 48s
const DETAIL_PAGE_HEIGHT = 2400;
const VIEWPORT_HEIGHT = 1080;
const MAX_DETAIL_SCROLL = DETAIL_PAGE_HEIGHT - VIEWPORT_HEIGHT;

export const Act2Marketplace: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Phase 1: Discover ---

  // RotateY entry: -15 -> 0 over first 3s
  const discoverRotateY = interpolate(
    frame,
    [DISCOVER_ENTRY_START, DISCOVER_ENTRY_END],
    [-15, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // Discover opacity: 1 during display, fade out at 24-25s
  const discoverOpacity = interpolate(
    frame,
    [DISCOVER_FADE_OUT_START, DISCOVER_FADE_OUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // --- Phase 2: ServiceDetailBooking ---

  // Detail opacity: fade in as discover fades out
  const detailOpacity = interpolate(
    frame,
    [DISCOVER_FADE_OUT_START, DISCOVER_FADE_OUT_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Zoom in: scale 0.5 -> 1
  const detailScale = interpolate(
    frame,
    [DETAIL_ZOOM_START, DETAIL_ZOOM_END],
    [0.5, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // Scroll through service detail + booking
  const detailScrollY = interpolate(
    frame,
    [DETAIL_SCROLL_START, DETAIL_SCROLL_END],
    [0, -MAX_DETAIL_SCROLL],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Phase 1: Discover page with rotateY entry */}
      {frame < DISCOVER_FADE_OUT_END && (
        <AbsoluteFill style={{ opacity: discoverOpacity }}>
          <Camera3D rotateY={discoverRotateY}>
            <ScreenGlow intensity={0.6}>
              <div
                style={{
                  width: 1920,
                  height: VIEWPORT_HEIGHT,
                  overflow: "hidden",
                  borderRadius: 12,
                }}
              >
                <DiscoverPage />
              </div>
            </ScreenGlow>
          </Camera3D>
        </AbsoluteFill>
      )}

      {/* Phase 2: ServiceDetailBooking zoom + scroll */}
      {frame >= DISCOVER_FADE_OUT_START && (
        <AbsoluteFill style={{ opacity: detailOpacity }}>
          <Camera3D scale={detailScale}>
            <ScreenGlow intensity={0.6}>
              <div
                style={{
                  width: 1920,
                  height: VIEWPORT_HEIGHT,
                  overflow: "hidden",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    transform: `translateY(${detailScrollY}px)`,
                  }}
                >
                  <ServiceDetailBooking />
                </div>
              </div>
            </ScreenGlow>
          </Camera3D>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
