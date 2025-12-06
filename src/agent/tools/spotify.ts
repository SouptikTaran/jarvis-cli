import axios from 'axios';
import { BaseTool, ToolDefinition, ToolResult } from './base';
import { TokenStorage } from '../../config/tokenStorage';
import { SpotifyOAuth } from '../../auth/spotify';
import { Logger } from '../../utils/logger';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Base class for Spotify tools with shared authentication logic
 */
abstract class SpotifyBaseTool extends BaseTool {
  constructor(
    protected tokenStorage: TokenStorage,
    protected spotifyAuth: SpotifyOAuth,
    protected logger: Logger
  ) {
    super();
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  protected async getAccessToken(): Promise<string> {
    let tokens = await this.tokenStorage.loadTokens('spotify');
    
    if (!tokens) {
      throw new Error('Spotify not authenticated. Please run: jarvis auth spotify');
    }

    // Check if token is expired (with 5 min buffer)
    if (Date.now() >= tokens.expiresAt - 300000) {
      this.logger.debug('Spotify token expired, refreshing...');
      tokens = await this.spotifyAuth.refreshAccessToken(tokens.refreshToken);
      await this.tokenStorage.saveTokens('spotify', tokens);
    }

    return tokens.accessToken;
  }

  /**
   * Make authenticated request to Spotify API
   */
  protected async makeSpotifyRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios({
        method,
        url: `${SPOTIFY_API_BASE}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || 'Unknown error';
        throw new Error(`Spotify API error (${status}): ${message}`);
      }
      throw error;
    }
  }
}

/**
 * Get current playback state
 */
export class CurrentTrackTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'get_current_track',
    description: 'Get information about the currently playing track on Spotify',
    category: 'spotify',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const data = await this.makeSpotifyRequest('GET', '/me/player/currently-playing');
      
      if (!data || !data.item) {
        return {
          success: true,
          data: null,
          message: 'No track is currently playing.'
        };
      }

      const track = data.item;
      const artists = track.artists.map((a: any) => a.name).join(', ');
      const isPlaying = data.is_playing ? 'Playing' : 'Paused';

      return {
        success: true,
        data: {
          track: track.name,
          artists,
          album: track.album.name,
          isPlaying: data.is_playing
        },
        message: `${isPlaying}: "${track.name}" by ${artists} (${track.album.name})`
      };
    } catch (error) {
      this.logger.error('Failed to get current track:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current track'
      };
    }
  }
}

/**
 * Play or resume playback
 */
export class PlayMusicTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'play_music',
    description: 'Play or resume music playback on Spotify',
    category: 'spotify',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      await this.makeSpotifyRequest('PUT', '/me/player/play');
      return {
        success: true,
        message: 'Playback resumed.'
      };
    } catch (error) {
      this.logger.error('Failed to play music:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to play music'
      };
    }
  }
}

/**
 * Pause playback
 */
export class PauseMusicTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'pause_music',
    description: 'Pause music playback on Spotify',
    category: 'spotify',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      await this.makeSpotifyRequest('PUT', '/me/player/pause');
      return {
        success: true,
        message: 'Playback paused.'
      };
    } catch (error) {
      this.logger.error('Failed to pause music:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pause music'
      };
    }
  }
}

/**
 * Skip to next track
 */
export class NextTrackTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'next_track',
    description: 'Skip to the next track on Spotify',
    category: 'spotify',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      await this.makeSpotifyRequest('POST', '/me/player/next');
      return {
        success: true,
        message: 'Skipped to next track.'
      };
    } catch (error) {
      this.logger.error('Failed to skip track:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to skip track'
      };
    }
  }
}

/**
 * Skip to previous track
 */
export class PreviousTrackTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'previous_track',
    description: 'Skip to the previous track on Spotify',
    category: 'spotify',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      await this.makeSpotifyRequest('POST', '/me/player/previous');
      return {
        success: true,
        message: 'Skipped to previous track.'
      };
    } catch (error) {
      this.logger.error('Failed to skip to previous track:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to skip to previous track'
      };
    }
  }
}

/**
 * Search for music
 */
export class SearchMusicTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'search_music',
    description: 'Search for music on Spotify',
    category: 'spotify',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query (song name, artist, album, etc.)',
        required: true
      },
      {
        name: 'type',
        type: 'string',
        description: 'Type of search: track, artist, album, or playlist',
        required: false,
        enum: ['track', 'artist', 'album', 'playlist']
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { query, type = 'track' } = parameters;
      const response = await this.makeSpotifyRequest(
        'GET',
        `/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`
      );

      if (type === 'track' && response.tracks) {
        const tracks = response.tracks.items;
        if (tracks.length === 0) {
          return {
            success: true,
            data: [],
            message: 'No tracks found.'
          };
        }

        const results = tracks.map((track: any, index: number) => {
          const artists = track.artists.map((a: any) => a.name).join(', ');
          return {
            index: index + 1,
            name: track.name,
            artists,
            uri: track.uri
          };
        });

        const message = results.map((r: any) => 
          `${r.index}. "${r.name}" by ${r.artists}`
        ).join('\n');

        return {
          success: true,
          data: results,
          message: `Found ${tracks.length} tracks:\n${message}`
        };
      }

      return {
        success: true,
        data: response,
        message: `Search completed for ${type}s.`
      };
    } catch (error) {
      this.logger.error('Failed to search music:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search music'
      };
    }
  }
}

/**
 * Play a specific track by URI
 */
export class PlayTrackTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'play_track',
    description: 'Play a specific track on Spotify by URI',
    category: 'spotify',
    parameters: [
      {
        name: 'uri',
        type: 'string',
        description: 'Spotify track URI (e.g., spotify:track:xxxxx)',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const { uri } = parameters;
      await this.makeSpotifyRequest('PUT', '/me/player/play', {
        uris: [uri]
      });
      return {
        success: true,
        message: `Playing track: ${uri}`
      };
    } catch (error) {
      this.logger.error('Failed to play track:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to play track'
      };
    }
  }
}

/**
 * Set volume
 */
export class SetVolumeTool extends SpotifyBaseTool {
  definition: ToolDefinition = {
    name: 'set_volume',
    description: 'Set Spotify playback volume (0-100)',
    category: 'spotify',
    parameters: [
      {
        name: 'volume',
        type: 'number',
        description: 'Volume level from 0 to 100',
        required: true
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const volume = Math.max(0, Math.min(100, parameters.volume));
      await this.makeSpotifyRequest('PUT', `/me/player/volume?volume_percent=${volume}`);
      return {
        success: true,
        message: `Volume set to ${volume}%.`
      };
    } catch (error) {
      this.logger.error('Failed to set volume:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set volume'
      };
    }
  }
}
