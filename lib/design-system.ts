/**
 * Irin Task Board — Central Design System
 *
 * All design tokens live here. Import from "@/lib/design-system"
 * instead of scattering raw values across components.
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

export const colors = {
  /** Page / app backgrounds */
  bg: {
    base: "#1C1A18", // root page background
    surface: "#252320", // column, modal, panel bg
    card: "#2E2B28", // individual card item bg
    overlay: "#3A3632", // hover / active state bg
    input: "#332F2B", // text input bg
  },

  /** Border shades */
  border: {
    subtle: "#383430", // default border
    medium: "#4A4540", // slightly stronger border
    focus: "#6B6560", // focused border
  },

  /** Text hierarchy */
  text: {
    primary: "#F0EBE3", // headings, card titles
    secondary: "#C2B9AF", // subheadings, timestamps
    muted: "#9E9189", // helper text, labels
    disabled: "#5E5750", // disabled states
    inverse: "#1C1A18", // text on light surfaces
  },

  /** Brand / accent */
  accent: {
    amber: "#F5A623",
    amberHover: "#E09410",
    amberSubtle: "rgba(245, 166, 35, 0.15)",
    line: "#06C755",
    lineHover: "#05b34b",
  },

  /** Status colors */
  status: {
    success: "#22c55e",
    successBg: "rgba(34, 197, 94, 0.15)",
    warning: "#f59e0b",
    warningBg: "rgba(245, 158, 11, 0.15)",
    danger: "#ef4444",
    dangerBg: "rgba(239, 68, 68, 0.15)",
    info: "#3b82f6",
    infoBg: "rgba(59, 130, 246, 0.15)",
  },

  /**
   * Tag/label palettes.
   * Each entry: { bg, text } — used for category pills on cards.
   */
  tags: {
    design: { bg: "#1E2D3F", text: "#7DD3FC" }, // sky
    high: { bg: "#3D1A1A", text: "#FCA5A5" }, // red
    client: { bg: "#1A2F24", text: "#86EFAC" }, // green
    architecture: { bg: "#2C1F3D", text: "#D8B4FE" }, // purple
    procurement: { bg: "#332B14", text: "#FDE68A" }, // amber
    budget: { bg: "#3D2020", text: "#FCA5A5" }, // rose
    admin: { bg: "#1F1F35", text: "#A5B4FC" }, // indigo
    permits: { bg: "#1A3030", text: "#5EEAD4" }, // teal
    tech: { bg: "#182535", text: "#93C5FD" }, // blue
    default: { bg: "#2E2B28", text: "#C2B9AF" }, // neutral
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const font = {
  /** Font stack — Thai-friendly with Inter as the primary */
  family: "'Inter', 'Sarabun', 'IBM Plex Sans Thai Looped', sans-serif",
  sizes: {
    "2xs": "10px",
    xs: "11px",
    sm: "12px",
    base: "14px",
    md: "15px",
    lg: "16px",
    xl: "18px",
    "2xl": "22px",
    "3xl": "28px",
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    loose: 1.75,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadow = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  card: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
  cardHover: "0 4px 16px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)",
  column: "0 2px 8px rgba(0,0,0,0.4)",
  modal: "0 20px 60px rgba(0,0,0,0.7)",
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 50,
  modal: 100,
  overlay: 200,
  toast: 300,
} as const;

// ─── Transitions ──────────────────────────────────────────────────────────────

export const transition = {
  fast: "150ms ease",
  normal: "200ms ease",
  slow: "300ms ease",
} as const;

// ─── Component-level Tokens ───────────────────────────────────────────────────

/** Maps card priority to display properties */
export const priorityConfig = {
  LOW: {
    label: "Low",
    tagKey: "design" as keyof typeof colors.tags,
    dotColor: colors.status.info,
  },
  MEDIUM: {
    label: "Medium",
    tagKey: "procurement" as keyof typeof colors.tags,
    dotColor: colors.status.warning,
  },
  HIGH: {
    label: "High",
    tagKey: "high" as keyof typeof colors.tags,
    dotColor: colors.status.danger,
  },
} as const;

/** Nav link definitions */
export const navLinks = [
  { label: "Boards", href: "/dashboard", active: true },
  { label: "Timeline", href: "#" },
  { label: "Calendar", href: "#" },
  { label: "Reports", href: "#" },
] as const;

/** Lane column fixed width */
export const columnWidth = "280px";
