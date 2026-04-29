import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { HONEY, CHARCOAL, CREAM } from "../lib/constants";
import {
  DEMO_LEADERBOARD,
  DEMO_BUZZ_BREAKDOWN,
  type DemoLeaderboardEntry,
} from "../data/demo-data";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";
import { ProfileBadge } from "../components/ProfileBadge";

const MEDAL_GRADIENTS = {
  gold: "linear-gradient(135deg, #FBBF24, #D97706)",
  silver: "linear-gradient(135deg, #D1D5DB, #9CA3AF)",
  bronze: "linear-gradient(135deg, #FB923C, #EA580C)",
} as const;

const MEDAL_LABEL_COLORS = {
  gold: "#78350F",
  silver: "#1F2937",
  bronze: "#7C2D12",
} as const;

const PODIUM_DOWN_OFFSET = 60;
const PODIUM_AVATAR_FIRST = 80;
const PODIUM_AVATAR_RUNNER = 60;
const MEDAL_SIZE = 28;
const BUZZ_SIDEBAR_WIDTH = 320;

const BUZZ_BAR_COLORS = [
  HONEY[500],
  "#348B5A",
  "#3478B8",
  "#7E22CE",
  "#C2410C",
];

type BuzzMetricKey = keyof typeof DEMO_BUZZ_BREAKDOWN;
const BUZZ_METRIC_KEYS: BuzzMetricKey[] = [
  "ordersCompleted",
  "reviewScore",
  "responseTime",
  "engagement",
  "serviceQuality",
];

const topThree = DEMO_LEADERBOARD.filter((entry) => entry.rank <= 3);
const rankingsTable = DEMO_LEADERBOARD.filter((entry) => entry.rank >= 4);

const podiumOrder = [
  topThree.find((entry) => entry.rank === 2),
  topThree.find((entry) => entry.rank === 1),
  topThree.find((entry) => entry.rank === 3),
] as DemoLeaderboardEntry[];

function getMedalGradient(
  rank: number,
): (typeof MEDAL_GRADIENTS)[keyof typeof MEDAL_GRADIENTS] {
  if (rank === 1) return MEDAL_GRADIENTS.gold;
  if (rank === 2) return MEDAL_GRADIENTS.silver;
  return MEDAL_GRADIENTS.bronze;
}

function getMedalTextColor(
  rank: number,
): (typeof MEDAL_LABEL_COLORS)[keyof typeof MEDAL_LABEL_COLORS] {
  if (rank === 1) return MEDAL_LABEL_COLORS.gold;
  if (rank === 2) return MEDAL_LABEL_COLORS.silver;
  return MEDAL_LABEL_COLORS.bronze;
}

