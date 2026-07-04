import {
  CHARACTER_TYPES,
  FIGHTING_STYLES,
  POWER_SOURCES,
  POWERS,
  SPECIAL_SKILLS,
  WEAKNESSES,
  ULTIMATES,
  POWER_POINT_CAPS,
  calcPowerPointCost
} from "./fighterOptions";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickTwoDifferent = (arr) => {
  const a = pick(arr);
  let b = pick(arr);
  let guard = 0;
  while (b === a && guard < 20) {
    b = pick(arr);
    guard += 1;
  }
  return [a, b];
};

const STYLE_NAME_POOL = [
  "Aeon", "Blaze", "Cinder", "Drift", "Echo", "Frost", "Grim", "Havoc",
  "Ion", "Jinx", "Kaze", "Lumen", "Mirage", "Nova", "Onyx", "Pulse",
  "Quill", "Rift", "Storm", "Talon", "Umbra", "Vex", "Wraith", "Zephyr"
];
const TITLE_POOL = [
  "the Unbound", "of the Deep", "Prime", "the Silent", "the Reckoning",
  "the Wanderer", "the Relentless", "of Ash", "the Forgotten", "Zero"
];

function generateName() {
  return `${pick(STYLE_NAME_POOL)} ${pick(TITLE_POOL)}`;
}

/**
 * Distributes exactly 100 stat points across the 5 stats, skewed by
 * fighting style tendencies, while keeping every stat at least 5.
 */
function generateStats(style) {
  const weights = { strength: 1, speed: 1, durability: 1, battle_iq: 1, stamina: 1 };

  switch (style) {
    case "Brawler":
      weights.strength = 2.2;
      break;
    case "Speedster":
      weights.speed = 2.4;
      break;
    case "Tank":
    case "Defender":
      weights.durability = 2;
      weights.stamina = 1.8;
      break;
    case "Strategist":
    case "Tactician":
      weights.battle_iq = 2.4;
      break;
    case "Weapon Master":
      weights.strength = 1.7;
      weights.battle_iq = 1.7;
      break;
    case "Support/Healer":
      weights.stamina = 1.9;
      weights.battle_iq = 1.7;
      break;
    case "Balanced":
    default:
      break; // even weights
  }

  const keys = Object.keys(weights);
  const totalWeight = keys.reduce((s, k) => s + weights[k], 0);

  // Reserve a floor of 5 per stat, distribute the remaining 75 by weight.
  const floor = 5;
  const remaining = 100 - floor * keys.length;
  const raw = {};
  let allocated = 0;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      raw[k] = floor + (remaining - allocated);
    } else {
      const amount = Math.round((weights[k] / totalWeight) * remaining);
      raw[k] = floor + amount;
      allocated += amount;
    }
  });

  return raw;
}

function pickLevelsUnderCap(cap) {
  // Randomly distribute available points across main/secondary/ultimate/special
  // while respecting each field's 1-4 range (special is 0 or 1).
  const wantsSpecial = Math.random() < 0.6;
  const specialCost = wantsSpecial ? 1 : 0;
  let budget = Math.max(3, cap - specialCost);

  const rand4 = () => 1 + Math.floor(Math.random() * 4);
  let main = rand4();
  let secondary = rand4();
  let ultimate = rand4();

  // Scale down proportionally until within budget.
  let guard = 0;
  while (main + secondary + ultimate + specialCost > cap && guard < 50) {
    guard += 1;
    if (main >= secondary && main >= ultimate && main > 1) main -= 1;
    else if (secondary >= ultimate && secondary > 1) secondary -= 1;
    else if (ultimate > 1) ultimate -= 1;
    else break;
  }

  return {
    main_power_level: main,
    secondary_power_level: secondary,
    ultimate_level: ultimate,
    special_skill: wantsSpecial ? pick(SPECIAL_SKILLS.filter((s) => s !== "None")) : "None"
  };
}

export function generateComputerFighter(battleMode) {
  const cap = POWER_POINT_CAPS[battleMode] || POWER_POINT_CAPS["1v1"];
  const fighting_style = pick(FIGHTING_STYLES);
  const [main_power, secondary_power] = pickTwoDifferent(POWERS);
  const stats = generateStats(fighting_style);
  const levels = pickLevelsUnderCap(cap);

  const fighter = {
    id: `cpu_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    fighter_name: generateName(),
    character_type: pick(CHARACTER_TYPES),
    fighting_style,
    power_source: pick(POWER_SOURCES),
    main_power,
    secondary_power,
    weakness: pick(WEAKNESSES),
    ultimate_move: pick(ULTIMATES),
    strength: stats.strength,
    speed: stats.speed,
    durability: stats.durability,
    battle_iq: stats.battle_iq,
    stamina: stats.stamina,
    power_point_cap: cap,
    ...levels
  };

  fighter.stat_total = stats.strength + stats.speed + stats.durability + stats.battle_iq + stats.stamina;
  fighter.power_point_cost = calcPowerPointCost(fighter);
  fighter.is_valid_build = fighter.stat_total === 100 && fighter.power_point_cost <= cap;

  return fighter;
}

export function generateComputerTeam(battleMode) {
  const countMap = { "1v1": 1, "2v2": 2, "3v3": 3 };
  const count = countMap[battleMode] || 1;
  const fighters = Array.from({ length: count }, () => generateComputerFighter(battleMode));
  return {
    team_name: "CPU Squad",
    battle_mode: battleMode,
    fighter_snapshots: fighters
  };
}
