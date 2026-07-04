// ============================================================
// Shared logic for turning a list of fighter snapshots into
// team-level data: power sources, styles, synergies, averages.
// Used by Team Builder (to save teams) and the battle engine
// (to compute active synergy bonuses during a fight).
// ============================================================

import { STAT_KEYS } from "./fighterOptions";

export function aggregatePowerSources(fighters) {
  return [...new Set(fighters.map((f) => f.power_source))];
}

export function aggregateFightingStyles(fighters) {
  return [...new Set(fighters.map((f) => f.fighting_style))];
}

export function calcTeamAverages(fighters) {
  const n = fighters.length || 1;
  const totals = STAT_KEYS.reduce((acc, key) => {
    acc[key] = fighters.reduce((sum, f) => sum + (Number(f[key]) || 0), 0);
    return acc;
  }, {});
  return {
    average_strength: totals.strength / n,
    average_speed: totals.speed / n,
    average_durability: totals.durability / n,
    average_battle_iq: totals.battle_iq / n,
    average_stamina: totals.stamina / n
  };
}

export function calcTotalPowerCost(fighters) {
  return fighters.reduce((sum, f) => sum + (Number(f.power_point_cost) || 0), 0);
}

const TANK_STYLES = ["Tank", "Defender"];

/**
 * Detect team synergies from a list of fighter snapshots.
 * Returns an array of { name, description, type, meta } objects.
 * `type` is used by the battle engine to know which numeric effect to apply.
 */
export function detectSynergies(fighters) {
  const synergies = [];
  const sources = fighters.map((f) => f.power_source);
  const styles = fighters.map((f) => f.fighting_style);

  const hasSource = (s) => sources.includes(s);
  const hasStyle = (s) => styles.includes(s);

  // --- Elemental synergies ---
  if (hasSource("Lightning") && hasSource("Water")) {
    synergies.push({
      name: "Conductive Storm",
      description: "Lightning + Water — reduces the enemy team's effective Speed by 10%.",
      type: "enemy_speed_down",
      meta: { amount: 0.1 }
    });
  }

  if (hasSource("Fire") && hasSource("Ice")) {
    synergies.push({
      name: "Thermal Shock",
      description: "Fire + Ice — lowers the enemy's highest Tank/Defender Durability by 15%.",
      type: "enemy_tank_durability_down",
      meta: { amount: 0.15 }
    });
  }

  // --- Style synergies ---
  if ((hasStyle("Strategist") || hasStyle("Tactician")) && hasStyle("Brawler")) {
    synergies.push({
      name: "Brain & Brawn",
      description: "Strategist/Tactician + Brawler — increases the Brawler's effective Strength by 15%.",
      type: "brawler_strength_up",
      meta: { amount: 0.15 }
    });
  }

  const tankCount = styles.filter((s) => TANK_STYLES.includes(s)).length;
  const brawlerCount = styles.filter((s) => s === "Brawler").length;
  if (tankCount >= 2 || brawlerCount >= 2) {
    synergies.push({
      name: "Vanguard Frontline",
      description: "Two or more Brawlers/Tanks — shields the weakest-Durability teammate from early damage.",
      type: "vanguard_shield",
      meta: {}
    });
  }

  // --- Duplicate source resonance ---
  const sourceCounts = sources.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  Object.entries(sourceCounts).forEach(([source, count]) => {
    if (count >= 2) {
      synergies.push({
        name: `${source} Resonance`,
        description: `Two or more ${source} fighters — +10% scaling on ${source}-related power.`,
        type: "source_resonance",
        meta: { source, amount: 0.1 }
      });
    }
  });

  // --- Diverse style synergy (3v3 only, 3 unique styles) ---
  if (fighters.length === 3 && new Set(styles).size === 3) {
    synergies.push({
      name: "Tactical Vanguard",
      description: "Three unique fighting styles — turn-order priority bonus.",
      type: "turn_order_bonus",
      meta: { amount: 0.05 }
    });
  }

  return synergies;
}

export function buildTeamComputedFields(fighters) {
  return {
    fighter_ids: fighters.map((f) => f.id).filter(Boolean),
    fighter_snapshots: fighters,
    team_power_sources: aggregatePowerSources(fighters),
    team_fighting_styles: aggregateFightingStyles(fighters),
    detected_synergies: detectSynergies(fighters).map((s) => s.name),
    total_team_power_cost: calcTotalPowerCost(fighters),
    ...calcTeamAverages(fighters)
  };
}
