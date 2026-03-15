import { supabase } from "./supabase-client.js";

/**
 * Initialize topbar with authentication-aware navigation
 * Checks login status and shows/hides navigation items accordingly
 */
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

function updateTopbarNavigation(isLoggedIn) {
  // Find the auth links container
  const authLinksContainer = document.getElementById("auth-links");
  if (!authLinksContainer) return;

  // Remove all children
  authLinksContainer.innerHTML = "";

  // Forum link (always visible)
  const forumLink = document.createElement("a");
  forumLink.href = "./forum.html";
  forumLink.textContent = "Forum";
  authLinksContainer.appendChild(forumLink);

  if (isLoggedIn) {
    // Logged in: show My Account
    // Add separator
    const separator = document.createTextNode(" / ");
    authLinksContainer.appendChild(separator);

    const myAccountLink = document.createElement("a");
    myAccountLink.href = "./me.html";
    myAccountLink.textContent = "My Account";
    authLinksContainer.appendChild(myAccountLink);
  } else {
    // Not logged in: show Log in and Register
    // Add separator
    const separator1 = document.createTextNode(" / ");
    authLinksContainer.appendChild(separator1);

    const loginLink = document.createElement("a");
    loginLink.href = "./login.html";
    loginLink.textContent = "Log in";
    authLinksContainer.appendChild(loginLink);

    const separator2 = document.createTextNode(" / ");
    authLinksContainer.appendChild(separator2);

    const registerLink = document.createElement("a");
    registerLink.href = "./register.html";
    registerLink.textContent = "Register";
    authLinksContainer.appendChild(registerLink);
  }
}

