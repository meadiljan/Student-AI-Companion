// Event manager for handling calendar events across components
interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  time?: string;
}

type EventListener = (event: Omit<CalendarEvent, 'id'>) => void;

class EventManager {
  private listeners: EventListener[] = [];

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
}

export const eventManager = new EventManager();
export type { CalendarEvent, EventListener };