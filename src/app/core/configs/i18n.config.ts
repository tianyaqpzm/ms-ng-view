import { HttpClient } from '@angular/common/http';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { APP_INITIALIZER } from '@angular/core';
import { lastValueFrom } from 'rxjs';

// Initializer to set default language
export function appInitializerFactory(translate: TranslateService) {
  return () => {
    const savedLang = localStorage.getItem('lang') || 'zh';
    translate.addLangs(['zh', 'en']);
    translate.setDefaultLang('zh');
    return lastValueFrom(translate.use(savedLang));
  };
}

export const provideI18n = () => [
  provideTranslateService({
    loader: provideTranslateHttpLoader({
      prefix: './i18n/',
      suffix: '.json'
    })
  }),
  {
    provide: APP_INITIALIZER,
    useFactory: appInitializerFactory,
    deps: [TranslateService],
    multi: true
  }
];
