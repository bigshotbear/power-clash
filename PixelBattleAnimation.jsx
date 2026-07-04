import React, { useEffect, useState } from "react";

export default function PixelBattleAnimation({ battleResult, iWon, onNavigate }) {
  const rounds = battleResult.animation_rounds || [];
  const [roundIndex, setRoundIndex] = useState(-1); // -1 = not started
  const [healthA, setHealthA] = useState(100);
  const [healthB, setHealthB] = useState(100);
  const [log, setLog] = useState([]);
  const [flash, setFlash] = useState(null); // "A" | "B" | null
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (rounds.length === 0) {
      setFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setRoundIndex((prev) => {
        const next = prev + 1;
        if (next >= rounds.length) {
          clearInterval(timer);
          setFinished(true);
          return prev;
        }

        const round = rounds[next];
        if (round.defenderSide === "A") setHealthA(round.defenderHealthAfter);
        else setHealthB(round.defenderHealthAfter);

        setFlash(round.defenderSide);
        setTimeout(() => setFlash(null), 200);

        setLog((prevLog) => [
          `${round.attackerName} used ${round.moveName} — ${round.damageAmount} dmg`,
          ...prevLog
        ].slice(0, 5));

        return next;
      });
    }, 900);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <div className="card" style={{ textAlign: "center", marginBottom: 14 }}>
        <div className="card-title">{battleResult.arena_name}</div>
        <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{battleResult.battle_twist}</div>
      </div>

      <div className="card" style={{ background: "radial-gradient(circle at 50% 20%, #1c2130, #0a0c12 80%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ flex: 1, marginRight: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>YOU</div>
            <div style={{ height: 10, borderRadius: 6, background: "#262b38", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${healthA}%`,
                background: "linear-gradient(90deg, var(--win), #1e9c6f)",
                transition: "width 0.4s ease"
              }} />
            </div>
          </div>
          <div style={{ flex: 1, marginLeft: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4, textAlign: "right" }}>OPPONENT</div>
            <div style={{ height: 10, borderRadius: 6, background: "#262b38", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${healthB}%`,
                marginLeft: `${100 - healthB}%`,
                background: "linear-gradient(90deg, #ff8a8a, var(--loss))",
                transition: "width 0.4s ease"
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 140, margin: "20px 0" }}>
          <div
            className="preview-silhouette"
            style={{
              opacity: flash === "A" ? 0.4 : 1,
              transform: flash === "A" ? "translateX(-6px)" : "none",
              transition: "all 0.15s ease"
            }}
          />
          <div style={{ color: "var(--gold-dim)", fontSize: 20 }}>VS</div>
          <div
            className="preview-silhouette"
            style={{
              background: "#241a1a",
              borderColor: "#4d2c2c",
              opacity: flash === "B" ? 0.4 : 1,
              transform: flash === "B" ? "translateX(6px)" : "none",
              transition: "all 0.15s ease"
            }}
          />
        </div>

        <div style={{ minHeight: 110 }}>
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: 12, color: i === 0 ? "var(--gold-bright)" : "var(--text-dim)", marginBottom: 4 }}>
              {entry}
            </div>
          ))}
        </div>
      </div>

      {finished && (
        <div className="card card-glow" style={{ textAlign: "center" }}>
          <div className={`card-value ${iWon ? "win" : "loss"}`} style={{ marginBottom: 10 }}>
            {iWon ? "VICTORY" : "DEFEAT"}
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate("battleResult", { battleResult, iWon })}>
            See Full Breakdown
          </button>
        </div>
      )}
    </div>
  );
}
