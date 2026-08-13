// config.js
// Frontend API configuration for the deployed Flask backend.

const API_BASE_URL_KEY = "ANOMALY_API_BASE_URL";

const DEFAULT_RENDER_BACKEND =
  "https://network-anomaly-detection-using-ml.onrender.com";

function getApiBase() {
  // 1. Allow ?api=... if provided
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("api");

  if (fromQuery) {
    const url = fromQuery.replace(/\/+$/, "");
    localStorage.setItem(API_BASE_URL_KEY, url);
    return url;
  }

  // 2. Previously saved API URL
  const stored = localStorage.getItem(API_BASE_URL_KEY);

  if (stored) {
    return stored.replace(/\/+$/, "");
  }

  // 3. env.js value
  if (
    typeof window.DEFAULT_API_BASE_URL === "string" &&
    window.DEFAULT_API_BASE_URL.trim()
  ) {
    return window.DEFAULT_API_BASE_URL.replace(/\/+$/, "");
  }

  // 4. Deployed Render backend
  return DEFAULT_RENDER_BACKEND;
}

function setApiBase(url) {
  if (!url) return;

  localStorage.setItem(
    API_BASE_URL_KEY,
    url.replace(/\/+$/, "")
  );
}

function getToken() {
  return localStorage.getItem("ANOMALY_TOKEN");
}

function setToken(token) {
  localStorage.setItem("ANOMALY_TOKEN", token);
}

function clearToken() {
  localStorage.removeItem("ANOMALY_TOKEN");
}