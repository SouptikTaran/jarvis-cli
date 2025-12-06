🧾 PRODUCT REQUIREMENTS DOCUMENT (PRD)
Product: Jarvis CLI
Owner: Souptik Taran
Version: 1.0
Last Updated: 07 Dec 2025
🥅 1. PRODUCT GOAL

Build a terminal-based personal AI assistant (CLI) that performs natural language tasks using Gemini and executes real-world actions via integrations (Spotify, Google Calendar, Gmail, system tools, etc.).

Jarvis CLI should behave as a hands-free, intelligent, context-aware assistant similar to JARVIS from Iron Man but optimized for terminal workflows.

🔎 2. TARGET USERS
Primary:

Developers

Power users comfortable with terminal

Students who want automation

Productivity-focused individuals

Secondary:

Anyone wanting an AI agent without GUI overhead

Users wanting automation across OS & web services

⭐ 3. PRODUCT VISION

A single command:

jarvis


opens an intelligent, streaming, voice-capable assistant with real-world capabilities:

Plays music

Schedules meetings

Summarizes files

Automates coding tasks

Controls system-level operations

Talks back using TTS (optional)

Everything via natural language.

🧰 4. CORE FEATURES (MVP)

The MVP is the version you will ship to yourself in 2–3 weeks.

4.1 Conversational CLI Interface

Streaming responses from Gemini

Multi-turn memory

Clean terminal UI

Interrupt handling (Ctrl+C stops generation)

4.2 Agent with Tool Calling

Intent detection

Automatic tool invocation

Structured tool arguments (JSON)

Error recovery from failed tools

4.3 Spotify Integration

Authenticate with Spotify OAuth

Play/pause/next

Search for songs/playlists

Play a specific artist/song

Print current playing track

4.4 Google Calendar Integration

Authenticate with Google OAuth

Check today’s meetings

Check meeting at a specific hour

Book events

Cancel/reschedule events

4.5 Local System Tools

Read/summarize any file

Create/edit/delete files

Search directories

Run commands (securely, sandboxed)

Timers and reminders

4.6 Configuration

~/.jarvis/config.json

Persist OAuth tokens

Toggle features (voice, verbose logs, dev mode)

🧩 5. ADVANCED FEATURES (Post-MVP)

Not for day 1.
These are the "Jarvis vibes" features.

5.1 Voice Mode

Push-to-talk

Wake word (“Hey Jarvis”)

TTS output

5.2 Additional Integrations

Gmail read/send

Slack/Discord messages

YouTube music

Notion notes

GitHub PR summaries

5.3 Background Automations

Daily meeting summaries

Auto-remind before meetings

Auto-generate email replies

“Agent continues until task is done”

5.4 Plugins System

Users can add their own tool scripts

Plugin discovery & registry

🏗️ 6. SYSTEM ARCHITECTURE
6.1 High-Level Architecture
            ┌────────────────────────┐
            │        Terminal         │
            └───────────┬────────────┘
                        │
                 CLI Interface
                        │
            ┌───────────▼────────────┐
            │      Agent Layer       │
            │ (intent + tool routing)│
            └───────────┬────────────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
┌───────▼───────┐ ┌────▼────────┐ ┌─────▼────────┐
│ Gemini API     │ │ Tool System │ │ OAuth Layer  │
│ (LLM + tools)  │ │ (Spotify,    │ │ Google/Spotify│
│                │ │  Calendar)   │ │              │
└───────────────┘ └──────────────┘ └──────────────┘

📦 7. FEATURE REQUIREMENTS IN DETAIL
7.1 CLI INTERFACE
Requirements:

Terminal UI with streaming LLM responses

Command history

Markdown rendering (tables, lists, code)

Error message coloring (red)

Tool call logs in debug mode

User stories:

“As a user, I want to chat with Jarvis naturally.”

“As a user, I want streaming output for quick feedback.”

“As a user, I want to run Jarvis with a single command jarvis.”

7.2 AGENT SYSTEM
Requirements:

Gemini model with tool inclusion

Convert natural language → structured tool call

Retry on tool error

Summaries shown after tool execution

User stories:

“As a user, if I say ‘play Kesariya,’ Jarvis should detect it’s a Spotify request.”

“As a user, if I say ‘book a meeting tomorrow at 3,’ Jarvis should create a calendar event.”

7.3 SPOTIFY FEATURES
Requirements:

User OAuth flow

Store refresh tokens

Playback actions:

play

pause

next

previous

search & play

User stories:

“As a user, I want to play music without leaving terminal.”

“As a user, I want Jarvis to search and play automatically.”

7.4 GOOGLE CALENDAR FEATURES
Requirements:

OAuth using Google APIs

List meetings

Create events

Delete/modify events

User stories:

“As a user, I want to book meetings by just speaking/typing.”

“As a user, I want to ask about my schedule.”

7.5 SYSTEM COMMANDS
Requirements:

Safe execution (only whitelisted commands)

File reading & summarization

Directory listing

Timers

User stories:

“As a user, summarize a file instantly.”

“As a user, I want simple file ops without leaving Jarvis.”

7.6 CONFIG
Requirements:

Auto-create config on first launch

Store:

OAuth tokens

Log level

Voice mode on/off

Default tools enabled

🧪 8. NON-FUNCTIONAL REQUIREMENTS (NFRs)
Performance:

Streaming responses must start < 300ms

Tool execution < 2 seconds for Spotify/Google

Reliability:

Tool errors should be auto-handled

Config and tokens must persist safely

Security:

Mask tokens in logs

No system command execution without whitelist

Token encryption (AES) recommended

Scalability:

Tools should be modular & pluggable

New integrations require no change in core agent

🛠️ 9. TECH STACK
Language:

Node.js (TypeScript)

APIs:

Gemini API

Spotify Web API

Google Calendar API

Terminal UI:

ink or blessed for UI

chalk for colors

OAuth:

open (to auto-open browser)

express for callback server

🚀 10. PHASED DEVELOPMENT PLAN
Phase 1 — Core CLI & Agent

Build CLI TUI

Integrate Gemini streaming

Add tool registry

Add system tools

Phase 2 — Spotify + Google

Spotify OAuth

Play/pause/search

Google Calendar OAuth

List + create events

Phase 3 — UX & Stability

Error recovery

Logging system

Config file

Phase 4 — Voice Mode (optional)

Mic input

TTS responses

Wake word

📌 11. SUCCESS METRICS
Functional:

≥90% success rate for tool calling

<1 sec median response time

UX:

Users use >10 commands per session

Streaming feels snappy

Music control feels instant

Reliability:

OAuth tokens never break unexpectedly

Error recovery works for 95% tool failures