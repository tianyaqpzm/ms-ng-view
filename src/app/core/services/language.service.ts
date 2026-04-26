import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<string>(localStorage.getItem('lang') || 'zh');

  constructor(private translate: TranslateService) {}

  toggleLanguage() {
    const newLang = this.currentLang() === 'zh' ? 'en' : 'zh';
    this.setLanguage(newLang);
  }

  setLanguage(lang: string) {
    this.translate.use(lang).subscribe(() => {
      this.currentLang.set(lang);
      localStorage.setItem('lang', lang);
    });
  }

  isChinese() {
    return this.currentLang() === 'zh';
  }
}
