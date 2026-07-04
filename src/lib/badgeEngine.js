// ============================================================
// POWER CLASH — BADGE ENGINE
// Madden/2K-style badges layered on top of the existing build.
// Additive only: nothing here changes fighter/team saving, battle
// setup, or the core scoring math in battleEngine.js. Badges are
// computed from existing fields and feed a small, capped bonus
// into battle scoring via getBadgeModifier().
// ============================================================

const FIELD_KEYS = [
  "character_type", "fighting_style", "power_source",
  "main_power", "secondary_power", "special_skill",
  "weakness", "ultimate_move"
];

const ELEMENTAL_SOURCES = new Set([
  "Fire", "Water", "Ice", "Lightning", "Earth", "Wind",
  "Light", "Shadow", "Nature", "Poison", "Sound"
]);

const LEVEL_MODIFIERS = { Bronze: 0.02, Silver: 0.04, Gold: 0.07 };
const MAX_TOTAL_MODIFIER = 0.15;

export function getBadgeLevel(matchCount, statValue, baseThreshold = 20) {
  if (matchCount >= 3 && statValue >= baseThreshold + 10) return "Gold";
  if (matchCount >= 2 && statValue >= baseThreshold + 5) return "Silver";
  if (matchCount >= 1 && statValue >= baseThreshold) return "Bronze";
  return null;
}

export function getBadgeModifier(level) {
  return LEVEL_MODIFIERS[level] || 0;
}

function fieldValues(fighter) {
  return FIELD_KEYS.map((k) => fighter[k]);
}

function countTagMatches(fighter, tags) {
  const values = fieldValues(fighter);
  let count = 0;
  const matched = [];
  tags.forEach((tag) => {
    if (tag === "ANY_ELEMENTAL") {
      if (ELEMENTAL_SOURCES.has(fighter.power_source)) {
        count += 1;
        matched.push(`${fighter.power_source} (elemental)`);
      }
      return;
    }
    if (values.includes(tag)) {
      count += 1;
      matched.push(tag);
    }
  });
  return { count, matched };
}

