import chalk from 'chalk';
import inquirer from 'inquirer';
import { CredentialStorage } from '../config/credentialStorage';
import { TokenStorage } from '../config/tokenStorage';
import { Logger } from './logger';

const logger = new Logger();

export function displayHelp() {
  console.log(chalk.cyan.bold('\n🤖 JARVIS CLI - Just A Rather Very Intelligent System\n'));
  
  console.log(chalk.white.bold('USAGE:'));
  console.log('  jarvis [command] [options]\n');
  
  console.log(chalk.white.bold('COMMANDS:\n'));
  
  console.log(chalk.green('  General:'));
  console.log('    start, chat          Start interactive AI chat session (default)');
  console.log('    help                 Display this help information');
  console.log('    status               Show system health and service status');
  console.log('    tutorial             Interactive tutorial for first-time users');
  console.log('    --version, -v        Display version information\n');
  
  console.log(chalk.green('  Configuration:'));
  console.log('    config setup         Interactive credential setup wizard');
  console.log('    config show          Show credential status (masked)');
  console.log('    config reset         Delete all stored credentials');
  console.log('    config update-gemini Update Gemini API key');
  console.log('    config test-connection Test Gemini AI connection');
  console.log('    config backup [path] Backup credentials to file');
  console.log('    config restore <path> Restore credentials from backup\n');
  
  console.log(chalk.green('  Authentication:'));
  console.log('    auth spotify         Authenticate with Spotify');
  console.log('    auth google          Authenticate with Google (Calendar, Gmail, Tasks)');
  console.log('    auth status          Check authentication status');
  console.log('    auth logout <service> Logout from service (spotify/google/all)\n');
  
  console.log(chalk.white.bold('AI CAPABILITIES:\n'));
  console.log(chalk.yellow('  🎵 Spotify Control:'));
  console.log('    "play some jazz", "pause music", "next song", "what\'s playing?"');
  console.log('    "play Bohemian Rhapsody", "shuffle my playlist"\n');
  
  console.log(chalk.yellow('  📅 Calendar Management:'));
  console.log('    "what\'s on my schedule today?", "create meeting tomorrow at 2pm"');
  console.log('    "list my events this week", "add dentist appointment"\n');
  
  console.log(chalk.yellow('  📧 Gmail:'));
  console.log('    "check my unread emails", "send email to john@example.com"');
  console.log('    "search emails about project X", "mark email as read"\n');
  
  console.log(chalk.yellow('  ✅ Tasks:'));
  console.log('    "add task: buy groceries", "show my tasks", "complete task 1"');
  console.log('    "delete task about meeting", "what tasks are overdue?"\n');
  
  console.log(chalk.yellow('  🔧 Git Operations:'));
  console.log('    "git status", "commit changes with message X", "push to main"');
  console.log('    "create branch feature-x", "show git log"\n');
  
  console.log(chalk.yellow('  💬 General AI:'));
  console.log('    Ask questions, get code help, brainstorm ideas, and more!\n');
  
  console.log(chalk.white.bold('EXAMPLES:\n'));
  console.log('  jarvis                    Start interactive chat');
  console.log('  jarvis config setup       Setup API credentials');
  console.log('  jarvis auth spotify       Authenticate Spotify');
  console.log('  jarvis status             Check system status');
  console.log('  jarvis help               Show this help\n');
  
  console.log(chalk.white.bold('SETUP GUIDE:\n'));
  console.log('  1. Get Gemini API key: https://makersuite.google.com/app/apikey');
  console.log('  2. Run: jarvis config setup');
  console.log('  3. Authenticate services: jarvis auth spotify');
  console.log('  4. Start chatting: jarvis start\n');
  
  console.log(chalk.gray('For more info: https://github.com/SouptikTaran/jarvis-cli\n'));
}

