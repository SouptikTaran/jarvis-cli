import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool, ToolDefinition, ToolResult } from './base';
import { Logger } from '../../utils/logger';

const execAsync = promisify(exec);

/**
 * Base class for Git tools
 */
abstract class GitBaseTool extends BaseTool {
  constructor(protected logger: Logger) {
    super();
  }

  /**
   * Execute git command
   */
  protected async executeGit(command: string, cwd?: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      if (stderr && !stderr.includes('warning')) {
        this.logger.debug(`Git stderr: ${stderr}`);
      }
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }
}

/**
 * Get git repository status
 */
export class GitStatusTool extends GitBaseTool {
  definition: ToolDefinition = {
    name: 'git_status',
    description: 'Check the status of the git repository, showing modified, staged, and untracked files',
    category: 'system',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      // Check if in a git repository
      try {
        await this.executeGit('git rev-parse --git-dir');
      } catch (error) {
        return {
          success: false,
          error: 'Not in a git repository'
        };
      }

      const status = await this.executeGit('git status --short');
      const branch = await this.executeGit('git branch --show-current');

      if (!status) {
        return {
          success: true,
          data: { branch, clean: true },
          message: `On branch ${branch}\nWorking tree clean`
        };
      }

      const lines = status.split('\n');
      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];

      lines.forEach(line => {
        const statusCode = line.substring(0, 2);
        const file = line.substring(3);

        if (statusCode.startsWith('?')) {
          untracked.push(file);
        } else if (statusCode[0] !== ' ') {
          staged.push(file);
        } else if (statusCode[1] !== ' ') {
          modified.push(file);
        }
      });

      let message = `On branch ${branch}\n\n`;
      
      if (staged.length > 0) {
        message += `Staged files (${staged.length}):\n${staged.map(f => `  ✓ ${f}`).join('\n')}\n\n`;
      }
      
      if (modified.length > 0) {
        message += `Modified files (${modified.length}):\n${modified.map(f => `  ✎ ${f}`).join('\n')}\n\n`;
      }
      
      if (untracked.length > 0) {
        message += `Untracked files (${untracked.length}):\n${untracked.map(f => `  ? ${f}`).join('\n')}`;
      }

      return {
        success: true,
        data: { branch, staged, modified, untracked },
        message: message.trim()
      };
    } catch (error) {
      this.logger.error('Failed to get git status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git status'
      };
    }
  }
}

/**
 * Generate smart commit message using AI
 */
export class GenerateCommitMessageTool extends GitBaseTool {
  definition: ToolDefinition = {
    name: 'generate_commit_message',
    description: 'Generate a smart commit message by analyzing git diff and changes',
    category: 'system',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      // Get diff
      const diff = await this.executeGit('git diff --cached --stat');
      
      if (!diff) {
        return {
          success: false,
          error: 'No staged changes to commit'
        };
      }

      // Get list of changed files
      const files = await this.executeGit('git diff --cached --name-only');
      const fileList = files.split('\n');

      // Simple heuristic-based commit message generation
      let message = '';
      
      // Check for common patterns
      const hasNewFiles = diff.includes('create mode');
      const hasDeletedFiles = diff.includes('delete mode');
      const hasFeatureFiles = fileList.some(f => f.includes('feature') || f.includes('tool'));
      const hasFixFiles = fileList.some(f => f.includes('fix') || f.includes('bug'));
      const hasDocsFiles = fileList.some(f => f.includes('README') || f.includes('.md'));
      const hasConfigFiles = fileList.some(f => f.includes('config') || f.includes('.json') || f.includes('.env'));

      if (hasNewFiles && hasFeatureFiles) {
        message = 'feat: Add new features and tools';
      } else if (hasFixFiles) {
        message = 'fix: Bug fixes and improvements';
      } else if (hasDocsFiles) {
        message = 'docs: Update documentation';
      } else if (hasConfigFiles) {
        message = 'chore: Update configuration';
      } else if (hasNewFiles) {
        message = 'feat: Add new functionality';
      } else if (hasDeletedFiles) {
        message = 'refactor: Remove unused code';
      } else {
        message = 'chore: Update codebase';
      }

      // Add file summary
      const summary = `\n\nChanged files:\n${fileList.map(f => `- ${f}`).join('\n')}`;

      return {
        success: true,
        data: { message, files: fileList },
        message: `Suggested commit message:\n${message}${summary}`
      };
    } catch (error) {
      this.logger.error('Failed to generate commit message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate commit message'
      };
    }
  }
}

