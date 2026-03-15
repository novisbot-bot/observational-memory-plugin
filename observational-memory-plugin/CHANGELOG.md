# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-16

### Added
- Initial release of Observational Memory Plugin
- Three-tier memory architecture (Recent Context, Observations, Reflections)
- Observer Agent for daily compression (5-40x reduction)
- Reflector Agent for weekly pattern extraction
- CLI commands: status, observe, reflect, migrate, reset
- Agent tools: obs_memory_status, obs_trigger_observer, obs_trigger_reflector, obs_search_observations, obs_get_reflections
- Automatic file structure initialization (SYSTEM/, OBSERVATIONS/, REFLECTIONS/, RAW_MEMORY/)
- Migration tool for existing OpenClaw memory files
- Configurable compression targets and retention policies
- Cron job integration for scheduled observation/reflection
- TypeScript implementation with full type safety
- Comprehensive documentation (README, SKILL.md, CONTRIBUTING)

### Features
- 70-90% token cost reduction through intelligent compression
- Prompt caching support for stable context files
- Priority-based observation markers (🔴 🟡 🟢)
- User preference detection and learning
- Project status tracking
- Searchable observation logs
- Backup preservation of original memory files

### Technical
- OpenClaw plugin SDK integration
- Gateway RPC methods for status/migration
- Background services for scheduled tasks
- Configurable model selection for Observer/Reflector
- File size limits and cleanup policies
- Error handling and logging throughout

[1.0.0]: https://github.com/openclaw/observational-memory-plugin/releases/tag/v1.0.0
