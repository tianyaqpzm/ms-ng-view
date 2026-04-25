import { environment } from '@/environments/environment';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const baseUrl = environment.VITE_API_URL;

    // 1. 获取本地 Token
    const token = authService.getToken();

    // 2. 克隆请求，注入 BaseURL 并添加 Authorization Header
    let apiReq = req;
    const headers: { [key: string]: string } = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!req.url.startsWith('http') && !req.url.startsWith('/assets')) {
        apiReq = req.clone({
            url: `${baseUrl}${req.url}`,
            setHeaders: headers
        });
    } else {
        apiReq = req.clone({
            setHeaders: headers
        });
    }

    // 3. 继续请求链并统一拦截响应错误 (401 身份自动跳转)
    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // 🔥【锁机制】防止并发请求导致多次重定向
                if (authService.isRedirecting) {
                    return EMPTY; // 直接中断，不做任何处理
                }
                authService.isRedirecting = true;

                // 清除本地失效 Token
                authService.removeToken();

                const currentUrl = encodeURIComponent(window.location.href);
                if (error.error && error.error.url) {
                    const authBaseUrl = environment.VITE_GATEWAY_URL;
                    window.location.href = authBaseUrl + error.error.url + "?redirect=" + currentUrl;
                } else {
                    // 兜底跳转
                    const authBaseUrl = environment.VITE_GATEWAY_URL;
                    window.location.href = `${authBaseUrl}/oauth2/authorization/casdoor?redirect=${currentUrl}`;
                }
            }
            return throwError(() => error);
        })
    );
};