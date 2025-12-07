import { BaseTool, ToolDefinition, ToolResult } from './base';
import { Logger } from '../../utils/logger';
import { TokenStorage } from '../../config/tokenStorage';

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
}

interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

/**
 * Base class for Google Tasks tools
 */
abstract class GoogleTasksBaseTool extends BaseTool {
  protected tokenStorage: TokenStorage;
  protected baseUrl = 'https://tasks.googleapis.com/tasks/v1';

  constructor(protected logger: Logger) {
    super();
    this.tokenStorage = new TokenStorage(logger);
  }

  /**
   * Make authenticated request to Google Tasks API
   */
  protected async makeTasksRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    try {
      const tokens = await this.tokenStorage.loadTokens('google');
      if (!tokens || !tokens.accessToken) {
        throw new Error('Not authenticated with Google. Run: node dist/index.js auth google');
      }

      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.status === 401) {
        // Token expired, try to refresh
        if (tokens.refreshToken) {
          await this.refreshToken(tokens.refreshToken);
          // Retry the request
          return this.makeTasksRequest(endpoint, method, body);
        }
        throw new Error('Authentication expired. Please re-authenticate with Google.');
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Tasks API error (${response.status}): ${error}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Google Tasks API request failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(refreshToken: string): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newTokens: any = {
        accessToken: data.access_token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + (data.expires_in * 1000)
      };
      await this.tokenStorage.saveTokens('google', newTokens);
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get the default task list ID
   */
  protected async getDefaultTaskList(): Promise<string> {
    try {
      const data = await this.makeTasksRequest('/users/@me/lists');
      if (data.items && data.items.length > 0) {
        // Return the first list (usually "My Tasks")
        return data.items[0].id;
      }
      throw new Error('No task lists found');
    } catch (error) {
      this.logger.error('Failed to get task list:', error);
      throw error;
    }
  }

  /**
   * Format priority from description
   */
  protected extractPriority(notes?: string): 'low' | 'medium' | 'high' {
    if (!notes) return 'medium';
    const lowerNotes = notes.toLowerCase();
    if (lowerNotes.includes('[high]') || lowerNotes.includes('🔴')) return 'high';
    if (lowerNotes.includes('[low]') || lowerNotes.includes('🟢')) return 'low';
    return 'medium';
  }

  /**
   * Format notes with priority indicator
   */
  protected formatNotesWithPriority(notes: string | undefined, priority: 'low' | 'medium' | 'high'): string {
    const priorityTag = priority === 'high' ? '🔴 [HIGH]' : priority === 'low' ? '🟢 [LOW]' : '🟡 [MEDIUM]';
    return notes ? `${priorityTag}\n${notes}` : priorityTag;
  }
}

/**
 * Add a task to Google Tasks
 */
export class AddGoogleTaskTool extends GoogleTasksBaseTool {
  definition: ToolDefinition = {
    name: 'add_google_task',
    description: 'Add a new task to Google Tasks. ALWAYS use this tool when user wants to: "add task", "create task", "remember to", "todo", "add todo". Syncs across all devices.',
    category: 'tasks',
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'Task title',
        required: true
      },
      {
        name: 'notes',
        type: 'string',
        description: 'Additional notes or description for the task',
        required: false
      },
      {
        name: 'priority',
        type: 'string',
        description: 'Task priority: low, medium, or high (default: medium)',
        required: false
      },
      {
        name: 'due_date',
        type: 'string',
        description: 'Due date in YYYY-MM-DD format',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { title, notes, priority = 'medium', due_date } = parameters;

      if (!title) {
        return {
          success: false,
          error: 'Task title is required'
        };
      }

      const taskListId = await this.getDefaultTaskList();
      
      const taskData: any = {
        title,
        notes: this.formatNotesWithPriority(notes, priority),
        status: 'needsAction'
      };

      if (due_date) {
        // Google Tasks expects RFC 3339 timestamp
        taskData.due = `${due_date}T00:00:00.000Z`;
      }

      const task = await this.makeTasksRequest(
        `/lists/${taskListId}/tasks`,
        'POST',
        taskData
      );

      const priorityEmoji = priority === 'high' ? '🔴' : priority === 'low' ? '🟢' : '🟡';
      let message = `✓ Task added to Google Tasks!\n\n${priorityEmoji} ${title}`;
      
      if (notes) {
        message += `\n📝 ${notes}`;
      }
      
      if (due_date) {
        message += `\n📅 Due: ${due_date}`;
      }

      return {
        success: true,
        data: { taskId: task.id, title, priority, dueDate: due_date },
        message
      };
    } catch (error) {
      this.logger.error('Failed to add Google task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add task to Google Tasks'
      };
    }
  }
}

