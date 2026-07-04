import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { buildTeamComputedFields, detectSynergies } from "../lib/teamHelpers";
import { calculateFighterBadges, calculateTeamBadges } from "../lib/badgeEngine";

const LEVEL_COLORS = { Bronze: "#c17a4a", Silver: "#b7bfc9", Gold: "var(--gold-bright)" };

const MODE_COUNTS = { "1v1": 1, "2v2": 2, "3v3": 3 };

export default function TeamBuilder({ user, teamId, onNavigate }) {
  const [battleMode, setBattleMode] = useState("1v1");
  const [teamName, setTeamName] = useState("");
  const [allFighters, setAllFighters] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = !!teamId;
  const requiredCount = MODE_COUNTS[battleMode];

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: fighters, error: loadError } = await supabase
        .from("fighters")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (loadError) {
        setError("Could not load fighters: " + loadError.message);
        setLoading(false);
        return;
      }
      setAllFighters(fighters || []);

      if (teamId) {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();

        if (teamError) {
          setError("Could not load team: " + teamError.message);
        } else if (team) {
          setTeamName(team.team_name);
          setBattleMode(team.battle_mode);
          setSelectedIds(team.fighter_ids || []);
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, teamId]);

  const toggleFighter = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= requiredCount) {
        setError(`${battleMode} needs exactly ${requiredCount} fighter${requiredCount > 1 ? "s" : ""}. Deselect one first.`);
        return prev;
      }
      setError("");
      return [...prev, id];
    });
  };

  const selectedFighters = useMemo(
    () => allFighters.filter((f) => selectedIds.includes(f.id)),
    [allFighters, selectedIds]
  );

  const previewSynergies = useMemo(
    () => (selectedFighters.length === requiredCount ? detectSynergies(selectedFighters) : []),
    [selectedFighters, requiredCount]
  );

  const teamBadges = useMemo(
    () => (selectedFighters.length === requiredCount ? calculateTeamBadges({ fighter_snapshots: selectedFighters }) : []),
    [selectedFighters, requiredCount]
  );

  const handleModeChange = (mode) => {
    setBattleMode(mode);
    setSelectedIds([]);
    setError("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!teamName.trim()) {
      setError("Team name cannot be empty.");
      return;
    }
    if (selectedFighters.length !== requiredCount) {
      setError(`Select exactly ${requiredCount} fighter${requiredCount > 1 ? "s" : ""} for ${battleMode}.`);
      return;
    }

    setSaving(true);

    const computed = buildTeamComputedFields(selectedFighters);
    const payload = {
      owner_id: user.id,
      team_name: teamName.trim(),
      battle_mode: battleMode,
      ...computed,
      updated_at: new Date().toISOString()
    };

    let saveError;
    if (isEditing) {
      ({ error: saveError } = await supabase.from("teams").update(payload).eq("id", teamId));
    } else {
      ({ error: saveError } = await supabase.from("teams").insert(payload));
    }

    setSaving(false);

    if (saveError) {
      setError("Save failed: " + saveError.message);
      return;
    }

    setSuccess(isEditing ? "Team updated." : "Team saved.");
    setTimeout(() => onNavigate("savedTeams"), 600);
  };

  if (loading) {
    return (
      <div className="page center" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>
        {isEditing ? "Edit Team" : "Team Builder"}
      </h2>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="card">
        <div className="field">
          <label>Team Name</label>
          <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. The Vanguard" />
        </div>

        <div className="field">
          <label>Battle Mode</label>
          <select value={battleMode} onChange={(e) => handleModeChange(e.target.value)}>
            <option value="1v1">1v1 — 1 fighter</option>
            <option value="2v2">2v2 — 2 fighters</option>
            <option value="3v3">3v3 — 3 fighters</option>
          </select>
        </div>

        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
          Selected {selectedFighters.length} / {requiredCount}
        </div>
      </div>

      {allFighters.length === 0 ? (
        <div className="empty-state">
          <div className="display">No saved fighters</div>
          <p>Create fighters first, then build a team from them.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Choose Your Fighters</div>
          {allFighters.map((f) => {
            const isSelected = selectedIds.includes(f.id);
            const badges = calculateFighterBadges(f, f.power_point_cost, f.power_point_cap).slice(0, 2);
            return (
              <div
                key={f.id}
                className="fighter-card"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${isSelected ? "var(--gold)" : "var(--line)"}`,
                  background: isSelected ? "rgba(230,184,74,0.08)" : "transparent",
                  marginBottom: 8,
                  cursor: "pointer"
                }}
                onClick={() => toggleFighter(f.id)}
              >
                <div className="fighter-thumb" />
                <div className="fighter-card-body">
                  <div className="fighter-card-name">{f.fighter_name}</div>
                  <div className="fighter-card-meta">{f.power_source} · {f.fighting_style}</div>
                  {badges.length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {badges.map((b) => (
                        <span key={b.name} className="chip" style={{ borderColor: LEVEL_COLORS[b.level], color: LEVEL_COLORS[b.level], fontSize: 10 }}>
                          {b.level === "Gold" ? "🥇" : b.level === "Silver" ? "🥈" : "🥉"} {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ color: isSelected ? "var(--gold-bright)" : "var(--text-dim)" }}>
                  {isSelected ? "✓" : "+"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {teamBadges.length > 0 && (
        <div className="card">
          <div className="card-title">Team Badges</div>
          {teamBadges.map((b) => (
            <div key={b.name} style={{ marginBottom: 8 }}>
              <span className="chip" style={{ borderColor: LEVEL_COLORS[b.level], color: LEVEL_COLORS[b.level] }}>
                {b.level === "Gold" ? "🥇" : b.level === "Silver" ? "🥈" : "🥉"} {b.name}
              </span>
              <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 4 }}>{b.description}</div>
            </div>
          ))}
        </div>
      )}

      {previewSynergies.length > 0 && (
        <div className="card">
          <div className="card-title">Detected Synergies</div>
          {previewSynergies.map((s) => (
            <div key={s.name} style={{ marginBottom: 8 }}>
              <div style={{ color: "var(--gold-bright)", fontWeight: 700, fontSize: 14 }}>{s.name}</div>
              <div style={{ color: "var(--text-dim)", fontSize: 13 }}>{s.description}</div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : isEditing ? "Update Team" : "Save Team"}
      </button>
    </div>
  );
}
