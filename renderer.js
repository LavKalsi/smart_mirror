const axios = require('axios');

window.addEventListener('DOMContentLoaded', () => {
  const clockEl = document.getElementById('clock');
  const weatherEl = document.getElementById('weather');
  const newsEl = document.getElementById('news');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  // 1. Clock
  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Weather - WeatherStack
  const weatherApiKey = '25ad15126b2b953e0556026bd1c0f33e';
  const city = 'Delhi';
  const weatherURL = `http://api.weatherstack.com/current?access_key=${weatherApiKey}&query=${encodeURIComponent(city)}&units=m`;

  axios.get(weatherURL)
    .then(response => {
      if (response.data.success === false) {
        weatherEl.innerHTML = `<p style="color: red;">Weather Error: ${response.data.error.info}</p>`;
        return;
      }

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
    .catch(error => {
      console.error('Weather Error:', error);
      weatherEl.innerHTML = `<p style="color: red;">Failed to load weather data.</p>`;
    });

  // 3. News - Mediastack via AllOrigins
  const mediastackKey = '77553941fb04ab6e8b9bfdc106f478a4';
  const rawNewsURL = `http://api.mediastack.com/v1/news?access_key=${mediastackKey}&countries=in&languages=en&limit=50&sort=published_desc`;
  const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(rawNewsURL)}`;

  axios.get(proxyURL)
    .then(res => {
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

      if (!data.data || data.data.length === 0) {
        newsEl.innerHTML = `<p style="color: red;">No news articles available.</p>`;
        return;
      }

      const articles = data.data;
      let index = 0;

      newsEl.innerHTML = `<h2>📰 News</h2><p>${articles[0].title}</p>`;

      setInterval(() => {
        index = (index + 1) % articles.length;
        newsEl.innerHTML = `<h2>📰 News</h2><p>${articles[index].title}</p>`;
      }, 10000);
    })
    .catch(err => {
      console.error('News Error:', err);
      newsEl.innerHTML = `<p style="color: red;">Failed to load news data.</p>`;
    });

  // 4. Chatbot with n8n Webhook
  const webhookURL = 'https://shardcarecubs.app.n8n.cloud/webhook/a8df4b22-922c-4f6d-9c34-2d25d8ff37a9';

  chatInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const message = chatInput.value.trim();
      if (!message) return;

      // Display user message
      chatMessages.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
      chatInput.value = '';

      try {
        const res = await axios.post(webhookURL, { message });
        console.log(message);
        let reply = res.data.reply || 'No response from bot.';
        console.log(reply);
        // Replace newline characters with <br> for display

        chatMessages.innerHTML += `<pre><strong>Bot:</strong> ${reply}</pre>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (error) {
        console.error('Chatbot error:', error);
        chatMessages.innerHTML += `<div style="color:red;"><strong>Error:</strong> Could not reach chatbot.</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  });
});
