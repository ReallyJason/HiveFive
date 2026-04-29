import React from "react";
import { CATEGORY_COLORS } from "../lib/constants";

type CategoryBadgeProps = { category: string };

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
  return (
    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: 9999, paddingLeft: 10, paddingRight: 10, paddingTop: 2, paddingBottom: 2, backgroundColor: colors.bg, color: colors.text, fontFamily: "DM Sans, sans-serif" }}>
      {category}
    </span>
  );
};