// ------------------------------------------------------------
// Fighter badge table
// Each entry: name, category, tags (requirement matches), statKey/
// statBase (bronze-tier threshold), effect text, and an optional
// `special` function returning true/false for an extra compound
// requirement (counts as one additional match).
// ------------------------------------------------------------
const FIGHTER_BADGES = [
  // ATTACK
  { name: "Heavy Hitter", category: "Attack", tags: ["Brawler", "Super Strength", "Martial Arts", "Finishing Technique"], statKey: "strength", statBase: 25, effect: "Boosts physical Strength damage." },
  { name: "Blitz Striker", category: "Attack", tags: ["Speedster", "Super Speed", "Lightning", "One Huge Attack"], statKey: "speed", statBase: 30, effect: "Boosts opening strike and Round 1 pressure." },
  { name: "Assassin's Mark", category: "Attack", tags: ["Assassin", "Stealth", "Invisibility", "Shadow"], statKey: "speed", statBase: 25, special: (f) => f.battle_iq >= 25, effect: "Boosts ambush damage and punishes low Battle IQ enemies." },
  { name: "Inferno Finisher", category: "Attack", tags: ["Fire", "Fire Control", "Energy Explosion", "Power Overload"], statKey: "strength", statBase: 25, special: (f) => f.ultimate_level >= 3, effect: "Boosts fire damage and ultimate finishing power." },
  { name: "Thunder Blitz", category: "Attack", tags: ["Lightning", "Lightning Control", "Super Speed", "Speedster"], statKey: "speed", statBase: 30, effect: "Boosts speed damage and can slightly reduce enemy Speed." },
  { name: "Gravity Crusher", category: "Attack", tags: ["Gravity", "Gravity Control", "Telekinesis", "Arena Takeover"], statKey: "battle_iq", statBase: 25, effect: "Boosts pressure damage and punishes Flight/Super Speed enemies." },
  { name: "Cosmic Breaker", category: "Attack", tags: ["Cosmic Energy", "Cosmic Blasts", "Power Overload"], statKey: "stamina", statBase: 25, special: (f) => f.ultimate_level >= 4, effect: "Boosts high-tier energy damage." },
  { name: "Weapon Specialist", category: "Attack", tags: ["Weapon Master", "Weapon Mastery", "Swordsmanship", "Finishing Technique"], statKey: "battle_iq", statBase: 25, effect: "Boosts precision and ultimate impact." },
  { name: "Pressure Combo", category: "Attack", tags: ["Martial Arts", "Super Speed", "Brawler", "Speedster", "Team Combo Setup"], statKey: "strength", statBase: 20, special: (f) => f.speed >= 20, effect: "Boosts combo pressure and sustained damage." },
  { name: "Poison Fang", category: "Attack", tags: ["Poison", "Poison Control", "Assassin", "Stealth"], statKey: "battle_iq", statBase: 25, effect: "Adds stamina pressure and damage-over-time flavor." },
  { name: "Sound Breaker", category: "Attack", tags: ["Sound", "Sound Waves", "Sniper", "Mage"], statKey: "battle_iq", statBase: 25, effect: "Disrupts focus and counters Stealth/Illusions." },
  { name: "Shadow Strike", category: "Attack", tags: ["Shadow", "Shadow Control", "Assassin", "Invisibility", "Mind Game Trap"], statKey: "speed", statBase: 20, effect: "Boosts dark arena ambush attacks." },
  { name: "Earth Shaker", category: "Attack", tags: ["Earth", "Earth Control", "Tank"], statKey: "strength", statBase: 30, effect: "Boosts heavy ground damage and tank-breaking pressure." },
  { name: "Ki Master", category: "Attack", tags: ["Ki", "Ki Blasts", "Martial Arts"], statKey: "stamina", statBase: 30, effect: "Boosts energy strikes and stamina-based offense." },
  { name: "Nature's Wrath", category: "Attack", tags: ["Nature", "Support/Healer", "Beast Form"], statKey: "durability", statBase: 25, effect: "Adds aggressive nature-based pressure." },
  { name: "Sonic Boom", category: "Attack", tags: ["Sound", "Sound Waves"], statKey: "speed", statBase: 25, effect: "Boosts fast sound-based attacks." },
  { name: "Berserker", category: "Attack", tags: ["Brawler", "Super Strength", "Beast Form"], statKey: "strength", statBase: 35, effect: "Boosts damage when fighting aggressively or while behind." },
  { name: "Swift Blade", category: "Attack", tags: ["Swordsmanship", "Weapon Master"], statKey: "speed", statBase: 30, effect: "Boosts fast weapon strikes and opening pressure." },

  // DEFENSE
  { name: "Iron Wall", category: "Defense", tags: ["Tank", "Defender", "Energy Shield", "Earth Control"], statKey: "durability", statBase: 25, effect: "Boosts Durability and reduces early burst damage." },
  { name: "Stone Body", category: "Defense", tags: ["Earth", "Earth Control", "Tank", "Monster"], statKey: "durability", statBase: 30, effect: "Boosts physical resistance." },
  { name: "Energy Guard", category: "Defense", tags: ["Energy Shield", "Technology", "Magic", "Cosmic Energy", "Defender"], statKey: "durability", statBase: 20, effect: "Reduces energy and ultimate damage." },
  { name: "Second Wind", category: "Defense", tags: ["Healing", "Regeneration", "Support/Healer", "Ultimate Drains Body"], statKey: "stamina", statBase: 30, effect: "Improves late-fight survival." },
  { name: "Regenerative Core", category: "Defense", tags: ["Regeneration", "Healing", "Nature"], statKey: "stamina", statBase: 25, special: (f) => f.durability >= 25, effect: "Adds recovery and reduces chip damage." },
  { name: "Anti-Burst Armor", category: "Defense", tags: ["Defender", "Tank", "Energy Shield", "Pain Tolerance"], statKey: "durability", statBase: 30, effect: "Reduces one-shot and Level 4 ultimate burst." },
  { name: "Pain Tolerance", category: "Defense", tags: ["Pain Tolerance", "Monster", "Brawler", "Tank"], statKey: "stamina", statBase: 25, effect: "Reduces penalties while damaged." },
  { name: "Air Guard", category: "Defense", tags: ["Flight", "Flight Skill", "Wind", "Light"], statKey: "speed", statBase: 25, effect: "Improves aerial defense unless countered by Gravity." },
  { name: "Mental Barrier", category: "Defense", tags: ["Psychic", "Magic", "Spirit Energy", "Genius IQ"], statKey: "battle_iq", statBase: 30, effect: "Resists illusions, psychic tricks, and mind-game attacks." },
  { name: "Elemental Resistance", category: "Defense", tags: ["ANY_ELEMENTAL", "Magic", "Energy Shield", "Defender"], statKey: "durability", statBase: 25, effect: "Reduces type-counter damage." },
  { name: "Light Guardian", category: "Defense", tags: ["Light", "Light Beams", "Defender", "Energy Shield"], statKey: "durability", statBase: 20, effect: "Boosts protection against Shadow and dark effects." },
  { name: "Iron Will", category: "Defense", tags: ["Pain Tolerance", "Brawler"], statKey: "durability", statBase: 25, effect: "Boosts comeback defense and resistance to pressure." },

  // PASSIVE
  { name: "Living Battery", category: "Passive", tags: ["Ki", "Chakra", "Cosmic Energy", "Energy Shield"], statKey: "stamina", statBase: 30, effect: "Improves stamina efficiency and energy control." },
  { name: "Battle Rhythm", category: "Passive", tags: ["Balanced"], statKey: "battle_iq", statBase: 20, special: (f) => f.stamina >= 20 && Math.min(f.strength, f.speed, f.durability, f.battle_iq, f.stamina) >= 18, effect: "Improves consistency and reduces random disadvantages." },
  { name: "Monster Instinct", category: "Passive", tags: ["Monster", "Beast Form", "Monster Instincts"], statKey: "speed", statBase: 25, special: (f) => f.durability >= 25, effect: "Boosts reactions and close-range survival." },
  { name: "Divine Limiter", category: "Passive", tags: ["God-tier (heavily limited)"], statKey: "stamina", statBase: 0, special: (f, cost, cap) => !!f.weakness && cost <= cap, effect: "Gives controlled god-tier aura without breaking balance." },
  { name: "Overclocked", category: "Passive", tags: ["Cyborg", "Technology", "Technology Arsenal", "Tech Expert"], statKey: "stamina", statBase: 25, effect: "Boosts tech efficiency and performance in tech arenas." },
  { name: "Spirit Flow", category: "Passive", tags: ["Spirit Energy", "Chakra", "Ki"], statKey: "battle_iq", statBase: 25, special: (f) => f.stamina >= 25, effect: "Improves energy timing and ultimate control." },
  { name: "Natural Recovery", category: "Passive", tags: ["Nature", "Healing", "Regeneration", "Support/Healer"], statKey: "stamina", statBase: 25, effect: "Improves long-fight sustain." },
  { name: "Cold Blooded", category: "Passive", tags: ["Ice", "Ice Control", "Defender", "Sniper"], statKey: "battle_iq", statBase: 25, effect: "Improves control, patience, and slowing pressure." },
  { name: "Aura Control", category: "Passive", tags: ["Magic", "Chakra", "Cosmic Energy", "Mage"], statKey: "battle_iq", statBase: 25, effect: "Improves energy power control and reduces ultimate drain." },
  { name: "Cooldown Master", category: "Passive", tags: ["Power Cooldown", "Strategist", "Tactician"], statKey: "battle_iq", statBase: 25, special: (f) => f.stamina >= 25, effect: "Reduces cooldown penalties." },
  { name: "Water Weaver", category: "Passive", tags: ["Water", "Water Control"], statKey: "battle_iq", statBase: 25, effect: "Improves adaptability and arena control." },
  { name: "Psychic Link", category: "Passive", tags: ["Psychic", "Psychic Reading"], statKey: "battle_iq", statBase: 30, effect: "Improves prediction and team awareness." },
  { name: "Shadow Walker", category: "Passive", tags: ["Shadow", "Shadow Control", "Stealth"], statKey: "speed", statBase: 25, effect: "Improves stealth movement and ambush setup." },
  { name: "Chakra Surge", category: "Passive", tags: ["Chakra", "Chakra Techniques"], statKey: "battle_iq", statBase: 25, effect: "Improves chakra efficiency and power timing." },
  { name: "Godly Aura", category: "Passive", tags: ["God-tier (heavily limited)"], statKey: "strength", statBase: 20, special: (f, cost, cap) => [f.strength, f.speed, f.durability, f.battle_iq, f.stamina].every((s) => s >= 20) && cost >= cap - 1, effect: "Gives balanced aura pressure without becoming overpowered." },

  // TACTICAL
  { name: "Mastermind", category: "Tactical", tags: ["Strategist", "Tactician", "Genius IQ", "Trap Maker"], statKey: "battle_iq", statBase: 30, effect: "Improves arena adaptation and reduces bad matchup penalties." },
  { name: "Counter Specialist", category: "Tactical", tags: ["Technology", "Psychic", "Magic", "Trap Maker"], statKey: "battle_iq", statBase: 25, effect: "Improves direct type-counter effectiveness." },
  { name: "Trap Setter", category: "Tactical", tags: ["Trap Maker", "Strategist", "Tactician", "Shadow", "Technology"], statKey: "battle_iq", statBase: 25, effect: "Slows enemy opening pressure." },
  { name: "Field General", category: "Tactical", tags: ["Leadership", "Strategist", "Tactician", "Team Combo Setup"], statKey: "battle_iq", statBase: 25, effect: "Improves weakest teammate and team decision-making." },
  { name: "Sniper Focus", category: "Tactical", tags: ["Sniper", "Light Beams", "Sound Waves", "Technology Arsenal"], statKey: "battle_iq", statBase: 25, effect: "Boosts accuracy and long-range pressure." },
  { name: "Illusionist", category: "Tactical", tags: ["Illusions", "Psychic", "Shadow", "Mind Game Trap"], statKey: "battle_iq", statBase: 30, effect: "Reduces enemy accuracy and punishes low Battle IQ." },
  { name: "Portal Playmaker", category: "Tactical", tags: ["Portals", "Telekinesis", "Gravity", "Strategist"], statKey: "speed", statBase: 25, effect: "Improves movement control and team positioning." },
  { name: "Summoner's Command", category: "Tactical", tags: ["Summoner", "Summon Ally", "Magic", "Spirit Energy"], statKey: "battle_iq", statBase: 25, effect: "Boosts summon/team support." },
  { name: "Weakness Reader", category: "Tactical", tags: ["Psychic Reading", "Genius IQ", "Assassin", "Strategist"], statKey: "battle_iq", statBase: 30, effect: "Punishes exposed weaknesses." },
  { name: "Wind Runner", category: "Tactical", tags: ["Wind", "Wind Control", "Flight"], statKey: "speed", statBase: 30, effect: "Boosts turn priority and mobility." },
  { name: "Technomancer", category: "Tactical", tags: ["Technology", "Magic", "Tech Expert", "Mage"], statKey: "battle_iq", statBase: 20, effect: "Blends technology and magic for counterplay." },
  { name: "Gravity Well", category: "Tactical", tags: ["Gravity", "Gravity Control", "Arena Takeover"], statKey: "battle_iq", statBase: 20, effect: "Improves battlefield control." },
  { name: "Portal Master", category: "Tactical", tags: ["Portals", "Telekinesis"], statKey: "battle_iq", statBase: 30, effect: "Improves positioning and avoids bad terrain." },
  { name: "Master Healer", category: "Tactical", tags: ["Healing", "Regeneration", "Support/Healer"], statKey: "stamina", statBase: 25, effect: "Improves recovery and team sustain." },
  { name: "Trap Master", category: "Tactical", tags: ["Trap Maker", "Strategist"], statKey: "battle_iq", statBase: 30, effect: "Boosts setup control and anti-Speedster pressure." },

  // FIGHTER-LEVEL portion of the "Team/Special Combo" section
  { name: "Shadow Assassin", category: "Attack", tags: ["Assassin", "Shadow", "Invisibility", "Stealth"], statKey: "speed", statBase: 25, effect: "Boosts ambush attacks and dark arena pressure." },
  { name: "Arcane Engineer", category: "Passive", tags: ["Magic", "Technology", "Tech Expert", "Mage"], statKey: "battle_iq", statBase: 25, effect: "Improves mixed magic/tech scaling." },
  { name: "Beast Berserker", category: "Attack", tags: ["Monster", "Beast Form", "Brawler", "Monster Instincts"], statKey: "strength", statBase: 25, effect: "Boosts close-range damage and low-health pressure." },
  { name: "Healing Commander", category: "Tactical", tags: ["Support/Healer", "Healing", "Healing Burst", "Leadership"], statKey: "battle_iq", statBase: 25, effect: "Improves teammate survival." }
];

