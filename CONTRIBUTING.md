# Contributing to JARVIS CLI

Thank you for your interest in contributing to JARVIS CLI! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git
- A GitHub account

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/jarvis-cli.git
   cd jarvis-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Set up your environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Add your Gemini API key
   # Edit .env and add: GEMINI_API_KEY=your_key_here
   ```

5. **Run JARVIS**
   ```bash
   npm start
   ```

## 🔧 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types
   - Write clear commit messages
   - Test your changes thoroughly

3. **Build and test**
   ```bash
   npm run build
   npm start
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add voice mode support
fix: resolve OAuth redirect issue
docs: update installation instructions
refactor: improve error handling system
```

## 🎯 Areas to Contribute

### High Priority
- 🎙️ Voice Mode (speech-to-text/text-to-speech)
- 🔍 Web Search integration
- 🧪 Unit and integration tests
- 📱 Better terminal UI/UX
- 🌐 Internationalization (i18n)

### Features You Can Add
- New AI tools/functions
- Additional service integrations (Twitter, Slack, etc.)
- Command history and autocomplete
- Plugin system
- Configuration management improvements
- Performance optimizations

### Bug Fixes & Improvements
- Check [Issues](https://github.com/SouptikTaran/jarvis-cli/issues)
- Look for `good first issue` labels
- Report bugs with detailed reproduction steps

## 📋 Code Style Guidelines

### TypeScript Best Practices

```typescript
// Use proper typing
function processInput(input: string): Promise<string> {
  return Promise.resolve(input.toLowerCase());
}

// Use interfaces for objects
interface UserConfig {
  apiKey: string;
  debug: boolean;
}

// Async/await over promises
async function fetchData(): Promise<void> {
  const result = await apiCall();
  console.log(result);
}
```

### File Structure

```
src/
├── ai/              # AI agent and function calling
├── auth/            # OAuth and authentication
├── cli/             # CLI interface and commands
├── services/        # External service integrations
├── tools/           # AI function tools
├── utils/           # Helper utilities
└── index.ts         # Entry point
```

### Adding New Tools

1. Create tool in `src/tools/your-tool.ts`
2. Implement with proper error handling
3. Register in `src/ai/toolRegistry.ts`
4. Add documentation in README.md
5. Update help system in `src/utils/help.ts`

Example:
```typescript
import { BaseTool } from '../ai/baseTool';

export class YourTool extends BaseTool {
  name = 'your_tool_name';
  description = 'Clear description for AI';

  schema = {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter description' },
    },
    required: ['param'],
  };

  async execute(args: { param: string }): Promise<string> {
    try {
      // Your implementation
      return 'Success message';
    } catch (error) {
      throw new Error(`Failed: ${error.message}`);
    }
  }
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] First-run setup wizard works
- [ ] All commands execute without errors
- [ ] Help and tutorial display correctly
- [ ] OAuth flows complete successfully
- [ ] Error messages are clear and helpful
- [ ] Exit/CTRL+C shuts down gracefully

### Future: Automated Tests
We're working on adding:
- Unit tests with Jest
- Integration tests
- CI/CD pipeline with GitHub Actions

## 📖 Documentation

When contributing, please update:
- README.md - For user-facing changes
- Code comments - For complex logic
- Help system - For new commands/tools
- CHANGELOG.md - For notable changes

## 🐛 Bug Reports

**Good bug reports include:**
1. Clear title and description
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment (OS, Node version)
5. Error messages/logs
6. Screenshots if applicable

**Template:**
```markdown
### Description
Brief description of the bug

### Steps to Reproduce
1. Run `jarvis start`
2. Type "search for music"
3. See error

### Expected Behavior
Should search Spotify successfully

### Actual Behavior
Throws "Spotify not authenticated" error

### Environment
- OS: Windows 11
- Node: v20.10.0
- JARVIS CLI: v1.0.0

### Additional Context
Spotify credentials are configured correctly
```

## 💡 Feature Requests

We welcome feature ideas! Please:
1. Check existing issues first
2. Describe the use case
3. Explain why it's valuable
4. Provide examples if possible

## 🤝 Code Review Process

### What We Look For
- ✅ Code quality and readability
- ✅ Proper error handling
- ✅ TypeScript types
- ✅ Documentation updates
- ✅ No breaking changes (or justified)
- ✅ Follows existing patterns

### Review Timeline
- Initial response: 1-3 days
- Full review: 1-7 days
- Merge decision: Based on complexity

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open an issue for discussion
- Check existing documentation
- Review closed PRs for examples

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Thanked in the community

Thank you for making JARVIS CLI better! 🚀
