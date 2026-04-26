import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatDividerModule,
    TranslateModule
  ],
  template: `
    <div class="p-6 dark:bg-[#1e1f20] dark:text-[#e3e3e3] min-w-[320px]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-medium">{{ 'SETTINGS_DIALOG.TITLE' | translate }}</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="space-y-6">
        <!-- Appearance section -->
        <section>
          <h3 class="text-sm font-medium text-gray-500 dark:text-[#8e918f] mb-3 uppercase tracking-wider">{{ 'SETTINGS_DIALOG.APPEARANCE' | translate }}</h3>
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2a2b2d]">
            <div class="flex items-center gap-3">
              <mat-icon>{{ isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
              <span>{{ 'SETTINGS_DIALOG.DARK_MODE' | translate }}</span>
            </div>
            <mat-slide-toggle [checked]="isDarkMode()" (change)="toggleTheme()"></mat-slide-toggle>
          </div>
        </section>

        <!-- Interaction section -->
        <section>
          <h3 class="text-sm font-medium text-gray-500 dark:text-[#8e918f] mb-3 uppercase tracking-wider">{{ 'SETTINGS_DIALOG.INTERACTION' | translate }}</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2a2b2d]">
              <span>{{ 'SETTINGS_DIALOG.ENTER_TO_SEND' | translate }}</span>
              <mat-slide-toggle [checked]="enterToSend()" (change)="enterToSend.set($any($event).checked)"></mat-slide-toggle>
            </div>
            <p class="px-3 text-xs text-secondary italic">{{ 'SETTINGS_DIALOG.ENTER_TO_SEND_HINT' | translate }}</p>
          </div>
        </section>

        <!-- AI section -->
        <section>
          <h3 class="text-sm font-medium text-gray-500 dark:text-[#8e918f] mb-3 uppercase tracking-wider">{{ 'SETTINGS_DIALOG.AI_PREFERENCE' | translate }}</h3>
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2a2b2d]">
            <span>{{ 'SETTINGS_DIALOG.STREAM_ANIMATION' | translate }}</span>
            <mat-slide-toggle [checked]="true"></mat-slide-toggle>
          </div>
        </section>
      </div>

      <div class="mt-8 flex justify-end">
        <button mat-flat-button color="primary" class="!px-6 !rounded-full" (click)="dialogRef.close()">{{ 'SETTINGS_DIALOG.DONE' | translate }}</button>
      </div>
    </div>
  `
})
export class SettingsDialogComponent {
  // 模拟持久化逻辑，实际应用中可以存入 LocalStorage 或后台
  protected enterToSend = signal(true);
  protected get isDarkMode() { return this.themeService.isDarkMode; }

  constructor(
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    private themeService: ThemeService
  ) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
