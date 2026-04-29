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
import { DeviceFrame } from "../components/DeviceFrame";
import { Messaging } from "../screens/Messaging";
import { OrdersDisputes } from "../screens/OrdersDisputes";

// Phase 1: Messaging (0-35s = frames 0-1050)
const MESSAGING_MSG_REVEAL_START = 60; // 2s
const MESSAGING_MSG_REVEAL_END = 600; // 20s
const MESSAGING_TYPING_START = 540; // 18s
const MESSAGING_TYPING_END = 660; // 22s
const MESSAGING_FADE_OUT_START = 1020; // 34s
const MESSAGING_FADE_OUT_END = 1050; // 35s

// Phase 2: OrdersDisputes (35-70s = frames 1050-2100)
const ORDERS_ENTRY_START = 1050; // 35s
const ORDERS_ENTRY_END = 1140; // 38s

// DeviceFrame dimensions
const DEVICE_FRAME_WIDTH = 1400;
const DEVICE_FRAME_HEIGHT = 880;

// The Messaging screen is 1920x1080 but we're fitting it inside
// a DeviceFrame of 1400x880. Scale factor: 1400/1920 = ~0.729
const CONTENT_SCALE = DEVICE_FRAME_WIDTH / 1920;

const MAX_VISIBLE_MESSAGES = 5;

export const Act3Infrastructure: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Phase 1: Messaging ---

  // Animated message count: 0 -> 5 over 2-20s
  const rawMessageCount = interpolate(
    frame,
    [MESSAGING_MSG_REVEAL_START, MESSAGING_MSG_REVEAL_END],
    [0, MAX_VISIBLE_MESSAGES],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const visibleMessageCount = Math.floor(rawMessageCount);

  // Typing indicator visible between 18-22s
  const showTyping = frame >= MESSAGING_TYPING_START && frame < MESSAGING_TYPING_END;

  // Slow orbit: rotateY -8 -> 8, rotateX 3 -> -3
  const orbitRotateY = interpolate(
    frame,
    [0, 1050],
    [-8, 8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const orbitRotateX = interpolate(
    frame,
    [0, 1050],
    [3, -3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Messaging opacity for crossfade
  const messagingOpacity = interpolate(
    frame,
    [MESSAGING_FADE_OUT_START, MESSAGING_FADE_OUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // --- Phase 2: OrdersDisputes ---

  // Orders fade in as messaging fades out
  const ordersOpacity = interpolate(
    frame,
    [MESSAGING_FADE_OUT_START, MESSAGING_FADE_OUT_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Slight rotateX tilt on entry: 5 -> 0
  const ordersRotateX = interpolate(
    frame,
    [ORDERS_ENTRY_START, ORDERS_ENTRY_END],
    [5, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Phase 1: Messaging inside DeviceFrame with orbit */}
      {frame < MESSAGING_FADE_OUT_END && (
        <AbsoluteFill style={{ opacity: messagingOpacity }}>
          <Camera3D
            rotateY={orbitRotateY}
            rotateX={orbitRotateX}
          >
            <ScreenGlow intensity={0.7}>
              <DeviceFrame
                width={DEVICE_FRAME_WIDTH}
                height={DEVICE_FRAME_HEIGHT}
              >
                <div
                  style={{
                    transform: `scale(${CONTENT_SCALE})`,
                    transformOrigin: "top left",
                    width: 1920,
                    height: 1080,
                  }}
                >
                  <Messaging
                    visibleMessageCount={visibleMessageCount}
                    showTyping={showTyping}
                  />
                </div>
              </DeviceFrame>
            </ScreenGlow>
          </Camera3D>
        </AbsoluteFill>
      )}

      {/* Phase 2: OrdersDisputes with rotateX entry */}
      {frame >= MESSAGING_FADE_OUT_START && (
        <AbsoluteFill style={{ opacity: ordersOpacity }}>
          <Camera3D rotateX={ordersRotateX}>
            <ScreenGlow intensity={0.6}>
              <div
                style={{
                  width: 1920,
                  height: 1080,
                  overflow: "hidden",
                  borderRadius: 12,
                }}
              >
                <OrdersDisputes />
              </div>
            </ScreenGlow>
          </Camera3D>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
