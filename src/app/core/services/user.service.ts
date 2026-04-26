import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    public currentUser = signal<UserProfile | null>(null);

    constructor(private http: HttpClient, private authService: AuthService) {}

    /**
     * APP_INITIALIZER 调用的初始化方法
     */
    async initialize(): Promise<void> {
        // 1. 如果 URL 里携带了 token，先提取并保存
        const extracted = this.authService.extractTokenFromUrl();
        if (extracted) {
            console.log('【UserService】Token extracted during initialization');
        }

        // 2. 如果本地有 token，尝试获取用户信息
        if (this.authService.hasToken()) {
            try {
                const user = await this.getCurrentUser();
                this.currentUser.set(user);
            } catch (e) {
                console.error('Initial user fetch failed', e);
                // 如果获取失败（如 token 过期），清除 token
                this.authService.removeToken();
            }
        }
    }

    async getCurrentUser(): Promise<UserProfile> {
        return await firstValueFrom(
            this.http.get<UserProfile>('/rest/dark/v1/user/me')
        );
    }
}