// ------------------------------------------------------------
// Team-scoped badges — need the full fighter_snapshots array.
// ------------------------------------------------------------
function styleSet(fighters) { return new Set(fighters.map((f) => f.fighting_style)); }
function sourceSet(fighters) { return new Set(fighters.map((f) => f.power_source)); }

export function calculateTeamBadges(team) {
  const fighters = team.fighter_snapshots || team.fighters || [];
  if (fighters.length === 0) return [];

  const styles = styleSet(fighters);
  const sources = sourceSet(fighters);
  const badges = [];

  const avgBattleIq = fighters.reduce((s, f) => s + f.battle_iq, 0) / fighters.length;

  if (sources.has("Lightning") && sources.has("Water")) {
    const level = avgBattleIq >= 30 ? "Gold" : avgBattleIq >= 25 ? "Silver" : "Bronze";
    badges.push({ name: "Conductive Storm", category: "Tactical", level, description: "Reduces enemy effective Speed.", effects: ["enemy_speed_down"], reasons: ["Lightning + Water on the same team"], score: 2 });
  }

  if (sources.has("Fire") && sources.has("Ice")) {
    const level = avgBattleIq >= 30 ? "Gold" : avgBattleIq >= 25 ? "Silver" : "Bronze";
    badges.push({ name: "Thermal Shock", category: "Attack", level, description: "Weakens the enemy's Tank/Defender Durability.", effects: ["enemy_tank_durability_down"], reasons: ["Fire + Ice on the same team"], score: 2 });
  }

  if ((styles.has("Strategist") || styles.has("Tactician")) && styles.has("Brawler")) {
    const level = fighters.length >= 3 ? "Gold" : "Silver";
    badges.push({ name: "Brain & Brawn", category: "Tactical", level, description: "Boosts the Brawler's effective Strength.", effects: ["brawler_strength_up"], reasons: ["Strategist/Tactician + Brawler on the same team"], score: 2 });
  }

  const frontlineCount = fighters.filter((f) => ["Brawler", "Tank", "Defender"].includes(f.fighting_style)).length;
  if (frontlineCount >= 2) {
    badges.push({ name: "Vanguard Frontline", category: "Defense", level: frontlineCount >= 3 ? "Gold" : "Silver", description: "Adds first-wave shield protection.", effects: ["vanguard_shield"], reasons: [`${frontlineCount} Brawler/Tank/Defender fighters`], score: frontlineCount });
  }

  const hasComboSetup = fighters.some((f) => f.ultimate_move === "Team Combo Setup" || f.special_skill === "Leadership");
  if (hasComboSetup && styles.size >= 3) {
    badges.push({ name: "Team Architect", category: "Tactical", level: "Gold", description: "Improves overall team synergy.", effects: ["team_synergy_up"], reasons: ["3+ unique fighting styles with a shot-caller on the roster"], score: 3 });
  }

  const healer = fighters.find((f) => f.fighting_style === "Support/Healer" && ["Healing", "Regeneration"].includes(f.main_power) || f.ultimate_move === "Healing Burst");
  if (healer) {
    const level = healer.special_skill === "Leadership" ? "Gold" : healer.battle_iq >= 25 ? "Silver" : "Bronze";
    badges.push({ name: "Healing Commander", category: "Tactical", level, description: "Improves teammate survival.", effects: ["team_sustain_up"], reasons: [`${healer.fighter_name} anchors the team's sustain`], score: 2 });
  }

  Object.entries(
    fighters.reduce((acc, f) => { acc[f.power_source] = (acc[f.power_source] || 0) + 1; return acc; }, {})
  ).forEach(([source, count]) => {
    if (count >= 2) {
      badges.push({ name: "Source Resonance", category: "Passive", level: count >= 3 ? "Gold" : "Silver", description: `Small team scaling bonus for shared ${source} power.`, effects: ["source_resonance"], reasons: [`${count} fighters share the ${source} power source`], score: count });
    }
  });

  return badges;
}

