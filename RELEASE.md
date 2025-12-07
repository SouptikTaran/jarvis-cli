# 🚀 Release Guide for JARVIS CLI

This guide explains how to create releases and distribute JARVIS CLI binaries.

## 📦 Release Methods

### Method 1: Automated Release via GitHub Actions (Recommended)

GitHub Actions automatically builds binaries for all platforms when you create a release tag.

#### Step-by-Step:

1. **Update Version Number**
   ```bash
   # Update version in package.json
   npm version patch  # For bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # For new features (1.0.0 -> 1.1.0)
   npm version major  # For breaking changes (1.0.0 -> 2.0.0)
   ```

2. **Update CHANGELOG.md**
   - Document all changes in the new version
   - List new features, bug fixes, improvements

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "chore: bump version to v1.0.1"
   git push origin main
   ```

4. **Create and Push Tag**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

5. **GitHub Actions Builds Everything!**
   - Workflow automatically triggers
   - Builds for Windows, macOS (Intel + ARM), Linux
   - Creates GitHub Release with binaries
   - Generates release notes

6. **Monitor Progress**
   - Go to GitHub → Actions tab
   - Watch the build progress
   - When complete, check Releases tab

#### What Gets Built:
- ✅ `jarvis-cli-win-x64.exe` - Windows 64-bit
- ✅ `jarvis-cli-macos-x64` - macOS Intel
- ✅ `jarvis-cli-macos-arm64` - macOS Apple Silicon
- ✅ `jarvis-cli-linux-x64` - Linux 64-bit

---

### Method 2: Manual Release (For Testing)

Build binaries locally before creating a release.

#### Build for Current Platform:
```bash
npm run package
```

#### Build for All Platforms:
```bash
npm run package:all
```

Binaries will be in the `release/` directory.

#### Test the Binary:
```bash
# Windows
./release/jarvis-cli-win-x64.exe start

# macOS/Linux
chmod +x ./release/jarvis-cli-macos-x64
./release/jarvis-cli-macos-x64 start
```

---

## 📋 Release Checklist

Before creating a release:

- [ ] All tests pass locally
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] Version bumped in package.json
- [ ] All changes committed and pushed
- [ ] Build succeeds locally (`npm run build`)
- [ ] Manual testing completed

---

## 🏷️ Version Numbering

We follow [Semantic Versioning](https://semver.org/):

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR** (1.x.x): Breaking changes
  - API changes that break compatibility
  - Removed features
  - Major architectural changes

- **MINOR** (x.1.x): New features
  - New commands or tools
  - New integrations
  - Backward-compatible additions

- **PATCH** (x.x.1): Bug fixes
  - Bug fixes
  - Performance improvements
  - Documentation updates

**Examples:**
- `1.0.0` → `1.0.1` - Fixed OAuth bug
- `1.0.1` → `1.1.0` - Added voice mode
- `1.1.0` → `2.0.0` - Changed config format (breaking)

---

## 📝 Writing Release Notes

Good release notes include:

### Template:
```markdown
## What's New in v1.1.0

### ✨ New Features
- 🎙️ Voice mode: Speech-to-text and text-to-speech
- 🔍 Web search integration
- 📊 Usage analytics dashboard

