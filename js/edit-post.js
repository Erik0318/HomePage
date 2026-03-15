import { supabase } from './supabase-client.js';

const statusEl = document.getElementById('status');
const formEl = document.getElementById('edit-post-form');
const titleEl = document.getElementById('title');
const contentEl = document.getElementById('content');
const countryCodeEl = document.getElementById('country_code');
const submitBtn = document.getElementById('submit-btn');

let currentUser = null;
let currentPost = null;

async function initEditPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    statusEl.textContent = 'Missing post id.';
    return;
  }

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Failed to get session:', sessionError);
    statusEl.textContent = 'Failed to check login status.';
    return;
  }

  if (!session?.user) {
    statusEl.textContent = 'You must log in before editing a post.';
    return;
  }

  currentUser = session.user;

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, author_id, title, content, country_code, created_at')
    .eq('id', postId)
    .single();

  if (postError) {
    console.error('Failed to load post:', postError);
    statusEl.textContent = 'Failed to load post.';
    return;
  }

  currentPost = post;

  if (currentUser.id !== currentPost.author_id) {
    statusEl.textContent = 'You do not have permission to edit this post.';
    return;
  }

  fillForm(currentPost);
  statusEl.textContent = `Editing post: ${currentPost.title}`;
  formEl.classList.remove('hidden');
}

function fillForm(post) {
  titleEl.value = post.title ?? '';
  contentEl.value = post.content ?? '';
  countryCodeEl.value = post.country_code ?? '';
}

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentUser || !currentPost) {
    statusEl.textContent = 'Post data is not ready.';
    return;
  }

  const title = titleEl.value.trim();
  const content = contentEl.value.trim();
  const countryCodeRaw = countryCodeEl.value.trim().toUpperCase();
  const countryCode = countryCodeRaw === '' ? null : countryCodeRaw;

  if (!title || !content) {
    statusEl.textContent = 'Title and content are required.';
    return;
  }

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    statusEl.textContent = 'Country code must be 2 uppercase letters, like US or CA.';
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = 'Saving changes...';

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      content,
      country_code: countryCode
    })
    .eq('id', currentPost.id);

  submitBtn.disabled = false;

  if (error) {
    console.error('Failed to update post:', error);
    statusEl.textContent = `Failed to save changes: ${error.message}`;
    return;
  }

  statusEl.textContent = 'Saved. Redirecting...';
  window.location.href = `./post.html?id=${encodeURIComponent(currentPost.id)}`;
});

initEditPostPage();