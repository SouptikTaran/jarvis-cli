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
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    };
    
    // Add function definitions if tools are available
    if (this.toolRegistry && this.toolRegistry.getToolCount() > 0) {
      modelConfig.tools = [{
        functionDeclarations: this.toolRegistry.getFunctionDefinitions()
      }];
      this.logger.debug(`Configured model with ${this.toolRegistry.getToolCount()} tools`);
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
      const functionCalls = response.functionCalls?.() || [];
      
      if (functionCalls.length > 0 && this.toolRegistry) {
        // Process function calls
        let responseText = '';
        
        for (const functionCall of functionCalls) {
          const { name, args } = functionCall;
          this.logger.debug(`Executing function: ${name}`, args);
          
          const toolResult = await this.toolRegistry.executeTool(name, args);
          
          if (toolResult.success) {
            responseText += `✅ ${toolResult.message || `Executed ${name} successfully`}\n`;
            if (toolResult.data) {
              responseText += `Result: ${JSON.stringify(toolResult.data, null, 2)}\n`;
            }
          } else {
            responseText += `❌ Error executing ${name}: ${toolResult.error}\n`;
          }
        }
        
        // Generate follow-up response with function results
        const functionResponses = functionCalls.map((fc: any) => ({
          functionResponse: {
            name: fc.name,
            response: { result: responseText }
          }
        }));
        
        const followUpResult = await this.model.generateContent([
          { text: userInput },
          ...functionResponses
        ]);
        
        const followUpText = followUpResult.response.text();
        this.addToHistory('assistant', followUpText);
        
        return { text: followUpText.trim() };
      }
      
      // Regular text response
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      this.addToHistory('assistant', text);
      
      this.logger.debug(`Received response from Gemini: "${text.substring(0, 100)}..."`);
      
      return { text: text.trim() };
      
    } catch (error) {
      this.logger.error('Gemini API Error:', error);
      
      return {
        text: "I'm having trouble connecting to my AI brain right now. Please try again in a moment, or check if your GEMINI_API_KEY is configured correctly."
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
    return `You are JARVIS, an intelligent AI assistant inspired by Tony Stark's AI companion. You are:

- Helpful, smart, and slightly witty
- Knowledgeable about technology, programming, and general topics
- Capable of helping with tasks, answering questions, and having conversations
- Concise but thorough in your responses
- Professional yet friendly

Current capabilities:
- Natural language conversation
- General knowledge and assistance
- Soon: Spotify music control, Google Calendar management, file operations

Respond naturally and helpfully to the user's requests. Keep responses conversational and engaging.`;
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