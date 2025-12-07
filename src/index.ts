#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { JarvisCLI } from './cli/interface';
import { Logger } from './utils/logger';
import { SpotifyOAuth } from './auth/spotify';
import { GoogleOAuth } from './auth/google';
import { TokenStorage } from './config/tokenStorage';
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
              'https://www.googleapis.com/auth/gmail.modify'
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