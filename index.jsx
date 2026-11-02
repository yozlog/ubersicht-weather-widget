import config from './config.json';
import { run } from 'uebersicht';

const minimumWidth = 288;
const width = Number.isFinite(config.width) ? Math.max(minimumWidth, config.width) : minimumWidth;
const offsetTop = Number.isFinite(config.top) ? config.top : 44;
const offsetLeft = Number.isFinite(config.left) ? config.left : 20;
const maxHeight = Number.isFinite(config.maxHeight) && config.maxHeight > 0 ? config.maxHeight : null;
const requestedMinHeight = Number.isFinite(config.minHeight) && config.minHeight > 0 ? config.minHeight : 0;
const minHeight = maxHeight === null ? requestedMinHeight : Math.min(requestedMinHeight, maxHeight);
const weatherDisplay = ['text', 'emoji', 'both'].includes(config.weatherDisplay) ? config.weatherDisplay : 'both';

function colorChannels(value, fallback) {
  if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return fallback;
  const hex = value.length === 4 ? value.slice(1).split('').map(char => char + char).join('') : value.slice(1);
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)).join(', ');
}

function themeColors(mode, defaults) {
  const settings = (config.colors && config.colors[mode]) || {};
  return {
    foreground: colorChannels(settings.foreground, defaults.foreground),
    background: colorChannels(settings.background, defaults.background),
    opacity: Number.isFinite(settings.backgroundOpacity) && settings.backgroundOpacity >= 0 && settings.backgroundOpacity <= 1 ? settings.backgroundOpacity : defaults.opacity,
  };
}

const light = themeColors('light', { foreground: '0, 0, 0', background: '255, 255, 255', opacity: .25 });
const dark = themeColors('dark', { foreground: '255, 255, 255', background: '0, 0, 0', opacity: .2 });

export const className = `
  top: ${offsetTop}px; left: ${offsetLeft}px; width: ${width}px;
  height: auto;
  max-height: ${maxHeight === null ? 'none' : `${maxHeight}px`};
  min-height: ${minHeight}px;
  overflow-y: ${maxHeight === null ? 'visible' : 'auto'};
  ${maxHeight === null ? '' : 'overflow-x: hidden; overscroll-behavior-y: contain;'}
  box-sizing: border-box; padding: 20px; border-radius: 16px;
  --fg: ${light.foreground}; --bg: ${light.background}; --bg-opacity: ${light.opacity};
  @media (prefers-color-scheme: dark) {
    --fg: ${dark.foreground}; --bg: ${dark.background}; --bg-opacity: ${dark.opacity};
  }
  background: rgba(var(--bg), var(--bg-opacity)); color: rgb(var(--fg));
  /* Changing an inherited variable forces WebKit to repaint scrollbar hover states. */
  --weather-scrollbar-thumb: transparent;
  scrollbar-width: auto;
  scrollbar-color: auto;
  &:hover { --weather-scrollbar-thumb: rgba(var(--fg), .4); }
  &::-webkit-scrollbar { width: 6px; background: transparent; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--weather-scrollbar-thumb); border-radius: 3px; }
  font: 12px/1.6 "Input Mono", "Fira Code", Menlo, monospace;
  * { box-sizing: border-box; }
  section:focus { outline: none; }
  header, .current, .forecast { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h1 { margin: 0; font-size: 14px; font-weight: 500; overflow-wrap: anywhere; }
  .eyebrow { color: rgb(var(--fg)); font-size: 10px; letter-spacing: 2px; }
  .muted, footer { color: rgba(var(--fg), .7); }
  .current { margin: 18px 0 12px; }
  .temperature { font-size: 52px; line-height: 1.15; letter-spacing: -3px; }
  .temperature small { font-size: 18px; letter-spacing: 0; color: rgba(var(--fg), .7); }
  .current-condition { max-width: 48%; text-align: right; }
  .current-condition .weather-emoji { display: block; font-size: 36px; line-height: 1.3; }
  .weather-emoji { font-family: "Apple Color Emoji", sans-serif; }
  .details { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; margin-bottom: 16px; }
  .forecast { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 8px; padding: 8px 0; border-top: 1px solid rgba(var(--fg), .18); }
  .forecast .condition { color: rgba(var(--fg), .7); overflow-wrap: anywhere; }
  button.forecast { width: 100%; color: inherit; font: inherit; text-align: left; background: transparent; border-radius: 0; border-right: 0; border-left: 0; border-bottom: 0; }
  button.forecast:hover { background: rgba(var(--fg), .05); }
  .hourly-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 16px 0 12px; }
  .hourly-heading h2 { font-size: 12px; font-weight: 500; margin: 0; }
  .hourly-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .hourly-table th, .hourly-table td { text-align: left; padding: 8px 3px; border-bottom: 1px solid rgba(var(--fg), .18); font-weight: normal; overflow-wrap: anywhere; }
  .hourly-table thead { color: rgba(var(--fg), .7); font-size: 10px; }
  .hourly-table th:first-child { width: 48px; }
  .hourly-table th:nth-child(3), .hourly-table th:nth-child(4) { width: 44px; }
  .low { color: rgba(var(--fg), .6); }
  footer { margin-top: 12px; font-size: 9px; }
  a { color: inherit; text-decoration: none; }
  button, input, select { font: inherit; color: inherit; border: 1px solid rgba(var(--fg), .3); border-radius: 6px; background: rgba(var(--fg), .05); padding: 6px 8px; }
  .forecast-settings { display: flex; align-items: center; justify-content: space-between; margin: 12px 0 8px; }
  .forecast-select { position: relative; display: inline-block; }
  .forecast-select::after { content: ""; position: absolute; right: 10px; top: calc(50% - 4px); width: 5px; height: 5px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor; transform: rotate(45deg); pointer-events: none; }
  select { -webkit-appearance: none; appearance: none; color-scheme: light dark; background-image: none; box-shadow: none; padding-right: 28px; cursor: pointer; }
  button { cursor: pointer; text-shadow: none; }
  button:hover { border-color: rgb(var(--fg)); color: rgb(var(--fg)); }
  button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible { outline: 2px solid rgb(var(--fg)); outline-offset: 3px; }
  button:disabled { opacity: .5; cursor: wait; }
  header button { flex-shrink: 0; font-size: 10px; }
  .city-controls { display: flex; gap: 6px; flex-shrink: 0; }
  .saved-city { display: flex; gap: 6px; }
  .saved-city > button:first-child { flex: 1; min-width: 0; }
  .drag-handle { touch-action: none; user-select: none; cursor: grab; align-self: stretch; padding: 6px; font-size: 18px; }
  .saved-city.dragging { opacity: .55; }
  .saved-city.dragging .drag-handle { cursor: grabbing; }
  form { display: flex; gap: 6px; margin-top: 12px; }
  input { width: 100%; min-width: 0; }
  .results { display: grid; gap: 6px; margin-top: 10px; }
  .results button { text-align: left; overflow-wrap: anywhere; }
  .message { margin-top: 12px; color: rgb(var(--fg)); }
`;

