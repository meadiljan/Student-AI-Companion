// Event manager for handling calendar events across components
interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  time?: string;
}

type EventListener = (event: Omit<CalendarEvent, 'id'>) => void;

// Settings change listener type
type SettingsChangeListener = (settings: { selectedModel: string }) => void;

class EventManager {
  private listeners: EventListener[] = [];
  private settingsChangeListeners: SettingsChangeListener[] = [];

  // Calendar event methods
  addListener(listener: EventListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: EventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  createEvent(eventData: Omit<CalendarEvent, 'id'>) {
    // Notify all listeners (calendar components)
    this.listeners.forEach(listener => listener(eventData));
  }

  // Settings change methods
  addSettingsChangeListener(listener: SettingsChangeListener) {
    this.settingsChangeListeners.push(listener);
  }

  removeSettingsChangeListener(listener: SettingsChangeListener) {
    this.settingsChangeListeners = this.settingsChangeListeners.filter(l => l !== listener);
  }

  notifySettingsChange(settings: { selectedModel: string }) {
    this.settingsChangeListeners.forEach(listener => listener(settings));
  }
}

export const eventManager = new EventManager();
export type { CalendarEvent, EventListener, SettingsChangeListener };