import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal(false);

    constructor(
        @Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            const isDark = localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
            this.applyTheme(isDark);
        }
    }

    toggleTheme() {
        this.applyTheme(!this.isDarkMode());
    }

    private applyTheme(isDark: boolean) {
        this.isDarkMode.set(isDark);
        if (isDark) {
            this.document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            this.document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }
}
