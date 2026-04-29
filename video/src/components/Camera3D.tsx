import React from "react";

type Camera3DProps = {
  perspective?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  translateX?: number;
  translateY?: number;
  translateZ?: number;
  scale?: number;
  children: React.ReactNode;
};

export const Camera3D: React.FC<Camera3DProps> = ({
  perspective = 1200,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  scale = 1,
  children,
}) => {
  return (
    <div
      style={{
        perspective,
        perspectiveOrigin: "50% 50%",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
