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
  title, category, providerName, providerInitial, price, priceUnit = "flat", rating, reviewCount, imageColor = "#ECEAE8",
}) => {
  return (
    <div style={{ backgroundColor: "#FEFDFB", border: "1px solid #ECEAE8", borderRadius: 8, overflow: "hidden", width: 280 }}>
      <div style={{ height: 144, background: `linear-gradient(135deg, ${imageColor}, #F6F6F5)` }} />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <CategoryBadge category={category} />
          <span style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 500, color: "#131210", display: "flex", alignItems: "center", gap: 2 }}>
            ⬡ {price}
            {priceUnit === "hourly" && <span style={{ fontSize: 11, color: "#8C887F" }}>/hr</span>}
          </span>
        </div>
        <div style={{ fontFamily: fontSans, fontWeight: 700, fontSize: 15, color: "#131210", lineHeight: "1.3", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {title}
        </div>
        <div style={{ fontFamily: fontSans, fontSize: 12, color: "#8C887F", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar size={18} initial={providerInitial} />
          {providerName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating rating={rating} size={12} />
          <span style={{ fontFamily: fontMono, fontSize: 11, color: "#8C887F" }}>{rating.toFixed(1)} ({reviewCount})</span>
        </div>
      </div>
    </div>
  );
};
