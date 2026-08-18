// dashboard.js — main dashboard behavior

const MODEL_LABELS = {
  naive_bayes: "Naive Bayes",
  logistic: "Logistic Regression",
  svm: "SVM",
  random_forest: "Random Forest",
  xgboost: "XGBoost",
  lightgbm: "LightGBM",
};

let currentState = null;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str === null || str === undefined ? "" : String(str);
  return div.innerHTML;
}

function showFlash(message, kind = "warning") {
  const flash = document.getElementById("flash");
  flash.innerHTML = `<div class="row mb-3"><div class="col-12"><div class="alert alert-${kind}">${escapeHtml(message)}</div></div></div>`;
  showToast(message);
}

function clearFlash() {
  document.getElementById("flash").innerHTML = "";
}

let toastTimer = null;
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function setButtonBusy(btn, busyText) {
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = busyText;
  btn.classList.add("btn-loading");
  btn.disabled = true;
}
function clearButtonBusy(btn) {
  if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
  btn.classList.remove("btn-loading");
  btn.disabled = false;
}

function renderTable(container, columns, rows, limit) {
  if (!columns || !rows || rows.length === 0) {
    container.innerHTML = '<div class="text-muted">No data.</div>';
    return;
  }
  const shown = typeof limit === "number" ? rows.slice(0, limit) : rows;
  let html = '<table class="table table-striped table-sm mb-0"><thead><tr>';
  for (const c of columns) html += `<th>${escapeHtml(c)}</th>`;
  html += "</tr></thead><tbody>";
  for (const row of shown) {
    html += "<tr>";
    for (const cell of row) html += `<td>${escapeHtml(cell)}</td>`;
    html += "</tr>";
  }
  html += "</tbody></table>";
  container.innerHTML = html;
}

function renderLogs(logs) {
  const el = document.getElementById("logLines");
  if (!logs || logs.length === 0) {
    el.innerHTML = '<div class="text-muted">No logs yet.</div>';
    return;
  }
  el.innerHTML = logs
    .map((l) => {
      const lower = l.toLowerCase();
      const isErr = lower.includes("error") || lower.includes("traceback") || lower.includes("failed");
      return `<div class="log-line${isErr ? " err" : ""}">${escapeHtml(l)}</div>`;
    })
    .join("");
}

function renderModelButtons(state) {
  const wrap = document.getElementById("modelButtons");
  wrap.innerHTML = "";
  for (const name of state.available_models) {
    const disabled =
      (name === "xgboost" && !state.has_xgboost) ||
      (name === "lightgbm" && !state.has_lightgbm);

    const btn = document.createElement("button");
    btn.className = "btn btn-primary model-btn";
    btn.dataset.model = name;
    const metric = state.model_metrics && state.model_metrics[name];
    if (metric) btn.classList.add("trained");

    const label = MODEL_LABELS[name] || name;
    btn.innerHTML = metric
      ? `${label} <span class="badge bg-light text-dark ms-1">${(metric.accuracy * 100).toFixed(1)}%</span>`
      : label;

    if (disabled) {
      btn.disabled = true;
      btn.title = `${label} is not installed on the server.`;
    } else {
      btn.addEventListener("click", () => trainModel(name, btn));
    }
    wrap.appendChild(btn);
  }
}

async function loadState() {
  try {
    const state = await Api.state();
    currentState = state;
    document.getElementById("whoami").textContent = state.username;
    renderLogs(state.logs);
    if (state.preview) {
      renderTable(document.getElementById("previewTable"), state.preview.columns, state.preview.rows);
    } else {
      document.getElementById("previewTable").innerHTML = '<div class="text-muted">No dataset uploaded yet.</div>';
    }
    renderModelButtons(state);
  } catch (err) {
    if (err.status === 401) {
      clearToken();
      window.location.href = "index.html";
      return;
    }
    showFlash(err.message);
  }
}

function initDropzone(inputId, filenameId) {
  const input = document.getElementById(inputId);
  const zone = input.closest(".dropzone");
  const label = document.getElementById(filenameId);

  ["dragenter", "dragover"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
    })
  );
  zone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length) {
      input.files = files;
      updateFilename(input, label);
    }
  });
  input.addEventListener("change", () => updateFilename(input, label));
}

