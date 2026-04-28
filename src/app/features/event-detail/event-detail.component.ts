import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeLimitedEvent } from '../../core/domain/event/event.model';
import { EventUseCase } from '../../core/use-cases/event/event.usecase';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private useCase = inject(EventUseCase);

  event = signal<TimeLimitedEvent | null>(null);
  countdown = signal({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  isFavorite = signal(false);

  constructor() {
    effect(() => {
      const interval = setInterval(() => {
        this.updateCountdown();
      }, 1000);
      return () => clearInterval(interval);
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const eventId = params['id'];
      if (eventId) {
        this.loadEvent(eventId);
      } else {
        this.router.navigate(['/landing/dashboard']);
      }
    });
  }

  private async loadEvent(eventId: string) {
    try {
      const event = await this.useCase.getEventById(eventId);
      this.event.set(event);
      this.updateCountdown();
    } catch (err) {
      console.error('Failed to load event:', err);
      this.snackBar.open('Failed to load event', 'Close', { duration: 3000 });
      this.router.navigate(['/landing/dashboard']);
    }
  }

  private updateCountdown(): void {
    const event = this.event();
    if (event && event.date) {
      const targetDate = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        targetDate.setHours(hours, minutes, 0, 0);
      }
      
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        this.countdown.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      this.countdown.set({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0')
      });
    }
  }

  getBackgroundStyle(): any {
    const event = this.event();
    if (!event) return {};

    if (event.appearance) {
      if (event.appearance.type === 'image') {
        return {
          'background-image': `url(${event.appearance.value})`,
          'background-size': 'cover',
          'background-position': 'center'
        };
      } else {
        return { 'background-color': event.appearance.value };
      }
    }

    return {
      'background-image': "url('/images/backgrounds/default-event-bg.jpg')",
      'background-size': 'cover',
      'background-position': 'center'
    };
  }

  goBack(): void {
    this.router.navigate(['/landing/dashboard']);
  }

  editEvent(): void {
    this.router.navigate(['/landing/dashboard']);
  }

  shareEvent(): void {
    const event = this.event();
    if (!event) return;

    const shareText = `Check out this event: ${event.title} on ${new Date(event.date).toLocaleDateString()}`;

    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: shareText,
        url: window.location.href
      }).catch(() => this.copyToClipboard());
    } else {
      this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    const event = this.event();
    if (!event) return;

    const shareText = `${event.title} - ${new Date(event.date).toLocaleDateString()}`;

    navigator.clipboard.writeText(shareText).then(() => {
      this.snackBar.open('Event details copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  async deleteEvent() {
    const event = this.event();
    if (!event || !event.id) return;

    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        await this.useCase.deleteEvent(event.id);
        this.snackBar.open('Event deleted successfully', 'Close', { duration: 2000 });
        this.router.navigate(['/landing/dashboard']);
      } catch (err) {
        console.error('Failed to delete event:', err);
        this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
      }
    }
  }
}