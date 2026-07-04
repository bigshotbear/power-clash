// ============================================================
// Flavor text, pros/cons, and the badge system — all client-side
// so Fighter Builder can explain choices and reward good builds
// the way a sports game (2K/Madden) shows badges/tiers.
// ============================================================

export const CHARACTER_TYPE_INFO = {
  "Hero": { blurb: "Balanced all-rounder.", perk: "No stat penalty, no bonus — a clean baseline to build any way you want." },
  "Villain": { blurb: "Plays dirty, hits hard.", perk: "Slight edge on offense-focused Ultimates." },
  "Antihero": { blurb: "Unpredictable, hard to counter-read.", perk: "Small resistance to Battle IQ-based reads from the enemy." },
  "Monster": { blurb: "Raw physical power.", perk: "Slight Durability edge when Strength is your highest stat." },
  "Alien": { blurb: "Otherworldly abilities.", perk: "Small bonus when paired with Cosmic Energy or Psychic power sources." },
  "Cyborg": { blurb: "Precision and tech synergy.", perk: "Small bonus when paired with Technology power source." },
  "Sorcerer": { blurb: "Magic specialist.", perk: "Small bonus to Main/Secondary Power when using Magic-family sources." },
  "Mutant": { blurb: "Adaptable, hard to predict.", perk: "Small resistance to power-source counters." },
  "Ninja": { blurb: "Speed and stealth.", perk: "Small bonus when Fighting Style is Assassin or Speedster." },
  "God-tier (heavily limited)": { blurb: "Extreme power, extreme drawback.", perk: "Higher ceiling, but weaknesses hit harder on this type — pick a real weakness." }
};

export const FIGHTING_STYLE_INFO = {
  "Brawler": { pro: "Strong, simple, hits hard early.", con: "Falls off if Speed and Battle IQ are both low.", pairsWith: "Strategist/Tactician (Brain & Brawn synergy)." },
  "Assassin": { pro: "Great vs. slow, high-Durability targets.", con: "Fragile if Durability is neglected.", pairsWith: "High Speed builds and Shadow/Poison sources." },
  "Tank": { pro: "Hard to bring down, punishes long fights.", con: "Weak initiative — slow to act first.", pairsWith: "Another Tank/Defender for Vanguard Frontline." },
  "Defender": { pro: "Same as Tank — built to absorb damage.", con: "Low offensive ceiling on its own.", pairsWith: "A high-Strength teammate to cover for it." },
  "Speedster": { pro: "First-strike advantage almost every fight.", con: "Advantage fades if the fight goes long.", pairsWith: "Anything that wants to close fast." },
  "Mage": { pro: "Strong with any elemental power source.", con: "Needs Battle IQ to land abilities reliably.", pairsWith: "Magic, Fire, Ice, Lightning sources." },
  "Sniper": { pro: "High single-target impact.", con: "Weak if rushed down early (low Speed builds).", pairsWith: "High Battle IQ for accuracy." },
  "Summoner": { pro: "Adds board presence beyond raw stats.", con: "Needs Stamina to sustain summons.", pairsWith: "Support/Healer teammates." },
  "Strategist": { pro: "Cuts arena penalties by 20%, reads the fight well.", con: "Lower raw physical output.", pairsWith: "Brawler (Brain & Brawn)." },
  "Tactician": { pro: "Same strengths as Strategist.", con: "Same physical tradeoff as Strategist.", pairsWith: "Brawler (Brain & Brawn)." },
  "Weapon Master": { pro: "Ultimate Move hits 10% harder.", con: "Needs Strength and Battle IQ both invested to shine.", pairsWith: "Swordsmanship special skill." },
  "Support/Healer": { pro: "Keeps the team alive longer.", con: "Lowest solo damage output of any style.", pairsWith: "Any high-offense teammate." },
  "Balanced": { pro: "No glaring weakness.", con: "No standout strength either.", pairsWith: "Flexible with any team composition." }
};

