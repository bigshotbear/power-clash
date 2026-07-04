import React, { useState } from "react";

const BANNED_PATTERNS = [
  { pattern: /omnipotent|omnipotence/i, reason: "Grants unlimited power with no boundaries." },
  { pattern: /can\s?not\s?lose|never\s?lose|unbeatable|undefeatable/i, reason: "Removes the possibility of loss entirely." },
  { pattern: /instant\s?death|instantly\s?kill|one\s?shot\s?kill/i, reason: "Instant kill with no counter breaks fair combat." },
  { pattern: /infinite\s?regeneration|unlimited\s?regeneration|cannot\s?be\s?killed/i, reason: "Infinite regeneration removes any real stakes." },
  { pattern: /reality\s?control|control\s?reality|rewrite\s?reality/i, reason: "Full reality control invalidates every other power." },
  { pattern: /copy\s?any\s?power\s?permanently|permanent\s?power\s?copy/i, reason: "Permanent power copying snowballs without limit." },
  { pattern: /future\s?knowledge|see\s?the\s?future\s?perfectly|always\s?know/i, reason: "Perfect future knowledge removes counterplay." },
  { pattern: /erase.*instantly|delete.*instantly/i, reason: "Instant erasure has no realistic counter." },
  { pattern: /no\s?weakness/i, reason: "Every fighter needs a real weakness." }
];

const SCOPE_WORDS = {
  strong: ["control", "manipulate", "summon", "generate", "blast", "shield", "teleport", "heal"],
  huge: ["everyone", "entire", "all", "unlimited", "forever", "permanently", "instantly", "always"]
};

function judgePower(text) {
  const lower = text.toLowerCase();

  for (const { pattern, reason } of BANNED_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        verdict: "Banned",
        cost: null,
        reason,
        requiredLimit: "This concept cannot be balanced with a cooldown or weakness — it needs a full rework.",
        counter: "N/A"
      };
    }
  }

  let scopeScore = 1;
  SCOPE_WORDS.strong.forEach((w) => { if (lower.includes(w)) scopeScore += 1; });
  SCOPE_WORDS.huge.forEach((w) => { if (lower.includes(w)) scopeScore += 2; });

  let verdict = "Allowed";
  let suggestedCost = Math.min(4, Math.max(1, scopeScore));
  let limit = "A short cooldown between uses keeps this in line with other Peak-level powers.";

  if (scopeScore >= 5) {
    verdict = "Allowed With Limits";
    limit = "Requires a real cooldown, a stamina drain, and a specific counter-element to stay fair.";
  } else if (scopeScore >= 7) {
    verdict = "Nerfed Version";
    limit = "Scale this down to a single target or a short duration — the raw version is too strong for the point system.";
  }

  return {
    verdict,
    cost: suggestedCost,
    reason: `Estimated as a Level ${suggestedCost} power based on scope and impact described.`,
    requiredLimit: limit,
    counter: "Pair with a power-source counter (see the counters chart) or a stat-based weakness like Low Stamina."
  };
}

const VERDICT_COLORS = {
  Allowed: "var(--win)",
  "Allowed With Limits": "var(--gold-bright)",
  "Nerfed Version": "#ffb74a",
  Banned: "var(--loss)"
};

export default function CustomPowerJudge({ onNavigate }) {
  const [text, setText] = useState("");
  const [verdictResult, setVerdictResult] = useState(null);

  const handleJudge = () => {
    if (!text.trim()) return;
    setVerdictResult(judgePower(text));
  };

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("dashboard")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>Custom Power Judge</h2>

      <div className="card">
        <div className="field">
          <label>Describe your power idea</label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Summons a wall of ice to block incoming attacks for a few seconds"
          />
        </div>
        <button className="btn btn-primary" onClick={handleJudge} disabled={!text.trim()}>Judge This Power</button>
      </div>

      {verdictResult && (
        <div className="card card-glow">
          <div className="card-title">Verdict</div>
          <div className="card-value" style={{ color: VERDICT_COLORS[verdictResult.verdict], fontSize: 22, marginBottom: 10 }}>
            {verdictResult.verdict}
          </div>

          {verdictResult.cost !== null && (
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Suggested Point Cost: <strong style={{ color: "var(--gold-bright)" }}>{verdictResult.cost}</strong>
            </div>
          )}

          <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Why:</strong> {verdictResult.reason}</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Required Limit:</strong> {verdictResult.requiredLimit}</div>
          <div style={{ fontSize: 14 }}><strong>Best Counter:</strong> {verdictResult.counter}</div>
        </div>
      )}
    </div>
  );
}
