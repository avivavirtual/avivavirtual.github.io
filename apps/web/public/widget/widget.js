(function () {
  const script = document.currentScript;
  const orgId = script && script.getAttribute("data-org-id") ? script.getAttribute("data-org-id") : "demo";
  const defaultLang = script && script.getAttribute("data-lang") ? script.getAttribute("data-lang") : "en";
  const apiUrl = script && script.getAttribute("data-api-url") ? script.getAttribute("data-api-url") : "https://app.avivavirtual.ca";
  const demoMode = Boolean(script && script.getAttribute("data-demo") === "true") || apiUrl === "demo";
  const title = script && script.getAttribute("data-title") ? script.getAttribute("data-title") : "AvivaVirtual AI Agent";
  const launcherLabel = script && script.getAttribute("data-launcher-label") ? script.getAttribute("data-launcher-label") : "AvivaVirtual AI Agent";
  const accent = script && script.getAttribute("data-accent") ? script.getAttribute("data-accent") : "#0EA5E9";
  const requireConsent = !(script && script.getAttribute("data-require-consent") === "false");

  const existing = document.querySelector("[data-aviva-widget-host]");
  if (existing) existing.remove();
  const host = document.createElement("div");
  host.setAttribute("data-aviva-widget-host", "true");
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  let open = false;
  let step = 1;
  let conversationId = null;
  let profile = { name: "", email: "", language: defaultLang.toUpperCase(), consent: false };
  const messages = [];

  const styles = `
    *{box-sizing:border-box;font-family:Inter,system-ui,sans-serif}
    button,input,select,textarea{font:inherit}
    .launcher{position:fixed;right:20px;bottom:20px;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 40px);min-height:52px;border:0;border-radius:999px;background:${accent};color:white;box-shadow:0 12px 28px rgba(15,23,42,.24);cursor:pointer;font-weight:800;padding:8px 16px 8px 10px;letter-spacing:0}
    .launcher-label{white-space:normal;text-align:left;line-height:1.15}
    .agent-mark{position:relative;display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:10px;background:linear-gradient(135deg,#0f766e,#0ea5e9 58%,#1d4ed8);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 16px rgba(14,165,233,.25);color:white;font-size:12px;font-weight:900}
    .agent-mark:after{content:"";position:absolute;right:4px;top:4px;width:7px;height:7px;border-radius:999px;background:#A7F3D0;box-shadow:0 0 0 3px rgba(167,243,208,.25)}
    .panel{position:fixed;right:20px;bottom:86px;width:min(380px,calc(100vw - 40px));height:min(620px,calc(100vh - 120px));background:white;border:1px solid #dbe3ea;border-radius:8px;box-shadow:0 18px 48px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden}
    .head{padding:14px 16px;background:#0F172A;color:white;display:flex;justify-content:space-between;align-items:center;gap:12px}
    .brand{display:flex;align-items:center;gap:10px;min-width:0}
    .brand-copy{display:grid;gap:1px;min-width:0}
    .title{font-weight:800;line-height:1.15}
    .subtitle{font-size:11px;color:#BAE6FD;line-height:1.2}
    .body{padding:14px;overflow:auto;flex:1;background:#f8fafc}
    .foot{padding:12px;border-top:1px solid #dbe3ea;background:white}
    .field{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:10px;margin-top:10px}
    .primary{width:100%;border:0;border-radius:6px;background:${accent};color:white;padding:10px;cursor:pointer}
    .msg{padding:10px;border-radius:8px;margin:8px 0;max-width:82%;font-size:14px;line-height:1.45}
    .customer{margin-left:auto;background:${accent};color:white}
    .ai{margin-right:auto;background:white;border:1px solid #dbe3ea;color:#1f2937}
    .small{font-size:12px;color:#64748b;line-height:1.45}
  `;

  function render() {
    root.innerHTML = `<style>${styles}</style><button class="launcher" aria-label="Open AvivaVirtual AI Agent"><span class="agent-mark" aria-hidden="true">AV</span><span class="launcher-label">${escapeHtml(launcherLabel)}</span></button>${open ? panel() : ""}`;
    root.querySelector(".launcher").onclick = () => {
      open = !open;
      render();
    };
    const close = root.querySelector("[data-close]");
    if (close) close.onclick = () => { open = false; render(); };
    const next = root.querySelector("[data-next]");
    if (next) next.onclick = submitProfile;
    const send = root.querySelector("[data-send]");
    if (send) send.onclick = sendMessage;
    const rate = root.querySelector("[data-rate]");
    if (rate) rate.onclick = () => addMessage("ai", "Thanks for rating the conversation.");
  }

  function panel() {
    return `<section class="panel">
      <div class="head"><div class="brand"><span class="agent-mark" aria-hidden="true">AV</span><div class="brand-copy"><span class="title">${escapeHtml(title)}</span><span class="subtitle">Approved-knowledge assistant</span></div></div><button data-close style="background:transparent;border:0;color:white;cursor:pointer">x</button></div>
      <div class="body">${content()}</div>
      <div class="foot">${footer()}</div>
    </section>`;
  }

  function content() {
    if (step === 1) {
      return `<p class="small">Chat with AvivaVirtual AI Agent.</p>
        <input class="field" id="av-name" placeholder="Name">
        <input class="field" id="av-email" placeholder="Email">
        <select class="field" id="av-lang"><option value="EN">English</option><option value="FR">Francais</option></select>`;
    }
    if (step === 2) {
      if (!requireConsent) return "";
      return `<p class="small">Consent is required before submitting an AI support conversation.</p>
        <label class="small"><input type="checkbox" id="av-consent"> I consent to this AI conversation being processed to provide support.</label>`;
    }
    return messages.map(message => `<div class="msg ${message.role}">${escapeHtml(message.text)}</div>`).join("") || `<p class="small">Ask AvivaVirtual AI Agent your first question.</p>`;
  }

  function footer() {
    if (step < 3) return `<button class="primary" data-next>Continue</button>`;
    return `<textarea class="field" id="av-message" placeholder="Ask AvivaVirtual AI Agent"></textarea>
      <button class="primary" data-send>Send</button>
      <button class="field" data-rate>Rate 5 stars</button>`;
  }

  function submitProfile() {
    if (step === 1) {
      profile.name = value("av-name");
      profile.email = value("av-email");
      profile.language = value("av-lang") || defaultLang.toUpperCase();
      if (!requireConsent) {
        profile.consent = true;
        step = 3;
      } else {
        step = 2;
      }
      render();
      return;
    }
    profile.consent = Boolean(root.querySelector("#av-consent") && root.querySelector("#av-consent").checked);
    if (!profile.consent) {
      addMessage("ai", "Consent is required before AI support can start.");
      return;
    }
    step = 3;
    render();
  }

  async function sendMessage() {
    const text = value("av-message");
    if (!text.trim()) return;
    addMessage("customer", text);
    if (demoMode) {
      window.setTimeout(() => {
        conversationId = conversationId || `demo-${Math.random().toString(36).slice(2, 8)}`;
        addMessage("ai", demoAnswer(text));
      }, 250);
      return;
    }
    try {
      const path = conversationId ? `/api/v1/conversations/widget/${conversationId}/message` : `/api/v1/conversations/widget/${orgId}`;
      const body = conversationId ? { message: text, name: profile.name, email: profile.email } : { ...profile, message: text };
      const response = await fetch(apiUrl + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      conversationId = conversationId || (data.conversation && data.conversation.id);
      const fallback = data.should_handoff
        ? (profile.language === "FR" ? "Je vais creer une demande de soutien pour revision." : "I will create a support request for review.")
        : "Thanks. The AI assistant received your message.";
      addMessage("ai", data.message && data.message.content ? data.message.content : fallback);
    } catch (error) {
      addMessage("ai", "Support is temporarily unavailable. Please try again soon.");
    }
  }

  function demoAnswer(text) {
    const question = text.toLowerCase();
    if (question.includes("invoice") || question.includes("billing") || question.includes("bill")) {
      return "I can help with that. In most billing workflows, invoices are corrected or reissued rather than reset. Please share the invoice number, billing email, and what needs to change so the account can be reviewed before the billing update. Source: Billing cycle.";
    }
    if (question.includes("login") || question.includes("password") || question.includes("sign in") || question.includes("reset")) {
      return "I can help with login trouble. First, try the password reset link from the sign-in page, then check your inbox and spam folder for the reset email. If you still cannot get in, include the account email and exact error so staff can verify it securely. Source: Password reset.";
    }
    if (question.includes("agent") || question.includes("human") || question.includes("person")) {
      return "This widget is AI-first and does not open a live human chat. I can queue this as a support request for staff review or help collect details for a callback. Source: Support review policy.";
    }
    if (question.includes("callback") || question.includes("call") || question.includes("phone")) {
      return "I can help prepare a callback request. Please provide your phone number, preferred time window, and a short reason for the call. Source: Callback requests.";
    }
    if (question.includes("privacy") || question.includes("consent") || question.includes("pipeda")) {
      return "Consent is required before personal information is submitted through the widget. Support conversations, call records, and transcripts follow the configured retention policy. Source: PIPEDA consent.";
    }
    return "I can answer from the approved knowledge base and queue account-specific questions for staff review. Try asking about invoices, login help, callbacks, or privacy. Source: Approved knowledge base.";
  }

  function addMessage(role, text) {
    messages.push({ role, text });
    render();
  }

  function value(id) {
    const el = root.querySelector("#" + id);
    return el ? el.value : "";
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  render();
})();
