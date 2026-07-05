import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const requiredFiles = [
  'index.html',
  'styles.css',
  'script.js',
  'favicon.svg',
  'og-image.svg',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'CNAME'
];
const errors = [];

for (const file of requiredFiles) {
  try {
    await access(path.join(src, file));
  } catch {
    errors.push(`Missing required file: src/${file}`);
  }
}

const html = await readFile(path.join(src, 'index.html'), 'utf8');
const requiredSnippets = [
  '<title>AIntogeny',
  'name="description"',
  'property="og:title"',
  'application/ld+json',
  '<main id="main"',
  'aria-label="Primary navigation"',
  'href="styles.css"',
  'src="script.js"'
];

for (const snippet of requiredSnippets) {
  if (!html.includes(snippet)) errors.push(`index.html missing required snippet: ${snippet}`);
}

const assetRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => !/^(https?:|mailto:|tel:|#)/.test(ref) && ref !== '/')
  .map((ref) => ref.split('#')[0].split('?')[0])
  .filter(Boolean);

for (const ref of assetRefs) {
  const localPath = ref.startsWith('/') ? ref.slice(1) : ref;
  try {
    await access(path.join(src, localPath));
  } catch {
    errors.push(`Broken local asset reference in index.html: ${ref}`);
  }
}

if (!html.includes('hello@aintogeny.com')) errors.push('Contact email is missing.');
if (!html.includes('https://aintogeny.com')) errors.push('Canonical production URL is missing.');
if ((html.match(/<section\b/g) || []).length < 5) errors.push('Homepage should contain at least five sections.');
if (html.includes('TODO') || html.includes('Lorem ipsum')) errors.push('Placeholder text found.');

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Validated homepage source (${requiredFiles.length} files, ${assetRefs.length} local asset references).`);
