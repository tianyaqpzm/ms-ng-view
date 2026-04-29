import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { TimerService } from '../../core/services/timer.service';
import { TimeLimitedEvent } from '../../core/domain/event/event.model';
import { EventUseCase } from '../../core/use-cases/event/event.usecase';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEventComponent {
  private useCase = inject(EventUseCase);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private timerService = inject(TimerService);

  constructor() {
    effect(() => {
      this.updatePreviewCountdown();
    });
  }

  // Form State
  title = signal("Sarah's Birthday Party");
  date = signal<Date | null>(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000));
  time = signal("18:00");
  description = signal('');
  repeatYearly = signal(true);
  selectedCategory = signal('Birthday');
  customCategoryName = signal('');
  appearanceType = signal<'image' | 'color'>('image');
  selectedImage = signal('/images/backgrounds/birthday-celebration.jpg');
  selectedColor = signal('#2b6cee');

  previewCountdown = signal({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  categories = signal([
    'Birthday', 'Anniversary', 'Holiday', 'Vacation', 'Concert', 'Graduation', 'Retirement'
  ]);

  images = [
    '/images/backgrounds/customize-bg1.jpg',
    '/images/backgrounds/customize-bg2.jpg',
    '/images/backgrounds/customize-bg3.jpg',
    '/images/backgrounds/birthday-celebration.jpg'
  ];

  colors = ['#2b6cee', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#1e293b', '#000000'];

  displayCategory = computed(() => {
    if (this.selectedCategory() === 'Custom') {
      return this.customCategoryName() || 'Custom Event';
    }
    return this.selectedCategory();
  });

  onTitleChange(value: string) { this.title.set(value); }
  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const selectedDate = new Date(input.value);
      if (!isNaN(selectedDate.getTime())) this.date.set(selectedDate);
    }
  }
  onTimeChange(value: string) { this.time.set(value); }
  onDescriptionChange(value: string) { this.description.set(value); }
  onCategoryChange(value: string) { this.selectedCategory.set(value); }
  setAppearanceType(type: 'image' | 'color') { this.appearanceType.set(type); }
  selectImage(img: string) { this.selectedImage.set(img); this.appearanceType.set('image'); }
  selectColor(color: string) { this.selectedColor.set(color); this.appearanceType.set('color'); }
  toggleRepeatYearly(checked: boolean) { this.repeatYearly.set(checked); }

  private updatePreviewCountdown(): void {
    const targetDate = this.getTargetDateTime();
    if (targetDate) {
      this.previewCountdown.set(this.timerService.getTimeParts(targetDate));
    } else {
      this.previewCountdown.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
    }
  }

  private getTargetDateTime(): Date | null {
    if (!this.date()) return null;
    const dateValue = new Date(this.date()!);
    const [hours, minutes] = this.time().split(':').map(Number);
    dateValue.setHours(hours, minutes, 0, 0);
    return dateValue;
  }

  getTimeFromDate(): string {
    if (!this.date()) return this.time();
    const date = this.date()!;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  isFormValid(): boolean {
    const hasTitle = !!this.title()?.trim();
    const hasDate = !!this.date();
    const hasTime = !!this.time();
    const hasCategory = !!this.selectedCategory() && (this.selectedCategory() !== 'Custom' || !!this.customCategoryName()?.trim());
    const target = this.getTargetDateTime();
    const isFuture = target ? target.getTime() > Date.now() : false;
    return hasTitle && hasDate && hasTime && hasCategory && isFuture;
  }

  getValidationError(): string {
    if (!this.title()?.trim()) return 'Title is required';
    if (!this.date()) return 'Date is required';
    if (!this.time()) return 'Time is required';
    if (!this.selectedCategory()) return 'Category is required';
    if (this.selectedCategory() === 'Custom' && !this.customCategoryName()?.trim()) return 'Custom category name is required';
    const target = this.getTargetDateTime();
    if (target && target.getTime() <= Date.now()) return 'Date and time must be in the future';
    return '';
  }

  async saveEvent() {
    if (!this.isFormValid()) {
      this.snackBar.open(this.getValidationError() || 'Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    const newEvent: TimeLimitedEvent = {
      title: this.title().trim(),
      category: this.selectedCategory() === 'Custom' ? this.customCategoryName().trim() : this.selectedCategory(),
      date: this.date()!,
      time: this.time(),
      description: this.description().trim(),
      repeatYearly: this.repeatYearly(),
      appearance: {
        type: this.appearanceType(),
        value: this.appearanceType() === 'image' ? this.selectedImage() : this.selectedColor()
      },
      createdAt: new Date()
    };

    try {
      await this.useCase.createEvent(newEvent);
      this.snackBar.open('🎉 Event created successfully!', 'Close', { duration: 3000, verticalPosition: 'top' });
      setTimeout(() => this.router.navigate(['/landing/dashboard']), 500);
    } catch (err) {
      console.error('Error saving event:', err);
      this.snackBar.open('Failed to create event. Please try again.', 'Close', { duration: 3000 });
    }
  }

  scrollToPreview() {
    document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
