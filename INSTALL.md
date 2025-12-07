# 🚀 JARVIS CLI - Installation Guide

Complete installation instructions for all platforms.

## Table of Contents
- [Quick Install](#quick-install)
- [System Requirements](#system-requirements)
- [Installation Methods](#installation-methods)
- [First Run Setup](#first-run-setup)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

---

## Quick Install

```bash
npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git
jarvis start
```

That's it! JARVIS will guide you through the rest.

---

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: 9.0.0 or higher (comes with Node.js)
- **Internet Connection**: Required for AI features
- **Disk Space**: ~100MB for installation

### Supported Platforms
- ✅ Windows 10/11
- ✅ macOS 10.15+ (Catalina or newer)
- ✅ Linux (Ubuntu 20.04+, Debian, Fedora, Arch)

### Check Your Node.js Version
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

If you need to update Node.js:
- **Windows/macOS**: Download from [nodejs.org](https://nodejs.org/)
- **Linux**: Use [nvm](https://github.com/nvm-sh/nvm) for easy version management

---

## Installation Methods

### Method 1: Direct from GitHub (Recommended)

**Best for:** Users who want the latest version with automatic updates.

```bash
# Install globally
npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git

# Verify installation
jarvis --version

# Start JARVIS
jarvis start
```

**Auto-builds** after installation - no additional steps needed!

---

### Method 2: Clone and Install from Source

**Best for:** Developers who want to contribute or customize.

#### Step 1: Clone the Repository
```bash
# Clone via HTTPS
git clone https://github.com/SouptikTaran/jarvis-cli.git
cd jarvis-cli

# Or clone via SSH (if you have SSH keys set up)
git clone git@github.com:SouptikTaran/jarvis-cli.git
cd jarvis-cli
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Build the Project
```bash
npm run build
```

#### Step 4: Link Globally (Optional)
```bash
# Makes 'jarvis' command available system-wide
npm link
```

Now you can run `jarvis start` from anywhere!

#### Or Run Locally Without Linking
```bash
# From the jarvis-cli directory
npm start
```

---

## First Run Setup

JARVIS will automatically guide you through setup on first run:

### 1. Start JARVIS
```bash
jarvis start
```

### 2. Gemini API Key (Required)

You'll need a **free** Google Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key
5. Paste it when JARVIS prompts you

**Note:** The free tier includes 60 requests per minute - plenty for personal use!

### 3. Optional Services

JARVIS will ask which integrations you want:

**🎵 Spotify** (Optional)
- Control music playback
- Search and play songs
- Get current track info

**📅 Google** (Optional)
- Google Calendar (manage events)
- Gmail (read/send emails)
- Google Tasks (task management)

**✨ Both** - All features
**⏭️ Skip** - Set up later with `jarvis config`

### 4. OAuth Authentication

If you choose Spotify or Google, JARVIS will:
1. Automatically open your browser
2. Ask you to sign in and authorize
3. Save encrypted access tokens
4. Test the connection

All done automatically! 🎉

---

## Verifying Installation

### Check Version
```bash
jarvis --version
# Should show: jarvis-cli v1.0.0
```

### Run Tutorial
```bash
jarvis tutorial
```

### Check System Status
```bash
jarvis status
```

### View Help
```bash
jarvis help
```

---

## Platform-Specific Notes

### Windows

**PowerShell Execution Policy:**
If you get "execution policy" errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Git Bash Users:**
JARVIS works great in Git Bash! Just install and run normally.

### macOS

**Permission Denied:**
If you get permission errors during global install:
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

**Xcode Command Line Tools:**
If you get build errors, install Xcode tools:
```bash
xcode-select --install
```

### Linux

**NPM Global Permissions:**
Avoid using `sudo` with npm. Fix permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Missing Build Tools:**
If build fails, install build essentials:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install build-essential
```

**Fedora:**
```bash
sudo dnf groupinstall "Development Tools"
```

**Arch:**
```bash
sudo pacman -S base-devel
```

---

## Troubleshooting

### Installation Issues

**Problem:** `npm: command not found`
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/)

**Problem:** `EACCES: permission denied`
**Solution:** See platform-specific notes above for fixing npm permissions

**Problem:** Build fails with TypeScript errors
**Solution:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Issues

**Problem:** `GEMINI_API_KEY not found`
**Solution:** Run the setup wizard:
```bash
jarvis config update-gemini
```

**Problem:** Spotify/Google authentication fails
**Solution:**
1. Check internet connection
2. Ensure correct credentials in developer console
3. Try re-authenticating:
```bash
jarvis auth spotify
jarvis auth google
```

**Problem:** "Rate limit exceeded"
**Solution:** Gemini free tier limits:
- Wait a minute and try again
- Or create additional API keys at [AI Studio](https://makersuite.google.com/app/apikey)

### Getting Help

Still having issues?

1. **Check Status:** `jarvis status` - Shows what's working/broken
2. **View Logs:** Check `~/.jarvis/` directory
3. **Open Issue:** [GitHub Issues](https://github.com/SouptikTaran/jarvis-cli/issues)
4. **View Docs:** `jarvis help` and `jarvis tutorial`

---

## Updating JARVIS

### Method 1: Reinstall (Recommended)
```bash
npm uninstall -g jarvis-cli
npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git
```

Your credentials are preserved in `~/.jarvis/`!

### Method 2: Git Pull (Source Installation)
```bash
cd jarvis-cli
git pull origin main
npm install
npm run build
```

---

## Uninstallation

### Remove Global Installation
```bash
npm uninstall -g jarvis-cli
```

### Remove Credentials (Optional)
```bash
# macOS/Linux
rm -rf ~/.jarvis

# Windows (PowerShell)
Remove-Item -Recurse -Force ~\.jarvis

# Windows (Command Prompt)
rmdir /s /q %USERPROFILE%\.jarvis
```

**Warning:** This deletes all saved API keys and tokens!

---

## Next Steps

✅ Installation complete? Great! Here's what to do next:

1. **Learn the Basics:** `jarvis tutorial`
2. **Explore Commands:** `jarvis help`
3. **Start Chatting:** `jarvis start`
4. **Try Examples:**
   - "What's the weather like?" (if web search enabled)
   - "Play my favorite song on Spotify"
   - "What's on my calendar today?"
   - "Send an email to..."
   - "Create a task: Buy groceries"

---

## Developer Setup

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development workflow
- Coding standards
- How to add new features
- Pull request process

---

## Support

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/SouptikTaran/jarvis-cli/issues)
- 💡 [Feature Requests](https://github.com/SouptikTaran/jarvis-cli/issues/new)
- 🤝 [Contribute](CONTRIBUTING.md)

---

**Happy chatting with JARVIS! 🤖✨**
