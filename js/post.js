import { supabase } from "./supabase-client.js";

const statusEl = document.getElementById("status");
const postActionsEl = document.getElementById("post-actions");
const postContainerEl = document.getElementById("post-container");
const postVoteBarEl = document.createElement("div");
postContainerEl.insertAdjacentElement("afterend", postVoteBarEl);

const commentFormStatusEl = document.getElementById("comment-form-status");
const commentFormEl = document.getElementById("comment-form");
const commentContentEl = document.getElementById("comment-content");
const commentSubmitBtn = document.getElementById("comment-submit-btn");

const commentsStatusEl = document.getElementById("comments-status");
const commentsListEl = document.getElementById("comments-list");

let currentUser = null;
let currentPost = null;

async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    statusEl.textContent = "Missing post id.";
    commentsStatusEl.textContent = "";
    commentFormStatusEl.textContent = "";
    return;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Failed to get session:", sessionError);
  } else {
    currentUser = session?.user ?? null;
  }

  renderCommentFormState();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, author_id, title, content, country_code, created_at")
    .eq("id", postId)
    .single();

  if (postError) {
    console.error("Failed to load post:", postError);
    statusEl.textContent = "Failed to load post.";
    commentsStatusEl.textContent = "";
    return;
  }

  currentPost = post;

  let username = "Unknown user";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", post.author_id)
    .single();

  if (!profileError && profile?.username) {
    username = profile.username;
  }

  renderPost(post, username);
  renderActions();
  await loadPostVotes(post.id);
  await loadComments(post.id);
}

function renderPost(post, username) {
  statusEl.textContent = "";

  const createdAt = new Date(post.created_at).toLocaleString();
  const countryMeta = post.country_code
    ? `<span class="post-meta-sep">·</span><span>${escapeHtml(post.country_code)}</span>`
    : "";

  postContainerEl.innerHTML = `
    <div class="post-article">
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      <div class="post-meta-row">
        <span>${escapeHtml(username)}</span>
        <span class="post-meta-sep">·</span>
        <time>${escapeHtml(createdAt)}</time>
        ${countryMeta}
      </div>
      <div class="post-body">${escapeHtml(post.content)}</div>
    </div>
  `;
}

function renderActions() {
  postActionsEl.innerHTML = "";

  if (!currentUser || !currentPost) {
    return;
  }

  if (currentUser.id !== currentPost.author_id) {
    return;
  }

  const editLink = document.createElement("a");
  editLink.textContent = "Edit Post";
  editLink.href = `./edit-post.html?id=${encodeURIComponent(currentPost.id)}`;
  editLink.className = "action-btn";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Post";
  deleteBtn.type = "button";
  deleteBtn.className = "action-btn";
  deleteBtn.addEventListener("click", handleDeletePost);

  postActionsEl.appendChild(editLink);
  postActionsEl.appendChild(deleteBtn);
}

async function loadPostVotes(postId) {
  const { data: votes, error } = await supabase
    .from("post_votes")
    .select("user_id, value")
    .eq("post_id", postId);

  if (error) {
    console.error("Failed to load post votes:", error);
    postVoteBarEl.textContent = "Failed to load votes.";
    return;
  }

  const score = (votes || []).reduce((sum, vote) => sum + vote.value, 0);

  let currentUserVote = 0;

  if (currentUser) {
    const myVote = (votes || []).find(
      (vote) => vote.user_id === currentUser.id,
    );
    currentUserVote = myVote?.value || 0;
  }

  renderPostVoteBar(score, currentUserVote);
}

