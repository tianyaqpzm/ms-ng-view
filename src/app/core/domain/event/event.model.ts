import { Observable } from 'rxjs';

export interface TimeLimitedEvent {
  id?: string;
  title: string;
  category: string;
  date: Date;
  time: string;
  description?: string;
  repeatYearly: boolean;
  appearance?: {
    type: string;
    value: string;
  };
  createdAt?: Date;
}

export interface EventRepository {
  createEvent(event: TimeLimitedEvent): Observable<TimeLimitedEvent>;
  getAllEvents(): Observable<TimeLimitedEvent[]>;
  getEventById(id: string): Observable<TimeLimitedEvent>;
  updateEvent(id: string, event: TimeLimitedEvent): Observable<TimeLimitedEvent>;
  deleteEvent(id: string): Observable<void>;
}
