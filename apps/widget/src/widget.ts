type WidgetConfig = {
  primaryColor: string;
  greetingEN: string;
  greetingFR: string;
};

const script = document.currentScript as HTMLScriptElement | null;
const embedKey = script?.dataset.key ?? '';
const language = (script?.dataset.lang ?? 'en').toLowerCase();
const apiUrl = script?.dataset.api ?? 'http://localhost:3001';
const fallbackConfig: WidgetConfig = {
  primaryColor: '#0EA5E9',
  greetingEN: 'Hi! How can we help you today?',
  greetingFR: 'Bonjour! Comment pouvons-nous vous aider?',
};

class AvivaVirtualWidget extends HTMLElement {
  private readonly root = this.attachShadow({ mode: 'open' });
  private contactId?: string;
  private config: WidgetConfig = fallbackConfig;

  connectedCallback() { void this.render(); }

  private async render() {
    this.config = await this.fetchConfig();
    this.root.replaceChildren(this.buildStyles(), this.buildLauncher(), this.buildPanel());
    this.root.querySelector('.button')?.addEventListener('click', () => this.toggle());
    this.root.getElementById('send')?.addEventListener('click', () => this.send());
  }

  private buildStyles() {
    const styles = document.createElement('style');
    styles.textContent = `:host{font-family:Inter,system-ui}.button{position:fixed;right:24px;bottom:24px;border:0;border-radius:999px;padding:14px 18px;background:${this.safeColor()};color:white;font-weight:700}.panel{position:fixed;right:24px;bottom:88px;width:360px;max-width:calc(100vw - 32px);border-radius:22px;background:white;box-shadow:0 24px 80px #0f172a33;overflow:hidden}.head{background:${this.safeColor()};color:white;padding:16px}.body{padding:16px}.messages{min-height:220px}.input{display:flex;gap:8px}.input input{flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:12px}.input button{border:0;border-radius:12px;background:${this.safeColor()};color:white;padding:10px 12px}.error{color:#b91c1c;font-size:13px}`;
    return styles;
  }

  private buildLauncher() {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = 'Chat';
    return button;
  }

  private buildPanel() {
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.hidden = true;
    const header = document.createElement('div');
    header.className = 'head';
    header.textContent = 'AvivaVirtual Support';
    const body = document.createElement('div');
    body.className = 'body';
    const greeting = document.createElement('p');
    greeting.textContent = language === 'fr' ? this.config.greetingFR : this.config.greetingEN;
    const label = document.createElement('label');
    const consent = document.createElement('input');
    consent.id = 'consent';
    consent.type = 'checkbox';
    label.append(consent, ' I consent to support processing under PIPEDA.');
    const messages = document.createElement('div');
    messages.className = 'messages';
    messages.id = 'messages';
    const error = document.createElement('p');
    error.className = 'error';
    error.id = 'error';
    const inputRow = document.createElement('div');
    inputRow.className = 'input';
    const input = document.createElement('input');
    input.id = 'msg';
    input.placeholder = 'Type your message';
    const send = document.createElement('button');
    send.id = 'send';
    send.textContent = 'Send';
    inputRow.append(input, send);
    body.append(greeting, label, error, messages, inputRow);
    panel.append(header, body);
    return panel;
  }

  private async fetchConfig(): Promise<WidgetConfig> {
    const response = await fetch(`${apiUrl}/contacts/widget/${embedKey}/config`).catch(() => undefined);
    return response?.ok ? response.json() : fallbackConfig;
  }

  private toggle() {
    const panel = this.root.querySelector<HTMLElement>('.panel');
    if (panel) panel.hidden = !panel.hidden;
  }

  private async send() {
    const input = this.root.getElementById('msg') as HTMLInputElement | null;
    const consent = this.root.getElementById('consent') as HTMLInputElement | null;
    this.showError('');
    if (!input?.value.trim()) return;
    if (!consent?.checked) {
      this.showError('Please provide PIPEDA consent before sending a message.');
      return;
    }
    const message = input.value;
    this.appendMessage('You', message);
    input.value = '';
    if (!this.contactId) {
      const started = await fetch(`${apiUrl}/contacts/widget/${embedKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pipedaConsent: true, language: language === 'fr' ? 'FR' : 'EN' }) }).then((res) => res.json());
      this.contactId = started.id;
    }
    const ai = await fetch(`${apiUrl}/contacts/widget/${this.contactId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: message }) }).then((res) => res.json());
    this.appendMessage('AI', ai.answer ?? 'Connecting you with a specialist...');
  }

  private appendMessage(sender: string, content: string) {
    const messages = this.root.getElementById('messages');
    const paragraph = document.createElement('p');
    const label = document.createElement('b');
    label.textContent = `${sender}: `;
    paragraph.append(label, content);
    messages?.appendChild(paragraph);
  }

  private showError(message: string) {
    const error = this.root.getElementById('error');
    if (error) error.textContent = message;
  }

  private safeColor() {
    return /^#[0-9a-f]{6}$/i.test(this.config.primaryColor) ? this.config.primaryColor : fallbackConfig.primaryColor;
  }
}

customElements.define('avivavirtual-widget', AvivaVirtualWidget);
document.body.appendChild(document.createElement('avivavirtual-widget'));
