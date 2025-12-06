#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { JarvisCLI } from './cli/interface';
import { Logger } from './utils/logger';

const program = new Command();
const logger = new Logger();

async function main() {
  try {
    // Set up CLI program
    program
      .name('jarvis')
      .description('AI-powered terminal assistant with Spotify and Calendar integration')
      .version('1.0.0')
      .option('-v, --verbose', 'enable verbose logging')
      .option('-d, --debug', 'enable debug mode');

    program
      .command('start')
      .description('Start interactive Jarvis session')
      .action(async (options) => {
        const jarvis = new JarvisCLI({
          verbose: program.opts().verbose,
          debug: program.opts().debug,
        });
        await jarvis.start();
      });

    // Default action - start interactive mode
    program.action(async () => {
      console.log(chalk.cyan.bold('🤖 Starting JARVIS CLI...'));
      
      const jarvis = new JarvisCLI({
        verbose: program.opts().verbose,
        debug: program.opts().debug,
      });
      
      await jarvis.start();
    });

    await program.parseAsync();
    
  } catch (error) {
    logger.error('Failed to start JARVIS:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 JARVIS shutting down gracefully...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n👋 JARVIS shutting down gracefully...'));
  process.exit(0);
});

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}