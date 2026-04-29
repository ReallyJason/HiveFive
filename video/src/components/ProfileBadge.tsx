import React from "react";

type ProfileBadgeProps = { tag: string; bgColor: string; textColor: string; bgGradient?: string };

export const ProfileBadge: React.FC<ProfileBadgeProps> = ({ tag, bgColor, textColor, bgGradient }) => {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 20, paddingLeft: 10, paddingRight: 10, borderRadius: 10, fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.03em", whiteSpace: "nowrap", background: bgGradient ?? bgColor, color: textColor }}>
      {tag}
    </span>
  );
};
