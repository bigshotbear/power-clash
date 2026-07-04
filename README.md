# Power Clash — Full Build

This is a real, runnable React + Supabase project (not a mockup) covering the
entire locked build order except Story Mode, which is intentionally a clean
placeholder (its database table exists and is ready).

## What's included

- **Auth**: sign up, log in, log out, auto-creates a `profiles` row
- **Home Dashboard**: live stats from `profiles`
- **Choose Mode** hub: Story (placeholder) / Versus / VS Computer / Saved
  Builds / Battle History
- **Fighter Builder**: every field, 5-stat validation, power point cap/cost,
  layered visual preview, create/edit/duplicate
- **Saved Fighters Archive**: search, edit, duplicate, delete
- **Team Builder**: pick fighters per mode (1/2/3), live synergy detection,
  saves fighter snapshots so future fighter edits don't retroactively break
  old teams
- **Saved Teams Archive**: edit, duplicate, delete, copy challenge code,
  jump straight into a battle
- **Versus Mode**: Local Versus (same device), Challenge Code (generate/paste
  a shareable code), Friend Battle (pick an accepted friend, browse their
  saved teams read-only, battle one of them)
- **Friends**: search by display name/email, send/accept/decline requests,
  remove a friend
- **VS Computer**: AI team generator that respects stat totals, power point
  caps, and style-based stat skew (Brawler → Strength, Speedster → Speed, etc.)
- **Battle Engine** (`src/lib/battleEngine.js`): power-source counters,
  fighting-style role modifiers, team synergies, 8 arenas with
  boosts/penalties, 8 battle twists, weighted scoring (Battle IQ counts
  slightly more), MVP selection, varied fight summaries/turning points, and a
  loss breakdown with improvement tips
- **Pixel Battle Animation**: animated health bars, move log, damage popups
  driven by the engine's `animation_rounds`
- **Battle Result**: full breakdown — scores, MVP, arena, twist, synergies,
  summary, turning point, loss reasons, improvement tips
- **Battle History**: list of past fights, tap to reopen the full breakdown
- **Profile/Settings**: stats, favorite power source/style, saved counts,
  recent battles
- **Custom Power Judge**: rule-based check against the banned list
  (omnipotence, "cannot lose", instant death, etc.) with a suggested point
  cost and required limits for anything allowed
- **Story Mode**: clean "Coming Soon" placeholder — `story_progress` table
  is already migrated and ready for a future build phase

## Database

`supabase/migration.sql` creates every table in one pass: `profiles`,
`fighters`, `teams`, `battle_history`, `story_progress`, `friendships` — all
with row-level security, including a policy that lets accepted friends
**view** (never edit or delete) each other's fighters and teams.

## Setup

1. **Create a Supabase project** at supabase.com if you don't have one yet.
2. **Run the migration**: open your project's SQL Editor and run the full
   contents of `supabase/migration.sql`. This creates every table (profiles,
   fighters, teams, battle_history, story_progress, friendships) with RLS
   policies already applied.
3. **Copy environment variables**:
   ```
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   Project Settings → API in your Supabase dashboard.
4. **Install and run**:
   ```
   npm install
   npm run dev
   ```
5. Open the printed local URL (usually `http://localhost:5173`).

## Testing the milestone

1. Sign up with an email + password (and display name).
2. If email confirmation is on in your Supabase Auth settings, confirm the
   email, then log in.
3. Dashboard should load showing 0 wins / 0 losses / 0 battles.
4. Tap **Create Fighter**, fill out the form until the stat banner says
   "Valid stat build," then Save.
5. You'll land on **Saved Fighters** and see the fighter card.

If any step fails, check the browser console first — Supabase errors
(RLS, missing env vars, etc.) surface there with a clear message.

## Suggested test pass

1. Sign up → dashboard loads with 0/0/0 stats.
2. Create two fighters with valid stat builds (100 total each).
3. Build a 1v1 team with each fighter (two separate teams, same mode).
4. Saved Teams → Battle With This Team → Local Versus → pick the other team
   → Start Battle → watch the animation → check the result breakdown.
5. Saved Teams → Copy Code on one team, then Battle Setup → Challenge Code →
   paste it back in (simulates a second player) → battle.
6. Choose Mode → VS Computer → generate a computer team → battle.
7. Profile and Battle History should reflect the new win/loss and streak.
8. Friends → search your own second test account (or a friend's real
   account) → send request → accept from their session → Friend Battle →
   pick their team → battle.
9. Custom Power Judge → try "I cannot lose" (should be Banned) and something
   reasonable like "Fire Control" (should be Allowed).

## What's intentionally not built yet

- **Story Mode** — placeholder page only; `story_progress` table is ready.
- No live/real-time lobby — Friend Battle is turn-based (pick a friend's
  saved team and fight it), not a synchronous ready-check lobby, per the
  scope we agreed on.
- The battle engine implements the major rules (counters, style modifiers,
  the 5 named synergies, arena boosts/penalties, twist effects, weighted
  scoring) but isn't a line-for-line implementation of every micro-modifier
  in the original spec — it's built to be stable and give varied, plausible
  results rather than risk a broken page chasing 100% rule coverage.

## Notes on structure

- No router library — navigation is a simple state machine in `App.jsx`
  (`onNavigate(name, params)`). This keeps the app dependency-light and easy
  to extend page by page.
- All fighter option lists (character types, powers, weaknesses, etc.) and
  the stat/power-point math live in `src/lib/fighterOptions.js` — the
  future battle engine and computer-team generator will import from here
  too, so the rules never drift out of sync between pages.
- Friends can view (not edit) each other's fighters/teams via RLS policies
  already in the migration, ready for the Friend Battle phase.
