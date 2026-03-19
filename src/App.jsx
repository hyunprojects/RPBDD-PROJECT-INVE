// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "office_inventory_v1";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function clampNonNegative(n) {
  return Math.max(0, n);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.txns)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const styles = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    padding: 16,
    maxWidth: 1200,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    gap: 12,
    alignItems: "baseline",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  h1: { margin: 0, fontSize: 22 },
  subtle: { color: "#555", fontSize: 13, marginTop: 4 },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignItems: "start",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
    background: "#fff",
  },
  cardTitle: { margin: "0 0 8px 0", fontSize: 16 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
  label: { fontSize: 12, color: "#333" },
  input: {
    padding: "9px 10px",
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
  },
  select: {
    padding: "9px 10px",
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
    background: "#fff",
  },
  buttonRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 },
  btn: {
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "#f7f7f7",
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #2b6cb0",
    background: "#3182ce",
    color: "#fff",
    cursor: "pointer",
  },
  btnDanger: {
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #b91c1c",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#444",
    borderBottom: "1px solid #eee",
    padding: "10px 8px",
    whiteSpace: "nowrap",
  },
  td: { borderBottom: "1px solid #f0f0f0", padding: "10px 8px", fontSize: 13 },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #ddd",
    background: "#fafafa",
  },
  badgeLow: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#9f1239",
  },
  error: {
    background: "#fff1f2",
    border: "1px solid #fecaca",
    padding: 10,
    borderRadius: 10,
    color: "#9f1239",
    marginBottom: 10,
    fontSize: 13,
  },
  ok: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    padding: 10,
    borderRadius: 10,
    color: "#065f46",
    marginBottom: 10,
    fontSize: 13,
  },
  footer: { marginTop: 16, color: "#666", fontSize: 12 },
};