/**
 * Commit changes with a message
 */
export class GitCommitTool extends GitBaseTool {
  definition: ToolDefinition = {
    name: 'git_commit',
    description: 'Stage all changes and commit with a message. Use when user says "commit the code" or "commit changes".',
    category: 'system',
    parameters: [
      {
        name: 'message',
        type: 'string',
        description: 'Commit message. If not provided, will generate automatically.',
        required: false
      },
      {
        name: 'stage_all',
        type: 'boolean',
        description: 'Stage all changes before committing (default: true)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const stageAll = parameters.stage_all !== false;

      // Stage all changes if requested
      if (stageAll) {
        await this.executeGit('git add -A');
        this.logger.debug('Staged all changes');
      }

      // Check if there are staged changes
      const staged = await this.executeGit('git diff --cached --name-only');
      if (!staged) {
        return {
          success: false,
          error: 'No changes to commit'
        };
      }

      // Get or generate commit message
      let message = parameters.message;
      
      if (!message) {
        // Generate message based on changes
        const diff = await this.executeGit('git diff --cached --stat');
        const files = staged.split('\n');
        
        // Simple message generation
        if (files.length === 1) {
          message = `Update ${files[0]}`;
        } else {
          message = `Update ${files.length} files`;
        }
      }

      // Commit
      await this.executeGit(`git commit -m "${message.replace(/"/g, '\\"')}"`);

      // Get commit hash
      const commitHash = await this.executeGit('git rev-parse --short HEAD');

      return {
        success: true,
        data: { commitHash, message },
        message: `✓ Committed successfully (${commitHash})\n"${message}"`
      };
    } catch (error) {
      this.logger.error('Failed to commit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to commit'
      };
    }
  }
}

/**
 * Push commits to remote
 */
export class GitPushTool extends GitBaseTool {
  definition: ToolDefinition = {
    name: 'git_push',
    description: 'Push commits to remote repository',
    category: 'system',
    parameters: [
      {
        name: 'remote',
        type: 'string',
        description: 'Remote name (default: origin)',
        required: false
      },
      {
        name: 'branch',
        type: 'string',
        description: 'Branch name (default: current branch)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const remote = parameters.remote || 'origin';
      let branch = parameters.branch;

      if (!branch) {
        branch = await this.executeGit('git branch --show-current');
      }

      // Check if there are commits to push
      try {
        const ahead = await this.executeGit(`git rev-list --count ${remote}/${branch}..HEAD`);
        if (ahead === '0') {
          return {
            success: true,
            message: 'Already up to date. Nothing to push.'
          };
        }
      } catch (error) {
        // Branch might not exist on remote yet, that's okay
        this.logger.debug('Branch may not exist on remote, pushing anyway');
      }

      // Push
      const output = await this.executeGit(`git push ${remote} ${branch}`);

      return {
        success: true,
        data: { remote, branch },
        message: `✓ Pushed to ${remote}/${branch}\n${output}`
      };
    } catch (error) {
      this.logger.error('Failed to push:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to push to remote'
      };
    }
  }
}

/**
 * Complete git workflow: stage, commit, and push
 */
export class GitCommitAndPushTool extends GitBaseTool {
  definition: ToolDefinition = {
    name: 'git_commit_and_push',
    description: 'Complete git workflow: stage all changes, commit with smart message, and push to remote. Use when user says "commit and push the code" or "push the changes".',
    category: 'system',
    parameters: [
      {
        name: 'message',
        type: 'string',
        description: 'Optional custom commit message. If not provided, will generate smart message.',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      // Step 1: Check status
      try {
        await this.executeGit('git rev-parse --git-dir');
      } catch (error) {
        return {
          success: false,
          error: 'Not in a git repository'
        };
      }

      // Step 2: Stage all changes
      await this.executeGit('git add -A');
      
      // Step 3: Check if there are changes
      const staged = await this.executeGit('git diff --cached --name-only');
      if (!staged) {
        return {
          success: false,
          error: 'No changes to commit'
        };
      }

      const fileCount = staged.split('\n').length;

      // Step 4: Generate or use provided commit message
      let message = parameters.message;
      
      if (!message) {
        // Analyze changes and generate message
        const diff = await this.executeGit('git diff --cached --stat');
        const files = staged.split('\n');
        
        const hasNewFiles = diff.includes('create mode');
        const hasFeatureFiles = files.some(f => f.includes('feature') || f.includes('tool') || f.includes('src'));
        const hasDocsFiles = files.some(f => f.includes('README') || f.includes('.md'));
        const hasConfigFiles = files.some(f => f.includes('config') || f.includes('.json'));

        if (hasNewFiles && hasFeatureFiles) {
          message = `feat: Add new features (${fileCount} files)`;
        } else if (hasDocsFiles) {
          message = `docs: Update documentation`;
        } else if (hasConfigFiles) {
          message = `chore: Update configuration`;
        } else {
          message = `chore: Update ${fileCount} file${fileCount > 1 ? 's' : ''}`;
        }
      }

      // Step 5: Commit
      await this.executeGit(`git commit -m "${message.replace(/"/g, '\\"')}"`);
      const commitHash = await this.executeGit('git rev-parse --short HEAD');

      // Step 6: Push
      const branch = await this.executeGit('git branch --show-current');
      await this.executeGit(`git push origin ${branch}`);

      return {
        success: true,
        data: { commitHash, message, branch, fileCount },
        message: `✓ Successfully committed and pushed!\n\nCommit: ${commitHash}\nMessage: "${message}"\nBranch: origin/${branch}\nFiles: ${fileCount}`
      };
    } catch (error) {
      this.logger.error('Failed to commit and push:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to commit and push'
      };
    }
  }
}

/**
 * Show git commit history
 */
export class GitLogTool extends GitBaseTool {
  definition: ToolDefinition = {
    name: 'git_log',
    description: 'Show git commit history. Use this when user asks about: "last commit", "recent commits", "commit history", "what did I commit", "show commits"',
    category: 'system',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        description: 'Number of commits to show (default: 5)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      // Check if in a git repository
      try {
        await this.executeGit('git rev-parse --git-dir');
      } catch (error) {
        return {
          success: false,
          error: 'Not in a git repository'
        };
      }

      const limit = parameters.limit || 5;
      
      // Get commit log with formatted output
      const log = await this.executeGit(
        `git log -${limit} --pretty=format:"%h|%an|%ar|%s" --abbrev-commit`
      );

      if (!log) {
        return {
          success: true,
          data: { commits: [] },
          message: 'No commits found in this repository'
        };
      }

      // Parse commits
      const commits = log.split('\n').map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });

      // Format output
      let output = `📜 Recent commits (last ${commits.length}):\n\n`;
      commits.forEach((commit, index) => {
        output += `${index + 1}. [${commit.hash}] ${commit.message}\n`;
        output += `   👤 ${commit.author} • 🕐 ${commit.date}\n\n`;
      });

      return {
        success: true,
        data: { commits },
        message: output.trim()
      };
    } catch (error) {
      this.logger.error('Failed to get commit history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get commit history'
      };
    }
  }
}
