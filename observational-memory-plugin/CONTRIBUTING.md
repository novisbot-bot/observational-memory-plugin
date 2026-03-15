# Contributing to Observational Memory Plugin

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/openclaw/observational-memory-plugin.git
cd observational-memory-plugin

# Install dependencies
npm install

# Link for local development
openclaw plugins install -l .

# Start development mode
npm run dev
```

## Project Structure

```
observational-memory-plugin/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── services/             # Core services
│   │   └── memory-service.ts
│   ├── agents/               # Observer and Reflector
│   │   ├── observer.ts
│   │   └── reflector.ts
│   ├── tools/                # Agent tools
│   │   └── memory-tools.ts
│   ├── cli/                  # CLI commands
│   │   └── commands.ts
│   └── utils/                # Utilities
│       └── files.ts
├── skills/
│   └── observational-memory/
│       └── SKILL.md          # Documentation
├── tests/                    # Test files
├── dist/                     # Compiled output
├── openclaw.plugin.json      # Plugin manifest
├── package.json
├── tsconfig.json
└── README.md
```

## Code Style

- Use TypeScript with strict mode enabled
- Follow existing code formatting (Prettier)
- Run linting before committing: `npm run lint`
- Write meaningful variable and function names
- Add JSDoc comments for public APIs

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/services/memory-service.test.ts

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Use Vitest for testing
- Place tests in `tests/` or alongside source files as `.test.ts`
- Mock external dependencies (filesystem, model APIs)
- Test both success and error cases

## Pull Request Process

1. **Fork and Branch**: Create a feature branch from `main`
2. **Make Changes**: Implement your feature or bug fix
3. **Add Tests**: Ensure changes are covered by tests
4. **Update Docs**: Update SKILL.md if behavior changes
5. **Run Checks**: Ensure `npm run lint` and `npm test` pass
6. **Commit**: Use clear, descriptive commit messages
7. **Push and PR**: Open a pull request with detailed description

### PR Requirements

- Description of changes and why
- Link to related issue(s)
- Screenshots/logs if applicable
- All CI checks passing
- Code review approval from maintainer

## Reporting Issues

### Bug Reports

Include:
- OpenClaw version
- Plugin version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Willingness to contribute implementation

## Architecture Decisions

When making significant architectural changes:

1. Open an issue for discussion first
2. Document the rationale
3. Consider backward compatibility
4. Update architecture documentation

## Release Process

Releases are managed by maintainers:

1. Version bump in `package.json` and `openclaw.plugin.json`
2. Update `CHANGELOG.md`
3. Tag release: `git tag v1.x.x`
4. Push to npm: `npm publish`
5. Create GitHub release with notes

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect differing viewpoints

## Questions?

- Discord: https://discord.gg/openclaw
- Issues: https://github.com/openclaw/observational-memory-plugin/issues

Thank you for contributing! 🎉