export async function displayStatus() {
  console.log(chalk.cyan.bold('\n🤖 JARVIS System Status\n'));
  
  try {
    const credStorage = new CredentialStorage(logger);
    const tokenStorage = new TokenStorage(logger);
    
    // Check credentials
    console.log(chalk.white.bold('📋 Credentials:'));
    const creds = await credStorage.loadCredentials();
    console.log('  Gemini API:', creds.geminiApiKey ? chalk.green('✓ Configured') : chalk.red('✗ Missing'));
    console.log('  Spotify:', (creds.spotifyClientId && creds.spotifyClientSecret) ? chalk.green('✓ Configured') : chalk.gray('○ Not configured'));
    console.log('  Google:', (creds.googleClientId && creds.googleClientSecret) ? chalk.green('✓ Configured') : chalk.gray('○ Not configured'));
    console.log();
    
    // Check authentication
    console.log(chalk.white.bold('🔐 Authentication:'));
    const hasSpotify = await tokenStorage.hasTokens('spotify');
    const hasGoogle = await tokenStorage.hasTokens('google');
    console.log('  Spotify:', hasSpotify ? chalk.green('✓ Authenticated') : chalk.gray('○ Not authenticated'));
    console.log('  Google:', hasGoogle ? chalk.green('✓ Authenticated') : chalk.gray('○ Not authenticated'));
    console.log();
    
    // Test AI connection
    console.log(chalk.white.bold('🧠 AI Connection:'));
    if (creds.geminiApiKey) {
      try {
        const envCreds = credStorage.toEnvFormat();
        Object.assign(process.env, envCreds);
        
        const { JarvisAgent } = await import('../agent/core');
        const agent = new JarvisAgent({ verbose: false, debug: false });
        const isConnected = await agent.testConnection();
        
        if (isConnected) {
          const toolNames = agent.getAvailableTools();
          console.log('  Status:', chalk.green('✓ Connected'));
          console.log('  Tools:', chalk.cyan(`${toolNames.length} available`));
          
          // Count tool categories by name patterns
          const spotify = toolNames.filter(t => t.toLowerCase().includes('spotify')).length;
          const calendar = toolNames.filter(t => t.toLowerCase().includes('calendar') || t.toLowerCase().includes('email') || t.toLowerCase().includes('gmail')).length;
          const tasks = toolNames.filter(t => t.toLowerCase().includes('task')).length;
          const git = toolNames.filter(t => t.toLowerCase().includes('git')).length;
          
          if (spotify > 0) console.log('    • Spotify:', chalk.cyan(`${spotify} tools`));
          if (calendar > 0) console.log('    • Calendar/Gmail:', chalk.cyan(`${calendar} tools`));
          if (tasks > 0) console.log('    • Tasks:', chalk.cyan(`${tasks} tools`));
          if (git > 0) console.log('    • Git:', chalk.cyan(`${git} tools`));
        } else {
          console.log('  Status:', chalk.yellow('⚠ Connection issue'));
        }
      } catch (error) {
        console.log('  Status:', chalk.red('✗ Connection failed'));
      }
    } else {
      console.log('  Status:', chalk.gray('○ No API key configured'));
    }
    console.log();
    
    // System info
    console.log(chalk.white.bold('⚙️  System:'));
    console.log('  Version:', chalk.cyan('1.0.0'));
    console.log('  Node:', chalk.cyan(process.version));
    console.log('  Storage:', chalk.cyan('~/.jarvis/'));
    console.log();
    
  } catch (error) {
    console.log(chalk.red('Failed to fetch status'));
    logger.error('Status check failed:', error);
  }
}

