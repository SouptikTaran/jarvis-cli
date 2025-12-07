import fs from 'fs';
import path from 'path';
import os from 'os';
import { BaseTool, ToolDefinition, ToolResult } from './base';
import { Logger } from '../../utils/logger';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: number;
  completedAt?: number;
}

export interface TaskStorage {
  tasks: Task[];
  lastUpdated: number;
}

/**
 * Base class for task management tools
 */
abstract class TaskBaseTool extends BaseTool {
  protected tasksFile: string;

  constructor(protected logger: Logger) {
    super();
    const tasksDir = path.join(os.homedir(), '.jarvis');
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
    this.tasksFile = path.join(tasksDir, 'tasks.json');
  }

  protected loadTasks(): Task[] {
    try {
      if (!fs.existsSync(this.tasksFile)) {
        return [];
      }
      const data = fs.readFileSync(this.tasksFile, 'utf-8');
      const storage: TaskStorage = JSON.parse(data);
      return storage.tasks || [];
    } catch (error) {
      this.logger.error('Failed to load tasks:', error);
      return [];
    }
  }

  protected saveTasks(tasks: Task[]): void {
    try {
      const storage: TaskStorage = {
        tasks,
        lastUpdated: Date.now()
      };
      fs.writeFileSync(this.tasksFile, JSON.stringify(storage, null, 2));
    } catch (error) {
      this.logger.error('Failed to save tasks:', error);
      throw new Error('Failed to save tasks');
    }
  }

  protected generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected formatTask(task: Task): string {
    const status = task.completed ? '✅' : '⬜';
    const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
    let line = `${status} ${priority} ${task.title}`;
    
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const now = new Date();
      const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        line += ` (⚠️ ${Math.abs(daysUntil)} days overdue)`;
      } else if (daysUntil === 0) {
        line += ` (📅 Due today)`;
      } else if (daysUntil === 1) {
        line += ` (📅 Due tomorrow)`;
      } else if (daysUntil <= 7) {
        line += ` (📅 Due in ${daysUntil} days)`;
      }
    }
    
    if (task.description) {
      line += `\n   ${task.description}`;
    }
    
    return line;
  }
}

/**
 * Add a new task
 */
export class AddTaskTool extends TaskBaseTool {
  definition: ToolDefinition = {
    name: 'add_task',
    description: '[DEPRECATED] Use add_google_task instead. Local task storage - prefer Google Tasks for sync across devices.',
    category: 'system',
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'Task title or summary',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'Optional task description or notes',
        required: false
      },
      {
        name: 'priority',
        type: 'string',
        description: 'Task priority: low, medium, or high (default: medium)',
        required: false,
        enum: ['low', 'medium', 'high']
      },
      {
        name: 'due_date',
        type: 'string',
        description: 'Due date in ISO format or natural language (e.g., "2025-12-10", "tomorrow", "next week")',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const tasks = this.loadTasks();
      
      const newTask: Task = {
        id: this.generateId(),
        title: parameters.title,
        description: parameters.description,
        completed: false,
        priority: (parameters.priority as 'low' | 'medium' | 'high') || 'medium',
        dueDate: parameters.due_date,
        createdAt: Date.now()
      };

      tasks.push(newTask);
      this.saveTasks(tasks);

      return {
        success: true,
        data: newTask,
        message: `Task added: "${newTask.title}" (Priority: ${newTask.priority})`
      };
    } catch (error) {
      this.logger.error('Failed to add task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add task'
      };
    }
  }
}

/**
 * List all tasks
 */
export class ListTasksTool extends TaskBaseTool {
  definition: ToolDefinition = {
    name: 'list_tasks',
    description: '[DEPRECATED] Use list_google_tasks instead. Local task storage - prefer Google Tasks for sync across devices.',
    category: 'system',
    parameters: [
      {
        name: 'filter',
        type: 'string',
        description: 'Filter tasks: all, pending, completed (default: pending)',
        required: false,
        enum: ['all', 'pending', 'completed']
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const allTasks = this.loadTasks();
      const filter = parameters.filter || 'pending';

      let tasks = allTasks;
      if (filter === 'pending') {
        tasks = allTasks.filter(t => !t.completed);
      } else if (filter === 'completed') {
        tasks = allTasks.filter(t => t.completed);
      }

      if (tasks.length === 0) {
        return {
          success: true,
          data: [],
          message: filter === 'completed' ? 'No completed tasks.' : 'No pending tasks. Great job!'
        };
      }

      // Sort by priority (high first) and due date
      tasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });

      const message = tasks.map((t, i) => `${i + 1}. ${this.formatTask(t)}`).join('\n');

      return {
        success: true,
        data: tasks,
        message: `Tasks (${filter}):\n${message}`
      };
    } catch (error) {
      this.logger.error('Failed to list tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tasks'
      };
    }
  }
}

/**
 * Complete a task
 */
export class CompleteTaskTool extends TaskBaseTool {
  definition: ToolDefinition = {
    name: 'complete_task',
    description: '[DEPRECATED] Use complete_google_task instead. Local task storage - prefer Google Tasks for sync across devices.',
    category: 'system',
    parameters: [
      {
        name: 'identifier',
        type: 'string',
        description: 'Task number (e.g., "1", "2") or partial task title',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const tasks = this.loadTasks();
      const identifier = parameters.identifier.toString().toLowerCase();

      // Find task by number or title
      const pendingTasks = tasks.filter(t => !t.completed);
      let taskToComplete: Task | undefined;

      // Try as number first
      const taskNum = parseInt(identifier);
      if (!isNaN(taskNum) && taskNum > 0 && taskNum <= pendingTasks.length) {
        taskToComplete = pendingTasks[taskNum - 1];
      } else {
        // Search by title
        taskToComplete = pendingTasks.find(t => 
          t.title.toLowerCase().includes(identifier)
        );
      }

      if (!taskToComplete) {
        return {
          success: false,
          error: `Task not found: "${parameters.identifier}"`
        };
      }

      taskToComplete.completed = true;
      taskToComplete.completedAt = Date.now();
      this.saveTasks(tasks);

      return {
        success: true,
        data: taskToComplete,
        message: `✅ Completed: "${taskToComplete.title}"`
      };
    } catch (error) {
      this.logger.error('Failed to complete task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete task'
      };
    }
  }
}

/**
 * Delete a task
 */
export class DeleteTaskTool extends TaskBaseTool {
  definition: ToolDefinition = {
    name: 'delete_task',
    description: '[DEPRECATED] Use delete_google_task instead. Local task storage - prefer Google Tasks for sync across devices.',
    category: 'system',
    parameters: [
      {
        name: 'identifier',
        type: 'string',
        description: 'Task number or partial task title',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const tasks = this.loadTasks();
      const identifier = parameters.identifier.toString().toLowerCase();

      let taskIndex = -1;

      // Try as number first
      const taskNum = parseInt(identifier);
      if (!isNaN(taskNum) && taskNum > 0 && taskNum <= tasks.length) {
        taskIndex = taskNum - 1;
      } else {
        // Search by title
        taskIndex = tasks.findIndex(t => 
          t.title.toLowerCase().includes(identifier)
        );
      }

      if (taskIndex === -1) {
        return {
          success: false,
          error: `Task not found: "${parameters.identifier}"`
        };
      }

      const deletedTask = tasks[taskIndex]!;
      tasks.splice(taskIndex, 1);
      this.saveTasks(tasks);

      return {
        success: true,
        data: deletedTask,
        message: `🗑️ Deleted: "${deletedTask.title}"`
      };
    } catch (error) {
      this.logger.error('Failed to delete task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      };
    }
  }
}
