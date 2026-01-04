#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const [, , action, projectPath, sessionId] = process.argv;

if (!action || !projectPath || !sessionId) {
  console.error("Usage: node debug_cleanup.js <action> <project-path> <session-id>");
  console.error("Actions:");
  console.error("  clear  - Truncate log file to empty");
  console.error("  remove - Delete log file");
  process.exit(1);
}

const logDir = path.join(projectPath, ".claude");
const logFile = path.join(logDir, `${sessionId}.log`);

if (!fs.existsSync(logFile)) {
  console.error(`Log file not found: ${logFile}`);
  process.exit(1);
}

switch (action) {
  case "clear":
    fs.writeFileSync(logFile, "");
    console.log(`Cleared: ${logFile}`);
    break;
  case "remove":
    fs.unlinkSync(logFile);
    console.log(`Removed: ${logFile}`);
    break;
  default:
    console.error(`Unknown action: ${action}`);
    console.error("Valid actions: clear, remove");
    process.exit(1);
}
