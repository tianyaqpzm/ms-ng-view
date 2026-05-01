import { ChangeDetectionStrategy, Component, OnInit, signal, inject, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '@/environments/environment';
import { URLConfig } from '@/app/core/constants/url.config';
import { ThemeService } from '../../../core/services/theme.service';
import { UserService } from '../../../core/services/user.service';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

@Component({
    selector: 'ms-header',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
        MatDividerModule,
        TranslateModule,
        MatDialogModule
    ],
    templateUrl: './ms-header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MsHeaderComponent implements OnInit {
    private themeService = inject(ThemeService);
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private languageService = inject(LanguageService);
    private dialog = inject(MatDialog);

    /** 外部控制显示隐藏 */
    visible = input<boolean>(true);

    /** 黑名单：匹配则隐藏 */
    blackList = input<string[]>([]);

    protected currentUser = computed(() => this.userService.currentUser());
    protected isDarkMode = computed(() => this.themeService.isDarkMode());
    protected currentLang = computed(() => this.languageService.currentLang());
    
    /** 当前路由状态 */
    protected currentUrl = signal('');
    protected showSidebarToggle = computed(() => this.currentUrl().includes('/chat'));

    /** 综合判断是否显示 */
    protected shouldShow = computed(() => {
        const isVisible = this.visible();
        const url = this.currentUrl();
        const inBlackList = this.blackList().some(pattern => url.includes(pattern));
        
        return isVisible && !inBlackList;
    });

    private sidebarService = inject(SidebarService);
    
    protected toggleSidebar() {
        this.sidebarService.toggle();
    }

    protected readonly document = document;

    ngOnInit() {
        // 初始路由
        this.currentUrl.set(this.router.url);
        // 监听路由变化
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
            this.currentUrl.set(e.urlAfterRedirects || e.url);
        });
    }

    protected toggleTheme() {
        this.themeService.toggleTheme();
    }

    protected toggleLanguage() {
        this.languageService.toggleLanguage();
    }

    protected setLanguage(lang: string) {
        this.languageService.setLanguage(lang);
    }

    /**
     * 打开设置对话框
     */
    protected openSettings() {
        this.dialog.open(SettingsDialogComponent, {
            width: '400px',
            panelClass: ['custom-dialog-container', 'animate-fade-in-up']
        });
    }

    /**
     * 跳转至外部账号中心
     */
    protected openAccountManagement() {
        window.open(`${environment.VITE_CASDOOR_URL}${URLConfig.EXTERNAL.CASDOOR_ACCOUNT}`, '_blank');
    }

    /**
     * 执行退出登录
     */
    protected logout() {
        this.authService.logout();
    }
}
