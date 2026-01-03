---
name: debug
description: Runtime debugging workflow with log collection. Use when fixing bugs that require runtime evidence. Starts a log server, instruments code, collects logs during reproduction, and analyzes them to fix issues. Invoke with project path argument.
---

# Debug Mode

## Overview

Debug mode is a systematic debugging workflow that requires runtime evidence before making fixes. It avoids guessing from static code analysis alone by collecting actual runtime logs.

## Arguments

This skill requires the project path as an argument:
```
/debug /path/to/project
```

If no path provided, use the current working directory.

## Workflow

### Phase 1: Start Log Server

1. Copy the bundled server script to the project:
   ```bash
   cp scripts/debug_server.js /path/to/project/.claude/
   ```

2. Instruct the user to start the server in a separate terminal:
   ```bash
   node .claude/debug_server.js .
   ```

This starts an HTTP server on port 8787 that:
- Receives POST requests at `/log`
- Writes logs to `{project}/.claude/debug.log`
- Returns status at GET `/` (health check)

Verify it's running: `curl http://localhost:8787/`

### Phase 2: Generate Hypotheses

Before instrumenting code, generate 3-5 specific, testable hypotheses about the bug:

1. List potential causes covering different subsystems
2. Each hypothesis should be confirmable/rejectable with log evidence
3. Be specific about what values or behaviors to check

### Phase 3: Instrument Code

Add logging calls to the codebase. Use this pattern in the app:

**JavaScript/TypeScript:**
```javascript
// Debug log helper
const debugLog = (msg, data = {}, hypothesisId = null) =>
  fetch('http://localhost:8787/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msg, data, hypothesisId, loc: new Error().stack?.split('\n')[2] })
  }).catch(() => {});

// Usage
debugLog('User clicked submit', { userId: 123, formData }, 'H1');
```

**Python:**
```python
import requests, traceback
def debug_log(msg, data=None, hypothesis_id=None):
    try:
        requests.post('http://localhost:8787/log', json={
            'msg': msg, 'data': data, 'hypothesisId': hypothesis_id,
            'loc': traceback.format_stack()[-2].strip()
        }, timeout=0.5)
    except: pass

# Usage
debug_log('Processing request', {'user_id': 123}, 'H1')
```

**Guidelines:**
- Add 3-8 instrumentation points
- Cover function entry/exit, critical values, branch paths
- Tag each log with relevant `hypothesisId`
- Wrap instrumentation in comments: `// #region debug` ... `// #endregion`

### Phase 4: Clear and Reproduce

1. Delete the log file before reproduction:
   ```bash
   rm /path/to/project/.claude/debug.log
   ```

2. Provide clear reproduction steps to the user

3. User reproduces the bug while logs are collected

### Phase 5: Analyze Logs

Read the log file and analyze:

```
Read /path/to/project/.claude/debug.log
```

For each hypothesis:
- **CONFIRMED**: Log evidence supports this cause
- **REJECTED**: Log evidence contradicts this hypothesis
- **INCONCLUSIVE**: Need more instrumentation

Cite specific log entries as evidence.

### Phase 6: Fix

Only fix when logs confirm the root cause. Make targeted fixes based on evidence.

### Phase 7: Verify

1. Clear logs again
2. User reproduces (bug should be gone)
3. Compare before/after logs
4. Confirm fix with log evidence

### Phase 8: Clean Up

Remove instrumentation only after:
- Post-fix logs prove success
- User confirms the issue is resolved

Search for `#region debug` markers and remove all debug logging code.

## Log Format

Each line in `.claude/debug.log` is NDJSON:
```json
{"ts":"2024-01-03T12:00:00.000Z","msg":"Button clicked","data":{"id":5},"hypothesisId":"H1","loc":"app.js:42"}
```

## Critical Rules

1. **Never fix without runtime evidence** - Always collect logs first
2. **Never remove instrumentation before verification** - Keep logs until fix is confirmed
3. **If all hypotheses rejected** - Generate new ones, add more instrumentation
4. **Iterate** - Multiple rounds of instrumentation may be needed
