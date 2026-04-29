# HiveFive Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-minute Remotion video that showcases 7 HiveFive screens with hybrid 3D motion on AMOLED black, for live investor demo narration.

**Architecture:** A standalone Remotion project (`video/`) within the HiveFive repo. Each screen is a self-contained React component replicating the HiveFive UI with hardcoded demo data. Acts are composed via `TransitionSeries` with CSS 3D transforms for camera motion. Tailwind v4 mirrors the main app's design system.

**Tech Stack:** Remotion 4.x, React 18, Tailwind CSS v4, `@remotion/transitions`, `@remotion/media`, `@remotion/google-fonts`

---

## File Structure

```
video/
  package.json
  tsconfig.json
  src/
    index.ts                          # Remotion entry point — registers Root
    Root.tsx                          # Composition registration (1920x1080, 30fps)
    Video.tsx                         # Main composition — TransitionSeries of all acts
    data/
      demo-data.ts                   # All hardcoded stylized marketplace data
    lib/
      fonts.ts                       # Google font loading (DM Sans, Fraunces, JetBrains Mono)
      constants.ts                   # Category colors, design tokens, shared values
      motion.ts                      # Reusable interpolation helpers (fadeIn, slideIn, scaleIn)
    components/
      NavBar.tsx                     # Simplified nav bar replica
      ServiceCard.tsx                # Service card replica
      Avatar.tsx                     # Avatar with optional frame cosmetic
      CategoryBadge.tsx              # Category pill badge
      StatusBadge.tsx                # Order status badge
      ProfileBadge.tsx               # Cosmetic profile badge
      StarRating.tsx                 # Star rating display
      DeviceFrame.tsx                # Laptop mockup frame wrapper
      ScreenGlow.tsx                 # Honey-gold edge glow effect for panels
      Camera3D.tsx                   # Perspective + transform wrapper for 3D camera motion
    screens/
      LandingPage.tsx               # Screen 1: Landing page (hero, counters, categories)
      DiscoverPage.tsx              # Screen 2: Discover marketplace with filters and cards
      ServiceDetailBooking.tsx      # Screen 3: Service detail flowing into booking
      Messaging.tsx                 # Screen 4: Two-pane messaging interface
      OrdersDisputes.tsx            # Screen 5: Order timeline + dispute panel
      Dashboard.tsx                 # Screen 6: User dashboard with stats grid
      LeaderboardBuzz.tsx           # Screen 7: Leaderboard table + buzz score
    acts/
      Act1Hook.tsx                  # Landing page with zoom-in reveal
      Act2Marketplace.tsx           # Discover + Service→Booking zoom-through
      Act3Infrastructure.tsx        # Messaging in device frame + Orders panels
      Act4Ecosystem.tsx             # Dashboard zoom-out + Leaderboard
      Act5Close.tsx                 # Accelerating zoom into final screen, cut to black
    styles/
      tailwind.css                  # @import "tailwindcss" + @theme with HiveFive tokens
  public/
    audio/
      ambient-score.mp3             # Background music track (sourced royalty-free)
  postcss.config.js                 # PostCSS config for Tailwind v4
  tailwind.config.ts                # Minimal — points to src/ for content scanning
```

---

## Task 1: Scaffold Remotion project with Tailwind

**Files:**
- Create: `video/package.json`
- Create: `video/tsconfig.json`
- Create: `video/src/index.ts`
- Create: `video/src/Root.tsx`
- Create: `video/src/Video.tsx`
- Create: `video/src/styles/tailwind.css`
- Create: `video/postcss.config.js`
- Create: `video/tailwind.config.ts`

- [ ] **Step 1: Create the video directory and initialize the Remotion project**

```bash
cd "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive"
mkdir -p video
cd video
npm init -y
```

- [ ] **Step 2: Install Remotion and dependencies**

```bash
cd "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive/video"
npm i remotion @remotion/cli @remotion/transitions @remotion/media @remotion/google-fonts react react-dom
npm i -D @types/react @types/react-dom typescript @remotion/tailwind tailwindcss @tailwindcss/postcss postcss
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create postcss.config.js for Tailwind v4**

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Create tailwind.config.ts**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
```

- [ ] **Step 6: Create video/src/styles/tailwind.css with HiveFive design tokens**

This file mirrors the main app's `src/styles/globals.css` design system. All color, font, radius, and shadow tokens are replicated so Tailwind utility classes produce identical output.

```css
@import "tailwindcss";

@theme inline {
  --color-honey-50: #FEF9EE;
  --color-honey-100: #FDF0D5;
  --color-honey-200: #FBE0AA;
  --color-honey-300: #F8CB74;
  --color-honey-400: #F5B540;
  --color-honey-500: #E9A020;
  --color-honey-600: #C47F14;
  --color-honey-700: #9A5F10;
  --color-honey-800: #6E430E;
  --color-honey-900: #47290A;

  --color-charcoal-50: #F6F6F5;
  --color-charcoal-100: #ECEAE8;
  --color-charcoal-200: #D6D4D0;
  --color-charcoal-300: #BFBCB6;
  --color-charcoal-400: #8C887F;
  --color-charcoal-500: #5C584F;
  --color-charcoal-600: #403D37;
  --color-charcoal-700: #2D2B27;
  --color-charcoal-800: #1E1D1A;
  --color-charcoal-900: #131210;

  --color-cream-50: #FEFDFB;
  --color-cream-100: #FDFBF5;
  --color-cream-200: #FAF6EA;
  --color-cream-300: #F6F1DD;
  --color-cream-400: #F1EBD0;
  --color-cream-500: #E8E0B8;

  --font-family-display: "Fraunces", Georgia, serif;
  --font-family-sans: "DM Sans", "Helvetica Neue", sans-serif;
  --font-family-mono: "JetBrains Mono", "Courier New", monospace;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}
```

- [ ] **Step 7: Create the Remotion entry point at video/src/index.ts**

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

- [ ] **Step 8: Create video/src/Root.tsx with composition registration**

30fps, 1920x1080, 4 minutes = 7200 frames.

```tsx
import { Composition } from "remotion";
import { HiveFiveDemo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HiveFiveDemo"
      component={HiveFiveDemo}
      durationInFrames={7200}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

- [ ] **Step 9: Create a minimal video/src/Video.tsx placeholder**

```tsx
import { AbsoluteFill } from "remotion";

export const HiveFiveDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#E9A020",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 48,
        }}
      >
        HiveFive Demo
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 10: Add scripts to video/package.json**

Update the `scripts` section:

```json
{
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "render": "remotion render src/index.ts HiveFiveDemo out/demo.mp4",
    "build": "remotion render src/index.ts HiveFiveDemo out/demo.mp4 --codec h264"
  }
}
```

- [ ] **Step 11: Verify the project boots**

```bash
cd "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive/video"
npx remotion studio src/index.ts
```

Expected: Remotion Studio opens in browser showing "HiveFiveDemo" composition with golden text on black.

- [ ] **Step 12: Commit**

```bash
git add video/
git commit -m "Scaffold Remotion video project with Tailwind and HiveFive design tokens"
```

---

## Task 2: Fonts, constants, and motion helpers

**Files:**
- Create: `video/src/lib/fonts.ts`
- Create: `video/src/lib/constants.ts`
- Create: `video/src/lib/motion.ts`

- [ ] **Step 1: Create video/src/lib/fonts.ts**

Load the three HiveFive brand fonts using `@remotion/google-fonts`.

```ts
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: fontSans } = loadDMSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

const { fontFamily: fontDisplay } = loadFraunces("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

const { fontFamily: fontMono } = loadJetBrainsMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export { fontSans, fontDisplay, fontMono };
```

- [ ] **Step 2: Create video/src/lib/constants.ts**

All category colors and shared design tokens.

```ts
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Beauty: { bg: "#FDF2F8", text: "#BE185D" },
  Career: { bg: "#F0FDF4", text: "#15803D" },
  Coaching: { bg: "#EEF2FF", text: "#4338CA" },
  Coding: { bg: "#EFF6FF", text: "#1D4ED8" },
  Consulting: { bg: "#F0F9FF", text: "#0369A1" },
  Cooking: { bg: "#FEF2F2", text: "#B91C1C" },
  Design: { bg: "#FFF7ED", text: "#C2410C" },
  Errands: { bg: "#F5F5F4", text: "#57534E" },
  Events: { bg: "#FEFCE8", text: "#854D0E" },
  Fitness: { bg: "#FFF1F2", text: "#BE123C" },
  Language: { bg: "#ECFEFF", text: "#0E7490" },
  Moving: { bg: "#F7FEE7", text: "#4D7C0F" },
  Music: { bg: "#FEF3C7", text: "#B45309" },
  "Pet Care": { bg: "#FFF7ED", text: "#9A3412" },
  Photography: { bg: "#F5F3FF", text: "#6D28D9" },
  Rides: { bg: "#F0FDFA", text: "#0F766E" },
  "Tech Support": { bg: "#F1F5F9", text: "#475569" },
  Tutoring: { bg: "#FFFBEB", text: "#92400E" },
  Video: { bg: "#FAF5FF", text: "#7E22CE" },
  Writing: { bg: "#ECFDF5", text: "#047857" },
  Other: { bg: "#F4F4F5", text: "#52525B" },
};

export const HONEY = {
  50: "#FEF9EE",
  100: "#FDF0D5",
  200: "#FBE0AA",
  300: "#F8CB74",
  400: "#F5B540",
  500: "#E9A020",
  600: "#C47F14",
  700: "#9A5F10",
  800: "#6E430E",
  900: "#47290A",
} as const;

export const CHARCOAL = {
  50: "#F6F6F5",
  100: "#ECEAE8",
  200: "#D6D4D0",
  300: "#BFBCB6",
  400: "#8C887F",
  500: "#5C584F",
  600: "#403D37",
  700: "#2D2B27",
  800: "#1E1D1A",
  900: "#131210",
} as const;

export const CREAM = {
  50: "#FEFDFB",
  100: "#FDFBF5",
  200: "#FAF6EA",
} as const;

export const SEMANTIC = {
  success: "#348B5A",
  warning: "#D4882A",
  error: "#C93B3B",
  info: "#3478B8",
} as const;
```

