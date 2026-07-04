import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ChooseMode from "./pages/ChooseMode.jsx";
import FighterBuilder from "./pages/FighterBuilder.jsx";
import SavedFighters from "./pages/SavedFighters.jsx";
import TeamBuilder from "./pages/TeamBuilder.jsx";
import SavedTeams from "./pages/SavedTeams.jsx";
import VersusMode from "./pages/VersusMode.jsx";
import Friends from "./pages/Friends.jsx";
import BattleSetupHub from "./pages/BattleSetupHub.jsx";
import PixelBattleAnimation from "./pages/PixelBattleAnimation.jsx";
import BattleResult from "./pages/BattleResult.jsx";
import BattleHistory from "./pages/BattleHistory.jsx";
import Profile from "./pages/Profile.jsx";
import CustomPowerJudge from "./pages/CustomPowerJudge.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

// Simple state-driven navigation. No router dependency needed since
// this app is a single authenticated flow, not deep-linkable pages.
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState({ name: "dashboard", params: {} });

  // ---- Session bootstrap ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setView({ name: "dashboard", params: {} });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ---- Profile load / auto-create ----
  const loadProfile = useCallback(async (user) => {
    if (!user) return;

    const { data: existing, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to load profile:", fetchError.message);
      return;
    }

    if (existing) {
      setProfile(existing);
      return;
    }

    // Profile row is missing (e.g. first login after signup) — create it.
    const displayName =
      user.user_metadata?.display_name || user.email?.split("@")[0] || "Fighter";

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        display_name: displayName,
        email: user.email,
        total_wins: 0,
        total_losses: 0,
        total_battles: 0,
        win_rate: 0,
        current_win_streak: 0,
        longest_win_streak: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create profile:", insertError.message);
      return;
    }

    setProfile(created);
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile(session.user);
    }
  }, [session, loadProfile]);

  const navigate = (name, params = {}) => {
    setView({ name, params });
    // Refresh profile on navigation so stat/streak changes from a just-completed
    // battle (written directly to Supabase by battleService) show up immediately.
    if (session?.user) loadProfile(session.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div>Loading Power Clash...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Authenticated — route between pages via lightweight state machine.
  return (
    <div className="app-shell">
      {view.name === "dashboard" && (
        <Dashboard profile={profile} onNavigate={navigate} onLogout={handleLogout} />
      )}

      {view.name === "chooseMode" && <ChooseMode onNavigate={navigate} />}

      {view.name === "fighterBuilder" && (
        <FighterBuilder
          user={session.user}
          fighterId={view.params.fighterId || null}
          duplicateFrom={view.params.duplicateFrom || null}
          onNavigate={navigate}
        />
      )}

      {view.name === "savedFighters" && (
        <SavedFighters user={session.user} onNavigate={navigate} />
      )}

      {view.name === "teamBuilder" && (
        <TeamBuilder user={session.user} teamId={view.params.teamId || null} onNavigate={navigate} />
      )}

      {view.name === "savedTeams" && (
        <SavedTeams user={session.user} onNavigate={navigate} />
      )}

      {view.name === "versusMode" && <VersusMode onNavigate={navigate} />}

      {view.name === "friends" && <Friends user={session.user} onNavigate={navigate} />}

      {view.name === "battleSetupHub" && (
        <BattleSetupHub
          user={session.user}
          profile={profile}
          opponentType={view.params.opponentType}
          myTeamId={view.params.myTeamId || null}
          onNavigate={navigate}
        />
      )}

      {view.name === "pixelBattleAnimation" && (
        <PixelBattleAnimation
          battleResult={view.params.battleResult}
          iWon={view.params.iWon}
          onNavigate={navigate}
        />
      )}

      {view.name === "battleResult" && (
        <BattleResult
          battleResult={view.params.battleResult}
          iWon={view.params.iWon}
          onNavigate={navigate}
        />
      )}

      {view.name === "battleHistory" && (
        <BattleHistory user={session.user} onNavigate={navigate} />
      )}

      {view.name === "profile" && (
        <Profile user={session.user} profile={profile} onNavigate={navigate} onLogout={handleLogout} />
      )}

      {view.name === "customPowerJudge" && <CustomPowerJudge onNavigate={navigate} />}

      {view.name === "comingSoon" && (
        <ComingSoon title={view.params.title || "This feature"} onNavigate={navigate} />
      )}
    </div>
  );
}
