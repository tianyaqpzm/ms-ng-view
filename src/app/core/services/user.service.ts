import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(private http: HttpClient) {}

    async getCurrentUser(): Promise<UserProfile> {
        try {
            return await firstValueFrom(
                this.http.get<UserProfile>('/rest/dark/v1/user/me')
            );
        } catch (e) {
            console.error('Failed to get current user info', e);
            // Return fallback mock user if not logged in / testing
            return {
                id: 'unknown-user',
                name: 'Guest User',
                avatar: ''
            };
        }
    }
}