- [ ] **Step 3: Create video/src/lib/motion.ts**

Reusable animation primitives built on Remotion's `interpolate` and `spring`.

```ts
import { interpolate, spring, Easing } from "remotion";

type SpringConfig = {
  frame: number;
  fps: number;
  delay?: number;
  durationInFrames?: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
};

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

export function scaleIn({ frame, fps, delay = 0, config = { damping: 200 } }: SpringConfig): number {
  return spring({ frame, fps, delay, config });
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
```

- [ ] **Step 4: Verify fonts load by updating Video.tsx temporarily**

```tsx
import { AbsoluteFill } from "remotion";
import { fontSans, fontDisplay, fontMono } from "./lib/fonts";

export const HiveFiveDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20 }}>
        <div style={{ fontFamily: fontSans, color: "#FEFDFB", fontSize: 48 }}>DM Sans</div>
        <div style={{ fontFamily: fontDisplay, fontStyle: "italic", color: "#E9A020", fontSize: 48 }}>Fraunces Italic</div>
        <div style={{ fontFamily: fontMono, color: "#8C887F", fontSize: 36 }}>JetBrains Mono</div>
      </div>
    </AbsoluteFill>
  );
};
```

Run `npm run studio` in the `video/` directory. Expected: three lines of text each in the correct font.

- [ ] **Step 5: Commit**

```bash
git add video/src/lib/
git commit -m "Add font loading, design token constants, and motion interpolation helpers"
```

---

## Task 3: Shared UI components

**Files:**
- Create: `video/src/components/Camera3D.tsx`
- Create: `video/src/components/ScreenGlow.tsx`
- Create: `video/src/components/DeviceFrame.tsx`
- Create: `video/src/components/NavBar.tsx`
- Create: `video/src/components/Avatar.tsx`
- Create: `video/src/components/CategoryBadge.tsx`
- Create: `video/src/components/StatusBadge.tsx`
- Create: `video/src/components/ProfileBadge.tsx`
- Create: `video/src/components/StarRating.tsx`
- Create: `video/src/components/ServiceCard.tsx`

- [ ] **Step 1: Create Camera3D.tsx — 3D perspective wrapper**

This component wraps children in a CSS 3D perspective container and applies animated transforms (rotation, translation, scale) driven by Remotion frames. It is the "camera rig" for all 3D motion.

