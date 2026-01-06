# Debug Skill

Ported [Cursor's Debug Mode](https://cursor.com/blog/debug-mode) as a skill for Claude Code, OpenCode, Codex, and any agent that supports skills.

![Debug Skill Screenshot](screenshot.png)

**How it works:**
- Start a log server on localhost
- Instrument code to send logs
- Read logs from file, fix with evidence

Runtime agnostic - works anywhere with localhost access.

## Installation

### Claude Code / OpenCode (via openskills)

```bash
npx -y openskills install vltansky/debug-skill
npx -y openskills sync
```

OpenCode natively reads skills from `.claude/skills/` - openskills installs there by default.

### Codex

```bash
# Using Codex's built-in installer
$skill-installer install https://github.com/vltansky/debug-skill/tree/main/debug-skill

# Or manual
git clone https://github.com/vltansky/debug-skill.git
cp -r debug-skill/debug-skill ~/.codex/skills/debug
```

After install, restart Codex to load.

### Manual (any agent)

```bash
git clone https://github.com/vltansky/debug-skill.git

# Claude Code / OpenCode
cp -r debug-skill/debug-skill ~/.claude/skills/debug

# Or project-local
cp -r debug-skill/debug-skill .claude/skills/debug
```

### Local Development (symlink)

For active skill development:

```bash
git clone https://github.com/vltansky/debug-skill.git ~/dev/debug-skill
mkdir -p .claude/skills
ln -s ~/dev/debug-skill/debug-skill .claude/skills/debug
```

Changes to the skill are immediately reflected.

## Usage

In your AI agent, invoke the skill:

```
debug /path/to/project
```

## Agent Compatibility

| Agent | Skill Location | Install Method |
|-------|---------------|----------------|
| Claude Code | `~/.claude/skills/` | openskills, manual |
| OpenCode | `.opencode/skill/` or `.claude/skills/` | openskills, manual |
| Codex | `~/.codex/skills/` | `$skill-installer`, manual |
| Cursor/Windsurf/Aider | via `AGENTS.md` | openskills sync |

## Structure

```
debug-skill/
├── SKILL.md              # Skill instructions
└── scripts/
    ├── debug_server.js   # Log server
    └── debug_cleanup.js  # Log cleanup utility
```

## Requirements

- Node.js 18+

## License

MIT
