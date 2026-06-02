'use client';

import { useMemo, useState } from 'react';

const starterPrompts = [
  'How do I reset my invoice?',
  'I need help logging in',
  'Can I talk to an agent?'
];

const initialMessages = [
  {
    id: 'welcome',
    senderType: 'SYSTEM',
    content: 'Hi, I can help start a support conversation. Send your question and I will save it for the team.',
    isAI: true
  }
];

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const [customer, setCustomer] = useState({
    name: 'AvivaVirtual',
    email: 'info@avivavirtual.com'
  });
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('Ready');
  const [isSending, setIsSending] = useState(false);

  const conversationStatus = useMemo(() => {
    return conversationId ? `Conversation ${conversationId.slice(0, 8)}` : 'New conversation';
  }, [conversationId]);

  async function sendMessage(messageOverride) {
    const message = (messageOverride ?? draft).trim();

    if (!message || isSending) {
      return;
    }

    setDraft('');
    setIsSending(true);
    setStatus('Sending');
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `pending-${Date.now()}`,
        senderType: 'CUSTOMER',
        content: message,
        isAI: false
      }
    ]);

    try {
      const endpoint = conversationId
        ? `${apiUrl}/chat/conversations/${conversationId}/messages`
        : `${apiUrl}/chat/conversations`;
      const payload = conversationId
        ? { message }
        : {
            name: customer.name,
            email: customer.email,
            message
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('The chat API did not accept the message.');
      }

      const conversation = await response.json();

      setConversationId(conversation.id);
      setMessages(conversation.messages);
      setStatus('Saved');
    } catch (error) {
      const message =
        error instanceof TypeError && error.message === 'Failed to fetch'
          ? `Cannot reach API at ${apiUrl}`
          : error instanceof Error
            ? error.message
            : 'Unable to send message';

      setStatus(message);
    } finally {
      setIsSending(false);
    }
  }

  function updateCustomer(field, value) {
    setCustomer((currentCustomer) => ({
      ...currentCustomer,
      [field]: value
    }));
  }

  return (
    <main className="appShell">
      <section className="chatSurface" aria-label="Customer support chat">
        <header className="chatHeader">
          <div className="brand">
            <span className="brandMark" aria-hidden="true" />
            <div>
              <h1>Avivavirtual Chat</h1>
              <p>{conversationStatus}</p>
            </div>
          </div>
          <a className="docsLink" href={`${apiUrl}/docs`}>
            API docs
          </a>
        </header>

        <div className="chatLayout">
          <aside className="customerPanel" aria-label="Customer details">
            <div>
              <h2>Customer</h2>
              <p>These details are attached to the support conversation.</p>
            </div>

            <label>
              Name
              <input
                value={customer.name}
                onChange={(event) => updateCustomer('name', event.target.value)}
                placeholder="Your name"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={customer.email}
                onChange={(event) => updateCustomer('email', event.target.value)}
                placeholder="you@example.ca"
              />
            </label>

            <div className="promptGroup">
              {starterPrompts.map((prompt) => (
                <button className="promptButton" key={prompt} onClick={() => sendMessage(prompt)} type="button">
                  {prompt}
                </button>
              ))}
            </div>
          </aside>

          <section className="conversationPanel">
            <div className="messageList" aria-live="polite">
              {messages.map((message) => {
                const isCustomer = message.senderType === 'CUSTOMER';

                return (
                  <article className={isCustomer ? 'message messageCustomer' : 'message messageAssistant'} key={message.id}>
                    <span>{isCustomer ? customer.name || 'Customer' : message.isAI ? 'Assistant' : 'Support'}</span>
                    <p>{message.content}</p>
                  </article>
                );
              })}
            </div>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your question..."
                aria-label="Type your question"
              />
              <button disabled={isSending || !draft.trim()} type="submit">
                {isSending ? 'Sending' : 'Send'}
              </button>
            </form>

            <footer className="chatStatus">{status}</footer>
          </section>
        </div>
      </section>
    </main>
  );
}
