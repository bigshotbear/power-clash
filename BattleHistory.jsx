import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import BattleResult from "./BattleResult.jsx";

export default function BattleHistory({ user, onNavigate }) {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from("battle_history")
        .select("*")
        .contains("participant_ids", [user.id])
        .order("created_at", { ascending: false })
        .limit(50);

      setLoading(false);
      if (loadError) {
        setError("Could not load battle history: " + loadError.message);
        return;
      }
      setBattles(data || []);
    })();
  }, [user.id]);

  if (selected) {
    const iWon = selected.winner_id === user.id;
    return (
      <BattleResult
        battleResult={selected}
        iWon={iWon}
        onNavigate={(name, params) => {
          if (name === "battleHistory") {
            setSelected(null);
          } else {
            onNavigate(name, params);
          }
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>Battle History</h2>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="center" style={{ padding: 40 }}><div className="spinner" /></div>
      ) : battles.length === 0 ? (
        <div className="empty-state">
          <div className="display">No battles yet</div>
          <p>Your fight record will show up here once you battle.</p>
        </div>
      ) : (
        battles.map((b) => {
          const iWon = b.winner_id === user.id;
          return (
            <button key={b.id} className="card" style={{ width: "100%", textAlign: "left" }} onClick={() => setSelected(b)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="fighter-card-name">{b.arena_name} · {b.battle_mode}</div>
                  <div className="fighter-card-meta">{b.battle_type}</div>
                </div>
                <div className={`card-value ${iWon ? "win" : "loss"}`} style={{ fontSize: 18 }}>
                  {iWon ? "WIN" : "LOSS"}
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
