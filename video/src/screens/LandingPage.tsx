import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { CATEGORY_COLORS, HONEY, CHARCOAL } from "../lib/constants";
import { countUp } from "../lib/motion";
import { LANDING_STATS, LANDING_CATEGORIES } from "../data/demo-data";

const STAT_ENTRIES: { key: keyof typeof LANDING_STATS; label: string }[] = [
  { key: "services", label: "Services Listed" },
  { key: "providers", label: "Active Providers" },
  { key: "universities", label: "Universities" },
  { key: "transactions", label: "Transactions" },
];

const HERO_BG = "#050505";
const COUNTER_DURATION_SEC = 1.5;
const COUNTER_STAGGER_SEC = 0.2;

export const LandingPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width: 1920,
        height: 3200,
        backgroundColor: HERO_BG,
        fontFamily: fontSans,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient radial glow */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(233,160,32,0.08) 0%, rgba(233,160,32,0.02) 40%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Hero section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 280,
        }}
      >
        {/* Logo lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 64 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: HONEY[500],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: CHARCOAL[900],
            }}
          >
            H
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 36,
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
                fontSize: 40,
                color: HONEY[700],
              }}
            >
              five
            </span>
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontStyle: "italic",
            fontSize: 72,
            fontWeight: 400,
            color: "#FEFDFB",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          The campus marketplace
          <br />
          that runs on trust
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 22,
            color: CHARCOAL[400],
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.5,
            marginBottom: 56,
          }}
        >
          Buy, sell, and trade services with verified students at your university.
          No middlemen. No hidden fees. Just your peers.
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 20, marginBottom: 120 }}>
          <div
            style={{
              backgroundColor: HONEY[500],
              color: CHARCOAL[900],
              fontWeight: 700,
              fontSize: 16,
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 14,
              paddingBottom: 14,
              borderRadius: 8,
              letterSpacing: "-0.01em",
            }}
          >
            Get Started
          </div>
          <div
            style={{
              backgroundColor: "transparent",
              color: "#FEFDFB",
              fontWeight: 500,
              fontSize: 16,
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 14,
              paddingBottom: 14,
              borderRadius: 8,
              border: `1px solid ${CHARCOAL[600]}`,
              letterSpacing: "-0.01em",
            }}
          >
            Browse Services
          </div>
        </div>

        {/* Stat counters */}
        <div
          style={{
            display: "flex",
            gap: 80,
            marginBottom: 160,
          }}
        >
          {STAT_ENTRIES.map((stat, statIndex) => {
            const animatedValue = countUp(
              frame,
              fps,
              LANDING_STATS[stat.key],
              COUNTER_DURATION_SEC,
              statIndex * COUNTER_STAGGER_SEC,
            );
            return (
              <div
                key={stat.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 48,
                    fontWeight: 500,
                    color: HONEY[500],
                    letterSpacing: "-0.02em",
                  }}
                >
                  {animatedValue.toLocaleString()}
                </span>
                <span
                  style={{
                    fontFamily: fontSans,
                    fontSize: 14,
                    fontWeight: 500,
                    color: CHARCOAL[400],
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Section heading */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontStyle: "italic",
            fontSize: 40,
            color: "#FEFDFB",
            marginBottom: 48,
            textAlign: "center",
          }}
        >
          Browse by Category
        </div>

        {/* Category grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
            maxWidth: 1000,
          }}
        >
          {LANDING_CATEGORIES.map((category) => {
            const categoryTextColor =
              CATEGORY_COLORS[category]?.text ?? CATEGORY_COLORS.Other.text;
            return (
              <div
                key={category}
                style={{
                  width: 160,
                  height: 80,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fontSans,
                  fontSize: 14,
                  fontWeight: 600,
                  color: categoryTextColor,
                  letterSpacing: "-0.01em",
                }}
              >
                {category}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
