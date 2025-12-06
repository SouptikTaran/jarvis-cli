import { GeminiClient } from './gemini';
import { ToolRegistry } from './tools/registry';
import { ReadFileTool, WriteFileTool, ListDirectoryTool, GetCurrentTimeTool } from './tools/system';
import { Logger } from '../utils/logger';

export interface AgentOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class JarvisAgent {
  private geminiClient: GeminiClient;
  private toolRegistry: ToolRegistry;
  private logger: Logger;

  constructor(options: AgentOptions = {}) {
    this.logger = new Logger(options);
    this.toolRegistry = new ToolRegistry(this.logger);
    
    // Initialize system tools
    this.initializeTools();
    
    // Initialize Gemini client with tool registry
    this.geminiClient = new GeminiClient(this.logger, this.toolRegistry);
    
    this.logger.debug('JARVIS Agent initialized with tools and AI client');
  }

  private initializeTools(): void {
    // Register system tools
    this.toolRegistry.registerTool(new ReadFileTool(this.logger));
    this.toolRegistry.registerTool(new WriteFileTool(this.logger));
    this.toolRegistry.registerTool(new ListDirectoryTool(this.logger));
    this.toolRegistry.registerTool(new GetCurrentTimeTool(this.logger));
    
    this.logger.verbose(`Initialized ${this.toolRegistry.getToolCount()} system tools`);
  }

  async processRequest(userInput: string): Promise<string> {
    try {
      const response = await this.geminiClient.generateResponse(userInput);
      return response.text;
    } catch (error) {
      this.logger.error('Agent processing error:', error);
      return "I encountered an error processing your request. Please try again.";
    }
  }

  async processStreamingRequest(userInput: string): Promise<AsyncGenerator<string, void, unknown>> {
    const self = this;
    
    async function* streamGenerator(): AsyncGenerator<string, void, unknown> {
      try {
        const responseStream = await self.geminiClient.generateStreamingResponse(userInput);
        
        for await (const chunk of responseStream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
      } catch (error) {
        self.logger.error('Agent streaming error:', error);
        yield "I encountered an error processing your request. Please try again.";
      }
    }
    
    return streamGenerator();
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.geminiClient.testConnection();
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      return false;
    }
  }

  getAvailableTools(): string[] {
    return this.toolRegistry.getAvailableTools().map(tool => tool.name);
  }

  getToolsByCategory(category: string): string[] {
    return this.toolRegistry.getToolsByCategory(category).map(tool => tool.name);
  }

  clearConversationHistory(): void {
    this.geminiClient.clearHistory();
    this.logger.debug('Conversation history cleared');
  }

  // Add more tools in future sprints
  addSpotifyTools(): void {
    // Will be implemented in Sprint 2.2
    this.logger.debug('Spotify tools will be added in Sprint 2.2');
  }

  addCalendarTools(): void {
    // Will be implemented in Sprint 2.3
    this.logger.debug('Calendar tools will be added in Sprint 2.3');
  }
}