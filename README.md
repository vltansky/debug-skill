# Debug Skill

Runtime debugging skill for AI coding agents (Claude Code, Cursor, Windsurf, Aider).

Collects runtime logs during bug reproduction to make evidence-based fixes instead of guessing.

Heavily inspired by (essentially a port of) [Cursor's Debug Mode](https://docs.cursor.com/agent/tools#debug).

## Installation

### Option 1: OpenSkills CLI (recommended)

```bash
npx -y openskills install vltansky/debug-skill
npx -y openskills sync
```

### Option 2: Manual

```bash
# Clone
git clone https://github.com/vltansky/debug-skill.git
cd debug-skill

# Install to global skills
npm run install-skill

# Or copy manually
cp -r debug-skill ~/.claude/skills/debug
```

## Usage

In your AI agent, invoke the skill:

```
debug /path/to/project
```

The skill will:
1. Start a log server on port 8787
2. Help you generate hypotheses about the bug
3. Instrument code with debug logging
4. Collect logs during reproduction
5. Analyze logs to confirm/reject hypotheses
6. Fix based on evidence

## Structure

```
debug-skill/
├── SKILL.md              # Skill instructions
└── scripts/
    ├── debug_server.js   # Node.js log server
    └── debug_server.py   # Python log server (alternative)
```

## Requirements

- Node.js 18+ (for debug_server.js)
- OR Python 3.8+ (for debug_server.py)

## License

MIT
