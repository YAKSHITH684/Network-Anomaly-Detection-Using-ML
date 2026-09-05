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

document.addEventListener("DOMContentLoaded", () => {
  // Already logged in? Skip straight to the dashboard.
  if (getToken()) {
    window.location.href = "dashboard.html";
    return;
  }

  // warmup.js (loaded before this file, at the very top of <head>) already
  // started pinging the backend the moment the page began loading — this
  // just reflects that status instead of starting a fresh check.
  const warmup = window.BackendWarmup;
  if (warmup && !warmup.ready) {
    showFlash("Waking up the server… this can take up to a minute on the first load.", "warning");
    warmup.onReady(() => clearFlash());
    document.addEventListener("backend:timeout", () => {
      showFlash("The backend is taking longer than usual to wake up. You can still try logging in below.", "warning");
    });
  }

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
    btn.classList.add("btn-loading");

    // If the backend is still cold, a single attempt can fail with a
    // network-level error before the container finishes booting. Retry a
    // few times automatically in that case, but never for real auth
    // failures (wrong password etc.), which come back as a normal HTTP
    // error with a status code, not a fetch exception.
    const MAX_ATTEMPTS = 4;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      btn.innerHTML = attempt === 1 ? "Working…" : `Waking server, retrying… (${attempt}/${MAX_ATTEMPTS})`;
      try {
        const resp = await Api.login(username, password);
        setToken(resp.token);
        window.location.href = "dashboard.html";
        return;
      } catch (err) {
        const isNetworkError = err.status === undefined;
        const isLastAttempt = attempt === MAX_ATTEMPTS;
        if (isNetworkError && !isLastAttempt) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        showFlash(err.message);
        btn.innerHTML = original;
        btn.classList.remove("btn-loading");
        return;
      }
    }
  });
});
