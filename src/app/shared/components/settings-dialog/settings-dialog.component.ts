import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * 设置对话框。
 * 提供主题切换、输入偏好等系统设置。
 */
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
  templateUrl: './settings-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsDialogComponent {
  /** 模拟持久化逻辑，发送按键设置 */
  protected enterToSend = signal(true);
  
  /** 是否为深色模式 */
  protected isDarkMode = computed(() => this.themeService.isDarkMode());

  /**
   * 构造函数。
   * @param dialogRef - 对话框引用。
   * @param themeService - 主题服务。
   */
  constructor(
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    private themeService: ThemeService
  ) {}

  /**
   * 切换主题模式。
   */
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
