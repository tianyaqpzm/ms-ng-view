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
   * 兼容 ?token=xxx 和 #/.../?token=xxx
   */
  extractTokenFromUrl(): string | null {
    // 1. 先尝试从标准的 search params 中获取
    let urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    // 2. 如果没拿到，尝试从 hash 后的参数里拿 (针对 HashLocationStrategy)
    if (!token && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      urlParams = new URLSearchParams(hashQuery);
      token = urlParams.get('token');
    }

    if (token) {
      console.log('【AuthService】Extracted token from URL:', token.substring(0, 10) + '...');
      this.saveToken(token);
      
      // 清理 URL 中的 token 参数，保持美观且安全
      // 需要同时处理 search 和 hash 中的 token
      let search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        params.delete('token');
        search = params.toString() ? '?' + params.toString() : '';
      }

      let hash = window.location.hash;
      if (hash && hash.includes('token=')) {
        const [path, query] = hash.split('?');
        if (query) {
          const params = new URLSearchParams(query);
          params.delete('token');
          const newQuery = params.toString();
          hash = path + (newQuery ? '?' + newQuery : '');
        }
      }

      const newUrl = window.location.pathname + search + hash;
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
