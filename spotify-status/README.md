# Spotify now-playing visibility for erikdev.cc

The main site is static. This small Cloudflare Worker reads the Spotify Web API and returns only `{"isPlaying":true/false}`. It never sends Spotify credentials to visitors.

**Nothing is deployed or authorized automatically.** Until the Worker is configured and the homepage points to its `/status` URL, the existing SpotifyStats badge keeps working as before.

## First-time setup

1. You need a **Spotify Premium** account to use Spotify's Development Mode API. Create a Spotify developer app at https://developer.spotify.com/dashboard and choose Web API.
2. In this directory, run `npx wrangler login`, then `npx wrangler kv namespace create SPOTIFY_STORAGE`. Copy the `[[kv_namespaces]]` block Wrangler provides into `wrangler.toml` (or use `--update-config` if supported).
3. Run `npx wrangler deploy` and note your exact Worker URL, e.g. `https://erik-spotify-status.YOUR-SUBDOMAIN.workers.dev`.
4. In your Spotify developer app settings, add **that exact Worker URL + `/callback`** as an allowed Redirect URI (HTTPS and exact spelling required).
5. Set the three private Worker secrets:
   - `npx wrangler secret put SPOTIFY_CLIENT_ID`
   - `npx wrangler secret put SPOTIFY_CLIENT_SECRET`
   - `npx wrangler secret put ADMIN_PASSWORD` (choose a strong unique password, unrelated to your Spotify password)
6. In a browser, open **WORKER_URL/setup**, sign in with username `admin` and your private setup password, and approve the **read currently playing** permission on Spotify.
7. Confirm **WORKER_URL/status** responds with `{"isPlaying":true}` while playing a song and `{"isPlaying":false}` while paused. Then edit the `data-status-url` attribute of `#spotifyNowPlayingBadge` in the repo root `index.html` to **WORKER_URL/status**. Commit and wait for your homepage host to publish.

Do **not** put the Spotify client secret, your setup password, or access/refresh tokens in GitHub, HTML, or chat. The Worker keeps the token in private Cloudflare KV. Its public `/status` returns only a boolean.

The homepage requests status every 30 seconds (and when a visitor returns to the tab). On a known paused/stopped state it hides the full badge; on status errors it hides the badge rather than guessing. SpotifyStats still supplies the artwork when status says a song is playing.

Spotify refresh tokens for developer apps expire after six months (as of June 2026). If status stops working after that, revisit `WORKER_URL/setup` to reauthorize. You do **not** need to change the public Worker URL.

See https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track and https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens.
