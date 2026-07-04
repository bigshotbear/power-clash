import { supabase } from "./supabaseClient";
import { runBattle } from "./battleEngine";

/**
 * Executes a full battle from the current user's perspective (always "Player A"),
 * saves the result to battle_history, updates the user's profile stats, and
 * updates their team's win/loss record if a saved team was used.
 *
 * @param {object} params
 * @param {object} params.user - current auth user
 * @param {object} params.profile - current profile row (for streak math)
 * @param {object} params.myTeam - { id?, fighter_snapshots, battle_mode } — id present if it's a saved team
 * @param {object} params.opponentTeam - { id?, owner_id?, fighter_snapshots, team_name }
 * @param {string} params.battleMode - "1v1" | "2v2" | "3v3"
 * @param {string} params.battleType - "PVP_CODE" | "PVP_LOCAL" | "VS_COMPUTER" | "PVP_FRIEND"
 * @param {string|null} params.opponentUserId - set for Friend Battle, null for CPU/code battles
 */
export async function executeBattle({
  user,
  profile,
  myTeam,
  opponentTeam,
  battleMode,
  battleType,
  opponentUserId = null
}) {
  const result = runBattle({
    teamA: myTeam,
    teamB: opponentTeam,
    battleMode,
    battleType
  });

  const iWon = result.winner_side === "A";

  const participantIds = [user.id];
  if (opponentUserId) participantIds.push(opponentUserId);

  const historyPayload = {
    player_a_id: user.id,
    player_b_id: opponentUserId,
    participant_ids: participantIds,
    player_a_team_id: myTeam.id || null,
    player_b_team_id: opponentTeam.id || null,
    player_a_team_snapshot: myTeam.fighter_snapshots,
    player_b_team_snapshot: opponentTeam.fighter_snapshots,
    battle_mode: battleMode,
    battle_type: battleType,
    arena_name: result.arena_name,
    battle_twist: result.battle_twist,
    player_a_score: result.player_a_score,
    player_b_score: result.player_b_score,
    winner_id: iWon ? user.id : opponentUserId,
    winner_name: result.winner_name,
    loser_id: iWon ? opponentUserId : user.id,
    loser_name: result.loser_name,
    mvp_fighter_name: result.mvp_fighter_name,
    mvp_reason: result.mvp_reason,
    active_synergies_a: result.active_synergies_a,
    active_synergies_b: result.active_synergies_b,
    fight_summary: result.fight_summary,
    turning_point: result.turning_point,
    why_loser_lost: result.why_loser_lost,
    improvement_tips: result.improvement_tips,
    animation_rounds: result.animation_rounds
  };

  const { data: savedHistory, error: historyError } = await supabase
    .from("battle_history")
    .insert(historyPayload)
    .select()
    .single();

  if (historyError) {
    console.error("Failed to save battle history:", historyError.message);
  }

  // --- Update current user's profile stats ---
  if (profile) {
    const totalBattles = (profile.total_battles || 0) + 1;
    const totalWins = (profile.total_wins || 0) + (iWon ? 1 : 0);
    const totalLosses = (profile.total_losses || 0) + (iWon ? 0 : 1);
    const currentStreak = iWon ? (profile.current_win_streak || 0) + 1 : 0;
    const longestStreak = Math.max(profile.longest_win_streak || 0, currentStreak);
    const winRate = totalBattles > 0 ? totalWins / totalBattles : 0;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        total_battles: totalBattles,
        total_wins: totalWins,
        total_losses: totalLosses,
        current_win_streak: currentStreak,
        longest_win_streak: longestStreak,
        win_rate: winRate,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (profileError) console.error("Failed to update profile stats:", profileError.message);
  }

  // --- Update my team's win/loss record, if a saved team was used ---
  if (myTeam.id) {
    const wins = (myTeam.wins || 0) + (iWon ? 1 : 0);
    const losses = (myTeam.losses || 0) + (iWon ? 0 : 1);
    const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;

    const { error: teamError } = await supabase
      .from("teams")
      .update({ wins, losses, win_rate: winRate, updated_at: new Date().toISOString() })
      .eq("id", myTeam.id);

    if (teamError) console.error("Failed to update team record:", teamError.message);
  }

  return { result, iWon, savedHistoryId: savedHistory?.id || null };
}
