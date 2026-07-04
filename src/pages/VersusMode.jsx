import React from "react";

const OPTIONS = [
  { type: "local", title: "Local Versus", sub: "Same device — pick Team A and Team B" },
  { type: "code", title: "Challenge Code", sub: "Generate or paste a team code to battle remotely" },
  { type: "friend", title: "Friend Battle", sub: "Battle an accepted friend's saved team" }
];

export default function VersusMode({ onNavigate }) {
  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("chooseMode")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>Versus Mode</h2>

      <div className="mode-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.type}
            className="card mode-card"
            onClick={() => onNavigate("battleSetupHub", { opponentType: opt.type })}
          >
            <div className="mode-icon">⚔</div>
            <div>
              <div className="mode-card-title">{opt.title}</div>
              <div className="mode-card-sub">{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <button className="btn" style={{ marginTop: 6 }} onClick={() => onNavigate("friends")}>
        Manage Friends
      </button>
    </div>
  );
}
