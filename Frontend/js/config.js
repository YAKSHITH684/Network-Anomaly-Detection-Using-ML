// config.js — Backend API configuration

const API_BASE_URL_KEY = "ANOMALY_API_BASE_URL";

// Your deployed Flask backend on Render
const DEFAULT_API_BASE_URL =
  "https://network-anomaly-detection-using-ml.onrender.com";

function getApiBase() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("api");

  // Allow ?api=... to override and save the backend URL
  if (fromQuery) {
    const url = fromQuery.replace(/\/+$/, "");
    localStorage.setItem(API_BASE_URL_KEY, url);
    return url;
  }

  // Use previously saved backend URL
  const stored = localStorage.getItem(API_BASE_URL_KEY);

  if (stored) {
    return stored.replace(/\/+$/, "");
  }

  // Use deployed Render backend by default
  return DEFAULT_API_BASE_URL;
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