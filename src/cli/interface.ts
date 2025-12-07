import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import ora from 'ora';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import { JarvisAgent } from '../agent/core';
import { CredentialStorage } from '../config/credentialStorage';
import { TokenStorage } from '../config/tokenStorage';
import { SpotifyOAuth } from '../auth/spotify';
import { GoogleOAuth } from '../auth/google';
import { OAuthConfig } from '../auth/oauth';

export interface CLIOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class JarvisCLI {
  private logger: Logger;
  private jarvisAgent: JarvisAgent | null = null;
  private isRunning: boolean = false;
  private credentialStorage: CredentialStorage;

  constructor(private options: CLIOptions = {}) {
    this.logger = new Logger(options);
    this.credentialStorage = new CredentialStorage(this.logger);
  }

  async start(): Promise<void> {
    try {
      this.displayWelcome();
      
      // Check for credentials on first run
      await this.checkAndSetupCredentials();
      
      // Initialize JARVIS Agent
      await this.initializeAgent();
      
      this.isRunning = true;

      // Main interaction loop
      while (this.isRunning) {
        await this.handleUserInput();
      }
    } catch (error) {
      this.logger.error('CLI Error:', error);
    }
  }

  private async checkAndSetupCredentials(): Promise<void> {
    // Check if Gemini API key exists
    const hasGemini = await this.credentialStorage.hasCredential('geminiApiKey');
    
    if (!hasGemini) {
      console.log('');
      console.log(chalk.hex('#FFD700').bold('  ✨ Welcome to JARVIS! Let\'s get you set up.'));
      console.log('');
      console.log(chalk.hex('#00D9FF')('  ╔═══════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#00D9FF')('  ║ ') + chalk.hex('#FFFFFF').bold('Step 1: Gemini AI Setup') + chalk.hex('#FF6B6B')(' (Required)') + '             ' + chalk.hex('#00D9FF')('║'));
      console.log(chalk.hex('#00D9FF')('  ╚═══════════════════════════════════════════════════╝'));
      console.log('');
      console.log(chalk.hex('#666666')('  Get your free API key from:'));
      console.log(chalk.hex('#4285F4')('  → https://makersuite.google.com/app/apikey'));
      console.log('');

      const geminiAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'geminiApiKey',
          message: 'Enter your Gemini API Key:',
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return 'Gemini API key is required';
            }
            return true;
          }
        }
      ]);

      const credentials: any = {
        geminiApiKey: geminiAnswer.geminiApiKey.trim()
      };

      // Save Gemini key first
      await this.credentialStorage.saveCredentials(credentials);

      // Step 2: Optional Services
      console.log('');
      console.log(chalk.hex('#00D9FF')('  ╔═══════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#00D9FF')('  ║ ') + chalk.hex('#FFFFFF').bold('Step 2: Optional Integrations') + chalk.hex('#666666')(' (Recommended)') + '   ' + chalk.hex('#00D9FF')('║'));
      console.log(chalk.hex('#00D9FF')('  ╚═══════════════════════════════════════════════════╝'));
      console.log('');
      console.log(chalk.hex('#666666')('  Authenticate with services for enhanced features'));
      console.log('');

      const setupChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to set up?',
          choices: [
            { name: '🎵 Spotify (music control)', value: 'spotify' },
            { name: '📅 Google (Calendar, Gmail, Tasks)', value: 'google' },
            { name: '✨ Both Spotify and Google', value: 'both' },
            { name: '⏭️  Skip for now (you can authenticate later)', value: 'skip' }
          ]
        }
      ]);

      // Setup Spotify if chosen
      if (setupChoice.choice === 'spotify' || setupChoice.choice === 'both') {
        await this.authenticateSpotify();
        // Wait for server to fully close before next authentication
        if (setupChoice.choice === 'both') {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Setup Google if chosen
      if (setupChoice.choice === 'google' || setupChoice.choice === 'both') {
        await this.authenticateGoogle();
      }

      // Load credentials into process.env
      const envVars = await this.credentialStorage.toEnvFormat();
      Object.assign(process.env, envVars);

      console.log(chalk.green('\n✅ Setup complete!'));
      console.log(chalk.gray('Credentials: ~/.jarvis/credentials.json (encrypted)'));
      if (setupChoice.choice !== 'skip') {
        console.log(chalk.gray('OAuth Tokens: ~/.jarvis/tokens.json (encrypted)\n'));
      }

      if (setupChoice.choice === 'skip') {
        console.log(chalk.yellow('\n💡 You can authenticate later with:'));
        console.log(chalk.white('   • node dist/index.js auth spotify'));
        console.log(chalk.white('   • node dist/index.js auth google\n'));
      }
    } else {
      // Load existing credentials into process.env
      const envVars = await this.credentialStorage.toEnvFormat();
      Object.assign(process.env, envVars);
    }
  }

  private async authenticateSpotify(): Promise<void> {
    console.log(chalk.cyan('\n🎵 Spotify Authentication'));
    console.log(chalk.gray('Opening browser for authorization...\n'));

    try {
      const config: OAuthConfig = {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        redirectUri: 'http://127.0.0.1:8888/callback',
        scopes: [
          'user-read-playback-state',
          'user-modify-playback-state',
          'user-read-currently-playing',
          'streaming',
          'playlist-read-private',
          'playlist-read-collaborative'
        ]
      };

      if (!config.clientId || !config.clientSecret) {
        console.log(chalk.yellow('⚠️  Spotify credentials not found in .env file'));
        console.log(chalk.gray('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env or authenticate later\n'));
        return;
      }

      const spotifyAuth = new SpotifyOAuth(config, this.logger);
      const tokenStorage = new TokenStorage(this.logger);
      const tokens = await spotifyAuth.authenticate();
      await tokenStorage.saveTokens('spotify', tokens);

      console.log(chalk.green('✅ Spotify authenticated successfully!'));
    } catch (error) {
      ErrorHandler.handleOAuthError('Spotify');
      this.logger.error('Spotify auth error:', error);
    }
  }

  private async authenticateGoogle(): Promise<void> {
    console.log(chalk.cyan('\n📅 Google Services Authentication'));
    console.log(chalk.gray('Opening browser for authorization...'));
    console.log(chalk.gray('This enables: Calendar, Gmail, and Tasks\n'));

    try {
      const config: OAuthConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: 'http://localhost:8888/callback',
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/tasks'
        ]
      };

      if (!config.clientId || !config.clientSecret) {
        console.log(chalk.yellow('⚠️  Google credentials not found in .env file'));
        console.log(chalk.gray('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env or authenticate later\n'));
        return;
      }

      const googleAuth = new GoogleOAuth(config, this.logger);
      const tokenStorage = new TokenStorage(this.logger);
      const tokens = await googleAuth.authenticate();
      await tokenStorage.saveTokens('google', tokens);

      console.log(chalk.green('✅ Google authenticated successfully!'));
      console.log(chalk.gray('   • Calendar access enabled'));
      console.log(chalk.gray('   • Gmail access enabled'));
      console.log(chalk.gray('   • Tasks access enabled'));
    } catch (error) {
      ErrorHandler.handleOAuthError('Google');
      this.logger.error('Google auth error:', error);
    }
  }

  private async initializeAgent(): Promise<void> {
    const spinner = ora('Initializing JARVIS AI brain and tools...').start();
    
    try {
      this.jarvisAgent = new JarvisAgent(this.options);
      
      // Test the connection
      const isConnected = await this.jarvisAgent.testConnection();
      
      if (isConnected) {
        const toolCount = this.jarvisAgent.getAvailableTools().length;
        spinner.succeed(chalk.green(`🧠 JARVIS AI online with ${toolCount} tools ready!`));
        ErrorHandler.provideContextualHelp('chat');
      } else {
        spinner.warn(chalk.yellow('⚠️  AI brain connected but may have issues'));
        ErrorHandler.handleAPIKeyError();
      }
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to connect to AI brain'));
      ErrorHandler.handleAPIKeyError();
      this.logger.error('Agent initialization error:', error);
    }
  }

  private displayWelcome(): void {
    console.clear();
    
    // Modern gradient-style header with corrected JARVIS ASCII art
    const header = [
      '',
      chalk.hex('#00D9FF').bold('     ╔═══════════════════════════════════════════════════════╗'),
      chalk.hex('#00D9FF').bold('     ║  ') + chalk.hex('#00F5FF').bold('   ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗') + chalk.hex('#00D9FF').bold('          ║'),
      chalk.hex('#00D9FF').bold('     ║  ') + chalk.hex('#33CCFF').bold('   ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝') + chalk.hex('#00D9FF').bold('          ║'),
      chalk.hex('#00D9FF').bold('     ║  ') + chalk.hex('#66B3FF').bold('   ██║███████║██████╔╝██║   ██║██║███████╗') + chalk.hex('#00D9FF').bold('          ║'),
      chalk.hex('#00D9FF').bold('     ║  ') + chalk.hex('#9999FF').bold('██ ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║') + chalk.hex('#00D9FF').bold('          ║'),
      chalk.hex('#00D9FF').bold('     ║  ') + chalk.hex('#CC66FF').bold('╚█████║██║  ██║██║  ██║ ╚████╔╝ ██║███████║') + chalk.hex('#00D9FF').bold('          ║'),
      chalk.hex('#00D9FF').bold('     ║  ') + chalk.hex('#FF66FF').bold(' ╚════╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝') + chalk.hex('#00D9FF').bold('          ║'),
      chalk.hex('#00D9FF').bold('     ╚═══════════════════════════════════════════════════════╝'),
      '',
      chalk.hex('#FFFFFF').bold('               Just A Rather Very Intelligent System'),
      chalk.hex('#666666')('                   Powered by ') + chalk.hex('#4285F4').bold('Google Gemini') + chalk.hex('#666666')(' 🧠'),
      '',
      chalk.hex('#00FF00')('          ✓ ') + chalk.hex('#AAAAAA')('29 Tools Ready') + chalk.hex('#444444')('  │  ') + chalk.hex('#00FF00')('✓ ') + chalk.hex('#AAAAAA')('AI Online') + chalk.hex('#444444')('  │  ') + chalk.hex('#00FF00')('✓ ') + chalk.hex('#AAAAAA')('Encrypted'),
      '',
      chalk.hex('#FFD700')('          💡 ') + chalk.hex('#FFFFFF').bold('Quick Start:'),
      chalk.hex('#555555')('             • ') + chalk.hex('#00D9FF')('help') + chalk.hex('#999999')('     - View all commands'),
      chalk.hex('#555555')('             • ') + chalk.hex('#00D9FF')('tutorial') + chalk.hex('#999999')('  - Interactive learning'),
      chalk.hex('#555555')('             • ') + chalk.hex('#00D9FF')('status') + chalk.hex('#999999')('    - System health check'),
      chalk.hex('#555555')('             • ') + chalk.hex('#00D9FF')('exit') + chalk.hex('#999999')('      - End session'),
      '',
      chalk.hex('#FF6B6B')('          ───────────────────────────────────────────────────'),
      ''
    ].join('\n');

    console.log(header);
  }

  private async handleUserInput(): Promise<void> {
    try {
      // Modern styled prompt
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: chalk.hex('#00D9FF').bold('│') + chalk.hex('#FFFFFF')(' You') + chalk.hex('#00D9FF').bold(' ❯'),
          prefix: '',
        }
      ]);

      const userInput = response.command.trim();

      if (!userInput) {
        return;
      }

      // Handle exit commands
      if (this.isExitCommand(userInput)) {
        await this.handleExit();
        return;
      }

      // Process the command with AI or fallback
      await this.processCommand(userInput);

    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        await this.handleExit();
      } else {
        this.logger.error('Input Error:', error);
      }
    }
  }

  private async processCommand(input: string): Promise<void> {
    // Handle special commands
    if (input.toLowerCase() === 'help') {
      this.displayHelp();
      return;
    }

    if (input.toLowerCase() === 'clear') {
      console.clear();
      this.displayWelcome();
      return;
    }

    // Use AI if available, otherwise fallback
    if (this.jarvisAgent) {
      await this.processWithAI(input);
    } else {
      await this.processWithFallback(input);
    }
  }

  private async processWithAI(input: string): Promise<void> {
    // Show modern thinking indicator
    const spinner = ora({
      text: chalk.hex('#00D9FF')('⚡ JARVIS is processing') + chalk.hex('#666666')('...'),
      spinner: 'dots12',
      color: 'cyan'
    }).start();

    try {
      // Use streaming for better UX
      const responseStream = await this.jarvisAgent!.processStreamingRequest(input);
      
      spinner.stop();
      
      // Modern response header with gradient
      console.log('');
      console.log(chalk.hex('#00D9FF').bold('  │ ') + chalk.hex('#CC66FF').bold('JARVIS') + chalk.hex('#00D9FF').bold(' ❯'));
      console.log(chalk.hex('#222222')('  ├───────────────────────────────────────────────────'));
      console.log('');
      
      let fullResponse = '';
      
      // Stream the response with left padding
      for await (const chunk of responseStream) {
        const lines = chunk.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) process.stdout.write('\n');
          if (lines[i]) {
            process.stdout.write(chalk.hex('#E0E0E0')('  │ ') + chalk.white(lines[i]));
          }
        }
        fullResponse += chunk;
      }
      
      console.log('\n');
      console.log(chalk.hex('#222222')('  └───────────────────────────────────────────────────'));
      console.log('');
      
    } catch (error: any) {
      spinner.fail(chalk.red('AI processing failed'));
      
      // Handle specific errors with helpful messages
      if (error?.message?.includes('API key')) {
        ErrorHandler.handleAPIKeyError();
      } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
        ErrorHandler.handleRateLimitError();
      } else if (error?.message?.includes('network') || error?.message?.includes('ENOTFOUND')) {
        ErrorHandler.handleNetworkError();
      } else {
        ErrorHandler.handleGenericError(error);
      }
      
      this.logger.error('AI Error:', error);
    }
  }

  private async processWithFallback(input: string): Promise<void> {
    console.log(chalk.magenta.bold('\n🤖 JARVIS:'));
    
    // Simple pattern matching for basic responses
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      console.log(chalk.white('Hello! I\'m JARVIS. My AI brain isn\'t connected yet, but I\'m still here to help!'));
    } else if (lowerInput.includes('how are you')) {
      console.log(chalk.white('I\'m operating in basic mode. Configure my AI connection for full capabilities!'));
    } else if (lowerInput.includes('music') || lowerInput.includes('spotify')) {
      console.log(chalk.white('Music controls are coming in Sprint 2.2! I\'ll be able to play your favorite tunes soon.'));
    } else if (lowerInput.includes('calendar') || lowerInput.includes('meeting')) {
      console.log(chalk.white('Calendar management is coming in Sprint 2.3! I\'ll help you schedule meetings soon.'));
    } else {
      console.log(chalk.white(`I heard "${input}" but my AI capabilities need setup. Check the instructions above for configuring GEMINI_API_KEY.`));
    }
    
    console.log('');
  }

  private displayHelp(): void {
    const helpBox = boxen(
      chalk.cyan.bold('📚 JARVIS Command Reference') + '\n\n' +
      
      chalk.white.bold('🎯 Current Capabilities:') + '\n' +
      chalk.green('  Natural conversation') + chalk.gray(' - Chat with AI intelligence\n') +
      chalk.green('  "what time is it?"') + chalk.gray(' - Get current time\n') +
      chalk.green('  "list files"') + chalk.gray(' - Show directory contents\n') +
      chalk.green('  "read filename.txt"') + chalk.gray(' - Read file contents\n') +
      chalk.green('  help') + chalk.gray(' - Show this help\n') +
      chalk.green('  clear') + chalk.gray(' - Clear screen\n') +
      chalk.green('  quit/exit') + chalk.gray(' - Exit JARVIS\n\n') +
      
      chalk.white.bold('🚀 Coming Soon:') + '\n' +
      chalk.yellow('  🎵 "play music"') + chalk.gray(' - Spotify integration\n') +
      chalk.yellow('  📅 "schedule meeting"') + chalk.gray(' - Calendar management\n') +
      chalk.yellow('  📁 "read file.txt"') + chalk.gray(' - File operations\n') +
      chalk.yellow('  🎙️ Voice commands') + chalk.gray(' - Speech recognition\n\n') +
      
      chalk.white.bold('💡 Tips:') + '\n' +
      chalk.gray('• Talk naturally - no special syntax needed\n') +
      chalk.gray('• AI responses require GEMINI_API_KEY setup\n') +
      chalk.gray('• Use Ctrl+C for immediate exit'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    );
    
    console.log(helpBox);
  }

  private isExitCommand(input: string): boolean {
    const exitCommands = ['exit', 'quit', 'bye', 'goodbye', 'stop'];
    return exitCommands.includes(input.toLowerCase());
  }

  private async handleExit(): Promise<void> {
    this.isRunning = false;
    
    console.log('\n');
    console.log(chalk.hex('#FF6B6B')('     ═══════════════════════════════════════════════════'));
    console.log('');
    console.log(chalk.hex('#FFD700').bold('               👋  Goodbye! Thanks for using JARVIS'));
    console.log('');
    console.log(chalk.hex('#00D9FF')('                  See you next time, ') + chalk.hex('#FFFFFF').bold('human') + chalk.hex('#00D9FF')('! ✨'));
    console.log('');
    console.log(chalk.hex('#666666')('               Systems shutting down gracefully...'));
    console.log('');
    console.log(chalk.hex('#FF6B6B')('     ═══════════════════════════════════════════════════'));
    console.log('\n');
    
    // Brief pause for effect
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  stop(): void {
    this.isRunning = false;
  }
}