import React from "react";

function StatCard({ label, value, tone }) {
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div className={`card-value ${tone || ""}`}>{value}</div>
    </div>
  );
}

export default function Dashboard({ profile, onNavigate, onLogout }) {
  const winRatePct = profile ? Math.round((profile.win_rate || 0) * 100) : 0;

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 20 }}>
        <div>
          <div className="topbar-title">Power Clash</div>
          <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
            {profile ? `Welcome back, ${profile.display_name}` : "Loading profile..."}
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Wins" value={profile?.total_wins ?? 0} tone="win" />
        <StatCard label="Total Losses" value={profile?.total_losses ?? 0} tone="loss" />
        <StatCard label="Total Battles" value={profile?.total_battles ?? 0} />
        <StatCard label="Win Rate" value={`${winRatePct}%`} tone="gold" />
        <StatCard label="Current Streak" value={profile?.current_win_streak ?? 0} tone="gold" />
        <StatCard label="Longest Streak" value={profile?.longest_win_streak ?? 0} />
      </div>

      <button className="btn btn-primary" onClick={() => onNavigate("chooseMode")}>
        ⚔ Choose Mode
      </button>

      <button className="btn" onClick={() => onNavigate("fighterBuilder")}>
        + Create Fighter
      </button>
      <button className="btn" onClick={() => onNavigate("savedFighters")}>
        Saved Fighters
      </button>
      <button className="btn" onClick={() => onNavigate("teamBuilder")}>
        + Create Team
      </button>
      <button className="btn" onClick={() => onNavigate("savedTeams")}>
        Saved Teams
      </button>
      <button className="btn" onClick={() => onNavigate("friends")}>
        Friends
      </button>
      <button className="btn" onClick={() => onNavigate("customPowerJudge")}>
        Custom Power Judge
      </button>
      <button className="btn" onClick={() => onNavigate("battleHistory")}>
        Battle History
      </button>
      <button className="btn" onClick={() => onNavigate("profile")}>
        Profile
      </button>

      <button className="btn btn-danger" onClick={onLogout} style={{ marginTop: 10 }}>
        Log Out
      </button>
    </div>
  );
}
