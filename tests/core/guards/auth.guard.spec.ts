import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '@/src/app/core/services/auth.service';
import { authGuard } from '@/src/app/core/guards/auth.guard';
import { environment } from '@/environments/environment';

describe('authGuard (TA-03)', () => {
  let authService: AuthService;
  let router: Router;
  let mockDocument: any;

  beforeEach(() => {
    mockDocument = {
      location: {
        href: 'http://localhost/chat',
        assign: jest.fn()
      }
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: DOCUMENT,
          useValue: mockDocument
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        }
      ]
    });

    authService = TestBed.inject(AuthService);
    jest.spyOn(AuthService.prototype, 'extractTokenFromUrl').mockImplementation(() => null);
    jest.spyOn(AuthService.prototype, 'hasToken').mockReturnValue(false);
    router = TestBed.inject(Router);
    
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be a function (TA-03)', () => {
    expect(typeof authGuard).toBe('function');
  });

  it('should return true if token exists', () => {
    jest.spyOn(AuthService.prototype, 'hasToken').mockReturnValue(true);
    
    // @ts-ignore
    const result = TestBed.runInInjectionContext(() => authGuard({}, {}));
    
    expect(result).toBe(true);
    expect(authService.extractTokenFromUrl).toHaveBeenCalled();
  });

  it('should redirect to login and return false if no token', () => {
    jest.spyOn(AuthService.prototype, 'hasToken').mockReturnValue(false);
    
    // @ts-ignore
    const result = TestBed.runInInjectionContext(() => authGuard({}, {}));
    
    expect(result).toBe(false);
    expect(mockDocument.location.assign).toHaveBeenCalled();
    const callUrl = mockDocument.location.assign.mock.calls[0][0];
    expect(callUrl).toContain(environment.VITE_GATEWAY_URL);
    expect(callUrl).toContain('casdoor');
    expect(callUrl).toContain(encodeURIComponent('http://localhost/chat'));
  });
});