```tsx
import React from "react";

type Camera3DProps = {
  perspective?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  scale?: number;
  children: React.ReactNode;
};

export const Camera3D: React.FC<Camera3DProps> = ({
  perspective = 1200,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  scale = 1,
  children,
}) => {
  return (
    <div
      style={{
        perspective,
        perspectiveOrigin: "50% 50%",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `
            translateX(${translateX}px)
            translateY(${translateY}px)
            translateZ(${translateZ}px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            rotateZ(${rotateZ}deg)
            scale(${scale})
          `,
        }}
      >
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create ScreenGlow.tsx — honey-gold ambient glow**

Wraps a screen panel with a subtle glow on AMOLED black.

```tsx
import React from "react";

type ScreenGlowProps = {
  intensity?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const ScreenGlow: React.FC<ScreenGlowProps> = ({
  intensity = 1,
  children,
  style,
}) => {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        boxShadow: `
          0 0 ${40 * intensity}px rgba(233, 160, 32, ${0.15 * intensity}),
          0 0 ${80 * intensity}px rgba(233, 160, 32, ${0.06 * intensity})
        `,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
```

- [ ] **Step 3: Create DeviceFrame.tsx — laptop mockup wrapper**

A minimal, clean laptop bezel that frames a screen component.

```tsx
import React from "react";

type DeviceFrameProps = {
  width?: number;
  height?: number;
  children: React.ReactNode;
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  width = 1280,
  height = 800,
  children,
}) => {
  const bezelPadding = 16;
  const topBarHeight = 32;

  return (
    <div
      style={{
        width: width + bezelPadding * 2,
        borderRadius: 16,
        overflow: "hidden",
        background: "linear-gradient(180deg, #2D2B27 0%, #1E1D1A 100%)",
        padding: bezelPadding,
        boxShadow: "0 24px 56px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          height: topBarHeight,
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: 8,
          paddingBottom: 8,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#C93B3B" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D4882A" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#348B5A" }} />
      </div>
      <div
        style={{
          width,
          height,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create NavBar.tsx — simplified replica**

A static, non-interactive navbar that matches the visual appearance of HiveFive's logged-in nav.

```tsx
import React from "react";
import { fontSans, fontDisplay } from "../lib/fonts";

type NavBarProps = {
  activeLink?: string;
  balance?: number;
  notificationCount?: number;
  avatarInitial?: string;
};

export const NavBar: React.FC<NavBarProps> = ({
  activeLink = "Discover",
  balance = 2450,
  notificationCount = 3,
  avatarInitial = "S",
}) => {
  const links = ["Discover", "Dashboard", "Messages", "Orders"];

  return (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 64,
        paddingRight: 64,
        backgroundColor: "rgba(254,253,251,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #ECEAE8",
        fontFamily: fontSans,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: "#E9A020",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#131210",
          }}
        >
          H
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#131210", letterSpacing: "-0.01em" }}>
          hive
          <span style={{ fontFamily: fontDisplay, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: "#C47F14" }}>
            five
          </span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 32 }}>
        {links.map((link) => (
          <div
            key={link}
            style={{
              fontSize: 14,
              fontWeight: link === activeLink ? 700 : 400,
              color: link === activeLink ? "#131210" : "#5C584F",
              position: "relative",
              paddingBottom: 17,
            }}
          >
            {link}
            {link === activeLink && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: "#E9A020",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 20, height: 20, color: "#5C584F", fontSize: 18 }}>🔔</div>
          {notificationCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#E9A020",
              }}
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 13,
            fontWeight: 500,
            color: "#131210",
          }}
        >
          ⬡ {balance.toLocaleString()}
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FBE0AA, #F8CB74)",
            border: "2px solid #F5B540",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#6E430E",
          }}
        >
          {avatarInitial}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Create Avatar.tsx**

Simplified version of the main app's Avatar with optional cosmetic frame ring.

```tsx
import React from "react";

type AvatarProps = {
  size?: number;
  initial: string;
  src?: string;
  frameGradient?: string;
  frameGlow?: string;
  online?: boolean;
};

export const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  initial,
  src,
  frameGradient,
  frameGlow,
  online,
}) => {
  const ringPad = frameGradient ? 4 : 0;
  const outerSize = size + ringPad * 2;

  return (
    <div style={{ width: outerSize, height: outerSize, position: "relative", flexShrink: 0 }}>
      {frameGradient && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: outerSize,
            height: outerSize,
            borderRadius: "50%",
            background: frameGradient,
            boxShadow: frameGlow ? `0 0 12px ${frameGlow}` : undefined,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: ringPad,
          left: ringPad,
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          border: frameGradient ? "none" : "2px solid #F5B540",
        }}
      >
        {src ? (
          <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #FBE0AA, #F8CB74)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: size * 0.38,
              fontWeight: 700,
              color: "#6E430E",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {initial}
          </div>
        )}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: ringPad,
            right: ringPad,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: "50%",
            backgroundColor: "#348B5A",
            border: "2px solid #FEFDFB",
          }}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 6: Create CategoryBadge.tsx**

```tsx
import React from "react";
import { CATEGORY_COLORS } from "../lib/constants";

type CategoryBadgeProps = { category: string };

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderRadius: 9999,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 2,
        paddingBottom: 2,
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {category}
    </span>
  );
};
```

- [ ] **Step 7: Create StatusBadge.tsx**

```tsx
import React from "react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Pending: { bg: "#F6F6F5", text: "#403D37", border: "#D6D4D0" },
  "In Progress": { bg: "#FEF9EE", text: "#6E430E", border: "#FBE0AA" },
  "Awaiting Confirmation": { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Completed: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  Cancelled: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  Disputed: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
};

type StatusBadgeProps = { status: string };

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "DM Sans, sans-serif",
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 9999,
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
};
```

- [ ] **Step 8: Create ProfileBadge.tsx**

```tsx
import React from "react";

type ProfileBadgeProps = {
  tag: string;
  bgColor: string;
  textColor: string;
  bgGradient?: string;
};

export const ProfileBadge: React.FC<ProfileBadgeProps> = ({
  tag,
  bgColor,
  textColor,
  bgGradient,
}) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "JetBrains Mono, monospace",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        background: bgGradient ?? bgColor,
        color: textColor,
      }}
    >
      {tag}
    </span>
  );
};
```

- [ ] **Step 9: Create StarRating.tsx**

```tsx
import React from "react";

type StarRatingProps = {
  rating: number;
  size?: number;
};

export const StarRating: React.FC<StarRatingProps> = ({ rating, size = 14 }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} style={{ color: "#E9A020", fontSize: size }}>★</span>
      ))}
      {hasHalf && <span style={{ color: "#E9A020", fontSize: size }}>★</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} style={{ color: "#D6D4D0", fontSize: size }}>★</span>
      ))}
    </div>
  );
};
```

- [ ] **Step 10: Create ServiceCard.tsx**

```tsx
import React from "react";
import { CategoryBadge } from "./CategoryBadge";
import { StarRating } from "./StarRating";
import { Avatar } from "./Avatar";
import { fontSans, fontMono } from "../lib/fonts";

type ServiceCardProps = {
  title: string;
  category: string;
  providerName: string;
  providerInitial: string;
  price: number;
  priceUnit?: string;
  rating: number;
  reviewCount: number;
  imageColor?: string;
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  category,
  providerName,
  providerInitial,
  price,
  priceUnit = "flat",
  rating,
  reviewCount,
  imageColor = "#ECEAE8",
}) => {
  return (
    <div
      style={{
        backgroundColor: "#FEFDFB",
        border: "1px solid #ECEAE8",
        borderRadius: 8,
        overflow: "hidden",
        width: 280,
      }}
    >
      <div
        style={{
          height: 144,
          background: `linear-gradient(135deg, ${imageColor}, #F6F6F5)`,
        }}
      />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <CategoryBadge category={category} />
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 13,
              fontWeight: 500,
              color: "#131210",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            ⬡ {price}
            {priceUnit === "hourly" && <span style={{ fontSize: 11, color: "#8C887F" }}>/hr</span>}
          </span>
        </div>
        <div
          style={{
            fontFamily: fontSans,
            fontWeight: 700,
            fontSize: 15,
            color: "#131210",
            lineHeight: "1.3",
            marginBottom: 6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 12,
            color: "#8C887F",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Avatar size={18} initial={providerInitial} />
          {providerName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating rating={rating} size={12} />
          <span style={{ fontFamily: fontMono, fontSize: 11, color: "#8C887F" }}>
            {rating.toFixed(1)} ({reviewCount})
          </span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 11: Verify components render in studio**

Temporarily update `Video.tsx` to render a `NavBar` and a row of `ServiceCard` components on a cream background. Run `npm run studio`. Expected: components match the HiveFive visual style.

- [ ] **Step 12: Commit**

```bash
git add video/src/components/
git commit -m "Add shared UI components: Camera3D, DeviceFrame, NavBar, ServiceCard, Avatar, badges"
```

---

## Task 4: Demo data

**Files:**
- Create: `video/src/data/demo-data.ts`

- [ ] **Step 1: Create the full stylized demo dataset**

All data is crafted for peak marketplace appearance. Provider names are diverse and realistic. Ratings are in the 4.2-4.9 range (not all 5.0). Stats show healthy activity.

```ts
export type DemoService = {
  id: number;
  title: string;
  category: string;
  providerName: string;
  providerInitial: string;
  price: number;
  priceUnit: "flat" | "hourly" | "custom";
  rating: number;
  reviewCount: number;
  imageColor: string;
};

export type DemoMessage = {
  sender: "provider" | "client";
  text: string;
  time: string;
  isImage?: boolean;
  isLink?: boolean;
  linkTitle?: string;
  linkDomain?: string;
};

export type DemoOrderEvent = {
  status: string;
  label: string;
  time: string;
};

export type DemoLeaderboardEntry = {
  rank: number;
  name: string;
  initial: string;
  username: string;
  buzzScore: number;
  rating: number;
  reviewCount: number;
  ordersCompleted: number;
  frameGradient?: string;
  frameGlow?: string;
  badgeTag?: string;
  badgeBg?: string;
  badgeText?: string;
};

export const DEMO_SERVICES: DemoService[] = [
  { id: 1, title: "Full-Stack Web App Development", category: "Coding", providerName: "Marcus Rivera", providerInitial: "M", price: 120, priceUnit: "hourly", rating: 4.9, reviewCount: 47, imageColor: "#DBEAFE" },
  { id: 2, title: "Resume & Cover Letter Polish", category: "Career", providerName: "Aisha Patel", providerInitial: "A", price: 35, priceUnit: "flat", rating: 4.8, reviewCount: 82, imageColor: "#DCFCE7" },
  { id: 3, title: "Portrait Photography Session", category: "Photography", providerName: "Elena Kovacs", providerInitial: "E", price: 75, priceUnit: "flat", rating: 4.7, reviewCount: 31, imageColor: "#EDE9FE" },
  { id: 4, title: "Organic Chemistry Tutoring", category: "Tutoring", providerName: "David Chen", providerInitial: "D", price: 40, priceUnit: "hourly", rating: 4.9, reviewCount: 96, imageColor: "#FEF3C7" },
  { id: 5, title: "Personal Training & Meal Plans", category: "Fitness", providerName: "Jordan Williams", providerInitial: "J", price: 50, priceUnit: "hourly", rating: 4.6, reviewCount: 23, imageColor: "#FFE4E6" },
  { id: 6, title: "Logo & Brand Identity Design", category: "Design", providerName: "Priya Nair", providerInitial: "P", price: 200, priceUnit: "flat", rating: 4.8, reviewCount: 54, imageColor: "#FFEDD5" },
  { id: 7, title: "Spanish Conversation Practice", category: "Language", providerName: "Sofia Gutierrez", providerInitial: "S", price: 25, priceUnit: "hourly", rating: 4.5, reviewCount: 18, imageColor: "#CFFAFE" },
  { id: 8, title: "Event Photography & Videography", category: "Events", providerName: "Tyler Brooks", providerInitial: "T", price: 150, priceUnit: "flat", rating: 4.7, reviewCount: 29, imageColor: "#FEF9C3" },
  { id: 9, title: "Python & Data Science Help", category: "Coding", providerName: "Mei Zhang", providerInitial: "M", price: 55, priceUnit: "hourly", rating: 4.8, reviewCount: 61, imageColor: "#DBEAFE" },
  { id: 10, title: "Moving & Furniture Assembly", category: "Moving", providerName: "Andre Jackson", providerInitial: "A", price: 30, priceUnit: "hourly", rating: 4.4, reviewCount: 37, imageColor: "#ECFCCB" },
  { id: 11, title: "Piano Lessons for Beginners", category: "Music", providerName: "Clara Reyes", providerInitial: "C", price: 45, priceUnit: "hourly", rating: 4.7, reviewCount: 14, imageColor: "#FEF3C7" },
  { id: 12, title: "Dog Walking & Pet Sitting", category: "Pet Care", providerName: "Noah Kim", providerInitial: "N", price: 20, priceUnit: "flat", rating: 4.6, reviewCount: 42, imageColor: "#FFEDD5" },
];

export const DEMO_SERVICE_DETAIL = {
  ...DEMO_SERVICES[0],
  description: "I build production-ready web applications from concept to deployment. React, Next.js, Node, PostgreSQL — the full stack. Clean code, tested, documented.",
  included: [
    "Initial consultation & requirements review",
    "UI/UX wireframes and component architecture",
    "Full frontend + backend implementation",
    "Database design and API development",
    "Deployment to your preferred platform",
    "2 weeks of post-launch bug fixes",
  ],
  reviews: [
    { name: "Liam O'Brien", initial: "L", rating: 5, text: "Marcus built my entire capstone project backend in a weekend. Absolute legend.", date: "Mar 2026" },
    { name: "Fatima Al-Hassan", initial: "F", rating: 5, text: "Clean code, great communication, delivered ahead of schedule.", date: "Feb 2026" },
    { name: "Jake Morrison", initial: "J", rating: 4, text: "Solid work on the API. Would hire again for the next sprint.", date: "Feb 2026" },
  ],
  providerBio: "CS senior at UB. 3 years freelancing. I ship fast and I ship clean.",
  providerRating: 4.9,
  providerReviewCount: 47,
  providerResponseTime: "~2 hours",
  university: "University at Buffalo",
};

export const DEMO_BOOKING = {
  serviceTitle: "Full-Stack Web App Development",
  providerName: "Marcus Rivera",
  basePrice: 120,
  quantity: 10,
  unit: "hours",
  serviceFee: 60,
  total: 1260,
  scheduledDate: "Apr 15, 2026",
  scheduledTime: "2:00 PM",
  balance: 2450,
};

export const DEMO_MESSAGES: DemoMessage[] = [
  { sender: "client", text: "Hey Marcus! I saw your service listing — I need help building a marketplace app for my startup. Is that something you can take on?", time: "10:23 AM" },
  { sender: "provider", text: "Absolutely! I've built a few marketplace projects before. What's the scope — do you have wireframes or a spec doc?", time: "10:25 AM" },
  { sender: "client", text: "Yeah, here's the Figma link. It's a peer-to-peer tutoring platform with scheduling and payments.", time: "10:27 AM", isLink: true, linkTitle: "TutorMatch — Figma Wireframes", linkDomain: "figma.com" },
  { sender: "provider", text: "This is really well thought out. I can definitely build this. Let me put together a timeline — thinking 10 hours total across 2 weeks.", time: "10:31 AM" },
  { sender: "client", text: "That works! I'll go ahead and book you.", time: "10:32 AM" },
];

export const DEMO_ORDER_EVENTS: DemoOrderEvent[] = [
  { status: "booked", label: "Order placed", time: "Apr 10, 2:15 PM" },
  { status: "accepted", label: "Provider accepted", time: "Apr 10, 2:18 PM" },
  { status: "in_progress", label: "Work started", time: "Apr 11, 9:00 AM" },
  { status: "completed", label: "Marked complete", time: "Apr 18, 4:30 PM" },
];

export const DEMO_DISPUTE = {
  reason: "Incomplete deliverables",
  description: "The API endpoints were not fully tested and 2 of the 6 agreed features were missing documentation.",
  proposedSplit: { provider: 60, client: 40 },
  status: "Settlement Proposed",
};

export const DEMO_DASHBOARD_STATS = {
  totalEarnings: 2450,
  completedOrders: 12,
  currentBalance: 1820,
  activeOrders: 3,
  pendingCount: 1,
  inProgressCount: 2,
  awaitingCount: 0,
  averageRating: 4.8,
  servicesOffered: 4,
  responseTime: "~2 hrs",
};

export const DEMO_DASHBOARD_ORDERS = [
  { id: 101, title: "Full-Stack Web App Development", otherParty: "Liam O'Brien", role: "seller" as const, status: "In Progress", price: 1200, scheduledDate: "Apr 15" },
  { id: 102, title: "Resume & Cover Letter Polish", otherParty: "Nina Vasquez", role: "seller" as const, status: "Pending", price: 35, scheduledDate: "Apr 12" },
  { id: 103, title: "Python & Data Science Help", otherParty: "Mei Zhang", role: "buyer" as const, status: "In Progress", price: 165, scheduledDate: "Apr 14" },
];

export const DEMO_LEADERBOARD: DemoLeaderboardEntry[] = [
  { rank: 1, name: "Marcus Rivera", initial: "M", username: "marcusdev", buzzScore: 9420, rating: 4.9, reviewCount: 47, ordersCompleted: 52, frameGradient: "linear-gradient(135deg, #F5B540, #E9A020, #C47F14)", frameGlow: "rgba(233,160,32,0.5)", badgeTag: "TOP PROVIDER", badgeBg: "#131210", badgeText: "#E9A020" },
  { rank: 2, name: "Aisha Patel", initial: "A", username: "aishawrites", buzzScore: 8710, rating: 4.8, reviewCount: 82, ordersCompleted: 45, frameGradient: "linear-gradient(135deg, #C0C0C0, #A0A0A0)", frameGlow: "rgba(192,192,192,0.3)" },
  { rank: 3, name: "David Chen", initial: "D", username: "dchem", buzzScore: 8340, rating: 4.9, reviewCount: 96, ordersCompleted: 41, frameGradient: "linear-gradient(135deg, #F97316, #EA580C)", frameGlow: "rgba(249,115,22,0.3)" },
  { rank: 4, name: "Priya Nair", initial: "P", username: "priyadesigns", buzzScore: 7890, rating: 4.8, reviewCount: 54, ordersCompleted: 38 },
  { rank: 5, name: "Elena Kovacs", initial: "E", username: "elenashots", buzzScore: 7420, rating: 4.7, reviewCount: 31, ordersCompleted: 34 },
  { rank: 6, name: "Jordan Williams", initial: "J", username: "jfitness", buzzScore: 6980, rating: 4.6, reviewCount: 23, ordersCompleted: 29 },
  { rank: 7, name: "Mei Zhang", initial: "M", username: "meidata", buzzScore: 6540, rating: 4.8, reviewCount: 61, ordersCompleted: 27 },
  { rank: 8, name: "Tyler Brooks", initial: "T", username: "tylerfilms", buzzScore: 6120, rating: 4.7, reviewCount: 29, ordersCompleted: 24 },
  { rank: 9, name: "Sofia Gutierrez", initial: "S", username: "sofialang", buzzScore: 5680, rating: 4.5, reviewCount: 18, ordersCompleted: 21 },
  { rank: 10, name: "Andre Jackson", initial: "A", username: "andremoves", buzzScore: 5210, rating: 4.4, reviewCount: 37, ordersCompleted: 19 },
];

export const DEMO_BUZZ_BREAKDOWN = {
  ordersCompleted: { label: "Orders Completed", value: 52, max: 60, weight: "30%" },
  reviewScore: { label: "Review Score", value: 4.9, max: 5.0, weight: "25%" },
  responseTime: { label: "Response Time", value: "~2 hrs", weight: "20%" },
  engagement: { label: "Community Engagement", value: "High", weight: "15%" },
  serviceQuality: { label: "Service Quality", value: "Excellent", weight: "10%" },
};

export const LANDING_STATS = {
  services: 847,
  providers: 312,
  universities: 24,
  transactions: 3218,
};

export const LANDING_CATEGORIES = [
  "Coding", "Tutoring", "Design", "Photography", "Fitness",
  "Music", "Writing", "Career", "Language", "Events",
  "Moving", "Cooking", "Pet Care", "Video", "Tech Support",
];
```

- [ ] **Step 2: Commit**

```bash
git add video/src/data/
git commit -m "Add stylized demo data for all 7 video screens"
```

---

## Task 5: Screen components — Landing, Discover, ServiceDetailBooking

**Files:**
- Create: `video/src/screens/LandingPage.tsx`
- Create: `video/src/screens/DiscoverPage.tsx`
- Create: `video/src/screens/ServiceDetailBooking.tsx`

- [ ] **Step 1: Create LandingPage.tsx**

A static replica of the landing page's key visual sections: dark hero with logo and glowing title, stat counters, and category grid. No Three.js — the hero is replicated with CSS gradients and radial glows.

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { LANDING_STATS, LANDING_CATEGORIES } from "../data/demo-data";
import { CATEGORY_COLORS } from "../lib/constants";
import { countUp } from "../lib/motion";

export const LandingPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ width: 1920, height: 3200, backgroundColor: "#050505", position: "relative", overflow: "hidden" }}>
      {/* Ambient hex glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233,160,32,0.08) 0%, transparent 70%)",
          transform: "translateX(-50%)",
        }}
      />

      {/* Hero section */}
      <div
        style={{
          height: 1080,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "#E9A020",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: fontSans,
              color: "#131210",
            }}
          >
            H
          </div>
          <span
            style={{
              fontFamily: fontSans,
              fontWeight: 700,
              fontSize: 36,
              color: "#FDF0D5",
              letterSpacing: "-0.01em",
            }}
          >
            hive
            <span style={{ fontFamily: fontDisplay, fontStyle: "italic", fontWeight: 400, fontSize: 40, color: "#F5B540" }}>
              five
            </span>
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: fontDisplay,
            fontStyle: "italic",
            fontSize: 72,
            color: "#FDF0D5",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Your campus marketplace
        </h1>
        <p
          style={{
            fontFamily: fontSans,
            fontSize: 22,
            color: "#8C887F",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          Buy and sell services with students you trust. Built-in payments, messaging, and reputation.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          <div
            style={{
              height: 52,
              paddingLeft: 32,
              paddingRight: 32,
              backgroundColor: "#E9A020",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              fontFamily: fontSans,
              fontWeight: 700,
              fontSize: 16,
              color: "#131210",
            }}
          >
            Get Started
          </div>
          <div
            style={{
              height: 52,
              paddingLeft: 32,
              paddingRight: 32,
              border: "1px solid #5C584F",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              fontFamily: fontSans,
              fontWeight: 500,
              fontSize: 16,
              color: "#FEFDFB",
            }}
          >
            Browse Services
          </div>
        </div>
      </div>

      {/* Stat counters */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 80,
          padding: "60px 0",
        }}
      >
        {[
          { label: "Services", value: LANDING_STATS.services },
          { label: "Providers", value: LANDING_STATS.providers },
          { label: "Universities", value: LANDING_STATS.universities },
          { label: "Transactions", value: LANDING_STATS.transactions },
        ].map((stat, i) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 48,
                fontWeight: 500,
                color: "#E9A020",
              }}
            >
              {countUp(frame, fps, stat.value, 1.5, i * 0.2).toLocaleString()}
            </div>
            <div
              style={{
                fontFamily: fontSans,
                fontSize: 14,
                color: "#8C887F",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginTop: 8,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Category grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          padding: "40px 120px",
        }}
      >
        {LANDING_CATEGORIES.map((cat) => {
          const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
          return (
            <div
              key={cat}
              style={{
                width: 160,
                height: 80,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fontSans,
                fontWeight: 600,
                fontSize: 14,
                color: colors.text,
              }}
            >
              {cat}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create DiscoverPage.tsx**

Replica of the Discover page with filters, tab bar, and a grid of service cards.

```tsx
import React from "react";
import { fontSans, fontDisplay } from "../lib/fonts";
import { NavBar } from "../components/NavBar";
import { ServiceCard } from "../components/ServiceCard";
import { DEMO_SERVICES } from "../data/demo-data";

export const DiscoverPage: React.FC = () => {
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: "#FEFDFB", overflow: "hidden" }}>
      <NavBar activeLink="Discover" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 64px" }}>
        {/* Title */}
        <h1 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 40, color: "#131210", marginBottom: 20 }}>
          Discover
        </h1>

        {/* Search bar */}
        <div style={{ display: "flex", marginBottom: 20 }}>
          <div
            style={{
              flex: 1,
              height: 44,
              border: "1.5px solid #D6D4D0",
              borderRight: "none",
              borderRadius: "8px 0 0 8px",
              paddingLeft: 16,
              display: "flex",
              alignItems: "center",
              fontFamily: fontSans,
              fontSize: 14,
              color: "#8C887F",
            }}
          >
            Search services...
          </div>
          <div
            style={{
              width: 80,
              height: 44,
              backgroundColor: "#E9A020",
              borderRadius: "0 8px 8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontSans,
              fontWeight: 700,
              fontSize: 14,
              color: "#131210",
            }}
          >
            Search
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#ECEAE8",
            borderRadius: 9999,
            padding: 4,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 9999,
              backgroundColor: "#E9A020",
              fontFamily: fontSans,
              fontWeight: 700,
              fontSize: 14,
              color: "#131210",
            }}
          >
            Services
          </div>
          <div
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 8,
              paddingBottom: 8,
              fontFamily: fontSans,
              fontSize: 14,
              color: "#5C584F",
            }}
          >
            Requests
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {["All Categories", "Any Price", "Sort: Newest"].map((filter) => (
            <div
              key={filter}
              style={{
                height: 36,
                paddingLeft: 14,
                paddingRight: 14,
                border: "1px solid #D6D4D0",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                fontFamily: fontSans,
                fontSize: 13,
                color: "#5C584F",
                backgroundColor: "#FEFDFB",
              }}
            >
              {filter} ▾
            </div>
          ))}
        </div>

        {/* Service grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {DEMO_SERVICES.slice(0, 9).map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create ServiceDetailBooking.tsx**

A two-part screen: the left half shows a service detail page, the right half (or lower section) shows the booking confirmation. These are rendered as one tall component so the camera can zoom through them.

```tsx
import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";
import { CategoryBadge } from "../components/CategoryBadge";
import { StarRating } from "../components/StarRating";
import { DEMO_SERVICE_DETAIL, DEMO_BOOKING } from "../data/demo-data";

export const ServiceDetailBooking: React.FC = () => {
  const s = DEMO_SERVICE_DETAIL;
  const b = DEMO_BOOKING;

  return (
    <div style={{ width: 1920, height: 2400, backgroundColor: "#FEFDFB", overflow: "hidden" }}>
      <NavBar activeLink="Discover" />

      {/* === Service Detail Section === */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 64px" }}>
        <div style={{ display: "flex", gap: 40 }}>
          {/* Left column */}
          <div style={{ flex: 1 }}>
            {/* Hero image placeholder */}
            <div
              style={{
                height: 320,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${s.imageColor}, #F6F6F5)`,
                marginBottom: 24,
              }}
            />
            <CategoryBadge category={s.category} />
            <h1 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 36, color: "#131210", margin: "12px 0" }}>
              {s.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <StarRating rating={s.rating} size={16} />
              <span style={{ fontFamily: fontMono, fontSize: 14, color: "#5C584F" }}>
                {s.rating} ({s.reviewCount} reviews)
              </span>
            </div>
            <p style={{ fontFamily: fontSans, fontSize: 16, color: "#403D37", lineHeight: 1.7, marginBottom: 32 }}>
              {s.description}
            </p>

            {/* What's included */}
            <h3 style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 18, color: "#131210", marginBottom: 12 }}>
              What's Included
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {s.included.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: fontSans,
                    fontSize: 15,
                    color: "#403D37",
                    padding: "8px 0",
                    borderBottom: "1px solid #ECEAE8",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#348B5A", fontSize: 16 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Reviews */}
            <h3 style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 18, color: "#131210", marginTop: 32, marginBottom: 16 }}>
              Reviews
            </h3>
            {s.reviews.map((review, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #ECEAE8",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Avatar size={32} initial={review.initial} />
                  <div>
                    <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210" }}>{review.name}</div>
                    <div style={{ fontFamily: fontSans, fontSize: 12, color: "#8C887F" }}>{review.date}</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}><StarRating rating={review.rating} size={12} /></div>
                </div>
                <p style={{ fontFamily: fontSans, fontSize: 14, color: "#403D37", lineHeight: 1.5, margin: 0 }}>
                  {review.text}
                </p>
              </div>
            ))}
          </div>

          {/* Right column — Provider card */}
          <div style={{ width: 360 }}>
            <div
              style={{
                border: "1px solid #ECEAE8",
                borderRadius: 14,
                padding: 24,
                backgroundColor: "#FEFDFB",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <Avatar size={56} initial={s.providerInitial} />
                <div>
                  <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 16, color: "#131210" }}>{s.providerName}</div>
                  <div style={{ fontFamily: fontSans, fontSize: 13, color: "#8C887F" }}>{s.university}</div>
                </div>
              </div>
              <p style={{ fontFamily: fontSans, fontSize: 14, color: "#5C584F", lineHeight: 1.5, marginBottom: 16 }}>
                {s.providerBio}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 18, color: "#131210" }}>{s.providerRating}</div>
                  <div style={{ fontFamily: fontSans, fontSize: 11, color: "#8C887F" }}>Rating</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 18, color: "#131210" }}>{s.providerReviewCount}</div>
                  <div style={{ fontFamily: fontSans, fontSize: 11, color: "#8C887F" }}>Reviews</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 18, color: "#131210" }}>{s.providerResponseTime}</div>
                  <div style={{ fontFamily: fontSans, fontSize: 11, color: "#8C887F" }}>Response</div>
                </div>
              </div>
              <div style={{ fontFamily: fontMono, fontSize: 28, fontWeight: 700, color: "#131210", textAlign: "center", marginBottom: 16 }}>
                ⬡ {s.price}<span style={{ fontSize: 16, color: "#8C887F", fontWeight: 400 }}>/hr</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 48,
                  backgroundColor: "#E9A020",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fontSans,
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#131210",
                }}
              >
                Book Now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === Booking Confirmation Section === */}
      <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 64px" }}>
        <div
          style={{
            border: "1px solid #ECEAE8",
            borderRadius: 14,
            padding: 32,
            backgroundColor: "#FEFDFB",
          }}
        >
          <h2 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 28, color: "#131210", marginBottom: 24 }}>
            Confirm Booking
          </h2>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #ECEAE8" }}>
            <span style={{ fontFamily: fontSans, fontSize: 14, color: "#5C584F" }}>Service</span>
            <span style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210" }}>{b.serviceTitle}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #ECEAE8" }}>
            <span style={{ fontFamily: fontSans, fontSize: 14, color: "#5C584F" }}>Date & Time</span>
            <span style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210" }}>{b.scheduledDate} at {b.scheduledTime}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #ECEAE8" }}>
            <span style={{ fontFamily: fontSans, fontSize: 14, color: "#5C584F" }}>{b.quantity} {b.unit} × ⬡ {b.basePrice}</span>
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 14, color: "#131210" }}>⬡ {b.basePrice * b.quantity}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #ECEAE8" }}>
            <span style={{ fontFamily: fontSans, fontSize: 14, color: "#5C584F" }}>Service fee (5%)</span>
            <span style={{ fontFamily: fontMono, fontSize: 14, color: "#8C887F" }}>⬡ {b.serviceFee}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", marginTop: 4 }}>
            <span style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 18, color: "#131210" }}>Total</span>
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 24, color: "#E9A020" }}>⬡ {b.total}</span>
          </div>
          <div style={{ fontFamily: fontMono, fontSize: 13, color: "#8C887F", textAlign: "center", marginBottom: 16 }}>
            Balance: ⬡ {b.balance.toLocaleString()} → ⬡ {(b.balance - b.total).toLocaleString()}
          </div>
          <div
            style={{
              width: "100%",
              height: 48,
              backgroundColor: "#E9A020",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontSans,
              fontWeight: 700,
              fontSize: 16,
              color: "#131210",
            }}
          >
            Confirm & Pay
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Verify in studio**

