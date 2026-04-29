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
import { LandingPage } from "../screens/LandingPage";
import { fontDisplay } from "../lib/fonts";
import { HONEY, CHARCOAL } from "../lib/constants";

const LOGO_FADE_IN_START = 0;
const LOGO_FADE_IN_END = 30; // 1s
const PAGE_MATERIALIZE_START = 30;
const PAGE_MATERIALIZE_END = 75; // 2.5s
const CAMERA_PULLBACK_START = 45; // 1.5s
const CAMERA_PULLBACK_END = 120; // 4s
const LOGO_SHRINK_START = 31; // just after fade-in completes (must be > LOGO_FADE_IN_END for interpolate)
const LOGO_SHRINK_END = 90; // 3s
const SCROLL_START = 120; // 4s
const SCROLL_END = 1140; // 38s
const LANDING_PAGE_HEIGHT = 3200;
const VIEWPORT_HEIGHT = 1080;
const MAX_SCROLL_DISTANCE = LANDING_PAGE_HEIGHT - VIEWPORT_HEIGHT;

export const Act1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo opacity: fade in 0-1s, then fade out 1-3s
  const logoOpacity = interpolate(
    frame,
    [LOGO_FADE_IN_START, LOGO_FADE_IN_END, LOGO_SHRINK_START, LOGO_SHRINK_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Logo scale: shrinks from 1 to 0.4 as it fades out
  const logoScale = interpolate(
    frame,
    [LOGO_SHRINK_START, LOGO_SHRINK_END],
    [1, 0.4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Page materializes behind the logo
  const pageOpacity = interpolate(
    frame,
    [PAGE_MATERIALIZE_START, PAGE_MATERIALIZE_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Camera pullback: translateZ 400 -> 0
  const cameraZ = interpolate(
    frame,
    [CAMERA_PULLBACK_START, CAMERA_PULLBACK_END],
    [400, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // Slight rotateX tilt: 8 -> 2 degrees during pullback
  const cameraRotateX = interpolate(
    frame,
    [CAMERA_PULLBACK_START, CAMERA_PULLBACK_END],
    [8, 2],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // Scroll through landing page content
  const scrollY = interpolate(
    frame,
    [SCROLL_START, SCROLL_END],
    [0, -MAX_SCROLL_DISTANCE],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Logo overlay */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: HONEY[500],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: CHARCOAL[900],
            }}
          >
            H
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 52,
              color: "#FEFDFB",
              letterSpacing: "-0.01em",
            }}
          >
            hive
            <span
              style={{
                fontFamily: fontDisplay,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 58,
                color: HONEY[700],
              }}
            >
              five
            </span>
          </span>
        </div>
      </AbsoluteFill>

      {/* Landing page with 3D camera motion */}
      <AbsoluteFill style={{ opacity: pageOpacity }}>
        <Camera3D
          translateZ={cameraZ}
          rotateX={cameraRotateX}
        >
          <ScreenGlow intensity={0.8}>
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
                  transform: `translateY(${scrollY}px)`,
                }}
              >
                <LandingPage />
              </div>
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
