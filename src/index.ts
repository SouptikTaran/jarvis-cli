#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { JarvisCLI } from './cli/interface';
import { Logger } from './utils/logger';
import { SpotifyOAuth } from './auth/spotify';
import { GoogleOAuth } from './auth/google';
import { TokenStorage } from './config/tokenStorage';
import { CredentialStorage } from './config/credentialStorage';
import { OAuthConfig } from './auth/oauth';

// Load environment variables
dotenv.config();

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

    // Authentication commands
    const authCommand = program
      .command('auth')
      .description('Manage authentication for services');

    authCommand
      .command('spotify')
      .description('Authenticate with Spotify')
      .action(async () => {
        try {
          console.log(chalk.cyan('🎵 Authenticating with Spotify...'));
          
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
            console.log(chalk.red('❌ Spotify credentials not found in .env file'));
            console.log(chalk.yellow('Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env file'));
            process.exit(1);
          }

          const spotifyAuth = new SpotifyOAuth(config, logger);
          const tokenStorage = new TokenStorage(logger);

          const tokens = await spotifyAuth.authenticate();
          await tokenStorage.saveTokens('spotify', tokens);

          console.log(chalk.green('✅ Successfully authenticated with Spotify!'));
          console.log(chalk.gray('Tokens have been securely stored.'));
        } catch (error) {
          logger.error('Spotify authentication failed:', error);
          console.log(chalk.red('❌ Authentication failed'));
          process.exit(1);
        }
      });

    authCommand
      .command('google')
      .description('Authenticate with Google Calendar')
      .action(async () => {
        try {
          console.log(chalk.cyan('📅 Authenticating with Google Calendar...'));
          
          const config: OAuthConfig = {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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

          if (!config.clientId || !config.clientSecret) {
            console.log(chalk.red('❌ Google credentials not found in .env file'));
            console.log(chalk.yellow('Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file'));
            process.exit(1);
          }

          const googleAuth = new GoogleOAuth(config, logger);
          const tokenStorage = new TokenStorage(logger);

          const tokens = await googleAuth.authenticate();
          await tokenStorage.saveTokens('google', tokens);

          console.log(chalk.green('✅ Successfully authenticated with Google!'));
          console.log(chalk.gray('Tokens have been securely stored.'));
        } catch (error) {
          logger.error('Google authentication failed:', error);
          console.log(chalk.red('❌ Authentication failed'));
          process.exit(1);
        }
      });

    authCommand
      .command('status')
      .description('Check authentication status')
      .action(async () => {
        try {
          const tokenStorage = new TokenStorage(logger);
          const hasSpotify = await tokenStorage.hasTokens('spotify');
          const hasGoogle = await tokenStorage.hasTokens('google');

          console.log(chalk.cyan.bold('\n🔐 Authentication Status:\n'));
          console.log(chalk.white('Spotify:'), hasSpotify ? chalk.green('✓ Authenticated') : chalk.red('✗ Not authenticated'));
          console.log(chalk.white('Google Calendar:'), hasGoogle ? chalk.green('✓ Authenticated') : chalk.red('✗ Not authenticated'));
          console.log();
        } catch (error) {
          logger.error('Failed to check auth status:', error);
          process.exit(1);
        }
      });

    authCommand
      .command('logout')
      .description('Logout from a service')
      .argument('<service>', 'Service to logout from (spotify, google, or all)')
      .action(async (service: string) => {
        try {
          const tokenStorage = new TokenStorage(logger);

          if (service === 'all') {
            await tokenStorage.clearAll();
            console.log(chalk.green('✅ Logged out from all services'));
          } else if (service === 'spotify' || service === 'google') {
            await tokenStorage.deleteTokens(service as 'spotify' | 'google');
            console.log(chalk.green(`✅ Logged out from ${service}`));
          } else {
            console.log(chalk.red('❌ Invalid service. Use: spotify, google, or all'));
            process.exit(1);
          }
        } catch (error) {
          logger.error('Logout failed:', error);
          process.exit(1);
        }
      });

    // Credentials management
    const configCommand = program
      .command('config')
      .description('Manage API credentials');

    configCommand
      .command('setup')
      .description('Setup or update API credentials interactively')
      .action(async () => {
        try {
          const credStorage = new CredentialStorage(logger);
          console.log(chalk.cyan('🔐 API Credentials Setup\n'));

          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'geminiApiKey',
              message: 'Gemini API Key:',
              default: await credStorage.getCredential('geminiApiKey') || ''
            },
            {
              type: 'input',
              name: 'spotifyClientId',
              message: 'Spotify Client ID (optional):',
              default: await credStorage.getCredential('spotifyClientId') || ''
            },
            {
              type: 'input',
              name: 'spotifyClientSecret',
              message: 'Spotify Client Secret (optional):',
              default: await credStorage.getCredential('spotifyClientSecret') || ''
            },
            {
              type: 'input',
              name: 'googleClientId',
              message: 'Google Client ID (optional):',
              default: await credStorage.getCredential('googleClientId') || ''
            },
            {
              type: 'input',
              name: 'googleClientSecret',
              message: 'Google Client Secret (optional):',
              default: await credStorage.getCredential('googleClientSecret') || ''
            }
          ]);

          const credentials: any = {};
          if (answers.geminiApiKey) credentials.geminiApiKey = answers.geminiApiKey.trim();
          if (answers.spotifyClientId) credentials.spotifyClientId = answers.spotifyClientId.trim();
          if (answers.spotifyClientSecret) credentials.spotifyClientSecret = answers.spotifyClientSecret.trim();
          if (answers.googleClientId) credentials.googleClientId = answers.googleClientId.trim();
          if (answers.googleClientSecret) credentials.googleClientSecret = answers.googleClientSecret.trim();

          await credStorage.saveCredentials(credentials);
          console.log(chalk.green('\n✅ Credentials saved securely!'));
          console.log(chalk.gray('Stored in: ~/.jarvis/credentials.json (encrypted)\n'));
        } catch (error) {
          logger.error('Config setup failed:', error);
          process.exit(1);
        }
      });

    configCommand
      .command('show')
      .description('Show current credential status (masked)')
      .action(async () => {
        try {
          const credStorage = new CredentialStorage(logger);
          const creds = await credStorage.loadCredentials();

          console.log(chalk.cyan.bold('\n🔐 Credential Status:\n'));
          console.log(chalk.white('Gemini API Key:'), creds.geminiApiKey ? chalk.green('✓ Configured') : chalk.red('✗ Not set'));
          console.log(chalk.white('Spotify Client ID:'), creds.spotifyClientId ? chalk.green('✓ Configured') : chalk.gray('○ Optional'));
          console.log(chalk.white('Spotify Client Secret:'), creds.spotifyClientSecret ? chalk.green('✓ Configured') : chalk.gray('○ Optional'));
          console.log(chalk.white('Google Client ID:'), creds.googleClientId ? chalk.green('✓ Configured') : chalk.gray('○ Optional'));
          console.log(chalk.white('Google Client Secret:'), creds.googleClientSecret ? chalk.green('✓ Configured') : chalk.gray('○ Optional'));
          console.log();
        } catch (error) {
          logger.error('Failed to show config:', error);
          process.exit(1);
        }
      });

    configCommand
      .command('reset')
      .description('Delete all stored credentials')
      .action(async () => {
        try {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to delete all credentials?',
              default: false
            }
          ]);

          if (confirm) {
            const credStorage = new CredentialStorage(logger);
            credStorage.deleteCredentials();
            console.log(chalk.green('✅ All credentials deleted'));
          } else {
            console.log(chalk.yellow('Cancelled'));
          }
        } catch (error) {
          logger.error('Reset failed:', error);
          process.exit(1);
        }
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