Update `Video.tsx` to render each screen sequentially wrapped in `<Sequence>` blocks. Run `npm run studio`. Expected: each screen is visually faithful to the main app.

- [ ] **Step 5: Commit**

```bash
git add video/src/screens/LandingPage.tsx video/src/screens/DiscoverPage.tsx video/src/screens/ServiceDetailBooking.tsx
git commit -m "Add screen replicas: Landing, Discover, ServiceDetail+Booking"
```

---

## Task 6: Screen components — Messaging, Orders, Dashboard, Leaderboard

**Files:**
- Create: `video/src/screens/Messaging.tsx`
- Create: `video/src/screens/OrdersDisputes.tsx`
- Create: `video/src/screens/Dashboard.tsx`
- Create: `video/src/screens/LeaderboardBuzz.tsx`

- [ ] **Step 1: Create Messaging.tsx**

Two-pane messaging interface: conversation list on left, active thread on right. Messages are static — the Act component will handle animating them in.

```tsx
import React from "react";
import { fontSans, fontMono } from "../lib/fonts";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";
import { DEMO_MESSAGES } from "../data/demo-data";

type MessagingProps = {
  visibleMessageCount?: number;
  showTyping?: boolean;
};

export const Messaging: React.FC<MessagingProps> = ({
  visibleMessageCount = DEMO_MESSAGES.length,
  showTyping = false,
}) => {
  const conversations = [
    { name: "Marcus Rivera", initial: "M", lastMessage: "I can definitely build this.", time: "10:31 AM", unread: true, online: true },
    { name: "Aisha Patel", initial: "A", lastMessage: "Thanks for the review!", time: "Yesterday", unread: false, online: false },
    { name: "Elena Kovacs", initial: "E", lastMessage: "Here are the edited photos.", time: "Monday", unread: false, online: true },
    { name: "David Chen", initial: "D", lastMessage: "Same time next week?", time: "Mar 28", unread: false, online: false },
  ];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: "#FEFDFB", overflow: "hidden" }}>
      <NavBar activeLink="Messages" />
      <div style={{ display: "flex", height: 1016 }}>
        {/* Conversation list */}
        <div style={{ width: 380, borderRight: "1px solid #ECEAE8", padding: "16px 0" }}>
          <div style={{ padding: "0 16px 12px", fontFamily: fontSans, fontWeight: 700, fontSize: 20, color: "#131210" }}>
            Messages
          </div>
          {conversations.map((conv, i) => (
            <div
              key={conv.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                backgroundColor: i === 0 ? "#FEF9EE" : "transparent",
                cursor: "pointer",
              }}
            >
              <Avatar size={44} initial={conv.initial} online={conv.online} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: fontSans, fontWeight: conv.unread ? 700 : 400, fontSize: 14, color: "#131210" }}>
                    {conv.name}
                  </span>
                  <span style={{ fontFamily: fontMono, fontSize: 11, color: "#8C887F" }}>{conv.time}</span>
                </div>
                <div style={{ fontFamily: fontSans, fontSize: 13, color: "#8C887F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {conv.lastMessage}
                </div>
              </div>
              {conv.unread && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E9A020", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Thread header */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 24px",
              borderBottom: "1px solid #ECEAE8",
            }}
          >
            <Avatar size={36} initial="M" online />
            <div>
              <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 15, color: "#131210" }}>Marcus Rivera</div>
              <div style={{ fontFamily: fontSans, fontSize: 12, color: "#348B5A" }}>Online</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                borderRadius: 8,
                backgroundColor: "#FEF9EE",
                fontFamily: fontSans,
                fontSize: 12,
                color: "#9A5F10",
                fontWeight: 600,
              }}
            >
              Re: Full-Stack Web App Development
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {DEMO_MESSAGES.slice(0, visibleMessageCount).map((msg, i) => {
              const isClient = msg.sender === "client";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isClient ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: 480,
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: isClient ? "#E9A020" : "#F6F6F5",
                      color: isClient ? "#131210" : "#131210",
                      fontFamily: fontSans,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.isLink ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>{msg.text}</div>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: isClient ? "rgba(0,0,0,0.08)" : "#FEFDFB",
                            border: isClient ? "none" : "1px solid #ECEAE8",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{msg.linkTitle}</div>
                          <div style={{ fontSize: 11, color: "#8C887F", marginTop: 2 }}>{msg.linkDomain}</div>
                        </div>
                      </div>
                    ) : (
                      msg.text
                    )}
                    <div
                      style={{
                        fontFamily: fontMono,
                        fontSize: 10,
                        color: isClient ? "rgba(0,0,0,0.4)" : "#BFBCB6",
                        textAlign: "right",
                        marginTop: 6,
                      }}
                    >
                      {msg.time} {isClient && "✓✓"}
                    </div>
                  </div>
                </div>
              );
            })}
            {showTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar size={24} initial="M" />
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: 14,
                    backgroundColor: "#F6F6F5",
                    fontFamily: fontSans,
                    fontSize: 14,
                    color: "#8C887F",
                  }}
                >
                  typing...
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 24px",
              borderTop: "1px solid #ECEAE8",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: "1px solid #D6D4D0",
                paddingLeft: 14,
                display: "flex",
                alignItems: "center",
                fontFamily: fontSans,
                fontSize: 14,
                color: "#BFBCB6",
              }}
            >
              Type a message...
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#E9A020",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "#131210",
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create OrdersDisputes.tsx**

Two visual panels: one showing a successful order timeline, one showing a dispute with settlement.

```tsx
import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";
import { StatusBadge } from "../components/StatusBadge";
import { DEMO_ORDER_EVENTS, DEMO_DISPUTE, DEMO_BOOKING } from "../data/demo-data";

