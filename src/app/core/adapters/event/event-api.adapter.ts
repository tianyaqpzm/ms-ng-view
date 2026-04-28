import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventRepository, TimeLimitedEvent } from '../../domain/event/event.model';
import { URLConfig } from '../../constants/url.config';

@Injectable({
  providedIn: 'root'
})
export class EventApiAdapter implements EventRepository {
  private http = inject(HttpClient);
  private apiUrl = URLConfig.EVENTS.BASE;

  createEvent(event: TimeLimitedEvent): Observable<TimeLimitedEvent> {
    return this.http.post<TimeLimitedEvent>(this.apiUrl, event);
  }

  getAllEvents(): Observable<TimeLimitedEvent[]> {
    return this.http.get<TimeLimitedEvent[]>(this.apiUrl);
  }

  getEventById(id: string): Observable<TimeLimitedEvent> {
    return this.http.get<TimeLimitedEvent>(`${this.apiUrl}/${id}`);
  }

  updateEvent(id: string, event: TimeLimitedEvent): Observable<TimeLimitedEvent> {
    return this.http.put<TimeLimitedEvent>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
