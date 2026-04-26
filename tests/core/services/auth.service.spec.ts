import { TestBed } from '@angular/core/testing';
import { AuthService } from '@/src/app/core/services/auth.service';

describe('AuthService (TAS-01 ~ TAS-04)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    // 每次测试前清理 localStorage
    localStorage.clear();
  });

  it('should be created (TA-01)', () => {
    expect(service).toBeTruthy();
  });

  it('saveToken should store token and update isLoggedIn (TAS-01)', () => {
    const token = 'test-token';
    service.saveToken(token);
    expect(localStorage.getItem('jwt_token')).toBe(token);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('removeToken should clear localStorage and update isLoggedIn (TAS-02)', () => {
    localStorage.setItem('jwt_token', 'old-token');
    service.removeToken();
    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('hasToken should correctly validate token existence (TAS-03)', () => {
    expect(service.hasToken()).toBe(false);
    
    localStorage.setItem('jwt_token', 'valid');
    expect(service.hasToken()).toBe(true);
    
    localStorage.setItem('jwt_token', 'undefined');
    expect(service.hasToken()).toBe(false);
    
    localStorage.setItem('jwt_token', 'null');
    expect(service.hasToken()).toBe(false);
  });

  it('extractTokenFromUrl should extract and cleanup (TAS-04)', () => {
    // 模拟 URL 参数
    const mockToken = 'url-token';
    
    const spyGet = jest.spyOn(URLSearchParams.prototype, 'get').mockImplementation((name) => {
        if (name === 'token') return mockToken;
        return null;
    });
    
    const spyReplace = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    
    const result = service.extractTokenFromUrl();
    
    expect(result).toBe(mockToken);
    expect(localStorage.getItem('jwt_token')).toBe(mockToken);
    expect(spyReplace).toHaveBeenCalled();
    
    spyGet.mockRestore();
    spyReplace.mockRestore();
  });
});