export default function App() {
  const [items, setItems] = useState([]);
  const [txns, setTxns] = useState([]);

  const [message, setMessage] = useState(null);
  const msgTimerRef = useRef(null);

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("ream");
  const [newQty, setNewQty] = useState("0");
  const [newMin, setNewMin] = useState("0");

  const [selectedItemId, setSelectedItemId] = useState("");
  const [txnType, setTxnType] = useState("OUT");
  const [txnQty, setTxnQty] = useState("");
  const [txnNote, setTxnNote] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      setItems(loaded.items);
      setTxns(loaded.txns);
      setSelectedItemId(loaded.items[0]?.id ?? "");
    } else {
      const seed = [
        {
          id: uid(),
          name: "Bond Paper",
          unit: "ream",
          quantity: 100,
          minLevel: 10,
          updatedAt: nowIso(),
        },
      ];
      setItems(seed);
      setSelectedItemId(seed[0].id);
      setTxns([]);
    }
  }, []);

  useEffect(() => {
    saveState({ items, txns });
  }, [items, txns]);

  function showMessage(type, text) {
    setMessage({ type, text });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage(null), 3000);
  }

  function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ");
  }

  function addItem(e) {
    e.preventDefault();
    const name = normalizeName(newName);
    const unit = newUnit.trim() || "pcs";
    const qty = toNumber(newQty);
    const minLevel = toNumber(newMin);

    if (!name) return showMessage("error", "Item name is required.");
    if (!Number.isFinite(qty) || qty < 0)
      return showMessage("error", "Initial quantity must be 0 or more.");
    if (!Number.isFinite(minLevel) || minLevel < 0)
      return showMessage("error", "Min level must be 0 or more.");

    const exists = items.some((it) => it.name.toLowerCase() === name.toLowerCase());
    if (exists) return showMessage("error", "Item already exists. Use Stock In to add more.");

    const item = {
      id: uid(),
      name,
      unit,
      quantity: clampNonNegative(qty),
      minLevel: clampNonNegative(minLevel),
      updatedAt: nowIso(),
    };

    setItems((prev) => [item, ...prev]);

    if (qty > 0) {
      const t = {
        id: uid(),
        type: "IN",
        itemId: item.id,
        qty,
        note: "Initial stock",
        at: nowIso(),
      };
      setTxns((prev) => [t, ...prev]);
    }

    setNewName("");
    setNewQty("0");
    setNewMin("0");
    setSelectedItemId(item.id);
    showMessage("ok", `Added "${name}".`);
  }

  function applyTxn(e) {
    e.preventDefault();
    if (!selectedItemId) return showMessage("error", "Please select an item.");
    const qty = toNumber(txnQty);
    if (!Number.isFinite(qty) || qty <= 0)
      return showMessage("error", "Quantity must be greater than 0.");

    const item = items.find((it) => it.id === selectedItemId);
    if (!item) return showMessage("error", "Selected item not found.");

    const note = txnNote.trim();

    if (txnType === "OUT" && qty > item.quantity) {
      return showMessage("error", `Not enough stock. Available: ${item.quantity} ${item.unit}.`);
    }

    const delta = txnType === "IN" ? qty : -qty;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== selectedItemId) return it;
        return {
          ...it,
          quantity: clampNonNegative(it.quantity + delta),
          updatedAt: nowIso(),
        };
      })
    );

    const t = {
      id: uid(),
      type: txnType,
      itemId: selectedItemId,
      qty,
      note,
      at: nowIso(),
    };
    setTxns((prev) => [t, ...prev]);

    setTxnQty("");
    setTxnNote("");

    const verb = txnType === "IN" ? "Stock in" : "Released";
    showMessage("ok", `${verb} ${qty} ${item.unit} for "${item.name}".`);
  }

  function deleteItem(itemId) {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const yes = window.confirm(`Delete "${item.name}"?\nThis will also remove its transactions.`);
    if (!yes) return;

    setItems((prev) => prev.filter((it) => it.id !== itemId));
    setTxns((prev) => prev.filter((t) => t.itemId !== itemId));

    if (selectedItemId === itemId) {
      const next = items.find((it) => it.id !== itemId)?.id ?? "";
      setSelectedItemId(next);
    }

    showMessage("ok", `Deleted "${item.name}".`);
  }

  function clearAll() {
    const yes = window.confirm("Clear ALL items and transactions?");
    if (!yes) return;
    setItems([]);
    setTxns([]);
    setSelectedItemId("");
    showMessage("ok", "Cleared everything.");
  }

  const itemMap = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, search]);

  const lowCount = useMemo(() => {
    return items.filter((it) => it.quantity <= it.minLevel && it.minLevel > 0).length;
  }, [items]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>RPBDD SUPPLIES INVENTORY SYSTEM</h1>
          <div style={styles.subtle}>
            Manual input of supplies. Stock-out automatically subtracts quantity.
            {lowCount > 0 ? ` • Low stock alerts: ${lowCount}` : ""}
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.btn} onClick={clearAll} title="Danger: clears all data">
            Clear All
          </button>
        </div>
      </div>

      {message?.type === "error" && <div style={styles.error}>{message.text}</div>}
      {message?.type === "ok" && <div style={styles.ok}>{message.text}</div>}

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Add Supply (Stock Item)</h2>

          <form onSubmit={addItem}>
            <div style={styles.field}>
              <div style={styles.label}>Item name (e.g., Bond Paper)</div>
              <input
                style={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Bond Paper"
              />
            </div>

            {/* SWAPPED: Initial quantity first, Unit second */}
            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>Initial quantity</div>
                <input
                  style={styles.input}
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>

              <div style={styles.field}>
                <div style={styles.label}>Unit (e.g., ream, pcs, box)</div>
                <input
                  style={styles.input}
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="ream"
                />
              </div>
            </div>

            <div style={styles.field}>
              <div style={styles.label}>Low stock threshold (optional)</div>
              <input
                style={styles.input}
                value={newMin}
                onChange={(e) => setNewMin(e.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} type="submit">
                Add Item
              </button>
            </div>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Release / Stock In (Auto +/-)</h2>

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
                  onChange={(e) => setTxnQty(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div style={styles.field}>
              <div style={styles.label}>Note (optional)</div>
              <input
                style={styles.input}
                value={txnNote}
                onChange={(e) => setTxnNote(e.target.value)}
                placeholder='e.g., "Used for printing"'
              />
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.btnPrimary} type="submit">
                Save Transaction
              </button>
            </div>
          </form>

          <div style={{ ...styles.subtle, marginTop: 10 }}>
            Example: If you added <b>100 reams</b> then do <b>Stock Out 50</b>, the remaining becomes{" "}
            <b>50 reams</b>.
          </div>
        </div>

        <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
          <h2 style={styles.cardTitle}>Items</h2>

          <div style={styles.row}>
            <div style={styles.field}>
              <div style={styles.label}>Search</div>
              <input
                style={styles.input}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item name..."
              />
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
                    const isLow = it.minLevel > 0 && it.quantity <= it.minLevel;
                    return (
                      <tr key={it.id}>
                        <td style={styles.td}>{it.name}</td>
                        <td style={styles.td}>
                          <b>{it.quantity}</b>
                        </td>
                        <td style={styles.td}>{it.unit}</td>
                        <td style={styles.td}>
                          {it.minLevel > 0 ? (
                            <span style={isLow ? styles.badgeLow : styles.badge}>
                              {isLow ? "LOW" : "OK"} (≤ {it.minLevel})
                            </span>
                          ) : (
                            <span style={styles.badge}>Not set</span>
                          )}
                        </td>
                        <td style={styles.td}>{formatDate(it.updatedAt)}</td>
                        <td style={styles.td}>
                          <div style={styles.buttonRow}>
                            <button
                              style={styles.btn}
                              onClick={() => setSelectedItemId(it.id)}
                              title="Select item for transaction"
                            >
                              Select
                            </button>
                            <button
                              style={styles.btnDanger}
                              onClick={() => deleteItem(it.id)}
                              title="Delete item"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
          <h2 style={styles.cardTitle}>Transaction History</h2>

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
                {txns.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={5}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  txns.map((t) => {
                    const it = itemMap.get(t.itemId);
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

          <div style={styles.footer}>
            Data is saved in your browser (localStorage). If you want multi-user or database version (Firebase / MySQL),
            tell me and I’ll upgrade it.
          </div>
        </div>
      </div>
    </div>
  );
}