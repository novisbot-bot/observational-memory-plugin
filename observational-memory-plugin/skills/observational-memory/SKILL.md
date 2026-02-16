# Observational Memory Plugin - SKILL.md

## Overview

The Observational Memory Plugin implements a three-tier memory architecture for OpenClaw that reduces token costs by 70-90% while improving context retention.

## When to Use This Plugin

Use observational memory when:
- Your agent context regularly exceeds 20KB per session
- You want to reduce API costs without losing important context
- You need better continuity across multiple sessions
- You want automatic summarization of daily activities
- You need pattern extraction for user preferences

## Three-Tier Architecture

### Tier 1: Recent Context (High-Fidelity)
- **Content**: Last 10-20 conversation turns
- **Size**: ~8KB
- **Purpose**: Immediate task continuity
- **Format**: Raw messages (verbatim)
- **Lifetime**: Current session

### Tier 2: Observation Log (Compressed)
- **Content**: Daily condensed observations
- **Size**: ~2-4KB
- **Purpose**: Long-term memory without bloat
- **Format**: Bullet-point observations with priority markers (🔴 🟡 🟢)
- **Lifetime**: 30 days (configurable)
- **Compression**: 5-40x reduction via Observer Agent

### Tier 3: Reflections (Patterns)
- **Content**: Higher-level patterns and insights
- **Size**: ~500B-1KB
- **Purpose**: Strategic learning
- **Format**: Structured JSON + markdown
- **Lifetime**: Persistent
- **Updates**: Weekly via Reflector Agent

## File Structure

```
workspace/
├── SYSTEM/                    # Stable, cached context
│   ├── CORE.md               # 1KB (condensed identity)
│   ├── USER_PROFILE.md       # 500B (user context)
│   ├── RULES.md             # 1KB (operating rules)
│   └── SECURITY_CORE.md     # 500B (security essentials)
│
├── OBSERVATIONS/              # Dynamic, compressed
│   ├── observation_log.md    # 2-4KB (rolling compressed)
│   ├── TODAY.md             # 1KB (today's notes)
│   └── YESTERDAY.md         # 1KB (yesterday's notes)
│
├── REFLECTIONS/             # Strategic, patterns
│   ├── user_preferences.json # 500B (structured prefs)
│   ├── lessons_learned.md   # 500B (distilled wisdom)
│   └── project_status.json  # 1KB (active projects)
│
└── RAW_MEMORY/              # Backup of originals
    ├── SOUL.md
    ├── AGENTS.md
    ├── MEMORY.md
    └── SECURITY.md
```

## Agent Tools

### obs_memory_status()
Check memory tier status and compression statistics.

```javascript
// Example usage
const status = await obs_memory_status();
// Returns: workspace, tier sizes, compression ratio, config
```

### obs_trigger_observer()
Manually trigger the Observer Agent to compress yesterday's notes.

```javascript
// Run compression
await obs_trigger_observer();

// Dry run (preview only)
await obs_trigger_observer({ dryRun: true });
```

### obs_trigger_reflector()
Manually trigger the Reflector Agent to extract patterns.

```javascript
// Run pattern extraction
await obs_trigger_reflector();

// Dry run (preview only)
await obs_trigger_reflector({ dryRun: true });
```

### obs_search_observations(query)
Search through compressed observations.

```javascript
// Search for specific topics
const results = await obs_search_observations({ query: "Gatekeeper Agent" });
```

### obs_get_reflections(type?)
Retrieve user preferences, lessons, or project status.

```javascript
// Get all reflections
const all = await obs_get_reflections({ type: "all" });

// Get specific types
const prefs = await obs_get_reflections({ type: "preferences" });
const lessons = await obs_get_reflections({ type: "lessons" });
const projects = await obs_get_reflections({ type: "projects" });
```

## CLI Commands

```bash
# View status
openclaw observational-memory status

# Run observer compression
openclaw observational-memory observe
openclaw observational-memory observe --dry-run

# Run pattern extraction
openclaw observational-memory reflect
openclaw observational-memory reflect --dry-run

# Migrate existing memory files
openclaw observational-memory migrate
openclaw observational-memory migrate --check-only

# Reset (destructive)
openclaw observational-memory reset --force
```

## Configuration

### Basic Setup

