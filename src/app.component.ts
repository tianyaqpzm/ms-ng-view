import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './app/core/services/theme.service';
import { UserProfile, UserService } from './app/core/services/user.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
        MatDividerModule,
    ],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
    protected get currentUser() { return this.userService.currentUser(); }
    /** 当前路由是否为 chat 页面（chat 页面自带 profile UI，全局顶栏隐藏） */
    protected isChatRoute = signal(false);

    protected get isDarkMode() { return this.themeService.isDarkMode; }

    constructor(
        public themeService: ThemeService,
        private userService: UserService,
        private router: Router
    ) {}

    ngOnInit() {
        // 监听路由变化，判断是否在 chat 页
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
            this.isChatRoute.set((e.urlAfterRedirects as string).includes('/chat'));
        });
        // 初始判断（直接访问）
        this.isChatRoute.set(this.router.url.includes('/chat'));
    }

    protected toggleTheme() {
        this.themeService.toggleTheme();
    }

    protected readonly document = document;
}