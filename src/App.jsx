import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  Database,
  Package2,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  Archive,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

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

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    background:
      "radial-gradient(circle at top left, rgba(255,255,255,0.10), transparent 22%), linear-gradient(180deg, #0f3d1e 0%, #17612b 38%, #2f8f3a 100%)",
    color: "#ffffff",
    padding: 20,
  },

  shell: {
    maxWidth: 1280,
    margin: "0 auto",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: "28px 28px 34px",
    marginBottom: 18,
    background:
      "linear-gradient(135deg, rgba(7,28,14,0.42), rgba(255,255,255,0.04))",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
    backdropFilter: "blur(14px)",
  },

  heroGlow: {
    position: "absolute",
    right: -80,
    top: -80,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(44px, 10vw, 118px)",
    lineHeight: 0.88,
    fontWeight: 900,
    letterSpacing: "-0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
    position: "relative",
    zIndex: 1,
  },

  heroMetaRow: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },

  statsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(7, 28, 14, 0.26)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
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
    background: "rgba(7, 28, 14, 0.26)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    backdropFilter: "blur(8px)",
    cursor: "pointer",
  },

  header: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 16,
  },

  h1: {
    margin: 0,
    fontSize: 28,
    color: "#ffffff",
    letterSpacing: "-0.03em",
  },

  subtle: {
    color: "rgba(255,255,255,0.78)",
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
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(7, 28, 14, 0.22)",
    color: "#fff",
    userSelect: "none",
    backdropFilter: "blur(8px)",
  },

  badgeOk: {
    border: "1px solid rgba(134,239,172,0.40)",
    background: "rgba(22,163,74,0.20)",
    color: "#f0fdf4",
  },

  badgeErr: {
    border: "1px solid rgba(252,165,165,0.45)",
    background: "rgba(220,38,38,0.20)",
    color: "#fff1f2",
  },

  badgeChecking: {
    border: "1px solid rgba(125,211,252,0.40)",
    background: "rgba(2,132,199,0.20)",
    color: "#f0f9ff",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    alignItems: "start",
  },

  card: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 20px 50px rgba(0,0,0,0.20)",
    background: "rgba(8, 30, 15, 0.24)",
    backdropFilter: "blur(14px)",
    color: "#fff",
  },

  cardFull: {
    gridColumn: "1 / -1",
  },

  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  input: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.18)",
    outline: "none",
    background: "rgba(255,255,255,0.94)",
    color: "#0f172a",
    fontSize: 14,
  },

  select: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.18)",
    outline: "none",
    background: "rgba(255,255,255,0.94)",
    color: "#0f172a",
    fontSize: 14,
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
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(7, 28, 14, 0.28)",
    color: "#fff",
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
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
  },

  btnDanger: {
    padding: "11px 18px",
    borderRadius: 999,
    border: "1px solid rgba(254,202,202,0.34)",
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
    border: "1px solid rgba(253,224,71,0.34)",
    background: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)",
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
    background: "rgba(6, 22, 11, 0.20)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    fontSize: 12,
    color: "rgba(255,255,255,0.76)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    padding: "12px 10px",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  td: {
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "12px 10px",
    fontSize: 13,
    color: "#fff",
    verticalAlign: "middle",
  },

  badgeLow: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(254,202,202,0.42)",
    background: "rgba(127,29,29,0.28)",
    color: "#fff1f2",
  },

  error: {
    background: "rgba(127,29,29,0.35)",
    border: "1px solid rgba(252,165,165,0.30)",
    padding: 12,
    borderRadius: 16,
    color: "#fff1f2",
    marginBottom: 12,
    fontSize: 13,
    backdropFilter: "blur(8px)",
  },

  ok: {
    background: "rgba(6,95,70,0.30)",
    border: "1px solid rgba(110,231,183,0.28)",
    padding: 12,
    borderRadius: 16,
    color: "#ecfdf5",
    marginBottom: 12,
    fontSize: 13,
    backdropFilter: "blur(8px)",
  },

  footer: {
    marginTop: 16,
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
  },

  helperText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    marginTop: 10,
    lineHeight: 1.6,
  },
};

