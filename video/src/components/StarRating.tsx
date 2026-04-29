import React from "react";

type StarRatingProps = { rating: number; size?: number };

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