// ------------------------------------------------------------
// Matchup-scoped badges — need my team + the enemy team.
// ------------------------------------------------------------
export function calculateMatchupBadges(myTeam, enemyTeam) {
  const mine = myTeam.fighter_snapshots || myTeam.fighters || [];
  const theirs = enemyTeam.fighter_snapshots || enemyTeam.fighters || [];
  if (mine.length === 0 || theirs.length === 0) return [];

  const mySources = new Set(mine.map((f) => f.power_source));
  const enemyStyles = new Set(theirs.map((f) => f.fighting_style));
  const enemyPowers = new Set(theirs.flatMap((f) => [f.main_power, f.secondary_power]));
  const enemySources = new Set(theirs.map((f) => f.power_source));

  const badges = [];

  if (mySources.has("Gravity") && (enemyStyles.has("Speedster") || enemyPowers.has("Super Speed") || enemyPowers.has("Flight"))) {
    const gravFighter = mine.find((f) => f.power_source === "Gravity");
    const level = gravFighter.battle_iq >= 30 ? "Gold" : gravFighter.battle_iq >= 25 ? "Silver" : "Bronze";
    badges.push({ name: "Gravity Speed Killer", category: "Tactical", level, description: "Reduces the enemy's Speedster/Flight advantage.", effects: ["counter_speed_flight"], reasons: [`${gravFighter.fighter_name}'s Gravity vs. an opposing Speed/Flight kit`], score: 2 });
  }

  if ((mySources.has("Spirit Energy") || mySources.has("Light")) && (enemySources.has("Shadow") || enemyPowers.has("Shadow Control") || enemySources.has("Poison"))) {
    const exorcist = mine.find((f) => f.power_source === "Spirit Energy" || f.power_source === "Light");
    const level = exorcist.battle_iq >= 25 ? "Silver" : "Bronze";
    badges.push({ name: "Spirit Exorcist", category: "Tactical", level, description: "Counters dark/passive effects.", effects: ["counter_dark"], reasons: [`${exorcist.fighter_name} directly counters the enemy's Shadow/Poison kit`], score: 2 });
  }

  return badges;
}

