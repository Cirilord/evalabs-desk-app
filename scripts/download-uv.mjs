import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const UV_VERSION = process.env.UV_VERSION ?? '0.11.33';
const RELEASE_URL = `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}`;
const BINARIES_DIRECTORY = new URL('../src-tauri/binaries/', import.meta.url);
const DEFAULT_TARGETS = [
  'aarch64-apple-darwin',
  'x86_64-apple-darwin',
  'aarch64-pc-windows-msvc',
  'x86_64-pc-windows-msvc',
  'aarch64-unknown-linux-gnu',
  'x86_64-unknown-linux-gnu',
];

function archiveName(target) {
  return `uv-${target}.${target.includes('windows') ? 'zip' : 'tar.gz'}`;
}

async function download(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not download ${url}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function verifyChecksum(archive, checksumFile, archiveName) {
  const expected = checksumFile.toString('utf8').trim().split(/\s+/)[0];
  const actual = createHash('sha256').update(archive).digest('hex');

  if (!/^[a-f0-9]{64}$/i.test(expected) || actual !== expected) {
    throw new Error(`Checksum verification failed for ${archiveName}.`);
  }
}

async function downloadTarget(target, temporaryDirectory) {
  const fileName = archiveName(target);
  const archiveUrl = `${RELEASE_URL}/${fileName}`;
  const [archive, checksumFile] = await Promise.all([
    download(archiveUrl),
    download(`${archiveUrl}.sha256`),
  ]);
  verifyChecksum(archive, checksumFile, fileName);

  const archivePath = join(temporaryDirectory, fileName);
  const extractionDirectory = join(temporaryDirectory, target);
  await writeFile(archivePath, archive);
  await mkdir(extractionDirectory);
  await execFile('tar', ['-xf', archivePath, '-C', extractionDirectory]);

  const executableName = target.includes('windows') ? 'uv.exe' : 'uv';
  const extractedBinary = join(extractionDirectory, `uv-${target}`, executableName);
  const destination = new URL(
    `uv-${target}${target.includes('windows') ? '.exe' : ''}`,
    BINARIES_DIRECTORY
  );
  await writeFile(destination, await readFile(extractedBinary), { mode: 0o755 });

  console.log(`Downloaded ${basename(destination.pathname)} from uv ${UV_VERSION}.`);
}

const targets = process.argv.slice(2);
const requestedTargets = targets.length > 0 ? targets : DEFAULT_TARGETS;
const unsupportedTargets = requestedTargets.filter((target) => !DEFAULT_TARGETS.includes(target));

if (unsupportedTargets.length > 0) {
  throw new Error(`Unsupported targets: ${unsupportedTargets.join(', ')}.`);
}

await mkdir(BINARIES_DIRECTORY, { recursive: true });
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'eva-uv-'));

try {
  for (const target of requestedTargets) {
    await downloadTarget(target, temporaryDirectory);
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}
