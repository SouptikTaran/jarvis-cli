import { GeminiClient } from './gemini';
import { ToolRegistry } from './tools/registry';
import { ReadFileTool, WriteFileTool, ListDirectoryTool, GetCurrentTimeTool } from './tools/system';
import { AddTaskTool, ListTasksTool, CompleteTaskTool, DeleteTaskTool } from './tools/tasks';
import {
  GetUnreadCountTool,
  ListEmailsTool,
  SendEmailTool,
  SearchEmailsTool
} from './tools/email';
import {
  GitStatusTool,
  GitCommitTool,
  GitPushTool,
  GitCommitAndPushTool,
  GitLogTool
} from './tools/git';
import { 
  CurrentTrackTool,
  PlayMusicTool,
  PauseMusicTool,
  NextTrackTool,
  PreviousTrackTool,
  SearchMusicTool,
  PlayTrackTool,
  SetVolumeTool
} from './tools/spotify';
import {
  ListEventsTool,
  GetTodayEventsTool,
  CreateEventTool,
  GetNextMeetingTool
} from './tools/calendar';
import { Logger } from '../utils/logger';
import { TokenStorage } from '../config/tokenStorage';
import { SpotifyOAuth } from '../auth/spotify';
import { GoogleOAuth } from '../auth/google';
import { OAuthConfig } from '../auth/oauth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AgentOptions {
  verbose?: boolean;
  debug?: boolean;
}

export class JarvisAgent {
  private geminiClient: GeminiClient;
  private toolRegistry: ToolRegistry;
  private logger: Logger;
  private tokenStorage: TokenStorage;

  constructor(options: AgentOptions = {}) {
    this.logger = new Logger(options);
    this.toolRegistry = new ToolRegistry(this.logger);
    this.tokenStorage = new TokenStorage(this.logger);
    
    // Initialize system and integration tools
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
    
    // Register task management tools
    this.toolRegistry.registerTool(new AddTaskTool(this.logger));
    this.toolRegistry.registerTool(new ListTasksTool(this.logger));
    this.toolRegistry.registerTool(new CompleteTaskTool(this.logger));
    this.toolRegistry.registerTool(new DeleteTaskTool(this.logger));
    
    // Register Git tools
    this.toolRegistry.registerTool(new GitStatusTool(this.logger));
    this.toolRegistry.registerTool(new GitCommitTool(this.logger));
    this.toolRegistry.registerTool(new GitPushTool(this.logger));
    this.toolRegistry.registerTool(new GitCommitAndPushTool(this.logger));
    this.toolRegistry.registerTool(new GitLogTool(this.logger));
    
    // Register Spotify tools
    this.initializeSpotifyTools();
    
    // Register Google Calendar tools
    this.initializeCalendarTools();
    
    // Register Gmail tools
    this.initializeGmailTools();
    
    this.logger.verbose(`Initialized ${this.toolRegistry.getToolCount()} tools`);
  }

  private initializeSpotifyTools(): void {
    try {
      const config: OAuthConfig = {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        redirectUri: 'http://127.0.0.1:8888/callback',
        scopes: [
          'user-read-playback-state',
          'user-modify-playback-state',
          'user-read-currently-playing',
          'streaming',
          'playlist-read-private',
          'playlist-read-collaborative'
        ]
      };

      // Only register Spotify tools if credentials are present
      if (config.clientId && config.clientSecret) {
        const spotifyAuth = new SpotifyOAuth(config, this.logger);

        this.toolRegistry.registerTool(new CurrentTrackTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new PlayMusicTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new PauseMusicTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new NextTrackTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new PreviousTrackTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new SearchMusicTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new PlayTrackTool(this.tokenStorage, spotifyAuth, this.logger));
        this.toolRegistry.registerTool(new SetVolumeTool(this.tokenStorage, spotifyAuth, this.logger));

        this.logger.debug('Registered 8 Spotify tools');
      } else {
        this.logger.debug('Spotify credentials not found, skipping Spotify tools');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Spotify tools:', error);
    }
  }

  private initializeCalendarTools(): void {
    try {
      const config: OAuthConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: 'http://127.0.0.1:8888/callback',
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      };

      // Only register Calendar tools if credentials are present
      if (config.clientId && config.clientSecret) {
        const googleAuth = new GoogleOAuth(config, this.logger);

        this.toolRegistry.registerTool(new ListEventsTool(this.tokenStorage, googleAuth, this.logger));
        this.toolRegistry.registerTool(new GetTodayEventsTool(this.tokenStorage, googleAuth, this.logger));
        this.toolRegistry.registerTool(new CreateEventTool(this.tokenStorage, googleAuth, this.logger));
        this.toolRegistry.registerTool(new GetNextMeetingTool(this.tokenStorage, googleAuth, this.logger));

        this.logger.debug('Registered 4 Google Calendar tools');
      } else {
        this.logger.debug('Google credentials not found, skipping Calendar tools');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Calendar tools:', error);
    }
  }

  private initializeGmailTools(): void {
    try {
      const config: OAuthConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: 'http://127.0.0.1:8888/callback',
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify'
        ]
      };

      // Only register Gmail tools if credentials are present
      if (config.clientId && config.clientSecret) {
        const googleAuth = new GoogleOAuth(config, this.logger);

        this.toolRegistry.registerTool(new GetUnreadCountTool(this.tokenStorage, googleAuth, this.logger));
        this.toolRegistry.registerTool(new ListEmailsTool(this.tokenStorage, googleAuth, this.logger));
        this.toolRegistry.registerTool(new SendEmailTool(this.tokenStorage, googleAuth, this.logger));
        this.toolRegistry.registerTool(new SearchEmailsTool(this.tokenStorage, googleAuth, this.logger));

        this.logger.debug('Registered 4 Gmail tools');
      } else {
        this.logger.debug('Google credentials not found, skipping Gmail tools');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Gmail tools:', error);
    }
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
        // Use non-streaming for function calls (they need to be executed before returning)
        // Streaming only works well for pure text responses
        const response = await self.geminiClient.generateResponse(userInput);
        yield response.text;
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