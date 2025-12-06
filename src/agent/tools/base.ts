export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  category: 'system' | 'spotify' | 'calendar' | 'file' | 'web';
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export abstract class BaseTool {
  abstract definition: ToolDefinition;
  
  abstract execute(parameters: Record<string, any>): Promise<ToolResult>;
  
  validateParameters(parameters: Record<string, any>): string | null {
    for (const param of this.definition.parameters) {
      if (param.required && !(param.name in parameters)) {
        return `Missing required parameter: ${param.name}`;
      }
      
      if (param.name in parameters) {
        const value = parameters[param.name];
        
        // Type validation
        if (param.type === 'string' && typeof value !== 'string') {
          return `Parameter ${param.name} must be a string`;
        }
        if (param.type === 'number' && typeof value !== 'number') {
          return `Parameter ${param.name} must be a number`;
        }
        if (param.type === 'boolean' && typeof value !== 'boolean') {
          return `Parameter ${param.name} must be a boolean`;
        }
        if (param.type === 'array' && !Array.isArray(value)) {
          return `Parameter ${param.name} must be an array`;
        }
        
        // Enum validation
        if (param.enum && !param.enum.includes(value)) {
          return `Parameter ${param.name} must be one of: ${param.enum.join(', ')}`;
        }
      }
    }
    
    return null;
  }
}