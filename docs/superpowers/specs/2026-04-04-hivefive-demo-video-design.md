# HiveFive demo video — Design spec

## Overview

A 3-5 minute product demo video built with Remotion (React-based video renderer). The video plays on a big screen during a live 5-7 minute investor pitch. The founder narrates over it — the video contains no voiceover, no text overlays, no captions. Just the product's actual UI moving through 3D space with cinema-grade motion.

## Audience and goal

**Viewer:** An investor/judge at a pitch demo day. Has ADHD — needs constant visual payoff to stay locked in.

**Viewing context:** Live presentation. Founder speaks over the video. The video is the visual spectacle; the founder provides the narrative.

**Desired impression:** "This is a real, polished product built by a team that operates at a professional level." The video should feel like an Apple keynote product reveal — every second delivers something new.

## Design decisions

| Decision | Choice |
|----------|--------|
| Duration | 3-5 minutes (~4 min target) |
| Motion style | Hybrid — different motion language per act |
| Background | AMOLED black (#000000), screens are the only light source |
| Audio | Subtle ambient electronic score, warm and low, mixed quietly under live narration |
| Text overlays | None — the UI speaks for itself |
| Data | Stylized/crafted demo data for peak marketplace appearance |
| Ending | Camera accelerates into the final screen, hard cut to black |
| Resolution | 1920x1080 @ 30fps, MP4 output |

## Motion vocabulary

Three motion styles, deployed strategically across the video:

**Style A — Floating device frames:** Screens appear inside laptop/phone mockup frames floating in 3D. Camera orbits slowly. Depth-of-field blur on non-focused elements. Slow, confident, gravitational.

**Style B — Flat panels in 3D space:** Raw UI as crisp panels in the void. Panels slide, rotate, stack, fan out. Camera pushes through arrangements. Architectural, editorial, clean negative space.

**Style C — Cinematic zoom-through:** Camera pushes INTO screens, creating continuous unbroken movement. Kinetic, immersive, narrative. The viewer is the user.

## Screen lineup (7 screens, 5 acts)

### Act 1 — The hook (0:00–0:40)

**Screen 1: Landing page**
- Motion: Style C (cinematic zoom-in)
- Opens on black. HiveFive logo fades in. The full landing page materializes behind it. Camera pulls back to reveal the 3D hero section. Live counters tick up (services, providers, universities, transactions). Camera drifts down to the category grid — each tile lights up in sequence.
- Purpose: Establish polish. First impression says "this isn't a class project."

### Act 2 — The marketplace (0:40–1:30)

**Screen 2: Discover page**
- Motion: Style B (flat panels in 3D)
- The Discover page floats as a panel. Multiple service cards fan out from it in 3D — different categories, providers, price points. Filters animate: category dropdown opens, price range slides, sort changes. Cards rearrange. Sidebar shows top providers with cosmetic frames/badges.
- Purpose: Show marketplace density and activity. The core product.

**Screen 3: Service detail into booking flow**
- Motion: Style C (cinematic zoom-through)
- Camera zooms INTO one service card, punching through to the full detail page. Reviews scroll, provider stats visible, "What's Included" list populates. "Book Now" button pulses. Camera pushes forward into booking flow — date picker selects, price breakdown calculates, HiveCoin balance shows. Confirmation screen lands.
- One continuous shot: browse, detail, book, confirmed.
- Purpose: Close the transaction loop. This is a real marketplace that handles money.

### Act 3 — The infrastructure (1:30–2:40)

**Screen 4: Messaging**
- Motion: Style A (floating device frame)
- Messaging interface inside a floating laptop frame. Camera slowly orbits. Messages animate in — bubbles appearing, typing indicator pulsing, image attachment expanding, link preview card rendering. Read receipts tick. Online status dot glows.
- Purpose: "We built real communication infrastructure." Trust and safety.

**Screen 5: Orders and dispute resolution**
- Motion: Style B (flat panels)
- Order detail page slides in. Order timeline animates step by step: pending, accepted, in progress, completed. A second panel slides in beside it showing a dispute: reason selection, settlement proposal (60/40 split), accept button. Two panels side by side — the happy path and the edge case.
- Purpose: "They thought about everything." The differentiator from every other student marketplace.

### Act 4 — The ecosystem (2:40–3:40)

**Screen 6: User dashboard**
- Motion: Style C reversed (cinematic zoom-out)
- Camera starts close on a single stat card (Total Earnings: 2,450 HiveCoins). Pulls back to reveal all 6 stat cards populating with numbers. Active orders list fills in below, each row sliding in with status badges.
- Purpose: One user's entire marketplace life on a single screen. Command center.

**Screen 7: Leaderboard and Buzz Score**
- Motion: Style B into Style A (panels then device frame)
- Leaderboard table materializes — ranks filling in from #1 down, each row with avatar, cosmetic frame, buzz score, rating. Buzz score explainer card floats up beside it showing the component breakdown. Camera settles on the #1 provider's profile with equipped cosmetics.
- Purpose: Gamification drives retention. Network effects.

### Act 5 — The close (3:40–4:00)

- Camera accelerates INTO the leaderboard/buzz score screen. The UI fills the entire frame. Hard cut to black.
- Implies "there's even more we didn't show you." Founder picks up: "and that's just what we had time to show."

## Technical approach

### Engine
Remotion — React-based programmatic video renderer. Each screen is a React component replicating HiveFive's actual UI using the same Tailwind CSS classes and Radix UI component patterns.

### 3D motion
CSS 3D transforms with `perspective` and `transform-style: preserve-3d` for panel positioning and camera movement. GSAP (already a project dependency) or Remotion's `interpolate()` + `spring()` for easing. No Three.js needed — CSS 3D is sufficient for floating panels and zoom-throughs.

### Screen components
Each of the 7 screens is a standalone React component that renders a visually faithful replica of the corresponding HiveFive page — same design system, same colors, same component patterns, but simplified where needed for readability at video scale (e.g., fewer list items, tighter layouts). These use:
- Tailwind CSS (same config as the main app)
- Radix UI component primitives where relevant
- Hardcoded stylized demo data — no API calls, no hooks that fetch

### Demo data
All data is hardcoded JSON within the video project. Crafted for maximum marketplace credibility:
- 15+ visible services across varied categories
- Providers with realistic names, avatars, ratings (4.2–4.9 range, not all 5.0)
- A messaging thread with natural-looking conversation, an image attachment, a link preview
- Dashboard stats showing healthy activity (2,450 HiveCoins earned, 12 completed orders, 4.8 avg rating)
- Leaderboard with 10+ ranked users, cosmetics equipped
- An order with full timeline and a dispute scenario with settlement

### Background and lighting
- Pure #000000 AMOLED black
- Screens are the primary light source
- Subtle honey-gold (#E9A020) ambient glow on screen edges — achieved via CSS `box-shadow` with large spread
- Optional: very faint radial gradient behind active screens to prevent them from looking pasted onto the void

### Audio
- Ambient electronic score, warm tone, ~90-110 BPM
- Mixed at low volume — designed to sit under live narration without competing
- Sourced from a royalty-free library or composed programmatically
- No sound effects synced to transitions (the narration handles rhythm)

### Output
- 1920x1080 resolution
- 30fps
- MP4 (H.264) for universal playback compatibility
- Target file size: under 200MB

## Project structure (proposed)

```
video/
  src/
    Root.tsx                    # Remotion root — registers composition
    Video.tsx                   # Main composition — sequences all acts
    data/
      demo-data.ts             # All stylized demo data in one place
    screens/
      LandingPage.tsx           # Screen 1
      DiscoverPage.tsx          # Screen 2
      ServiceDetailBooking.tsx  # Screen 3
      Messaging.tsx             # Screen 4
      OrdersDisputes.tsx        # Screen 5
      Dashboard.tsx             # Screen 6
      LeaderboardBuzz.tsx       # Screen 7
    motion/
      CameraRig.tsx            # Shared 3D camera/perspective wrapper
      DeviceFrame.tsx          # Laptop/phone mockup frame component
      PanelLayout.tsx          # 3D panel positioning utilities
    acts/
      Act1Hook.tsx             # Act 1 sequencing and transitions
      Act2Marketplace.tsx      # Act 2 sequencing
      Act3Infrastructure.tsx   # Act 3 sequencing
      Act4Ecosystem.tsx        # Act 4 sequencing
      Act5Close.tsx            # Act 5 closing sequence
    styles/
      tailwind.css             # Tailwind setup (mirrors main app config)
      global.css               # Video-specific styles, glow effects
    audio/
      ambient-score.mp3        # Background music track
  remotion.config.ts           # Remotion configuration
  package.json
  tsconfig.json
  tailwind.config.ts
```

## What this spec does not cover

- Exact frame-by-frame timing (determined during implementation through iteration)
- Specific ambient music track selection (sourced during implementation)
- Exact demo data values (crafted during implementation based on what looks best at render)
- Device frame visual design (determined during implementation)
- Tailwind config mirroring details (derived from the main app's config during setup)
