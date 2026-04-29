import React from "react";
import { fontSans, fontDisplay, fontMono } from "../lib/fonts";
import { HONEY, CHARCOAL, CREAM } from "../lib/constants";
import { DEMO_SERVICE_DETAIL, DEMO_BOOKING } from "../data/demo-data";
import { NavBar } from "../components/NavBar";
import { CategoryBadge } from "../components/CategoryBadge";
import { StarRating } from "../components/StarRating";
import { Avatar } from "../components/Avatar";

const CHECKMARK_COLOR = "#348B5A";
const DIVIDER_COLOR = CHARCOAL[200];

const BookingLineItem: React.FC<{
  label: string;
  amount: string;
  isBold?: boolean;
  amountColor?: string;
}> = ({ label, amount, isBold = false, amountColor = CHARCOAL[900] }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 12,
    }}
  >
    <span
      style={{
        fontSize: 14,
        fontWeight: isBold ? 700 : 400,
        color: isBold ? CHARCOAL[900] : CHARCOAL[500],
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontFamily: fontMono,
        fontSize: 14,
        fontWeight: isBold ? 700 : 500,
        color: amountColor,
      }}
    >
      {amount}
    </span>
  </div>
);

export const ServiceDetailBooking: React.FC = () => {
  const detail = DEMO_SERVICE_DETAIL;
  const booking = DEMO_BOOKING;
  const balanceAfter = booking.balance - booking.total;

  return (
    <div
      style={{
        width: 1920,
        height: 2400,
        backgroundColor: CREAM[50],
        fontFamily: fontSans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar activeLink="Discover" />

      {/* ========== TOP HALF: Service Detail ========== */}
      <div style={{ padding: "48px 64px 0 64px" }}>
        <div style={{ display: "flex", gap: 48 }}>
          {/* Left column */}
          <div style={{ flex: 1 }}>
            {/* Image placeholder */}
            <div
              style={{
                height: 340,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${detail.imageColor}, ${CHARCOAL[50]})`,
                marginBottom: 28,
              }}
            />

            <CategoryBadge category={detail.category} />

            {/* Title */}
            <div
              style={{
                fontFamily: fontDisplay,
                fontStyle: "italic",
                fontSize: 36,
                color: CHARCOAL[900],
                marginTop: 16,
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              {detail.title}
            </div>

            {/* Star rating row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <StarRating rating={detail.rating} size={16} />
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 13,
                  color: CHARCOAL[500],
                }}
              >
                {detail.rating.toFixed(1)} ({detail.reviewCount} reviews)
              </span>
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: CHARCOAL[600],
                marginBottom: 36,
                maxWidth: 640,
              }}
            >
              {detail.description}
            </div>

            {/* What's Included */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: CHARCOAL[900],
                marginBottom: 16,
              }}
            >
              What's Included
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 48,
              }}
            >
              {detail.included.map((includedItem) => (
                <div
                  key={includedItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    color: CHARCOAL[600],
                  }}
                >
                  <span style={{ color: CHECKMARK_COLOR, fontSize: 16 }}>
                    ✓
                  </span>
                  {includedItem}
                </div>
              ))}
            </div>

            {/* Reviews */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: CHARCOAL[900],
                marginBottom: 20,
              }}
            >
              Reviews
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {detail.reviews.map((review) => (
                <div
                  key={review.name}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${CHARCOAL[200]}`,
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Avatar size={28} initial={review.initial} />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: CHARCOAL[900],
                      }}
                    >
                      {review.name}
                    </span>
                    <span
                      style={{ fontSize: 12, color: CHARCOAL[400] }}
                    >
                      {review.date}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size={12} />
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: CHARCOAL[600],
                      marginTop: 8,
                    }}
                  >
                    {review.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Provider card */}
          <div style={{ width: 380, flexShrink: 0 }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: `1px solid ${CHARCOAL[200]}`,
                borderRadius: 12,
                padding: 32,
              }}
            >
              {/* Provider avatar + info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Avatar size={64} initial={detail.providerInitial} />
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: CHARCOAL[900],
                    marginTop: 12,
                  }}
                >
                  {detail.providerName}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: CHARCOAL[400],
                    marginTop: 4,
                  }}
                >
                  {detail.university}
                </div>
              </div>

              {/* Bio */}
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: CHARCOAL[600],
                  textAlign: "center",
                  marginBottom: 24,
                  paddingLeft: 8,
                  paddingRight: 8,
                }}
              >
                {detail.providerBio}
              </div>

              {/* Provider stats row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 16,
                  paddingBottom: 16,
                  borderTop: `1px solid ${DIVIDER_COLOR}`,
                  borderBottom: `1px solid ${DIVIDER_COLOR}`,
                  marginBottom: 24,
                }}
              >
                {[
                  { value: detail.providerRating.toFixed(1), label: "Rating" },
                  { value: String(detail.providerReviewCount), label: "Reviews" },
                  { value: detail.providerResponseTime, label: "Response" },
                ].map((providerStat) => (
                  <div
                    key={providerStat.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fontMono,
                        fontSize: 16,
                        fontWeight: 500,
                        color: CHARCOAL[900],
                      }}
                    >
                      {providerStat.value}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: CHARCOAL[400],
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {providerStat.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price display */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 32,
                    fontWeight: 500,
                    color: CHARCOAL[900],
                  }}
                >
                  ⬡ {detail.price}
                </span>
                <span
                  style={{ fontSize: 14, color: CHARCOAL[400] }}
                >
                  /hr
                </span>
              </div>

              {/* Book Now button */}
              <div
                style={{
                  width: "100%",
                  height: 48,
                  backgroundColor: HONEY[500],
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 15,
                  color: CHARCOAL[900],
                  letterSpacing: "-0.01em",
                }}
              >
                Book Now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== BOTTOM HALF: Booking Confirmation ========== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 80,
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            width: 600,
            backgroundColor: "#FFFFFF",
            border: `1px solid ${CHARCOAL[200]}`,
            borderRadius: 16,
            padding: 48,
          }}
        >
          {/* Booking title */}
          <div
            style={{
              fontFamily: fontDisplay,
              fontStyle: "italic",
              fontSize: 32,
              color: CHARCOAL[900],
              marginBottom: 32,
              textAlign: "center",
            }}
          >
            Confirm Booking
          </div>

          {/* Line items */}
          <BookingLineItem
            label="Service"
            amount={booking.serviceTitle}
          />
          <div style={{ height: 1, backgroundColor: DIVIDER_COLOR }} />

          <BookingLineItem
            label="Date & Time"
            amount={`${booking.scheduledDate}, ${booking.scheduledTime}`}
          />
          <div style={{ height: 1, backgroundColor: DIVIDER_COLOR }} />

          <BookingLineItem
            label={`${booking.quantity} ${booking.unit} \u00D7 ⬡ ${booking.basePrice}`}
            amount={`⬡ ${(booking.quantity * booking.basePrice).toLocaleString()}`}
          />
          <div style={{ height: 1, backgroundColor: DIVIDER_COLOR }} />

          <BookingLineItem
            label="Service Fee (5%)"
            amount={`⬡ ${booking.serviceFee}`}
          />

          {/* Total divider — thicker */}
          <div
            style={{
              height: 2,
              backgroundColor: CHARCOAL[300],
              marginTop: 4,
              marginBottom: 4,
            }}
          />
          <BookingLineItem
            label="Total"
            amount={`⬡ ${booking.total.toLocaleString()}`}
            isBold
            amountColor={HONEY[500]}
          />

          {/* Balance display */}
          <div
            style={{
              marginTop: 24,
              padding: 20,
              backgroundColor: CREAM[200],
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: CHARCOAL[400],
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Current Balance
              </span>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 18,
                  fontWeight: 500,
                  color: CHARCOAL[900],
                }}
              >
                ⬡ {booking.balance.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                fontSize: 20,
                color: CHARCOAL[300],
              }}
            >
              →
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: CHARCOAL[400],
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                After Booking
              </span>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 18,
                  fontWeight: 500,
                  color: CHARCOAL[900],
                }}
              >
                ⬡ {balanceAfter.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Confirm button */}
          <div
            style={{
              marginTop: 32,
              width: "100%",
              height: 52,
              backgroundColor: HONEY[500],
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
              color: CHARCOAL[900],
              letterSpacing: "-0.01em",
            }}
          >
            Confirm & Pay
          </div>
        </div>
      </div>
    </div>
  );
};
