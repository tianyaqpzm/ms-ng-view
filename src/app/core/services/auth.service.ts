import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  
  // 用于拦截器防并发重定向的锁
  public isRedirecting = false;
  
  // 响应式状态：是否已登录
  private _isLoggedIn = signal<boolean>(this.hasToken());
  public isLoggedIn = this._isLoggedIn.asReadonly();

  constructor() { }

  /**
   * 保存 Token 到本地
   */
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this._isLoggedIn.set(true);
  }

  /**
   * 获取本地 Token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 移除 Token
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._isLoggedIn.set(false);
  }

  /**
   * 判断是否存在 Token
   */
  hasToken(): boolean {
    const token = this.getToken();
    return !!token && token !== 'undefined' && token !== 'null';
  }

  /**
   * 从当前 URL 中提取 Token (通常在重定向回来后调用)
   */
  extractTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.saveToken(token);
      // 清理 URL 中的 token 参数，保持美观且安全
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      return token;
    }
    return null;
  }
  /**
   * 安全登出
   */
  logout(): void {
    // 1. 清理本地数据
    this.removeToken();
    
    // 2. 跳转到网关的退出接口
    // 网关会负责清除后端会话并重定向回登录页
    window.location.href = '/logout';
  }
}
