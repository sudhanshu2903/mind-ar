/**
 * server.js — local dev server for MindAR WebAR projects
 *
 * Fixes the core issues that break camera/AR on a plain Live Server:
 *  1. Serves .mind files as application/octet-stream so the browser
 *     fetch() inside MindAR doesn't abort.
 *  2. Adds the COOP/COEP headers required for SharedArrayBuffer
 *     (needed by some MindAR versions).
 *  3. Runs on http://localhost — a "secure context" the browser trusts
 *     for getUserMedia/camera even without HTTPS.
 *
 * Usage:
 *   node server.js          → runs on http://localhost:8080
 *   node server.js 3000     → runs on http://localhost:3000
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const PORT = parseInt(process.argv[2] || '8080', 10);
const ROOT = __dirname;   // serve files from the same folder as this script

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.css'  : 'text/css',
  '.js'   : 'application/javascript',
  '.json' : 'application/json',
  '.mind' : 'application/octet-stream',   // ← critical for MindAR
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.gif'  : 'image/gif',
  '.svg'  : 'image/svg+xml',
  '.webp' : 'image/webp',
  '.woff' : 'font/woff',
  '.woff2': 'font/woff2',
  '.glb'  : 'model/gltf-binary',
  '.gltf' : 'model/gltf+json',
};

const server = http.createServer((req, res) => {
  // Strip query string
  let urlPath = req.url.split('?')[0];

  // Default to index.html
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: block path traversal outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${urlPath}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type'  : mime,
      'Cache-Control' : 'no-cache',
      // COOP + COEP allow SharedArrayBuffer (needed by some MindAR builds)
      'Cross-Origin-Opener-Policy'   : 'same-origin',
      'Cross-Origin-Embedder-Policy' : 'require-corp',
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  MindAR Dev Server running                       ║`);
  console.log(`║  → http://localhost:${PORT}                       ║`);
  console.log('║                                                  ║');
  console.log('║  Open the URL above in Chrome or Edge.           ║');
  console.log('║  Allow camera when the browser prompts.          ║');
  console.log('║  Press Ctrl+C to stop.                           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
});