export const POWER_SOURCE_INFO = {
  "Fire": "Aggressive damage source. Strong on Volcano Ruins and Open Desert, weak on Ocean Platform.",
  "Water": "Countered by Lightning fighters but hard-counters Fire. Strong on Ocean Platform.",
  "Ice": "Strong utility, but weak to Fire and to Open Desert's arena penalty.",
  "Lightning": "Fast, aggressive, countered by Earth. Strong on Ocean Platform and Storm City Rooftops.",
  "Earth": "Sturdy and countered by very few sources. Strong on Volcano Ruins and Underground Arena.",
  "Wind": "Flexible utility source, weak on Open Desert against Fire-heavy teams.",
  "Light": "Hard-counters Shadow, but is itself countered by Shadow in a mirror.",
  "Shadow": "Strong vs. Psychic and Light-adjacent kits, but weak on Forest at Night's actual boost — check the matchup.",
  "Cosmic Energy": "Counters Ki, Chakra, and Magic — a strong pick against spellcasters.",
  "Ki": "Classic martial-arts power source, countered by Cosmic Energy and Chakra.",
  "Chakra": "Countered by Cosmic Energy, but counters Ki — pick based on the matchup.",
  "Magic": "Versatile, but weak to Technology and Psychic counters.",
  "Technology": "Strong utility and Storm City synergy, but countered by Magic and Sound.",
  "Psychic": "Strong read-based kit, vulnerable to Shadow.",
  "Nature": "Countered by Earth and Water — pair it with a teammate who covers that gap.",
  "Poison": "Slow-burn damage, countered by Nature.",
  "Gravity": "Shuts down Speed/Flight-focused enemies. Strong on Space Station.",
  "Sound": "Disrupts Stealth and Illusion kits. Strong on Underground Arena.",
  "Spirit Energy": "Counters Shadow and Poison — a solid all-purpose pick."
};

// --- Badge system -------------------------------------------------
// Each badge has a check(fighter) returning a 0-1 "progress" score
// and a human-readable requirement. 1.0 = earned.

export const BADGE_DEFINITIONS = [
  {
    name: "Glass Cannon",
    requirement: "Strength 30+",
    progress: (f) => Math.min(1, f.strength / 30)
  },
  {
    name: "Fortress Build",
    requirement: "Durability 30+",
    progress: (f) => Math.min(1, f.durability / 30)
  },
  {
    name: "Lightning Reflexes",
    requirement: "Speed 30+",
    progress: (f) => Math.min(1, f.speed / 30)
  },
  {
    name: "Sharp Mind",
    requirement: "Battle IQ 30+",
    progress: (f) => Math.min(1, f.battle_iq / 30)
  },
  {
    name: "Marathoner",
    requirement: "Stamina 30+",
    progress: (f) => Math.min(1, f.stamina / 30)
  },
  {
    name: "Finisher",
    requirement: "Ultimate Level 4",
    progress: (f) => Math.min(1, f.ultimate_level / 4)
  },
  {
    name: "Well-Rounded",
    requirement: "No stat below 15",
    progress: (f) => {
      const stats = [f.strength, f.speed, f.durability, f.battle_iq, f.stamina];
      const worst = Math.min(...stats);
      return Math.min(1, worst / 15);
    }
  },
  {
    name: "Dual Threat",
    requirement: "Main + Secondary Power both Level 3+",
    progress: (f) => Math.min(1, (Math.min(f.main_power_level, 3) + Math.min(f.secondary_power_level, 3)) / 6)
  },
  {
    name: "Blade Focus",
    requirement: "Weapon Master style or Swordsmanship skill",
    progress: (f) => (f.fighting_style === "Weapon Master" || f.special_skill === "Swordsmanship" ? 1 : 0)
  },
  {
    name: "Full Send",
    requirement: "Power Point Cost equals the cap exactly",
    progress: (f, cost, cap) => (cost === cap ? 1 : Math.min(1, cost / cap))
  }
];

export function computeBadges(fighter, cost, cap) {
  return BADGE_DEFINITIONS.map((b) => ({
    name: b.name,
    requirement: b.requirement,
    progress: b.progress(fighter, cost, cap)
  })).sort((a, b) => b.progress - a.progress);
}

// --- Live "next badge" hints per stat, shown while adjusting sliders ---
const STAT_BADGE_THRESHOLDS = {
  strength: { badge: "Glass Cannon", threshold: 30 },
  speed: { badge: "Lightning Reflexes", threshold: 30 },
  durability: { badge: "Fortress Build", threshold: 30 },
  battle_iq: { badge: "Sharp Mind", threshold: 30 },
  stamina: { badge: "Marathoner", threshold: 30 }
};

