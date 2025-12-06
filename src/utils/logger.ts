import chalk from 'chalk';

export interface LoggerOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class Logger {
  private isVerbose: boolean;
  private isDebug: boolean;

  constructor(options: LoggerOptions = {}) {
    this.isVerbose = options.verbose ?? false;
    this.isDebug = options.debug ?? false;
  }

  info(message: string, ...args: any[]): void {
    console.log(chalk.blue('ℹ'), message, ...args);
  }

  success(message: string, ...args: any[]): void {
    console.log(chalk.green('✓'), message, ...args);
  }

  warning(message: string, ...args: any[]): void {
    console.log(chalk.yellow('⚠'), message, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(chalk.red('✗'), message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(chalk.gray('🐛'), chalk.gray(message), ...args);
    }
  }

  verbose(message: string, ...args: any[]): void {
    if (this.isVerbose || this.isDebug) {
      console.log(chalk.cyan('📝'), message, ...args);
    }
  }

  jarvis(message: string, ...args: any[]): void {
    console.log(chalk.magenta.bold('🤖 JARVIS:'), message, ...args);
  }

  user(message: string, ...args: any[]): void {
    console.log(chalk.cyan.bold('👤 You:'), message, ...args);
  }

  tool(toolName: string, message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(chalk.yellow(`🔧 ${toolName}:`), message, ...args);
    }
  }
}