function renderPostVoteBar(score, currentUserVote) {
  const scoreClass = score > 0 ? "positive" : score < 0 ? "negative" : "";
  const loginHint = currentUser
    ? ""
    : `<span class="vote-login-hint">Log in to vote</span>`;

  const thumbsUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>`;
  const thumbsDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down"><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/></svg>`;

  postVoteBarEl.className = "vote-bar";
  postVoteBarEl.innerHTML = `
    <button type="button" class="vote-button${currentUserVote === 1 ? " active" : ""}" data-post-vote="up" aria-pressed="${currentUserVote === 1}" title="${currentUserVote === 1 ? "Remove upvote" : "Upvote"}">
      ${thumbsUpSvg}
    </button>
    <span class="vote-count ${scoreClass}">${score}</span>
    <button type="button" class="vote-button${currentUserVote === -1 ? " active" : ""}" data-post-vote="down" aria-pressed="${currentUserVote === -1}" title="${currentUserVote === -1 ? "Remove downvote" : "Downvote"}">
      ${thumbsDownSvg}
    </button>
    ${loginHint}
  `;

  const upvoteBtn = postVoteBarEl.querySelector('[data-post-vote="up"]');
  const downvoteBtn = postVoteBarEl.querySelector('[data-post-vote="down"]');

  if (!currentUser) {
    upvoteBtn.disabled = true;
    downvoteBtn.disabled = true;
    return;
  }

  upvoteBtn.addEventListener("click", () => handlePostVote(1, currentUserVote));
  downvoteBtn.addEventListener("click", () =>
    handlePostVote(-1, currentUserVote),
  );
}

async function handlePostVote(nextValue, currentUserVote) {
  if (!currentUser || !currentPost) {
    return;
  }

  postVoteBarEl.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  let error = null;

  if (currentUserVote === nextValue) {
    const result = await supabase
      .from("post_votes")
      .delete()
      .eq("post_id", currentPost.id)
      .eq("user_id", currentUser.id);

    error = result.error;
  } else {
    const result = await supabase.from("post_votes").upsert(
      [
        {
          post_id: currentPost.id,
          user_id: currentUser.id,
          value: nextValue,
        },
      ],
      { onConflict: "post_id,user_id" },
    );

    error = result.error;
  }

  if (error) {
    console.error("Failed to update post vote:", error);
    postVoteBarEl.innerHTML = `<div class="meta">Failed to update vote: ${escapeHtml(error.message)}</div>`;
    return;
  }

  await loadPostVotes(currentPost.id);
}

function renderCommentFormState() {
  if (!currentUser) {
    commentFormEl.classList.add("hidden");
    commentFormStatusEl.textContent = "Log in to post a comment.";
    return;
  }

  commentFormEl.classList.remove("hidden");
  commentFormStatusEl.textContent = `Commenting as ${currentUser.email}`;
}

async function handleDeletePost() {
  if (!currentUser || !currentPost) {
    return;
  }

  const confirmed = window.confirm("Delete this post? This cannot be undone.");
  if (!confirmed) {
    return;
  }

  statusEl.textContent = "Deleting post...";

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", currentPost.id);

  if (error) {
    console.error("Failed to delete post:", error);
    statusEl.textContent = `Failed to delete post: ${error.message}`;
    return;
  }

  window.location.href = "./forum.html";
}

async function handleDeleteComment(commentId) {
  if (!currentUser || !currentPost) {
    return;
  }

  const confirmed = window.confirm(
    "Delete this comment? This cannot be undone.",
  );
  if (!confirmed) {
    return;
  }

  commentsStatusEl.textContent = "Deleting comment...";

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", currentUser.id);

  if (error) {
    console.error("Failed to delete comment:", error);
    commentsStatusEl.textContent = `Failed to delete comment: ${error.message}`;
    return;
  }

  await loadComments(currentPost.id);
}

async function handleEditComment(comment) {
  if (!currentUser || !currentPost) {
    return;
  }

  const nextContent = window.prompt("Edit your comment:", comment.content);

  if (nextContent === null) {
    return;
  }

  const trimmed = nextContent.trim();

  if (!trimmed) {
    commentsStatusEl.textContent = "Comment content cannot be empty.";
    return;
  }

  commentsStatusEl.textContent = "Updating comment...";

  const { error } = await supabase
    .from("comments")
    .update({ content: trimmed })
    .eq("id", comment.id)
    .eq("author_id", currentUser.id);

  if (error) {
    console.error("Failed to update comment:", error);
    commentsStatusEl.textContent = `Failed to update comment: ${error.message}`;
    return;
  }

  await loadComments(currentPost.id);
}