function updateFilename(input, label) {
  if (input.files && input.files.length) {
    const f = input.files[0];
    if (!f.name.toLowerCase().endsWith(".csv")) {
      showFlash("Please choose a .csv file");
      input.value = "";
      label.textContent = "No file chosen";
      return;
    }
    label.textContent = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
  } else {
    label.textContent = "No file chosen";
  }
}

async function doUpload() {
  const input = document.getElementById("uploadInput");
  const btn = document.getElementById("uploadBtn");
  if (!input.files || !input.files.length) {
    showFlash("Please choose a CSV file to upload.");
    return;
  }
  clearFlash();
  setButtonBusy(btn, "Uploading…");
  try {
    const resp = await Api.uploadDataset(input.files[0]);
    renderTable(document.getElementById("previewTable"), resp.preview.columns, resp.preview.rows);
    showToast("Dataset uploaded.");
    await loadState();
  } catch (err) {
    showFlash(err.message);
  } finally {
    clearButtonBusy(btn);
  }
}

async function doPreprocess() {
  const btn = document.getElementById("preprocessBtn");
  clearFlash();
  setButtonBusy(btn, "Preprocessing…");
  try {
    const resp = await Api.preprocess();
    showToast(`Preprocessing complete. Train: ${resp.train_shape.join("×")}, Test: ${resp.test_shape.join("×")}`);
    await loadState();
  } catch (err) {
    showFlash(err.message);
  } finally {
    clearButtonBusy(btn);
  }
}

async function trainModel(name, btn) {
  clearFlash();
  setButtonBusy(btn, "Training…");
  try {
    const resp = await Api.trainModel(name);
    showToast(`${MODEL_LABELS[name] || name} trained — accuracy ${(resp.accuracy * 100).toFixed(2)}%`);
    await loadState();
  } catch (err) {
    showFlash(err.message);
    clearButtonBusy(btn);
  }
}

async function doGraphs() {
  const btn = document.getElementById("graphsBtn");
  clearFlash();
  setButtonBusy(btn, "Loading…");
  try {
    const resp = await Api.graphs();
    document.getElementById("accImg").src = "data:image/png;base64," + resp.acc_img;
    document.getElementById("pieImg").src = "data:image/png;base64," + resp.pie_img;
    document.getElementById("graphsSection").classList.remove("hidden");
    document.getElementById("graphsSection").scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    showFlash(err.message);
  } finally {
    clearButtonBusy(btn);
  }
}

async function doPredict() {
  const input = document.getElementById("predictInput");
  const btn = document.getElementById("predictBtn");
  if (!input.files || !input.files.length) {
    showFlash("Please choose a CSV file to classify.");
    return;
  }
  clearFlash();
  setButtonBusy(btn, "Predicting…");
  try {
    const resp = await Api.predict(input.files[0]);
    document.getElementById("predictModelUsed").textContent = `— using ${resp.model_name} (${resp.row_count} rows)`;
    renderTable(document.getElementById("predictTable"), resp.columns, resp.rows, 200);
    document.getElementById("predictSection").classList.remove("hidden");
    document.getElementById("predictSection").scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    showFlash(err.message);
  } finally {
    clearButtonBusy(btn);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try { await Api.logout(); } catch (e) { /* ignore */ }
    clearToken();
    window.location.href = "index.html";
  });

  initDropzone("uploadInput", "uploadFilename");
  initDropzone("predictInput", "predictFilename");

  document.getElementById("uploadBtn").addEventListener("click", doUpload);
  document.getElementById("preprocessBtn").addEventListener("click", doPreprocess);
  document.getElementById("graphsBtn").addEventListener("click", doGraphs);
  document.getElementById("predictBtn").addEventListener("click", doPredict);
  document.getElementById("closeGraphsBtn").addEventListener("click", () =>
    document.getElementById("graphsSection").classList.add("hidden")
  );
  document.getElementById("closePredictBtn").addEventListener("click", () =>
    document.getElementById("predictSection").classList.add("hidden")
  );

  loadState();
});
