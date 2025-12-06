import { BaseTool, ToolDefinition, ToolResult } from './base';
import { Logger } from '../../utils/logger';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  registerTool(tool: BaseTool): void {
    const name = tool.definition.name;
    
    if (this.tools.has(name)) {
      this.logger.warning(`Tool ${name} is already registered, overwriting`);
    }
    
    this.tools.set(name, tool);
    this.logger.debug(`Registered tool: ${name}`);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAvailableTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return this.getAvailableTools().filter(tool => tool.category === category);
  }

  async executeTool(name: string, parameters: Record<string, any>): Promise<ToolResult> {
    const tool = this.getTool(name);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`
      };
    }

    // Validate parameters
    const validationError = tool.validateParameters(parameters);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    try {
      this.logger.tool(name, `Executing with parameters:`, parameters);
      
      const result = await tool.execute(parameters);
      
      this.logger.tool(name, `Result:`, result.success ? 'success' : 'failed');
      
      return result;
      
    } catch (error) {
      this.logger.error(`Tool ${name} execution failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Generate function definitions for Gemini function calling
  getFunctionDefinitions(): any[] {
    return this.getAvailableTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((props, param) => {
          props[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum && { enum: param.enum })
          };
          return props;
        }, {} as Record<string, any>),
        required: tool.parameters
          .filter(param => param.required)
          .map(param => param.name)
      }
    }));
  }

  getToolCount(): number {
    return this.tools.size;
  }

  clearTools(): void {
    this.tools.clear();
    this.logger.debug('All tools cleared from registry');
  }
}