import { Logger } from '../utils/logger';

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ConversationSession {
  id: string;
  messages: Message[];
  createdAt: number;
  lastUpdated: number;
}

/**
 * Manages conversation history and context for multi-turn conversations
 */
export class ConversationMemory {
  private messages: Message[] = [];
  private maxMessages: number;
  private logger: Logger;
  private sessionId: string;

  constructor(logger: Logger, maxMessages: number = 20) {
    this.logger = logger;
    this.maxMessages = maxMessages;
    this.sessionId = this.generateSessionId();
    this.logger.debug(`Started conversation session: ${this.sessionId}`);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a user message to history
   */
  addUserMessage(content: string): void {
    this.messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });

    this.trimHistory();
    this.logger.debug(`Added user message (${this.messages.length} total)`);
  }

  /**
   * Add a model response to history
   */
  addModelMessage(content: string): void {
    this.messages.push({
      role: 'model',
      content,
      timestamp: Date.now()
    });

    this.trimHistory();
    this.logger.debug(`Added model message (${this.messages.length} total)`);
  }

  /**
   * Get all messages in conversation
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get recent messages for context
   */
  getRecentMessages(count?: number): Message[] {
    const limit = count || this.maxMessages;
    return this.messages.slice(-limit);
  }

  /**
   * Format messages for Gemini API (chat history format)
   */
  getFormattedHistory(): Array<{ role: string; parts: Array<{ text: string }> }> {
    return this.messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
  }

  /**
   * Get context summary for display
   */
  getContextSummary(): string {
    const recent = this.getRecentMessages(5);
    if (recent.length === 0) return 'No conversation history';

    const summary = recent.map(msg => {
      const role = msg.role === 'user' ? 'You' : 'JARVIS';
      const preview = msg.content.substring(0, 50);
      return `${role}: ${preview}${msg.content.length > 50 ? '...' : ''}`;
    }).join('\n');

    return `Recent context (${this.messages.length} messages):\n${summary}`;
  }

  /**
   * Trim history to max messages
   */
  private trimHistory(): void {
    if (this.messages.length > this.maxMessages) {
      const removed = this.messages.length - this.maxMessages;
      this.messages = this.messages.slice(-this.maxMessages);
      this.logger.debug(`Trimmed ${removed} old messages from history`);
    }
  }

  /**
   * Clear conversation history
   */
  clear(): void {
    const count = this.messages.length;
    this.messages = [];
    this.logger.debug(`Cleared ${count} messages from conversation`);
  }

  /**
   * Get conversation statistics
   */
  getStats(): { messageCount: number; userMessages: number; modelMessages: number; sessionId: string } {
    return {
      messageCount: this.messages.length,
      userMessages: this.messages.filter(m => m.role === 'user').length,
      modelMessages: this.messages.filter(m => m.role === 'model').length,
      sessionId: this.sessionId
    };
  }

  /**
   * Export conversation to JSON
   */
  export(): ConversationSession {
    return {
      id: this.sessionId,
      messages: this.messages,
      createdAt: this.messages[0]?.timestamp || Date.now(),
      lastUpdated: this.messages[this.messages.length - 1]?.timestamp || Date.now()
    };
  }
}
