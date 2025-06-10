const axios = require('axios');
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const clockEl = document.getElementById('clock');
  const weatherEl = document.getElementById('weather');
  const newsEl = document.getElementById('news');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatbotEl = document.getElementById('chatbot');

  function setVisibility(state) {
    const visible = state === 'show';
    [weatherEl, newsEl, chatbotEl].forEach(el => {
      el.style.opacity = visible ? '1' : '0';
      el.style.transition = 'opacity 1s ease';
    });
  }

  ipcRenderer.on('sensor-state', (event, message) => {
    setVisibility(message);
  });

  ipcRenderer.on('chat-message', (event, message) => {
    if (message.startsWith('user:')) {
      const text = message.substring(5).trim();
      chatMessages.innerHTML += `<div><strong>You:</strong> ${text}</div>`;
    } else if (message.startsWith('bot:')) {
      const textRaw = message.substring(4).trim();
      const textFormatted = textRaw.replace(/\n/g, '<br><br>');
      chatMessages.innerHTML += `<div><strong>Bot:</strong> ${textFormatted}</div>`;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  ipcRenderer.on('mic-user', (event, userText) => {
    chatMessages.innerHTML += `<div><strong>You:</strong> ${userText}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  ipcRenderer.on('mic-bot', (event, botText) => {
    const formatted = botText.replace(/\n/g, '<br><br>');
    chatMessages.innerHTML += `<div><strong>Bot:</strong> ${formatted}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  ipcRenderer.on('mic-state', (event, micState) => {
    chatInput.placeholder = micState === 'listening'
      ? '🎤 Listening...'
      : 'Say the wake word...';
  });

  setVisibility('show');

  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Load weather
  const weatherApiKey = '25ad15126b2b953e0556026bd1c0f33e';
  const city = 'Delhi';
  const weatherURL = `http://api.weatherstack.com/current?access_key=${weatherApiKey}&query=${encodeURIComponent(city)}&units=m`;

  axios.get(weatherURL)
    .then(response => {
      const current = response.data.current;
      const location = response.data.location;
      weatherEl.innerHTML = `
        <h2>${location.name}, ${location.country}</h2>
        <p>${current.weather_descriptions[0]}</p>
        <p>🌡️ ${current.temperature}°C</p>
        <p>💧 Humidity: ${current.humidity}%</p>
        <p>🌬️ Wind: ${current.wind_speed} km/h</p>
      `;
    })
    .catch(() => {
      weatherEl.innerHTML = `<p style="color: red;">Failed to load weather data.</p>`;
    });

  // Load news
  const mediastackKey = '77553941fb04ab6e8b9bfdc106f478a4';
  const rawNewsURL = `http://api.mediastack.com/v1/news?access_key=${mediastackKey}&countries=in&languages=en&limit=50&sort=published_desc`;
  const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(rawNewsURL)}`;

  axios.get(proxyURL)
    .then(res => {
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      const articles = data.data || [];
      let index = 0;
      newsEl.innerHTML = `<h2>📰 News</h2><p>${articles[0].title}</p>`;
      setInterval(() => {
        index = (index + 1) % articles.length;
        newsEl.innerHTML = `<h2>📰 News</h2><p>${articles[index].title}</p>`;
      }, 10000);
    })
    .catch(() => {
      newsEl.innerHTML = `<p style="color: red;">Failed to load news.</p>`;
    });

  const webhookURL = 'https://your-n8n-webhookhttps://shardcarecubs.app.n8n.cloud/webhook/a8df4b22-922c-4f6d-9c34-2d25d8ff37a9'; // Replace with your webhook

  chatInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const message = chatInput.value.trim();
      if (!message) return;
      chatMessages.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
      chatInput.value = '';

      try {
        const res = await axios.post(webhookURL, { message });
        let reply = res.data.reply || 'No response from bot.';
        const formattedReply = reply.replace(/\n/g, '<br><br>');
        chatMessages.innerHTML += `<div><strong>Bot:</strong> ${formattedReply}</div>`;
        ipcRenderer.send('say-text', reply); // optional: if you want to speak from renderer
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (error) {
        chatMessages.innerHTML += `<div style="color:red;"><strong>Error:</strong> Chatbot failed.</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  });
});
