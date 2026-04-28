import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventApiAdapter } from '../../adapters/event/event-api.adapter';
import { TimeLimitedEvent } from '../../domain/event/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventUseCase {
  private adapter = inject(EventApiAdapter);

  // State
  allEvents = signal<TimeLimitedEvent[]>([]);
  searchQuery = signal('');
  selectedCategory = signal<string | null>(null);

  constructor() {
    this.loadEvents();
    
    // Auto-refresh computation every second for countdowns
    const interval = setInterval(() => {
      this.allEvents.set([...this.allEvents()]);
    }, 1000);

    // Cleanup logic would usually go in ngOnDestroy if this were a component service, 
    // but since it's a root usecase, we might need a different approach or just let it live.
    // However, for clean architecture, we usually want to stop this if no one is using it.
    // For now, let's keep it simple.
  }

  // Computed properties
  filteredEvents = computed(() => {
    let result = this.allEvents();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory()) {
      result = result.filter(event => event.category === this.selectedCategory());
    }

    return result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  });

  totalEvents = computed(() => this.allEvents().length);
  
  upcomingThisMonth = computed(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.allEvents().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= monthEnd;
    }).length;
  });

  nextEvent = computed(() => {
    const now = new Date();
    const upcoming = this.allEvents()
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0]?.title || 'None';
  });

  uniqueCategories = computed(() => {
    const categories = new Set(this.allEvents().map(event => event.category));
    return categories.size;
  });

  async getEventById(id: string): Promise<TimeLimitedEvent> {
    const event = await firstValueFrom(this.adapter.getEventById(id));
    return {
      ...event,
      date: new Date(event.date)
    };
  }

  async loadEvents() {
    try {
      const events = await firstValueFrom(this.adapter.getAllEvents());
      const parsedEvents = events.map(event => ({
        ...event,
        date: new Date(event.date)
      }));
      this.allEvents.set(parsedEvents);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  }

  async createEvent(event: TimeLimitedEvent) {
    const saved = await firstValueFrom(this.adapter.createEvent(event));
    this.allEvents.set([...this.allEvents(), { ...saved, date: new Date(saved.date) }]);
    return saved;
  }

  async updateEvent(id: string, event: TimeLimitedEvent) {
    const saved = await firstValueFrom(this.adapter.updateEvent(id, event));
    const events = [...this.allEvents()];
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...saved, date: new Date(saved.date) };
      this.allEvents.set(events);
    }
    return saved;
  }

  async deleteEvent(id: string) {
    await firstValueFrom(this.adapter.deleteEvent(id));
    this.allEvents.set(this.allEvents().filter(e => e.id !== id));
  }

  calculateTimeUntil(date: Date) {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = eventDate.getTime() - now.getTime();

    if (diffMs < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }
}
