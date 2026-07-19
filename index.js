// =============================================
// WeatherOS — Colourful Light Dashboard JS
// =============================================

const API_KEY = "f050842b3ef7a23d148f927fd677b6ed";
let currentCity = "Chennai";
let cityData = [];
let clockInterval = null;

// ---- Weather FA icons (colourful) ----
const ICONS = {
  Clear:              '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>',
  'few clouds':       '<i class="fa-solid fa-cloud-sun" style="color:#fb923c"></i>',
  'scattered clouds': '<i class="fa-solid fa-cloud" style="color:#94a3b8"></i>',
  'broken clouds':    '<i class="fa-solid fa-cloud" style="color:#64748b"></i>',
  'overcast clouds':  '<i class="fa-solid fa-cloud" style="color:#475569"></i>',
  Clouds:             '<i class="fa-solid fa-cloud" style="color:#94a3b8"></i>',
  Rain:               '<i class="fa-solid fa-cloud-rain" style="color:#3b82f6"></i>',
  'light rain':       '<i class="fa-solid fa-cloud-drizzle" style="color:#60a5fa"></i>',
  'moderate rain':    '<i class="fa-solid fa-cloud-rain" style="color:#3b82f6"></i>',
  'heavy rain':       '<i class="fa-solid fa-cloud-showers-heavy" style="color:#1d4ed8"></i>',
  Drizzle:            '<i class="fa-solid fa-cloud-drizzle" style="color:#60a5fa"></i>',
  Thunderstorm:       '<i class="fa-solid fa-cloud-bolt" style="color:#7c3aed"></i>',
  Snow:               '<i class="fa-regular fa-snowflake" style="color:#93c5fd"></i>',
  Mist:               '<i class="fa-solid fa-smog" style="color:#9ca3af"></i>',
  Fog:                '<i class="fa-solid fa-smog" style="color:#6b7280"></i>',
  Haze:               '<i class="fa-solid fa-smog" style="color:#d97706"></i>',
  Smoke:              '<i class="fa-solid fa-smog" style="color:#78716c"></i>',
  Dust:               '<i class="fa-solid fa-wind" style="color:#d97706"></i>',
  Tornado:            '<i class="fa-solid fa-tornado" style="color:#6b7280"></i>',
};

function getIcon(desc) {
  if (ICONS[desc]) return ICONS[desc];
  const k = Object.keys(ICONS).find(k => desc.toLowerCase().includes(k.toLowerCase()));
  return ICONS[k] || '<i class="fa-solid fa-cloud" style="color:#94a3b8"></i>';
}

// ---- Condition pills ----
const CONDITION_TAGS = {
  Clear:        ['☀️ Sunny','👓 Good Visibility','🌿 Pleasant'],
  Clouds:       ['☁️ Overcast','🌥 Cloudy','🌬 Breezy'],
  Rain:         ['🌧 Rainy','☔ Carry Umbrella','💧 Wet Roads'],
  Thunderstorm: ['⛈ Thunderstorm','⚡ Lightning Risk','🏠 Stay Indoors'],
  Snow:         ['❄️ Snowfall','🧥 Dress Warmly','🚗 Icy Roads'],
  Mist:         ['🌫 Low Visibility','🚦 Drive Carefully','🌁 Foggy'],
  Haze:         ['😷 Poor Air','🔆 Hazy Sky','🌡 Hot'],
  Drizzle:      ['🌦 Light Rain','💦 Drizzle','🌂 Light Jacket'],
};

function getConditionTags(main) {
  return CONDITION_TAGS[main] || [`🌍 ${main}`];
}

// ---- Wind direction ----
function degToDir(deg) {
  return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(deg/22.5) % 16];
}

// ---- Dew point ----
function dewPoint(temp, hum) {
  return Math.round(temp - (100 - hum) / 5);
}

