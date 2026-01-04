#!/usr/bin/env node
/**
 * Debug Log Server
 *
 * Receives logs via HTTP POST and writes them to {project}/.claude/debug-{sessionId}.log
 * Supports multiple concurrent sessions via sessionId parameter.
 *
 * Usage:
 *     node debug_server.js /path/to/project
 *     node debug_server.js  # Uses current directory
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_DIR = process.argv[2] || '.';
const CLAUDE_DIR = path.join(LOG_DIR, '.claude');
const PORT = parseInt(process.env.DEBUG_PORT || '8787', 10);

fs.mkdirSync(CLAUDE_DIR, { recursive: true });

const getLogFile = (sessionId) => path.join(CLAUDE_DIR, `debug-${sessionId}.log`);

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
    res.end(JSON.stringify({ status: 'ok', log_dir: CLAUDE_DIR }));
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const sessionId = data.sessionId || 'default';
        const logFile = getLogFile(sessionId);
        
        // Remove sessionId from stored entry (it's in filename)
        const { sessionId: _, ...rest } = data;
        const entry = { ts: new Date().toISOString(), ...rest };

        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');

        res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
        res.end(JSON.stringify({ ok: true, log_file: logFile }));

        console.log(`[${sessionId}] ${entry.msg || JSON.stringify(entry).slice(0, 80)}`);
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
  console.log(`  Log dir:  ${CLAUDE_DIR}`);
  console.log('  Press Ctrl+C to stop\n');
});
