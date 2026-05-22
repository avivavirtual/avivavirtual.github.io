(function () {
  'use strict';

  var scriptEl = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  if (!scriptEl) return;

  var orgId = scriptEl.getAttribute('data-org-id') || '';
  var apiBase = scriptEl.getAttribute('data-api-base') || (window.location.origin || '').replace(/\/$/, '');

  var state = {
    isOpen: false,
    isRegistered: false,
    sessionId: null,
    name: '',
    email: '',
    language: 'EN',
    hasSentFirstMessage: false,
    handoffActive: false,
    handoffBannerShown: false,
    rating: 0,
    messages: []
  };

  var t = {
    EN: {
      openChat: 'Chat with us',
      welcomeTitle: 'Welcome to support',
      welcomeSubtitle: 'Please tell us who you are before we begin.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      languageLabel: 'Language',
      english: 'English',
      french: 'French',
      startChat: 'Start Chat',
      placeholder: 'Type your message...',
      send: 'Send',
      connectingAI: 'Connecting to AI...',
      typing: 'AI is typing',
      handoff: 'Connecting you with a support specialist...',
      createTicket: 'Create Ticket',
      rateConversation: 'Rate this conversation',
      endChat: 'End Chat',
      upload: 'Upload File',
      comingSoon: 'Coming soon',
      ticketPlaceholder: 'Ticket creation is not available yet.',
      endConfirm: 'Are you sure you want to end this chat?',
      required: 'Please complete all fields with a valid email.',
      ended: 'Chat ended. Refresh page to start a new one.'
    },
    FR: {
      openChat: 'Discuter avec nous',
      welcomeTitle: 'Bienvenue au support',
      welcomeSubtitle: 'Veuillez vous identifier avant de commencer.',
      nameLabel: 'Nom',
      emailLabel: 'Courriel',
      languageLabel: 'Langue',
      english: 'Anglais',
      french: 'Français',
      startChat: 'Démarrer le chat',
      placeholder: 'Tapez votre message...',
      send: 'Envoyer',
      connectingAI: 'Connexion à l’IA...',
      typing: 'L’IA écrit',
      handoff: 'Nous vous mettons en relation avec un spécialiste du support...',
      createTicket: 'Créer un billet',
      rateConversation: 'Évaluer cette conversation',
      endChat: 'Terminer le chat',
      upload: 'Téléverser un fichier',
      comingSoon: 'Bientôt disponible',
      ticketPlaceholder: 'La création de billet n’est pas encore disponible.',
      endConfirm: 'Voulez-vous vraiment terminer ce chat ?',
      required: 'Veuillez remplir tous les champs avec un courriel valide.',
      ended: 'Chat terminé. Actualisez la page pour recommencer.'
    }
  };

  function i18n(key) {
    return t[state.language][key] || t.EN[key] || key;
  }

  function generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var css = '' +
    '.avv-widget-root{position:fixed;right:16px;bottom:16px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}' +
    '.avv-chat-btn{width:56px;height:56px;border-radius:999px;border:none;background:#01696f;color:#fff;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .2s ease}' +
    '.avv-chat-btn:hover{transform:translateY(-2px)}' +
    '.avv-panel{position:absolute;right:0;bottom:72px;width:320px;max-width:calc(100vw - 20px);height:480px;max-height:calc(100vh - 100px);background:#fff;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.25);display:none;overflow:hidden;border:1px solid #d7e1e4}' +
    '.avv-panel.open{display:flex;flex-direction:column}' +
    '.avv-header{background:#01696f;color:#fff;padding:12px 14px;font-size:14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}' +
    '.avv-close{background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1}' +
    '.avv-body{flex:1;display:flex;flex-direction:column;min-height:0}' +
    '.avv-screen{padding:12px;overflow:auto;flex:1}' +
    '.avv-field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}' +
    '.avv-field label{font-size:12px;color:#2a3f45;font-weight:600}' +
    '.avv-input,.avv-select{border:1px solid #b8c8cd;border-radius:8px;padding:10px;font-size:14px;outline:none}' +
    '.avv-input:focus,.avv-select:focus{border-color:#01696f;box-shadow:0 0 0 2px rgba(1,105,111,.16)}' +
    '.avv-primary{width:100%;border:none;background:#01696f;color:#fff;padding:10px;border-radius:8px;font-weight:700;cursor:pointer}' +
    '.avv-hint{font-size:12px;color:#5f7177;margin:0 0 12px}' +
    '.avv-messages{flex:1;padding:10px;overflow:auto;background:#f5f8f9}' +
    '.avv-msg{display:flex;margin:8px 0}' +
    '.avv-msg.ai{justify-content:flex-start}' +
    '.avv-msg.user{justify-content:flex-end}' +
    '.avv-bubble{max-width:78%;padding:9px 11px;border-radius:12px;font-size:13px;line-height:1.35;word-wrap:break-word;white-space:pre-wrap}' +
    '.avv-msg.ai .avv-bubble{background:#dfeff0;color:#183238}' +
    '.avv-msg.ai.agent .avv-bubble{background:#ffe6bf;color:#553a00}' +
    '.avv-msg.user .avv-bubble{background:#01696f;color:#fff}' +
    '.avv-chat-input-row{display:flex;gap:8px;padding:10px;border-top:1px solid #d6e1e3;background:#fff}' +
    '.avv-send{border:none;background:#01696f;color:#fff;border-radius:8px;padding:0 12px;font-weight:700;cursor:pointer}' +
    '.avv-typing{display:inline-flex;gap:4px;align-items:center;padding:8px 10px;background:#dfeff0;border-radius:11px}' +
    '.avv-dot{width:6px;height:6px;border-radius:50%;background:#3c5559;animation:avvBlink 1s infinite ease-in-out}' +
    '.avv-dot:nth-child(2){animation-delay:.15s}.avv-dot:nth-child(3){animation-delay:.3s}' +
    '@keyframes avvBlink{0%,80%,100%{opacity:.2}40%{opacity:1}}' +
    '.avv-banner{margin:8px 10px 0;background:#fff3cd;color:#6b5200;border:1px solid #f4dc9f;padding:8px;border-radius:8px;font-size:12px;font-weight:600}' +
    '.avv-footer{padding:10px;border-top:1px solid #d6e1e3;background:#fff;display:flex;flex-direction:column;gap:8px}' +
    '.avv-actions{display:flex;gap:6px;flex-wrap:wrap}' +
    '.avv-action{border:1px solid #c2d1d5;background:#fff;color:#274348;padding:6px 8px;font-size:12px;border-radius:8px;cursor:pointer}' +
    '.avv-stars{display:flex;gap:4px;align-items:center;font-size:12px;color:#486066}' +
    '.avv-star{cursor:pointer;font-size:16px;color:#9ab0b5;line-height:1}' +
    '.avv-star.active{color:#ffb300}' +
    '.avv-tooltip{position:relative}' +
    '.avv-tooltip:after{content:attr(data-tip);position:absolute;left:50%;transform:translateX(-50%);bottom:120%;background:#1f2f33;color:#fff;font-size:11px;padding:4px 6px;border-radius:6px;opacity:0;pointer-events:none;white-space:nowrap;transition:opacity .2s}' +
    '.avv-tooltip:hover:after{opacity:1}' +
    '.avv-status{font-size:12px;color:#4f666c;padding:0 10px 6px}' +
    '@media (max-width:480px){.avv-widget-root{right:10px;bottom:10px}.avv-panel{width:min(100vw - 12px,360px);height:min(100vh - 80px,560px);right:0;bottom:68px}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var root = document.createElement('div');
  root.className = 'avv-widget-root';
  root.innerHTML =
    '<div class="avv-panel" id="avvPanel">' +
      '<div class="avv-header">' +
        '<span id="avvHeaderTitle">' + esc(i18n('openChat')) + '</span>' +
        '<button class="avv-close" id="avvClose" aria-label="close">&times;</button>' +
      '</div>' +
      '<div class="avv-body" id="avvBody"></div>' +
    '</div>' +
    '<button class="avv-chat-btn" id="avvChatBtn" aria-label="open-chat" title="' + esc(i18n('openChat')) + '">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.6C4 4.716 4.716 4 5.6 4h12.8c.884 0 1.6.716 1.6 1.6v8.8c0 .884-.716 1.6-1.6 1.6H9.8L5.2 19.8c-.5.39-1.2.03-1.2-.6V5.6Z" fill="currentColor"/><circle cx="8.6" cy="10" r="1.2" fill="#01696f"/><circle cx="12" cy="10" r="1.2" fill="#01696f"/><circle cx="15.4" cy="10" r="1.2" fill="#01696f"/></svg>' +
    '</button>';
  document.body.appendChild(root);

  var els = {
    panel: root.querySelector('#avvPanel'),
    body: root.querySelector('#avvBody'),
    btn: root.querySelector('#avvChatBtn'),
    close: root.querySelector('#avvClose'),
    header: root.querySelector('#avvHeaderTitle')
  };

  function renderRegistration() {
    els.body.innerHTML =
      '<div class="avv-screen">' +
        '<h3 style="margin:4px 0 8px;font-size:16px;color:#16343b">' + esc(i18n('welcomeTitle')) + '</h3>' +
        '<p class="avv-hint">' + esc(i18n('welcomeSubtitle')) + '</p>' +
        '<div class="avv-field"><label>' + esc(i18n('nameLabel')) + '</label><input id="avvName" class="avv-input" type="text" maxlength="80"></div>' +
        '<div class="avv-field"><label>' + esc(i18n('emailLabel')) + '</label><input id="avvEmail" class="avv-input" type="email" maxlength="120"></div>' +
        '<div class="avv-field"><label>' + esc(i18n('languageLabel')) + '</label>' +
        '<select id="avvLang" class="avv-select"><option value="EN">' + esc(i18n('english')) + '</option><option value="FR">' + esc(i18n('french')) + '</option></select></div>' +
        '<button id="avvStart" class="avv-primary">' + esc(i18n('startChat')) + '</button>' +
      '</div>';

    var lang = els.body.querySelector('#avvLang');
    lang.value = state.language;
    lang.addEventListener('change', function () {
      state.language = lang.value === 'FR' ? 'FR' : 'EN';
      updateStaticLabels();
      renderRegistration();
    });

    els.body.querySelector('#avvStart').addEventListener('click', function () {
      var name = els.body.querySelector('#avvName').value.trim();
      var email = els.body.querySelector('#avvEmail').value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !emailOk) {
        alert(i18n('required'));
        return;
      }

      state.name = name;
      state.email = email;
      state.isRegistered = true;
      state.sessionId = generateSessionId();
      renderChat();
    });
  }

  function renderMessages() {
    var msgHtml = state.messages.map(function (m) {
      var cls = m.from === 'user' ? 'user' : (m.isAgent ? 'ai agent' : 'ai');
      return '<div class="avv-msg ' + cls + '"><div class="avv-bubble">' + esc(m.text) + '</div></div>';
    }).join('');

    return '<div class="avv-messages" id="avvMessages">' + msgHtml + '</div>';
  }

  function renderFooter() {
    var stars = [1, 2, 3, 4, 5].map(function (n) {
      return '<span class="avv-star ' + (state.rating >= n ? 'active' : '') + '" data-star="' + n + '">★</span>';
    }).join('');

    return '' +
      '<div class="avv-footer">' +
        '<div class="avv-actions">' +
          '<button id="avvCreateTicket" class="avv-action">' + esc(i18n('createTicket')) + '</button>' +
          '<button id="avvUpload" class="avv-action avv-tooltip" data-tip="' + esc(i18n('comingSoon')) + '">' + esc(i18n('upload')) + '</button>' +
          '<button id="avvEndChat" class="avv-action">' + esc(i18n('endChat')) + '</button>' +
        '</div>' +
        '<div class="avv-stars"><span>' + esc(i18n('rateConversation')) + ':</span> ' + stars + '</div>' +
      '</div>';
  }

  function renderChat() {
    els.body.innerHTML =
      (state.handoffBannerShown ? '<div class="avv-banner">' + esc(i18n('handoff')) + '</div>' : '') +
      renderMessages() +
      '<div class="avv-status" id="avvStatus"></div>' +
      '<div class="avv-chat-input-row">' +
        '<input id="avvInput" class="avv-input" style="flex:1;margin:0" placeholder="' + esc(i18n('placeholder')) + '">' +
        '<button id="avvSend" class="avv-send">' + esc(i18n('send')) + '</button>' +
      '</div>' + renderFooter();

    var messagesEl = els.body.querySelector('#avvMessages');
    messagesEl.scrollTop = messagesEl.scrollHeight;

    els.body.querySelector('#avvSend').addEventListener('click', sendMessage);
    els.body.querySelector('#avvInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });

    els.body.querySelector('#avvCreateTicket').addEventListener('click', function () {
      alert(i18n('ticketPlaceholder'));
    });

    els.body.querySelector('#avvEndChat').addEventListener('click', function () {
      if (window.confirm(i18n('endConfirm'))) {
        state.messages.push({ from: 'ai', text: i18n('ended'), isAgent: state.handoffActive });
        renderChat();
      }
    });

    var starEls = els.body.querySelectorAll('.avv-star');
    for (var i = 0; i < starEls.length; i++) {
      starEls[i].addEventListener('click', function () {
        state.rating = Number(this.getAttribute('data-star'));
        renderChat();
      });
    }
  }

  function setStatus(kind) {
    var statusEl = els.body.querySelector('#avvStatus');
    if (!statusEl) return;

    if (kind === 'connecting') {
      statusEl.textContent = i18n('connectingAI');
      return;
    }

    if (kind === 'typing') {
      statusEl.innerHTML = '<span>' + esc(i18n('typing')) + ' </span><span class="avv-typing"><span class="avv-dot"></span><span class="avv-dot"></span><span class="avv-dot"></span></span>';
      return;
    }

    statusEl.innerHTML = '';
  }

  function sendMessage() {
    var input = els.body.querySelector('#avvInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    state.messages.push({ from: 'user', text: text, isAgent: false });
    input.value = '';
    renderChat();

    if (!state.hasSentFirstMessage) {
      state.hasSentFirstMessage = true;
      setStatus('connecting');
    }

    setStatus('typing');

    fetch(apiBase + '/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: orgId,
        message: text,
        sessionId: state.sessionId,
        language: state.language,
        customer: { name: state.name, email: state.email }
      })
    })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('API error')); })
      .then(function (data) {
        var reply = (data && (data.reply || data.message)) || '...';
        var shouldHandoff = Boolean(data && data.shouldHandoff);

        if (shouldHandoff) {
          state.handoffActive = true;
          state.handoffBannerShown = true;
        }

        state.messages.push({
          from: 'ai',
          text: reply,
          isAgent: state.handoffActive
        });

        renderChat();
      })
      .catch(function () {
        state.messages.push({
          from: 'ai',
          text: state.language === 'FR'
            ? 'Une erreur est survenue. Veuillez réessayer.'
            : 'Something went wrong. Please try again.',
          isAgent: state.handoffActive
        });
        renderChat();
      });
  }

  function updateStaticLabels() {
    els.header.textContent = i18n('openChat');
    els.btn.setAttribute('title', i18n('openChat'));
  }

  function openPanel() {
    state.isOpen = true;
    els.panel.classList.add('open');
    if (!state.isRegistered) renderRegistration();
    else renderChat();
  }

  function closePanel() {
    state.isOpen = false;
    els.panel.classList.remove('open');
  }

  els.btn.addEventListener('click', function () {
    if (state.isOpen) closePanel(); else openPanel();
  });
  els.close.addEventListener('click', closePanel);

  updateStaticLabels();
})();
