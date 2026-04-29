export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Beauty: { bg: "#FDF2F8", text: "#BE185D" },
  Career: { bg: "#F0FDF4", text: "#15803D" },
  Coaching: { bg: "#EEF2FF", text: "#4338CA" },
  Coding: { bg: "#EFF6FF", text: "#1D4ED8" },
  Consulting: { bg: "#F0F9FF", text: "#0369A1" },
  Cooking: { bg: "#FEF2F2", text: "#B91C1C" },
  Design: { bg: "#FFF7ED", text: "#C2410C" },
  Errands: { bg: "#F5F5F4", text: "#57534E" },
  Events: { bg: "#FEFCE8", text: "#854D0E" },
  Fitness: { bg: "#FFF1F2", text: "#BE123C" },
  Language: { bg: "#ECFEFF", text: "#0E7490" },
  Moving: { bg: "#F7FEE7", text: "#4D7C0F" },
  Music: { bg: "#FEF3C7", text: "#B45309" },
  "Pet Care": { bg: "#FFF7ED", text: "#9A3412" },
  Photography: { bg: "#F5F3FF", text: "#6D28D9" },
  Rides: { bg: "#F0FDFA", text: "#0F766E" },
  "Tech Support": { bg: "#F1F5F9", text: "#475569" },
  Tutoring: { bg: "#FFFBEB", text: "#92400E" },
  Video: { bg: "#FAF5FF", text: "#7E22CE" },
  Writing: { bg: "#ECFDF5", text: "#047857" },
  Other: { bg: "#F4F4F5", text: "#52525B" },
};

export const HONEY = {
  50: "#FEF9EE", 100: "#FDF0D5", 200: "#FBE0AA", 300: "#F8CB74",
  400: "#F5B540", 500: "#E9A020", 600: "#C47F14", 700: "#9A5F10",
  800: "#6E430E", 900: "#47290A",
} as const;

export const CHARCOAL = {
  50: "#F6F6F5", 100: "#ECEAE8", 200: "#D6D4D0", 300: "#BFBCB6",
  400: "#8C887F", 500: "#5C584F", 600: "#403D37", 700: "#2D2B27",
  800: "#1E1D1A", 900: "#131210",
} as const;

export const CREAM = {
  50: "#FEFDFB", 100: "#FDFBF5", 200: "#FAF6EA",
} as const;

export const SEMANTIC = {
  success: "#348B5A", warning: "#D4882A", error: "#C93B3B", info: "#3478B8",
} as const;
