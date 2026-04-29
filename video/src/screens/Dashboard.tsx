import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { HONEY, CHARCOAL, CREAM, SEMANTIC } from "../lib/constants";
import { DEMO_DASHBOARD_STATS, DEMO_DASHBOARD_ORDERS } from "../data/demo-data";
import { NavBar } from "../components/NavBar";
import { StatusBadge } from "../components/StatusBadge";

type StatCardDefinition = {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  subtitle: string;
};

const STAT_CARDS: StatCardDefinition[] = [
  {
    icon: "💰",
    iconBg: "#ECFDF5",
    label: "Total Earnings",
    value: `⬡ ${DEMO_DASHBOARD_STATS.totalEarnings.toLocaleString()}`,
    subtitle: `${DEMO_DASHBOARD_STATS.completedOrders} completed orders`,
  },
  {
    icon: "👛",
    iconBg: HONEY[50],
    label: "Current Balance",
    value: `⬡ ${DEMO_DASHBOARD_STATS.currentBalance.toLocaleString()}`,
    subtitle: "View wallet \u2192",
  },
  {
    icon: "📦",
    iconBg: "#EFF6FF",
    label: "Active Orders",
    value: String(DEMO_DASHBOARD_STATS.activeOrders),
    subtitle: `${DEMO_DASHBOARD_STATS.pendingCount} pending, ${DEMO_DASHBOARD_STATS.inProgressCount} in progress`,
  },
  {
    icon: "\u2605",
    iconBg: "#FEF3C7",
    label: "Average Rating",
    value: `\u2605 ${DEMO_DASHBOARD_STATS.averageRating}`,
    subtitle: "From verified reviews",
  },
  {
    icon: "🛠",
    iconBg: "#F5F3FF",
    label: "Services Offered",
    value: String(DEMO_DASHBOARD_STATS.servicesOffered),
    subtitle: "Post new service \u2192",
  },
  {
    icon: "⏱",
    iconBg: "#ECFEFF",
    label: "Response Time",
    value: DEMO_DASHBOARD_STATS.responseTime,
    subtitle: "Average reply speed",
  },
];

const STAT_COLUMNS = 3;

export const Dashboard: React.FC = () => {
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
      <NavBar activeLink="Dashboard" />

      <div
        style={{
          flex: 1,
          padding: "36px 64px",
          overflowY: "hidden",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontStyle: "italic",
              fontSize: 40,
              color: CHARCOAL[900],
              marginBottom: 6,
            }}
          >
            Dashboard
          </div>
          <div style={{ fontSize: 16, color: CHARCOAL[500] }}>
            Welcome back, Sarah
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {STAT_CARDS.map((card) => (
            <div
              key={card.label}
              style={{
                width: `calc(${100 / STAT_COLUMNS}% - ${(20 * (STAT_COLUMNS - 1)) / STAT_COLUMNS}px)`,
                backgroundColor: CREAM[50],
                borderRadius: 14,
                border: `1px solid ${CHARCOAL[100]}`,
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {card.icon}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: CHARCOAL[500],
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontStyle: "italic",
                  fontSize: 28,
                  color: CHARCOAL[900],
                  lineHeight: 1.1,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: CHARCOAL[400],
                }}
              >
                {card.subtitle}
              </div>
            </div>
          ))}
        </div>

        {/* Active orders section */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontStyle: "italic",
            fontSize: 24,
            color: CHARCOAL[900],
            marginBottom: 16,
          }}
        >
          Active Orders
        </div>

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
              padding: "12px 24px",
              borderBottom: `1px solid ${CHARCOAL[100]}`,
              fontSize: 12,
              fontWeight: 600,
              color: CHARCOAL[400],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <div style={{ flex: 3 }}>Service</div>
            <div style={{ flex: 2 }}>Other Party</div>
            <div style={{ flex: 1, textAlign: "center" }}>Role</div>
            <div style={{ flex: 1, textAlign: "center" }}>Date</div>
            <div style={{ flex: 1, textAlign: "center" }}>Status</div>
            <div style={{ flex: 1, textAlign: "right" }}>Price</div>
          </div>

          {/* Order rows */}
          {DEMO_DASHBOARD_ORDERS.map((order) => (
            <div
              key={order.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: `1px solid ${CHARCOAL[50]}`,
              }}
            >
              <div
                style={{
                  flex: 3,
                  fontSize: 14,
                  fontWeight: 600,
                  color: CHARCOAL[800],
                }}
              >
                {order.title}
              </div>
              <div
                style={{
                  flex: 2,
                  fontSize: 14,
                  color: CHARCOAL[600],
                }}
              >
                {order.otherParty}
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 6,
                    backgroundColor:
                      order.role === "seller" ? "#ECFDF5" : HONEY[50],
                    color:
                      order.role === "seller" ? SEMANTIC.success : HONEY[700],
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {order.role}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 13,
                  color: CHARCOAL[500],
                }}
              >
                {order.scheduledDate}
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <StatusBadge status={order.status} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "right",
                  fontFamily: fontMono,
                  fontSize: 14,
                  fontWeight: 500,
                  color: CHARCOAL[800],
                }}
              >
                ⬡ {order.price.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
