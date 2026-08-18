// login.js — login page behavior

function showFlash(message, kind = "warning") {
  const flash = document.getElementById("flash");
  flash.innerHTML = `<div class="row mb-3"><div class="col-12"><div class="alert alert-${kind}">${escapeHtml(message)}</div></div></div>`;
}

function clearFlash() {
  document.getElementById("flash").innerHTML = "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function checkBackendOnce() {
  // Silent background check — only surfaces a message if the backend
  // is actually unreachable, instead of a permanent status bar.
  try {
    await Api.health();
  } catch (e) {
    showFlash("Backend is waking up or unreachable — this can take up to a minute on first load.", "warning");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Already logged in? Skip straight to the dashboard.
  if (getToken()) {
    window.location.href = "dashboard.html";
    return;
  }

  checkBackendOnce();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFlash();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!username || !password) {
      showFlash("Please fill username and password");
      return;
    }

    const btn = document.getElementById("loginBtn");
    const original = btn.innerHTML;
    btn.innerHTML = "Working…";
    btn.classList.add("btn-loading");

    try {
      const resp = await Api.login(username, password);
      setToken(resp.token);
      window.location.href = "dashboard.html";
    } catch (err) {
      showFlash(err.message);
      btn.innerHTML = original;
      btn.classList.remove("btn-loading");
    }
  });
});