```json
{
  "plugins": {
    "entries": {
      "observational-memory": {
        "enabled": true,
        "config": {
          "workspace": "~/.openclaw/workspaces/observational-memory",
          "observer": {
            "enabled": true,
            "schedule": "0 2 * * *",
            "model": "openrouter/anthropic/claude-haiku",
            "compressionTarget": 0.2
          },
          "reflector": {
            "enabled": true,
            "schedule": "0 3 * * 0",
            "model": "openrouter/anthropic/claude-sonnet-4-5"
          }
        }
      }
    }
  }
}
```

### Advanced Configuration

```json
{
  "plugins": {
    "entries": {
      "observational-memory": {
        "enabled": true,
        "config": {
          "workspace": "~/.openclaw/workspaces/observational-memory",
          "observer": {
            "enabled": true,
            "schedule": "0 2 * * *",
            "model": "openrouter/anthropic/claude-haiku",
            "compressionTarget": 0.2
          },
          "reflector": {
            "enabled": true,
            "schedule": "0 3 * * 0",
            "model": "openrouter/anthropic/claude-sonnet-4-5",
            "extractPatterns": true
          },
          "tiers": {
            "recent": {
              "maxTurns": 20,
              "maxSize": "8kb"
            },
            "observations": {
              "maxSize": "4kb",
              "retentionDays": 30
            },
            "reflections": {
              "maxPatterns": 50,
              "maxLessons": 20
            }
          }
        }
      }
    }
  }
}
```

## Migration Guide

### From Default OpenClaw Memory

1. Install the plugin:
   ```bash
   openclaw plugins install @openclaw/observational-memory
   ```

2. Check migration preview:
   ```bash
   openclaw observational-memory migrate --check-only
   ```

3. Run migration:
   ```bash
   openclaw observational-memory migrate
   ```

4. Verify status:
   ```bash
   openclaw observational-memory status
   ```

5. Restart OpenClaw Gateway

## Cost Analysis

| Metric | Before Plugin | After Plugin | Savings |
|--------|--------------|--------------|---------|
| Context per session | 25KB | 11KB | **56%** |
| Monthly token costs | $180-570 | $45-140 | **75%** |
| Total monthly cost | $780-2070 | $230-650 | **70%** |

*Based on 50 sessions/day with mixed model usage*

## Best Practices

### 1. System File Maintenance
- Update `SYSTEM/CORE.md` only when identity changes
- Keep under 1KB for optimal caching
- Original full narrative preserved in `RAW_MEMORY/SOUL.md`

### 2. Observation Quality
- Mark critical items with 🔴 (decisions, blockers)
- Use 🟡 for important context
- Use 🟢 for minor notes
- Observer automatically prioritizes 🔴 items

### 3. Reflection Tuning
- Review `lessons_learned.md` monthly
- Prune outdated patterns from `user_preferences.json`
- Archive completed projects from `project_status.json`

### 4. Model Selection
- Observer: Use cheap models (Haiku, GPT-Nano)
- Reflector: Use capable models (Sonnet, GPT-4o)
- Default agent: Still use best model for task

## Troubleshooting

### Memory Not Loading
```bash
# Check plugin status
openclaw plugins list

# Verify configuration
openclaw config get plugins.entries.observational-memory

# Check workspace exists
ls -la ~/.openclaw/workspaces/observational-memory/
```

### Compression Not Working
```bash
# Check observer manually
openclaw observational-memory observe --dry-run

# Verify yesterday has content
cat ~/.openclaw/workspaces/observational-memory/OBSERVATIONS/YESTERDAY.md

# Check for errors in logs
openclaw logs | grep observational-memory
```

### Pattern Extraction Failing
```bash
# Check observations exist
openclaw observational-memory status

# Run reflector manually
openclaw observational-memory reflect --dry-run
```

## Integration with OpenClaw Memory

The plugin works alongside OpenClaw's built-in memory search:

1. `memory_search()` searches all memory including observations
2. `obs_search_observations()` searches only compressed observations
3. `obs_get_reflections()` retrieves structured user profile data

Use both for comprehensive context retrieval.

## References

- [Mastra Observational Memory](https://mastra.ai/docs/memory/observational-memory)
- [OpenClaw Plugin Docs](https://docs.openclaw.ai/tools/plugin)
- [Novis Memory Optimization Proposal](https://github.com/openclaw/observational-memory-plugin/blob/main/docs/proposal.md)

## Support

- Issues: https://github.com/openclaw/observational-memory-plugin/issues
- Discord: https://discord.gg/openclaw