### 🐛 Bug Fixes
- Fixed OAuth redirect issue (#123)
- Resolved token expiration handling (#145)
- Fixed Windows path issues (#167)

### 🚀 Improvements
- 30% faster AI response times
- Better error messages
- Improved help documentation

### 📚 Documentation
- Added voice mode tutorial
- Updated installation guide
- New troubleshooting section

### ⚠️ Breaking Changes
None

### 🙏 Contributors
Thanks to @user1, @user2 for their contributions!

### 📦 Installation
Download the binary for your platform or install via npm:
\`\`\`bash
npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git
\`\`\`
```

---

## 🔧 GitHub Actions Configuration

The workflow file is at `.github/workflows/release.yml`

### How It Works:

1. **Trigger**: Runs when you push a tag starting with `v`
2. **Build Matrix**: Builds on Windows, macOS, Ubuntu
3. **Package**: Uses `pkg` to create standalone executables
4. **Upload**: Attaches binaries to GitHub Release
5. **Release Notes**: Auto-generates from commits

### Troubleshooting GitHub Actions:

**Build fails:**
- Check Actions tab for error logs
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**Binaries not attached:**
- Check artifact upload step
- Verify file paths in workflow
- Ensure `pkg` installed correctly

**Permission denied:**
- Check repository Settings → Actions → General
- Enable "Read and write permissions" for GITHUB_TOKEN

---

## 📥 Download Instructions for Users

Add this to your GitHub Releases page:

```markdown
## 📥 Installation

### Option 1: Download Binary (No Node.js Required!)

**Windows:**
1. Download `jarvis-cli-win-x64.exe`
2. Move to a folder in your PATH or run directly
3. Open Command Prompt or PowerShell
4. Run: `jarvis-cli-win-x64.exe start`

**macOS (Intel):**
1. Download `jarvis-cli-macos-x64`
2. Open Terminal
3. Run: `chmod +x jarvis-cli-macos-x64`
4. Run: `./jarvis-cli-macos-x64 start`

**macOS (Apple Silicon):**
1. Download `jarvis-cli-macos-arm64`
2. Open Terminal
3. Run: `chmod +x jarvis-cli-macos-arm64`
4. Run: `./jarvis-cli-macos-arm64 start`

**Linux:**
1. Download `jarvis-cli-linux-x64`
2. Open Terminal
3. Run: `chmod +x jarvis-cli-linux-x64`
4. Run: `./jarvis-cli-linux-x64 start`

### Option 2: Install via npm

Requires Node.js 18+:
\`\`\`bash
npm install -g git+https://github.com/SouptikTaran/jarvis-cli.git
jarvis start
\`\`\`

### First Run Setup
JARVIS will guide you through:
1. Getting your free Gemini API key
2. Setting up optional integrations (Spotify, Google)
3. Testing the connection

Run `jarvis tutorial` for an interactive guide!
```

---

## 🎯 Release Workflow Example

Complete example of creating v1.1.0:

```bash
# 1. Make sure you're on main and up to date
git checkout main
git pull origin main

# 2. Update CHANGELOG.md with new features/fixes
# Edit CHANGELOG.md manually

# 3. Bump version
npm version minor  # Creates v1.1.0

# 4. Push changes
git push origin main

# 5. Push tag (this triggers GitHub Actions)
git push origin v1.1.0

# 6. Wait for GitHub Actions to complete
# Go to: https://github.com/SouptikTaran/jarvis-cli/actions

# 7. Check the release
# Go to: https://github.com/SouptikTaran/jarvis-cli/releases

# 8. Edit release notes if needed
# Add detailed description, screenshots, breaking changes

# 9. Announce release!
# - Update README.md if needed
# - Post on social media
# - Notify users
```

---

## 📊 Monitoring Releases

### Key Metrics to Track:

1. **Downloads**: How many times each binary was downloaded
2. **Issues**: New issues after release
3. **Stars/Forks**: Community interest
4. **Feedback**: User comments and reactions

### GitHub Insights:
- **Traffic**: Insights → Traffic
- **Releases**: See download counts
- **Issues**: Track bug reports
- **Discussions**: User feedback

---

## 🔄 Hotfix Releases

For urgent bug fixes:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix the bug
# Edit files...

# 3. Test thoroughly
npm run build
npm start

# 4. Commit and merge to main
git add .
git commit -m "fix: critical OAuth bug"
git checkout main
git merge hotfix/critical-bug

# 5. Bump patch version
npm version patch  # e.g., 1.0.0 -> 1.0.1

# 6. Push and tag
git push origin main
git push origin v1.0.1

# 7. GitHub Actions builds and releases automatically
```

---

## 🎉 Post-Release Tasks

After releasing:

- [ ] Test the binaries on each platform
- [ ] Update social media
- [ ] Respond to release feedback
- [ ] Monitor for issues
- [ ] Update documentation if needed
- [ ] Thank contributors
- [ ] Plan next release features

---

## 🆘 Troubleshooting

### "pkg not found" error:
```bash
npm install -g pkg
```

### Binary won't run on macOS:
```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine jarvis-cli-macos-x64
```

### GitHub Actions permission denied:
1. Go to Settings → Actions → General
2. Under "Workflow permissions"
3. Select "Read and write permissions"
4. Save

### Release not created:
- Check Actions logs
- Verify tag format (must start with `v`)
- Ensure GITHUB_TOKEN has permissions

---

## 📖 Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pkg Documentation](https://github.com/vercel/pkg)

---

**Happy Releasing! 🚀**
