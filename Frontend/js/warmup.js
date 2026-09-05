// warmup.js — wakes the Render backend the instant the page starts loading.
//
// Render's free tier spins the backend down after ~15 minutes idle, and the
// first request after that can take 30-60s while the container boots. This
// script is loaded FIRST (before config.js/api.js/login.js/dashboard.js) so
// the wake-up ping fires the moment the browser parses <head> — before the
// user has even seen the page, let alone clicked Login — instead of waiting
// until they submit a form and hit a cold "Failed to fetch".
//
// It keeps retrying in the background and exposes window.BackendWarmup so
// other scripts can react (show a banner, hold off on requests, etc.)
// without each of them re-implementing their own polling loop.

(function () {
  const STORAGE_KEY = "ANOMALY_API_BASE_URL";
  const MAX_WAIT_MS = 90000; // Render free-tier cold starts are almost always under this
  const RETRY_MS = 2000; // gap between wake-up pings
  const ATTEMPT_TIMEOUT_MS = 6000; // give up on a single ping and retry sooner

  function resolveBase() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("api");
    if (fromQuery) return fromQuery.replace(/\/+$/, "");
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored.replace(/\/+$/, "");
    return (
      window.DEFAULT_API_BASE_URL ||
      "https://network-anomaly-detection-using-ml.onrender.com"
    ).replace(/\/+$/, "");
  }

  const base = resolveBase();
  let started = Date.now();

  const Warmup = {
    base,
    ready: false,
    failed: false,
    _cbs: [],
    // Call cb as soon as the backend responds. If it already has, cb runs
    // immediately (so late subscribers never miss the event).
    onReady(cb) {
      if (this.ready) cb();
      else this._cbs.push(cb);
    },
    // Manually kick off another wake-up cycle (e.g. a "Retry" button).
    retry() {
      this.failed = false;
      started = Date.now();
      ping();
    },
  };
  window.BackendWarmup = Warmup;

  function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal, cache: "no-store" }).finally(() =>
      clearTimeout(id)
    );
  }

  function markReady() {
    if (Warmup.ready) return;
    Warmup.ready = true;
    Warmup.failed = false;
    const cbs = Warmup._cbs;
    Warmup._cbs = [];
    cbs.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        /* a subscriber's own bug shouldn't break warmup */
      }
    });
    document.dispatchEvent(new CustomEvent("backend:ready"));
  }

  function markTimeout() {
    Warmup.failed = true;
    document.dispatchEvent(new CustomEvent("backend:timeout"));
  }

  function ping() {
    fetchWithTimeout(base + "/api/health", ATTEMPT_TIMEOUT_MS)
      .then((res) => {
        if (res && res.ok) markReady();
        else scheduleNext();
      })
      .catch(() => scheduleNext());
  }

  function scheduleNext() {
    if (Warmup.ready) return;
    if (Date.now() - started >= MAX_WAIT_MS) {
      markTimeout();
      return;
    }
    setTimeout(ping, RETRY_MS);
  }

  // Fire the very first ping right now — do not wait for DOMContentLoaded,
  // for other scripts, or for stylesheets. This line runs within
  // milliseconds of the tab opening.
  ping();
})();
