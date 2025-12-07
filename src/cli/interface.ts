import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import ora from 'ora';
import { Logger } from '../utils/logger';
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
      console.log(chalk.yellow('\n🎉 Welcome to JARVIS! Let\'s get you set up.\n'));

      // Step 1: Gemini API Key (Required)
      console.log(chalk.cyan.bold('Step 1: Gemini AI Setup (Required)'));
      console.log(chalk.gray('Get your free API key from: https://makersuite.google.com/app/apikey\n'));

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

      // Step 2: Optional Services
      console.log(chalk.cyan.bold('\n\nStep 2: Optional Integrations'));
      console.log(chalk.gray('Set up Spotify and Google services for enhanced features.\n'));

      const setupChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to set up?',
          choices: [
            { name: '🎵 Spotify (music control)', value: 'spotify' },
            { name: '📅 Google (Calendar, Gmail, Tasks)', value: 'google' },
            { name: '✨ Both Spotify and Google', value: 'both' },
            { name: '⏭️  Skip for now (you can set up later)', value: 'skip' }
          ]
        }
      ]);

      // Setup Spotify if chosen
      if (setupChoice.choice === 'spotify' || setupChoice.choice === 'both') {
        await this.setupSpotify(credentials);
      }

      // Setup Google if chosen
      if (setupChoice.choice === 'google' || setupChoice.choice === 'both') {
        await this.setupGoogle(credentials);
      }

      // Save credentials
      await this.credentialStorage.saveCredentials(credentials);

      // Load credentials into process.env
      const envVars = await this.credentialStorage.toEnvFormat();
      Object.assign(process.env, envVars);

      console.log(chalk.green('\n✅ Setup complete! Your credentials are saved securely.'));
      console.log(chalk.gray('Location: ~/.jarvis/credentials.json (encrypted)\n'));

      if (setupChoice.choice === 'skip') {
        console.log(chalk.yellow('💡 You can set up integrations later with:'));
        console.log(chalk.white('   • node dist/index.js auth spotify'));
        console.log(chalk.white('   • node dist/index.js auth google\n'));
      }
    } else {
      // Load existing credentials into process.env
      const envVars = await this.credentialStorage.toEnvFormat();
      Object.assign(process.env, envVars);
    }
  }

  private async setupSpotify(credentials: any): Promise<void> {
    console.log(chalk.cyan('\n🎵 Spotify Setup'));
    console.log(chalk.gray('Get credentials from: https://developer.spotify.com/dashboard\n'));

    const spotifyAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: 'Spotify Client ID:',
        validate: (input: string) => input.trim().length > 0 || 'Client ID is required'
      },
      {
        type: 'input',
        name: 'clientSecret',
        message: 'Spotify Client Secret:',
        validate: (input: string) => input.trim().length > 0 || 'Client Secret is required'
      }
    ]);

    credentials.spotifyClientId = spotifyAnswers.clientId.trim();
    credentials.spotifyClientSecret = spotifyAnswers.clientSecret.trim();

    // Authenticate with Spotify
    console.log(chalk.cyan('\n🔐 Authenticating with Spotify...'));
    
    try {
      const config: OAuthConfig = {
        clientId: credentials.spotifyClientId,
        clientSecret: credentials.spotifyClientSecret,
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

      const spotifyAuth = new SpotifyOAuth(config, this.logger);
      const tokenStorage = new TokenStorage(this.logger);
      const tokens = await spotifyAuth.authenticate();
      await tokenStorage.saveTokens('spotify', tokens);

      console.log(chalk.green('✅ Spotify authenticated successfully!'));
    } catch (error) {
      console.log(chalk.red('❌ Spotify authentication failed'));
      this.logger.error('Spotify auth error:', error);
    }
  }

  private async setupGoogle(credentials: any): Promise<void> {
    console.log(chalk.cyan('\n📅 Google Services Setup'));
    console.log(chalk.gray('Get credentials from: https://console.cloud.google.com\n'));

    const googleAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: 'Google Client ID:',
        validate: (input: string) => input.trim().length > 0 || 'Client ID is required'
      },
      {
        type: 'input',
        name: 'clientSecret',
        message: 'Google Client Secret:',
        validate: (input: string) => input.trim().length > 0 || 'Client Secret is required'
      }
    ]);

    credentials.googleClientId = googleAnswers.clientId.trim();
    credentials.googleClientSecret = googleAnswers.clientSecret.trim();

    // Authenticate with Google
    console.log(chalk.cyan('\n🔐 Authenticating with Google...'));
    console.log(chalk.gray('This will enable Calendar, Gmail, and Tasks access.\n'));

    try {
      const config: OAuthConfig = {
        clientId: credentials.googleClientId,
        clientSecret: credentials.googleClientSecret,
        redirectUri: 'http://127.0.0.1:8888/callback',
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/tasks'
        ]
      };

      const googleAuth = new GoogleOAuth(config, this.logger);
      const tokenStorage = new TokenStorage(this.logger);
      const tokens = await googleAuth.authenticate();
      await tokenStorage.saveTokens('google', tokens);

      console.log(chalk.green('✅ Google authenticated successfully!'));
      console.log(chalk.gray('   • Calendar access enabled'));
      console.log(chalk.gray('   • Gmail access enabled'));
      console.log(chalk.gray('   • Tasks access enabled'));
    } catch (error) {
      console.log(chalk.red('❌ Google authentication failed'));
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
      } else {
        spinner.warn(chalk.yellow('⚠️  AI brain connected but may have issues'));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to connect to AI brain'));
      
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        console.log(chalk.yellow('\n💡 Setup Instructions:'));
        console.log(chalk.white('1. Get your API key from: https://makersuite.google.com/app/apikey'));
        console.log(chalk.white('2. Copy .env.example to .env'));
        console.log(chalk.white('3. Add your GEMINI_API_KEY to the .env file'));
        console.log(chalk.gray('\nJARVIS will run in basic mode without AI responses.\n'));
      }
      
      this.logger.warning('Running in basic mode without AI capabilities');
    }
  }

  private displayWelcome(): void {
    const welcomeMessage = boxen(
      chalk.cyan.bold('🤖 J.A.R.V.I.S') + chalk.white(' - Just A Rather Very Intelligent System') + '\n\n' +
      chalk.white('🎯 Powered by Google Gemini AI') + '\n' +
      chalk.white('🎵 Music control via Spotify ') + chalk.gray('(coming soon)') + '\n' +
      chalk.white('📅 Calendar management ') + chalk.gray('(coming soon)') + '\n\n' +
      chalk.green('Ready to assist with your requests!') + '\n' +
      chalk.gray('Type naturally - exit with "quit" or Ctrl+C'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    );

    console.clear();
    console.log(welcomeMessage);
  }

  private async handleUserInput(): Promise<void> {
    try {
      // Clean prompt without extra text
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: chalk.blue('❯'),
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
    // Show thinking indicator
    const spinner = ora({
      text: chalk.gray('JARVIS is thinking...'),
      spinner: 'dots'
    }).start();

    try {
      // Use streaming for better UX
      const responseStream = await this.jarvisAgent!.processStreamingRequest(input);
      
      spinner.stop();
      
      // Print response header
      console.log(chalk.magenta.bold('\n🤖 JARVIS:'));
      
      let fullResponse = '';
      
      // Stream the response
      for await (const chunk of responseStream) {
        process.stdout.write(chalk.white(chunk));
        fullResponse += chunk;
      }
      
      console.log('\n'); // Add newline after response
      
    } catch (error) {
      spinner.fail(chalk.red('AI processing failed'));
      this.logger.error('AI Error:', error);
      
      // Fallback to basic response
      await this.processWithFallback(input);
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
    console.log(chalk.magenta.bold('\n🤖 JARVIS:'), chalk.white('Powering down. Until next time! 👋\n'));
    this.isRunning = false;
  }

  stop(): void {
    this.isRunning = false;
  }
}