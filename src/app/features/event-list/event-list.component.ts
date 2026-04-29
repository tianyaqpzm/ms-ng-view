import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { EventUseCase } from '../../core/use-cases/event/event.usecase';
import { TimeLimitedEvent } from '../../core/domain/event/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent {
  protected useCase = inject(EventUseCase);

  filteredEvents = this.useCase.filteredEvents;

  selectCategory(category: string | null) {
    this.useCase.selectedCategory.set(category);
  }

  calculateTimeUntil(date: Date) {
    return this.useCase.calculateTimeUntil(date);
  }

  getBackgroundStyle(event: TimeLimitedEvent): any {
    if (event.appearance) {
      if (event.appearance.type === 'image') {
        return {
          'background-image': `url(${event.appearance.value})`,
          'background-size': 'cover',
          'background-position': 'center'
        };
      } else {
        return {
          'background-color': event.appearance.value
        };
      }
    }
    return {
      'background-image': "url('/images/backgrounds/customize-bg1.jpg')",
      'background-size': 'cover',
      'background-position': 'center'
    };
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', options);
  }
}