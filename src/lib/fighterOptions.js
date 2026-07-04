// ============================================================
// Static option lists used by Fighter Builder (and later the
// battle engine + computer generator). Centralized so every
// page references the same source of truth.
// ============================================================

export const CHARACTER_TYPES = [
  "Hero",
  "Villain",
  "Antihero",
  "Monster",
  "Alien",
  "Cyborg",
  "Sorcerer",
  "Mutant",
  "Ninja",
  "God-tier (heavily limited)"
];

export const FIGHTING_STYLES = [
  "Brawler",
  "Assassin",
  "Tank",
  "Defender",
  "Speedster",
  "Mage",
  "Sniper",
  "Summoner",
  "Strategist",
  "Tactician",
  "Weapon Master",
  "Support/Healer",
  "Balanced"
];

export const POWER_SOURCES = [
  "Fire",
  "Water",
  "Ice",
  "Lightning",
  "Earth",
  "Wind",
  "Light",
  "Shadow",
  "Cosmic Energy",
  "Ki",
  "Chakra",
  "Magic",
  "Technology",
  "Psychic",
  "Nature",
  "Poison",
  "Gravity",
  "Sound",
  "Spirit Energy"
];

export const POWERS = [
  "Fire Control",
  "Water Control",
  "Ice Control",
  "Lightning Control",
  "Earth Control",
  "Wind Control",
  "Super Strength",
  "Super Speed",
  "Flight",
  "Telekinesis",
  "Gravity Control",
  "Healing",
  "Regeneration",
  "Invisibility",
  "Portals",
  "Shadow Control",
  "Light Beams",
  "Illusions",
  "Psychic Reading",
  "Ki Blasts",
  "Chakra Techniques",
  "Magic Spells",
  "Cosmic Blasts",
  "Technology Arsenal",
  "Poison Control",
  "Sound Waves",
  "Beast Form",
  "Energy Shield",
  "Weapon Mastery",
  "Martial Arts"
];

export const SPECIAL_SKILLS = [
  "Martial Arts",
  "Swordsmanship",
  "Genius IQ",
  "Stealth",
  "Tech Expert",
  "Trap Maker",
  "Pain Tolerance",
  "Flight Skill",
  "Monster Instincts",
  "Leadership",
  "None"
];

export const WEAKNESSES = [
  "Low Stamina",
  "Weak Defense",
  "Emotional Control Issues",
  "Power Cooldown",
  "Weak to Light",
  "Weak to Water",
  "Weak to Sound",
  "Needs Focus",
  "Can Be Overwhelmed",
  "Ultimate Drains Body",
  "Overconfident"
];

export const ULTIMATES = [
  "One Huge Attack",
  "Temporary Transformation",
  "Arena Takeover",
  "Summon Ally",
  "Healing Burst",
  "Finishing Technique",
  "Power Overload",
  "Team Combo Setup",
  "Energy Explosion",
  "Mind Game Trap"
];

export const POWER_LEVELS = [
  { value: 1, label: "1 — Basic", cost: 1 },
  { value: 2, label: "2 — Strong", cost: 2 },
  { value: 3, label: "3 — Elite", cost: 3 },
  { value: 4, label: "4 — Peak", cost: 4 }
];

export const ULTIMATE_LEVELS = [
  { value: 1, label: "1 — Useful", cost: 1 },
  { value: 2, label: "2 — Dangerous", cost: 2 },
  { value: 3, label: "3 — Fight-changing", cost: 3 },
  { value: 4, label: "4 — One-shot threat", cost: 4 }
];

export const POWER_POINT_CAPS = {
  "1v1": 10,
  "2v2": 9,
  "3v3": 8
};

export const STAT_KEYS = ["strength", "speed", "durability", "battle_iq", "stamina"];

export function calcStatTotal(stats) {
  return STAT_KEYS.reduce((sum, key) => sum + (Number(stats[key]) || 0), 0);
}

export function calcPowerPointCost({
  main_power_level,
  secondary_power_level,
  ultimate_level,
  special_skill
}) {
  const specialCost = special_skill && special_skill !== "None" ? 1 : 0;
  return (
    (Number(main_power_level) || 0) +
    (Number(secondary_power_level) || 0) +
    (Number(ultimate_level) || 0) +
    specialCost
  );
}

export function validateFighter(fighter) {
  const errors = [];
  const statTotal = calcStatTotal(fighter);
  const cost = calcPowerPointCost(fighter);
  const cap = fighter.power_point_cap || POWER_POINT_CAPS["1v1"];

  if (!fighter.fighter_name || !fighter.fighter_name.trim()) {
    errors.push("Fighter name cannot be empty.");
  }
  if (!fighter.weakness) {
    errors.push("Weakness cannot be empty.");
  }
  if (statTotal !== 100) {
    errors.push(
      statTotal < 100
        ? `You still have ${100 - statTotal} stat points left.`
        : `Too many stat points — remove ${statTotal - 100}.`
    );
  }
  if (cost > cap) {
    errors.push(`Power point cost (${cost}) exceeds the cap (${cap}) for this mode.`);
  }

  return { isValid: errors.length === 0, errors, statTotal, cost };
}
