import { supabase } from "./supabase-client.js";

const statusEl = document.getElementById("status");
const newPostLink = document.getElementById("new-post-link");
const postListEl = document.getElementById("post-list");

async function initForumPage() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Failed to get session:", sessionError);
    statusEl.textContent = "Failed to load session.";
    return;
  }

  if (session?.user) {
    newPostLink.classList.remove("hidden");
    statusEl.textContent = `Logged in as ${session.user.email}`;
  } else {
    newPostLink.classList.add("hidden");
    statusEl.textContent = "You are browsing as a guest.";
  }

  await loadPosts();
}

async function loadPosts() {
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, author_id, title, content, country_code, created_at")
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Failed to load posts:", postsError);
    statusEl.textContent = "Failed to load posts.";
    return;
  }

  if (!posts || posts.length === 0) {
    postListEl.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  const authorIds = [
    ...new Set(posts.map((post) => post.author_id).filter(Boolean)),
  ];

  let profileMap = {};

  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", authorIds);

    if (profilesError) {
      console.error("Failed to load profiles:", profilesError);
    } else {
      profileMap = Object.fromEntries(
        profiles.map((profile) => [profile.id, profile.username]),
      );
    }
  }

  const postIds = posts.map((post) => post.id);

  let scoreMap = {};

  if (postIds.length > 0) {
    const { data: votes, error: votesError } = await supabase
      .from("post_votes")
      .select("post_id, value")
      .in("post_id", postIds);

    if (votesError) {
      console.error("Failed to load post votes:", votesError);
    } else {
      scoreMap = Object.fromEntries(postIds.map((postId) => [postId, 0]));

      for (const vote of votes || []) {
        scoreMap[vote.post_id] = (scoreMap[vote.post_id] || 0) + vote.value;
      }
    }
  }

  renderPosts(posts, profileMap, scoreMap);
}

function renderPosts(posts, profileMap, scoreMap) {
  postListEl.innerHTML = '';

  for (const post of posts) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const username = profileMap[post.author_id] || 'Unknown user';
    const createdAt = new Date(post.created_at).toLocaleString();
    const preview =
      post.content.length > 200
        ? post.content.slice(0, 200) + '...'
        : post.content;

    const score = scoreMap[post.id] || 0;
    const countryLabel = post.country_code
      ? ` | Country: ${escapeHtml(post.country_code)}`
      : '';

    card.innerHTML = `
      <h2>
        <a href="./post.html?id=${encodeURIComponent(post.id)}">
          ${escapeHtml(post.title)}
        </a>
      </h2>
      <div class="meta">By ${escapeHtml(username)} | ${escapeHtml(createdAt)}${countryLabel} | Score: ${score}</div>
      <p>${escapeHtml(preview)}</p>
    `;

    postListEl.appendChild(card);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

initForumPage();
