const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const name = 'ubersicht-weather-widget';
const folder = `${name}.widget`;
const archive = `${folder}.zip`;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ubersicht-weather-package-'));

try {
  const destination = path.join(temporary, folder);
  fs.mkdirSync(destination);
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  if (!Array.isArray(config.cities) || config.cities.length || config.location !== null) {
    throw new Error('Use the public default config with no saved cities before packaging.');
  }
  for (const file of ['index.jsx', 'save-config.cjs', 'config.json', 'LICENSE', 'widget.json']) {
    const target = path.join(destination, file);
    if (file === 'index.jsx') {
      const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const originalPath = `${name}/save-config.cjs`;
      if (!source.includes(originalPath)) throw new Error('Cannot find the settings helper path.');
      // Gallery archives install into a .widget folder; Git clones use the repository name.
      fs.writeFileSync(target, source.replace(originalPath, `${folder}/save-config.cjs`));
    } else {
      fs.copyFileSync(path.join(__dirname, file), target);
    }
    fs.chmodSync(target, 0o644);
  }
  const output = path.join(temporary, archive);
  execFileSync('/usr/bin/zip', ['-X', '-q', '-r', output, folder], { cwd: temporary });
  execFileSync('/usr/bin/unzip', ['-tq', output], { stdio: 'pipe' });
  fs.copyFileSync(output, path.join(__dirname, archive));
  console.log(`Created ${archive}`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
