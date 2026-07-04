import React from "react";

const MODES = [
  {
    key: "story",
    title: "Story Mode",
    sub: "Campaign progression with your fighters",
    soon: true
  },
  {
    key: "versus",
    title: "Versus Mode",
    sub: "Local, Challenge Code, or Friend Battle",
    soon: false
  },
  {
    key: "vsComputer",
    title: "VS Computer",
    sub: "Battle an AI-generated team",
    soon: false
  },
  {
    key: "savedBuilds",
    title: "Saved Builds",
    sub: "Fighters and teams",
    soon: false
  },
  {
    key: "battleHistory",
    title: "Battle History",
    sub: "Past results and breakdowns",
    soon: false
  }
];

export default function ChooseMode({ onNavigate }) {
  const handleSelect = (mode) => {
    if (mode.key === "savedBuilds") {
      onNavigate("savedFighters");
      return;
    }
    if (mode.key === "versus") {
      onNavigate("versusMode");
      return;
    }
    if (mode.key === "vsComputer") {
      onNavigate("battleSetupHub", { opponentType: "computer" });
      return;
    }
    if (mode.key === "battleHistory") {
      onNavigate("battleHistory");
      return;
    }
    onNavigate("comingSoon", { title: mode.title });
  };

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>
        Choose Mode
      </h2>

      <div className="mode-grid">
        {MODES.map((mode) => (
          <button key={mode.key} className="card mode-card" onClick={() => handleSelect(mode)}>
            <div className="mode-icon">⚡</div>
            <div>
              <div className="mode-card-title">{mode.title}</div>
              <div className="mode-card-sub">{mode.sub}</div>
            </div>
            {mode.soon && <span className="tag-soon">Coming Soon</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
