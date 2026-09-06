import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  throw new Error('Pass a valid semantic version to synchronize Tauri files.');
}

const cargoManifestPath = new URL('../src-tauri/Cargo.toml', import.meta.url);
const cargoManifest = await readFile(cargoManifestPath, 'utf8');
const cargoVersionPattern = /^version = ".*"$/m;
if (!cargoVersionPattern.test(cargoManifest)) {
  throw new Error('Could not find the package version in src-tauri/Cargo.toml.');
}

const tauriConfigPath = new URL('../src-tauri/tauri.conf.json', import.meta.url);
const tauriConfig = JSON.parse(await readFile(tauriConfigPath, 'utf8'));
tauriConfig.version = version;

const nextCargoManifest = cargoManifest.replace(cargoVersionPattern, `version = "${version}"`);
const nextTauriConfig = await format(JSON.stringify(tauriConfig, null, 2), {
  filepath: tauriConfigPath.pathname,
});

await Promise.all([
  writeFile(cargoManifestPath, nextCargoManifest),
  writeFile(tauriConfigPath, nextTauriConfig),
]);
