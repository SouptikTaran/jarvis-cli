# OAuth Integration Test Plan

## Sprint 2.1 - OAuth Infrastructure Complete! ✅

### What We Built
1. **OAuth Foundation** (oauth.ts)
   - Abstract OAuthProvider base class
   - Express server on port 8888 for callbacks
   - Automatic token refresh logic
   - Browser-based authorization flow

2. **Service Implementations**
   - SpotifyOAuth with proper scopes for playback control
   - GoogleOAuth with calendar access scopes
   - Both support token exchange and refresh

3. **Secure Token Storage** (tokenStorage.ts, encryption.ts)
   - AES-256-GCM encryption
   - Tokens stored in ~/.jarvis/tokens.json
   - Encryption key in ~/.jarvis/.key (mode 0600)
   - Save, load, delete, and clear methods

4. **Spotify Control Tools** (8 tools total)
   - get_current_track - Show what's playing
   - play_music - Resume playback
   - pause_music - Pause playback
   - next_track - Skip forward
   - previous_track - Skip backward
   - search_music - Search for songs/artists/albums
   - play_track - Play specific track by URI
   - set_volume - Control volume (0-100)

5. **CLI Integration**
   - `jarvis auth spotify` - Authenticate with Spotify
   - `jarvis auth google` - Authenticate with Google
   - `jarvis auth status` - Check authentication status
   - `jarvis auth logout <service>` - Logout from service
   - Auto-registration of Spotify tools when credentials present

### How to Test

#### 1. Check Auth Status
```bash
npm run start -- auth status
```
Expected: Shows authentication status for both services

#### 2. Authenticate with Spotify
```bash
npm run start -- auth spotify
```
Expected:
- Opens browser to Spotify authorization page
- After authorization, redirects to localhost:8888/callback
- Tokens are encrypted and stored
- Shows success message

#### 3. Test Spotify Tools in Interactive Mode
```bash
npm run start
```
Then ask:
- "What song is playing?" → Should use get_current_track
- "Pause the music" → Should use pause_music
- "Play music" → Should use play_music
- "Skip to next song" → Should use next_track
- "Search for Bohemian Rhapsody" → Should use search_music
- "Set volume to 50" → Should use set_volume

#### 4. Verify Token Refresh
- Wait for token to expire (check expiresAt in ~/.jarvis/tokens.json)
- Use any Spotify command
- Should automatically refresh token without user intervention

#### 5. Logout Test
```bash
npm run start -- auth logout spotify
```
Expected: Removes Spotify tokens, next command will require re-auth

### Manual Testing Required
Since we hit the Gemini API quota during development, full end-to-end testing with actual Spotify API calls requires:

1. Valid Spotify Premium account (for playback control)
2. Active Spotify session (app must be open and playing)
3. Reset Gemini API quota (wait 24 hours or upgrade)

### Files Created/Modified

**New Files:**
- src/auth/oauth.ts (131 lines) - Base OAuth provider
- src/auth/spotify.ts (89 lines) - Spotify implementation  
- src/auth/google.ts (90 lines) - Google Calendar implementation
- src/config/encryption.ts (60 lines) - AES-256-GCM encryption
- src/config/tokenStorage.ts (145 lines) - Secure token management
- src/agent/tools/spotify.ts (370 lines) - 8 Spotify control tools
- OAUTH_TEST_PLAN.md (this file)

**Modified Files:**
- src/index.ts - Added auth commands
- src/agent/core.ts - Registered Spotify tools

### Next Steps (Sprint 2.2)
1. Create Google Calendar tools (list_meetings, create_event)
2. Add more Spotify features (playlists, shuffle, repeat)
3. Improve error messages for unauthenticated state
4. Add token expiry warnings in CLI

### Next Steps (Sprint 3)
1. Improve CLI UX with better formatting
2. Add command history and autocomplete
3. Add conversation context management
4. Implement multi-turn conversations

---

## Technical Notes

### Security Considerations
- Encryption key stored with 0600 permissions (owner read/write only)
- Tokens never logged or exposed in error messages
- HTTPS-only for OAuth endpoints
- Tokens auto-refresh before expiry (5 min buffer)

### Architecture Highlights
- Clean separation: OAuth → Storage → Tools → CLI
- Dependency injection for testability
- Abstract base classes for extensibility
- Proper TypeScript typing throughout
- Error handling at every layer

### Known Limitations
1. Single user only (tokens stored per machine)
2. No token revocation callback
3. Requires Spotify Premium for playback control
4. Browser must be available for OAuth flow
5. Port 8888 must be available
