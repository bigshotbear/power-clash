import React from "react";
import {
  calculateFighterBadges,
  calculateTeamBadges,
  calculateMatchupBadges
} from "../lib/badgeEngine";

const LEVEL_COLORS = { Bronze: "#c17a4a", Silver: "#b7bfc9", Gold: "var(--gold-bright)" };

function BadgePill({ badge }) {
  return (
    <span
      className="chip"
      title={badge.reasons?.join(", ")}
      style={{ borderColor: LEVEL_COLORS[badge.level], color: LEVEL_COLORS[badge.level], marginRight: 6, marginBottom: 6, display: "inline-block" }}
    >
      {badge.level === "Gold" ? "🥇" : badge.level === "Silver" ? "🥈" : "🥉"} {badge.name}
    </span>
  );
}

export default function BattleResult({ battleResult, iWon, onNavigate }) {
  const r = battleResult;

  const teamA = { fighter_snapshots: r.player_a_team_snapshot || [] };
  const teamB = { fighter_snapshots: r.player_b_team_snapshot || [] };
  const hasSnapshots = teamA.fighter_snapshots.length > 0 && teamB.fighter_snapshots.length > 0;

  const fighterBadgesA = hasSnapshots ? teamA.fighter_snapshots.flatMap((f) => calculateFighterBadges(f, f.power_point_cost, f.power_point_cap)) : [];
  const fighterBadgesB = hasSnapshots ? teamB.fighter_snapshots.flatMap((f) => calculateFighterBadges(f, f.power_point_cost, f.power_point_cap)) : [];
  const teamBadgesA = hasSnapshots ? calculateTeamBadges(teamA) : [];
  const teamBadgesB = hasSnapshots ? calculateTeamBadges(teamB) : [];
  const matchupBadgesA = hasSnapshots ? calculateMatchupBadges(teamA, teamB) : [];
  const matchupBadgesB = hasSnapshots ? calculateMatchupBadges(teamB, teamA) : [];

  const myBadges = [...fighterBadgesA, ...teamBadgesA, ...matchupBadgesA];
  const theirBadges = [...fighterBadgesB, ...teamBadgesB, ...matchupBadgesB];

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Dashboard</button>
      </div>

      <div className="card card-glow" style={{ textAlign: "center" }}>
        <div className="card-title">Result</div>
        <div className={`card-value ${iWon ? "win" : "loss"}`}>{iWon ? "VICTORY" : "DEFEAT"}</div>
        <div style={{ marginTop: 8, color: "var(--text-dim)", fontSize: 14 }}>
          {r.player_a_score} — {r.player_b_score}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-title">Arena</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{r.arena_name}</div>
        </div>
        <div className="card">
          <div className="card-title">Battle Twist</div>
          <div style={{ fontSize: 14 }}>{r.battle_twist}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">MVP</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold-bright)" }}>{r.mvp_fighter_name}</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>{r.mvp_reason}</div>
      </div>

      <div className="card">
        <div className="card-title">Fight Summary</div>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{r.fight_summary}</p>
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--gold)" }}>Turning point: {r.turning_point}</div>
      </div>

      {(r.active_synergies_a?.length > 0 || r.active_synergies_b?.length > 0) && (
        <div className="card">
          <div className="card-title">Active Synergies</div>
          {r.active_synergies_a?.map((s) => <span key={"a" + s} className="chip" style={{ marginRight: 6, marginBottom: 6, display: "inline-block" }}>{s} (You)</span>)}
          {r.active_synergies_b?.map((s) => <span key={"b" + s} className="chip" style={{ marginRight: 6, marginBottom: 6, display: "inline-block" }}>{s} (Opponent)</span>)}
        </div>
      )}

      {(myBadges.length > 0 || theirBadges.length > 0) && (
        <div className="card">
          <div className="card-title">Badges</div>
          {myBadges.length > 0 && (
            <div style={{ marginBottom: theirBadges.length ? 12 : 0 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Your Side</div>
              {myBadges.map((b, i) => <BadgePill key={`my-${b.name}-${i}`} badge={b} />)}
            </div>
          )}
          {theirBadges.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Opponent</div>
              {theirBadges.map((b, i) => <BadgePill key={`their-${b.name}-${i}`} badge={b} />)}
            </div>
          )}
        </div>
      )}

      {!iWon && (
        <>
          <div className="card">
            <div className="card-title">Why You Lost</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
              {r.why_loser_lost?.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
          <div className="card">
            <div className="card-title">Improvement Tips</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: "var(--gold-bright)" }}>
              {r.improvement_tips?.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
        </>
      )}

      <button className="btn btn-primary" onClick={() => onNavigate("dashboard")}>Back to Dashboard</button>
      <button className="btn" onClick={() => onNavigate("battleHistory")}>View Battle History</button>
    </div>
  );
}
