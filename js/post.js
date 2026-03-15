import { supabase } from "./supabase-client.js";

const statusEl = document.getElementById("status");
const postActionsEl = document.getElementById("post-actions");
const postContainerEl = document.getElementById("post-container");
const postVoteBarEl = document.createElement("div");
postVoteBarEl.style.margin = "16px 0";
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
  const countryLabel = post.country_code
    ? ` | Country: ${escapeHtml(post.country_code)}`
    : "";

  postContainerEl.innerHTML = `
    <article class="post-card">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">
        By ${escapeHtml(username)} | ${escapeHtml(createdAt)}${countryLabel}
      </div>
      <div class="content">${escapeHtml(post.content)}</div>
    </article>
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
  editLink.style.display = "inline-block";
  editLink.style.marginRight = "12px";
  editLink.style.marginBottom = "16px";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Post";
  deleteBtn.type = "button";
  deleteBtn.style.marginBottom = "16px";
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
  const voteText =
    currentUserVote === 1
      ? "Your vote: upvote"
      : currentUserVote === -1
        ? "Your vote: downvote"
        : "Your vote: none";

  const loginHint = currentUser ? "" : " | Log in to vote";

  postVoteBarEl.innerHTML = `
    <div class="meta">Score: ${score} | ${voteText}${loginHint}</div>
    <div style="margin-top: 8px;">
      <button type="button" data-post-vote="up">
        ${currentUserVote === 1 ? "Remove upvote" : "Upvote"}
      </button>
      <button type="button" data-post-vote="down" style="margin-left: 8px;">
        ${currentUserVote === -1 ? "Remove downvote" : "Downvote"}
      </button>
    </div>
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

  for (const comment of comments) {
    const item = document.createElement("article");
    item.className = "post-card";
    item.style.marginBottom = "12px";

    const username = profileMap[comment.author_id] || "Unknown user";
    const createdAt = new Date(comment.created_at).toLocaleString();
    const countryLabel = comment.country_code
      ? ` | Country: ${escapeHtml(comment.country_code)}`
      : "";

    const isEdited =
      comment.updated_at &&
      new Date(comment.updated_at).getTime() >
        new Date(comment.created_at).getTime();

    const editedLabel = isEdited ? " (Edited)" : "";

    const voteInfo = commentVoteMap[comment.id] || {
      score: 0,
      currentUserVote: 0,
    };
    const currentUserVote = voteInfo.currentUserVote || 0;

    const voteText =
      currentUserVote === 1
        ? "Your vote: upvote"
        : currentUserVote === -1
          ? "Your vote: downvote"
          : "Your vote: none";

    const loginHint = currentUser ? "" : " | Log in to vote";

    item.innerHTML = `
      <div class="meta">By ${escapeHtml(username)} | ${escapeHtml(createdAt)}${countryLabel}${editedLabel}</div>
      <div class="content">${escapeHtml(comment.content)}</div>
      <div class="meta" style="margin-top: 8px;">
        Score: ${voteInfo.score} | ${voteText}${loginHint}
      </div>
    `;

    const voteActions = document.createElement("div");
    voteActions.style.marginTop = "8px";

    const upvoteBtn = document.createElement("button");
    upvoteBtn.type = "button";
    upvoteBtn.textContent = currentUserVote === 1 ? "Remove upvote" : "Upvote";

    const downvoteBtn = document.createElement("button");
    downvoteBtn.type = "button";
    downvoteBtn.textContent =
      currentUserVote === -1 ? "Remove downvote" : "Downvote";
    downvoteBtn.style.marginLeft = "8px";

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
    voteActions.appendChild(downvoteBtn);
    item.appendChild(voteActions);

    if (currentUser && currentUser.id === comment.author_id) {
      const actions = document.createElement("div");
      actions.style.marginTop = "8px";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Edit Comment";
      editBtn.style.marginRight = "8px";
      editBtn.addEventListener("click", () => handleEditComment(comment));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete Comment";
      deleteBtn.addEventListener("click", () =>
        handleDeleteComment(comment.id),
      );

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(actions);
    }

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
