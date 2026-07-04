import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { encodeTeamCode } from "../lib/teamCode";
import { calculateTeamBadges } from "../lib/badgeEngine";

const LEVEL_COLORS = { Bronze: "#c17a4a", Silver: "#b7bfc9", Gold: "var(--gold-bright)" };

export default function SavedTeams({ user, onNavigate }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadTeams = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (loadError) {
      setError("Could not load teams: " + loadError.message);
      return;
    }
    setTeams(data || []);
  };

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleDelete = async (id) => {
    const { error: deleteError } = await supabase.from("teams").delete().eq("id", id);
    if (deleteError) {
      setError("Delete failed: " + deleteError.message);
      return;
    }
    setConfirmDeleteId(null);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicate = async (team) => {
    const { id, created_at, updated_at, wins, losses, win_rate, ...rest } = team;
    const { error: dupError } = await supabase.from("teams").insert({
      ...rest,
      team_name: `${team.team_name} (Copy)`,
      wins: 0,
      losses: 0,
      win_rate: 0
    });
    if (dupError) {
      setError("Duplicate failed: " + dupError.message);
      return;
    }
    loadTeams();
  };

  const handleCopyCode = async (team) => {
    const code = encodeTeamCode({ ...team, owner_display_name: user.email });
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(team.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard API may be unavailable — fall back to a visible prompt.
      window.prompt("Copy this team code:", code);
    }
  };

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>Saved Teams</h2>

      <button className="btn btn-primary" onClick={() => onNavigate("teamBuilder")}>+ Create Team</button>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="center" style={{ padding: 40 }}><div className="spinner" /></div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <div className="display">No teams yet</div>
          <p>Build a team from your saved fighters to start battling.</p>
        </div>
      ) : (
        teams.map((t) => {
          const teamBadges = calculateTeamBadges(t);
          return (
          <div className="card" key={t.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="fighter-card-name">{t.team_name}</div>
                <div className="fighter-card-meta">{t.battle_mode} · {t.fighter_snapshots?.length || 0} fighters</div>
                <div className="fighter-card-meta">Record: {t.wins || 0}W - {t.losses || 0}L</div>
              </div>
              <div className="fighter-card-actions">
                <button className="icon-btn" title="Edit" onClick={() => onNavigate("teamBuilder", { teamId: t.id })}>✎</button>
                <button className="icon-btn" title="Duplicate" onClick={() => handleDuplicate(t)}>⧉</button>
                <button className="icon-btn" title="Delete" onClick={() => setConfirmDeleteId(t.id)}>✕</button>
              </div>
            </div>

            {t.detected_synergies?.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {t.detected_synergies.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            )}

            {teamBadges.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {teamBadges.map((b) => (
                  <span key={b.name} className="chip" style={{ borderColor: LEVEL_COLORS[b.level], color: LEVEL_COLORS[b.level] }}>
                    {b.level === "Gold" ? "🥇" : b.level === "Silver" ? "🥈" : "🥉"} {b.name}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-primary"
                style={{ marginBottom: 0 }}
                onClick={() => onNavigate("battleSetupHub", { myTeamId: t.id })}
              >
                Battle With This Team
              </button>
              <button
                className="btn"
                style={{ marginBottom: 0, width: "auto", padding: "16px 18px" }}
                onClick={() => handleCopyCode(t)}
              >
                {copiedId === t.id ? "Copied!" : "Copy Code"}
              </button>
            </div>

            {confirmDeleteId === t.id && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(9,11,16,0.94)", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ fontSize: 14 }}>Delete {t.team_name}?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-danger" style={{ width: "auto", padding: "8px 16px", marginBottom: 0 }} onClick={() => handleDelete(t.id)}>Delete</button>
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
