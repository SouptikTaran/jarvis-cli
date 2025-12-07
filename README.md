# 🤖 JARVIS CLI

[![npm version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/SouptikTaran/jarvis-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)

An intelligent terminal-based AI assistant powered by Google's Gemini, with Spotify, Google Calendar, Gmail, Tasks, and GitHub integrations.

> **Your personal AI assistant that lives in your terminal** - Control your music, manage calendars, handle emails, track tasks, automate Git workflows, and have natural conversations, all without leaving the command line.

---

## ✨ Features

### 🎯 Implemented
- ✅ Interactive terminal interface with Inquirer
- ✅ **Conversation Memory**: Multi-turn conversations with context
- ✅ Natural language input processing via Gemini AI
- ✅ Function calling system with tool registry (29 tools total)
- ✅ **Comprehensive Help System**
  - Interactive tutorial for first-time users
  - Categorized command reference
  - Built-in examples for all features
- ✅ **Secure Credential Storage**: Encrypted API key management
  - First-run interactive setup for Gemini API key
  - Optional Spotify and Google credentials
  - AES-256-GCM encrypted storage in ~/.jarvis/
  - Backup and restore capabilities
- ✅ **Intelligent Error Handling**
  - Contextual error messages with solutions
  - Automatic detection of API key issues
  - OAuth troubleshooting guidance
  - Network error recovery suggestions
- ✅ File operations (read, write, list files)
- ✅ **Google Tasks Integration**: Sync tasks across all devices
  - Add, list, complete, delete tasks
  - Priorities (low, medium, high) with emoji indicators
  - Due dates with overdue warnings
  - Syncs with Google Tasks mobile & web apps
- ✅ **Spotify Integration**: 8 playback control tools
  - Play, pause, next/previous track
  - Get current track info
  - Search music, set volume
- ✅ **Google Calendar**: 4 calendar management tools
  - List events, get today's schedule
  - Create events with natural date parsing
  - Get next meeting
- ✅ **Gmail Integration**: 4 email tools
  - Get unread count, list emails
  - Send emails, search inbox
- ✅ **GitHub Automation**: 5 git tools
  - Check status, view commit history
  - Commit changes, push to remote
  - Smart AI-generated commit messages
- ✅ OAuth infrastructure with secure token storage
- ✅ AES-256-GCM encrypted token management
- ✅ Graceful shutdown handling
- ✅ Structured logging system

### 🚀 Coming Soon
- 🎙️ **Voice Mode**: Speech-to-text and text-to-speech
- 🔍 **Web Search**: Real-time information from the web
- 🎵 **Extended Spotify**: Playlists, recommendations
- 🎨 **Better UX**: Command history, autocomplete
- 📊 **Analytics**: Track productivity and usage

## 🛠️ Installation

### Option 1: Install from GitHub (Recommended)

```bash
# Install globally from GitHub
npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git

# Run JARVIS from anywhere
jarvis start
```

The package will automatically build after installation.

### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/SouptikTaran/jarvis-cli.git
cd jarvis-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link

# Run JARVIS
jarvis start
# or
npm start
```

### Requirements

- Node.js 18.0.0 or higher
- npm or yarn
- Internet connection for AI features

## 📚 Quick Start

### First Time Users

```bash
# Run the interactive tutorial
jarvis tutorial

# Or view help
jarvis help

# Check system status
jarvis status
```

## 🎮 Usage

### First Run - Interactive Setup
On your first run, JARVIS will guide you through a complete setup:

```bash
npm start
```

**Setup Steps:**
1. **Gemini API Key** (Required)
   - Get free key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   
2. **Choose Optional Services:**
   - 🎵 **Spotify** - Music control and playback
   - 📅 **Google** - Calendar, Gmail, and Tasks
   - ✨ **Both** - Full integration
   - ⏭️ **Skip** - Set up later

3. **Automatic Authentication**
   - If you choose Spotify or Google, JARVIS will automatically:
     - Open your browser for OAuth
     - Save encrypted access tokens
     - Test the connection

All credentials are **encrypted with AES-256-GCM** and stored in `~/.jarvis/credentials.json`.

### What You'll Need

**For Spotify Integration:**
- Spotify Client ID & Secret from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

**For Google Services:**
- Google Client ID & Secret from [Google Cloud Console](https://console.cloud.google.com)
- Enables: Calendar, Gmail, and Tasks APIs

### Command Line Interface

```bash
# Start interactive chat
jarvis
jarvis start
jarvis chat         # Alias for start

# Help & Documentation
jarvis help         # Comprehensive command reference
jarvis tutorial     # Interactive learning experience
jarvis status       # System health & service status

# Configuration Management
jarvis config setup              # Interactive credential setup
jarvis config show               # View credential status (masked)
jarvis config reset              # Delete all credentials
jarvis config update-gemini      # Update Gemini API key
jarvis config test-connection    # Test AI connection
jarvis config backup [path]      # Backup credentials
jarvis config restore <path>     # Restore from backup

# Authentication
jarvis auth spotify              # Authenticate Spotify
jarvis auth google               # Authenticate Google services
jarvis auth status               # Check auth status
jarvis auth logout <service>     # Logout (spotify/google/all)

# Version & Help
jarvis --version    # Show version
jarvis --help       # Show help
```

### Natural Language Examples

**General AI:**
- "What is TypeScript?"
- "Explain quantum computing simply"
- "Write a Python function to reverse a string"

**Spotify Control:**
- "What song is playing?"
- "Pause the music"
- "Search for Bohemian Rhapsody"
- "Set volume to 50"
- "Play some jazz"
- "Next song"

**Calendar Management:**
- "What's on my calendar today?"
- "When is my next meeting?"
- "Create a meeting tomorrow at 2pm called Team Sync"
- "List my events this week"

**Email (Gmail):**
- "How many unread emails do I have?"
- "Show me my recent emails"
- "Send an email to john@example.com about the project"
- "Search emails about budget"

**Tasks (Google Tasks):**
- "Add a task to finish the report"
- "Show my tasks"
- "Complete task 1"
- "Delete task about meeting"
- "What tasks are overdue?"

**Git Operations:**
- "Commit the current code"
- "Push the changes"
- "What's the git status?"
- "Show git log"
- "Create branch feature-x"

**File Operations:**
- "List files in this directory"
- "Read the package.json file"
- "What time is it?"

## 🏗️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- TypeScript

### Development Setup
```bash
# Install dependencies
npm install

# Start development mode (auto-reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure
```
src/
├── index.ts              # Main entry point with CLI commands
├── cli/
│   └── interface.ts      # Terminal UI with Inquirer
├── agent/
│   ├── core.ts           # Main agent coordinator
│   ├── gemini.ts         # Gemini AI client with chat
│   ├── memory.ts         # Conversation memory management
│   └── tools/
│       ├── base.ts       # Tool abstraction
│       ├── registry.ts   # Tool registry system
│       ├── system.ts     # File & system tools (4)
│       ├── tasks.ts      # Task management tools (4)
│       ├── spotify.ts    # Spotify playback tools (8)
│       ├── calendar.ts   # Google Calendar tools (4)
│       ├── email.ts      # Gmail tools (4)
│       └── git.ts        # GitHub automation tools (4)
├── auth/
│   ├── oauth.ts          # OAuth base provider
│   ├── spotify.ts        # Spotify OAuth
│   └── google.ts         # Google OAuth (Calendar + Gmail)
├── config/
│   ├── encryption.ts     # AES-256-GCM encryption
│   └── tokenStorage.ts   # Secure token management
└── utils/
    └── logger.ts         # Logging utilities
```

## 📋 Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] **Sprint 1.1**: Project setup + Basic CLI
- [x] **Sprint 1.2**: Gemini AI integration + Tool calling
- [x] **Sprint 1.3**: Function calling fixes

### Phase 2: Integrations ✅ COMPLETE
- [x] **Sprint 2.1**: OAuth infrastructure + Spotify tools
- [x] **Sprint 2.2**: Conversation memory + Task management + Email + Git automation ← *Current*

### Phase 3: Enhancement 🚀 NEXT
- [ ] **Sprint 3.1**: Voice input/output
- [ ] **Sprint 3.2**: Web search integration
- [ ] **Sprint 3.3**: Advanced UX improvements
- [ ] **Sprint 2.2**: Spotify integration
- [ ] **Sprint 2.3**: Google Calendar integration

### Phase 3: Polish (Week 3)
- [ ] **Sprint 3.1**: Advanced system tools
- [ ] **Sprint 3.2**: UX improvements
- [ ] **Sprint 3.3**: Multi-turn memory

## 🔧 Configuration

JARVIS will create a config file at `~/.jarvis/config.json` on first run:

```json
{
  "gemini": {
    "apiKey": "your-gemini-api-key"
  },
  "spotify": {
    "clientId": "your-spotify-client-id",
    "clientSecret": "your-spotify-client-secret"
  },
  "google": {
    "clientId": "your-google-client-id",
    "clientSecret": "your-google-client-secret"
  },
  "preferences": {
    "verbose": false,
    "debug": false,
    "voiceMode": false
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent conversations
- Spotify Web API for music integration
- Google Calendar API for scheduling

---

**Built with ❤️ by [Souptik Taran](https://github.com/souptik-taran)**