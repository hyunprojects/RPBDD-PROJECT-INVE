import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowUp,
  Database,
  Package2,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  Archive,
  LogOut,
  ShieldCheck,
  Filter,
  Clock,
  X,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sun,
  Moon,
  Edit3,
  Check,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function clampNonNegative(n) {
  return Math.max(0, n);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function digitsOnly(value) {
  return value.replace(/[^\d]/g, "");
}

const UNIT_OPTIONS = [
  "ream",
  "pcs",
  "box",
  "pack",
  "bottle",
  "pad",
  "set",
  "roll",
  "bundle",
  "carton",
  "others",
];

function FancyButton({ children, style, icon, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}

const themes = {
  dark: {
    page: {
      background:
        "radial-gradient(circle at top left, rgba(255,255,255,0.10), transparent 22%), linear-gradient(180deg, #0f3d1e 0%, #17612b 38%, #2f8f3a 100%)",
      color: "#ffffff",
    },
    hero: {
      background:
        "linear-gradient(135deg, rgba(7,28,14,0.42), rgba(255,255,255,0.04))",
      border: "1px solid rgba(255,255,255,0.14)",
    },
    card: {
      background: "rgba(8, 30, 15, 0.24)",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    text: "#ffffff",
  },
  light: {
    page: {
      background: "linear-gradient(135deg, #f5f7fa 0%, #eceff3 100%)",
      color: "#1f2937",
    },
    hero: {
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(250,250,250,0.92))",
      border: "1px solid rgba(0, 0, 0, 0.08)",
    },
    card: {
      background: "rgba(255,255,255,0.88)",
      border: "1px solid rgba(0,0,0,0.08)",
    },
    text: "#1f2937",
  },
};

function getStyles(theme) {
  const isDark = theme === "dark";

  return {
    page: {
      minHeight: "100vh",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
      background: isDark ? themes.dark.page.background : themes.light.page.background,
      color: isDark ? themes.dark.text : themes.light.text,
      padding: 20,
      transition: "all 0.3s ease",
    },

    shell: {
      maxWidth: 1280,
      margin: "0 auto",
    },

    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 26,
      padding: "28px 28px 34px",
      marginBottom: 24,
      background: isDark ? themes.dark.hero.background : themes.light.hero.background,
      border: isDark ? themes.dark.hero.border : themes.light.hero.border,
      boxShadow: isDark
        ? "0 24px 70px rgba(0,0,0,0.28)"
        : "0 24px 50px rgba(0,0,0,0.08)",
      backdropFilter: "blur(14px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    },

    heroGlow: {
      position: "absolute",
      right: -80,
      top: -80,
      width: 280,
      height: 280,
      borderRadius: "50%",
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      filter: "blur(24px)",
      pointerEvents: "none",
    },

    heroTitle: {
      margin: 0,
      fontSize: "clamp(38px, 9vw, 100px)",
      lineHeight: 0.92,
      fontWeight: 900,
      letterSpacing: "-0.06em",
      textTransform: "uppercase",
      color: isDark ? "rgba(255,255,255,0.92)" : "#111827",
      position: "relative",
      zIndex: 1,
    },

    heroMetaRow: {
      marginTop: 18,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      zIndex: 1,
    },

    statsPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 14px",
      borderRadius: 999,
      background: isDark ? "rgba(7, 28, 14, 0.26)" : "rgba(255,255,255,0.92)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,0,0,0.08)",
      color: isDark ? "#fff" : "#1f2937",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      backdropFilter: "blur(8px)",
    },

    statsPillButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 14px",
      borderRadius: 999,
      background: isDark ? "rgba(7, 28, 14, 0.26)" : "rgba(255,255,255,0.92)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,0,0,0.08)",
      color: isDark ? "#fff" : "#1f2937",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      backdropFilter: "blur(8px)",
      cursor: "pointer",
    },

    topTabsWrap: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 24,
      paddingBottom: 12,
      borderBottom: isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.08)",
    },

    topTab: {
      padding: "11px 18px",
      borderRadius: 12,
      border: isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.08)",
      background: "transparent",
      color: isDark ? "rgba(255,255,255,0.75)" : "#4b5563",
      fontSize: 15,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },

    topTabActive: {
      background: "linear-gradient(180deg, #dff7cf 0%, #8fcd67 100%)",
      color: "#12361c",
      border: "1px solid rgba(255,255,255,0.16)",
      fontWeight: 700,
    },

    filterContainer: {
      marginBottom: 20,
      padding: "12px 16px",
      background: isDark ? "rgba(8, 30, 15, 0.24)" : "rgba(255,255,255,0.7)",
      backdropFilter: "blur(14px)",
      borderRadius: 20,
      border: isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.08)",
    },

    filterTitle: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 12,
      color: isDark ? "rgba(255,255,255,0.9)" : "#1f2937",
    },

    filterChips: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },

    filterChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      borderRadius: 999,
      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,0,0,0.08)",
      color: isDark ? "rgba(255,255,255,0.85)" : "#374151",
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
    },

    filterChipActive: {
      background: "linear-gradient(180deg, #dff7cf 0%, #8fcd67 100%)",
      color: "#12361c",
      borderColor: "rgba(255,255,255,0.3)",
    },

    filterChipClear: {
      background: isDark ? "rgba(220,38,38,0.18)" : "rgba(220,38,38,0.08)",
      borderColor: isDark
        ? "rgba(252,165,165,0.25)"
        : "rgba(220,38,38,0.2)",
      color: isDark ? "#fff1f2" : "#991b1b",
    },

    header: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
      marginBottom: 24,
    },

    h1: {
      margin: 0,
      fontSize: 28,
      color: isDark ? "#ffffff" : "#111827",
      letterSpacing: "-0.03em",
    },

    subtle: {
      color: isDark ? "rgba(255,255,255,0.78)" : "#4b5563",
      fontSize: 13,
      marginTop: 6,
    },

    headerLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },

    headerTopRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },

    badge: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 12,
      border: isDark
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,0,0,0.08)",
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
      color: isDark ? "#fff" : "#1f2937",
      userSelect: "none",
      backdropFilter: "blur(8px)",
    },

    badgeOk: {
      border: isDark
        ? "1px solid rgba(134,239,172,0.30)"
        : "1px solid #10b981",
      background: isDark ? "rgba(22,163,74,0.16)" : "rgba(16,185,129,0.1)",
      color: isDark ? "#f0fdf4" : "#065f46",
    },

    badgeErr: {
      border: isDark
        ? "1px solid rgba(252,165,165,0.30)"
        : "1px solid #ef4444",
      background: isDark ? "rgba(220,38,38,0.18)" : "rgba(239,68,68,0.1)",
      color: isDark ? "#fff1f2" : "#991b1b",
    },

    badgeChecking: {
      border: isDark
        ? "1px solid rgba(125,211,252,0.30)"
        : "1px solid #3b82f6",
      background: isDark ? "rgba(2,132,199,0.16)" : "rgba(59,130,246,0.1)",
      color: isDark ? "#f0f9ff" : "#1e40af",
    },

    card: {
      border: isDark
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,0,0,0.08)",
      borderRadius: 24,
      padding: 20,
      boxShadow: isDark
        ? "0 20px 50px rgba(0,0,0,0.18)"
        : "0 10px 30px rgba(0,0,0,0.05)",
      background: isDark ? "rgba(8, 30, 15, 0.24)" : "rgba(255, 255, 255, 0.88)",
      backdropFilter: "blur(14px)",
      color: isDark ? "#fff" : "#1f2937",
      marginBottom: 22,
    },

    field: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 12,
      position: "relative",
    },

    label: {
      fontSize: 12,
      color: isDark ? "rgba(255,255,255,0.82)" : "#4b5563",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },

    row: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12,
    },

    input: {
      padding: "12px 14px",
      borderRadius: 16,
      border: isDark
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: isDark ? "rgba(255,255,255,0.95)" : "#ffffff",
      color: "#111827",
      fontSize: 14,
    },

    select: {
      padding: "12px 14px",
      borderRadius: 16,
      border: isDark
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: isDark ? "rgba(255,255,255,0.95)" : "#ffffff",
      color: "#111827",
      fontSize: 14,
    },

    autocompleteSuggestions: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      background: isDark ? "rgba(8, 30, 15, 0.95)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(14px)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,0,0,0.08)",
      borderRadius: 12,
      marginTop: 4,
      maxHeight: 200,
      overflowY: "auto",
      zIndex: 10,
    },

    suggestionItem: {
      padding: "10px 14px",
      cursor: "pointer",
      fontSize: 13,
      color: isDark ? "#fff" : "#1f2937",
      borderBottom: isDark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(0,0,0,0.04)",
      transition: "background 0.2s",
    },

    buttonRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 8,
    },

    btn: {
      padding: "11px 18px",
      borderRadius: 999,
      border: isDark
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,0,0,0.1)",
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      color: isDark ? "#fff" : "#1f2937",
      cursor: "pointer",
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      transition: "all 0.2s ease",
      backdropFilter: "blur(10px)",
    },

    btnPrimary: {
      padding: "11px 18px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "linear-gradient(180deg, #dff7cf 0%, #8fcd67 100%)",
      color: "#12361c",
      cursor: "pointer",
      fontWeight: 900,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
    },

    btnDanger: {
      padding: "11px 18px",
      borderRadius: 999,
      border: isDark
        ? "1px solid rgba(254,202,202,0.34)"
        : "1px solid rgba(220,38,38,0.3)",
      background: "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
    },

    btnWarning: {
      padding: "11px 18px",
      borderRadius: 999,
      border: isDark
        ? "1px solid rgba(253,224,71,0.34)"
        : "1px solid rgba(245,158,11,0.3)",
      background: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
    },

    btnSuccess: {
      padding: "11px 18px",
      borderRadius: 999,
      border: isDark
        ? "1px solid rgba(110,231,183,0.34)"
        : "1px solid rgba(16,185,129,0.3)",
      background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
    },

    tableWrap: {
      overflowX: "auto",
      borderRadius: 18,
      background: isDark ? "rgba(6, 22, 11, 0.20)" : "rgba(255,255,255,0.5)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(0,0,0,0.05)",
      marginTop: 8,
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
    },

    th: {
      textAlign: "left",
      fontSize: 12,
      color: isDark ? "rgba(255,255,255,0.76)" : "#4b5563",
      borderBottom: isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.08)",
      padding: "12px 10px",
      whiteSpace: "nowrap",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    },

    td: {
      borderBottom: isDark
        ? "1px solid rgba(255,255,255,0.05)"
        : "1px solid rgba(0,0,0,0.05)",
      padding: "12px 10px",
      fontSize: 13,
      color: isDark ? "#fff" : "#1f2937",
      verticalAlign: "middle",
    },

    badgeLow: {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      border: isDark
        ? "1px solid rgba(254,202,202,0.42)"
        : "1px solid rgba(220,38,38,0.3)",
      background: isDark ? "rgba(127,29,29,0.28)" : "rgba(239,68,68,0.1)",
      color: isDark ? "#fff1f2" : "#991b1b",
    },

    error: {
      background: isDark ? "rgba(127,29,29,0.30)" : "rgba(239,68,68,0.1)",
      border: isDark
        ? "1px solid rgba(252,165,165,0.24)"
        : "1px solid rgba(239,68,68,0.3)",
      padding: 12,
      borderRadius: 16,
      color: isDark ? "#fff1f2" : "#991b1b",
      marginBottom: 20,
      fontSize: 13,
      backdropFilter: "blur(8px)",
    },

    ok: {
      background: isDark ? "rgba(6,95,70,0.24)" : "rgba(16,185,129,0.1)",
      border: isDark
        ? "1px solid rgba(110,231,183,0.24)"
        : "1px solid rgba(16,185,129,0.3)",
      padding: 12,
      borderRadius: 16,
      color: isDark ? "#ecfdf5" : "#065f46",
      marginBottom: 20,
      fontSize: 13,
      backdropFilter: "blur(8px)",
    },

    footer: {
      marginTop: 16,
      color: isDark ? "rgba(255,255,255,0.74)" : "#6b7280",
      fontSize: 12,
    },

    helperText: {
      color: isDark ? "rgba(255,255,255,0.76)" : "#6b7280",
      fontSize: 13,
      marginTop: 12,
      lineHeight: 1.6,
    },

    scrollTopButton: {
      position: "fixed",
      right: 20,
      bottom: 20,
      width: 52,
      height: 52,
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,0.18)",
      background: "linear-gradient(180deg, #dff7cf 0%, #8fcd67 100%)",
      color: "#12361c",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
      zIndex: 999,
    },

    bulkActionsBar: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: isDark ? "rgba(8, 30, 15, 0.8)" : "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(14px)",
      borderRadius: 16,
      marginBottom: 16,
      flexWrap: "wrap",
    },

    checkbox: {
      width: 18,
      height: 18,
      cursor: "pointer",
      accentColor: "#8fcd67",
    },

    loginPage: {
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1.1fr 1px 1fr",
      backgroundImage:
        'linear-gradient(rgba(15,61,30,0.45), rgba(23,97,43,0.45)), url("/inventory-bg.png")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
      overflow: "hidden",
    },

    loginPageBlur: {
      position: "absolute",
      inset: 0,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      background: "rgba(0,0,0,0.08)",
      zIndex: 0,
    },

    loginLeft: {
      position: "relative",
      padding: "36px 34px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: "transparent",
    },

    loginLogo: {
      width: 170,
      height: 170,
      objectFit: "cover",
      borderRadius: "50%",
      background: "#fff",
    },

    loginLeftText: {
      fontSize: "clamp(42px, 6vw, 82px)",
      fontWeight: 800,
      lineHeight: 0.94,
      color: "#ffffff",
      letterSpacing: "-0.05em",
      maxWidth: 500,
      marginBottom: 20,
      textShadow: "0 8px 20px rgba(0,0,0,0.18)",
    },

    loginFooterText: {
      marginTop: 18,
      fontSize: 14,
      color: "rgba(255,255,255,0.72)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },

    loginAccent: {
      color: "#dff7cf",
    },

    loginCenterImageWrap: {
      position: "absolute",
      left: "42%",
      top: "56%",
      transform: "translate(-50%, -50%)",
      zIndex: 1,
      pointerEvents: "none",
    },

    loginCenterImage: {
      width: 220,
      objectFit: "contain",
      filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.22))",
      opacity: 0.95,
    },

    loginDivider: {
      width: 1,
      background: "rgba(255,255,255,0.16)",
    },

    loginRight: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 70px",
      background: "transparent",
    },

    loginCardModern: {
      width: "100%",
      maxWidth: 520,
      background: "rgba(8, 30, 15, 0.28)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 28,
      padding: 30,
      backdropFilter: "blur(16px)",
      boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
    },

    loginTitleModern: {
      fontSize: 34,
      fontWeight: 700,
      color: "#ffffff",
      margin: "0 0 24px 0",
    },

    loginSubtitle: {
      margin: "0 0 20px 0",
      color: "rgba(255,255,255,0.78)",
      fontSize: 14,
      lineHeight: 1.5,
    },

    loginInputModern: {
      width: "100%",
      padding: "18px 20px",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.14)",
      outline: "none",
      background: "rgba(255,255,255,0.92)",
      color: "#111827",
      fontSize: 18,
      boxSizing: "border-box",
    },

    loginButtonModern: {
      width: "100%",
      marginTop: 10,
      padding: "16px 20px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "linear-gradient(180deg, #dff7cf 0%, #8fcd67 100%)",
      color: "#12361c",
      fontSize: 20,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    },

    passwordToggle: {
      position: "absolute",
      right: 14,
      top: "50%",
      transform: "translateY(-50%)",
      background: "transparent",
      border: "none",
      color: "#17612b",
      fontWeight: 700,
      cursor: "pointer",
    },

    editNoteInput: {
      padding: "6px 10px",
      borderRadius: 12,
      border: isDark
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: isDark ? "rgba(255,255,255,0.95)" : "#ffffff",
      color: "#111827",
      fontSize: 13,
      width: "100%",
      boxSizing: "border-box",
    },
  };
}

