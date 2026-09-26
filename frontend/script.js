const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const promptButtons = document.querySelectorAll('.prompt-btn');
const clearChatButton = document.getElementById('clearChat');

const STORAGE_KEY = 'psicologia-chat-history';
const CLIENT_ID_KEY = 'psicologia-client-id';

const getClientId = () => {
  const saved = localStorage.getItem(CLIENT_ID_KEY);

  if (saved) {
    return saved;
  }

  const generated =
    globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
};

const CLIENT_ID = getClientId();

const getInitialMessages = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [
      {
        sender: 'bot',
        text: 'Olá! Sou a Iris, assistente do psicologIA. Como você está hoje?'
      }
    ];
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error('Erro ao restaurar o histórico:', error);
    return [
      {
        sender: 'bot',
        text: 'Olá! Sou a Iris, assistente do psicologIA. Como você está hoje?'
      }
    ];
  }
};

const persistMessages = (messages) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

let history = getInitialMessages();

const renderMessages = () => {
  chatMessages.innerHTML = '';

  history.forEach((message) => {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${message.sender}`;

    const bubble = document.createElement('p');
    bubble.textContent = message.text;
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
};

const addMessage = (text, sender = 'bot') => {
  history.push({ sender, text });
  persistMessages(history);
  renderMessages();
};

const showTyping = () => {
  const typing = document.createElement('div');
  typing.className = 'message bot typing';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';

  typing.appendChild(indicator);
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typing;
};

const removeTyping = (typingBubble) => {
  if (typingBubble && typingBubble.parentNode) {
    typingBubble.remove();
  }
};

const sendToBot = async (text) => {
  const trimmed = text.trim();

  if (!trimmed || userInput.disabled) {
    return;
  }

  addMessage(trimmed, 'user');
  userInput.value = '';
  userInput.disabled = true;

  const typingBubble = showTyping();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: trimmed,
        clientId: CLIENT_ID
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Não foi possível responder agora.');
    }

    removeTyping(typingBubble);
    addMessage(data.response, 'bot');
  } catch (error) {
    removeTyping(typingBubble);
    addMessage(
      'Desculpe, não consegui responder agora. Tente novamente em instantes.',
      'bot'
    );
    console.error(error);
  } finally {
    userInput.disabled = false;
    userInput.focus();
    renderMessages();
  }
};

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendToBot(userInput.value);
});

promptButtons.forEach((button) => {
  button.addEventListener('click', () => sendToBot(button.textContent.trim()));
});

clearChatButton.addEventListener('click', () => {
  history = [
    {
      sender: 'bot',
      text: 'Olá! Sou a Iris, assistente do psicologIA. Como você está hoje?'
    }
  ];
  persistMessages(history);
  renderMessages();
  userInput.focus();
});

renderMessages();
