import { supabase } from "./supabase-client.js";

export async function initTopbar() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Failed to get session:", sessionError);
      return;
    }

    const isLoggedIn = !!session?.user;
    updateTopbarNavigation(isLoggedIn);
  } catch (error) {
    console.error("Failed to initialize topbar:", error);
  }
}

function appendSeparator(container) {
  container.appendChild(document.createTextNode(" / "));
}

function appendLink(container, href, text) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  container.appendChild(link);
}

function updateTopbarNavigation(isLoggedIn) {
  const authLinksContainer = document.getElementById("auth-links");
  if (!authLinksContainer) return;

  authLinksContainer.innerHTML = "";

  appendLink(authLinksContainer, "./forum.html", "Forum");
  appendSeparator(authLinksContainer);
  appendLink(authLinksContainer, "./leaderboards.html", "Leaderboard");

  if (isLoggedIn) {
    appendSeparator(authLinksContainer);
    appendLink(authLinksContainer, "./me.html", "My Account");
  } else {
    appendSeparator(authLinksContainer);
    appendLink(authLinksContainer, "./login.html", "Log in");
    appendSeparator(authLinksContainer);
    appendLink(authLinksContainer, "./register.html", "Register");
  }
}