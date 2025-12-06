import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';
import { ToolRegistry } from './tools/registry';
import { ConversationMemory } from './memory';

// Load environment variables
dotenv.config();

export interface GeminiResponse {
  text: string;
  isPartial?: boolean;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chat: any;
  private logger: Logger;
  private memory: ConversationMemory;
  private toolRegistry: ToolRegistry | undefined;

  constructor(logger: Logger, toolRegistry?: ToolRegistry, memory?: ConversationMemory) {
    this.logger = logger;
    this.toolRegistry = toolRegistry;
    this.memory = memory || new ConversationMemory(logger);
    
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
    
    // Initialize chat session with history
    this.chat = this.model.startChat({
      history: this.memory.getFormattedHistory()
    });

    this.logger.debug('Gemini client initialized with conversation memory');
  }

  async generateResponse(userInput: string): Promise<GeminiResponse> {
    try {
      this.logger.debug(`Sending request to Gemini: "${userInput}"`);
      
      // Add user message to memory
      this.memory.addUserMessage(userInput);
      
      const result = await this.chat.sendMessage(userInput);
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
        this.memory.addModelMessage(finalResponse);
        return { text: finalResponse };
      }
      
      // Regular text response
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        return { text: "I'm thinking about your request but didn't generate a response. Could you try rephrasing?" };
      }

      this.memory.addModelMessage(text);
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
        
        // Add user message to memory
        self.memory.addUserMessage(userInput);
        
        const messages = self.memory.getRecentMessages(10);
        const contextMessages = messages
          .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        
        const prompt = 'Conversation:\n' + contextMessages + '\nHuman: ' + userInput + '\nAssistant:';
        
        const result = await self.model.generateContentStream(prompt);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullResponse += chunkText;
            yield { text: chunkText, isPartial: true };
          }
        }
        
        // Add final response to memory
        if (fullResponse.trim()) {
          self.memory.addModelMessage(fullResponse.trim());
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

  clearHistory(): void {
    this.memory.clear();
    // Restart chat session
    this.chat = this.model.startChat({
      history: this.memory.getFormattedHistory()
    });
    this.logger.debug('Conversation history cleared');
  }

  getHistoryLength(): number {
    return this.memory.getStats().messageCount;
  }
  
  getMemory(): ConversationMemory {
    return this.memory;
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