const storageKey = 'weather.location.v1';
const citiesStorageKey = 'weather.cities.v1';
const legacyStorageKey = 'tokyo-weather.location.v1';
const daysStorageKey = 'weather.forecast-days.v1';
const maxForecastDays = 16;
const validDays = days => Number.isInteger(days) && days >= 1 && days <= maxForecastDays;

let saveQueue = Promise.resolve();
function persistConfig(patch, dispatch) {
  // Only hexadecimal bytes enter the shell command; city names remain JSON data.
  const encoded = Array.from(new TextEncoder().encode(JSON.stringify(patch)), byte => byte.toString(16).padStart(2, '0')).join('');
  saveQueue = saveQueue.catch(() => {}).then(() => run(`/usr/local/bin/node ubersicht-weather-widget/save-config.cjs '${encoded}'`));
  return saveQueue.then(() => dispatch({ type: 'configSaved' }), () => dispatch({ type: 'configFailed' }));
}

function savedDays() {
  if (validDays(config.forecastDays)) return config.forecastDays;
  try {
    const days = JSON.parse(localStorage.getItem(daysStorageKey));
    return validDays(days) ? days : 7;
  } catch (_) { return 7; }
}

function selectDays(days, dispatch) {
  if (!validDays(days)) return;
  let daysPersistenceError = false;
  try { localStorage.setItem(daysStorageKey, JSON.stringify(days)); }
  catch (_) { daysPersistenceError = true; }
  dispatch({ type: 'days', days, daysPersistenceError });
  persistConfig({ forecastDays: days }, dispatch);
}
const validLocation = value => value && typeof value.name === 'string' &&
  Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
  Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;