export default function App() {
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [txns, setTxns] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "dark";
  });

  const [message, setMessage] = useState(null);
  const msgTimerRef = useRef(null);

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("ream");
  const [customUnit, setCustomUnit] = useState("");
  const [newQty, setNewQty] = useState("0");
  const [newMin, setNewMin] = useState("0");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [txnType, setTxnType] = useState("OUT");
  const [txnQty, setTxnQty] = useState("");
  const [txnNote, setTxnNote] = useState("");

  const [search, setSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [binSearch, setBinSearch] = useState("");

  const [connStatus, setConnStatus] = useState("checking");
  const [connError, setConnError] = useState("");

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentSection, setCurrentSection] = useState("items");
  const [activeFilter, setActiveFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const [editingItemId, setEditingItemId] = useState("");
  const [editUnit, setEditUnit] = useState("pcs");
  const [editCustomUnit, setEditCustomUnit] = useState("");

  // New state for editing transaction notes
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [editTxnNote, setEditTxnNote] = useState("");

  const isAdmin =
    role === "admin" ||
    (profile?.email || session?.user?.email) === "adminrpbdd@gmail.com";
  const isGuest = role === "guest";

  useEffect(() => {
    console.log({
      role,
      profile,
      sessionEmail: session?.user?.email,
      isAdmin,
    });
  }, [role, profile, session, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setCurrentSection("add-supply");
    } else {
      setCurrentSection("items");
    }
  }, [isAdmin]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const styles = getStyles(theme);

  const itemNames = useMemo(() => {
    const names = items.map((item) => item.name.toLowerCase());
    return [...new Set(names)];
  }, [items]);

  const suggestions = useMemo(() => {
    if (!newName.trim()) return [];
    const inputLower = newName.toLowerCase();
    return itemNames
      .filter((name) => name.includes(inputLower) && name !== inputLower)
      .slice(0, 5);
  }, [newName, itemNames]);

  function showMessage(type, text) {
    setMessage({ type, text });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage(null), 3000);
  }

  function handleSelectItem(itemId) {
    if (!isAdmin) return;
    setSelectedItemId(itemId);
    setCurrentSection("transactions");
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toggleItemSelection(itemId) {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
    setSelectAll(newSelection.size === filteredItems.length && filteredItems.length > 0);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allIds = filteredItems.map((item) => item.id);
      setSelectedItems(new Set(allIds));
      setSelectAll(true);
    }
  }

  function startEditUnit(item) {
    if (!isAdmin) return showMessage("error", "Only admin can edit items.");

    setEditingItemId(item.id);

    if (UNIT_OPTIONS.includes(item.unit)) {
      setEditUnit(item.unit);
      setEditCustomUnit("");
    } else {
      setEditUnit("others");
      setEditCustomUnit(item.unit || "");
    }
  }

  function cancelEditUnit() {
    setEditingItemId("");
    setEditUnit("pcs");
    setEditCustomUnit("");
  }

  // Start editing a transaction note
  function startEditTxnNote(txn) {
    if (!isAdmin) return showMessage("error", "Only admin can edit notes.");
    setEditingTxnId(txn.id);
    setEditTxnNote(txn.note || "");
  }

  // Cancel editing a transaction note
  function cancelEditTxnNote() {
    setEditingTxnId(null);
    setEditTxnNote("");
  }

  // Save edited transaction note
  async function saveTxnNote(txnId) {
    if (!isAdmin) return showMessage("error", "Only admin can edit notes.");

    const trimmedNote = editTxnNote.trim();
    
    const { error } = await supabase
      .from("txns")
      .update({ note: trimmedNote || null })
      .eq("id", txnId);

    if (error) {
      console.error("Update note error:", error);
      return showMessage("error", error.message);
    }

    await refreshData();
    cancelEditTxnNote();
    showMessage("ok", "Note updated successfully.");
  }

  async function saveItemUnit(itemId) {
    if (!isAdmin) return showMessage("error", "Only admin can edit items.");

    const finalUnit =
      editUnit === "others" ? normalizeName(editCustomUnit || "") : editUnit;

    if (!finalUnit) {
      return showMessage("error", "Please select or enter a valid unit.");
    }

    const { error } = await supabase
      .from("items")
      .update({ unit: finalUnit })
      .eq("id", itemId);

    if (error) {
      console.error("Update unit error:", error);
      return showMessage("error", error.message);
    }

    await refreshData(itemId);
    cancelEditUnit();
    showMessage("ok", `Unit updated to "${finalUnit}".`);
  }

  async function bulkRecycle() {
    if (selectedItems.size === 0) {
      showMessage("error", "No items selected");
      return;
    }

    const confirm = window.confirm(
      `Move ${selectedItems.size} selected item(s) to Recycle Bin?`
    );
    if (!confirm) return;

    const deletedAt = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;

    for (const itemId of selectedItems) {
      const { error: itemErr } = await supabase
        .from("items")
        .update({ deleted_at: deletedAt })
        .eq("id", itemId);

      if (itemErr) {
        errorCount++;
        console.error(`Failed to recycle item ${itemId}:`, itemErr);
      } else {
        successCount++;

        const { error: txnErr } = await supabase
          .from("txns")
          .update({ deleted_at: deletedAt })
          .eq("item_id", itemId);

        if (txnErr) {
          console.error(`Failed to recycle transactions for item ${itemId}:`, txnErr);
        }
      }
    }

    await refreshData();
    setSelectedItems(new Set());
    setSelectAll(false);
    showMessage("ok", `Recycled ${successCount} items. Failed: ${errorCount}`);
  }

  async function bulkUpdateMinLevel() {
    if (selectedItems.size === 0) {
      showMessage("error", "No items selected");
      return;
    }

    const newMinLevel = prompt(
      "Enter new minimum stock level for selected items:",
      "10"
    );
    if (newMinLevel === null) return;

    const minLevelNum = parseInt(newMinLevel);
    if (isNaN(minLevelNum) || minLevelNum < 0) {
      showMessage("error", "Please enter a valid number");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const itemId of selectedItems) {
      const { error } = await supabase
        .from("items")
        .update({ min_level: minLevelNum })
        .eq("id", itemId);

      if (error) {
        errorCount++;
        console.error(`Failed to update item ${itemId}:`, error);
      } else {
        successCount++;
      }
    }

    await refreshData();
    setSelectedItems(new Set());
    setSelectAll(false);
    showMessage("ok", `Updated ${successCount} items. Failed: ${errorCount}`);
  }

  function exportToExcel() {
    const exportData = filteredItems.map((item) => ({
      "Item Name": item.name,
      Quantity: item.quantity,
      Unit: item.unit,
      "Minimum Level": item.min_level,
      Status:
        Number(item.quantity) <= Number(item.min_level) && Number(item.min_level) > 0
          ? "Low Stock"
          : "OK",
      "Last Updated": formatDate(item.updated_at),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory_${new Date().toISOString().split("T")[0]}.xlsx`);
    showMessage("ok", "Excel file exported successfully!");
  }

  function exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("RPBDD Supplies Inventory Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Items: ${filteredItems.length}`, 14, 40);
    doc.text(
      `Low Stock Items: ${
        filteredItems.filter(
          (i) => Number(i.quantity) <= Number(i.min_level) && Number(i.min_level) > 0
        ).length
      }`,
      14,
      47
    );

    const tableData = filteredItems.map((item) => [
      item.name,
      item.quantity.toString(),
      item.unit,
      item.min_level.toString(),
      Number(item.quantity) <= Number(item.min_level) && Number(item.min_level) > 0
        ? "LOW"
        : "OK",
    ]);

    doc.autoTable({
      head: [["Item Name", "Quantity", "Unit", "Min Level", "Status"]],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save(`inventory_report_${new Date().toISOString().split("T")[0]}.pdf`);
    showMessage("ok", "PDF report exported successfully!");
  }

  function exportToCSV() {
    try {
      const csvData = filteredItems.map((item) => ({
        Name: item.name,
        Quantity: item.quantity,
        Unit: item.unit,
        "Min Level": item.min_level,
        Status:
          Number(item.quantity) <= Number(item.min_level) && Number(item.min_level) > 0
            ? "Low Stock"
            : "OK",
        "Last Updated": formatDate(item.updated_at),
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvRows = [
        headers.join(","),
        ...csvData.map((row) =>
          headers
            .map((header) =>
              JSON.stringify(row[header] || "", (key, value) =>
                value === null ? "" : value
              )
            )
            .join(",")
        ),
      ];

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage("ok", "CSV file exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      showMessage("error", "Failed to export inventory");
    }
  }

  async function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split("\n").filter((row) => row.trim());
        const headers = rows[0].split(",").map((h) => h.replace(/["']/g, "").trim());

        const itemsToImport = [];

        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(",").map((v) => v.replace(/["']/g, "").trim());
          const item = {};

          headers.forEach((header, index) => {
            if (header === "Name") item.name = values[index];
            if (header === "Quantity") item.quantity = parseFloat(values[index]) || 0;
            if (header === "Unit") item.unit = values[index] || "pcs";
            if (header === "Min Level") item.min_level = parseFloat(values[index]) || 0;
          });

          if (item.name) {
            itemsToImport.push(item);
          }
        }

        if (itemsToImport.length === 0) {
          throw new Error("No valid items found in CSV");
        }

        let successCount = 0;
        let errorCount = 0;

        for (const item of itemsToImport) {
          const { data: inserted, error } = await supabase
            .from("items")
            .insert({
              name: normalizeName(item.name),
              unit: item.unit,
              quantity: clampNonNegative(item.quantity),
              min_level: clampNonNegative(item.min_level),
              deleted_at: null,
            })
            .select()
            .single();

          if (error) {
            errorCount++;
            console.error(`Failed to import ${item.name}:`, error);
          } else {
            successCount++;

            if (item.quantity > 0 && inserted) {
              await supabase.from("txns").insert({
                type: "IN",
                item_id: inserted.id,
                qty: item.quantity,
                note: "Bulk import",
                deleted_at: null,
              });
            }
          }
        }

        await refreshData();
        showMessage("ok", `Imported ${successCount} items successfully. Failed: ${errorCount}`);
      } catch (error) {
        console.error("Import error:", error);
        showMessage("error", `Import failed: ${error.message}`);
      } finally {
        setImporting(false);
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      showMessage("error", "Failed to read file");
      setImporting(false);
    };

    reader.readAsText(file);
  }

  const getFilteredItems = () => {
    let filtered = [...items];

    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((it) => it.name.toLowerCase().includes(q));
    }

    switch (activeFilter) {
      case "low-stock":
        filtered = filtered.filter(
          (it) => Number(it.quantity) <= Number(it.min_level) && Number(it.min_level) > 0
        );
        break;
      case "in-stock":
        filtered = filtered.filter((it) => Number(it.quantity) > Number(it.min_level));
        break;
      case "critical":
        filtered = filtered.filter((it) => Number(it.quantity) === 0);
        break;
      case "recent": {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter((it) => new Date(it.updated_at) >= sevenDaysAgo);
        break;
      }
      default:
        break;
    }

    return filtered;
  };

  useEffect(() => {
    async function loadSession() {
      setAuthLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session ?? null);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 300);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error);
        setProfile({
          id: session.user.id,
          email: session.user.email,
          role: null,
        });
        setRole(null);
        return;
      }

      setProfile(
        data ?? {
          id: session.user.id,
          email: session.user.email,
          role: null,
        }
      );
      setRole(data?.role ?? null);
    }

    loadProfile();
  }, [session]);

  useEffect(() => {
    async function checkConnection() {
      if (!session) {
        setConnStatus("checking");
        setConnError("");
        return;
      }

      setConnStatus("checking");
      setConnError("");

      const { error } = await supabase.from("items").select("id").limit(1);

      if (error) {
        console.error("Supabase connection error:", error);
        setConnStatus("error");
        setConnError(error.message);
        return;
      }

      setConnStatus("ok");
    }

    checkConnection();
  }, [session]);

  async function handleLogin(e) {
    e.preventDefault();

    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      return showMessage("error", "Email and password are required.");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return showMessage("error", error.message);
    }

    setLoginPassword("");
    showMessage("ok", "Logged in successfully.");
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return showMessage("error", error.message);
    }

    setProfile(null);
    setRole(null);
    setItems([]);
    setDeletedItems([]);
    setTxns([]);
    setSelectedItemId("");
    setLoginEmail("");
    setLoginPassword("");
    setEditingItemId("");
    setEditingTxnId(null);
    setEditTxnNote("");
    showMessage("ok", "Logged out.");
  }

  async function refreshData(preferSelectedId) {
    if (!session) {
      setItems([]);
      setDeletedItems([]);
      setTxns([]);
      setSelectedItemId("");
      setEditingItemId("");
      setEditingTxnId(null);
      return;
    }

    const { data: itemsData, error: itemsErr } = await supabase
      .from("items")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (itemsErr) return showMessage("error", itemsErr.message);

    let deletedItemsData = [];
    if (isAdmin) {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) return showMessage("error", error.message);
      deletedItemsData = data ?? [];
    }

    const { data: txnsData, error: txnsErr } = await supabase
      .from("txns")
      .select("*")
      .is("deleted_at", null)
      .order("at", { ascending: false });

    if (txnsErr) return showMessage("error", txnsErr.message);

    setItems(itemsData ?? []);
    setDeletedItems(deletedItemsData);
    setTxns(txnsData ?? []);

    const nextSelected =
      preferSelectedId && (itemsData ?? []).some((x) => x.id === preferSelectedId)
        ? preferSelectedId
        : itemsData?.[0]?.id ?? "";

    setSelectedItemId(isAdmin ? nextSelected : "");
  }

  useEffect(() => {
    if (!session) {
      setItems([]);
      setDeletedItems([]);
      setTxns([]);
      setSelectedItemId("");
      return;
    }

    refreshData();
  }, [session, role]);

  async function addItem(e) {
    e.preventDefault();

    if (!isAdmin) return showMessage("error", "Only admin can add items.");

    const name = normalizeName(newName);
    const unit =
      newUnit === "others"
        ? normalizeName(customUnit || "pcs")
        : newUnit.trim() || "pcs";
    const qty = toNumber(newQty);
    const minLevel = toNumber(newMin);

    if (!name) return showMessage("error", "Item name is required.");
    if (newUnit === "others" && !normalizeName(customUnit)) {
      return showMessage("error", "Please specify the unit.");
    }
    if (!Number.isFinite(qty) || qty < 0) {
      return showMessage("error", "Initial quantity must be 0 or more.");
    }
    if (!Number.isFinite(minLevel) || minLevel < 0) {
      return showMessage("error", "Min level must be 0 or more.");
    }

    const { data: existingItem, error: findError } = await supabase
      .from("items")
      .select("*")
      .eq("name", name)
      .is("deleted_at", null)
      .maybeSingle();

    if (findError) {
      console.error("Find item error:", findError);
      return showMessage("error", findError.message);
    }

    if (existingItem) {
      return showMessage(
        "error",
        `"${name}" already exists. Use Stock In instead of Add Supply.`
      );
    }

    const { data: inserted, error } = await supabase
      .from("items")
      .insert({
        name,
        unit,
        quantity: clampNonNegative(qty),
        min_level: clampNonNegative(minLevel),
        deleted_at: null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return showMessage("error", error.message);
    }

    if (qty > 0) {
      const { error: txnErr } = await supabase.from("txns").insert({
        type: "IN",
        item_id: inserted.id,
        qty,
        note: "Initial stock",
        deleted_at: null,
      });

      if (txnErr) {
        console.error("Txn insert error:", txnErr);
        return showMessage("error", txnErr.message);
      }
    }

    setNewName("");
    setNewQty("0");
    setNewMin("0");
    setNewUnit("ream");
    setCustomUnit("");
    setShowSuggestions(false);

    await refreshData(inserted.id);
    showMessage("ok", `Added "${name}".`);
  }

  async function applyTxn(e) {
    e.preventDefault();

    if (!isAdmin) return showMessage("error", "Only admin can save transactions.");
    if (!selectedItemId) return showMessage("error", "Please select an item.");

    const qty = toNumber(txnQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      return showMessage("error", "Quantity must be greater than 0.");
    }

    const note = txnNote.trim();

    const { error } = await supabase.rpc("apply_txn", {
      p_item_id: selectedItemId,
      p_type: txnType,
      p_qty: qty,
      p_note: note || null,
    });

    if (error) {
      console.error("RPC error:", error);
      return showMessage("error", error.message);
    }

    setTxnQty("");
    setTxnNote("");

    await refreshData(selectedItemId);
    showMessage("ok", `${txnType === "IN" ? "Stock in" : "Released"} ${qty}.`);
  }

  async function deleteItem(itemId) {
    if (!isAdmin) return showMessage("error", "Only admin can recycle items.");

    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const yes = window.confirm(`Move "${item.name}" to Recycle Bin?`);
    if (!yes) return;

    const deletedAt = new Date().toISOString();

    const { error: itemErr } = await supabase
      .from("items")
      .update({ deleted_at: deletedAt })
      .eq("id", itemId);

    if (itemErr) return showMessage("error", itemErr.message);

    const { error: txnErr } = await supabase
      .from("txns")
      .update({ deleted_at: deletedAt })
      .eq("item_id", itemId);

    if (txnErr) return showMessage("error", txnErr.message);

    await refreshData();
    showMessage("ok", `Moved "${item.name}" to Recycle Bin.`);
  }

  async function restoreItem(itemId) {
    if (!isAdmin) return showMessage("error", "Only admin can restore items.");

    const item = deletedItems.find((it) => it.id === itemId);
    if (!item) return;

    const { error: itemErr } = await supabase
      .from("items")
      .update({ deleted_at: null })
      .eq("id", itemId);

    if (itemErr) return showMessage("error", itemErr.message);

    const { error: txnErr } = await supabase
      .from("txns")
      .update({ deleted_at: null })
      .eq("item_id", itemId);

    if (txnErr) return showMessage("error", txnErr.message);

    await refreshData(itemId);
    showMessage("ok", `Restored "${item.name}".`);
  }

  async function deleteForever(itemId) {
    if (!isAdmin) {
      return showMessage("error", "Only admin can delete permanently.");
    }

    const item = deletedItems.find((it) => it.id === itemId);
    if (!item) return;

    const yes = window.confirm(
      `Delete "${item.name}" permanently? This cannot be undone.`
    );
    if (!yes) return;

    const { error: txErr } = await supabase.from("txns").delete().eq("item_id", itemId);
    if (txErr) return showMessage("error", txErr.message);

    const { error: itErr } = await supabase.from("items").delete().eq("id", itemId);
    if (itErr) return showMessage("error", itErr.message);

    await refreshData();
    showMessage("ok", `Permanently deleted "${item.name}".`);
  }

  async function clearAll() {
    if (!isAdmin) return showMessage("error", "Only admin can recycle all data.");

    const yes = window.confirm("Move ALL items and transactions to Recycle Bin?");
    if (!yes) return;

    const deletedAt = new Date().toISOString();

    const { error: txErr } = await supabase
      .from("txns")
      .update({ deleted_at: deletedAt })
      .is("deleted_at", null);

    if (txErr) return showMessage("error", txErr.message);

    const { error: itErr } = await supabase
      .from("items")
      .update({ deleted_at: deletedAt })
      .is("deleted_at", null);

    if (itErr) return showMessage("error", itErr.message);

    setSelectedItemId("");
    await refreshData();
    showMessage("ok", "Moved everything to Recycle Bin.");
  }

  const itemMap = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  const filteredItems = useMemo(() => getFilteredItems(), [items, search, activeFilter]);

  const filteredDeletedItems = useMemo(() => {
    const q = binSearch.trim().toLowerCase();
    if (!q) return deletedItems;
    return deletedItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [deletedItems, binSearch]);

  const filteredTxns = useMemo(() => {
    const q = txnSearch.trim().toLowerCase();
    if (!q) return txns;

    return txns.filter((t) => {
      const it = itemMap.get(t.item_id);
      const itemName = it ? it.name.toLowerCase() : "";
      const note = (t.note || "").toLowerCase();
      const type = (t.type || "").toLowerCase();
      const qty = String(t.qty ?? "").toLowerCase();
      const date = formatDate(t.at).toLowerCase();

      return (
        itemName.includes(q) ||
        note.includes(q) ||
        type.includes(q) ||
        qty.includes(q) ||
        date.includes(q)
      );
    });
  }, [txns, txnSearch, itemMap]);

  const lowCount = useMemo(() => {
    return items.filter(
      (it) => Number(it.quantity) <= Number(it.min_level) && Number(it.min_level) > 0
    ).length;
  }, [items]);

  const totalItems = items.length;

  const connBadgeStyle =
    connStatus === "ok"
      ? { ...styles.badge, ...styles.badgeOk }
      : connStatus === "error"
      ? { ...styles.badge, ...styles.badgeErr }
      : { ...styles.badge, ...styles.badgeChecking };

  const connLabel =
    connStatus === "ok"
      ? "DB: OK"
      : connStatus === "error"
      ? "DB: ERROR"
      : "DB: CHECKING";

  const QuickFilters = () => (
    <div style={styles.filterContainer}>
      <div style={styles.filterTitle}>
        <Filter size={14} />
        <span>Quick Filters</span>
      </div>
      <div style={styles.filterChips}>
        <button
          style={{
            ...styles.filterChip,
            ...(activeFilter === "all" ? styles.filterChipActive : {}),
          }}
          onClick={() => setActiveFilter("all")}
        >
          All Items
        </button>
        <button
          style={{
            ...styles.filterChip,
            ...(activeFilter === "low-stock" ? styles.filterChipActive : {}),
          }}
          onClick={() => setActiveFilter("low-stock")}
        >
          <AlertTriangle size={12} />
          Low Stock ({lowCount})
        </button>
        <button
          style={{
            ...styles.filterChip,
            ...(activeFilter === "in-stock" ? styles.filterChipActive : {}),
          }}
          onClick={() => setActiveFilter("in-stock")}
        >
          <Package2 size={12} />
          In Stock
        </button>
        <button
          style={{
            ...styles.filterChip,
            ...(activeFilter === "critical" ? styles.filterChipActive : {}),
          }}
          onClick={() => setActiveFilter("critical")}
        >
          <AlertTriangle size={12} />
          Critical (0)
        </button>
        <button
          style={{
            ...styles.filterChip,
            ...(activeFilter === "recent" ? styles.filterChipActive : {}),
          }}
          onClick={() => setActiveFilter("recent")}
        >
          <Clock size={12} />
          Recently Updated
        </button>
        {activeFilter !== "all" && (
          <button
            style={{ ...styles.filterChip, ...styles.filterChipClear }}
            onClick={() => setActiveFilter("all")}
          >
            <X size={12} />
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );

  const TopTabs = () => {
    const tabs = [
      { key: "add-supply", label: "Add Supply", adminOnly: true },
      { key: "transactions", label: "Release / Stock In", adminOnly: true },
      { key: "items", label: "Items" },
      { key: "recycle-bin", label: "Recycle Bin", adminOnly: true },
      { key: "history", label: "Transaction History" },
    ];

    return (
      <div style={styles.topTabsWrap}>
        {tabs
          .filter((tab) => !tab.adminOnly || isAdmin)
          .map((tab) => {
            const active = currentSection === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCurrentSection(tab.key)}
                style={{
                  ...styles.topTab,
                  ...(active ? styles.topTabActive : {}),
                }}
              >
                {tab.label}
              </button>
            );
          })}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div
            style={{
              ...styles.card,
              maxWidth: 460,
              margin: "80px auto",
              textAlign: "center",
            }}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginPageBlur} />

        <div style={{ ...styles.loginLeft, zIndex: 1 }}>
          <img src="/dar-logo.jpeg" alt="DAR Logo" style={styles.loginLogo} />

          <div>
            <div style={styles.loginLeftText}>
              <div>Make your</div>
              <div>Supplies</div>
              <div>Organized</div>
            </div>

            <div style={styles.loginFooterText}>
              Inventory Management System
            </div>
          </div>
        </div>

        <div style={styles.loginCenterImageWrap}>
          <img
            src="/supply-image.png"
            alt="Supply illustration"
            style={styles.loginCenterImage}
          />
        </div>

        <div style={{ ...styles.loginDivider, position: "relative", zIndex: 1 }} />

        <div style={{ ...styles.loginRight, zIndex: 1 }}>
          <div style={styles.loginCardModern}>
            <h2 style={styles.loginTitleModern}>Log in to RPBDD Supplies</h2>
            <p style={styles.loginSubtitle}>
              Department of Agrarian Reform - Northern Mindanao
            </p>

            {message?.type === "error" && <div style={styles.error}>{message.text}</div>}
            {message?.type === "ok" && <div style={styles.ok}>{message.text}</div>}

            <form onSubmit={handleLogin}>
              <div style={styles.field}>
                <input
                  style={styles.loginInputModern}
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>

              <div style={styles.field}>
                <div style={{ position: "relative" }}>
                  <input
                    style={styles.loginInputModern}
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                style={styles.loginButtonModern}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Log in
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <motion.div
          style={styles.hero}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div style={styles.heroGlow} />

          <h1 style={styles.heroTitle}>RPBDD SUPPLIES</h1>

          <div style={styles.heroMetaRow}>
            <span style={connBadgeStyle} title={connError || "Supabase connection status"}>
              <Database size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
              {connLabel}
            </span>

            <button
              type="button"
              style={styles.statsPillButton}
              onClick={() => setCurrentSection("items")}
              title="Go to Items section"
            >
              <Package2 size={14} />
              Items: {totalItems}
            </button>

            <span style={styles.statsPill}>
              <AlertTriangle size={14} />
              Low stock: {lowCount}
            </span>

            {isAdmin && (
              <button
                type="button"
                style={styles.statsPillButton}
                onClick={() => setCurrentSection("recycle-bin")}
                title="Go to Recycle Bin section"
              >
                <Archive size={14} />
                Bin: {deletedItems.length}
              </button>
            )}
          </div>
        </motion.div>

        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerTopRow}>
              <h1 style={styles.h1}>RPBDD SUPPLIES INVENTORY SYSTEM</h1>
              <span style={styles.badge}>
                {profile?.email || session.user.email}
                {isAdmin ? " • admin" : isGuest ? " • guest" : ""}
              </span>
            </div>

            <div style={styles.subtle}>
              {isAdmin
                ? `Manual input of supplies. Stock-out automatically subtracts quantity.${
                    lowCount > 0 ? ` • Low stock alerts: ${lowCount}` : ""
                  }`
                : "Guest view: you can view items and transaction history only."}
            </div>
          </div>

          <div style={styles.buttonRow}>
            <FancyButton
              style={styles.btn}
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </FancyButton>

            {isAdmin && (
              <>
                <FancyButton
                  style={styles.btnSuccess}
                  onClick={exportToExcel}
                  title="Export to Excel"
                  icon={<FileSpreadsheet size={16} />}
                >
                  Excel
                </FancyButton>

                <FancyButton
                  style={styles.btnPrimary}
                  onClick={exportToCSV}
                  title="Export to CSV"
                  icon={<Download size={16} />}
                >
                  CSV
                </FancyButton>

                <label htmlFor="csv-import" style={{ margin: 0 }}>
                  <input
                    id="csv-import"
                    type="file"
                    accept=".csv"
                    onChange={importFromCSV}
                    style={{ display: "none" }}
                    disabled={importing}
                  />
                  <FancyButton
                    style={styles.btnPrimary}
                    onClick={() => document.getElementById("csv-import").click()}
                    title="Import inventory from CSV"
                    icon={<Upload size={16} />}
                  >
                    {importing ? "Importing..." : "Import"}
                  </FancyButton>
                </label>
              </>
            )}

            {isAdmin && (
              <FancyButton
                style={styles.btnWarning}
                onClick={clearAll}
                title="Move all data to recycle bin"
                icon={<Archive size={16} />}
              >
                Recycle All
              </FancyButton>
            )}

            <FancyButton style={styles.btn} onClick={handleLogout} icon={<LogOut size={16} />}>
              Logout
            </FancyButton>
          </div>
        </div>

        {message?.type === "error" && <div style={styles.error}>{message.text}</div>}
        {message?.type === "ok" && <div style={styles.ok}>{message.text}</div>}

        <TopTabs />

        {isAdmin && currentSection === "add-supply" && (
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plus size={18} />
              Add Supply
            </h2>

            <form onSubmit={addItem}>
              <div style={styles.field}>
                <div style={styles.label}>Item name</div>
                <input
                  style={styles.input}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter item name..."
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={styles.autocompleteSuggestions}>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        style={styles.suggestionItem}
                        onClick={() => {
                          setNewName(suggestion);
                          setShowSuggestions(false);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background =
                            theme === "dark"
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "transparent";
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <div style={styles.label}>Initial quantity</div>
                  <input
                    style={styles.input}
                    value={newQty}
                    onChange={(e) => setNewQty(digitsOnly(e.target.value))}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Unit</div>
                  <select
                    style={styles.select}
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit === "others" ? "Others" : unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newUnit === "others" && (
                <div style={styles.field}>
                  <div style={styles.label}>Specify unit</div>
                  <input
                    style={styles.input}
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="e.g., tray"
                  />
                </div>
              )}

              <div style={styles.field}>
                <div style={styles.label}>Low stock threshold</div>
                <input
                  style={styles.input}
                  value={newMin}
                  onChange={(e) => setNewMin(digitsOnly(e.target.value))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                />
              </div>

              <div style={styles.buttonRow}>
                <FancyButton
                  style={styles.btnPrimary}
                  type="submit"
                  icon={<Plus size={16} />}
                >
                  Add Item
                </FancyButton>
              </div>
            </form>
          </motion.div>
        )}

        {isAdmin && currentSection === "transactions" && (
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ArrowDownUp size={18} />
              Release / Stock In
            </h2>

            <form onSubmit={applyTxn}>
              <div style={styles.field}>
                <div style={styles.label}>Select item</div>
                <select
                  style={styles.select}
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value="" disabled>
                    -- choose item --
                  </option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.quantity} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <div style={styles.label}>Transaction</div>
                  <select
                    style={styles.select}
                    value={txnType}
                    onChange={(e) => setTxnType(e.target.value)}
                  >
                    <option value="OUT">Stock Out (Release)</option>
                    <option value="IN">Stock In (Add)</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Quantity</div>
                  <input
                    style={styles.input}
                    value={txnQty}
                    onChange={(e) => setTxnQty(digitsOnly(e.target.value))}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.label}>Note</div>
                <input
                  style={styles.input}
                  value={txnNote}
                  onChange={(e) => setTxnNote(e.target.value)}
                  placeholder='e.g., "Used for printing"'
                />
              </div>

              <div style={styles.buttonRow}>
                <FancyButton
                  style={styles.btnPrimary}
                  type="submit"
                  icon={<ArrowDownUp size={16} />}
                >
                  Save Transaction
                </FancyButton>
              </div>
            </form>

            <div style={styles.helperText}>
              Example: If you added <b>100</b> then Stock Out <b>50</b>, remaining becomes <b>50</b>.
            </div>
          </motion.div>
        )}

        {currentSection === "items" && (
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Package2 size={18} />
              Items
              {activeFilter !== "all" && (
                <span style={styles.badge}>Filtered: {filteredItems.length} items</span>
              )}
              {selectedItems.size > 0 && (
                <span style={styles.badge}>{selectedItems.size} selected</span>
              )}
            </h2>

            <QuickFilters />

            {isAdmin && selectedItems.size > 0 && (
              <div style={styles.bulkActionsBar}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedItems.size} item(s) selected
                </span>
                <FancyButton
                  style={styles.btnWarning}
                  onClick={bulkRecycle}
                  icon={<Archive size={14} />}
                >
                  Recycle Selected
                </FancyButton>
                <FancyButton
                  style={styles.btnPrimary}
                  onClick={bulkUpdateMinLevel}
                  icon={<RefreshCw size={14} />}
                >
                  Update Min Level
                </FancyButton>
                <FancyButton
                  style={styles.btn}
                  onClick={() => {
                    setSelectedItems(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </FancyButton>
              </div>
            )}

            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>Search</div>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#64748b",
                    }}
                  />
                  <input
                    style={{ ...styles.input, paddingLeft: 40 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search item name..."
                  />
                </div>
              </div>
              <div />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {isAdmin && (
                      <th style={{ ...styles.th, width: 40 }}>
                        <input
                          type="checkbox"
                          style={styles.checkbox}
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Low stock</th>
                    <th style={styles.th}>Updated</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={isAdmin ? 7 : 6}>
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((it) => {
                      const isLow =
                        Number(it.min_level) > 0 &&
                        Number(it.quantity) <= Number(it.min_level);

                      return (
                        <tr key={it.id}>
                          {isAdmin && (
                            <td style={styles.td}>
                              <input
                                type="checkbox"
                                style={styles.checkbox}
                                checked={selectedItems.has(it.id)}
                                onChange={() => toggleItemSelection(it.id)}
                              />
                            </td>
                          )}
                          <td style={styles.td}>{it.name}</td>
                          <td style={styles.td}>
                            <b>{it.quantity}</b>
                          </td>
                          <td style={styles.td}>
                            {editingItemId === it.id ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                  minWidth: 140,
                                }}
                              >
                                <select
                                  style={styles.select}
                                  value={editUnit}
                                  onChange={(e) => setEditUnit(e.target.value)}
                                >
                                  {UNIT_OPTIONS.map((unit) => (
                                    <option key={unit} value={unit}>
                                      {unit === "others" ? "Others" : unit}
                                    </option>
                                  ))}
                                </select>

                                {editUnit === "others" && (
                                  <input
                                    style={styles.input}
                                    value={editCustomUnit}
                                    onChange={(e) => setEditCustomUnit(e.target.value)}
                                    placeholder="Enter unit"
                                  />
                                )}
                              </div>
                            ) : (
                              it.unit
                            )}
                          </td>
                          <td style={styles.td}>
                            {Number(it.min_level) > 0 ? (
                              <span style={isLow ? styles.badgeLow : styles.badge}>
                                {isLow ? "LOW" : "OK"} (≤ {it.min_level})
                              </span>
                            ) : (
                              <span style={styles.badge}>Not set</span>
                            )}
                          </td>
                          <td style={styles.td}>{formatDate(it.updated_at)}</td>
                          <td style={styles.td}>
                            <div style={styles.buttonRow}>
                              {isAdmin ? (
                                <>
                                  {editingItemId === it.id ? (
                                    <>
                                      <FancyButton
                                        type="button"
                                        style={styles.btnSuccess}
                                        onClick={() => saveItemUnit(it.id)}
                                      >
                                        Save Unit
                                      </FancyButton>

                                      <FancyButton
                                        type="button"
                                        style={styles.btn}
                                        onClick={cancelEditUnit}
                                      >
                                        Cancel
                                      </FancyButton>
                                    </>
                                  ) : (
                                    <>
                                      <FancyButton
                                        type="button"
                                        style={styles.btn}
                                        onClick={() => handleSelectItem(it.id)}
                                        icon={<Activity size={15} />}
                                      >
                                        Select
                                      </FancyButton>

                                      <FancyButton
                                        type="button"
                                        style={styles.btnPrimary}
                                        onClick={() => startEditUnit(it)}
                                      >
                                        Edit Unit
                                      </FancyButton>

                                      <FancyButton
                                        type="button"
                                        style={styles.btnWarning}
                                        onClick={() => deleteItem(it.id)}
                                        icon={<Archive size={15} />}
                                      >
                                        Recycle
                                      </FancyButton>
                                    </>
                                  )}
                                </>
                              ) : (
                                <span style={styles.badge}>View only</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {isAdmin && currentSection === "recycle-bin" && (
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Archive size={18} />
              Recycle Bin
            </h2>

            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>Search deleted items</div>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#64748b",
                    }}
                  />
                  <input
                    style={{ ...styles.input, paddingLeft: 40 }}
                    value={binSearch}
                    onChange={(e) => setBinSearch(e.target.value)}
                    placeholder="Search deleted item name..."
                  />
                </div>
              </div>
              <div />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Deleted</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeletedItems.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={5}>
                        Recycle Bin is empty.
                      </td>
                    </tr>
                  ) : (
                    filteredDeletedItems.map((it) => (
                      <tr key={it.id}>
                        <td style={styles.td}>{it.name}</td>
                        <td style={styles.td}>{it.quantity}</td>
                        <td style={styles.td}>{it.unit}</td>
                        <td style={styles.td}>{formatDate(it.deleted_at)}</td>
                        <td style={styles.td}>
                          <div style={styles.buttonRow}>
                            <FancyButton
                              type="button"
                              style={styles.btnPrimary}
                              onClick={() => restoreItem(it.id)}
                              icon={<RotateCcw size={15} />}
                            >
                              Restore
                            </FancyButton>

                            <FancyButton
                              type="button"
                              style={styles.btnDanger}
                              onClick={() => deleteForever(it.id)}
                              icon={<Trash2 size={15} />}
                            >
                              Delete Forever
                            </FancyButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {currentSection === "history" && (
          <motion.div
            style={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Activity size={18} />
              Transaction History
            </h2>

            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>Search</div>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#64748b",
                    }}
                  />
                  <input
                    style={{ ...styles.input, paddingLeft: 40 }}
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    placeholder="Search item, note, type, qty, or date..."
                  />
                </div>
              </div>
              <div />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Note</th>
                    {isAdmin && <th style={styles.th}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={isAdmin ? 6 : 5}>
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTxns.map((t) => {
                      const it = itemMap.get(t.item_id);
                      return (
                        <tr key={t.id}>
                          <td style={styles.td}>{formatDate(t.at)}</td>
                          <td style={styles.td}>
                            <span style={t.type === "OUT" ? styles.badgeLow : styles.badge}>
                              {t.type === "OUT" ? "OUT" : "IN"}
                            </span>
                          </td>
                          <td style={styles.td}>{it ? it.name : "(deleted item)"}</td>
                          <td style={styles.td}>
                            {t.qty} {it?.unit ?? ""}
                          </td>
                          <td style={styles.td}>
                            {editingTxnId === t.id ? (
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                  style={styles.editNoteInput}
                                  value={editTxnNote}
                                  onChange={(e) => setEditTxnNote(e.target.value)}
                                  placeholder="Edit note..."
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveTxnNote(t.id);
                                    } else if (e.key === "Escape") {
                                      cancelEditTxnNote();
                                    }
                                  }}
                                  autoFocus
                                />
                                <FancyButton
                                  type="button"
                                  style={styles.btnSuccess}
                                  onClick={() => saveTxnNote(t.id)}
                                  icon={<Check size={14} />}
                                >
                                  Save
                                </FancyButton>
                                <FancyButton
                                  type="button"
                                  style={styles.btn}
                                  onClick={cancelEditTxnNote}
                                  icon={<X size={14} />}
                                >
                                  Cancel
                                </FancyButton>
                              </div>
                            ) : (
                              t.note || "-"
                            )}
                          </td>
                          {isAdmin && (
                            <td style={styles.td}>
                              {editingTxnId !== t.id && (
                                <FancyButton
                                  type="button"
                                  style={{
                                    ...styles.btnPrimary,
                                    padding: "6px 12px",
                                    fontSize: 12,
                                  }}
                                  onClick={() => startEditTxnNote(t)}
                                  icon={<Edit3 size={14} />}
                                >
                                  Edit Note
                                </FancyButton>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.footer}>Data is saved in Supabase (Postgres).</div>
          </motion.div>
        )}

        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            style={styles.scrollTopButton}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            title="Scroll to top"
          >
            <ArrowUp size={22} />
          </motion.button>
        )}
      </div>
    </div>
  );
}