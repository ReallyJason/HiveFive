import React from "react";
import { fontSans, fontDisplay } from "../lib/fonts";
import { HONEY, CHARCOAL, CREAM } from "../lib/constants";
import { DEMO_SERVICES } from "../data/demo-data";
import { NavBar } from "../components/NavBar";
import { ServiceCard } from "../components/ServiceCard";

const TAB_LABELS = ["Services", "Requests"] as const;

const FILTER_OPTIONS = ["All Categories", "Any Price", "Sort: Newest"] as const;

export const DiscoverPage: React.FC = () => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: CREAM[50],
        fontFamily: fontSans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar activeLink="Discover" />

      <div style={{ padding: "40px 64px 0 64px", flex: 1 }}>
        {/* Page title */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontStyle: "italic",
            fontSize: 40,
            color: CHARCOAL[900],
            marginBottom: 28,
          }}
        >
          Discover
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
          <div
            style={{
              flex: 1,
              height: 44,
              backgroundColor: "#FFFFFF",
              border: `1px solid ${CHARCOAL[200]}`,
              borderRight: "none",
              borderRadius: "8px 0 0 8px",
              display: "flex",
              alignItems: "center",
              paddingLeft: 16,
              fontSize: 14,
              color: CHARCOAL[400],
            }}
          >
            Search services, providers, categories...
          </div>
          <div
            style={{
              width: 96,
              height: 44,
              backgroundColor: HONEY[500],
              borderRadius: "0 8px 8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: CHARCOAL[900],
              letterSpacing: "-0.01em",
            }}
          >
            Search
          </div>
        </div>

        {/* Tabs + Filters row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          {/* Tab pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {TAB_LABELS.map((tab) => {
              const isActive = tab === "Services";
              return (
                <div
                  key={tab}
                  style={{
                    paddingLeft: 20,
                    paddingRight: 20,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: isActive ? HONEY[500] : "transparent",
                    color: isActive ? CHARCOAL[900] : CHARCOAL[500],
                    border: isActive ? "none" : `1px solid ${CHARCOAL[200]}`,
                  }}
                >
                  {tab}
                </div>
              );
            })}
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: "flex", gap: 12 }}>
            {FILTER_OPTIONS.map((filterLabel) => (
              <div
                key={filterLabel}
                style={{
                  paddingLeft: 14,
                  paddingRight: 14,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: CHARCOAL[500],
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${CHARCOAL[200]}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {filterLabel}
                <span style={{ fontSize: 10, color: CHARCOAL[300] }}>▼</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service grid — 3 columns, 3 rows */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          {DEMO_SERVICES.slice(0, 9).map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              category={service.category}
              providerName={service.providerName}
              providerInitial={service.providerInitial}
              price={service.price}
              priceUnit={service.priceUnit}
              rating={service.rating}
              reviewCount={service.reviewCount}
              imageColor={service.imageColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