export const LeaderboardBuzz: React.FC = () => {
  const firstPlace = topThree.find((entry) => entry.rank === 1);

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: CREAM[100],
        fontFamily: fontSans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar activeLink="Discover" />

      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "32px 64px",
          gap: 32,
          overflowY: "hidden",
        }}
      >
        {/* Left section — Leaderboard */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontStyle: "italic",
              fontSize: 40,
              color: CHARCOAL[900],
              marginBottom: 36,
            }}
          >
            Leaderboard
          </div>

          {/* Podium */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 48,
              marginBottom: 44,
            }}
          >
            {podiumOrder.map((entry) => {
              const isFirst = entry.rank === 1;
              const avatarSize = isFirst
                ? PODIUM_AVATAR_FIRST
                : PODIUM_AVATAR_RUNNER;
              const topPad = isFirst ? 0 : PODIUM_DOWN_OFFSET;

              return (
                <div
                  key={entry.rank}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    paddingTop: topPad,
                    minWidth: 120,
                  }}
                >
                  {/* Trophy for 1st place */}
                  {isFirst && (
                    <div
                      style={{
                        fontSize: 28,
                        marginBottom: 4,
                      }}
                    >
                      🏆
                    </div>
                  )}

                  {/* Avatar with optional frame */}
                  <div style={{ position: "relative" }}>
                    <Avatar
                      size={avatarSize}
                      initial={entry.initial}
                      frameGradient={entry.frameGradient}
                      frameGlow={entry.frameGlow}
                    />
                    {/* Medal circle */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: MEDAL_SIZE,
                        height: MEDAL_SIZE,
                        borderRadius: "50%",
                        background: getMedalGradient(entry.rank),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: getMedalTextColor(entry.rank),
                        border: `2px solid ${CREAM[50]}`,
                      }}
                    >
                      {entry.rank}
                    </div>
                  </div>

                  {/* Profile badge for 1st */}
                  {isFirst && firstPlace?.badgeTag && (
                    <div style={{ marginTop: 8 }}>
                      <ProfileBadge
                        tag={firstPlace.badgeTag}
                        bgColor={firstPlace.badgeBg ?? CHARCOAL[900]}
                        textColor={firstPlace.badgeText ?? HONEY[500]}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: CHARCOAL[900],
                      marginTop: isFirst ? 0 : 8,
                    }}
                  >
                    {entry.name}
                  </div>
                  <div
                    style={{
                      fontFamily: fontMono,
                      fontSize: 13,
                      fontWeight: 500,
                      color: HONEY[600],
                    }}
                  >
                    ⚡ {entry.buzzScore.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rankings table (4-10) */}
          <div
            style={{
              backgroundColor: CREAM[50],
              borderRadius: 14,
              border: `1px solid ${CHARCOAL[100]}`,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 24px",
                borderBottom: `1px solid ${CHARCOAL[100]}`,
                fontSize: 11,
                fontWeight: 600,
                color: CHARCOAL[400],
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <div style={{ width: 48 }}>Rank</div>
              <div style={{ flex: 3 }}>Provider</div>
              <div style={{ flex: 1, textAlign: "center" }}>Buzz</div>
              <div style={{ flex: 1, textAlign: "center" }}>Rating</div>
              <div style={{ flex: 1, textAlign: "right" }}>Orders</div>
            </div>

            {rankingsTable.map((entry: DemoLeaderboardEntry) => (
              <div
                key={entry.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 24px",
                  borderBottom: `1px solid ${CHARCOAL[50]}`,
                }}
              >
                <div
                  style={{
                    width: 48,
                    fontFamily: fontDisplay,
                    fontStyle: "italic",
                    fontSize: 18,
                    color: CHARCOAL[400],
                  }}
                >
                  {entry.rank}
                </div>
                <div
                  style={{
                    flex: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Avatar size={32} initial={entry.initial} />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: CHARCOAL[800],
                      }}
                    >
                      {entry.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: CHARCOAL[400],
                      }}
                    >
                      @{entry.username}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: fontMono,
                    fontSize: 13,
                    fontWeight: 500,
                    color: HONEY[600],
                  }}
                >
                  ⚡ {entry.buzzScore.toLocaleString()}
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 13,
                    color: CHARCOAL[700],
                  }}
                >
                  ★ {entry.rating}
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: "right",
                    fontSize: 13,
                    color: CHARCOAL[600],
                  }}
                >
                  {entry.ordersCompleted}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar — Buzz Score breakdown */}
        <div
          style={{
            width: BUZZ_SIDEBAR_WIDTH,
            backgroundColor: CREAM[50],
            borderRadius: 14,
            border: `1px solid ${CHARCOAL[100]}`,
            padding: "28px 24px",
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: CHARCOAL[500],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Buzz Score
          </div>

          <div
            style={{
              fontFamily: fontMono,
              fontSize: 48,
              fontWeight: 500,
              color: HONEY[500],
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            9,420
          </div>
          <div
            style={{
              fontSize: 12,
              color: CHARCOAL[400],
              marginBottom: 28,
            }}
          >
            Marcus Rivera's composite score
          </div>

          {/* Breakdown bars */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {BUZZ_METRIC_KEYS.map((metricKey, metricIndex) => {
              const metric = DEMO_BUZZ_BREAKDOWN[metricKey];
              const weightPercent = parseInt(metric.weight, 10);
              const barWidthPercent = weightPercent * 3.3; // scale to fill visually

              return (
                <div key={metricKey}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: CHARCOAL[700],
                      }}
                    >
                      {metric.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: CHARCOAL[400],
                      }}
                    >
                      {metric.weight}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: CHARCOAL[100],
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidthPercent}%`,
                        height: "100%",
                        borderRadius: 4,
                        backgroundColor:
                          BUZZ_BAR_COLORS[
                            metricIndex % BUZZ_BAR_COLORS.length
                          ],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
