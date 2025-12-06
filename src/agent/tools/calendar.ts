import axios from 'axios';
import { BaseTool, ToolDefinition, ToolResult } from './base';
import { TokenStorage } from '../../config/tokenStorage';
import { GoogleOAuth } from '../../auth/google';
import { Logger } from '../../utils/logger';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Base class for Google Calendar tools with shared authentication logic
 */
abstract class CalendarBaseTool extends BaseTool {
  constructor(
    protected tokenStorage: TokenStorage,
    protected googleAuth: GoogleOAuth,
    protected logger: Logger
  ) {
    super();
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  protected async getAccessToken(): Promise<string> {
    let tokens = await this.tokenStorage.loadTokens('google');
    
    if (!tokens) {
      throw new Error('Google Calendar not authenticated. Please run: jarvis auth google');
    }

    // Check if token is expired (with 5 min buffer)
    if (Date.now() >= tokens.expiresAt - 300000) {
      this.logger.debug('Google token expired, refreshing...');
      tokens = await this.googleAuth.refreshAccessToken(tokens.refreshToken);
      await this.tokenStorage.saveTokens('google', tokens);
    }

    return tokens.accessToken;
  }

  /**
   * Make authenticated request to Google Calendar API
   */
  protected async makeCalendarRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios({
        method,
        url: `${CALENDAR_API_BASE}${endpoint}`,
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
        throw new Error(`Google Calendar API error (${status}): ${message}`);
      }
      throw error;
    }
  }

  /**
   * Format date for display
   */
  protected formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

/**
 * List upcoming calendar events
 */
export class ListEventsTool extends CalendarBaseTool {
  definition: ToolDefinition = {
    name: 'list_calendar_events',
    description: 'List upcoming events from Google Calendar',
    category: 'calendar',
    parameters: [
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of events to return (default: 10)',
        required: false
      },
      {
        name: 'days',
        type: 'number',
        description: 'Number of days to look ahead (default: 7)',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const maxResults = parameters.max_results || 10;
      const days = parameters.days || 7;
      
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.makeCalendarRequest(
        'GET',
        `/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`
      );

      const events = response.items || [];

      if (events.length === 0) {
        return {
          success: true,
          data: [],
          message: `No events found in the next ${days} days.`
        };
      }

      const formattedEvents = events.map((event: any) => {
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        
        return {
          summary: event.summary || 'No title',
          start,
          end,
          location: event.location,
          description: event.description,
          attendees: event.attendees?.length || 0
        };
      });

      const message = formattedEvents.map((e: any, i: number) => {
        const startFormatted = this.formatDateTime(e.start);
        let line = `${i + 1}. ${e.summary} - ${startFormatted}`;
        if (e.location) line += ` (${e.location})`;
        if (e.attendees > 0) line += ` [${e.attendees} attendees]`;
        return line;
      }).join('\n');

      return {
        success: true,
        data: formattedEvents,
        message: `Upcoming events (next ${days} days):\n${message}`
      };
    } catch (error) {
      this.logger.error('Failed to list calendar events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list calendar events'
      };
    }
  }
}

/**
 * Get today's events
 */
export class GetTodayEventsTool extends CalendarBaseTool {
  definition: ToolDefinition = {
    name: 'get_today_events',
    description: "Get today's calendar events and meetings",
    category: 'calendar',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const timeMin = today.toISOString();
      const timeMax = tomorrow.toISOString();

      const response = await this.makeCalendarRequest(
        'GET',
        `/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
      );

      const events = response.items || [];

      if (events.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No events scheduled for today.'
        };
      }

      const formattedEvents = events.map((event: any) => {
        const start = event.start.dateTime || event.start.date;
        return {
          summary: event.summary || 'No title',
          start,
          location: event.location,
          attendees: event.attendees?.length || 0
        };
      });

      const message = formattedEvents.map((e: any, i: number) => {
        const time = new Date(e.start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        let line = `${i + 1}. ${e.summary} at ${time}`;
        if (e.location) line += ` (${e.location})`;
        if (e.attendees > 0) line += ` [${e.attendees} attendees]`;
        return line;
      }).join('\n');

      return {
        success: true,
        data: formattedEvents,
        message: `Today's events (${events.length}):\n${message}`
      };
    } catch (error) {
      this.logger.error('Failed to get today events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get today events'
      };
    }
  }
}

/**
 * Create a new calendar event
 */
export class CreateEventTool extends CalendarBaseTool {
  definition: ToolDefinition = {
    name: 'create_calendar_event',
    description: 'Create a new event in Google Calendar',
    category: 'calendar',
    parameters: [
      {
        name: 'summary',
        type: 'string',
        description: 'Event title/summary',
        required: true
      },
      {
        name: 'start_time',
        type: 'string',
        description: 'Start time in ISO format or natural language',
        required: true
      },
      {
        name: 'end_time',
        type: 'string',
        description: 'End time in ISO format or natural language',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'Event description',
        required: false
      },
      {
        name: 'location',
        type: 'string',
        description: 'Event location',
        required: false
      }
    ]
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const event = {
        summary: parameters.summary,
        description: parameters.description,
        location: parameters.location,
        start: {
          dateTime: new Date(parameters.start_time).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(parameters.end_time).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const response = await this.makeCalendarRequest('POST', '/calendars/primary/events', event);

      return {
        success: true,
        data: {
          id: response.id,
          htmlLink: response.htmlLink,
          summary: response.summary,
          start: response.start.dateTime
        },
        message: `Event created: "${parameters.summary}" on ${this.formatDateTime(response.start.dateTime)}`
      };
    } catch (error) {
      this.logger.error('Failed to create calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event'
      };
    }
  }
}

/**
 * Get next meeting
 */
export class GetNextMeetingTool extends CalendarBaseTool {
  definition: ToolDefinition = {
    name: 'get_next_meeting',
    description: 'Get the next upcoming meeting or event',
    category: 'calendar',
    parameters: []
  };

  async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      const timeMin = new Date().toISOString();

      const response = await this.makeCalendarRequest(
        'GET',
        `/calendars/primary/events?timeMin=${timeMin}&maxResults=1&singleEvents=true&orderBy=startTime`
      );

      const events = response.items || [];

      if (events.length === 0) {
        return {
          success: true,
          data: null,
          message: 'No upcoming meetings found.'
        };
      }

      const event = events[0];
      const start = event.start.dateTime || event.start.date;
      const startDate = new Date(start);
      const now = new Date();
      const minutesUntil = Math.round((startDate.getTime() - now.getTime()) / 60000);

      let timeInfo = '';
      if (minutesUntil < 0) {
        timeInfo = 'happening now';
      } else if (minutesUntil < 60) {
        timeInfo = `in ${minutesUntil} minutes`;
      } else if (minutesUntil < 1440) {
        timeInfo = `in ${Math.round(minutesUntil / 60)} hours`;
      } else {
        timeInfo = `on ${this.formatDateTime(start)}`;
      }

      const result = {
        summary: event.summary || 'No title',
        start,
        location: event.location,
        attendees: event.attendees?.length || 0,
        minutesUntil
      };

      let message = `Next meeting: "${result.summary}" ${timeInfo}`;
      if (result.location) message += ` at ${result.location}`;
      if (result.attendees > 0) message += ` with ${result.attendees} attendees`;

      return {
        success: true,
        data: result,
        message
      };
    } catch (error) {
      this.logger.error('Failed to get next meeting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get next meeting'
      };
    }
  }
}