export const OrdersDisputes: React.FC = () => {
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: "#FEFDFB", overflow: "hidden" }}>
      <NavBar activeLink="Orders" />
      <div style={{ display: "flex", gap: 32, maxWidth: 1200, margin: "0 auto", padding: "32px 64px" }}>
        {/* Happy path — completed order */}
        <div style={{ flex: 1, border: "1px solid #ECEAE8", borderRadius: 14, padding: 32, backgroundColor: "#FEFDFB" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 24, color: "#131210", margin: 0 }}>
              Order #1042
            </h2>
            <StatusBadge status="Completed" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Avatar size={40} initial="M" />
            <div>
              <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 15, color: "#131210" }}>Marcus Rivera</div>
              <div style={{ fontFamily: fontSans, fontSize: 13, color: "#8C887F" }}>Full-Stack Web App Development</div>
            </div>
            <div style={{ marginLeft: "auto", fontFamily: fontMono, fontWeight: 700, fontSize: 20, color: "#131210" }}>
              ⬡ {DEMO_BOOKING.total}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ paddingLeft: 20 }}>
            {DEMO_ORDER_EVENTS.map((event, i) => {
              const isLast = i === DEMO_ORDER_EVENTS.length - 1;
              const isCompleted = event.status === "completed";
              return (
                <div key={i} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: isLast ? 0 : 32 }}>
                  {/* Line */}
                  {!isLast && (
                    <div
                      style={{
                        position: "absolute",
                        left: 7,
                        top: 18,
                        width: 2,
                        height: "calc(100% - 18px)",
                        backgroundColor: isCompleted ? "#A7F3D0" : "#E9A020",
                      }}
                    />
                  )}
                  {/* Dot */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: isCompleted ? "#348B5A" : "#E9A020",
                      border: "3px solid #FEFDFB",
                      boxShadow: `0 0 0 2px ${isCompleted ? "#348B5A" : "#E9A020"}`,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210" }}>{event.label}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 12, color: "#8C887F" }}>{event.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispute panel */}
        <div style={{ flex: 1, border: "1px solid #ECEAE8", borderRadius: 14, padding: 32, backgroundColor: "#FEFDFB" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 24, color: "#131210", margin: 0 }}>
              Order #1038
            </h2>
            <StatusBadge status="Disputed" />
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              backgroundColor: "#FFF7ED",
              border: "1px solid #FED7AA",
              marginBottom: 24,
            }}
          >
            <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#C2410C", marginBottom: 4 }}>
              {DEMO_DISPUTE.reason}
            </div>
            <p style={{ fontFamily: fontSans, fontSize: 13, color: "#9A3412", lineHeight: 1.5, margin: 0 }}>
              {DEMO_DISPUTE.description}
            </p>
          </div>

          {/* Settlement proposal */}
          <h3 style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 16, color: "#131210", marginBottom: 16 }}>
            Settlement Proposal
          </h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, padding: 16, borderRadius: 10, backgroundColor: "#F6F6F5", textAlign: "center" }}>
              <div style={{ fontFamily: fontSans, fontSize: 12, color: "#8C887F", marginBottom: 4 }}>Provider receives</div>
              <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 24, color: "#131210" }}>60%</div>
              <div style={{ fontFamily: fontMono, fontSize: 14, color: "#5C584F" }}>⬡ 756</div>
            </div>
            <div style={{ flex: 1, padding: 16, borderRadius: 10, backgroundColor: "#F6F6F5", textAlign: "center" }}>
              <div style={{ fontFamily: fontSans, fontSize: 12, color: "#8C887F", marginBottom: 4 }}>Client receives</div>
              <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 24, color: "#131210" }}>40%</div>
              <div style={{ fontFamily: fontMono, fontSize: 14, color: "#5C584F" }}>⬡ 504</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                flex: 1,
                height: 44,
                backgroundColor: "#E9A020",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fontSans,
                fontWeight: 700,
                fontSize: 14,
                color: "#131210",
              }}
            >
              Accept Settlement
            </div>
            <div
              style={{
                flex: 1,
                height: 44,
                border: "1px solid #D6D4D0",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fontSans,
                fontWeight: 500,
                fontSize: 14,
                color: "#5C584F",
              }}
            >
              Decline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create Dashboard.tsx**

