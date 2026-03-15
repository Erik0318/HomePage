import { supabase } from './supabase-client.js';

const statusEl = document.getElementById('status');
const formEl = document.getElementById('new-post-form');
const titleEl = document.getElementById('title');
const contentEl = document.getElementById('content');
const countryCodeEl = document.getElementById('country_code');
const submitBtn = document.getElementById('submit-btn');

let currentUser = null;

async function initNewPostPage() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get session:', error);
    statusEl.textContent = 'Failed to check login status.';
    return;
  }

  if (!session?.user) {
    statusEl.textContent = 'You must log in before creating a post.';
    formEl.classList.add('hidden');
    return;
  }

  currentUser = session.user;
  statusEl.textContent = `Creating post as ${session.user.email}`;
  formEl.classList.remove('hidden');

  if (countryCodeEl) {
    countryCodeEl.value = '';
    countryCodeEl.disabled = true;
    countryCodeEl.placeholder = 'Auto detected by server';
  }
}

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentUser) {
    statusEl.textContent = 'You are not logged in.';
    return;
  }

  const title = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) {
    statusEl.textContent = 'Title and content are required.';
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = 'Publishing post...';

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Failed to get session for submit:', sessionError);
    submitBtn.disabled = false;
    statusEl.textContent = 'Failed to verify login session.';
    return;
  }

  if (!session?.access_token) {
    submitBtn.disabled = false;
    statusEl.textContent = 'You must log in before creating a post.';
    return;
  }

  let response;
  let result;

  try {
    response = await fetch('https://erikdev.cc/api/forum/create-post', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        title,
        content
      })
    });

    result = await response.json();
  } catch (error) {
    console.error('Failed to call post API:', error);
    submitBtn.disabled = false;
    statusEl.textContent = 'Failed to reach server.';
    return;
  }

  submitBtn.disabled = false;

  if (!response.ok) {
    console.error('Failed to create post:', result);
    statusEl.textContent = `Failed to publish post: ${result.error || 'Unknown error.'}`;
    return;
  }

  statusEl.textContent = 'Post published. Redirecting...';
  window.location.href = './forum.html';
});

initNewPostPage();