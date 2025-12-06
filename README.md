# 🤖 JARVIS CLI

An intelligent terminal-based AI assistant powered by Google's Gemini, with Spotify and Google Calendar integrations.

## ✨ Features

### 🎯 Implemented
- ✅ Interactive terminal interface with Inquirer
- ✅ Natural language input processing via Gemini AI
- ✅ Function calling system with tool registry
- ✅ File operations (read, write, list files)
- ✅ OAuth infrastructure for Spotify & Google Calendar
- ✅ Secure token storage with AES-256-GCM encryption
- ✅ **Spotify Integration**: 8 playback control tools
  - Play, pause, next/previous track
  - Get current track info
  - Search music
  - Set volume
  - Play specific tracks
- ✅ Graceful shutdown handling
- ✅ Structured logging system

### 🚀 Coming Soon
- 📅 **Google Calendar Tools**: Schedule meetings, check agenda
- 🎵 **Extended Spotify**: Playlists, shuffle, repeat modes
- 💬 **Conversation Memory**: Multi-turn context
- 🎨 **Better UX**: Command history, autocomplete
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

### Environment Setup
Create a `.env` file with your API credentials:

```env
# Required: Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Optional: Spotify Integration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Optional: Google Calendar Integration  
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Authentication

```bash
# Authenticate with Spotify
jarvis auth spotify

# Authenticate with Google Calendar
jarvis auth google

# Check authentication status
jarvis auth status

# Logout from a service
jarvis auth logout spotify
jarvis auth logout google
jarvis auth logout all
```

### Interactive Mode

```bash
# Start JARVIS
jarvis

# Or with options
jarvis --debug
jarvis --verbose
```

Once in interactive mode, use natural language:
- "What song is playing?"
- "Pause the music"
- "Search for Bohemian Rhapsody"
- "Set volume to 50"
- "List files in this directory"
- "Read the package.json file"
- "What time is it?"

### Command Line Interface

```bash
# Start with specific command
jarvis start

# Authentication commands
jarvis auth <command>

# Show help
jarvis --help
```

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
│   ├── gemini.ts         # Gemini AI client
│   └── tools/
│       ├── base.ts       # Tool abstraction
│       ├── registry.ts   # Tool registry system
│       ├── system.ts     # File & system tools
│       └── spotify.ts    # Spotify playback tools
├── auth/
│   ├── oauth.ts          # OAuth base provider
│   ├── spotify.ts        # Spotify OAuth
│   └── google.ts         # Google OAuth
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

### Phase 2: Integrations ⚡ IN PROGRESS
- [x] **Sprint 2.1**: OAuth infrastructure + Spotify tools ← *Current*
- [ ] **Sprint 2.2**: Google Calendar tools
- [ ] **Sprint 2.3**: Extended Spotify features
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