// ---- Weather summaries ----
const SUMMARIES = {
  Clear:        'Crystal clear skies right now. Great conditions for outdoor activities — enjoy the sunshine!',
  Clouds:       'Overcast conditions with significant cloud coverage. Mild and comfortable, bring a light layer.',
  Rain:         'Active rainfall in the area. Carry an umbrella and allow extra time for travel.',
  Thunderstorm: 'Severe thunderstorm warning. Stay indoors, avoid open fields and tall trees.',
  Snow:         'Snowfall expected. Dress warmly in layers, watch for slippery surfaces and reduced visibility.',
  Mist:         'Low visibility due to mist or fog. Drive with headlights on and reduce speed.',
  Haze:         'Hazy conditions with reduced visibility. Air quality may be poor — limit outdoor exposure.',
  Drizzle:      'Light drizzle in the area. A light waterproof jacket should be sufficient.',
  Dust:         'Dusty conditions reducing visibility. Protect eyes and nose when outdoors.',
  Smoke:        'Smoke in the atmosphere. Sensitive groups should limit outdoor activity.',
};

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.getElementById('loadingScreen').classList.add('hidden'), 1600);
  fetch('https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json')
    .then(r => r.json()).then(d => { cityData = d; }).catch(() => {});
  getLocation();
});

// =============================================
// GEOLOCATION
// =============================================
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
      ()  => fetchWeather('Chennai')
    );
  } else { fetchWeather('Chennai'); }
}

window.detectLocation = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
      ()  => alert('Could not detect location.')
    );
  }
};

// =============================================
// FETCH
// =============================================
function fetchWeatherByCoords(lat, lon) {
  fetchWeatherApi(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  fetchAirQuality(lat, lon);
  fetchUV(lat, lon);
}

function fetchWeather(city) {
  fetchWeatherApi(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
}

function fetchWeatherApi(url) {
  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.cod === '200') {
        setWeatherData(data);
        spawnParticles(data.list[0].weather[0].main);
        startClock(data.city.timezone);
        fetchAirQuality(data.city.coord.lat, data.city.coord.lon);
        fetchUV(data.city.coord.lat, data.city.coord.lon);
        show('liveBadge');
      } else {
        setText('weatherSummary', '⚠️ ' + (data.message || 'City not found. Please try again.'));
      }
    })
    .catch(() => setText('weatherSummary', '⚠️ Network error. Please check connection.'));
}

