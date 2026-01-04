# Debug Skill

Ported [Cursor's Debug Mode](https://cursor.com/blog/debug-mode) as a skill for Claude Code / any agent that supports skills.

![Debug Skill Screenshot](screenshot.png)

**How it works:**
- Start a log server on localhost
- Instrument code to send logs
- Read logs from file, fix with evidence

Runtime agnostic - works anywhere with localhost access.

## Installation

```bash
npx -y openskills install vltansky/debug-skill
npx -y openskills sync
```

Or manually:

```bash
git clone https://github.com/vltansky/debug-skill.git
cp -r debug-skill/debug-skill ~/.claude/skills/debug
```

## Usage

In your AI agent, invoke the skill:

```
debug /path/to/project
```

## Structure

```
debug-skill/
├── SKILL.md              # Skill instructions
└── scripts/
    └── debug_server.js   # Log server
```

## Requirements

- Node.js 18+

## License

MIT
