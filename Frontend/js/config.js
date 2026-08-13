// config.js — resolves which backend API URL the frontend should call.
//
// Because the frontend (static site) and backend (Flask API) are deployed
// as two separate Render services with two separate URLs, the frontend
// needs to know where the backend lives. Resolution order:
//
//   1. ?api=https://your-backend.onrender.com query param (sets & persists)
//   2. localStorage["ANOMALY_API_BASE_URL"] (set by #1, or by the settings UI)
//   3. window.DEFAULT_API_BASE_URL, optionally written by a build step
//   4. same-origin fallback (useful when testing everything on localhost)

const API_BASE_URL_KEY = "ANOMALY_API_BASE_URL";



function getApiBase() {

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("api");

  if (fromQuery) {
    localStorage.setItem(API_BASE_URL_KEY, fromQuery.replace(/\/+$/, ""));
  }


  const stored = localStorage.getItem(API_BASE_URL_KEY);
  if (stored) return stored.replace(/\/+$/, "");

  if (typeof window.DEFAULT_API_BASE_URL === "string" && window.DEFAULT_API_BASE_URL) {
    return window.DEFAULT_API_BASE_URL.replace(/\/+$/, "");
  }

  // Local dev fallback: assume Flask is running on localhost:5000.
  return "http://127.0.0.1:5000";
}

function setApiBase(url) {
  localStorage.setItem(API_BASE_URL_KEY, url.replace(/\/+$/, ""));
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
