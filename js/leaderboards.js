import { supabase } from "./supabase-client.js";

const params = new URLSearchParams(window.location.search);
const GAME_SLUG = params.get("game") || "agame";
const MODE = params.get("mode") || "default";
const LIMIT = 50;

const gameLabelEl = document.getElementById("game-label");
const statusEl = document.getElementById("status");
const bodyEl = document.getElementById("leaderboard-body");
const refreshBtn = document.getElementById("refresh-btn");

let currentUserId = null;

function formatDuration(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return "-";

  const totalMs = Number(ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[ch];
  });
}

function fallbackGameNameFromSlug(slug) {
  const map = {
    agame: "A Game"
  };

  if (map[slug]) return map[slug];

  return String(slug || "Game")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function setGameDisplay(gameName) {
  const safeName = gameName || fallbackGameNameFromSlug(GAME_SLUG);
  gameLabelEl.textContent = safeName;
  document.title = `${safeName} Leaderboard`;
}

async function loadCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to get current user:", error);
    currentUserId = null;
    return;
  }

  currentUserId = data?.user?.id ?? null;
}

function renderRows(rows) {
  if (!rows || rows.length === 0) {
    setGameDisplay(fallbackGameNameFromSlug(GAME_SLUG));
    bodyEl.innerHTML = `
      <tr>
        <td colspan="4">No records yet.</td>
      </tr>
    `;
    statusEl.textContent = "No leaderboard entries yet.";
    return;
  }

  const firstRow = rows[0];
  const gameName = firstRow.game_name || firstRow.game_slug || fallbackGameNameFromSlug(GAME_SLUG);

  setGameDisplay(gameName);

  bodyEl.innerHTML = rows
    .map((row) => {
      const isMe = currentUserId && row.user_id === currentUserId;
      const playerName = `${escapeHtml(row.username ?? "unknown")}${isMe ? " (You)" : ""}`;

      return `
        <tr>
          <td>${row.rank}</td>
          <td>${playerName}</td>
          <td>${formatDuration(row.duration_ms)}</td>
          <td>${formatDate(row.created_at)}</td>
        </tr>
      `;
    })
    .join("");

  statusEl.textContent = `Showing top ${rows.length} records.`;
}

async function loadLeaderboard() {
  try {
    refreshBtn.disabled = true;
    setGameDisplay(fallbackGameNameFromSlug(GAME_SLUG));
    statusEl.textContent = "Loading leaderboard...";
    bodyEl.innerHTML = `
      <tr>
        <td colspan="4">Loading...</td>
      </tr>
    `;

    await loadCurrentUser();

    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_game_slug: GAME_SLUG,
      p_mode: MODE,
      p_limit: LIMIT
    });

    if (error) {
      console.error("Failed to load leaderboard:", error);
      setGameDisplay(fallbackGameNameFromSlug(GAME_SLUG));
      statusEl.textContent = "Failed to load leaderboard.";
      bodyEl.innerHTML = `
        <tr>
          <td colspan="4">Failed to load leaderboard.</td>
        </tr>
      `;
      return;
    }

    renderRows(data || []);
  } catch (err) {
    console.error("Unexpected leaderboard error:", err);
    setGameDisplay(fallbackGameNameFromSlug(GAME_SLUG));
    statusEl.textContent = "Failed to load leaderboard.";
    bodyEl.innerHTML = `
      <tr>
        <td colspan="4">Failed to load leaderboard.</td>
      </tr>
    `;
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", loadLeaderboard);

loadLeaderboard();