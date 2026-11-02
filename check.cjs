const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const deps = '/Applications/Übersicht.app/Contents/Resources/node_modules/';
const babel = require(deps + '@babel/core');
const React = require(deps + 'react');
const { renderToStaticMarkup } = require(deps + 'react-dom/server');
const saveConfig = require('./save-config.cjs');
const temporaryDirectory = fs.mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'weather-config-check-'));
const testFile = require('node:path').join(temporaryDirectory, 'config.json');
try {
  fs.writeFileSync(testFile, JSON.stringify({ width: 344, maxHeight: 525, minHeight: null, custom: 'keep', colors: { dark: { foreground: '#fed' } } }));
  const city = { name: "A 'quoted' $(city) 城市", latitude: 25, longitude: 121 };
  saveConfig(testFile, { cities: [city], location: city, forecastDays: 3 });
  const saved = JSON.parse(fs.readFileSync(testFile, 'utf8'));
  assert.equal(saved.width, 344);
  assert.equal(saved.maxHeight, 525);
  assert.equal(saved.custom, 'keep');
  assert.equal(saved.colors.dark.foreground, '#fed');
  assert.equal(saved.location.name, city.name);
  const unchanged = fs.readFileSync(testFile, 'utf8');
  for (const patch of [{ forecastDays: 17 }, { cities: [{}] }, { location: { name: 'x', latitude: 91, longitude: 0 } }, { width: 100 }]) {
    assert.throws(() => saveConfig(testFile, patch));
    assert.equal(fs.readFileSync(testFile, 'utf8'), unchanged);
  }
  fs.writeFileSync(testFile, '{bad json');
  assert.throws(() => saveConfig(testFile, { forecastDays: 7 }));
  assert.equal(fs.readFileSync(testFile, 'utf8'), '{bad json');
} finally { fs.rmSync(temporaryDirectory, { recursive: true }); }
const source = fs.readFileSync(__dirname + '/index.jsx', 'utf8');
const { code } = babel.transformSync(source, {
  babelrc: false, configFile: false,
  presets: [require(deps + '@babel/preset-react'), [require(deps + '@babel/preset-env'), { targets: { node: 'current' } }]],
});
const context = { exports: {}, React, AbortController, TextEncoder, setTimeout, clearTimeout,
  require: name => name === 'uebersicht' ? { run: async () => 'saved' } : { width: 344, maxHeight: 525, minHeight: null, cities: null, location: null, forecastDays: null },
  localStorage: { getItem: () => 'invalid json', setItem() {} } };
