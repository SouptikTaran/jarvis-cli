# 🚀 JARVIS CLI - Quick Start Guide

Get up and running with JARVIS in 5 minutes!

## 📥 Step 1: Download

Choose your platform:

### Windows
Download: [`jarvis-cli-win-x64.exe`](https://github.com/SouptikTaran/jarvis-cli/releases/latest)

### macOS (Intel)
Download: [`jarvis-cli-macos-x64`](https://github.com/SouptikTaran/jarvis-cli/releases/latest)
```bash
chmod +x jarvis-cli-macos-x64
```

### macOS (Apple Silicon)
Download: [`jarvis-cli-macos-arm64`](https://github.com/SouptikTaran/jarvis-cli/releases/latest)
```bash
chmod +x jarvis-cli-macos-arm64
```

### Linux
Download: [`jarvis-cli-linux-x64`](https://github.com/SouptikTaran/jarvis-cli/releases/latest)
```bash
chmod +x jarvis-cli-linux-x64
```

---

## ⚡ Step 2: Run JARVIS

### Windows
```powershell
.\jarvis-cli-win-x64.exe start
```

### macOS/Linux
```bash
./jarvis-cli-macos-x64 start
# or
./jarvis-cli-macos-arm64 start
# or
./jarvis-cli-linux-x64 start
```

---

## 🔑 Step 3: Get Gemini API Key (Free!)

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key
5. Paste when JARVIS asks

**Free tier:** 60 requests/minute - perfect for personal use!

---

## 🎯 Step 4: Choose Integrations

JARVIS will ask which services to set up:

- **🎵 Spotify** - Music control
- **📅 Google** - Calendar, Gmail, Tasks
- **✨ Both** - All features
- **⏭️ Skip** - Just AI chat (set up later)

---

## 💬 Step 5: Start Chatting!

Try these commands:

### AI Conversations
```
You: "What can you do?"
You: "Tell me a joke"
You: "Help me write an email"
```

### File Operations
```
You: "List files in current directory"
You: "Create a file called todo.txt"
You: "Read the contents of README.md"
```

### Spotify (if enabled)
```
You: "Play some music"
You: "What song is playing?"
You: "Skip to the next track"
You: "Search for Bohemian Rhapsody"
```

### Google Calendar (if enabled)
```
You: "What's on my calendar today?"
You: "When is my next meeting?"
You: "Create an event tomorrow at 2pm"
```

### Gmail (if enabled)
```
You: "Check my unread emails"
You: "Send an email to john@example.com"
You: "Search for emails from boss"
```

### Tasks (if enabled)
```
You: "Add a task: Buy groceries"
You: "Show my tasks"
You: "Mark the first task as complete"
```

### GitHub (if enabled)
```
You: "Check git status"
You: "Show recent commits"
You: "Commit these changes"
```

---

## 🆘 Need Help?

### Built-in Help
```bash
jarvis help      # Full command reference
jarvis tutorial  # Interactive learning
jarvis status    # Check what's working
```

### Common Issues

**"Gemini API key not found"**
```bash
jarvis config update-gemini
```

**"Spotify not authenticated"**
```bash
jarvis auth spotify
```

**"Google not authenticated"**
```bash
jarvis auth google
```

**Rate limit exceeded**
- Wait 1 minute
- Or create another API key

---

## 🎓 Learn More

- **Full Documentation**: [README.md](README.md)
- **Installation Guide**: [INSTALL.md](INSTALL.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Report Issues**: [GitHub Issues](https://github.com/SouptikTaran/jarvis-cli/issues)

---

## 🎉 You're All Set!

Start exploring JARVIS:
- Ask questions
- Control your music
- Manage your calendar
- Handle emails
- Track tasks
- Automate Git workflows

**Type `exit` or press CTRL+C to quit**

---

## 💡 Pro Tips

1. **Natural Language**: Just type what you want - JARVIS understands context
2. **Conversation Memory**: JARVIS remembers your conversation
3. **Multiple Commands**: Chain requests naturally
4. **Error Help**: JARVIS provides solutions when things go wrong
5. **Tutorial**: Run `jarvis tutorial` for interactive learning

---

**Happy chatting with JARVIS! 🤖✨**