export default function App() {
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [txns, setTxns] = useState([]);

  const [message, setMessage] = useState(null);
  const msgTimerRef = useRef(null);
  const txnSectionRef = useRef(null);
  const itemsSectionRef = useRef(null);
  const binSectionRef = useRef(null);

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("ream");
  const [customUnit, setCustomUnit] = useState("");
  const [newQty, setNewQty] = useState("0");
  const [newMin, setNewMin] = useState("0");

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

  const [authLoading, setAuthLoading] = useState(true);

  const isAdmin =
    role === "admin" ||
    (profile?.email || session?.user?.email) === "adminrpbdd@gmail.com";
  const isGuest = role === "guest";

  function showMessage(type, text) {
    setMessage({ type, text });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage(null), 3000);
  }

  function handleSelectItem(itemId) {
    if (!isAdmin) return;
    setSelectedItemId(itemId);
    txnSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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
        .single();

      if (error) {
        console.error("Profile load error:", error);
        setProfile(null);
        setRole(null);
        showMessage("error", "Could not load user profile.");
        return;
      }

      setProfile(data);
      setRole(data.role);
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
    showMessage("ok", "Logged out.");
  }

  async function refreshData(preferSelectedId) {
    if (!session) {
      setItems([]);
      setDeletedItems([]);
      setTxns([]);
      setSelectedItemId("");
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
      preferSelectedId &&
      (itemsData ?? []).some((x) => x.id === preferSelectedId)
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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, search]);

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
          </motion.div>

          <div
            style={{
              ...styles.card,
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            <h2 style={styles.cardTitle}>
              <ShieldCheck size={18} />
              Login
            </h2>

            {message?.type === "error" && <div style={styles.error}>{message.text}</div>}
            {message?.type === "ok" && <div style={styles.ok}>{message.text}</div>}

            <form onSubmit={handleLogin}>
              <div style={styles.field}>
                <div style={styles.label}>Email</div>
                <input
                  style={styles.input}
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div style={styles.field}>
                <div style={styles.label}>Password</div>
                <input
                  style={styles.input}
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div style={styles.buttonRow}>
                <FancyButton
                  type="submit"
                  style={styles.btnPrimary}
                  icon={<ShieldCheck size={16} />}
                >
                  Login
                </FancyButton>
              </div>
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
              onClick={() => scrollToSection(itemsSectionRef)}
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
                onClick={() => scrollToSection(binSectionRef)}
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
                {profile?.email || session.user.email} • {isAdmin ? "admin" : isGuest ? "guest" : "user"}
              </span>
            </div>

            <div style={styles.subtle}>
              {isAdmin
                ? `Manual input of supplies. Stock-out automatically subtracts quantity.${lowCount > 0 ? ` • Low stock alerts: ${lowCount}` : ""}`
                : "Guest view: you can view items and transaction history only."}
            </div>
          </div>

          <div style={styles.buttonRow}>
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

            <FancyButton
              style={styles.btn}
              onClick={handleLogout}
              icon={<LogOut size={16} />}
            >
              Logout
            </FancyButton>
          </div>
        </div>

        {message?.type === "error" && <div style={styles.error}>{message.text}</div>}
        {message?.type === "ok" && <div style={styles.ok}>{message.text}</div>}

        <div style={styles.grid}>
          {isAdmin && (
            <motion.div
              style={styles.card}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <h2 style={styles.cardTitle}>
                <Plus size={18} />
                Add Supply
              </h2>

              <form onSubmit={addItem}>
                <div style={styles.field}>
                  <div style={styles.label}>Item name</div>
                  <input
                    style={styles.input}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Bond Paper"
                  />
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

          {isAdmin && (
            <motion.div
              ref={txnSectionRef}
              style={styles.card}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <h2 style={styles.cardTitle}>
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

          <motion.div
            ref={itemsSectionRef}
            style={{ ...styles.card, ...styles.cardFull }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <h2 style={styles.cardTitle}>
              <Package2 size={18} />
              Items
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
                      <td style={styles.td} colSpan={6}>
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
                          <td style={styles.td}>{it.name}</td>
                          <td style={styles.td}>
                            <b>{it.quantity}</b>
                          </td>
                          <td style={styles.td}>{it.unit}</td>
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
                                    style={styles.btnWarning}
                                    onClick={() => deleteItem(it.id)}
                                    icon={<Archive size={15} />}
                                  >
                                    Recycle
                                  </FancyButton>
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

          {isAdmin && (
            <motion.div
              ref={binSectionRef}
              style={{ ...styles.card, ...styles.cardFull }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <h2 style={styles.cardTitle}>
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

          <motion.div
            style={{ ...styles.card, ...styles.cardFull }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <h2 style={styles.cardTitle}>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={5}>
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
                          <td style={styles.td}>{t.note || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.footer}>Data is saved in Supabase (Postgres).</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}