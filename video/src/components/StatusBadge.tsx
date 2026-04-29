import React from "react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Pending: { bg: "#F6F6F5", text: "#403D37", border: "#D6D4D0" },
  "In Progress": { bg: "#FEF9EE", text: "#6E430E", border: "#FBE0AA" },
  "Awaiting Confirmation": { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Completed: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  Cancelled: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  Disputed: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
};

type StatusBadgeProps = { status: string };

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "DM Sans, sans-serif", paddingLeft: 10, paddingRight: 10, paddingTop: 2, paddingBottom: 2, borderRadius: 9999, border: `1px solid ${style.border}`, backgroundColor: style.bg, color: style.text }}>
      {status}
    </span>
  );
};
