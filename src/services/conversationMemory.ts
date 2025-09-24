/**
 * Conversation Memory Service
 * Persists and retrieves conversation history for personalized AI responses
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sessionId: string;
}

export interface ConversationSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: number;
  lastUpdated: number;
  mode: 'ask' | 'agent';
}

class ConversationMemoryService {
  private readonly STORAGE_KEY = 'ai_conversation_memory';
  private readonly MAX_SESSIONS = 10; // Keep last 10 sessions
  private readonly MAX_MESSAGES_PER_SESSION = 50; // Keep last 50 messages per session
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  
  private currentSessionId: string | null = null;
  
  /**
   * Generate a new session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get current session ID or create a new one
   */
  getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      this.currentSessionId = this.generateSessionId();
    }
    return this.currentSessionId;
  }
  
  /**
   * Start a new conversation session
   */
  startNewSession(mode: 'ask' | 'agent' = 'ask'): string {
    this.currentSessionId = this.generateSessionId();
    
    const newSession: ConversationSession = {
      sessionId: this.currentSessionId,
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      mode
    };
    
    this.saveSession(newSession);
    return this.currentSessionId;
  }
  
  /**
   * Add a message to the current session
   */
  addMessage(role: 'user' | 'assistant', content: string, mode: 'ask' | 'agent' = 'ask'): void {
    const sessionId = this.getCurrentSessionId();
    const session = this.getSession(sessionId) || {
      sessionId,
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      mode
    };
    
    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
      sessionId
    };
    
    session.messages.push(message);
    session.lastUpdated = Date.now();
    session.mode = mode;
    
    // Keep only recent messages to prevent storage bloat
    if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
    }
    
    this.saveSession(session);
  }
  
  /**
   * Get conversation history for the current session
   */
  getCurrentConversationHistory(): ChatMessage[] {
    const sessionId = this.getCurrentSessionId();
    const session = this.getSession(sessionId);
    return session?.messages || [];
  }
  
  /**
   * Get conversation context for AI (formatted for prompt inclusion)
   */
  getConversationContext(maxMessages: number = 10): string {
    const messages = this.getCurrentConversationHistory();
    const recentMessages = messages.slice(-maxMessages);
    
    if (recentMessages.length === 0) {
      return '';
    }
    
    const contextLines = recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'Human' : 'Assistant';
      return `${role}: ${msg.content}`;
    });
    
    return `Previous conversation context:\n${contextLines.join('\n')}\n\n`;
  }
  
  /**
   * Check if there's ongoing conversation context
   */
  hasConversationContext(): boolean {
    return this.getCurrentConversationHistory().length > 0;
  }
  
  /**
   * Get session summary for context awareness
   */
  getSessionSummary(): { 
    messageCount: number; 
    lastInteraction: number; 
    mode: 'ask' | 'agent';
    topics: string[];
  } {
    const messages = this.getCurrentConversationHistory();
    const sessionId = this.getCurrentSessionId();
    const session = this.getSession(sessionId);
    
    // Extract topics from user messages
    const topics = this.extractTopicsFromMessages(messages);
    
    return {
      messageCount: messages.length,
      lastInteraction: session?.lastUpdated || 0,
      mode: session?.mode || 'ask',
      topics
    };
  }
  
  /**
   * Extract main topics from conversation messages
   */
  private extractTopicsFromMessages(messages: ChatMessage[]): string[] {
    const userMessages = messages.filter(m => m.role === 'user');
    const topics = new Set<string>();
    
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Extract task-related topics
      if (content.includes('task') || content.includes('assignment') || content.includes('homework')) {
        topics.add('tasks');
      }
      if (content.includes('meeting') || content.includes('calendar') || content.includes('event')) {
        topics.add('calendar');
      }
      if (content.includes('course') || content.includes('class') || content.includes('study')) {
        topics.add('academics');
      }
      if (content.includes('project') || content.includes('work')) {
        topics.add('projects');
      }
      if (content.includes('deadline') || content.includes('due') || content.includes('schedule')) {
        topics.add('scheduling');
      }
    });
    
    return Array.from(topics);
  }
  
  /**
   * Clear current session (start fresh)
   */
  clearCurrentSession(): void {
    this.currentSessionId = null;
  }
  
  /**
   * Save session to localStorage
   */
  private saveSession(session: ConversationSession): void {
    try {
      const allSessions = this.getAllSessions();
      allSessions[session.sessionId] = session;
      
      // Clean up old sessions
      this.cleanupOldSessions(allSessions);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSessions));
    } catch (error) {
      console.warn('Failed to save conversation session:', error);
    }
  }
  
  /**
   * Get session from localStorage
   */
  private getSession(sessionId: string): ConversationSession | null {
    try {
      const allSessions = this.getAllSessions();
      return allSessions[sessionId] || null;
    } catch (error) {
      console.warn('Failed to retrieve conversation session:', error);
      return null;
    }
  }
  
  /**
   * Get all sessions from localStorage
   */
  private getAllSessions(): Record<string, ConversationSession> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse conversation sessions:', error);
      return {};
    }
  }
  
  /**
   * Clean up old sessions to prevent storage bloat
   */
  private cleanupOldSessions(sessions: Record<string, ConversationSession>): void {
    const now = Date.now();
    const sessionEntries = Object.entries(sessions);
    
    // Remove sessions older than timeout
    const validSessions = sessionEntries.filter(([_, session]) => {
      return (now - session.lastUpdated) < this.SESSION_TIMEOUT;
    });
    
    // Keep only the most recent sessions
    const sortedSessions = validSessions.sort(([_, a], [__, b]) => b.lastUpdated - a.lastUpdated);
    const recentSessions = sortedSessions.slice(0, this.MAX_SESSIONS);
    
    // Update the sessions object
    Object.keys(sessions).forEach(key => delete sessions[key]);
    recentSessions.forEach(([sessionId, session]) => {
      sessions[sessionId] = session;
    });
  }
  
  /**
   * Get conversation statistics
   */
  getStats(): {
    totalSessions: number;
    totalMessages: number;
    currentSessionMessages: number;
  } {
    const allSessions = this.getAllSessions();
    const totalSessions = Object.keys(allSessions).length;
    const totalMessages = Object.values(allSessions).reduce((sum, session) => sum + session.messages.length, 0);
    const currentSessionMessages = this.getCurrentConversationHistory().length;
    
    return {
      totalSessions,
      totalMessages,
      currentSessionMessages
    };
  }
}

// Export singleton instance
export const conversationMemory = new ConversationMemoryService();