import fs from 'fs/promises';
import path from 'path';
import { BaseTool, ToolDefinition, ToolResult } from './base';
import { Logger } from '../../utils/logger';

export class ReadFileTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'read_file',
    description: 'Read the contents of a text file',
    category: 'file',
    parameters: [
      {
        name: 'filepath',
        type: 'string',
        description: 'Path to the file to read (relative or absolute)',
        required: true
      }
    ]
  };

  constructor(private logger: Logger) {
    super();
  }

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { filepath } = parameters;
      const resolvedPath = path.resolve(filepath);
      
      // Security check - prevent reading system files
      if (this.isSystemFile(resolvedPath)) {
        return {
          success: false,
          error: 'Access denied: Cannot read system files'
        };
      }
      
      const content = await fs.readFile(resolvedPath, 'utf-8');
      
      return {
        success: true,
        data: content,
        message: `Successfully read ${content.length} characters from ${filepath}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file'
      };
    }
  }

  private isSystemFile(filepath: string): boolean {
    const systemPaths = [
      '/etc/',
      '/sys/',
      '/proc/',
      'C:\\Windows\\',
      'C:\\System32\\'
    ];
    
    return systemPaths.some(sysPath => filepath.startsWith(sysPath));
  }
}

export class WriteFileTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'write_file',
    description: 'Write content to a text file (creates or overwrites)',
    category: 'file',
    parameters: [
      {
        name: 'filepath',
        type: 'string',
        description: 'Path where to write the file',
        required: true
      },
      {
        name: 'content',
        type: 'string',
        description: 'Content to write to the file',
        required: true
      }
    ]
  };

  constructor(private logger: Logger) {
    super();
  }

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { filepath, content } = parameters;
      const resolvedPath = path.resolve(filepath);
      
      // Security check
      if (this.isSystemFile(resolvedPath)) {
        return {
          success: false,
          error: 'Access denied: Cannot write to system locations'
        };
      }
      
      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(resolvedPath, content, 'utf-8');
      
      return {
        success: true,
        message: `Successfully wrote ${content.length} characters to ${filepath}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file'
      };
    }
  }

  private isSystemFile(filepath: string): boolean {
    const systemPaths = [
      '/etc/',
      '/sys/',
      '/proc/',
      'C:\\Windows\\',
      'C:\\System32\\'
    ];
    
    return systemPaths.some(sysPath => filepath.startsWith(sysPath));
  }
}

export class ListDirectoryTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'list_directory',
    description: 'List files and directories in a given path',
    category: 'file',
    parameters: [
      {
        name: 'directory',
        type: 'string',
        description: 'Directory path to list (defaults to current directory)',
        required: false
      }
    ]
  };

  constructor(private logger: Logger) {
    super();
  }

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const directory = parameters.directory || '.';
      const resolvedPath = path.resolve(directory);
      
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      
      const files = entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
      
      const directories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          files,
          directories,
          totalItems: entries.length
        },
        message: `Found ${files.length} files and ${directories.length} directories in ${directory}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory'
      };
    }
  }
}

export class GetCurrentTimeTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_current_time',
    description: 'Get the current date and time',
    category: 'system',
    parameters: [
      {
        name: 'format',
        type: 'string',
        description: 'Time format preference',
        required: false,
        enum: ['iso', 'local', 'timestamp']
      }
    ]
  };

  constructor(private logger: Logger) {
    super();
  }

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    const now = new Date();
    const format = parameters.format || 'local';
    
    let timeString: string;
    
    switch (format) {
      case 'iso':
        timeString = now.toISOString();
        break;
      case 'timestamp':
        timeString = now.getTime().toString();
        break;
      case 'local':
      default:
        timeString = now.toLocaleString();
        break;
    }
    
    return {
      success: true,
      data: {
        formatted: timeString,
        iso: now.toISOString(),
        timestamp: now.getTime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      message: `Current time: ${timeString}`
    };
  }
}