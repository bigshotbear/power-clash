import React from "react";

export default function ComingSoon({ title, onNavigate }) {
  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 20 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <div className="empty-state">
        <div className="display">{title}</div>
        <p>This part of Power Clash is being built in the next phase.</p>
      </div>
    </div>
  );
}