// =============================================
// SET WEATHER DATA
// =============================================
function setWeatherData(data) {
  const city  = data.city;
  const today = data.list[0];
  const main  = today.main;
  const wind  = today.wind;
  const desc  = today.weather[0].description;
  const cond  = today.weather[0].main;

  // City / location
  setText('cityName', city.name);

  // Temperature
  setText('currentTemp',   Math.round(main.temp));
  setText('summaryTemp',   `${Math.round(main.temp)}°`);
  setText('feelsLike',     `${Math.round(main.feels_like)}°`);
  setText('tempMin',       `${Math.round(main.temp_min)}°`);
  setText('tempMax',       `${Math.round(main.temp_max)}°`);

  // Description
  setText('weatherDescription', desc);
  setText('weatherConditionPill', cond);
  document.getElementById('weatherIconWrap').innerHTML = getIcon(desc);

  // Humidity, wind, pressure
  setText('summaryHumidity', `${main.humidity}%`);
  setText('summaryWind',     `${wind.speed} m/s`);
  setText('summaryPressure', `${main.pressure} hPa`);
  setText('pressure',        `${main.pressure} hPa`);
  setText('windSpeedFull',   `${wind.speed} m/s`);
  setText('windGust',        `Gust: ${wind.gust ? wind.gust + ' m/s' : 'N/A'}`);
  setText('seaPressure',     `${main.sea_level ?? main.pressure} hPa`);
  setText('groundPressure',  `${main.grnd_level ?? main.pressure} hPa`);

  // Visibility
  const vis = today.visibility ? (today.visibility / 1000).toFixed(1) + ' km' : 'N/A';
  setText('visibility',    vis);
  setText('summaryVis',    vis);

  // Cloud cover
  setText('cloudiness', `${today.clouds?.all ?? '--'}%`);

  // Dew point
  setText('dewPoint', `${dewPoint(main.temp, main.humidity)}°`);

  // Rain / Snow
  setText('rain3h', today.rain?.['3h'] ? `${today.rain['3h']} mm` : '0 mm');
  setText('snow3h', today.snow?.['3h'] ? `${today.snow['3h']} mm` : '0 mm');

  // Wind compass
  if (wind.deg !== undefined) {
    const dir = degToDir(wind.deg);
    setText('windDirText', dir);
    const needle = document.getElementById('compassNeedle');
    if (needle) needle.style.transform = `rotate(${wind.deg}deg)`;
  }

  // Sunrise / Sunset
  const sr = new Date(city.sunrise * 1000);
  const ss = new Date(city.sunset  * 1000);
  setText('sunrise', sr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  setText('sunset',  ss.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  animateSunArc(sr, ss);

  // Summary
  setText('weatherSummary', SUMMARIES[cond] || `Current conditions: ${desc}. Stay updated with the latest forecast.`);

  // Condition tags
  const tagsEl = document.getElementById('conditionTags');
  tagsEl.innerHTML = '';
  getConditionTags(cond).forEach(t => {
    const span = document.createElement('span');
    const pillClasses = ['pill-blue','pill-teal','pill-amber','pill-pink','pill-violet'];
    span.className = 'pill ' + pillClasses[Math.floor(Math.random() * pillClasses.length)];
    span.textContent = t;
    tagsEl.appendChild(span);
  });

  // Condition pill colour
  const condEl = document.getElementById('weatherConditionPill');
  if (condEl) {
    condEl.className = 'pill ' + condToPill(cond);
    condEl.innerHTML = `<i class="fa-solid fa-${condToFAIcon(cond)}"></i> ${cond}`;
  }

  buildForecast(data.list);
  buildHourly(data.list);
  updateChart(data.list);
}

function condToPill(cond) {
  const m = { Clear:'pill-amber', Clouds:'pill-blue', Rain:'pill-blue', Thunderstorm:'pill-violet',
    Snow:'pill-blue', Mist:'pill-teal', Haze:'pill-orange', Drizzle:'pill-teal', Fog:'pill-teal' };
  return m[cond] || 'pill-blue';
}
function condToFAIcon(cond) {
  const m = { Clear:'sun', Clouds:'cloud', Rain:'cloud-rain', Thunderstorm:'cloud-bolt',
    Snow:'snowflake', Mist:'smog', Haze:'smog', Drizzle:'cloud-drizzle', Fog:'smog' };
  return m[cond] || 'cloud';
}

// =============================================
// HOURLY FORECAST
// =============================================
function buildHourly(list) {
  const container = document.getElementById('hourlyForecast');
  container.innerHTML = '';
  const bgOptions = ['bg-blue-50','bg-teal-50','bg-amber-50','bg-violet-50','bg-pink-50','bg-green-50','bg-orange-50','bg-red-50'];
  const borderColors = ['border-blue-200','border-teal-200','border-amber-200','border-violet-200','border-pink-200','border-green-200'];

  list.slice(0, 8).forEach((item, i) => {
    const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const temp = Math.round(item.main.temp);
    const icon = getIcon(item.weather[0].description);
    const bg   = bgOptions[i % bgOptions.length];
    const border = borderColors[i % borderColors.length];

    const card = document.createElement('div');
    card.className = `h-card ${bg} border ${border} snap-start`;
    card.innerHTML = `
      <p class="text-gray-400 text-xs font-bold mb-2">${i === 0 ? 'Now' : time}</p>
      <div class="text-3xl mb-2 flex justify-center">${icon}</div>
      <p class="text-gray-800 font-black text-base">${temp}°</p>
      <p class="text-gray-400 text-xs mt-0.5">${Math.round(item.main.humidity)}%<i class="fa-solid fa-droplet ml-0.5 text-blue-300 text-xs"></i></p>
    `;
    container.appendChild(card);
  });
}

// =============================================
// 7-DAY FORECAST
// =============================================
function buildForecast(list) {
  const container = document.getElementById('forecastCards');
  container.innerHTML = '';
  const colours = [
    'text-blue-500','text-teal-500','text-amber-500','text-violet-500',
    'text-pink-500','text-green-500','text-orange-500'
  ];
  const dailyMap = {};
  list.forEach(item => {
    const d = new Date(item.dt * 1000).toLocaleDateString();
    if (!dailyMap[d]) dailyMap[d] = item;
  });

  Object.values(dailyMap).slice(0, 7).forEach((item, i) => {
    const date = new Date(item.dt * 1000);
    const day  = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const temp = Math.round(item.main.temp);
    const icon = getIcon(item.weather[0].description);
    const clr  = colours[i % colours.length];

    const row = document.createElement('div');
    row.className = 'f-row';
    row.innerHTML = `
      <span class="text-gray-500 text-sm font-bold w-28 shrink-0">${day}</span>
      <span class="text-2xl shrink-0">${icon}</span>
      <span class="text-gray-400 text-xs flex-1 capitalize hidden sm:block">${item.weather[0].description}</span>
      <span class="${clr} font-black text-lg ml-auto">${temp}°</span>
      <div class="flex flex-col ml-3 shrink-0">
        <span class="text-gray-400 text-xs font-semibold leading-none">${Math.round(item.main.temp_max)}°</span>
        <span class="text-gray-300 text-xs font-semibold leading-none mt-0.5">${Math.round(item.main.temp_min)}°</span>
      </div>
    `;
    container.appendChild(row);
  });
}

// =============================================
// TEMPERATURE CHART
// =============================================
function updateChart(list) {
  const temps  = list.slice(0, 6).map(i => Math.round(i.main.temp));
  const labels = list.slice(0, 6).map(i => new Date(i.dt * 1000).toLocaleTimeString([], { hour: '2-digit' }));

  const xPos = [50, 150, 250, 350, 450, 550];
  const minT = Math.min(...temps) - 3;
  const maxT = Math.max(...temps) + 3;
  const range = maxT - minT || 1;
  const yPos = temps.map(t => 140 - ((t - minT) / range) * 110);

  let path = `M${xPos[0]},${yPos[0]}`;
  for (let i = 1; i < temps.length; i++) {
    const cx1 = xPos[i-1] + (xPos[i] - xPos[i-1]) / 3;
    const cx2 = xPos[i]   - (xPos[i] - xPos[i-1]) / 3;
    path += ` C${cx1},${yPos[i-1]} ${cx2},${yPos[i]} ${xPos[i]},${yPos[i]}`;
  }
  const area = path + ` L${xPos[5]},155 L${xPos[0]},155 Z`;

  document.getElementById('chartLine').setAttribute('d', path);
  document.getElementById('chartArea').setAttribute('d', area);

  for (let i = 0; i < 6; i++) {
    document.getElementById(`cp${i}`).setAttribute('cx', xPos[i]);
    document.getElementById(`cp${i}`).setAttribute('cy', yPos[i]);
    document.getElementById(`ct${i}`).setAttribute('y', yPos[i] - 12);
    document.getElementById(`ct${i}`).setAttribute('x', xPos[i]);
    document.getElementById(`ct${i}`).textContent = `${temps[i]}°`;
    document.getElementById(`cl${i}`).textContent = i === 0 ? 'Now' : labels[i];
  }
}

// =============================================
// SUN ARC
// =============================================
function animateSunArc(sunrise, sunset) {
  const now      = new Date();
  const total    = sunset - sunrise;
  const elapsed  = now - sunrise;
  const progress = Math.max(0, Math.min(1, elapsed / total));
  const arcLen   = 157;
  document.getElementById('sunArcFill').style.strokeDashoffset = arcLen * (1 - progress);

  const angle = Math.PI * (1 - progress);
  const cx = 55 + 50 * Math.cos(angle);
  const cy = 55 - 50 * Math.sin(angle);
  const dot = document.getElementById('sunDot');
  dot.setAttribute('cx', cx.toFixed(1));
  dot.setAttribute('cy', cy.toFixed(1));
}

// =============================================
// UV INDEX
// =============================================
function fetchUV(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(r => r.json())
    .then(d => {
      if (d.value === undefined) return;
      const v   = d.value;
      const lvl = ['Low','Low','Low','Moderate','Moderate','Moderate','High','High','Very High','Very High','Extreme'][Math.min(Math.round(v), 10)];
      const advice = {
        Low:       'No protection needed.',
        Moderate:  'Wear SPF 30+ sunscreen.',
        High:      'Wear SPF 50+, hat & glasses.',
        'Very High':'Limit outdoor time 10am-4pm.',
        Extreme:   'Avoid outdoor exposure!'
      };
      const ringColors = { Low:'#4ade80', Moderate:'#fbbf24', High:'#f97316', 'Very High':'#ef4444', Extreme:'#a855f7' };

      setText('uvIndex', Math.round(v));
      setText('uvLabel', lvl);
      setText('uvAdvice', advice[lvl] || '');
      const ring = document.getElementById('uvRing');
      ring.style.strokeDashoffset = 138 * (1 - Math.min(v / 11, 1));
      ring.style.stroke = ringColors[lvl] || '#f97316';
    })
    .catch(() => {});
}

// =============================================
// AIR QUALITY
// =============================================
function fetchAirQuality(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(r => r.json())
    .then(d => {
      if (!d.list?.[0]) return;
      const aqi  = d.list[0].main.aqi;
      const comp = d.list[0].components;
      const labels = ['','Good','Fair','Moderate','Poor','Very Poor'];
      const pillCls = ['','pill-green','pill-teal','pill-amber','pill-orange','pill-red'];

      setText('aqiValue', aqi);
      setText('aqiLabel', labels[aqi] || '--');

      const badge = document.getElementById('aqiBadge');
      badge.className = 'pill ' + (pillCls[aqi] || 'pill-green');
      badge.textContent = `AQI ${aqi} — ${labels[aqi] || ''}`;

      const pm25 = comp.pm2_5?.toFixed(1) || '--';
      const pm10 = comp.pm10?.toFixed(1)  || '--';
      const no2  = comp.no2?.toFixed(1)   || '--';
      const o3   = comp.o3?.toFixed(1)    || '--';

      setText('pm25', `${pm25} µg/m³`);
      setText('pm10', `${pm10} µg/m³`);
      setText('no2',  `${no2} µg/m³`);
      setText('o3',   `${o3} µg/m³`);

      setW('pm25Bar', Math.min((comp.pm2_5 / 75)  * 100, 100));
      setW('pm10Bar', Math.min((comp.pm10  / 150) * 100, 100));
      setW('no2Bar',  Math.min((comp.no2   / 200) * 100, 100));
      setW('o3Bar',   Math.min((comp.o3    / 180) * 100, 100));
    })
    .catch(() => {});
}

// =============================================
// PARTICLES (light theme — subtle & colourful)
// =============================================
function spawnParticles(main) {
  const container = document.getElementById('particles');
  container.innerHTML = '';
  const c = main.toLowerCase();

  if (c.includes('rain') || c.includes('drizzle')) {
    const n = c.includes('drizzle') ? 55 : 110;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'rain-drop';
      d.style.cssText = `left:${rnd(100)}%;height:${rnd(16)+7}px;opacity:${(rnd(40)+30)/100};animation-duration:${rnd(80)/100+0.4}s;animation-delay:${rnd(200)/100}s;top:-20px;`;
      container.appendChild(d);
    }
  }

  if (c.includes('thunder')) {
    // dark clouds + rain
    for (let i = 0; i < 7; i++) {
      const cl = document.createElement('div');
      cl.className = 'cloud-puff';
      cl.style.cssText = `width:${rnd(200)+100}px;height:${rnd(90)+50}px;top:${rnd(35)}%;left:-15%;background:rgba(100,116,139,.25);animation-duration:${rnd(40)+50}s;animation-delay:-${rnd(50)}s;`;
      container.appendChild(cl);
    }
    for (let i = 0; i < 90; i++) {
      const d = document.createElement('div');
      d.className = 'rain-drop';
      d.style.cssText = `left:${rnd(100)}%;height:${rnd(18)+7}px;opacity:.55;animation-duration:${rnd(70)/100+0.4}s;animation-delay:${rnd(150)/100}s;top:-20px;`;
      container.appendChild(d);
    }
  }

  if (c.includes('cloud')) {
    const n = c.includes('few') ? 4 : c.includes('scatter') ? 7 : 11;
    for (let i = 0; i < n; i++) {
      const cl = document.createElement('div');
      cl.className = 'cloud-puff';
      cl.style.cssText = `width:${rnd(200)+100}px;height:${rnd(80)+50}px;top:${rnd(40)}%;left:-15%;opacity:${(rnd(25)+20)/100};animation-duration:${rnd(60)+70}s;animation-delay:-${rnd(70)}s;`;
      container.appendChild(cl);
    }
  }

  if (c.includes('snow')) {
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('div');
      s.className = 'snow-flake';
      const sz = rnd(5)+3;
      s.style.cssText = `left:${rnd(100)}%;width:${sz}px;height:${sz}px;opacity:${(rnd(40)+40)/100};animation-duration:${rnd(3)+3}s;animation-delay:${rnd(300)/100}s;top:-10px;background:rgba(186,230,253,.9);`;
      container.appendChild(s);
    }
  }

  if (c.includes('clear')) {
    // Sunny glow rays
    for (let i = 0; i < 8; i++) {
      const ray = document.createElement('div');
      ray.className = 'sun-ray';
      const angle = i * 45;
      ray.style.cssText = `
        width:3px; height:${rnd(120)+80}px;
        top:5%; right:8%;
        transform-origin:bottom center;
        transform:rotate(${angle}deg) translateY(-60px);
        animation-duration:${rnd(2)+2}s;
        animation-delay:${i*0.3}s;
      `;
      container.appendChild(ray);
    }
    // Glow blob
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;top:2%;right:5%;width:250px;height:250px;background:radial-gradient(circle,rgba(251,191,36,.22),transparent 70%);border-radius:50%;animation:sunPulse 4s ease-in-out infinite;`;
    container.appendChild(glow);
  }

  if (c.includes('mist') || c.includes('fog') || c.includes('haze') || c.includes('smoke')) {
    for (let i = 0; i < 5; i++) {
      const m = document.createElement('div');
      m.style.cssText = `position:absolute;top:${i*20}%;left:0;width:100%;height:120px;background:rgba(255,255,255,.25);filter:blur(40px);animation:cloudMove ${(i+5)*80}s linear infinite;animation-delay:-${i*20}s;`;
      container.appendChild(m);
    }
  }
}

function rnd(max) { return Math.floor(Math.random() * max); }

// =============================================
// CLOCK
// =============================================
function startClock(tzOffset) {
  if (clockInterval) clearInterval(clockInterval);
  function tick() {
    const now   = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utcMs + tzOffset * 1000);
    const h     = local.getHours();
    const greet = h < 12 ? 'Good Morning ☀️' : h < 18 ? 'Good Afternoon 🌤' : 'Good Evening 🌙';
    setText('greeting',    greet);
    setText('currentTime', local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setText('currentDate', local.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }
  tick();
  clockInterval = setInterval(tick, 10000);
}

// =============================================
// SEARCH
// =============================================
window.searchCity = function () {
  const val = document.getElementById('citySearch').value.trim();
  if (!val) return;
  currentCity = val;
  fetchWeather(val);
  closeAuto();
};

window.suggestCities = function () {
  const input = document.getElementById('citySearch').value.toLowerCase();
  const list  = document.getElementById('autocompleteList');
  if (input.length < 2) { list.innerHTML = ''; list.style.display = 'none'; return; }

  const results = cityData.filter(c =>
    c.name.toLowerCase().startsWith(input) || c.name.toLowerCase().includes(input)
  ).slice(0, 7);

  list.innerHTML = '';
  if (!results.length) { list.style.display = 'none'; return; }

  results.forEach(city => {
    const li = document.createElement('li');
    li.innerHTML = `<i class="fa-solid fa-location-dot text-red-400 text-xs mr-1"></i>${city.name}, ${city.country}`;
    li.onclick = () => {
      document.getElementById('citySearch').value = city.name;
      closeAuto();
      fetchWeather(city.name);
      currentCity = city.name;
    };
    list.appendChild(li);
  });
  list.style.display = 'block';
};

function closeAuto() {
  const l = document.getElementById('autocompleteList');
  l.innerHTML = ''; l.style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#citySearch') && !e.target.closest('#autocompleteList')) closeAuto();
});

// =============================================
// HELPERS
// =============================================
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setW(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}
function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
