import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { HONEY, CHARCOAL, CREAM, SEMANTIC } from "../lib/constants";
import {
  DEMO_ORDER_EVENTS,
  DEMO_DISPUTE,
  DEMO_BOOKING,
  type DemoOrderEvent,
} from "../data/demo-data";
import { NavBar } from "../components/NavBar";
import { Avatar } from "../components/Avatar";
import { StatusBadge } from "../components/StatusBadge";

const PANEL_GAP = 32;
const PANEL_BORDER_RADIUS = 16;
const TOTAL_PRICE = DEMO_BOOKING.total;
const PROVIDER_SHARE = Math.round(
  TOTAL_PRICE * (DEMO_DISPUTE.proposedSplit.provider / 100),
);
const CLIENT_SHARE = Math.round(
  TOTAL_PRICE * (DEMO_DISPUTE.proposedSplit.client / 100),
);

export const OrdersDisputes: React.FC = () => {
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
      <NavBar activeLink="Orders" />

      <div
        style={{
          flex: 1,
          display: "flex",
          gap: PANEL_GAP,
          padding: "32px 64px",
        }}
      >
        {/* Left panel — Completed order */}
        <div
          style={{
            flex: 1,
            backgroundColor: CREAM[50],
            borderRadius: PANEL_BORDER_RADIUS,
            border: `1px solid ${CHARCOAL[100]}`,
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Order header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: fontDisplay,
                fontStyle: "italic",
                fontSize: 28,
                color: CHARCOAL[900],
              }}
            >
              Order #1042
            </div>
            <StatusBadge status="Completed" />
          </div>

          {/* Provider info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 24,
              padding: "16px 20px",
              backgroundColor: CHARCOAL[50],
              borderRadius: 12,
            }}
          >
            <Avatar size={44} initial="M" />
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: CHARCOAL[900],
                  marginBottom: 2,
                }}
              >
                Marcus Rivera
              </div>
              <div style={{ fontSize: 13, color: CHARCOAL[500] }}>
                Provider
              </div>
            </div>
          </div>

          {/* Service + price */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: CHARCOAL[800],
                marginBottom: 6,
              }}
            >
              {DEMO_BOOKING.serviceTitle}
            </div>
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 22,
                fontWeight: 500,
                color: HONEY[600],
              }}
            >
              ⬡ {TOTAL_PRICE.toLocaleString()}
            </div>
          </div>

          {/* Order timeline */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: CHARCOAL[500],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            Timeline
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {DEMO_ORDER_EVENTS.map(
              (event: DemoOrderEvent, eventIndex: number) => {
                const isCompleted = event.status === "completed";
                const isLast = eventIndex === DEMO_ORDER_EVENTS.length - 1;
                const dotColor = isCompleted ? SEMANTIC.success : HONEY[500];

                return (
                  <div
                    key={event.status}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      position: "relative",
                      paddingBottom: isLast ? 0 : 28,
                    }}
                  >
                    {/* Vertical line + dot */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 16,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          border: `2px solid ${isCompleted ? "#A7F3D0" : HONEY[200]}`,
                          flexShrink: 0,
                        }}
                      />
                      {!isLast && (
                        <div
                          style={{
                            width: 2,
                            flex: 1,
                            minHeight: 20,
                            backgroundColor: CHARCOAL[200],
                          }}
                        />
                      )}
                    </div>

                    {/* Event content */}
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: CHARCOAL[800],
                          marginBottom: 2,
                        }}
                      >
                        {event.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: CHARCOAL[400],
                        }}
                      >
                        {event.time}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Right panel — Disputed order */}
        <div
          style={{
            flex: 1,
            backgroundColor: CREAM[50],
            borderRadius: PANEL_BORDER_RADIUS,
            border: `1px solid ${CHARCOAL[100]}`,
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Order header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: fontDisplay,
                fontStyle: "italic",
                fontSize: 28,
                color: CHARCOAL[900],
              }}
            >
              Order #1038
            </div>
            <StatusBadge status="Disputed" />
          </div>

          {/* Dispute reason — warning box */}
          <div
            style={{
              backgroundColor: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#C2410C",
                }}
              >
                {DEMO_DISPUTE.reason}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: CHARCOAL[700],
              }}
            >
              {DEMO_DISPUTE.description}
            </div>
          </div>

          {/* Settlement proposal heading */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: CHARCOAL[500],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            Settlement Proposal
          </div>

          {/* Split cards */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {/* Provider share */}
            <div
              style={{
                flex: 1,
                backgroundColor: CHARCOAL[50],
                borderRadius: 12,
                padding: "20px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: CHARCOAL[500],
                  marginBottom: 8,
                }}
              >
                Provider receives {DEMO_DISPUTE.proposedSplit.provider}%
              </div>
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 28,
                  fontWeight: 500,
                  color: SEMANTIC.success,
                }}
              >
                ⬡ {PROVIDER_SHARE.toLocaleString()}
              </div>
            </div>

            {/* Client share */}
            <div
              style={{
                flex: 1,
                backgroundColor: CHARCOAL[50],
                borderRadius: 12,
                padding: "20px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: CHARCOAL[500],
                  marginBottom: 8,
                }}
              >
                Client receives {DEMO_DISPUTE.proposedSplit.client}%
              </div>
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 28,
                  fontWeight: 500,
                  color: SEMANTIC.info,
                }}
              >
                ⬡ {CLIENT_SHARE.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: "auto",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                backgroundColor: HONEY[500],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 700,
                color: CHARCOAL[900],
                letterSpacing: "-0.01em",
              }}
            >
              Accept Settlement
            </div>
            <div
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                backgroundColor: "transparent",
                border: `1px solid ${CHARCOAL[300]}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 600,
                color: CHARCOAL[700],
                letterSpacing: "-0.01em",
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