Replica of the user dashboard with 6 stat cards, active orders list, and quick actions.

```tsx
import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { NavBar } from "../components/NavBar";
import { StatusBadge } from "../components/StatusBadge";
import { DEMO_DASHBOARD_STATS, DEMO_DASHBOARD_ORDERS } from "../data/demo-data";

export const Dashboard: React.FC = () => {
  const stats = DEMO_DASHBOARD_STATS;

  const statCards = [
    { label: "Total Earnings", value: `⬡ ${stats.totalEarnings.toLocaleString()}`, sub: `${stats.completedOrders} completed orders`, iconBg: "#FDF0D5" },
    { label: "Current Balance", value: `⬡ ${stats.currentBalance.toLocaleString()}`, sub: "View wallet →", iconBg: "#DCFCE7" },
    { label: "Active Orders", value: String(stats.activeOrders), sub: `${stats.pendingCount} pending, ${stats.inProgressCount} in progress`, iconBg: "#DBEAFE" },
    { label: "Average Rating", value: `★ ${stats.averageRating}`, sub: "From verified reviews", iconBg: "#FEF3C7" },
    { label: "Services Offered", value: String(stats.servicesOffered), sub: "Post new service →", iconBg: "#EDE9FE" },
    { label: "Response Time", value: stats.responseTime, sub: "Average reply speed", iconBg: "#FFE4E6" },
  ];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: "#FEFDFB", overflow: "hidden" }}>
      <NavBar activeLink="Dashboard" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 64px" }}>
        <h1 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 40, color: "#131210", marginBottom: 8 }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: fontSans, fontSize: 16, color: "#8C887F", marginBottom: 24 }}>
          Welcome back, Sarah
        </p>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: "#FEFDFB",
                border: "1px solid #ECEAE8",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: card.iconBg,
                  marginBottom: 12,
                }}
              />
              <div style={{ fontFamily: fontSans, fontSize: 13, color: "#8C887F", marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 28, color: "#131210", marginBottom: 4 }}>
                {card.value}
              </div>
              <div style={{ fontFamily: fontSans, fontSize: 12, color: "#8C887F" }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Active orders */}
        <div
          style={{
            border: "1px solid #ECEAE8",
            borderRadius: 14,
            padding: 24,
            backgroundColor: "#FEFDFB",
          }}
        >
          <h2 style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 18, color: "#131210", marginBottom: 16 }}>
            Active Orders
          </h2>
          {DEMO_DASHBOARD_ORDERS.map((order) => (
            <div
              key={order.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 16,
                borderRadius: 10,
                border: "1px solid #ECEAE8",
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 15, color: "#131210" }}>{order.title}</div>
                <div style={{ fontFamily: fontSans, fontSize: 13, color: "#8C887F", marginTop: 2 }}>
                  {order.role === "seller" ? "Client" : "Provider"}: {order.otherParty} · {order.scheduledDate}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <StatusBadge status={order.status} />
                <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 15, color: "#131210" }}>
                  ⬡ {order.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create LeaderboardBuzz.tsx**

Leaderboard table with podium-style top 3 and a buzz score breakdown panel.

```tsx
import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";
import { ProfileBadge } from "../components/ProfileBadge";
import { DEMO_LEADERBOARD, DEMO_BUZZ_BREAKDOWN } from "../data/demo-data";

