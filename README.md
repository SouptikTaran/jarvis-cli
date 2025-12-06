# 🤖 JARVIS CLI

An intelligent terminal-based AI assistant powered by Google's Gemini, with Spotify and Google Calendar integrations.

## ✨ Features

### 🎯 Current (Sprint 1.1)
- ✅ Interactive terminal interface
- ✅ Natural language input processing
- ✅ Graceful shutdown handling
- ✅ Structured logging system

### 🚀 Coming Soon
- 🎵 **Spotify Integration**: Play, pause, search music via voice commands
- 📅 **Google Calendar**: Schedule meetings, check agenda
- 🤖 **Gemini AI**: Full conversational AI with tool calling
- 📁 **File Operations**: Read, create, summarize files
- 🎙️ **Voice Mode**: Optional voice input/output

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/souptik-taran/jarvis-cli.git
cd jarvis-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run JARVIS
npm start
# or
npx jarvis
```

## 🎮 Usage

```bash
# Start interactive mode
jarvis

# Start with debug mode
jarvis --debug

# Show help
jarvis --help
```

### Basic Commands (Current)
- `hello` - Greet JARVIS
- `help` - Show available commands  
- `exit` - Exit the application

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
├── index.ts              # Main entry point
├── cli/
│   └── interface.ts      # Terminal UI interface
├── agent/                # AI agent logic (coming soon)
├── auth/                 # OAuth integrations (coming soon)
├── config/               # Configuration management
└── utils/
    └── logger.ts         # Logging utilities
```

## 📋 Development Roadmap

### Phase 1: Foundation (Week 1)
- [x] **Sprint 1.1**: Project setup + Basic CLI ← *Current*
- [ ] **Sprint 1.2**: Gemini AI integration
- [ ] **Sprint 1.3**: Tool calling system

### Phase 2: Integrations (Week 2)  
- [ ] **Sprint 2.1**: OAuth infrastructure
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