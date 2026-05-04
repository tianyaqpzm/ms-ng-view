import { Injectable, signal } from '@angular/core';
import { environment } from '@/environments/environment';

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
   * 保存 Token 到本地并更新登录状态。
   * @param token - 待保存的 JWT Token。
   */
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this._isLoggedIn.set(true);
  }

  /**
   * 从本地持久化存储中获取 Token。
   * @returns Token 字符串或 null。
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 移除本地 Token 并更新登录状态为未登录。
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._isLoggedIn.set(false);
  }

  /**
   * 快速判断当前是否有可用的 Token 凭证。
   * @returns 布尔值。
   */
  hasToken(): boolean {
    const token = this.getToken();
    return !!token && token !== 'undefined' && token !== 'null';
  }

  /**
   * 从当前浏览器 URL 中提取 Token。
   * 支持标准 Search 参数及 Hash 模式下的参数提取。
   * 提取成功后会自动保存 Token 并清理 URL 中的敏感参数。
   * @returns 提取到的 Token 或 null。
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
   * 执行安全登出操作。
   * 清理本地凭证并重定向至系统的统一登出端点。
   */
  logout(): void {
    // 1. 清理本地数据
    this.removeToken();
    
    // 2. 跳转到网关的退出接口
    // 网关会负责清除后端会话并重定向回登录页
    window.location.href = `${environment.VITE_GATEWAY_URL}/logout`;
  }
}