export function nextStatBadgeHint(fighter, statKey) {
  const info = STAT_BADGE_THRESHOLDS[statKey];
  if (!info) return null;
  const current = Number(fighter[statKey]) || 0;
  const remaining = info.threshold - current;

  if (remaining <= 0) return { text: `${info.badge} unlocked at this value.`, earned: true };
  if (remaining <= 8) return { text: `${remaining} more unlocks ${info.badge}.`, earned: false };
  return null; // don't clutter the UI when it's not close
}

// --- Correlation notes for power picks — every choice should read as
// connected to everything else on the sheet, not just a form field. ---

const ELEMENTAL_SOURCES = new Set([
  "Fire", "Water", "Ice", "Lightning", "Earth", "Wind", "Nature", "Poison", "Gravity", "Sound"
]);

function powerMatchesSource(power, source) {
  const map = {
    Fire: "Fire Control", Water: "Water Control", Ice: "Ice Control", Lightning: "Lightning Control",
    Earth: "Earth Control", Wind: "Wind Control", Shadow: "Shadow Control", Light: "Light Beams",
    Poison: "Poison Control", Gravity: "Gravity Control", Sound: "Sound Waves",
    Ki: "Ki Blasts", Chakra: "Chakra Techniques", Magic: "Magic Spells", Technology: "Technology Arsenal",
    Psychic: "Psychic Reading", "Cosmic Energy": "Cosmic Blasts"
  };
  return map[source] === power;
}

export function getMainPowerNote(fighter) {
  const { main_power, power_source, character_type, fighting_style } = fighter;
  const notes = [];

  if (powerMatchesSource(main_power, power_source)) {
    notes.push(`${main_power} is a direct expression of your ${power_source} source — full thematic match, no wasted identity.`);
  } else {
    notes.push(`${main_power} doesn't match your ${power_source} source directly — you're playing a hybrid kit, which trades theme purity for flexibility.`);
  }

  if (main_power === "Weapon Mastery" && fighting_style === "Weapon Master") {
    notes.push("Stacks with Weapon Master's +10% Ultimate impact — this pick is doing double duty.");
  }
  if (main_power === "Martial Arts" && character_type === "Ninja") {
    notes.push("Fits the Ninja archetype's Speed/Assassin lean.");
  }
  if ((main_power === "Magic Spells" || main_power === "Cosmic Blasts") && character_type === "Sorcerer") {
    notes.push("On-theme for Sorcerer — this is where that type's identity shows up.");
  }

  return notes.join(" ");
}

export function getSecondaryPowerNote(fighter) {
  const { main_power, secondary_power, power_source } = fighter;

  if (secondary_power === main_power) {
    return "Same as your Main Power — this doesn't add coverage, consider picking something different.";
  }

  const sameFamily = ELEMENTAL_SOURCES.has(power_source) && powerMatchesSource(secondary_power, power_source);
  if (sameFamily) {
    return `Reinforces ${power_source} again — a focused, one-note kit that hits harder in its lane but has no answer if that lane gets countered.`;
  }

  return `${secondary_power} gives you a second angle beyond ${main_power} — useful if your main power's matchup goes badly (e.g. it gets countered).`;
}

export function getSpecialSkillNote(fighter) {
  const { special_skill, fighting_style, character_type } = fighter;

  if (special_skill === "None") {
    return "No special skill — frees up 1 power point for your Ultimate or another Power Level instead.";
  }
  if (special_skill === "Swordsmanship" && fighting_style === "Weapon Master") {
    return "Doubles down on the Weapon Master identity — thematically tight, and mechanically it's the build this style is meant for.";
  }
  if (special_skill === "Genius IQ" && ["Strategist", "Tactician"].includes(fighting_style)) {
    return "Reinforces your Battle IQ lean — this build wants your Battle IQ stat pushed up too.";
  }
  if (special_skill === "Stealth" && character_type === "Ninja") {
    return "On-theme for Ninja — pairs naturally with a Speed/Assassin stat lean.";
  }
  if (special_skill === "Pain Tolerance" && ["Tank", "Defender"].includes(fighting_style)) {
    return "Fits a Tank/Defender build that's already leaning into Durability and Stamina.";
  }
  return `Adds a bit of utility outside your main kit — costs 1 power point, spend it where it earns its keep.`;
}
