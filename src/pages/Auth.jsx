import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() || email.split("@")[0] }
        }
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Profile row creation is handled in App.jsx on first session load.
      setInfo("Account created. If email confirmation is enabled, check your inbox, then log in.");
      setMode("login");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    }
  };

  return (
    <div className="page center" style={{ minHeight: "100vh", maxWidth: 420 }}>
      <div style={{ width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, color: "var(--gold-bright)", textTransform: "uppercase" }}>
            Power Clash
          </h1>
          <div style={{ color: "var(--text-dim)", letterSpacing: "0.08em", fontSize: 13 }}>
            TACTICAL BATTLE SIMULATOR
          </div>
        </div>

        <div className="card card-glow">
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              type="button"
              className="btn"
              style={{
                marginBottom: 0,
                borderColor: mode === "login" ? "var(--gold)" : "var(--line)",
                color: mode === "login" ? "var(--gold-bright)" : "var(--text-dim)"
              }}
              onClick={() => { setMode("login"); setError(""); setInfo(""); }}
            >
              Log In
            </button>
            <button
              type="button"
              className="btn"
              style={{
                marginBottom: 0,
                borderColor: mode === "signup" ? "var(--gold)" : "var(--line)",
                color: mode === "signup" ? "var(--gold-bright)" : "var(--text-dim)"
              }}
              onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
          {info && <div className="success-box">{info}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="field">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your fighter alias"
                />
              </div>
            )}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
