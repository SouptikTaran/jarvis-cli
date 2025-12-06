import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import ora from 'ora';
import { Logger } from '../utils/logger';
import { JarvisAgent } from '../agent/core';

export interface CLIOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class JarvisCLI {
  private logger: Logger;
  private jarvisAgent: JarvisAgent | null = null;
  private isRunning: boolean = false;

  constructor(private options: CLIOptions = {}) {
    this.logger = new Logger(options);
  }

  async start(): Promise<void> {
    try {
      this.displayWelcome();
      
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