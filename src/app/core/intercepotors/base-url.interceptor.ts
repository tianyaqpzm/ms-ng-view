import { environment } from '@/environments/environment';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
    // 0. 我们现在采用 HttpOnly Cookie 方案，不再从 URL 提取 Token
    // (地址栏不会再带有 ?token= 了，因此移除本地缓存逻辑)

    // 1. 获取 Vite 环境变量 (注意：需要在 vite-env.d.ts 定义类型，否则 TS 会报错)
    const baseUrl = environment.VITE_API_URL;

    // 2. 无需手动向 header 塞 Token，由 HttpOnly Cookie 自动携带

    // 3. 判断逻辑：追加 withCredentials 以携带跨域 Cookie
    let apiReq = req;
    if (!req.url.startsWith('http') && !req.url.startsWith('/assets')) {
        apiReq = req.clone({
            url: `${baseUrl}${req.url}`,
            withCredentials: true  // 🔥 核心：允许发送 Cookie
        });
    } else if (req.url.startsWith('http')) {
        // 全路径请求 (例如发送给后端的)
        apiReq = req.clone({
            withCredentials: true
        });
    }

    // 4. 继续请求链并统一拦截响应错误 (401 身份自动跳转)
    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // 如果是 401，HttpOnly Cookie 会由后端在认证时自动刷新或覆盖
                // 如果后端返回了包含 url 的 JSON，说明需要重定向到登录页
                const currentUrl = encodeURIComponent(window.location.href);
                if (error.error && error.error.url) {
                    // 动态获取网关地址。
                    // 优先读取你定义的环境变量 (如在 .env.production 里定义的 VITE_GATEWAY_URL)
                    const authBaseUrl = environment.VITE_GATEWAY_URL;
                    window.location.href = authBaseUrl + error.error.url + "?redirect=" + currentUrl;
                }
            }
            return throwError(() => error);
        })
    );
};