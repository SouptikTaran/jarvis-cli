import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';
import { ToolRegistry } from './tools/registry';

// Load environment variables
dotenv.config();

export interface GeminiResponse {
  text: string;
  isPartial?: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private logger: Logger;
  private conversationHistory: ConversationMessage[] = [];
  private toolRegistry: ToolRegistry | undefined;

  constructor(logger: Logger, toolRegistry?: ToolRegistry) {
    this.logger = logger;
    this.toolRegistry = toolRegistry;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure model with or without tools  
    const modelConfig: any = {
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    };
    
    // Add function definitions if tools are available
    if (this.toolRegistry && this.toolRegistry.getToolCount() > 0) {
      const functionDefs = this.toolRegistry.getFunctionDefinitions();
      modelConfig.tools = [{
        functionDeclarations: functionDefs
      }];
      this.logger.debug(`Configured model with ${this.toolRegistry.getToolCount()} tools`);
      this.logger.debug('Function definitions:', JSON.stringify(functionDefs, null, 2));
    } else {
      this.logger.debug('No tools available - model configured without functions');
    }
    
    this.model = this.genAI.getGenerativeModel(modelConfig);

    this.logger.debug('Gemini client initialized successfully');
  }

  async generateResponse(userInput: string): Promise<GeminiResponse> {
    try {
      this.logger.debug(`Sending request to Gemini: "${userInput}"`);
      
      // Add user message to history
      this.addToHistory('user', userInput);
      
      const result = await this.model.generateContent(userInput);
      const response = await result.response;
      
      // Check if the response contains function calls
      const candidates = response.candidates || [];
      let functionCalls: any[] = [];
      
      if (candidates.length > 0) {
        const content = candidates[0].content;
        if (content && content.parts) {
          functionCalls = content.parts.filter((part: any) => part.functionCall);
        }
      }
      
      if (functionCalls.length > 0 && this.toolRegistry) {
        this.logger.debug(`Processing ${functionCalls.length} function calls`);
        
        // Process function calls
        let results: string[] = [];
        
        for (const part of functionCalls) {
          const functionCall = part.functionCall;
          const name = functionCall.name;
          const args = functionCall.args || {};
          
          try {
            const toolResult = await this.toolRegistry.executeTool(name, args);
            
            if (toolResult.success && toolResult.data) {
              // Format the result nicely based on the tool
              if (name === 'get_current_time') {
                results.push(`Current time: ${toolResult.data.formatted}`);
              } else if (name === 'list_directory') {
                const data = toolResult.data;
                results.push(`Found ${data.files.length} files and ${data.directories.length} directories:\n\nFiles: ${data.files.slice(0, 10).join(', ')}${data.files.length > 10 ? '...' : ''}\nDirectories: ${data.directories.join(', ')}`);
              } else if (name === 'read_file') {
                results.push(`File content:\n\n${toolResult.data}`);
              } else {
                results.push(toolResult.message || `Executed ${name} successfully`);
              }
            } else {
              results.push(`Error: ${toolResult.error}`);
            }
          } catch (error) {
            results.push(`Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        const finalResponse = results.join('\n\n');
        this.addToHistory('assistant', finalResponse);
        return { text: finalResponse };
      }
      
      // Regular text response
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        return { text: "I'm thinking about your request but didn't generate a response. Could you try rephrasing?" };
      }

      this.addToHistory('assistant', text);
      return { text: text.trim() };
      
    } catch (error) {
      this.logger.error('Gemini API Error:', error);
      return {
        text: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      };
    }
  }

  async generateStreamingResponse(userInput: string): Promise<AsyncGenerator<GeminiResponse, void, unknown>> {
    const self = this;
    
    async function* streamGenerator(): AsyncGenerator<GeminiResponse, void, unknown> {
      try {
        self.logger.debug(`Streaming request to Gemini: "${userInput}"`);
        
        // Add user message to history
        self.addToHistory('user', userInput);
        
        const contextMessages = self.conversationHistory
          .slice(-10)
          .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        
        const prompt = self.buildSystemPrompt() + '\n\nConversation:\n' + contextMessages + '\nHuman: ' + userInput + '\nAssistant:';
        
        const result = await self.model.generateContentStream(prompt);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullResponse += chunkText;
            yield { text: chunkText, isPartial: true };
          }
        }
        
        // Add final response to history
        if (fullResponse.trim()) {
          self.addToHistory('assistant', fullResponse.trim());
        }
        
      } catch (error) {
        self.logger.error('Gemini Streaming Error:', error);
        yield {
          text: "I'm having trouble with my AI connection. Please check your GEMINI_API_KEY configuration."
        };
      }
    }
    
    return streamGenerator();
  }

  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });

    // Keep conversation history manageable (last 50 messages)
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  private buildSystemPrompt(): string {
    const toolsList = this.toolRegistry ? 
      this.toolRegistry.getAvailableTools().map(t => `- ${t.name}: ${t.description}`).join('\n') : 
      'No tools available';
      
    return `You are JARVIS, an intelligent AI assistant with access to system tools.

IMPORTANT: When users ask for information that requires tools, USE THE AVAILABLE FUNCTIONS!

Available Functions:
${toolsList}

Examples of when to use tools:
- "What time is it?" → Call get_current_time
- "List files" → Call list_directory  
- "Read file X" → Call read_file
- "Create file Y" → Call write_file

Always use functions when appropriate instead of just describing what you could do.
Be helpful, smart, and use your tools effectively to assist users.`;
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.logger.debug('Conversation history cleared');
  }

  getHistoryLength(): number {
    return this.conversationHistory.length;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Say "Hello" if you can hear me.');
      const response = await result.response;
      const text = response.text();
      return text.toLowerCase().includes('hello');
    } catch (error) {
      this.logger.error('Gemini connection test failed:', error);
      return false;
    }
  }
}