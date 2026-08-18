// chat.js — floating security-assistant chat widget (dashboard only)

(() => {
  let history = []; // [{role, content}, ...] kept short, sent with each request

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function appendMessage(role, text) {
    const wrap = document.getElementById("chatMessages");
    const el = document.createElement("div");
    el.className = `chat-msg ${role}`;
    el.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
    return el;
  }

  function appendTyping() {
    const wrap = document.getElementById("chatMessages");
    const el = document.createElement("div");
    el.className = "chat-msg assistant chat-typing";
    el.id = "chatTypingIndicator";
    el.innerHTML = "<span></span><span></span><span></span>";
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById("chatTypingIndicator");
    if (el) el.remove();
  }

  async function sendMessage(message) {
    appendMessage("user", message);
    history.push({ role: "user", content: message });
    appendTyping();

    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");
    input.disabled = true;
    sendBtn.disabled = true;

    try {
      const resp = await Api.chat(message, history.slice(-10));
      removeTyping();
      appendMessage("assistant", resp.reply || "(no response)");
      history.push({ role: "assistant", content: resp.reply || "" });
      // Keep history bounded so requests stay small.
      if (history.length > 20) history = history.slice(-20);
    } catch (err) {
      removeTyping();
      appendMessage("assistant", `⚠ ${err.message}`);
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("chatToggle");
    const panel = document.getElementById("chatPanel");
    const closeBtn = document.getElementById("chatClose");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");

    if (!toggle || !panel || !form) return; // widget not on this page

    toggle.addEventListener("click", () => {
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) input.focus();
    });
    closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      input.value = "";
      sendMessage(message);
    });

    // Hide the composer and show a setup note if the backend has no API key configured.
    // loadState() in dashboard.js already fetches /api/state; we piggyback on Api.state()
    // once here so the widget reflects availability without waiting on dashboard.js internals.
    Api.state()
      .then((state) => {
        if (!state.has_chat) {
          form.classList.add("hidden");
          document.getElementById("chatUnavailable").classList.remove("hidden");
        }
      })
      .catch(() => {
        /* dashboard.js will already surface auth/connection errors */
      });
  });
})();
