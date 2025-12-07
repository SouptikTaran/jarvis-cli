import chalk from 'chalk';

export class ErrorHandler {
  static handleAPIKeyError(): void {
    console.log(chalk.red('\n✗ Invalid or missing Gemini API Key\n'));
    console.log(chalk.yellow('Quick Fix:'));
    console.log(chalk.white('  1. Get a free API key: ' + chalk.cyan('https://makersuite.google.com/app/apikey')));
    console.log(chalk.white('  2. Update your key: ' + chalk.cyan('jarvis config update-gemini')));
    console.log(chalk.white('  3. Test connection: ' + chalk.cyan('jarvis config test-connection\n')));
  }

  static handleTokenExpiredError(service: 'spotify' | 'google'): void {
    console.log(chalk.red(`\n✗ ${service.charAt(0).toUpperCase() + service.slice(1)} tokens have expired\n`));
    console.log(chalk.yellow('Quick Fix:'));
    console.log(chalk.white(`  Re-authenticate: ${chalk.cyan(`jarvis auth ${service}`)}\n`));
  }

  static handleServiceUnavailableError(service: string): void {
    console.log(chalk.red(`\n✗ ${service} service is currently unavailable\n`));
    console.log(chalk.yellow('Possible causes:'));
    console.log(chalk.white('  • Internet connection issue'));
    console.log(chalk.white('  • Service temporary outage'));
    console.log(chalk.white('  • Rate limit exceeded\n'));
    console.log(chalk.gray('Try again in a few moments.'));
  }

  static handleNetworkError(): void {
    console.log(chalk.red('\n✗ Network connection error\n'));
    console.log(chalk.yellow('Quick Fix:'));
    console.log(chalk.white('  • Check your internet connection'));
    console.log(chalk.white('  • Try again in a few moments'));
    console.log(chalk.white('  • Check your firewall settings\n'));
  }

  static handleRateLimitError(): void {
    console.log(chalk.red('\n✗ Rate limit exceeded\n'));
    console.log(chalk.yellow('What this means:'));
    console.log(chalk.white('  You\'ve made too many requests in a short time.\n'));
    console.log(chalk.gray('Wait a few minutes and try again.'));
  }

  static handleOAuthError(service: string): void {
    console.log(chalk.red(`\n✗ ${service} authentication failed\n`));
    console.log(chalk.yellow('Troubleshooting:'));
    console.log(chalk.white('  1. Make sure you approved the authorization'));
    console.log(chalk.white(`  2. Re-run: ${chalk.cyan(`jarvis auth ${service.toLowerCase()}`)}`));
    console.log(chalk.white(`  3. Check status: ${chalk.cyan('jarvis auth status')}\n`));
  }

  static handleGenericError(error: any): void {
    if (error?.message?.includes('ENOTFOUND') || error?.message?.includes('ECONNREFUSED')) {
      ErrorHandler.handleNetworkError();
      return;
    }

    if (error?.response?.status === 429) {
      ErrorHandler.handleRateLimitError();
      return;
    }

    if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
      console.log(chalk.red('\n✗ Authentication error\n'));
      console.log(chalk.yellow('Quick Fix:'));
      console.log(chalk.white(`  Check authentication: ${chalk.cyan('jarvis auth status')}`));
      console.log(chalk.white(`  View system status: ${chalk.cyan('jarvis status')}\n`));
      return;
    }

    if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
      ErrorHandler.handleAPIKeyError();
      return;
    }

    // Generic error
    console.log(chalk.red('\n✗ An error occurred\n'));
    console.log(chalk.gray(`Error: ${error?.message || 'Unknown error'}\n`));
    console.log(chalk.yellow('Need help?'));
    console.log(chalk.white(`  View help: ${chalk.cyan('jarvis help')}`));
    console.log(chalk.white(`  Check status: ${chalk.cyan('jarvis status')}`));
    console.log(chalk.white(`  View tutorial: ${chalk.cyan('jarvis tutorial')}\n`));
  }

  static provideContextualHelp(context: 'startup' | 'chat' | 'tool-execution'): void {
    switch (context) {
      case 'startup':
        console.log(chalk.yellow('\n💡 First time using JARVIS?\n'));
        console.log(chalk.white(`  Run the tutorial: ${chalk.cyan('jarvis tutorial')}`));
        console.log(chalk.white(`  View all commands: ${chalk.cyan('jarvis help')}`));
        console.log(chalk.white(`  Check system status: ${chalk.cyan('jarvis status')}\n`));
        break;

      case 'chat':
        console.log(chalk.gray('\n💡 Tips:'));
        console.log(chalk.gray('  • Ask natural questions: "play some jazz", "what\'s my schedule?"'));
        console.log(chalk.gray('  • Type "exit" or "quit" to end the session'));
        console.log(chalk.gray('  • JARVIS remembers conversation context\n'));
        break;

      case 'tool-execution':
        console.log(chalk.gray('\n💡 Tip: JARVIS can control Spotify, manage calendars, handle emails, and more!'));
        console.log(chalk.gray(`   Run: ${chalk.cyan('jarvis tutorial')} to learn about all features\n`));
        break;
    }
  }
}
