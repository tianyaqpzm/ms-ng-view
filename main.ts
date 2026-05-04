import { APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { AppComponent } from './src/app.component';
import { routes } from './src/app.routes';
import { apiUrlInterceptor } from './src/app/core/interceptors/base-url.interceptor';
import { UserService } from './src/app/core/services/user.service';
import { provideI18n } from './src/app/core/configs/i18n.config';
import { provideMarkdown } from 'ngx-markdown';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideZonelessChangeDetection(),
    provideAnimations(),
    // 国际化配置
    ...provideI18n(),
    // 核心配置：HTTP 客户端与拦截器
    provideHttpClient(
      withFetch(),
      withInterceptors([apiUrlInterceptor])
    ),
    provideMarkdown(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' }
    },
    // APP 初始化逻辑：阻塞加载直到获取用户信息
    {
      provide: APP_INITIALIZER,
      useFactory: (userService: UserService) => () => userService.initialize(),
      deps: [UserService],
      multi: true
    }
  ]
}).catch((err) => console.error(err));