vm.runInNewContext(code, context);
const widget = context.exports;
for (const [position, top, left] of [[{}, 44, 20], [{ top: null, left: null }, 44, 20], [{ top: 100, left: 60 }, 100, 60], [{ top: 0, left: 0 }, 0, 0], [{ top: '100px', left: false }, 44, 20]]) {
  const positionContext = { ...context, exports: {}, require: name => name === 'uebersicht' ? { run: async () => 'saved' } : position };
  vm.runInNewContext(code, positionContext);
  assert.ok(positionContext.exports.className.includes(`top: ${top}px; left: ${left}px;`));
}
for (const [colors, expected] of [
  [undefined, ['--fg: 0, 0, 0; --bg: 255, 255, 255; --bg-opacity: 0.25;', '--fg: 255, 255, 255; --bg: 0, 0, 0; --bg-opacity: 0.2;']],
  [{ light: { foreground: '#123ABC', background: '#fed', backgroundOpacity: 0 }, dark: { foreground: '#456', background: '#abcdef', backgroundOpacity: 1 } }, ['--fg: 18, 58, 188; --bg: 255, 238, 221; --bg-opacity: 0;', '--fg: 68, 85, 102; --bg: 171, 205, 239; --bg-opacity: 1;']],
  [{ light: { foreground: 'red; color: red', background: null, backgroundOpacity: -1 }, dark: { foreground: '#12345', background: 'url(x)', backgroundOpacity: 2 } }, ['--fg: 0, 0, 0; --bg: 255, 255, 255; --bg-opacity: 0.25;', '--fg: 255, 255, 255; --bg: 0, 0, 0; --bg-opacity: 0.2;']],
  [{ dark: { background: '#246' } }, ['--fg: 0, 0, 0; --bg: 255, 255, 255; --bg-opacity: 0.25;', '--fg: 255, 255, 255; --bg: 34, 68, 102; --bg-opacity: 0.2;']],
  [null, ['--fg: 0, 0, 0; --bg: 255, 255, 255; --bg-opacity: 0.25;']],
]) {
  const colorContext = { ...context, exports: {}, require: name => name === 'uebersicht' ? { run: async () => 'saved' } : { colors } };
  vm.runInNewContext(code, colorContext);
  for (const declaration of expected) assert.ok(colorContext.exports.className.includes(declaration));
}
for (const [configured, expected] of [[{}, 288], [{ width: null }, 288], [{ width: 360 }, 360], [{ width: 200 }, 288], [{ width: 288 }, 288], [{ width: 0 }, 288], [{ width: -1 }, 288], [{ width: '360px' }, 288]]) {
  const configuredContext = { ...context, exports: {}, require: name => name === 'uebersicht' ? { run: async () => 'saved' } : configured };
  vm.runInNewContext(code, configuredContext);
  assert.ok(configuredContext.exports.className.includes(`width: ${expected}px;`));
}
const location = { name: '測試地區', latitude: 37.5, longitude: 127 };
for (const [configured, maximum, minimum] of [
  [{}, null, 0], [{ maxHeight: null, minHeight: null }, null, 0],
  [{ maxHeight: 525 }, 525, 0], [{ minHeight: 200 }, null, 200],
  [{ maxHeight: 525, minHeight: 200 }, 525, 200],
  [{ maxHeight: 525, minHeight: 600 }, 525, 525],
  [{ maxHeight: 0, minHeight: -10 }, null, 0],
  [{ maxHeight: '525px', minHeight: '200px' }, null, 0],
]) {
  const configuredContext = { ...context, exports: {}, require: name => name === 'uebersicht' ? { run: async () => 'saved' } : configured };
  vm.runInNewContext(code, configuredContext);
  const configuredWidget = configuredContext.exports;
  assert.ok(configuredWidget.className.includes('height: auto;'));
  assert.ok(configuredWidget.className.includes(`max-height: ${maximum === null ? 'none' : `${maximum}px`};`));
  assert.ok(configuredWidget.className.includes(`min-height: ${minimum}px;`));
  assert.ok(configuredWidget.className.includes(`overflow-y: ${maximum === null ? 'visible' : 'auto'};`));
  const section = configuredWidget.render(configuredWidget.initialState, () => {});
  assert.equal(section.props.tabIndex, maximum === null ? undefined : 0);
  const manyCities = Array.from({ length: 40 }, (_, i) => ({ name: `City ${i + 1}`, latitude: i, longitude: i }));
  const locationSection = configuredWidget.render({ ...configuredWidget.initialState, editing: true, location: manyCities[0], cities: manyCities }, () => {});
  const locationHTML = renderToStaticMarkup(locationSection);
  assert.equal(locationSection.props.tabIndex, maximum === null ? undefined : 0);
  assert.equal((locationHTML.match(/class="saved-city"/g) || []).length, 40);
  assert.ok(!locationHTML.includes('class="forecast"'));
  // Both views use the same outer widget with the height/overflow rules above.
  assert.ok(!locationHTML.includes('max-height:'));
}
const legacyKey = 'tokyo-weather.location.v1';
const renamedKey = 'weather.location.v1';
for (const storageFails of [false, true]) {
  const values = new Map([[legacyKey, JSON.stringify(location)]]);
  const migrated = { ...context, exports: {}, localStorage: {
    getItem: key => values.get(key) || null,
    setItem(key, value) { if (storageFails) throw new Error('storage unavailable'); values.set(key, value); },
    removeItem: key => values.delete(key),
  } };
  vm.runInNewContext(code, migrated);
  assert.equal(migrated.exports.initialState.location.name, location.name);
  assert.equal(values.has(legacyKey), storageFails);
  assert.equal(values.has(renamedKey), !storageFails);
}
const data = {
  current: { temperature_2m: 0, apparent_temperature: -2, relative_humidity_2m: 0, weather_code: 0, is_day: 0, wind_speed_10m: 0, time: '2026-11-02T12:00' },
  daily: { time: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'], weather_code: [0, 61, 71, 2, 3, 45, 95], temperature_2m_min: [-2, null, 1, 2, 3, 4, 5], temperature_2m_max: [5, 6, 7, 8, 9, 10, 11], precipitation_probability_max: [0, 50, 70, 20, 30, 40, 80] },
};
for (let i = 7; i < 16; i++) {
  data.daily.time.push(`2026-11-${String(i + 2).padStart(2, '0')}`);
  for (const key of ['weather_code', 'temperature_2m_min', 'temperature_2m_max', 'precipitation_probability_max']) data.daily[key].push(0);
}
data.hourly = { time: [], temperature_2m: [], weather_code: [], precipitation_probability: [], is_day: [] };
data.daily.time.forEach((date, day) => {
  for (let hour = 0; hour < 24; hour++) {
    data.hourly.time.push(`${date}T${String(hour).padStart(2, '0')}:00`);
    data.hourly.is_day.push(hour >= 6 && hour < 18 ? 1 : 0);
    data.hourly.temperature_2m.push(day === 2 && hour === 1 ? null : day);
    data.hourly.weather_code.push(day === 1 ? 61 : 0);
    data.hourly.precipitation_probability.push(day === 1 ? 50 : 0);
  }
});
const render = state => renderToStaticMarkup(widget.render(state, () => {}));
// Übersicht retains the previous render state when a widget file is updated.
const previousVersionState = { location, days: 7, data, editing: false, results: [], searching: false };
assert.doesNotThrow(() => render(previousVersionState));
const upgradedState = widget.updateState({ type: 'loading' }, previousVersionState);
assert.equal(upgradedState.cities.length, 1);
assert.equal(upgradedState.cities[0].name, location.name);
assert.equal(widget.initialState.location, null);
assert.equal(widget.initialState.days, 7);
assert.match(render(widget.initialState), /Set your location/);
let state = widget.updateState({ type: 'location', location }, widget.initialState);
state = widget.updateState({ type: 'weather', data }, state);
const html = render(state);
for (const mode of ['text', 'emoji', 'both', 'invalid', undefined]) {
  const modeContext = { ...context, exports: {}, require: name => name === 'uebersicht' ? { run: async () => 'saved' } : { weatherDisplay: mode } };
  vm.runInNewContext(code, modeContext);
  const modeWidget = modeContext.exports;
  const effectiveMode = mode === 'text' || mode === 'emoji' ? mode : 'both';
  const dailyMarkup = renderToStaticMarkup(modeWidget.render(state, () => {}));
  const dailyVisible = dailyMarkup.replace(/<[^>]*>/g, '');
  assert.equal(dailyVisible.includes('Clear'), effectiveMode !== 'emoji');
  assert.equal(dailyVisible.includes('🌙'), effectiveMode !== 'text');
  assert.equal(dailyVisible.includes('⛈️'), effectiveMode !== 'text');
  const hourlyMarkup = renderToStaticMarkup(modeWidget.render({ ...state, selectedDate: '2026-11-03' }, () => {}));
  const hourlyVisible = hourlyMarkup.replace(/<[^>]*>/g, '');
  assert.equal(hourlyVisible.includes('🌧️'), effectiveMode !== 'text');
  assert.equal((hourlyVisible.match(/Rain/g) || []).length, effectiveMode === 'emoji' ? 1 : 25);
  if (effectiveMode === 'emoji') {
    assert.ok(!hourlyMarkup.includes('>Rain</span>'));
    assert.match(hourlyMarkup, /role="img" aria-label="Rain"/);
  }
}
for (const code of [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]) {
  assert.notEqual(widget.condition(code)[1], 'Unknown');
  assert.ok(/\p{Extended_Pictographic}/u.test(widget.condition(code)[0]));
}
const tomorrow = widget.updateState({ type: 'day', date: '2026-11-03' }, state);
const hourlyHTML = render(tomorrow);
assert.match(hourlyHTML, /Hourly forecast · local time/);
assert.match(hourlyHTML, /Tue 2026-11-03/);
assert.match(hourlyHTML, /00:00/);
assert.match(hourlyHTML, /23:00/);
assert.match(hourlyHTML, /50%/);
assert.equal((hourlyHTML.match(/scope="row"/g) || []).length, 24);
assert.ok(!hourlyHTML.includes('Forecast days'));
assert.ok(!hourlyHTML.includes('class="current"'));
assert.ok(!hourlyHTML.includes('class="forecast"'));
assert.equal(widget.updateState({ type: 'day', date: '1900-01-01' }, state), state);
assert.match(render(widget.updateState({ type: 'day', date: null }, tomorrow)), /class="forecast"/);
assert.equal(widget.updateState({ type: 'location', location }, tomorrow).selectedDate, null);
assert.equal(widget.updateState({ type: 'edit' }, tomorrow).selectedDate, null);
const missingHour = widget.updateState({ type: 'day', date: '2026-11-04' }, state);
assert.ok(!render(missingHour).includes('NaN'));
const oldDailyOnly = { ...tomorrow, data: { current: data.current, daily: data.daily } };
assert.match(render(oldDailyOnly), /No hourly forecast available/);
const locationView = render({ ...state, editing: true, loading: true, error: true, daysPersistenceError: true });
assert.match(locationView, /City or region/);
assert.ok(!locationView.includes('class="current"'));
assert.ok(!locationView.includes('class="forecast"'));
assert.ok(!locationView.includes('Forecast days'));
assert.ok(!locationView.includes('Loading weather'));
assert.ok(!locationView.includes('Update failed'));
assert.ok(!locationView.includes('Updated '));
assert.match(render(widget.updateState({ type: 'edit' }, { ...state, editing: true })), /class="forecast"/);
assert.match(html, /0%/);
assert.match(html, /Feels like/);
assert.match(html, /Rain chance today/);
assert.ok(!/[\u3400-\u9fff]/.test(html.replaceAll('測試地區', '')));
assert.ok(!/#(?:c0caf5|7dcfff|a9b1d6|e0af68|7aa2f7)/i.test(widget.className));
assert.match(html, /Tue/);
assert.equal((html.match(/class="forecast"/g) || []).length, 7);
for (const days of [1, 3, 7, 16]) {
  const changed = widget.updateState({ type: 'days', days }, state);
  assert.equal((render(changed).match(/class="forecast"/g) || []).length, days);
  assert.equal(changed.data, data);
}
for (const days of [0, 17, 2.5, '7']) assert.equal(widget.updateState({ type: 'days', days }, state), state);
assert.match(html, /Sun/);
assert.match(html, /🌙/);
assert.ok(!html.includes('NaN'));
assert.equal(widget.condition(99)[1], 'Thunderstorm');
assert.equal(widget.condition(999)[1], 'Unknown');
state = widget.updateState({ type: 'failed' }, state);
assert.equal(state.data, data);
assert.match(render(state), /Showing previous data/);
state = widget.updateState({ type: 'location', location: { ...location, name: '另一地區' } }, state);
assert.equal(state.data, null);
assert.match(render(widget.updateState({ type: 'results', results: [] }, state)), /另一地區/);
context.fetch = async () => { throw new Error('offline'); };
const events = [];
// Use a persisted location to exercise command timeout/error handling.
context.localStorage.getItem = () => JSON.stringify(location);
const second = { ...context, exports: {} };
vm.runInNewContext(code, second);
second.exports.command(event => events.push(event)).then(async () => {
  assert.ok(events.some(event => event.type === 'failed'));
  const stored = { ...context, exports: {}, localStorage: { getItem: key => key === 'weather.forecast-days.v1' ? '3' : JSON.stringify(location) } };
  let requestedURL;
  stored.fetch = async url => { requestedURL = url; return { ok: true, json: async () => data }; };
  vm.runInNewContext(code, stored);
  assert.equal(stored.exports.initialState.days, 3);
  const loaded = [];
  await stored.exports.command(event => loaded.push(event));
  assert.ok(requestedURL.includes('forecast_days=16'));
  assert.ok(requestedURL.includes('hourly=temperature_2m,weather_code,precipitation_probability'));
  assert.ok(loaded.some(event => event.type === 'weather'));
  const cityA = { ...location, name: 'Seoul' };
  const cityB = { name: 'Taipei', latitude: 25.03, longitude: 121.56 };
  const values = new Map([['weather.location.v1', JSON.stringify(cityA)]]);
  const cityContext = { ...context, exports: {}, localStorage: {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  }, fetch: async () => ({ ok: true, json: async () => data }) };
  vm.runInNewContext(code, cityContext);
  const citiesWidget = cityContext.exports;
  let cityState = citiesWidget.initialState;
  const dispatch = event => { cityState = citiesWidget.updateState(event, cityState); };
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props && node.props.children)) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return null;
  };
  const button = label => find(citiesWidget.render(cityState, dispatch), node => node.props['aria-label'] === label);
  assert.equal(cityState.cities.length, 1);
  assert.equal(button('Next saved city').props.disabled, true);
  cityState = { ...cityState, editing: true, results: [cityB] };
  const add = () => find(citiesWidget.render(cityState, dispatch), node => node.type === 'button' && node.props.children[0] === 'Taipei' && !node.props['aria-pressed']);
  await add().props.onClick();
  assert.equal(cityState.location.name, 'Taipei');
  assert.equal(cityState.cities.length, 2);
  assert.equal(JSON.parse(values.get('weather.cities.v1')).length, 2);
  const forecastDaysBeforeDetail = cityState.days;
  await button('Hourly forecast for 2026-11-03').props.onClick();
  assert.equal(cityState.selectedDate, '2026-11-03');
  const back = find(citiesWidget.render(cityState, dispatch), node => node.type === 'button' && node.props.children === '← Back');
  back.props.onClick();
  assert.equal(cityState.selectedDate, null);
  assert.equal(cityState.days, forecastDaysBeforeDetail);
  cityState = { ...cityState, editing: true };
  const weatherBeforeSort = cityState.data;
  const locationBeforeSort = cityState.location;
  const key = (city, key) => button(`Reorder ${city}`).props.onKeyDown({ key, preventDefault() {} });
  key('Seoul', 'ArrowUp');
  assert.equal(cityState.cities[0].name, 'Seoul');
  key('Taipei', 'ArrowUp');
  assert.equal(cityState.cities[0].name, 'Taipei');
  assert.equal(cityState.editing, true);
  assert.equal(cityState.data, weatherBeforeSort);
  assert.equal(cityState.location, locationBeforeSort);
  assert.equal(JSON.parse(values.get('weather.cities.v1'))[0].name, 'Taipei');
  const reordered = { ...cityContext, exports: {} };
  vm.runInNewContext(code, reordered);
  assert.equal(reordered.exports.initialState.cities[0].name, 'Taipei');
  key('Taipei', 'ArrowDown');
  assert.equal(cityState.cities[0].name, 'Seoul');
  const setItem = cityContext.localStorage.setItem;
  cityContext.localStorage.setItem = () => { throw new Error('storage full'); };
  key('Seoul', 'ArrowDown');
  assert.equal(cityState.persistenceError, true);
  assert.equal(cityState.cities[0].name, 'Taipei');
  cityContext.localStorage.setItem = setItem;
  key('Taipei', 'ArrowDown');
  assert.equal(cityState.persistenceError, false);
  cityState = { ...cityState, editing: true, results: [cityB] };
  await add().props.onClick();
  assert.equal(cityState.cities.length, 2);
  await button('Next saved city').props.onClick();
  assert.equal(cityState.location.name, 'Seoul');
  await button('Next saved city').props.onClick();
  assert.equal(cityState.location.name, 'Taipei');
  const reloaded = { ...cityContext, exports: {} };
  vm.runInNewContext(code, reloaded);
  assert.equal(reloaded.exports.initialState.cities.length, 2);
  assert.equal(reloaded.exports.initialState.location.name, 'Taipei');
  const cityC = { name: 'Tokyo', latitude: 35.68, longitude: 139.69 };
  let held;
  const writes = [];
  const fileConfig = { width: 344, maxHeight: 525, cities: [cityA, cityB, cityC], location: cityA, forecastDays: 2 };
  const dragContext = { ...cityContext, exports: {},
    setTimeout: (fn, delay) => { if (delay === 300) { held = fn; return 'hold'; } return setTimeout(fn, delay); },
    clearTimeout: id => { if (id === 'hold') held = null; else clearTimeout(id); },
    require: name => name === 'uebersicht' ? { run: async command => {
      assert.ok(command.startsWith('/usr/local/bin/node ubersicht-weather-widget/save-config.cjs '));
      const match = command.match(/'([0-9a-f]+)'$/);
      assert.ok(match);
      const patch = JSON.parse(Buffer.from(match[1], 'hex').toString('utf8'));
      writes.push(patch);
      Object.assign(fileConfig, patch);
    } } : fileConfig,
  };
  vm.runInNewContext(code, dragContext);
  const dragWidget = dragContext.exports;
  let dragState = { ...dragWidget.initialState, editing: true, data };
  const dragDispatch = event => { dragState = dragWidget.updateState(event, dragState); };
  const dragButton = () => find(dragWidget.render(dragState, dragDispatch), node => node.props['aria-label'] === 'Reorder Seoul');
  let captured = false;
  const container = { scrollTop: 0, getBoundingClientRect: () => ({ top: 0, bottom: 300 }) };
  const handle = {
    setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; },
    closest: selector => selector === '.results' ? { querySelectorAll: () => [0, 100, 200].map(top => ({ getBoundingClientRect: () => ({ top, height: 100 }) })) } : { parentElement: container },
  };
  const pointer = { button: 0, pointerId: 1, clientY: 50, currentTarget: handle };
  dragButton().props.onPointerDown(pointer);
  dragButton().props.onPointerUp(pointer);
  assert.equal(dragState.cities[0].name, 'Seoul');
  assert.equal(writes.length, 0);
  dragButton().props.onPointerDown(pointer);
  held();
  dragButton().props.onPointerMove({ ...pointer, clientY: 290 });
  assert.equal(dragState.cities[2].name, 'Seoul');
  assert.equal(writes.length, 0);
  dragButton().props.onPointerUp(pointer);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 1);
  assert.equal(fileConfig.cities[2].name, 'Seoul');
  assert.equal(dragState.location.name, 'Seoul');
  assert.equal(dragState.data, data);
  const currentLocation = dragState.location;
  const canceled = { ...pointer, clientY: 250 };
  dragButton().props.onPointerDown(canceled);
  held();
  dragButton().props.onPointerMove({ ...pointer, clientY: 1 });
  dragButton().props.onPointerCancel(pointer);
  assert.equal(dragState.cities[2].name, 'Seoul');
  assert.equal(writes.length, 1);
  const fileUpdated = { ...dragContext, exports: {} };
  const manualConfig = { ...fileConfig, forecastDays: 5, location: cityB };
  fileUpdated.require = name => name === 'uebersicht' ? { run: async () => {} } : manualConfig;
  vm.runInNewContext(code, fileUpdated);
  const updatedState = fileUpdated.exports.updateState({ type: 'loading' }, dragState);
  assert.equal(updatedState.days, 5);
  assert.equal(updatedState.location.name, 'Taipei');
  assert.equal(updatedState.data, null);
  assert.equal(dragState.location, currentLocation);
  const nextAfterDrag = find(dragWidget.render(dragState, dragDispatch), node => node.props['aria-label'] === 'Next saved city');
  await nextAfterDrag.props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(dragState.location.name, 'Taipei');
  assert.equal(fileConfig.location.name, 'Taipei');
  const daysSelect = find(dragWidget.render(dragState, dragDispatch), node => node.props['aria-label'] === 'Forecast days');
  daysSelect.props.onChange({ target: { value: '4' } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fileConfig.forecastDays, 4);
  dragContext.require = name => name === 'uebersicht' ? { run: async () => { throw new Error('write failed'); } } : fileConfig;
  const failingContext = { ...dragContext, exports: {} };
  vm.runInNewContext(code, failingContext);
  let failingState = { ...failingContext.exports.initialState, data };
  const failDispatch = event => { failingState = failingContext.exports.updateState(event, failingState); };
  const failingDays = find(failingContext.exports.render(failingState, failDispatch), node => node.props['aria-label'] === 'Forecast days');
  failingDays.props.onChange({ target: { value: '6' } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(failingState.configError, true);
  assert.equal(fileConfig.forecastDays, 4);
  // A slow response from the previous city must never replace the current city's weather.
  const pending = [];
  cityContext.fetch = () => new Promise(resolve => pending.push(resolve));
  const first = button('Next saved city').props.onClick();
  const second = button('Next saved city').props.onClick();
  pending[1]({ ok: true, json: async () => data });
  await second;
  pending[0]({ ok: true, json: async () => ({ ...data, current: { ...data.current, temperature_2m: 99 } }) });
  await first;
  assert.equal(cityState.location.name, 'Taipei');
  assert.equal(cityState.data.current.temperature_2m, 0);
  cityContext.fetch = async () => ({ ok: true, json: async () => data });
  cityState = { ...cityState, editing: true };
  await button('Remove Taipei').props.onClick();
  assert.equal(cityState.location.name, 'Seoul');
  cityState = { ...cityState, editing: true };
  await button('Remove Seoul').props.onClick();
  assert.equal(cityState.location, null);
  assert.equal(cityState.cities.length, 0);
  assert.equal(cityState.data, null);
  assert.match(render(cityState), /Set your location/);
  assert.match(citiesWidget.className, /left: 20px/);
  console.log('PASS: hourly date filtering/navigation/null values, config sync, long-press sorting, saved ordering and stale responses.');
}).catch(error => { console.error(error); process.exitCode = 1; });
