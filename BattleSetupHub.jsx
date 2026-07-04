import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { decodeTeamCode } from "../lib/teamCode";
import { generateComputerTeam } from "../lib/computerGenerator";
import { executeBattle } from "../lib/battleService";

const TYPE_LABELS = {
  local: "Local Versus",
  code: "Challenge Code",
  friend: "Friend Battle",
  computer: "VS Computer"
};
const TYPE_TO_BATTLE_TYPE = {
  local: "PVP_LOCAL",
  code: "PVP_CODE",
  friend: "PVP_FRIEND",
  computer: "VS_COMPUTER"
};

export default function BattleSetupHub({ user, profile, opponentType: initialOpponentType, myTeamId, onNavigate }) {
  const [myTeams, setMyTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [opponentType, setOpponentType] = useState(initialOpponentType || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  // Local versus
  const [localOpponentTeams, setLocalOpponentTeams] = useState([]);
  const [selectedLocalId, setSelectedLocalId] = useState(null);

  // Challenge code
  const [codeInput, setCodeInput] = useState("");
  const [decodedTeam, setDecodedTeam] = useState(null);

  // Friend battle
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendTeams, setFriendTeams] = useState([]);
  const [selectedFriendTeamId, setSelectedFriendTeamId] = useState(null);

  // Computer
  const [cpuTeam, setCpuTeam] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (loadError) {
        setError("Could not load teams: " + loadError.message);
        setLoading(false);
        return;
      }

      setMyTeams(data || []);
      if (myTeamId) {
        const preset = (data || []).find((t) => t.id === myTeamId);
        if (preset) setMyTeam(preset);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, myTeamId]);

  // Load local opponent options once myTeam chosen
  useEffect(() => {
    if (opponentType === "local" && myTeam) {
      setLocalOpponentTeams(myTeams.filter((t) => t.id !== myTeam.id && t.battle_mode === myTeam.battle_mode));
    }
  }, [opponentType, myTeam, myTeams]);

  // Load accepted friends once needed
  useEffect(() => {
    if (opponentType !== "friend" || !myTeam) return;
    (async () => {
      const { data: rels } = await supabase
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      const ids = [...new Set((rels || []).map((r) => (r.user_id === user.id ? r.friend_id : r.user_id)))];
      if (ids.length === 0) {
        setFriends([]);
        return;
      }
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      setFriends(profs || []);
    })();
  }, [opponentType, myTeam, user.id]);

  const loadFriendTeams = async (friendId) => {
    setSelectedFriend(friendId);
    setSelectedFriendTeamId(null);
    const { data, error: loadError } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", friendId)
      .eq("battle_mode", myTeam.battle_mode);

    if (loadError) {
      setError("Could not load friend's teams: " + loadError.message);
      return;
    }
    setFriendTeams(data || []);
  };

  const handleDecodeCode = () => {
    setError("");
    const result = decodeTeamCode(codeInput);
    if (!result.success) {
      setError(result.error);
      setDecodedTeam(null);
      return;
    }
    if (myTeam && result.team.battle_mode !== myTeam.battle_mode) {
      setError(`That code is for ${result.team.battle_mode}, but your team is ${myTeam.battle_mode}.`);
      setDecodedTeam(null);
      return;
    }
    setDecodedTeam(result.team);
  };

  const handleGenerateCpu = () => {
    if (!myTeam) return;
    setCpuTeam(generateComputerTeam(myTeam.battle_mode));
  };

  const resolveOpponentTeam = () => {
    if (opponentType === "local") return myTeams.find((t) => t.id === selectedLocalId) || null;
    if (opponentType === "code") return decodedTeam;
    if (opponentType === "friend") return friendTeams.find((t) => t.id === selectedFriendTeamId) || null;
    if (opponentType === "computer") return cpuTeam;
    return null;
  };

  const opponentReady = !!resolveOpponentTeam();

  const handleStart = async () => {
    const opponentTeam = resolveOpponentTeam();
    if (!myTeam || !opponentTeam) {
      setError("Select both your team and an opponent before starting.");
      return;
    }

    setStarting(true);
    setError("");

    try {
      const { result, iWon } = await executeBattle({
        user,
        profile,
        myTeam,
        opponentTeam,
        battleMode: myTeam.battle_mode,
        battleType: TYPE_TO_BATTLE_TYPE[opponentType],
        opponentUserId: opponentType === "friend" ? selectedFriend : null
      });

      onNavigate("pixelBattleAnimation", { battleResult: result, iWon });
    } catch (err) {
      setError("Battle failed to run: " + err.message);
      setStarting(false);
    }
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
        {TYPE_LABELS[opponentType] || "Battle Setup"}
      </h2>

      {error && <div className="error-box">{error}</div>}

      {!myTeam ? (
        <div className="card">
          <div className="card-title">Step 1 — Choose Your Team</div>
          {myTeams.length === 0 ? (
            <div className="empty-state">
              <div className="display">No saved teams</div>
              <p>Build a team before starting a battle.</p>
            </div>
          ) : (
            myTeams.map((t) => (
              <button
                key={t.id}
                className="btn"
                style={{ justifyContent: "space-between" }}
                onClick={() => setMyTeam(t)}
              >
                <span>{t.team_name}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{t.battle_mode}</span>
              </button>
            ))
          )}
        </div>
      ) : !opponentType ? (
        <div className="card">
          <div className="card-title">Step 2 — Choose Battle Type</div>
          <div className="fighter-card-meta" style={{ marginBottom: 10 }}>Using: {myTeam.team_name}</div>
          <button className="btn" onClick={() => setOpponentType("local")}>Local Versus</button>
          <button className="btn" onClick={() => setOpponentType("code")}>Challenge Code</button>
          <button className="btn" onClick={() => setOpponentType("friend")}>Friend Battle</button>
          <button className="btn" onClick={() => setOpponentType("computer")}>VS Computer</button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-title">Your Team</div>
            <div className="fighter-card-name">{myTeam.team_name}</div>
            <div className="fighter-card-meta">{myTeam.battle_mode} · {myTeam.fighter_snapshots?.length || 0} fighters</div>
          </div>

          {opponentType === "local" && (
            <div className="card">
              <div className="card-title">Step 2 — Choose Opponent Team</div>
              {localOpponentTeams.length === 0 ? (
                <div className="empty-state">
                  <div className="display">No other {myTeam.battle_mode} teams</div>
                  <p>Build a second team in the same mode to battle locally.</p>
                </div>
              ) : (
                localOpponentTeams.map((t) => (
                  <button
                    key={t.id}
                    className="btn"
                    style={{ borderColor: selectedLocalId === t.id ? "var(--gold)" : "var(--line)" }}
                    onClick={() => setSelectedLocalId(t.id)}
                  >
                    {t.team_name}
                  </button>
                ))
              )}
            </div>
          )}

          {opponentType === "code" && (
            <div className="card">
              <div className="card-title">Step 2 — Paste Opponent Code</div>
              <div className="field">
                <textarea
                  rows={4}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste a PC- team code here"
                />
              </div>
              <button className="btn" onClick={handleDecodeCode} disabled={!codeInput.trim()}>Decode Code</button>

              {decodedTeam && (
                <div style={{ marginTop: 10 }}>
                  <div className="success-box">Loaded: {decodedTeam.team_name} ({decodedTeam.fighter_snapshots.length} fighters)</div>
                </div>
              )}
            </div>
          )}

          {opponentType === "friend" && (
            <div className="card">
              <div className="card-title">Step 2 — Choose a Friend</div>
              {friends.length === 0 ? (
                <div className="empty-state">
                  <div className="display">No friends yet</div>
                  <p>Add a friend first from the Friends page.</p>
                  <button className="btn" style={{ marginTop: 10 }} onClick={() => onNavigate("friends")}>Go to Friends</button>
                </div>
              ) : (
                <>
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      className="btn"
                      style={{ borderColor: selectedFriend === f.id ? "var(--gold)" : "var(--line)" }}
                      onClick={() => loadFriendTeams(f.id)}
                    >
                      {f.display_name}
                    </button>
                  ))}

                  {selectedFriend && (
                    <div style={{ marginTop: 10 }}>
                      <div className="card-title">Their {myTeam.battle_mode} Teams</div>
                      {friendTeams.length === 0 ? (
                        <div className="empty-state">
                          <div className="display">No matching teams</div>
                          <p>Your friend hasn't built a {myTeam.battle_mode} team yet.</p>
                        </div>
                      ) : (
                        friendTeams.map((t) => (
                          <button
                            key={t.id}
                            className="btn"
                            style={{ borderColor: selectedFriendTeamId === t.id ? "var(--gold)" : "var(--line)" }}
                            onClick={() => setSelectedFriendTeamId(t.id)}
                          >
                            {t.team_name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {opponentType === "computer" && (
            <div className="card">
              <div className="card-title">Step 2 — Generate Computer Team</div>
              <button className="btn btn-primary" onClick={handleGenerateCpu}>Generate Computer Team</button>
              {cpuTeam && (
                <div style={{ marginTop: 10 }}>
                  {cpuTeam.fighter_snapshots.map((f) => (
                    <div key={f.id} className="fighter-card" style={{ marginBottom: 6 }}>
                      <div className="fighter-thumb" />
                      <div className="fighter-card-body">
                        <div className="fighter-card-name">{f.fighter_name}</div>
                        <div className="fighter-card-meta">{f.power_source} · {f.fighting_style}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary" disabled={!opponentReady || starting} onClick={handleStart}>
            {starting ? "Running Battle..." : "Start Battle"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setMyTeam(null);
              setOpponentType(initialOpponentType || null);
            }}
          >
            Change My Team
          </button>
        </>
      )}
    </div>
  );
}
