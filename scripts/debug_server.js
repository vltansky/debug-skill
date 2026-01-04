#!/usr/bin/env node
/**
 * Debug Log Server
 *
 * Receives logs via HTTP POST and writes them to {project}/.claude/debug.log
 *
 * Usage:
 *     node debug_server.js /path/to/project
 *     node debug_server.js  # Uses current directory
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_DIR = process.argv[2] || '.';
const SESSION_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const LOG_FILE = path.join(LOG_DIR, '.claude', `debug-${SESSION_ID}.log`);
const PORT = parseInt(process.env.DEBUG_PORT || '8787', 10);

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const server = http.createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify({ status: 'ok', log_file: LOG_FILE }));
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const entry = { ts: new Date().toISOString(), ...data };

        fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');

        res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
        res.end('{"ok":true}');

        console.log(`[LOG] ${entry.msg || JSON.stringify(entry).slice(0, 80)}`);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404, cors);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Debug Log Server');
  console.log(`  Endpoint: http://localhost:${PORT}/log`);
  console.log(`  Log file: ${LOG_FILE}`);
  console.log('  Press Ctrl+C to stop\n');
});