export async function displayTutorial() {
  console.log(chalk.cyan.bold('\n🎓 JARVIS Tutorial - Getting Started\n'));
  
  const { step } = await inquirer.prompt([{
    type: 'list',
    name: 'step',
    message: 'What would you like to learn?',
    choices: [
      { name: '1️⃣  First-time Setup (API keys & authentication)', value: 'setup' },
      { name: '2️⃣  Basic AI Chat Commands', value: 'chat' },
      { name: '3️⃣  Spotify Music Control', value: 'spotify' },
      { name: '4️⃣  Calendar & Email Management', value: 'calendar' },
      { name: '5️⃣  Task Management', value: 'tasks' },
      { name: '6️⃣  Git Commands', value: 'git' },
      { name: '↩️   Exit Tutorial', value: 'exit' }
    ]
  }]);
  
  switch (step) {
    case 'setup':
      console.log(chalk.white.bold('\n📚 First-Time Setup:\n'));
      console.log('Step 1: Get your Gemini API key');
      console.log(chalk.cyan('  → Visit: https://makersuite.google.com/app/apikey'));
      console.log(chalk.cyan('  → Create a free API key\n'));
      
      console.log('Step 2: Configure JARVIS');
      console.log(chalk.cyan('  → Run: jarvis config setup'));
      console.log(chalk.cyan('  → Enter your Gemini API key\n'));
      
      console.log('Step 3: Authenticate services (optional)');
      console.log(chalk.cyan('  → Spotify: jarvis auth spotify'));
      console.log(chalk.cyan('  → Google: jarvis auth google\n'));
      
      console.log('Step 4: Start chatting!');
      console.log(chalk.cyan('  → Run: jarvis start'));
      console.log(chalk.cyan('  → Or just: jarvis\n'));
      break;
      
    case 'chat':
      console.log(chalk.white.bold('\n💬 Basic AI Chat:\n'));
      console.log('JARVIS can help with:');
      console.log(chalk.green('  • Answering questions') + chalk.gray(' - "What is TypeScript?"'));
      console.log(chalk.green('  • Code assistance') + chalk.gray(' - "Write a Python function to sort a list"'));
      console.log(chalk.green('  • Brainstorming') + chalk.gray(' - "Give me startup ideas for AI"'));
      console.log(chalk.green('  • Explanations') + chalk.gray(' - "Explain quantum computing simply"\n'));
      
      console.log(chalk.yellow('Tips:'));
      console.log('  → Be specific in your questions');
      console.log('  → JARVIS remembers conversation context');
      console.log('  → Type "exit" or "quit" to end session\n');
      break;
      
    case 'spotify':
      console.log(chalk.white.bold('\n🎵 Spotify Control:\n'));
      console.log(chalk.yellow('Setup required:') + ' jarvis auth spotify\n');
      
      console.log('Example commands:');
      console.log(chalk.green('  "play some jazz"') + chalk.gray(' - Play music by genre'));
      console.log(chalk.green('  "play Bohemian Rhapsody"') + chalk.gray(' - Play specific song'));
      console.log(chalk.green('  "pause"') + chalk.gray(' - Pause playback'));
      console.log(chalk.green('  "next song"') + chalk.gray(' - Skip to next track'));
      console.log(chalk.green('  "what\'s playing?"') + chalk.gray(' - Show current song'));
      console.log(chalk.green('  "volume 50"') + chalk.gray(' - Set volume\n'));
      break;
      
    case 'calendar':
      console.log(chalk.white.bold('\n📅 Calendar & Email:\n'));
      console.log(chalk.yellow('Setup required:') + ' jarvis auth google\n');
      
      console.log('Calendar commands:');
      console.log(chalk.green('  "what\'s my schedule today?"'));
      console.log(chalk.green('  "create meeting tomorrow at 2pm about project X"'));
      console.log(chalk.green('  "list events this week"\n'));
      
      console.log('Email commands:');
      console.log(chalk.green('  "check unread emails"'));
      console.log(chalk.green('  "send email to john@example.com saying hello"'));
      console.log(chalk.green('  "search emails about budget"\n'));
      break;
      
    case 'tasks':
      console.log(chalk.white.bold('\n✅ Task Management:\n'));
      console.log(chalk.yellow('Setup required:') + ' jarvis auth google\n');
      
      console.log('Task commands:');
      console.log(chalk.green('  "add task: buy groceries"') + chalk.gray(' - Create task'));
      console.log(chalk.green('  "show my tasks"') + chalk.gray(' - List all tasks'));
      console.log(chalk.green('  "complete task 1"') + chalk.gray(' - Mark complete'));
      console.log(chalk.green('  "delete task about meeting"') + chalk.gray(' - Remove task\n'));
      
      console.log(chalk.yellow('Features:'));
      console.log('  → Priority levels (🔴 high, 🟡 medium, 🟢 low)');
      console.log('  → Due dates and reminders');
      console.log('  → Syncs with Google Tasks mobile app\n');
      break;
      
    case 'git':
      console.log(chalk.white.bold('\n🔧 Git Commands:\n'));
      console.log('JARVIS can help with Git operations:\n');
      
      console.log(chalk.green('  "git status"') + chalk.gray(' - Check repo status'));
      console.log(chalk.green('  "commit changes with message: fix bug"') + chalk.gray(' - Commit'));
      console.log(chalk.green('  "push to main"') + chalk.gray(' - Push changes'));
      console.log(chalk.green('  "create branch feature-login"') + chalk.gray(' - New branch'));
      console.log(chalk.green('  "show git log"') + chalk.gray(' - View history\n'));
      break;
      
    case 'exit':
      console.log(chalk.green('\n👍 Ready to start? Run: jarvis start\n'));
      return;
  }
  
  const { again } = await inquirer.prompt([{
    type: 'confirm',
    name: 'again',
    message: 'Learn about something else?',
    default: true
  }]);
  
  if (again) {
    await displayTutorial();
  } else {
    console.log(chalk.green('\n👍 Ready to start? Run: jarvis start\n'));
  }
}
