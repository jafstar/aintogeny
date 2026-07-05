import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = existsSync(path.join(root, 'dist')) ? path.join(root, 'dist') : path.join(root, 'src');
const port = Number(process.env.PORT || 4173);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['', 'text/plain; charset=utf-8']
]);

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const resolved = path.normalize(path.join(siteDir, pathname));

  if (!resolved.startsWith(siteDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const info = await stat(resolved);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': types.get(path.extname(resolved)) || 'application/octet-stream' });
    createReadStream(resolved).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, () => {
  console.log(`Serving ${path.relative(root, siteDir)} at http://localhost:${port}`);
});
