import React from "react";
import { fontSans, fontDisplay } from "../lib/fonts";

type NavBarProps = {
  activeLink?: string;
  balance?: number;
  notificationCount?: number;
  avatarInitial?: string;
};

export const NavBar: React.FC<NavBarProps> = ({
  activeLink = "Discover",
  balance = 2450,
  notificationCount = 3,
  avatarInitial = "S",
}) => {
  const links = ["Discover", "Dashboard", "Messages", "Orders"];

  return (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 64,
        paddingRight: 64,
        backgroundColor: "rgba(254,253,251,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #ECEAE8",
        fontFamily: fontSans,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "#E9A020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#131210" }}>
          H
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#131210", letterSpacing: "-0.01em" }}>
          hive
          <span style={{ fontFamily: fontDisplay, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: "#C47F14" }}>five</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 32 }}>
        {links.map((link) => (
          <div key={link} style={{ fontSize: 14, fontWeight: link === activeLink ? 700 : 400, color: link === activeLink ? "#131210" : "#5C584F", position: "relative", paddingBottom: 17 }}>
            {link}
            {link === activeLink && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#E9A020", borderRadius: 1 }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 20, height: 20, color: "#5C584F", fontSize: 18 }}>🔔</div>
          {notificationCount > 0 && (
            <div style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, borderRadius: "50%", backgroundColor: "#E9A020" }} />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 500, color: "#131210" }}>
          ⬡ {balance.toLocaleString()}
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #FBE0AA, #F8CB74)", border: "2px solid #F5B540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#6E430E" }}>
          {avatarInitial}
        </div>
      </div>
    </div>
  );
};
