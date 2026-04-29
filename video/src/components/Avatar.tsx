import React from "react";

type AvatarProps = {
  size?: number;
  initial: string;
  src?: string;
  frameGradient?: string;
  frameGlow?: string;
  online?: boolean;
};

export const Avatar: React.FC<AvatarProps> = ({ size = 40, initial, src, frameGradient, frameGlow, online }) => {
  const ringPad = frameGradient ? 4 : 0;
  const outerSize = size + ringPad * 2;

  return (
    <div style={{ width: outerSize, height: outerSize, position: "relative", flexShrink: 0 }}>
      {frameGradient && (
        <div style={{ position: "absolute", top: 0, left: 0, width: outerSize, height: outerSize, borderRadius: "50%", background: frameGradient, boxShadow: frameGlow ? `0 0 12px ${frameGlow}` : undefined }} />
      )}
      <div style={{ position: "absolute", top: ringPad, left: ringPad, width: size, height: size, borderRadius: "50%", overflow: "hidden", border: frameGradient ? "none" : "2px solid #F5B540" }}>
        {src ? (
          <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #FBE0AA, #F8CB74)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#6E430E", fontFamily: "DM Sans, sans-serif" }}>
            {initial}
          </div>
        )}
      </div>
      {online && (
        <div style={{ position: "absolute", bottom: ringPad, right: ringPad, width: size * 0.25, height: size * 0.25, borderRadius: "50%", backgroundColor: "#348B5A", border: "2px solid #FEFDFB" }} />
      )}
    </div>
  );
};
