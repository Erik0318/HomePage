// Secure playback-status backend for the public erikdev.cc Spotify badge.
// Deploy as a Cloudflare Worker. Spotify credentials NEVER belong in this file.
const ALLOWED_ORIGINS = new Set(["https://erikdev.cc", "https://www.erikdev.cc"]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = { "Vary": "Origin", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}

function json(request, value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8" },
  });
}

function textResponse(value, status = 200, headers = {}) {
  return new Response(value, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8", ...headers },
  });
}

function basicAuthHeader(env) {
  return "Basic " + btoa("admin:" + env.ADMIN_PASSWORD);
}

async function exchangeToken(env, params) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(env.SPOTIFY_CLIENT_ID + ":" + env.SPOTIFY_CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.access_token) return null;
  if (data.refresh_token) await env.SPOTIFY_STORAGE.put("refresh_token", data.refresh_token);
  const ttl = Math.max(60, Math.min(3300, (data.expires_in || 3600) - 120));
  await env.SPOTIFY_STORAGE.put("access_token", data.access_token, { expirationTtl: ttl });
  return data.access_token;
}

async function getAccessToken(env) {
  const cached = await env.SPOTIFY_STORAGE.get("access_token");
  if (cached) return cached;
  const refreshToken = await env.SPOTIFY_STORAGE.get("refresh_token");
  if (!refreshToken) return null;
  return exchangeToken(env, { grant_type: "refresh_token", refresh_token: refreshToken });
}

async function getPlaybackStatus(request, env) {
  const token = await getAccessToken(env);
  if (!token) return json(request, { ready: false }, 503);

  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: "Bearer " + token },
  });

  // No active playback session.
  if (res.status === 204) return json(request, { isPlaying: false });
  // Do not mistake an API error for paused playback.
  if (!res.ok) {
    if (res.status === 401) await env.SPOTIFY_STORAGE.delete("access_token");
    return json(request, { ready: false }, 503);
  }

  const data = await res.json();
  const isPlaying = data.is_playing === true &&
    data.currently_playing_type === "track" &&
    data.item?.type === "track";
  return json(request, { isPlaying });
}

async function startSetup(request, env) {
  if (!env.ADMIN_PASSWORD || request.headers.get("Authorization") !== basicAuthHeader(env)) {
    return textResponse("Sign in as admin with your private setup password.", 401, {
      "WWW-Authenticate": 'Basic realm="Spotify setup"',
    });
  }
  const origin = new URL(request.url).origin;
  const redirectUri = origin + "/callback";
  const nonce = crypto.randomUUID();
  await env.SPOTIFY_STORAGE.put("oauth:" + nonce, redirectUri, { expirationTtl: 600 });
  const auth = new URL("https://accounts.spotify.com/authorize");
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("client_id", env.SPOTIFY_CLIENT_ID);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("scope", "user-read-currently-playing");
  auth.searchParams.set("state", nonce);
  auth.searchParams.set("show_dialog", "true");
  return Response.redirect(auth.href, 302);
}

async function spotifyCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code || url.searchParams.has("error")) {
    return textResponse("Spotify authorization was cancelled or invalid.", 400);
  }
  const key = "oauth:" + state;
  const redirectUri = await env.SPOTIFY_STORAGE.get(key);
  if (!redirectUri || redirectUri !== url.origin + "/callback") {
    return textResponse("Setup link expired. Open /setup again.", 400);
  }
  await env.SPOTIFY_STORAGE.delete(key);
  const token = await exchangeToken(env, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (!token) return textResponse("Spotify authorization failed. Open /setup to retry.", 502);
  return textResponse("Spotify connected. Your homepage can now detect playing vs paused. You can close this tab.");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname === "/status") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (request.method !== "GET") return textResponse("Method not allowed", 405);
    if (url.pathname === "/") return textResponse("Spotify playback status service");
    if (!env.SPOTIFY_STORAGE || !env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      return url.pathname === "/status"
        ? json(request, { ready: false }, 503)
        : textResponse("Worker setup is incomplete.", 503);
    }
    try {
      if (url.pathname === "/status") {
        const origin = request.headers.get("Origin");
        if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { error: "Origin not allowed" }, 403);
        return await getPlaybackStatus(request, env);
      }
      if (url.pathname === "/setup") return await startSetup(request, env);
      if (url.pathname === "/callback") return await spotifyCallback(request, env);
      return textResponse("Not found", 404);
    } catch (_) {
      // Never expose tokens or private API errors to visitors.
      return url.pathname === "/status"
        ? json(request, { ready: false }, 503)
        : textResponse("Spotify service unavailable.", 503);
    }
  },
};
