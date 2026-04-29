import React from "react";

type ScreenGlowProps = {
  intensity?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const ScreenGlow: React.FC<ScreenGlowProps> = ({
  intensity = 1,
  children,
  style,
}) => {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        boxShadow: `0 0 ${40 * intensity}px rgba(233, 160, 32, ${0.15 * intensity}), 0 0 ${80 * intensity}px rgba(233, 160, 32, ${0.06 * intensity})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
