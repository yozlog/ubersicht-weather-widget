const fs = require('node:fs');
const path = require('node:path');

const validCity = city => city && typeof city.name === 'string' && city.name.trim() &&
  Number.isFinite(city.latitude) && Math.abs(city.latitude) <= 90 &&
  Number.isFinite(city.longitude) && Math.abs(city.longitude) <= 180;

function saveConfig(file, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid settings');
  for (const key of Object.keys(patch)) {
    if (!['cities', 'location', 'forecastDays'].includes(key)) throw new Error('Unsupported setting');
  }
  if ('cities' in patch && (!Array.isArray(patch.cities) || !patch.cities.every(validCity))) throw new Error('Invalid cities');
  if ('location' in patch && patch.location !== null && !validCity(patch.location)) throw new Error('Invalid location');
  if ('forecastDays' in patch && (!Number.isInteger(patch.forecastDays) || patch.forecastDays < 1 || patch.forecastDays > 16)) throw new Error('Invalid days');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Invalid config file');
  const next = JSON.stringify({ ...config, ...patch }, null, 2) + '\n';
  if (next === fs.readFileSync(file, 'utf8')) return;
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, next, { mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

module.exports = saveConfig;
if (require.main === module) {
  try {
    const encoded = process.argv[2];
    if (!encoded || !/^(?:[0-9a-f]{2})+$/i.test(encoded)) throw new Error('Invalid payload');
    saveConfig(path.join(__dirname, 'config.json'), JSON.parse(Buffer.from(encoded, 'hex').toString('utf8')));
    console.log('saved');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
