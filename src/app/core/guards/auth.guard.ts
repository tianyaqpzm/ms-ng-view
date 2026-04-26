import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '@/environments/environment';

/**
 * 路由守卫：校验本地 Token 是否存在
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const document = inject(DOCUMENT);

  // 1. 优先从 URL 尝试捞取一次 (防止 Init 没执行到的极端情况)
  authService.extractTokenFromUrl();

  // 2. 检查本地是否有 Token
  if (authService.hasToken()) {
    return true;
  }

  // 3. 如果没 Token，原地拦截，跳转到网关登录
  const currentUrl = encodeURIComponent(document.location.href);
  const authBaseUrl = environment.VITE_GATEWAY_URL;
  
  // 构造跳转链接
  // 注意：这里需要确保后端配合，如果未授权访问直接跳转到 Casdoor
  const loginUrl = `${authBaseUrl}/oauth2/authorization/casdoor?redirect=${currentUrl}`;
  
  document.location.assign(loginUrl);
  return false;
};
