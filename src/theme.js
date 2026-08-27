import { Droplet, BookOpen, Dumbbell, Footprints, UtensilsCrossed, Check } from "lucide-react";

export const BASE = {
  ink: "#3A342C",
  paper: "#FBF7F1",
  paperDeep: "#F2EADB",
  line: "#E4DBC7",
  muted: "#9C917E",
  stem: "#9BA98D",
  danger: "#B23A3A",
};

// Soft pastel palette — each habit is assigned one, in order.
export const PALETTE = [
  { soft: "#F3D9D6", deep: "#C4767A", tint: "#FBEEEC" },
  { soft: "#DCE7D2", deep: "#6E9463", tint: "#EFF4EA" },
  { soft: "#D7E4EC", deep: "#5C87A3", tint: "#EBF2F6" },
  { soft: "#F4E3BC", deep: "#C6963C", tint: "#FAF2DE" },
  { soft: "#E4DAF0", deep: "#8B72B0", tint: "#F2EDF8" },
  { soft: "#F1DCC6", deep: "#C88A50", tint: "#FAF0E6" },
];

export function colorFor(i) { return PALETTE[i % PALETTE.length]; }

export const ICONS = {
  droplet: Droplet,
  book: BookOpen,
  dumbbell: Dumbbell,
  footprints: Footprints,
  meal: UtensilsCrossed,
};

export const ICON_KEYS = Object.keys(ICONS);

export function iconFor(key) { return ICONS[key] || Check; }
