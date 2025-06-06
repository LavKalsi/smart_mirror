// renderer.js
// Updates clock every second, fetches weather from WeatherStack, and fetches top 50 news headlines
// via Mediastack (using AllOrigins to bypass CORS). Displays one headline at a time, rotating every 10 seconds.

const axios = require('axios');

window.addEventListener('DOMContentLoaded', () => {
  const clockEl   = document.getElementById('clock');
  const weatherEl = document.getElementById('weather');
  const newsEl    = document.getElementById('news');

  // ── 1. CLOCK: update every second ────────────────────────────────────────
  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── 2. WEATHER (WeatherStack) ────────────────────────────────────────────
  const weatherApiKey = '25ad15126b2b953e0556026bd1c0f33e'; // Your working WeatherStack key
  const city          = 'Delhi';                           // Change to your city
  const weatherURL    = `http://api.weatherstack.com/current?access_key=${weatherApiKey}`
                       + `&query=${encodeURIComponent(city)}&units=m`;

  axios.get(weatherURL)
    .then(response => {
      if (response.data.success === false) {
        // API-level error (e.g. invalid key)
        const info = response.data.error?.info || 'Unknown WeatherStack error';
        console.error('WeatherStack Error Info:', response.data.error);
        weatherEl.innerHTML = `
          <p style="color: coral;">
            Weather Error:<br>
            ${info}
          </p>`;
        return;
      }
      // Successful response
      const loc = response.data.location;
      const cur = response.data.current;
      weatherEl.innerHTML = `
        <h2>${loc.name}, ${loc.country}</h2>
        <p>${cur.weather_descriptions[0]}</p>
        <p>🌡 ${cur.temperature.toFixed(1)}°C</p>
        <p>💧 Humidity: ${cur.humidity}%</p>
        <p>🌬 Wind: ${cur.wind_speed} km/h</p>
      `;
      console.log('WeatherStack Success:', response.data);
    })
    .catch(err => {
      console.error('Axios/WeatherStack Error:', err);
      const msg = err.response?.data
                ? JSON.stringify(err.response.data)
                : err.message || 'Unknown error';
      weatherEl.innerHTML = `
        <p style="color: coral;">
          Failed to load weather:<br>
          <code>${msg}</code>
        </p>`;
    });

  // ── 3. NEWS (Mediastack via AllOrigins “raw” proxy) ───────────────────────
  const mediastackKey = '77553941fb04ab6e8b9bfdc106f478a4'; // ← replace with your Mediastack API key
  // Request top 50 English headlines from India, sorted by published date descending
  const rawNewsURL = `http://api.mediastack.com/v1/news`
                   + `?access_key=${mediastackKey}`
                   + `&countries=in`
                   + `&languages=en`
                   + `&limit=50`
                   + `&sort=published_desc`;

  // Wrap via AllOrigins to avoid CORS rejections
  const newsURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(rawNewsURL)}`;

  axios.get(newsURL)
    .then(res => {
      let data;
      if (typeof res.data === 'string') {
        try {
          data = JSON.parse(res.data);
        } catch (parseErr) {
          throw new Error('Failed to parse Mediastack JSON: ' + parseErr.message);
        }
      } else {
        data = res.data;
      }

      if (!data.data || !data.data.length) {
        console.error('Mediastack returned no articles:', data);
        newsEl.innerHTML = `
          <p style="color: coral;">
            No news articles found.
          </p>`;
        return;
      }

      const articles = data.data; // Array of up to 50 articles
      let currentIndex = 0;

      // Display the first headline immediately
      newsEl.innerHTML = `
        <h2>Top Headlines</h2>
        <p>${articles[0].title}</p>
      `;

      console.log('Mediastack Success:', data);

      // Every 10 seconds, advance to the next headline (wrapping around)
      setInterval(() => {
        currentIndex = (currentIndex + 1) % articles.length;
        newsEl.innerHTML = `
          <h2>Top Headlines</h2>
          <p>${articles[currentIndex].title}</p>
        `;
      }, 10000); // 10000 ms = 10 seconds
    })
    .catch(err => {
      console.error('Axios/Mediastack Error (via AllOrigins):', err);
      const msg = err.response?.data
                ? JSON.stringify(err.response.data)
                : err.message || 'Unknown error';
      newsEl.innerHTML = `
        <p style="color: coral;">
          Failed to load news:<br>
          <code>${msg}</code>
        </p>`;
    });
});
