import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function mostCommon(list) {
  if (!list.length) return "—";
  const counts = {};
  list.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function Profile({ user, profile, onNavigate, onLogout }) {
  const [fighterCount, setFighterCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [favoriteSource, setFavoriteSource] = useState("—");
  const [favoriteStyle, setFavoriteStyle] = useState("—");
  const [recentBattles, setRecentBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [{ data: fighters }, { count: teamTotal }, { data: battles }] = await Promise.all([
        supabase.from("fighters").select("power_source, fighting_style").eq("owner_id", user.id),
        supabase.from("teams").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase
          .from("battle_history")
          .select("*")
          .contains("participant_ids", [user.id])
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      setFighterCount(fighters?.length || 0);
      setTeamCount(teamTotal || 0);
      setFavoriteSource(mostCommon((fighters || []).map((f) => f.power_source)));
      setFavoriteStyle(mostCommon((fighters || []).map((f) => f.fighting_style)));
      setRecentBattles(battles || []);
      setLoading(false);
    })();
  }, [user.id]);

  const winRatePct = profile ? Math.round((profile.win_rate || 0) * 100) : 0;

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <div className="card card-glow" style={{ textAlign: "center" }}>
        <div className="card-value gold">{profile?.display_name}</div>
        <div style={{ color: "var(--text-dim)", fontSize: 13 }}>{profile?.email}</div>
      </div>

      <div className="stat-grid">
        <div className="card"><div className="card-title">Wins</div><div className="card-value win">{profile?.total_wins ?? 0}</div></div>
        <div className="card"><div className="card-title">Losses</div><div className="card-value loss">{profile?.total_losses ?? 0}</div></div>
        <div className="card"><div className="card-title">Win Rate</div><div className="card-value gold">{winRatePct}%</div></div>
        <div className="card"><div className="card-title">Current Streak</div><div className="card-value">{profile?.current_win_streak ?? 0}</div></div>
        <div className="card"><div className="card-title">Longest Streak</div><div className="card-value">{profile?.longest_win_streak ?? 0}</div></div>
        <div className="card"><div className="card-title">Total Battles</div><div className="card-value">{profile?.total_battles ?? 0}</div></div>
      </div>

      {!loading && (
        <>
          <div className="card">
            <div className="card-title">Favorites</div>
            <div style={{ fontSize: 14 }}>Power Source: <strong style={{ color: "var(--gold-bright)" }}>{favoriteSource}</strong></div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Fighting Style: <strong style={{ color: "var(--gold-bright)" }}>{favoriteStyle}</strong></div>
          </div>

          <div className="card">
            <div className="card-title">Collection</div>
            <div style={{ fontSize: 14 }}>{fighterCount} saved fighters</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>{teamCount} saved teams</div>
          </div>

          <div className="card">
            <div className="card-title">Recent Battles</div>
            {recentBattles.length === 0 ? (
              <div style={{ color: "var(--text-dim)", fontSize: 14 }}>No battles yet.</div>
            ) : (
              recentBattles.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{b.arena_name}</span>
                  <span style={{ color: b.winner_id === user.id ? "var(--win)" : "var(--loss)" }}>
                    {b.winner_id === user.id ? "WIN" : "LOSS"}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <button className="btn btn-danger" onClick={onLogout}>Log Out</button>
    </div>
  );
}
