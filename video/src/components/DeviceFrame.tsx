import React from "react";

type DeviceFrameProps = {
  width?: number;
  height?: number;
  children: React.ReactNode;
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  width = 1280,
  height = 800,
  children,
}) => {
  const bezelPadding = 16;
  const topBarHeight = 32;

  return (
    <div
      style={{
        width: width + bezelPadding * 2,
        borderRadius: 16,
        overflow: "hidden",
        background: "linear-gradient(180deg, #2D2B27 0%, #1E1D1A 100%)",
        padding: bezelPadding,
        boxShadow: "0 24px 56px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ height: topBarHeight, display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, paddingBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#C93B3B" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D4882A" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#348B5A" }} />
      </div>
      <div style={{ width, height, borderRadius: 6, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};