/**
 * List tasks from Google Tasks
 */
export class ListGoogleTasksTool extends GoogleTasksBaseTool {
  definition: ToolDefinition = {
    name: 'list_google_tasks',
    description: 'List tasks from Google Tasks. ALWAYS use this tool when user wants to: "show tasks", "list tasks", "my tasks", "what tasks", "todos". Shows synced tasks from all devices.',
    category: 'tasks',
    parameters: [
      {
        name: 'filter',
        type: 'string',
        description: 'Filter tasks: all, pending, or completed (default: all)',
        required: false
      },
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of tasks to return (default: 20)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { filter = 'all', max_results = 20 } = parameters;
      const taskListId = await this.getDefaultTaskList();

      let endpoint = `/lists/${taskListId}/tasks?maxResults=${max_results}`;
      
      // Google Tasks API: showCompleted and showHidden parameters
      if (filter === 'pending') {
        endpoint += '&showCompleted=false';
      } else if (filter === 'completed') {
        endpoint += '&showCompleted=true&showHidden=true';
      }

      const data = await this.makeTasksRequest(endpoint);
      const tasks: GoogleTask[] = data.items || [];

      // Filter by completion status if needed
      let filteredTasks = tasks;
      if (filter === 'pending') {
        filteredTasks = tasks.filter(t => t.status === 'needsAction');
      } else if (filter === 'completed') {
        filteredTasks = tasks.filter(t => t.status === 'completed');
      }

      if (filteredTasks.length === 0) {
        return {
          success: true,
          data: { tasks: [], count: 0 },
          message: filter === 'completed' 
            ? 'No completed tasks found'
            : 'No tasks found. Add one with "add a task"!'
        };
      }

      // Format tasks
      let message = `📋 Google Tasks (${filteredTasks.length} ${filter === 'all' ? 'total' : filter}):\n\n`;
      
      filteredTasks.forEach((task, index) => {
        const status = task.status === 'completed' ? '✅' : '⬜';
        const priority = this.extractPriority(task.notes);
        const priorityEmoji = priority === 'high' ? '🔴' : priority === 'low' ? '🟢' : '🟡';
        
        message += `${index + 1}. ${status} ${priorityEmoji} ${task.title}`;
        
        if (task.due) {
          const dueDate = new Date(task.due);
          const now = new Date();
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil < 0) {
            message += ` (⚠️ ${Math.abs(daysUntil)} days overdue)`;
          } else if (daysUntil === 0) {
            message += ` (📅 Due today)`;
          } else if (daysUntil === 1) {
            message += ` (📅 Due tomorrow)`;
          } else if (daysUntil <= 7) {
            message += ` (📅 Due in ${daysUntil} days)`;
          }
        }
        
        if (task.notes) {
          // Remove priority tags from display
          const cleanNotes = task.notes
            .replace(/🔴 \[HIGH\]\n?/g, '')
            .replace(/🟡 \[MEDIUM\]\n?/g, '')
            .replace(/🟢 \[LOW\]\n?/g, '')
            .trim();
          if (cleanNotes) {
            message += `\n   📝 ${cleanNotes}`;
          }
        }
        
        message += '\n\n';
      });

      return {
        success: true,
        data: { tasks: filteredTasks, count: filteredTasks.length },
        message: message.trim()
      };
    } catch (error) {
      this.logger.error('Failed to list Google tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Google Tasks'
      };
    }
  }
}