function savedLocation() {
  if (validLocation(config.location)) return config.location;
  if (Array.isArray(config.cities)) return null;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (validLocation(value)) return value;
    const legacy = JSON.parse(localStorage.getItem(legacyStorageKey));
    if (!validLocation(legacy)) return null;
    // Remove the old key only after the renamed setting is safely stored.
    try {
      localStorage.setItem(storageKey, JSON.stringify(legacy));
      localStorage.removeItem(legacyStorageKey);
    } catch (_) { /* Keep the original setting if storage is unavailable. */ }
    return legacy;
  } catch (_) { return null; }
}

const sameCity = (a, b) => a && b && a.latitude === b.latitude && a.longitude === b.longitude;

function savedCities(location) {
  let cities = [];
  try {
    const value = Array.isArray(config.cities) ? config.cities : JSON.parse(localStorage.getItem(citiesStorageKey));
    if (Array.isArray(value)) cities = value.filter(validLocation)
      .filter((city, i, all) => all.findIndex(other => sameCity(city, other)) === i);
  } catch (_) { /* Existing single-location settings still work. */ }
  if (location && !cities.some(city => sameCity(city, location))) cities.unshift(location);
  return cities;
}

const location = savedLocation();
const cities = savedCities(location);
const configSignature = JSON.stringify([config.cities, config.location, config.forecastDays]);
export const initialState = { location: location || cities[0] || null, cities, days: savedDays(), configSignature, data: null, selectedDate: null, editing: false, results: [], searching: false };
export const refreshFrequency = 15 * 60 * 1000;
let activeLocation = initialState.location;

function upgradeState(state) {
  if (state && state.configSignature !== configSignature && Array.isArray(config.cities)) {
    return { ...state, ...initialState, editing: state.editing, data: sameCity(state.location, initialState.location) ? state.data : null };
  }
  // Übersicht preserves render state across live code updates.
  if (state && Array.isArray(state.cities)) return state;
  return { ...initialState, ...state, cities: savedCities(state && state.location) };
}

async function getJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error('API error');
    return data;
  } finally { clearTimeout(timer); }
}

