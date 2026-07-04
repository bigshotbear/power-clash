import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { calculateFighterBadges } from "../lib/badgeEngine";

const LEVEL_COLORS = { Bronze: "#c17a4a", Silver: "#b7bfc9", Gold: "var(--gold-bright)" };

export default function SavedFighters({ user, onNavigate }) {
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadFighters = async () => {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("fighters")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (loadError) {
      setError("Could not load fighters: " + loadError.message);
      return;
    }
    setFighters(data || []);
  };

  useEffect(() => {
    loadFighters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fighters;
    return fighters.filter((f) =>
      f.fighter_name.toLowerCase().includes(q) ||
      f.power_source.toLowerCase().includes(q) ||
      f.fighting_style.toLowerCase().includes(q)
    );
  }, [fighters, search]);

  const handleDelete = async (id) => {
    const { error: deleteError } = await supabase.from("fighters").delete().eq("id", id);
    if (deleteError) {
      setError("Delete failed: " + deleteError.message);
      return;
    }
    setConfirmDeleteId(null);
    setFighters((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ color: "var(--gold-bright)", textTransform: "uppercase" }}>Saved Fighters</h2>
      </div>

      <button className="btn btn-primary" onClick={() => onNavigate("fighterBuilder")}>
        + Create Fighter
      </button>

      <input
        className="search-bar"
        placeholder="Search by name, power source, or style..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="center" style={{ padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="display">No fighters yet</div>
          <p>Build your first fighter to start Power Clash.</p>
        </div>
      ) : (
        filtered.map((f) => {
          const badges = calculateFighterBadges(f, f.power_point_cost, f.power_point_cap).slice(0, 3);
          return (
          <div className="card fighter-card" key={f.id}>
            <div className="fighter-thumb" />
            <div className="fighter-card-body">
              <div className="fighter-card-name">{f.fighter_name}</div>
              <div className="fighter-card-meta">
                {f.character_type} · {f.power_source} · {f.fighting_style}
              </div>
              <div className="fighter-card-meta">
                Stats {f.stat_total}/100 · Power Cost {f.power_point_cost}/{f.power_point_cap}
              </div>
              {badges.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {badges.map((b) => (
                    <span
                      key={b.name}
                      className="chip"
                      title={b.description}
                      style={{ borderColor: LEVEL_COLORS[b.level], color: LEVEL_COLORS[b.level], fontSize: 10 }}
                    >
                      {b.level === "Gold" ? "🥇" : b.level === "Silver" ? "🥈" : "🥉"} {b.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="fighter-card-actions">
              <button
                className="icon-btn"
                title="Edit"
                onClick={() => onNavigate("fighterBuilder", { fighterId: f.id })}
              >
                ✎
              </button>
              <button
                className="icon-btn"
                title="Duplicate"
                onClick={() => onNavigate("fighterBuilder", { duplicateFrom: f.id })}
              >
                ⧉
              </button>
              <button
                className="icon-btn"
                title="Delete"
                onClick={() => setConfirmDeleteId(f.id)}
              >
                ✕
              </button>
            </div>

            {confirmDeleteId === f.id && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(9,11,16,0.92)", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ fontSize: 14 }}>Delete {f.fighter_name}?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-danger" style={{ width: "auto", padding: "8px 16px", marginBottom: 0 }} onClick={() => handleDelete(f.id)}>Delete</button>
                  <button className="btn btn-ghost" style={{ width: "auto", padding: "8px 16px", marginBottom: 0 }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
          );
        })
      )}
    </div>
  );
}