/**
 * Complete a task in Google Tasks
 */
export class CompleteGoogleTaskTool extends GoogleTasksBaseTool {
  definition: ToolDefinition = {
    name: 'complete_google_task',
    description: 'Mark a task as completed in Google Tasks. ALWAYS use this tool when user wants to: "complete task", "done task", "finish task", "mark done". Specify task by number or title.',
    category: 'tasks',
    parameters: [
      {
        name: 'task_identifier',
        type: 'string',
        description: 'Task number (e.g., "1", "2") or task title to complete',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { task_identifier } = parameters;

      if (!task_identifier) {
        return {
          success: false,
          error: 'Task identifier is required'
        };
      }

      const taskListId = await this.getDefaultTaskList();
      
      // Get all pending tasks
      const data = await this.makeTasksRequest(
        `/lists/${taskListId}/tasks?showCompleted=false&maxResults=100`
      );
      const tasks: GoogleTask[] = data.items || [];

      // Find task by number or title
      let targetTask: GoogleTask | undefined;
      const taskNum = parseInt(task_identifier);
      
      if (!isNaN(taskNum) && taskNum > 0 && taskNum <= tasks.length) {
        targetTask = tasks[taskNum - 1];
      } else {
        targetTask = tasks.find(t => 
          t.title.toLowerCase().includes(task_identifier.toLowerCase())
        );
      }

      if (!targetTask) {
        return {
          success: false,
          error: `Task not found: ${task_identifier}`
        };
      }

      // Mark as completed
      await this.makeTasksRequest(
        `/lists/${taskListId}/tasks/${targetTask.id}`,
        'PATCH',
        { status: 'completed' }
      );

      return {
        success: true,
        data: { taskId: targetTask.id, title: targetTask.title },
        message: `✓ Completed task: "${targetTask.title}"`
      };
    } catch (error) {
      this.logger.error('Failed to complete Google task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete task'
      };
    }
  }
}

/**
 * Delete a task from Google Tasks
 */
export class DeleteGoogleTaskTool extends GoogleTasksBaseTool {
  definition: ToolDefinition = {
    name: 'delete_google_task',
    description: 'Delete a task from Google Tasks. ALWAYS use this tool when user wants to: "delete task", "remove task". Specify task by number or title.',
    category: 'tasks',
    parameters: [
      {
        name: 'task_identifier',
        type: 'string',
        description: 'Task number (e.g., "1", "2") or task title to delete',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { task_identifier } = parameters;

      if (!task_identifier) {
        return {
          success: false,
          error: 'Task identifier is required'
        };
      }

      const taskListId = await this.getDefaultTaskList();
      
      // Get all tasks (including completed)
      const data = await this.makeTasksRequest(
        `/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`
      );
      const tasks: GoogleTask[] = data.items || [];

      // Find task by number or title
      let targetTask: GoogleTask | undefined;
      const taskNum = parseInt(task_identifier);
      
      if (!isNaN(taskNum) && taskNum > 0 && taskNum <= tasks.length) {
        targetTask = tasks[taskNum - 1];
      } else {
        targetTask = tasks.find(t => 
          t.title.toLowerCase().includes(task_identifier.toLowerCase())
        );
      }

      if (!targetTask) {
        return {
          success: false,
          error: `Task not found: ${task_identifier}`
        };
      }

      // Delete the task
      await this.makeTasksRequest(
        `/lists/${taskListId}/tasks/${targetTask.id}`,
        'DELETE'
      );

      return {
        success: true,
        data: { taskId: targetTask.id, title: targetTask.title },
        message: `✓ Deleted task: "${targetTask.title}"`
      };
    } catch (error) {
      this.logger.error('Failed to delete Google task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      };
    }
  }
}