let weatherRequest = 0;
async function loadWeather(location, dispatch) {
  const request = ++weatherRequest;
  dispatch({ type: 'loading' });
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=${maxForecastDays}&timezone=auto&wind_speed_unit=ms`;
    const data = await getJSON(url);
    if (!Number.isFinite(data.current && data.current.temperature_2m) ||
      !data.daily || !Array.isArray(data.daily.time) || data.daily.time.length < maxForecastDays ||
      !['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max']
        .every(key => Array.isArray(data.daily[key]) && data.daily[key].length >= maxForecastDays) ||
      !data.hourly || !Array.isArray(data.hourly.time) || !data.hourly.time.length ||
      !['temperature_2m', 'weather_code', 'precipitation_probability'].every(key => Array.isArray(data.hourly[key]) && data.hourly[key].length === data.hourly.time.length)) throw new Error('Invalid forecast');
    if (request === weatherRequest) dispatch({ type: 'weather', data });
  } catch (_) {
    if (request === weatherRequest) dispatch({ type: 'failed' });
  }
}

export const command = dispatch => {
  if (!Array.isArray(config.cities) || !validDays(config.forecastDays)) {
    persistConfig({ cities: initialState.cities, location: activeLocation, forecastDays: initialState.days }, dispatch);
  }
  const location = activeLocation;
  if (location) return loadWeather(location, dispatch);
};

let searchRequest = 0;
async function search(event, dispatch) {
  event.preventDefault();
  const query = event.target.elements.region.value.trim();
  if (query.length < 2) return;
  const request = ++searchRequest;
  dispatch({ type: 'searching' });
  try {
    const data = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const results = (data.results || []).filter(validLocation);
    if (request === searchRequest) dispatch({ type: 'results', results });
  } catch (_) {
    if (request === searchRequest) dispatch({ type: 'searchFailed' });
  }
}

function saveSelection(location, cities, dispatch) {
  activeLocation = location;
  ++weatherRequest;
  let persistenceError = false;
  try {
    localStorage.setItem(citiesStorageKey, JSON.stringify(cities));
    localStorage.setItem(storageKey, JSON.stringify(location));
    localStorage.removeItem(legacyStorageKey);
  }
  catch (_) { persistenceError = true; }
  ++searchRequest;
  dispatch({ type: 'location', location, cities, persistenceError });
  persistConfig({ location, cities }, dispatch);
  if (location) return loadWeather(location, dispatch);
}

function selectLocation(location, dispatch, cities) {
  const saved = cities.some(city => sameCity(city, location)) ? cities : [...cities, location];
  return saveSelection(location, saved, dispatch);
}

function nextCity(state, dispatch) {
  const index = state.cities.findIndex(city => sameCity(city, state.location));
  return saveSelection(state.cities[(index + 1) % state.cities.length], state.cities, dispatch);
}

function removeCity(city, state, dispatch) {
  const cities = state.cities.filter(other => !sameCity(city, other));
  const location = sameCity(city, state.location) ? cities[0] || null : state.location;
  return saveSelection(location, cities, dispatch);
}

function moveCity(index, offset, state, dispatch) {
  const destination = index + offset;
  if (destination < 0 || destination >= state.cities.length) return;
  const cities = [...state.cities];
  [cities[index], cities[destination]] = [cities[destination], cities[index]];
  saveCityOrder(cities, dispatch);
}

function saveCityOrder(cities, dispatch) {
  let persistenceError = false;
  try { localStorage.setItem(citiesStorageKey, JSON.stringify(cities)); }
  catch (_) { persistenceError = true; }
  dispatch({ type: 'cities', cities, persistenceError });
  persistConfig({ cities }, dispatch);
}

let drag = null;
function startDrag(event, city, state, dispatch) {
  if (event.button !== 0 || drag) return;
  const handle = event.currentTarget;
  const pointerId = event.pointerId;
  handle.setPointerCapture(pointerId);
  drag = { city, cities: state.cities, original: state.cities, handle, pointerId, startY: event.clientY, active: false };
  drag.timer = setTimeout(() => {
    if (!drag) return;
    drag.active = true;
    dispatch({ type: 'drag', city });
  }, 300);
}

function moveDrag(event, dispatch) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!drag.active) {
    if (Math.abs(event.clientY - drag.startY) > 8) finishDrag(event, dispatch, true);
    return;
  }
  const rows = Array.from(drag.handle.closest('.results').querySelectorAll('.saved-city'));
  let destination = rows.findIndex(row => event.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2);
  if (destination < 0) destination = rows.length;
  const index = drag.cities.findIndex(city => sameCity(city, drag.city));
  if (destination > index) destination -= 1;
  const container = drag.handle.closest('section').parentElement;
  const bounds = container.getBoundingClientRect();
  if (event.clientY < bounds.top + 48) container.scrollTop -= 24;
  if (event.clientY > bounds.bottom - 48) container.scrollTop += 24;
  if (destination === index) return;
  const cities = [...drag.cities];
  const [city] = cities.splice(index, 1);
  cities.splice(destination, 0, city);
  drag.cities = cities;
  dispatch({ type: 'cities', cities });
}

function finishDrag(event, dispatch, cancel = false) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const ended = drag;
  drag = null;
  clearTimeout(ended.timer);
  if (ended.handle.hasPointerCapture(ended.pointerId)) ended.handle.releasePointerCapture(ended.pointerId);
  dispatch({ type: 'drag', city: null });
  if (cancel) dispatch({ type: 'cities', cities: ended.original });
  else if (ended.active && ended.cities !== ended.original) saveCityOrder(ended.cities, dispatch);
}

export const updateState = (event, state) => {
  state = upgradeState(state);
  switch (event.type) {
    case 'day': return event.date === null || (state.data && state.data.daily.time.includes(event.date)) ? { ...state, selectedDate: event.date } : state;
    case 'drag': return { ...state, draggingCity: event.city };
    case 'configSaved': return { ...state, configError: false };
    case 'configFailed': return { ...state, configError: true };
    case 'cities': return { ...state, cities: event.cities, persistenceError: event.persistenceError };
    case 'days': return validDays(event.days) ? { ...state, days: event.days, daysPersistenceError: event.daysPersistenceError } : state;
    case 'loading': return { ...state, loading: true, error: false };
    case 'weather': return { ...state, loading: false, error: false, data: event.data, selectedDate: event.data.daily.time.includes(state.selectedDate) ? state.selectedDate : null };
    case 'failed': return { ...state, loading: false, error: true };
    case 'edit': return { ...state, editing: !state.editing, selectedDate: null };
    case 'searching': return { ...state, searching: true, results: [], searchMessage: '' };
    case 'results': return { ...state, searching: false, results: event.results, searchMessage: event.results.length ? '' : 'No places found. Try a nearby city or its English name.' };
    case 'searchFailed': return { ...state, searching: false, searchMessage: 'Search failed. Check your connection and try again.' };
    case 'location': return { ...state, location: event.location, cities: event.cities || state.cities, persistenceError: event.persistenceError, data: null, selectedDate: null, loading: false, error: false, editing: false, results: [], searching: false, searchMessage: '' };
    default: return state;
  }
};

export function condition(code, isDay = 1) {
  if (code === 0) return [isDay ? '☀️' : '🌙', 'Clear'];
  if (code === 1) return [isDay ? '🌤️' : '☁️', 'Mainly clear'];
  if (code === 2) return [isDay ? '⛅' : '☁️', 'Partly cloudy'];
  if (code === 3) return ['☁️', 'Overcast'];
  if (code === 45 || code === 48) return ['🌫️', 'Fog'];
  if ([51, 53, 55, 56, 57].includes(code)) return ['🌦️', 'Drizzle'];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['🌧️', 'Rain'];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['🌨️', 'Snow'];
  if ([95, 96, 99].includes(code)) return ['⛈️', 'Thunderstorm'];
  return ['❔', 'Unknown'];
}

function WeatherCondition({ code, isDay = 1 }) {
  const [emoji, text] = condition(code, isDay);
  return <span title={text} role={weatherDisplay === 'emoji' ? 'img' : undefined} aria-label={weatherDisplay === 'emoji' ? text : undefined}>
    {weatherDisplay !== 'text' && <span className="weather-emoji" aria-hidden="true">{emoji}</span>}
    {weatherDisplay === 'both' && ' '}
    {weatherDisplay !== 'emoji' && text}
  </span>;
}

const number = (value, suffix = '°') => Number.isFinite(value) ? `${Math.round(value)}${suffix}` : '—';
const dayLabel = date => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${date}T12:00:00Z`).getUTCDay()];