export const LeaderboardBuzz: React.FC = () => {
  const top3 = DEMO_LEADERBOARD.slice(0, 3);
  const rest = DEMO_LEADERBOARD.slice(3);

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: "#FEFDFB", overflow: "hidden" }}>
      <NavBar activeLink="Discover" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 64px" }}>
        <h1 style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 40, color: "#131210", marginBottom: 24 }}>
          Leaderboard
        </h1>

        <div style={{ display: "flex", gap: 32 }}>
          {/* Left: Rankings */}
          <div style={{ flex: 1 }}>
            {/* Podium */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24, alignItems: "end" }}>
              {/* 2nd place */}
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #D1D5DB, #9CA3AF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 20, fontWeight: 700, color: "white", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>2</div>
                <Avatar size={56} initial={top3[1].initial} frameGradient={top3[1].frameGradient} frameGlow={top3[1].frameGlow} />
                <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210", marginTop: 8 }}>{top3[1].name}</div>
                <div style={{ fontFamily: fontMono, fontSize: 12, color: "#E9A020", fontWeight: 700 }}>⚡ {top3[1].buzzScore.toLocaleString()}</div>
              </div>
              {/* 1st place */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #FBBF24, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 22, fontWeight: 700, color: "white", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>1</div>
                <Avatar size={80} initial={top3[0].initial} frameGradient={top3[0].frameGradient} frameGlow={top3[0].frameGlow} />
                <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 16, color: "#131210", marginTop: 8 }}>{top3[0].name}</div>
                {top3[0].badgeTag && <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}><ProfileBadge tag={top3[0].badgeTag} bgColor={top3[0].badgeBg!} textColor={top3[0].badgeText!} /></div>}
                <div style={{ fontFamily: fontMono, fontSize: 14, color: "#E9A020", fontWeight: 700, marginTop: 4 }}>⚡ {top3[0].buzzScore.toLocaleString()}</div>
              </div>
              {/* 3rd place */}
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #FB923C, #EA580C)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 20, fontWeight: 700, color: "white", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>3</div>
                <Avatar size={56} initial={top3[2].initial} frameGradient={top3[2].frameGradient} frameGlow={top3[2].frameGlow} />
                <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210", marginTop: 8 }}>{top3[2].name}</div>
                <div style={{ fontFamily: fontMono, fontSize: 12, color: "#E9A020", fontWeight: 700 }}>⚡ {top3[2].buzzScore.toLocaleString()}</div>
              </div>
            </div>

            {/* Rankings table */}
            <div style={{ border: "1px solid #ECEAE8", borderRadius: 14, overflow: "hidden" }}>
              {rest.map((entry) => (
                <div
                  key={entry.rank}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 20px",
                    borderBottom: "1px solid #ECEAE8",
                  }}
                >
                  <div style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 20, color: "#8C887F", width: 32 }}>
                    {entry.rank}
                  </div>
                  <Avatar size={36} initial={entry.initial} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 14, color: "#131210" }}>{entry.name}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 11, color: "#8C887F" }}>@{entry.username}</div>
                  </div>
                  <div style={{ textAlign: "center", width: 80 }}>
                    <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 14, color: "#E9A020" }}>⚡ {entry.buzzScore.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "center", width: 60 }}>
                    <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 14, color: "#131210" }}>★ {entry.rating}</div>
                  </div>
                  <div style={{ textAlign: "center", width: 60 }}>
                    <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 14, color: "#131210" }}>{entry.ordersCompleted}</div>
                    <div style={{ fontFamily: fontSans, fontSize: 10, color: "#8C887F" }}>orders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Buzz Score breakdown */}
          <div style={{ width: 320 }}>
            <div style={{ border: "1px solid #ECEAE8", borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 18, color: "#131210", marginBottom: 16 }}>
                ⚡ Buzz Score
              </h3>
              <div style={{ fontFamily: fontMono, fontSize: 48, fontWeight: 700, color: "#E9A020", textAlign: "center", marginBottom: 24 }}>
                9,420
              </div>
              {Object.values(DEMO_BUZZ_BREAKDOWN).map((item) => (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: fontSans, fontSize: 13, color: "#5C584F" }}>{item.label}</span>
                    <span style={{ fontFamily: fontMono, fontSize: 12, color: "#8C887F" }}>{item.weight}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: "#ECEAE8" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: "#E9A020",
                        width: typeof item.value === "number" ? `${(item.value / (item.max ?? 1)) * 100}%` : "85%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Verify all screens in studio**

Update `Video.tsx` to display each screen in a `<Series>`. Check visual fidelity.

- [ ] **Step 6: Commit**

```bash
git add video/src/screens/Messaging.tsx video/src/screens/OrdersDisputes.tsx video/src/screens/Dashboard.tsx video/src/screens/LeaderboardBuzz.tsx
git commit -m "Add screen replicas: Messaging, Orders+Disputes, Dashboard, Leaderboard+Buzz"
```

---

## Task 7: Act compositions with 3D motion and transitions

**Files:**
- Create: `video/src/acts/Act1Hook.tsx`
- Create: `video/src/acts/Act2Marketplace.tsx`
- Create: `video/src/acts/Act3Infrastructure.tsx`
- Create: `video/src/acts/Act4Ecosystem.tsx`
- Create: `video/src/acts/Act5Close.tsx`

Each act wraps its screen(s) in `Camera3D` with frame-driven transforms. The motion parameters are interpolated from `useCurrentFrame()`.

- [ ] **Step 1: Create Act1Hook.tsx — Landing page cinematic zoom-in**

Duration: ~40 seconds = 1200 frames at 30fps.

Opens on black. Logo fades in. Landing page materializes behind it. Camera pulls back (translateZ goes from 500 to 0). Counters tick up. Categories light up in sequence.

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { Camera3D } from "../components/Camera3D";
import { ScreenGlow } from "../components/ScreenGlow";
import { LandingPage } from "../screens/LandingPage";
import { fontSans, fontDisplay } from "../lib/fonts";

export const Act1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo fade: 0-1s
  const logoOpacity = interpolate(frame, [0, 1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Page reveal: 1-2.5s
  const pageOpacity = interpolate(frame, [1 * fps, 2.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Camera pull-back: 1.5-4s
  const translateZ = interpolate(frame, [1.5 * fps, 4 * fps], [400, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Slight tilt during pull-back
  const rotateX = interpolate(frame, [1.5 * fps, 4 * fps], [8, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Scroll down through landing page: 4s-end
  const scrollY = interpolate(frame, [4 * fps, 38 * fps], [0, -2200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Logo position: centered at start, then move up and shrink
  const logoScale = interpolate(frame, [1 * fps, 2 * fps], [1.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Landing page behind */}
      <AbsoluteFill style={{ opacity: pageOpacity }}>
        <Camera3D translateZ={translateZ} rotateX={rotateX}>
          <ScreenGlow intensity={pageOpacity}>
            <div
              style={{
                width: 1920,
                height: 1080,
                overflow: "hidden",
                borderRadius: 12,
              }}
            >
              <div style={{ transform: `translateY(${scrollY}px)` }}>
                <LandingPage />
              </div>
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>

      {/* Centered logo overlay (fades out as page appears) */}
      {logoScale > 0 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: logoOpacity * logoScale,
            transform: `scale(${0.5 + logoScale})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "#E9A020",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                fontFamily: fontSans,
                color: "#131210",
              }}
            >
              H
            </div>
            <span
              style={{
                fontFamily: fontSans,
                fontWeight: 700,
                fontSize: 56,
                color: "#FDF0D5",
              }}
            >
              hive
              <span
                style={{
                  fontFamily: fontDisplay,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 64,
                  color: "#F5B540",
                }}
              >
                five
              </span>
            </span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Create Act2Marketplace.tsx — Discover + Service zoom-through**

Duration: ~50 seconds = 1500 frames. First half: Discover page as flat panel with service cards fanning out. Second half: camera zooms INTO a card, transitioning to ServiceDetailBooking, then scrolls through to the booking confirmation.

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { Camera3D } from "../components/Camera3D";
import { ScreenGlow } from "../components/ScreenGlow";
import { DiscoverPage } from "../screens/DiscoverPage";
import { ServiceDetailBooking } from "../screens/ServiceDetailBooking";

export const Act2Marketplace: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Discover (0-25s)
  const discoverOpacity = interpolate(frame, [0, 0.5 * fps, 24 * fps, 25 * fps], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const discoverRotateY = interpolate(frame, [0, 3 * fps], [-15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Phase 2: Service Detail + Booking (25-50s)
  const detailOpacity = interpolate(frame, [24 * fps, 25 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Zoom into service detail
  const detailScale = interpolate(frame, [24 * fps, 26 * fps], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Scroll through service detail into booking
  const detailScrollY = interpolate(frame, [27 * fps, 48 * fps], [0, -1400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Discover page */}
      <AbsoluteFill style={{ opacity: discoverOpacity }}>
        <Camera3D rotateY={discoverRotateY}>
          <ScreenGlow>
            <div style={{ width: 1920, height: 1080, overflow: "hidden", borderRadius: 12 }}>
              <DiscoverPage />
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>

      {/* Service Detail + Booking */}
      <AbsoluteFill style={{ opacity: detailOpacity }}>
        <Camera3D scale={detailScale}>
          <ScreenGlow>
            <div style={{ width: 1920, height: 1080, overflow: "hidden", borderRadius: 12 }}>
              <div style={{ transform: `translateY(${detailScrollY}px)` }}>
                <ServiceDetailBooking />
              </div>
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Create Act3Infrastructure.tsx — Messaging + Orders**

Duration: ~70 seconds = 2100 frames. Messaging inside a device frame with camera orbit. Then orders panels slide in side by side.

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { Camera3D } from "../components/Camera3D";
import { ScreenGlow } from "../components/ScreenGlow";
import { DeviceFrame } from "../components/DeviceFrame";
import { Messaging } from "../screens/Messaging";
import { OrdersDisputes } from "../screens/OrdersDisputes";

export const Act3Infrastructure: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Messaging (0-35s)
  const msgOpacity = interpolate(frame, [0, 0.5 * fps, 34 * fps, 35 * fps], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow orbit
  const msgRotateY = interpolate(frame, [0, 34 * fps], [-8, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const msgRotateX = interpolate(frame, [0, 34 * fps], [3, -3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Animate visible messages
  const visibleMessages = Math.min(5, Math.floor(interpolate(frame, [2 * fps, 20 * fps], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })));

  const showTyping = frame > 18 * fps && frame < 22 * fps;

  // Phase 2: Orders + Disputes (35-70s)
  const ordersOpacity = interpolate(frame, [34 * fps, 35 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ordersRotateX = interpolate(frame, [35 * fps, 38 * fps], [5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Messaging in device frame */}
      <AbsoluteFill style={{ opacity: msgOpacity }}>
        <Camera3D rotateY={msgRotateY} rotateX={msgRotateX} perspective={1500}>
          <ScreenGlow intensity={0.8}>
            <DeviceFrame width={1400} height={880}>
              <div style={{ width: 1400, height: 880, overflow: "hidden", transform: "scale(0.729)", transformOrigin: "top left" }}>
                <Messaging visibleMessageCount={visibleMessages} showTyping={showTyping} />
              </div>
            </DeviceFrame>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>

      {/* Orders + Disputes */}
      <AbsoluteFill style={{ opacity: ordersOpacity }}>
        <Camera3D rotateX={ordersRotateX}>
          <ScreenGlow>
            <div style={{ width: 1920, height: 1080, overflow: "hidden", borderRadius: 12 }}>
              <OrdersDisputes />
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Create Act4Ecosystem.tsx — Dashboard zoom-out + Leaderboard**

Duration: ~60 seconds = 1800 frames. Dashboard starts zoomed in on one stat card, pulls back. Then transitions to leaderboard.

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { Camera3D } from "../components/Camera3D";
import { ScreenGlow } from "../components/ScreenGlow";
import { Dashboard } from "../screens/Dashboard";
import { LeaderboardBuzz } from "../screens/LeaderboardBuzz";

export const Act4Ecosystem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Dashboard (0-30s)
  const dashOpacity = interpolate(frame, [0, 0.5 * fps, 29 * fps, 30 * fps], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Zoom out from stat card
  const dashScale = interpolate(frame, [0, 4 * fps], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const dashTranslateX = interpolate(frame, [0, 4 * fps], [-400, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const dashTranslateY = interpolate(frame, [0, 4 * fps], [-200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Phase 2: Leaderboard (30-60s)
  const leaderOpacity = interpolate(frame, [29 * fps, 30 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leaderRotateY = interpolate(frame, [30 * fps, 33 * fps], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Dashboard */}
      <AbsoluteFill style={{ opacity: dashOpacity }}>
        <Camera3D scale={dashScale} translateX={dashTranslateX} translateY={dashTranslateY}>
          <ScreenGlow>
            <div style={{ width: 1920, height: 1080, overflow: "hidden", borderRadius: 12 }}>
              <Dashboard />
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>

      {/* Leaderboard */}
      <AbsoluteFill style={{ opacity: leaderOpacity }}>
        <Camera3D rotateY={leaderRotateY}>
          <ScreenGlow>
            <div style={{ width: 1920, height: 1080, overflow: "hidden", borderRadius: 12 }}>
              <LeaderboardBuzz />
            </div>
          </ScreenGlow>
        </Camera3D>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 5: Create Act5Close.tsx — Accelerating zoom, hard cut to black**

Duration: ~20 seconds = 600 frames. Camera accelerates into the leaderboard screen until it fills the frame. Hard cut to black.

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { Camera3D } from "../components/Camera3D";
import { LeaderboardBuzz } from "../screens/LeaderboardBuzz";

export const Act5Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Accelerate into screen: 0-15s
  const translateZ = interpolate(frame, [0, 15 * fps], [0, 1200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.exp),
  });

  const scale = interpolate(frame, [0, 15 * fps], [1, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.exp),
  });

  // Hard cut to black at ~15s
  const blackOverlay = interpolate(frame, [14 * fps, 15 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Camera3D translateZ={translateZ} scale={scale}>
        <div style={{ width: 1920, height: 1080, overflow: "hidden", borderRadius: 12 }}>
          <LeaderboardBuzz />
        </div>
      </Camera3D>

      {/* Black overlay for hard cut */}
      <AbsoluteFill style={{ backgroundColor: "#000000", opacity: blackOverlay }} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: Commit**

```bash
git add video/src/acts/
git commit -m "Add 5 act compositions with hybrid 3D camera motion and transitions"
```

---

## Task 8: Wire up Video.tsx with TransitionSeries and audio

**Files:**
- Modify: `video/src/Video.tsx`
- Modify: `video/src/Root.tsx`

- [ ] **Step 1: Update Video.tsx to sequence all acts**

Use `TransitionSeries` with fade transitions between acts. Include the ambient audio track.

```tsx
import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Act1Hook } from "./acts/Act1Hook";
import { Act2Marketplace } from "./acts/Act2Marketplace";
import { Act3Infrastructure } from "./acts/Act3Infrastructure";
import { Act4Ecosystem } from "./acts/Act4Ecosystem";
import { Act5Close } from "./acts/Act5Close";
import "./styles/tailwind.css";

const TRANSITION_DURATION = 20; // frames

export const HiveFiveDemo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40 * fps}>
          <Act1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={50 * fps}>
          <Act2Marketplace />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={70 * fps}>
          <Act3Infrastructure />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={60 * fps}>
          <Act4Ecosystem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={20 * fps}>
          <Act5Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Ambient score — quiet, under narration */}
      <Audio
        src={staticFile("audio/ambient-score.mp3")}
        volume={0.15}
        loop
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Update Root.tsx duration to match total**

Total: 40 + 50 + 70 + 60 + 20 = 240 seconds = 7200 frames, minus 4 transitions of 20 frames each = 7120 frames. Round to accommodate.

```tsx
import { Composition } from "remotion";
import { HiveFiveDemo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HiveFiveDemo"
      component={HiveFiveDemo}
      durationInFrames={7120}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

- [ ] **Step 3: Create placeholder audio file**

```bash
mkdir -p "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive/video/public/audio"
# A placeholder will be replaced with the actual ambient track.
# For now, create a silent placeholder to prevent errors:
# Use ffmpeg to generate a 4-min silent mp3:
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 240 -q:a 9 "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive/video/public/audio/ambient-score.mp3" -y
```

- [ ] **Step 4: Run studio and verify the full composition plays through**

```bash
cd "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive/video"
npm run studio
```

Expected: All 5 acts play in sequence with fade transitions on AMOLED black. Total runtime ~4 minutes.

- [ ] **Step 5: Commit**

```bash
git add video/src/Video.tsx video/src/Root.tsx video/public/
git commit -m "Wire up full video composition with TransitionSeries, audio, and all 5 acts"
```

---

## Task 9: Polish — timing, easing, and visual refinement

**Files:**
- Modify: `video/src/acts/Act1Hook.tsx`
- Modify: `video/src/acts/Act2Marketplace.tsx`
- Modify: `video/src/acts/Act3Infrastructure.tsx`
- Modify: `video/src/acts/Act4Ecosystem.tsx`
- Modify: `video/src/acts/Act5Close.tsx`

This task is iterative. The goal is to watch the full composition in Remotion Studio, identify timing/easing/visual issues, and fix them.

- [ ] **Step 1: Play through the full video in studio and note timing issues**

Watch at 1x speed. For each act, note:
- Are transitions between phases too abrupt or too slow?
- Does any section feel like it lingers too long?
- Are the 3D camera moves smooth or jerky?
- Is the screen glow too bright or too subtle on AMOLED black?

- [ ] **Step 2: Adjust act durations in Video.tsx based on notes**

Redistribute time between acts as needed. The total should stay at ~4 minutes.

- [ ] **Step 3: Fine-tune easing curves**

Replace any `Easing.linear` with appropriate curves. Entries should use `Easing.out(Easing.quad)` for natural deceleration. Exits should use `Easing.in(Easing.quad)` for acceleration. Camera moves should use `Easing.inOut(Easing.quad)` for smooth arcs.

- [ ] **Step 4: Adjust ScreenGlow intensity per act**

The glow should be most visible when a screen first appears (drawing the eye), then settle to a subtle level. Animate the `intensity` prop based on frame position within each act.

- [ ] **Step 5: Verify the Act 5 close feels like acceleration**

The exponential easing (`Easing.in(Easing.exp)`) should create a "slingshot into the screen" feeling. If it's too gradual, try `Easing.bezier(0.95, 0.05, 0.795, 0.035)` for a more aggressive curve. If too abrupt, reduce the distance or extend the duration.

- [ ] **Step 6: Commit**

```bash
git add video/src/
git commit -m "Polish timing, easing curves, and screen glow intensity across all acts"
```

---

## Task 10: Source ambient music and render final video

**Files:**
- Modify: `video/public/audio/ambient-score.mp3`

- [ ] **Step 1: Source a royalty-free ambient electronic track**

Requirements:
- Warm, electronic, ambient tone
- ~90-110 BPM (not distracting)
- No vocals
- At least 4 minutes long (or cleanly loopable)
- Royalty-free / Creative Commons for public presentation use

Sources to check: Pixabay Music, Free Music Archive, Uppbeat, Artlist (if licensed). Download and place at `video/public/audio/ambient-score.mp3`.

- [ ] **Step 2: Test audio mix at volume 0.15**

Run the full composition in studio. The music should be audible but quiet enough that speaking at normal volume over it feels natural. Adjust `volume` in Video.tsx if needed (range: 0.1–0.2).

- [ ] **Step 3: Render the final MP4**

```bash
cd "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive/video"
npx remotion render src/index.ts HiveFiveDemo out/demo.mp4 --codec h264
```

Expected: `out/demo.mp4` is a 1920x1080 H.264 MP4, ~4 minutes long, under 200MB.

- [ ] **Step 4: Play back the rendered file and verify**

```bash
# Open the file in a video player to verify:
# - Video plays smoothly at 30fps
# - Audio is present and at correct volume
# - No rendering artifacts
# - Total duration matches expected ~4 minutes
# - File size is reasonable
```

- [ ] **Step 5: Commit**

```bash
git add video/
git commit -m "Add ambient audio track and render final demo video"
```

---

## Task 11: Add .gitignore and clean up

**Files:**
- Create or modify: `video/.gitignore`
- Modify: `.gitignore` (root)

- [ ] **Step 1: Create video/.gitignore**

```
node_modules/
out/
dist/
.remotion/
```

- [ ] **Step 2: Update root .gitignore**

Add `.superpowers/` if not already present.

- [ ] **Step 3: Final commit**

```bash
git add video/.gitignore .gitignore
git commit -m "Add gitignore for video project output and build artifacts"
```