// ------------------------------------------------------------
// Fighter-scoped badges (the main entry point used everywhere).
// ------------------------------------------------------------
export function calculateFighterBadges(fighter, cost, cap) {
  const effectiveCost = cost ?? fighter.power_point_cost ?? 0;
  const effectiveCap = cap ?? fighter.power_point_cap ?? 10;

  const badges = [];

  FIGHTER_BADGES.forEach((def) => {
    const { count, matched } = countTagMatches(fighter, def.tags);
    let matchCount = count;
    if (def.special && def.special(fighter, effectiveCost, effectiveCap)) {
      matchCount += 1;
      matched.push("build condition met");
    }

    const statValue = def.statKey ? Number(fighter[def.statKey]) || 0 : 999;
    const level = getBadgeLevel(matchCount, statValue, def.statBase);

    if (level) {
      badges.push({
        name: def.name,
        category: def.category,
        level,
        description: def.effect,
        effects: [def.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")],
        reasons: matched,
        score: matchCount
      });
    }
  });

  return badges.sort((a, b) => (LEVEL_MODIFIERS[b.level] - LEVEL_MODIFIERS[a.level]));
}

// ------------------------------------------------------------
// Aggregate + cap total badge impact for battle scoring.
// Returns a single multiplier (e.g. 1.06) capped at 1 + MAX_TOTAL_MODIFIER.
// ------------------------------------------------------------
export function getAggregateBadgeMultiplier(badgeLists) {
  const total = badgeLists
    .flat()
    .reduce((sum, b) => sum + getBadgeModifier(b.level), 0);
  return 1 + Math.min(total, MAX_TOTAL_MODIFIER);
}