async function loadComments(postId) {
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(
      "id, post_id, author_id, content, country_code, created_at, updated_at",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("Failed to load comments:", commentsError);
    commentsStatusEl.textContent = "Failed to load comments.";
    return;
  }

  if (!comments || comments.length === 0) {
    commentsStatusEl.textContent = "No comments yet.";
    commentsListEl.innerHTML = "";
    return;
  }

  const authorIds = [
    ...new Set(comments.map((comment) => comment.author_id).filter(Boolean)),
  ];

  let profileMap = {};

  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", authorIds);

    if (profilesError) {
      console.error("Failed to load comment authors:", profilesError);
    } else {
      profileMap = Object.fromEntries(
        profiles.map((profile) => [profile.id, profile.username]),
      );
    }
  }

  const commentIds = comments.map((comment) => comment.id);
  const commentVoteMap = Object.fromEntries(
    commentIds.map((commentId) => [
      commentId,
      { score: 0, currentUserVote: 0 },
    ]),
  );

  if (commentIds.length > 0) {
    const { data: commentVotes, error: commentVotesError } = await supabase
      .from("comment_votes")
      .select("comment_id, user_id, value")
      .in("comment_id", commentIds);

    if (commentVotesError) {
      console.error("Failed to load comment votes:", commentVotesError);
    } else {
      for (const vote of commentVotes || []) {
        if (!commentVoteMap[vote.comment_id]) {
          commentVoteMap[vote.comment_id] = { score: 0, currentUserVote: 0 };
        }

        commentVoteMap[vote.comment_id].score += vote.value;

        if (currentUser && vote.user_id === currentUser.id) {
          commentVoteMap[vote.comment_id].currentUserVote = vote.value;
        }
      }
    }
  }

  renderComments(comments, profileMap, commentVoteMap);
}

