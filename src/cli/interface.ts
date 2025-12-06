import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import { Logger } from '../utils/logger';

export interface CLIOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class JarvisCLI {
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(private options: CLIOptions = {}) {
    this.logger = new Logger(options);
  }

  async start(): Promise<void> {
    try {
      this.displayWelcome();
      this.isRunning = true;

      // Main interaction loop
      while (this.isRunning) {
        await this.handleUserInput();
      }
    } catch (error) {
      this.logger.error('CLI Error:', error);
    }
  }

  private displayWelcome(): void {
    const welcomeMessage = boxen(
      chalk.cyan.bold('🤖 JARVIS AI Assistant') + '\n\n' +
      chalk.white('Your intelligent terminal companion') + '\n' +
      chalk.gray('Type your requests in natural language') + '\n' +
      chalk.gray('Type "exit" or "quit" to leave') + '\n' +
      chalk.gray('Use Ctrl+C for immediate exit'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: 'black'
      }
    );

    console.clear();
    console.log(welcomeMessage);
    
    this.logger.info('JARVIS is ready! How can I assist you?');
  }

  private async handleUserInput(): Promise<void> {
    try {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: chalk.cyan('🤖'),
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

      // Display user input
      this.logger.user(userInput);

      // Process the command (placeholder for now)
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
    // Placeholder processing - will integrate with Gemini later
    this.logger.jarvis(`I received: "${input}"`);
    this.logger.jarvis('Processing capabilities coming soon...');
    
    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Basic responses for testing
    if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
      this.logger.jarvis('Hello! I\'m JARVIS, your AI assistant. I\'m still learning, but I\'ll help you soon!');
    } else if (input.toLowerCase().includes('help')) {
      this.displayHelp();
    } else {
      this.logger.jarvis('I understand you said something, but my full capabilities are still being developed. Coming soon!');
    }
  }

  private displayHelp(): void {
    const helpText = `
${chalk.cyan.bold('📚 JARVIS Help')}

${chalk.white.bold('Available Commands:')}
  ${chalk.green('hello, hi')} - Greet JARVIS
  ${chalk.green('help')} - Show this help message
  ${chalk.green('exit, quit')} - Exit JARVIS

${chalk.white.bold('Coming Soon:')}
  🎵 Spotify control (play, pause, search music)
  📅 Calendar management (meetings, events)
  📁 File operations (read, create, summarize)
  🤖 Full AI conversation with Gemini

${chalk.gray('Use natural language for all commands!')}
    `;
    
    console.log(helpText);
  }

  private isExitCommand(input: string): boolean {
    const exitCommands = ['exit', 'quit', 'bye', 'goodbye', 'stop'];
    return exitCommands.includes(input.toLowerCase());
  }

  private async handleExit(): Promise<void> {
    this.logger.jarvis('Goodbye! Have a great day! 👋');
    this.isRunning = false;
  }

  stop(): void {
    this.isRunning = false;
  }
}