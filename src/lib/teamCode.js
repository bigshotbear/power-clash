// Challenge Code Versus: turn a team's snapshot into a shareable string,
// and safely decode a pasted string back into a team object.

export function encodeTeamCode(team) {
  const payload = {
    team_name: team.team_name,
    battle_mode: team.battle_mode,
    fighter_snapshots: team.fighter_snapshots,
    team_power_sources: team.team_power_sources,
    team_fighting_styles: team.team_fighting_styles,
    detected_synergies: team.detected_synergies,
    owner_display_name: team.owner_display_name || "Challenger"
  };

  const json = JSON.stringify(payload);
  // btoa only handles Latin1, so escape/encodeURIComponent first for safety with any unicode names.
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `PC-${base64}`;
}

export function decodeTeamCode(code) {
  try {
    const clean = code.trim().replace(/^PC-/, "");
    const json = decodeURIComponent(escape(atob(clean)));
    const data = JSON.parse(json);

    if (!data.fighter_snapshots || !Array.isArray(data.fighter_snapshots) || data.fighter_snapshots.length === 0) {
      throw new Error("Code does not contain any fighters.");
    }
    if (!data.battle_mode) {
      throw new Error("Code is missing a battle mode.");
    }

    return { success: true, team: data };
  } catch (err) {
    return { success: false, error: "That code could not be read. Double-check it was copied in full." };
  }
}