function renderComments(comments, profileMap, commentVoteMap) {
  commentsStatusEl.textContent = "";
  commentsListEl.innerHTML = "";

  const thumbsUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>`;
  const thumbsDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down"><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/></svg>`;

  let commentIdx = 0;
  for (const comment of comments) {
    const item = document.createElement("article");
    item.className = "comment-card";
    item.style.animationDelay = `${commentIdx * 60}ms`;
    commentIdx++;

    const username = profileMap[comment.author_id] || "Unknown user";
    const createdAt = new Date(comment.created_at).toLocaleString();

    const isEdited =
      comment.updated_at &&
      new Date(comment.updated_at).getTime() >
        new Date(comment.created_at).getTime();

    const countryTag = comment.country_code
      ? `<span class="comment-date">${escapeHtml(comment.country_code)}</span>`
      : "";
    const editedTag = isEdited
      ? `<span class="comment-edited-tag">edited</span>`
      : "";

    const voteInfo = commentVoteMap[comment.id] || {
      score: 0,
      currentUserVote: 0,
    };
    const currentUserVote = voteInfo.currentUserVote || 0;

    item.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(username)}</span>
        <time class="comment-date">${escapeHtml(createdAt)}</time>
        ${countryTag}
        ${editedTag}
      </div>
      <div class="comment-body">${escapeHtml(comment.content)}</div>
    `;

    const commentFooter = document.createElement("div");
    commentFooter.className = "comment-footer";

    const voteActions = document.createElement("div");
    voteActions.className = "vote-actions";

    const upvoteBtn = document.createElement("button");
    upvoteBtn.type = "button";
    upvoteBtn.className = "vote-button";
    upvoteBtn.innerHTML = thumbsUpSvg;
    upvoteBtn.title = currentUserVote === 1 ? "Remove upvote" : "Upvote";

    const voteCountSpan = document.createElement("span");
    voteCountSpan.className = "comment-vote-count";
    voteCountSpan.textContent = voteInfo.score;

    const downvoteBtn = document.createElement("button");
    downvoteBtn.type = "button";
    downvoteBtn.className = "vote-button";
    downvoteBtn.innerHTML = thumbsDownSvg;
    downvoteBtn.title = currentUserVote === -1 ? "Remove downvote" : "Downvote";

    if (currentUserVote === 1) {
      upvoteBtn.classList.add("active");
      upvoteBtn.setAttribute("aria-pressed", "true");
      downvoteBtn.setAttribute("aria-pressed", "false");
    } else if (currentUserVote === -1) {
      downvoteBtn.classList.add("active");
      downvoteBtn.setAttribute("aria-pressed", "true");
      upvoteBtn.setAttribute("aria-pressed", "false");
    } else {
      upvoteBtn.setAttribute("aria-pressed", "false");
      downvoteBtn.setAttribute("aria-pressed", "false");
    }

    if (!currentUser) {
      upvoteBtn.disabled = true;
      downvoteBtn.disabled = true;
    } else {
      upvoteBtn.addEventListener("click", () =>
        handleCommentVote(comment.id, 1, currentUserVote),
      );
      downvoteBtn.addEventListener("click", () =>
        handleCommentVote(comment.id, -1, currentUserVote),
      );
    }

    voteActions.appendChild(upvoteBtn);
    voteActions.appendChild(voteCountSpan);
    voteActions.appendChild(downvoteBtn);
    commentFooter.appendChild(voteActions);

    if (currentUser && currentUser.id === comment.author_id) {
      const actions = document.createElement("div");
      actions.className = "comment-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => handleEditComment(comment));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () =>
        handleDeleteComment(comment.id),
      );

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      commentFooter.appendChild(actions);
    }

    item.appendChild(commentFooter);
    commentsListEl.appendChild(item);
  }
}

async function handleCommentVote(commentId, nextValue, currentUserVote) {
  if (!currentUser || !currentPost) {
    return;
  }

  commentsStatusEl.textContent = "Updating vote...";

  let error = null;

  if (currentUserVote === nextValue) {
    const result = await supabase
      .from("comment_votes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", currentUser.id);

    error = result.error;
  } else {
    const result = await supabase.from("comment_votes").upsert(
      [
        {
          comment_id: commentId,
          user_id: currentUser.id,
          value: nextValue,
        },
      ],
      { onConflict: "comment_id,user_id" },
    );

    error = result.error;
  }

  if (error) {
    console.error("Failed to update comment vote:", error);
    commentsStatusEl.textContent = `Failed to update vote: ${error.message}`;
    return;
  }

  await loadComments(currentPost.id);
}

commentFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    commentFormStatusEl.textContent = "You must log in before commenting.";
    return;
  }

  if (!currentPost) {
    commentFormStatusEl.textContent = "Post data is not ready.";
    return;
  }

  const content = commentContentEl.value.trim();

  if (!content) {
    commentFormStatusEl.textContent = "Comment content is required.";
    return;
  }

  commentSubmitBtn.disabled = true;
  commentFormStatusEl.textContent = "Posting comment...";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    commentSubmitBtn.disabled = false;
    commentFormStatusEl.textContent = "You must log in before commenting.";
    return;
  }

  const response = await fetch("https://erikdev.cc/api/forum/create-comment", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      post_id: currentPost.id,
      content,
    }),
  });

  const result = await response.json();

  commentSubmitBtn.disabled = false;

  if (!response.ok) {
    console.error("Failed to create comment:", result);
    commentFormStatusEl.textContent = `Failed to post comment: ${result.error || "Unknown error."}`;
    return;
  }

  commentContentEl.value = "";
  commentFormStatusEl.textContent = `Commenting as ${currentUser.email}`;
  await loadComments(currentPost.id);
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

initPostPage();
