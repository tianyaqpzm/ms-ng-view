import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
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
    MatDividerModule
  ],
  template: `
    <div class="p-6 dark:bg-[#1e1f20] dark:text-[#e3e3e3] min-w-[320px]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-medium">个人偏好设置</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="space-y-6">
        <!-- Appearance section -->
        <section>
          <h3 class="text-sm font-medium text-gray-500 dark:text-[#8e918f] mb-3 uppercase tracking-wider">外观界面</h3>
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2a2b2d]">
            <div class="flex items-center gap-3">
              <mat-icon>{{ isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
              <span>深色模式</span>
            </div>
            <mat-slide-toggle [checked]="isDarkMode()" (change)="toggleTheme()"></mat-slide-toggle>
          </div>
        </section>

        <!-- Interaction section -->
        <section>
          <h3 class="text-sm font-medium text-gray-500 dark:text-[#8e918f] mb-3 uppercase tracking-wider">交互体验</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2a2b2d]">
              <span>回车键发送消息</span>
              <mat-slide-toggle [checked]="enterToSend()" (change)="enterToSend.set($any($event).checked)"></mat-slide-toggle>
            </div>
            <p class="px-3 text-xs text-secondary italic">开启后，按 Enter 发送，Ctrl+Enter 换行；关闭后则相反。</p>
          </div>
        </section>

        <!-- AI section -->
        <section>
          <h3 class="text-sm font-medium text-gray-500 dark:text-[#8e918f] mb-3 uppercase tracking-wider">AI 偏好</h3>
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2a2b2d]">
            <span>开启流式输出动画</span>
            <mat-slide-toggle [checked]="true"></mat-slide-toggle>
          </div>
        </section>
      </div>

      <div class="mt-8 flex justify-end">
        <button mat-flat-button color="primary" class="!px-6 !rounded-full" (click)="dialogRef.close()">完成</button>
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
