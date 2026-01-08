#!/usr/bin/env node
/**
 * Debug Log Server
 *
 * Receives logs via HTTP POST and writes them to {project}/.debug/debug-{sessionId}.log
 * Supports multiple concurrent sessions via sessionId parameter.
 *
 * Usage:
 *     node debug_server.js /path/to/project SESSION_ID
 *     node debug_server.js /path/to/project  # Error: session ID required
 *
 * Environment:
 *     DEBUG_LOG_DIR - Override log subdirectory (default: .debug)
 *     DEBUG_PORT    - Override port (default: 8787)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = process.argv[2] || '.';
const SESSION_ID = process.argv[3];
const LOG_SUBDIR = process.env.DEBUG_LOG_DIR || '.debug';
const LOG_DIR = path.join(PROJECT_DIR, LOG_SUBDIR);
const PORT = parseInt(process.env.DEBUG_PORT || '8787', 10);

// Validate session ID is provided
if (!SESSION_ID) {
  console.error('Error: Session ID required');
  console.error('Usage: node debug_server.js /path/to/project SESSION_ID');
  console.error('');
  console.error('Generate session ID first:');
  console.error('  SESSION_ID="fix-description-$(uuidgen | cut -c1-6 | tr \'[:upper:]\' \'[:lower:]\')"');
  process.exit(1);
}

// Check if server already running
(async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);
    const res = await fetch(`http://localhost:${PORT}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      console.log(`Server already running on port ${PORT}`);
      process.exit(0);
    }
  } catch {}

  // Cleanup stale port (crash recovery)
  try {
    const pid = execSync(`lsof -ti:${PORT}`, { encoding: 'utf-8' }).trim();
    if (pid) {
      console.log(`Cleaning up stale process on port ${PORT} (PID: ${pid})`);
      execSync(`kill -9 ${pid}`);
    }
  } catch {}

  startServer();
})();

function startServer() {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const getLogFile = (sessionId) => path.join(LOG_DIR, `debug-${sessionId}.log`);

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
      res.end(JSON.stringify({
        status: 'ok',
        session_id: SESSION_ID,
        log_file: path.join(LOG_DIR, `debug-${SESSION_ID}.log`),
      }));
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
    console.log(`  Session:  ${SESSION_ID}`);
    console.log(`  Endpoint: http://localhost:${PORT}/log`);
    console.log(`  Log file: ${path.join(LOG_DIR, `debug-${SESSION_ID}.log`)}`);
    console.log('\nReady');
    console.log('\nPress Ctrl+C to stop');
  });
}