export const render = (state, dispatch) => {
  state = upgradeState(state);
  const { location, data, editing, searching, results, searchMessage, loading, error } = state;
  const showWeather = !!location && !editing;
  const current = data && data.current;
  const daily = data && data.daily;
  const hourly = data && data.hourly;
  // API timestamps are already in the selected city's local time, including DST.
  const hours = hourly && Array.isArray(hourly.time) ? hourly.time.map((time, i) => ({ time, i })).filter(hour => hour.time.slice(0, 10) === state.selectedDate) : [];
  return (
    <section aria-label="Weather" tabIndex={maxHeight === null ? undefined : 0}
      onMouseLeave={event => { if (event.currentTarget.matches(':focus')) event.currentTarget.blur(); }}
      onKeyDown={event => { if (event.key === 'Escape' && event.target === event.currentTarget) event.currentTarget.blur(); }}>
      <header>
        <div><div className="eyebrow">WEATHER</div><h1>{location ? location.name : 'Set your location'}</h1></div>
        {location && <div className="city-controls">
          <button onClick={() => dispatch({ type: 'edit' })}>{editing ? 'Close' : 'Location'}</button>
          <button aria-label="Next saved city" title="Next saved city" disabled={state.cities.length < 2} onClick={() => nextCity(state, dispatch)}>→</button>
        </div>}
      </header>
      {(!location || editing) && <div>
        {state.cities.length > 0 && <div className="results" aria-label="Saved cities">
          <span className="muted">Saved cities</span>
          {state.cities.map((city, index) => <div className={`saved-city${sameCity(city, state.draggingCity) ? ' dragging' : ''}`} key={`${city.latitude},${city.longitude}`}>
            <button aria-pressed={!!sameCity(city, location)} onClick={() => selectLocation(city, dispatch, state.cities)}>{city.name}<br /><span className="muted">{[city.admin1, city.country].filter(Boolean).join(' · ')}</span></button>
            <button className="drag-handle" aria-label={`Reorder ${city.name}`} title="Hold to drag; use Up/Down arrow keys to reorder" aria-pressed={!!sameCity(city, state.draggingCity)}
              onPointerDown={event => startDrag(event, city, state, dispatch)} onPointerMove={event => moveDrag(event, dispatch)}
              onPointerUp={event => finishDrag(event, dispatch)} onPointerCancel={event => finishDrag(event, dispatch, true)} onLostPointerCapture={event => finishDrag(event, dispatch, true)}
              onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); moveCity(index, event.key === 'ArrowUp' ? -1 : 1, state, dispatch); } }}>☰</button>
            <button aria-label={`Remove ${city.name}`} title={`Remove ${city.name}`} onClick={() => removeCity(city, state, dispatch)}>×</button>
          </div>)}
        </div>}
        <form onSubmit={event => search(event, dispatch)}>
          <input name="region" aria-label="City or region" placeholder="City or region, e.g. Seoul" minLength={2} maxLength={100} required />
          <button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
        </form>
        <div className="results">{results.map(result => <button key={`${result.latitude},${result.longitude}`} onClick={() => selectLocation(result, dispatch, state.cities)}>
          {result.name}<br /><span className="muted">{[result.admin1, result.country].filter(Boolean).join(' · ')}</span><br /><span className="muted">Save &amp; view</span>
        </button>)}</div>
        {searchMessage && <div className="message" role="status">{searchMessage}</div>}
      </div>}
      {showWeather && current && !state.selectedDate && <div>
        <div className="current"><div className="temperature">{number(current.temperature_2m, '')}<small> °C</small></div><div className="current-condition"><WeatherCondition code={current.weather_code} isDay={current.is_day} /></div></div>
        <div className="details">
          <span className="muted">Feels like</span><span>{number(current.apparent_temperature)}</span>
          <span className="muted">Humidity {number(current.relative_humidity_2m, '%')}</span><span className="muted">Wind {number(current.wind_speed_10m, ' m/s')}</span>
          <span className="muted">Rain chance today</span><span style={{ color: 'rgb(var(--fg))' }}>{number(daily.precipitation_probability_max[0], '%')}</span>
        </div>
        <label className="forecast-settings">Forecast
          <span className="forecast-select">
            <select aria-label="Forecast days" value={state.days} onChange={event => selectDays(Number(event.target.value), dispatch)}>
              {Array.from({ length: maxForecastDays }, (_, i) => i + 1).map(days => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}
            </select>
          </span>
        </label>
        {daily.time.slice(0, state.days).map((date, i) => <button className="forecast" key={date} aria-label={`Hourly forecast for ${date}`} onClick={event => {
          if (event) event.currentTarget.closest('section').parentElement.scrollTop = 0;
          dispatch({ type: 'day', date });
          if (!hourly) loadWeather(location, dispatch);
        }}>
          <span>{i === 0 ? 'Today' : dayLabel(date)}</span><span className="condition"><WeatherCondition code={daily.weather_code[i]} /></span>
          <span><span className="low">{number(daily.temperature_2m_min[i])}</span> / {number(daily.temperature_2m_max[i])}</span>
        </button>)}
      </div>}
      {showWeather && state.selectedDate && <div>
        <div className="hourly-heading"><button autoFocus onClick={event => {
          if (event) event.currentTarget.closest('section').parentElement.scrollTop = 0;
          dispatch({ type: 'day', date: null });
        }}>← Back</button><h2>{dayLabel(state.selectedDate)} {state.selectedDate}</h2></div>
        <div className="muted">Hourly forecast · local time</div>
        {hours.length > 0 ? <table className="hourly-table" aria-label={`Hourly forecast for ${state.selectedDate}`}>
          <thead><tr><th scope="col">Time</th><th scope="col">Weather</th><th scope="col">°C</th><th scope="col">Rain</th></tr></thead>
          <tbody>{hours.map(({ time, i }) => <tr key={`${time}-${i}`}><th scope="row">{time.slice(11, 16)}</th><td><WeatherCondition code={hourly.weather_code[i]} isDay={hourly.is_day ? hourly.is_day[i] : 1} /></td><td>{number(hourly.temperature_2m[i], '°')}</td><td>{number(hourly.precipitation_probability[i], '%')}</td></tr>)}</tbody>
        </table> : <div className="message" role="status">{loading ? 'Loading hourly forecast…' : 'No hourly forecast available for this date.'}</div>}
      </div>}
      {showWeather && loading && !current && <div className="message" role="status">Loading weather…</div>}
      {showWeather && error && <div className="message" role="status">{current ? 'Update failed. Showing previous data.' : 'Weather unavailable. Check your connection.'} <button onClick={() => loadWeather(location, dispatch)}>Retry</button></div>}
      {state.persistenceError && <div className="message">Could not save cities. Changes may be lost after reloading.</div>}
      {state.configError && <div className="message" role="status">Could not save config.json. Check the file and its permissions.</div>}
      {showWeather && state.daysPersistenceError && <div className="message">Could not save forecast days. Set them again after reloading.</div>}
      <footer>{showWeather && current && <div>Updated {current.time.replace('T', ' ')} · local time</div>}{showWeather && <span><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · </span>}<a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a></footer>
    </section>
  );
};
