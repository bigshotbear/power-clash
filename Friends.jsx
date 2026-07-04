import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Friends({ user, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadFriendships = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (loadError) {
      setError("Could not load friends: " + loadError.message);
      setLoading(false);
      return;
    }

    setFriendships(data || []);

    const otherIds = [...new Set((data || []).map((f) => (f.user_id === user.id ? f.friend_id : f.user_id)))];
    if (otherIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("*").in("id", otherIds);
      const map = {};
      (profs || []).forEach((p) => { map[p.id] = p; });
      setProfilesById(map);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadFriendships();
  }, [loadFriendships]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!searchTerm.trim()) return;

    setSearching(true);
    const { data, error: searchError } = await supabase
      .from("profiles")
      .select("*")
      .or(`display_name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%`)
      .neq("id", user.id)
      .limit(10);

    setSearching(false);

    if (searchError) {
      setError("Search failed: " + searchError.message);
      return;
    }
    setSearchResults(data || []);
  };

  const sendRequest = async (targetId) => {
    setError("");
    setInfo("");
    const { error: insertError } = await supabase
      .from("friendships")
      .insert({ user_id: user.id, friend_id: targetId, status: "pending" });

    if (insertError) {
      setError("Could not send request: " + insertError.message);
      return;
    }
    setInfo("Friend request sent.");
    loadFriendships();
  };

  const respond = async (friendshipId, status) => {
    const { error: updateError } = await supabase
      .from("friendships")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (updateError) {
      setError("Could not update request: " + updateError.message);
      return;
    }
    loadFriendships();
  };

  const removeFriendship = async (friendshipId) => {
    const { error: deleteError } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (deleteError) {
      setError("Could not remove: " + deleteError.message);
      return;
    }
    loadFriendships();
  };

  const incoming = friendships.filter((f) => f.friend_id === user.id && f.status === "pending");
  const outgoing = friendships.filter((f) => f.user_id === user.id && f.status === "pending");
  const accepted = friendships.filter((f) => f.status === "accepted");

  const existingRelationIds = new Set(friendships.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id)));

  return (
    <div className="page">
      <div className="topbar" style={{ position: "static", background: "none", border: "none", padding: 0, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate("versusMode")}>← Back</button>
      </div>

      <h2 style={{ marginBottom: 16, color: "var(--gold-bright)", textTransform: "uppercase" }}>Friends</h2>

      {error && <div className="error-box">{error}</div>}
      {info && <div className="success-box">{info}</div>}

      <form onSubmit={handleSearch} className="card">
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Find a Friend</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by display name or email"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </button>

        {searchResults.map((p) => (
          <div key={p.id} className="fighter-card" style={{ marginTop: 10 }}>
            <div className="fighter-thumb" />
            <div className="fighter-card-body">
              <div className="fighter-card-name">{p.display_name}</div>
              <div className="fighter-card-meta">{p.email}</div>
            </div>
            {existingRelationIds.has(p.id) ? (
              <span className="tag-soon">Already connected</span>
            ) : (
              <button className="icon-btn" onClick={() => sendRequest(p.id)}>Add</button>
            )}
          </div>
        ))}
      </form>

      {loading ? (
        <div className="center" style={{ padding: 30 }}><div className="spinner" /></div>
      ) : (
        <>
          {incoming.length > 0 && (
            <div className="card">
              <div className="card-title">Incoming Requests</div>
              {incoming.map((f) => (
                <div key={f.id} className="fighter-card" style={{ marginBottom: 8 }}>
                  <div className="fighter-thumb" />
                  <div className="fighter-card-body">
                    <div className="fighter-card-name">{profilesById[f.user_id]?.display_name || "Unknown"}</div>
                  </div>
                  <div className="fighter-card-actions">
                    <button className="icon-btn" onClick={() => respond(f.id, "accepted")}>✓</button>
                    <button className="icon-btn" onClick={() => respond(f.id, "declined")}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="card">
              <div className="card-title">Pending (Sent)</div>
              {outgoing.map((f) => (
                <div key={f.id} className="fighter-card" style={{ marginBottom: 8 }}>
                  <div className="fighter-thumb" />
                  <div className="fighter-card-body">
                    <div className="fighter-card-name">{profilesById[f.friend_id]?.display_name || "Unknown"}</div>
                    <div className="fighter-card-meta">Waiting for response</div>
                  </div>
                  <button className="icon-btn" onClick={() => removeFriendship(f.id)}>Cancel</button>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="card-title">Your Friends</div>
            {accepted.length === 0 ? (
              <div className="empty-state">
                <div className="display">No friends yet</div>
                <p>Search above to send a request.</p>
              </div>
            ) : (
              accepted.map((f) => {
                const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
                const otherProfile = profilesById[otherId];
                return (
                  <div key={f.id} className="fighter-card" style={{ marginBottom: 8 }}>
                    <div className="fighter-thumb" />
                    <div className="fighter-card-body">
                      <div className="fighter-card-name">{otherProfile?.display_name || "Unknown"}</div>
                    </div>
                    <button className="icon-btn" onClick={() => removeFriendship(f.id)}>Remove</button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
